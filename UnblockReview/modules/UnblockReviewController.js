import { UnblockReviewWikitext } from './UnblockReviewWikitext.js';

export class UnblockReviewController {
	constructor() {
		this.DEFAULT_DECLINE_REASON = '{{subst:Decline reason here}}';
		this.ADVERT = ' ([[User:Novem Linguae/Scripts/UnblockReview.js|unblock-review]])';
		this.PAUSED_NOTICE_HTML = `
		<div class="cdx-message cdx-message--warning" aria-live="polite">
			<div class="cdx-message__content">
				Idletimestamp is present in this template. This unblock request is paused until the user replies.
				<button type="button" class="unblock-review-unpause cdx-button cdx-button--action-default cdx-button--weight-primary">Unpause</button>
			</div>
		</div>
	`;
		this.ON_HOLD_NOTICE_HTML = `
		<div class="cdx-message cdx-message--warning" aria-live="polite">
			<div class="cdx-message__content">
				This unblock request is paused until the blocking administrator responds.
				<button type="button" class="unblock-review-unpause cdx-button cdx-button--action-default cdx-button--weight-primary">Unpause</button>
			</div>
		</div>
	`;
		this.revisionId = mw.config.get( 'wgCurRevisionId' );
	}

	async execute() {
		const userTalkNamespace = 3;
		if ( mw.config.get( 'wgNamespaceNumber' ) !== userTalkNamespace ) {
			return;
		}

		this.addStyles();

		const userBlockBoxes = document.querySelectorAll( 'div.user-block' );
		for ( let i = 0, n = userBlockBoxes.length; i < n; i++ ) {
			const unblockDiv = userBlockBoxes[ i ];
			if ( unblockDiv.classList.contains( 'unblock' ) && unblockDiv.classList.contains( 'unblock-on-hold' ) ) {
				this.addPausedNotice( unblockDiv, true );
				continue;
			}
			if ( !this.isPendingUnblockRequest( unblockDiv ) ) {
				continue;
			}
			if ( this.hasIdletimestampParameter( unblockDiv ) ) {
				this.addPausedNotice( unblockDiv );
				continue;
			}
			const [ container, hrEl ] = this.addTextBoxAndButtons( unblockDiv );
			const hasUsernameParameter = unblockDiv.classList.contains( 'unblock-un' );
			this.addListeners( container, hrEl, hasUsernameParameter );
		}
	}

	isPendingUnblockRequest( unblockDiv ) {
		return this.isOpenUnblockRequest( unblockDiv ) &&
			!unblockDiv.classList.contains( 'unblock-on-hold' );
	}

	isOpenUnblockRequest( unblockDiv ) {
		return unblockDiv.classList.contains( 'unblock' ) &&
			!unblockDiv.classList.contains( 'unblock-reviewed' ) &&
			!unblockDiv.classList.contains( 'unblock-auto' );
	}

	getOpenUnblockRequestPosition( container ) {
		const clickedRequest = container.closest( 'div.user-block' );
		const unblockRequests = Array.from( document.querySelectorAll( 'div.user-block' ) )
			.filter( ( unblockDiv ) => this.isOpenUnblockRequest( unblockDiv ) );
		const index = unblockRequests.indexOf( clickedRequest );
		if ( index === -1 ) {
			return null;
		}
		return { index: index, count: unblockRequests.length };
	}

	getOpenUnblockRequestOrdinal( container ) {
		const position = this.getOpenUnblockRequestPosition( container );
		if ( !position ) {
			return null;
		}
		const ordinal = position.index + 1;
		const lastTwoDigits = ordinal % 100;
		let suffix = 'th';
		if ( lastTwoDigits < 11 || lastTwoDigits > 13 ) {
			const lastDigit = ordinal % 10;
			if ( lastDigit === 1 ) {
				suffix = 'st';
			} else if ( lastDigit === 2 ) {
				suffix = 'nd';
			} else if ( lastDigit === 3 ) {
				suffix = 'rd';
			}
		}
		return ordinal + suffix;
	}

	addStyles() {
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

	disableAllButtons() {
		const buttons = document.querySelectorAll( '.unblock-review button' );
		for ( let i = 0; i < buttons.length; i++ ) {
			buttons[ i ].disabled = true;
		}
	}

	enableAllButtons() {
		const buttons = document.querySelectorAll( '.unblock-review button' );
		for ( let i = 0; i < buttons.length; i++ ) {
			buttons[ i ].disabled = false;
		}
	}

	hasIdletimestampParameter( unblockDiv ) {
		const about = unblockDiv.getAttribute( 'about' );
		const matchingDataMwElement = about ?
			Array.from( document.querySelectorAll( '[about][data-mw]' ) )
				.find( ( element ) => element.getAttribute( 'about' ) === about ) :
			null;
		const dataMwElement = matchingDataMwElement || unblockDiv.closest( '[data-mw]' );
		const dataMw = dataMwElement && dataMwElement.getAttribute( 'data-mw' );
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

	addPausedNotice( unblockDiv, onHold = false ) {
		const container = document.createElement( 'div' );
		container.className = 'unblock-review';
		const hrEl = unblockDiv.querySelector( 'hr' );
		unblockDiv.insertBefore( container, hrEl.previousElementSibling );
		const hasUsernameParameter = unblockDiv.classList.contains( 'unblock-un' );
		this.showPausedNotice( container, hrEl, hasUsernameParameter, onHold );
	}

	showPausedNotice( container, hrEl, hasUsernameParameter, onHold = false ) {
		container.innerHTML = onHold ? this.ON_HOLD_NOTICE_HTML : this.PAUSED_NOTICE_HTML;
		this.addListeners( container, hrEl, hasUsernameParameter, onHold );
	}

	addTextBoxAndButtons( unblockDiv ) {
		const container = document.createElement( 'div' );
		container.className = 'unblock-review';
		// Note: The innerHtml of the button is sensitive. Is used to figure out which accept/decline wikitext to use. Don't add whitespace to it.
		container.innerHTML = `
			<div class="reason-container">
				<div class="cdx-text-area">
					<textarea class="cdx-text-area__textarea unblock-review-reason" placeholder="Reason for accepting/declining here">${ this.DEFAULT_DECLINE_REASON }</textarea>
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
				<button class="unblock-review-wait-user cdx-button cdx-button--action-default cdx-button--weight-primary">Pause until user responds</button>
				<button class="unblock-review-wait-admin cdx-button cdx-button--action-default cdx-button--weight-primary">Pause until blocking admin responds</button>
			</div>
			`;
		const hrEl = unblockDiv.querySelector( 'hr' );
		unblockDiv.insertBefore( container, hrEl.previousElementSibling );

		return [ container, hrEl ];
	}

	async getBlockingAdmin() {
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

	getAppealText( element ) {
		const copy = element.cloneNode( true );
		// Remove interface controls that are not part of the wikitext.
		const controls = copy.querySelectorAll( '.ext-discussiontools-init-replylink-buttons, .ext-checkuser-tempaccount-reveal-ip-button' );
		for ( let i = 0; i < controls.length; i++ ) {
			controls[ i ].remove();
		}
		this.compensateForDisplayScripts( copy );
		return copy.textContent.trim();
	}

	compensateForDisplayScripts( copy ) {
		// ShowLocalTime gadget changes the timestamp in the signature
		const localizedTimes = copy.querySelectorAll( 'span.localcomments[title]' );
		for ( let i = 0; i < localizedTimes.length; i++ ) {
			const originalTime = localizedTimes[ i ].getAttribute( 'title' );
			if ( /^\d{1,2}:\d{2}, \d{1,2} [A-Z][a-z]+ \d{4} \(UTC\)$/.test( originalTime ) ) {
				localizedTimes[ i ].textContent = originalTime;
			}
		}
		// ShowUserGender user script inserts its configured text as a separate node after user links.
		if ( window.SHOW_USER_GENDER && typeof window.SHOW_USER_GENDER === 'object' ) {
			const markers = Object.values( window.SHOW_USER_GENDER ).filter(
				( value ) => typeof value === 'string' && value !== '' && !/[<>]/.test( value )
			);
			const userLinks = copy.querySelectorAll( 'a.userlink' );
			for ( let i = 0; i < userLinks.length; i++ ) {
				const marker = userLinks[ i ].nextSibling;
				const href = userLinks[ i ].getAttribute( 'href' ) || '';
				if ( /(?:\/wiki\/|[?&]title=)User(?::|%3a)/i.test( href ) &&
					marker && marker.nodeType === 3 && markers.includes( marker.nodeValue ) ) {
					marker.remove();
				}
			}
		}
	}

	getAppealReason( hrEl, hasUsernameParameter ) {
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
				const reason = this.getAppealText( usernameReason );
				if ( username && reason ) {
					appealReason = username + '|' + reason;
				}
			}
		} else if ( !hasUsernameParameter && reasonElement ) {
			appealReason = this.getAppealText( reasonElement );
		}
		return appealReason;
	}

	getOnHoldAppealReason( hrEl ) {
		for ( let element = hrEl.nextElementSibling; element; element = element.nextElementSibling ) {
			const label = element.tagName === 'P' && element.querySelector( 'b' );
			if ( label && /^Request reason:?$/i.test( label.textContent.trim() ) ) {
				const reason = element.nextElementSibling;
				if ( reason && reason.tagName === 'DIV' ) {
					return this.getAppealText( reason );
				}
				return undefined;
			}
		}
		return undefined;
	}

	addListeners( container, hrEl, hasUsernameParameter, onHold = false ) {
		const controller = this;
		$( container ).find( '#unblock-review-autoadd-template' ).on( 'change', function () {
			// eslint-disable-next-line no-jquery/no-sizzle
			const templateText = $( this ).find( 'option:selected' ).text() || $( this ).val() || '';
			$( container ).find( '.unblock-review-reason' ).val( templateText );
		} );

		$( container ).find( '.unblock-review-wait-admin' ).on( 'click', () => {
			controller.disableAllButtons();
			return controller.handleWaitForAdmin( container, hrEl, hasUsernameParameter );
		} );

		$( container ).find( '.unblock-review-unpause' ).on( 'click', ( event ) => {
			this.disableAllButtons();
			return this.handleUnpause( event, container, hrEl, hasUsernameParameter, onHold );
		} );

		$( container ).find( '.unblock-review-accept, .unblock-review-decline, .unblock-review-wait-user' ).on( 'click', function () {
			controller.disableAllButtons();
			return controller.handleReviewAction( this, container, hrEl, hasUsernameParameter );
		} );
	}

	async handleWaitForAdmin( container, hrEl, hasUsernameParameter ) {
		const requestPosition = this.getOpenUnblockRequestPosition( container );
		const blockingAdmin = await this.getBlockingAdmin().catch( ( e ) => {
			console.error( 'UnblockReview blocking administrator lookup failed:', e );
			return '';
		} );
		const selectedAdmin = window.prompt( 'Blocking administrator:', blockingAdmin );
		if ( selectedAdmin !== null ) {
			const appealReason = this.getAppealReason( hrEl, hasUsernameParameter );
			if ( !appealReason ) {
				mw.notify( 'UnblockReview error: unable to find request reason by scanning HTML', { type: 'error' } );
				return;
			}
			try {
				const unblockReview = new UnblockReviewWikitext();
				const title = mw.config.get( 'wgPageName' );
				const wikitext = await this.getWikitextFromRevisionId( this.revisionId );
				const updatedWikitext = unblockReview.processWaitForBlockingAdmin(
					wikitext, appealReason, selectedAdmin.trim(), hasUsernameParameter, requestPosition
				);
				if ( await this.editPage( title, updatedWikitext, 'Putting unblock request on hold' + this.ADVERT ) ) {
					window.location.reload( true );
				}
			} catch ( e ) {
				mw.notify( 'UnblockReview error: unable to put request on hold: ' + ( e.message || e ), { type: 'error' } );
				await this.logRequestSelectionError( e, 'wait-admin', appealReason, container );
			}
		}
	}

	async handleUnpause( event, container, hrEl, hasUsernameParameter, onHold ) {
		event.preventDefault();
		const requestPosition = this.getOpenUnblockRequestPosition( container );
		const appealReason = onHold ? this.getOnHoldAppealReason( hrEl ) : this.getAppealReason( hrEl, hasUsernameParameter );
		if ( appealReason === undefined || ( !onHold && !appealReason ) ) {
			mw.notify( 'UnblockReview error: unable to find request reason by scanning HTML', { type: 'error' } );
			return;
		}
		try {
			const unblockReview = new UnblockReviewWikitext();
			const title = mw.config.get( 'wgPageName' );
			const wikitext = await this.getWikitextFromRevisionId( this.revisionId );
			const updatedWikitext = onHold ?
				unblockReview.processRemoveHold( wikitext, appealReason, requestPosition ) :
				unblockReview.processUnpause( wikitext, appealReason, hasUsernameParameter, requestPosition );
			if ( await this.editPage( title, updatedWikitext, ( onHold ? 'Taking unblock request off hold' : 'Unpausing unblock request' ) + this.ADVERT ) ) {
				window.location.reload( true );
			}
		} catch ( e ) {
			mw.notify( 'UnblockReview error: ' + ( e.message || e ), { type: 'error' } );
			await this.logRequestSelectionError(
				e, onHold ? 'unpause-on-hold' : 'unpause', appealReason, container
			);
		}
	}

	/**
	 * Handle accept, decline, or idletimestamp (pause until user responds) actions.
	 *
	 * @param {HTMLElement} button - The clicked button.
	 * @param {HTMLElement} container - The request controls container.
	 * @param {HTMLElement} hrEl - The separator preceding the request reason.
	 * @param {boolean} hasUsernameParameter - Whether the request includes a separate username.
	 */
	async handleReviewAction( button, container, hrEl, hasUsernameParameter ) {
		// look at the innerHtml of the button to see if it says "Accept" or "Decline"
		const acceptOrDecline = button.classList.contains( 'unblock-review-wait-user' ) ? 'wait-user' : $( button ).text().toLowerCase();
		const appealReason = this.getAppealReason( hrEl, hasUsernameParameter );
		if ( !appealReason ) {
			mw.notify( 'UnblockReview error: unable to find decline reason by scanning HTML', { type: 'error' } );
			return;
		}
		const requestPosition = this.getOpenUnblockRequestPosition( container );

		// change wikitext
		const unblockReview = new UnblockReviewWikitext();
		const title = mw.config.get( 'wgPageName' );
		let wikitext;
		try {
			wikitext = await this.getWikitextFromRevisionId( this.revisionId );
		} catch ( e ) {
			mw.notify( 'UnblockReview error: unable to load page revision: ' + ( e.message || e ), { type: 'error' } );
			return;
		}
		if ( acceptOrDecline === 'wait-user' ) {
			let updatedWikitext;
			try {
				updatedWikitext = unblockReview.processWaitForUserResponse(
					wikitext, appealReason, hasUsernameParameter, requestPosition
				);
			} catch ( e ) {
				mw.notify( 'UnblockReview error: ' + e.message, { type: 'error' } );
				await this.logRequestSelectionError( e, 'wait-user', appealReason, container );
				return;
			}
			const result = await this.editPage( title, updatedWikitext, 'Pausing unblock request' + this.ADVERT );
			if ( !result ) {
				return;
			}
			const hasInvalidNewRevisionId = !result.edit || !Number.isInteger( result.edit.newrevid ) || result.edit.newrevid <= 0;
			if ( hasInvalidNewRevisionId ) {
				mw.notify( 'UnblockReview error: the edit response did not contain a new revision ID. Refresh the page before continuing.', { type: 'error', autoHide: false } );
				return;
			}
			this.revisionId = result.edit.newrevid;
			this.showPausedNotice( container, hrEl, hasUsernameParameter );
			this.enableAllButtons();
			return;
		}
		const acceptDeclineReason = container.querySelector( 'textarea' ).value;
		let wikitext2;
		try {
			wikitext2 = unblockReview.processAcceptOrDecline(
				wikitext,
				appealReason,
				acceptDeclineReason,
				this.DEFAULT_DECLINE_REASON,
				acceptOrDecline,
				hasUsernameParameter,
				requestPosition
			);
		} catch ( e ) {
			mw.notify( 'UnblockReview error: ' + e.message, { type: 'error' } );

			await this.logErrorToWiki(
				acceptDeclineReason,
				acceptOrDecline,
				e.message,
				container
			);

			return;
		}

		if ( wikitext === wikitext2 ) {
			mw.notify( 'UnblockReview error: unable to determine write location.', { type: 'error' } );
			return;
		}

		const acceptingOrDeclining = ( acceptOrDecline === 'accept' ? 'Accepting' : 'Declining' );
		const editSummary = acceptingOrDeclining + ' unblock request' + this.ADVERT;
		if ( await this.editPage( title, wikitext2, editSummary ) ) {
			window.location.reload( true );
		}
	}

	async logErrorToWiki( acceptDeclineReason, acceptOrDecline, errorMessage, container ) {
		const errorLogTitle = 'User:Novem Linguae/Scripts/UnblockReview/ErrorLog';
		const currentUser = mw.config.get( 'wgUserName' );
		const pageTitle = mw.config.get( 'wgPageName' ).replace( /_/g, ' ' );
		const revisionId = mw.config.get( 'wgRevisionId' );
		const oldidLink = `${ mw.config.get( 'wgServer' ) }/w/index.php?oldid=${ revisionId }&action=edit`;
		const openUnblockRequestOrdinal = this.getOpenUnblockRequestOrdinal( container );
		const requestDescription = openUnblockRequestOrdinal ?
			`the ${ openUnblockRequestOrdinal } open unblock request` :
			'an open unblock request whose position could not be determined';

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
* Error occurred in ${ requestDescription }.
* Wikitext: [${ oldidLink }]
* Suggested test location: [[testwiki:User talk:NovemBot]]
* AI prompt:
<pre>UnblockReview: Performing the "${ acceptOrDecline }" action with the below fails. Please write test and fix. Once you are sure of the root cause, you can make test variables such as wikitext and acceptDeclineReason small (like 1 sentence).

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
			await this.appendToPage( errorLogTitle, logEntry, 'Logging UnblockReview error' + this.ADVERT );
		} catch ( logError ) {
			console.error( 'Failed to log error to wiki:', logError );
		}
	}

	async logRequestSelectionError( error, action, appealReason, container ) {
		const errorMessage = error.message || String( error );
		if ( /^(?:Unable to identify the clicked open unblock request|Open unblock request count mismatch|The clicked (?:open unblock request|request|on-hold request))/.test( errorMessage ) ) {
			await this.logErrorToWiki( appealReason, action, errorMessage, container );
		}
	}

	async getLatestRevisionId() {
		const data = await ( new mw.Api() ).get( {
			action: 'query',
			prop: 'revisions',
			rvprop: 'ids',
			rvlimit: 1,
			titles: mw.config.get( 'wgPageName' )
		} );
		const pages = data.query && data.query.pages;
		const page = pages && pages[ Object.keys( pages )[ 0 ] ];
		const revisionId = page && page.revisions && page.revisions[ 0 ] && page.revisions[ 0 ].revid;
		if ( !Number.isInteger( revisionId ) || revisionId <= 0 ) {
			throw new Error( 'No latest revision ID returned by the API.' );
		}
		return revisionId;
	}

	async getWikitextFromRevisionId( revisionId ) {
		const data = await ( new mw.Api() ).get( {
			format: 'json',
			action: 'query',
			prop: 'revisions',
			rvprop: 'content',
			revids: revisionId
		} );
		const pageId = Object.keys( data.query.pages )[ 0 ];
		const wikitext = data.query.pages[ pageId ].revisions[ 0 ][ '*' ];
		return wikitext;
	}

	async editPage( title, wikitext, editSummary ) {
		// Edit conflict detection. Using baserevid or basetimestamp in the API query is pretty narrow edit conflict detection that only detects wikitext changes in the immediate neighborhood of the change. Saving a revision ID and they re-checking it right before the edit offers broader edit conflict detection, including moved page detection (e.g. user rename and then their user talk page gets moved).
		const latestRevisionId = await this.getLatestRevisionId();
		if ( latestRevisionId !== this.revisionId ) {
			mw.notify( 'Edit conflict. Someone else has moved or edited the page. Copy whatever you typed into the reason box if you would like to save it, then refresh the page.', { type: 'error', autoHide: false } );
			return null;
		}

		try {
			const result = await ( new mw.Api() ).postWithToken( 'csrf', {
				action: 'edit',
				title: title,
				summary: editSummary,
				text: wikitext
			} );
			if ( !result.edit || result.edit.result !== 'Success' ) {
				throw new Error( 'The API did not report a successful edit: ' + JSON.stringify( result ) );
			}
			return result;
		} catch ( e ) {
			mw.notify( 'UnblockReview error: unable to save page: ' + ( e.message || e ), { type: 'error' } );
			return null;
		}
	}

	async appendToPage( title, wikitext, editSummary ) {
		await ( new mw.Api() ).postWithToken( 'csrf', {
			action: 'edit',
			title: title,
			summary: editSummary,
			appendtext: wikitext
		} );
	}
}
