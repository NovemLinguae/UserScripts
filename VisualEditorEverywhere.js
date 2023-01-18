//<nowiki>

// TODO: fix the race condition. still present as of 08/31/22. got it when clicking from WT:NPPC to WP:NPPC. not consistently reproducible.
// TODO: add support for [edit] links in diffs

// @ts-ignore
if( jQuery !== undefined && mediaWiki !== undefined ) {
	/** Insert Edit tab at top of page */
	function insertVETab() {
		let skin = mw.config.get('skin');
		let htmlToInsert;
		switch ( skin ) {
			case 'timeless':
				htmlToInsert =
`<li id="ca-ve-edit" class="mw-list-item" style="display: inline-block">
	<a href="/w/index.php?title=${articleName}&amp;veaction=edit" title="Edit this page [alt-shift-v]" accesskey="v">
		<span>
			VEdit
		</span>
	</a>
</li>`;
				break;
			case 'vector-2022':
				htmlToInsert =
`<li id="ca-ve-edit" class="vector-tab-noicon mw-list-item">
	<a href="/w/index.php?title=${articleName}&amp;veaction=edit" title="Edit this page [alt-shift-v]" accesskey="v">
		VEdit
	</a>
</li>`;
				break;
			case 'modern':
				htmlToInsert =
`<li id="ca-ve-edit" class="collapsible" style="display: block;">
	<a href="/w/index.php?title=${articleName}&amp;veaction=edit" title="Edit this page [alt-shift-v]" accesskey="v">
		VEdit
	</a>
</li>`;
				break;
			case 'minerva':
				htmlToInsert =
`<a id="ca-ve-edit" href="/w/index.php?title=${articleName}&amp;veaction=edit" class="edit-page menu__item--page-actions-edit mw-ui-icon mw-ui-icon-element mw-ui-icon-wikimedia-edit-base20 mw-ui-icon-with-label-desktop mw-ui-button mw-ui-quiet userlink" data-mw="interface" data-event-name="menu.edit" role="button" title="Edit this page [alt-shift-v]">
	VEdit
</a>`;
				break;
			case 'vector':
			case 'monobook':
			default:
				htmlToInsert =
`<li id="ca-ve-edit" class="collapsible">
	<a href="/w/index.php?title=${articleName}&amp;veaction=edit" title="Edit this page [alt-shift-v]" accesskey="v">
		VEdit
	</a>
</li>`;
				break;
		}

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
			let htmlToInsert = '<a href="" class="mw-editsection-visualeditor">vedit</a>    <span class="mw-editsection-divider"> | </span>';

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