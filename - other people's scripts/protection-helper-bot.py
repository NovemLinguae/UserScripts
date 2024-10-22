#!/usr/bin/env python3

"""
Protection Helper Bot - reprotect.py

This script retrieves and processes protection logs from a MediaWiki site to manage and restore
protection settings. It's designed to be run under supervisord or a similar process manager.

Functionality:
- Monitor the protection log for temporary higher protection levels and their expirations.
- After expiration, check the page protection status and restore the previous protection if needed.
- Log protection changes with the appropriate reason and attribution.

No reprotection action is taken in the following cases:
- The higher protection duration was PROTECTION_DURATION_THRESHOLD days or longer.
- The duration of the higher protection level extends beyond the prior protection's expiration.
- The protection level is the same as or lower than the previous level.
- There is a more recent protection action.
- Any of the most recent actions is a cascading protection.
- The protection would require differing edit and move expirations (not supported by pywikibot).
- Serious errors occur during the restoration process.

Non-standard dependencies:
- pywikibot: For interacting with MediaWiki.
"""

import logging
import os
import pywikibot
import random
import re
import sys
import time

from datetime import datetime, timedelta


# configuration
DAYS_TO_CHECK = timedelta(days=180) # number of days of logs to review
PROTECTION_DURATION_THRESHOLD = timedelta(days=90) # skip protections applied for longer than this
RECENT_INTERVAL = timedelta(days=180) # act on protections that have expired during this period


# timezone and logging
os.environ['TZ'] = 'UTC'
time.tzset()
logging.basicConfig(format='%(asctime)s | %(levelname)s | %(funcName)s | %(message)s',
                    datefmt='%Y-%m-%dT%H:%M:%S',
                    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO').upper(), logging.INFO))


def iso_to_timestamp(iso_string):
    """
    Convert an ISO 8601 date-time string to a UNIX timestamp.

    Parameters:
    iso_string (str): The ISO 8601 date-time string (e.g., '2025-03-02T05:30:26Z').

    Returns:
    float: The corresponding UNIX timestamp.
    """
    # Parse the ISO 8601 string into a datetime object
    dt = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))
    # Convert the datetime object to a UNIX timestamp
    return dt.timestamp()


class ProtectionLogs:
    """
    Class to handle retrieval and parsing of protection logs from a MediaWiki site.
    """

    def __init__(self, site):
        """
        Initialize the ProtectionLogs instance.

        Parameters:
        site (pywikibot.Site): The site from which to retrieve logs.
        """
        self.site = site
        self.next_fetch_time = datetime.now() - DAYS_TO_CHECK

    def all_logs(self):
        """
        Retrieve all protection logs within the configured date range.

        Yields:
        tuple: A tuple containing log data and details.
        """
        end = datetime.now()
        start = self.next_fetch_time
        self.next_fetch_time = end
        logging.info(f"query {start} to {end}")
        for log in self.site.logevents(logtype='protect', end=end, start=start, reverse=True):
            log_result = self.parse_log(log)
            if log_result:
                yield log_result
        return

    def page_logs(self, page=None, before=None):
        """
        Retrieve protection logs for a specific page.

        Parameters:
        page (str, optional): The page title to retrieve logs for.
        before (int, optional): Only retrieve logs with IDs less than this value.

        Yields:
        tuple: A tuple containing log data and details.
        """
        for log in self.site.logevents(logtype='protect', page=page):
            log_result = self.parse_log(log)

            # skip if not validated
            if not log_result:
                continue
            log_data, details = log_result

            # check logid and only yield if it's less than before
            if before is not None and log_data['logid'] >= before:
                continue  # skip log entries with a logid greater than or equal to the current one
            if log_data['action'] == 'move_prot':
                # switch to the old title and yield logs for it
                logging.debug(f"switching to old title: {details}")
                yield from self.page_logs(page=details, before=log_data['logid'])
            else:
                yield log_result

    def validate_log_data(self, log_data):
        """
        Validate the structure and types of log data.

        Parameters:
        log_data (dict): The log data to validate.

        Returns:
        bool: True if all checks pass, False otherwise.
        """
        required_keys = {
            'logid': int,
            'title': str,
            'action': str,
            'params': dict,
            'user': str,
            'comment': str
        }

        # check for missing or incorrect type for required keys
        for key, expected_type in required_keys.items():
            if key not in log_data:
                logging.error(f"missing {key} in log data: {log_data}")
                return False
            if not isinstance(log_data[key], expected_type):
                logging.error(f"incorrect type for {key} in log data: expected {expected_type}, got {type(log_data[key])}: {log_data}")
                return False

        return True

    def parse_log(self, log):
        """
        Process a log entry to extract and validate its details.

        Parameters:
        log (object): The log entry, expected to have a 'data' attribute.

        Returns:
        tuple: (log_data, details) if the log is valid.
        None: If the log is malformed, incomplete, or cannot be processed.

        Handles various log actions including 'unprotect', 'protect', and 'move_prot'. 
        Supports parsing different log formats and logs errors for malformed or incomplete logs.
        """
        try:
            # skip malformed or incomplete log entries
            log_data = getattr(log, 'data', None)
            if not log_data:
                logging.error(f"no data in log: {vars(log)}")
                return None
            if 'actionhidden' in log_data or 'commenthidden' in log_data:
                logging.debug(f"hidden log: {vars(log)}")
                return None
            # validate log_data
            if not self.validate_log_data(log_data):
                return None
        except Exception as e:
            logging.error(f"error processing log: {e}")
            return None

        # unprotection
        action = log_data['action']
        if action == 'unprotect':
            return log_data, None

        # check details and parse expiry
        params = log_data.get('params', None)
        if not params:
            # ancient log format, only parse if indefinite
            if action == 'protect' and isinstance(params, dict):
                comment = log_data.get('comment', '')
                m = re.search(r' \[(edit|move)=(\w+)\]$| \[edit=(\w+):move=(\w+)\]$', comment)
                if m:
                    if m.group(1):
                        details = [
                            {'type': m.group(1), 'level': m.group(2), 'expiry': float('inf')}
                        ]
                    else:
                        details = [
                            {'type': 'edit', 'level': m.group(3), 'expiry': float('inf')},
                            {'type': 'move', 'level': m.group(4), 'expiry': float('inf')}
                        ]
                    logging.debug(f"parsed ancient log: {details} | {vars(log)}")
                    return log_data, details
            logging.info(f"missing params: {vars(log)}")
            return None

        # moved protection settings
        if action == 'move_prot':
            oldtitle_title = params.get('oldtitle_title', None)
            if oldtitle_title:
                return log_data, oldtitle_title
            logging.error(f"move_prot missing oldtitle_title: {vars(log)}")
            return None

        # legacy or recent protection
        details = params.get('details', None)
        if not details:
            # legacy log format
            description = params.get('description', None)
            if description:
                try:
                    pattern = r'\[(?P<type>edit|move)=(?P<level>\w+)\] \((?P<expiry>expires[^\)]+\(UTC\)|indefinite)\)'
                    details = []

                    for match in re.finditer(pattern, description):
                        expiry = match.group('expiry')
                        if expiry == 'indefinite':
                            expiry = float('inf')
                        else:
                            expiry = datetime.strptime(expiry, 'expires %H:%M, %d %B %Y (UTC)').timestamp()
                        details.append({
                            'type': match.group('type'),
                            'level': match.group('level'),
                            'expiry': expiry
                        })
                    logging.debug(f"parsed legacy log: {log_data['logid']} | {log_data['title']} | {details} | {vars(log)}")
                    return log_data, details
                except Exception as e:
                    logging.error(f"error parsing legacy log: {e}")
                    return None

        # recent protection
        if not isinstance(details, list):
            logging.error(f"missing log details: {vars(log)}")
            return None

        for detail in details:
            detail_type = detail.get('type', None)
            detail_level = detail.get('level', None)
            detail_expiry = detail.get('expiry', None)

            if not detail_type or not detail_level or not detail_expiry:
                logging.error(f"incomplete log details: {vars(log)}")
                return None

            # get the expiration string and convert it
            if detail_expiry == 'infinite':
                detail['expiry'] = float('inf')
            else:
                try:
                    detail['expiry'] = iso_to_timestamp(detail_expiry)
                except Exception as e:
                    logging.error(f"error parsing expiry for {vars(log)}: {e}")
                    return None

        return log_data, details


class ProtectionManager:
    """
    Class to manage and restore protection settings based on logs.
    """

    def __init__(self, site):
        """
        Initialize the ProtectionManager instance.

        Parameters:
        site (pywikibot.Site): The site on which to manage protections.
        """
        self.site = site
        self.logs = ProtectionLogs(site)
        self.pages = {}

    def protection_level(self, level):
        """
        Map a protection level name to its integer representation.

        Parameters:
        level (str): The protection level name (e.g., 'autoconfirmed').

        Returns:
        int: The integer representation of the protection level.

        Notes:
        Verified for English Wikipedia only.
        """
        levels = {'autoconfirmed': 0, 'extendedconfirmed': 1, 'templateeditor': 2, 'sysop': 3}

        return levels.get(level, -1)

    def protection_expirations(self):
        """
        Process all protection logs and update the internal list of pages with active protections.

        This method processes each log entry, handles unprotection, move protection, and updates
        the list of pages with active protections based on their expiration timestamps.
        """
        count = 0
        for (log, details) in self.logs.all_logs():
            count += 1
            title = log['title']

            # unprotection
            if log['action'] == 'unprotect':
                if title in self.pages:
                    logging.debug(f"unprotected {title}")
                self.pages.pop(title, None)
                continue

            # moved protection settings
            if log['action'] == 'move_prot':
                if details in self.pages:
                    logging.debug(f"moved protection from {details} to {title}: {self.pages.get(details)}")
                    self.pages[title] = self.pages.pop(details)
                continue

            # protection
            try:
                # reasons to exclude an entire log entry from processing
                log_exclusions = set()
                # expirations to track
                filtered_details = []

                # process each protection in the log entry
                for detail in details:
                    # completely skip if there's an unsupported protection type
                    detail_type = detail.get('type', None)
                    if detail_type not in ['edit', 'move']:
                        log_exclusions.add(f"unsupported protection type: {detail_type}")
                        break

                    # only process non-infinite protections
                    detail_expiry = detail.get('expiry', None)
                    if detail_expiry == float('inf'):
                        continue

                    # skip stale expirations
                    if detail_expiry < (datetime.now() - RECENT_INTERVAL).timestamp():
                        logging.debug(f"stale expiration: {title} | {detail_expiry}")
                        continue

                    # only process high protection levels
                    detail_level = detail.get('level', None)
                    if detail_level in ['extendedconfirmed', 'templateeditor', 'sysop']:
                        filtered_details.append(detail)

                # skip entire log entry
                if log_exclusions:
                    continue
                # skip if there were too many protections in details
                if len(filtered_details) > 2:
                    logging.error(f"unexpected number of details for {log}: {len(filtered_details)}")
                    continue
                # store expirations
                if filtered_details:
                    self.pages[title] = (log['logid'], filtered_details)
            except Exception as e:
                logging.error(f"error processing log entry for {log}: {e}")

        print(f"total logs: {count}")
        print(f"expirations: {len(self.pages)}")
        #print(f"expirations: {self.pages}")

    def next_expired_protection(self):
        """
        Finds the page with the oldest expired protection.

        Scans through all pages to determine the earliest protection expiration timestamp.
        Logs a warning if there are multiple expiry timestamps for a page.

        Returns:
        str: Title of the page with the oldest expired protection, or None if no such page exists.
        """
        oldest_expiry = float('inf')
        oldest_page = None

        for title, (logid, protections) in self.pages.items():
            expiry_timestamps = set()
            for protection in protections:
                expiry = protection.get('expiry', None)

                if not expiry:
                    continue
                expiry_timestamps.add(expiry)
                # expire based on the edit timestamp if there are two different timestamps
                if expiry < oldest_expiry and expiry < time.time() and (not oldest_page or protection.get('type', None) == 'edit'):
                    oldest_expiry = expiry
                    oldest_page = title

            if len(expiry_timestamps) > 1:
                logging.debug(f"multiple expiry timestamps for {title}: {max(expiry_timestamps) - min(expiry_timestamps)} {protections}")

        logging.info(f"oldest: {oldest_page} {oldest_expiry} {self.pages.get(oldest_page)}")
        return oldest_page

    def follow_moves(self, current_page, previous_logid):
        """
        Tracks the page through subsequent moves based on log entries.

        Follows the page across moves to find its current location. Stops if no more moves are
        found or if the maximum number of loops is exceeded.

        Parameters:
        current_page (str): The current title of the page.
        previous_logid (int): The log ID of the last known move.

        Returns:
        str: Current title of the page after following moves, or None if no further moves are found.
        """
        original_page = current_page
        loop_count = 0
        max_loops = 100

        while True:
            # avoid looping forever
            loop_count += 1
            if loop_count > max_loops:
                raise RuntimeError(f"Exceeded maximum number of loops ({max_loops}) while trying to follow moves from {original_page}.")

            found_move = False
            for log in self.site.logevents(logtype='move', page=current_page, reverse=True):
                log_data = getattr(log, 'data', None)
                if not log_data or 'params' not in log_data:
                    logging.error(f"malformed move log entry: {vars(log)}")
                    return None

                logid = log_data.get('logid', None)
                if logid > previous_logid:
                    logging.debug(f"page {current_page} was moved after expired protection action {vars(log)}")
                    # verify if the move matches the expected comment and user
                    verify = self.verify_move(log_data)
                    if verify:
                        logging.debug(f"verified page {current_page} was moved after expired protection action {vars(log)}")
                        current_page = verify
                        previous_logid = logid
                        found_move = True
                        break

            if not found_move:
                if original_page == current_page:
                    return None
                else:
                    logging.debug(f"no further confirmed moves for page {current_page}")
                    return current_page

    def verify_move(self, move_log_data):
        """
        Verifies if a move log entry corresponds to a valid move.

        Checks if the move log entry matches with a protection log entry.
        Returns the target title if verified.

        Parameters:
        move_log_data (dict): The log data of the move.

        Returns:
        str: The target title of the move if verified, otherwise None.
        """
        logid = move_log_data.get('logid', '')
        comment = move_log_data.get('comment', '')
        user = move_log_data.get('user', '')
        target_title = move_log_data.get('params', {}).get('target_title', None)

        if not logid or not comment or not user or not target_title:
            logging.error(f"move log entry missing fields: {move_log_data}")
            return None

        for log in self.site.logevents(logtype='protect', page=target_title, reverse=True):
            protect_log_data = getattr(log, 'data', None)
            if not protect_log_data:
                return None
            protect_comment = protect_log_data.get('comment', '')
            protect_user = protect_log_data.get('user', '')
            protect_logid = protect_log_data.get('logid', None)
            protect_action = protect_log_data.get('action', None)
            logging.debug(f"move here {logid} {comment} {user} {target_title} | {protect_logid} {protect_comment} {protect_user} {protect_action}")
            if comment in protect_comment and user == protect_user and abs(protect_logid - logid) < 10 and protect_action == 'move_prot':
                logging.debug(f"verified move to {target_title} {abs(protect_logid - logid)}: {move_log_data} *** {protect_log_data}")
                return target_title

        return None

    def restore_protection(self, expired_title):
        """
        Restores protection for a page if expired protection can be restored.

        Attempts to restore the protection level of a page based on the logs and compares
        with previous protection details.

        Parameters:
        expired_title (str): The title of the page with expired protection.

        Returns:
        bool: True if protection restored, False otherwise.
        """
        expired_logid, protections = self.pages.pop(expired_title)
        page = pywikibot.Page(self.site, expired_title)

        try:
            move_result = self.follow_moves(expired_title, expired_logid)
            if move_result:
                logging.info(f"move result: {expired_title} | {move_result}")
        except Exception as e:
            logging.warning(f"error following moves for {expired_title}: {e}")

        edit_level = None
        edit_expiry = None
        move_level = None
        move_expiry = None
        previous_edit_level = None
        previous_edit_expiry = None
        previous_move_level = None
        previous_move_expiry = None

        found_expired_logid = False
        user = None

        for index, (log, details) in enumerate(self.logs.page_logs(page=page)):
            logid = log['logid']
            title = log['title']
            action = log['action']

            if logid == expired_logid:
                found_expired_logid = True

            # checking top two logs should be sufficient
            if index > 1:
                break
            logging.debug(f"log {index} | {logid} | {action} | {details}")

            try:
                if index == 0:
                    if logid != expired_logid:
                        logging.info(f"skipping due to more recent protection: {expired_title} | {protections}")
                        return False
                    if not details:
                        logging.error(f"skipping due to no details for expired protection: {expired_title} | {protections}")
                        return False
                    for detail in details:
                        detail_type = detail.get('type', None)
                        detail_level = detail.get('level', None)
                        detail_expiry = detail.get('expiry', None)
                        if detail_type == 'edit':
                            edit_level = detail_level
                            edit_expiry = detail_expiry
                        if detail_type == 'move':
                            move_level = detail_level
                            move_expiry = detail_expiry
                        if 'cascade' in detail:
                            logging.info(f"skipping due to cascading protection: {action} | {expired_title} | {details} | {log}")
                            return False
                elif index == 1:
                    if action not in ['modify', 'protect']:
                        logging.info(f"skipping due to previous non-protection: {action} | {expired_title} | {protections} | {log}")
                        return False
                    if not details:
                        logging.error(f"skipping due to no details for previous protection: {expired_title} | {protections}")
                        return False

                    # details for the reason
                    user = log['user']
                    comment = log['comment']

                    for detail in details:
                        detail_type = detail.get('type', None)
                        detail_level = detail.get('level', None)
                        detail_expiry = detail.get('expiry', None)
                        if detail_type == 'edit':
                            previous_edit_level = detail_level
                            previous_edit_expiry = detail_expiry
                        if detail_type == 'move':
                            previous_move_level = detail_level
                            previous_move_expiry = detail_expiry
                        if 'cascade' in detail:
                            logging.info(f"skipping due to cascading protection: {action} | {expired_title} | {details} | {log}")
                            return False
            except Exception as e:
                logging.error(f"error processing log entry for {log}: {e}")

        # final decision on restoring protection
        if not user:
            logging.info(f"skipping due to no previous protection: {action} | {expired_title} | {details} | {log}")
            return False
        if not comment:
            comment = "empty reason"
        reprotect = False

        # check current protection status
        current_protection = page.protection()
        restore_edit_level = None
        restore_edit_expiry = None
        restore_move_level = None
        restore_move_expiry = None
        if 'edit' in current_protection:
            restore_edit_level, restore_edit_expiry = current_protection['edit']
        if 'move' in current_protection:
            restore_move_level, restore_move_expiry = current_protection['move']

        # convert timestamps
        try:
            if isinstance(restore_edit_expiry, str) and restore_edit_expiry[0].isdigit():
                restore_edit_expiry = iso_to_timestamp(restore_edit_expiry)
            if isinstance(restore_move_expiry, str) and restore_move_expiry[0].isdigit():
                restore_move_expiry = iso_to_timestamp(restore_move_expiry)
        except Exception as e:
            logging.error(f"skipping due to error converting protection timestamps: {current_protection} | {e}")
            return False

        # should never happen
        if not found_expired_logid:
            logging.error(f"skipping due to missing expired logid: {expired_logid} | {expired_title}");
            return False

        # restoration logic
        if previous_edit_level and self.protection_level(previous_edit_level) < self.protection_level(edit_level) and previous_edit_expiry > edit_expiry and previous_edit_expiry > time.time() + 3600:
            restore_edit_level = previous_edit_level
            restore_edit_expiry = previous_edit_expiry
            reprotect = True
        if previous_move_level and self.protection_level(previous_move_level) < self.protection_level(move_level) and previous_move_expiry > move_expiry and previous_move_expiry > time.time() + 3600 and previous_move_level != "autoconfirmed":
            restore_move_level = previous_move_level
            restore_move_expiry = previous_move_expiry
            reprotect = True

        # perform restoration
        if reprotect:
            protections = {'edit': restore_edit_level, 'move': restore_move_level}
            if restore_edit_expiry in ['infinity', 'infinite', 'indefinite', 'never', '', float('inf')]:
                restore_edit_expiry = 'indefinite'
            if restore_move_expiry in ['infinity', 'infinite', 'indefinite', 'never', '', float('inf')]:
                restore_move_expiry = 'indefinite'
            if restore_edit_expiry is not None and restore_move_expiry is not None:
                if restore_edit_expiry != restore_move_expiry:
                    logging.warning(f"skipping due to differing expiration timestamps: edit = {restore_edit_expiry}, move = {restore_move_expiry}")
                    return False
            expiry = None
            if isinstance(restore_edit_expiry, (int, float)):
                restore_edit_expiry = datetime.utcfromtimestamp(restore_edit_expiry)
            if isinstance(restore_move_expiry, (int, float)):
                restore_move_expiry = datetime.utcfromtimestamp(restore_move_expiry)
            if restore_edit_expiry:
                expiry = restore_edit_expiry
            elif restore_move_expiry:
                expiry = restore_move_expiry
            reason = f"Restoring protection by [[User:{user}|{user}]]: {comment}"
            logging.info(f"protecting: {expired_title} | {protections} | {restore_edit_expiry} | {restore_move_expiry} | expiry = {expiry} | {reason}")
            return True

        # conditions not met
        logging.info(f"skipping due to conditions being unmet: {expired_title}");
        return False

if __name__ == "__main__":
    # initialize site and login
    site = pywikibot.Site('en', 'wikipedia')
    site.login()
    if site.userinfo['name'] == site.username():
        logging.info(f"successfully logged in as {site.username()}")
    else:
        logging.error("login failed")
        time.sleep(300)
        sys.exit(1)

    # create protection manager instance
    manager = ProtectionManager(site)

    # handle protection expirations
    while True:
        # fetch expirations
        manager.protection_expirations()
        # process all available expirations
        while expired := manager.next_expired_protection():
            if manager.restore_protection(expired):
                # longer wait between reprotection actions
                time.sleep(300)
            else:
                # shorter wait otherwise
                time.sleep(1)
        # wait before checking log again
        time.sleep(300)