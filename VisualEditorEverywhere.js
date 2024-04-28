// <nowiki>

// TODO: fix the race condition. still present as of 04/19/24. got it when clicking from WT:NPPC to WP:NPPC. not consistently reproducible. use mw.hook( 've.activationComplete' )? list of VE hooks: https://codesearch.wmcloud.org/deployed/?q=mw%5C.hook.*%5C.fire&files=&excludeFiles=&repos=mediawiki%2Fextensions%2FVisualEditor.
// 04/25/24. got the race condition when visiting https://en.wikipedia.org/wiki/Wikipedia:New_pages_patrol/Backlog_drives/May_2024#Signing_up
// TODO: add support for [edit] links in diffs

class VisualEditorEverywhere {
	execute() {
		this.articleName = mw.config.get( 'wgPageName' );
		this.articleName = encodeURIComponent( this.articleName ); // fix bug involving & not getting converted to &amp;
		const pageIsUserScript = this.articleName.match( /(?:\.js|\.css)$/ );

		const veTabIsPresent = $( '#ca-ve-edit' ).length;
		if ( !veTabIsPresent && !pageIsUserScript ) {
			this.insertVETab();
		}

		// we also need to check if section links are present. if you save a VE edit, the VETab will already be present, but the VESectionLinks will not be present and need to be added back
		const veSectionLinkIsPresent = $( '.mw-editsection-visualeditor' ).length;
		if ( !veSectionLinkIsPresent && !pageIsUserScript ) {
			this.insertVESectionLink();
		}
	}

	/** Insert Edit tab at top of page */
	insertVETab() {
		const skin = mw.config.get( 'skin' );
		let htmlToInsert;
		switch ( skin ) {
			case 'timeless':
				htmlToInsert =
`<li id="ca-ve-edit" class="mw-list-item" style="display: inline-block">
	<a href="/w/index.php?title=${ this.articleName }&amp;veaction=edit" title="Edit this page [alt-shift-v]" accesskey="v">
		<span>VEdit</span>
	</a>
</li>`;
				break;
			case 'vector-2022':
				htmlToInsert =
`<li id="ca-ve-edit" class="vector-tab-noicon mw-list-item">
	<a href="/w/index.php?title=${ this.articleName }&amp;veaction=edit" title="Edit this page [alt-shift-v]" accesskey="v">VEdit</a>
</li>`;
				break;
			case 'modern':
				htmlToInsert =
`<li id="ca-ve-edit" class="collapsible" style="display: block;">
	<a href="/w/index.php?title=${ this.articleName }&amp;veaction=edit" title="Edit this page [alt-shift-v]" accesskey="v">VEdit</a>
</li>`;
				break;
			case 'minerva':
				htmlToInsert =
`<a id="ca-ve-edit" href="/w/index.php?title=${ this.articleName }&amp;veaction=edit" class="edit-page menu__item--page-actions-edit mw-ui-icon mw-ui-icon-element mw-ui-icon-wikimedia-edit-base20 mw-ui-icon-with-label-desktop mw-ui-button mw-ui-quiet userlink" data-mw="interface" data-event-name="menu.edit" role="button" title="Edit this page [alt-shift-v]">VEdit</a>`;
				break;
			case 'vector':
			case 'monobook':
			default:
				htmlToInsert =
`<li id="ca-ve-edit" class="collapsible">
	<a href="/w/index.php?title=${ this.articleName }&amp;veaction=edit" title="Edit this page [alt-shift-v]" accesskey="v">VEdit</a>
</li>`;
				break;
		}

		$( '#ca-edit' ).before( htmlToInsert );
		$( '#ca-ve-edit' ).show();
	}

	/** Insert [ vedit ] by each section */
	insertVESectionLink() {
		// Foreach edit button
		$( '.mw-editsection' ).each( function () {
			// Generate visual editor section link for this element
			// Credit to Bartosz Dziewoński (WMF) for this fix
			const veEditHref = $( this ).find( 'a' ).attr( 'href' ).replace( '&action=edit', '&veaction=edit' );

			// Generate HTML to insert
			let htmlToInsert;

			const skin = mw.config.get( 'skin' );
			switch ( skin ) {
				case 'minerva':
					// Generate HTML to insert
					htmlToInsert = '<a href="" class="mw-editsection-visualeditor" style="padding-left:1em; font-size:0.6em; font-family:sans-serif;">vedit</a>';

					$( this ).prepend( htmlToInsert );
					break;
				default:
					// Generate HTML to insert
					htmlToInsert = `<a href="" class="mw-editsection-visualeditor">vedit</a>
					<span class="mw-editsection-divider">|</span>
					`; // line break here is intentional. needed to render a space after the pipe

					// Insert the HTML right after <span class="mw-editsection"><span class="mw-editsection-bracket">
					// Inline tags such as <span> do not work with :nth-child, .before(), etc. Must use :first-of-type.
					$( this ).children( 'span:first-of-type' ).after( htmlToInsert );
					break;
			}

			// Inject our generated URL for the edit button
			$( this ).find( '.mw-editsection-visualeditor' ).attr( 'href', veEditHref );
		} );

		this.showVEEditLink();

		// Doesn't work :(
		// Good test case is https://en.wikipedia.org/wiki/User_talk:Onel5969?useskin=minerva. Ctrl-F5. 25-50% of the time it will not show the vedit section links.
		/*
		// Fixes a race condition. There's some code in core somewhere that hides visual editor links pretty late in the page load process. Sometimes this user script inserts its links before that code runs.
		// TODO: switch from MutationObserver to mw.hook().add(). https://github.com/NovemLinguae/UserScripts/issues/167
		new MutationObserver(() => {
			showVEEditLink();
			console.log('VisualEditorEverywhere: Mutation observer fired. Race condition prevented.');
		}).observe($('.mw-editsection-visualeditor, .mw-editsection-divider')[0], {childList: true});
		*/
	}

	showVEEditLink() {
		$( '.mw-editsection-visualeditor, .mw-editsection-divider' ).show();
	}
}

$( function () {
	// TODO: this should in theory fix the race condition bug. instead, it breaks the whole script (displays nothing). why? debug.
	// mw.hook( 've.activationComplete' ).add( function() {
	( new VisualEditorEverywhere() ).execute();
	// } );

	// when VE saves, the veSectionLinks should be put back
	mw.hook( 've.deactivationComplete' ).add( function () {
		( new VisualEditorEverywhere() ).execute();
	} );
} );

// </nowiki>
