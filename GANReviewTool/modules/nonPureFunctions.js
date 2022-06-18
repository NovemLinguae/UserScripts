export async function getWikicode(title) {
	let api = new mw.Api();
	let params = {
		"action": "parse",
		"page": title,
		"prop": "wikitext",
		"format": "json",
	};
	let result = await api.post(params);
	if ( result['error'] ) return '';
	let wikicode = result['parse']['wikitext']['*'];
	return wikicode;
}

export async function makeEdit(title, editSummary, wikicode) {
	let api = new mw.Api();
	let params = {
		"action": "edit",
		"format": "json",
		"title": title,
		"text": wikicode,
		"summary": editSummary,
	};
	let result = await api.postWithToken('csrf', params);
	let revisionID = result['edit']['newrevid'];
	return revisionID;
}

export async function getPageCreator(title) {
	let api = new mw.Api();
	let params = {
		action: 'query',
		prop: 'revisions',
		titles: title,
		rvlimit: 1,
		rvprop: 'user',
		rvdir: 'newer',
		format: 'json',
	};
	let result = await api.post(params);
	let wikicode = result['query']['pages']
	let key = Object.keys(wikicode)[0];
	wikicode = wikicode[key]['revisions'][0]['user'];
	return wikicode;
}

/** Lets you append without getting the Wikicode first. Saves an API query. */
export async function appendToPage(title, editSummary, wikicodeToAppend) {
	let api = new mw.Api();
	let params = {
		"action": "edit",
		"format": "json",
		"title": title,
		"appendtext": wikicodeToAppend,
		"summary": editSummary,
	};
	let result = await api.postWithToken('csrf', params);
	let revisionID = result['edit']['newrevid'];
	return revisionID;
}

export function pushStatus(statusToAdd) {
	$(`#GANReviewTool-ProcessingMessage > p`).append('<br />' + statusToAdd);
}

export function shouldRunOnThisPage(title) {
	// don't run when not viewing articles
	let action = mw.config.get('wgAction');
	if ( action != 'view' ) return false;
	
	// don't run when viewing diffs
	let isDiff = mw.config.get('wgDiffNewId');
	if ( isDiff ) return false;
	
	let isDeletedPage = ( ! mw.config.get('wgCurRevisionId') );
	if ( isDeletedPage ) return false;

	// always run in Novem's sandbox
	if ( title === 'User:Novem_Linguae/sandbox' ) return true;
	
	// only run in talk namespace
	let namespace = mw.config.get('wgNamespaceNumber');
	let isTalkNamespace = ( namespace === 1 );
	if ( ! isTalkNamespace ) return false;

	// only run on pages that end in /GA##
	if ( ! isGASubPage(title) ) return false;

	return true;
}