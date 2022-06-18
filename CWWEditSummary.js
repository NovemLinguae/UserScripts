// <nowiki>

// Adds a "Provide attribution" link to "Edit source" and "Speical:Import" pages. When clicked, provides the attribution text suggested at [[WP:CWW]] (Copying Within Wikipedia), which should satisfy CC BY-SA 3.0 legal requirements.

// Particularly useful on testwiki. Mildly useful on enwiki.

$(async function() {
	let action = mw.config.get('wgAction');
	let title = mw.config.get('wgPageName').replace(/_/g, ' ');
	let wiki = mw.config.get('wgDBname');
	let editSummaryAppend = `([[w:User:Novem Linguae/Scripts/CWWEditSummary.js|CWWEditSummary]])`;
	if ( action === 'edit' ) {
		$(`.editCheckboxes > .oo-ui-layout`).append(`<div><a style="padding: 4px; text-decoration: underline;" id="CWWEditSummary-Edit">Provide attribution</a></div>`);

		$(`#CWWEditSummary-Edit`).on('click', function() {
			if ( wiki !== 'enwiki' ) {
				title = 'w:' + title;
			}
			$(`#wpSummary`).val(`Copied content from [[${title}]]; see that page's history for attribution ${editSummaryAppend}`);
		});
	} else if ( title === 'Special:Import' ) {
		$(`#mw-input-wpintro`).parent(3).after(`<div style="margin-top: 0.7em;"><a style="background-color: rgba(255, 255, 0, 0.4); padding: 4px; text-decoration: underline;" id="CWWEditSummary-SpecialImport">Select defaults and provide attribution</a></div>`);

		$(`#CWWEditSummary-SpecialImport`).on('click', function() {
			$(`[name="interwiki"]`).val(`en`);
			$(`[name="interwiki"] + .oo-ui-dropdownWidget > span > .oo-ui-labelElement-label`).html(`en`);
			$(`[name="interwikiTemplates"]`).prop('checked', true);
			$(`[name="log-comment"]`).val(`Copied content from another wiki; see the linked page's history for attribution ${editSummaryAppend}`);
			$(`[name="frompage"]`).focus();
		});
	}
});

// </nowiki>