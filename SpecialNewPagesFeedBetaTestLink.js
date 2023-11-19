// Load the Vue rewrite of the PageTriage Page Curation toolbar
// The Vue rewrite of the PageTriage NewPagesFeed is already live and the default

$.when( mw.loader.using( ['mediawiki.util'] ), $.ready ).done( function() {
	mw.util.addPortletLink(
		'p-navigation',
		mw.util.getUrl('Special:NewPagesFeed') + '?pagetriage_tb=new',
		'New pages feed (newest)',
		'pt-pagecuration-beta',
		'View the new pages feed'
	);

	mw.util.addPortletLink(
		'p-navigation',
		mw.util.getUrl('Special:NewPagesFeed') + '?pagetriage_ui=old',
		'New pages feed (oldest)',
		'pt-pagecuration-beta',
		'View the new pages feed'
	);
});
