/* global __dirname, process */
/* eslint-disable security/detect-non-literal-fs-filename, jsdoc/check-tag-names */
/** @jest-environment node */
const fs = require( 'fs' );
const http = require( 'http' );
const os = require( 'os' );
const path = require( 'path' );
const { spawn } = require( 'child_process' );

let directory;
let server;
let requests;
let reply;

test( 'all deployment scripts have identical code', () => {
	const root = path.join( __dirname, '..', '..' );
	const expected = fs.readFileSync( path.join( root, 'deploy-script', 'deploy.js' ), 'utf8' );
	for ( const project of [ 'DraftCleaner', 'GANReviewTool', 'SpeciesHelper', 'UnblockReview', 'UserHighlighterSimple', 'UserRightsDiff', 'VoteCounter' ] ) {
		expect( fs.readFileSync( path.join( root, project, 'deploy.js' ), 'utf8' ) ).toBe( expected );
	}
} );

describe.each( [
	[ 'unbundled', false ],
	[ 'esbuild bundle', true ]
] )( '%s publisher', ( description, bundled ) => {

	function runPublish( input = 'Deploy update\n' ) {
		return new Promise( ( resolve, reject ) => {
			const child = spawn( process.execPath, [ path.join( directory, 'deploy.js' ) ], { cwd: os.tmpdir() } );
			let stdout = '';
			let stderr = '';
			child.stdout.on( 'data', ( data ) => {
				stdout += data;
			} );
			child.stderr.on( 'data', ( data ) => {
				stderr += data;
			} );
			child.on( 'error', reject );
			child.on( 'close', ( code ) => resolve( { code, stdout, stderr } ) );
			child.stdin.end( input );
		} );
	}

	beforeEach( async () => {
		directory = fs.mkdtempSync( path.join( os.tmpdir(), 'unblock-deploy-' ) );
		fs.copyFileSync( path.join( __dirname, '..', 'deploy.js' ), path.join( directory, 'deploy.js' ) );
		fs.mkdirSync( path.join( directory, 'modules' ) );
		fs.writeFileSync( path.join( directory, 'modules', 'b.js' ), 'export class B {}\n' );
		fs.writeFileSync( path.join( directory, 'modules', 'a.js' ), '// <nowiki>\r\nimport X from "x";\r\nexport class A {}\r\n// </nowiki>\r\n' );
		fs.writeFileSync( path.join( directory, 'main.js' ), 'const X = require("x");\r\nrun();\r\n' );
		fs.mkdirSync( path.join( directory, 'dist' ) );
		fs.writeFileSync( path.join( directory, 'dist', 'bundle.js' ), '// <nowiki>\n(() => { require("x"); run(); })();\n// </nowiki>\n' );
		requests = [];
		reply = ( index ) => [
			{ query: { tokens: { logintoken: 'login-token' } } },
			{ login: { result: 'Success' } },
			{ query: { tokens: { csrftoken: 'csrf-token' } } },
			{ edit: { result: 'Success', newrevid: 123 } }
		][ index ];
		server = http.createServer( ( request, response ) => {
			let body = '';
			request.on( 'data', ( chunk ) => {
				body += chunk;
			} );
			request.on( 'end', () => {
				const index = requests.length;
				requests.push( { form: new URLSearchParams( body ), cookie: request.headers.cookie } );
				if ( index === 0 ) {
					response.setHeader( 'Set-Cookie', [ 'session=initial; Path=/', 'other=abc; Path=/' ] );
				} else if ( index === 1 ) {
					response.setHeader( 'Set-Cookie', 'session=authenticated; Path=/' );
				}
				const result = reply( index );
				if ( result.status ) {
					response.statusCode = result.status;
				}
				response.end( result.raw === undefined ? JSON.stringify( result ) : result.raw );
			} );
		} );
		await new Promise( ( resolve ) => {
			server.listen( 0, '127.0.0.1', resolve );
		} );
		fs.writeFileSync( path.join( directory, 'deploy.config.json' ), JSON.stringify( {
			WIKIPEDIA_API_URL: `http://127.0.0.1:${ server.address().port }/api.php`,
			PAGE_TITLE: 'User:Example/UnblockReview.js',
			MAIN_FILE_PATH: bundled ? 'dist/bundle.js' : 'main.js',
			ESBUILD_BUNDLE: bundled,
			...( bundled ? {} : { CLASSES_FOLDER_PATH: 'modules/' } ),
			WIKIPEDIA_USERNAME: 'example@bot',
			WIKIPEDIA_PASSWORD: 'secret'
		} ) );
	} );

	afterEach( async () => {
		await new Promise( ( resolve, reject ) => {
			server.close( ( error ) => error ? reject( error ) : resolve() );
		} );
		fs.rmSync( directory, { recursive: true, force: true } );
	} );

	test( 'publishes the compiled script with authenticated cookies and prompted summary', async () => {
		const result = await runPublish();
		expect( result.code ).toBe( 0 );
		expect( result.stdout ).toContain( 'Edit summary: ' );
		expect( requests.map( ( request ) => request.form.get( 'action' ) ) ).toEqual( [ 'query', 'login', 'query', 'edit' ] );
		expect( requests[ 1 ].cookie ).toBe( 'session=initial; other=abc' );
		expect( requests[ 2 ].cookie ).toBe( 'session=authenticated; other=abc' );
		expect( requests[ 1 ].form.get( 'lgtoken' ) ).toBe( 'login-token' );
		expect( requests[ 3 ].form.get( 'token' ) ).toBe( 'csrf-token' );
		expect( requests[ 3 ].form.get( 'title' ) ).toBe( 'User:Example/UnblockReview.js' );
		expect( requests[ 3 ].form.get( 'summary' ) ).toBe( 'Deploy update (deploy.js)' );
		const text = requests[ 3 ].form.get( 'text' );
		expect( text ).toMatch( /^\/\/ <nowiki>\n\n/ );
		if ( bundled ) {
			expect( text ).toBe( "// <nowiki>\n\n// === Compiled with esbuild and Novem Linguae's deploy.js script ======================\n\n" +
				'// <nowiki>\n(() => { require("x"); run(); })();\n// </nowiki>\n\n\n// </nowiki>' );
		} else {
			expect( text ).toContain( 'class A {}' );
			expect( text.indexOf( 'class A {}' ) ).toBeLessThan( text.indexOf( 'class B {}' ) );
			expect( text ).toContain( '$(async function() {' );
			expect( text ).toContain( 'run();' );
			expect( text ).not.toMatch( /import X|export class|require\("x"\)/ );
		}
		expect( text ).toMatch( /\/\/ <\/nowiki>$/ );
	} );

	test( 'accepts a no-change edit and an empty summary', async () => {
		const originalReply = reply;
		reply = ( index ) => index === 3 ? { edit: { result: 'Success', nochange: '' } } : originalReply( index );
		const result = await runPublish( '\n' );
		expect( result.code ).toBe( 0 );
		expect( result.stdout ).toContain( 'no edit made' );
		expect( requests[ 3 ].form.get( 'summary' ) ).toBe( '(deploy.js)' );
	} );

	test( 'closed input exits nonzero before contacting the API', async () => {
		const result = await runPublish( '' );
		expect( result.code ).not.toBe( 0 );
		expect( result.stderr ).toContain( 'Edit summary input was closed' );
		expect( requests ).toHaveLength( 0 );
	} );

	test.each( [
		[ 'HTTP failure', 0, { status: 500 }, 'HTTP error' ],
		[ 'invalid JSON', 0, { raw: 'not JSON' }, 'SyntaxError' ],
		[ 'API error', 0, { error: { code: 'badtoken' } }, 'API error' ],
		[ 'missing login token', 0, { query: {} }, 'login token' ],
		[ 'rejected login', 1, { login: { result: 'Failed' } }, 'Login failed' ],
		[ 'anonymous CSRF token', 2, { query: { tokens: { csrftoken: '+\\' } } }, 'CSRF token' ],
		[ 'failed edit', 3, { edit: { result: 'Failure' } }, 'Edit failed' ]
	] )( '%s exits nonzero and stops the deployment', async ( description, index, errorReply, message ) => {
		const originalReply = reply;
		reply = ( current ) => current === index ? errorReply : originalReply( current );
		const result = await runPublish();
		expect( result.code ).not.toBe( 0 );
		expect( result.stderr ).toContain( message );
		expect( requests ).toHaveLength( index + 1 );
	} );

	test( 'file errors exit nonzero before contacting the API', async () => {
		fs.unlinkSync( path.join( directory, bundled ? 'dist/bundle.js' : 'main.js' ) );
		const result = await runPublish();
		expect( result.code ).not.toBe( 0 );
		expect( result.stderr ).toContain( 'ENOENT' );
		expect( requests ).toHaveLength( 0 );
	} );

	if ( bundled ) {
		test.each( [
			[ 'invalid bundle option', 'ESBUILD_BUNDLE', 'true', 'ESBUILD_BUNDLE' ],
			[ 'unbundled deployment without classes', 'ESBUILD_BUNDLE', false, 'CLASSES_FOLDER_PATH' ]
		] )( '%s exits nonzero before contacting the API', async ( description, key, value, message ) => {
			const configPath = path.join( directory, 'deploy.config.json' );
			const config = JSON.parse( fs.readFileSync( configPath, 'utf8' ) );
			config[ key ] = value;
			fs.writeFileSync( configPath, JSON.stringify( config ) );
			const result = await runPublish();
			expect( result.code ).not.toBe( 0 );
			expect( result.stderr ).toContain( message );
			expect( requests ).toHaveLength( 0 );
		} );
	}
} );
