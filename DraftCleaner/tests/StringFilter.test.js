import { StringFilter } from '../modules/StringFilter.js';

const sf = new StringFilter();

describe( '_splitStringUsingMultiplePatterns(string, patterns)', () => {
	test( 'Blank string', () => {
		const string = '';
		const patterns = [ '<ref', '</ref>', '/>' ];
		const output = [ '' ];
		expect( sf._splitStringUsingMultiplePatterns( string, patterns ) ).toStrictEqual( output ); // toStrictEqual for arrays
	} );

	test( 'Zero <ref>s', () => {
		const string = 'Hello. This is a test sentence. This is a test.';
		const patterns = [ '<ref', '</ref>', '/>' ];
		const output = [ 'Hello. This is a test sentence. This is a test.' ];
		expect( sf._splitStringUsingMultiplePatterns( string, patterns ) ).toStrictEqual( output ); // toStrictEqual for arrays
	} );

	test( 'One <ref>, in middle', () => {
		const string = 'Hello. This is a test sentence. <ref>Test ref</ref>. This is a test.';
		const patterns = [ '<ref', '</ref>', '/>' ];
		const output = [ 'Hello. This is a test sentence. ', '<ref>Test ref', '</ref>. This is a test.' ];
		expect( sf._splitStringUsingMultiplePatterns( string, patterns ) ).toStrictEqual( output ); // toStrictEqual for arrays
	} );

	test( 'One <ref>, at start', () => {
		const string = '<ref>Test ref</ref>. This is a test.';
		const patterns = [ '<ref', '</ref>', '/>' ];
		const output = [ '<ref>Test ref', '</ref>. This is a test.' ];
		expect( sf._splitStringUsingMultiplePatterns( string, patterns ) ).toStrictEqual( output ); // toStrictEqual for arrays
	} );

	test( 'One <ref>, at end', () => {
		const string = 'Hello. This is a test sentence. <ref>Test ref</ref>';
		const patterns = [ '<ref', '</ref>', '/>' ];
		const output = [ 'Hello. This is a test sentence. ', '<ref>Test ref', '</ref>' ];
		expect( sf._splitStringUsingMultiplePatterns( string, patterns ) ).toStrictEqual( output ); // toStrictEqual for arrays
	} );

	test( 'Two <ref>s', () => {
		const string = 'Hello. This is a test sentence. <ref>Test ref</ref>. Test. <ref>Test ref</ref>. This is a test.';
		const patterns = [ '<ref', '</ref>', '/>' ];
		const output = [ 'Hello. This is a test sentence. ', '<ref>Test ref', '</ref>. Test. ', '<ref>Test ref', '</ref>. This is a test.' ];
		expect( sf._splitStringUsingMultiplePatterns( string, patterns ) ).toStrictEqual( output ); // toStrictEqual for arrays
	} );
} );

describe( 'surgicalReplaceOutsideTags(regex, replacement, haystack, openingTags, closingTags)', () => {
	test( 'Basic', () => {
		const regex = /test/;
		const replacement = 'test2';
		const haystack = 'Hello. This is a test sentence. <ref>test ref</ref>. test. <ref>test ref</ref>. This is a test.';
		const openingTags = [ '<ref' ];
		const closingTags = [ '</ref>', '/>' ];
		const output = 'Hello. This is a test2 sentence. <ref>test ref</ref>. test2. <ref>test ref</ref>. This is a test2.';
		expect( sf.surgicalReplaceOutsideTags( regex, replacement, haystack, openingTags, closingTags ) ).toBe( output );
	} );
} );

describe( 'surgicalReplaceInsideTags(regex, replacement, haystack, openingTags, closingTags)', () => {
	test( 'Basic', () => {
		const regex = /test/;
		const replacement = 'test2';
		const haystack = 'Hello. This is a test sentence. <ref>test ref</ref>. test. <ref>test ref</ref>. This is a test.';
		const openingTags = [ '<ref' ];
		const closingTags = [ '</ref>', '/>' ];
		const output = 'Hello. This is a test sentence. <ref>test2 ref</ref>. test. <ref>test2 ref</ref>. This is a test.';
		expect( sf.surgicalReplaceInsideTags( regex, replacement, haystack, openingTags, closingTags ) ).toBe( output );
	} );
} );

// TODO: handle nesting
