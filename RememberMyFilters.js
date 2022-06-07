// <nowiki>

/*
- If you use [[Special:NewPagesFeed]], and you switch back and forth between NPP and AFC, the NPP screen forgets your filters. This script re-clicks your filters each time.
- I have this set up to always click " Were created by learners (newly autoconfirmed users)". But you can fork this script and set whatever you want. Or post a request on my user talk page and I can add functionality for it.
*/

$(function() {
	function getArticleName() {
		// returns the pagename, including the namespace name, but with spaces replaced by underscores
		return mw.config.get('wgPageName');
	}
	
	function setFilter(filterElementID) {
		// click "set filters" link
		$('#mwe-pt-filter-dropdown-control').click();
		
		// then click "were created by learners"
		$(filterElementID).click();
		
		// then click "set filters" button
		$('#mwe-pt-filter-set-button').click();
	}
	
	let title = getArticleName();
	if ( title != 'Special:NewPagesFeed' ) return;
	
	let filterToSet = '#mwe-pt-filter-learners';
	
	// run it once on page load
	if ( $('#mwe-pt-radio-npp').is(':checked') ) {
		setFilter(filterToSet);
	}
	
	// run it again if NPP applet is created. to catch race conditions. maybe NPP applet hadn't loaded yet when code before this was run.
	$('body').on('DOMNodeInserted', '#mwe-pt-radio-npp', function() {
		if ( $('#mwe-pt-radio-npp').is(':checked') ) {
			setFilter(filterToSet);
		}
	});
	
	// run it whenever the user clicks the NPP radio button
	$('#mwe-pt-radio-npp').on('change', function() {
		if ( $('#mwe-pt-radio-npp').is(':checked') ) {
			setFilter(filterToSet);
		}
	});
});

// </nowiki>