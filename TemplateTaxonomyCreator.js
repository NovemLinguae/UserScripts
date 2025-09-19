// <nowiki>

/*
Adds some buttons (Cite iNaturalist, Cite WoRMS, Cite NCBI, Cite Other) to the edit screen of Template:Taxonomy subpages, and pre-fills it assuming it is a genus. Helpful for quickly creating Template:Taxonomy subpages, which is useful when getting {{Speciesbox}} to work with new species.
*/

// TODO: fix bug where button doesn't work sometimes when clicked
// TODO: if no talk page, create talk page and add correct WikiProject templates: amphibians and reptiles, animals, arthropods, beetles, birds, diptera, fishes, fungi, gastropods, insects, lepidoptera, mammals, marine life, microbiology, paleontology, plants

class TemplateTaxonomyCreator {
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

		// In the title, grab everything after the slash
		const taxon = title.split( '/' ).pop();

		// TODO: refactor to use JSON, and a loop to add the table rows

		// last to first
		let html = `
			<style>

			#TemplateTaxonomyCreator {
				margin: 1em 0;
			}

			#TemplateTaxonomyCreator, #TemplateTaxonomyCreator th, #TemplateTaxonomyCreator td {
				border: 1px solid black;
				border-collapse: collapse;
				padding: 0 5px;
				background-color: #ccffff;
			}
			</style>

			<table id="TemplateTaxonomyCreator">
		`;

		const websites = [
			{
				name: 'Catalogue of Life',
				id: 'taxonomy-creator-catalogue-of-life',
				description: 'All',
				urlLeft: 'https://www.catalogueoflife.org/data/search?facet=rank&facet=issue&facet=status&facet=nomStatus&facet=nameType&facet=field&facet=authorship&facet=extinct&facet=environment&limit=50&offset=0&q=',
				urlMiddle: taxon,
				urlRight: '&sortBy=taxonomic'
			},
			{
				name: 'WoRMS',
				id: 'taxonomy-creator-worms',
				description: 'Marine animals, gastropods (snails and slugs)',
				urlLeft: 'https://www.marinespecies.org/aphia.php?p=taxlist&searchpar=0&tComp=begins&tName=',
				urlMiddle: taxon,
				urlRight: '&action=search&rSkips=0&adv=0'
			},
			{
				name: 'NCBI',
				id: 'taxonomy-creator-ncbi',
				description: 'Protozoa',
				urlLeft: 'https://www.ncbi.nlm.nih.gov/taxonomy/?term=',
				urlMiddle: taxon,
				urlRight: ''
			},
			{
				name: 'LPSN',
				id: 'taxonomy-creator-lpsn',
				description: 'Bacteria',
				urlLeft: 'https://lpsn.dsmz.de/search?word=',
				urlMiddle: taxon,
				urlRight: ''
			},
			{
				// AJAX-ish/App-ish website, can't custom search through URL
				name: 'Index Fungorum',
				id: 'taxonomy-creator-index-fungorum',
				description: 'Fungi',
				urlLeft: 'http://www.indexfungorum.org/names/names.asp',
				urlMiddle: '',
				urlRight: ''
			},
			{
				// AJAX-ish/App-ish website, can't custom search through URL, also doesn't give a unique URL for the genus
				name: 'MycoBank',
				id: 'taxonomy-creator-mycobank',
				description: 'Fungi',
				urlLeft: 'https://www.mycobank.org/page/Basic%20names%20search',
				urlMiddle: '',
				urlRight: ''
			},
			{
				name: 'Mindat.org',
				id: 'taxonomy-creator-mindat',
				description: 'Protozoa, Parasites',
				urlLeft: 'https://www.mindat.org/search.php?search=',
				urlMiddle: taxon,
				urlRight: '#autoanchor1'
			},
			{
				name: 'Other',
				id: 'taxonomy-creator-other',
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
				this.promptThenAddWikicode( website.id );
			} );
		}
	}

	promptThenAddWikicode( websiteId ) {
		/* eslint-disable no-alert */
		let rank = prompt( "Enter this taxa's rank. For example, genus, tribe, or subfamily." );
		rank = this.englishToLatin( rank );

		let parent = prompt( "Enter this taxa's parent. For example, the parent of the genus homo is Hominina." );
		// capitalize just the first letter
		parent = parent.charAt( 0 ).toUpperCase() + parent.slice( 1 );

		const url = prompt( 'Enter the URL. For example, if this is a citation to Catalogue of Life, enter the catalogueoflife.org URL that has info on this taxa.' );
		let wormsId, catalogueOfLifeId;
		if ( websiteId === 'taxonomy-creator-worms' ) {
			wormsId = url.match( /id=(\d+)$/ )[ 1 ] || '';
		} else if ( websiteId === 'taxonomy-creator-catalogue-of-life' ) {
			catalogueOfLifeId = url.match( /\/([^/]+)$/ )[ 1 ] || '';
		}

		// TODO: extract the ID from the Catalogue of Life URL

		// CC BY-SA 4.0, Mitch3091, https://stackoverflow.com/a/38148759/3480193
		const date = new Date().toISOString().slice( 0, 10 ); // yyyy-mm-dd

		// In the title, grab everything after the slash
		const title = this.mw.config.get( 'wgPageName' );
		const taxon = title.split( '/' ).pop();

		let wikicode = `{{Don't edit this line {{{machine code|}}}\n|rank=${ rank }\n|link={{subst:#titleparts:{{subst:PAGENAME}}|2|2}}\n|parent=${ parent }\n|refs=`;

		// TODO: if title has parentheses, use the format |link=Example (parentheses)|Example
		// TODO: italics only for genus

		const refs = {
			// Old: {{Cite web |access-date=${ date } |url=${ url } |title=''${ taxon }'' |website=[[Catalogue of Life]]}}`,
			'taxonomy-creator-catalogue-of-life': `{{Catalogue of Life |id=${ catalogueOfLifeId } |title=${ taxon } |access-date=${ date }}}`,
			'taxonomy-creator-worms': `{{Cite WoRMS |title=''${ taxon }'' |id=${ wormsId } |access-date=${ date }}}`,
			'taxonomy-creator-ncbi': `{{Cite web |access-date=${ date } |url=${ url } |title=''${ taxon }'' |website=[[NCBI]]}}`,
			'taxonomy-creator-lpsn': `{{Cite web |access-date=${ date } |url=${ url } |title=''${ taxon }'' |website=[[LPSN]]}}`,
			'taxonomy-creator-mycobank': `{{Cite web |access-date=${ date } |url=${ url } |title=''${ taxon }'' |website=[[MycoBank]]}}`,
			'taxonomy-creator-index-fungorum': `{{Cite web |access-date=${ date } |url=${ url } |title=''${ taxon }'' |website=[[Index Fungorum]]}}`,
			'taxonomy-creator-mindat': `{{Cite web |access-date=${ date } |url=${ url } |title=''${ taxon }'' |website=[[Mindat.org]]}}`,
			'taxonomy-creator-other': `{{Cite web |access-date=${ date } |url=${ url } |title=''${ taxon }'' |website=}}`
		};

		wikicode += refs[ websiteId ];
		wikicode += '\n}}\n';

		// I did this in a more complicated way than normal, to enable support for CodeMirror. https://www.mediawiki.org/wiki/Extension:CodeMirror#Using_jQuery.textSelection
		const $textarea = this.$( '#wpTextbox1' );
		$textarea.textSelection( 'getContents' );
		$textarea.textSelection( 'setContents', wikicode );

		// watchlist it
		this.$( '#wpWatchthis' ).prop( 'checked', true );

		const isCreatingPage = this.$( '#firstHeading' ).html().startsWith( 'Creating' );
		if ( isCreatingPage ) {
			this.$( '#wpSummary' ).val( 'create ([[User:Novem Linguae/Scripts/TemplateTaxonomyCreator.js|TemplateTaxonomyCreator]])' );
		} else { // editing
			this.$( '#wpSummary' ).val( 'edit ([[User:Novem Linguae/Scripts/TemplateTaxonomyCreator.js|TemplateTaxonomyCreator]])' );
		}
	}

	englishToLatin( rank ) {
		// https://en.wikipedia.org/wiki/Wikipedia:Automated_taxobox_system/ranks#Rank_table
		const rankMap = {
			alliance: 'alliance',
			'basic shell type': 'basic shell type',
			branch: 'branch',
			clade: 'cladus',
			'clade?': 'possible clade',
			class: 'classis',
			cohort: 'cohort',
			division: 'divisio',
			domain: 'domain',
			epifamily: 'epifamilia',
			family: 'familia',
			form: 'forma',
			'form taxon': 'form taxon',
			genus: 'genus',
			grade: 'gradus',
			grandorder: 'grandordo',
			group: 'virus group',
			hyperfamily: 'hyperfamilia',
			ichnoclass: 'ichnoclassis',
			ichnocohort: 'ichnocohort',
			ichnodivision: 'ichnodivisio',
			ichnofamily: 'ichnofamilia',
			ichnogenus: 'ichnogenus',
			ichnograndorder: 'ichnograndordo',
			ichnoinfraclass: 'ichnoinfraclassis',
			ichnoinfradivision: 'ichnoinfradivisio',
			ichnoinfraorder: 'ichnoinfraordo',
			ichnolegion: 'ichnolegio',
			ichnomagnorder: 'ichnomagnordo',
			ichnomicrorder: 'ichnomicrordo',
			ichnoorder: 'ichnoordo',
			ichnoparvorder: 'ichnoparvordo',
			ichnospecies: 'ichnospecies',
			'ichnostem-group': 'ichnostem-group',
			ichnosubclass: 'ichnosubclassis',
			ichnosubdivision: 'ichnosubdivisio',
			ichnosubfamily: 'ichnosubfamilia',
			ichnosublegion: 'ichnosublegio',
			ichnosuborder: 'ichnosubordo',
			ichnosuperclass: 'ichnosuperclassis',
			ichnosupercohort: 'ichnosupercohort',
			ichnosuperfamily: 'ichnosuperfamilia',
			ichnosuperorder: 'ichnosuperordo',
			'informal group': 'informal group',
			infraclass: 'infraclassis',
			infrakingdom: 'infraregnum',
			infralegion: 'infralegio',
			infraorder: 'infraordo',
			infraphylum: 'infraphylum',
			infratribe: 'infratribus',
			kingdom: 'regnum',
			legion: 'legio',
			magnorder: 'magnordo',
			microphylum: 'microphylum',
			microrder: 'micrordo',
			mirorder: 'mirordo',
			morphotype: 'morphotype',
			nanophylum: 'nanophylum',
			nanorder: 'nanordo',
			node: 'node',
			ooclass: 'ooclassis',
			oocohort: 'oocohort',
			oofamily: 'oofamilia',
			oogenus: 'oogenus',
			oomagnorder: 'oomagnordo',
			oorder: 'oordo',
			oospecies: 'oospecies',
			oosubclass: 'oosubclassis',
			oosubgenus: 'oosubgenus',
			oosubspecies: 'oosubspecies',
			oosupercohort: 'oosupercohort',
			oosuperorder: 'oosuperordo',
			order: 'ordo',
			parafamily: 'parafamilia',
			parvclass: 'parvclassis',
			parvorder: 'parvordo',
			phylum: 'phylum',
			plesion: 'plesion',
			'plesion-group': 'plesion-group',
			realm: 'realm',
			section: 'sectio',
			series: 'series',
			serotype: 'serotype',
			species: 'species',
			'species complex': 'species complex',
			'species group': 'species group',
			'species subgroup': 'species subgroup',
			'stem group': 'stem group',
			strain: 'strain',
			subclass: 'subclassis',
			subcohort: 'subcohort',
			subdivision: 'subdivisio',
			subfamily: 'subfamilia',
			subgenus: 'subgenus',
			subkingdom: 'subregnum',
			sublegion: 'sublegio',
			suborder: 'subordo',
			subphylum: 'subphylum',
			subsection: 'subsectio',
			subseries: 'subseries',
			subspecies: 'subspecies',
			subterclass: 'subterclassis',
			subtribe: 'subtribus',
			superclass: 'superclassis',
			supercohort: 'supercohort',
			superdivision: 'superdivisio',
			superdomain: 'superdomain',
			superfamily: 'superfamilia',
			superkingdom: 'superregnum',
			superlegion: 'superlegio',
			superorder: 'superordo',
			superphylum: 'superphylum',
			supersection: 'supersectio',
			supertribe: 'supertribus',
			'total group': 'total group',
			tribe: 'tribus',
			variety: 'varietas',
			virus: 'virus'
		};
		rank = rank.toLowerCase().trim();
		if ( rank in rankMap ) {
			return rankMap[ rank ];
		}
		// return original if not found
		return rank;
	}
}

$( async () => {
	await ( new TemplateTaxonomyCreator( mw, $ ) ).addLinksAndListeners();
} );

// </nowiki>
