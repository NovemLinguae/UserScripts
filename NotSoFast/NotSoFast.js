// <nowiki>

/*
In [[Special:NewPagesFeed]], this script highlights articles newer than 15 minutes RED, and articles newer than 1 hour YELLOW. This is to remind you not to patrol those articles yet. [[WP:NPP]] says that articles should not be patrolled until at least 15 minutes have elapsed. This is to give the writer time to work on the article without getting CSD tagged, maintenance tagged, edit conflicted, etc.
*/

$(function() {
	function getArticleName() {
		// returns the pagename, including the namespace name, but with spaces replaced by underscores
		return mw.config.get('wgPageName');
	}
	
	function checkAndHighlight(obj) {
		$(obj).find('.mwe-pt-creation-date').each(function(i) {
			// example: 00:34, 5 March 2022
			let dateTimeString = $(this).html().trim();
			// flip date and time, so that Date.parse() recognizes it
			// example: 5 March 2002 00:34
			dateTimeString = dateTimeString.replace(/(^.*), (.*)$/, '$2 $1');
			let timestamp = Date.parse(dateTimeString);
			// convert milliseconds to seconds
			timestamp /= 1000;
			if ( timestamp > fifteenMinutesAgo ) {
				$(this).css("background-color", "#F79C8F");
			} else if ( timestamp > oneHourAgo ) {
				$(this).css("background-color", "#F5F591");
			}
		});
	}
	
	function inAFCMode() {
		return $('#mwe-pt-radio-afc').is(':checked');
	}
	
	let title = getArticleName();
	if ( title != 'Special:NewPagesFeed' ) return;
	
	let currentTimestamp = Math.floor(Date.now() / 1000);
	let fifteenMinutesAgo = currentTimestamp - 60*15;
	let oneHourAgo = currentTimestamp - 60*60;
	
	// then run it again whenever a DOM node is inserted (the list refreshes as you scroll down, so this can be anytime you scroll down). could also be because this script loads BEFORE the the NPP applet (race condition)
	$('body').on('DOMNodeInserted', '.mwe-pt-list-item', function() {
		if ( ! inAFCMode() ) {
			checkAndHighlight(this);
		}
	});
	
	// run it once in case the NPP applet loaded BEFORE this script (race condition)
	$('.mwe-pt-list-item').each(function() {
		if ( ! inAFCMode() ) {
			checkAndHighlight(this);
		}
	});
});

// </nowiki>