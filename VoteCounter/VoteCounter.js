/*
- Gives an approximate count of keeps, deletes, supports, opposes, etc. in deletion discussions and RFCs.
	- For AFD, MFD, and GAR, displays them at top of page.
	- For everything else, displays them by the section heading.
- Counts are approximate. If people do weird things like '''Delete/Merge''', it will be counted twice.
- Adds an extra delete vote to AFDs and MFDs, as it's assumed the nominator is voting delete.
- If you run across terms that aren't counted but should be, leave a message on the talk page. Let's add as many relevant terms as we can :)
*/

async function getWikicode(title) {
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
function getArticleName() {
	return mw.config.get('wgPageName');
}

class VoteCounter {
	_countRegExMatches(matches) {
		return (matches || []).length;
	}

	_capitalizeFirstLetter(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
		
	_countVotes() {
		// delete all strikethroughs
		this.modifiedWikicode = this.modifiedWikicode.replace(/<strike>[^<]*<\/strike>/gmi, '');
		this.modifiedWikicode = this.modifiedWikicode.replace(/<s>[^<]*<\/s>/gmi, '');
		this.modifiedWikicode = this.modifiedWikicode.replace(/{{S\|[^}]*}}/gmi, '');
		this.modifiedWikicode = this.modifiedWikicode.replace(/{{Strike\|[^}]*}}/gmi, '');
		this.modifiedWikicode = this.modifiedWikicode.replace(/{{Strikeout\|[^}]*}}/gmi, '');
		this.modifiedWikicode = this.modifiedWikicode.replace(/{{Strikethrough\|[^}]*}}/gmi, '');

		this.votes = {};
		for ( let voteToCount of this.votesToCount ) {
			let regex = new RegExp("'''[^']{0,30}"+voteToCount+"(?!ing comment)[^']{0,30}'''", "gmi"); // limit to 30 chars to reduce false positives. sometimes you can have '''bold''' bunchOfRandomTextIncludingKeep '''bold''', and the in between gets detected as a keep vote
			let matches = this.modifiedWikicode.match(regex);
			let count = this._countRegExMatches(matches);
			if ( ! count ) continue; // only log it if there's votes for it
			this.votes[voteToCount] = count;
		}
	}

	constructor(wikicode, votesToCount) {
		this.originalWikicode = wikicode;
		this.modifiedWikicode = wikicode;
		this.votesToCount = votesToCount;
		this.voteSum = 0;
		
		this._countVotes();

		if ( ! this.votes ) return;
		
		// if yes or no votes are not present in wikitext, but are present in the votes array, they are likely false positives, delete them from the votes array
		let yesNoVotesForSurePresent = this.modifiedWikicode.match(/('''yes'''|'''no''')/gi);
		if ( ! yesNoVotesForSurePresent ) {
			delete this.votes.yes;
			delete this.votes.no;
		}

		for ( let count of Object.entries(this.votes) ) {
			this.voteSum += count[1];
		}

		this.voteString = '';
		for ( let key in this.votes ) {
			let humanReadable = key;
			humanReadable = humanReadable.replace(/\(\?<!.+\)/, ''); // remove regex lookbehind
			humanReadable = this._capitalizeFirstLetter(humanReadable);
			this.voteString += this.votes[key] + ' ' + humanReadable + ', ';
		}
		this.voteString = this.voteString.slice(0, -2); // trim extra comma at end
		
		this.voteString = this._htmlEscape(this.voteString);
	}

	_convertWikicodeHeadingToHTMLSectionID(wikicode) {
		// remove == == from headings
		wikicode = wikicode.replace(/^=+\s*/, '');
		wikicode = wikicode.replace(/\s*=+$/, '');
		// remove wikilinks
		wikicode = wikicode.replace(/\[\[:?/g, '');
		wikicode = wikicode.replace(/\]\]/g, '');
		// remove bold and italic
		wikicode = wikicode.replace(/'{2,5}/g, '');
		// convert spaces to _
		wikicode = wikicode.replace(/ /g, '_');
		return wikicode;
	}

	_jQueryEscape(str) {
		return str.replace(/(:|\.|\[|\]|,|=|@)/g, "\\$1");
	}

	_doubleQuoteEscape(str) {
		return str.replace(/"/g, '\\"');
	}

	getHeadingForJQuery() {
		let firstLine = this.originalWikicode.split('\n')[0];
		let htmlHeadingID = this._convertWikicodeHeadingToHTMLSectionID(firstLine);
		let jQuerySearchString = '[id="' + this._doubleQuoteEscape(htmlHeadingID) + '"]';
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

	_htmlEscape(unsafe)	{
		return unsafe
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}
}

votesToCount = [
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

// don't run when not viewing articles
let action = mw.config.get('wgAction');
if ( action != 'view' ) return;

let title = getArticleName();

// only run in talk namespaces (all of them) or Wikipedia namespace
let isEnglishWikipedia = mw.config.get('wgDBname') === 'enwiki';
if ( isEnglishWikipedia ) {
	let namespace = mw.config.get('wgNamespaceNumber');
	if ( ! mw.Title.isTalkNamespace(namespace) && namespace !== 4 && title != 'User:Novem_Linguae/sandbox' ) {
		return;
	}
}

// get wikitext
let wikicode = await getWikicode(title);

if ( ! wikicode ) return;

let isAFD = title.match(/^Wikipedia:Articles_for_deletion\//i);
let isMFD = title.match(/^Wikipedia:Miscellany_for_deletion\//i);
let isGAR = title.match(/^Wikipedia:Good_article_reassessment\//i);

if ( isAFD || isMFD || isGAR ) {
	// delete everything above the first heading, to prevent the closer's vote from being counted
	wikicode = wikicode.replace(/^.*?(===.*)$/s, '$1');
	
	// add a delete vote. the nominator is assumed to be voting delete
	if ( isAFD || isMFD ) {
		wikicode += "'''delete'''";
	}

	let vc = new VoteCounter(wikicode, votesToCount);
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
		percentsHTML = `<br /><span style="font-weight: bold;">${keepPercent}% <abbr title="Keep, Stubify, TNT">Keep-ish</abbr>, ${deletePercent}% <abbr title="Delete, Redirect, Merge, Draftify, Userfy">Delete-ish</abbr></span>`;
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

	let isXFD = title.match(/_for_(?:deletion|discussion)\//i);
	
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

		let vc = new VoteCounter(sectionWikicode, votesToCount);
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

// TODO: write a parser that keeps track of pairs of ''', to fix issue with '''vote''' text '''vote''' sometimes counting the text between them

// TODO: handle CFD big merge lists, e.g. https://en.wikipedia.org/wiki/Wikipedia:Categories_for_discussion/Log/2021_December_10#Category:Cornish_emigrans_and_related_subcats