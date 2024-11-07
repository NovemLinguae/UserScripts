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

	test( 'Skip <nowiki>{{unblock}}', () => {
		const wikitext = `Test <code><nowiki>{{unblock|reason=Your reason here ~~~~}}</nowiki></code> Test`;
		const appealReason = `Your reason here `;
		expect( () => {unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( Error );
		expect( () => {unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );} ).toThrow( "Searching for target text failed!" );
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

	test( 'appealReason contains a line break', () => {
		const wikitext =
`==Unblock request==

{{unblock|"Clearly not here to build an encyclopedia"

I would somewhat disagree with you there sir. [[User:Jean Zboncak|Jean Zboncak]] ([[User talk:Jean Zboncak#top|talk]]) 22:54, 30 October 2024 (UTC)}}
Seem’st thou thrive if he did banish thee, arm against thy quarrel.`;
		const appealReason =
`"Clearly not here to build an encyclopedia"
I would somewhat disagree with you there sir. `;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected =
`==Unblock request==
{{unblock reviewed|decline=Insufficient. ~~~~|1="Clearly not here to build an encyclopedia"

I would somewhat disagree with you there sir. [[User:Jean Zboncak|Jean Zboncak]] ([[User talk:Jean Zboncak#top|talk]]) 22:54, 30 October 2024 (UTC)}}
Seem’st thou thrive if he did banish thee, arm against thy quarrel.`;
		expect( unblockReview.processAcceptOrDecline( wikitext, appealReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Skip <nowiki>{{unblock}}', () => {
		const wikitext =
`<div class="user-block" style="padding: 5px; margin-bottom: 0.5em; border: 1px solid var(--border-color-base, #a2ab91); background-color: var(--background-color-warning-subtle, #fef6e7); color:inherit; min-height: 40px">[[File:Stop x nuvola.svg|40px|left|alt=Stop icon]]<div style="margin-left:45px">You have been '''[[WP:Blocking policy|blocked]]''' '''[[Wikipedia:Blocking_policy#Indefinite_blocks|indefinitely]]''' from editing for [[Wikipedia:Sockpuppetry|abusing multiple accounts]]. Note that multiple accounts are [[Wikipedia:Sockpuppetry#Legitimate uses|allowed]], but '''not for ''[[Wikipedia:Sockpuppetry#Inappropriate uses of alternative accounts|illegitimate]]'' reasons''', and any contributions made while evading blocks or bans  may be [[Wikipedia:Banning policy#Edits by and on behalf of banned editors|reverted]] or [[Wikipedia:Criteria for speedy deletion#G5|deleted]].   </div><div style="margin-left:45px">If you think there are good reasons for being unblocked, please review Wikipedia's [[WP:Guide to appealing blocks|guide to appealing blocks]], then add the following text to the bottom of your talk page: <!-- Copy the text as it appears on your page, not as it appears in this edit area. --><code><nowiki>{{unblock|reason=Your reason here ~~~~}}</nowiki></code>. &nbsp;[[User:Ponyo|<span style="color: Navy;">'''Ponyo'''</span>]]<sup>[[User talk:Ponyo|<span style="color: Navy;">''bons mots''</span>]]</sup> 18:18, 25 October 2024 (UTC)</div></div><!-- Template:uw-sockblock -->

{{unblock|reason=Your reason here [[User:Rathoremohanrathore|Rathoremohanrathore]] ([[User talk:Rathoremohanrathore#top|talk]]) 12:12, 30 October 2024 (UTC)}}
`;
		const appealReason = `Your reason here `;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected =
`<div class="user-block" style="padding: 5px; margin-bottom: 0.5em; border: 1px solid var(--border-color-base, #a2ab91); background-color: var(--background-color-warning-subtle, #fef6e7); color:inherit; min-height: 40px">[[File:Stop x nuvola.svg|40px|left|alt=Stop icon]]<div style="margin-left:45px">You have been '''[[WP:Blocking policy|blocked]]''' '''[[Wikipedia:Blocking_policy#Indefinite_blocks|indefinitely]]''' from editing for [[Wikipedia:Sockpuppetry|abusing multiple accounts]]. Note that multiple accounts are [[Wikipedia:Sockpuppetry#Legitimate uses|allowed]], but '''not for ''[[Wikipedia:Sockpuppetry#Inappropriate uses of alternative accounts|illegitimate]]'' reasons''', and any contributions made while evading blocks or bans  may be [[Wikipedia:Banning policy#Edits by and on behalf of banned editors|reverted]] or [[Wikipedia:Criteria for speedy deletion#G5|deleted]].   </div><div style="margin-left:45px">If you think there are good reasons for being unblocked, please review Wikipedia's [[WP:Guide to appealing blocks|guide to appealing blocks]], then add the following text to the bottom of your talk page: <!-- Copy the text as it appears on your page, not as it appears in this edit area. --><code><nowiki>{{unblock|reason=Your reason here ~~~~}}</nowiki></code>. &nbsp;[[User:Ponyo|<span style="color: Navy;">'''Ponyo'''</span>]]<sup>[[User talk:Ponyo|<span style="color: Navy;">''bons mots''</span>]]</sup> 18:18, 25 October 2024 (UTC)</div></div><!-- Template:uw-sockblock -->
{{unblock reviewed|decline=Insufficient. ~~~~|1=Your reason here [[User:Rathoremohanrathore|Rathoremohanrathore]] ([[User talk:Rathoremohanrathore#top|talk]]) 12:12, 30 October 2024 (UTC)}}
`;
		expect( unblockReview.processAcceptOrDecline( wikitext, appealReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );

	test( 'Skip {{unblock reviewed}}', () => {
		const wikitext =
`{{unblock reviewed |1=Your reason here [[User:Rathoremohanrathore|Rathoremohanrathore]] ([[User talk:Rathoremohanrathore#top|talk]]) 12:06, 30 October 2024 (UTC) |decline = One open unblock request at a time, please. {{confirmed}} sockpuppetry to {{np|Lalmohanlal}}. You are now considered [[WP:CBAN|banned by the community]] under [[WP:3X]] due to your chronic [[WP:EVADE|block evasion]]. [[User:Yamla|Yamla]] ([[User talk:Yamla|talk]]) 12:10, 30 October 2024 (UTC)}}

{{unblock|reason=Your reason here [[User:Rathoremohanrathore|Rathoremohanrathore]] ([[User talk:Rathoremohanrathore#top|talk]]) 12:12, 30 October 2024 (UTC)}}
`;
		const appealReason = `Your reason here `;
		const acceptDeclineReason = `Insufficient. ~~~~`;
		const acceptOrDecline = `decline`;
		const expected =
`{{unblock reviewed |1=Your reason here [[User:Rathoremohanrathore|Rathoremohanrathore]] ([[User talk:Rathoremohanrathore#top|talk]]) 12:06, 30 October 2024 (UTC) |decline = One open unblock request at a time, please. {{confirmed}} sockpuppetry to {{np|Lalmohanlal}}. You are now considered [[WP:CBAN|banned by the community]] under [[WP:3X]] due to your chronic [[WP:EVADE|block evasion]]. [[User:Yamla|Yamla]] ([[User talk:Yamla|talk]]) 12:10, 30 October 2024 (UTC)}}
{{unblock reviewed|decline=Insufficient. ~~~~|1=Your reason here [[User:Rathoremohanrathore|Rathoremohanrathore]] ([[User talk:Rathoremohanrathore#top|talk]]) 12:12, 30 October 2024 (UTC)}}
`;
		expect( unblockReview.processAcceptOrDecline( wikitext, appealReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) ).toBe( expected );
	} );
} );
