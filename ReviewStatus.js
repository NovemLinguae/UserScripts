// <nowiki>

/*
- Displays whether or not a mainspace page is marked as reviewed. This info is placed on the right of the page title using a small icon.
- Without a script like this, you need to be a new page reviewer or admin and look at the Page Curation toolbar. Or you need to use Special:Log -> Page Curation Log. And there is also some complex logic. For example, the absence of a log entry means the page is marked as reviewed.
*/

// TODO: display whether the page is indexed or not. can do this by using JS to look for "noindex", or can do this by checking the first revision date.
// TODO: display in all namespaces
// TODO: do I need to use different code to check if marked as patrolled? I think that uses recentchanges table... maybe?

class ReviewStatus {
	async execute() {
		if ( ! this.shouldRunOnThisPage() ) {
			return;
		}

		let pageID = mw.config.get('wgArticleId');
		let boolIsReviewed = await this.isReviewed(pageID);
		let htmlToInsert = '';

		// modules/ext.pageTriage.views.toolbar/images/icons/

		if ( boolIsReviewed ) {
			htmlToInsert = ` <img src="https://en.wikipedia.org/w/extensions/PageTriage/modules/ext.pageTriage.newPagesFeed.vue/images/icon_reviewed.png" title="Reviewed" />`;
		} else {
			htmlToInsert = ` <img src="https://en.wikipedia.org/w/extensions/PageTriage/modules/ext.pageTriage.newPagesFeed.vue/images/icon_not_reviewed.png" title="Not reviewed" />`;
		}

		if ( this.pageHasSections() ) {
			$(`#firstHeading .mw-editsection`).before(htmlToInsert);
		} else {
			$(`#firstHeading`).append(htmlToInsert);
		}
	}

	/**
	* @param {number} pageID The page ID number. A positive number with no commas.
	*/
	async isReviewed(pageID) {
		let api = new mw.Api();
		let response = await api.get( {
			action: 'query',
			format: 'json',
			formatversion: '2',
			prop: 'isreviewed',
			pageids: pageID,
		} );
		return response.query.pages[0].isreviewed;
	}

	shouldRunOnThisPage() {
		// don't run when not viewing articles
		let action = mw.config.get('wgAction');
		if ( action !== 'view' ) {
			return false;
		}
		
		// don't run when viewing diffs
		let isDiff = mw.config.get('wgDiffNewId');
		if ( isDiff ) {
			return false;
		}
		
		let isDeletedPage = ( ! mw.config.get('wgCurRevisionId') );
		if ( isDeletedPage ) {
			return false;
		}
		
		// Only run in mainspace
		let namespace = mw.config.get('wgNamespaceNumber');
		let isMainspaceOrDraftspace = ( [0].includes(namespace) );
		if ( ! isMainspaceOrDraftspace ) {
			return false;
		}

		return true;
	}

	pageHasSections() {
		return $(`#firstHeading .mw-editsection`).length;
	}
}

$(async function() {
	await mw.loader.using(['mediawiki.api'], async () => {
		let rs = new ReviewStatus();
		await rs.execute();
	});
});

// </nowiki>