/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names
/* eslint-disable quotes */

import { UnblockReview } from '../modules/UnblockReview.js';
import { readFileSync } from 'fs';

/**
 * Set up the jsdom document and mocks needed to run main.js, then invoke the registered handler for the accept/decline button.
 *
 * @param {string} wikitext The page wikitext returned by the mocked MediaWiki API.
 * @param {string} html Rendered unblock-request HTML, before main.js adds UnblockReview HTML.
 * @param {string} [action='decline'] The review action to simulate. The registered handler is called directly; no click event is dispatched.
 * @param {Object} [options={}] Overrides for the relevant user, API, and prompt.
 * @return {Object} Mocks for assertions: mw (including notifications and API methods), postWithToken (the edit API spy), and windowMock (including the reload spy).
 */
async function clickReviewButton( wikitext, html, action = 'decline', options = {} ) {
	document.body.innerHTML = html;
	let ready;
	let clickHandler;
	let unpauseClickHandler;
	let adminClickHandler;
	let templateChangeHandler;
	const $ = ( element ) => {
		if ( typeof element === 'function' ) {
			ready = element;
			return;
		}
		return {
			find: ( selector ) => ( {
				on: ( event, handler ) => {
					if ( !element.querySelector( selector ) ) {
						return;
					}
					if ( selector === '.unblock-review-accept, .unblock-review-decline, .unblock-review-wait' && event === 'click' ) {
						clickHandler = handler;
					} else if ( selector === '.unblock-review-unpause' && event === 'click' ) {
						unpauseClickHandler = handler;
					} else if ( selector === '.unblock-review-wait-admin' && event === 'click' ) {
						adminClickHandler = handler;
					} else if ( selector === '#unblock-review-autoadd-template' && event === 'change' ) {
						templateChangeHandler = handler;
					}
				},
				text: () => element.querySelector( selector.replace( ':selected', ':checked' ) ).textContent,
				val: ( value ) => {
					element.querySelector( selector ).value = value;
				}
			} ),
			text: () => element.textContent
		};
	};
	const postWithToken = jest.fn().mockResolvedValue( {} );
	const get = options.get || jest.fn().mockResolvedValue( { query: { pages: { 1: { revisions: [ { '*': wikitext } ] } } } } );
	const mw = {
		config: { get: ( key ) => ( { wgNamespaceNumber: 3, wgPageName: 'User_talk:Example', wgRelevantUserName: options.user } )[ key ] },
		loader: { using: () => Promise.resolve() },
		util: { addCSS: jest.fn() },
		Api: function () {
			this.get = get;
			this.postWithToken = postWithToken;
		},
		notify: jest.fn()
	};
	const windowMock = { location: { reload: jest.fn() }, prompt: options.prompt || jest.fn() };
	// eslint-disable-next-line no-new-func
	const runMain = new Function( 'mw', '$', 'UnblockReview', 'document', 'window', readFileSync( require.resolve( '../main.js' ), 'utf8' ) );
	runMain( mw, $, UnblockReview, document, windowMock );
	await ready();
	if ( action === 'unpause' ) {
		await unpauseClickHandler.call( document.querySelector( '.unblock-review-unpause' ), { preventDefault: jest.fn() } );
	} else if ( action === 'wait-admin' ) {
		await adminClickHandler.call( document.querySelector( '.unblock-review-wait-admin' ) );
	} else if ( action === 'select-template' ) {
		const select = document.querySelector( '#unblock-review-autoadd-template' );
		select.value = '{{subst:2nd chance}}';
		templateChangeHandler.call( select );
	} else if ( action !== 'none' ) {
		const buttonClass = action === 'wait' || action === 'wait-unpause' ? 'unblock-review-wait' : 'unblock-review-' + action;
		await clickHandler.call( document.querySelector( '.' + buttonClass ) );
		if ( action === 'wait-unpause' ) {
			await unpauseClickHandler.call( document.querySelector( '.unblock-review-unpause' ), { preventDefault: jest.fn() } );
		}
	}
	return { mw, postWithToken, windowMock };
}

describe( 'main.js', () => {
	test( 'Identifies pending requests by class, not by color', async () => {
		const html = `
			<div id="standard" class="user-block unblock user-unblock-request" style="background-color: red">
				<div></div><hr><p><b>Request reason</b>:</p><div>Standard reason</div>
			</div>
			<div id="username" class="user-block unblock unblock-un">
				<div></div><hr><p><b>Requested username:</b></p><div><a>Alex</a></div><b>Request reason:</b><div>Reason</div>
			</div>
			<div id="other" class="user-block" style="background-color: #EBF4FF"><div></div><hr><p>Other notice</p></div>
			<div id="reviewed" class="user-block unblock-reviewed" style="background-color: #EBF4FF"><div></div><hr></div>
			<div id="on-hold" class="user-block unblock unblock-on-hold" style="background-color: #EBF4FF"><div></div><hr></div>
			<div id="username-on-hold" class="user-block unblock-on-hold unblock-un-on-hold"><div></div><hr></div>
			<div id="autoblock" class="user-block unblock unblock-auto"><div></div><hr></div>`;
		await clickReviewButton( '', html, 'none' );
		expect( document.querySelectorAll( '.unblock-review' ) ).toHaveLength( 3 );
		for ( const id of [ 'standard', 'username' ] ) {
			expect( document.querySelector( '#' + id + ' .unblock-review-accept' ) ).not.toBeNull();
		}
		for ( const id of [ 'other', 'reviewed', 'username-on-hold', 'autoblock' ] ) {
			expect( document.querySelector( '#' + id + ' .unblock-review' ) ).toBeNull();
		}
		expect( document.querySelector( '#on-hold .unblock-review-unpause' ) ).not.toBeNull();
	} );

	test( 'Selecting a template updates the reason', async () => {
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><div></div><div>Request reason</div>
		</div>`;
		const { postWithToken } = await clickReviewButton( '', html, 'select-template' );
		expect( document.querySelector( '.unblock-review-reason' ).value ).toBe( '{{subst:2nd chance}}' );
		expect( postWithToken ).not.toHaveBeenCalled();
	} );

	test( 'Clicking decline reads all rendered reason text and saves the reviewed request', async () => {
		const wikitext = `{{unblock|reason={{u|331dot}} I am requesting a reconsideration of this block.}}`;
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)">
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
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)">
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

	test( 'Declining an appeal containing an interwiki link with a leading colon', async () => {
		const reason = `I recently added a section in the French Wikipedia article available at [[:fr:Arc géodésique de Struve]]. I posted a proposal to consider translation in the [http://Talk:Struve_Geodetic_Arc talk page] of [[Struve Geodetic Arc]]. [[User:Charles Inigo|Charles Inigo]] ([[User talk:Charles Inigo#top|talk]]) 08:01, 20 November 2026 (UTC)`;
		const wikitext = `{{unblock|reason=${ reason }}}}`;
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: #EBF4FF">
			<div></div><hr><p><b>Request reason</b>:</p>
			<div>I recently added a section in the French Wikipedia article available at <a rel="mw:WikiLink/Interwiki">fr:Arc géodésique de Struve</a>. I posted a proposal to consider translation in the <a rel="mw:ExtLink">talk page</a> of <a rel="mw:WikiLink">Struve Geodetic Arc</a>. <span data-mw-comment-sig="c-Charles_Inigo-20261120080100"></span><a>Charles Inigo</a> (<a>talk</a>) <a>08:01, 20 November 2026 (UTC)</a><span class="ext-discussiontools-init-replylink-buttons"><a>reply</a></span></div>
		</div>`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html );
		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			text: `{{unblock reviewed|decline={{subst:Decline reason here}} ~~~~|1=${ reason }}}}`
		} ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
	} );

	test( 'Declining a temporary-account appeal with an external link and multiple signatures', async () => {
		const reason = `I was blocked because of the abuse of editing privileges. This is includes failing to understand [[WP:COMPETENCE]] and the lack of ability to understand the [[English Wikipedia]] per [[WP:NOTHERE]], and [https://en.wikipedia.org/wiki/Wikipedia:Administrators%27_noticeboard/IncidentArchive1239#~2026-47089-17_-_WP:CIR_issues_from_a_possible_language_barrier,_repeated_and_continuous_failure_to_use_sources,_suspected_use_of_WP:LLM_to_create_articles per presented] at [[WP:ANI]] the past days, despite given additional warnings, leading my article [[Draft:Serendipity Point Films|Serendipity Point Films]] to be put back into draftspace. and several rollbacks by experienced editors. --[[Special:Contributions/~2026-47089-17|~2026-47089-17]] ([[User talk:~2026-47089-17|talk]]) 23:43, 18 November 2026 (UTC)
::What I will do differently is edit constructively. --[[Special:Contributions/~2026-47089-17|~2026-47089-17]] ([[User talk:~2026-47089-17|talk]]) 23:43, 18 November 2026 (UTC)`;
		const wikitext = `:{{unblock|reason=${ reason }}}}`;
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: #EBF4FF">
			<div></div><hr><p><b>Request reason</b>:</p>
			<div>I was blocked because of the abuse of editing privileges. This is includes failing to understand <a>WP:COMPETENCE</a> and the lack of ability to understand the <a>English Wikipedia</a> per <a>WP:NOTHERE</a>, and <a class="external text">per presented</a> at <a>WP:ANI</a> the past days, despite given additional warnings, leading my article <a>Serendipity Point Films</a> to be put back into draftspace. and several rollbacks by experienced editors. --<a class="mw-tempuserlink userlink">~2026-47089-17</a><span class="ext-checkuser-tempaccount-reveal-ip-button"><a>Show IP</a></span> (<a>talk</a>) <a>23:43, 18 November 2026 (UTC)</a><span class="ext-discussiontools-init-replylink-buttons"><a>reply</a></span>
			<dl><dd><dl><dd>What I will do differently is edit constructively. --<a>~2026-47089-17</a><span class="ext-checkuser-tempaccount-reveal-ip-button"><a>Show IP</a></span> (<a>talk</a>) <a>23:43, 18 November 2026 (UTC)</a><span class="ext-discussiontools-init-replylink-buttons"><a>reply</a></span></dd></dl></dd></dl></div>
		</div>`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html );
		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			text: `{{unblock reviewed|decline={{subst:Decline reason here}} ~~~~|1=${ reason }}}}`
		} ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
		expect( document.querySelectorAll( '.ext-checkuser-tempaccount-reveal-ip-button' ) ).toHaveLength( 2 );
	} );

	test( 'Accepting a spam-unblock request keeps authored links while ignoring DiscussionTools controls', async () => {
		const wikitext = `{{unblock-spamun|Alex|Please [[Help:Reply|reply]] to me.}}`;
		const html = `<div class="user-block unblock unblock-un">
			<div></div><hr><p><b>Requested username:</b></p>
			<div><a class="userlink">Alex</a> (<a>talk</a>)</div><b>Request reason:</b>
			<div>Please <a>reply</a><span class="ext-discussiontools-init-replylink-buttons"><a>reply</a></span> to <span>me.</span></div>
		</div>`;
		const expected = `{{unblock-spamun reviewed|accept=~~~~|Alex|2=Please [[Help:Reply|reply]] to me.}}`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'accept' );
		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( { text: expected } ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
		expect( document.querySelector( '.ext-discussiontools-init-replylink-buttons' ).textContent ).toBe( 'reply' );
	} );

	test( 'Does not mistake a reply control for an appeal reason', async () => {
		const wikitext = `{{unblock}}`;
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)">
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
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'decline' );
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
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'accept' );
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
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, action );
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
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, action );
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
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'decline' );
		expect( mw.notify ).toHaveBeenCalledWith( expect.stringContaining( 'UnblockReview error' ), { type: 'error' } );
		expect( postWithToken ).not.toHaveBeenCalledWith( 'csrf', expect.objectContaining( { text: expect.anything() } ) );
		expect( windowMock.location.reload ).not.toHaveBeenCalled();
	} );

	test( 'Does not save a spam-unblock request if its reason element is missing', async () => {
		const html = `<div class="user-block unblock unblock-un">
			<div></div><hr><p><b>Requested username:</b></p>
			<div><a class="userlink">CALorenz</a> (<a>talk</a>)</div><b>Request reason:</b>
		</div>`;
		const { mw, postWithToken, windowMock } = await clickReviewButton( `{{unblock-spamun|CALorenz|Test}}`, html, 'decline' );
		expect( mw.notify ).toHaveBeenCalledWith( expect.stringContaining( 'unable to find' ), { type: 'error' } );
		expect( postWithToken ).not.toHaveBeenCalled();
		expect( windowMock.location.reload ).not.toHaveBeenCalled();
	} );

	test( 'Waiting appends an idletimestamp without removing existing template parameters', async () => {
		const wikitext = `{{unblock|reason=Please reconsider.|idletimestamp=20250102030405|foo=bar|idletimestamp={{subst:CURRENTTIMESTAMP}}}}\n{{other|idletimestamp=20250102030405}}`;
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)">
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
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><div></div><div>Please reconsider.</div>
		</div>`;
		const { postWithToken } = await clickReviewButton( wikitext, html, 'wait' );

		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			text: `{{unblock|reason=Please reconsider.|idletimestamp={{subst:CURRENTTIMESTAMP}}}}`
		} ) );
	} );

	test( 'The unpause listener works immediately after pausing', async () => {
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><div></div><div>Please reconsider.</div>
		</div>`;
		const get = jest.fn()
			.mockResolvedValueOnce( { query: { pages: { 1: { revisions: [ { '*': '{{unblock|reason=Please reconsider.}}' } ] } } } } )
			.mockResolvedValueOnce( { query: { pages: { 1: { revisions: [ { '*': '{{unblock|reason=Please reconsider.|idletimestamp=20261119101555}}' } ] } } } } );
		const { postWithToken, windowMock } = await clickReviewButton( '', html, 'wait-unpause', { get } );
		expect( postWithToken ).toHaveBeenCalledTimes( 2 );
		expect( postWithToken ).toHaveBeenLastCalledWith( 'csrf', expect.objectContaining( {
			summary: expect.stringContaining( 'Unpausing unblock request' ),
			text: '{{unblock|reason=Please reconsider.}}'
		} ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
	} );

	test( 'Blocking admin selection puts the matching unblock request on hold and reloads', async () => {
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><div></div><div>Request reason</div>
		</div>`;
		const wikitext = '{{unblock|reason=Another request}}\n{{unblock|reason=[[Help:Appeal|Request reason]]|category=}}';
		const get = jest.fn()
			.mockResolvedValueOnce( { query: { logevents: [ { action: 'unblock', user: 'Other' } ] }, continue: { lecontinue: 'next' } } )
			.mockResolvedValueOnce( { query: { logevents: [ { action: 'reblock', user: 'Blocking admin' } ] } } )
			.mockResolvedValueOnce( { query: { pages: { 1: { revisions: [ { '*': wikitext } ] } } } } );
		const prompt = jest.fn().mockReturnValue( ' Another admin ' );
		const { mw, postWithToken, windowMock } = await clickReviewButton( '', html, 'wait-admin', { user: 'Example', get, prompt } );

		expect( document.querySelector( '.unblock-review-wait' ).nextElementSibling.className ).toContain( 'unblock-review-wait-admin' );
		expect( get ).toHaveBeenCalledWith( expect.objectContaining( {
			list: 'logevents', letype: 'block', letitle: 'User:Example'
		} ) );
		expect( get ).toHaveBeenNthCalledWith( 2, expect.objectContaining( { lecontinue: 'next' } ) );
		expect( prompt ).toHaveBeenCalledWith( 'Blocking administrator:', 'Blocking admin' );
		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			summary: expect.stringContaining( 'Putting unblock request on hold' ),
			text: '{{unblock|reason=Another request}}\n{{Unblock on hold|1=Another admin|2=[[Help:Appeal|Request reason]]|3=~~~~}}'
		} ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
	} );

	test.each( [
		[ undefined, undefined ],
		[ 'Example', [] ],
		[ 'Example', [ { action: 'block', userhidden: '' } ] ],
		[ 'Example', [ { actionhidden: '', user: 'Hidden action' } ] ]
	] )( 'Blocking admin selection allows a blank default when no admin is available', async ( user, events ) => {
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><div></div><div>Request reason</div>
		</div>`;
		const get = jest.fn().mockResolvedValue( { query: { logevents: events } } );
		const prompt = jest.fn().mockReturnValue( null );
		const { mw, postWithToken } = await clickReviewButton( '', html, 'wait-admin', { user, get, prompt } );
		expect( prompt ).toHaveBeenCalledWith( 'Blocking administrator:', '' );
		expect( get ).toHaveBeenCalledTimes( user ? 1 : 0 );
		expect( document.querySelector( '.unblock-review' ).dataset.blockingAdmin ).toBeUndefined();
		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).not.toHaveBeenCalled();
	} );

	test( 'Blocking admin lookup failure defaults to blank and permits manual entry', async () => {
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><div></div><div>Request reason</div>
		</div>`;
		const get = jest.fn()
			.mockRejectedValueOnce( new Error( 'API failed' ) )
			.mockResolvedValueOnce( { query: { pages: { 1: { revisions: [ { '*': '{{unblock|reason=Request reason}}' } ] } } } } );
		const prompt = jest.fn().mockReturnValue( 'Manual admin' );
		const consoleError = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		try {
			const { mw, postWithToken } = await clickReviewButton( '', html, 'wait-admin', { user: 'Example', get, prompt } );
			expect( consoleError ).toHaveBeenCalledWith( expect.stringContaining( 'lookup failed' ), expect.any( Error ) );
			expect( mw.notify ).not.toHaveBeenCalledWith( expect.anything(), { type: 'error' } );
			expect( prompt ).toHaveBeenCalledWith( 'Blocking administrator:', '' );
			expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
				text: '{{Unblock on hold|1=Manual admin|2=Request reason|3=~~~~}}'
			} ) );
		} finally {
			consoleError.mockRestore();
		}
	} );

	test( 'An ambiguous request is not edited or reloaded', async () => {
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><div></div><div>Request reason</div>
		</div>`;
		const wikitext = '{{unblock|reason=Request reason}}\n{{unblock|reason=Request reason}}';
		const prompt = jest.fn().mockReturnValue( 'Admin' );
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'wait-admin', { prompt } );
		expect( mw.notify ).toHaveBeenCalledWith( expect.stringContaining( 'Too many matching' ), { type: 'error' } );
		expect( postWithToken ).not.toHaveBeenCalled();
		expect( windowMock.location.reload ).not.toHaveBeenCalled();
		expect( document.querySelector( '.unblock-review-wait-admin' ).disabled ).toBe( false );
	} );

	test( 'Waiting pauses a username-parameter unblock request', async () => {
		const wikitext = `{{unblock-un|Alex|Please reconsider.|idletimestamp=20250102030405}}`;
		const html = `<div class="user-block unblock unblock-un">
			<div></div><hr><p><b>Requested username:</b></p>
			<div><a class="userlink">Alex</a> (<a>talk</a>)</div>
			<b>Request reason:</b><div>Please reconsider.</div>
		</div>`;
		const { postWithToken } = await clickReviewButton( wikitext, html, 'wait' );

		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			text: `{{unblock-un|Alex|Please reconsider.|idletimestamp=20250102030405|idletimestamp={{subst:CURRENTTIMESTAMP}}}}`
		} ) );
	} );

	test( 'Waiting pauses an unblock request with no authored reason', async () => {
		const wikitext = `{{Unblock}}`;
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)">
			<div></div><hr><p><b>Request reason</b>:</p>
			<div>Please provide a reason as to why you should be unblocked</div>
		</div>`;
		const { postWithToken } = await clickReviewButton( wikitext, html, 'wait' );

		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			text: `{{Unblock|idletimestamp={{subst:CURRENTTIMESTAMP}}}}`
		} ) );
	} );

	test( 'Initially displays the paused notice instead of controls when data-mw has idletimestamp', async () => {
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)"
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

	test( 'An on-hold request displays a warning and takes the matching request off hold', async () => {
		const html = `<div class="user-block unblock unblock-on-hold">
			<div></div><hr>
			<p>Blocking administrator: <a>Admin</a> (talk)</p>
			<p>Reviewing administrator: Reviewer</p>
			<p><b>Request reason</b>:</p>
			<div>Please <a>reconsider</a>.<span class="ext-discussiontools-init-replylink-buttons"><a>reply</a></span></div>
		</div>`;
		const wikitext = '{{Unblock on hold|1=Other|2=Other reason|3=Signature}}\n' +
			'{{Unblock on hold|1=Admin|2=Please [[Help:Appeal|reconsider]].|3=Reviewer}}';
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'unpause' );
		expect( document.querySelector( '.cdx-message--warning' ).textContent ).toContain( 'on hold' );
		expect( document.querySelector( '.unblock-review-unpause' ).textContent ).toBe( 'Take off hold.' );
		expect( document.querySelector( '.unblock-review button' ) ).toBeNull();
		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			summary: expect.stringContaining( 'Taking unblock request off hold' ),
			text: '{{Unblock on hold|1=Other|2=Other reason|3=Signature}}\n{{Unblock|reason=Please [[Help:Appeal|reconsider]].}}'
		} ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
	} );

	test( 'Taking an ambiguous on-hold request off hold does not edit or reload', async () => {
		const html = `<div class="user-block unblock unblock-on-hold">
			<div></div><hr><p>Blocking administrator: Admin</p><p><b>Request reason</b>:</p><div>Please reconsider.</div>
		</div>`;
		const wikitext = '{{Unblock on hold|1=One|2=Please reconsider.|3=Reviewer}}\n' +
			'{{Unblock on hold|1=Two|2=Please reconsider.|3=Reviewer}}';
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'unpause' );
		expect( mw.notify ).toHaveBeenCalledWith( expect.stringContaining( 'Too many matching' ), { type: 'error' } );
		expect( postWithToken ).not.toHaveBeenCalled();
		expect( windowMock.location.reload ).not.toHaveBeenCalled();
	} );

	test( 'Taking an on-hold request with an empty reason off hold preserves the empty reason', async () => {
		const html = `<div class="user-block unblock unblock-on-hold">
			<div></div><hr><p><b>Request reason</b>:</p><div></div>
		</div>`;
		const { postWithToken } = await clickReviewButton( '{{Unblock on hold|1=Admin|2=|3=Reviewer}}', html, 'unpause' );
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			text: '{{Unblock|reason=}}'
		} ) );
	} );

	test( 'A failed page lookup is reported when taking a request off hold', async () => {
		const html = `<div class="user-block unblock unblock-on-hold">
			<div></div><hr><p><b>Request reason</b>:</p><div>Please reconsider.</div>
		</div>`;
		const get = jest.fn().mockRejectedValue( new Error( 'API failed' ) );
		const { mw, postWithToken, windowMock } = await clickReviewButton( '', html, 'unpause', { get } );
		expect( mw.notify ).toHaveBeenCalledWith( expect.stringContaining( 'API failed' ), { type: 'error' } );
		expect( postWithToken ).not.toHaveBeenCalled();
		expect( windowMock.location.reload ).not.toHaveBeenCalled();
	} );

	test( 'Unpause removes idletimestamp only from the matching unblock template and reloads', async () => {
		const wikitext = `{{unblock|reason=Please reconsider.|idletimestamp=20261119101555}}\n{{unblock|reason=Other request.|idletimestamp=20261119101556}}`;
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)"
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
		const html = `<div class="user-block unblock user-unblock-request" style="background-color: rgb(235, 244, 255)"
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
		const { mw, postWithToken, windowMock } = await clickReviewButton( wikitext, html, 'unpause' );

		expect( mw.notify ).not.toHaveBeenCalled();
		expect( postWithToken ).toHaveBeenCalledWith( 'csrf', expect.objectContaining( {
			text: `{{unblock-un|1=Omer EVREY|reason=Test}}`
		} ) );
		expect( windowMock.location.reload ).toHaveBeenCalled();
	} );
} );
