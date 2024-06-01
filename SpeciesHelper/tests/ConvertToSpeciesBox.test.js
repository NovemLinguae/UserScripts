import { ConvertToSpeciesBox } from '../modules/ConvertToSpeciesBox.js';

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

// This detects tabs inside of strings, which is really bad. Disable.
/* eslint-disable no-tabs */

describe( 'convert(wikicode)', () => {
	test( 'typical', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox 
| name = 
| image = 
| image_caption = 
| regnum = [[Animal]]ia
| phylum = [[Chordata]]
| classis = [[Actinopterygii]]
| ordo = [[Aulopiformes]]
| familia = [[Pseudochromidae]]
| subfamilia =	[[Pseudoplesiopinae]]
| genus = ''[[Lubbockichthys]]''
| species = ''L. multisquamatus''
| binomial = ''Lubbockichthys multisquamatus''
| binomial_authority = [[Gerald R. Allen|G. R. Allen]], 1987
| synonyms = *''Pseudoplesiops multisquamatus'' Allen, 1987
*''Lubbochichthys multisquamatus'' (Allen, 1987)
*''Pseudoplesiops multisquamata'' Allen, 1987
}}`;
		const output =
`{{Speciesbox 
| genus = Lubbockichthys
| species = multisquamatus
| authority = [[Gerald R. Allen|G. R. Allen]], 1987
| synonyms = *''Pseudoplesiops multisquamatus'' Allen, 1987
*''Lubbochichthys multisquamatus'' (Allen, 1987)
*''Pseudoplesiops multisquamata'' Allen, 1987
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'delete {{Italic title}}', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Italic title}}
{{Taxobox 
| genus = ''[[Lubbockichthys]]''
| species = ''L. multisquamatus''
}}`;
		const output =
`{{Speciesbox 
| genus = Lubbockichthys
| species = multisquamatus
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'handle | genus = \'\'[[Semicassis]]\'\'', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Semicassis]]''
| species = '''''S. faurotis'''''
}}`;
		const output =
`{{Speciesbox
| genus = Semicassis
| species = faurotis
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'handle | genus = \'\'[[Photinus (beetle)|Photinus]]\'\'', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Photinus (beetle)|Photinus]]''
| species = '''''P. immigrans'''''
}}`;
		const output =
`{{Speciesbox
| genus = Photinus (beetle)
| species = immigrans
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'handle | genus = \'\'\'\'\'Semicassis\'\'\'\'\'', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = '''''Semicassis'''''
| species = '''''S. faurotis'''''
}}`;
		const output =
`{{Speciesbox
| genus = Semicassis
| species = faurotis
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'handle | genus = Adesmia (beetle)', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{taxobox
| genus = Adesmia (beetle)
| species = '''''A. cancellata'''''
}}`;
		const output =
`{{Speciesbox
| genus = Adesmia (beetle)
| species = cancellata
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'handle | species = \'\'\'\'\'S. faurotis\'\'\'\'\'', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Semicassis]]''
| species = '''''S. faurotis'''''
}}`;
		const output =
`{{Speciesbox
| genus = Semicassis
| species = faurotis
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'handle | species = \'\'\'\'\'Semicassis faurotis\'\'\'\'\'', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Semicassis]]''
| species = '''''Semicassis faurotis'''''
}}`;
		const output =
`{{Speciesbox
| genus = Semicassis
| species = faurotis
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'handle | species = \'\'L. prolixum\'\'', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Lestidium]]''
| species = ''L. prolixum''
}}`;
		const output =
`{{Speciesbox
| genus = Lestidium
| species = prolixum
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'handle |species = B. squillarum', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{taxobox
|genus = [[Bopyrus]]
|species = B. squillarum
}}`;
		const output =
`{{Speciesbox
|genus = Bopyrus
|species = squillarum
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'remove field, normal', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Lestidium]]''
| binomial = test
| species = ''L. prolixum''
}}`;
		const output =
`{{Speciesbox
| genus = Lestidium
| species = prolixum
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'remove field, template', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Lestidium]]''
| binomial = test{{Template}}
| species = ''L. prolixum''
}}`;
		const output =
`{{Speciesbox
| genus = Lestidium
| species = prolixum
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'remove field, ref', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Lestidium]]''
| binomial = test<ref>Reference</ref>
| species = ''L. prolixum''
}}`;
		const output =
`{{Speciesbox
| genus = Lestidium
| species = prolixum
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'remove field, piped wikilink', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Lestidium]]''
| binomial = [[test|123]]
| species = ''L. prolixum''
}}`;
		const output =
`{{Speciesbox
| genus = Lestidium
| species = prolixum
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'remove field, spans multiple lines', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Lestidium]]''
| binomial = [[test|123]]
456
| species = ''L. prolixum''
}}`;
		const output =
`{{Speciesbox
| genus = Lestidium
| species = prolixum
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'remove |name= if it contains the binomial name', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| name = Lestidium prolixum
| genus = ''[[Lestidium]]''
| species = ''L. prolixum''
}}`;
		const output =
`{{Speciesbox
| genus = Lestidium
| species = prolixum
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'remove |name= if it contains the italicized binomial name', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| name = ''Lestidium prolixum''
| genus = ''[[Lestidium]]''
| species = ''L. prolixum''
}}`;
		const output =
`{{Speciesbox
| genus = Lestidium
| species = prolixum
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'remove |name= if it contains a bold and italicized binomial name', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| name              = '''''Orbicula parietina'''''
| genus             = ''[[Orbicula]]''
| species           = parietina
}}`;
		const output =
`{{Speciesbox
| genus             = Orbicula
| species           = parietina
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'leave |name= alone if it contains a non-latin name', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| name = Chimpanzee
| genus = ''[[Lestidium]]''
| species = ''L. prolixum''
}}`;
		const output =
`{{Speciesbox
| name = Chimpanzee
| genus = Lestidium
| species = prolixum
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( '|species_authority= to |authority=', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Lestidium]]''
| species = ''L. prolixum''
| species_authority = Test<ref>Test2</ref>
}}`;
		const output =
`{{Speciesbox
| genus = Lestidium
| species = prolixum
| authority = Test<ref>Test2</ref>
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( '|binomial_authority= to |authority=', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Lestidium]]''
| species = ''L. prolixum''
| binomial_authority = Test<ref>Test2</ref>
}}`;
		const output =
`{{Speciesbox
| genus = Lestidium
| species = prolixum
| authority = Test<ref>Test2</ref>
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'handle binomial and genus but no species', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| binomial = '''''Orbicula parietina'''''
| genus = ''[[Orbicula]]''
}}`;
		const output =
`{{Speciesbox
| genus = Orbicula
| species = parietina
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'handle extinct species', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Asio]]''
| species ={{extinct}}'''''Asio ecuadoriensis'''''
}}`;
		const output =
`{{Speciesbox
| extinct = yes
| genus = Asio
| species =ecuadoriensis
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'Don\'t end up with two |authority= parameters', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Alterococcus]]''
| species = '''''Alterococcus agarolyticus'''''
| binomial_authority = X
| authority  = 
}}`;
		const output =
`{{Speciesbox
| genus = Alterococcus
| species = agarolyticus
| authority = X
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'Delete blank parameters', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| name = 
| image =
| image_caption =
| genus = ''[[Alterococcus]]''
| species = '''''Alterococcus agarolyticus'''''
}}`;
		const output =
`{{Speciesbox
| genus = Alterococcus
| species = agarolyticus
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'Don\'t delete multi-line parameters that look blank on the first line', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = ''[[Meterana]]''
| species = '''''M. alcyone'''''
| synonyms = 
{{Specieslist
|Melanchra alcyone|Hudson, 1898 
}}
| synonyms_ref =<ref name="Dugdale1988" />
}}`;
		const output =
`{{Speciesbox
| genus = Meterana
| species = alcyone
| synonyms = 
{{Specieslist
|Melanchra alcyone|Hudson, 1898 
}}
| synonyms_ref =<ref name="Dugdale1988" />
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'Handle piped wikilink followed by blank parameter', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox 
| genus = ''[[Acnodon]]''
| species = ''A. normani''
| binomial_authority = [[William Alonzo Gosline III|Gosline]], 1951
| synonyms = 
}}`;
		const output =
`{{Speciesbox 
| genus = Acnodon
| species = normani
| authority = [[William Alonzo Gosline III|Gosline]], 1951
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'Handle whitespace after genus and species', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox 
| genus = ''[[Acnodon]]''  
| species = ''A. normani''  
| binomial_authority = [[William Alonzo Gosline III|Gosline]], 1951
| synonyms = 
}}`;
		const output =
`{{Speciesbox 
| genus = Acnodon
| species = normani
| authority = [[William Alonzo Gosline III|Gosline]], 1951
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'Handle bold inside wikilink in species and name', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| name              = [[''Epipremnum moszkowskii'']]
| regnum            = [[Plantae]]
| divisio           = [[Tracheophyta]]
| classis           = [[Liliopsida]]
| ordo              = [[Alismatales]]
| familia           = [[Araceae]]
| genus             = [[Epipremnum]]
| species           = [['''E. moszkowskii''']]
| binomial          = [['''Epipremnum moszkowskii''']]
}}`;
		const output =
`{{Speciesbox
| genus             = Epipremnum
| species           = moszkowskii
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'Handle dagger', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = †''[[Thylacoleo]]''
| species = †'''''T. crassidentatus'''''
}}`;
		const output =
`{{Speciesbox
| extinct = yes
| genus = Thylacoleo
| species = crassidentatus
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'Don\'t mark it extinct twice', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus = †''[[Thylacoleo]]''
| species = †'''''T. crassidentatus'''''
| extinct = yes
}}`;
		const output =
`{{Speciesbox
| genus = Thylacoleo
| species = crassidentatus
| extinct = yes
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'Handle {{Specieslist}}', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| image = 
| image_caption = 
| regnum = [[Animal]]ia
| phylum = [[Arthropod]]a
| classis = [[Insect]]a
| ordo = [[Lepidoptera]]
| familia = [[Carposinidae]]
| genus = ''[[Heterocrossa]]''
| species = '''''H. sarcanthes'''''
| binomial = ''Heterocrossa sarcanthes''
| binomial_authority = ([[Edward Meyrick|Meyrick]], 1918)
| synonyms =
{{Specieslist
|Carposina sarcanthes|Meyrick, 1918
}}
|synonyms_ref = 
}}`;
		const output =
`{{Speciesbox
| genus = Heterocrossa
| species = sarcanthes
| authority = ([[Edward Meyrick|Meyrick]], 1918)
| synonyms =
{{Specieslist
|Carposina sarcanthes|Meyrick, 1918
}}
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'Handle wikilinked one-word species', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| ordo = [[Hymenoptera]]
| familia = [[Formicidae]]
| genus = [[Strumigenys]]
| species = [[moreauviae]]
| subfamilia = [[Myrmicinae]]
}}`;
		const output =
`{{Speciesbox
| genus = Strumigenys
| species = moreauviae
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );

	test( 'Handle parameter = , enter, bulleted list', () => {
		const sb = new ConvertToSpeciesBox();
		const wikicode =
`{{Taxobox
| genus =  [[Hemipenthes]]
| species = '''''H. maurus'''''
| binomial =''Hemipenthes maurus''
| binomial_authority = ([[Carl Linnaeus|Linnaeus]], [[10th edition of Systema Naturae|1758]])
| synonyms = 
*''Musca maura'' Linnaeus, 1758<ref> C. Linnaeus: Systema naturae per regna tria naturae, secundum classes, ordines, genera, species, cum characteribus, differentiis, synonymis, locis. Wyd. 10. T. 1. Holmiae: Impensis Direct. Laurentii Salvii, 1758, s. 590. (łac.)</ref>
*''Anthrax bifasciata'' Meigen, 1804<ref name=GBIF/>
*''Anthrax daemon'' Panzer, 1797
*''Anthrax relata'' Walker, 1852
*''Anthrax uncinus'' Loew, 1869
*''Hemipenthes flavotomentosa'' Paramonov, 1927
*''Musca denigrata'' Linnaeus, 1767
*''Nemotelus maurus'' De Geer, 1776
}}`;
		const output =
`{{Speciesbox
| genus =  Hemipenthes
| species = maurus
| authority = ([[Carl Linnaeus|Linnaeus]], [[10th edition of Systema Naturae|1758]])
| synonyms = 
*''Musca maura'' Linnaeus, 1758<ref> C. Linnaeus: Systema naturae per regna tria naturae, secundum classes, ordines, genera, species, cum characteribus, differentiis, synonymis, locis. Wyd. 10. T. 1. Holmiae: Impensis Direct. Laurentii Salvii, 1758, s. 590. (łac.)</ref>
*''Anthrax bifasciata'' Meigen, 1804<ref name=GBIF/>
*''Anthrax daemon'' Panzer, 1797
*''Anthrax relata'' Walker, 1852
*''Anthrax uncinus'' Loew, 1869
*''Hemipenthes flavotomentosa'' Paramonov, 1927
*''Musca denigrata'' Linnaeus, 1767
*''Nemotelus maurus'' De Geer, 1776
}}`;
		expect( sb.convert( wikicode ) ).toBe( output );
	} );
} );

describe( '_removeBlankParametersFromFirstTemplate(templateName, wikicode)', () => {
	test( 'Normal', () => {
		const sb = new ConvertToSpeciesBox();
		const templateName = 'speciesbox';
		const wikicode =
`{{Speciesbox
|test=not_blank
|test2=
}}`;
		const output =
`{{Speciesbox
|test=not_blank
}}`;
		expect( sb._removeBlankParametersFromFirstTemplate( templateName, wikicode ) ).toStrictEqual( output );
	} );

	test( 'Same line', () => {
		const sb = new ConvertToSpeciesBox();
		const templateName = 'speciesbox';
		const wikicode =
`{{Speciesbox
|test=not_blank|test2=|test3=not_blank
}}`;
		const output =
`{{Speciesbox
|test=not_blank|test3=not_blank
}}`;
		expect( sb._removeBlankParametersFromFirstTemplate( templateName, wikicode ) ).toStrictEqual( output );
	} );

	test( 'Same line, spaces', () => {
		const sb = new ConvertToSpeciesBox();
		const templateName = 'speciesbox';
		const wikicode =
`{{Speciesbox
 | test=not_blank | test2 = | test3=not_blank
}}`;
		const output =
`{{Speciesbox
 | test=not_blank | test3=not_blank
}}`;
		expect( sb._removeBlankParametersFromFirstTemplate( templateName, wikicode ) ).toStrictEqual( output );
	} );

	test( 'Nested templates', () => {
		const sb = new ConvertToSpeciesBox();
		const templateName = 'speciesbox';
		const wikicode =
`{{Speciesbox
| blank = 
| binomial_authority = ([[Edward Meyrick|Meyrick]], 1918)
| synonyms =
{{Specieslist
|Carposina sarcanthes|Meyrick, 1918
}}
|synonyms_ref = 
}}`;
		const output =
`{{Speciesbox
| binomial_authority = ([[Edward Meyrick|Meyrick]], 1918)
| synonyms =
{{Specieslist
|Carposina sarcanthes|Meyrick, 1918
}}
}}`;
		expect( sb._removeBlankParametersFromFirstTemplate( templateName, wikicode ) ).toStrictEqual( output );
	} );
} );

describe( '_isolateFirstTemplate(needle, haystack)', () => {
	test( 'Beginning', () => {
		const sb = new ConvertToSpeciesBox();
		const needle = 'speciesbox';
		const haystack = '{{Speciesbox hello}} test.';
		const output = [ '', '{{Speciesbox hello}}', ' test.' ];
		expect( sb._isolateFirstTemplate( needle, haystack ) ).toStrictEqual( output );
	} );

	test( 'Middle', () => {
		const sb = new ConvertToSpeciesBox();
		const needle = 'speciesbox';
		const haystack = 'Test {{Speciesbox hello}} test.';
		const output = [ 'Test ', '{{Speciesbox hello}}', ' test.' ];
		expect( sb._isolateFirstTemplate( needle, haystack ) ).toStrictEqual( output );
	} );

	test( 'End', () => {
		const sb = new ConvertToSpeciesBox();
		const needle = 'speciesbox';
		const haystack = 'Test {{Speciesbox hello}}';
		const output = [ 'Test ', '{{Speciesbox hello}}', '' ];
		expect( sb._isolateFirstTemplate( needle, haystack ) ).toStrictEqual( output );
	} );

	test( 'Not found', () => {
		const sb = new ConvertToSpeciesBox();
		const needle = 'blahblah';
		const haystack = 'Test {{Speciesbox hello}} test.';
		const output = [ 'Test {{Speciesbox hello}} test.', '', '' ];
		expect( sb._isolateFirstTemplate( needle, haystack ) ).toStrictEqual( output );
	} );

	test( 'Nested', () => {
		const sb = new ConvertToSpeciesBox();
		const needle = 'speciesbox';
		const haystack =
`{{Speciesbox
| genus = Heterocrossa
| species = sarcanthes
| authority = ([[Edward Meyrick|Meyrick]], 1918)
| synonyms =
{{Specieslist
|Carposina sarcanthes|Meyrick, 1918
}}
}}`;
		const output = [
			'',
			// eslint-disable-next-line indent
`{{Speciesbox
| genus = Heterocrossa
| species = sarcanthes
| authority = ([[Edward Meyrick|Meyrick]], 1918)
| synonyms =
{{Specieslist
|Carposina sarcanthes|Meyrick, 1918
}}
}}`,
			'' ];
		expect( sb._isolateFirstTemplate( needle, haystack ) ).toStrictEqual( output );
	} );
} );

describe( '_indexOfCaseInsensitive(needle, haystack)', () => {
	test( 'same case', () => {
		const sb = new ConvertToSpeciesBox();
		const needle = 'Speciesbox';
		const haystack = 'Test {{Speciesbox hello}} test.';
		const output = 7;
		expect( sb._indexOfCaseInsensitive( needle, haystack ) ).toEqual( output );
	} );

	test( 'different case', () => {
		const sb = new ConvertToSpeciesBox();
		const needle = 'speciesbox';
		const haystack = 'Test {{Speciesbox hello}} test.';
		const output = 7;
		expect( sb._indexOfCaseInsensitive( needle, haystack ) ).toEqual( output );
	} );

	test( 'not found', () => {
		const sb = new ConvertToSpeciesBox();
		const needle = 'blahblah';
		const haystack = 'Test {{Speciesbox hello}} test.';
		const output = -1;
		expect( sb._indexOfCaseInsensitive( needle, haystack ) ).toEqual( output );
	} );
} );
