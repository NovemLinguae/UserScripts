import { StringFilter } from "../modules/StringFilter.js";

let sf = new StringFilter();

describe('_splitStringUsingMultiplePatterns(string, patterns)', () => {
	test('Blank string', () => {
		let string = ``;
		let patterns = ['<ref', '</ref>', '/>'];
		let output = [``];
		expect(sf._splitStringUsingMultiplePatterns(string, patterns)).toStrictEqual(output); // toStrictEqual for arrays
	});

	test('Zero <ref>s', () => {
		let string = `Hello. This is a test sentence. This is a test.`;
		let patterns = ['<ref', '</ref>', '/>'];
		let output = [`Hello. This is a test sentence. This is a test.`];
		expect(sf._splitStringUsingMultiplePatterns(string, patterns)).toStrictEqual(output); // toStrictEqual for arrays
	});

	test('One <ref>, in middle', () => {
		let string = `Hello. This is a test sentence. <ref>Test ref</ref>. This is a test.`;
		let patterns = ['<ref', '</ref>', '/>'];
		let output = [`Hello. This is a test sentence. `, `<ref>Test ref`, `</ref>. This is a test.`];
		expect(sf._splitStringUsingMultiplePatterns(string, patterns)).toStrictEqual(output); // toStrictEqual for arrays
	});

	test('One <ref>, at start', () => {
		let string = `<ref>Test ref</ref>. This is a test.`;
		let patterns = ['<ref', '</ref>', '/>'];
		let output = [`<ref>Test ref`, `</ref>. This is a test.`];
		expect(sf._splitStringUsingMultiplePatterns(string, patterns)).toStrictEqual(output); // toStrictEqual for arrays
	});

	test('One <ref>, at end', () => {
		let string = `Hello. This is a test sentence. <ref>Test ref</ref>`;
		let patterns = ['<ref', '</ref>', '/>'];
		let output = [`Hello. This is a test sentence. `, `<ref>Test ref`, `</ref>`];
		expect(sf._splitStringUsingMultiplePatterns(string, patterns)).toStrictEqual(output); // toStrictEqual for arrays
	});

	test('Two <ref>s', () => {
		let string = `Hello. This is a test sentence. <ref>Test ref</ref>. Test. <ref>Test ref</ref>. This is a test.`;
		let patterns = ['<ref', '</ref>', '/>'];
		let output = [`Hello. This is a test sentence. `, `<ref>Test ref`, `</ref>. Test. `, `<ref>Test ref`, `</ref>. This is a test.`];
		expect(sf._splitStringUsingMultiplePatterns(string, patterns)).toStrictEqual(output); // toStrictEqual for arrays
	});
});

describe('surgicalReplaceOutsideTags(regex, replacement, haystack, openingTags, closingTags)', () => {
	test('Basic', () => {
		let regex = /test/;
		let replacement = 'test2';
		let haystack = `Hello. This is a test sentence. <ref>test ref</ref>. test. <ref>test ref</ref>. This is a test.`;
		let openingTags = ['<ref'];
		let closingTags = ['</ref>', '/>'];
		let output = `Hello. This is a test2 sentence. <ref>test ref</ref>. test2. <ref>test ref</ref>. This is a test2.`;
		expect(sf.surgicalReplaceOutsideTags(regex, replacement, haystack, openingTags, closingTags)).toBe(output);
	});
});

describe('surgicalReplaceInsideTags(regex, replacement, haystack, openingTags, closingTags)', () => {
	test('Basic', () => {
		let regex = /test/;
		let replacement = 'test2';
		let haystack = `Hello. This is a test sentence. <ref>test ref</ref>. test. <ref>test ref</ref>. This is a test.`;
		let openingTags = ['<ref'];
		let closingTags = ['</ref>', '/>'];
		let output = `Hello. This is a test sentence. <ref>test2 ref</ref>. test. <ref>test2 ref</ref>. This is a test.`;
		expect(sf.surgicalReplaceInsideTags(regex, replacement, haystack, openingTags, closingTags)).toBe(output);
	});
});

// TODO: handle nesting