/*
Got a bug report or feature request? Please let me know on my talk page.

- Adds a "Run SpeciesHelper" option to the left menu.
- Features
	- When clicked, will try to add a speciesbox, category, taxonbar, and stub template to the article.
	- Then will send you to a diff screen where you can adjust, if needed.
	- If the article uses taxobox or automatic taxobox, will convert it to a speciesbox
	- Will fill in the {{Taxonbar}}'s wikidata ID
	- Will get the bottom 15 taxa in the tree of life, and will try each of those to figure out the category and stub type, until one is found that exists.
	- ONLY WORKS ON SPECIES ARTICLES, not higher taxa
- script deterimes genus+species from title or from {{Speciesbox}}
- Hotkey support: alt+A to run the script, alt+shift+S to save the page

This page was assembled from 5 files using my publish.php script. I also have an offline test suite with around 175 unit tests.
*/

/* eslint-disable no-undef, no-alert */

// Wrapping this in a function so my linter doesn't throw a syntax error for "return not inside a function". Can remove this wrapper if I find a better way to do it. Or better yet, convert to a class.
$( async () => {
	const title = mw.config.get( 'wgPageName' ); // includes namespace, underscores instead of spaces
	if ( !shouldRunOnThisPage( title ) ) {
		return;
	}

	mw.util.addPortletLink(
		'p-navigation',
		'#',
		'Run SpeciesHelper',
		'SpeciesHelper',
		// can't put comma here, silent error
		'[Alt+A]'
	);

	$( '#SpeciesHelper' ).on( 'click', async () => await speciesHelper( title ) );

	document.addEventListener( 'keydown', async ( event ) => {
		if ( event.altKey /* && event.shiftKey */ && event.key === 'a' ) {
			return await speciesHelper( title );
		}
	} );

	async function speciesHelper( title ) {
		const diffID = mw.config.get( 'wgRevisionId' );
		const wikicode = await getWikicodeOfDiff( diffID );
		let wikicode2 = wikicode;

		draftCategoryColon = '';
		const isDraft = mw.config.get( 'wgNamespaceNumber' ) === 118;
		const hasDraftCategoriesTemplate = wikicode2.match( /\{\{Draft[ _]categories/gi );
		if ( isDraft && !hasDraftCategoriesTemplate ) {
			draftCategoryColon = ':';
		}

		// add a line break to the end. makes certain regex's simpler. trim it later.
		wikicode2 += '\n';

		// SKIP DISAMBIGUATION PAGES ===============================================
		if ( isDisambiguationPage( wikicode2 ) ) {
			alert( 'No changes needed. (Disambiguation pages skipped)' );
			return;
		}

		// SKIP REDIRECTS FOR NOW, MAY ADD LATER ===================================
		// TODO: support redirects. if it's good to add {{Taxonbar}} or {{Italic title}} to them, could do that. Could also check the target and see if it's a genus, and add {{R from species to genus}}. There's also a series of {{R from alternate scientific name}} templates (e.g. {{R from alternate scientific name|algae}}), could ask if that's what we want added, then add the correct one.
		if ( isRedirectPage( wikicode2 ) ) {
			alert( 'No changes needed. (Redirect pages currently skipped)' );
			return;
		}

		// SKIP SUBSCPECIES FOR NOW ================================================
		if ( isSubSpecies( title, wikicode2 ) ) {
			alert( 'No changes needed. (Subspecies currently skipped)' );
			return;
		}

		// SKIP VIRUSES FOR NOW, THEIR SPECIES NAMES ARE LONG ======================
		const hasVirusBox = wikicode2.match( /\{\{(?:Virusbox)/i );
		if ( hasVirusBox ) {
			alert( 'No changes needed. (Viruses currently skipped)' );
			return;
		}

		const editSummaryItems = [];

		// CONVERT TAXOBOX TO SPECIESBOX ==========================================
		const wrongBox = wikicode2.match( /\{\{(?:Automatic[ _]taxobox|Taxobox)/i );
		if ( wrongBox ) {
			/*
			let pageCreationDate = await getPageCreationDate(title);
			let oneYearAgo = getDateOneYearAgo(new Date());
			let isOldArticle = pageCreationDate < oneYearAgo;
			if ( ! isOldArticle ) { // don't convert taxoboxes for old articles. too controversial.
			*/

			// Skipping gastropod (snail and slug) conversion for now. The latest I heard about this was at https://en.wikipedia.org/wiki/Wikipedia_talk:Automated_taxobox_system/Archive_5#Converting_taxoboxes_to_speciesboxes, where JoJan requested that I convert gastropod articles only if their Genus article was using {{Automatic taxobox}}, which was an indicator that he had checked it thoroughly. Sounds like it's OK to mass convert for all other projects, per Plantdrew's analysis in the above thread there are no longer any serious objectors.
			const isGastropod = wikicode2.match( /Gastropoda/i );

			if ( !isGastropod ) {
				const ctsb = new ConvertToSpeciesBox();
				wikicode2 = ctsb.convert( wikicode2 );
				editSummaryItems.push( 'convert to {{Speciesbox}}' );
			}
		}

		// DraftCleaner: remove {{Draft}} tag if not in draftspace ================
		let wikicodeBefore = wikicode2;
		wikicode2 = removeDraftTagIfNotDraftspace( wikicode2, isDraft );
		if ( wikicode2 !== wikicodeBefore ) {
			editSummaryItems.push( '-{{Draft}}' );
		}

		// REMOVE ITALICTITLE IF SPECIESBOX PRESENT ===============================
		wikicodeBefore = wikicode2;
		wikicode2 = removeItalicTitleIfSpeciesBoxPresent( wikicode2 );
		if ( wikicode2 !== wikicodeBefore ) {
			editSummaryItems.push( '-{{Italic title}}' );
		}

		// FIX {{Speciesbox |genus=A |species=A B}} ===============================
		wikicodeBefore = wikicode2;
		wikicode2 = fixSpeciesParameterThatContainsGenus( wikicode2 );
		if ( wikicode2 !== wikicodeBefore ) {
			editSummaryItems.push( 'fix species parameter' );
		}

		// REMOVE WHITESPACE IN CATEGORIES =========================================
		wikicodeBefore = wikicode2;
		wikicode2 = fixWhitespaceInCategories( wikicode2 );
		if ( wikicode2 !== wikicodeBefore ) {
			editSummaryItems.push( 'fix whitespace in categories' );
		}

		// TURN ON CATEGORIES IF NOT DRAFTSPACE ====================================
		wikicodeBefore = wikicode2;
		wikicode2 = enableCategories( wikicode2, isDraft );
		if ( wikicode2 !== wikicodeBefore ) {
			editSummaryItems.push( 'enable categories' );
		}

		// TURN OFF CATEGORIES IF NOT DRAFTSPACE ====================================
		wikicodeBefore = wikicode2;
		wikicode2 = disableCategories( wikicode2, isDraft );
		if ( wikicode2 !== wikicodeBefore ) {
			editSummaryItems.push( 'disable categories' );
		}

		// GET TAXA ================================================================
		// taxa array is ascending. genus->subfamily->family->order->etc.

		/** Example: Mansonia (plant), rather than Mansonia */
		let taxonomyTemplateGenus = '';
		let species = '';
		let taxa = '';
		let genusForAlert = '';

		// try to get genus+species from {{Speciesbox |parent= |taxon= }}
		// Rare edge case used sometimes when disambiguating a genus
		// Example: {{Speciesbox | parent = Pilophorus (fungus) | taxon = Pilophorus acicularis}}
		const hasSpeciesboxTaxonAndParentParameters = getSpeciesboxTaxonAndParentParameters( wikicode2 );
		if ( !taxa && hasSpeciesboxTaxonAndParentParameters ) {
			taxonomyTemplateGenus = hasSpeciesboxTaxonAndParentParameters.taxonomyTemplateGenus;
			genusForAlert = hasSpeciesboxTaxonAndParentParameters.genusForAlert;
			species = hasSpeciesboxTaxonAndParentParameters.species;
			taxa = await getTaxa( taxonomyTemplateGenus );
		}

		// try to get genus+species from {{Speciesbox |genus= |species= }}
		if ( !taxa ) {
			taxonomyTemplateGenus = wikicode2.match( /\|\s*genus\s*=\s*([A-Za-z ()]+?)\s*[<\n|}]/ );
			species = wikicode2.match( /\|\s*species\s*=\s*([a-z]+)\s*[<\n|}]/ );
			if ( taxonomyTemplateGenus && species ) {
				taxonomyTemplateGenus = taxonomyTemplateGenus[ 1 ];
				genusForAlert = taxonomyTemplateGenus;
				species = species[ 1 ];
				taxa = await getTaxa( taxonomyTemplateGenus );
			}
		}

		let titleNoNamespace = getTitleNoNamespace( title );

		// try to get genus+species from the article title
		if ( !taxa ) {
			if ( isSandbox( title ) ) {
				// get bolded title
				const match = wikicode.match( /'{3,}(.*?)'{3,}/ )[ 1 ];
				titleNoNamespace = match.replace( ' ', '_' );
			}
			const matches = titleNoNamespace.match( /^([^_]+)_([^_]+)/ );
			if ( matches ) {
				taxonomyTemplateGenus = matches[ 1 ];
				genusForAlert = genusForAlert || taxonomyTemplateGenus;
				species = matches[ 2 ];
				taxa = await getTaxa( taxonomyTemplateGenus );
			}
		}

		// try to get genus+species from {{Speciesbox |taxon= }}
		const hasTaxonParameter = wikicode2.match( /\|\s*taxon\s*=\s*([A-Z][a-z]+) ([a-z]+)\s*[<\n|}]/ );
		if ( !taxa && hasTaxonParameter ) {
			taxonomyTemplateGenus = hasTaxonParameter[ 1 ];
			genusForAlert = taxonomyTemplateGenus;
			species = hasTaxonParameter[ 2 ];
			taxa = await getTaxa( taxonomyTemplateGenus );
		}

		if ( !genusForAlert ) {
			alert( 'Unable to isolate genus and species. Is this actually a species?' );
			return;
		}

		if ( !taxa ) {
			const userWantsToCreateTaxonomy = confirm( `Template:Taxonomy/${ genusForAlert } does not exist. Is this actually a species? If so, need to create Template:Taxonomy/${ genusForAlert }. Press OK to create the template, or Cancel to go back to the article.` );
			if ( userWantsToCreateTaxonomy ) {
				window.location.href = `https://en.wikipedia.org/w/index.php?title=Template:Taxonomy/${ genusForAlert }&action=edit&preload=Template:Taxonomy/preload`;
			}
			return;
		}

		/** Example: Mansonia, rather than Mansonia (plant) */
		const displayGenus = taxonomyTemplateGenus.replace( / \([^)]+\)/, '' );

		taxa = taxaStringToArray( taxa );

		// Unusual edge case where the category and stub template exist, but their pages aren't for a taxa, they're for something not related to biology at all. The fix: just delete them from the taxa array.
		const taxaToSkip = [ 'Appalachia' ];
		for ( taxon of taxaToSkip ) {
			taxa = taxa.filter( ( item ) => item !== taxon );
		}

		const mopf = new MOSOrderPositionFinder( wikicode );

		// SPECIESBOX ================================================================
		const hasSpeciesBoxOrTaxoBox = wikicode2.match( /\{\{(?:Speciesbox|Species[ _]box|Automatic[ _]taxobox|Taxobox|Subspeciesbox|Infraspeciesbox|Hybridbox|Virusbox)/i );
		if ( !hasSpeciesBoxOrTaxoBox ) {
			const toAdd =
	`{{Speciesbox
	| genus = ${ taxonomyTemplateGenus }
	| species = ${ species }
	}}`;
			wikicode2 = mopf.insertAtSection( wikicode2, toAdd, 'infoboxes' );
			editSummaryItems.push( '+{{Speciesbox}}' );
		}

		// TAXONBAR ================================================================
		// valid taxonbar templates: 'Taxonbar', 'Taxon-bar', 'Taxobar', 'TaxonIDs', 'Taxon identifiers', 'Taxon bar',
		const hasTaxonBar = wikicode2.match( /\{\{(?:Taxonbar|Taxon-bar|Taxobar|TaxonIDs|Taxon[ _]identifiers|Taxon[ _]bar)/i );
		if ( !hasTaxonBar ) {
			const wikidataID = await getWikidataID( `${ displayGenus } ${ species }` );
			if ( wikidataID ) {
				const toAdd = `{{Taxonbar|from=${ wikidataID }}}`;
				wikicode2 = mopf.insertAtSection( wikicode2, toAdd, 'taxonBar' );
				editSummaryItems.push( '+{{Taxonbar}}' );
			}
		}

		// CHECK IF A BUNCH OF STUBS AND CATEGORIES EXIST ==================
		const listOfNonLatinSpeciesCategories = {
			// SENTENCE CASE AND SPACES PLEASE, usually plural
			// latin (deprecated) -> non-latin (preferred)
			Acoelomorpha: 'Acoelomorphs',
			Amazona: 'Amazon parrots',
			Aleyrodidae: 'Whiteflies',
			Anguidae: 'Anguids',
			Anisoptera: 'Dragonflies',
			Annelida: 'Annelids',
			Anura: 'Frogs',
			Araneae: 'Spiders',
			Bombus: 'Bumblebees',
			Brachyura: 'Crabs',
			Bryozoa: 'Bryozoans',
			Caprini: 'Caprids',
			Cebinae: 'Capuchin monkeys',
			Cephalopoda: 'Cephalopods',
			Cervidae: 'Deer',
			Chilopoda: 'Centipedes',
			Cirripedia: 'Barnacles',
			Cnidaria: 'Cnidarians',
			Coleoptera: 'Beetles',
			Colubridae: 'Colubrids',
			Ctenophora: 'Ctenophores',
			Curculionoidea: 'Weevils',
			Dactyloidae: 'Anoles',
			Decapodiformes: 'Squid',
			Delphinidae: 'Oceanic dolphins',
			Dendrobatidae: 'Poison dart frogs',
			Dicruridae: 'Drongos',
			Didelphimorphia: 'Opossums',
			Ephemeroptera: 'Mayflies',
			Flavobacteriia: 'Flavobacteria',
			Formicidae: 'Ants',
			Gastropoda: 'Gastropods',
			Heterokonta: 'Heterokonts',
			Insecta: 'Insects',
			Isoptera: 'Termites',
			Licmetis: 'Corellas',
			Lithodidae: 'King crabs',
			Lorisoidea: 'Lorises and galagos',
			Macropodidae: 'Macropods',
			Macronaria: 'Macronarians',
			Mammalia: 'Mammals',
			Mammuthus: 'Mammoths',
			Marmota: 'Marmots',
			Mycobacterium: 'Mycobacteria',
			Myotis: 'Mouse-eared bats',
			Mysticeti: 'Baleen whale',
			Nematoda: 'Nematodes',
			Octopoda: 'Octopuses',
			Onychophora: 'Onychophorans',
			Paeonia: 'Peonies',
			Pitheciinae: 'Sakis and uakaris',
			Pseudacris: 'Chorus frogs',
			Rangifer: 'Reindeer',
			Rhinocerotidae: 'Rhinoceroses',
			Rosa: 'Roses',
			Sigmodon: 'Cotton rats',
			Sitta: 'Nuthatches',
			Syrphidae: 'Hoverflies',
			Thysanoptera: 'Thrips',
			Toxodontidae: 'Toxodonts',
			Toxotes: 'Archerfish'
		};
		const pagesToCheck = getPagesToCheck( taxa, listOfNonLatinSpeciesCategories );
		let listOfPages = await doPagesExist( pagesToCheck );
		listOfPages = fixArrayOrder( pagesToCheck, listOfPages );

		// DELETE [[Category:Genus| ]] =============================================
		// so we can regenerate it correctly
		const genusCategoryToCheck = listOfNonLatinSpeciesCategories[ taxonomyTemplateGenus ] ? listOfNonLatinSpeciesCategories[ taxonomyTemplateGenus ] : taxonomyTemplateGenus;
		wikicode2 = deleteGenusCategoryWithSpaceDisambiguator( wikicode2, genusCategoryToCheck, draftCategoryColon );

		// CATEGORY ================================================================
		const suggestedCategory = parseListOfPages( listOfPages, 'category' );
		const categoryGenusRegEx = new RegExp( `\\[\\[${ draftCategoryColon }Category:` + regExEscape( genusCategoryToCheck ), 'i' );
		const hasGenusParameterCategory = wikicode2.match( categoryGenusRegEx ); // so basically, don't run if genus category is already present. importantly, includes genuses with parentheses, e.g. [[Category:Saara (lizard)]]
		if ( suggestedCategory && !hasGenusParameterCategory ) {
			const wikicodeBeforeCategoryChanges = wikicode2;

			// build list of categories currently in the article
			const categoriesInArticle = getListOfCategoriesFromWikitext( wikicode2 );

			// check categories in the article as a batch, see if their taxonomy templates exist
			let categoriesWithTaxonomy = categoriesInArticle ? await doPagesExist( categoriesInArticle.map( ( v ) => {
				v = v.replace( 'Category:', '' );
				return 'Template:Taxonomy/' + v;
			} ) ) : [];
			categoriesWithTaxonomy = categoriesWithTaxonomy.map( ( v ) => {
				v = v.replace( 'Template:Taxonomy/', '' );
				return 'Category:' + v;
			} );

			const categoriesToDelete = getAllTaxaCategories( listOfPages );
			// if existing categories have taxonomy templates, add them to the list of categories to delete to avoid [[WP:OVERCAT]]
			for ( const cat of categoriesWithTaxonomy ) {
				categoriesToDelete.push( cat );
			}
			// delete any category names in our dictionary (non-latin category names)
			for ( const key in listOfNonLatinSpeciesCategories ) {
				const value = listOfNonLatinSpeciesCategories[ key ];
				categoriesToDelete.push( 'Category:' + value );
			}

			// delete all taxonomy related categories, to avoid [[WP:OVERCAT]]
			for ( const cat of categoriesToDelete ) {
				const regEx = new RegExp( '\\[\\[:?' + regExEscape( cat ) + '(?:\\|[^\\]]+)?\\]\\] {0,}\\n', 'gi' );
				wikicode2 = wikicode2.replace( regEx, '' );
			}

			let toAdd = '';
			const suggestedCategoryNoParentheses = suggestedCategory.replace( / \([A-Za-z]+\)/, '' );
			if ( suggestedCategoryNoParentheses === taxonomyTemplateGenus ) {
				toAdd = `[[${ draftCategoryColon }Category:${ suggestedCategory }|${ species }]]`;
			} else {
				toAdd = `[[${ draftCategoryColon }Category:${ suggestedCategory }]]`;
			}
			wikicode2 = mopf.insertAtSection( wikicode2, toAdd, 'categories' );

			const categoriesInArticle2 = getListOfCategoriesFromWikitext( wikicode2 );
			const categoryListsAreIdentical = arraysHaveSameValuesCaseInsensitive( categoriesInArticle, categoriesInArticle2 );

			if ( wikicodeBeforeCategoryChanges !== wikicode2 && !categoryListsAreIdentical ) {
				editSummaryItems.push( 'category' );
			}

			if ( categoryListsAreIdentical ) {
				// undo our changes, since they are just minor changes involving whitespace or order of categories
				wikicode2 = wikicodeBeforeCategoryChanges;
			}
		}

		// IMPROVE CATEGORIES ======================================================
		const hasCategories = wikicode2.match( /\[\[:?Category:/gi );
		let categoryCount = hasCategories !== null ? hasCategories.length : 0;
		const hasImproveCategories = wikicode2.match( /\{\{Improve[ _]categories/i );
		if ( categoryCount < 2 && !hasImproveCategories && !isDraft ) {
			// Insertion point: very bottom. confirmed via twinkle test
			let date = new Date();
			const month = date.toLocaleString( 'default', { month: 'long' } );
			const year = date.getFullYear();
			date = month + ' ' + year;
			wikicode2 = mopf.insertAtSection( wikicode2, `{{Improve categories|date=${ date }}}`, 'improveCategories' );
			editSummaryItems.push( '+{{Improve categories}}' );
		}

		// STUB ==================================================================
		const suggestedStubName = parseListOfPages( listOfPages, 'stub' );
		const shouldBeStub = countWords( wikicode2 ) < 150; // I've been reverted for stub tagging an article with a word count of 175 before. so setting this kind of low.
		const hasStubTags = wikicode2.match( /\{\{.+-stub\}\}\n/gi );
		// these stubs are kind of fuzzy for various reasons. not worth messing with them
		const stubsThatTriggerSkip = [
			'Iguanidae',
			'Lizard',
			'Potato',
			// [[User talk:Novem Linguae/Scripts/SpeciesHelper#Dual Stub Removal]]
			'Plant-disease',
			// [[User talk:Novem Linguae/Scripts/SpeciesHelper#Dual Stub Removal]]
			'Paleo-gastropod'
		];
		let skip = false;
		for ( const stub of stubsThatTriggerSkip ) {
			const regex = new RegExp( '\\{\\{' + stub + '-stub\\}\\}', 'i' );
			const hasStub = wikicode2.match( regex );
			if ( hasStub ) {
				skip = true;
				break;
			}
		}
		if (
			!isDraft &&
			( shouldBeStub || hasStubTags ) &&
			suggestedStubName &&
			!skip
		) {
			let newStubs = [ '{{' + suggestedStubName + '}}' ];

			newStubs = addSafelistedStubs( newStubs, wikicode2 );

			// build oldStubs array
			const oldStubs = [];
			const matches = wikicode2.match( /\{\{[^}]+-stub\}\}/gi );
			for ( key in matches ) {
				oldStubs.push( matches[ key ] );
			}

			if ( !arraysHaveSameValuesCaseInsensitive( oldStubs, newStubs ) ) {
				// put proposed stub changes into "buffer" variable. if we decide to commit, commit it later
				let buffer = wikicode2;

				// delete all stubs, in preparation for writing ours
				// handle this edge case: {{-stub}}
				buffer = deleteAllStubs( buffer );

				// convert newStubs to toAdd string
				let toAdd = '';
				for ( const stub of newStubs ) {
					toAdd += '\n' + stub;
				}
				toAdd = toAdd.slice( 1 ); // chop off \n at beginning

				buffer = mopf.insertAtSection( buffer, toAdd, 'stubTemplates' );

				if ( !isMinorChange( wikicode2, buffer ) ) {
					editSummaryItems.push( 'stub' );

					// commit buffer
					wikicode2 = buffer;
				}
			}
		}

		// DELETE {{Stub}} IF ANY OTHER STUBS PRESENT
		wikicodeBefore = wikicode2;
		wikicode2 = deleteStubTemplateIfAnyOtherStubsPresent( wikicode2 );
		if ( wikicode2 !== wikicodeBefore && !editSummaryItems.includes( 'stub' ) ) {
			editSummaryItems.push( 'stub' );
		}

		// REPLACE <references /> WITH {{Reflist}} ==========================
		wikicodeBefore = wikicode2;
		wikicode2 = replaceReferencesWithReflist( wikicode2 );
		if ( wikicode2 !== wikicodeBefore ) {
			editSummaryItems.push( '<references /> to {{Reflist}}' );
		}

		// fix too many {{Uncategorized}} or {{Improve categories}} tags
		const allCategoriesRegEx = new RegExp( `(?<=\\[\\[${ draftCategoryColon })Category:.+(?=\\]\\])`, 'gi' );
		categoryCount = wikicode2.match( allCategoriesRegEx );
		if ( categoryCount && categoryCount.length > 0 ) {
			// delete {{Uncategorized}}
			const buffer = wikicode2;
			wikicode2 = wikicode2.replace( /\{\{Uncategorized[^}]*\}\}\n{0,2}/gi, '' );
			if ( buffer !== wikicode2 ) {
				editSummaryItems.push( '-{{Uncategorized}}' );
			}
		}
		if ( categoryCount && categoryCount.length > 2 ) {
			// delete improve categories
			const buffer = wikicode2;
			wikicode2 = wikicode2.replace( /\{\{Improve categories[^}]*\}\}\n{0,2}/gi, '' );
			if ( buffer !== wikicode2 ) {
				editSummaryItems.push( '-{{Improve categories}}' );
			}
		}

		// add {{Short description}} if missing and the script has a good guess
		const hasShortDescription = wikicode2.match( /\{\{(?:Short[ _]description|Shortdesc|Shortdescription|Short desc)/i );
		if ( !hasShortDescription ) {
			const suggestedShortDescription = suggestShortDescriptionFromWikicode( wikicode2, taxa );
			if ( suggestedShortDescription ) {
				wikicode2 = mopf.insertAtSection( wikicode2, suggestedShortDescription, 'shortDescription' );
				editSummaryItems.push( '+{{Short description}}' );
			}
		}

		// DraftCleaner: convert H1 to H2
		wikicodeBefore = wikicode2;
		wikicode2 = convertH1ToH2( wikicode2 );
		if ( wikicode2 !== wikicodeBefore ) {
			editSummaryItems.push( '<h1> to <h2>' );
		}

		/*
		// Commenting out. Some articles do need both, I think.
		// Example: https://en.wikipedia.org/w/index.php?title=Moringa_oleifera&oldid=1176702791

		// remove {{Authority control}} if {{Taxonbar}} present
		wikicodeBefore = wikicode2;
		wikicode2 = removeAuthorityControlIfTaxonbarPresent(wikicode2);
		if ( wikicode2 !== wikicodeBefore ) {
			editSummaryItems.push('-{{Authority control}}');
		}
		*/

		// remove empty {{Default sort}}
		// remove {{Default sort}} identical to article title
		wikicodeBefore = wikicode2;
		const titleNoNamespaceNoUnderscores = titleNoNamespace.replace( '_', ' ' );
		wikicode2 = removeEmptyDefaultSort( wikicode2 );
		wikicode2 = removeDefaultSortIdenticalToTitle( wikicode2, titleNoNamespaceNoUnderscores );
		if ( wikicode2 !== wikicodeBefore ) {
			editSummaryItems.push( '-{{Default sort}}' );
		}

		// if the only change was a change in capitalization or in # of enters, rollback the change, not worth such a minor edit
		if ( isMinorChange( wikicode, wikicode2 ) ) {
			wikicode2 = wikicode;
		}

		// DraftCleaner: fix extra whitespace/newlines, especially above ==References== section. Count it as a major change, force it no matter what.
		wikicodeBefore = wikicode2;
		wikicode2 = deleteMoreThanTwoEntersInARowBeforeReferences( wikicode2, mopf );
		if ( wikicode2 !== wikicodeBefore ) {
			editSummaryItems.push( 'fix whitespace' );
		}

		// DraftCleaner: fix extra whitespace/newlines everywhere. count it as a minor change, can be skipped if no other changes
		wikicode2 = deleteMoreThanTwoEntersInARow( wikicode2 );

		if ( wikicode.trim() === wikicode2.trim() || editSummaryItems.length === 0 ) {
			alert( 'No changes needed.' );
			return;
		}

		wikicode2 = wikicode2.trim();

		let editSummary = '';
		for ( const item of editSummaryItems ) {
			editSummary += `${ item }, `;
		}
		editSummary = editSummary.slice( 0, -2 ); // delete , at end of string
		editSummary += ' ([[User:Novem Linguae/Scripts/SpeciesHelper|SpeciesHelper]])';
		goToShowChangesScreen( title, wikicode2, editSummary );
	}
} );

/*
- New article list, for testing: https://en.wikipedia.org/wiki/User:AlexNewArtBot/PlantsSearchResult

- TODO:
	- If in mainspace, and no "en" entry in wikidata, add it to wikidata
	- If there's a category in the article that doesn't exist, remove it. [[WP:CATREDLINK]]
	- Handle articles that are higher up in the tree of life than genus+species.
		- Need to check genus+species with that API invoke query right away.
		- If it isn't a genus, then assume it's higher up. Use {{Automatic taxobox}} instead of {{Speciesbox}}

- New pages feeds to test things out
	- https://en.wikipedia.org/wiki/User:AlexNewArtBot#Biology_and_medicine
*/
