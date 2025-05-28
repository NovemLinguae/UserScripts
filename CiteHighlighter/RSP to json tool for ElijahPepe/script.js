'use strict';

class Tool {
	getOutput( input ) {
		const output = [];
		const dicedUpWikicode = input.split( '|-' );

		for ( const row of dicedUpWikicode ) {
			const buffer = {};

			const source = row.match( /^\| ((?!data)[^\n]+)\n/mi );
			if ( source === null ) {
				continue;
			}
			buffer.source = source[ 1 ];
			// TODO: strip out wikilinks, piped wikilinks, {{/Shortcut}}, etc.

			const domains = row.match( /^\| \{\{\/Uses\|([^}]*)\}/mi );
			buffer.domains = domains === null ? [] : domains[ 1 ].split( '|' );

			// TODO:
			// const reliability = '';

			// TODO:
			// const blacklisted = '';

			// TODO:
			// const summary = '';

			output.push( buffer );
		}

		return JSON.stringify( output, null, 4 );
	}
}

window.addEventListener( 'DOMContentLoaded', () => {
	const input = document.getElementById( 'input' );
	const execute = document.getElementById( 'execute' );
	const output = document.getElementById( 'output' );

	const Tool1 = new Tool();

	// load Tool.txt into input box
	try {
		const fileToLoad = './default.txt';
		const xmlhttp = new XMLHttpRequest();
		xmlhttp.open( 'GET', fileToLoad, false );
		xmlhttp.send();
		input.innerHTML = xmlhttp.responseText;
	} catch ( DOMException ) {
		input.innerHTML = 'Error loading file. Maybe related to filepath or CORS?';
	}

	execute.addEventListener( 'click', () => {
		output.value = Tool1.getOutput( input.value );
	} );

	execute.dispatchEvent( new Event( 'click' ) );
} );
