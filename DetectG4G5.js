// <nowiki>

/*
- Displays an alert if an article may be a CSD G4 (previous AFD) or CSD G5 (created by a sockpuppet)
- Useful for new page patrolling
- Only runs on pages that have not been marked as reviewed
*/

// TODO: Code review. Is there a way to reduce the # of API queries?

$(async function() {
	async function getWikicode(title) {
		if ( ! mw.config.get('wgCurRevisionId') ) return ''; // if page is deleted, return blank
		var wikicode = '';
		title = encodeURIComponent(title);
		await $.ajax({
			url: 'https://en.wikipedia.org/w/api.php?action=parse&page='+title+'&prop=wikitext&formatversion=2&format=json',
			success: function (result) {
				wikicode = result['parse']['wikitext'];
			},
			dataType: "json",
			async: false
		});
		return wikicode;
	}

	async function hasAFDTemplate(title) {
		let wikicode = await getWikicode(title);
		return wikicode.indexOf('{{Article for deletion') !== -1;
	}

	function displayWarning(html) {
		$('#contentSub').before(`<div class="DetectG4G5" style="background-color: red">${html}</div>`);
	}

	async function isReviewed(pageID) {
		let api = new mw.Api();
		let response = await api.get( {
			action: 'pagetriagelist',
			format: 'json',
			page_id: pageID,
		} );
		// if old page (purged from pagetriagelist table by cronjob after 365 days)
		if ( response.pagetriagelist.result !== 'success' || response.pagetriagelist.pages.length === 0 ) return true;
		// if new page that has been marked as reviewed
		if ( response.pagetriagelist.pages[0].patrol_status === '1' || response.pagetriagelist.pages[0].patrol_status === '3' ) return true;
		// if new page that has not been marked as reviewed
		return false;
	}

	async function afdExists(title) {
		title = 'Wikipedia:Articles_for_deletion/' + title;
		return await pageExists(title);
	}

	async function pageExists(title) {
		let api = new mw.Api();
		let response = await api.get( {
			action: 'query',
			format: 'json',
			prop: 'revisions',
			titles: title,
		} );
		let exists = typeof response.query.pages['-1'] === 'undefined';
		return exists;
	}

	async function isBlocked(username) {
		let api = new mw.Api();
		let response = await api.get( {
			action: "query",
			format: "json",
			list: "users",
			usprop: "blockinfo",
			ususers: username,
		} );
		let isBlocked = typeof response.query.users[0].blockid !== 'undefined';
		return isBlocked;
	}

	async function isGloballyLocked(username) {
		let api = new mw.Api();
		let response = await api.get( {
			action: 'query',
			list: 'globalallusers',
			agulimit: '1',
			agufrom: username,
			aguto: username,
			aguprop: 'lockinfo',
		} );
		let isLocked = response.query.globalallusers.length !== 0 && response.query.globalallusers[0].locked === '';
		return isLocked;
	}

	function getFirstValueInObject(obj) {
		return obj[Object.keys(obj)[0]];
	}

	async function getPageCreator(title) {
		let api = new mw.Api();
		let response = await api.get( {
			"action": "query",
			"format": "json",
			"prop": "revisions",
			"titles": title,
			"rvlimit": "1",
			"rvdir": "newer"
		} );
		let page = getFirstValueInObject(response.query.pages);
		let pageCreator = page.revisions[0].user;
		return pageCreator;
	}

	function shouldRunOnThisPage() {
		// don't run when not viewing articles
		let action = mw.config.get('wgAction');
		if ( action != 'view' ) return false;
		
		// don't run when viewing diffs
		let isDiff = mw.config.get('wgDiffNewId');
		if ( isDiff ) return false;
		
		let isDeletedPage = ( ! mw.config.get('wgCurRevisionId') );
		if ( isDeletedPage ) return false;
		
		// Only run in mainspace
		let namespace = mw.config.get('wgNamespaceNumber');
		let title = mw.config.get('wgPageName'); // includes namespace, underscores instead of spaces
		if ( namespace !== 0 && title != 'User:Novem_Linguae/sandbox' ) return false;

		return true;
	}

	if ( ! shouldRunOnThisPage() ) return;
	
	let title = mw.config.get('wgPageName'); // includes namespace, underscores instead of spaces
	let pageID = mw.config.get('wgArticleId');

	if ( await isReviewed(pageID) ) {
		return;
	}

	if ( await afdExists(title) && ! await hasAFDTemplate(title) ) {
		displayWarning('<span style="font-weight:bold">CSD G4:</span> There is an AFD page for this article. It may qualify for CSD G4.');
	}

	let pageCreator = await getPageCreator(title);
	if ( await isBlocked(pageCreator) ) {
		displayWarning('<span style="font-weight:bold">CSD G5:</span> The creator of this page is blocked. This article may qualify for CSD G5.');
	}

	if ( await isGloballyLocked(pageCreator) ) {
		displayWarning('<span style="font-weight:bold">CSD G5:</span> The creator of this page is globally locked. This article may qualify for CSD G5.');
	}
});

// </nowiki>