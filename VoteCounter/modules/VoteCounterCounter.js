export class VoteCounterCounter {
	/** Count the votes in this constructor. Then use a couple public methods (below) to retrieve the vote counts in whatever format the user desires. */
	constructor( wikicode, votesToCount ) {
		this.originalWikicode = wikicode;
		this.modifiedWikicode = wikicode;
		this.votesToCount = votesToCount;
		this.voteSum = 0;

		this._countVotes();

		if ( !this.votes ) {
			return;
		}

		// if yes or no votes are not present in wikitext, but are present in the votes array, they are likely false positives, delete them from the votes array
		const yesNoVotesForSurePresent = this.modifiedWikicode.match( /('''yes'''|'''no''')/gi );
		if ( !yesNoVotesForSurePresent ) {
			delete this.votes.yes;
			delete this.votes.no;
		}

		for ( const count of Object.entries( this.votes ) ) {
			this.voteSum += count[ 1 ];
		}

		this.voteString = '';
		for ( const key in this.votes ) {
			let humanReadable = key;
			humanReadable = humanReadable.replace( /\(\?<!.+\)/, '' ); // remove regex lookbehind
			humanReadable = this._capitalizeFirstLetter( humanReadable );
			this.voteString += this.votes[ key ] + ' ' + humanReadable + ', ';
		}
		this.voteString = this.voteString.slice( 0, -2 ); // trim extra comma at end

		this.voteString = this._htmlEscape( this.voteString );
	}

	getHeadingForJQuery() {
		const firstLine = this.originalWikicode.split( '\n' )[ 0 ];
		const htmlHeadingID = this._convertWikicodeHeadingToHTMLSectionID( firstLine );
		// Must use [id=""] instead of # here, because the ID may have characters not allowed in a normal ID. A normal ID can only have [a-zA-Z0-9_-], and some other restrictions.
		const jQuerySearchString = '[id="' + this._doubleQuoteEscape( htmlHeadingID ) + '"]';
		return jQuerySearchString;
	}

	getVotes() {
		return this.votes;
	}

	getVoteSum() {
		return this.voteSum;
	}

	/* HTML escaped */
	getVoteString() {
		return this.voteString;
	}

	_countRegExMatches( matches ) {
		return ( matches || [] ).length;
	}

	_capitalizeFirstLetter( str ) {
		return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
	}

	_countVotes() {
		// delete all strikethroughs
		this.modifiedWikicode = this.modifiedWikicode.replace( /<strike>[^<]*<\/strike>/gmi, '' );
		this.modifiedWikicode = this.modifiedWikicode.replace( /<s>[^<]*<\/s>/gmi, '' );
		this.modifiedWikicode = this.modifiedWikicode.replace( /{{S\|[^}]*}}/gmi, '' );
		this.modifiedWikicode = this.modifiedWikicode.replace( /{{Strike\|[^}]*}}/gmi, '' );
		this.modifiedWikicode = this.modifiedWikicode.replace( /{{Strikeout\|[^}]*}}/gmi, '' );
		this.modifiedWikicode = this.modifiedWikicode.replace( /{{Strikethrough\|[^}]*}}/gmi, '' );

		this.votes = {};
		for ( const voteToCount of this.votesToCount ) {
			const regex = new RegExp( "'''[^']{0,30}" + voteToCount + "(?!ing comment)[^']{0,30}'''", 'gmi' ); // limit to 30 chars to reduce false positives. sometimes you can have '''bold''' bunchOfRandomTextIncludingKeep '''bold''', and the in between gets detected as a keep vote
			const matches = this.modifiedWikicode.match( regex );
			const count = this._countRegExMatches( matches );
			if ( !count ) {
				continue;
			} // only log it if there's votes for it
			this.votes[ voteToCount ] = count;
		}
	}

	_convertWikicodeHeadingToHTMLSectionID( lineOfWikicode ) {
		// remove == == from headings
		lineOfWikicode = lineOfWikicode.replace( /^=+\s*/, '' );
		lineOfWikicode = lineOfWikicode.replace( /\s*=+\s*$/, '' );

		// handle piped wikilinks, e.g. [[User:abc|abc]]
		lineOfWikicode = lineOfWikicode.replace( /\[\[[^[|]+\|([^[|]+)\]\]/gi, '$1' );
		// remove wikilinks
		lineOfWikicode = lineOfWikicode.replace( /\[\[:?/g, '' );
		lineOfWikicode = lineOfWikicode.replace( /\]\]/g, '' );
		// remove bold and italic
		lineOfWikicode = lineOfWikicode.replace( /'{2,5}/g, '' );
		// remove HTML tags
		lineOfWikicode = lineOfWikicode.replace( /<[^>]+>/g, '' );
		// handle {{t}} and {{tlx}}
		lineOfWikicode = lineOfWikicode.replace( /\{\{t\|/gi, '{{' );
		lineOfWikicode = lineOfWikicode.replace( /\{\{tlx\|/gi, '{{' );
		// handle {{u}}
		lineOfWikicode = lineOfWikicode.replace( /\{\{u\|([^}]+)\}\}/gi, '$1' );
		// convert multiple spaces to one space
		lineOfWikicode = lineOfWikicode.replace( / {2,}/gi, ' ' );

		// convert spaces to _
		lineOfWikicode = lineOfWikicode.replace( / /g, '_' );

		return lineOfWikicode;
	}

	_jQueryEscape( str ) {
		return str.replace( /(:|\.|\[|\]|,|=|@)/g, '\\$1' );
	}

	_doubleQuoteEscape( str ) {
		return str.replace( /"/g, '\\"' );
	}

	_htmlEscape( unsafe ) {
		return unsafe
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' )
			.replace( /"/g, '&quot;' )
			.replace( /'/g, '&#039;' );
	}
}
