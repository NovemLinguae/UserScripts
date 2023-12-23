// <nowiki>

/*
- Let reviewer know when certain promotional and POV keywords are detected.
- Displays an orange bar at the top of the article, listing the detected keywords.
*/

class DetectPromo {
	/** @member {string} */
	wordString = `

// An impressive amount of promo in this draft: https://en.wikipedia.org/w/index.php?title=Draft:Imre_Van_opstal&oldid=1060259849

% growth
100%
6-figure
7-figure
8-figure
9-figure
a record
accomplished
are a necessity
around the world
award-winning
award winning
B2B
B2C
best available
bestselling
comprehensive
countless hours
create a revolution
critical acclaim
disrupt
drastically
dynamic
elevate
eminent
engaging
entrepreneur
evangelist
excelled
exceptional
exemplified
exemplify
expert
expertise
extensive
famous
fast growing
fast-growing
fastest growing
fastest-growing
fully integrated
fully-integrated
globally
growing popularity
highlights
highly accomplished
highly praised
highly specialized
historic
honored with
hypnotic
impressive
inexhaustible
influential
innovation
innovative
insights
inspired by
integrate
invaluable
leader in
leading
leading
legendary
leverag
massive
mastermind
more than
most highly
most important
most impressive
most notable
mystical
noteworthy
numerous
organically
outstanding
perfect
philanthropist
pioneer
pioneering
popular destination
premiere
prestigious
prominence
prominent
promising
promulgator
ranked
reinvent
remarkable
renowned
respected
revolutionary
rising star
save millions
savvy
seamless
sensual
several offers
signature
state of art
state of the art
state-of-art
state-of-the-art
striking
super famous
tailored
transcend
transform
underpin
ventured into
very first
visionary
wide selection
widely used
world class
world-class
worldwide
zero to hero
renowed
invaluable
significant
remarkable
globally recognized
critical acclaim
indelible

	`;

	/**
	 * @param {object} mw
	 * @param {jQuery} $
	 */
	constructor(mw, $) {
		this.mw = mw;
		this.$ = $;
	}

	async execute() {
		if ( ! this.shouldRunOnThisPage() ) {
			return;
		}
		let wordObject = this.getWordObject();
		let title = this.mw.config.get('wgPageName');
		let wikicode = await this.getWikicode(title);
		wikicode = this.cleanWikicode(wikicode);

		let searchResults = [];
		for ( let word of wordObject ) {
			// can't use \b here because \)\b doesn't work correctly. using lookarounds instead
			let regEx = new RegExp('(?<!\\w)' + word['regex'] + '(?!\\w)', "i");
			if ( wikicode.match(regEx) ) {
				searchResults.push(word['text']);
			}
		}

		let MAX_DISPLAYED_RESULTS = 20;
		if ( searchResults.length > MAX_DISPLAYED_RESULTS ) {
			searchResults = searchResults.slice(0, MAX_DISPLAYED_RESULTS);
			searchResults.push('...... and more.');
		}

		if ( ! this.empty(searchResults) ) {
			let html = searchResults.join(', ');
			html = '<div id="DetectPromo" style="background-color: orange"><span style="font-weight: bold;">Promotional words:</span> ' + html + '</div>';

			this.$('#contentSub').before(html);
		}
	}

	/**
	 * @param {string} wikicode
	 * @returns {string} wikicode
	 */
	cleanWikicode(wikicode) {
		// eliminate [[ ]], so that phrases with wikilink syntax in the middle don't mess up our search
		wikicode = wikicode.replace(/\[\[/g, '')
			.replace(/\]\]/g, '');
		return wikicode;
	}

	/**
	 * @returns {Array} wordObject - An array of objects in the format `[ {text: 'state of the art', regex: 'state of the art'}, {text: 'world class', regex: 'world class'} ]`
	 */
	getWordObject() {
		this.wordString = this.wordString.replace(/^\/\/.*$/gm, ''); // replace comment lines with blank lines. using this approach fixes a bug involving // and comma on the same line
		let wordArray = this.wordString.replace(/, /g, "\n")
			.trim()
			.split("\n")
			.map(v => v.trim())
			.filter(v => v != '')
			.filter(v => ! v.startsWith('//'));
		wordArray = this.eliminateDuplicates(wordArray);

		// convert from 1 level array with just text, to 2 level array with text and regex
		let wordObject = [];
		for ( let key in wordArray ) {
			wordObject.push({
				'text': wordArray[key],
				'regex': this.escapeRegEx(wordArray[key])
			});
		}

		return wordObject;
	}

	/**
	 * @returns {boolean}
	 */
	shouldRunOnThisPage() {
		// don't run when not viewing articles
		let action = this.mw.config.get('wgAction');
		if ( action != 'view' ) {
			return false;
		}

		// don't run when viewing diffs
		let isDiff = this.mw.config.get('wgDiffNewId');
		if ( isDiff ) {
			return false;
		}

		let isDeletedPage = ! this.mw.config.get('wgCurRevisionId') ;
		if ( isDeletedPage ) {
			return false;
		}

		// Only run in mainspace and draftspace
		let namespace = this.mw.config.get('wgNamespaceNumber');
		let title = this.mw.config.get('wgPageName');
		if ( ! [0, 118].includes(namespace) && title != 'User:Novem_Linguae/sandbox' ) {
			return false;
		}

		return true;
	}

	/**
	 * @param {string} title
	 * @returns {string} wikicode
	 */
	async getWikicode(title) {
		let pageIsDeleted = ! this.mw.config.get('wgCurRevisionId');
		if ( pageIsDeleted ) {
			return '';
		}

		let api = new this.mw.Api();
		let response = await api.get( {
			action: 'parse',
			page: title,
			prop: 'wikitext',
			formatversion: '2',
			format: 'json'
		} );
		return response.parse.wikitext;
	}

	eliminateDuplicates(array) {
		return [...new Set(array)];
	}

	empty(arr) {
		return !!(arr === undefined || arr.length == 0);
	}

	escapeRegEx(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}
}

$(async function() {
	await mw.loader.using(['mediawiki.api'], async () => {
		let detectPromo = new DetectPromo(mw, $);
		await detectPromo.execute();
	});
});

// </nowiki>