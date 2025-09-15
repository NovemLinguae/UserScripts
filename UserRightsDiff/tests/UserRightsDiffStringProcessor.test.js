import { UserRightsDiffStringProcessor } from '../modules/UserRightsDiffStringProcessor.js';

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

const stringProcessor = new UserRightsDiffStringProcessor();

describe( 'deleteParenthesesAndTags(text)', () => {
	test( 'Basic', () => {
		const text = '10:21, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from confirmed user to IP block exempt (temporary, until 10:21, July 14, 2019) (+IPBE; pursuant to conditions at WP:IPEXEMPTCONDITIONS) (thank)';
		const output = '10:21, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from confirmed user to IP block exempt';
		expect( stringProcessor.deleteParenthesesAndTags( text ) ).toBe( output );
	} );

	test( 'Skip (none)', () => {
		const text = '10:21, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from (none) to IP block exempt (temporary, until 10:21, July 14, 2019) (+IPBE; pursuant to conditions at WP:IPEXEMPTCONDITIONS) (thank)';
		const output = '10:21, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from (none) to IP block exempt';
		expect( stringProcessor.deleteParenthesesAndTags( text ) ).toBe( output );
	} );

	test( 'Nested parentheses, touching the outside parentheses', () => {
		const text = '10:25, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from IP block exempt (temporary, until 10:21, July 14, 2019) and confirmed user to IP block exempt (temporary, until 10:21, July 14, 2019), confirmed user and extended confirmed user (+extendedconfirmed; pages that this bot edits (under Wikipedia:Bots/Requests for approval/ArbClerkBot)) (thank)';
		const output = '10:25, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from IP block exempt and confirmed user to IP block exempt, confirmed user and extended confirmed user';
		expect( stringProcessor.deleteParenthesesAndTags( text ) ).toBe( output );
	} );

	test( 'Nested parentheses, not touching the outside parentheses', () => {
		const text = '10:25, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from IP block exempt (temporary, until 10:21, July 14, 2019) and confirmed user to IP block exempt (temporary, until 10:21, July 14, 2019), confirmed user and extended confirmed user (+extendedconfirmed; pages that this bot edits (under Wikipedia:Bots/Requests for approval/ArbClerkBot) may from time to time have their protection levels increased) (thank)';
		const output = '10:25, April 14, 2019 AGK talk contribs changed group membership for ArbClerkBot from IP block exempt and confirmed user to IP block exempt, confirmed user and extended confirmed user';
		expect( stringProcessor.deleteParenthesesAndTags( text ) ).toBe( output );
	} );

	test( 'Tag 1', () => {
		const text = '10:52, December 11, 2021 Chemkatz talk contribs was automatically updated from (none) to extended confirmed user Tag: Visual edit (thank)';
		const output = '10:52, December 11, 2021 Chemkatz talk contribs was automatically updated from (none) to extended confirmed user';
		expect( stringProcessor.deleteParenthesesAndTags( text ) ).toBe( output );
	} );

	test( 'Tag 2', () => {
		const text = '06:22, December 11, 2021 IamSouravBiswas2000 talk contribs was automatically updated from (none) to extended confirmed user Tags: Mobile edit Mobile web edit Advanced mobile edit (thank)';
		const output = '06:22, December 11, 2021 IamSouravBiswas2000 talk contribs was automatically updated from (none) to extended confirmed user';
		expect( stringProcessor.deleteParenthesesAndTags( text ) ).toBe( output );
	} );

	test( 'Tag 3', () => {
		const text = '10:23, December 10, 2021 FiddleheadLady talk contribs was automatically updated from (none) to extended confirmed user Tag: 2017 wikitext editor (thank)';
		const output = '10:23, December 10, 2021 FiddleheadLady talk contribs was automatically updated from (none) to extended confirmed user';
		expect( stringProcessor.deleteParenthesesAndTags( text ) ).toBe( output );
	} );
} );
