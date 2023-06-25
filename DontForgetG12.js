// <nowiki>

/*
- Check if article is unreviewed
- If so, display a giant "copyright check" button at the top, to remind you to run Earwig's copyvio detector on the article first thing.
- Many submissions are copyright violations, and catching it before you perform a bunch of other steps in the NPP/AFC flowchart saves time.
*/

$(async function() {
	/** returns the pagename, including the namespace name, but with spaces replaced by underscores */
	function getArticleName() {
		return mw.config.get('wgPageName');
	}
	
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
	
	function insertButton() {
		$('#contentSub').before(`
			<a style="display: inline-block; color: black; margin-top: 0.5em; border: 2px solid black; padding: 0.25em 3em; background-color: #FFDC00; font-size: 1.5em;" href="https://copyvios.toolforge.org/?lang=en&project=wikipedia&title=` + encodeURIComponent(title) + `" target="_blank">
				Copyvio check
			</a>
		`);
	}

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
	
	// don't run when not viewing articles
	let action = mw.config.get('wgAction');
	if ( action !== 'view' ) return;
	
	// don't run when viewing diffs
	let isDiff = mw.config.get('wgDiffNewId');
	if ( isDiff ) return;
	
	let isDeletedPage = ( ! mw.config.get('wgCurRevisionId') );
	if ( isDeletedPage ) return;
	
	// Only run in mainspace and draftspace
	let namespace = mw.config.get('wgNamespaceNumber');
	if ( ! [0, 118].includes(namespace) ) return;
	
	let title = getArticleName();
	let wikicode = await getWikicode(title);

	// Don't run on redirect pages
	let isRedirect = wikicode.match(/^#REDIRECT \[\[/i);
	if ( isRedirect ) {
		return;
	}
	
	// Only run if 1) article is uncurated or 2) draft is submitted
	let draftIsSubmitted = wikicode.match(/(?:{{AfC submission}}|{{AfC submission\|}}|{{AfC submission\|\|)/i) && namespace === 118;
	if ( draftIsSubmitted ) {
		insertButton();
	}
	
	mw.hook( 'ext.pageTriage.toolbar.ready' ).add( async function () {
		let pageID = mw.config.get( 'wgArticleId' );
		if ( ! (await isReviewed( pageID )) ) {
			insertButton();
		}
	});
});

// </nowiki>