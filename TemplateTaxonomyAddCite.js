
// <nowiki>

/*
Adds some buttons (Cite iNaturalist, Cite WoRMS, Cite NCBI, Cite Other) to the edit screen of Template:Taxonomy subpages, and pre-fills it assuming it is a genus. Helpful for quickly creating Template:Taxonomy subpages, which is useful when getting {{Speciesbox}} to work with new species.
*/

// TODO: fix bug where button doesn't work sometimes when clicked
// TODO: if no talk page, create talk page and add correct WikiProject templates: amphibians and reptiles, animals, arthropods, beetles, birds, diptera, fishes, fungi, gastropods, insects, lepidoptera, mammals, marine life, microbiology, paleontology, plants

/** Has to be global for HTML onClick="addCite()" to work */
function addCite(website) {
	// https://stackoverflow.com/a/38148759/3480193
	let date = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

	let title = mw.config.get('wgPageName');
	let taxon = title.match(/(?<=\/).*$/);
	taxon = taxon[0];

	let wikicode;

	// TODO: if title has parentheses, use the format |link=Example (parentheses)|Example
	// TODO: italics only for genus

	switch ( website ) {
		case 'Catalogue of Life':
		// TODO: use {{Catalogue of Life}}
wikicode = `{{Don't edit this line {{{machine code|}}}
|rank=genus
|link={{subst:#titleparts:{{subst:PAGENAME}}|2|2}}
|parent=
|refs={{Cite web |access-date=${date} |url= |title=''${taxon}'' |website=[[Catalogue of Life]]}}
}}
`;
			break;
		case 'iNaturalist':
wikicode = `{{Don't edit this line {{{machine code|}}}
|rank=genus
|link={{subst:#titleparts:{{subst:PAGENAME}}|2|2}}
|parent=
|refs={{inaturalist taxon|NUMBER-GOES-HERE|{{subst:#titleparts:{{subst:PAGENAME}}|2|2}}}}
}}
`;
			break;
		case 'WoRMS':
wikicode = `{{Don't edit this line {{{machine code|}}}
|rank=genus
|link={{subst:#titleparts:{{subst:PAGENAME}}|2|2}}
|parent=
|refs={{Cite WoRMS |title=''${taxon}'' |id=NUMBER-GOES-HERE |access-date=${date}}}
}}
`;
			break;
		case 'NCBI':
wikicode = `{{Don't edit this line {{{machine code|}}}
|rank=genus
|link={{subst:#titleparts:{{subst:PAGENAME}}|2|2}}
|parent=
|refs={{Cite web |access-date=${date} |url= |title=''${taxon}'' |website=[[NCBI]]}}
}}
`;
			break;
		case 'LPSN':
wikicode = `{{Don't edit this line {{{machine code|}}}
|rank=genus
|link={{subst:#titleparts:{{subst:PAGENAME}}|2|2}}
|parent=
|refs={{Cite web |access-date=${date} |url= |title=''${taxon}'' |website=[[LPSN]]}}
}}
`;
			break;
		case 'MycoBank':
wikicode = `{{Don't edit this line {{{machine code|}}}
|rank=genus
|link={{subst:#titleparts:{{subst:PAGENAME}}|2|2}}
|parent=
|refs={{Cite web |access-date=${date} |url= |title=''${taxon}'' |website=[[MycoBank]]}}
}}
`;
			break;
		case 'Index Fungorum':
wikicode = `{{Don't edit this line {{{machine code|}}}
|rank=genus
|link={{subst:#titleparts:{{subst:PAGENAME}}|2|2}}
|parent=
|refs={{Cite web |access-date=${date} |url= |title=''${taxon}'' |website=[[Index Fungorum]]}}
}}
`;
			break;
		case 'Mindat.org':
wikicode = `{{Don't edit this line {{{machine code|}}}
|rank=genus
|link={{subst:#titleparts:{{subst:PAGENAME}}|2|2}}
|parent=
|refs={{Cite web |access-date=${date} |url= |title=''${taxon}'' |website=[[Mindat.org]]}}
}}
`;
			break;
		case 'Other':
wikicode = `{{Don't edit this line {{{machine code|}}}
|rank=genus
|link={{subst:#titleparts:{{subst:PAGENAME}}|2|2}}
|parent=
|refs={{Cite web |access-date=${date} |url= |title=''${taxon}'' |website=}}
}}
`;
			break;
	}

	$('#wpTextbox1').html(wikicode);

	// watchlist it
	$('#wpWatchthis').prop('checked', true);

	let isCreatingPage = $('#firstHeading').html().startsWith('Creating');
	if ( isCreatingPage ) {
		$('#wpSummary').val('create ([[User:Novem Linguae/Scripts/TemplateTaxonomyAddCite.js|TemplateTaxonomyAddCite]])');
	} else { // editing
		$('#wpSummary').val('add/edit citation ([[User:Novem Linguae/Scripts/TemplateTaxonomyAddCite.js|TemplateTaxonomyAddCite]])');
	}
}

$(async function() {
	let title = mw.config.get('wgPageName');
	if ( ! title.startsWith('Template:Taxonomy/') ) return;

	let taxon = title.match(/(?<=\/).*$/);
	taxon = taxon[0];

	// TODO: refactor to use JSON, and a loop to add the table rows

	// last to first
	$('.editpage-head-copywarn').after(
`<style>
#TemplateTaxonomyAddCite, #TemplateTaxonomyAddCite th, #TemplateTaxonomyAddCite td {
	border: 1px solid black;
	border-collapse: collapse;
	padding: 0 5px;
	background-color: #ccffff;
}
</style>

<table id="TemplateTaxonomyAddCite">
	<tr>
		<td><a href="https://www.catalogueoflife.org/data/search?facet=rank&facet=issue&facet=status&facet=nomStatus&facet=nameType&facet=field&facet=authorship&facet=extinct&facet=environment&limit=50&offset=0&q=${taxon}&sortBy=taxonomic" target="_blank">Search Catalogue of Life</a></td>
		<td><a onClick="addCite('Catalogue of Life');">Cite Catalogue of Life</a></td>
		<td>All</td>
	</tr>
	<tr>
		<td><a href="https://www.marinespecies.org/aphia.php?p=taxlist&searchpar=0&tComp=begins&tName=${taxon}&action=search&rSkips=0&adv=0" target="_blank">Search WoRMS</a></td>
		<td><a onClick="addCite('WoRMS');">Cite WoRMS</a></td>
		<td>Marine animals, gastropods (snails and slugs)</td>
	</tr>
	<tr>
		<td><a href="https://www.ncbi.nlm.nih.gov/taxonomy/?term=${taxon}" target="_blank">Search NCBI</a></td>
		<td><a onClick="addCite('NCBI');">Cite NCBI</a></td>
		<td>Protozoa</td>
	</tr>
	<tr>
		<td><a href="https://lpsn.dsmz.de/search?word=${taxon}" target="_blank">Search LPSN</a></td>
		<td><a onClick="addCite('LPSN');">Cite LPSN</a></td>
		<td>Bacteria</td>
	</tr>
	<tr>
		<!-- AJAX-ish/App-ish website, can't custom search through URL -->
		<td><a href="http://www.indexfungorum.org/names/names.asp" target="_blank">Search Index Fungorum</a></td>
		<td><a onClick="addCite('Index Fungorum');">Cite Index Fungorum</a></td>
		<td>Fungi</td>
	</tr>
	<tr>
		<!-- AJAX-ish/App-ish website, can't custom search through URL, also doesn't give a unique URL for the genus -->
		<td><a href="https://www.mycobank.org/page/Basic%20names%20search" target="_blank">Search MycoBank</a></td>
		<td><a onClick="addCite('MycoBank');">Cite MycoBank</a></td>
		<td>Fungi</td>
	</tr>
	<tr>
		<td><a href="https://www.mindat.org/search.php?search=${taxon}#autoanchor1" target="_blank">Search Mindat.org</a></td>
		<td><a onClick="addCite('Mindat.org');">Cite Mindat.org</a></td>
		<td>Protozoa, Parasites</td>
	</tr>
<!--
	<tr>
		<td><a href="https://www.inaturalist.org/search?q=${taxon}" target="_blank">Search iNaturalist</a></td>
		<td><a onClick="addCite('iNaturalist');">Cite iNaturalist</a></td>
		<td>Reliability is debatable. Other sources preferred.</td>
	</tr>
-->
	<tr>
		<td>
			<!--<a href="https://www.google.com/search?q=${taxon}+taxonomy+-site%3Awikipedia.org" target="_blank">Search Google</a>-->
		</td>
		<td><a onClick="addCite('Other');">Cite Other</a></td>
		<td></td>
	</tr>
</table>`
	);
});

// </nowiki>
