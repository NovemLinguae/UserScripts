// <nowiki>

/*
- Requested by https://en.wikipedia.org/wiki/User:Elli on 2024-04-22
- When it runs (all 3 conditions must be met):
	1) In the file namespace,
	2) on pages that have have a https://en.wikipedia.org/wiki/Category:Wikipedia_non-free_file_copyright_templates,
	3) and the template does not have a paramter image_has_rationale=yes,
- What it does:
	- shows a button that allows adding this parameter in one click
- Motivation:
	- Useful for patrolling the category https://en.wikipedia.org/wiki/Category:Wikipedia_non-free_files_for_NFUR_review, because many of these files marked as not having a rationale already have a rationale and just need this one parameter added
*/

class MarkFreeUseRationale {
	constructor( mw, $ ) {
		this.mw = mw;
		this.$ = $;
	}

	async execute() {
		if ( !this.shouldRunOnThisPage() ) {
			return;
		}

		// Only run if there is a {{Non-free XYZABC}} template (https://en.wikipedia.org/wiki/Category:Wikipedia_non-free_file_copyright_templates) that isnt a rationale template ( {{Non-free use rationale ABCXYZ}} )
		const pageName = this.mw.config.get( 'wgPageName' );
		const wikicode = await this.getWikicode( pageName );
		const hasCopyrightTemplate = wikicode.match( /\{\{Non-free (?!use)/gi );
		if ( !hasCopyrightTemplate ) {
			return;
		}

		// only run if image_has_rationale=yes is not present
		const hasRationale = wikicode.match( /image[_ ]has[_ ]rationale\s*=\s*yes/i );
		if ( hasRationale ) {
			return;
		}

		// add button
		const $button = $( '<button>' )
			.attr( 'id', 'MarkFreeUseRationale' )
			.html( 'Set image_has_rationale=yes' );
		const $div = $( '<div>' )
			.html( $button )
			.css( 'margin', '0.5em 0' );
		this.$( '.licensetpl .imbox-notice .mbox-text' ).prepend( $div );

		// add listener
		$button.on( 'click', async function () {
			$button.remove();
			await this.addRationale();
		}.bind( this ) );
	}

	async addRationale() {
		// get fresh wikicode, to reduce likelihood of edit conflict
		const pageName = this.mw.config.get( 'wgPageName' );
		const wikicode = await this.getWikicode( pageName );

		// insert image_has_rationale=yes into wikicode somewhere (look at Elli's example diff)
		const newWikicode = wikicode.replace( /({{Non-free (?!use)[^|}]+)(}})/i, '$1|image_has_rationale=yes$2' );
		if ( newWikicode === wikicode ) {
			this.mw.notify( this.wrapErrorText( 'ERROR: Unable to find a place to insert |image_has_rationale=yes' ) );
			return;
		}

		// API query to edit the page
		try {
			const editSummary = 'add template parameter image_has_rationale=yes ([[User:Novem Linguae/Scripts/MarkFreeUseRationale.js|MarkFreeUseRationale]])';
			await this.editPage( pageName, newWikicode, editSummary, 'nochange' );
		} catch {
			this.mw.notify( this.wrapErrorText( 'ERROR: Unable to save the edit.' ) );
			return;
		}

		this.mw.notify( 'Edit successful. Refresh to see changes.' );
	}

	/**
	 * mw.notify likes to receive HTML as a jQuery object. If you pass it a string, it will escape and print the string.
	 */
	wrapErrorText( text ) {
		return this.$( '<span>' )
			.css( 'color', 'red' )
			.css( 'font-weight', 'bold' )
			.html( text );
	}

	/**
	 * @param pageName
	 * @param wikicode
	 * @param editSummary
	 * @param {string} addToWatchlist nochange, preferences, unwatch, watch. Default is preferences.
	 */
	async editPage( pageName, wikicode, editSummary, addToWatchlist = 'preferences' ) {
		const api = new this.mw.Api();
		await api.postWithEditToken( {
			action: 'edit',
			title: pageName,
			text: wikicode,
			summary: editSummary,
			formatversion: 2,
			watchlist: addToWatchlist
		} );
	}

	async getWikicode( pageName ) {
		const pageIsDeleted = !this.mw.config.get( 'wgCurRevisionId' );
		if ( pageIsDeleted ) {
			return '';
		}

		const api = new this.mw.Api();
		const response = await api.get( {
			action: 'parse',
			page: pageName,
			prop: 'wikitext',
			formatversion: '2',
			format: 'json'
		} );
		return response.parse.wikitext;
	}

	shouldRunOnThisPage() {
		const isViewing = this.mw.config.get( 'wgAction' ) === 'view';
		if ( !isViewing ) {
			return false;
		}

		const isDiff = this.mw.config.get( 'wgDiffNewId' );
		if ( isDiff ) {
			return false;
		}

		const isDeletedPage = ( !this.mw.config.get( 'wgCurRevisionId' ) );
		if ( isDeletedPage ) {
			return false;
		}

		const isFileNamespace = this.mw.config.get( 'wgNamespaceNumber' ) === 6;
		if ( !isFileNamespace ) {
			return false;
		}

		return true;
	}
}

$( async function () {
	await mw.loader.using( [ 'mediawiki.api' ], async function () {
		await ( new MarkFreeUseRationale( mw, $ ) ).execute();
	} );
} );

// </nowiki>
