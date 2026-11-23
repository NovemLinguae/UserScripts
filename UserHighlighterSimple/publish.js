/* global __dirname, process */
/* eslint-disable security/detect-non-literal-fs-filename, es-x/no-optional-chaining */
const fs = require( 'fs' );
const path = require( 'path' );
const readline = require( 'readline' );

const config = JSON.parse( fs.readFileSync( path.join( __dirname, 'publish.config.json' ), 'utf8' ) );

function generateWikitext() {
	let wikitext = "// === Compiled with Novem Linguae's publish.js script ======================";
	const modulesPath = path.resolve( __dirname, config.CLASSES_FOLDER_PATH );
	for ( const fileName of fs.readdirSync( modulesPath ).sort() ) {
		const displayPath = config.CLASSES_FOLDER_PATH.replace( /[\\/]+$/, '' ) + '/' + fileName;
		const classText = fs.readFileSync( path.join( modulesPath, fileName ), 'utf8' );
		wikitext += `\n\n// === ${ displayPath } ======================================================\n\n${ classText }`;
	}

	wikitext += `$(async function() {\n\n// === ${ config.MAIN_FILE_PATH } ======================================================\n\n`;
	wikitext += fs.readFileSync( path.resolve( __dirname, config.MAIN_FILE_PATH ), 'utf8' );
	wikitext += '\n\n});';

	wikitext = wikitext.replace( /<\/?nowiki>/g, '' )
		.replace( /import [^\n]*\n/g, '' )
		.replace( /^export /gm, '' )
		.replace( /^[^\n]*require\([^\n]*\n/gm, '' );
	return '// <nowiki>\n\n' + wikitext + '\n\n// </nowiki>';
}

async function publish() {
	for ( const key of [ 'WIKIPEDIA_API_URL', 'PAGE_TITLE', 'MAIN_FILE_PATH', 'CLASSES_FOLDER_PATH', 'WIKIPEDIA_USERNAME', 'WIKIPEDIA_PASSWORD' ] ) {
		if ( typeof config[ key ] !== 'string' || !config[ key ] ) {
			throw new Error( `Missing or invalid configuration: ${ key }` );
		}
	}
	const wikitext = generateWikitext();
	const editSummary = await new Promise( ( resolve, reject ) => {
		const input = readline.createInterface( { input: process.stdin, output: process.stdout } );
		let answered = false;
		input.on( 'close', () => {
			if ( !answered ) {
				reject( new Error( 'Edit summary input was closed before an answer was provided' ) );
			}
		} );
		input.question( 'Edit summary: ', ( answer ) => {
			answered = true;
			input.close();
			resolve( answer );
		} );
	} );
	const cookies = new Map();
	async function api( data ) {
		const response = await fetch( config.WIKIPEDIA_API_URL, {
			method: 'POST',
			redirect: 'error',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'User-Agent': "[[w:User:Novem Linguae]]'s publish.js script. Concatenates .js files together and writes them to .js pages onwiki.",
				...( cookies.size ? { Cookie: Array.from( cookies, ( [ name, value ] ) => `${ name }=${ value }` ).join( '; ' ) } : {} )
			},
			body: new URLSearchParams( { ...data, format: 'json' } )
		} );
		if ( !response.ok ) {
			throw new Error( `API HTTP error: ${ response.status } ${ response.statusText }` );
		}
		for ( const cookie of response.headers.getSetCookie() ) {
			const pair = cookie.split( ';', 1 )[ 0 ];
			const separator = pair.indexOf( '=' );
			if ( separator > 0 ) {
				cookies.set( pair.slice( 0, separator ), pair.slice( separator + 1 ) );
			}
		}
		const result = await response.json();
		if ( result.error ) {
			throw new Error( `API error: ${ JSON.stringify( result.error ) }` );
		}
		return result;
	}
	const loginToken = ( await api( { action: 'query', meta: 'tokens', type: 'login' } ) ).query?.tokens?.logintoken;
	if ( !loginToken ) {
		throw new Error( 'API did not return a login token' );
	}
	const login = await api( {
		action: 'login',
		lgname: config.WIKIPEDIA_USERNAME,
		lgpassword: config.WIKIPEDIA_PASSWORD,
		lgtoken: loginToken
	} );
	if ( login.login?.result !== 'Success' ) {
		throw new Error( `Login failed: ${ JSON.stringify( login.login ) }` );
	}
	const csrfToken = ( await api( { action: 'query', meta: 'tokens', type: 'csrf' } ) ).query?.tokens?.csrftoken;
	if ( !csrfToken || csrfToken === '+\\' ) {
		throw new Error( 'API did not return a valid CSRF token' );
	}
	const result = await api( {
		action: 'edit',
		title: config.PAGE_TITLE,
		text: wikitext,
		summary: `${ editSummary ? editSummary + ' ' : '' }(publish.js)`,
		token: csrfToken
	} );
	if ( result.edit?.result !== 'Success' ) {
		throw new Error( `Edit failed: ${ JSON.stringify( result.edit ) }` );
	}
	console.log( result.edit.nochange !== undefined ? 'Page already matches; no edit made.' : 'Published successfully.' );
}

publish().catch( ( error ) => {
	console.error( error );
	process.exitCode = 1;
} );
