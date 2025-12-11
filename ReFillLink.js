// Thanks to [[User:Qcne]] for the idea. Please uninstall any old ReFill scripts to avoid double links!
const pageExists = mw.config.get('wgArticleId') > 0;
const notSpecialOrFileNamespace = mw.config.get( 'wgNamespaceNumber' ) >= 0;
if ( pageExists && notSpecialOrFileNamespace ) {
	mw.util.addPortletLink(
		'p-cactions',
		'https://refill.toolforge.org/ng/result.php?page=' + encodeURIComponent( mw.config.get( 'wgPageName' ) ) + '&defaults=y&nowatch=y&wiki=en',
		'reFill'
	);
}
