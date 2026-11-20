/* eslint-disable quotes, block-spacing, brace-style, max-statements-per-line */

import { UnblockReviewWikitext } from '../modules/UnblockReviewWikitext.js';

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

const unblockReview = new UnblockReviewWikitext();
const DEFAULT_DECLINE_REASON = `{{subst:Decline reason here}}`;

describe( 'processWaitForBlockingAdmin', () => {
	test.each( [
		[ '{{unblock|reason=Please reconsider [[Help:Appeal|this]] {{u|Example}}|category=}}', 'Please reconsider [[Help:Appeal|this]] {{u|Example}}' ],
		[ '{{unblock|1=Please reconsider|reason=Other reason}}', 'Please reconsider' ],
		[ '{{unblock|Please reconsider|category=}}', 'Please reconsider' ],
		[ '{{unblock|reason=Please reconsider <nowiki>a|b=c</nowiki>}}', 'Please reconsider <nowiki>a|b=c</nowiki>' ]
	] )( 'Preserves the original reason from %s', ( template, reason ) => {
		const result = unblockReview.processWaitForBlockingAdmin( template, 'Please reconsider', 'Admin' );
		expect( result ).toBe( `{{Unblock on hold|1=Admin|2=${ reason }|3=~~~~}}` );
	} );

	test( 'Allows a blank administrator and an unblock request without a reason', () => {
		expect( unblockReview.processWaitForBlockingAdmin(
			'{{Unblock}}', 'Please provide a reason as to why you should be unblocked', ''
		) ).toBe( '{{Unblock on hold|1=|2=|3=~~~~}}' );
	} );

	test( 'Rejects unsupported username requests and unsafe administrator names', () => {
		expect( () => unblockReview.processWaitForBlockingAdmin( '{{unblock-un|Alex|Please reconsider}}', 'Alex|Please reconsider', 'Admin', true ) )
			.toThrow( 'username requests' );
		expect( () => unblockReview.processWaitForBlockingAdmin( '{{unblock|Please reconsider}}', 'Please reconsider', 'Admin|3=Other' ) )
			.toThrow( 'Invalid blocking administrator' );
	} );

	test( 'Does not replace an ambiguous request', () => {
		expect( () => unblockReview.processWaitForBlockingAdmin(
			'{{unblock|reason=Please reconsider}}\n{{unblock|reason=Please reconsider}}', 'Please reconsider', 'Admin'
		) ).toThrow( 'Too many matching unblock templates found' );
	} );

	test( 'Does not consume a later template when a comment contains opening braces', () => {
		expect( () => unblockReview.processWaitForBlockingAdmin(
			'{{unblock|reason=Please reconsider <!-- {{ -->}}\n{{other}} }}', 'Please reconsider', 'Admin'
		) ).toThrow( 'Unable to parse the unblock reason' );
	} );
} );

describe( 'processRemoveHold', () => {
	test.each( [
		[ '{{Unblock on hold|1=Admin|2=Please [[Help:Appeal|reconsider]] {{u|Example}}|3=Signature}}',
			'Please reconsider Example', 'Please [[Help:Appeal|reconsider]] {{u|Example}}' ],
		[ '{{Unblock_on_hold|Admin|Please reconsider|Signature}}', 'Please reconsider', 'Please reconsider' ],
		[ '{{Unblock on hold|2=Other|reason=Please reconsider|1=Admin}}', 'Please reconsider', 'Please reconsider' ],
		[ '{{Unblock on hold|1=Admin|2=|3=Signature}}', '', '' ],
		[ '{{Unblock on hold|1=Admin|3=Signature}}', 'Please include the original unblock request.', '' ]
	] )( 'Restores the original reason from %s', ( template, rendered, reason ) => {
		expect( unblockReview.processRemoveHold( template, rendered ) ).toBe( '{{Unblock|reason=' + reason + '}}' );
	} );

	test( 'Ignores on-hold templates in nowiki and comments', () => {
		const wikitext = '<nowiki>{{Unblock on hold|1=A|2=Please reconsider|3=X}}</nowiki>\n' +
			'<!-- {{Unblock on hold|1=B|2=Please reconsider|3=X}} -->\n' +
			'{{Unblock on hold|1=C|2=Please reconsider|3=X}}';
		expect( unblockReview.processRemoveHold( wikitext, 'Please reconsider' ) ).toBe(
			'<nowiki>{{Unblock on hold|1=A|2=Please reconsider|3=X}}</nowiki>\n' +
			'<!-- {{Unblock on hold|1=B|2=Please reconsider|3=X}} -->\n{{Unblock|reason=Please reconsider}}'
		);
	} );

	test( 'Rejects ambiguous or missing matches', () => {
		const wikitext = '{{Unblock on hold|1=A|2=Please reconsider|3=X}}\n{{Unblock on hold|1=B|2=Please reconsider|3=Y}}';
		expect( () => unblockReview.processRemoveHold( wikitext, 'Please reconsider' ) ).toThrow( 'Too many matching' );
		expect( () => unblockReview.processRemoveHold( wikitext, 'Another reason' ) ).toThrow( 'Unable to find' );
		expect( () => unblockReview.processRemoveHold(
			'{{Unblock on hold|1=A|2=Please reconsider something else|3=X}}', 'Please reconsider'
		) ).toThrow( 'Unable to find' );
	} );
} );

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

	test( '{{Unblock-spamun|NewUsername|Your reason here }}', () => {
		const wikitext = `Test {{Unblock-spamun|NewUsername|Your reason here }} Test`;
		const reason = `Your reason here `;
		const expected = `{{Unblock-spamun|NewUsername|`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, reason ) ).toBe( expected );
	} );

	test( 'No target text', () => {
		const wikitext = `No target text`;
		const appealReason = `Your reason here `;
		expect( () => {unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( Error );
		expect( () => {unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( "Searching for target text failed" );
	} );

	test( 'No start of template', () => {
		const wikitext = `Test Your reason here Test`;
		const appealReason = `Your reason here `;
		expect( () => {unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( Error );
		expect( () => {unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( "Failed to find left half of unblock template in the wikicode" );
	} );

	test( 'Skip <nowiki>{{unblock}}', () => {
		const wikitext = `Test <code><nowiki>{{unblock|reason=Your reason here ~~~~}}</nowiki></code> Test`;
		const appealReason = `Your reason here `;
		expect( () => {unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( Error );
		expect( () => {unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( "Searching for target text failed" );
	} );

	test( '{{AAA}}AAAblock', () => {
		const wikitext =
`{{PAGENAME}}]]<!-- Template:Uw-soablock -->

:IP CDOs: An Encyclopedic Overview

:{{unblock|reason=IP CDOs: An Encyclopedic Overview}}
`;
		const appealReason = `IP CDOs: An Encyclopedic Overview`;
		const expected = `{{unblock|reason=`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( `Don't match {{unblock-spamun reviewed}}`, () => {
		const wikitext =
`{{unblock-spamun reviewed|Kadenwithacat|Test 1}}
{{unblock-spamun|Kadenwithacat|Test 2}}`;
		const appealReason = `Kadenwithacat`;
		const expected = `{{unblock-spamun|`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Reason wrapped in small tags with a piped link', () => {
		const wikitext =
`== Unblock please ==
{{unblock|reason=<small>The following request was written through the [[Wikipedia:Unblock wizard|unblock wizard]].</small>}}`;
		const appealReason = `The following request was written through the unblock wizard.`;
		const expected = `{{unblock|reason=`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Small tags inside the reason', () => {
		const wikitext = `{{unblock|reason=Please <SMALL class="note">review</SMALL> my appeal}}`;
		const appealReason = `Please review my appeal`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( `{{unblock|reason=` );
	} );

	test( 'Other tags and quoted attributes inside the reason', () => {
		const wikitext = `{{unblock|reason=<span title="1 > 0">Please <b>review</b> my appeal</span>}}`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, `Please review my appeal` ) ).toBe( `{{unblock|reason=` );
	} );

	test( 'Does not treat comparison text as a tag', () => {
		const wikitext = `{{unblock|reason=Please < 4 and > review}}`;
		expect( () => unblockReview.getLeftHalfOfUnblockTemplate( wikitext, `Please review` ) ).toThrow( 'Searching for target text failed' );
	} );

	test( 'Skip <small> tag inside <nowiki> tag', () => {
		const wikitext = `<nowiki>{{unblock|reason=<small>Appeal</small>}}</nowiki>\n{{unblock|reason=Appeal}}`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, `Appeal` ) ).toBe( `{{unblock|reason=` );
	} );

	test( 'Skip <nowiki>:{{unblock}}', () => {
		const wikitext = `Test <code><nowiki>:{{unblock|reason=Your reason here ~~~~}}</nowiki></code> Test`;
		const appealReason = `Your reason here `;
		expect( () => {unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( Error );
		expect( () => {unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( "Searching for target text failed" );
	} );

	test( 'Skip a multiline nowiki example before a real request', () => {
		const wikitext = `<NOWIKI>\n*:{{unblock|reason=Appeal}}</NOWIKI>\n<nowiki/>{{Unblock|1=Appeal}}`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, `Appeal` ) ).toBe( `{{Unblock|1=` );
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
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Multiple template syntax variations with wiki markup', () => {
		// Test with different parameter styles
		const wikitext = `{{unblock|{{u|TestUser}} Please reconsider this block.}}`;
		const appealReason = `TestUser Please reconsider this block.`;
		const expected = `{{unblock|`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Reason with wikilink in middle', () => {
		const wikitext = `{{unblock|reason=I believe my [[User:Admin|appeal]] should be reconsidered.}}`;
		const appealReason = `I believe my appeal should be reconsidered.`;
		const expected = `{{unblock|reason=`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Matches colon-prefixed wikilinks', () => {
		const wikitext = `{{unblock|reason=See [[:fr:Example]] and [[:Category:Example|the category]].}}`;
		const appealReason = `See fr:Example and the category.`;
		const expected = `{{unblock|reason=`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Does not ignore visible text in a colon-prefixed wikilink', () => {
		const wikitext = `{{unblock|reason=See [[:fr:Example]] and [[:Category:Example|the category]].}}`;
		const appealReason = `See Example and the category.`;
		expect( () => unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toThrow( 'Searching for target text failed' );
	} );

	test( 'Selects the request with the matching external-link label', () => {
		const wikitext = `{{unblock|reason=See [https://example.org/other other].}}\n{{unblock|reason=See [https://example.org/path?x=1&y=2 the discussion].}}`;
		const appealReason = `See the discussion.`;
		const differentAppealReason = `See a different discussion.`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const expected = `{{unblock|reason=See [https://example.org/other other].}}\n{{unblock reviewed|decline=Insufficient. ~~~~|1=See [https://example.org/path?x=1&y=2 the discussion].}}`;
		const expectedError = 'Searching for target text failed';
		expect( unblockReview.processAcceptOrDecline( wikitext, appealReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
		expect( () => unblockReview.processAcceptOrDecline( wikitext, differentAppealReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toThrow( expectedError );
	} );

	test( 'Does not ignore a literal closing bracket outside an external link', () => {
		const wikitext = `{{unblock|reason=See discussion] please.}}`;
		const appealReason = `See discussion please.`;
		const expectedError = 'Searching for target text failed';
		expect( () => unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toThrow( expectedError );
	} );

	test( 'Reason with multiple wikilinks and templates', () => {
		const wikitext = `{{unblock|reason={{u|Admin}} and [[User:Mod|moderator]] agree my block was a mistake.}}`;
		const appealReason = `Admin and moderator agree my block was a mistake.`;
		const expected = `{{unblock|reason=`;
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );
} );

describe( 'processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline )', () => {
	test( 'Declines a request with colon-prefixed wikilinks', () => {
		const wikitext = `{{unblock|reason=See [[:fr:Example]] and [[:Category:Example|the category]].}}`;
		const appealReason = `See fr:Example and the category.`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const expected = `{{unblock reviewed|decline=Insufficient. ~~~~|1=See [[:fr:Example]] and [[:Category:Example|the category]].}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, appealReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Normal', () => {
		const wikitext = `Test {{unblock|reason=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}} Test`;
		const paramsAndReason = `Your reason here `;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected = `Test {{unblock reviewed|decline=Insufficient. ~~~~|1=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}} Test`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Colon in front of {{Unblock}}', () => {
		const wikitext = `:{{unblock|reason=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}}`;
		const paramsAndReason = `Your reason here `;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected = `{{unblock reviewed|decline=Insufficient. ~~~~|1=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Colons in front of 2 {{Unblock}}', () => {
		const wikitext =
`:{{unblock|reason=Test1}}
:{{unblock|reason=Test2}}`;
		const paramsAndReason = `Test2`;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected =
`{{unblock|reason=Test1}}
{{unblock reviewed|decline=Insufficient. ~~~~|1=Test2}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Bulleted list and colon in front of {{Unblock}}', () => {
		const wikitext = `*:{{unblock|reason=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}}`;
		const paramsAndReason = `Your reason here `;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected = `{{unblock reviewed|decline=Insufficient. ~~~~|1=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'paramsAndReason contains a line break', () => {
		const wikitext =
`==Unblock request==

{{unblock|"Clearly not here to build an encyclopedia"

I would somewhat disagree with you there sir. [[User:Jean Zboncak|Jean Zboncak]] ([[User talk:Jean Zboncak#top|talk]]) 22:54, 30 October 2024 (UTC)}}
Seem’st thou thrive if he did banish thee, arm against thy quarrel.`;
		const paramsAndReason =
`"Clearly not here to build an encyclopedia"
I would somewhat disagree with you there sir. `;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected =
`==Unblock request==

{{unblock reviewed|decline=Insufficient. ~~~~|1="Clearly not here to build an encyclopedia"

I would somewhat disagree with you there sir. [[User:Jean Zboncak|Jean Zboncak]] ([[User talk:Jean Zboncak#top|talk]]) 22:54, 30 October 2024 (UTC)}}
Seem’st thou thrive if he did banish thee, arm against thy quarrel.`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Skip <nowiki>{{unblock}}', () => {
		const wikitext =
`<div class="user-block" style="padding: 5px; margin-bottom: 0.5em; border: 1px solid var(--border-color-base, #a2ab91); background-color: var(--background-color-warning-subtle, #fef6e7); color:inherit; min-height: 40px">[[File:Stop x nuvola.svg|40px|left|alt=Stop icon]]<div style="margin-left:45px">You have been '''[[WP:Blocking policy|blocked]]''' '''[[Wikipedia:Blocking_policy#Indefinite_blocks|indefinitely]]''' from editing for [[Wikipedia:Sockpuppetry|abusing multiple accounts]]. Note that multiple accounts are [[Wikipedia:Sockpuppetry#Legitimate uses|allowed]], but '''not for ''[[Wikipedia:Sockpuppetry#Inappropriate uses of alternative accounts|illegitimate]]'' reasons''', and any contributions made while evading blocks or bans  may be [[Wikipedia:Banning policy#Edits by and on behalf of banned editors|reverted]] or [[Wikipedia:Criteria for speedy deletion#G5|deleted]].   </div><div style="margin-left:45px">If you think there are good reasons for being unblocked, please review Wikipedia's [[WP:Guide to appealing blocks|guide to appealing blocks]], then add the following text to the bottom of your talk page: <!-- Copy the text as it appears on your page, not as it appears in this edit area. --><code><nowiki>{{unblock|reason=Your reason here ~~~~}}</nowiki></code>. &nbsp;[[User:Ponyo|<span style="color: Navy;">'''Ponyo'''</span>]]<sup>[[User talk:Ponyo|<span style="color: Navy;">''bons mots''</span>]]</sup> 18:18, 25 October 2024 (UTC)</div></div><!-- Template:uw-sockblock -->

{{unblock|reason=Your reason here [[User:Rathoremohanrathore|Rathoremohanrathore]] ([[User talk:Rathoremohanrathore#top|talk]]) 12:12, 30 October 2024 (UTC)}}
`;
		const paramsAndReason = `Your reason here `;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected =
`<div class="user-block" style="padding: 5px; margin-bottom: 0.5em; border: 1px solid var(--border-color-base, #a2ab91); background-color: var(--background-color-warning-subtle, #fef6e7); color:inherit; min-height: 40px">[[File:Stop x nuvola.svg|40px|left|alt=Stop icon]]<div style="margin-left:45px">You have been '''[[WP:Blocking policy|blocked]]''' '''[[Wikipedia:Blocking_policy#Indefinite_blocks|indefinitely]]''' from editing for [[Wikipedia:Sockpuppetry|abusing multiple accounts]]. Note that multiple accounts are [[Wikipedia:Sockpuppetry#Legitimate uses|allowed]], but '''not for ''[[Wikipedia:Sockpuppetry#Inappropriate uses of alternative accounts|illegitimate]]'' reasons''', and any contributions made while evading blocks or bans  may be [[Wikipedia:Banning policy#Edits by and on behalf of banned editors|reverted]] or [[Wikipedia:Criteria for speedy deletion#G5|deleted]].   </div><div style="margin-left:45px">If you think there are good reasons for being unblocked, please review Wikipedia's [[WP:Guide to appealing blocks|guide to appealing blocks]], then add the following text to the bottom of your talk page: <!-- Copy the text as it appears on your page, not as it appears in this edit area. --><code><nowiki>{{unblock|reason=Your reason here ~~~~}}</nowiki></code>. &nbsp;[[User:Ponyo|<span style="color: Navy;">'''Ponyo'''</span>]]<sup>[[User talk:Ponyo|<span style="color: Navy;">''bons mots''</span>]]</sup> 18:18, 25 October 2024 (UTC)</div></div><!-- Template:uw-sockblock -->

{{unblock reviewed|decline=Insufficient. ~~~~|1=Your reason here [[User:Rathoremohanrathore|Rathoremohanrathore]] ([[User talk:Rathoremohanrathore#top|talk]]) 12:12, 30 October 2024 (UTC)}}
`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Skip {{unblock reviewed}}', () => {
		const wikitext =
`{{unblock reviewed |1=Your reason here [[User:Rathoremohanrathore|Rathoremohanrathore]] ([[User talk:Rathoremohanrathore#top|talk]]) 12:06, 30 October 2024 (UTC) |decline = One open unblock request at a time, please. {{confirmed}} sockpuppetry to {{np|Lalmohanlal}}. You are now considered [[WP:CBAN|banned by the community]] under [[WP:3X]] due to your chronic [[WP:EVADE|block evasion]]. [[User:Yamla|Yamla]] ([[User talk:Yamla|talk]]) 12:10, 30 October 2024 (UTC)}}

{{unblock|reason=Your reason here [[User:Rathoremohanrathore|Rathoremohanrathore]] ([[User talk:Rathoremohanrathore#top|talk]]) 12:12, 30 October 2024 (UTC)}}
`;
		const paramsAndReason = `Your reason here `;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected =
`{{unblock reviewed |1=Your reason here [[User:Rathoremohanrathore|Rathoremohanrathore]] ([[User talk:Rathoremohanrathore#top|talk]]) 12:06, 30 October 2024 (UTC) |decline = One open unblock request at a time, please. {{confirmed}} sockpuppetry to {{np|Lalmohanlal}}. You are now considered [[WP:CBAN|banned by the community]] under [[WP:3X]] due to your chronic [[WP:EVADE|block evasion]]. [[User:Yamla|Yamla]] ([[User talk:Yamla|talk]]) 12:10, 30 October 2024 (UTC)}}

{{unblock reviewed|decline=Insufficient. ~~~~|1=Your reason here [[User:Rathoremohanrathore|Rathoremohanrathore]] ([[User talk:Rathoremohanrathore#top|talk]]) 12:12, 30 October 2024 (UTC)}}
`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Handle {{Unblock}} with no parameters', () => {
		const wikitext =
`{{unblock}} why
`;
		const paramsAndReason = `Please provide a reason as to why you should be unblocked.`;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected =
`{{unblock reviewed|decline=Insufficient. ~~~~|1=}} why
`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Handle {{Unblock-spamun}} without changing it to {{Unblock}}, and without erasing its NewUsername parameter', () => {
		const wikitext =
`{{unblock-spamun|AlexWhisker|Test}}
`;
		const paramsAndReason = `AlexWhisker|Test`;
		const acceptDeclineReason = `I accept. ~~~~`;
		const acceptOrDecline = `accept`;
		const expected =
`{{unblock-spamun reviewed|accept=I accept. ~~~~|AlexWhisker|2=Test}}
`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Preserve a space after the spam-unblock username', () => {
		const wikitext = `{{unblock-spamun|Alex| Test}}`;
		const paramsAndReason = `Alex|Test`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const hasUsernameParameter = true;
		const expected = `{{unblock-spamun reviewed|decline=Insufficient. ~~~~|Alex|2= Test}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline, hasUsernameParameter ) ).toBe( expected );
	} );

	test( 'Preserve a newline and tab after the spam-unblock username', () => {
		const wikitext = `{{unblock-spamun|Alex|\r\n\tTest}}`;
		const paramsAndReason = `Alex|Test`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const hasUsernameParameter = true;
		const expected = `{{unblock-spamun reviewed|decline=Insufficient. ~~~~|Alex|2=\r\n\tTest}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline, hasUsernameParameter ) ).toBe( expected );
	} );

	test( 'Reject multiple matching spam-unblock requests with different whitespace', () => {
		const wikitext = `{{unblock-spamun|Alex|Test}}\n{{unblock-spamun|Alex|\nTest}}`;
		const paramsAndReason = `Alex|Test`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const hasUsernameParameter = true;
		const expected = 'Too many matching unblock templates found';
		expect( () => unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline, hasUsernameParameter ) )
			.toThrow( expected );
	} );

	test( 'Preserve explicitly numbered parameters in an unblock-un request', () => {
		const wikitext = `{{Unblock-un|1=AleahP|2=Test}}`;
		const paramsAndReason = `AleahP|Test`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const hasUsernameParameter = true;
		const expected = `{{Unblock-un reviewed|decline=Insufficient. ~~~~|1=AleahP|2=Test}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline, hasUsernameParameter ) ).toBe( expected );
	} );

	test( 'Skip nowiki examples and preserve spaced named parameters', () => {
		const wikitext = `<nowiki>{{unblock-un|1=AleahP|reason=Test}}</nowiki>\n{{Unblock-un|1 = AleahP | reason = Test}}`;
		const paramsAndReason = `AleahP|Test`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const hasUsernameParameter = true;
		const expected = `<nowiki>{{unblock-un|1=AleahP|reason=Test}}</nowiki>\n{{Unblock-un reviewed|decline=Insufficient. ~~~~|1 = AleahP | reason = Test}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline, hasUsernameParameter ) ).toBe( expected );
	} );

	test( 'Reject matching username requests across both template types', () => {
		const wikitext = `{{unblock-un|1=AleahP|reason=Test}}\n{{unblock-spamun|AleahP|Test}}`;
		const paramsAndReason = `AleahP|Test`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const hasUsernameParameter = true;
		const expected = 'Too many matching unblock templates found';
		expect( () => unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline, hasUsernameParameter ) )
			.toThrow( expected );
	} );

	test( 'Preserve a decline reason containing a template parameter', () => {
		const wikitext = `{{unblock-un|1=AleahP|reason=Test}}`;
		const paramsAndReason = `AleahP|Test`;
		const acceptDeclineReason = `{{subst:Decline reason|1=Example}}`;
		const acceptOrDecline = `decline`;
		const hasUsernameParameter = true;
		const expected = `{{unblock-un reviewed|decline={{subst:Decline reason|1=Example}} ~~~~|1=AleahP|reason=Test}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline, hasUsernameParameter ) ).toBe( expected );
	} );

	test( 'Escape unbalanced template-closing braces in the reviewer reason by adding <nowiki/>', () => {
		const wikitext = `{{unblock|reason=I do not understand what instruction I am not following.}}`;
		const paramsAndReason = `I do not understand what instruction I am not following.`;
		const acceptDeclineReason = `Does it say to use {<nowiki/>{unblock'''-auto'''}} instead of {<nowiki/>{unblock}} (please note carefully the emphasis)?`;
		const expected = `{{unblock reviewed|decline=Does it say to use {<nowiki/>{unblock'''-auto'''}<nowiki/>} instead of {<nowiki/>{unblock}<nowiki/>} (please note carefully the emphasis)? ~~~~|1=I do not understand what instruction I am not following.}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, `decline` ) ).toBe( expected );
	} );

	test( 'Do not match text beyond the end of a username request', () => {
		const wikitext = `{{unblock-un|1=AleahP|reason=Test}} extra`;
		const paramsAndReason = `AleahP|Test extra`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const hasUsernameParameter = true;
		const expected = 'Replacing text with unblock message failed';
		expect( () => unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline, hasUsernameParameter ) )
			.toThrow( expected );
	} );

	test( 'Handle an unescaped equals sign (handle by making sure the parameter starts with 1= or 2=)', () => {
		const wikitext =
`{{unblock|1=I was blocked a few days ago for... <span style="font-family:'Courier New', monospace;">[[User:Test]]</span>}}`;
		const paramsAndReason = `I was blocked a few days ago for...`;
		const acceptDeclineReason = `Please use your other account.`;
		const acceptOrDecline = `decline`;
		const expected =
`{{unblock reviewed|decline=Please use your other account. ~~~~|1=I was blocked a few days ago for... <span style="font-family:'Courier New', monospace;">[[User:Test]]</span>}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Add {{subst:Decline reason here}} when declining with a blank reason', () => {
		const wikitext =
`{{unblock|1=I was blocked a few days ago for... <span style="font-family:'Courier New', monospace;">[[User:Test]]</span>}}`;
		const paramsAndReason = `I was blocked a few days ago for...`;
		const acceptDeclineReason = ``;
		const acceptOrDecline = `decline`;
		const expected =
`{{unblock reviewed|decline={{subst:Decline reason here}} ~~~~|1=I was blocked a few days ago for... <span style="font-family:'Courier New', monospace;">[[User:Test]]</span>}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( `Don't add {{subst:Decline reason here}} when accepting with a blank reason`, () => {
		const wikitext =
`{{unblock|1=I was blocked a few days ago for... <span style="font-family:'Courier New', monospace;">[[User:Test]]</span>}}`;
		const paramsAndReason = `I was blocked a few days ago for...`;
		const acceptDeclineReason = ``;
		const acceptOrDecline = `accept`;
		const expected =
`{{unblock reviewed|accept=~~~~|1=I was blocked a few days ago for... <span style="font-family:'Courier New', monospace;">[[User:Test]]</span>}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Preserve <tags> and piped links in the reviewed reason', () => {
		const wikitext = `{{unblock|reason=<small>The [[Wikipedia:Unblock wizard|unblock wizard]].</small>}}`;
		const appealReason = `The unblock wizard.`;
		const expected = `{{unblock reviewed|decline=Insufficient. ~~~~|1=<small>The [[Wikipedia:Unblock wizard|unblock wizard]].</small>}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, appealReason, `Insufficient.`, DEFAULT_DECLINE_REASON, `decline` ) ).toBe( expected );
	} );

	test( 'Preserve <tags> in the reviewed reason, and handle > and < characters by themselves', () => {
		const wikitext = `{{unblock|reason=<span title="1 > 0">Please <b>review</b> my appeal</span>}}`;
		const expected = `{{unblock reviewed|decline=Insufficient. ~~~~|1=<span title="1 > 0">Please <b>review</b> my appeal</span>}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, `Please review my appeal`, `Insufficient.`, DEFAULT_DECLINE_REASON, `decline` ) ).toBe( expected );
	} );

	test( '<nowiki> in front of {{Unblock}}', () => {
		const wikitext =
`<nowiki>{{unblock|reason=Test1}}</nowiki>
{{unblock|reason=Test1}}`;
		const paramsAndReason = `Test1`;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected =
`<nowiki>{{unblock|reason=Test1}}</nowiki>
{{unblock reviewed|decline=Insufficient. ~~~~|1=Test1}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( '<nowiki>: in front of {{Unblock}}', () => {
		const wikitext =
`<nowiki>:{{unblock|reason=Test1}}</nowiki>
{{unblock|reason=Test1}}`;
		const paramsAndReason = `Test1`;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected =
`<nowiki>:{{unblock|reason=Test1}}</nowiki>
{{unblock reviewed|decline=Insufficient. ~~~~|1=Test1}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Preserve indentation inside multiline nowiki while reviewing a request', () => {
		const wikitext = `<nowiki>\n:{{unblock|reason=Test1}}</nowiki>\n:{{unblock|reason=Test1}}`;
		const paramsAndReason = `Test1`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const expected = `<nowiki>\n:{{unblock|reason=Test1}}</nowiki>\n{{unblock reviewed|decline=Insufficient. ~~~~|1=Test1}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Match nowiki text within a real unblock reason', () => {
		const wikitext = `{{unblock|reason=<nowiki>Test1</nowiki>}}`;
		const paramsAndReason = `Test1`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const expected = `{{unblock reviewed|decline=Insufficient. ~~~~|1=<nowiki>Test1</nowiki>}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Skip nowiki examples when the real request has no reason', () => {
		const wikitext = `<nowiki>:{{UNBLOCK}}</nowiki>\n{{Unblock}}`;
		const paramsAndReason = `Please provide a reason as to why you should be unblocked`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const expected = `<nowiki>:{{UNBLOCK}}</nowiki>\n{{Unblock reviewed|decline=Insufficient. ~~~~|1=}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Reject multiple real requests despite a nowiki example', () => {
		const wikitext = `<nowiki>:{{unblock|reason=Test1}}</nowiki>\n{{unblock|reason=Test1}}\n{{unblock|reason=Test1}}`;
		const paramsAndReason = `Test1`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		expect( () => unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toThrow( 'Too many matching unblock templates found' );
	} );

	test( `Handle reason starting with '''`, () => {
		const wikitext =
`{{unblock|1='''Hello, Wikipedia'''.
<br>
I was blocked a few days ago for... [[User:Test]]}}`;
		const paramsAndReason = `Hello, Wikipedia`;
		const acceptDeclineReason = `Please use your other account.`;
		const acceptOrDecline = `decline`;
		const expected =
`{{unblock reviewed|decline=Please use your other account. ~~~~|1='''Hello, Wikipedia'''.
<br>
I was blocked a few days ago for... [[User:Test]]}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Preserve emphasis and literal apostrophes inside the reason', () => {
		const wikitext = `{{unblock|reason=I can't ''edit'' and '''need''' help}}`;
		const paramsAndReason = `I can't edit and need help`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const expected = `{{unblock reviewed|decline=Insufficient. ~~~~|1=I can't ''edit'' and '''need''' help}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Full workflow: accept with {{u|user}} link in reason', () => {
		const wikitext = `{{unblock|reason={{u|331dot}} I am requesting a reconsideration of this block.}}`;
		const paramsAndReason = `331dot I am requesting a reconsideration of this block.`;
		const acceptDeclineReason = `Looks good. ~~~~`;
		const acceptOrDecline = `accept`;
		const expected = '{{unblock reviewed|accept=Looks good. ~~~~|1=331dot I am requesting a reconsideration of this block.}}';
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Full workflow: decline with {{u|user}} link in reason', () => {
		const wikitext = `{{unblock|reason={{u|331dot}} I am requesting a reconsideration of this block.}}`;
		const paramsAndReason = `331dot I am requesting a reconsideration of this block.`;
		const acceptDeclineReason = DEFAULT_DECLINE_REASON;
		const acceptOrDecline = `decline`;
		const expected = '{{unblock reviewed|decline={{subst:Decline reason here}} ~~~~|1=331dot I am requesting a reconsideration of this block.}}';
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'A user link at the end of the matched text keeps the remainder of the reason', () => {
		const wikitext = `{{unblock|reason={{u|331dot}} and more text.}}`;
		const paramsAndReason = `331dot`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const expected = `{{unblock reviewed|decline=Insufficient. ~~~~|1=331dot and more text.}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Declines a positional reason beginning with a user link', () => {
		const wikitext = `{{unblock|{{u|331dot}} Please reconsider.}}`;
		const paramsAndReason = `331dot Please reconsider.`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const expected = `{{unblock reviewed|decline=Insufficient. ~~~~|1=331dot Please reconsider.}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Preserve a user template in the middle of an appeal reason', () => {
		const wikitext = `{{unblock|reason=Please {{u|331dot}} reconsider.}}`;
		const paramsAndReason = `Please 331dot reconsider.`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const expected = `{{unblock reviewed|decline=Insufficient. ~~~~|1=Please {{u|331dot}} reconsider.}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Does not assume another template renders its argument as a user link', () => {
		const wikitext = `{{unblock|reason={{other|331dot}} I am requesting reconsideration.}}`;
		const paramsAndReason = `331dot I am requesting reconsideration.`;
		const acceptDeclineReason = `Insufficient.`;
		const acceptOrDecline = `decline`;
		const expectedError = 'Unable to safely match the nested template in the unblock reason';
		expect( () => unblockReview.processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toThrow( expectedError );
	} );
} );

describe( 'hasSignature( text )', () => {
	test( 'No signature', () => {
		const text = `Testing 123`;
		const expected = false;
		expect( unblockReview.hasSignature( text ) ).toBe( expected );
	} );

	test( 'Signature', () => {
		const text = `Testing 123. ~~~~`;
		const expected = true;
		expect( unblockReview.hasSignature( text ) ).toBe( expected );
	} );

	test( 'Signature inside of <nowiki> tags', () => {
		const text = `Testing 123. <nowiki>~~~~</nowiki>`;
		const expected = false;
		expect( unblockReview.hasSignature( text ) ).toBe( expected );
	} );

	test( 'Signature inside of <nowiki> tags and outside of nowiki tags', () => {
		const text = `Testing 123. <nowiki>~~~~</nowiki> ~~~~`;
		const expected = true;
		expect( unblockReview.hasSignature( text ) ).toBe( expected );
	} );
} );
