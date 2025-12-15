/*
Forked from [[User:Enterprisey/unblock-review.js]] on Oct 31, 2024.
Many additional bugs fixed.
*/

// <nowiki>
( async function () {
	const UNBLOCK_REQ_COLOR_PRE_2025 = 'rgb(235, 244, 255)';
	const UNBLOCK_REQ_COLOR_POST_2025 = 'var(--background-color-progressive-subtle, #EBF4FF)';
	const UNBLOCK_SPAMUN_COLOR = 'var(--background-color-progressive-subtle, #f1f4fd)';
	const DEFAULT_DECLINE_REASON = '{{subst:Decline reason here}}';
	const ADVERT = ' ([[User:Novem Linguae/Scripts/UnblockReview.js|unblock-review]])';

	async function execute() {
		const userTalkNamespace = 3;
		if ( mw.config.get( 'wgNamespaceNumber' ) !== userTalkNamespace ) {
			return;
		}

		$.when( $.ready, mw.loader.using( [ 'mediawiki.api', 'mediawiki.util' ] ) ).then( async () => {
			// add styles
			mw.util.addCSS(
				'.unblock-review td { padding: 0 }' +
				'td.reason-container { padding-right: 1em; width: 30em }' +
				'.unblock-review-reason { height: 5em }' );

			// look for user-block HTML class, which will correspond to {{Unblock}} requests
			const userBlockBoxes = document.querySelectorAll( 'div.user-block' );
			for ( let i = 0, n = userBlockBoxes.length; i < n; i++ ) {
				if (
					userBlockBoxes[ i ].style[ 'background-color' ] === UNBLOCK_REQ_COLOR_PRE_2025 ||
					userBlockBoxes[ i ].style.background === UNBLOCK_REQ_COLOR_POST_2025 ||
					userBlockBoxes[ i ].style.background === UNBLOCK_SPAMUN_COLOR
				) {
					// We now have a pending unblock request - add UI
					const unblockDiv = userBlockBoxes[ i ];
					const [ container, hrEl ] = addTextBoxAndButtons( unblockDiv );
					await listenForAcceptAndDecline( container, hrEl );
				}
			}
		} );
	}

	function addTextBoxAndButtons( unblockDiv ) {
		const container = document.createElement( 'table' );
		container.className = 'unblock-review';
		// Note: The innerHtml of the button is sensitive. Is used to figure out which accept/decline wikitext to use. Don't add whitespace to it.
		container.innerHTML = `
			<tr>
				<td class='reason-container' rowspan='2'>
					<textarea class='unblock-review-reason mw-ui-input' placeholder='Reason for accepting/declining here'>${ DEFAULT_DECLINE_REASON }</textarea>
				</td>
				<td>
					<button class='unblock-review-accept mw-ui-button mw-ui-progressive'>Accept</button>
				</td>
			</tr>
			<tr>
				<td>
					<button class='unblock-review-decline mw-ui-button mw-ui-destructive'>Decline</button>
				</td>
			</tr>`;
		const hrEl = unblockDiv.querySelector( 'hr' );
		unblockDiv.insertBefore( container, hrEl.previousElementSibling );
		return [ container, hrEl ];
	}

	async function listenForAcceptAndDecline( container, hrEl ) {
		const reasonArea = container.querySelector( 'textarea' );
		$( container ).find( 'button' ).on( 'click', async function () {
			// look at the innerHtml of the button to see if it says "Accept" or "Decline"
			const acceptOrDecline = $( this ).text().toLowerCase();
			const appealReason = hrEl.nextElementSibling.nextElementSibling.childNodes[ 0 ].textContent;
			// FIXME: should handle this case (|reason=\nText, https://github.com/NovemLinguae/UserScripts/issues/240) instead of throwing an error
			if ( appealReason === '\n' ) {
				mw.notify( 'UnblockReview error: unable to find decline reason by scanning HTML', { type: 'error' } );
				return;
			}

			// change wikitext
			// eslint-disable-next-line no-undef
			const unblockReview = new UnblockReview();
			const title = mw.config.get( 'wgPageName' );
			const wikitext = await getWikitext( title );
			const acceptDeclineReason = reasonArea.value;
			let wikitext2;
			try {
				wikitext2 = unblockReview.processAcceptOrDecline(
					wikitext,
					appealReason,
					acceptDeclineReason,
					DEFAULT_DECLINE_REASON,
					acceptOrDecline
				);
			} catch ( e ) {
				mw.notify( 'UnblockReview error: ' + e.message, { type: 'error' } );
				return;
			}

			if ( wikitext === wikitext2 ) {
				mw.notify( 'UnblockReview error: unable to determine write location.', { type: 'error' } );
				return;
			}

			const acceptingOrDeclining = ( acceptOrDecline === 'accept' ? 'Accepting' : 'Declining' );
			const editSummary = acceptingOrDeclining + ' unblock request' + ADVERT;
			await editPage( title, wikitext2, editSummary );
			window.location.reload( true );
		} );
	}

	async function getWikitext( title ) {
		const data = await ( new mw.Api() ).get( {
			format: 'json',
			action: 'query',
			prop: 'revisions',
			rvprop: 'content',
			rvlimit: 1,
			titles: title
		} );
		const pageId = Object.keys( data.query.pages )[ 0 ];
		const wikitext = data.query.pages[ pageId ].revisions[ 0 ][ '*' ];
		return wikitext;
	}

	async function editPage( title, wikitext, editSummary ) {
		await ( new mw.Api() ).postWithToken( 'csrf', {
			action: 'edit',
			title: title,
			summary: editSummary,
			text: wikitext
		} );
	}

	mw.loader.using( 'mediawiki.ui.button', 'mediawiki.ui.input' ).then( async () => {
		await execute();
	} );
}() );
// </nowiki>
