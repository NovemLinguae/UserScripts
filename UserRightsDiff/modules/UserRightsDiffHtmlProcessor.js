import { UserRightsDiffStringProcessor } from './UserRightsDiffStringProcessor';

export class UserRightsDiffHtmlProcessor {
	constructor( $ ) {
		// eslint-disable-next-line no-jquery/variable-pattern
		this.$ = $;
	}

	execute() {
		// User:BradV/Scripts/SuperLinks.js
		this.onDomNodeInserted( 'mw-logevent-loglines', this.checkLog, this );

		// Special:UserRights, Special:Log, Special:Watchlist
		this.checkLog( this );
	}

	onDomNodeInserted( htmlClassString, fn, that ) {
		const observer = new MutationObserver( ( mutations ) => {
			mutations.forEach( ( mutation ) => {
				const htmlWasAdded = mutation.addedNodes.length;
				if ( htmlWasAdded ) {
					mutation.addedNodes.forEach( ( node ) => {
						if ( node.classList && node.classList.contains( htmlClassString ) ) {
							fn( that );
						}
					} );
				}
			} );
		} );
		const config = { childList: true, subtree: true };
		observer.observe( document.body, config );
	}

	checkLog( that ) {
		// don't run twice on the same page
		if ( that.$( '.user-rights-diff' ).length === 0 ) {
			// Special:UserRights, Special:Log, BradV SuperLinks
			that.$( '.mw-logevent-loglines .mw-logline-rights' ).each( function () {
				that.checkLine( this );
			} );
			// Special:Watchlist
			that.$( '.mw-changeslist-log-rights .mw-changeslist-log-entry' ).each( function () {
				that.checkLine( this );
			} );
		}
	}

	checkLine( el ) {
		const text = this.$( el ).text();
		const stringProcessor = new UserRightsDiffStringProcessor();
		let from, to;
		try {
			[ from, to ] = stringProcessor.logEntryStringToArrays( text );
		} catch ( err ) {
			throw new Error( 'UserRightsDiff.js error. Error was: ' + err + '. Input text was: ' + this.$( el ).text() );
		}
		let added = to.filter( ( x ) => !from.includes( x ) );
		let removed = from.filter( ( x ) => !to.includes( x ) );
		added = added.length > 0 ?
			'<span class="user-rights-diff" style="background-color:lawngreen">[ADDED: ' + this.permArrayToString( added ) + ']</span>' :
			'';
		removed = removed.length > 0 ?
			'<span class="user-rights-diff" style="background-color:yellow">[REMOVED: ' + this.permArrayToString( removed ) + ']</span>' :
			'';
		const noChange = added.length === 0 && removed.length === 0 ?
			'<span class="user-rights-diff" style="background-color:lightgray">[NO CHANGE]</span>' :
			'';
		this.$( el ).append( `<br />${ added } ${ removed } ${ noChange }` );
	}

	permArrayToString( array ) {
		array = array.join( ', ' );
		return array;
	}
}
