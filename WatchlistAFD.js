// <nowiki>

/*
- When you AFC accept or NPP "mark as reviewed", this script automatically adds the AFD PAGES of the reviewed page to your watchlist for 6 months
- This is so that you can see if a page you accept or mark as reviewed gets AFDd. You can then use this information to calibrate and improve your reviewing.
- Additionally, also adds a "Watchlist AFD" option to the More menu, that you can click on for any article.

- Bonus featured: Adds "Watchlist RFA" and "Watchlist SPI" to user pages.
*/

$(function() {
	async function addToWatchlist(title, watchForever = false) {
		let apiObject = {
			url: mw.util.wikiScript('api'),
			type: 'POST',
			dataType: 'json',
			data: {
				format: 'json',
				action: 'watch',
				expiry: '6 months',
				titles: title,
				token: mw.user.tokens.get('watchToken')
			},
		};
		if ( watchForever ) {
			delete apiObject.data.expiry;
		}
		let debugInfo = await $.ajax(apiObject);
		return debugInfo;
	}
	
	function getTitleWithoutNamespace() {
		let title = mw.config.get('wgPageName');
		title = title.replace(/^.*?:/, ''); // strip all namespaces
		return title;
	}
	
	function getTitleWithoutSubpages(title) {
		title = title.replace(/\/.*$/, ''); // strip all subpages
		return title;
	}
	
	// add options to More menu
	let namespace = mw.config.get('wgNamespaceNumber');
	let isUserPage = ( [2, 3].includes(namespace) );
	let isArticleOrDraft = ( [0, 1, 118, 119].includes(namespace) );
	if ( isArticleOrDraft ) {
		mw.util.addPortletLink (
			'p-cactions',
			'#',
			'Watchlist AFD',
			'WatchlistAFD'
		);
	}
	if ( isUserPage ) {
		mw.util.addPortletLink (
			'p-cactions',
			'#',
			'Watchlist RFA',
			'WatchlistRFA'
		);
		mw.util.addPortletLink (
			'p-cactions',
			'#',
			'Watchlist SPI',
			'WatchlistSPI'
		);
	}
	
	// listen for More menu clicks
	$('#WatchlistAFD').on('click', async function() {
		let title = getTitleWithoutNamespace();
		await addToWatchlist('Wikipedia:Articles for deletion/'+title);
		mw.notify(`Added AFD to watchlist.`);
	});
	$('#WatchlistRFA').on('click', async function() {
		let title = getTitleWithoutNamespace();
		title = getTitleWithoutSubpages(title);
		await addToWatchlist('Wikipedia:Requests for adminship/'+title, true);
		mw.notify(`Added RFA to watchlist.`);
	});
	$('#WatchlistSPI').on('click', async function() {
		let title = getTitleWithoutNamespace();
		title = getTitleWithoutSubpages(title);
		await addToWatchlist('Wikipedia:Sockpuppet investigations/'+title, true);
		mw.notify(`Added SPI to watchlist.`);
	});
	
	// listen for AFC accept
	$('body').on('DOMNodeInserted', '.accept #afchSubmitForm', function() {
		$('.accept #afchSubmitForm').on('click', function() {
			let title = mw.config.get('wgPageName');
			title = title.replace(/^Draft:/, '');
			addToWatchlist('Wikipedia:Articles for deletion/'+title);
		});
	});
	
	// listen for NPP mark as reviewed
	$('body').on('DOMNodeInserted', '#mwe-pt-mark-as-reviewed-button', function() {
		$('#mwe-pt-mark-as-reviewed-button').on('click', function() {
			let title = mw.config.get('wgPageName');
			addToWatchlist('Wikipedia:Articles for deletion/'+title);
		});
	});
});

// </nowiki>