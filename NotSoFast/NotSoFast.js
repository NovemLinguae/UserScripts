// <nowiki>

/*
In [[Special:NewPagesFeed]], this script highlights articles newer than 15 minutes RED, and articles newer than 1 hour YELLOW. This is to remind you not to patrol those articles yet. [[WP:NPP]] says that articles should not be patrolled until at least 15 minutes have elapsed. This is to give the writer time to work on the article without getting CSD tagged, maintenance tagged, edit conflicted, etc.
*/

$(function() {
	function checkAndHighlight(obj) {
		let currentTimestamp = Math.floor(Date.now() / 1000);
		let fifteenMinutesAgo = currentTimestamp - 60*15;
		let oneHourAgo = currentTimestamp - 60*60;

		$(obj).find('.mwe-pt-creation-date').each(function(i) {
			let dateTimeString = $(this).html().trim(); // example: 00:34, 5 March 2022
			dateTimeString = convertNPPDateTimeToJSDateTime(dateTimeString); // example: 5 March 2002 00:34
			let milliseconds = Date.parse(dateTimeString);
			let oldTimeStamp = millisecondsToSeconds(milliseconds);
			let browserTimeZoneOffset = new Date().getTimezoneOffset();
			let mediaWikiTimeZone = mw.user.options.get('timecorrection');
			let newTimeStamp = convertTimeZoneFromMediaWikiToBrowser(
				oldTimeStamp,
				mediaWikiTimeZone,
				browserTimeZoneOffset
			);
			if ( newTimeStamp > fifteenMinutesAgo ) {
				$(this).css("background-color", "#F79C8F");
			} else if ( newTimeStamp > oneHourAgo ) {
				$(this).css("background-color", "#F5F591");
			}
		});
	}

	function convertTimeZoneFromMediaWikiToBrowser(timestamp, medaWikiTimeZoneString, browserTimeZoneOffset) {
		let mediaWikiTimeZoneOffsetInMinutes = getMediaWikiTimeZoneOffset(medaWikiTimeZoneString);
		let mediaWikiTimeZoneOffsetInSeconds = mediaWikiTimeZoneOffsetInMinutes * 60;
		let browserTimeZoneOffsetInSeconds = browserTimeZoneOffset * 60;
		let conversion = parseInt(mediaWikiTimeZoneOffsetInSeconds) - parseInt(browserTimeZoneOffsetInSeconds);
		return parseInt(timestamp) + conversion;
	}

	/**
	 * Converts a MediaWiki mw.user.options.get('timecorrection') from something like 'ZoneInfo|-420|America/Los_Angeles' or 'System|0' to -420 or 0.
	 */
	function getMediaWikiTimeZoneOffset(string) {
		return parseInt(string.match(/\d+/)[0]);
	}

	/**
	 * Returns the pagename, including the namespace name, but with spaces replaced by underscores
	 */
	function getArticleName() {
		return mw.config.get('wgPageName');
	}

	/**
	 * Flips date and time, so that Date.parse() recognizes it. Example: 00:34, 5 March 2022 becomes 5 March 2002 00:34
	 */
	function convertNPPDateTimeToJSDateTime(nppDateTime) {
		return nppDateTime.replace(/(^.*), (.*)$/, '$2 $1');
	}

	function millisecondsToSeconds(milliseconds) {
		return milliseconds / 1000;
	}
	
	function inAFCMode() {
		return $('#mwe-pt-radio-afc').is(':checked');
	}
	
	let title = getArticleName();
	if ( title != 'Special:NewPagesFeed' ) return;
	
	// then run it again whenever a DOM node is inserted (the list refreshes as you scroll down, so this can be anytime you scroll down). could also be because this script loads BEFORE the the NPP applet (race condition)
	new MutationObserver(() => {
		if ( ! inAFCMode() ) {
			checkAndHighlight(this);
		}
	}).observe($('#mwe-pt-list-view')[0], {childList: true});

	// run it once in case the NPP applet loaded BEFORE this script (race condition)
	$('.mwe-pt-list-item').each(function() {
		if ( ! inAFCMode() ) {
			checkAndHighlight(this);
		}
	});
});

/* Nardog suggestions:
	~~1) switch to MutationObserver,~~
	~~2) handle time zones,~~
	~~3) use console.log to check for code execution instead of breakpoints,~~
	4) "I see no reason to look for .mwe-pt-list-item btw. I would just query .mwe-pt-creation-date directly and give them a class once they're processed, and exclude them in the query (e.g. $('.mwe-pt-creation-date:not(.notsofast-processed)').each(function(){)"
*/

// </nowiki>