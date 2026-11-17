/** @jest-environment jsdom */
/* eslint-disable quotes, block-spacing, brace-style, max-statements-per-line */

import { UnblockReview } from '../modules/UnblockReview.js';
import { readFileSync } from 'fs';

// Test for handling mixed HTML and wikitext scenarios
// Specifically tests the case where HTML rendering includes tags that change
// the perceived text content vs. the actual wikitext.

const unblockReview = new UnblockReview();
const DEFAULT_DECLINE_REASON = `{{subst:Decline reason here}}`;

describe( 'UnblockReview - Mixed HTML/Wikitext scenarios', () => {
	test( 'Clicking decline reads all rendered reason text and saves the reviewed request', async () => {
		const wikitext = `{{unblock|reason={{u|331dot}} I am requesting a reconsideration of this block.}}`;
		document.body.innerHTML = `<div class="user-block" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><div></div><div><a href="/wiki/User:331dot">331dot</a> I am requesting a reconsideration of this block.</div>
		</div>`;

		let ready;
		let clickHandler;
		const $ = ( element ) => {
			if ( typeof element === 'function' ) {
				ready = element;
				return;
			}
			return {
				find: ( selector ) => ( {
					on: ( event, handler ) => {
						if ( selector === 'button' && event === 'click' ) {
							clickHandler = handler;
						}
					}
				} ),
				text: () => element.textContent
			};
		};
		const postWithToken = jest.fn().mockResolvedValue( {} );
		const mw = {
			config: { get: ( key ) => ( { wgNamespaceNumber: 3, wgPageName: 'User_talk:Example' } )[ key ] },
			loader: { using: () => Promise.resolve() },
			util: { addCSS: jest.fn() },
			Api: function () {
				this.get = jest.fn().mockResolvedValue( { query: { pages: { 1: { revisions: [ { '*': wikitext } ] } } } } );
				this.postWithToken = postWithToken;
			},
			notify: jest.fn()
		};
		const windowMock = { location: { reload: jest.fn() } };
		// eslint-disable-next-line no-new-func
		const runMain = new Function( 'mw', '$', 'UnblockReview', 'document', 'window', readFileSync( require.resolve( '../main.js' ), 'utf8' ) );
		runMain( mw, $, UnblockReview, document, windowMock );
		await ready();
		await clickHandler.call( document.querySelector( '.unblock-review-decline' ) );

		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			text: `{{unblock reviewed|decline={{subst:Decline reason here}} ~~~~|1=331dot I am requesting a reconsideration of this block.}}`
		} ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
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
		
		expect( result ).toBe( '{{unblock reviewed|accept=Looks good. ~~~~|1=331dot I am requesting a reconsideration of this block.}}' );
	} );

	test( 'Full workflow: decline with {{u|user}} link in reason', () => {
		const wikitext = `{{unblock|reason={{u|331dot}} I am requesting a reconsideration of this block.}}`;
		const paramsAndReason = `331dot I am requesting a reconsideration of this block.`;
		const acceptDeclineReason = DEFAULT_DECLINE_REASON;
		const acceptOrDecline = `decline`;
		
		const result = unblockReview.processAcceptOrDecline(
			wikitext,
			paramsAndReason,
			acceptDeclineReason,
			DEFAULT_DECLINE_REASON,
			acceptOrDecline
		);
		
		expect( result ).toBe( '{{unblock reviewed|decline={{subst:Decline reason here}} ~~~~|1=331dot I am requesting a reconsideration of this block.}}' );
	} );

	test( 'A user link at the end of the matched text keeps the remainder of the reason', () => {
		const wikitext = `{{unblock|reason={{u|331dot}} and more text.}}`;
		const expected = `{{unblock reviewed|decline=Insufficient. ~~~~|1=331dot and more text.}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, `331dot`, `Insufficient.`, DEFAULT_DECLINE_REASON, `decline` ) ).toBe( expected );
	} );

	test( 'Declines a positional reason beginning with a user link', () => {
		const wikitext = `{{unblock|{{u|331dot}} Please reconsider.}}`;
		const expected = `{{unblock reviewed|decline=Insufficient. ~~~~|1=331dot Please reconsider.}}`;
		expect( unblockReview.processAcceptOrDecline( wikitext, `331dot Please reconsider.`, `Insufficient.`, DEFAULT_DECLINE_REASON, `decline` ) ).toBe( expected );
	} );

	test( 'Does not assume another template renders its argument as a user link', () => {
		const wikitext = `{{unblock|reason={{other|331dot}} I am requesting reconsideration.}}`;
		expect( () => unblockReview.processAcceptOrDecline( wikitext, `331dot I am requesting reconsideration.`, `Insufficient.`, DEFAULT_DECLINE_REASON, `decline` ) )
			.toThrow( 'Unable to safely match the nested template in the unblock reason' );
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
