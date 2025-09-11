// <nowiki>

/*
Adds some buttons (Cite iNaturalist, Cite WoRMS, Cite NCBI, Cite Other) to the edit screen of Template:Taxonomy subpages, and pre-fills it assuming it is a genus. Helpful for quickly creating Template:Taxonomy subpages, which is useful when getting {{Speciesbox}} to work with new species.
*/

// TODO: fix bug where button doesn't work sometimes when clicked
// TODO: if no talk page, create talk page and add correct WikiProject templates: amphibians and reptiles, animals, arthropods, beetles, birds, diptera, fishes, fungi, gastropods, insects, lepidoptera, mammals, marine life, microbiology, paleontology, plants

class TemplateTaxonomyAddCite {
	constructor( mw, $ ) {
		this.mw = mw;
		// eslint-disable-next-line no-jquery/variable-pattern
		this.$ = $;
	}

	async addLinksAndListeners() {
		const title = this.mw.config.get( 'wgPageName' );
		if ( !title.startsWith( 'Template:Taxonomy/' ) ) {
			return;
		}

		let taxon = title.match( /(?<=\/).*$/ );
		taxon = taxon[ 0 ];

		// TODO: refactor to use JSON, and a loop to add the table rows

		// last to first
		let html = `
			<style>

			#TemplateTaxonomyAddCite {
				margin: 1em 0;
			}

			#TemplateTaxonomyAddCite, #TemplateTaxonomyAddCite th, #TemplateTaxonomyAddCite td {
				border: 1px solid black;
				border-collapse: collapse;
				padding: 0 5px;
				background-color: #ccffff;
			}
			</style>

			<table id="TemplateTaxonomyAddCite">
		`;

		const websites = [
			{
				name: 'Catalogue of Life',
				id: 'ttac-catalogue-of-life',
				description: 'All',
				urlLeft: 'https://www.catalogueoflife.org/data/search?facet=rank&facet=issue&facet=status&facet=nomStatus&facet=nameType&facet=field&facet=authorship&facet=extinct&facet=environment&limit=50&offset=0&q=',
				urlMiddle: taxon,
				urlRight: '&sortBy=taxonomic'
			},
			{
				name: 'WoRMS',
				id: 'ttac-worms',
				description: 'Marine animals, gastropods (snails and slugs)',
				urlLeft: 'https://www.marinespecies.org/aphia.php?p=taxlist&searchpar=0&tComp=begins&tName=',
				urlMiddle: taxon,
				urlRight: '&action=search&rSkips=0&adv=0'
			},
			{
				name: 'NCBI',
				id: 'ttac-ncbi',
				description: 'Protozoa',
				urlLeft: 'https://www.ncbi.nlm.nih.gov/taxonomy/?term=',
				urlMiddle: taxon,
				urlRight: ''
			},
			{
				name: 'LPSN',
				id: 'ttac-lpsn',
				description: 'Bacteria',
				urlLeft: 'https://lpsn.dsmz.de/search?word=',
				urlMiddle: taxon,
				urlRight: ''
			},
			{
				// AJAX-ish/App-ish website, can't custom search through URL
				name: 'Index Fungorum',
				id: 'ttac-index-fungorum',
				description: 'Fungi',
				urlLeft: 'http://www.indexfungorum.org/names/names.asp',
				urlMiddle: '',
				urlRight: ''
			},
			{
				// AJAX-ish/App-ish website, can't custom search through URL, also doesn't give a unique URL for the genus
				name: 'MycoBank',
				id: 'ttac-mycobank',
				description: 'Fungi',
				urlLeft: 'https://www.mycobank.org/page/Basic%20names%20search',
				urlMiddle: '',
				urlRight: ''
			},
			{
				name: 'Mindat.org',
				id: 'ttac-mindat',
				description: 'Protozoa, Parasites',
				urlLeft: 'https://www.mindat.org/search.php?search=',
				urlMiddle: taxon,
				urlRight: '#autoanchor1'
			},
			{
				name: 'Other',
				id: 'ttac-other',
				description: '',
				urlLeft: '',
				urlMiddle: '',
				urlRight: ''
			}
		];

		for ( const website of websites ) {
			html += '<tr><td>';
			if ( website.name !== 'Other' ) {
				html += `<a href="${ website.urlLeft }${ website.urlMiddle }${ website.urlRight }" target="_blank">Search ${ website.name }</a>`;
			}
			html += '</td>';
			html += `<td><a id="${ website.id }">Cite ${ website.name }</a></td>`;
			html += `<td>${ website.description }</td>`;
			html += '</tr>';
		}

		html += '</table>';
		this.$( '.editpage-head-copywarn' ).after( html );

		// Listeners have to be added after the elements are placed on the page
		for ( const website of websites ) {
			this.$( '#' + website.id ).on( 'click', () => {
				this.addCite( website.id );
			} );
		}
	}

	addCite( websiteId ) {
		// CC BY-SA 4.0, Mitch3091, https://stackoverflow.com/a/38148759/3480193
		const date = new Date().toISOString().slice( 0, 10 ); // yyyy-mm-dd

		const title = this.mw.config.get( 'wgPageName' );
		let taxon = title.match( /(?<=\/).*$/ );
		taxon = taxon[ 0 ];

		let wikicode = "{{Don't edit this line {{{machine code|}}}\n|rank=genus\n|link={{subst:#titleparts:{{subst:PAGENAME}}|2|2}}\n|parent=\n|refs=";

		// TODO: if title has parentheses, use the format |link=Example (parentheses)|Example
		// TODO: italics only for genus

		const refs = {
			// TODO: use {{Catalogue of Life}}
			'ttac-catalogue-of-life': `{{Cite web |access-date=${ date } |url= |title=''${ taxon }'' |website=[[Catalogue of Life]]}}`,
			'ttac-worms': `{{Cite WoRMS |title=''${ taxon }'' |id=NUMBER-GOES-HERE |access-date=${ date }}}`,
			'ttac-ncbi': `{{Cite web |access-date=${ date } |url= |title=''${ taxon }'' |website=[[NCBI]]}}`,
			'ttac-lpsn': `{{Cite web |access-date=${ date } |url= |title=''${ taxon }'' |website=[[LPSN]]}}`,
			'ttac-mycobank': `{{Cite web |access-date=${ date } |url= |title=''${ taxon }'' |website=[[MycoBank]]}}`,
			'ttac-index-fungorum': `{{Cite web |access-date=${ date } |url= |title=''${ taxon }'' |website=[[Index Fungorum]]}}`,
			'ttac-mindat': `{{Cite web |access-date=${ date } |url= |title=''${ taxon }'' |website=[[Mindat.org]]}}`,
			'ttac-other': `{{Cite web |access-date=${ date } |url= |title=''${ taxon }'' |website=}}`
		};

		wikicode += refs[ websiteId ];
		wikicode += '\n}}\n';

		// Do this in a more complicated way than normal, to enable support for CodeMirror. https://www.mediawiki.org/wiki/Extension:CodeMirror#Using_jQuery.textSelection
		const $textarea = this.$( '#wpTextbox1' );
		const content = $textarea.textSelection( 'getContents' );
		$textarea.textSelection( 'setContents', wikicode );

		// watchlist it
		this.$( '#wpWatchthis' ).prop( 'checked', true );

		const isCreatingPage = this.$( '#firstHeading' ).html().startsWith( 'Creating' );
		if ( isCreatingPage ) {
			this.$( '#wpSummary' ).val( 'create ([[User:Novem Linguae/Scripts/TemplateTaxonomyAddCite.js|TemplateTaxonomyAddCite]])' );
		} else { // editing
			this.$( '#wpSummary' ).val( 'add/edit citation ([[User:Novem Linguae/Scripts/TemplateTaxonomyAddCite.js|TemplateTaxonomyAddCite]])' );
		}
	}
}

$( async () => {
	await ( new TemplateTaxonomyAddCite( mw, $ ) ).addLinksAndListeners();
} );

// </nowiki>
