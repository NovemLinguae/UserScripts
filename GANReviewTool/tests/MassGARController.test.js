const { MassGARController } = require("../modules/MassGARController.js");

let c;
beforeEach(() => {
	c = new MassGARController();
});

describe('getNextUnusedGASubpageTitle(listOfPages, mainArticleTitle)', () => {
	it(`Should handle 0 GA subpages`, () => {
		let listOfPages = [];
		let mainArticleTitle = 'William Morrison (chemist)';
		let output = 'Talk:William Morrison (chemist)/GA1';
		expect(c.getNextUnusedGASubpageTitle(listOfPages, mainArticleTitle)).toBe(output);
	});

	it(`Should handle 1 GA subpages`, () => {
		let listOfPages = ['Talk:William Morrison (chemist)/GA1'];
		let mainArticleTitle = 'William Morrison (chemist)';
		let output = 'Talk:William Morrison (chemist)/GA2';
		expect(c.getNextUnusedGASubpageTitle(listOfPages, mainArticleTitle)).toBe(output);
	});

	it(`Should handle 2 GA subpages`, () => {
		let listOfPages = ['Talk:William Morrison (chemist)/GA1', 'Talk:William Morrison (chemist)/GA2'];
		let mainArticleTitle = 'William Morrison (chemist)';
		let output = 'Talk:William Morrison (chemist)/GA3';
		expect(c.getNextUnusedGASubpageTitle(listOfPages, mainArticleTitle)).toBe(output);
	});

	it(`Should handle main page with numbers in it`, () => {
		let listOfPages = ['1836 U.S. Patent Office fire/GA1'];
		let mainArticleTitle = '1836 U.S. Patent Office fire';
		let output = 'Talk:1836 U.S. Patent Office fire/GA2';
		expect(c.getNextUnusedGASubpageTitle(listOfPages, mainArticleTitle)).toBe(output);
	});

	it(`Should sort numerically, not lexographically`, () => {
		let listOfPages = ['1', '10', '2'];
		let mainArticleTitle = 'William Morrison (chemist)';
		let output = 'Talk:William Morrison (chemist)/GA11';
		expect(c.getNextUnusedGASubpageTitle(listOfPages, mainArticleTitle)).toBe(output);
	});
});