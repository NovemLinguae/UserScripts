/*
Fork of https://en.wikipedia.org/w/index.php?title=User:Enterprisey/unblock-review.js&oldid=1073685522

CHANGELOG:
- linted the code
- refactored

TODO:
- get rid of goto jump (matchLoop label)
- make tickets for the 4 issues that jpgordon and myself mentioned here: https://en.wikipedia.org/wiki/Wikipedia:User_scripts/Requests#User%3AEnterprisey%2Funblock-review
- fix tickets at https://github.com/NovemLinguae/UserScripts/issues?q=is%3Aissue+is%3Aopen+label%3AUnblockReview
- add to my user page list of scripts
- mention that I forked it over at the Enterprisey user script page
*/

/* global importStylesheet */
// <nowiki>
( function () {
	const UNBLOCK_REQ_COLOR = 'rgb(235, 244, 255)';
	const SIGNATURE = '~~~~';
	const DECLINE_REASON_HERE = '{{subst:Decline reason here}}';
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
					<textarea class='unblock-review-reason mw-ui-input' placeholder='Reason for accepting/declining here'>${ DECLINE_REASON_HERE }</textarea>
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
			const action = $( this ).text().toLowerCase();
			const appealReason = hrEl.nextElementSibling.nextElementSibling.childNodes[ 0 ].textContent;
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
				let wikitext = data.query.pages[ pageId ].revisions[ 0 ][ '*' ];

				// build wikitext
				const unblockReview = new UnblockReview();
				const initialText = unblockReview.getLeftHalfOfUnblockTemplate( wikitext, appealReason );

				let reason = reasonArea.value;
				if ( !reason.trim() ) {
					reason = DECLINE_REASON_HERE + ' ' + SIGNATURE;
				} else if ( !hasSignature( reason ) ) {
					reason = reason + ' ' + SIGNATURE;
				}

				wikitext = wikitext.replace(
					initialText + appealReason,
					'{{unblock reviewed|' + action + '=' + reason + '|1=' + appealReason
				);

				// get rid of any colons in front of {{unblock X}} templates. causes a bug.
				// wikitext = wikitext.replace( /^:{1,}\s*(\{\{\s*unblock)/mi, '$1' );

				// build edit summary
				const acceptingOrDeclining = ( action === 'accept' ? 'Accepting' : 'Declining' );
				const summary = acceptingOrDeclining + ' unblock request' + ADVERT;

				// make edit
				( new mw.Api() ).postWithToken( 'csrf', {
					action: 'edit',
					title: mw.config.get( 'wgPageName' ),
					summary: summary,
					text: wikitext
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

	/**
	 * Is there a signature (four tildes) present in the given text,
	 * outside of a nowiki element?
	 */
	function hasSignature( text ) {
		// no literal signature?
		if ( text.indexOf( SIGNATURE ) < 0 ) {
			return false;
		}

		// if there's a literal signature and no nowiki elements,
		// there must be a real signature
		if ( text.indexOf( '<nowiki>' ) < 0 ) {
			return true;
		}

		// Save all nowiki spans
		const nowikiSpanStarts = []; // list of ignored span beginnings
		const nowikiSpanLengths = []; // list of ignored span lengths
		const NOWIKI_RE = /<nowiki>.*?<\/nowiki>/g;
		let spanMatch;
		do {
			spanMatch = NOWIKI_RE.exec( text );
			if ( spanMatch ) {
				nowikiSpanStarts.push( spanMatch.index );
				nowikiSpanLengths.push( spanMatch[ 0 ].length );
			}
		} while ( spanMatch );

		// So that we don't check every ignore span every time
		let nowikiSpanStartIdx = 0;

		const SIG_RE = new RegExp( SIGNATURE, 'g' );
		let sigMatch;

		matchLoop:
		do {
			sigMatch = SIG_RE.exec( text );
			if ( sigMatch ) {
				// Check that we're not inside a nowiki
				for ( let nwIdx = nowikiSpanStartIdx; nwIdx <
					nowikiSpanStarts.length; nwIdx++ ) {
					if ( sigMatch.index > nowikiSpanStarts[ nwIdx ] ) {
						if ( sigMatch.index + sigMatch[ 0 ].length <=
							nowikiSpanStarts[ nwIdx ] + nowikiSpanLengths[ nwIdx ] ) {

							// Invalid sig
							continue matchLoop;
						} else {
							// We'll never encounter this span again, since
							// headers only get later and later in the wikitext
							nowikiSpanStartIdx = nwIdx;
						}
					}
				}

				// We aren't inside a nowiki
				return true;
			}
		} while ( sigMatch );
		return false;
	}

	execute();
}() );
// </nowiki>
