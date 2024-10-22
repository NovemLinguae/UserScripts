// <nowiki>

/*

A typical user rights log entry might look like this:

	11:29, August 24, 2021 ExampleUser1 talk contribs changed group membership for ExampleUser2 from edit filter helper, autopatrolled, extended confirmed user, page mover, new page reviewer, pending changes reviewer, rollbacker and template editor to autopatrolled, extended confirmed user, pending changes reviewer and rollbacker (inactive 1+ years. should you return and require access again please see WP:PERM) (thank)

What the heck perms were removed? Hard to tell right? This user script adds a "DIFF" of the perms that were added or removed, on its own line, and highlights it green for added, yellow for removed.

	[ADDED template editor] [REMOVED edit filter helper, patroller]

This script works in Special:UserRights, in watchlists, and when clicking "rights" in the user script User:BradV/Scripts/SuperLinks.js

*/

class UserRightsDiff {
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
		let text = this.$( el ).text();
		let from, to;
		try {
			text = this.deleteParenthesesAndTags( text );
			text = this.deleteBeginningOfLogEntry( text );
			const matches = / from (.*?) to (.*?)(?: \(.*)?$/.exec( text );
			from = this.permStringToArray( matches[ 1 ] );
			to = this.permStringToArray( matches[ 2 ] );
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

	/** Don't delete "(none)". Delete all other parentheses and tags. */
	deleteParenthesesAndTags( text ) {
		// delete unicode character U+200E. this whitespace character shows up on watchlists, and causes an extra space if not deleted.
		text = text.replace( '\u200E', '' );
		// get rid of 2 layers of nested parentheses. will help with some edge cases.
		text = text.replace( /\([^()]*\([^()]*\)[^()]*\)/gs, '' );
		// get rid of 1 layer of nested parentheses, except for (none)
		text = text.replace( /(?!\(none\))\(.*?\){1,}/gs, '' );
		// remove Tag: and anything after it
		text = text.replace( / Tags?:.*?$/, '' );
		// cleanup so it's easier to write unit tests (output doesn't have extra spaces in it)
		text = text.replace( / {2,}/gs, ' ' );
		text = text.replace( /(\S) ,/gs, '$1,' );
		text = text.trim();
		return text;
	}

	/** Fixes a bug where the username contains the word "from", which is searched for by a RegEx later. */
	deleteBeginningOfLogEntry( text ) {
		text = text.replace( /^.*changed group membership for .* from /, ' from ' );
		text = text.replace( /^.*was automatically updated from /gs, ' from ' );
		return text;
	}

	permStringToArray( string ) {
		string = string.replace( /^(.*) and (.*?$)/, '$1, $2' );
		if ( string === '(none)' ) {
			return [];
		}
		const array = string.split( ', ' ).map( ( str ) => {
			str = str.trim();
			// remove fragments of punctuation. can result when trying to delete nested parentheses. will delete fragments such as " .)"
			str = str.replace( /[\s.,/#!$%^&*;:{}=\-_`~()]{2,}/g, '' );
			return str;
		} );
		return array;
	}

	permArrayToString( array ) {
		array = array.join( ', ' );
		return array;
	}
}

$( () => {
	( new UserRightsDiff( $ ) ).execute();
} );

// </nowiki>
