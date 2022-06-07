	/** Don't delete "(none)". Delete all other parentheses and tags. */
	function deleteParenthesesAndTags(text) {
		// delete all U+200E. this character shows up on watchlists, and causes an extra space if not deleted.
		text = text.replace("\u200E", '');
		// get rid of 2 layers of nested parentheses. will help with some edge cases.
		text = text.replace(/\([^()]*\([^()]*\)[^()]*\)/gs, '');
		// get rid of 1 layer of nested parentheses, except for (none)
		text = text.replace(/(?!\(none\))\(.*?\){1,}/gs, '');
		// remove Tag: and anything after it
		text = text.replace(/ Tags?:.*?$/, '');
		// cleanup so it's easier to write unit tests (output doesn't have extra spaces in it)
		text = text.replace(/ {2,}/gs, ' ');
		text = text.replace(/(\S) ,/gs, '$1,');
		text = text.trim();
		return text;
	}

describe('deleteParenthesesAndTags(text)', () => {
	test('Basic', () => {
		let text = `10:21, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from confirmed user to IP block exempt (temporary, until 10:21, July 14, 2019) (+IPBE; pursuant to conditions at WP:IPEXEMPTCONDITIONS) (thank)`;
		let output = `10:21, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from confirmed user to IP block exempt`;
		expect(deleteParenthesesAndTags(text)).toBe(output);
	});

	test('Skip (none)', () => {
		let text = `10:21, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from (none) to IP block exempt (temporary, until 10:21, July 14, 2019) (+IPBE; pursuant to conditions at WP:IPEXEMPTCONDITIONS) (thank)`;
		let output = `10:21, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from (none) to IP block exempt`;
		expect(deleteParenthesesAndTags(text)).toBe(output);
	});

	test('Nested parentheses, touching the outside parentheses', () => {
		let text = `10:25, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from IP block exempt (temporary, until 10:21, July 14, 2019) and confirmed user to IP block exempt (temporary, until 10:21, July 14, 2019), confirmed user and extended confirmed user (+extendedconfirmed; pages that this bot edits (under Wikipedia:Bots/Requests for approval/ArbClerkBot)) (thank)`;
		let output = `10:25, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from IP block exempt and confirmed user to IP block exempt, confirmed user and extended confirmed user`;
		expect(deleteParenthesesAndTags(text)).toBe(output);
	});

	test('Nested parentheses, not touching the outside parentheses', () => {
		let text = `10:25, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from IP block exempt (temporary, until 10:21, July 14, 2019) and confirmed user to IP block exempt (temporary, until 10:21, July 14, 2019), confirmed user and extended confirmed user (+extendedconfirmed; pages that this bot edits (under Wikipedia:Bots/Requests for approval/ArbClerkBot) may from time to time have their protection levels increased) (thank)`;
		let output = `10:25, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from IP block exempt and confirmed user to IP block exempt, confirmed user and extended confirmed user`;
		expect(deleteParenthesesAndTags(text)).toBe(output);
	});

	test('Tag 1', () => {
		let text = `10:52, December 11, 2021 Chemkatz talk contribs was automatically updated from (none) to extended confirmed user Tag: Visual edit (thank)`;
		let output = `10:52, December 11, 2021 Chemkatz talk contribs was automatically updated from (none) to extended confirmed user`;
		expect(deleteParenthesesAndTags(text)).toBe(output);
	});

	test('Tag 2', () => {
		let text = `06:22, December 11, 2021 IamSouravBiswas2000 talk contribs was automatically updated from (none) to extended confirmed user Tags: Mobile edit Mobile web edit Advanced mobile edit (thank)`;
		let output = `06:22, December 11, 2021 IamSouravBiswas2000 talk contribs was automatically updated from (none) to extended confirmed user`;
		expect(deleteParenthesesAndTags(text)).toBe(output);
	});

	test('Tag 3', () => {
		let text = `10:23, December 10, 2021 FiddleheadLady talk contribs was automatically updated from (none) to extended confirmed user Tag: 2017 wikitext editor (thank)`;
		let output = `10:23, December 10, 2021 FiddleheadLady talk contribs was automatically updated from (none) to extended confirmed user`;
		expect(deleteParenthesesAndTags(text)).toBe(output);
	});
});