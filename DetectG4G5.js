// <nowiki>

/*
- Displays an alert if an article may be a CSD G4 (previous AFD) or CSD G5 (created by a sockpuppet)
- Useful for new page patrolling
- Only runs on pages that have not been marked as reviewed
*/

// TODO: Code review. Is there a way to reduce the # of API queries?

class DetectG4G5 {
	async execute() {
		if ( !this.shouldRunOnThisPage() ) {
			return;
		}

		const title = mw.config.get( 'wgPageName' ); // includes namespace, underscores instead of spaces
		const pageID = mw.config.get( 'wgArticleId' );

		if ( await this.isReviewed( pageID ) ) {
			return;
		}

		if ( await this.afdExists( title ) && !await this.hasAFDTemplate( title ) ) {
			const href = mw.config.get( 'wgArticlePath' ).replace( '$1', 'Wikipedia:Articles_for_deletion/' + title );
			this.displayWarning( `<span style="font-weight:bold">CSD G4:</span> There is an <a href="${ href }">AFD page</a> for this article. It may qualify for CSD G4.` );
		}

		const pageCreator = await this.getPageCreator( title );
		if ( await this.isBlocked( pageCreator ) ) {
			this.displayWarning( '<span style="font-weight:bold">CSD G5:</span> The creator of this page is blocked. This article may qualify for CSD G5.' );
		}

		if ( await this.isGloballyLocked( pageCreator ) ) {
			this.displayWarning( '<span style="font-weight:bold">CSD G5:</span> The creator of this page is globally locked. This article may qualify for CSD G5.' );
		}
	}

	async getWikicode( title ) {
		if ( !mw.config.get( 'wgCurRevisionId' ) ) {
			return '';
		} // if page is deleted, return blank
		let wikicode = '';
		title = encodeURIComponent( title );
		await $.ajax( {
			url: 'https://en.wikipedia.org/w/api.php?action=parse&page=' + title + '&prop=wikitext&formatversion=2&format=json',
			success: function ( result ) {
				wikicode = result.parse.wikitext;
			},
			dataType: 'json',
			async: false
		} );
		return wikicode;
	}

	async hasAFDTemplate( title ) {
		const wikicode = await this.getWikicode( title );
		return wikicode.indexOf( '{{Article for deletion' ) !== -1;
	}

	displayWarning( html ) {
		$( '#contentSub' ).before( `<div class="DetectG4G5" style="background-color: red">${ html }</div>` );
	}

	/**
	 * @param {number} pageID The page ID number. A positive number with no commas.
	 */
	async isReviewed( pageID ) {
		const api = new mw.Api();
		const response = await api.get( {
			action: 'query',
			format: 'json',
			formatversion: '2',
			prop: 'isreviewed',
			pageids: pageID
		} );
		return response.query.pages[ 0 ].isreviewed;
	}

	async afdExists( title ) {
		title = 'Wikipedia:Articles_for_deletion/' + title;
		return await this.pageExists( title );
	}

	async pageExists( title ) {
		const api = new mw.Api();
		const response = await api.get( {
			action: 'query',
			format: 'json',
			prop: 'revisions',
			titles: title
		} );
		const exists = typeof response.query.pages[ '-1' ] === 'undefined';
		return exists;
	}

	async isBlocked( username ) {
		const api = new mw.Api();
		const response = await api.get( {
			action: 'query',
			format: 'json',
			list: 'users',
			usprop: 'blockinfo',
			ususers: username
		} );
		const isBlocked = typeof response.query.users[ 0 ].blockid !== 'undefined';
		return isBlocked;
	}

	async isGloballyLocked( username ) {
		const api = new mw.Api();
		const response = await api.get( {
			action: 'query',
			list: 'globalallusers',
			agulimit: '1',
			agufrom: username,
			aguto: username,
			aguprop: 'lockinfo'
		} );
		const isLocked = response.query.globalallusers.length !== 0 && response.query.globalallusers[ 0 ].locked === '';
		return isLocked;
	}

	getFirstValueInObject( obj ) {
		return obj[ Object.keys( obj )[ 0 ] ];
	}

	async getPageCreator( title ) {
		const api = new mw.Api();
		const response = await api.get( {
			action: 'query',
			format: 'json',
			prop: 'revisions',
			titles: title,
			rvlimit: '1',
			rvdir: 'newer'
		} );
		const page = this.getFirstValueInObject( response.query.pages );
		const pageCreator = page.revisions[ 0 ].user;
		return pageCreator;
	}

	shouldRunOnThisPage() {
		// don't run when not viewing articles
		const action = mw.config.get( 'wgAction' );
		if ( action !== 'view' ) {
			return false;
		}

		// don't run when viewing diffs
		const isDiff = mw.config.get( 'wgDiffNewId' );
		if ( isDiff ) {
			return false;
		}

		const isDeletedPage = ( !mw.config.get( 'wgCurRevisionId' ) );
		if ( isDeletedPage ) {
			return false;
		}

		// Only run in mainspace
		const namespace = mw.config.get( 'wgNamespaceNumber' );
		const title = mw.config.get( 'wgPageName' ); // includes namespace, underscores instead of spaces
		if ( namespace !== 0 && title !== 'User:Novem_Linguae/sandbox' ) {
			return false;
		}

		return true;
	}
}

$( async function () {
	await mw.loader.using( [ 'mediawiki.api' ], async function () {
		await ( new DetectG4G5() ).execute();
	} );
} );

// </nowiki>
