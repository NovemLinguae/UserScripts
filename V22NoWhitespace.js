// <nowiki>

$(function() {
	let skin = mw.config.get('skin');
	if ( skin === 'vector-2022' ) {
		mw.util.addCSS(`
			/** Left whitespace */
			.mw-page-container-inner {
				grid-template-columns: unset;
			}

			/** Right whitespace */
			.vector-feature-page-tools-disabled .mw-content-container, .vector-feature-page-tools-disabled .mw-table-of-contents-container {
				max-width: unset;
			}
}		`);
	}
});

// </nowiki>