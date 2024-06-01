import { DraftCleaner } from '../modules/DraftCleaner.js';

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

const dc = new DraftCleaner();

describe( '_escapeRegEx(string)', () => {
	test( '', () => {
		const string = '{|}';
		const output = '\\{\\|\\}'; // backslash is always escaped in JavaScript. so actual output is 1 backslash each, but we have to do 2 backshashes here
		expect( dc._escapeRegEx( string ) ).toBe( output );
	} );
} );

describe( 'addReferencesSectionIfMissing(wikicode)', () => {
	test( 'Blank', () => {
		const wikicode = '';
		const output =
`

== References ==
{{Reflist}}`;
		expect( dc.addReferencesSectionIfMissing( wikicode ) ).toBe( output );
	} );

	test( 'Reference section present, so add nothing', () => {
		const wikicode = '== References ==';
		const output = '== References ==';
		expect( dc.addReferencesSectionIfMissing( wikicode ) ).toBe( output );
	} );

	test( '{{Reflist}} present, so add nothing', () => {
		const wikicode = '{{Reflist}}';
		const output = '{{Reflist}}';
		expect( dc.addReferencesSectionIfMissing( wikicode ) ).toBe( output );
	} );

	test( '{{reflist}} present, so add nothing', () => {
		const wikicode = '{{reflist}}';
		const output = '{{reflist}}';
		expect( dc.addReferencesSectionIfMissing( wikicode ) ).toBe( output );
	} );

	test( '<references /> present, so add nothing', () => {
		const wikicode = '<references />';
		const output = '<references />';
		expect( dc.addReferencesSectionIfMissing( wikicode ) ).toBe( output );
	} );

	test.skip( '{{Drafts moved from mainspace}} should be at bottom of page', () => {
		const wikicode =
`Text

{{Drafts moved from mainspace|date=December 2021}}`;
		const output =
`Text

== References ==
{{Reflist}}

{{Drafts moved from mainspace|date=December 2021}}`;
		expect( dc.addReferencesSectionIfMissing( wikicode ) ).toBe( output );
	} );

	test.skip( '{{Uncategorized}} should be at bottom of page', () => {
		const wikicode =
`Text

{{Uncategorized|date=December 2021}}`;
		const output =
`Text

== References ==
{{Reflist}}

{{Uncategorized|date=December 2021}}`;
		expect( dc.addReferencesSectionIfMissing( wikicode ) ).toBe( output );
	} );

	test.skip( '<references/> with no == References ==', () => {
		const wikicode =
`Siblings with 46X,Y [[gonadal dysgenesis]], a disorder of [[sex development]], had a deletion of 8 of the 9 c2orf80 [[Exon|exons]], and an interstitial duplication of the [[SUPT3H]] gene.<ref name=":10" /> Both mutations were inherited from the healthy mother.<ref name=":10" /> There is no known interaction between these two genes as of now.<ref name=":10" />

<references />
`;
		const output =
`Siblings with 46X,Y [[gonadal dysgenesis]], a disorder of [[sex development]], had a deletion of 8 of the 9 c2orf80 [[Exon|exons]], and an interstitial duplication of the [[SUPT3H]] gene.<ref name=":10" /> Both mutations were inherited from the healthy mother.<ref name=":10" /> There is no known interaction between these two genes as of now.<ref name=":10" />

== Reflist ==
<references />`;
		expect( dc.addReferencesSectionIfMissing( wikicode ) ).toBe( output );
	} );

	test.skip( 'Place above {{stub}} tag', () => {
		const wikicode =
`'''Calderwood''' is a suburb of [[East Calder]], [[Livingston]], in [[West Lothian]].

{{WestLothian-geo-stub}}
[[Category:Populated places in West Lothian]]
[[Category:Livingston, West Lothian]]`;
		const output =
`'''Calderwood''' is a suburb of [[East Calder]], [[Livingston]], in [[West Lothian]].

== References ==
{{Reflist}}

{{WestLothian-geo-stub}}
[[Category:Populated places in West Lothian]]
[[Category:Livingston, West Lothian]]`;
		expect( dc.addReferencesSectionIfMissing( wikicode ) ).toBe( output );
	} );
} );

describe( 'fixEmptyReferencesSection(wikicode)', () => {
	test( 'Blank', () => {
		const wikicode = '';
		const output = '';
		expect( dc.fixEmptyReferencesSection( wikicode ) ).toBe( output );
	} );

	test( 'Reference section present, so add {{Reflist}}', () => {
		const wikicode = '== References ==';
		const output =
`== References ==
{{Reflist}}`;
		expect( dc.fixEmptyReferencesSection( wikicode ) ).toBe( output );
	} );

	test( '{{Reflist}} present, so add nothing', () => {
		const wikicode =
`== References ==
{{Reflist}}`;
		const output =
`== References ==
{{Reflist}}`;
		expect( dc.fixEmptyReferencesSection( wikicode ) ).toBe( output );
	} );

	test( '{{reflist}} present, so add nothing', () => {
		const wikicode =
`== References ==
{{reflist}}`;
		const output =
`== References ==
{{reflist}}`;
		expect( dc.fixEmptyReferencesSection( wikicode ) ).toBe( output );
	} );

	test( '<references /> present, so add nothing', () => {
		const wikicode =
`== References ==
<references />`;
		const output =
`== References ==
<references />`;
		expect( dc.fixEmptyReferencesSection( wikicode ) ).toBe( output );
	} );

	test( 'Recognize {{Reflist}} with parameters 1', () => {
		const wikicode =
`== References ==
{{Reflist|30em}}`;
		const output =
`== References ==
{{Reflist|30em}}`;
		expect( dc.fixEmptyReferencesSection( wikicode ) ).toBe( output );
	} );

	test( 'Recognize {{Reflist}} with parameters 2', () => {
		const wikicode =
`== References ==
{{Reflist|colwidth=30em}}`;
		const output =
`== References ==
{{Reflist|colwidth=30em}}`;
		expect( dc.fixEmptyReferencesSection( wikicode ) ).toBe( output );
	} );

	test( 'Recognize {{Reflist}} with parameters 3', () => {
		const wikicode =
`== References ==
{{reflist|
<ref>Zhang DC, Liu YX, Huang HJ, Weber K, Margesin R. ''Oceanihabitans sediminis''</ref>}}`;
		const output =
`== References ==
{{reflist|
<ref>Zhang DC, Liu YX, Huang HJ, Weber K, Margesin R. ''Oceanihabitans sediminis''</ref>}}`;
		expect( dc.fixEmptyReferencesSection( wikicode ) ).toBe( output );
	} );
} );

/*
describe('deleteBRTagsOutsideInfoboxes(wikicode)', () => {
	test("Normal", () => {
		let wikicode = `Testing<br />123`;
		let output = `Testing123`;
		expect(dc.deleteBRTagsOutsideInfoboxes(wikicode)).toBe(output);
	});

	test("Don't delete <br> from image captions", () => {
		let wikicode = `[[File:Longstreet at Gettysburg.tif|upright=1.2|right|thumb|Longstreet at Gettysburg<br>{{circa}} 1900]]`;
		let output = `[[File:Longstreet at Gettysburg.tif|upright=1.2|right|thumb|Longstreet at Gettysburg<br>{{circa}} 1900]]`;
		expect(dc.deleteBRTagsOutsideInfoboxes(wikicode)).toBe(output);
	});

	test("Don't delete <br> from infoboxes - simple", () => {
		let wikicode = `| genre                    = [[Science Fiction]]<br>[[Romance film|Romance]]<br>[[Comedy]]<br>[[Time travel]]`;
		let output = `| genre                    = [[Science Fiction]]<br>[[Romance film|Romance]]<br>[[Comedy]]<br>[[Time travel]]`;
		expect(dc.deleteBRTagsOutsideInfoboxes(wikicode)).toBe(output);
	});

	test("Don't delete <br> from infoboxes - complicated", () => {
		let wikicode =
`{{Automatic taxobox
| subdivision =
''[[Great albatross|Diomedea]]''<br />
''[[Thalassarche]]''<br />
''[[North Pacific albatross|Phoebastria]]''<br />
''[[Phoebetria]]''<br />
{{extinct}}''[[Tydea]]''<br />
{{extinct}}''[[Plotornis]]''<br />
{{extinct}}''[[Diomedavus]]''<br />
{{extinct}}''[[Aldiomedes]]''<br />
}}`;
		let output =
`{{Automatic taxobox
| subdivision =
''[[Great albatross|Diomedea]]''<br />
''[[Thalassarche]]''<br />
''[[North Pacific albatross|Phoebastria]]''<br />
''[[Phoebetria]]''<br />
{{extinct}}''[[Tydea]]''<br />
{{extinct}}''[[Plotornis]]''<br />
{{extinct}}''[[Diomedavus]]''<br />
{{extinct}}''[[Aldiomedes]]''<br />
}}`;
		expect(dc.deleteBRTagsOutsideInfoboxes(wikicode)).toBe(output);
	});
});
*/

describe( 'replaceUnicodeBulletsWithAsterisks(wikicode)', () => {
	test( 'small bullet', () => {
		const wikicode = '· [[Ecology]]';
		const output = '* [[Ecology]]';
		expect( dc.replaceUnicodeBulletsWithAsterisks( wikicode ) ).toBe( output );
	} );

	test( 'medium bullet', () => {
		const wikicode = '• [[Ecology]]';
		const output = '* [[Ecology]]';
		expect( dc.replaceUnicodeBulletsWithAsterisks( wikicode ) ).toBe( output );
	} );

	test( 'big bullet', () => {
		const wikicode = '● [[Ecology]]';
		const output = '* [[Ecology]]';
		expect( dc.replaceUnicodeBulletsWithAsterisks( wikicode ) ).toBe( output );
	} );
} );

describe( 'deleteCopyPastedEditAndEditSource(wikicode)', () => {
	test( '[editar]', () => {
		const wikicode = '=== The travel[editar] ===';
		const output = '=== The travel ===';
		expect( dc.deleteCopyPastedEditAndEditSource( wikicode ) ).toBe( output );
	} );
} );

describe( 'trimEveryLine(wikicode)', () => {
	test( '', () => {
		const wikicode =
`  test  
 TEST 
`;
		const output =
`test
TEST
`;
		expect( dc.trimEveryLine( wikicode ) ).toBe( output );
	} );

	test( 'Don\'t trim lines inside of templates', () => {
		const wikicode =
`* {{cite book
  | last = Jane's Information Group
  | year = 1989
  | orig-year = 1946/47
  | title = Jane's Fighting Ships of World War II
  | publisher = Studio Editions
  | location = London
  | isbn = 978-1-85170-194-0
  }}`;
		const output =
`* {{cite book
  | last = Jane's Information Group
  | year = 1989
  | orig-year = 1946/47
  | title = Jane's Fighting Ships of World War II
  | publisher = Studio Editions
  | location = London
  | isbn = 978-1-85170-194-0
  }}`;
		expect( dc.trimEveryLine( wikicode ) ).toBe( output );
	} );
} );

describe( 'convertSmartQuotesToRegularQuotes(wikicode)', () => {
	test( 'Normal', () => {
		const wikicode = 'The Wang’s hybrid EDL model and the “two-step” processes about its formation';
		const output = 'The Wang\'s hybrid EDL model and the "two-step" processes about its formation';
		expect( dc.convertSmartQuotesToRegularQuotes( wikicode ) ).toBe( output );
	} );

	test( "Don't convert inside [[File:]] links (images)", () => {
		const wikicode = '[[File:The Wang’s hybrid EDL model and the “two-step” processes about its formation.jpg|thumb|Figure 1.]]';
		const output = '[[File:The Wang’s hybrid EDL model and the “two-step” processes about its formation.jpg|thumb|Figure 1.]]';
		expect( dc.convertSmartQuotesToRegularQuotes( wikicode ) ).toBe( output );
	} );
} );

describe( 'convertVeryLongHeadingToParagraph(wikicode)', () => {
	test( 'Normal heading', () => {
		const wikicode =
`Test

== Hello how are you ==

Test2`;
		const output =
`Test

== Hello how are you ==

Test2`;
		expect( dc.convertVeryLongHeadingToParagraph( wikicode ) ).toBe( output );
	} );

	test( 'Heading is too long', () => {
		const wikicode = '=== \'\'\'Dakkata Jaya Prakash Reddy\'\'\' (Born on April 13 1985) Is Andhra Pradesh Based Indian NRI Politician from Hindu Community Living in Singapore for the past 15 years .. Himself an down to earth , passional of social service through various helping & Charity activities for people in his regions he particularly focused to light...He\'s been Prominent  leader from well known political organization  Yuvajana sramika Raithu Congress party (YSRCP) from india .. ===';
		const output = '\'\'\'Dakkata Jaya Prakash Reddy\'\'\' (Born on April 13 1985) Is Andhra Pradesh Based Indian NRI Politician from Hindu Community Living in Singapore for the past 15 years .. Himself an down to earth , passional of social service through various helping & Charity activities for people in his regions he particularly focused to light...He\'s been Prominent  leader from well known political organization  Yuvajana sramika Raithu Congress party (YSRCP) from india ..';
		expect( dc.convertVeryLongHeadingToParagraph( wikicode ) ).toBe( output );
	} );

	test( 'Skip long heading if it has <ref>', () => {
		const wikicode = '==== Special Administrative Measures for Foreign Investment Access to Hainan Free Trade Port (Negative List) (2020 Edition)<ref>{{Cite web|title=Special Administrative Measures for Foreign Investment Access to Hainan Free Trade Port (Negative List) -- Investment -- HAINAN FREE TRADE PORT|url=http://en.hnftp.gov.cn/policies/Investment/202102/t20210226_3314716.html|access-date=2021-12-06|website=Made-in-China.com}}</ref> ====';
		const output = '==== Special Administrative Measures for Foreign Investment Access to Hainan Free Trade Port (Negative List) (2020 Edition)<ref>{{Cite web|title=Special Administrative Measures for Foreign Investment Access to Hainan Free Trade Port (Negative List) -- Investment -- HAINAN FREE TRADE PORT|url=http://en.hnftp.gov.cn/policies/Investment/202102/t20210226_3314716.html|access-date=2021-12-06|website=Made-in-China.com}}</ref> ====';
		expect( dc.convertVeryLongHeadingToParagraph( wikicode ) ).toBe( output );
	} );

	test( 'Skip long heading if it has <ref> 2', () => {
		const wikicode = '=== Counterculture<ref>{{Cite journal|last=Khabuliani|first=Khatuna|date=2016|title=ვიზუალური ნიშნების ტრანსფორმაცია: მხატვრული ფორმები და კონცეფციები პოსტმოდერნისტული ხელოვნების ქართულ ვერსიაში|url=http://eprints.iliauni.edu.ge/6601/1/%E1%83%AE%E1%83%90%E1%83%97%E1%83%A3%E1%83%9C%E1%83%90%20%E1%83%AE%E1%83%90%E1%83%91%E1%83%A3%E1%83%9A%E1%83%98%E1%83%90%E1%83%9C%E1%83%98.pdf|journal=http://eprints.iliauni.edu.ge/6601/1/%E1%83%AE%E1%83%90%E1%83%97%E1%83%A3%E1%83%9C%E1%83%90%20%E1%83%AE%E1%83%90%E1%83%91%E1%83%A3%E1%83%9A%E1%83%98%E1%83%90%E1%83%9C%E1%83%98.pdf}}</ref> ===';
		const output = '=== Counterculture<ref>{{Cite journal|last=Khabuliani|first=Khatuna|date=2016|title=ვიზუალური ნიშნების ტრანსფორმაცია: მხატვრული ფორმები და კონცეფციები პოსტმოდერნისტული ხელოვნების ქართულ ვერსიაში|url=http://eprints.iliauni.edu.ge/6601/1/%E1%83%AE%E1%83%90%E1%83%97%E1%83%A3%E1%83%9C%E1%83%90%20%E1%83%AE%E1%83%90%E1%83%91%E1%83%A3%E1%83%9A%E1%83%98%E1%83%90%E1%83%9C%E1%83%98.pdf|journal=http://eprints.iliauni.edu.ge/6601/1/%E1%83%AE%E1%83%90%E1%83%97%E1%83%A3%E1%83%9C%E1%83%90%20%E1%83%AE%E1%83%90%E1%83%91%E1%83%A3%E1%83%9A%E1%83%98%E1%83%90%E1%83%9C%E1%83%98.pdf}}</ref> ===';
		expect( dc.convertVeryLongHeadingToParagraph( wikicode ) ).toBe( output );
	} );
} );

describe( 'ifNoLeadSectionDeleteFirstHeading(wikicode)', () => {
	test( 'No change', () => {
		const wikicode =
`{{AfC submission|t||ts=20211206092825|u=MherSaribekyan|ns=118|demo=}}<!-- Important, do not remove this line before article has been created. -->

The United Nations have promoted human

== ''Introduction. What are Human Rights?'' ==

The United Nations have promoted human`;
		const output =
`{{AfC submission|t||ts=20211206092825|u=MherSaribekyan|ns=118|demo=}}<!-- Important, do not remove this line before article has been created. -->

The United Nations have promoted human

== ''Introduction. What are Human Rights?'' ==

The United Nations have promoted human`;
		expect( dc.ifNoLeadSectionDeleteFirstHeading( wikicode ) ).toBe( output );
	} );

	test( 'One template', () => {
		const wikicode =
`{{AfC submission|t||ts=20211206092825|u=MherSaribekyan|ns=118|demo=}}<!-- Important, do not remove this line before article has been created. -->

== ''Introduction. What are Human Rights?'' ==
The United Nations have promoted human`;
		const output =
`{{AfC submission|t||ts=20211206092825|u=MherSaribekyan|ns=118|demo=}}<!-- Important, do not remove this line before article has been created. -->

The United Nations have promoted human`;
		expect( dc.ifNoLeadSectionDeleteFirstHeading( wikicode ) ).toBe( output );
	} );

	test( '5 templates', () => {
		const wikicode =
`{{Short description|Artsakh War Crimes}}
{{Draft topics|politics-and-government}}
{{AfC topic|soc}}
{{AfC submission|||ts=20211206093209|u=MherSaribekyan|ns=118}}
{{AfC submission|t||ts=20211206092825|u=MherSaribekyan|ns=118|demo=}}<!-- Important, do not remove this line before article has been created. -->

== ''Introduction. What are Human Rights?'' ==
The United Nations have promoted human`;
		const output =
`{{Short description|Artsakh War Crimes}}
{{Draft topics|politics-and-government}}
{{AfC topic|soc}}
{{AfC submission|||ts=20211206093209|u=MherSaribekyan|ns=118}}
{{AfC submission|t||ts=20211206092825|u=MherSaribekyan|ns=118|demo=}}<!-- Important, do not remove this line before article has been created. -->

The United Nations have promoted human`;
		expect( dc.ifNoLeadSectionDeleteFirstHeading( wikicode ) ).toBe( output );
	} );

	test( 'Image', () => {
		const wikicode =
`[[File:Doppler Broadening.gif|thumb|Example of Doppler shifting due to source motion.]]
== ''Introduction. What are Human Rights?'' ==
The United Nations have promoted human`;
		const output =
`[[File:Doppler Broadening.gif|thumb|Example of Doppler shifting due to source motion.]]
The United Nations have promoted human`;
		expect( dc.ifNoLeadSectionDeleteFirstHeading( wikicode ) ).toBe( output );
	} );

	test( 'Two headings, should delete both', () => {
		const wikicode =
`== Compile-Back Programming Languages ==

=== '''What is a 'Compile-Back' Programming Language?''' ===
A 'Compile-Back' programming language`;
		const output =
`
A 'Compile-Back' programming language`;
		expect( dc.ifNoLeadSectionDeleteFirstHeading( wikicode ) ).toBe( output );
	} );
} );

/*
describe('fixWordEmphasizedWithSingleQuotes(wikicode)', () => {
	test('Single word', () => {
		let wikicode = `In 2016, Tamayo participated in a 'hackathon' meeting`;
		let output = `In 2016, Tamayo participated in a "hackathon" meeting`;
		expect(dc.fixWordEmphasizedWithSingleQuotes(wikicode)).toBe(output);
	});

	test(`Don't fix if inside double quotes`, () => {
		let wikicode = `Ruiz said, "there's no distinction between 'quality' and 'tabloid' newspapers, or between 'popular' and 'serious' television."`;
		let output = `Ruiz said, "there's no distinction between 'quality' and 'tabloid' newspapers, or between 'popular' and 'serious' television."`;
		expect(dc.fixWordEmphasizedWithSingleQuotes(wikicode)).toBe(output);
	});
});
*/

describe( 'inlineExternalLinksToRefs(wikicode)', () => {
	test( 'Normal', () => {
		const wikicode = 'In 2016, [http://www.tamayo.com/ Tamayo] participated in a \'hackathon\' meeting';
		const output = 'In 2016, Tamayo<ref>http://www.tamayo.com/</ref> participated in a \'hackathon\' meeting';
		expect( dc.inlineExternalLinksToRefs( wikicode ) ).toBe( output );
	} );

	test( 'Skip external links inside <ref>s', () => {
		const wikicode = '<ref> World Cat [https://www.worldcat.org/title/they-all-played-ragtime/oclc/593173 "They All Played Ragtime"]. Accessed, July, 2021. </ref>';
		const output = '<ref> World Cat [https://www.worldcat.org/title/they-all-played-ragtime/oclc/593173 "They All Played Ragtime"]. Accessed, July, 2021. </ref>';
		expect( dc.inlineExternalLinksToRefs( wikicode ) ).toBe( output );
	} );

	test( 'Skip external links inside templates 1', () => {
		const wikicode = '{{efn|name=SahrOSU1871InflationCalculation|This inflation adjustment calculation uses data from [http://oregonstate.edu/cla/polisci/sahr/sahr "Inflation Conversion Factors for years 1774 to estimated 2023, in dollars of recent years"].}}';
		const output = '{{efn|name=SahrOSU1871InflationCalculation|This inflation adjustment calculation uses data from [http://oregonstate.edu/cla/polisci/sahr/sahr "Inflation Conversion Factors for years 1774 to estimated 2023, in dollars of recent years"].}}';
		expect( dc.inlineExternalLinksToRefs( wikicode ) ).toBe( output );
	} );

	test( 'Skip external links inside templates 2', () => {
		const wikicode = '{{external media| float = right| video1 = [https://www.c-span.org/video/?462049-4/confederate-general-james-longstreet-gettysburg Presentation by Cory M. Pfarr, "Confederate General James Longstreet at Gettysburg", June 30, 2019], [[C-SPAN]]}}';
		const output = '{{external media| float = right| video1 = [https://www.c-span.org/video/?462049-4/confederate-general-james-longstreet-gettysburg Presentation by Cory M. Pfarr, "Confederate General James Longstreet at Gettysburg", June 30, 2019], [[C-SPAN]]}}';
		expect( dc.inlineExternalLinksToRefs( wikicode ) ).toBe( output );
	} );

	test( 'Skip external links inside templates 3', () => {
		const wikicode = '{{AFC comment|1=This [https://test.com/ article] uses jargon and is hard for a non-expert to read. –[[User:Novem Linguae|<span style="color:limegreen">\'\'\'Novem Linguae\'\'\'</span>]] <small>([[User talk:Novem Linguae|talk]])</small> 11:39, 14 December 2021 (UTC)}}';
		const output = '{{AFC comment|1=This [https://test.com/ article] uses jargon and is hard for a non-expert to read. –[[User:Novem Linguae|<span style="color:limegreen">\'\'\'Novem Linguae\'\'\'</span>]] <small>([[User talk:Novem Linguae|talk]])</small> 11:39, 14 December 2021 (UTC)}}';
		expect( dc.inlineExternalLinksToRefs( wikicode ) ).toBe( output );
	} );

	test( 'Skip official websites', () => {
		const wikicode = '{{infobox | website           = [http://www.kcgcollege.ac.in/ Official Website] }}';
		const output = '{{infobox | website           = [http://www.kcgcollege.ac.in/ Official Website] }}';
		expect( dc.inlineExternalLinksToRefs( wikicode ) ).toBe( output );
	} );

	test( 'Skip official websites 2', () => {
		const wikicode = '{{infobox | homepage = [https://wisebim.fr/ https://wisebim.fr] }}';
		const output = '{{infobox | homepage = [https://wisebim.fr/ https://wisebim.fr] }}';
		expect( dc.inlineExternalLinksToRefs( wikicode ) ).toBe( output );
	} );

	test( 'Skip section titled Websites', () => {
		const wikicode = `== Websites ==
https://art-innovation.org

https://social-art-award.org

https://universal-sea.org/press

https://plastic-revolution.org`;
		const output = `== Websites ==
https://art-innovation.org

https://social-art-award.org

https://universal-sea.org/press

https://plastic-revolution.org`;
		expect( dc.inlineExternalLinksToRefs( wikicode ) ).toBe( output );
	} );

	test( 'Skip section titled Links', () => {
		const wikicode =
`== Links ==

* {{official|gulkina.ru|Natalia Gulkina}}
* [http://7days.ru/Video/privatelife/natalya-gulkina-ya-s-muzhyami-ne-propadu "I will not be lost with my husbands!" Video interview <url>]
* [http://www.m24.ru/videos/88892 Natalia Gulkina - about the release of an autobiographical book (the author's program of Evgeny Dodolev "Pravda-24", 2015)]
* https://www.instagram.com/gulkina_natalia/`;
		const output =
`== Links ==

* {{official|gulkina.ru|Natalia Gulkina}}
* [http://7days.ru/Video/privatelife/natalya-gulkina-ya-s-muzhyami-ne-propadu "I will not be lost with my husbands!" Video interview <url>]
* [http://www.m24.ru/videos/88892 Natalia Gulkina - about the release of an autobiographical book (the author's program of Evgeny Dodolev "Pravda-24", 2015)]
* https://www.instagram.com/gulkina_natalia/`;
		expect( dc.inlineExternalLinksToRefs( wikicode ) ).toBe( output );
	} );
} );

describe( 'moveRefsOutsideOfItalics(wikicode)', () => {
	test( 'Ref goes outside italics, not inside', () => {
		const wikicode =
'The White House\'s [[Office of Science and Technology Policy]] released a draft \'\'Guidance for Regulation of Artificial Intelligence Applications<ref>https://www.whitehouse.gov/wp-content/uploads/2020/01/Draft-OMB-Memo-on-Regulation-of-AI-1-7-19.pdf</ref>\'\'.';
		const output =
'The White House\'s [[Office of Science and Technology Policy]] released a draft \'\'Guidance for Regulation of Artificial Intelligence Applications\'\'<ref>https://www.whitehouse.gov/wp-content/uploads/2020/01/Draft-OMB-Memo-on-Regulation-of-AI-1-7-19.pdf</ref>.';
		expect( dc.moveRefsOutsideOfItalics( wikicode ) ).toBe( output );
	} );
} );

describe( 'deleteHeadingsWithTitle(wikicode, titleWithNamespaceAndSpaces)', () => {
	test( 'Exact matches only', () => {
		const titleWithNamespaceAndSpaces = 'Albatross';
		const wikicode =
`Test

== Albatrosses and humans ==
Test2`;
		const output =
`Test

== Albatrosses and humans ==
Test2`;
		expect( dc.deleteHeadingsWithTitle( wikicode, titleWithNamespaceAndSpaces ) ).toBe( output );
	} );

	test( 'Normal', () => {
		const titleWithNamespaceAndSpaces = 'Albatross';
		const wikicode =
`Test

== Albatross ==
Test2`;
		const output =
`Test

Test2`;
		expect( dc.deleteHeadingsWithTitle( wikicode, titleWithNamespaceAndSpaces ) ).toBe( output );
	} );

	test( 'Case insensitive', () => {
		const titleWithNamespaceAndSpaces = 'Albatross';
		const wikicode =
`Test

== albatross ==
Test2`;
		const output =
`Test

Test2`;
		expect( dc.deleteHeadingsWithTitle( wikicode, titleWithNamespaceAndSpaces ) ).toBe( output );
	} );
} );

describe( 'changeYearRangeDashToNDash(wikicode)', () => {
	test( 'Normal', () => {
		const wikicode = 'George Hammell Cook (1818-1889) circa 1880';
		const output = 'George Hammell Cook (1818–1889) circa 1880';
		expect( dc.changeYearRangeDashToNDash( wikicode ) ).toBe( output );
	} );

	test( 'Skip dashes inside file names', () => {
		const wikicode = '[[File:George Hammell Cook (1818-1889) circa 1880.jpg|thumb|upright|left]]';
		const output = '[[File:George Hammell Cook (1818-1889) circa 1880.jpg|thumb|upright|left]]';
		expect( dc.changeYearRangeDashToNDash( wikicode ) ).toBe( output );
	} );
} );

describe( 'deleteSpacesInFrontOfRefs(wikicode)', () => {
	test( 'Normal', () => {
		const wikicode = 'Testing <ref name="test">.';
		const output = 'Testing<ref name="test">.';
		expect( dc.deleteSpacesInFrontOfRefs( wikicode ) ).toBe( output );
	} );

	test( 'Skip if at the start of a template cell', () => {
		const wikicode = '| style="text-align:center;" | <ref name="vgs" />';
		const output = '| style="text-align:center;" | <ref name="vgs" />';
		expect( dc.deleteSpacesInFrontOfRefs( wikicode ) ).toBe( output );
	} );

	test( 'Skip if equals sign nearby', () => {
		const wikicode = '| status_ref = <ref name=IUCN>abc</ref>';
		const output = '| status_ref = <ref name=IUCN>abc</ref>';
		expect( dc.deleteSpacesInFrontOfRefs( wikicode ) ).toBe( output );
	} );
} );

describe( 'fixDoublePeriod(wikicode)', () => {
	test( 'Two periods at end of sentence, before <ref>.', () => {
		const wikicode = 'Hello..<ref name="test" /> How are you?';
		const output = 'Hello.<ref name="test" /> How are you?';
		expect( dc.fixDoublePeriod( wikicode ) ).toBe( output );
	} );

	test( 'Two periods at end of sentence.', () => {
		const wikicode = 'Hello.. How are you?';
		const output = 'Hello. How are you?';
		expect( dc.fixDoublePeriod( wikicode ) ).toBe( output );
	} );

	test( 'Two periods between words.', () => {
		const wikicode = 'Test..test2';
		const output = 'Test..test2';
		expect( dc.fixDoublePeriod( wikicode ) ).toBe( output );
	} );

	test( 'Three periods.', () => {
		const wikicode = 'Test... can you hear me?';
		const output = 'Test... can you hear me?';
		expect( dc.fixDoublePeriod( wikicode ) ).toBe( output );
	} );

	test( 'One period.', () => {
		const wikicode = 'Test. Test.';
		const output = 'Test. Test.';
		expect( dc.fixDoublePeriod( wikicode ) ).toBe( output );
	} );

	test( 'No periods.', () => {
		const wikicode = 'Test';
		const output = 'Test';
		expect( dc.fixDoublePeriod( wikicode ) ).toBe( output );
	} );

	test( 'Wikilink', () => {
		const wikicode = '[[Test]].. Hello.';
		const output = '[[Test]]. Hello.';
		expect( dc.fixDoublePeriod( wikicode ) ).toBe( output );
	} );

	test( 'Enter', () => {
		const wikicode =
`Test..
Hello`;
		const output =
`Test.
Hello`;
		expect( dc.fixDoublePeriod( wikicode ) ).toBe( output );
	} );
} );

describe( 'deleteEmptySections(wikicode)', () => {
	test.skip( 'Big footer', () => {
		const wikicode =
`Test

==External links==

{{Authority control}}

{{DEFAULTSORT:Mabo, Gail}}

[[Category:1965 births]]
[[Category:Living people]]
[[Category:Artists from Queensland]]
[[Category:21st-century Australian women artists]]
[[Category:21st-century Australian artists]]
[[Category:Indigenous Australian artists]]`;
		const output =
`Test

{{Authority control}}

{{DEFAULTSORT:Mabo, Gail}}

[[Category:1965 births]]
[[Category:Living people]]
[[Category:Artists from Queensland]]
[[Category:21st-century Australian women artists]]
[[Category:21st-century Australian artists]]
[[Category:Indigenous Australian artists]]`;
		expect( dc.deleteEmptySections( wikicode ) ).toBe( output );
	} );

	test( 'Empty external links', () => {
		const wikicode =
`Test

== External links ==
`;
		const output = 'Test';
		expect( dc.deleteEmptySections( wikicode ) ).toBe( output );
	} );

	test( 'Empty see also', () => {
		const wikicode =
`Test

== See also ==
`;
		const output = 'Test';
		expect( dc.deleteEmptySections( wikicode ) ).toBe( output );
	} );
} );

describe( 'fixHeadingsInAllCaps(wikicode)', () => {
	test( 'Normal', () => {
		const wikicode = '== Normal ==';
		const output = '== Normal ==';
		expect( dc.fixHeadingsInAllCaps( wikicode ) ).toBe( output );
	} );

	test( 'Headings with all caps', () => {
		const wikicode = '== EVERY HEADING IS IN ALL CAPS ==';
		const output = '== Every heading is in all caps ==';
		expect( dc.fixHeadingsInAllCaps( wikicode ) ).toBe( output );
	} );

	test( 'Extra spaces in heading', () => {
		const wikicode = '== CAREER  ==';
		const output = '== Career ==';
		expect( dc.fixHeadingsInAllCaps( wikicode ) ).toBe( output );
	} );
} );

describe( 'deleteDuplicateReferencesSection(wikicode)', () => {
	test( 'Normal', () => {
		const wikicode =
`'''Test article''' is a test.

== Heading ==

Test

== References ==
{{Reflist}}`;
		const output =
`'''Test article''' is a test.

== Heading ==

Test

== References ==
{{Reflist}}`;
		expect( dc.deleteDuplicateReferencesSection( wikicode ) ).toBe( output );
	} );

	test( 'No reference section', () => {
		const wikicode = '';
		const output = '';
		expect( dc.deleteDuplicateReferencesSection( wikicode ) ).toBe( output );
	} );

	test( 'Two reference sections', () => {
		const wikicode =
`== References ==

<references />

== References ==
<!-- Inline citations added to your article will automatically display here. See en.wikipedia.org/wiki/WP:REFB for instructions on how to add citations. -->
{{reflist}}`;
		const output =
`== References ==

<references />`;
		expect( dc.deleteDuplicateReferencesSection( wikicode ) ).toBe( output );
	} );

	test( 'Two reference sections 2', () => {
		const wikicode =
`==References==
{{reflist}}
{{DEFAULTSORT:Krishen, Bal}}

:[[Category:Living people]]
:[[Category:21st-century Indian businesspeople]]
:[[Category:Indian businesspeople]]
:[[Category:Indian emigrants to the United Arab Emirates]]

== References ==
<!-- Inline citations added to your article will automatically display here. See en.wikipedia.org/wiki/WP:REFB for instructions on how to add citations. -->
{{reflist}}`;
		const output =
`== References ==
{{reflist}}
{{DEFAULTSORT:Krishen, Bal}}

:[[Category:Living people]]
:[[Category:21st-century Indian businesspeople]]
:[[Category:Indian businesspeople]]
:[[Category:Indian emigrants to the United Arab Emirates]]`;
		expect( dc.deleteDuplicateReferencesSection( wikicode ) ).toBe( output );
	} );

	test( 'Two reference sections 3', () => {
		const wikicode =
`== References ==
{{Reflist}}

== External links==

* [http://www.kcgcollege.ac.in/ kcg college of technology]
* [http://www.kcgconnect.in/ kcg college alumnies]

== References ==
<!-- Inline citations added to your article will automatically display here. See en.wikipedia.org/wiki/WP:REFB for instructions on how to add citations. -->
{{reflist}}`;
		const output =
`== References ==
{{Reflist}}

== External links==

* [http://www.kcgcollege.ac.in/ kcg college of technology]
* [http://www.kcgconnect.in/ kcg college alumnies]`;
		expect( dc.deleteDuplicateReferencesSection( wikicode ) ).toBe( output );
	} );

	test( 'Two reference sections 4', () => {
		const wikicode =
`== References ==
<references responsive="" />

== References ==
<!-- Inline citations added to your article will automatically display here. See en.wikipedia.org/wiki/WP:REFB for instructions on how to add citations. -->
{{reflist}}
`;
		const output =
`== References ==
<references responsive="" />`;
		expect( dc.deleteDuplicateReferencesSection( wikicode ) ).toBe( output );
	} );

	test( 'Two reference sections 5', () => {
		const wikicode =
`
== References                            ==
<references />



== References ==
<!-- Inline citations added to your article will automatically display here. See en.wikipedia.org/wiki/WP:REFB for instructions on how to add citations. -->
{{reflist}}
`;
		const output =
`== References ==
<references />`;
		expect( dc.deleteDuplicateReferencesSection( wikicode ) ).toBe( output );
	} );
} );

describe( 'boldArticleTitle(wikicode, titleWithNamespaceAndSpaces)', () => {
	test( 'Normal', () => {
		const titleWithNamespaceAndSpaces = 'Draft:Outback Queensland Masters';
		const wikicode =
`Outback Queensland Masters, also ...

Outback Queensland Masters series ...`;
		const output =
`'''Outback Queensland Masters''', also ...

Outback Queensland Masters series ...`;
		expect( dc.boldArticleTitle( wikicode, titleWithNamespaceAndSpaces ) ).toBe( output );
	} );

	test( 'Title then punctuation', () => {
		const titleWithNamespaceAndSpaces = 'Draft:Amrah Namig oglu Huseynli';
		const wikicode = 'Amrah Namig oglu Huseynli (October 12, 1994';
		const output = '\'\'\'Amrah Namig oglu Huseynli\'\'\' (October 12, 1994';
		expect( dc.boldArticleTitle( wikicode, titleWithNamespaceAndSpaces ) ).toBe( output );
	} );

	test( 'Don\'t bold anything if title is already bolded', () => {
		const titleWithNamespaceAndSpaces = 'Draft:Rebekah Cilia';
		const wikicode =
`'''Rebekah Cilia''' (born 25 September, 1987)

Rebekah Cilia also ...`;
		const output =
`'''Rebekah Cilia''' (born 25 September, 1987)

Rebekah Cilia also ...`;
		expect( dc.boldArticleTitle( wikicode, titleWithNamespaceAndSpaces ) ).toBe( output );
	} );

	test( 'Templates and ---- before first paragraph', () => {
		const titleWithNamespaceAndSpaces = 'Draft:Amrah Namig oglu Huseynli';
		const wikicode =
`{{AFC submission|d|v|u=Orxanqurbanli|ns=118|decliner=Novem Linguae|declinets=20211214152247|ts=20211214151730}} <!-- Do not remove this line! -->

{{AFC comment|1=Please also split this into multiple paragraphs, for readability. –[[User:Novem Linguae|<span style="color:limegreen">'''Novem Linguae'''</span>]] <small>([[User talk:Novem Linguae|talk]])</small> 15:22, 14 December 2021 (UTC)}}

----

{{Draft topics|biography|asia|military-and-warfare|society}}
{{AfC topic|bdp}}

Amrah Namig oglu Huseynli (October 12, 1994, Jalilabad district - October 26, 2020, Chanakchi) - Senior Lieutenant of the Azerbaijani Armed Forces, martyr of the Great Patriotic War.
==Life==
Amrah Huseynli was born on October 12, 1994 in the city of Jalilabad. From 2013–2017, he received higher military education at the Azerbaijan Higher Military School named after Heydar Aliyev. In 2017, he graduated from the military school with the rank of lieutenant in the specialty of "Commander of Tactical Intelligence Troops." He completed basic commando courses in the Special Forces and began serving in the Special Forces.
Military service
Amrah Huseynli has served in the Azerbaijani Armed Forces since 2017.
Amrah Huseynli, a senior lieutenant of the Azerbaijani Army, fought for the liberation of Jabrayil, Hadrut settlement, Fuzuli, and Khojavend during the Patriotic War launched by the Azerbaijani Armed Forces on September 27, 2020, to liberate the Armenian-occupied territories and restore Azerbaijan's territorial integrity. On October 26, Amrah Huseynli was martyred in the direction of Chanakchi.He was buried in Jalilabad.
According to the Order of the President of Azerbaijan, Ilham Aliyev, dated 15.12.2020, Amrah Huseynli was posthumously awarded the medal "For the Motherland" for participating in combat operations to ensure the territorial integrity of Azerbaijan and honorably performing his duties during the implementation of tasks assigned to the military unit.
According to the Order of the President of Azerbaijan, Ilham Aliyev, dated 24.06.2021, Amrah Huseynli was posthumously awarded the medal "For the Liberation of Jabrayil" for his personal courage and bravery by participating in the combat operations for the liberation of the Jabrayil region of Azerbaijan.
According to the Order of the President of Azerbaijan Ilham Aliyev dated 24.06.2021, Amrah Huseynli was posthumously awarded the medal "For the Liberation of Gubadli" for his personal courage and bravery in participating in the combat operations for the liberation of the Gubadli region of Azerbaijan.
According to the Order of the President of Azerbaijan, Ilham Aliyev, dated 24.06.2021, Amrah Huseynli was posthumously awarded the medal "For the Liberation of Kalbajar" for his personal courage and bravery by participating in the combat operations for the liberation of the Khojavend region of Azerbaijan.
According to the Order of the President of Azerbaijan Ilham Aliyev dated 24.06.2021, Amrah Huseynli was posthumously awarded the medal "For Courage" for participating in combat operations to ensure the territorial integrity of Azerbaijan and honorably performing his duties during the implementation of tasks assigned to the military unit.
Rewards
*(15.12.2020) - Medal "For the Motherland" (after his death)
*(29.12.2020) - Medal "For the liberation of Kalbajar" (posthumously)
*(24.06.2021) - Medal for the liberation of Khojavend
*(24.06.2021) - Medal for the release of Jabrayil
*(24.06.2021) - Medal for Courage
*(24.06.2021) - Medal for the release of Gubadli

== References ==
<!-- Inline citations added to your article will automatically display here. See en.wikipedia.org/wiki/WP:REFB for instructions on how to add citations. -->
{{reflist}}
`;
		const output =
`{{AFC submission|d|v|u=Orxanqurbanli|ns=118|decliner=Novem Linguae|declinets=20211214152247|ts=20211214151730}} <!-- Do not remove this line! -->

{{AFC comment|1=Please also split this into multiple paragraphs, for readability. –[[User:Novem Linguae|<span style="color:limegreen">'''Novem Linguae'''</span>]] <small>([[User talk:Novem Linguae|talk]])</small> 15:22, 14 December 2021 (UTC)}}

----

{{Draft topics|biography|asia|military-and-warfare|society}}
{{AfC topic|bdp}}

'''Amrah Namig oglu Huseynli''' (October 12, 1994, Jalilabad district - October 26, 2020, Chanakchi) - Senior Lieutenant of the Azerbaijani Armed Forces, martyr of the Great Patriotic War.
==Life==
Amrah Huseynli was born on October 12, 1994 in the city of Jalilabad. From 2013–2017, he received higher military education at the Azerbaijan Higher Military School named after Heydar Aliyev. In 2017, he graduated from the military school with the rank of lieutenant in the specialty of "Commander of Tactical Intelligence Troops." He completed basic commando courses in the Special Forces and began serving in the Special Forces.
Military service
Amrah Huseynli has served in the Azerbaijani Armed Forces since 2017.
Amrah Huseynli, a senior lieutenant of the Azerbaijani Army, fought for the liberation of Jabrayil, Hadrut settlement, Fuzuli, and Khojavend during the Patriotic War launched by the Azerbaijani Armed Forces on September 27, 2020, to liberate the Armenian-occupied territories and restore Azerbaijan's territorial integrity. On October 26, Amrah Huseynli was martyred in the direction of Chanakchi.He was buried in Jalilabad.
According to the Order of the President of Azerbaijan, Ilham Aliyev, dated 15.12.2020, Amrah Huseynli was posthumously awarded the medal "For the Motherland" for participating in combat operations to ensure the territorial integrity of Azerbaijan and honorably performing his duties during the implementation of tasks assigned to the military unit.
According to the Order of the President of Azerbaijan, Ilham Aliyev, dated 24.06.2021, Amrah Huseynli was posthumously awarded the medal "For the Liberation of Jabrayil" for his personal courage and bravery by participating in the combat operations for the liberation of the Jabrayil region of Azerbaijan.
According to the Order of the President of Azerbaijan Ilham Aliyev dated 24.06.2021, Amrah Huseynli was posthumously awarded the medal "For the Liberation of Gubadli" for his personal courage and bravery in participating in the combat operations for the liberation of the Gubadli region of Azerbaijan.
According to the Order of the President of Azerbaijan, Ilham Aliyev, dated 24.06.2021, Amrah Huseynli was posthumously awarded the medal "For the Liberation of Kalbajar" for his personal courage and bravery by participating in the combat operations for the liberation of the Khojavend region of Azerbaijan.
According to the Order of the President of Azerbaijan Ilham Aliyev dated 24.06.2021, Amrah Huseynli was posthumously awarded the medal "For Courage" for participating in combat operations to ensure the territorial integrity of Azerbaijan and honorably performing his duties during the implementation of tasks assigned to the military unit.
Rewards
*(15.12.2020) - Medal "For the Motherland" (after his death)
*(29.12.2020) - Medal "For the liberation of Kalbajar" (posthumously)
*(24.06.2021) - Medal for the liberation of Khojavend
*(24.06.2021) - Medal for the release of Jabrayil
*(24.06.2021) - Medal for Courage
*(24.06.2021) - Medal for the release of Gubadli

== References ==
<!-- Inline citations added to your article will automatically display here. See en.wikipedia.org/wiki/WP:REFB for instructions on how to add citations. -->
{{reflist}}
`;
		expect( dc.boldArticleTitle( wikicode, titleWithNamespaceAndSpaces ) ).toBe( output );
	} );

	test( 'Edge case 3', () => {
		const titleWithNamespaceAndSpaces = 'Draft:MICIMATT';
		const wikicode =
`{{AFC submission|d|v|u=Fallingdowncataclysm|ns=118|decliner=Novem Linguae|declinets=20211215131440|reason2=nn|ts=20211215131103}} <!-- Do not remove this line! -->

{{AFC comment|1=Consortium News is not a reliable source. [[WP:NPPSG]]. –[[User:Novem Linguae|<span style="color:limegreen">'''Novem Linguae'''</span>]] <small>([[User talk:Novem Linguae|talk]])</small> 13:14, 15 December 2021 (UTC)}}

----

{{Short description|Explaining MICIMATT as an acronym}}
{{AfC topic|other}}

MICIMATT is an acronym created by [[Ray McGovern]] to describe an evolving influence of the government of the [[United States]] beyond the [[Military–industrial complex]] term used by [[Dwight Eisenhower]] in his [[Eisenhower's farewell address]].

The acronym expands to "Military-Industrial-Congressional-Intelligence-Media-Academia-Think-Tank complex" as written by McGovern in this article<ref>https://consortiumnews.com/2020/05/08/ray-mcgovern-once-we-were-allies-then-came-micimatt/|</ref> at [[Consortium News]].

== References ==
<!-- Inline citations added to your article will automatically display here. See en.wikipedia.org/wiki/WP:REFB for instructions on how to add citations. -->
{{reflist}}
`;
		const output =
`{{AFC submission|d|v|u=Fallingdowncataclysm|ns=118|decliner=Novem Linguae|declinets=20211215131440|reason2=nn|ts=20211215131103}} <!-- Do not remove this line! -->

{{AFC comment|1=Consortium News is not a reliable source. [[WP:NPPSG]]. –[[User:Novem Linguae|<span style="color:limegreen">'''Novem Linguae'''</span>]] <small>([[User talk:Novem Linguae|talk]])</small> 13:14, 15 December 2021 (UTC)}}

----

{{Short description|Explaining MICIMATT as an acronym}}
{{AfC topic|other}}

'''MICIMATT''' is an acronym created by [[Ray McGovern]] to describe an evolving influence of the government of the [[United States]] beyond the [[Military–industrial complex]] term used by [[Dwight Eisenhower]] in his [[Eisenhower's farewell address]].

The acronym expands to "Military-Industrial-Congressional-Intelligence-Media-Academia-Think-Tank complex" as written by McGovern in this article<ref>https://consortiumnews.com/2020/05/08/ray-mcgovern-once-we-were-allies-then-came-micimatt/|</ref> at [[Consortium News]].

== References ==
<!-- Inline citations added to your article will automatically display here. See en.wikipedia.org/wiki/WP:REFB for instructions on how to add citations. -->
{{reflist}}
`;
		expect( dc.boldArticleTitle( wikicode, titleWithNamespaceAndSpaces ) ).toBe( output );
	} );

	test( 'Don\'t bold twice', () => {
		const titleWithNamespaceAndSpaces = 'Draft:Kenichi Nagai';
		const wikicode =
`== Kenichi Nagai (永井 賢一) ==

'''Kenichi Nagai''' (1942-1966) was a Japanese racing car driver, infamously known as the first fatality of [[Fuji Speedway|Fuji Speedway.]] 

== Early life ==

Kenichi Nagai was born in 1942. While attending university, he picked up the hobby of motorsports in the early 60s.`;
		const output =
`== Kenichi Nagai (永井 賢一) ==

'''Kenichi Nagai''' (1942-1966) was a Japanese racing car driver, infamously known as the first fatality of [[Fuji Speedway|Fuji Speedway.]] 

== Early life ==

Kenichi Nagai was born in 1942. While attending university, he picked up the hobby of motorsports in the early 60s.`;
		expect( dc.boldArticleTitle( wikicode, titleWithNamespaceAndSpaces ) ).toBe( output );
	} );

	test.skip( 'Only bold titles located in first paragraph', () => {
		const titleWithNamespaceAndSpaces = 'Draft:Matthew Beachy';
		const wikicode =
`Blah blah.

Matthew Beachy considers`;
		const output =
`Blah blah.

Matthew Beachy considers`;
		expect( dc.boldArticleTitle( wikicode, titleWithNamespaceAndSpaces ) ).toBe( output );
	} );
} );

describe( 'disableCategoriesInDraftspace(wikicode, namespace)', () => {
	test( 'Normal', () => {
		const namespace = 118;
		const wikicode =
`[[Category:Living people]]
[[Category:21st-century Indian businesspeople]]
[[Category:Indian businesspeople]]
[[Category:Indian emigrants to the United Arab Emirates]]`;
		const output =
`[[:Category:Living people]]
[[:Category:21st-century Indian businesspeople]]
[[:Category:Indian businesspeople]]
[[:Category:Indian emigrants to the United Arab Emirates]]`;
		expect( dc.disableCategoriesInDraftspace( wikicode, namespace ) ).toBe( output );
	} );

	test( 'Colon before category', () => {
		const namespace = 118;
		const wikicode =
`:[[Category:Living people]]
:[[Category:21st-century Indian businesspeople]]
:[[Category:Indian businesspeople]]
:[[Category:Indian emigrants to the United Arab Emirates]]`;
		const output =
`[[:Category:Living people]]
[[:Category:21st-century Indian businesspeople]]
[[:Category:Indian businesspeople]]
[[:Category:Indian emigrants to the United Arab Emirates]]`;
		expect( dc.disableCategoriesInDraftspace( wikicode, namespace ) ).toBe( output );
	} );

	test( 'Don\'t disable [[Category:Created with preloaddraft]]', () => {
		const namespace = 118;
		const wikicode =
`[[Category:Test]]
[[Category:Created via preloaddraft]]
[[Category:Test2]]`;
		const output =
`[[:Category:Test]]
[[Category:Created via preloaddraft]]
[[:Category:Test2]]`;
		expect( dc.disableCategoriesInDraftspace( wikicode, namespace ) ).toBe( output );
	} );
} );

describe( 'deleteSomeHTMLTags(wikicode)', () => {
	test( '<nowiki>', () => {
		const wikicode = '1.     <nowiki>https://nation.com.pk/24-Jul-2019/dr-athar-mehboob-appointed-as-iub-vice-chancellor</nowiki>';
		const output = '1.     https://nation.com.pk/24-Jul-2019/dr-athar-mehboob-appointed-as-iub-vice-chancellor';
		expect( dc.deleteSomeHTMLTags( wikicode ) ).toBe( output );
	} );

	test( '<nowiki/>', () => {
		const wikicode = '1.     <nowiki/>';
		const output = '1.     ';
		expect( dc.deleteSomeHTMLTags( wikicode ) ).toBe( output );
	} );

	test( '<p><strong><em>', () => {
		const wikicode = `{{Reflist|
			<ref name = "phytotaxa_putaiguneung">{{Cite journal|last=METUSALA|first=DESTARIO|last2=AL FARISHY|first2=DEE DEE|last3=JEBB|first3=MATTHEW|date=2020-08-04|title=<p><strong><em>Nepenthes putaiguneung</em></strong><strong> (Nepenthaceae), a new species from highland of Sumatra, Indonesia</strong></p>|url=https://doi.org/10.11646/phytotaxa.454.4.6|journal=Phytotaxa|volume=454|issue=4|pages=285–292|doi=10.11646/phytotaxa.454.4.6|issn=1179-3163}}</ref>
			}}`;
		const output = `{{Reflist|
			<ref name = "phytotaxa_putaiguneung">{{Cite journal|last=METUSALA|first=DESTARIO|last2=AL FARISHY|first2=DEE DEE|last3=JEBB|first3=MATTHEW|date=2020-08-04|title=Nepenthes putaiguneung (Nepenthaceae), a new species from highland of Sumatra, Indonesia|url=https://doi.org/10.11646/phytotaxa.454.4.6|journal=Phytotaxa|volume=454|issue=4|pages=285–292|doi=10.11646/phytotaxa.454.4.6|issn=1179-3163}}</ref>
			}}`;
		expect( dc.deleteSomeHTMLTags( wikicode ) ).toBe( output );
	} );

	test( '<p>Test</p>', () => {
		const wikicode = 'Test <p>Test</p> test';
		const output = 'Test Test test';
		expect( dc.deleteSomeHTMLTags( wikicode ) ).toBe( output );
	} );

	test( '<p style="Font family: Sans-Serif">', () => {
		const wikicode = 'Test <p style="Font family: Sans-Serif"> test';
		const output = 'Test  test';
		expect( dc.deleteSomeHTMLTags( wikicode ) ).toBe( output );
	} );

	test( '<u>', () => {
		const wikicode = 'Test <u> test';
		const output = 'Test  test';
		expect( dc.deleteSomeHTMLTags( wikicode ) ).toBe( output );
	} );

	test( 'don\'t mess with <utest>', () => {
		const wikicode = 'Test <utest> test';
		const output = 'Test <utest> test';
		expect( dc.deleteSomeHTMLTags( wikicode ) ).toBe( output );
	} );

	test( '<big>', () => {
		const wikicode = '<big><big>See also</big></big><br>';
		const output = 'See also<br>';
		expect( dc.deleteSomeHTMLTags( wikicode ) ).toBe( output );
	} );
} );

describe( 'deleteWeirdUnicodeCharacters(wikicode)', () => {
	test( 'U+0096 start of guarded area', () => {
		const wikicode = '* Recipient of the 2021 Honorable Mention of the Deputy Prime Minister of Uzbekistan.';
		const output = '* Recipient of the 2021 Honorable Mention of the Deputy Prime Minister of Uzbekistan.';
		expect( dc.deleteWeirdUnicodeCharacters( wikicode ) ).toBe( output );
	} );
} );

describe( 'deleteBlankLinesBetweenBullets(wikicode)', () => {
	test( 'U+0096 start of guarded area', () => {
		const wikicode =
`== Cast ==
*Brett Blackmore: [[Eli Brown]]

*Kayla Pierce: [[Madison Iseman]]

*Jeffrey Blackmore (father): [[Jerry O'Connell]]

*Kristen Blackmore (mother): [[Natalie Zea]]`;
		const output =
`== Cast ==
*Brett Blackmore: [[Eli Brown]]
*Kayla Pierce: [[Madison Iseman]]
*Jeffrey Blackmore (father): [[Jerry O'Connell]]
*Kristen Blackmore (mother): [[Natalie Zea]]`;
		expect( dc.deleteBlankLinesBetweenBullets( wikicode ) ).toBe( output );
	} );
} );

describe( 'capitalizeCOVID19(wikicode)', () => {
	test( 'Normal', () => {
		const wikicode = 'Test Covid-19 test.';
		const output = 'Test COVID-19 test.';
		expect( dc.capitalizeCOVID19( wikicode ) ).toBe( output );
	} );

	test( 'Don\'t capitalize COVID-19 in URLs', () => {
		const wikicode = 'https://test.com/covid-19 test';
		const output = 'https://test.com/covid-19 test';
		expect( dc.capitalizeCOVID19( wikicode ) ).toBe( output );
	} );

	test( 'Don\'t mess with image names', () => {
		const wikicode = '{{Infobox | image           = Covid-19_SP_-_UTI_V._Nova_Cachoeirinha.jpg<!-- PLEASE DISCUSS POTENTIAL CHANGES TO THIS PHOTO AT THE TALK PAGE BEFORE MAKING THEM. --> }}';
		const output = '{{Infobox | image           = Covid-19_SP_-_UTI_V._Nova_Cachoeirinha.jpg<!-- PLEASE DISCUSS POTENTIAL CHANGES TO THIS PHOTO AT THE TALK PAGE BEFORE MAKING THEM. --> }}';
		expect( dc.capitalizeCOVID19( wikicode ) ).toBe( output );
	} );

	test( 'Don\'t mess with image names 2', () => {
		const wikicode = '[[File:Covid-19_SP_-_UTI_V._Nova_Cachoeirinha.jpg|caption goes here]]';
		const output = '[[File:Covid-19_SP_-_UTI_V._Nova_Cachoeirinha.jpg|caption goes here]]';
		expect( dc.capitalizeCOVID19( wikicode ) ).toBe( output );
	} );
} );

describe( 'fixWikilinksContainingURL(wikicode)', () => {
	test( 'Non-piped wikilink', () => {
		const wikicode = 'talented [[https://en.wikipedia.org/wiki/Rhythm_and_blues]] singer-songwriter';
		const output = 'talented [[Rhythm_and_blues]] singer-songwriter';
		expect( dc.fixWikilinksContainingURL( wikicode ) ).toBe( output );
	} );

	test( 'm.wikipedia.org domain', () => {
		const wikicode = 'talented [[https://en.m.wikipedia.org/wiki/Rhythm_and_blues]] singer-songwriter';
		const output = 'talented [[Rhythm_and_blues]] singer-songwriter';
		expect( dc.fixWikilinksContainingURL( wikicode ) ).toBe( output );
	} );

	test( 'Piped wikilink', () => {
		const wikicode = 'talented [[https://en.wikipedia.org/wiki/Rhythm_and_blues|R&B-soul]] singer-songwriter';
		const output = 'talented [[Rhythm_and_blues|R&B-soul]] singer-songwriter';
		expect( dc.fixWikilinksContainingURL( wikicode ) ).toBe( output );
	} );

	test( 'Non-piped link', () => {
		const wikicode = 'talented [[https://test.com]] singer-songwriter';
		const output = 'talented [https://test.com] singer-songwriter';
		expect( dc.fixWikilinksContainingURL( wikicode ) ).toBe( output );
	} );

	test( 'Piped link', () => {
		const wikicode = 'talented [[https://test.com|R&B-soul]] singer-songwriter';
		const output = 'talented [https://test.com R&B-soul] singer-songwriter';
		expect( dc.fixWikilinksContainingURL( wikicode ) ).toBe( output );
	} );
} );

describe( 'fixExternalLinksToWikipediaArticles(wikicode)', () => {
	test( '[https://en.wikipedia.org/wiki/Article]', () => {
		const wikicode = '[https://en.wikipedia.org/wiki/Black]';
		const output = '[[Black]]';
		expect( dc.fixExternalLinksToWikipediaArticles( wikicode ) ).toBe( output );
	} );

	test( '[https://en.wikipedia.org/wiki/Article Article name]', () => {
		const wikicode = '[https://en.wikipedia.org/wiki/Black Black]';
		const output = '[[Black]]';
		expect( dc.fixExternalLinksToWikipediaArticles( wikicode ) ).toBe( output );
	} );

	test( 'urldecode %20', () => {
		const wikicode = '[https://en.wikipedia.org/wiki/Black%20Star%20of%20Queensland]';
		const output = '[[Black Star of Queensland]]';
		expect( dc.fixExternalLinksToWikipediaArticles( wikicode ) ).toBe( output );
	} );

	test( 'urldecode _', () => {
		const wikicode = '[https://en.wikipedia.org/wiki/Black_Star_of_Queensland]';
		const output = '[[Black Star of Queensland]]';
		expect( dc.fixExternalLinksToWikipediaArticles( wikicode ) ).toBe( output );
	} );

	test( 'urldecode %7B {', () => {
		const wikicode = '[https://en.wikipedia.org/wiki/%7B]';
		const output = '[[{]]';
		expect( dc.fixExternalLinksToWikipediaArticles( wikicode ) ).toBe( output );
	} );
} );

describe( 'removeUnderscoresFromWikilinks(wikicode)', () => {
	test( 'Normal', () => {
		const wikicode = 'Hello_friend [[Distributed_computing]] Goodbye_friend';
		const output = 'Hello_friend [[Distributed computing]] Goodbye_friend';
		expect( dc.removeUnderscoresFromWikilinks( wikicode ) ).toBe( output );
	} );
} );

describe( 'refShortLinkToLongLink(wikicode)', () => {
	test( 'Normal', () => {
		const wikicode = '<ref>[https://test.com Test]</ref>';
		const output = '<ref>https://test.com Test</ref>';
		expect( dc.refShortLinkToLongLink( wikicode ) ).toBe( output );
	} );

	test( 'Italic and touching hyperlink', () => {
		const wikicode = '<ref>[https://www.iufrance.fr/les-membres-de-liuf/membre/1246-remi-abgrall.html\'\'Institut Universitaire de France\'\']</ref>';
		const output = '<ref>https://www.iufrance.fr/les-membres-de-liuf/membre/1246-remi-abgrall.html \'\'Institut Universitaire de France\'\'</ref>';
		expect( dc.refShortLinkToLongLink( wikicode ) ).toBe( output );
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
		expect( dc.deleteMoreThanTwoEntersInARow( wikicode ) ).toBe( output );
	} );

	test( 'Change 3 enters to 2 enters in front of a stub tag', () => {
		const wikicode =
`Test



{{Stub}}`;
		const output =
`Test


{{Stub}}`;
		expect( dc.deleteMoreThanTwoEntersInARow( wikicode ) ).toBe( output );
	} );

	test( 'Change 1 enters to 2 enters in front of a stub tag', () => {
		const wikicode =
`Test

{{Stub}}`;
		const output =
`Test


{{Stub}}`;
		expect( dc.deleteMoreThanTwoEntersInARow( wikicode ) ).toBe( output );
	} );
} );

describe( 'convertH1ToH2(wikicode2)', () => {
	test( 'Don\'t change', () => {
		const wikicode2 = '== Heading ==';
		const output = '== Heading ==';
		expect( dc.convertH1ToH2( wikicode2 ) ).toBe( output );
	} );

	test( 'Change', () => {
		const wikicode2 = '= Heading =';
		const output = '== Heading ==';
		expect( dc.convertH1ToH2( wikicode2 ) ).toBe( output );
	} );
} );

describe( 'swapRefPeriodWithPeriodRef(wikicode2)', () => {
	test( 'Single', () => {
		const wikicode2 = '[[WMO]]<ref>{{Cite web |date=2018-06-06 |title=Public-Private Engagement (PPE) |url=https://public.wmo.int/en/our-mandate/how-we-do-it/public-private-engagement-ppe |access-date=2022-03-29 |website=public.wmo.int |language=en}}</ref>.\n';
		const output = '[[WMO]].<ref>{{Cite web |date=2018-06-06 |title=Public-Private Engagement (PPE) |url=https://public.wmo.int/en/our-mandate/how-we-do-it/public-private-engagement-ppe |access-date=2022-03-29 |website=public.wmo.int |language=en}}</ref>\n';
		expect( dc.swapRefPeriodWithPeriodRef( wikicode2 ) ).toBe( output );
	} );

	test( 'Double', () => {
		const wikicode2 = '[[WMO]]<ref>Test</ref><ref>Test2</ref>.\n';
		const output = '[[WMO]].<ref>Test</ref><ref>Test2</ref>\n';
		expect( dc.swapRefPeriodWithPeriodRef( wikicode2 ) ).toBe( output );
	} );

	test.skip( '<ref name="test" /> style refs', () => {
		const wikicode2 = '[[WMO]]<ref name=":0" /><ref>{{Cite web |date=2018-06-06 |title=Public-Private Engagement (PPE) |url=https://public.wmo.int/en/our-mandate/how-we-do-it/public-private-engagement-ppe |access-date=2022-03-29 |website=public.wmo.int |language=en}}</ref>.\n';
		const output = '[[WMO]].<ref name=":0" /><ref>{{Cite web |date=2018-06-06 |title=Public-Private Engagement (PPE) |url=https://public.wmo.int/en/our-mandate/how-we-do-it/public-private-engagement-ppe |access-date=2022-03-29 |website=public.wmo.int |language=en}}</ref>\n';
		expect( dc.swapRefPeriodWithPeriodRef( wikicode2 ) ).toBe( output );
	} );
} );

describe( 'swapRefCommaWithCommaRef(wikicode2)', () => {
	test( 'Single', () => {
		const wikicode2 = '[[WMO]]<ref>{{Cite web |date=2018-06-06 |title=Public-Private Engagement (PPE) |url=https://public.wmo.int/en/our-mandate/how-we-do-it/public-private-engagement-ppe |access-date=2022-03-29 |website=public.wmo.int |language=en}}</ref>,\n';
		const output = '[[WMO]],<ref>{{Cite web |date=2018-06-06 |title=Public-Private Engagement (PPE) |url=https://public.wmo.int/en/our-mandate/how-we-do-it/public-private-engagement-ppe |access-date=2022-03-29 |website=public.wmo.int |language=en}}</ref>\n';
		expect( dc.swapRefCommaWithCommaRef( wikicode2 ) ).toBe( output );
	} );

	test( 'Double', () => {
		const wikicode2 = '[[WMO]]<ref>Test</ref><ref>Test2</ref>,\n';
		const output = '[[WMO]],<ref>Test</ref><ref>Test2</ref>\n';
		expect( dc.swapRefCommaWithCommaRef( wikicode2 ) ).toBe( output );
	} );

	test.skip( '<ref name="test" /> style refs', () => {
		const wikicode2 = '[[WMO]]<ref name=":0" /><ref>{{Cite web |date=2018-06-06 |title=Public-Private Engagement (PPE) |url=https://public.wmo.int/en/our-mandate/how-we-do-it/public-private-engagement-ppe |access-date=2022-03-29 |website=public.wmo.int |language=en}}</ref>,\n';
		const output = '[[WMO]],<ref name=":0" /><ref>{{Cite web |date=2018-06-06 |title=Public-Private Engagement (PPE) |url=https://public.wmo.int/en/our-mandate/how-we-do-it/public-private-engagement-ppe |access-date=2022-03-29 |website=public.wmo.int |language=en}}</ref>\n';
		expect( dc.swapRefCommaWithCommaRef( wikicode2 ) ).toBe( output );
	} );
} );

describe( 'removeBorderFromImagesInInfoboxes(wikicode2)', () => {
	test( 'Don\'t change', () => {
		const wikicode2 =
`{{Infobox company
|name               = ZITRO 
|logo               = LogoZitro.jpg
|foundation         = 2007
}}`;
		const output =
`{{Infobox company
|name               = ZITRO 
|logo               = LogoZitro.jpg
|foundation         = 2007
}}`;
		expect( dc.removeBorderFromImagesInInfoboxes( wikicode2 ) ).toBe( output );
	} );

	test( 'No pipe', () => {
		const wikicode2 =
`{{Infobox company
|name               = ZITRO 
|logo               = [[File:LogoZitro.jpg]]
|foundation         = 2007
}}`;
		const output =
`{{Infobox company
|name               = ZITRO 
|logo               = LogoZitro.jpg
|foundation         = 2007
}}`;
		expect( dc.removeBorderFromImagesInInfoboxes( wikicode2 ) ).toBe( output );
	} );

	test( 'Piped', () => {
		const wikicode2 =
`{{Infobox company
|name               = ZITRO 
|logo               = [[File:LogoZitro.jpg|thumb|Logo Zitro Games]]
|foundation         = 2007
}}`;
		const output =
`{{Infobox company
|name               = ZITRO 
|logo               = LogoZitro.jpg
|foundation         = 2007
}}`;
		expect( dc.removeBorderFromImagesInInfoboxes( wikicode2 ) ).toBe( output );
	} );

	test( 'Album cover', () => {
		const wikicode2 =
`{{Infobox album
| name         = অনিকেত প্রান্তর
| type         = Studio
| artist       = [[Artcell]]
| cover        = [[File:Artcell - Oniket Prantor.jpg|thumb|Artcell - Oniket Prantor]]
| alt          = 
}}`;
		const output =
`{{Infobox album
| name         = অনিকেত প্রান্তর
| type         = Studio
| artist       = [[Artcell]]
| cover        = Artcell - Oniket Prantor.jpg
| alt          = 
}}`;
		expect( dc.removeBorderFromImagesInInfoboxes( wikicode2 ) ).toBe( output );
	} );
} );

describe( 'removeExtraAFCSubmissionTemplates(wikicode2)', () => {
	test( 'Normal', () => {
		const wikicode2 =
`{{AfC topic|blp}}
{{AfC submission|||ts=20220310234758|u=Sallgoodman|ns=118}}

Test

{{AfC submission|t||ts=20220310234532|u=Sallgoodman|ns=118|demo=}}

== References ==`;
		const output =
`{{AfC topic|blp}}
{{AfC submission|||ts=20220310234758|u=Sallgoodman|ns=118}}

Test


== References ==`;
		expect( dc.removeExtraAFCSubmissionTemplates( wikicode2 ) ).toBe( output );
	} );

	test( 'Comment after template', () => {
		const wikicode2 =
`{{AfC topic|org}}
{{AfC submission|||ts=20220311205124|u=Moemady|ns=118}}
{{AfC submission|t||ts=20220310204146|u=Moemady|ns=118|demo=}}<!-- Important, do not remove this line before article has been created. -->

{{Orphan|date=January 2006}}`;
		const output =
`{{AfC topic|org}}
{{AfC submission|||ts=20220311205124|u=Moemady|ns=118}}
<!-- Important, do not remove this line before article has been created. -->

{{Orphan|date=January 2006}}`;
		expect( dc.removeExtraAFCSubmissionTemplates( wikicode2 ) ).toBe( output );
	} );

} );

describe( 'deleteMultipleReferenceTags(wikicode)', () => {
	test( 'Normal', () => {
		const wikicode =
`== References ==
{{Reflist}}
`;
		const output =
`== References ==
{{Reflist}}
`;
		expect( dc.deleteMultipleReferenceTags( wikicode ) ).toBe( output );
	} );

	test( '1 {{Reflist}}, 1 <references />', () => {
		const wikicode =
`== References ==
{{reflist}}
<references />
`;
		const output =
`== References ==
{{reflist}}
`;
		expect( dc.deleteMultipleReferenceTags( wikicode ) ).toBe( output );
	} );
} );

describe( 'deleteNonAFCDraftTags(wikicode)', () => {
	test( '{{Draft}}', () => {
		const wikicode =
`{{AfC submission|||ts=20230111111105|u=Memezmoj|ns=118}}
{{draft}}
{{Infobox settlement`;
		const output =
`{{AfC submission|||ts=20230111111105|u=Memezmoj|ns=118}}
{{Infobox settlement`;
		expect( dc.deleteNonAFCDraftTags( wikicode ) ).toBe( output );
	} );

	test( '{{Preloaddraft submit}}', () => {
		const wikicode =
`{{Preloaddraft submit}}

<!-- When you move this draft into article space, please link it to the Wikidata entry and remove the QID in the infobox code. -->

{{Infobox person/Wikidata
   |qid=Q110155583
   |fetchwikidata=ALL
 
   |dateformat=mdy
}}

'''Alice Phillips Withrow'''`;
		const output =
`{{Infobox person/Wikidata
   |qid=Q110155583
   |fetchwikidata=ALL
 
   |dateformat=mdy
}}

'''Alice Phillips Withrow'''`;
		expect( dc.deleteNonAFCDraftTags( wikicode ) ).toBe( output );
	} );
} );

describe( 'moveAFCSubmissionTemplatesToTop(wikicode)', () => {
	test( '{{Draft}}', () => {
		const wikicode =
`== References ==
{{reflist}}

{{Authority control}}
{{DEFAULTSORT:Rhoderick, Maude}}
[[Category:Created via preloaddraft]]

{{AfC submission|||ts=20230109235951|u=Meghaninmotion|ns=118}}
`;
		const output =
`{{AfC submission|||ts=20230109235951|u=Meghaninmotion|ns=118}}
----

== References ==
{{reflist}}

{{Authority control}}
{{DEFAULTSORT:Rhoderick, Maude}}
[[Category:Created via preloaddraft]]

`;
		expect( dc.moveAFCSubmissionTemplatesToTop( wikicode ) ).toBe( output );
	} );
} );

describe( '_replaceAll(haystack, needle, replacement)', () => {
	test( 'Normal', () => {
		const haystack = 'Testing. 123.';
		const needle = '.';
		const replacement = '!';
		const output = 'Testing! 123!';
		expect( dc._replaceAll( haystack, needle, replacement ) ).toBe( output );
	} );
} );

describe( 'fixPipedWikilinksWithIdenticalParameters(wikicode)', () => {
	test( 'Normal', () => {
		const wikicode =
`[[Test 1]]
[[Test 2|Test 2]]
[[Test_3|Test 3]]
[[Test 4 (different)|Test 4]]`;
		const output =
`[[Test 1]]
[[Test 2]]
[[Test_3|Test 3]]
[[Test 4 (different)|Test 4]]`;

		expect( dc.fixPipedWikilinksWithIdenticalParameters( wikicode ) ).toBe( output );
	} );
} );

// TODO: inlineExternalLinksToRefs() - false positive involving external links in bibliography sections
// TODO: run DraftCleaner on big articles and FAs, write tests for false positives
// TODO: create suggested functions and tests, see DraftCleaner->cleanDraft() comments
