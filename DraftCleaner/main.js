/* THIS SCRIPT IS BUGGY ABOUT 10% OF THE TIME. Be sure to check the diff that pops up before submitting.

- Adds "Run DraftCleaner" link to the left sidebar

- Top uses:
	- remove extra line breaks (for example, 3 enters in a row)
	- in the first sentence, bold the title
	- convert curly quotes to regular quotes
	- put <ref>s after periods
	- clean external links out of the main article area (turn them into references)
	- add ==References== section
	- removes bold from headings

- Other uses:
	- converts [inline external links] to <ref>s
	- removes spaces in front of <ref>s
	- get rid of any level 2 heading that contains the article's title
	- converts =TitleHeading= to ==H2Heading==
	- replaces Covid-19 with COVID-19
	- removes enter characters between <ref>s
	- trims whitespace at beginning and end
	- remove self wikilinks to the article title
	- convert ==Reference== to ==References==
	- turn bare URLs into references
	- fix errant spaces at beginning of lines, which makes a blockquote looking thing
	- delete whitespace at the end of lines
	- convert double spaces to single spaces
	- remove blank heading
	- in refs, turn short links into long links, so you can see the domain
	- change year range dash to ndash
	- if in draftspace, and draft in categories, disable the categories
	- delete <br>. in drafts, these are usually poorly placed
	- fix empty references section
	- right align images
	- remove whitespace if that is the only character on a line
	- correct capitalization of see also, references, further reading, external links
	- if article has headings but no lead, remove first heading
	- replace unicode bullets with asterisks

This page was assembled from 3 files using my publish.php script. I have an offline test suite with around 100 unit tests for the DraftCleaner and StringFilter classes.
*/

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
	});
	return wikicode;
}

// borrowed from [[Wikipedia:User scripts/Guide#Edit a page and other common actions]]
function editPage(articleName, wikicode, summary) {
	let debugInfo = $.ajax({
		url: mw.util.wikiScript('api'),
		type: 'POST',
		dataType: 'json',
		data: {
			format: 'json',
			action: 'edit',
			title: articleName,
			text: wikicode, // will replace entire page content
			summary: summary,
			token: mw.user.tokens.get('csrfToken')
		},
		async: false
	});
}

function goToShowChangesScreen(titleWithNamespaceAndUnderscores, wikicode, editSummary) {
	let titleEncoded = encodeURIComponent(titleWithNamespaceAndUnderscores);
	let wgServer = mw.config.get('wgServer');
	let wgScriptPath = mw.config.get('wgScriptPath');
	let baseURL = wgServer + wgScriptPath + '/';
	// https://stackoverflow.com/a/12464290/3480193
	$(`<form action="${baseURL}index.php?title=${titleEncoded}&action=submit" method="POST"/>`)
		.append($('<input type="hidden" name="wpTextbox1">').val(wikicode))
		.append($('<input type="hidden" name="wpSummary">').val(editSummary))
		.append($('<input type="hidden" name="mode">').val('preview'))
		.append($('<input type="hidden" name="wpDiff">').val('Show changes'))
		.append($('<input type="hidden" name="wpUltimateParam">').val('1'))
		.appendTo($(document.body)) //it has to be added somewhere into the <body>
		.submit();
}

/** returns the pagename, including the namespace name, but with spaces replaced by underscores */
function getArticleName() {
	return mw.config.get('wgPageName');
}

/** refresh AND clear cache */
function hardRefresh() {
	// window.location.reload(true) is deprecated. use this instead
	window.location.href = window.location.href;
}

// don't run when not viewing articles
let action = mw.config.get('wgAction');
if ( action != 'view' ) return;

// don't run when viewing diffs
let isDiff = mw.config.get('wgDiffNewId');
if ( isDiff ) return;

// Don't run in virtual namespaces
if (mw.config.get('wgNamespaceNumber') < 0) return;

let menuID = 'p-navigation';
// @ts-ignore
if ( window.draftCleanerPutInToolsMenu ) {
	menuID = 'p-tb';
// @ts-ignore
} else if ( window.draftCleanerPutInMoreMenu ) {
	menuID = 'p-cactions';
}

let titleWithNamespaceAndUnderscores = getArticleName();
let namespaceNumber = mw.config.get('wgNamespaceNumber');

let running = false;

// Add DraftCleaner to the toolbar
mw.loader.using(['mediawiki.util'], function () {
	mw.util.addPortletLink(menuID, '#', 'Run DraftCleaner', 'DraftCleanerLink');
	$('#DraftCleanerLink').on('click', async function() {
		// prevent running the script while script is already in progress
		if (running) return;
		running = true;

		// notify of script starting
		mw.notify('Parsing page content...');
	
		// get page wikicode
		let titleWithNamespaceAndSpaces = titleWithNamespaceAndUnderscores.replace(/_/g, ' ');
		let originalWikicode = await getWikicode(titleWithNamespaceAndUnderscores);
		let wikicode = originalWikicode;

		let dc = new DraftCleaner();
		wikicode = dc.cleanDraft(wikicode, namespaceNumber, titleWithNamespaceAndSpaces);

		// if changes to be made
		if ( wikicode != originalWikicode ) {
			let summary = 'clean up ([[User:Novem Linguae/Scripts/DraftCleaner.js|DraftCleaner]])';
			// editPage(titleWithNamespaceAndUnderscores, wikicode);
			// hardRefresh();
			await goToShowChangesScreen(titleWithNamespaceAndUnderscores, wikicode, summary);
		// else display "no changes needed", then reset
		} else {
			mw.notify('No changes needed!');
		}
	});
});