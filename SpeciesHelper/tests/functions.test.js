import * as f from '../modules/SpeciesHelperFunctions.js';

describe( 'countWords(wikicode)', () => {
	test( 'simple', () => {
		const wikicode = 'Two words.';
		const output = 2;
		expect( f.countWords( wikicode ) ).toBe( output );
	} );

	test( 'Don\'t count HTML comments.', () => {
		const wikicode = 'Two words.<!--More words.-->';
		const output = 2;
		expect( f.countWords( wikicode ) ).toBe( output );
	} );

	test( 'Count contents of {{Blockquote}} template', () => {
		const wikicode = 'Two words. {{Blockquote|More words.}}';
		const output = 4;
		expect( f.countWords( wikicode ) ).toBe( output );
	} );
} );

describe( 'getPagesToCheck(taxa, listOfNonLatinSpeciesCategories)', () => {
	test( 'simple', () => {
		const taxa = [
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
			'Eukaryota'
		];
		const listOfNonLatinSpeciesCategories = {};
		const output = [
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
			'Category:Eukaryota'
		];
		expect( f.getPagesToCheck( taxa, listOfNonLatinSpeciesCategories ) ).toStrictEqual( output );
	} );

	test( 'detect non-latin categories when deleting categories', () => {
		const taxa = [
			'Calligonum',
			'Amazona',
			'Polygonaceae'
		];
		const listOfNonLatinSpeciesCategories = {
			Amazona: 'Amazon parrots'
		};
		const output = [
			'Template:Calligonum-stub',
			'Category:Calligonum',
			'Category:Calligonum (genus)',
			'Template:Amazona-stub',
			'Category:Amazon parrots',
			'Template:Polygonaceae-stub',
			'Category:Polygonaceae'
		];
		expect( f.getPagesToCheck( taxa, listOfNonLatinSpeciesCategories ) ).toStrictEqual( output );
	} );
} );

describe( 'deleteAllStubs(wikicode)', () => {
	test( '1 stub', () => {
		const wikicode = '{{Rayfinned-fish-stub}}\n';
		const output = '';
		expect( f.deleteAllStubs( wikicode ) ).toBe( output );
	} );

	test( '2 stubs', () => {
		const wikicode = '{{Rayfinned-fish-stub}}\n{{Fish-stub}}\n';
		const output = '';
		expect( f.deleteAllStubs( wikicode ) ).toBe( output );
	} );

	test( 'delete {{-stub}}', () => {
		const wikicode = '{{-stub}}\n';
		const output = '';
		expect( f.deleteAllStubs( wikicode ) ).toBe( output );
	} );

	test( 'handle {{Reflist}} on same line', () => {
		const wikicode = '{{Reflist}}{{Carabidae-stub}}\n';
		const output = '{{Reflist}}';
		expect( f.deleteAllStubs( wikicode ) ).toBe( output );
	} );
} );

describe( 'isSandbox(titleWithNamespaceAndUnderscores)', () => {
	test( 'detect sandbox', () => {
		const titleWithNamespaceAndUnderscores = 'User:Novem Linguae/sandbox';
		const output = true;
		expect( f.isSandbox( titleWithNamespaceAndUnderscores ) ).toBe( output );
	} );

	test( 'detect sandbox2', () => {
		const titleWithNamespaceAndUnderscores = 'User:Novem Linguae/sandbox2';
		const output = true;
		expect( f.isSandbox( titleWithNamespaceAndUnderscores ) ).toBe( output );
	} );

	test( 'return false if outside sandbox', () => {
		const titleWithNamespaceAndUnderscores = 'User:Novem Linguae';
		const output = false;
		expect( f.isSandbox( titleWithNamespaceAndUnderscores ) ).toBe( output );
	} );
} );

/*
// TODO: unit test failing in CI but not locally. this function isn't used anymore though. commenting out unit test.
describe(`getDateOneYearAgo(today)`, () => {
	test('today 2022-02-01 -> 2021-02-01', () => {
		let today = new Date('2022-02-01');
		let output = '2021-02-01';
		expect(functions.getDateOneYearAgo(today)).toBe(output);
	});
});
*/

describe( 'fixSpeciesParameterThatContainsGenus(wikicode2)', () => {
	test( 'Don\'t change 1', () => {
		const wikicode2 =
`{{Speciesbox
| genus = Homo
| species = sapien
}}`;
		const output =
`{{Speciesbox
| genus = Homo
| species = sapien
}}`;
		expect( f.fixSpeciesParameterThatContainsGenus( wikicode2 ) ).toBe( output );
	} );

	test( 'Don\'t change 2', () => {
		const wikicode2 =
`No speciesbox present. Just random text.
| genus = Homo
| species = Homo sapien`;
		const output =
`No speciesbox present. Just random text.
| genus = Homo
| species = Homo sapien`;
		expect( f.fixSpeciesParameterThatContainsGenus( wikicode2 ) ).toBe( output );
	} );

	test( 'Fix duplicate', () => {
		const wikicode2 =
`{{Speciesbox
| genus = Homo
| species = Homo sapien
}}`;
		const output =
`{{Speciesbox
| genus = Homo
| species = sapien
}}`;
		expect( f.fixSpeciesParameterThatContainsGenus( wikicode2 ) ).toBe( output );
	} );
} );

describe( 'removeItalicTitleIfSpeciesBoxPresent(wikicode2)', () => {
	test( 'Don\'t change', () => {
		const wikicode2 = '{{Italic title}}';
		const output = '{{Italic title}}';
		expect( f.removeItalicTitleIfSpeciesBoxPresent( wikicode2 ) ).toBe( output );
	} );

	test( 'Remove {{Italic title}}', () => {
		const wikicode2 =
`{{Italic title}}
{{Speciesbox
| genus = Homo
| species = sapien
}}`;
		const output =
`{{Speciesbox
| genus = Homo
| species = sapien
}}`;
		expect( f.removeItalicTitleIfSpeciesBoxPresent( wikicode2 ) ).toBe( output );
	} );

	test( 'Remove {{Italictitle}}', () => {
		const wikicode2 =
`{{Italictitle}}
{{Speciesbox
| genus = Homo
| species = sapien
}}`;
		const output =
`{{Speciesbox
| genus = Homo
| species = sapien
}}`;
		expect( f.removeItalicTitleIfSpeciesBoxPresent( wikicode2 ) ).toBe( output );
	} );
} );

describe( 'getSpeciesBox(wikicode2)', () => {
	test( 'No speciesbox', () => {
		const wikicode2 = 'Test';
		expect( f.getSpeciesBox( wikicode2 ) ).toBeFalsy();
	} );

	test( 'Yes speciesbox', () => {
		const wikicode2 = 'Test {{Speciesbox}}';
		expect( f.getSpeciesBox( wikicode2 ) ).toBeTruthy();
	} );
} );

describe( 'replaceReferencesWithReflist(wikicode2)', () => {
	test( 'No <references> or {{Reflist}}', () => {
		const wikicode2 = 'Test';
		const output = 'Test';
		expect( f.replaceReferencesWithReflist( wikicode2 ) ).toBe( output );
	} );

	// don't need to test <references> (no slash), it doesn't render

	test( '<references/>', () => {
		const wikicode2 = 'Test\n\n==References==\n<references/>';
		const output = 'Test\n\n==References==\n{{Reflist}}';
		expect( f.replaceReferencesWithReflist( wikicode2 ) ).toBe( output );
	} );

	test( '<references />', () => {
		const wikicode2 = 'Test\n\n==References==\n<references />';
		const output = 'Test\n\n==References==\n{{Reflist}}';
		expect( f.replaceReferencesWithReflist( wikicode2 ) ).toBe( output );
	} );
} );

describe( 'getListOfCategoriesFromWikitext(wikicode2)', () => {
	test( 'No categories', () => {
		const wikicode2 = 'Test';
		const output = null;
		expect( f.getListOfCategoriesFromWikitext( wikicode2 ) ).toBe( output );
	} );

	test( '1 category', () => {
		const wikicode2 = 'Test [[Category:Test2]] Test3';
		const output = [ 'Category:Test2' ];
		expect( f.getListOfCategoriesFromWikitext( wikicode2 ) ).toStrictEqual( output );
	} );

	test( '2 categories', () => {
		const wikicode2 = 'Test [[Category:Test2]] [[Category:Test3]] Test4';
		const output = [ 'Category:Test2', 'Category:Test3' ];
		expect( f.getListOfCategoriesFromWikitext( wikicode2 ) ).toStrictEqual( output );
	} );

	test( '1 draft category', () => {
		const wikicode2 = 'Test [[:Category:Test2]] Test3';
		const output = [ 'Category:Test2' ];
		expect( f.getListOfCategoriesFromWikitext( wikicode2 ) ).toStrictEqual( output );
	} );
} );

describe( 'arraysHaveSameValuesCaseInsensitive(array1, array2)', () => {
	test( '1 null input', () => {
		const array1 = [ 'A', 'B' ];
		const array2 = null;
		const output = false;
		expect( f.arraysHaveSameValuesCaseInsensitive( array1, array2 ) ).toBe( output );
	} );

	test( '2 null inputs', () => {
		const array1 = null;
		const array2 = null;
		const output = true;
		expect( f.arraysHaveSameValuesCaseInsensitive( array1, array2 ) ).toBe( output );
	} );

	test( 'identical arrays', () => {
		const array1 = [ 'A', 'B' ];
		const array2 = [ 'A', 'B' ];
		const output = true;
		expect( f.arraysHaveSameValuesCaseInsensitive( array1, array2 ) ).toStrictEqual( output );
	} );

	test( 'case insensitive', () => {
		const array1 = [ 'A', 'B' ];
		const array2 = [ 'A', 'b' ];
		const output = true;
		expect( f.arraysHaveSameValuesCaseInsensitive( array1, array2 ) ).toStrictEqual( output );
	} );

	test( 'scrambled order', () => {
		const array1 = [ 'A', 'B' ];
		const array2 = [ 'B', 'A' ];
		const output = true;
		expect( f.arraysHaveSameValuesCaseInsensitive( array1, array2 ) ).toStrictEqual( output );
	} );

	test( 'not identical', () => {
		const array1 = [ 'A', 'B' ];
		const array2 = [ 'A', 'B', 'C' ];
		const output = false;
		expect( f.arraysHaveSameValuesCaseInsensitive( array1, array2 ) ).toStrictEqual( output );
	} );
} );

describe( 'suggestShortDescriptionFromWikicode(wikicode2)', () => {
	test( '"is a species of" not present', () => {
		const wikicode2 = 'Test';
		const output = '';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Handle non-piped wikilink. Handle prepositions such as "in"', () => {
		const wikicode2 = '\'\'\'\'\'Dictyonema lawreyi\'\'\'\'\' is a species of [[basidiolichen]] in the family [[Hygrophoraceae]].';
		const output = '{{Short description|Species of basidiolichen}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Handle piped wikilink. Handle conjunctions such as "that"', () => {
		const wikicode2 = '\'\'\'\'\'Cyperus breedlovei\'\'\'\'\' is a species of [[Cyperus|sedge]] that is native to parts of [[Mexico]].';
		const output = '{{Short description|Species of sedge}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( '', () => {
		const wikicode2 = '\'\'\'\'\'Liolaemus victormoralesii\'\'\'\'\' is a [[species]] of [[lizard]] in the [[Family (biology)|family]] [[Iguanidae]] or the family [[Liolaemidae]].';
		const output = '{{Short description|Species of lizard}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( '', () => {
		const wikicode2 = '\'\'\'\'\'Hong glorious\'\'\'\'\' is a species of [[ladybird beetle]] in the genus [[Hong (beetle)|\'\'Hong\'\']].';
		const output = '{{Short description|Species of beetle}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Return blank if over 40 characters', () => {
		const wikicode2 = '\'\'\'\'\'Pelatantheria cristata\'\'\'\'\'<small> (Ridl.) Ridl. <ref>J. Linn. Soc., Bot. 32: 373 (1896).</ref></small> is a species of epiphytic or lithophytic [[orchid]] occurring in [[Indonesia]], [[Thailand]] and [[Malaysia]].';
		const output = '{{Short description|Species of orchid}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( '', () => {
		const wikicode2 = '\'\'\'\'\'Hisonotus francirochai\'\'\'\'\'<ref>{{Cite web|title=ITIS - Report: Hisonotus francirochai|url=https://www.itis.gov/servlet/SingleRpt/SingleRpt?search_topic=TSN&search_value=679919#null|access-date=2022-02-08|website=www.itis.gov}}</ref> is a [[species]] of [[catfish]] in the family [[Loricariidae]].';
		const output = '{{Short description|Species of catfish}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( '', () => {
		const wikicode2 = '\'\'\'Ognev\'s serotine\'\'\' (\'\'Eptesicus ognevi\'\') is a [[species]] of [[Vespertilionidae|vesper bat]] found in western and central [[Asia]].';
		const output = '{{Short description|Species of bat}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Remove training "s"', () => {
		const wikicode2 = '\'\'\'\'\'Carthamus caeruleus\'\'\'\'\' is a species of plants in the family [[Asteraceae]].';
		const output = '{{Short description|Species of plant}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( '', () => {
		const wikicode2 = '\'\'\'\'\'Eperua falcata\'\'\'\'\', the \'\'\'bootlace tree\'\'\', is a species of flowering plant in the family [[Fabaceae]], native to northern South America.';
		const output = '{{Short description|Species of plant}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Handle word with a dash', () => {
		const wikicode2 = '\'\'\'\'\'Megalobulimus dryades\'\'\'\'\' is a [[species]] of air-breathing [[land snail]], a [[terrestrial mollusc|terrestrial]] [[gastropod]] [[mollusc]] in the family [[Strophocheilidae]].';
		const output = '{{Short description|Species of snail}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Don\'t remove last "s" if double "ss"', () => {
		const wikicode2 = '\'\'\'\'\'Carex pairae\'\'\'\'\' is a species of perennial grass in the family [[Cyperaceae]] (sedges). They have a self-supporting growth form and simple, broad leaves.';
		const output = '{{Short description|Species of grass}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( '', () => {
		const wikicode2 = '\'\'\'\'\'Lechenaultia hirsuta\'\'\'\'\', commonly known as \'\'\'hairy leschenaultia\'\'\',<ref name=FloraBase>{{FloraBase|name=\'\'Lechenaultia hirsuta\'\'|id=7577}}</ref> is a species of flowering plant in the family [[Goodeniaceae]] and is [[endemic]] to the west of Western Australia.';
		const output = '{{Short description|Species of plant}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( '', () => {
		const wikicode2 = '\'\'\'\'\'Hisonotus francirochai\'\'\'\'\'<ref>{{Cite web|title=ITIS - Report: Hisonotus francirochai|url=https://www.itis.gov/servlet/SingleRpt/SingleRpt?search_topic=TSN&search_value=679919#null|access-date=2022-02-08|website=www.itis.gov}}</ref> is a [[species]] of [[catfish]] in the family [[Loricariidae]].';
		const output = '{{Short description|Species of catfish}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Whole article / multi-line', () => {
		const wikicode2 =
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
		const output = '{{Short description|Species of catfish}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'don\'t chop "s" on fungus', () => {
		const wikicode2 = '\'\'\'\'\'Anixia wallrothii\'\'\'\'\' is a species of fungus.';
		const output = '{{Short description|Species of fungus}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'handle conjunction "belonging"', () => {
		const wikicode2 = '\'\'\'\'\'Anixia wallrothii\'\'\'\'\' is a species of fungus belonging to the \'\'[[Anixia]]\'\' genus.';
		const output = '{{Short description|Species of fungus}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'handle conjunction "endemic"', () => {
		const wikicode2 = '\'\'\'\'\'Ammoglanis obliquus\'\'\'\'\' is a [[species]] of [[pencil catfish]] [[endemism|endemic]] to the Rio Preto da Eva drainage in the central Brazilian Amazon.';
		const output = '{{Short description|Species of catfish}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'handle <ref> in the middle of "is a species of". Handle <ref name="test">abc</ref>', () => {
		const wikicode2 = '\'\'\'\'\'Gynacantha chaplini\'\'\'\'\' is a [[species]]<ref name="inaturalist-Gynacantha chaplini">{{cite web |title=Gynacantha chaplini |url=https://www.inaturalist.org/taxa/1304630-Gynacantha-chaplini |website=iNaturalist |access-date=2021-12-10 |language=en-US}}</ref> of dragonfly described from North-eastern [[Bangladesh]].';
		const output = '{{Short description|Species of dragonfly}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'handle quotation marks', () => {
		const wikicode2 = '\'\'\'\'\'Pulchrana fantastica\'\'\'\'\', also known as the \'\'\'splendid stream frog\'\'\', is a [[species]] of "[[true frog]]", family Ranidae.';
		const output = '{{Short description|Species of frog}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Handle words that start with prepositions but that should be in the short description', () => {
		const wikicode2 = '\'\'\'\'\'Caridina typus,\'\'\'\'\' also known as the "Typical Caridina" or the "Australian Amano Shrimp", is a [[species]] of [[amphidromous]] [[atyid shrimp]].';
		const output = '{{Short description|Species of shrimp}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Delete non-useful adjectives such as "noctural", to make description shorter', () => {
		const wikicode2 = 'The \'\'\'West African potto\'\'\' (\'\'Perodictitus potto\'\') is a species of nocturnal [[strepsirrhine]] [[primate]].';
		const output = '{{Short description|Species of primate}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Should be singular, e.g. species of fungus', () => {
		const wikicode2 = '\'\'\'\'\'Mycena epipterygia\'\'\'\'\' is a species of fungi in the family [[Mycenaceae]] of [[mushroom]]s commonly found in Europe.';
		const output = '{{Short description|Species of fungus}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Should be singular, e.g. species of bacterium', () => {
		const wikicode2 = '\'\'\'\'\'Mycena epipterygia\'\'\'\'\' is a species of bacteria in the family [[Mycenaceae]] of [[mushroom]]s commonly found in Europe.';
		const output = '{{Short description|Species of bacterium}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Handle -es', () => {
		const wikicode2 = '\'\'\'\'\'Copionodon lianae\'\'\'\'\' is a species of [[catfish]]es ([[order (biology)|order]] Siluriformes) of the [[family (biology)|family]] [[Trichomycteridae]].';
		const output = '{{Short description|Species of catfish}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Handle -es edge case "centipedes"', () => {
		const wikicode2 = '\'\'\'\'\'Geophilus proximus\'\'\'\'\' is a [[species]] of [[Geophilomorpha|soil centipede]]s in the [[family (biology)|family]] [[Geophilidae]] found in the northern part of the [[palearctic realm|Palearctic]] and widespread across the entire [[Baltic states|Baltic]] basin, though it reaches as far as the [[Arctic Circle]] and has been introduced through human agency to northern, central, and eastern parts of [[Kazakhstan]].';
		const output = '{{Short description|Species of centipede}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Handle -es edge case "bivalves"', () => {
		const wikicode2 = '\'\'\'\'\'Bankia carinata\'\'\'\'\' is a species of [[bivalves]] belonging to the family [[Teredinidae]].';
		const output = '{{Short description|Species of bivalve}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Handle \'\'italics\'\'', () => {
		const wikicode2 = '\'\'\'\'\'Larinus sturnus\'\'\'\'\' is a species of \'\'cylindrical weevils\'\' belonging to the family [[Curculionidae]], subfamily [[Lixinae]].';
		const output = '{{Short description|Species of weevil}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2 ) ).toBe( output );
	} );

	test( 'Don\'t just regurgitate the genus', () => {
		const wikicode2 = '\'\'\'\'\'Bankia carinata\'\'\'\'\' is a species of [[bankia]] belonging to the family [[Teredinidae]].';
		const taxa = [ 'Test', 'Bankia', 'Test2' ];
		const output = '';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2, taxa ) ).toBe( output );
	} );

	test( 'Handle adjective clauses with prepositions in them, e.g. small to medium', () => {
		const wikicode2 = '\'\'\'\'\'Histioteuthis meleagroteuthis\'\'\'\'\' is a species of small to medium squids that have a dark, wine red skin pigment.';
		const taxa = [ 'Test', 'Histioteuthis', 'Test2' ];
		const output = '{{Short description|Species of squid}}';
		expect( f.suggestShortDescriptionFromWikicode( wikicode2, taxa ) ).toBe( output );
	} );
} );

describe( 'convertH1ToH2(wikicode2)', () => {
	test( 'Don\'t change', () => {
		const wikicode2 = '== Heading ==';
		const output = '== Heading ==';
		expect( f.convertH1ToH2( wikicode2 ) ).toBe( output );
	} );

	test( 'Change', () => {
		const wikicode2 = '= Heading =';
		const output = '== Heading ==';
		expect( f.convertH1ToH2( wikicode2 ) ).toBe( output );
	} );
} );

describe( 'deleteMoreThanTwoEntersInARow(wikicode)', () => {
	test( 'Normal', () => {
		const wikicode =
`Test


Test`;
		const output =
`Test

Test`;
		expect( f.deleteMoreThanTwoEntersInARow( wikicode ) ).toBe( output );
	} );

	test( 'Change 3 enters to 1 enter in front of a stub tag', () => {
		const wikicode =
`Test



{{Stub}}`;
		const output =
`Test

{{Stub}}`;
		expect( f.deleteMoreThanTwoEntersInARow( wikicode ) ).toBe( output );
	} );

	test( 'Make no change to 1 enter in front of a stub tag', () => {
		const wikicode =
`Test

{{Stub}}`;
		const output =
`Test

{{Stub}}`;
		expect( f.deleteMoreThanTwoEntersInARow( wikicode ) ).toBe( output );
	} );

	test( 'Line with only a space shouldn\'t mess up deleting double enters', () => {
		const wikicode =
`<ref name="lower" />
 


== Further reading ==
`;
		const output =
`<ref name="lower" />

== Further reading ==
`;
		expect( f.deleteMoreThanTwoEntersInARow( wikicode ) ).toBe( output );
	} );
} );

describe( 'fixWhitespaceInCategories(wikicode)', () => {
	test( '[[Category:Test]]', () => {
		const wikicode = '[[Category:Test]]';
		const output = '[[Category:Test]]';
		expect( f.fixWhitespaceInCategories( wikicode ) ).toBe( output );
	} );

	test( '[[Category:Test test]]', () => {
		const wikicode = '[[Category:Test test]]';
		const output = '[[Category:Test test]]';
		expect( f.fixWhitespaceInCategories( wikicode ) ).toBe( output );
	} );

	test( '[[Category:Test test|Test]]', () => {
		const wikicode = '[[Category:Test test|Test]]';
		const output = '[[Category:Test test|Test]]';
		expect( f.fixWhitespaceInCategories( wikicode ) ).toBe( output );
	} );

	test( '[[Category:Test test|Test test]]', () => {
		const wikicode = '[[Category:Test test|Test test]]';
		const output = '[[Category:Test test|Test test]]';
		expect( f.fixWhitespaceInCategories( wikicode ) ).toBe( output );
	} );

	test( '[[Category: test test]]', () => {
		const wikicode = '[[Category: test test]]';
		const output = '[[Category:test test]]';
		expect( f.fixWhitespaceInCategories( wikicode ) ).toBe( output );
	} );

	test( '[[Category:Test test ]]', () => {
		const wikicode = '[[Category:Test test ]]';
		const output = '[[Category:Test test]]';
		expect( f.fixWhitespaceInCategories( wikicode ) ).toBe( output );
	} );

	test( '[[Category: Test test|Test test]]', () => {
		const wikicode = '[[Category: Test test|Test test]]';
		const output = '[[Category:Test test|Test test]]';
		expect( f.fixWhitespaceInCategories( wikicode ) ).toBe( output );
	} );

	test( '[[Category:Test test |Test test]]', () => {
		const wikicode = '[[Category:Test test |Test test]]';
		const output = '[[Category:Test test|Test test]]';
		expect( f.fixWhitespaceInCategories( wikicode ) ).toBe( output );
	} );

	test( '[[Category:Test test| Test test]]', () => {
		const wikicode = '[[Category:Test test| Test test]]';
		const output = '[[Category:Test test|Test test]]';
		expect( f.fixWhitespaceInCategories( wikicode ) ).toBe( output );
	} );

	test( '[[Category:Test test|Test test ]]', () => {
		const wikicode = '[[Category:Test test|Test test ]]';
		const output = '[[Category:Test test|Test test]]';
		expect( f.fixWhitespaceInCategories( wikicode ) ).toBe( output );
	} );
} );

describe( 'removeAuthorityControlIfTaxonbarPresent(wikicode2)', () => {
	test( 'Taxonbar, no authority control', () => {
		const wikicode2 =
`{{Taxonbar}}
`;
		const output =
`{{Taxonbar}}
`;
		expect( f.removeAuthorityControlIfTaxonbarPresent( wikicode2 ) ).toBe( output );
	} );

	test( 'Taxonbar and authority control', () => {
		const wikicode2 =
`{{Taxonbar}}
{{Authority control}}
`;
		const output =
`{{Taxonbar}}
`;
		expect( f.removeAuthorityControlIfTaxonbarPresent( wikicode2 ) ).toBe( output );
	} );

	test( 'Authority control, no taxonbar', () => {
		const wikicode2 =
`{{Authority control}}
`;
		const output =
`{{Authority control}}
`;
		expect( f.removeAuthorityControlIfTaxonbarPresent( wikicode2 ) ).toBe( output );
	} );
} );

describe( 'removeEmptyDefaultSort(wikicode2)', () => {
	test( 'Do nothing', () => {
		const wikicode2 = 'Test test';
		const output = 'Test test';
		expect( f.removeEmptyDefaultSort( wikicode2 ) ).toBe( output );
	} );

	test( '{{DEFAULTSORT|Not empty}}', () => {
		const wikicode2 =
`{{DEFAULTSORT|Not empty}}
`;
		const output =
`{{DEFAULTSORT|Not empty}}
`;
		expect( f.removeEmptyDefaultSort( wikicode2 ) ).toBe( output );
	} );
	test( '{{DEFAULTSORT}}', () => {
		const wikicode2 =
`{{DEFAULTSORT}}
`;
		const output = '';
		expect( f.removeEmptyDefaultSort( wikicode2 ) ).toBe( output );
	} );

	test( '{{DEFAULTSORT:}}', () => {
		const wikicode2 =
`{{DEFAULTSORT:}}
`;
		const output = '';
		expect( f.removeEmptyDefaultSort( wikicode2 ) ).toBe( output );
	} );

	test( '{{DEFAULTSORT|}}', () => {
		const wikicode2 =
`{{DEFAULTSORT|}}
`;
		const output = '';
		expect( f.removeEmptyDefaultSort( wikicode2 ) ).toBe( output );
	} );
} );

describe( 'removeDefaultSortIdenticalToTitle(wikicode2, titleNoNamespaceNoUnderscores)', () => {
	test( 'Do nothing', () => {
		const titleNoNamespaceNoUnderscores = 'Test_title!';
		const wikicode2 = 'Test test';
		const output = 'Test test';
		expect( f.removeDefaultSortIdenticalToTitle( wikicode2, titleNoNamespaceNoUnderscores ) ).toBe( output );
	} );

	test( '{{DEFAULTSORT|Not the title}}', () => {
		const titleNoNamespaceNoUnderscores = 'Test_title!';
		const wikicode2 =
`{{DEFAULTSORT|Not the title}}
`;
		const output =
`{{DEFAULTSORT|Not the title}}
`;
		expect( f.removeDefaultSortIdenticalToTitle( wikicode2, titleNoNamespaceNoUnderscores ) ).toBe( output );
	} );

	test( '{{DEFAULTSORT|Test_title!}}', () => {
		const titleNoNamespaceNoUnderscores = 'Test_title!';
		const wikicode2 =
`{{DEFAULTSORT|Test_title!}}
`;
		const output = '';
		expect( f.removeDefaultSortIdenticalToTitle( wikicode2, titleNoNamespaceNoUnderscores ) ).toBe( output );
	} );

	test( '{{DEFAULTSORT:Test_title!}}', () => {
		const titleNoNamespaceNoUnderscores = 'Test_title!';
		const wikicode2 =
`{{DEFAULTSORT:Test_title!}}
`;
		const output = '';
		expect( f.removeDefaultSortIdenticalToTitle( wikicode2, titleNoNamespaceNoUnderscores ) ).toBe( output );
	} );
} );

describe( 'getFirstWords(wikicode2)', () => {
	test( '', () => {
		const wikicode2 = '1 2 3 4';
		const output = '1 2 3 ';
		expect( f.getFirstWords( wikicode2 ) ).toBe( output );
	} );

	test( '', () => {
		const wikicode2 = '1';
		const output = '';
		expect( f.getFirstWords( wikicode2 ) ).toBe( output );
	} );
} );

describe( 'getLastWord(wikicode2)', () => {
	test( '', () => {
		const wikicode2 = '1 2 3 4';
		const output = '4';
		expect( f.getLastWord( wikicode2 ) ).toBe( output );
	} );

	test( '', () => {
		const wikicode2 = '1';
		const output = '1';
		expect( f.getLastWord( wikicode2 ) ).toBe( output );
	} );
} );

describe( 'addSafelistedStubs(newStubs, wikicode2)', () => {
	test( 'Handle 0 safelisted stubs present', () => {
		const newStubs = [ '{{Weevil-stub}}' ]; // suggested stub
		const wikicode2 = '\n';
		const output = [ '{{Weevil-stub}}' ];
		expect( f.addSafelistedStubs( newStubs, wikicode2 ) ).toStrictEqual( output );
	} );

	test( 'Handle 1 safelisted stub present', () => {
		const newStubs = [ '{{Weevil-stub}}' ]; // suggested stub
		const wikicode2 = '{{Crab-stub}}\n';
		const output = [
			'{{Weevil-stub}}',
			'{{Crab-stub}}'
		];
		expect( f.addSafelistedStubs( newStubs, wikicode2 ) ).toStrictEqual( output );
	} );

	test( 'Handle 2 safelisted stubs present', () => {
		const newStubs = [ '{{Weevil-stub}}' ]; // suggested stub
		const wikicode2 = '{{Crab-stub}}\n{{Fish-stub}}\n';
		const output = [
			'{{Weevil-stub}}',
			'{{Crab-stub}}',
			'{{Fish-stub}}'
		];
		expect( f.addSafelistedStubs( newStubs, wikicode2 ) ).toStrictEqual( output );
	} );

	test( 'Handle suggested stub being on stub safelist. Avoid adding it twice.', () => {
		const newStubs = [ '{{Crab-stub}}' ]; // suggested stub
		const wikicode2 = '{{Crab-stub}}\n';
		const output = [ '{{Crab-stub}}' ];
		expect( f.addSafelistedStubs( newStubs, wikicode2 ) ).toStrictEqual( output );
	} );
} );

/*

TODO: Uncomment this when I rewrite it to not use mw. mw is a dependency so can't do unit test on it.
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

describe( 'isSubSpecies(title, wikicode2)', () => {
	test( 'Normal', () => {
		const title = 'Homo_sapien';
		const wikicode2 = '{{Speciesbox |genus=Homo |species=sapien}}';
		const output = false;
		expect( f.isSubSpecies( title, wikicode2 ) ).toEqual( output );
	} );

	test( 'Subspecies detected in title', () => {
		const title = 'Homo_sapien_subsp._test';
		const wikicode2 = '{{Speciesbox |genus=Homo |species=sapien}}';
		const output = true;
		expect( f.isSubSpecies( title, wikicode2 ) ).toEqual( output );
	} );

	test( 'Subspecies detected in wikicode', () => {
		const title = 'Homo_sapien';
		const wikicode2 = '{{Infraspeciesbox |genus=Homo |species=sapien}}';
		const output = true;
		expect( f.isSubSpecies( title, wikicode2 ) ).toEqual( output );
	} );
} );

describe( 'enableCategories(wikicode2, isDraft)', () => {
	test( 'Mainspace, 1 disabled cat, 0 enabled cats', () => {
		const wikicode2 = '[[:Category:Test]]';
		const isDraft = false;
		const output = '[[Category:Test]]';
		expect( f.enableCategories( wikicode2, isDraft ) ).toEqual( output );
	} );

	test( 'Mainspace, 1 disabled cat, 1 enabled cat', () => {
		const wikicode2 = '[[:Category:Test]]\n[[Category:Test2]]';
		const isDraft = false;
		const output = '[[Category:Test]]\n[[Category:Test2]]';
		expect( f.enableCategories( wikicode2, isDraft ) ).toEqual( output );
	} );

	test( 'Mainspace, 0 disabled cats, 1 enabled cat', () => {
		const wikicode2 = '[[Category:Test2]]';
		const isDraft = false;
		const output = '[[Category:Test2]]';
		expect( f.enableCategories( wikicode2, isDraft ) ).toEqual( output );
	} );

	test( 'Draftspace, 1 disabled cat, 0 enabled cats', () => {
		const wikicode2 = '[[:Category:Test]]';
		const isDraft = true;
		const output = '[[:Category:Test]]';
		expect( f.enableCategories( wikicode2, isDraft ) ).toEqual( output );
	} );
} );

describe( 'disableCategories(wikicode2, isDraft)', () => {
	test( 'Draftspace, 1 disabled cat, 0 disabled cats', () => {
		const wikicode2 = '[[:Category:Test]]';
		const isDraft = true;
		const output = '[[:Category:Test]]';
		expect( f.disableCategories( wikicode2, isDraft ) ).toEqual( output );
	} );

	test( 'Draftspace, 1 disabled cat, 1 enabled cat', () => {
		const wikicode2 = '[[:Category:Test]]\n[[Category:Test2]]';
		const isDraft = true;
		const output = '[[:Category:Test]]\n[[:Category:Test2]]';
		expect( f.disableCategories( wikicode2, isDraft ) ).toEqual( output );
	} );

	test( 'Draftspace, 0 disabled cats, 1 enabled cat', () => {
		const wikicode2 = '[[Category:Test2]]';
		const isDraft = true;
		const output = '[[:Category:Test2]]';
		expect( f.disableCategories( wikicode2, isDraft ) ).toEqual( output );
	} );

	test( 'Mainspace, 0 disabled cats, 1 enabled cat', () => {
		const wikicode2 = '[[Category:Test]]';
		const isDraft = false;
		const output = '[[Category:Test]]';
		expect( f.disableCategories( wikicode2, isDraft ) ).toEqual( output );
	} );
} );

describe( 'deleteGenusCategoryWithSpaceDisambiguator(wikicode2, genus, draftCategoryColon)', () => {
	test( 'delete [[Category:Tristerix| ]]', () => {
		const wikicode2 =
`{{Taxonbar}}
[[Category:Tristerix| ]]
[[Category:Flora of the Andes]]`;
		const genus = 'Tristerix';
		const draftCategoryColon = '';
		const output =
`{{Taxonbar}}
[[Category:Flora of the Andes]]`;
		expect( f.deleteGenusCategoryWithSpaceDisambiguator( wikicode2, genus, draftCategoryColon ) ).toEqual( output );
	} );
} );

describe( 'removeDraftTagIfNotDraftspace(wikicode2, isDraft)', () => {
	test( 'don\'t run on drafts', () => {
		const wikicode2 = 'Test {{draft}} test.';
		const isDraft = true;
		const output = 'Test {{draft}} test.';
		expect( f.removeDraftTagIfNotDraftspace( wikicode2, isDraft ) ).toEqual( output );
	} );

	test( 'don run in mainspace', () => {
		const wikicode2 = 'Test {{draft}} test.';
		const isDraft = false;
		const output = 'Test  test.';
		expect( f.removeDraftTagIfNotDraftspace( wikicode2, isDraft ) ).toEqual( output );
	} );
} );

describe( 'isDisambiguationPage(wikicode2)', () => {
	test( 'not a disambiguation page', () => {
		const wikicode2 = 'Test {{draft}} test.';
		const output = false;
		expect( f.isDisambiguationPage( wikicode2 ) ).toEqual( output );
	} );

	test( '{{Species Latin name disambiguation}}', () => {
		const wikicode2 = '{{Species Latin name disambiguation}}';
		const output = true;
		expect( f.isDisambiguationPage( wikicode2 ) ).toEqual( output );
	} );

	test( '{{Disambiguation}}', () => {
		const wikicode2 = '{{Disambiguation}}';
		const output = true;
		expect( f.isDisambiguationPage( wikicode2 ) ).toEqual( output );
	} );

	test( '{{Disambiguation|human name}}', () => {
		const wikicode2 = '{{Disambiguation|human name}}';
		const output = true;
		expect( f.isDisambiguationPage( wikicode2 ) ).toEqual( output );
	} );
} );

describe( 'isRedirectPage(wikicode2)', () => {
	test( 'not a redirect', () => {
		const wikicode2 = 'Test {{draft}} test.';
		const output = false;
		expect( f.isRedirectPage( wikicode2 ) ).toEqual( output );
	} );

	test( 'redirect, lowercase', () => {
		const wikicode2 = '#redirect [[Test]]';
		const output = true;
		expect( f.isRedirectPage( wikicode2 ) ).toEqual( output );
	} );

	test( 'redirect, uppercase', () => {
		const wikicode2 = '#REDIRECT [[Test]]';
		const output = true;
		expect( f.isRedirectPage( wikicode2 ) ).toEqual( output );
	} );

	test( 'redirect, mixed case', () => {
		const wikicode2 = '#rEdIrEcT [[Test]]';
		const output = true;
		expect( f.isRedirectPage( wikicode2 ) ).toEqual( output );
	} );

	test( 'redirect, enters in front', () => {
		const wikicode2 =
`
#rEdIrEcT [[Test]]`;
		const output = true;
		expect( f.isRedirectPage( wikicode2 ) ).toEqual( output );
	} );

	test( 'redirect, spaces in front', () => {
		const wikicode2 =
`
  #rEdIrEcT [[Test]]`;
		const output = true;
		expect( f.isRedirectPage( wikicode2 ) ).toEqual( output );
	} );
} );

describe( 'deleteStubTemplateIfAnyOtherStubsPresent(wikicode2)', () => {
	test( 'no {{Stub}}', () => {
		const wikicode2 = 'Test {{draft}} test.';
		const output = 'Test {{draft}} test.';
		expect( f.deleteStubTemplateIfAnyOtherStubsPresent( wikicode2 ) ).toEqual( output );
	} );

	test( '{{Stub}} only', () => {
		const wikicode2 = 'Test {{Stub}} test.';
		const output = 'Test {{Stub}} test.';
		expect( f.deleteStubTemplateIfAnyOtherStubsPresent( wikicode2 ) ).toEqual( output );
	} );

	test( '{{Ant-stub}} only', () => {
		const wikicode2 = 'Test {{Ant-stub}} test.';
		const output = 'Test {{Ant-stub}} test.';
		expect( f.deleteStubTemplateIfAnyOtherStubsPresent( wikicode2 ) ).toEqual( output );
	} );

	test( '{{Stub}} and {{Ant-stub}}', () => {
		const wikicode2 = 'Test {{Stub}} {{Ant-stub}} test.';
		const output = 'Test  {{Ant-stub}} test.';
		expect( f.deleteStubTemplateIfAnyOtherStubsPresent( wikicode2 ) ).toEqual( output );
	} );
} );

/** This function only runs if a taxa hasn't been found yet AND |taxon= detected. No need to test anything that doesn't meet that criteria. */
describe( 'getSpeciesboxTaxonAndParentParameters(wikicode2)', () => {
	test( 'parent has no disambigtuator', () => {
		const wikicode2 =
`{{Speciesbox
| image = [[File:Quena Solanum esuriale flower.jpg|200px]]
| taxon = Solanum esuriale
| parent = Solanum
}}`;
		const output = {
			taxonomyTemplateGenus: 'Solanum',
			genusForAlert: 'Solanum',
			species: 'esuriale'
		};
		expect( f.getSpeciesboxTaxonAndParentParameters( wikicode2 ) ).toEqual( output );
	} );

	test( 'parent has disambigtuator', () => {
		const wikicode2 =
'{{Speciesbox | parent = Pilophorus (fungus) | taxon = Pilophorus acicularis}}';
		const output = {
			taxonomyTemplateGenus: 'Pilophorus (fungus)',
			genusForAlert: 'Pilophorus (fungus)',
			species: 'acicularis'
		};
		expect( f.getSpeciesboxTaxonAndParentParameters( wikicode2 ) ).toEqual( output );
	} );
} );
