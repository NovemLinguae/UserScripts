// <nowiki>

/*
- Let reviewer know when certain promotional and POV keywords are detected.
- Displays an orange bar at the top of the article, listing the detected keywords.
*/

class DetectPromo {
	/** @member {string} */
	wordsToSearchString = `

% growth
100%
6-figure
7-figure
8-figure
9-figure
B2B
B2C
a record
acclaimed
accomplished
are a necessity
around the world
award winning
award-winning
beloved
best available
bestselling
boasts
comprehensive
countless hours
create a revolution
critical acclaim
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
fascinating
fast growing
fast-growing
fastest growing
fastest-growing
finest
fully integrated
fully-integrated
globally
globally recognized
growing popularity
highlights
highly accomplished
highly praised
highly specialized
historic
honored with
hypnotic
illustrious
impressive
indelible
inexhaustible
influential
innovation
innovative
insights
inspired by
integrate
invaluable
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
natural charm
noteworthy
numerous
organically
outstanding
perfect
philanthropist
picturesque
pioneer
pioneering
popular destination
popularity
premiere
prestigious
prominence
prominent
promising
promulgator
ranked
reinvent
remarkable
remarkable
renowed
renowned
resonating
respected
revolutionary
rising star
save millions
savvy
seamless
sensual
several offers
showcased
signature
significant
soulful
spanning
state of art
state of the art
state-of-art
state-of-the-art
striking
super famous
tailored
tranquility
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

	`;

	/**
	 * @param {Object} mw
	 * @param {jQuery} $
	 */
	constructor( mw, $ ) {
		this.mw = mw;
		this.$ = $;
	}

	async execute() {
		if ( !this.shouldRunOnThisPage() ) {
			return;
		}
		const wordsToSearchArray = this.getWordsToSearchArray();
		const title = this.mw.config.get( 'wgPageName' );
		let wikicode = await this.getWikicode( title );
		wikicode = this.cleanWikicode( wikicode );
		const searchResultsArray = this.getSearchResultsArray( wordsToSearchArray, wikicode );
		const searchResultsString = this.getSearchResultsString( searchResultsArray );
		this.displayHtml( searchResultsString );
	}

	displayHtml( searchResultsString ) {
		if ( searchResultsString ) {
			const html = '<div id="DetectPromo" style="background-color: orange"><span style="font-weight: bold;">Promotional words:</span> ' + searchResultsString + '</div>';
			this.$( '#contentSub' ).before( html );
		}
	}

	/**
	 * @param {Array} searchResultsArray
	 * @return {string} searchResultsString - Example: `a record, comprehensive, drastically, entrepreneur, expert, leading, massive, more than, most important, numerous, outstanding, ranked, signature, worldwide, significant...... and more.`
	 */
	getSearchResultsString( searchResultsArray ) {
		const MAX_DISPLAYED_RESULTS = 20;
		if ( searchResultsArray.length > MAX_DISPLAYED_RESULTS ) {
			searchResultsArray = searchResultsArray.slice( 0, MAX_DISPLAYED_RESULTS );
			searchResultsArray.push( '...... and more.' );
		}
		const searchResultsString = searchResultsArray.join( ', ' );
		return searchResultsString;
	}

	/**
	 * @param {Array} wordsToSearchArray
	 * @param {string} wikicode
	 * @return {Array} searchResultsArray
	 */
	getSearchResultsArray( wordsToSearchArray, wikicode ) {
		const searchResultsArray = [];
		for ( const word of wordsToSearchArray ) {
			// can't use \b here because \)\b doesn't work correctly. using lookarounds instead
			const regEx = new RegExp( '(?<!\\w)' + this.escapeRegEx( word ) + '(?!\\w)', 'i' );
			if ( wikicode.match( regEx ) ) {
				searchResultsArray.push( word );
			}
		}
		return searchResultsArray;
	}

	/**
	 * @param {string} wikicode
	 * @return {string} wikicode
	 */
	cleanWikicode( wikicode ) {
		// eliminate [[ ]], so that phrases with wikilink syntax in the middle don't mess up our search
		wikicode = wikicode.replace( /\[\[/g, '' )
			.replace( /\]\]/g, '' );

		// Eliminate <ref></ref> and <ref />. It's OK if newspaper articles contain promo words, and they often do. We don't want to display these. We only want to display promo words in the article prose.
		wikicode = wikicode.replace( /<ref[^<]*<\/ref>/gm, '' );
		wikicode = wikicode.replace( /<ref[^>]*\/>/gm, '' );

		return wikicode;
	}

	/**
	 * @return {Array} wordsToSearchArray
	 */
	getWordsToSearchArray() {
		const wordsToSearchString = this.wordsToSearchString.replace( /^\/\/.*$/gm, '' ); // replace comment lines with blank lines. using this approach fixes a bug involving // and comma on the same line
		let wordsToSearchArray = wordsToSearchString.replace( /, /g, '\n' )
			.trim()
			.split( '\n' )
			.map( ( v ) => v.trim() )
			.filter( ( v ) => v !== '' )
			.filter( ( v ) => !v.startsWith( '//' ) );
		wordsToSearchArray = this.eliminateDuplicates( wordsToSearchArray );
		return wordsToSearchArray;
	}

	/**
	 * @return {boolean}
	 */
	shouldRunOnThisPage() {
		// don't run when not viewing articles
		const action = this.mw.config.get( 'wgAction' );
		if ( action !== 'view' ) {
			return false;
		}

		// don't run when viewing diffs
		const isDiff = this.mw.config.get( 'wgDiffNewId' );
		if ( isDiff ) {
			return false;
		}

		const isDeletedPage = !this.mw.config.get( 'wgCurRevisionId' );
		if ( isDeletedPage ) {
			return false;
		}

		// Only run in mainspace and draftspace
		const namespace = this.mw.config.get( 'wgNamespaceNumber' );
		const title = this.mw.config.get( 'wgPageName' );
		if ( ![ 0, 118 ].includes( namespace ) && title !== 'User:Novem_Linguae/sandbox' ) {
			return false;
		}

		return true;
	}

	/**
	 * @param {string} title
	 * @return {string} wikicode
	 */
	async getWikicode( title ) {
		const pageIsDeleted = !this.mw.config.get( 'wgCurRevisionId' );
		if ( pageIsDeleted ) {
			return '';
		}

		const api = new this.mw.Api();
		const response = await api.get( {
			action: 'parse',
			page: title,
			prop: 'wikitext',
			formatversion: '2',
			format: 'json'
		} );
		return response.parse.wikitext;
	}

	eliminateDuplicates( array ) {
		return [ ...new Set( array ) ];
	}

	escapeRegEx( string ) {
		return string.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ); // $& means the whole matched string
	}
}

$( async function () {
	await mw.loader.using( [ 'mediawiki.api' ], async () => {
		const detectPromo = new DetectPromo( mw, $ );
		await detectPromo.execute();
	} );
} );

// </nowiki>
