class VoteCounterController {
	async execute() {
		if ( ! this._shouldRun() ) {
			return;
		}

		// get wikitext
		let wikicode = await this._getWikicode(this.title);

		if ( ! wikicode ) return;

		let isAFD = this.title.match(/^Wikipedia:Articles_for_deletion\//i);
		let isMFD = this.title.match(/^Wikipedia:Miscellany_for_deletion\//i);
		let isGAR = this.title.match(/^Wikipedia:Good_article_reassessment\//i);

		let votesToCount = this._getVotesToCount();

		if ( isAFD || isMFD || isGAR ) {
			// delete everything above the first heading, to prevent the closer's vote from being counted
			wikicode = wikicode.replace(/^.*?(===.*)$/s, '$1');
			
			// add a delete vote. the nominator is assumed to be voting delete
			if ( isAFD || isMFD ) {
				wikicode += "'''delete'''";
			}

			let vc = new Counter(wikicode, votesToCount);
			let votes = vc.getVotes();
			let voteString = vc.getVoteString();

			if ( ! voteString ) return;

			let percentsHTML = '';
			if ( isAFD || isMFD ) {
				let counts = {};
				for ( let key of votesToCount ) {
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
				percentsHTML = `<br /><span style="font-weight: bold;">${keepPercent}% <abbr this.title="Keep, Stubify, TNT">Keep-ish</abbr>, ${deletePercent}% <abbr this.title="Delete, Redirect, Merge, Draftify, Userfy">Delete-ish</abbr></span>`;
			}

			allHTML = `<div id="VoteCounter"><span style="font-weight: bold;">${voteString}</span> <small>(approximately)</small>${percentsHTML}</div>`;
			$('#contentSub').before(allHTML);
		} else {
			// make a list of the strpos of each heading
			let matches = wikicode.matchAll(/(?<=\n)(?===)/g);
			let sections = [0];
			for ( let match of matches ) {
				sections.push(match.index);
			}

			let isXFD = this.title.match(/_for_(?:deletion|discussion)\//i);
			
			// now that we know where the fenceposts are, calculate everything else, then inject the appropriate HTML
			let sectionsLength = sections.length;
			for ( let i = 0; i < sectionsLength ; i++ ) {
				let startPosition = sections[i];
				let lastSection = i === sectionsLength - 1;
				let endPosition;
				if ( lastSection ) {
					endPosition = wikicode.length;
				} else {
					endPosition = sections[i + 1]; // Don't subtract 1. That will delete a character.
				}
				let sectionWikicode = wikicode.slice(startPosition, endPosition); // slice and substring (which both use (startPos, endPos)) are the same. substr(startPos, length) is deprecated.

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

				let vc = new VoteCounterCounter(sectionWikicode, votesToCount);
				let voteSum = vc.getVoteSum();
				if ( voteSum < 3 ) continue;
				let voteString = vc.getVoteString();
				let allHTML = `<div id="VoteCounter" style="color: darkgreen; border: 1px solid black;"><span style="font-weight: bold;">${voteString}</span> <small>(approximately)</small></div>`;

				let isLead = startPosition === 0;
				if ( isLead ) {
					$('#contentSub').before(allHTML);
				} else {
					let headingForJQuery = vc.getHeadingForJQuery(startPosition);
					if ( ! $(headingForJQuery).length ) {
						console.error('User:Novem Linguae/Scripts/VoteCounter.js: ERROR: Heading ID not found. This indicates a bug in _convertWikicodeHeadingToHTMLSectionID() that Novem Linguae needs to fix. Please report this on his talk page along with the page name and heading ID. The heading ID is: ' + headingForJQuery)
					}
					$(headingForJQuery).parent().first().after(allHTML); // prepend is interior, before is exterior
				}
			}
		}
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

	_getVotesToCount() {
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

	_shouldRun() {
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

		return true;
	}
};