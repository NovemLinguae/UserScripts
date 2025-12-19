const { UserHighlighterSimple } = require( './modules/UserHighlighterSimple.js' );

// Fire after wiki content is added to the DOM, such as when first loading a page, or when a gadget such as the XTools gadget loads.
mw.hook( 'wikipage.content' ).add( async () => {
	await mw.loader.using( [ 'mediawiki.util', 'mediawiki.Title', 'mediawiki.ForeignApi' ], async () => {
		await ( new UserHighlighterSimple( $, mw, window ) ).execute();
	} );
} );

// Fire after an edit is successfully saved via JavaScript, such as edits by the Visual Editor and HotCat.
mw.hook( 'postEdit' ).add( async () => {
	await mw.loader.using( [ 'mediawiki.util', 'mediawiki.Title', 'mediawiki.ForeignApi' ], async () => {
		await ( new UserHighlighterSimple( $, mw, window ) ).execute();
	} );
} );
