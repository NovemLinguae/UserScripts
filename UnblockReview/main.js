/*
Forked from [[User:Enterprisey/unblock-review.js]] on Oct 31, 2024.
Many many bugs fixed. And some features added :)
*/

// <nowiki>
( async function () {
	const DEFAULT_DECLINE_REASON = '{{subst:Decline reason here}}';
	const ADVERT = ' ([[User:Novem Linguae/Scripts/UnblockReview.js|unblock-review]])';
	const PAUSED_NOTICE_HTML = `
		<div class="cdx-message cdx-message--warning" aria-live="polite">
			<div class="cdx-message__content">
				Idletimestamp is present in this template. This unblock request is paused until the user replies.
				<a class="unblock-review-unpause" href="#">Unpause now.</a>
			</div>
		</div>
	`;
	const ON_HOLD_NOTICE_HTML = `
		<div class="cdx-message cdx-message--warning" aria-live="polite">
			<div class="cdx-message__content">
				This unblock request is paused until the blocking administrator responds.
				<a class="unblock-review-unpause" href="#">Unpause now.</a>
			</div>
		</div>
	`;

	async function execute() {
		const userTalkNamespace = 3;
		if ( mw.config.get( 'wgNamespaceNumber' ) !== userTalkNamespace ) {
			return;
		}
		addStyles();

		const userBlockBoxes = document.querySelectorAll( 'div.user-block' );
		for ( let i = 0, n = userBlockBoxes.length; i < n; i++ ) {
			const unblockDiv = userBlockBoxes[ i ];
			if ( unblockDiv.classList.contains( 'unblock' ) && unblockDiv.classList.contains( 'unblock-on-hold' ) ) {
				addPausedNotice( unblockDiv, true );
				continue;
			}
			if ( !isPendingUnblockRequest( unblockDiv ) ) {
				continue;
			}
			if ( hasIdletimestampParameter( unblockDiv ) ) {
				addPausedNotice( unblockDiv );
				continue;
			}
			const [ container, hrEl ] = addTextBoxAndButtons( unblockDiv );
			const hasUsernameParameter = unblockDiv.classList.contains( 'unblock-un' );
			addListeners( container, hrEl, hasUsernameParameter );
		}
	}

	function isPendingUnblockRequest( unblockDiv ) {
		return unblockDiv.classList.contains( 'unblock' ) &&
			!unblockDiv.classList.contains( 'unblock-on-hold' ) &&
			!unblockDiv.classList.contains( 'unblock-reviewed' ) &&
			!unblockDiv.classList.contains( 'unblock-auto' );
	}

	function addStyles() {
		mw.util.addCSS( `
			.unblock-review { display: flex; align-items: flex-start; justify-content: flex-start; gap: 1em }
			.unblock-review .reason-container { display: flex; flex-direction: column; align-items: flex-start; width: 40em }
			.unblock-review .cdx-text-area { width: 100% }
			#unblock-review-autoadd-template { width: 100%; box-sizing: border-box; }
			.unblock-review-reason { width: 100%; box-sizing: border-box; height: 10em }
			.unblock-review-buttons { display: flex; flex-direction: column; align-items: flex-start }
			.unblock-review-buttons button { margin: 0.25em }
		` );
	}

	function hasIdletimestampParameter( unblockDiv ) {
		const dataMw = unblockDiv.getAttribute( 'data-mw' );
		if ( !dataMw ) {
			return false;
		}
		let parsedDataMw;
		try {
			parsedDataMw = JSON.parse( dataMw );
		} catch ( e ) {
			mw.notify( 'UnblockReview error: unable to parse data-mw for unblock request.', { type: 'error' } );
			return false;
		}
		return Array.isArray( parsedDataMw.parts ) && parsedDataMw.parts.some( ( part ) => {
			const template = part.template;
			return template && template.target &&
				typeof template.target.wt === 'string' &&
				/^unblock(?:-|$)/i.test( template.target.wt ) &&
				template.params && Object.prototype.hasOwnProperty.call( template.params, 'idletimestamp' );
		} );
	}

	function addPausedNotice( unblockDiv, onHold = false ) {
		const container = document.createElement( 'div' );
		container.className = 'unblock-review';
		const hrEl = unblockDiv.querySelector( 'hr' );
		unblockDiv.insertBefore( container, hrEl.previousElementSibling );
		const hasUsernameParameter = unblockDiv.classList.contains( 'unblock-un' );
		showPausedNotice( container, hrEl, hasUsernameParameter, onHold );
	}

	function showPausedNotice( container, hrEl, hasUsernameParameter, onHold = false ) {
		container.innerHTML = onHold ? ON_HOLD_NOTICE_HTML : PAUSED_NOTICE_HTML;
		addListeners( container, hrEl, hasUsernameParameter, onHold );
	}

	function addTextBoxAndButtons( unblockDiv ) {
		const container = document.createElement( 'div' );
		container.className = 'unblock-review';
		// Note: The innerHtml of the button is sensitive. Is used to figure out which accept/decline wikitext to use. Don't add whitespace to it.
		container.innerHTML = `
			<div class="reason-container">
				<div class="cdx-text-area">
					<textarea class="cdx-text-area__textarea unblock-review-reason" placeholder="Reason for accepting/declining here">${ DEFAULT_DECLINE_REASON }</textarea>
				</div>
				<select class="cdx-select" id="unblock-review-autoadd-template">
					<option value="default" selected disabled>Select one of these templates to auto-add it above...</option>
					<option>{{subst:2nd chance}}</option>
					<option>{{subst:2nd chance autoload}}</option>
					<option>{{subst:2nd chance autoload/editintro}}</option>
					<option>{{subst:Decline reason here}}</option>
					<option>{{subst:Decline spam unblock request}}</option>
					<option>{{subst:Decline stale}}</option>
					<option>{{subst:Decline-ai}}</option>
					<option>{{subst:Declined unblock request for range block text}}</option>
				</select>
			</div>
			<div class="unblock-review-buttons">
				<button class="unblock-review-accept cdx-button cdx-button--action-progressive cdx-button--weight-primary">Accept</button>
				<button class="unblock-review-decline cdx-button cdx-button--action-destructive cdx-button--weight-primary">Decline</button>
				<button class="unblock-review-wait cdx-button cdx-button--action-default cdx-button--weight-primary">Pause until user responds</button>
				<button class="unblock-review-wait-admin cdx-button cdx-button--action-default cdx-button--weight-primary">Pause until blocking admin responds</button>
			</div>
			`;
		const hrEl = unblockDiv.querySelector( 'hr' );
		unblockDiv.insertBefore( container, hrEl.previousElementSibling );

		return [ container, hrEl ];
	}

	async function getBlockingAdmin() {
		const user = mw.config.get( 'wgNamespaceNumber' ) === 3 && mw.config.get( 'wgRelevantUserName' );
		if ( !user ) {
			return '';
		}
		const api = new mw.Api();
		let continuation;
		do {
			const data = await api.get( {
				action: 'query',
				list: 'logevents',
				letype: 'block',
				letitle: 'User:' + user,
				leprop: 'type|user|details',
				lelimit: 10,
				lecontinue: continuation
			} );
			for ( const event of data.query.logevents ) {
				if ( Object.prototype.hasOwnProperty.call( event, 'actionhidden' ) ) {
					return '';
				}
				if ( event.action === 'block' || event.action === 'reblock' ) {
					return event.user || '';
				}
			}
			continuation = data.continue && data.continue.lecontinue;
		} while ( continuation );
		return '';
	}

	function getAppealText( element ) {
		const copy = element.cloneNode( true );
		// Remove interface controls that are not part of the wikitext.
		const controls = copy.querySelectorAll( '.ext-discussiontools-init-replylink-buttons, .ext-checkuser-tempaccount-reveal-ip-button' );
		for ( let i = 0; i < controls.length; i++ ) {
			controls[ i ].remove();
		}
		return copy.textContent.trim();
	}

	function getAppealReason( hrEl, hasUsernameParameter ) {
		const reasonHeader = hrEl.nextElementSibling;
		const reasonElement = reasonHeader && reasonHeader.nextElementSibling;
		let appealReason;
		if ( hasUsernameParameter && reasonElement ) {
			// The requested username has extra links, while the reason is in a separate div.
			const usernameLink = reasonElement.firstElementChild;
			const reasonLabel = reasonElement.nextElementSibling;
			const usernameReason = reasonLabel && reasonLabel.nextElementSibling;
			if ( reasonElement.tagName === 'DIV' && usernameLink && usernameLink.tagName === 'A' &&
				reasonLabel && reasonLabel.tagName === 'B' && usernameReason && usernameReason.tagName === 'DIV' ) {
				const username = usernameLink.textContent.trim();
				const reason = getAppealText( usernameReason );
				if ( username && reason ) {
					appealReason = username + '|' + reason;
				}
			}
		} else if ( !hasUsernameParameter && reasonElement ) {
			appealReason = getAppealText( reasonElement );
		}
		return appealReason;
	}

	function getOnHoldAppealReason( hrEl ) {
		for ( let element = hrEl.nextElementSibling; element; element = element.nextElementSibling ) {
			const label = element.tagName === 'P' && element.querySelector( 'b' );
			if ( label && /^Request reason:?$/i.test( label.textContent.trim() ) ) {
				const reason = element.nextElementSibling;
				if ( reason && reason.tagName === 'DIV' ) {
					return getAppealText( reason );
				}
				return undefined;
			}
		}
		return undefined;
	}

	function addListeners( container, hrEl, hasUsernameParameter, onHold = false ) {
		$( container ).find( '#unblock-review-autoadd-template' ).on( 'change', function () {
			// eslint-disable-next-line no-jquery/no-sizzle
			const templateText = $( this ).find( 'option:selected' ).text() || $( this ).val() || '';
			$( container ).find( '.unblock-review-reason' ).val( templateText );
		} );

		$( container ).find( '.unblock-review-wait-admin' ).on( 'click', async function () {
			this.disabled = true;
			const blockingAdmin = await getBlockingAdmin().catch( ( e ) => {
				console.error( 'UnblockReview blocking administrator lookup failed:', e );
				return '';
			} );
			this.disabled = false;
			const selectedAdmin = window.prompt( 'Blocking administrator:', blockingAdmin );
			if ( selectedAdmin !== null ) {
				const appealReason = getAppealReason( hrEl, hasUsernameParameter );
				if ( !appealReason ) {
					mw.notify( 'UnblockReview error: unable to find request reason by scanning HTML', { type: 'error' } );
					return;
				}
				this.disabled = true;
				try {
					// eslint-disable-next-line no-undef
					const unblockReview = new UnblockReview();
					const title = mw.config.get( 'wgPageName' );
					const wikitext = await getWikitext( title );
					const updatedWikitext = unblockReview.processWaitForBlockingAdmin(
						wikitext, appealReason, selectedAdmin.trim(), hasUsernameParameter
					);
					await editPage( title, updatedWikitext, 'Putting unblock request on hold' + ADVERT );
					window.location.reload( true );
				} catch ( e ) {
					mw.notify( 'UnblockReview error: unable to put request on hold: ' + ( e.message || e ), { type: 'error' } );
				} finally {
					this.disabled = false;
				}
			}
		} );

		$( container ).find( '.unblock-review-unpause' ).on( 'click', async ( event ) => {
			event.preventDefault();
			const appealReason = onHold ? getOnHoldAppealReason( hrEl ) : getAppealReason( hrEl, hasUsernameParameter );
			if ( appealReason === undefined || ( !onHold && !appealReason ) ) {
				mw.notify( 'UnblockReview error: unable to find request reason by scanning HTML', { type: 'error' } );
				return;
			}
			try {
				// eslint-disable-next-line no-undef
				const unblockReview = new UnblockReview();
				const title = mw.config.get( 'wgPageName' );
				const wikitext = await getWikitext( title );
				const updatedWikitext = onHold ?
					unblockReview.processRemoveHold( wikitext, appealReason ) :
					unblockReview.processUnpause( wikitext, appealReason, hasUsernameParameter );
				await editPage( title, updatedWikitext, ( onHold ? 'Taking unblock request off hold' : 'Unpausing unblock request' ) + ADVERT );
				window.location.reload( true );
			} catch ( e ) {
				mw.notify( 'UnblockReview error: ' + ( e.message || e ), { type: 'error' } );
			}
		} );

		$( container ).find( '.unblock-review-accept, .unblock-review-decline, .unblock-review-wait' ).on( 'click', async function () {
			// look at the innerHtml of the button to see if it says "Accept" or "Decline"
			const acceptOrDecline = this.classList.contains( 'unblock-review-wait' ) ? 'wait' : $( this ).text().toLowerCase();
			const appealReason = getAppealReason( hrEl, hasUsernameParameter );
			// FIXME: should handle this case (|reason=\nText, https://github.com/NovemLinguae/UserScripts/issues/240) instead of throwing an error
			if ( !appealReason ) {
				mw.notify( 'UnblockReview error: unable to find decline reason by scanning HTML', { type: 'error' } );
				return;
			}

			// change wikitext
			// eslint-disable-next-line no-undef
			const unblockReview = new UnblockReview();
			const title = mw.config.get( 'wgPageName' );
			const wikitext = await getWikitext( title );
			if ( acceptOrDecline === 'wait' ) {
				let updatedWikitext;
				try {
					updatedWikitext = unblockReview.processWaitForUserResponse( wikitext, appealReason, hasUsernameParameter );
				} catch ( e ) {
					mw.notify( 'UnblockReview error: ' + e.message, { type: 'error' } );
					return;
				}
				await editPage( title, updatedWikitext, 'Pausing unblock request' + ADVERT );
				showPausedNotice( container, hrEl, hasUsernameParameter );
				return;
			}
			const acceptDeclineReason = container.querySelector( 'textarea' ).value;
			let wikitext2;
			try {
				wikitext2 = unblockReview.processAcceptOrDecline(
					wikitext,
					appealReason,
					acceptDeclineReason,
					DEFAULT_DECLINE_REASON,
					acceptOrDecline,
					hasUsernameParameter
				);
			} catch ( e ) {
				mw.notify( 'UnblockReview error: ' + e.message, { type: 'error' } );

				await logErrorToWiki(
					acceptDeclineReason,
					acceptOrDecline,
					e.message
				);

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

	async function logErrorToWiki( acceptDeclineReason, acceptOrDecline, errorMessage ) {
		const errorLogTitle = 'User:Novem Linguae/Scripts/UnblockReview/ErrorLog';
		const currentUser = mw.config.get( 'wgUserName' );
		const pageTitle = mw.config.get( 'wgPageName' ).replace( /_/g, ' ' );
		const revisionId = mw.config.get( 'wgRevisionId' );
		const oldidLink = `${ mw.config.get( 'wgServer' ) }/w/index.php?oldid=${ revisionId }&action=edit`;

		const now = new Date();
		const dateTime = now.toLocaleString( 'en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		} ).replace( /(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6' );

		const logEntry = `

== ${ dateTime } ==
* Unblocking admin: <code>${ currentUser }</code>
* Page title: <code>${ pageTitle.replace( /_/g, ' ' ) }</code>
* Wikitext: [${ oldidLink }]
* AI prompt:
<pre>UnblockReview: Performing the "${ acceptOrDecline }" action with the below fails. Please write test and fix.

errorMessage:
\`\`\`
${ errorMessage }
\`\`\`

acceptDeclineReason:
\`\`\`
${ acceptDeclineReason }
\`\`\`

\`\`\`
[WIKITEXT, REDUCED TO SMALLEST CASE VIA TESTING ON TESTWIKI. USE WIKITEXT LINK ABOVE.]
\`\`\`

\`\`\`
[HTML. TESTWIKI -> INSPECT -> DIV -> COPY -> OUTER HTML]
\`\`\`</pre>
`;

		try {
			await appendToPage( errorLogTitle, logEntry, 'Logging UnblockReview error' + ADVERT );
		} catch ( logError ) {
			console.error( 'Failed to log error to wiki:', logError );
		}
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

	async function appendToPage( title, wikitext, editSummary ) {
		await ( new mw.Api() ).postWithToken( 'csrf', {
			action: 'edit',
			title: title,
			summary: editSummary,
			appendtext: wikitext
		} );
	}

	$( async () => {
		await mw.loader.using( [ 'mediawiki.api', 'mediawiki.util', 'codex-styles' ] ).then( async () => {
			await execute();
		} );
	} );
}() );
// </nowiki>
