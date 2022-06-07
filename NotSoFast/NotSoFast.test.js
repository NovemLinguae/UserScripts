function parseDate(str) {
	let dateTimeString = str.trim(); // example: 00:34, 5 March 2022
	dateTimeString = dateTimeString.replace(/(^.*), (.*)$/, '$2 $1');
	return Date.parse(dateTimeString);
}

describe('parseDate(str)', () => {
	test(`Special:NewPagesFeed date format as of 03/04/22 shouldn't return NaN`, () => {
		let str = `00:34, 5 March 2022`;
		expect(isNaN(parseDate(str))).toBe(false);
	});
});