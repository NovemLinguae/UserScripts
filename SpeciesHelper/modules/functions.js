import { MOSOrderPositionFinder } from "./MOSOrderPositionFinder";
import { Inflect } from "./Inflect";

// TODO: convert to class. name it SHUtil or SpeciesHelperUtil or something

export async function getWikicodeOfDiff(diffID) {
	if ( ! mw.config.get('wgCurRevisionId') ) return ''; // if page is deleted, return blank
	var wikicode = '';
	diffID = encodeURIComponent(diffID);
	await $.ajax({
		url: 'https://en.wikipedia.org/w/api.php?action=parse&oldid='+diffID+'&prop=wikitext&formatversion=2&format=json',
		success: function (result) {
			wikicode = result['parse']['wikitext'];
		},
		dataType: "json",
	});
	return wikicode;
}

export async function getWikidataID(title) {
	let api = new mw.ForeignApi('https://www.wikidata.org/w/api.php');
	let response = await api.get( {
		"action": "wbsearchentities",
		"format": "json",
		"search": title,
		"language": "en"
	} );
	if ( ! response.search.length ) return '';
	return response.search[0].id;
}

export async function getTaxa(genus) {
	// Getting tree of life via API notes: https://en.wikipedia.org/wiki/Wikipedia_talk:Automated_taxobox_system#Family_for_user_script - {{#invoke:Autotaxobox|listAll|Bellis}} → Bellis-genus, Astereae-tribus, Asterodae-supertribus, etc.
	let api = new mw.Api();
	let response = await api.get( {
		"action": "expandtemplates",
		"format": "json",
		"text": `{{#invoke:Autotaxobox|listAll|${genus}}}`,
		"prop": "wikitext"
	} );
	let taxa = response.expandtemplates.wikitext;
	if ( taxa.match(/^[^-]+-$/i) ) { // when taxonomy template is missing, it will return something like Genus-
		taxa = '';
	}
	return taxa;
}

export async function doPagesExist(listOfPages) {
	let api = new mw.Api();
	let response = await api.get( {                   
		"action": "query",
		"format": "json",
		"prop": "revisions",
		"titles": listOfPages.join('|'), // | is an illegal title character, so no need to escape it
	} );
	let listOfLivePages = [];
	let responsePages = response.query.pages;
	for ( let [key, value] of Object.entries(responsePages) ) {
		if ( parseInt(key) !== NaN && parseInt(key) > 0 ) {
			listOfLivePages.push(value.title);
		}
	}
	return listOfLivePages;
}

export function regExEscape(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function goToShowChangesScreen(titleWithNamespaceAndUnderscores, wikicode, editSummaryItems) {
	let titleEncoded = encodeURIComponent(titleWithNamespaceAndUnderscores);
	let wgServer = mw.config.get('wgServer');
	let wgScriptPath = mw.config.get('wgScriptPath');
	let baseURL = wgServer + wgScriptPath + '/';
	// https://stackoverflow.com/a/12464290/3480193
	$(`<form action="${baseURL}index.php?title=${titleEncoded}&action=submit" method="POST"/>`)
		.append($('<input type="hidden" name="wpTextbox1">').val(wikicode))
		.append($('<input type="hidden" name="wpSummary">').val(editSummaryItems))
		.append($('<input type="hidden" name="mode">').val('preview'))
		.append($('<input type="hidden" name="wpDiff">').val('Show changes'))
		.append($('<input type="hidden" name="wpUltimateParam">').val('1'))
		.appendTo($(document.body)) //it has to be added somewhere into the <body>
		.submit();
}

export function shouldRunOnThisPage(title) {
	// don't run when not viewing articles
	let action = mw.config.get('wgAction');
	if ( action != 'view' ) return false;
	
	// don't run when viewing diffs
	//let isDiff = mw.config.get('wgDiffNewId');
	//if ( isDiff ) return false;
	
	let isDeletedPage = ( ! mw.config.get('wgCurRevisionId') );
	if ( isDeletedPage ) return false;
	
	// Only run in mainspace or draftspace
	let namespace = mw.config.get('wgNamespaceNumber');
	let isMainspaceOrDraftspace = ( [0, 118].includes(namespace) );
	if ( ! isMainspaceOrDraftspace && ! title.startsWith('User:Novem_Linguae/sandbox') ) {
		return false;
	}

	return true;
}

export function getPagesToCheck(taxa, listOfNonLatinSpeciesCategories) {
	let depthToCheck = 20; // there's an API limit on the # of pages you can check. possible to get around this with multiple API calls, if needed.
	let chunk = taxa.slice(0, depthToCheck);
	let pagesToCheck = [];
	// Check several levels of these
	let i = 0;
	for ( let piece of chunk ) {
		i++;
		// handle edge case "Incertae sedis" or "Incertae sedis/something"
		piece = piece.replace('Incertae sedis', '');
		piece = piece.replace('/', '');
		if ( ! piece ) continue;
		// stub
		pagesToCheck.push(`Template:${piece}-stub`);
		// category
		pagesToCheck.push(`Category:${piece}`);
 		// some genus categories have disambugators at the end, such as (genus) or (plant). check for this edge case
		if ( i === 1 ) {
			pagesToCheck.push(`Category:${piece} (genus)`);
		}
		// skip {{Viola-stub}}, false positive (is for the instrument, not the genus)
		pagesToCheck = deleteFromArray('Template:Viola-stub', pagesToCheck);
	}

	// Replace any latin stubs that have non-latin equivalents, with the non-latin stub
	let listOfNonLatinSpeciesStubs = {
		// SENTENCE CASE. Left side spaces, right side dashes. Usually singular.
		// latin (deprecated) -> non-latin (preferred)
		// '': 'Abyssochrysidae', // TODO: make Template:Taxonomy
		'Acanthocephala': 'Acanthocephalan',
		// '': 'Agonoxeninae', // "disputed"
		// '': 'Alucitoidea', // Template:Taxonomy has a /? after it
		'Ammonoidea': 'Ammonite',
		// '': 'Ancylonotini',
		'Anomodontia': 'Anomodont',
		'Anthiinae (beetle)': 'AnthiinaeBeetle',
		'Archosauria': 'Archosaur',
		'Arthropoda': 'Arthropod',
		// '': 'Australia-asterid',
		// '': 'Australia-eudicot',
		// '': 'Australia-plant',
		// '': 'Australia-rosid',
		// '': 'Autostichinae', // TODO: make Template:Taxonomy
		'Bambusoideae': 'Bamboo',
		'Bryophyta': 'Bryophyte',
		'Chiroptera': 'Bat',
		'Anthophila': 'Bee',
		// '': 'Bicyclus', // TODO: make Template:Taxonomy
		'Bikonta': 'Bikont',
		'Osteichthyes': 'Bony-fish',
		'Brachiopoda': 'Brachiopod',
		// '': 'Bradina', // TODO: make Template:Taxonomy
		// '': 'Bryophyte', // proposed, polyphyletic
		'Bryozoa': 'Bryozoan',
		// '': 'Buccinulidae', // TODO: make Template:Taxonomy
		'Rhopalocera': 'Butterfly',
		// '': 'Cabniini', // TODO: make Template:Taxonomy
		'Gymnophiona': 'Caecilian',
		// '': 'Caliphyllidae', // disputed
		// '': 'Canid',
		// '': 'Carposina',
		// '': 'Ceromitia',
		// '': 'Cettiidae‎',
		'Chamaeleonidae': 'Chameleon',
		// '': 'Chilinidae',
		'Chilodontaidae': 'Chilodontidae-gastropod',
		// '': 'Chlamydephoridae',
		// '': 'Chordate',
		// '': 'Ciliate',
		// '': 'Cochlicopidae',
		'Colubridae': 'Colubrids',
		'Pinophyta': 'Conifer',
		// '': 'Conodont',
		'Copepoda': 'Copepod',
		'Crustacea': 'Crustacean',
		// '': 'Cryptoblabini',
		'Sepiida': 'Cuttlefish',
		// '': 'Cycad',
		'Zygoptera': 'Damselfly',
		'Decapoda': 'Decapod',
		// '': 'Depressaria',
		// '': 'Dialidae',
		// '': 'Diatom',
		'Dinoflagellata': 'Dinoflagellate',
		'Dinosauria': 'Dinosaur',
		'Diprotodontia': 'Diprotodont',
		'Dermaptera': 'Earwig',
		// '': 'Eatoniellidae',
		// '': 'Eburodacrys',
		'Echinodermata': 'Echinoderm',
		// '': 'Egesina',
		// '': 'Elaphidiini',
		// '': 'Eoophyla',
		// '': 'Erinaceomorpha',
		'Eukaryota': 'Eukaryote',
		// '': 'Eventoedungulate',
		'Fabaceae': 'Fabaceae-tree',
		'Felidae': 'Feline',
		'Polypodiophyta': 'Fern',
		'Lampyridae': 'Firefly',
		'Platyhelminthes': 'Flatworm',
		'Flavobacteriia': 'Flavobacteria',
		'Siphonaptera': 'Flea',
		'Pteropodoidea': 'Fruit-bat',
		// '': 'Glipa',
		// '': 'Glottulinae',
		'Poaceae': 'Grass',
		'Marmotini': 'Ground-squirrel',
		// '': 'Haplotrematidae',
		// '': 'Hemichordate',
		// '': 'Heterokont',
		// '': 'Heteropsini',
		// '': 'Heteropsis',
		// '': 'Hydrolase',
		// '': 'Hypercalliinae',
		// '': 'Hypoptinae',
		// '': 'Ichthyosaur',
		// '': 'Isomerase',
		// '': 'Jordanoleiopus',
		// '': 'Lactobacilli',
		'Lagomorpha': 'Lagomorph',
		// '': 'Lamprosema',
		'Phyllostomidae': 'Leafnosed-bat',
		// '': 'Leptostylus',
		// '': 'Lepturges',
		// '': 'Ligase',
		'Sarcopterygii': 'Lobefinned-fish',
		'Phthiraptera': 'Louse',
		// '': 'Lyase',
		'Lycophytes': 'Lycophyte',
		// '': 'Macrosphenidae‎',
		'Magnoliids': 'Magnoliid',
		'Mammalia': 'Mammal',
		'Marsupialia': 'Marsupial',
		// '': 'Megomphicidae',
		// '': 'Methiini',
		// '': 'Miaenia',
		'Mollusca': 'Mollusc',
		'Simiiformes': 'Monkey',
		// '': 'Muroid',
		// '': 'Mythimnini',
		// '': 'Nacoleia',
		// '': 'Neoibidionini',
		// '': 'Netechma',
		'Platyrrhini': 'Newworld-monkey',
		// '': 'Nitrobacteraceae',
		// '': 'Nymphicula',
		// '': 'Nyssodrysternum',
		// '': 'Obtortionidae',
		// '': 'Oddtoedungulate',
		// '': 'Oemini',
		'Cercopithecoidea': 'Oldworld-monkey',
		// '': 'Olivellidae',
		// '': 'Opisthokont',
		'Orchidaceae': 'Orchid',
		// '': 'Oreodera',
		// '': 'Oreohelicidae',
		// '': 'Ornithischian',
		// '': 'Ornithology',
		// '': 'Orthocomotis',
		// '': 'Ostracod',
		// '': 'Oxidoreductase',
		// '': 'Paracles',
		// '': 'Parasite-insect',
		// '': 'Parasitic-SAR',
		// '': 'Parornix',
		// '': 'Passerine',
		// '': 'Pediculariidae',
		// '': 'Permian-reptile',
		// '': 'Phyllobacteriaceae',
		// '': 'Piezocerini',
		// '': 'Piletocera',
		// '': 'Placobranchidae',
		// '': 'Placoderm',
		// '': 'Plesiosaur',
		// '': 'Poriferan',
		'Eumeninae': 'Potter-wasp',
		'Primates': 'Primate',
		// '': 'Prionapterygini',
		// '': 'Procerithiidae',
		// '': 'Propionibacterineae',
		// '': 'Prosoplus',
		// '': 'Protostome',
		// '': 'Psapharochrus',
		// '': 'Psaphidinae',
		// '': 'Pseudolividae',
		// '': 'Pseudonocardineae',
		'Pterosauria': 'Pterosaur',
		// '': 'Pyramidulidae',
		'Pyrausta': 'Pyrausta (moth)',
		// '': 'Rasboras',
		// '': 'Remizidae‎',
		'Rodentia': 'Rodent',
		'Rosids': 'Rosid',
		// '': 'Rotifer',
		'Urodela': 'Salamander',
		// '': 'Saurita',
		// '': 'Sauropodomorph',
		'Symphyta': 'Sawfly',
		// '': 'Scaliolidae',
		// '': 'Scaphopod',
		'Scorpiones': 'Scorpion',
		'Selachimorpha': 'Shark',
		'Soricidae': 'Shrew',
		// '': 'Siliquariidae',
		// '': 'Siphonariidae',
		'Serpentes': 'Snake',
		// '': 'Solenogaster',
		// '': 'Spirochaetae',
		// '': 'Springtail',
		'Sciuridae': 'Squirrel',
		// '': 'Stenalia',
		// '': 'Stenothyridae',
		// '': 'Stictopterinae',
		// '': 'Strepsimaninae',
		// '': 'Strobilopsidae',
		// '': 'Subulinidae',
		'Cygnus': 'Swan',
		// '': 'Synapsid',
		// '': 'Tardigrade',
		// '': 'Teliomycotina',
		// '': 'Therapsid',
		// '': 'Theropod',
		// '': 'Thysanura',
		// '': 'Trifurcula',
		// '': 'Trigonochlamydidae',
		// '': 'Trilobite',
		// '': 'Truncatellidae',
		'Oomycota': 'Watermould',
		// '': 'Zetaproteobacteria', // TODO: create Template:Taxonomy
		'Acariformes': 'Acari', // mites and ticks part 1
		'Acoelomorpha': 'Xenacoelomorpha', // redirects to this parent taxon
		'Actinopterygii': 'Rayfinned-fish',
		'Amphibia': 'Amphibian',
		'Amphipoda': 'Amphipod',
		'Anatidae': 'Duck',
		'Animalia': 'Animal',
		'Anisoptera': 'Dragonfly',
		'Annelida': 'Annelid',
		// 'Apocrita': 'Wasp', // polyphyletic
		'Arachnida': 'Arachnid',
		'Araneae': 'Spider',
		'Arecaceae': 'Palm',
		'Alsophila (plant)': 'Alsophila-plant',
		'Astacoidea': 'Crayfish',
		'Asterids': 'Asterid',
		'Aves': 'Bird',
		'Bivalvia': 'Bivalve',
		'Blattodea': 'Cockroach',
		'Brachyura': 'Crab',
		'Bromeliaceae': 'Bromeliad',
		'Cactaceae': 'Cactus',
		'Cephalopoda': 'Cephalopod',
		'Cnidaria': 'Cnidarian',
		'Crocidurinae': 'Whitetoothed-shrew',
		'Coffea': 'Coffee',
		'Coleoptera': 'Beetle',
		'Colubridae': 'Colubrid',
		'Ctenophora': 'Ctenophore',
		'Curculionoidea': 'Weevil',
		'Decapodiformes': 'Squid',
		'Demospongiae': 'Demosponge',
		'Ephemeroptera': 'Mayfly',
		'Fabaceae': 'Legume',
		'Formicidae': 'Ant',
		'Fungi': 'Fungus',
		'Gastropoda': 'Gastropod',
		'Gekkota': 'Gecko',
		'Heterocera': 'Moth',
		'Insecta': 'Insect',
		'Isopoda': 'Isopod',
		'Isoptera': 'Termite',
		'Mimosoid clade': 'Mimosoideae', // this one is weird. intentional though
		'Mollusca': 'Mollusk',
		'Monocots': 'Monocot',
		'Myrmeleontidae': 'Antlion',
		'Nematoda': 'Nematode',
		'Nemertea': 'Nemertean',
		'Octopoda': 'Octopus',
		'Onychophora': 'Onychophore',
		'Parasitiformes': 'Acari', // mites and ticks part 2
		'Parastacoidea': 'Crayfish',
		'Picidae': 'Woodpecker',
		'Plantae': 'Plant',
		'Psittaciformes': 'Parrot',
		'Reptilia': 'Reptile',
		'Salticidae': 'Jumping-spider',
		'Scincidae': 'Skink',
		'Sciuridae': 'Squirrel',
		'Siluriformes': 'Catfish',
		'Soricinae': 'Redtoothed-shrew',
		// 'Squamata': 'Lizard', // paraphyletic
		'Testudines': 'Turtle',
		'Thysanoptera': 'Thrips',
		'Trochilidae': 'Hummingbird',
	};
	for ( let key in listOfNonLatinSpeciesStubs ) {
		for ( let key2 in pagesToCheck ) {
			let stubNameToCheck = 'Template:' + key + '-stub';
			let pageName = pagesToCheck[key2];
			if ( pageName === stubNameToCheck ) {
				pagesToCheck[key2] = 'Template:' + listOfNonLatinSpeciesStubs[key] + '-stub';
			}
		}
	}

	// Replace any latin categories that have non-latin equivalents, with the non-latin categories
	for ( let key in listOfNonLatinSpeciesCategories ) {
		for ( let key2 in pagesToCheck ) {
			let stubNameToCheck = 'Category:' + key;
			let pageName = pagesToCheck[key2];
			if ( pageName === stubNameToCheck ) {
				pagesToCheck[key2] = 'Category:' + listOfNonLatinSpeciesCategories[key];
			}
		}
	}
	return pagesToCheck;
}

export function parseListOfPages(listOfPages, type) {
	// get rid of entries that aren't of the correct type
	switch ( type ) {
		case 'category':
			listOfPages = listOfPages.filter(function(str) {
				return str.match(/^Category:.*$/i);
			});
			break;
		case 'navbox':
			listOfPages = listOfPages.filter(function(str) {
				return str.match(/^Template:.*(?<!-stub)$/i);
			});
			break;
		case 'stub':
			listOfPages = listOfPages.filter(function(str) {
				return str.match(/^Template:.*-stub$/i);
			});
			break;
	}
	// only return the deepest taxa that was found (the entry closest to the beginning of the list)
	listOfPages = listOfPages[0] || '';
	// get rid of Template: and Category:
	return listOfPages.replace(/(?:Template:|Category:)/i, '');
}

export function getAllTaxaCategories(listOfPages) {
	listOfPages = listOfPages.filter(function(str) {
		return str.match(/^Category:.*$/);
	});
	return listOfPages;
}

/** Fixes the order of the array, which got scrambled when running the API query. The correctOrder array is bigger and in order, the incorrectOrder array is smaller and scrambled. The result will be smaller and in order. */
export function fixArrayOrder(correctOrder, incorrectOrder) {
	return correctOrder.filter(function(str) {
		return incorrectOrder.indexOf(str) !== -1;
	});
}

// TODO: write unit test for this function. maybe move it to a class
export function countWords(wikicode) {
	// convert {{Blockquote}} to text
	wikicode = wikicode.replace(/\{\{Blockquote\s*\|([^\}]*)\}\}/g, '$1');

	// strip templates
	// TODO: handle nested templates
	wikicode = wikicode.replace(/\{\{.*?\}\}/gsi, '');
	// strip images
	wikicode = wikicode.replace(/\[\[File:.*?\]\]/gsi, '');
	// strip HTML comments
	wikicode = wikicode.replace(/<!--.*?-->/gsi, '');
	// strip HTML tags and refs
	wikicode = wikicode.replace(/<.*?.*?\/.*?>/gsi, '');
	// strip heading formatting
	wikicode = wikicode.replace(/ {0,}=={1,} {0,}/gsi, '');
	// strip categories
	wikicode = wikicode.replace(/\[\[:?Category:.*?\]\]/gsi, '');
	// handle piped wikilinks
	// TODO: handle nested brackets (for example, a wikilink as an image caption)
	wikicode = wikicode.replace(/\[\[[^\]]+\|([^\]]+)\]\]/gsi, '$1');
	// handle simple wikilinks
	wikicode = wikicode.replace(/\[\[/g, '').replace(/\]\]/g, '');
	// strip bold and italics
	wikicode = wikicode.replace(/'{2,}/g, '');
	// consolidate whitespace
	wikicode = wikicode.replace(/\s+/gsi, ' ');
	// &nbsp; to space
	wikicode = wikicode.replace(/&nbsp;/gsi, ' ');

	// In one of my test cases, there was a }} that didn't get deleted. But this is not detected by \w+, so no need to worry about it.

	wikicode = wikicode.trim();

	let wordCount = wikicode.match(/(\w+)/g).length;
	return wordCount;
}

export function isMinorChange(wikicode, wikicode2) {
	let wikicode2LowerCase = wikicode2.replace(/\n/g, '').toLowerCase().trim();
	let wikicodeLowerCase = wikicode.replace(/\n/g, '').toLowerCase().trim();
	return wikicode2LowerCase === wikicodeLowerCase;
}

export function arraysHaveSameValuesCaseInsensitive(array1, array2) {
	if ( array1 === null && array2 === null ) return true;
	if ( array1 === null || array2 === null ) return false;
	// https://stackoverflow.com/a/6230314/3480193
	if ( array1.sort().join(',').toLowerCase() === array2.sort().join(',').toLowerCase() ) {
		return true;
	}
	return false;
}

export function taxaStringToArray(taxa) {
	// get rid of "Life" at the end
	taxa = taxa.replace(', Life-', '');
	// convert to array
	taxa = taxa.split(', ');
	// get rid of both -Genus and /Plantae
	taxa = taxa.map(function(str) {
		return str.replace(/[-\/].*?$/, '');
	});
	return taxa;
}

export function deleteAllStubs(wikicode) {
	return wikicode.replace(/\{\{[^\}]*\-stub\}\}\n/gi, '');
}

export function isSandbox(titleWithNamespaceAndUnderscores) {
	return titleWithNamespaceAndUnderscores.match(/sandbox/i) ? true : false;
}

export async function getPageCreationDate(title) {
	let api = new mw.Api();
	let response = await api.get( {
		"action": "query",
		"format": "json",
		"prop": "revisions",
		"titles": title,
		"rvlimit": "1",
		"rvdir": "newer"
	} );
	let page = getFirstValueInObject(response.query.pages);
	let pageCreatedDate = page.revisions[0].timestamp; // 2015-09-30T17:28:35Z
	pageCreatedDate = pageCreatedDate.slice(0, 10); // keep the date, chop off the time
	return pageCreatedDate;
}

export function getFirstValueInObject(obj) {
	return obj[Object.keys(obj)[0]];
}

// TODO: unit test failing in CI but not locally. this function isn't used anymore though. commenting out unit test.
export function getDateOneYearAgo(today) {
	// https://stackoverflow.com/a/33070481/3480193
    var year = today.getFullYear();
    var month = today.getMonth();
    var day = today.getDate();
    var lastYear = new Date(year - 1, month, day + 1);

	// https://stackoverflow.com/a/29774197/3480193
	return lastYear.toISOString().split('T')[0];
}

export function fixSpeciesParameterThatContainsGenus(wikicode2) {
	let hasSpeciesBox = getSpeciesBox(wikicode2);
	let hasGenusParameter = wikicode2.match(/\|\s*genus\s*=\s*([A-Za-z \(\)]+?)\s*[<\n|}]/);
	let hasSpeciesParameter = wikicode2.match(/\|\s*species\s*=\s*([A-Za-z \(\)]+?)\s*[<\n|}]/);
	if ( hasSpeciesBox && hasGenusParameter && hasSpeciesParameter ) {
		let genusParameter = hasGenusParameter[1];
		let speciesParameter = hasSpeciesParameter[1];
		if ( genusParameter === speciesParameter.split(' ')[0] ) {
			wikicode2 = wikicode2.replace(/(\|\s*species\s*=\s*)([A-Za-z\(\)]+ )/, '$1');
		}
	}
	return wikicode2;
}

export function getSpeciesBox(wikicode2) {
	return wikicode2.match(/\{\{(?:Speciesbox|Species[ _]box)/i);
}

export function removeItalicTitleIfSpeciesBoxPresent(wikicode2) {
	let hasSpeciesBox = getSpeciesBox(wikicode2);
	if ( hasSpeciesBox ) {
		// remove {{Italic title}}
		wikicode2 = wikicode2.replace(/\{\{(?:Italic[ _]?title)[^}]*\}\}\n?/gsi, '');
	}
	return wikicode2;
}

export function replaceReferencesWithReflist(wikicode2) {
	let referencesTag = wikicode2.match(/<references ?\/>/i);
	if ( referencesTag ) {
		wikicode2 = wikicode2.replace(/<references ?\/>/i, '{{Reflist}}');
	}
	return wikicode2;
}

export function deleteFromArray(needle, haystack) {
	const index = haystack.indexOf(needle);
	if (index > -1) {
		haystack.splice(index, 1);
	}
	return haystack;
}

/** returns null if none, or ['Category:test1', 'Category:test2', etc.] if found */
export function getListOfCategoriesFromWikitext(wikicode2) {
	let allCategoriesRegEx = new RegExp(`(?<=\\[\\[:?)Category:.+?(?=\\]|\\|)`, 'gi');
	return wikicode2.match(allCategoriesRegEx);
}

export function suggestShortDescriptionFromWikicode(wikicode2, disallowedList = []) {
	// delete quotation marks
	wikicode2 = wikicode2.replace(/"/g, '');
	// delete brackets, including the first part of the pipe
	// TODO: handle nested brackets (for example, a wikilink as an image caption)
	wikicode2 = wikicode2.replace(/\[\[(?:[^\|\]]+\|)?([^\]]+)\]\]/g, '$1');
	// delete templates
	// TODO: handle nested templates
	wikicode2 = wikicode2.replace(/\{\{.*?\}\}/gs, '');
	// delete <ref></ref>
	wikicode2 = wikicode2.replace(/<ref[^<]+<\/ref>/gis, '');
	// delete <ref />
	wikicode2 = wikicode2.replace(/<ref[^\/]+\/>/gi, '');
	// delete <!-- comments -->
	wikicode2 = wikicode2.replace(/<!--.*?-->/gs, '');

	// exit if "is a species of" not found
	let hasSpeciesPhrase = wikicode2.match(/ is a \[?\[?species\]?\]? of /i);
	if ( ! hasSpeciesPhrase ) return '';

	// chop everything before and including "is a species of "
	wikicode2 = wikicode2.replace(/^.*?is a \[?\[?species\]?\]? of /is, '');
	// delete bold and italic formatting, without deleting their encasing word
	wikicode2 = wikicode2.replace(/'{2,}/g, '');
	// delete anything after punctuation, including the punctuation. except punctuation that occurs mid-sentence, such as dash
	wikicode2 = wikicode2.replace(/[~!@#$%^&*()_+`=\\\]\[{}|;':",./<>?].*$/s, '');
	// chop certain adjectives that just make the short description longer and aren't that helpful
	wikicode2 = wikicode2.replace(/(?:nocturnal|strepsirrhine|marine|small to medium)/gi, '');
	// fix double spacing issues caused by above replace
	wikicode2 = wikicode2.replace(/ {2,}/gi, ' ');
	// delete anything after certain conjunctions
	wikicode2 = wikicode2.replace(/ (?:And|Belonging|Commonly|Described|Discovered|Endemic|Found|Known|Native|Observed|Occurring|That|which).*$/is, '');
	// delete anything after the first encountered preposition, including the preposition
	wikicode2 = wikicode2.replace(/ (?:Aboard|About|Above|According to|Across|After|Against|Ago|Ahead|Along|Along with|Alongside|Amid|Among|Anti|Apart from|Around|As|As for|As per|As to|As well as|Aside from|Astride|At|Atop|Away|Bar|Barring|Because of|Before|Behind|Below|Beneath|Beside|Besides|Between|Beyond|But|By|Circa|Close to|Concerning|Considering|Contrary to|Counting|Depending on|Despite|Down|Due to|During|Except|Except for|Excepting|Excluding|Far|Following|For|Forward of|From|Further to|Given|Gone|In|Including|Inside|Instead of|Into|Less|Like|Minus|Near|Near to|Next to|Notwithstanding|Of|On|Opposite|Other than|Out|Over|Owing to|Past|Pending|Per|Plus|Prior to|Pro|Re|Regarding|Regardless of|Round|Save|Save for|Saving|Since|Than|Thanks to|Through|Throughout|till|To|Together with|Toward|towards|Under|Underneath|Unlike|Until|Up|Versus|Via|With|Within|Worth)[.,!? ].*$/is, '');
	// trim
	wikicode2 = wikicode2.trim();

	// don't just regurgitate a taxa
	for ( let disallowed of disallowedList ) {
		let regEx = new RegExp(regExEscape(disallowed), 'i');
		if ( disallowed && wikicode2.match(regEx) ) {
			return '';
		}
	}

	// Chop all words except the last word, which should be a noun
	// Species of western saltwater crocodile -> Species of crocodile
	//let firstWords = getFirstWords(wikicode2);
	let lastWord = getLastWord(wikicode2);
	lastWord = new Inflect().singularize(lastWord);
	wikicode2 = /*firstWords +*/ lastWord;

	// keep short description 40 characters or less, per WP:SDSHORT
	if ( wikicode2.length + 11 > 40 ) return '';

	// return {{Short description|Species of ...}}
	if ( wikicode2 ) {
		return `{{Short description|Species of ${wikicode2}}}`;
	}
	return '';
}

/** In a string such as "1 2 3 4", return "1 2 3 " */
export function getFirstWords(wikicode2) {
	let matches = wikicode2.match(/^(.*?)([^ ]*)$/m);
	return matches[1];
}

/** In a string such as "1 2 3 4", return "4" */
export function getLastWord(wikicode2) {
	let matches = wikicode2.match(/^(.*?)([^ ]*)$/m);
	return matches[2];
}

/** convert =TitleHeading= to ==H2Heading== */
export function convertH1ToH2(wikicode) {
	return wikicode.replace(/^= ?([^=]*?) ?=$/gm, '== $1 ==');
}

/** no more than 2 newlines (1 blank line) in a row. except stubs, which get 3 newlines (2 blank lines) */
export function deleteMoreThanTwoEntersInARow(wikicode) {
	// fix \n[space]\n. If not fixed, this will mess up patterns below.
	wikicode = wikicode.replace(/\n +\n/g, '\n\n');

	// delete extra enters
	wikicode = wikicode.replace(/\n{3,}/gm, "\n\n");
	wikicode = wikicode.replace(/\n{2}(\{\{[^}]*stub\}\})/gi, '\n\n\n$1');
	return wikicode;
}

export function deleteMoreThanTwoEntersInARowBeforeReferences(wikicode, mopf) {
	let referencesSectionPosition = mopf.getSectionPosition(wikicode, 'notesAndReferences');
	let topHalf = wikicode.slice(0, referencesSectionPosition);
	let bottomHalf = wikicode.slice(referencesSectionPosition);
	topHalf = topHalf.replace(/\n{3,}/gm, "\n\n");
	wikicode = topHalf + bottomHalf;
	return wikicode;
}

export function fixWhitespaceInCategories(wikicode) {
	wikicode = wikicode.replace(/(\[\[:?Category:)\s*([^\]\|]+?)\s*(\]\])/gi, "$1$2$3");
	wikicode = wikicode.replace(/(\[\[:?Category:)\s*([^\]\|]+?)\s*(\|)\s*([^\]\|]+?)\s*(\]\])/gi, "$1$2$3$4$5");
	return wikicode;
}

export function removeAuthorityControlIfTaxonbarPresent(wikicode2) {
	let hasTaxonBar = wikicode2.match(/\{\{(?:Taxonbar|Taxon-bar|Taxobar|TaxonIDs|Taxon[ _]identifiers|Taxon[ _]bar)/i);
	if ( hasTaxonBar ) {
		wikicode2 = wikicode2.replace(/\{\{(?:Authority[ _]control|Normdaten|Authoritycontrol|External[ _]identifiers|Autorité|Control[ _]de[ _]autoridades|전거[ _]통제|Normativna[ _]kontrola)\}\}\n/gi, '');
	}
	return wikicode2;
}

export function removeEmptyDefaultSort(wikicode2) {
	wikicode2 = wikicode2.replace(/\{\{(?:DEFAULTSORT|Default[ _]sort|SORTIERUNG)[:\|]?\s*\}\}\n?/gi, '');
	return wikicode2;
}

export function removeDefaultSortIdenticalToTitle(wikicode2, titleNoNamespaceNoUnderscores) {
	let titleRegExEscaped = regExEscape(titleNoNamespaceNoUnderscores);
	let regex = new RegExp(`\\{\\{(?:DEFAULTSORT|Default[ _]sort|SORTIERUNG)[:\\|]${titleRegExEscaped}\\}\\}\\n?`, 'gi');
	wikicode2 = wikicode2.replace(regex, '');
	return wikicode2;
}

export function addSafelistedStubs(newStubs, wikicode2) {
	let stubSafelist = [
		// Stubs that do not 1:1 correspond with taxonomy, but that should not be deleted
		// SENTENCE CASE AND DASHES PLEASE, usually singular
		'Australia-asterid',
		'Australia-eudicot',
		'Crab',
		'Ediacaran',
		'Edicarian',
		'Fish',
		'Fruit',
		'Fruit-tree',
		'Green algae', // polyphyletic
		'Lichen',
		'Lizard', // all lizards are in squamata, but not all of squamata is lizards
		'NewZealand-plant',
		'Parasite',
		'Parasitic animal', // space instead of dash is intentional
		'Samoa',
		'Solomons',
		'Squat-lobster',
		'Tree',
	];
	for ( let stub of stubSafelist ) {
		let regexString = regExEscape(stub);
		let isPresent = wikicode2.match(new RegExp('\\{\\{' + regexString + '-stub\\}\\}', 'i'));
		if ( isPresent && ! newStubs.includes('{{' + stub + '-stub}}') ) {
			newStubs.push('{{' + stub + '-stub}}');
		}
	}
	return newStubs;
}

export function getTitleNoNamespace(title) {
	return mw.Title.newFromText(title).getName(); // TODO: bug when the title contains a period, everything after the period is chopped, e.g. 
}

export function isSubSpecies(title, wikicode2) {
	let titleContainsSubSpecies = title.includes('subsp.');
	let wikicodeContainsInfraSpeciesBox = wikicode2.match(/\{\{Infraspeciesbox/i) !== null;
	return titleContainsSubSpecies || wikicodeContainsInfraSpeciesBox;
}

export function enableCategories(wikicode2, isDraft) {
	if ( ! isDraft ) {
		wikicode2 = wikicode2.replace(/\[\[:Category:/gi, '[[Category:');
	}
	return wikicode2;
}

export function disableCategories(wikicode2, isDraft) {
	if ( isDraft ) {
		wikicode2 = wikicode2.replace(/\[\[Category:/gi, '[[:Category:');
	}
	return wikicode2;
}

export function deleteGenusCategoryWithSpaceDisambiguator(wikicode2, genus, draftCategoryColon) {
	let regEx = new RegExp(`\\[\\[${draftCategoryColon}Category:` + regExEscape(genus) + `\\| \\]\\]\\n`, 'i');
	return wikicode2.replace(regEx, '');
}

export function removeDraftTagIfNotDraftspace(wikicode2, isDraft) {
	if ( isDraft ) {
		return wikicode2;
	}
	return wikicode2.replace(/\{\{Draft[^\}]*\}\}/gi, '');
}

export function isDisambiguationPage(wikicode2) {
	return Boolean(wikicode2.match(/disambiguation(?:\}\}|\|)/i));
}

export function isRedirectPage(wikicode2) {
	return Boolean(wikicode2.match(/^[\n ]*#REDIRECT \[\[/is));
}

export function deleteStubTemplateIfAnyOtherStubsPresent(wikicode2) {
	let hasNonGenericStub = wikicode2.match(/\{\{.+\-stub\}\}/gi);
	let hasGenericStub = wikicode2.match(/\{\{stub\}\}/gi);
	if ( hasNonGenericStub && hasGenericStub ) {
		wikicode2 = wikicode2.replace(/\{\{stub\}\}\n?/gi, '');
	}
	return wikicode2;
}

export function getSpeciesboxTaxonAndParentParameters(wikicode2) {
	let hasTaxonParameter = wikicode2.match(/\|\s*taxon\s*=\s*([A-Z][a-z]+) ([a-z]+)\s*[<\n|}]/);
	if ( hasTaxonParameter )  {
		let species = hasTaxonParameter[2];
		let hasParentParameter = wikicode2.match(/\|\s*parent\s*=\s*([A-Za-z \(\)]+?)\s*[<\n|}]/);
		if ( hasParentParameter && species ) {
			let taxonomyTemplateGenus = hasParentParameter[1];
			let genusForAlert = taxonomyTemplateGenus;
			return {
				'taxonomyTemplateGenus': taxonomyTemplateGenus,
				'genusForAlert': genusForAlert,
				'species': species,
			};
		}
	}
	return null;
}