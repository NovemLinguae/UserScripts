/* eslint-disable quotes, block-spacing, brace-style, max-statements-per-line */

import { UnblockReviewWikitext } from '../modules/UnblockReviewWikitext.js';
import { UnblockReviewWikitextLeftHalf } from '../modules/UnblockReviewWikitextLeftHalf.js';

const leftHalfFinder = new UnblockReviewWikitextLeftHalf( new UnblockReviewWikitext() );

describe( 'getLeftHalfOfUnblockTemplate( wikitext, appealReason )', () => {
	test( '{{unblock|reason=Your reason here }}', () => {
		const wikitext = `Test {{unblock|reason=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}} Test`;
		const appealReason = `Your reason here `;
		const expected = `{{unblock|reason=`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( '{{unblock |1=Your reason here }}', () => {
		const wikitext = `Test {{unblock |1=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}} Test`;
		const appealReason = `Your reason here `;
		const expected = `{{unblock |1=`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( '{{Unblock | Your reason here }}', () => {
		const wikitext = `Test {{Unblock | Your reason here }} Test`;
		const appealReason = `Your reason here `;
		const expected = `{{Unblock | `;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Start of page', () => {
		const wikitext = `{{Unblock | Your reason here }} Test
	`;
		const appealReason = `Your reason here `;
		const expected = `{{Unblock | `;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'End of page', () => {
		const wikitext = `Test {{Unblock | Your reason here }}
	`;
		const appealReason = `Your reason here `;
		const expected = `{{Unblock | `;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Only item on page', () => {
		const wikitext = `{{Unblock | Your reason here }}
	`;
		const appealReason = `Your reason here `;
		const expected = `{{Unblock | `;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( '{{tlx|unblock|Your reason here }} {{unblock|Your reason here }}', () => {
		const wikitext = `Test <!-- Copy the text as it appears on your page, not as it appears in this edit area. Do not include the "tlx|" code. -->{{tlx|unblock|2=reason=''Your reason here &#126;&#126;&#126;&#126;''}}. {{unblock|reason=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}} Test`;
		const appealReason = `Your reason here `;
		const expected = `{{unblock|reason=`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( '{{Unblock-un|Your reason here }}', () => {
		const wikitext = `Test {{Unblock-un|Your reason here }} Test`;
		const appealReason = `Your reason here `;
		const expected = `{{Unblock-un|`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( '{{Unblock-auto|Your reason here }}', () => {
		const wikitext = `Test {{Unblock-auto|Your reason here }} Test`;
		const appealReason = `Your reason here `;
		const expected = `{{Unblock-auto|`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( '{{Unblock-bot|Your reason here }}', () => {
		const wikitext = `Test {{Unblock-bot|Your reason here }} Test`;
		const appealReason = `Your reason here `;
		const expected = `{{Unblock-bot|`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( '{{Unblock-spamun|NewUsername|Your reason here }}', () => {
		const wikitext = `Test {{Unblock-spamun|NewUsername|Your reason here }} Test`;
		const reason = `Your reason here `;
		const expected = `{{Unblock-spamun|NewUsername|`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, reason ) ).toBe( expected );
	} );

	test( 'No target text', () => {
		const wikitext = `No target text`;
		const appealReason = `Your reason here `;
		expect( () => {leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( Error );
		expect( () => {leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( "Searching for target text failed" );
	} );

	test( 'No start of template', () => {
		const wikitext = `Test Your reason here Test`;
		const appealReason = `Your reason here `;
		expect( () => {leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( Error );
		expect( () => {leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( "Failed to find left half of unblock template in the wikicode" );
	} );

	test( 'Skip <nowiki>{{unblock}}', () => {
		const wikitext = `Test <code><nowiki>{{unblock|reason=Your reason here ~~~~}}</nowiki></code> Test`;
		const appealReason = `Your reason here `;
		expect( () => {leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( Error );
		expect( () => {leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( "Searching for target text failed" );
	} );

	test( '{{AAA}}AAAblock', () => {
		const wikitext =
`{{PAGENAME}}]]<!-- Template:Uw-soablock -->

:IP CDOs: An Encyclopedic Overview

:{{unblock|reason=IP CDOs: An Encyclopedic Overview}}
`;
		const appealReason = `IP CDOs: An Encyclopedic Overview`;
		const expected = `{{unblock|reason=`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( `Don't match {{unblock-spamun reviewed}}`, () => {
		const wikitext =
`{{unblock-spamun reviewed|Kadenwithacat|Test 1}}
{{unblock-spamun|Kadenwithacat|Test 2}}`;
		const appealReason = `Kadenwithacat`;
		const expected = `{{unblock-spamun|`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Reason wrapped in small tags with a piped link', () => {
		const wikitext =
`== Unblock please ==
{{unblock|reason=<small>The following request was written through the [[Wikipedia:Unblock wizard|unblock wizard]].</small>}}`;
		const appealReason = `The following request was written through the unblock wizard.`;
		const expected = `{{unblock|reason=`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Small tags inside the reason', () => {
		const wikitext = `{{unblock|reason=Please <SMALL class="note">review</SMALL> my appeal}}`;
		const appealReason = `Please review my appeal`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( `{{unblock|reason=` );
	} );

	test( 'Other tags and quoted attributes inside the reason', () => {
		const wikitext = `{{unblock|reason=<span title="1 > 0">Please <b>review</b> my appeal</span>}}`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, `Please review my appeal` ) ).toBe( `{{unblock|reason=` );
	} );

	test( 'Does not treat comparison text as a tag', () => {
		const wikitext = `{{unblock|reason=Please < 4 and > review}}`;
		expect( () => leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, `Please review` ) ).toThrow( 'Searching for target text failed' );
	} );

	test( 'Skip <small> tag inside <nowiki> tag', () => {
		const wikitext = `<nowiki>{{unblock|reason=<small>Appeal</small>}}</nowiki>\n{{unblock|reason=Appeal}}`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, `Appeal` ) ).toBe( `{{unblock|reason=` );
	} );

	test( 'Skip <nowiki>:{{unblock}}', () => {
		const wikitext = `Test <code><nowiki>:{{unblock|reason=Your reason here ~~~~}}</nowiki></code> Test`;
		const appealReason = `Your reason here `;
		expect( () => {leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( Error );
		expect( () => {leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( "Searching for target text failed" );
	} );

	test( 'Skip a multiline nowiki example before a real request', () => {
		const wikitext = `<NOWIKI>\n*:{{unblock|reason=Appeal}}</NOWIKI>\n<nowiki/>{{Unblock|1=Appeal}}`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, `Appeal` ) ).toBe( `{{Unblock|1=` );
	} );

	test( '{{unblock|reason={{u|331dot}} I am requesting a reconsideration of this block.}}', () => {
		// This test represents a real Wikipedia scenario where:
		// - Wikitext: {{unblock|reason={{u|331dot}} I am requesting a reconsideration of this block.}}
		// - HTML renders {{u|331dot}} as: <a rel="mw:WikiLink" href="...">331dot</a>
		// - The displayed text is: "331dot I am requesting a reconsideration of this block."
		// - But textContent extraction might only get "331dot" if not done carefully
		const wikitext = `{{unblock|reason={{u|331dot}} I am requesting a reconsideration of this block.}}`;
		// The appeal reason as extracted from HTML - should be the full visible text
		const appealReason = `331dot I am requesting a reconsideration of this block.`;
		const expected = `{{unblock|reason=`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Multiple template syntax variations with wiki markup', () => {
		// Test with different parameter styles
		const wikitext = `{{unblock|{{u|TestUser}} Please reconsider this block.}}`;
		const appealReason = `TestUser Please reconsider this block.`;
		const expected = `{{unblock|`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Reason with wikilink in middle', () => {
		const wikitext = `{{unblock|reason=I believe my [[User:Admin|appeal]] should be reconsidered.}}`;
		const appealReason = `I believe my appeal should be reconsidered.`;
		const expected = `{{unblock|reason=`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Matches colon-prefixed wikilinks', () => {
		const wikitext = `{{unblock|reason=See [[:fr:Example]] and [[:Category:Example|the category]].}}`;
		const appealReason = `See fr:Example and the category.`;
		const expected = `{{unblock|reason=`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Does not ignore visible text in a colon-prefixed wikilink', () => {
		const wikitext = `{{unblock|reason=See [[:fr:Example]] and [[:Category:Example|the category]].}}`;
		const appealReason = `See Example and the category.`;
		expect( () => leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toThrow( 'Searching for target text failed' );
	} );

	test( 'Does not ignore a literal closing bracket outside an external link', () => {
		const wikitext = `{{unblock|reason=See discussion] please.}}`;
		const appealReason = `See discussion please.`;
		const expectedError = 'Searching for target text failed';
		expect( () => leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toThrow( expectedError );
	} );

	test( 'Reason with multiple wikilinks and templates', () => {
		const wikitext = `{{unblock|reason={{u|Admin}} and [[User:Mod|moderator]] agree my block was a mistake.}}`;
		const appealReason = `Admin and moderator agree my block was a mistake.`;
		const expected = `{{unblock|reason=`;
		expect( leftHalfFinder.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );
} );
