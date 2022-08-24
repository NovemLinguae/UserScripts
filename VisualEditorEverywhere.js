//<nowiki>

// TODO: fix the race condition
// TODO: add support for [edit] links in diffs

if( jQuery !== undefined && mediaWiki !== undefined ) {
	function insertVETab() {
		// Insert Edit tab at top of page
		let htmlClass = mw.config.get('skin') === 'vector-2022' ? 'mw-list-item' : 'collapsible';
		let htmlToInsert = `<li id="ca-ve-edit" class="${htmlClass}"><a href="/w/index.php?title=${articleName}&amp;veaction=edit" title="Edit this page [alt-shift-v]" accesskey="v">VEdit</a></li>`;
		$('#ca-edit').before(htmlToInsert);
		$('#ca-ve-edit').show();
	}

	function insertVESectionLink() {
		// Insert [ edit ] by each section
		// Foreach edit button
		$('.mw-editsection').each(function() {
			// Generate visual editor section link for this element
			// Credit to Bartosz Dziewoński (WMF) for this fix
			let veEditHref = $(this).find('a').attr('href').replace('&action=edit', '&veaction=edit');

			// Generate HTML to insert
			htmlToInsert = '<a href="" class="mw-editsection-visualeditor">vedit</a>    <span class="mw-editsection-divider"> | </span>';

			// Insert the HTML right after the bracket (the first span contained in .mw-editsection is <span class="mw-editsection-bracket">s
			// Inline tags such as <span> do not work with :nth-child, .before(), etc. Must use :first-of-type.
			$(this).children('span:first-of-type').after(htmlToInsert);

			// Inject our generated URL for the edit button
			$(this).find('.mw-editsection-visualeditor').attr('href', veEditHref);
		});

		showVEEditLink();

		// Below is a possible, untested fix for the race condition. I need a test case though.
		/*
		new MutationObserver(() => {
			showVEEditLink();
		}).observe($('.mw-editsection-visualeditor, .mw-editsection-divider')[0], {childList: true});
		*/
	}

	function showVEEditLink() {
		$('.mw-editsection-visualeditor, .mw-editsection-divider').show();
	}

	let articleName = mw.config.get('wgPageName');
	articleName = encodeURIComponent(articleName); // fix bug involving & not getting converted to &amp;
	let buttonIsPresent = $('#ca-ve-edit').length;
	let pageIsUserScript = articleName.match(/(?:\.js|\.css)$/);
	
	if ( ! buttonIsPresent && ! pageIsUserScript ) {
		insertVETab();
		insertVESectionLink();
	}
}

//</nowiki>