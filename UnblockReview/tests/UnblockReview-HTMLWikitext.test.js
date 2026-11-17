/* eslint-disable quotes, block-spacing, brace-style, max-statements-per-line */

import { UnblockReview } from '../modules/UnblockReview.js';

// Test for handling mixed HTML and wikitext scenarios
// Specifically tests the case where HTML rendering includes tags that change
// the perceived text content vs. the actual wikitext.

const unblockReview = new UnblockReview();
const DEFAULT_DECLINE_REASON = `{{subst:Decline reason here}}`;

describe( 'UnblockReview - Mixed HTML/Wikitext scenarios', () => {
	test( '{{unblock|reason={{u|331dot}} I am requesting a reconsideration of this block.}}', () => {
		// This test represents a real Wikipedia scenario where:
		// - Wikitext: {{unblock|reason={{u|331dot}} I am requesting a reconsideration of this block.}}
		// - HTML renders {{u|331dot}} as: <a rel="mw:WikiLink" href="...">331dot</a>
		// - The displayed text is: "331dot I am requesting a reconsideration of this block."
		// - But textContent extraction might only get "331dot" if not done carefully
		
		const wikitext = `{{unblock|reason={{u|331dot}} I am requesting a reconsideration of this block.}}`;
		// The appeal reason as extracted from HTML - should be the full visible text
		const appealReason = `331dot I am requesting a reconsideration of this block.`;
		// When the pattern matches in wikitext, it will match starting at the {{u| since that's
		// where "331dot" appears in the wikitext. So the left half includes that.
		const expected = `{{unblock|reason={{u|`;
		
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Full workflow: accept with {{u|user}} link in reason', () => {
		const wikitext = `{{unblock|reason={{u|331dot}} I am requesting a reconsideration of this block.}}`;
		const paramsAndReason = `331dot I am requesting a reconsideration of this block.`;
		const acceptDeclineReason = `Looks good. ~~~~`;
		const acceptOrDecline = `accept`;
		
		const result = unblockReview.processAcceptOrDecline(
			wikitext,
			paramsAndReason,
			acceptDeclineReason,
			DEFAULT_DECLINE_REASON,
			acceptOrDecline
		);
		
		// Should replace the template with reviewed version
		expect( result ).toContain( '{{unblock reviewed|accept=' );
		expect( result ).not.toContain( '{{unblock|reason=' );
	} );

	test( 'Full workflow: decline with {{u|user}} link in reason', () => {
		const wikitext = `{{unblock|reason={{u|331dot}} I am requesting a reconsideration of this block.}}`;
		const paramsAndReason = `331dot I am requesting a reconsideration of this block.`;
		const acceptDeclineReason = `Not convincing. ~~~~`;
		const acceptOrDecline = `decline`;
		
		const result = unblockReview.processAcceptOrDecline(
			wikitext,
			paramsAndReason,
			acceptDeclineReason,
			DEFAULT_DECLINE_REASON,
			acceptOrDecline
		);
		
		// Should replace the template with reviewed version
		expect( result ).toContain( '{{unblock reviewed|decline=' );
		expect( result ).not.toContain( '{{unblock|reason=' );
	} );

	test( 'Multiple template syntax variations with wiki markup', () => {
		// Test with different parameter styles
		const wikitext = `{{unblock|{{u|TestUser}} Please reconsider this block.}}`;
		const appealReason = `TestUser Please reconsider this block.`;
		// The pattern matches starting at "TestUser" (position 14), which is inside the {{u|...}} template
		// So the left half includes everything from {{unblock| up to the start of the match
		const expected = `{{unblock|{{u|`;
		
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Reason with wikilink in middle', () => {
		const wikitext = `{{unblock|reason=I believe my [[User:Admin|appeal]] should be reconsidered.}}`;
		const appealReason = `I believe my appeal should be reconsidered.`;
		const expected = `{{unblock|reason=`;
		
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );

	test( 'Reason with multiple wikilinks and templates', () => {
		const wikitext = `{{unblock|reason={{u|Admin}} and [[User:Mod|moderator]] agree my block was a mistake.}}`;
		const appealReason = `Admin and moderator agree my block was a mistake.`;
		// Pattern matches starting at {{u|Admin}}, so the expected left half includes that
		const expected = `{{unblock|reason={{u|`;
		
		expect( unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason ) ).toBe( expected );
	} );
} );
