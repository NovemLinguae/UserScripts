const { GARCloserService } = require("../modules/GARCloserService.js");

// use this pattern. prevents bugs.
let service;
beforeEach(() => {
	service = new GARCloserService();
});

describe('processKeepForTalkPage(wikicode, garPageTitle, talkPageTitle)', () => {
	it(`Should remove {{GAR/link}}, add action4 to {{Article history}}, leave currentstatus alone, leave class=GA alone`, () => {
		let garPageTitle = `Wikipedia:Good article reassessment/American popular music/1`;
		let talkPageTitle = `Talk:American popular music`;
		let wikicode =
`{{GAR/link|13:56, 16 March 2022 (UTC)|page=1|GARpage=1|status= }}
{{Article history|action1=PR
|action1date=01:49, 18 September 2005
|action1link=Wikipedia:Peer review/American popular music/archive1
|action1result=reviewed
|action1oldid=23428684
|action2=FAC
|action2date=21:24, 1 October 2005
|action2link=Wikipedia:Featured article candidates/American popular music/archive1
|action2result=failed
|action2oldid=24508993
|action3=GAN
|action3date=18:51, 30 August 2007
|action3result=listed
|action3oldid=154649662
|currentstatus=GA
|topic=music
}}
{{WikiProject banner shell|1=
{{WP1.0 |v0.7=pass |class=GA |category=Arts |WPCD=yes |importance=Low}}
{{WikiProject Regional and national music|class=GA|importance=High}}
{{WikiProject United States|class=GA|importance=Mid|USMusic=yes|USMusic-importance=High}}
{{WikiProject Rock music|class=GA|importance=high}}
}}`;
		let output =
`{{Article history|action1=PR
|action1date=01:49, 18 September 2005
|action1link=Wikipedia:Peer review/American popular music/archive1
|action1result=reviewed
|action1oldid=23428684
|action2=FAC
|action2date=21:24, 1 October 2005
|action2link=Wikipedia:Featured article candidates/American popular music/archive1
|action2result=failed
|action2oldid=24508993
|action3=GAN
|action3date=18:51, 30 August 2007
|action3result=listed
|action3oldid=154649662
|topic=music

|action4 = GAR
|action4date = ~~~~~
|action4link = Wikipedia:Good article reassessment/American popular music/1
|action4result = kept
|currentstatus = GA
}}
{{WikiProject banner shell|1=
{{WP1.0 |v0.7=pass |class=GA |category=Arts |WPCD=yes |importance=Low}}
{{WikiProject Regional and national music|class=GA|importance=High}}
{{WikiProject United States|class=GA|importance=Mid|USMusic=yes|USMusic-importance=High}}
{{WikiProject Rock music|class=GA|importance=high}}
}}`;
		expect(service.processKeepForTalkPage(wikicode, garPageTitle, talkPageTitle)).toBe(output);
	});

	it(`Should remove {{GAR/link}}, remove {{GA}}, add {{Article history}}, leave currentstatus alone, leave class=GA alone`, () => {
		let garPageTitle = `Wikipedia:Good article reassessment/American popular music/1`;
		let talkPageTitle = `Talk:American popular music`;
		let wikicode =
`{{GAR/link|13:56, 16 March 2022 (UTC)|page=1|GARpage=1|status= }}
{{GA|20:19, 29 June 2022 (UTC)|topic=Language and literature|page=1}}
{{WikiProject banner shell|1=
{{WP1.0 |v0.7=pass |class=GA |category=Arts |WPCD=yes |importance=Low}}
{{WikiProject Regional and national music|class=GA|importance=High}}
{{WikiProject United States|class=GA|importance=Mid|USMusic=yes|USMusic-importance=High}}
{{WikiProject Rock music|class=GA|importance=high}}
}}`;
		let output =
`{{Article history
|topic = Language and literature

|action1 = GAN
|action1date = 20:19, 29 June 2022 (UTC)
|action1link = Talk:American popular music/GA1
|action1result = listed

|action2 = GAR
|action2date = ~~~~~
|action2link = Wikipedia:Good article reassessment/American popular music/1
|action2result = kept
|currentstatus = GA
}}
{{WikiProject banner shell|1=
{{WP1.0 |v0.7=pass |class=GA |category=Arts |WPCD=yes |importance=Low}}
{{WikiProject Regional and national music|class=GA|importance=High}}
{{WikiProject United States|class=GA|importance=Mid|USMusic=yes|USMusic-importance=High}}
{{WikiProject Rock music|class=GA|importance=high}}
}}`;
		expect(service.processKeepForTalkPage(wikicode, garPageTitle, talkPageTitle)).toBe(output);
	});
});

/*

describe('makeCommunityAssessmentLogEntry(wikicode)', () => {
	it(`Should `, () => {
		let wikicode =
`Talk:Abcdef/GA12`;
		let output =
`Abcdef`;
		expect(service.makeCommunityAssessmentLogEntry(wikicode)).toBe(output);
	});
});

describe('makeScriptLogEntry(wikicode)', () => {
	it(`Should `, () => {
		let wikicode =
`Talk:Abcdef/GA12`;
		let output =
`Abcdef`;
		expect(service.makeScriptLogEntry(wikicode)).toBe(output);
	});
});

*/

describe('processDelistForTalkPage(wikicode, garPageTitle, talkPageTitle)', () => {
	it(`Should remove {{GAR/link}}, add action4 to {{Article history}}, set currentstatus to DGA, and remove class=GA`, () => {
		let garPageTitle = `Wikipedia:Good article reassessment/American popular music/1`;
		let talkPageTitle = `Talk:American popular music`;
		let wikicode =
`{{GAR/link|13:56, 16 March 2022 (UTC)|page=1|GARpage=1|status= }}
{{Article history|action1=PR
|action1date=01:49, 18 September 2005
|action1link=Wikipedia:Peer review/American popular music/archive1
|action1result=reviewed
|action1oldid=23428684
|action2=FAC
|action2date=21:24, 1 October 2005
|action2link=Wikipedia:Featured article candidates/American popular music/archive1
|action2result=failed
|action2oldid=24508993
|action3=GAN
|action3date=18:51, 30 August 2007
|action3result=listed
|action3oldid=154649662
|currentstatus=GA
|topic=music
}}
{{WikiProject banner shell|1=
{{WP1.0 |v0.7=pass |class=GA |category=Arts |WPCD=yes |importance=Low}}
{{WikiProject Regional and national music|class=GA|importance=High}}
{{WikiProject United States|class=GA|importance=Mid|USMusic=yes|USMusic-importance=High}}
{{WikiProject Rock music|class=GA|importance=high}}
}}`;
		let output =
`{{Article history|action1=PR
|action1date=01:49, 18 September 2005
|action1link=Wikipedia:Peer review/American popular music/archive1
|action1result=reviewed
|action1oldid=23428684
|action2=FAC
|action2date=21:24, 1 October 2005
|action2link=Wikipedia:Featured article candidates/American popular music/archive1
|action2result=failed
|action2oldid=24508993
|action3=GAN
|action3date=18:51, 30 August 2007
|action3result=listed
|action3oldid=154649662
|topic=music

|action4 = GAR
|action4date = ~~~~~
|action4link = Wikipedia:Good article reassessment/American popular music/1
|action4result = delisted
|currentstatus = DGA
}}
{{WikiProject banner shell|1=
{{WP1.0 |v0.7=pass |class= |category=Arts |WPCD=yes |importance=Low}}
{{WikiProject Regional and national music|class=|importance=High}}
{{WikiProject United States|class=|importance=Mid|USMusic=yes|USMusic-importance=High}}
{{WikiProject Rock music|class=|importance=high}}
}}`;
		expect(service.processDelistForTalkPage(wikicode, garPageTitle, talkPageTitle)).toBe(output);
	});

	it(`Should remove {{GAR/link}}, remove {{GA}}, add {{Article history}}, and remove class=GA`, () => {
		let garPageTitle = `Wikipedia:Good article reassessment/American popular music/1`;
		let talkPageTitle = `Talk:American popular music`;
		let wikicode =
`{{GAR/link|13:56, 16 March 2022 (UTC)|page=1|GARpage=1|status= }}
{{GA|20:19, 29 June 2022 (UTC)|topic=Language and literature|page=1}}
{{WikiProject banner shell|1=
{{WP1.0 |v0.7=pass |class=GA |category=Arts |WPCD=yes |importance=Low}}
{{WikiProject Regional and national music|class=GA|importance=High}}
{{WikiProject United States|class=GA|importance=Mid|USMusic=yes|USMusic-importance=High}}
{{WikiProject Rock music|class=GA|importance=high}}
}}`;
		let output =
`{{Article history
|topic = Language and literature

|action1 = GAN
|action1date = 20:19, 29 June 2022 (UTC)
|action1link = Talk:American popular music/GA1
|action1result = listed

|action2 = GAR
|action2date = ~~~~~
|action2link = Wikipedia:Good article reassessment/American popular music/1
|action2result = delisted
|currentstatus = DGA
}}
{{WikiProject banner shell|1=
{{WP1.0 |v0.7=pass |class= |category=Arts |WPCD=yes |importance=Low}}
{{WikiProject Regional and national music|class=|importance=High}}
{{WikiProject United States|class=|importance=Mid|USMusic=yes|USMusic-importance=High}}
{{WikiProject Rock music|class=|importance=high}}
}}`;
		expect(service.processDelistForTalkPage(wikicode, garPageTitle, talkPageTitle)).toBe(output);
	});
});

describe('processDelistForArticle(wikicode)', () => {
	it(`Should remove {{Good article}}`, () => {
		let wikicode =
`{{Short description|None}}
{{Good article}}
{{USmusicgenres}}`;
		let output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect(service.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should handle template being at top of wikicode`, () => {
		let wikicode =
`{{Good article}}
{{USmusicgenres}}`;
		let output =
`{{USmusicgenres}}`;
		expect(service.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should handle template being at bottom of wikicode`, () => {
		let wikicode =
`{{USmusicgenres}}
{{Good article}}`;
		let output =
`{{USmusicgenres}}
`;
		expect(service.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should remove {{good article}}`, () => {
		let wikicode =
`{{Short description|None}}
{{good article}}
{{USmusicgenres}}`;
		let output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect(service.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should remove {{Good Article}}`, () => {
		let wikicode =
`{{Short description|None}}
{{Good Article}}
{{USmusicgenres}}`;
		let output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect(service.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should remove {{GA article}}`, () => {
		let wikicode =
`{{Short description|None}}
{{GA article}}
{{USmusicgenres}}`;
		let output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect(service.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should remove {{ga article}}`, () => {
		let wikicode =
`{{Short description|None}}
{{ga article}}
{{USmusicgenres}}`;
		let output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect(service.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should remove {{GA icon}}`, () => {
		let wikicode =
`{{Short description|None}}
{{GA icon}}
{{USmusicgenres}}`;
		let output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect(service.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should remove {{ga icon}}`, () => {
		let wikicode =
`{{Short description|None}}
{{ga icon}}
{{USmusicgenres}}`;
		let output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect(service.processDelistForArticle(wikicode)).toBe(output);
	});
});

describe('processDelistForGAList(wikicode, title)', () => {
	it(`Should remove when first in list`, () => {
		let title = `American popular music`;
		let wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Andorra in the Eurovision Song Contest]]
}}`;
		let output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[Andorra in the Eurovision Song Contest]]
}}`;
		expect(service.processDelistForGAList(wikicode, title)).toBe(output);
	});

	it(`Should remove when in middle of list`, () => {
		let title = `Andorra in the Eurovision Song Contest`;
		let wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Andorra in the Eurovision Song Contest]]
[[Test]]
}}`;
		let output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Test]]
}}`;
		expect(service.processDelistForGAList(wikicode, title)).toBe(output);
	});

	it(`Should handle piped wikilink`, () => {
		let title = `Andorra in the Eurovision Song Contest`;
		let wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Andorra in the Eurovision Song Contest|Test]]
[[Test]]
}}`;
		let output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Test]]
}}`;
		expect(service.processDelistForGAList(wikicode, title)).toBe(output);
	});

	it(`Should handle piped wikilink surrounded by italics outside`, () => {
		let title = `Andorra in the Eurovision Song Contest`;
		let wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
''[[Andorra in the Eurovision Song Contest|Test]]''
[[Test]]
}}`;
		let output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Test]]
}}`;
		expect(service.processDelistForGAList(wikicode, title)).toBe(output);
	});

	it(`Should handle piped wikilink surrounded by italics inside`, () => {
		let title = `Andorra in the Eurovision Song Contest`;
		let wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Andorra in the Eurovision Song Contest|''Test'']]
[[Test]]
}}`;
		let output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Test]]
}}`;
		expect(service.processDelistForGAList(wikicode, title)).toBe(output);
	});

	it(`Should remove when last in list`, () => {
		let title = `Andorra in the Eurovision Song Contest`;
		let wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Andorra in the Eurovision Song Contest]]
}}`;
		let output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
}}`;
		expect(service.processDelistForGAList(wikicode, title)).toBe(output);
	});

	it(`Should remove when only item in list`, () => {
		let title = `American popular music`;
		let wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
}}`;
		let output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
}}`;
		expect(service.processDelistForGAList(wikicode, title)).toBe(output);
	});

	it(`Should do nothing when item not found`, () => {
		let title = `Andorra in the Eurovision Song Contest`;
		let wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
}}`;
		let output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
}}`;
		expect(service.processDelistForGAList(wikicode, title)).toBe(output);
	});
});















// private methods

describe('preg_position(regex, haystack)', () => {
	test(`preg_position_false`, () => {
		let regex = new RegExp(`hello`, 'gis');
		let haystack = `How are you?`;
		let result = service.preg_position(regex, haystack);
		expect(result).toBe(false);
	});
	
	test(`preg_position_zero`, () => {
		let regex = new RegExp(`How`, `gis`);
		let haystack = `How are you?`;
		let result = service.preg_position(regex, haystack);
		expect(result).toBe(0);
	});
	
	test(`preg_position_positive`, () => {
		let regex = new RegExp(`are`, `gis`);
		let haystack = `How are you?`;
		let result = service.preg_position(regex, haystack);
		expect(result).toBe(4);
	});
	
	test(`preg_position_end`, () => {
		let regex = new RegExp(`$`, `gis`);
		let haystack = `How are you?`;
		let result = service.preg_position(regex, haystack);
		expect(result).toBe(12);
	});
});

describe('getParametersFromTemplateWikicode(wikicodeOfSingleTemplate)', () => {
	test(``, () => {
		let wikicodeOfSingleTemplate =
`{{GAR/link|13:56, 16 March 2022 (UTC)|page=1|GARpage=1|status= }}`;
		let output = {
			'1': `13:56, 16 March 2022 (UTC)`,
			'page': '1',
			'garpage': '1',
			'status': ''
		};
		expect(service.getParametersFromTemplateWikicode(wikicodeOfSingleTemplate)).toStrictEqual(output);
	});
});

describe('addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd)', () => {
	test(`addToTalkPageAboveWikiProjects_normal`, () => {
		let talkPageWikicode =
`{{Article history}}
{{Talk header}}

== Heading 1 ==
Test

== Heading 2 ==
Text`;
		let wikicodeToAdd = `[[Test]]`;
		let result = service.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
		expect(result).toBe(
`{{Article history}}
{{Talk header}}
[[Test]]

== Heading 1 ==
Test

== Heading 2 ==
Text`
		);
	});
	
	test(`addToTalkPageAboveWikiProjects_ga1_1`, () => {
		let talkPageWikicode =
`{{Article history}}
{{Talk header}}

{{Talk:abc/GA1}}

== Heading 1 ==
Test

== Heading 2 ==
Text`;
		let wikicodeToAdd = `[[Test]]`;
		let result = service.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
		expect(result).toBe(
`{{Article history}}
{{Talk header}}
[[Test]]

{{Talk:abc/GA1}}

== Heading 1 ==
Test

== Heading 2 ==
Text`
		);
	});
	
	test(`addToTalkPageAboveWikiProjects_ga1_2`, () => {
		let talkPageWikicode =
`{{Article history}}
{{Talk header}}

== Heading 1 ==
Test

{{Talk:abc/GA1}}

== Heading 2 ==
Text`;
		let wikicodeToAdd = `[[Test]]`;
		let result = service.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
		expect(result).toBe(
`{{Article history}}
{{Talk header}}
[[Test]]

== Heading 1 ==
Test

{{Talk:abc/GA1}}

== Heading 2 ==
Text`
		);
	});
	
	test(`addToTalkPageAboveWikiProjects_blank`, () => {
		let talkPageWikicode = ``;
		let wikicodeToAdd = `[[Test]]`;
		let result = service.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
		expect(result).toBe('[[Test]]');
	});
	
	test(`addToTalkPageAboveWikiProjects_start`, () => {
		let talkPageWikicode =
`== Heading 1 ==
Test`;
		let wikicodeToAdd = `[[Test]]`;
		let result = service.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
		expect(result).toBe(
`[[Test]]
== Heading 1 ==
Test`
		);
	});
	
	test(`addToTalkPageAboveWikiProjects_end`, () => {
		let talkPageWikicode = `Test`;
		let wikicodeToAdd = `[[Test]]`;
		let result = service.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
		expect(result).toBe(
`Test
[[Test]]`
		);
	});
	
	test(`addToTalkPageAboveWikiProjects_WikiProjectBannerShellPresent`, () => {
		let talkPageWikicode =
`{{Test1}}
{{wikiproject banner shell}}
{{Test2}}

== Test3 ==`;
		let wikicodeToAdd = `[[Test]]`;
		let result = service.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
		expect(result).toBe(
`{{Test1}}
[[Test]]
{{wikiproject banner shell}}
{{Test2}}

== Test3 ==`
		);
	});
	
	test(`addToTalkPageAboveWikiProjects_WikiProjectPresent`, () => {
		let talkPageWikicode =
`{{Test1}}
{{wikiproject tree of life}}
{{Test2}}

== Test3 ==`;
		let wikicodeToAdd = `[[Test]]`;
		let result = service.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
		expect(result).toBe(
`{{Test1}}
[[Test]]
{{wikiproject tree of life}}
{{Test2}}

== Test3 ==`
		);
	});
	
	test(`addToTalkPageAboveWikiProjects_deleteExtraNewLines`, () => {
		let talkPageWikicode =
`{{GTC|Dua Lipa (album)|1}}
{{GA|06:30, 12 August 2020 (UTC)|topic=Music|page=1|oldid=972465209}}




{{Talk:Homesick (Dua Lipa song)/GA1}}

== this is a piano song ==`;
		let wikicodeToAdd = `[[Test]]`;
		let result = service.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
		expect(result).toBe(
`{{GTC|Dua Lipa (album)|1}}
{{GA|06:30, 12 August 2020 (UTC)|topic=Music|page=1|oldid=972465209}}
[[Test]]

{{Talk:Homesick (Dua Lipa song)/GA1}}

== this is a piano song ==`
		);
	});
	
	test(`addToTalkPageAboveWikiProjects_recognizeFootballTemplateAsWikiProject`, () => {
		let talkPageWikicode = `{{football}}`;
		let wikicodeToAdd = `[[Test]]`;
		let result = service.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
		expect(result).toBe(
`[[Test]]
{{football}}`
		);
	});

	test(`two wikiproject tempaltes detected`, () => {
		let talkPageWikicode = `{{wp banner shell}}{{football}}`;
		let wikicodeToAdd = `[[Test]]`;
		let output =
`[[Test]]
{{wp banner shell}}{{football}}`;
		expect(service.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd)).toBe(output);
	});
});

describe('deleteMiddleOfString(string, deleteStartPosition, deleteEndPosition)', () => {
	test(`deleteMiddleOfString`, () => {
		let string = `Test DELETE THIS dont delete this`;
		let deleteStartPosition = 5;
		let deleteEndPosition = 17;
		let result = service.deleteMiddleOfString(string, deleteStartPosition, deleteEndPosition);
		expect(result).toBe('Test dont delete this');
	});
	
	test(`deleteMiddleOfString_blank`, () => {
		let string = ``;
		let deleteStartPosition = 0;
		let deleteEndPosition = 0;
		let result = service.deleteMiddleOfString(string, deleteStartPosition, deleteEndPosition);
		expect(result).toBe('');
	});
});

describe('regexGetFirstMatchString(regex, haystack)', () => {
	test(`match`, () => {
		let regex = /hello ([^ ]+)/;
		let haystack = `hello test goodbye`;
		let result = service.regexGetFirstMatchString(regex, haystack);
		expect(result).toBe('test');
	});

	test(`no match`, () => {
		let regex = /hello (bob)/;
		let haystack = `hello test goodbye`;
		let result = service.regexGetFirstMatchString(regex, haystack);
		expect(result).toBe(null);
	});

	test(`no capture group, no match`, () => {
		let regex = /hello bob/;
		let haystack = `hello test goodbye`;
		let result = service.regexGetFirstMatchString(regex, haystack);
		expect(result).toBe(null);
	});

	test(`no capture group, yes match`, () => {
		let regex = /hello bob/;
		let haystack = `hello bob`;
		let result = service.regexGetFirstMatchString(regex, haystack);
		expect(result).toBe(null);
	});
});

describe('convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode)', () => {
	it(`should default to page=1 when no page parameter`, () => {
		let talkPageTitle =`Talk:Test`;
		let wikicode = `{{GA|20:19, 29 June 2022 (UTC)|topic=Language and literature}}`;
		let output =
`{{Article history
|currentstatus = GA
|topic = Language and literature

|action1 = GAN
|action1date = 20:19, 29 June 2022 (UTC)
|action1link = Talk:Test/GA1
|action1result = listed
}}`;
		expect(service.convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode)).toBe(output);
	});

	it(`should handle subtopic parameter`, () => {
		let talkPageTitle =`Talk:Test`;
		let wikicode = `{{GA|20:19, 29 June 2022 (UTC)|subtopic=Language and literature|page=1}}`;
		let output =
`{{Article history
|currentstatus = GA
|topic = Language and literature

|action1 = GAN
|action1date = 20:19, 29 June 2022 (UTC)
|action1link = Talk:Test/GA1
|action1result = listed
}}`;
		expect(service.convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode)).toBe(output);
	});

	it(`should handle oldid parameter`, () => {
		let talkPageTitle =`Talk:Test`;
		let wikicode = `{{GA|20:19, 29 June 2022 (UTC)|topic=Language and literature|page=1|oldid=123456789}}`;
		let output =
`{{Article history
|currentstatus = GA
|topic = Language and literature

|action1 = GAN
|action1date = 20:19, 29 June 2022 (UTC)
|action1link = Talk:Test/GA1
|action1result = listed
|action1oldid = 123456789
}}`;
		expect(service.convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode)).toBe(output);
	});
});