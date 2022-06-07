import * as functions from "../modules/functions.js";

describe('countWords(wikicode)', () => {
	test('simple', () => {
		let wikicode = `Two words.`;
		let output = 2;
		expect(functions.countWords(wikicode)).toBe(output);
	});

	test(`Don't count HTML comments.`, () => {
		let wikicode = `Two words.<!--More words.-->`;
		let output = 2;
		expect(functions.countWords(wikicode)).toBe(output);
	});

	test(`Count contents of {{Blockquote}} template`, () => {
		let wikicode = `Two words. {{Blockquote|More words.}}`;
		let output = 4;
		expect(functions.countWords(wikicode)).toBe(output);
	});
});

describe('getPagesToCheck(taxa, listOfNonLatinSpeciesCategories)', () => {
	test('simple', () => {
		let taxa = [
			'Calligonum',
			'Polygonoideae',
			'Polygonaceae',
			'Caryophyllales',
			'Superasterids',
			'Core eudicots',
			'Eudicots',
			'Angiosperms',
			'Spermatophytes',
			'Tracheophytes',
			'Polysporangiophytes',
			'Embryophytes',
			'Streptophyta',
			'Plantae',
			'Archaeplastida',
			'Diaphoretickes',
			'Eukaryota',
		];
		let listOfNonLatinSpeciesCategories = {};
		let output = [
			'Template:Calligonum-stub',
			'Category:Calligonum',
			'Category:Calligonum (genus)',
			'Template:Polygonoideae-stub',
			'Category:Polygonoideae',
			'Template:Polygonaceae-stub',
			'Category:Polygonaceae',
			'Template:Caryophyllales-stub',
			'Category:Caryophyllales',
			'Template:Superasterids-stub',
			'Category:Superasterids',
			'Template:Core eudicots-stub',
			'Category:Core eudicots',
			'Template:Eudicots-stub',
			'Category:Eudicots',
			'Template:Angiosperms-stub',
			'Category:Angiosperms',
			'Template:Spermatophytes-stub',
			'Category:Spermatophytes',
			'Template:Tracheophytes-stub',
			'Category:Tracheophytes',
			'Template:Polysporangiophytes-stub',
			'Category:Polysporangiophytes',
			'Template:Embryophytes-stub',
			'Category:Embryophytes',
			'Template:Streptophyta-stub',
			'Category:Streptophyta',
			'Template:Plant-stub',
			'Category:Plantae',
			'Template:Archaeplastida-stub',
			'Category:Archaeplastida',
			'Template:Diaphoretickes-stub',
			'Category:Diaphoretickes',
			'Template:Eukaryote-stub',
			'Category:Eukaryota',
		];
		expect(functions.getPagesToCheck(taxa, listOfNonLatinSpeciesCategories)).toStrictEqual(output);
	});

	test('detect non-latin categories when deleting categories', () => {
		let taxa = [
			'Calligonum',
			'Amazona',
			'Polygonaceae',
		];
		let listOfNonLatinSpeciesCategories = {
			'Amazona': 'Amazon parrots',
		};
		let output = [
			'Template:Calligonum-stub',
			'Category:Calligonum',
			'Category:Calligonum (genus)',
			'Template:Amazona-stub',
			'Category:Amazon parrots',
			'Template:Polygonaceae-stub',
			'Category:Polygonaceae',
		];
		expect(functions.getPagesToCheck(taxa, listOfNonLatinSpeciesCategories)).toStrictEqual(output);
	});
});

describe(`deleteAllStubs(wikicode)`, () => {
	test('1 stub', () => {
		let wikicode = '{{Rayfinned-fish-stub}}\n';
		let output = '';
		expect(functions.deleteAllStubs(wikicode)).toBe(output);
	});

	test('2 stubs', () => {
		let wikicode = '{{Rayfinned-fish-stub}}\n{{Fish-stub}}\n';
		let output = '';
		expect(functions.deleteAllStubs(wikicode)).toBe(output);
	});

	test('delete {{-stub}}', () => {
		let wikicode = '{{-stub}}\n';
		let output = '';
		expect(functions.deleteAllStubs(wikicode)).toBe(output);
	});

	test('handle {{Reflist}} on same line', () => {
		let wikicode = '{{Reflist}}{{Carabidae-stub}}\n';
		let output = '{{Reflist}}';
		expect(functions.deleteAllStubs(wikicode)).toBe(output);
	});
});

describe(`isSandbox(titleWithNamespaceAndUnderscores)`, () => {
	test('detect sandbox', () => {
		let titleWithNamespaceAndUnderscores = 'User:Novem Linguae/sandbox';
		let output = true;
		expect(functions.isSandbox(titleWithNamespaceAndUnderscores)).toBe(output);
	});

	test('detect sandbox2', () => {
		let titleWithNamespaceAndUnderscores = 'User:Novem Linguae/sandbox2';
		let output = true;
		expect(functions.isSandbox(titleWithNamespaceAndUnderscores)).toBe(output);
	});
	
	test('return false if outside sandbox', () => {
		let titleWithNamespaceAndUnderscores = 'User:Novem Linguae';
		let output = false;
		expect(functions.isSandbox(titleWithNamespaceAndUnderscores)).toBe(output);
	});
});

describe(`getDateOneYearAgo(today)`, () => {
	test('today 2022-02-01 -> 2021-02-01', () => {
		let today = new Date('2022-02-01');
		let output = '2021-02-01';
		expect(functions.getDateOneYearAgo(today)).toBe(output);
	});
});

describe(`fixSpeciesParameterThatContainsGenus(wikicode2)`, () => {
	test(`Don't change 1`, () => {
		let wikicode2 =
`{{Speciesbox
| genus = Homo
| species = sapien
}}`;
		let output =
`{{Speciesbox
| genus = Homo
| species = sapien
}}`;
		expect(functions.fixSpeciesParameterThatContainsGenus(wikicode2)).toBe(output);
	});

	test(`Don't change 2`, () => {
		let wikicode2 =
`No speciesbox present. Just random text.
| genus = Homo
| species = Homo sapien`;
		let output =
`No speciesbox present. Just random text.
| genus = Homo
| species = Homo sapien`;
		expect(functions.fixSpeciesParameterThatContainsGenus(wikicode2)).toBe(output);
	});

	test(`Fix duplicate`, () => {
		let wikicode2 =
`{{Speciesbox
| genus = Homo
| species = Homo sapien
}}`;
		let output =
`{{Speciesbox
| genus = Homo
| species = sapien
}}`;
		expect(functions.fixSpeciesParameterThatContainsGenus(wikicode2)).toBe(output);
	});
});

describe(`removeItalicTitleIfSpeciesBoxPresent(wikicode2)`, () => {
	test(`Don't change`, () => {
		let wikicode2 = `{{Italic title}}`;
		let output = `{{Italic title}}`;
		expect(functions.removeItalicTitleIfSpeciesBoxPresent(wikicode2)).toBe(output);
	});

	test(`Remove {{Italic title}}`, () => {
		let wikicode2 =
`{{Italic title}}
{{Speciesbox
| genus = Homo
| species = sapien
}}`;
		let output =
`{{Speciesbox
| genus = Homo
| species = sapien
}}`;
		expect(functions.removeItalicTitleIfSpeciesBoxPresent(wikicode2)).toBe(output);
	});

	test(`Remove {{Italictitle}}`, () => {
		let wikicode2 =
`{{Italictitle}}
{{Speciesbox
| genus = Homo
| species = sapien
}}`;
		let output =
`{{Speciesbox
| genus = Homo
| species = sapien
}}`;
		expect(functions.removeItalicTitleIfSpeciesBoxPresent(wikicode2)).toBe(output);
	});
});

describe(`getSpeciesBox(wikicode2)`, () => {
	test(`No speciesbox`, () => {
		let wikicode2 = `Test`;
		expect(functions.getSpeciesBox(wikicode2)).toBeFalsy();
	});

	test(`Yes speciesbox`, () => {
		let wikicode2 = `Test {{Speciesbox}}`;
		expect(functions.getSpeciesBox(wikicode2)).toBeTruthy();
	});
});

describe(`replaceReferencesWithReflist(wikicode2)`, () => {
	test(`No <references> or {{Reflist}}`, () => {
		let wikicode2 = `Test`;
		let output = `Test`;
		expect(functions.replaceReferencesWithReflist(wikicode2)).toBe(output);
	});

	// don't need to test <references> (no slash), it doesn't render

	test(`<references/>`, () => {
		let wikicode2 = `Test\n\n==References==\n<references/>`;
		let output = `Test\n\n==References==\n{{Reflist}}`;
		expect(functions.replaceReferencesWithReflist(wikicode2)).toBe(output);
	});

	test(`<references />`, () => {
		let wikicode2 = `Test\n\n==References==\n<references />`;
		let output = `Test\n\n==References==\n{{Reflist}}`;
		expect(functions.replaceReferencesWithReflist(wikicode2)).toBe(output);
	});
});

describe(`getListOfCategoriesFromWikitext(wikicode2)`, () => {
	test(`No categories`, () => {
		let wikicode2 = `Test`;
		let output = null;
		expect(functions.getListOfCategoriesFromWikitext(wikicode2)).toBe(output);
	});

	test(`1 category`, () => {
		let wikicode2 = `Test [[Category:Test2]] Test3`;
		let output = ['Category:Test2'];
		expect(functions.getListOfCategoriesFromWikitext(wikicode2)).toStrictEqual(output);
	});

	test(`2 categories`, () => {
		let wikicode2 = `Test [[Category:Test2]] [[Category:Test3]] Test4`;
		let output = ['Category:Test2', 'Category:Test3'];
		expect(functions.getListOfCategoriesFromWikitext(wikicode2)).toStrictEqual(output);
	});

	test(`1 draft category`, () => {
		let wikicode2 = `Test [[:Category:Test2]] Test3`;
		let output = ['Category:Test2'];
		expect(functions.getListOfCategoriesFromWikitext(wikicode2)).toStrictEqual(output);
	});
});

describe(`arraysHaveSameValuesCaseInsensitive(array1, array2)`, () => {
	test(`1 null input`, () => {
		let array1 = ['A', 'B'];
		let array2 = null;
		let output = false;
		expect(functions.arraysHaveSameValuesCaseInsensitive(array1, array2)).toBe(output);
	});

	test(`2 null inputs`, () => {
		let array1 = null;
		let array2 = null;
		let output = true;
		expect(functions.arraysHaveSameValuesCaseInsensitive(array1, array2)).toBe(output);
	});

	test(`identical arrays`, () => {
		let array1 = ['A', 'B'];
		let array2 = ['A', 'B'];
		let output = true;
		expect(functions.arraysHaveSameValuesCaseInsensitive(array1, array2)).toStrictEqual(output);
	});

	test(`case insensitive`, () => {
		let array1 = ['A', 'B'];
		let array2 = ['A', 'b'];
		let output = true;
		expect(functions.arraysHaveSameValuesCaseInsensitive(array1, array2)).toStrictEqual(output);
	});

	test(`scrambled order`, () => {
		let array1 = ['A', 'B'];
		let array2 = ['B', 'A'];
		let output = true;
		expect(functions.arraysHaveSameValuesCaseInsensitive(array1, array2)).toStrictEqual(output);
	});

	test(`not identical`, () => {
		let array1 = ['A', 'B'];
		let array2 = ['A', 'B', 'C'];
		let output = false;
		expect(functions.arraysHaveSameValuesCaseInsensitive(array1, array2)).toStrictEqual(output);
	});
});

describe(`suggestShortDescriptionFromWikicode(wikicode2)`, () => {
	test(`"is a species of" not present`, () => {
		let wikicode2 = `Test`;
		let output = '';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Handle non-piped wikilink. Handle prepositions such as "in"`, () => {
		let wikicode2 = `'''''Dictyonema lawreyi''''' is a species of [[basidiolichen]] in the family [[Hygrophoraceae]].`;
		let output = '{{Short description|Species of basidiolichen}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Handle piped wikilink. Handle conjunctions such as "that"`, () => {
		let wikicode2 = `'''''Cyperus breedlovei''''' is a species of [[Cyperus|sedge]] that is native to parts of [[Mexico]].`;
		let output = '{{Short description|Species of sedge}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(``, () => {
		let wikicode2 = `'''''Liolaemus victormoralesii''''' is a [[species]] of [[lizard]] in the [[Family (biology)|family]] [[Iguanidae]] or the family [[Liolaemidae]].`;
		let output = '{{Short description|Species of lizard}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(``, () => {
		let wikicode2 = `'''''Hong glorious''''' is a species of [[ladybird beetle]] in the genus [[Hong (beetle)|''Hong'']].`;
		let output = '{{Short description|Species of beetle}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Return blank if over 40 characters`, () => {
		let wikicode2 = `'''''Pelatantheria cristata'''''<small> (Ridl.) Ridl. <ref>J. Linn. Soc., Bot. 32: 373 (1896).</ref></small> is a species of epiphytic or lithophytic [[orchid]] occurring in [[Indonesia]], [[Thailand]] and [[Malaysia]].`;
		let output = '{{Short description|Species of orchid}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(``, () => {
		let wikicode2 = `'''''Hisonotus francirochai'''''<ref>{{Cite web|title=ITIS - Report: Hisonotus francirochai|url=https://www.itis.gov/servlet/SingleRpt/SingleRpt?search_topic=TSN&search_value=679919#null|access-date=2022-02-08|website=www.itis.gov}}</ref> is a [[species]] of [[catfish]] in the family [[Loricariidae]].`;
		let output = '{{Short description|Species of catfish}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(``, () => {
		let wikicode2 = `'''Ognev's serotine''' (''Eptesicus ognevi'') is a [[species]] of [[Vespertilionidae|vesper bat]] found in western and central [[Asia]].`;
		let output = '{{Short description|Species of bat}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Remove training "s"`, () => {
		let wikicode2 = `'''''Carthamus caeruleus''''' is a species of plants in the family [[Asteraceae]].`;
		let output = '{{Short description|Species of plant}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(``, () => {
		let wikicode2 = `'''''Eperua falcata''''', the '''bootlace tree''', is a species of flowering plant in the family [[Fabaceae]], native to northern South America.`;
		let output = '{{Short description|Species of plant}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Handle word with a dash`, () => {
		let wikicode2 = `'''''Megalobulimus dryades''''' is a [[species]] of air-breathing [[land snail]], a [[terrestrial mollusc|terrestrial]] [[gastropod]] [[mollusc]] in the family [[Strophocheilidae]].`;
		let output = '{{Short description|Species of snail}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Don't remove last "s" if double "ss"`, () => {
		let wikicode2 = `'''''Carex pairae''''' is a species of perennial grass in the family [[Cyperaceae]] (sedges). They have a self-supporting growth form and simple, broad leaves.`;
		let output = '{{Short description|Species of grass}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(``, () => {
		let wikicode2 = `'''''Lechenaultia hirsuta''''', commonly known as '''hairy leschenaultia''',<ref name=FloraBase>{{FloraBase|name=''Lechenaultia hirsuta''|id=7577}}</ref> is a species of flowering plant in the family [[Goodeniaceae]] and is [[endemic]] to the west of Western Australia.`;
		let output = '{{Short description|Species of plant}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(``, () => {
		let wikicode2 = `'''''Hisonotus francirochai'''''<ref>{{Cite web|title=ITIS - Report: Hisonotus francirochai|url=https://www.itis.gov/servlet/SingleRpt/SingleRpt?search_topic=TSN&search_value=679919#null|access-date=2022-02-08|website=www.itis.gov}}</ref> is a [[species]] of [[catfish]] in the family [[Loricariidae]].`;
		let output = '{{Short description|Species of catfish}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Whole article / multi-line`, () => {
		let wikicode2 =
`{{Speciesbox
| taxon = Hisonotus francirochai
| authority = (Ihering, 1928)
| synonyms = {{Specieslist
 |Microlepidogaster francirochai|
 |Otocinclus francirochai|
 }}
}}

'''''Hisonotus francirochai'''''<ref>{{Cite web|title=ITIS - Report: Hisonotus francirochai|url=https://www.itis.gov/servlet/SingleRpt/SingleRpt?search_topic=TSN&search_value=679919#null|access-date=2022-02-08|website=www.itis.gov}}</ref> is a [[species]] of [[catfish]] in the family [[Loricariidae]]. It is native to [[South America]], where it occurs in the [[Grande River (Uruguay)|Grande River]] basin. The species reaches 3.6 cm (1.4 inches) SL.<ref>{{Cite web|date=2021|editor-last=Froese|editor-first=Rainer|editor2-last=Pauly|editor2-first=Daniel|title=<i>Hisonotus francirochai</i>|url=https://www.fishbase.se/summary/50442|url-status=live|website=FishBase}}</ref>

== References ==
{{reflist}}

{{Taxonbar|from=Q5547982}}

[[Category:Loricariidae]]
[[Category:Fish described in 1928]]

{{Loricariidae-stub}}
`;
		let output = '{{Short description|Species of catfish}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`don't chop "s" on fungus`, () => {
		let wikicode2 = `'''''Anixia wallrothii''''' is a species of fungus.`;
		let output = '{{Short description|Species of fungus}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`handle conjunction "belonging"`, () => {
		let wikicode2 = `'''''Anixia wallrothii''''' is a species of fungus belonging to the ''[[Anixia]]'' genus.`;
		let output = '{{Short description|Species of fungus}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`handle conjunction "endemic"`, () => {
		let wikicode2 = `'''''Ammoglanis obliquus''''' is a [[species]] of [[pencil catfish]] [[endemism|endemic]] to the Rio Preto da Eva drainage in the central Brazilian Amazon.`;
		let output = '{{Short description|Species of catfish}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`handle <ref> in the middle of "is a species of". Handle <ref name="test">abc</ref>`, () => {
		let wikicode2 = `'''''Gynacantha chaplini''''' is a [[species]]<ref name="inaturalist-Gynacantha chaplini">{{cite web |title=Gynacantha chaplini |url=https://www.inaturalist.org/taxa/1304630-Gynacantha-chaplini |website=iNaturalist |access-date=2021-12-10 |language=en-US}}</ref> of dragonfly described from North-eastern [[Bangladesh]].`;
		let output = '{{Short description|Species of dragonfly}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`handle quotation marks`, () => {
		let wikicode2 = `'''''Pulchrana fantastica''''', also known as the '''splendid stream frog''', is a [[species]] of "[[true frog]]", family Ranidae.`;
		let output = '{{Short description|Species of frog}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Handle words that start with prepositions but that should be in the short description`, () => {
		let wikicode2 = `'''''Caridina typus,''''' also known as the "Typical Caridina" or the "Australian Amano Shrimp", is a [[species]] of [[amphidromous]] [[atyid shrimp]].`;
		let output = '{{Short description|Species of shrimp}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Delete non-useful adjectives such as "noctural", to make description shorter`, () => {
		let wikicode2 = `The '''West African potto''' (''Perodictitus potto'') is a species of nocturnal [[strepsirrhine]] [[primate]].`;
		let output = '{{Short description|Species of primate}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Should be singular, e.g. species of fungus`, () => {
		let wikicode2 = `'''''Mycena epipterygia''''' is a species of fungi in the family [[Mycenaceae]] of [[mushroom]]s commonly found in Europe.`;
		let output = '{{Short description|Species of fungus}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Should be singular, e.g. species of bacterium`, () => {
		let wikicode2 = `'''''Mycena epipterygia''''' is a species of bacteria in the family [[Mycenaceae]] of [[mushroom]]s commonly found in Europe.`;
		let output = '{{Short description|Species of bacterium}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Handle -es`, () => {
		let wikicode2 = `'''''Copionodon lianae''''' is a species of [[catfish]]es ([[order (biology)|order]] Siluriformes) of the [[family (biology)|family]] [[Trichomycteridae]].`;
		let output = '{{Short description|Species of catfish}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Handle -es edge case "centipedes"`, () => {
		let wikicode2 = `'''''Geophilus proximus''''' is a [[species]] of [[Geophilomorpha|soil centipede]]s in the [[family (biology)|family]] [[Geophilidae]] found in the northern part of the [[palearctic realm|Palearctic]] and widespread across the entire [[Baltic states|Baltic]] basin, though it reaches as far as the [[Arctic Circle]] and has been introduced through human agency to northern, central, and eastern parts of [[Kazakhstan]].`;
		let output = '{{Short description|Species of centipede}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Handle -es edge case "bivalves"`, () => {
		let wikicode2 = `'''''Bankia carinata''''' is a species of [[bivalves]] belonging to the family [[Teredinidae]].`;
		let output = '{{Short description|Species of bivalve}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Handle ''italics''`, () => {
		let wikicode2 = `'''''Larinus sturnus''''' is a species of ''cylindrical weevils'' belonging to the family [[Curculionidae]], subfamily [[Lixinae]].`;
		let output = '{{Short description|Species of weevil}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2)).toBe(output);
	});

	test(`Don't just regurgitate the genus`, () => {
		let wikicode2 = `'''''Bankia carinata''''' is a species of [[bankia]] belonging to the family [[Teredinidae]].`;
		let taxa = ['Test', 'Bankia', 'Test2'];
		let output = '';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2, taxa)).toBe(output);
	});

	test(`Handle adjective clauses with prepositions in them, e.g. small to medium`, () => {
		let wikicode2 = `'''''Histioteuthis meleagroteuthis''''' is a species of small to medium squids that have a dark, wine red skin pigment.`;
		let taxa = ['Test', 'Histioteuthis', 'Test2'];
		let output = '{{Short description|Species of squid}}';
		expect(functions.suggestShortDescriptionFromWikicode(wikicode2, taxa)).toBe(output);
	});
});

describe(`convertH1ToH2(wikicode2)`, () => {
	test(`Don't change`, () => {
		let wikicode2 = `== Heading ==`;
		let output = '== Heading ==';
		expect(functions.convertH1ToH2(wikicode2)).toBe(output);
	});

	test(`Change`, () => {
		let wikicode2 = `= Heading =`;
		let output = '== Heading ==';
		expect(functions.convertH1ToH2(wikicode2)).toBe(output);
	});
});

describe('deleteMoreThanTwoEntersInARow(wikicode)', () => {
	test('Normal', () => {
		let wikicode =
`Test


Test`;
		let output =
`Test

Test`;
		expect(functions.deleteMoreThanTwoEntersInARow(wikicode)).toBe(output);
	});

	test('Change 3 enters to 2 enters in front of a stub tag', () => {
		let wikicode =
`Test



{{Stub}}`;
		let output =
`Test


{{Stub}}`;
		expect(functions.deleteMoreThanTwoEntersInARow(wikicode)).toBe(output);
	});

	test('Change 1 enters to 2 enters in front of a stub tag', () => {
		let wikicode =
`Test

{{Stub}}`;
		let output =
`Test


{{Stub}}`;
		expect(functions.deleteMoreThanTwoEntersInARow(wikicode)).toBe(output);
	});

	test(`Line with only a space shouldn't mess up deleting double enters`, () => {
		let wikicode =
`<ref name="lower" />
 


== Further reading ==
`;
		let output =
`<ref name="lower" />

== Further reading ==
`;
		expect(functions.deleteMoreThanTwoEntersInARow(wikicode)).toBe(output);
	});
});

describe(`fixWhitespaceInCategories(wikicode)`, () => {
	test(`[[Category:Test]]`, () => {
		let wikicode = `[[Category:Test]]`;
		let output = '[[Category:Test]]';
		expect(functions.fixWhitespaceInCategories(wikicode)).toBe(output);
	});

	test(`[[Category:Test test]]`, () => {
		let wikicode = `[[Category:Test test]]`;
		let output = '[[Category:Test test]]';
		expect(functions.fixWhitespaceInCategories(wikicode)).toBe(output);
	});

	test(`[[Category:Test test|Test]]`, () => {
		let wikicode = `[[Category:Test test|Test]]`;
		let output = '[[Category:Test test|Test]]';
		expect(functions.fixWhitespaceInCategories(wikicode)).toBe(output);
	});

	test(`[[Category:Test test|Test test]]`, () => {
		let wikicode = `[[Category:Test test|Test test]]`;
		let output = '[[Category:Test test|Test test]]';
		expect(functions.fixWhitespaceInCategories(wikicode)).toBe(output);
	});

	test(`[[Category: test test]]`, () => {
		let wikicode = `[[Category: test test]]`;
		let output = '[[Category:test test]]';
		expect(functions.fixWhitespaceInCategories(wikicode)).toBe(output);
	});

	test(`[[Category:Test test ]]`, () => {
		let wikicode = `[[Category:Test test ]]`;
		let output = '[[Category:Test test]]';
		expect(functions.fixWhitespaceInCategories(wikicode)).toBe(output);
	});

	test(`[[Category: Test test|Test test]]`, () => {
		let wikicode = `[[Category: Test test|Test test]]`;
		let output = '[[Category:Test test|Test test]]';
		expect(functions.fixWhitespaceInCategories(wikicode)).toBe(output);
	});

	test(`[[Category:Test test |Test test]]`, () => {
		let wikicode = `[[Category:Test test |Test test]]`;
		let output = '[[Category:Test test|Test test]]';
		expect(functions.fixWhitespaceInCategories(wikicode)).toBe(output);
	});

	test(`[[Category:Test test| Test test]]`, () => {
		let wikicode = `[[Category:Test test| Test test]]`;
		let output = '[[Category:Test test|Test test]]';
		expect(functions.fixWhitespaceInCategories(wikicode)).toBe(output);
	});

	test(`[[Category:Test test|Test test ]]`, () => {
		let wikicode = `[[Category:Test test|Test test ]]`;
		let output = '[[Category:Test test|Test test]]';
		expect(functions.fixWhitespaceInCategories(wikicode)).toBe(output);
	});
});

describe(`removeAuthorityControlIfTaxonbarPresent(wikicode2)`, () => {
	test(`Taxonbar, no authority control`, () => {
		let wikicode2 =
`{{Taxonbar}}
`;
		let output =
`{{Taxonbar}}
`;
		expect(functions.removeAuthorityControlIfTaxonbarPresent(wikicode2)).toBe(output);
	});

	test(`Taxonbar and authority control`, () => {
		let wikicode2 =
`{{Taxonbar}}
{{Authority control}}
`;
		let output =
`{{Taxonbar}}
`;
		expect(functions.removeAuthorityControlIfTaxonbarPresent(wikicode2)).toBe(output);
	});

	test(`Authority control, no taxonbar`, () => {
		let wikicode2 =
`{{Authority control}}
`;
		let output =
`{{Authority control}}
`;
		expect(functions.removeAuthorityControlIfTaxonbarPresent(wikicode2)).toBe(output);
	});
});

describe(`removeEmptyDefaultSort(wikicode2)`, () => {
	test(`Do nothing`, () => {
		let wikicode2 = `Test test`;
		let output = `Test test`;
		expect(functions.removeEmptyDefaultSort(wikicode2)).toBe(output);
	});

	test(`{{DEFAULTSORT|Not empty}}`, () => {
		let wikicode2 =
`{{DEFAULTSORT|Not empty}}
`;
		let output =
`{{DEFAULTSORT|Not empty}}
`;
		expect(functions.removeEmptyDefaultSort(wikicode2)).toBe(output);
	});
	test(`{{DEFAULTSORT}}`, () => {
		let wikicode2 =
`{{DEFAULTSORT}}
`;
		let output = ``;
		expect(functions.removeEmptyDefaultSort(wikicode2)).toBe(output);
	});

	test(`{{DEFAULTSORT:}}`, () => {
		let wikicode2 =
`{{DEFAULTSORT:}}
`;
		let output = ``;
		expect(functions.removeEmptyDefaultSort(wikicode2)).toBe(output);
	});

	test(`{{DEFAULTSORT|}}`, () => {
		let wikicode2 =
`{{DEFAULTSORT|}}
`;
		let output = ``;
		expect(functions.removeEmptyDefaultSort(wikicode2)).toBe(output);
	});
});

describe(`removeDefaultSortIdenticalToTitle(wikicode2, titleNoNamespaceNoUnderscores)`, () => {
	test(`Do nothing`, () => {
		let titleNoNamespaceNoUnderscores = 'Test_title!';
		let wikicode2 = `Test test`;
		let output = `Test test`;
		expect(functions.removeDefaultSortIdenticalToTitle(wikicode2, titleNoNamespaceNoUnderscores)).toBe(output);
	});

	test(`{{DEFAULTSORT|Not the title}}`, () => {
		let titleNoNamespaceNoUnderscores = 'Test_title!';
		let wikicode2 =
`{{DEFAULTSORT|Not the title}}
`;
		let output =
`{{DEFAULTSORT|Not the title}}
`;
		expect(functions.removeDefaultSortIdenticalToTitle(wikicode2, titleNoNamespaceNoUnderscores)).toBe(output);
	});

	test(`{{DEFAULTSORT|Test_title!}}`, () => {
		let titleNoNamespaceNoUnderscores = 'Test_title!';
		let wikicode2 =
`{{DEFAULTSORT|Test_title!}}
`;
		let output = ``;
		expect(functions.removeDefaultSortIdenticalToTitle(wikicode2, titleNoNamespaceNoUnderscores)).toBe(output);
	});

	test(`{{DEFAULTSORT:Test_title!}}`, () => {
		let titleNoNamespaceNoUnderscores = 'Test_title!';
		let wikicode2 =
`{{DEFAULTSORT:Test_title!}}
`;
		let output = ``;
		expect(functions.removeDefaultSortIdenticalToTitle(wikicode2, titleNoNamespaceNoUnderscores)).toBe(output);
	});
});

describe(`getFirstWords(wikicode2)`, () => {
	test(``, () => {
		let wikicode2 = `1 2 3 4`;
		let output = `1 2 3 `;
		expect(functions.getFirstWords(wikicode2)).toBe(output);
	});

	test(``, () => {
		let wikicode2 = `1`;
		let output = ``;
		expect(functions.getFirstWords(wikicode2)).toBe(output);
	});
});

describe(`getLastWord(wikicode2)`, () => {
	test(``, () => {
		let wikicode2 = `1 2 3 4`;
		let output = `4`;
		expect(functions.getLastWord(wikicode2)).toBe(output);
	});

	test(``, () => {
		let wikicode2 = `1`;
		let output = `1`;
		expect(functions.getLastWord(wikicode2)).toBe(output);
	});
});

describe(`addSafelistedStubs(newStubs, wikicode2)`, () => {
	test(`Handle 0 safelisted stubs present`, () => {
		let newStubs = ['{{Weevil-stub}}']; // suggested stub
		let wikicode2 = `\n`;
		let output = ['{{Weevil-stub}}'];
		expect(functions.addSafelistedStubs(newStubs, wikicode2)).toStrictEqual(output);
	});

	test(`Handle 1 safelisted stub present`, () => {
		let newStubs = ['{{Weevil-stub}}']; // suggested stub
		let wikicode2 = `{{Crab-stub}}\n`;
		let output = [
			'{{Weevil-stub}}',
			'{{Crab-stub}}',
		];
		expect(functions.addSafelistedStubs(newStubs, wikicode2)).toStrictEqual(output);
	});

	test(`Handle 2 safelisted stubs present`, () => {
		let newStubs = ['{{Weevil-stub}}']; // suggested stub
		let wikicode2 = `{{Crab-stub}}\n{{Fish-stub}}\n`;
		let output = [
			'{{Weevil-stub}}',
			'{{Crab-stub}}',
			'{{Fish-stub}}',
		];
		expect(functions.addSafelistedStubs(newStubs, wikicode2)).toStrictEqual(output);
	});

	test(`Handle suggested stub being on stub safelist. Avoid adding it twice.`, () => {
		let newStubs = ['{{Crab-stub}}']; // suggested stub
		let wikicode2 = `{{Crab-stub}}\n`;
		let output = ['{{Crab-stub}}'];
		expect(functions.addSafelistedStubs(newStubs, wikicode2)).toStrictEqual(output);
	});
});

/*

Uncomment this when I rewrite it to not use mw. mw is a dependency so can't do unit test on it.
Or I can install https://github.com/wikimedia-gadgets/mock-mediawiki


describe(`getTitleNoNamespace(title)`, () => {
	test(`Mainspace`, () => {
		let title = `Homo_sapien`;
		let output = `Homo_sapien`;
		expect(functions.getTitleNoNamespace(title)).toEqual(output);
	});

	test(`Draftspace`, () => {
		let title = `Draft:Homo_sapien`;
		let output = `Homo_sapien`;
		expect(functions.getTitleNoNamespace(title)).toEqual(output);
	});

	test(`Handle period character`, () => {
		let title = `User:Novem_Linguae/sandbox3Dudleya_abramsii_subsp._abramsii`;
		let output = `Novem_Linguae/sandbox3Dudleya_abramsii_subsp._abramsii`;
		expect(functions.getTitleNoNamespace(title)).toEqual(output);
	});
});
*/

describe(`isSubSpecies(title, wikicode2)`, () => {
	test(`Normal`, () => {
		let title = `Homo_sapien`;
		let wikicode2 = `{{Speciesbox |genus=Homo |species=sapien}}`;
		let output = false;
		expect(functions.isSubSpecies(title, wikicode2)).toEqual(output);
	});

	test(`Subspecies detected in title`, () => {
		let title = `Homo_sapien_subsp._test`;
		let wikicode2 = `{{Speciesbox |genus=Homo |species=sapien}}`;
		let output = true;
		expect(functions.isSubSpecies(title, wikicode2)).toEqual(output);
	});

	test(`Subspecies detected in wikicode`, () => {
		let title = `Homo_sapien`;
		let wikicode2 = `{{Infraspeciesbox |genus=Homo |species=sapien}}`;
		let output = true;
		expect(functions.isSubSpecies(title, wikicode2)).toEqual(output);
	});
});

describe(`enableCategories(wikicode2, isDraft)`, () => {
	test(`Mainspace, 1 disabled cat, 0 enabled cats`, () => {
		let wikicode2 = `[[:Category:Test]]`;
		let isDraft = false;
		let output = `[[Category:Test]]`;
		expect(functions.enableCategories(wikicode2, isDraft)).toEqual(output);
	});

	test(`Mainspace, 1 disabled cat, 1 enabled cat`, () => {
		let wikicode2 = `[[:Category:Test]]\n[[Category:Test2]]`;
		let isDraft = false;
		let output = `[[Category:Test]]\n[[Category:Test2]]`;
		expect(functions.enableCategories(wikicode2, isDraft)).toEqual(output);
	});

	test(`Mainspace, 0 disabled cats, 1 enabled cat`, () => {
		let wikicode2 = `[[Category:Test2]]`;
		let isDraft = false;
		let output = `[[Category:Test2]]`;
		expect(functions.enableCategories(wikicode2, isDraft)).toEqual(output);
	});

	test(`Draftspace, 1 disabled cat, 0 enabled cats`, () => {
		let wikicode2 = `[[:Category:Test]]`;
		let isDraft = true;
		let output = `[[:Category:Test]]`;
		expect(functions.enableCategories(wikicode2, isDraft)).toEqual(output);
	});
});

describe(`disableCategories(wikicode2, isDraft)`, () => {
	test(`Draftspace, 1 disabled cat, 0 disabled cats`, () => {
		let wikicode2 = `[[:Category:Test]]`;
		let isDraft = true;
		let output = `[[:Category:Test]]`;
		expect(functions.disableCategories(wikicode2, isDraft)).toEqual(output);
	});

	test(`Draftspace, 1 disabled cat, 1 enabled cat`, () => {
		let wikicode2 = `[[:Category:Test]]\n[[Category:Test2]]`;
		let isDraft = true;
		let output = `[[:Category:Test]]\n[[:Category:Test2]]`;
		expect(functions.disableCategories(wikicode2, isDraft)).toEqual(output);
	});

	test(`Draftspace, 0 disabled cats, 1 enabled cat`, () => {
		let wikicode2 = `[[Category:Test2]]`;
		let isDraft = true;
		let output = `[[:Category:Test2]]`;
		expect(functions.disableCategories(wikicode2, isDraft)).toEqual(output);
	});

	test(`Mainspace, 0 disabled cats, 1 enabled cat`, () => {
		let wikicode2 = `[[Category:Test]]`;
		let isDraft = false;
		let output = `[[Category:Test]]`;
		expect(functions.disableCategories(wikicode2, isDraft)).toEqual(output);
	});
});

describe(`deleteGenusCategoryWithSpaceDisambiguator(wikicode2, genus, draftCategoryColon)`, () => {
	test(`delete [[Category:Tristerix| ]]`, () => {
		let wikicode2 =
`{{Taxonbar}}
[[Category:Tristerix| ]]
[[Category:Flora of the Andes]]`;
		let genus = `Tristerix`;
		let draftCategoryColon = '';
		let output =
`{{Taxonbar}}
[[Category:Flora of the Andes]]`;
		expect(functions.deleteGenusCategoryWithSpaceDisambiguator(wikicode2, genus, draftCategoryColon)).toEqual(output);
	});
});

describe(`removeDraftTagIfNotDraftspace(wikicode2, isDraft)`, () => {
	test(`don't run on drafts`, () => {
		let wikicode2 = `Test {{draft}} test.`;
		let isDraft = true;
		let output = `Test {{draft}} test.`;
		expect(functions.removeDraftTagIfNotDraftspace(wikicode2, isDraft)).toEqual(output);
	});

	test(`don run in mainspace`, () => {
		let wikicode2 = `Test {{draft}} test.`;
		let isDraft = false;
		let output = `Test  test.`;
		expect(functions.removeDraftTagIfNotDraftspace(wikicode2, isDraft)).toEqual(output);
	});
});

describe(`isDisambiguationPage(wikicode2)`, () => {
	test(`not a disambiguation page`, () => {
		let wikicode2 = `Test {{draft}} test.`;
		let output = false;
		expect(functions.isDisambiguationPage(wikicode2)).toEqual(output);
	});

	test(`{{Species Latin name disambiguation}}`, () => {
		let wikicode2 = `{{Species Latin name disambiguation}}`;
		let output = true;
		expect(functions.isDisambiguationPage(wikicode2)).toEqual(output);
	});

	test(`{{Disambiguation}}`, () => {
		let wikicode2 = `{{Disambiguation}}`;
		let output = true;
		expect(functions.isDisambiguationPage(wikicode2)).toEqual(output);
	});

	test(`{{Disambiguation|human name}}`, () => {
		let wikicode2 = `{{Disambiguation|human name}}`;
		let output = true;
		expect(functions.isDisambiguationPage(wikicode2)).toEqual(output);
	});
});

describe(`isRedirectPage(wikicode2)`, () => {
	test(`not a redirect`, () => {
		let wikicode2 = `Test {{draft}} test.`;
		let output = false;
		expect(functions.isRedirectPage(wikicode2)).toEqual(output);
	});

	test(`redirect, lowercase`, () => {
		let wikicode2 = `#redirect [[Test]]`;
		let output = true;
		expect(functions.isRedirectPage(wikicode2)).toEqual(output);
	});

	test(`redirect, uppercase`, () => {
		let wikicode2 = `#REDIRECT [[Test]]`;
		let output = true;
		expect(functions.isRedirectPage(wikicode2)).toEqual(output);
	});

	test(`redirect, mixed case`, () => {
		let wikicode2 = `#rEdIrEcT [[Test]]`;
		let output = true;
		expect(functions.isRedirectPage(wikicode2)).toEqual(output);
	});

	test(`redirect, enters in front`, () => {
		let wikicode2 =
`
#rEdIrEcT [[Test]]`;
		let output = true;
		expect(functions.isRedirectPage(wikicode2)).toEqual(output);
	});

	test(`redirect, spaces in front`, () => {
		let wikicode2 =
`
  #rEdIrEcT [[Test]]`;
		let output = true;
		expect(functions.isRedirectPage(wikicode2)).toEqual(output);
	});
});

describe(`deleteStubTemplateIfAnyOtherStubsPresent(wikicode2)`, () => {
	test(`no {{Stub}}`, () => {
		let wikicode2 = `Test {{draft}} test.`;
		let output = `Test {{draft}} test.`;
		expect(functions.deleteStubTemplateIfAnyOtherStubsPresent(wikicode2)).toEqual(output);
	});

	test(`{{Stub}} only`, () => {
		let wikicode2 = `Test {{Stub}} test.`;
		let output = `Test {{Stub}} test.`;
		expect(functions.deleteStubTemplateIfAnyOtherStubsPresent(wikicode2)).toEqual(output);
	});

	test(`{{Ant-stub}} only`, () => {
		let wikicode2 = `Test {{Ant-stub}} test.`;
		let output = `Test {{Ant-stub}} test.`;
		expect(functions.deleteStubTemplateIfAnyOtherStubsPresent(wikicode2)).toEqual(output);
	});

	test(`{{Stub}} and {{Ant-stub}}`, () => {
		let wikicode2 = `Test {{Stub}} {{Ant-stub}} test.`;
		let output = `Test  {{Ant-stub}} test.`;
		expect(functions.deleteStubTemplateIfAnyOtherStubsPresent(wikicode2)).toEqual(output);
	});
});

/** This function only runs if a taxa hasn't been found yet AND |taxon= detected. No need to test anything that doesn't meet that criteria. */
describe(`getSpeciesboxTaxonAndParentParameters(wikicode2)`, () => {
	test(`parent has no disambigtuator`, () => {
		let wikicode2 =
`{{Speciesbox
| image = [[File:Quena Solanum esuriale flower.jpg|200px]]
| taxon = Solanum esuriale
| parent = Solanum
}}`;
		let output = {
			'taxonomyTemplateGenus': 'Solanum',
			'genusForAlert': 'Solanum',
			'species': 'esuriale',
		};
		expect(functions.getSpeciesboxTaxonAndParentParameters(wikicode2)).toEqual(output);
	});

	test(`parent has disambigtuator`, () => {
		let wikicode2 =
`{{Speciesbox | parent = Pilophorus (fungus) | taxon = Pilophorus acicularis}}`;
		let output = {
			'taxonomyTemplateGenus': 'Pilophorus (fungus)',
			'genusForAlert': 'Pilophorus (fungus)',
			'species': 'acicularis',
		};
		expect(functions.getSpeciesboxTaxonAndParentParameters(wikicode2)).toEqual(output);
	});
});