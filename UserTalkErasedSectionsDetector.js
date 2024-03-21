// <nowiki>

/*
A user script that alerts you with a yellow banner at the top of a User Talk page if a user has deleted content from more than 15 of the last 500 diffs.

Useful for detecting if a WP:PERM applicant is whitewashing their User Talk page by removing warnings without archiving them.
*/

class ErasedSectionsDetector {
	/** @type {object} */
	mw;
	/** @type {object} */
	$;
	/** @type {object} */
	revisions;

	constructor( mw, $ ) {
		this.mw = mw;
		this.$ = $;
	}

	async execute() {
		if ( ! this.shouldRunOnThisPage() ) {
			return;
		}
		let title = this.mw.config.get( 'wgPageName' ).replace(/_/g, ' ');
		this.revisions = await this.getRevisions( title );
		let totalRevisionCount = this.revisions.length;
		this.addDiffsToRevisions();
		this.filterForRevisionsByThisEditorOnly();
		this.filterForNegativeDiffs();
		this.filterOutArchiving();
		this.addASpaceToBlankEditSummaries();
		let negativeDiffCount = this.revisions.length;
		if ( negativeDiffCount > 15 ) {
			this.addHtml( negativeDiffCount, totalRevisionCount );
		}
		this.listenForShowDiffsClick();
	}

	/**
	 * Add a message to blank edit summaries. This is so the hyperlink can be clicked.
	 */
	addASpaceToBlankEditSummaries() {
		this.revisions = this.revisions.map( function( revision ) {
			if ( revision.comment === '' ) {
				revision.comment = '[no edit summary]';
			}
			return revision;
		} );
	}

	listenForShowDiffsClick() {
		this.$( '#ErasedSectionsDetector-SeeDiffs' ).on( 'click', function() {
			this.$( '#ErasedSectionsDetector-Diffs' ).toggle();
		}.bind(this) );
	}

	addHtml( negativeDiffCount, totalRevisionCount ) {
		let html = `
			<div class="ErasedSectionsDetector">
				<div style="background-color: yellow">
					<span style="font-weight:bold">Warning:</span> This user has removed content from this page (probably without archiving it) in ${ negativeDiffCount } of the last ${ totalRevisionCount } revisions. <a id="ErasedSectionsDetector-SeeDiffs">Click here</a> to see diffs.
				</div>
				
				<div id="ErasedSectionsDetector-Diffs" style="border: 1px solid black; font-size: 80%; display: none;">
					<ul>
		`;

		for ( let revision of this.revisions ) {
			html += `
						<li>
							<a href="w/index.php?title=${ encodeURIComponent( this.mw.config.get( 'wgPageName' ) ) }&diff=prev&oldid=${ revision.revid }">
								${ revision.comment }
							</a>
						</li>
			`;
		}

		html += `
					</ul>
				</div>
			</div>
		`;

		this.$( '#contentSub2' ).after( html );
	}

	filterForNegativeDiffs() {
		this.revisions = this.revisions.filter( ( revision ) => revision.diff < 0 );
	}

	filterForRevisionsByThisEditorOnly() {
		let thisEditor = this.mw.config.get( 'wgTitle' );
		this.revisions = this.revisions.filter( ( revision ) => revision.user === thisEditor );
	}

	filterOutArchiving() {
		this.revisions = this.revisions.filter( ( revision ) => ! revision.comment.includes( 'OneClickArchiver' ) );
		this.revisions = this.revisions.filter( ( revision ) => ! revision.comment.toLowerCase().includes( 'archiv' ) ); // archiving, archive
	}

	/**
	 * Given the Action API output of query revisions as a JavaScript object, add to this object a field called "diff" that is the difference +/- in size of that diff compared to the next oldest diff.
	 */
	addDiffsToRevisions() {
		let len = this.revisions.length;
		let lastRevisionSize = this.revisions[len - 1].size;
		// need to store the OLDER revision's size in a buffer to compute a diff, so iterate BACKWARDS
		for ( let i = (len - 2); i >= 0; i-- ) {
			let thisRevisionSize = this.revisions[i].size;
			this.revisions[i].diff = thisRevisionSize - lastRevisionSize;
			lastRevisionSize = thisRevisionSize;
		}
	}

	async getRevisions( title ) {
		let api = new mw.Api();
		let response = await api.get( {
			action: "query",
			format: "json",
			prop: "revisions",
			titles: title,
			formatversion: "2",
			rvprop: "comment|size|user|ids",
			rvslots: "",
			rvlimit: "500", // get 500 revisions
			rvdir: "older" // get newest revisions (enumerate towards older entries)
		} );
		return response.query.pages[0].revisions;
	}

	shouldRunOnThisPage() {
		let isViewing = this.mw.config.get('wgAction') === 'view';
		if ( ! isViewing ) {
			return false;
		}

		let isDiff = this.mw.config.get('wgDiffNewId');
		if ( isDiff ) {
			return false;
		}

		let isDeletedPage = ! this.mw.config.get('wgCurRevisionId') ;
		if ( isDeletedPage ) {
			return false;
		}

		let namespace = this.mw.config.get('wgNamespaceNumber');
		let isUserTalkNamespace = [3].includes( namespace );
		if ( ! isUserTalkNamespace ) {
			return false;
		}

		let isSubPage = this.mw.config.get( 'wgPageName' ).includes( '/' );
		if ( isSubPage ) {
			return;
		}

		return true;
	}
}

$(async function() {
	await ( new ErasedSectionsDetector( mw, $ ) ).execute();
});

// </nowiki>
