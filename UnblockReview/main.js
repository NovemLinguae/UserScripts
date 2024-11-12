/*
Fork of https://en.wikipedia.org/w/index.php?title=User:Enterprisey/unblock-review.js&oldid=1073685522

TODO:
- fix tickets at https://github.com/NovemLinguae/UserScripts/issues?q=is%3Aissue+is%3Aopen+label%3AUnblockReview
- add to my user page list of scripts
- mention that I forked it over at the Enterprisey user script page, and at WP:US/R
*/

/* global importStylesheet */
// <nowiki>
( function () {
	const UNBLOCK_REQ_COLOR = 'rgb(235, 244, 255)';
	const DEFAULT_DECLINE_REASON = '{{subst:Decline reason here}}';
	const ADVERT = ' ([[User:Novem Linguae/Scripts/UnblockReview.js|unblock-review]])';

	function execute() {
		const userTalkNamespace = 3;
		if ( mw.config.get( 'wgNamespaceNumber' ) !== userTalkNamespace ) {
			return;
		}

		$.when( $.ready, mw.loader.using( [ 'mediawiki.api', 'mediawiki.util' ] ) ).then( () => {
			// add styles
			mw.util.addCSS(
				'.unblock-review td { padding: 0 }' +
				'td.reason-container { padding-right: 1em; width: 30em }' +
				'.unblock-review-reason { height: 5em }' );
			importStylesheet( 'User:Enterprisey/mw-ui-button.css' );
			importStylesheet( 'User:Enterprisey/mw-ui-input.css' );

			// look for user-block HTML class, which will correspond to {{Unblock}} requests
			const userBlockBoxes = document.querySelectorAll( 'div.user-block' );
			for ( let i = 0, n = userBlockBoxes.length; i < n; i++ ) {
				if ( userBlockBoxes[ i ].style[ 'background-color' ] !== UNBLOCK_REQ_COLOR ) {
					continue;
				}

				// We now have a pending unblock request - add UI
				const unblockDiv = userBlockBoxes[ i ];
				const [ container, hrEl ] = addTextBoxAndButtons( unblockDiv );
				listenForAcceptAndDecline( container, hrEl );
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

	function listenForAcceptAndDecline( container, hrEl ) {
		const reasonArea = container.querySelector( 'textarea' );
		$( container ).find( 'button' ).on( 'click', function () {
			// look at the innerHtml of the button to see if it says "Accept" or "Decline"
			const acceptOrDecline = $( this ).text().toLowerCase();
			const appealReason = hrEl.nextElementSibling.nextElementSibling.childNodes[ 0 ].textContent;
			// FIXME: should handle this case (|reason=\nText, https://github.com/NovemLinguae/UserScripts/issues/240) instead of throwing an error
			if ( appealReason === '\n' ) {
				mw.notify( 'UnblockReview error 1: unable to find decline reason by scanning HTML', { type: 'error' } );
				return;
			}
			$.getJSON(
				mw.util.wikiScript( 'api' ),
				{
					format: 'json',
					action: 'query',
					prop: 'revisions',
					rvprop: 'content',
					rvlimit: 1,
					titles: mw.config.get( 'wgPageName' )
				}
			).done( ( data ) => {
				// Extract wikitext from API response
				const pageId = Object.keys( data.query.pages )[ 0 ];
				const wikitext = data.query.pages[ pageId ].revisions[ 0 ][ '*' ];

				// change wikitext
				// eslint-disable-next-line no-undef
				const unblockReview = new UnblockReview();
				const acceptDeclineReason = reasonArea.value;
				const wikitext2 = unblockReview.processAcceptOrDecline( wikitext, appealReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline );
				if ( wikitext === wikitext2 ) {
					mw.notify( 'UnblockReview error 2: unable to determine write location.', { type: 'error' } );
					return;
				}

				// build edit summary
				const acceptingOrDeclining = ( acceptOrDecline === 'accept' ? 'Accepting' : 'Declining' );
				const summary = acceptingOrDeclining + ' unblock request' + ADVERT;

				// make edit
				( new mw.Api() ).postWithToken( 'csrf', {
					action: 'edit',
					title: mw.config.get( 'wgPageName' ),
					summary: summary,
					text: wikitext2
				} ).done( ( data ) => {
					if ( data && data.edit && data.edit.result && data.edit.result === 'Success' ) {
						window.location.reload( true );
					} else {
						console.log( data );
					}
				} );
			} );
		} );
	}

	execute();
}() );
// </nowiki>
