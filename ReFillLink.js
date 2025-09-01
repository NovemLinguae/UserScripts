// Thanks to [[User:Qcne]] for the idea. Please uninstall any old ReFill scripts to avoid double links!
if ( mw.config.get( 'wgNamespaceNumber' ) >= 0 ) {
	mw.util.addPortletLink(
		'p-cactions',
		'https://refill.toolforge.org/ng/result.php?page=' + encodeURIComponent( mw.config.get( 'wgPageName' ) ) + '&defaults=y&nowatch=y&wiki=en',
		'reFill'
	);
}
