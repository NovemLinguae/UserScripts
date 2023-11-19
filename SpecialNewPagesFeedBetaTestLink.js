// Load the Vue rewrite of the PageTriage Page Curation toolbar
// The Vue rewrite of the PageTriage NewPagesFeed is already live and the default

$.when( mw.loader.using( ['mediawiki.util'] ), $.ready ).then( function() {
	mw.util.addPortletLink(
		'p-navigation',
		mw.util.getUrl('Special:NewPagesFeed') + '?pagetriage_tb=new',
		'New pages feed (beta)',
		'pt-pagecuration-beta',
		'View the new pages feed'
	);

	mw.util.addPortletLink(
		'p-navigation',
		mw.util.getUrl('Special:NewPagesFeed') + '?pagetriage_ui=old',
		'New pages feed (old)',
		'pt-pagecuration-beta',
		'View the new pages feed'
	);
});
