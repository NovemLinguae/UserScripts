export class UserRightsDiffStringProcessor {

	/** Returns 2 arrays. For example: [ [ 'autopatrolled' ], [ 'sysop' ] ] */
	logEntryStringToArrays( text ) {
		text = this.deleteParenthesesAndTags( text );
		text = this.deleteBeginningOfLogEntry( text );
		const matches = / from (.*?) to (.*?)(?: \(.*)?$/.exec( text );
		const from = this.permStringToArray( matches[ 1 ] );
		const to = this.permStringToArray( matches[ 2 ] );
		return [ from, to ];
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
}
