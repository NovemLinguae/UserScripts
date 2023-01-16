class VoteCounterController {
	async execute() {
		if ( ! await this._shouldRun() ) {
			return;
		}

		this.isAfd = this.title.match(/^Wikipedia:Articles_for_deletion\//i);
		this.isMfd = this.title.match(/^Wikipedia:Miscellany_for_deletion\//i);
		let isGAR = this.title.match(/^Wikipedia:Good_article_reassessment\//i);

		this.listOfValidVoteStrings = this._getListOfValidVoteStrings();

		if ( this.isAfd || this.isMfd || isGAR ) {
			this._countVotesForEntirePage();
		} else {
			this._countVotesForEachHeading();
		}
	}

	_countVotesForEntirePage() {
		// delete everything above the first heading, to prevent the closer's vote from being counted
		this.wikicode = this.wikicode.replace(/^.*?(===.*)$/s, '$1');

		// add a delete vote. the nominator is assumed to be voting delete
		if ( this.isAfd || this.isMfd ) {
			this.wikicode += "'''delete'''";
		}

		this.vcc = new VoteCounterCounter(this.wikicode, this.listOfValidVoteStrings);
		let voteString = this.vcc.getVoteString();
		if ( ! voteString ) {
			return;
		}

		let percentsHTML = '';
		if ( this.isAfd || this.isMfd ) {
			percentsHTML = this._getAfdAndMfdPercentsHtml();
		}

		// generate HTML
		let allHTML = `<div id="VoteCounter"><span style="font-weight: bold;">${voteString}</span> <small>(approximately)</small>${percentsHTML}</div>`;

		// insert HTML
		$('#contentSub').before(allHTML);
	}

	_countVotesForEachHeading() {
		let listOfHeadingLocations = this._getListOfHeadingLocations(this.wikicode);
		let isXFD = this.title.match(/_for_(?:deletion|discussion)\//i);
		let numberOfHeadings = listOfHeadingLocations.length;

		// foreach heading
		for ( let i = 0; i < numberOfHeadings ; i++ ) {
			let startPosition = listOfHeadingLocations[i];

			let endPosition;
			let lastSection = i === numberOfHeadings - 1;
			if ( lastSection ) {
				endPosition = this.wikicode.length;
			} else {
				endPosition = listOfHeadingLocations[i + 1]; // Don't subtract 1. That will delete a character.
			}
			
			let sectionWikicode = this.wikicode.slice(startPosition, endPosition); // slice and substring (which both use (startPos, endPos)) are the same. substr(startPos, length) is deprecated.

			if ( isXFD ) {
				let proposeMerging = sectionWikicode.match(/'''Propose merging'''/i);
				// add a vote for the nominator
				if ( proposeMerging ) {
					sectionWikicode += "'''merge'''";
				} else {
					sectionWikicode += "'''delete'''";
				}
				// delete "result of the discussion was X", to prevent it from being counted
				sectionWikicode = sectionWikicode.replace(/The result of the discussion was(?::'')? '''[^']+'''/ig, '');
			}

			this.vcc = new VoteCounterCounter(sectionWikicode, this.listOfValidVoteStrings);
			let voteSum = this.vcc.getVoteSum();
			if ( voteSum < 3 ) continue;
			let voteString = this.vcc.getVoteString();
			let allHTML = `<div id="VoteCounter" style="color: darkgreen; border: 1px solid black;"><span style="font-weight: bold;">${voteString}</span> <small>(approximately)</small></div>`;

			let isLead = startPosition === 0;
			if ( isLead ) {
				// insert HTML
				$('#contentSub').before(allHTML);
			} else {
				let headingForJQuery = this.vcc.getHeadingForJQuery(startPosition);
				if ( ! $(headingForJQuery).length ) {
					console.error('User:Novem Linguae/Scripts/VoteCounter.js: ERROR: Heading ID not found. This indicates a bug in _convertWikicodeHeadingToHTMLSectionID() that Novem Linguae needs to fix. Please report this on his talk page along with the page name and heading ID. The heading ID is: ' + headingForJQuery)
				}

				// insert HTML
				$(headingForJQuery).parent().first().after(allHTML); // prepend is interior, before is exterior
			}
		}
	}

	_getListOfHeadingLocations(wikicode) {
		let matches = wikicode.matchAll(/(?<=\n)(?===)/g);
		let listOfHeadingLocations = [0];
		for ( let match of matches ) {
			listOfHeadingLocations.push(match.index);
		}
		return listOfHeadingLocations;
	}

	_getAfdAndMfdPercentsHtml() {
		let counts = {};
		let votes = this.vcc.getVotes();
		for ( let key of this.listOfValidVoteStrings ) {
			let value = votes[key];
			if ( typeof value === 'undefined' ) {
				value = 0;
			}
			counts[key] = value;
		}
		let keep = counts['keep'] + counts['stubify'] + counts['stubbify'] + counts['TNT'];
		let _delete = counts['delete'] + counts['redirect'] + counts['merge'] + counts['draftify'] + counts['userfy'];
		let total = keep + _delete;
		let keepPercent = keep / total;
		let deletePercent = _delete / total;
		keepPercent = Math.round(keepPercent * 100);
		deletePercent = Math.round(deletePercent * 100);
		let percentsHTML = `<br /><span style="font-weight: bold;">${keepPercent}% <abbr this.title="Keep, Stubify, TNT">Keep-ish</abbr>, ${deletePercent}% <abbr this.title="Delete, Redirect, Merge, Draftify, Userfy">Delete-ish</abbr></span>`;
		return percentsHTML;
	}

	async _getWikicode(title) {
		if ( ! mw.config.get('wgCurRevisionId') ) return ''; // if page is deleted, return blank
		let api = new mw.Api();
		let response = await api.get( {
			"action": "parse",
			"page": title,
			"prop": "wikitext",
			"formatversion": "2",
			"format": "json"
		} );
		return response['parse']['wikitext'];
	}

	/** returns the pagename, including the namespace name, but with spaces replaced by underscores */
	_getArticleName() {
		return mw.config.get('wgPageName');
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
			// move review
			'endorse',
			'overturn',
			'relist',
			'procedural close',
			// GAR
			'delist',
			// RFC
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
		];
	}

	async _shouldRun() {
		// don't run when not viewing articles
		let action = mw.config.get('wgAction');
		if ( action != 'view' ) {
			return false;
		}

		this.title = this._getArticleName();

		// only run in talk namespaces (all of them) or Wikipedia namespace
		let isEnglishWikipedia = mw.config.get('wgDBname') === 'enwiki';
		if ( isEnglishWikipedia ) {
			let namespace = mw.config.get('wgNamespaceNumber');
			let isNotTalkNamespace = ! mw.Title.isTalkNamespace(namespace);
			let isNotWikipediaNamespace = namespace !== 4;
			let isNotNovemLinguaeSandbox = this.title != 'User:Novem_Linguae/sandbox';
			if ( isNotTalkNamespace && isNotWikipediaNamespace && isNotNovemLinguaeSandbox ) {
				return false;
			}
		}

		// get wikitext
		this.wikicode = await this._getWikicode(this.title);
		if ( ! this.wikicode ) {
			return;
		}
		
		return true;
	}
};