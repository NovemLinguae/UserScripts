// <nowiki>

/*
- Displays whether or not a mainspace page is marked as reviewed. This info is placed on the right of the page title using a small icon.
- Without a script like this, you need to be a new page reviewer or admin and look at the Page Curation toolbar. Or you need to use Special:Log -> Page Curation Log. And there is also some complex logic. For example, the absence of a log entry means the page is marked as reviewed.
*/

// TODO: display whether the page is indexed or not. can do this by using JS to look for "noindex", or can do this by checking the first revision date.
// TODO: display in all namespaces
// TODO: do I need to use different code to check if marked as patrolled? I think that uses recentchanges table... maybe?

$(async function() {
	async function isReviewed(pageID) {
		let api = new mw.Api();
		let response = await api.get( {
			action: 'pagetriagelist',
			format: 'json',
			page_id: pageID,
		} );

		// no result
		if ( response.pagetriagelist.result !== 'success' || response.pagetriagelist.pages.length === 0 ) {
			return true;
		// 1, 2, or 3
		} else if ( parseInt(response.pagetriagelist.pages[0].patrol_status) > 0 ) {
			return true;
		// 0
		} else {
			return false;
		}
	}

	function shouldRunOnThisPage(title) {
		// don't run when not viewing articles
		let action = mw.config.get('wgAction');
		if ( action != 'view' ) {
			return false;
		}
		
		// don't run when viewing diffs
		let isDiff = mw.config.get('wgDiffNewId');
		if ( isDiff ) {
			return false;
		}
		
		let isDeletedPage = ( ! mw.config.get('wgCurRevisionId') );
		if ( isDeletedPage ) {
			return false;
		}
		
		// Only run in mainspace
		let namespace = mw.config.get('wgNamespaceNumber');
		let isMainspaceOrDraftspace = ( [0].includes(namespace) );
		if ( ! isMainspaceOrDraftspace ) {
			return false;
		}

		return true;
	}

	function pageHasSections() {
		return $(`#firstHeading .mw-editsection`).length;
	}

	let title = mw.config.get('wgPageName'); // includes namespace, underscores instead of spaces
	if ( ! shouldRunOnThisPage(title) ) {
		return;
	}

	let pageID = mw.config.get('wgArticleId');
	let boolIsReviewed = await isReviewed(pageID);
	let htmlToInsert = '';

	if ( boolIsReviewed ) {
		htmlToInsert = ` <img src="https://en.wikipedia.org/w/extensions/PageTriage/modules/ext.pageTriage.views.list/images/icon_reviewed.png" title="Reviewed" />`;
	} else {
		htmlToInsert = ` <img src="https://en.wikipedia.org/w/extensions/PageTriage/modules/ext.pageTriage.views.list/images/icon_not_reviewed.png" title="Not reviewed" />`;
	}

	if ( pageHasSections() ) {
		$(`#firstHeading .mw-editsection`).before(htmlToInsert);
	} else {
		$(`#firstHeading`).append(htmlToInsert);
	}
});

// </nowiki>