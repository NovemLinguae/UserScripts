// <nowiki>

/*
- Displays an alert if an article may be a CSD G4 (previous AFD) or CSD G5 (created by a sockpuppet)
- Useful for new page patrolling
- Only runs on pages that have not been marked as reviewed
*/

// TODO: Code review. Is there a way to reduce the # of API queries?

class DetectG4G5 {
	async execute() {
		if ( ! this.shouldRunOnThisPage() ) return;
		
		let title = mw.config.get('wgPageName'); // includes namespace, underscores instead of spaces
		let pageID = mw.config.get('wgArticleId');

		if ( await this.isReviewed(pageID) ) {
			return;
		}

		if ( await this.afdExists(title) && ! await this.hasAFDTemplate(title) ) {
			let href = mw.config.get('wgArticlePath').replace('$1', 'Wikipedia:Articles_for_deletion/' + title);
			this.displayWarning(`<span style="font-weight:bold">CSD G4:</span> There is an <a href="${href}">AFD page</a> for this article. It may qualify for CSD G4.`);
		}

		let pageCreator = await this.getPageCreator(title);
		if ( await this.isBlocked(pageCreator) ) {
			this.displayWarning('<span style="font-weight:bold">CSD G5:</span> The creator of this page is blocked. This article may qualify for CSD G5.');
		}

		if ( await this.isGloballyLocked(pageCreator) ) {
			this.displayWarning('<span style="font-weight:bold">CSD G5:</span> The creator of this page is globally locked. This article may qualify for CSD G5.');
		}
	}

	async getWikicode(title) {
		if ( ! mw.config.get('wgCurRevisionId') ) return ''; // if page is deleted, return blank
		var wikicode = '';
		title = encodeURIComponent(title);
		await $.ajax({
			url: 'https://en.wikipedia.org/w/api.php?action=parse&page='+title+'&prop=wikitext&formatversion=2&format=json',
			success: function (result) {
				wikicode = result['parse']['wikitext'];
			},
			dataType: "json",
			async: false
		});
		return wikicode;
	}

	async hasAFDTemplate(title) {
		let wikicode = await this.getWikicode(title);
		return wikicode.indexOf('{{Article for deletion') !== -1;
	}

	displayWarning(html) {
		$('#contentSub').before(`<div class="DetectG4G5" style="background-color: red">${html}</div>`);
	}

	async isReviewed(pageID) {
		let api = new mw.Api();
		let response = await api.get( {
			action: 'pagetriagelist',
			format: 'json',
			page_id: pageID,
		} );

		// no result
		if ( response.pagetriagelist.result !== 'success' || response.pagetriagelist.pages.length === 0 ) {
			return true;
		// 1, 2, or 3
		} else if ( parseInt(response.pagetriagelist.pages[0].patrol_status) > 0 ) {
			return true;
		// 0
		} else {
			return false;
		}
	}

	async afdExists(title) {
		title = 'Wikipedia:Articles_for_deletion/' + title;
		return await this.pageExists(title);
	}

	async pageExists(title) {
		let api = new mw.Api();
		let response = await api.get( {
			action: 'query',
			format: 'json',
			prop: 'revisions',
			titles: title,
		} );
		let exists = typeof response.query.pages['-1'] === 'undefined';
		return exists;
	}

	async isBlocked(username) {
		let api = new mw.Api();
		let response = await api.get( {
			action: "query",
			format: "json",
			list: "users",
			usprop: "blockinfo",
			ususers: username,
		} );
		let isBlocked = typeof response.query.users[0].blockid !== 'undefined';
		return isBlocked;
	}

	async isGloballyLocked(username) {
		let api = new mw.Api();
		let response = await api.get( {
			action: 'query',
			list: 'globalallusers',
			agulimit: '1',
			agufrom: username,
			aguto: username,
			aguprop: 'lockinfo',
		} );
		let isLocked = response.query.globalallusers.length !== 0 && response.query.globalallusers[0].locked === '';
		return isLocked;
	}

	getFirstValueInObject(obj) {
		return obj[Object.keys(obj)[0]];
	}

	async getPageCreator(title) {
		let api = new mw.Api();
		let response = await api.get( {
			"action": "query",
			"format": "json",
			"prop": "revisions",
			"titles": title,
			"rvlimit": "1",
			"rvdir": "newer"
		} );
		let page = this.getFirstValueInObject(response.query.pages);
		let pageCreator = page.revisions[0].user;
		return pageCreator;
	}

	shouldRunOnThisPage() {
		// don't run when not viewing articles
		let action = mw.config.get('wgAction');
		if ( action != 'view' ) return false;
		
		// don't run when viewing diffs
		let isDiff = mw.config.get('wgDiffNewId');
		if ( isDiff ) return false;
		
		let isDeletedPage = ( ! mw.config.get('wgCurRevisionId') );
		if ( isDeletedPage ) return false;
		
		// Only run in mainspace
		let namespace = mw.config.get('wgNamespaceNumber');
		let title = mw.config.get('wgPageName'); // includes namespace, underscores instead of spaces
		if ( namespace !== 0 && title != 'User:Novem_Linguae/sandbox' ) return false;

		return true;
	}
}

$(async function() {
	await mw.loader.using(['mediawiki.api'], async () => {
		let dg4g5 = new DetectG4G5();
		await dg4g5.execute();
	});
});

// </nowiki>