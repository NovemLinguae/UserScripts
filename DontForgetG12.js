// <nowiki>

/*
- Check if article is unreviewed
- If so, display a giant "copyright check" button at the top, to remind you to run Earwig's copyvio detector on the article first thing.
- Many submissions are copyright violations, and catching it before you perform a bunch of other steps in the NPP/AFC flowchart saves time.
*/

class DontForgetG12 {
	/** @type {Object} */
	mw;

	/** @type {Object} */
	$;

	constructor() {
		this.mw = mw;
		this.$ = $;
	}

	async execute() {
		// don't run when not viewing articles
		const action = this.mw.config.get( 'wgAction' );
		if ( action !== 'view' ) {
			return;
		}

		// don't run when viewing diffs
		const isDiff = this.mw.config.get( 'wgDiffNewId' );
		if ( isDiff ) {
			return;
		}

		const isDeletedPage = ( !this.mw.config.get( 'wgCurRevisionId' ) );
		if ( isDeletedPage ) {
			return;
		}

		// Only run in mainspace and draftspace
		const namespace = this.mw.config.get( 'wgNamespaceNumber' );
		if ( ![ 0, 118 ].includes( namespace ) ) {
			return;
		}

		const title = this.getArticleName();
		const wikicode = await this.getWikicode( title );

		// Don't run on redirect pages
		const isRedirect = wikicode.match( /^#REDIRECT \[\[/i );
		if ( isRedirect ) {
			return;
		}

		// Only run if 1) article is uncurated or 2) draft is submitted
		const draftIsSubmitted = wikicode.match( /(?:{{AfC submission}}|{{AfC submission\|}}|{{AfC submission\|\|)/i ) && namespace === 118;
		if ( draftIsSubmitted ) {
			this.insertButton( title );
		}

		this.mw.hook( 'ext.pageTriage.toolbar.ready' ).add( async function () {
			const pageID = this.mw.config.get( 'wgArticleId' );
			if ( !( await this.isReviewed( pageID ) ) ) {
				this.insertButton( title );
			}
		}.bind( this, title ) );
	}

	/**
	 * @return {string} pagename, including the namespace name, but with spaces replaced by underscores
	 */
	getArticleName() {
		return this.mw.config.get( 'wgPageName' );
	}

	async getWikicode( title ) {
		if ( !this.mw.config.get( 'wgCurRevisionId' ) ) {
			return '';
		}
		// if page is deleted, return blank
		let wikicode = '';
		title = encodeURIComponent( title );
		await this.$.ajax( {
			url: `https://en.wikipedia.org/w/api.php?action=parse&page=${ title }&prop=wikitext&formatversion=2&format=json`,
			success: function ( result ) {
				wikicode = result.parse.wikitext;
			},
			dataType: 'json'
		} );
		return wikicode;
	}

	insertButton( title ) {
		this.$( '#contentSub' ).before( `
			<a style="display: inline-block; color: black; margin-top: 0.5em; border: 2px solid black; padding: 0.25em 3em; background-color: #FFDC00; font-size: 1.5em;" href="https://copyvios.toolforge.org/?lang=en&project=wikipedia&title=` + encodeURIComponent( title ) + `" target="_blank">
				Copyvio check
			</a>
		` );
	}

	async isReviewed( pageID ) {
		const api = new this.mw.Api();
		const response = await api.get( {
			action: 'pagetriagelist',
			format: 'json',
			page_id: pageID
		} );

		// no result
		if ( response.pagetriagelist.result !== 'success' || response.pagetriagelist.pages.length === 0 ) {
			return true;
		// 1, 2, or 3
		} else if ( parseInt( response.pagetriagelist.pages[ 0 ].patrol_status ) > 0 ) {
			return true;
		// 0
		} else {
			return false;
		}
	}
}

$( async function () {
	await ( new DontForgetG12( mw, $ ) ).execute();
} );

// </nowiki>
