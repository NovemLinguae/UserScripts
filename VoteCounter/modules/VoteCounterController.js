import { VoteCounterCounter } from './VoteCounterCounter';

export class VoteCounterController {
	async execute() {
		if ( !await this._shouldRun() ) {
			return;
		}

		this.isAfd = this.title.match( /^Wikipedia:Articles_for_deletion\//i );
		this.isMfd = this.title.match( /^Wikipedia:Miscellany_for_deletion\//i );
		const isGAR = this.title.match( /^Wikipedia:Good_article_reassessment\//i );

		this.listOfValidVoteStrings = this._getListOfValidVoteStrings();

		if ( this.isAfd || this.isMfd || isGAR ) {
			this._countVotesForEntirePage();
		} else {
			this._countVotesForEachHeading();
		}
	}

	_countVotesForEntirePage() {
		// delete everything above the first heading, to prevent the closer's vote from being counted
		this.wikicode = this.wikicode.replace( /^.*?(===.*)$/s, '$1' );

		// add a delete vote. the nominator is assumed to be voting delete
		if ( this.isAfd || this.isMfd ) {
			this.wikicode += "'''delete'''";
		}

		this.vcc = new VoteCounterCounter( this.wikicode, this.listOfValidVoteStrings );
		const voteString = this.vcc.getVoteString();
		if ( !voteString ) {
			return;
		}

		let percentsHTML = '';
		if ( this.isAfd || this.isMfd ) {
			percentsHTML = this._getAfdAndMfdPercentsHtml();
		}

		// generate HTML
		const allHTML = `<div id="VoteCounter"><span style="font-weight: bold;">${ voteString }</span> <small>(approximately)</small>${ percentsHTML }</div>`;

		this._insertHtmlAtTopOnly( allHTML );
	}

	_countVotesForEachHeading() {
		const listOfHeadingLocations = this._getListOfHeadingLocations( this.wikicode );
		const isXFD = this.title.match( /_for_(?:deletion|discussion)\//i );
		const numberOfHeadings = listOfHeadingLocations.length;

		// foreach heading
		for ( let i = 0; i < numberOfHeadings; i++ ) {
			const startPosition = listOfHeadingLocations[ i ];

			const endPosition = this._calculateSectionEndPosition( i, numberOfHeadings, this.wikicode, listOfHeadingLocations );

			let sectionWikicode = this.wikicode.slice( startPosition, endPosition ); // slice and substring (which both use (startPos, endPos)) are the same. substr(startPos, length) is deprecated.

			if ( isXFD ) {
				sectionWikicode = this._adjustVotesForEachHeading( sectionWikicode );
			}

			this.vcc = new VoteCounterCounter( sectionWikicode, this.listOfValidVoteStrings );

			// don't display votecounter string if there's less than 3 votes in the section
			const voteSum = this.vcc.getVoteSum();
			if ( voteSum < 3 ) {
				continue;
			}

			const voteString = this.vcc.getVoteString();
			const allHTML = `<div id="VoteCounter" style="color: darkgreen; border: 1px solid black; font-size: 14px;"><span style="font-weight: bold;">${ voteString }</span> <small>(approximately)</small></div>`;

			this._insertHtmlAtEachHeading( startPosition, allHTML );
		}
	}

	_adjustVotesForEachHeading( sectionWikicode ) {
		// add a vote for the nominator
		const proposeMerging = sectionWikicode.match( /'''Propose merging'''/i );
		if ( proposeMerging ) {
			sectionWikicode += "'''merge'''";
		} else {
			sectionWikicode += "'''delete'''";
		}

		// delete "result of the discussion was X", to prevent it from being counted
		sectionWikicode = sectionWikicode.replace( /The result of the discussion was.*'''[^']+'''.*$/igm, '' );

		return sectionWikicode;
	}

	_insertHtmlAtEachHeading( startPosition, allHtml ) {
		const isLead = startPosition === 0;
		if ( isLead ) {
			// insert HTML
			$( '#contentSub' ).before( allHtml );
		} else { // if ( isHeading )
			const headingForJQuery = this.vcc.getHeadingForJQuery( startPosition );

			const headingNotFound = !$( headingForJQuery ).length;
			if ( headingNotFound ) {
				console.error( 'User:Novem Linguae/Scripts/VoteCounter.js: ERROR: Heading ID not found. This indicates a bug in _convertWikicodeHeadingToHTMLSectionID() that Novem Linguae needs to fix. Please report this on his talk page along with the page name and heading ID. The heading ID is: ' + headingForJQuery );
			}

			// insert HTML
			$( headingForJQuery ).parent().first().after( allHtml );
		}
	}

	_insertHtmlAtTopOnly( allHtml ) {
		$( '#contentSub' ).before( allHtml );
	}

	_calculateSectionEndPosition( i, numberOfHeadings, wikicode, listOfHeadingLocations ) {
		const lastSection = i === numberOfHeadings - 1;
		if ( lastSection ) {
			return wikicode.length;
		} else {
			return listOfHeadingLocations[ i + 1 ]; // Don't subtract 1. That will delete a character.
		}
	}

	_getListOfHeadingLocations( wikicode ) {
		const matches = wikicode.matchAll( /(?<=\n)(?===)/g );
		const listOfHeadingLocations = [ 0 ]; // start with 0. count the lead as a heading
		for ( const match of matches ) {
			listOfHeadingLocations.push( match.index );
		}
		return listOfHeadingLocations;
	}

	_getAfdAndMfdPercentsHtml() {
		const counts = {};
		const votes = this.vcc.getVotes();
		for ( const key of this.listOfValidVoteStrings ) {
			let value = votes[ key ];
			if ( typeof value === 'undefined' ) {
				value = 0;
			}
			counts[ key ] = value;
		}
		const keep = counts.keep + counts.stubify + counts.stubbify + counts.TNT;
		const _delete = counts.delete + counts.redirect + counts.merge + counts.draftify + counts.userfy;
		const total = keep + _delete;
		let keepPercent = keep / total;
		let deletePercent = _delete / total;
		keepPercent = Math.round( keepPercent * 100 );
		deletePercent = Math.round( deletePercent * 100 );
		const percentsHTML = `<br /><span style="font-weight: bold;">${ keepPercent }% <abbr this.title="Keep, Stubify, TNT">Keep-ish</abbr>, ${ deletePercent }% <abbr this.title="Delete, Redirect, Merge, Draftify, Userfy">Delete-ish</abbr></span>`;
		return percentsHTML;
	}

	async _getWikicode() {
		const isDeletedPage = !mw.config.get( 'wgCurRevisionId' );
		if ( isDeletedPage ) {
			return '';
		}

		// grab title by revision ID, not by page title. this lets it work correctly if you're viewing an old revision of the page
		const revisionID = mw.config.get( 'wgRevisionId' );
		if ( !revisionID ) {
			return '';
		}

		const api = new mw.Api();
		const response = await api.get( {
			action: 'parse',
			oldid: revisionID,
			prop: 'wikitext',
			formatversion: '2',
			format: 'json'
		} );
		return response.parse.wikitext;
	}

	/** returns the pagename, including the namespace name, but with spaces replaced by underscores */
	_getArticleName() {
		return mw.config.get( 'wgPageName' );
	}

	_getListOfValidVoteStrings() {
		return [
			// AFD
			'keep',
			'delete',
			'merge',
			'draftify',
			'userfy',
			'redirect',
			'stubify',
			'stubbify',
			'TNT',
			// RFC
			'support',
			'oppose',
			'neutral',
			'option 1',
			'option 2',
			'option 3',
			'option 4',
			'option 5',
			'option 6',
			'option 7',
			'option 8',
			'option A',
			'option B',
			'option C',
			'option D',
			'option E',
			'option F',
			'option G',
			'option H',
			'yes',
			'no',
			'bad rfc',
			'remove',
			'include',
			'exclude',
			'no change',
			// move review
			'endorse',
			'overturn',
			'relist',
			'procedural close',
			// GAR
			'delist',
			// RSN
			'agree',
			'disagree',
			'status quo',
			'(?<!un)reliable',
			'unreliable',
			// RFD
			'(?<!re)move',
			'retarget',
			'disambiguate',
			'withdraw',
			'setindex',
			'refine',
			// MFD
			'historical', // mark historical
			// TFD
			'rename',
			// ITN
			'pull',
			'wait',
			// AARV
			'bad block',
			'do not endorse',
			// AN RFC challenge
			'vacate'
		];
	}

	async _shouldRun() {
		// don't run when not viewing articles
		const action = mw.config.get( 'wgAction' );
		if ( action !== 'view' ) {
			return false;
		}

		this.title = this._getArticleName();

		// only run in talk namespaces (all of them) or Wikipedia namespace
		const isEnglishWikipedia = mw.config.get( 'wgDBname' ) === 'enwiki';
		if ( isEnglishWikipedia ) {
			const namespace = mw.config.get( 'wgNamespaceNumber' );
			const isNotTalkNamespace = !mw.Title.isTalkNamespace( namespace );
			const isNotWikipediaNamespace = namespace !== 4;
			const isNotNovemLinguaeSandbox = this.title !== 'User:Novem_Linguae/sandbox';
			if ( isNotTalkNamespace && isNotWikipediaNamespace && isNotNovemLinguaeSandbox ) {
				return false;
			}
		}

		// get wikitext
		this.wikicode = await this._getWikicode( this.title );
		if ( !this.wikicode ) {
			return;
		}

		return true;
	}
}
