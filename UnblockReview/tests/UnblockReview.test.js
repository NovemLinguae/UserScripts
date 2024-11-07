/* eslint-disable quotes, block-spacing, brace-style, max-statements-per-line */

import { UnblockReview } from '../modules/UnblockReview.js';

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

const unblockReview = new UnblockReview();
const DEFAULT_DECLINE_REASON = `{{subst:Decline reason here}}`;

describe( 'getLeftHalfOfUnblockTemplate( wikitext, appealReason )', () => {
	test( '{{unblock|reason=Your reason here }}', () => {
		const wikitext = `Test {{unblock|reason=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}} Test`;
		const appealReason = `Your reason here `;
		const expected = `{{unblock|reason=`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( '{{unblock |1=Your reason here }}', () => {
		const wikitext = `Test {{unblock |1=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}} Test`;
		const appealReason = `Your reason here `;
		const expected = `{{unblock |1=`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( '{{Unblock | Your reason here }}', () => {
		const wikitext = `Test {{Unblock | Your reason here }} Test`;
		const appealReason = `Your reason here `;
		const expected = `{{Unblock | `;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Start of page', () => {
		const wikitext = `{{Unblock | Your reason here }} Test
	`;
		const appealReason = `Your reason here `;
		const expected = `{{Unblock | `;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'End of page', () => {
		const wikitext = `Test {{Unblock | Your reason here }}
	`;
		const appealReason = `Your reason here `;
		const expected = `{{Unblock | `;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Only item on page', () => {
		const wikitext = `{{Unblock | Your reason here }}
	`;
		const appealReason = `Your reason here `;
		const expected = `{{Unblock | `;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( '{{tlx|unblock|Your reason here }} {{unblock|Your reason here }}', () => {
		const wikitext = `Test <!-- Copy the text as it appears on your page, not as it appears in this edit area. Do not include the "tlx|" code. -->{{tlx|unblock|2=reason=''Your reason here &#126;&#126;&#126;&#126;''}}. {{unblock|reason=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}} Test`;
		const appealReason = `Your reason here `;
		const expected = `{{unblock|reason=`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( '{{Unblock-un|Your reason here }}', () => {
		const wikitext = `Test {{Unblock-un|Your reason here }} Test`;
		const appealReason = `Your reason here `;
		const expected = `{{Unblock-un|`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( '{{Unblock-auto|Your reason here }}', () => {
		const wikitext = `Test {{Unblock-auto|Your reason here }} Test`;
		const appealReason = `Your reason here `;
		const expected = `{{Unblock-auto|`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( '{{Unblock-bot|Your reason here }}', () => {
		const wikitext = `Test {{Unblock-bot|Your reason here }} Test`;
		const appealReason = `Your reason here `;
		const expected = `{{Unblock-bot|`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'No target text', () => {
		const wikitext = `No target text`;
		const appealReason = `Your reason here `;
		expect( () => {unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( Error );
		expect( () => {unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( "Searching for target text failed!" );
	} );

	test( 'No start of template', () => {
		const wikitext = `Test Your reason here Test`;
		const appealReason = `Your reason here `;
		expect( () => {unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( Error );
		expect( () => {unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( "Searching backwards failed!" );
	} );
} );

describe( 'processAcceptOrDecline( wikitext, appealReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline )', () => {
	test( 'Normal', () => {
		const wikitext = `Test {{unblock|reason=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}} Test`;
		const appealReason = `Your reason here `;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected = `Test {{unblock reviewed|decline=Insufficient. ~~~~|1=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}} Test`;
		expect( unblockReview.processAcceptOrDecline( wikitext, appealReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Colon in front of {{Unblock}}', () => {
		const wikitext = `:{{unblock|reason=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}}`;
		const appealReason = `Your reason here `;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected = `{{unblock reviewed|decline=Insufficient. ~~~~|1=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, appealReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Bulleted list and colon in front of {{Unblock}}', () => {
		const wikitext = `*:{{unblock|reason=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}}`;
		const appealReason = `Your reason here `;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected = `{{unblock reviewed|decline=Insufficient. ~~~~|1=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, appealReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );
} );
