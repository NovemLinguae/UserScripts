// <nowiki>

$(function() {
	let skin = mw.config.get('skin');
	if ( skin === 'vector-2022' ) {
		mw.util.addCSS(`
			#vector-sticky-header { display: none; }
		`);
	}
});

// </nowiki>