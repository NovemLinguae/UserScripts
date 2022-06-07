import * as functions from "../modules/functions.js";

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

describe('isGASubPage(title)', () => {
	test('capitalized, single digit', () => {
		let title = `Talk:Sora Amamiya/GA2`;
		let output = true;
		expect(functions.isGASubPage(title)).toBe(output);
	});

	test('capitalized, double digits', () => {
		let title = `Talk:Sora Amamiya/GA21`;
		let output = true;
		expect(functions.isGASubPage(title)).toBe(output);
	});

	test('subpage of GA page', () => {
		let title = `Talk:Sora Amamiya/GA2/test`;
		let output = false;
		expect(functions.isGASubPage(title)).toBe(output);
	});

	test('talk page', () => {
		let title = `Talk:Sora Amamiya`;
		let output = false;
		expect(functions.isGASubPage(title)).toBe(output);
	});

	test('main article', () => {
		let title = `Sora Amamiya`;
		let output = false;
		expect(functions.isGASubPage(title)).toBe(output);
	});

	test('lowercase', () => {
		let title = `Talk:Sora Amamiya/ga2`;
		let output = false;
		expect(functions.isGASubPage(title)).toBe(output);
	});
});

describe('getGATitle(title)', () => {
	test('talk and subpage', () => {
		let title = `Talk:Sora_Amamiya/GA2`;
		let output = 'Sora Amamiya';
		expect(functions.getGATitle(title)).toBe(output);
	});

	test('talk page', () => {
		let title = `Talk:Sora_Amamiya`;
		let output = 'Sora Amamiya';
		expect(functions.getGATitle(title)).toBe(output);
	});

	test('user page', () => {
		let title = `User:Novem_Linguae/sandbox`;
		let output = 'User:Novem Linguae';
		expect(functions.getGATitle(title)).toBe(output);
	});

	test('article itself', () => {
		let title = `Sora_Amamiya`;
		let output = 'Sora Amamiya';
		expect(functions.getGATitle(title)).toBe(output);
	});

	test('no underscores', () => {
		let title = `Sora_Amamiya`;
		let output = 'Sora Amamiya';
		expect(functions.getGATitle(title)).toBe(output);
	});
});

describe('escapeHtml(unsafe)', () => {
	test('Test', () => {
		let unsafe = `Test`;
		let output = 'Test';
		expect(functions.escapeHtml(unsafe)).toBe(output);
	});

	test(`"&<>`, () => {
		let unsafe = `"&<>`;
		let output = '&quot;&amp;&lt;&gt;';
		expect(functions.escapeHtml(unsafe)).toBe(output);
	});
});

describe('getGATalkTitle(gaTitle)', () => {
	test('mainspace', () => {
		let gaTitle = `Sora Amamiya`;
		let output = 'Talk:Sora Amamiya';
		expect(functions.getGATalkTitle(gaTitle)).toBe(output);
	});

	test('userspace', () => {
		let gaTitle = `User:Novem Linguae`;
		let output = 'User talk:Novem Linguae';
		expect(functions.getGATalkTitle(gaTitle)).toBe(output);
	});

	test('two colons', () => {
		let gaTitle = `User:Novem Linguae:test`;
		let output = 'User talk:Novem Linguae:test';
		expect(functions.getGATalkTitle(gaTitle)).toBe(output);
	});
});