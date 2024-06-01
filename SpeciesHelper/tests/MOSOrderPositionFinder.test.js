import { MOSOrderPositionFinder } from '../modules/MOSOrderPositionFinder.js';

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

describe( 'getAllExistingSectionPositions(wikicode)', () => {
	test( 'simple', () => {
		const mopf = new MOSOrderPositionFinder();
		const wikicode =
`{{Short description|test}}

Lead

== First heading ==
Body

{{Navbox}}`;
		const output = {
			top: 0,
			shortDescription: 0,
			lead: 28,
			body: 34,
			navboxes: 60,
			bottom: 70
		};
		expect( mopf.getAllExistingSectionPositions( wikicode ) ).toStrictEqual( output );
	} );
} );

describe( 'getAllExistingSectionPositions(wikicode)', () => {
	test( 'bug involving putting HTML comments in the wrong place in AFC drafts', () => {
		const mopf = new MOSOrderPositionFinder();
		const wikicode =
`{{AfC Comment}}<!-- do not remove this line-->

Lead`;
		const needle = '{{Speciesbox}}';
		const section = 'infoboxes';
		const output =
`{{AfC Comment}}<!-- do not remove this line-->

{{Speciesbox}}

Lead`;
		expect( mopf.insertAtSection( wikicode, needle, section ) ).toStrictEqual( output );
	} );
} );

describe( 'getSectionPosition(wikicode, section)', () => {
	test( 'Valid section name', () => {
		const mopf = new MOSOrderPositionFinder();
		const section = 'notesAndReferences';
		const wikicode =
`{{Short description|test}}

Lead

== First heading ==
Body

{{Navbox}}`;
		const output = 60;
		expect( mopf.getSectionPosition( wikicode, section ) ).toEqual( output );
	} );

	test( 'Invalid section name', () => {
		const mopf = new MOSOrderPositionFinder();
		const section = 'references';
		const wikicode =
`{{Short description|test}}

Lead

== First heading ==
Body

{{Navbox}}`;
		expect( () => {
			mopf.getSectionPosition( wikicode, section );
		} ).toThrowError( 'MOSOrderPositionFinder: Invalid section name.' );
	} );
} );
