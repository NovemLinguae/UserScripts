/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names
/* eslint-disable quotes */

import { UnblockReview } from '../modules/UnblockReview.js';
import { readFileSync } from 'fs';

/**
 * Set up the jsdom document and mocks needed to run main.js, then invoke the registered handler for the accept/decline button.
 *
 * @param {string} wikitext The page wikitext returned by the mocked MediaWiki API.
 * @param {string} html Rendered unblock-request HTML, before main.js adds UnblockReview HTML.
 * @param {string} [action='decline'] The review action to simulate ('accept', 'decline', 'wait', 'unpause', or 'none'). The registered handler is called directly; no click event is dispatched.
 * @param {boolean} [hasUsernameParameter=false] Whether the request uses a separate username parameter, as in {{unblock-un|username|reason}} or {{unblock-spamun|username|reason}}.
 * @return {Object} Mocks for assertions: mw (including notifications and API methods), postWithToken (the edit API spy), and windowMock (including the reload spy).
 */
async function clickReviewButton( wikitext, html, action = 'decline', hasUsernameParameter = false ) {
	document.body.innerHTML = html;
	if ( hasUsernameParameter ) {
		// jsdom does not parse CSS variables in the background shorthand.
		Object.defineProperty( document.querySelector( '.user-block' ).style, 'background', {
			value: 'var(--background-color-progressive-subtle, #f1f4fd)'
		} );
	}
	let ready;
	let clickHandler;
	let unpauseClickHandler;
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
					} else if ( selector === '.unblock-review-unpause' && event === 'click' ) {
						unpauseClickHandler = handler;
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
	if ( action === 'unpause' ) {
		await unpauseClickHandler.call( document.querySelector( '.unblock-review-unpause' ), { preventDefault: jest.fn() } );
	} else if ( action !== 'none' ) {
		const buttonClass = action === 'wait' ? 'unblock-review-wait' : 'unblock-review-' + action;
		await clickHandler.call( document.querySelector( '.' + buttonClass ) );
	}
	return { mw, postWithToken, windowMock };
}

describe( 'main.js', () => {
	test( 'Clicking decline reads all rendered reason text and saves the reviewed request', async () => {
		const wikitext = `{{unblock|reason={{u|331dot}} I am requesting a reconsideration of this block.}}`;
		const html = `<div class="user-block" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><div></div><div><a href="/wiki/User:331dot">331dot</a> I am requesting a reconsideration of this block.</div>
		</div>`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html );

		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			text: `{{unblock reviewed|decline={{subst:Decline reason here}} ~~~~|1=331dot I am requesting a reconsideration of this block.}}`
		} ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
	} );

	test( 'Clicking decline ignores DiscussionTools reply controls after the signature', async () => {
		const wikitext = `{{unblock|reason=Nythar was mass reverting my edits and seriously griefing pages. A lot of work was put in to them pages. Nythar seems to want to go to war for some reason?[[Special:Contributions/109.157.92.138|109.157.92.138]] ([[User talk:109.157.92.138#top|talk]]) 10:24, 22 June 2023 (UTC)}}`;
		const html = `<div class="user-block" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><p><b>Request reason</b>:</p>
			<div>Nythar was mass reverting my edits and seriously griefing pages. A lot of work was put in to them pages. Nythar seems to want to go to war for some reason?<span data-mw-comment-sig="c-109.157.92.138-20230622102400"></span><a class="userlink">109.157.92.138</a> (<a class="userlink">talk</a>) <a class="ext-discussiontools-init-timestamplink">10:24, 22 June 2023 (UTC)</a><span class="ext-discussiontools-init-replylink-buttons" data-mw-thread-id="c-109.157.92.138-20230622102400"><a class="ext-discussiontools-init-replylink-reply">reply</a></span><span data-mw-comment-end="c-109.157.92.138-20230622102400"></span></div>
		</div>`;
		const expected = `{{unblock reviewed|decline={{subst:Decline reason here}} ~~~~|1=Nythar was mass reverting my edits and seriously griefing pages. A lot of work was put in to them pages. Nythar seems to want to go to war for some reason?[[Special:Contributions/109.157.92.138|109.157.92.138]] ([[User talk:109.157.92.138#top|talk]]) 10:24, 22 June 2023 (UTC)}}`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html );
		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( { text: expected } ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
		expect( document.querySelector( '.ext-discussiontools-init-replylink-buttons' ).textContent ).toBe( 'reply' );
	} );

	test( 'Accepting a spam-unblock request keeps authored links while ignoring DiscussionTools controls', async () => {
		const wikitext = `{{unblock-spamun|Alex|Please [[Help:Reply|reply]] to me.}}`;
		const html = `<div class="user-block unblock unblock-un">
			<div></div><hr><p><b>Requested username:</b></p>
			<div><a class="userlink">Alex</a> (<a>talk</a>)</div><b>Request reason:</b>
			<div>Please <a>reply</a><span class="ext-discussiontools-init-replylink-buttons"><a>reply</a></span> to <span>me.</span></div>
		</div>`;
		const expected = `{{unblock-spamun reviewed|accept=~~~~|Alex|2=Please [[Help:Reply|reply]] to me.}}`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'accept', true );
		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( { text: expected } ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
		expect( document.querySelector( '.ext-discussiontools-init-replylink-buttons' ).textContent ).toBe( 'reply' );
	} );

	test( 'Does not mistake a reply control for an appeal reason', async () => {
		const wikitext = `{{unblock}}`;
		const html = `<div class="user-block" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><p><b>Request reason</b>:</p>
			<div><span class="ext-discussiontools-init-replylink-buttons"><a>reply</a></span></div>
		</div>`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html );
		expect( mw.notify ).toHaveBeenCalledWith( expect.stringContaining( 'unable to find' ), { type: 'error' } );
		expect( postWithToken ).not.toHaveBeenCalled();
		expect( windowMock.location.reload ).not.toHaveBeenCalled();
	} );

	test( 'Declining an unblock-un request preserves its named username and reason', async () => {
		const wikitext = `{{unblock-un|1=AleahP|reason=Test}}`;
		const html = `<div class="user-block unblock unblock-un">
			<div></div><hr><p><b>Requested username:</b></p>
			<div><a class="userlink">AleahP</a> (<a>talk</a> · <a>account availability check</a> · <a>rename user</a>)</div>
			<b>Request reason:</b><div>Test</div>
		</div>`;
		const expected = `{{unblock-un reviewed|decline={{subst:Decline reason here}} ~~~~|1=AleahP|reason=Test}}`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'decline', true );
		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( { text: expected } ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
	} );

	test( 'Accepting an unblock-un request preserves its positional username and reason', async () => {
		const wikitext = `{{unblock-un|AleahP|\nTest}}`;
		const html = `<div class="user-block unblock unblock-un">
			<div></div><hr><p><b>Requested username:</b></p>
			<div><a class="userlink">AleahP</a> (<a>talk</a>)</div>
			<b>Request reason:</b><div>Test</div>
		</div>`;
		const expected = `{{unblock-un reviewed|accept=~~~~|AleahP|2=\nTest}}`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'accept', true );
		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( { text: expected } ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
	} );

	test.each( [ 'decline', 'accept' ] )( 'Clicking %s on a spam-unblock request uses the username and full reason', async ( action ) => {
		const wikitext = `{{unblock-spamun|CALorenz|Test}}\n{{unblock-spamun|CALorenz|Other}}`;
		const html = `<div class="user-block unblock unblock-un">
			<div></div><hr><p><b>Requested username:</b></p>
			<div><a class="userlink">CALorenz</a> (<a class="userlink">talk</a> · <a>account availability check</a> · <a>rename user</a>)</div>
			<b>Request reason:</b><div><span>Te</span>st</div>
		</div>`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, action, true );
		const response = action === 'decline' ? `{{subst:Decline reason here}} ~~~~` : `~~~~`;
		const expected = `{{unblock-spamun reviewed|${ action }=${ response }|CALorenz|2=Test}}\n{{unblock-spamun|CALorenz|Other}}`;
		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( { text: expected } ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
	} );

	test.each( [ 'decline', 'accept' ] )( 'Clicking %s on a spam-unblock request with a newline before the reason', async ( action ) => {
		const wikitext = `{{unblock|AlexFlooringEditor|I now understand why my account was blocked.}}\n{{unblock-spamun|AlexFlooringEditor|Other}}\n{{unblock-spamun|AlexFlooringEditor|\nI now understand why my account was blocked.}}`;
		const html = `<div class="user-block unblock unblock-un">
			<div></div><hr><p><b>Requested username:</b></p>
			<div><a class="new userlink">AlexFlooringEditor</a> (<a class="new userlink">talk</a> · <a>account availability check</a> · <span><a>rename user</a></span>)</div>
			<b>Request reason:</b><div>\nI now understand why my account was blocked.</div>
		</div>`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, action, true );
		const response = action === 'decline' ? `{{subst:Decline reason here}} ~~~~` : `~~~~`;
		const expected = `{{unblock|AlexFlooringEditor|I now understand why my account was blocked.}}\n{{unblock-spamun|AlexFlooringEditor|Other}}\n{{unblock-spamun reviewed|${ action }=${ response }|AlexFlooringEditor|2=\nI now understand why my account was blocked.}}`;
		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( { text: expected } ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
	} );

	test( 'Does not review a different template when the spam-unblock request is absent', async () => {
		const wikitext = `{{unblock-spamun|Alex|Other}}\n{{unblock|Alex|\nTest}}`;
		const html = `<div class="user-block unblock unblock-un">
			<div></div><hr><p><b>Requested username:</b></p>
			<div><a class="userlink">Alex</a> (<a>talk</a>)</div><b>Request reason:</b><div>Test</div>
		</div>`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'decline', true );
		expect( mw.notify ).toHaveBeenCalledWith( expect.stringContaining( 'UnblockReview error' ), { type: 'error' } );
		expect( postWithToken ).not.toHaveBeenCalledWith( 'csrf', expect.objectContaining( { text: expect.anything() } ) );
		expect( windowMock.location.reload ).not.toHaveBeenCalled();
	} );

	test( 'Does not save a spam-unblock request if its reason element is missing', async () => {
		const html = `<div class="user-block unblock unblock-un">
			<div></div><hr><p><b>Requested username:</b></p>
			<div><a class="userlink">CALorenz</a> (<a>talk</a>)</div><b>Request reason:</b>
		</div>`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( `{{unblock-spamun|CALorenz|Test}}`, html, 'decline', true );
		expect( mw.notify ).toHaveBeenCalledWith( expect.stringContaining( 'unable to find' ), { type: 'error' } );
		expect( postWithToken ).not.toHaveBeenCalled();
		expect( windowMock.location.reload ).not.toHaveBeenCalled();
	} );

	test( 'Waiting appends an idletimestamp without removing existing template parameters', async () => {
		const wikitext = `{{unblock|reason=Please reconsider.|idletimestamp=20250102030405|foo=bar|idletimestamp={{subst:CURRENTTIMESTAMP}}}}\n{{other|idletimestamp=20250102030405}}`;
		const html = `<div class="user-block" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><div></div><div>Please reconsider.</div>
		</div>`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'wait' );

		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			summary: expect.stringContaining( 'Pausing unblock request' ),
			text: `{{unblock|reason=Please reconsider.|idletimestamp=20250102030405|foo=bar|idletimestamp={{subst:CURRENTTIMESTAMP}}|idletimestamp={{subst:CURRENTTIMESTAMP}}}}\n{{other|idletimestamp=20250102030405}}`
		} ) );
		expect( document.querySelector( '.unblock-review .cdx-message__content' ).textContent ).toContain(
			'Idletimestamp is present in this template. This unblock request is paused until the user replies.'
		);
		expect( document.querySelector( '.unblock-review-unpause' ).textContent ).toBe( 'Unpause now.' );
		expect( document.querySelector( '.unblock-review .cdx-message--warning' ) ).not.toBeNull();
		expect( document.querySelector( '.unblock-review textarea' ) ).toBeNull();
		expect( windowMock.location.reload ).not.toHaveBeenCalled();
	} );

	test( 'Waiting adds an idletimestamp when the unblock template has none', async () => {
		const wikitext = `{{unblock|reason=Please reconsider.}}`;
		const html = `<div class="user-block" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><div></div><div>Please reconsider.</div>
		</div>`;
		const { postWithToken } = await clickReviewButton( wikitext, html, 'wait' );

		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			text: `{{unblock|reason=Please reconsider.|idletimestamp={{subst:CURRENTTIMESTAMP}}}}`
		} ) );
	} );

	test( 'Waiting pauses a username-parameter unblock request', async () => {
		const wikitext = `{{unblock-un|Alex|Please reconsider.|idletimestamp=20250102030405}}`;
		const html = `<div class="user-block unblock unblock-un">
			<div></div><hr><p><b>Requested username:</b></p>
			<div><a class="userlink">Alex</a> (<a>talk</a>)</div>
			<b>Request reason:</b><div>Please reconsider.</div>
		</div>`;
		const { postWithToken } = await clickReviewButton( wikitext, html, 'wait', true );

		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			text: `{{unblock-un|Alex|Please reconsider.|idletimestamp=20250102030405|idletimestamp={{subst:CURRENTTIMESTAMP}}}}`
		} ) );
	} );

	test( 'Waiting pauses an unblock request with no authored reason', async () => {
		const wikitext = `{{Unblock}}`;
		const html = `<div class="user-block" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><p><b>Request reason</b>:</p>
			<div>Please provide a reason as to why you should be unblocked</div>
		</div>`;
		const { postWithToken } = await clickReviewButton( wikitext, html, 'wait' );

		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			text: `{{Unblock|idletimestamp={{subst:CURRENTTIMESTAMP}}}}`
		} ) );
	} );

	test( 'Initially displays the paused notice instead of controls when data-mw has idletimestamp', async () => {
		const html = `<div class="user-block" style="background-color: rgb(235, 244, 255)"
			data-mw='{"parts":[{"template":{"target":{"wt":"unblock-un"},"params":{"idletimestamp":{"wt":"20261119101555"}}}}]}'>
			<div></div><hr><div></div><div>Request reason</div>
		</div>`;
		const { mw } = await clickReviewButton( '', html, 'none' );

		expect( mw.notify ).not.toHaveBeenCalled();
		expect( document.querySelector( '.unblock-review .cdx-message--warning .cdx-message__content' ).textContent ).toContain(
			'Idletimestamp is present in this template. This unblock request is paused until the user replies.'
		);
		expect( document.querySelector( '.unblock-review-unpause' ).textContent ).toBe( 'Unpause now.' );
		expect( document.querySelector( '.unblock-review textarea' ) ).toBeNull();
		expect( document.querySelector( '.unblock-review button' ) ).toBeNull();
	} );

	test( 'Unpause removes idletimestamp only from the matching unblock template and reloads', async () => {
		const wikitext = `{{unblock|reason=Please reconsider.|idletimestamp=20261119101555}}\n{{unblock|reason=Other request.|idletimestamp=20261119101556}}`;
		const html = `<div class="user-block" style="background-color: rgb(235, 244, 255)"
			data-mw='{"parts":[{"template":{"target":{"wt":"unblock"},"params":{"idletimestamp":{"wt":"20261119101555"}}}}]}'>
			<div></div><hr><div></div><div>Please reconsider.</div>
		</div>`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'unpause' );

		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			summary: expect.stringContaining( 'Unpausing unblock request' ),
			text: `{{unblock|reason=Please reconsider.}}\n{{unblock|reason=Other request.|idletimestamp=20261119101556}}`
		} ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
	} );

	test( 'Unpause removes idletimestamp from a request with no authored reason', async () => {
		const wikitext = `{{Unblock|idletimestamp=20261119101555}}`;
		const html = `<div class="user-block" style="background-color: rgb(235, 244, 255)"
			data-mw='{"parts":[{"template":{"target":{"wt":"Unblock"},"params":{"idletimestamp":{"wt":"20261119101555"}}}}]}'>
			<div></div><hr><p><b>Request reason</b>:</p>
			<div>Please provide a reason as to why you should be unblocked</div>
		</div>`;
		const { postWithToken } = await clickReviewButton( wikitext, html, 'unpause' );

		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			text: `{{Unblock}}`
		} ) );
	} );

	test( 'Unpause finds a username request when idletimestamp appears between username and reason', async () => {
		const wikitext = `{{unblock-un|1=Omer EVREY  |  idletimestamp  =  20261119104225  |reason=Test}}`;
		const html = `<div class="user-block unblock unblock-un" style="background:var(--background-color-progressive-subtle, #f1f4fd)"
			data-mw='{"parts":[{"template":{"target":{"wt":"unblock-un"},"params":{"1":{"wt":"Omer EVREY"},"idletimestamp":{"wt":"20261119104225"},"reason":{"wt":"Test"}}}}]}'>
			<div></div><hr><p><b>Requested username:</b></p>
			<div><a class="userlink">Omer EVREY</a> (<a>talk</a>)</div>
			<b>Request reason:</b><div>Test</div>
		</div>`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'unpause', true );

		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			text: `{{unblock-un|1=Omer EVREY|reason=Test}}`
		} ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
	} );
} );
