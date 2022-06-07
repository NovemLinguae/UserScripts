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
	
	function pageIsCuratedFunction(title) {
		let pageIsCurated = '';
		mw.hook( 'ext.pageTriage.toolbar.ready' ).add( function ( queue ) {
			pageIsCurated = queue.reviewed();
		});
		return pageIsCurated;
	}
	
	function insertButton() {
		$('#contentSub').before(`
			<a style="display: inline-block; color: black; margin-top: 0.5em; border: 2px solid black; padding: 0.25em 3em; background-color: #FFDC00; font-size: 1.5em;" href="https://tools.wmflabs.org/copyvios/?lang=en&project=wikipedia&title=` + encodeURIComponent(title) + `" target="_blank">
				Copyvio check
			</a>
		`);
	}
	
	// don't run when not viewing articles
	let action = mw.config.get('wgAction');
	if ( action != 'view' ) return;
	
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
	
	// Only run if 1) article is uncurated or 2) draft is submitted
	let draftIsSubmitted = wikicode.match(/(?:{{AfC submission}}|{{AfC submission\|}}|{{AfC submission\|\|)/i) && namespace === 118;
	// let pageIsNotCurated = $('.mwe-pt-mark-as-unreviewed-button').length;
	// let pageIsCurated = pageIsCuratedFunction();
	// console.log(pageIsCurated);
	if ( draftIsSubmitted ) {
		insertButton();
	}
	
	mw.hook( 'ext.pageTriage.toolbar.ready' ).add( function ( queue ) {
		let pageIsNotCurated = $('[title="Mark this page as reviewed"]').length;
		if ( pageIsNotCurated ) {
			console.log('Unreviewed article detected 2');
			insertButton();
		};
	});
});

// </nowiki>