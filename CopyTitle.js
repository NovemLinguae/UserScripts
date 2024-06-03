// <nowiki>

// Adds a "Copy" button next to every article title. Clicking it writes the article title to the clipboard.
// Script requested at WP:US/R by GreenC
// FYI, this script by Nardog does the same thing but has more features: https://en.wikipedia.org/wiki/User:Nardog/CopySectLink.js

function writeToClipboard( input ) {
	const data = [ new ClipboardItem( { 'text/plain': new Blob( [ input ], { type: 'text/plain' } ) } ) ];
	navigator.clipboard.write( data );
}

$( '#firstHeading' ).append( '<button id="copyTitle" style="margin-left: 1em;">Copy</button>' );

$( '#copyTitle' ).on( 'click', () => {
	// get title from API (easier than getting it from .html() and taking the tags out)
	const title = mw.config.get( 'wgPageName' ).replace( /_/g, ' ' );

	writeToClipboard( title );
} );

// </nowiki>
