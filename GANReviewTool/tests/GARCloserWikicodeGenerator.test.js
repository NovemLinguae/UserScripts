const { GARCloserWikicodeGenerator } = require("../modules/GARCloserWikicodeGenerator.js");

let wg;
beforeEach(() => {
	wg = new GARCloserWikicodeGenerator();
});

describe('processKeepForGARPage(garPageWikicode, message, isCommunityAssessment)', () => {
	test('Should place {{atopg}}, and should provide default message if no message specified', () => {
		let isCommunityAssessment = false;
		let garPageWikicode = 
`===GA Review===
{{Good article tools}}
<noinclude>{{al|{{#titleparts:2021 French Grand Prix/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:2021 French Grand Prix/GA1]]. The edit link for this section can be used to add comments to the rehg.''</includeonly>
::I'm happy to support the nomination (and will pass now). I've pretty much given you a FAC review above, which is where the article should probably go. I trust that you'll make the neccesary changes I've outlined before taking it to that forum. Great article, fantastic work '''[[User:Lee Vilenski|<span style="color:green">Lee Vilenski</span>]] <sup>([[User talk:Lee Vilenski|talk]] • [[Special:Contribs/Lee Vilenski|contribs]])</sup>''' 12:13, 13 June 2022 (UTC)
`;
		let message = '';
		let output = 
`===GA Review===
{{atopg
| result = Kept. ~~~~
}}
{{Good article tools}}
<noinclude>{{al|{{#titleparts:2021 French Grand Prix/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:2021 French Grand Prix/GA1]]. The edit link for this section can be used to add comments to the rehg.''</includeonly>
::I'm happy to support the nomination (and will pass now). I've pretty much given you a FAC review above, which is where the article should probably go. I trust that you'll make the neccesary changes I've outlined before taking it to that forum. Great article, fantastic work '''[[User:Lee Vilenski|<span style="color:green">Lee Vilenski</span>]] <sup>([[User talk:Lee Vilenski|talk]] • [[Special:Contribs/Lee Vilenski|contribs]])</sup>''' 12:13, 13 June 2022 (UTC)
{{abot}}
`;
		expect(wg.processKeepForGARPage(garPageWikicode, message, isCommunityAssessment)).toBe(output);
	});

	test(`Should handle community reassessment, which has a slightly different format`, () => {
		let isCommunityAssessment = true;
		let garPageWikicode = 
`===[[Wikipedia:Good article reassessment/NASA/1|NASA]]===

: {{al|NASA|noname=yes}} • <span class="plainlinksneverexpand">[//en.wikipedia.org/w/index.php?title=Wikipedia:Good_article_reassessment/NASA/1&action=watch Watch article reassessment page]</span> • [[Talk:NASA/GA1|Most recent review]]
: {{GAR/current}}<br/>
<!-- Please add the rationale for reassessment below this comment. Subsequent discussion should be added below, until the reassessment is closed.-->
I have never performed a good article review, nor a good article reassessment, so not confident in doing this as an individual reassessment.  ― [[User:Hebsen|Hebsen]] ([[User_talk:Hebsen|talk]]) 23:45, 27 May 2020 (UTC)
`;
		let message = 'Keep. Great work everyone. ~~~~';
		let output = 
`===[[Wikipedia:Good article reassessment/NASA/1|NASA]]===
{{atopg}}
: {{al|NASA|noname=yes}} • <span class="plainlinksneverexpand">[//en.wikipedia.org/w/index.php?title=Wikipedia:Good_article_reassessment/NASA/1&action=watch Watch article reassessment page]</span> • [[Talk:NASA/GA1|Most recent review]]
: {{subst:GAR/result|result=Keep. Great work everyone.}} ~~~~<br/>
<!-- Please add the rationale for reassessment below this comment. Subsequent discussion should be added below, until the reassessment is closed.-->
I have never performed a good article review, nor a good article reassessment, so not confident in doing this as an individual reassessment.  ― [[User:Hebsen|Hebsen]] ([[User_talk:Hebsen|talk]]) 23:45, 27 May 2020 (UTC)
{{abot}}
`;
		expect(wg.processKeepForGARPage(garPageWikicode, message, isCommunityAssessment)).toBe(output);
	});

/*
	// TODO
	test(`Should template parameter escape the {{GAR/result}} reason parameter`, () => {
		let isCommunityAssessment = true;
		let garPageWikicode = 
`===[[Wikipedia:Good article reassessment/NASA/1|NASA]]===
: {{GAR/current}}<br/>
`;
		let message = 'Keep. Great work everyone. {{emoji|face=smiley}} 1+1=2 ~~~~';
		let output = 
`===[[Wikipedia:Good article reassessment/NASA/1|NASA]]===
{{atopg}}
: {{subst:GAR/result|result=Keep. Great work everyone. {{emoji|face=smiley}}}} 1+1{{=}}2 ~~~~<br/>
{{abot}}
`;
		expect(wg.processKeepForGARPage(garPageWikicode, message, isCommunityAssessment)).toBe(output);
	});
*/

	test('Should not place signature twice', () => {
		let isCommunityAssessment = false;
		let garPageWikicode = 
`abc`;
		let message = 'Test ~~~~';
		let output = 
`{{atopg
| result = Test ~~~~
}}
abc
{{abot}}
`;
		expect(wg.processKeepForGARPage(garPageWikicode, message, isCommunityAssessment)).toBe(output);
	});

	test(`Should handle custom message, and should add signature if user doesn't specify it`, () => {
		let isCommunityAssessment = false;
		let garPageWikicode = 
`abc`;
		let message = 'Test';
		let output = 
`{{atopg
| result = Test ~~~~
}}
abc
{{abot}}
`;
		expect(wg.processKeepForGARPage(garPageWikicode, message, isCommunityAssessment)).toBe(output);
	});

	test(`Should trim line breaks between heading and first text`, () => {
		let isCommunityAssessment = true;
		let garPageWikicode = 
`===Test===


test2
`;
		let message = '';
		let output = 
`===Test===
{{atopg}}
test2
{{abot}}
`;
		expect(wg.processKeepForGARPage(garPageWikicode, message, isCommunityAssessment)).toBe(output);
	});
});

describe('processKeepForTalkPage(wikicode, garPageTitle, talkPageTitle)', () => {
	it(`Should remove {{GAR/link}}, add action4 to {{Article history}}, leave currentstatus alone, leave class=GA alone`, () => {
		let garPageTitle = `Wikipedia:Good article reassessment/American popular music/1`;
		let talkPageTitle = `Talk:American popular music`;
		let oldid = 1111;
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
|action4oldid = 1111
|currentstatus = GA
}}
{{WikiProject banner shell|1=
{{WP1.0 |v0.7=pass |class=GA |category=Arts |WPCD=yes |importance=Low}}
{{WikiProject Regional and national music|class=GA|importance=High}}
{{WikiProject United States|class=GA|importance=Mid|USMusic=yes|USMusic-importance=High}}
{{WikiProject Rock music|class=GA|importance=high}}
}}`;
		expect(wg.processKeepForTalkPage(wikicode, garPageTitle, talkPageTitle, oldid)).toBe(output);
	});

	it(`Should remove {{GAR/link}}, remove {{GA}}, add {{Article history}}, leave currentstatus alone, leave class=GA alone`, () => {
		let garPageTitle = `Wikipedia:Good article reassessment/American popular music/1`;
		let talkPageTitle = `Talk:American popular music`;
		let oldid = 1111;
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
|action2oldid = 1111
|currentstatus = GA
}}
{{WikiProject banner shell|1=
{{WP1.0 |v0.7=pass |class=GA |category=Arts |WPCD=yes |importance=Low}}
{{WikiProject Regional and national music|class=GA|importance=High}}
{{WikiProject United States|class=GA|importance=Mid|USMusic=yes|USMusic-importance=High}}
{{WikiProject Rock music|class=GA|importance=high}}
}}`;
		expect(wg.processKeepForTalkPage(wikicode, garPageTitle, talkPageTitle, oldid)).toBe(output);
	});

	it(`Should handle {{GAR/link}} not ending in \\n`, () => {
		let garPageTitle = `Wikipedia:Good article reassessment/Proxima Centauri b/1`;
		let talkPageTitle = `Talk:Proxima Centauri b`;
		let oldid = 1111;
		let wikicode =
`{{GAR/link|10:35, 13 December 2021 (UTC)|page=3|GARpage=1|status= }}{{Talk header}}
{{GA|16:22, 26 February 2017 (UTC)|oldid=767553501|topic=Physics and astronomy|page=2}}
{{Vital article|class=GA|level=5|link=Wikipedia:Vital articles/Level/5/Physical sciences/Astronomy|topic=Science|subpage=Astronomy|anchor=Notable exoplanets (11 articles)}}
{{British English Oxford spelling}}
{{WikiProject Astronomy|class=GA|importance=mid|object=yes}}
{{ITN talk|24 August|2016}}

[[/archive 1]]
== New study regarding life-supporting chances ==`;
		let output =
`{{Talk header}}
{{Vital article|class=GA|level=5|link=Wikipedia:Vital articles/Level/5/Physical sciences/Astronomy|topic=Science|subpage=Astronomy|anchor=Notable exoplanets (11 articles)}}
{{British English Oxford spelling}}
{{Article history
|topic = Physics and astronomy

|action1 = GAN
|action1date = 16:22, 26 February 2017 (UTC)
|action1link = Talk:Proxima Centauri b/GA2
|action1result = listed
|action1oldid = 767553501

|action2 = GAR
|action2date = ~~~~~
|action2link = Wikipedia:Good article reassessment/Proxima Centauri b/1
|action2result = kept
|action2oldid = 1111
|currentstatus = GA
}}
{{WikiProject Astronomy|class=GA|importance=mid|object=yes}}
{{ITN talk|24 August|2016}}

[[/archive 1]]
== New study regarding life-supporting chances ==`;
		expect(wg.processKeepForTalkPage(wikicode, garPageTitle, talkPageTitle, oldid)).toBe(output);
	});
});

describe('makeCommunityAssessmentLogEntry(garTitle, wikicode, newArchive, archiveTitle)', () => {
	it(`Should handle non-full archive`, () => {
		let garTitle = `Wikipedia:Good article reassessment/American popular music/1`;
		let newArchive = false;
		let archiveTitle = `Wikipedia:Good article reassessment/Archive 67`;
		let wikicode =
`__TOC__
{{Wikipedia:Good article reassessment/Trucking industry in the United States/2}}`;
		let output =
`__TOC__
{{Wikipedia:Good article reassessment/Trucking industry in the United States/2}}
{{Wikipedia:Good article reassessment/American popular music/1}}`;
		expect(wg.makeCommunityAssessmentLogEntry(garTitle, wikicode, newArchive, archiveTitle)).toBe(output);
	});

	it(`Should handle full archive`, () => {
		let garTitle = `Wikipedia:Good article reassessment/American popular music/1`;
		let newArchive = true;
		let wikicode = ``;
		let archiveTitle = `Wikipedia:Good article reassessment/Archive 67`;
		let output =
`{| class="messagebox"
|-
| [[Image:Filing cabinet icon.svg|50px|Archive]]
| This is an '''[[Wikipedia:How to archive a talk page|archive]]''' of past discussions. Its contents should be preserved in their current form. If you wish to start a new discussion or revive an old one, please do so on the <span class="plainlinks">[{{FULLURL:{{TALKSPACE}}:{{BASEPAGENAME}}}} current talk page]</span>.<!-- Template:Talkarchive -->
|}
{{Template:Process header green
 | title    = Good article reassessment
 | section  = (archive)
 | previous = ([[Wikipedia:Good article reassessment/Archive 66|Page 66]])
 | next     = ([[Wikipedia:Good article reassessment/Archive 68|Page 68]]) 
 | shortcut =
 | notes    =
}}
__TOC__
{{Wikipedia:Good article reassessment/American popular music/1}}`;
		expect(wg.makeCommunityAssessmentLogEntry(garTitle, wikicode, newArchive, archiveTitle)).toBe(output);
	});});

describe('setGARArchiveTemplate(newArchiveTitle)', () => {
	it('Should increment 67 to 68', () => {
		let newArchiveTitle = `Wikipedia:Good article reassessment/Archive 68`;
		let wikicode =
`67<noinclude>

[[Category:Wikipedia GA templates|{{PAGENAME}}]]
</noinclude>
`;
		let output =
`68<noinclude>

[[Category:Wikipedia GA templates|{{PAGENAME}}]]
</noinclude>
`;
		expect(wg.setGARArchiveTemplate(newArchiveTitle, wikicode)).toBe(output);
	});
});

		let garArchiveTemplateRevisionID = 987;
describe('makeScriptLogEntryToAppend(username, keepOrDelist, reviewTitle, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID)', () => {
	it(`Should handle individual pass`, () => {
		let username = `Novem Linguae`;
		let keepOrDelist = `keep`;
		let reviewTitle = `Talk:Geothermal energy/GA2`;
		let garRevisionID = 987;
		let talkRevisionID = 123;
		let articleRevisionID = undefined;
		let gaListRevisionID = undefined;
		let garLogRevisionID = undefined;
		let garArchiveTemplateRevisionID = undefined;
		let error = false;
		let categoryRevisionID = undefined;
		let output = `\n* [[User:Novem Linguae|Novem Linguae]] kept [[Talk:Geothermal energy/GA2]] at ~~~~~. [[Special:Diff/987|[Atop]]][[Special:Diff/123|[Talk]]]`;
		expect(wg.makeScriptLogEntryToAppend(username, keepOrDelist, reviewTitle, garRevisionID, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID)).toBe(output);
	});

	it(`Should handle individual fail`, () => {
		let username = `Novem Linguae`;
		let keepOrDelist = `delist`;
		let reviewTitle = `Talk:Geothermal energy/GA2`;
		let garRevisionID = 987;
		let talkRevisionID = 123;
		let articleRevisionID = 456;
		let gaListRevisionID = 789;
		let garLogRevisionID = undefined;
		let garArchiveTemplateRevisionID = undefined;
		let error = false;
		let categoryRevisionID = undefined;
		let output = `\n* [[User:Novem Linguae|Novem Linguae]] delisted [[Talk:Geothermal energy/GA2]] at ~~~~~. [[Special:Diff/987|[Atop]]][[Special:Diff/123|[Talk]]][[Special:Diff/456|[Article]]][[Special:Diff/789|[List]]]`;
		expect(wg.makeScriptLogEntryToAppend(username, keepOrDelist, reviewTitle, garRevisionID, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID)).toBe(output);
	});

	it(`Should handle community pass`, () => {
		let username = `Novem Linguae`;
		let keepOrDelist = `keep`;
		let reviewTitle = `Wikipedia:Good article reassessment/WIN Television/1`;
		let garRevisionID = 987;
		let talkRevisionID = 123;
		let articleRevisionID = undefined;
		let gaListRevisionID = undefined;
		let garLogRevisionID = 456;
		let garArchiveTemplateRevisionID = undefined;
		let error = false;
		let categoryRevisionID = undefined;
		let output = `\n* [[User:Novem Linguae|Novem Linguae]] kept [[Wikipedia:Good article reassessment/WIN Television/1]] at ~~~~~. [[Special:Diff/987|[Atop]]][[Special:Diff/123|[Talk]]][[Special:Diff/456|[Log]]]`;
		expect(wg.makeScriptLogEntryToAppend(username, keepOrDelist, reviewTitle, garRevisionID, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID)).toBe(output);
	});

	it(`Should handle community fail`, () => {
		let username = `Novem Linguae`;
		let keepOrDelist = `delist`;
		let reviewTitle = `Wikipedia:Good article reassessment/WIN Television/1`;
		let garRevisionID = 987;
		let talkRevisionID = 123;
		let articleRevisionID = 456;
		let gaListRevisionID = 789;
		let garLogRevisionID = 101112;
		let garArchiveTemplateRevisionID = undefined;
		let error = false;
		let categoryRevisionID = undefined;
		let output = `\n* [[User:Novem Linguae|Novem Linguae]] delisted [[Wikipedia:Good article reassessment/WIN Television/1]] at ~~~~~. [[Special:Diff/987|[Atop]]][[Special:Diff/123|[Talk]]][[Special:Diff/456|[Article]]][[Special:Diff/789|[List]]][[Special:Diff/101112|[Log]]]`;
		expect(wg.makeScriptLogEntryToAppend(username, keepOrDelist, reviewTitle, garRevisionID, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID)).toBe(output);
	});

	it(`Should handle community pass when the archive is full, requiring a new archive page`, () => {
		let username = `Novem Linguae`;
		let keepOrDelist = `keep`;
		let reviewTitle = `Wikipedia:Good article reassessment/WIN Television/1`;
		let garRevisionID = 987;
		let talkRevisionID = 123;
		let articleRevisionID = undefined;
		let gaListRevisionID = undefined;
		let garLogRevisionID = 456;
		let garArchiveTemplateRevisionID = 987;
		let error = false;
		let categoryRevisionID = 555;
		let output = `\n* [[User:Novem Linguae|Novem Linguae]] kept [[Wikipedia:Good article reassessment/WIN Television/1]] at ~~~~~. [[Special:Diff/987|[Atop]]][[Special:Diff/123|[Talk]]][[Special:Diff/456|[Log]]][[Special:Diff/987|[Tmpl]]][[Special:Diff/555|[Cat]]]`;
		expect(wg.makeScriptLogEntryToAppend(username, keepOrDelist, reviewTitle, garRevisionID, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID)).toBe(output);
	});

	it(`Should handle error`, () => {
		let username = `Novem Linguae`;
		let keepOrDelist = `delist`;
		let reviewTitle = `Wikipedia:Good article reassessment/WIN Television/1`;
		let garRevisionID = 987;
		let talkRevisionID = 123;
		let articleRevisionID = 456;
		let gaListRevisionID = 789;
		let garLogRevisionID = 101112;
		let garArchiveTemplateRevisionID = undefined;
		let categoryRevisionID = undefined;
		let error = `ReferenceError: getPassWikicodeForGANPage is not defined`;
		let output = `\n* <span style="color: red; font-weight: bold;">ERROR:</span> ReferenceError: getPassWikicodeForGANPage is not defined. [[User:Novem Linguae|Novem Linguae]] delisted [[Wikipedia:Good article reassessment/WIN Television/1]] at ~~~~~. [[Special:Diff/987|[Atop]]][[Special:Diff/123|[Talk]]][[Special:Diff/456|[Article]]][[Special:Diff/789|[List]]][[Special:Diff/101112|[Log]]]`;
		expect(wg.makeScriptLogEntryToAppend(username, keepOrDelist, reviewTitle, garRevisionID, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID)).toBe(output);
	});
});

describe('processDelistForGARPage(garPageWikicode, message, isCommunityAssessment)', () => {
	test('Should place {{atopr}}', () => {
		let isCommunityAssessment = false;
		let garPageWikicode = 
`===GA Review===
{{Good article tools}}
<noinclude>{{al|{{#titleparts:2021 French Grand Prix/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:2021 French Grand Prix/GA1]]. The edit link for this section can be used to add comments to the rehg.''</includeonly>
::I'm happy to support the nomination (and will pass now). I've pretty much given you a FAC review above, which is where the article should probably go. I trust that you'll make the neccesary changes I've outlined before taking it to that forum. Great article, fantastic work '''[[User:Lee Vilenski|<span style="color:green">Lee Vilenski</span>]] <sup>([[User talk:Lee Vilenski|talk]] • [[Special:Contribs/Lee Vilenski|contribs]])</sup>''' 12:13, 13 June 2022 (UTC)
`;
		let message = '';
		let output = 
`===GA Review===
{{atopr
| result = Delisted. ~~~~
}}
{{Good article tools}}
<noinclude>{{al|{{#titleparts:2021 French Grand Prix/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:2021 French Grand Prix/GA1]]. The edit link for this section can be used to add comments to the rehg.''</includeonly>
::I'm happy to support the nomination (and will pass now). I've pretty much given you a FAC review above, which is where the article should probably go. I trust that you'll make the neccesary changes I've outlined before taking it to that forum. Great article, fantastic work '''[[User:Lee Vilenski|<span style="color:green">Lee Vilenski</span>]] <sup>([[User talk:Lee Vilenski|talk]] • [[Special:Contribs/Lee Vilenski|contribs]])</sup>''' 12:13, 13 June 2022 (UTC)
{{abot}}
`;
		expect(wg.processDelistForGARPage(garPageWikicode, message, isCommunityAssessment)).toBe(output);
	});

	test(`Should handle H2`, () => {
		let isCommunityAssessment = false;
		let garPageWikicode = 
`==GA Reassessment==
<noinclude>{{al|{{#titleparts:First Macedonian War/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This discussion is [[WP:transclusion|transcluded]] from [[Talk:First Macedonian War/GA1]]. The edit link for this section can be used to add comments to the reassessment.''</includeonly>
<!-- Please add all reassessment comments below this comment, and do not alter what is above. To keep the discussion within a single section, please do not use level 2 headers (==...==) below to break up the reassessment. Use level 3 (===...===), level 4 and so on.-->
`;
		let message = '';
		let output = 
`==GA Reassessment==
{{atopr
| result = Delisted. ~~~~
}}
<noinclude>{{al|{{#titleparts:First Macedonian War/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This discussion is [[WP:transclusion|transcluded]] from [[Talk:First Macedonian War/GA1]]. The edit link for this section can be used to add comments to the reassessment.''</includeonly>
<!-- Please add all reassessment comments below this comment, and do not alter what is above. To keep the discussion within a single section, please do not use level 2 headers (==...==) below to break up the reassessment. Use level 3 (===...===), level 4 and so on.-->
{{abot}}
`;
		expect(wg.processDelistForGARPage(garPageWikicode, message, isCommunityAssessment)).toBe(output);
	});
});

describe('processDelistForTalkPage(wikicode, garPageTitle, talkPageTitle)', () => {
	it(`Should remove {{GAR/link}}, add action4 to {{Article history}}, set currentstatus to DGA, and remove class=GA`, () => {
		let garPageTitle = `Wikipedia:Good article reassessment/American popular music/1`;
		let talkPageTitle = `Talk:American popular music`;
		let oldid = 1111;
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
|action4oldid = 1111
|currentstatus = DGA
}}
{{WikiProject banner shell|1=
{{WP1.0 |v0.7=pass |class= |category=Arts |WPCD=yes |importance=Low}}
{{WikiProject Regional and national music|class=|importance=High}}
{{WikiProject United States|class=|importance=Mid|USMusic=yes|USMusic-importance=High}}
{{WikiProject Rock music|class=|importance=high}}
}}`;
		expect(wg.processDelistForTalkPage(wikicode, garPageTitle, talkPageTitle, oldid)).toBe(output);
	});

	it(`Should remove {{GAR/link}}, remove {{GA}}, add {{Article history}}, and remove class=GA`, () => {
		let garPageTitle = `Wikipedia:Good article reassessment/American popular music/1`;
		let talkPageTitle = `Talk:American popular music`;
		let oldid = 1111;
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
|action2oldid = 1111
|currentstatus = DGA
}}
{{WikiProject banner shell|1=
{{WP1.0 |v0.7=pass |class= |category=Arts |WPCD=yes |importance=Low}}
{{WikiProject Regional and national music|class=|importance=High}}
{{WikiProject United States|class=|importance=Mid|USMusic=yes|USMusic-importance=High}}
{{WikiProject Rock music|class=|importance=high}}
}}`;
		expect(wg.processDelistForTalkPage(wikicode, garPageTitle, talkPageTitle, oldid)).toBe(output);
	});

	it(`should handle {{ArticleHistory}} containing a nested template`, () => {
		let garPageTitle = `Wikipedia:Good article reassessment/Royce White/1`;
		let talkPageTitle = `Talk:Royce White`;
		let oldid = 1111;
		let wikicode = 
`{{GAR/link|17:09, 22 February 2022 (UTC)|page=2|GARpage=1|status= }}
{{ArticleHistory
|action1=GAN
|action1date=04:22, 26 December 2011 (UTC)
|action1link=Talk:Royce White/GA1
|action1result=listed
|action1oldid=467699196
|dykdate=13 December 2011
|dykentry=... that during '''[[Royce White]]'''{{\`s}} two-and-a-half-year hiatus from competitive [[basketball]], he spent time on his music career and learned how to play the [[piano]]?
|currentstatus=GA
|topic=sports
}}`;
		let output = 
`{{ArticleHistory
|action1=GAN
|action1date=04:22, 26 December 2011 (UTC)
|action1link=Talk:Royce White/GA1
|action1result=listed
|action1oldid=467699196
|dykdate=13 December 2011
|dykentry=... that during '''[[Royce White]]'''{{\`s}} two-and-a-half-year hiatus from competitive [[basketball]], he spent time on his music career and learned how to play the [[piano]]?
|topic=sports

|action2 = GAR
|action2date = ~~~~~
|action2link = Wikipedia:Good article reassessment/Royce White/1
|action2result = delisted
|action2oldid = 1111
|currentstatus = DGA
}}`;
		expect(wg.processDelistForTalkPage(wikicode, garPageTitle, talkPageTitle, oldid)).toBe(output);
	});

	it(`should handle {{football|class=GA`, () => {
		let garPageTitle = `Talk:Sudan women's national football team/GA3`;
		let talkPageTitle = `Talk:Sudan women's national football team`;
		let oldid = 1111;
		let wikicode = 
`{{GAR/link|16:08, 2 July 2022 (UTC)|page=3|GARpage=1|status= }}
{{ArticleHistory
|action1=GAN
|action1date=06:39, 9 June 2012
|action1link=Talk:Sudan women's national football team/GA1
|action1result=not listed
|action1oldid=496005773

|action2=GAN
|action2date=17:10, 17 June 2012
|action2link=Talk:Sudan women's national football team/GA2
|action2result=listed
|action2oldid=498047652

|dykdate=29 April 2012
|dykentry=... that while [[FIFA]] inquired about the creation of a '''[[Sudan women's national football team|Sudanese women's national football team]]''', the Islamic Fiqh Council in [[Sudan]] issued a [[fatwa]] forbidding it?
|nompage=Template:Did you know nominations/Sudan women's national football team
|currentstatus=GA
|topic=sports
}}
{{WikiProjectBannerShell|blp=no|1=
{{WikiProject Africa|class=GA|importance=MID|Sudan=yes|Sudan-importance=low}}
{{WikiProject Women's sport|class=GA|importance=mid|footy=yes}}
{{football|class=GA|importance=mid|Africa=yes|National=Mid|women=High}}
}}
{{British English}}
`;
		let output = 
`{{ArticleHistory
|action1=GAN
|action1date=06:39, 9 June 2012
|action1link=Talk:Sudan women's national football team/GA1
|action1result=not listed
|action1oldid=496005773

|action2=GAN
|action2date=17:10, 17 June 2012
|action2link=Talk:Sudan women's national football team/GA2
|action2result=listed
|action2oldid=498047652

|dykdate=29 April 2012
|dykentry=... that while [[FIFA]] inquired about the creation of a '''[[Sudan women's national football team|Sudanese women's national football team]]''', the Islamic Fiqh Council in [[Sudan]] issued a [[fatwa]] forbidding it?
|nompage=Template:Did you know nominations/Sudan women's national football team
|topic=sports

|action3 = GAR
|action3date = ~~~~~
|action3link = Talk:Sudan women's national football team/GA3
|action3result = delisted
|action3oldid = 1111
|currentstatus = DGA
}}
{{WikiProjectBannerShell|blp=no|1=
{{WikiProject Africa|class=|importance=MID|Sudan=yes|Sudan-importance=low}}
{{WikiProject Women's sport|class=|importance=mid|footy=yes}}
{{football|class=|importance=mid|Africa=yes|National=Mid|women=High}}
}}
{{British English}}
`;
		expect(wg.processDelistForTalkPage(wikicode, garPageTitle, talkPageTitle, oldid)).toBe(output);
	});

	it(`should remove {{GAR request}}`, () => {
		let garPageTitle = `Wikipedia:Good article reassessment/Once Upon a Time (game)/1`;
		let talkPageTitle = `Talk:Once Upon a Time (game)`;
		let oldid = 1111;
		let wikicode = 
`{{GAR/link|06:50, 15 August 2022 (UTC)|page=2|GARpage=1|status= }}
{{Article history
|action1=GAN
|action1date=12:42, 27 July 2008 (UTC)
|action1result=listed
|action1oldid=228181192
|currentstatus=GA
|topic=everydaylife
}}
{{BTGProject|class=GA|importance=low}}
{{GAR request}}

==Release date==
`;
		let output = 
`{{Article history
|action1=GAN
|action1date=12:42, 27 July 2008 (UTC)
|action1result=listed
|action1oldid=228181192
|topic=everydaylife

|action2 = GAR
|action2date = ~~~~~
|action2link = Wikipedia:Good article reassessment/Once Upon a Time (game)/1
|action2result = delisted
|action2oldid = 1111
|currentstatus = DGA
}}
{{BTGProject|class=|importance=low}}

==Release date==
`;
		expect(wg.processDelistForTalkPage(wikicode, garPageTitle, talkPageTitle, oldid)).toBe(output);
	});

	it(`should handle {{ArticleHistory}} with no space`, () => {
		let garPageTitle = `Wikipedia:Good article reassessment/Once Upon a Time (game)/1`;
		let talkPageTitle = `Talk:Once Upon a Time (game)`;
		let oldid = 1111;
		let wikicode = 
`{{GAR/link|06:50, 15 August 2022 (UTC)|page=2|GARpage=1|status= }}
{{ArticleHistory
|action1=GAN
|action1date=12:42, 27 July 2008 (UTC)
|action1result=listed
|action1oldid=228181192
|currentstatus=GA
|topic=everydaylife
}}
{{BTGProject|class=GA|importance=low}}

==Release date==
`;
		let output = 
`{{ArticleHistory
|action1=GAN
|action1date=12:42, 27 July 2008 (UTC)
|action1result=listed
|action1oldid=228181192
|topic=everydaylife

|action2 = GAR
|action2date = ~~~~~
|action2link = Wikipedia:Good article reassessment/Once Upon a Time (game)/1
|action2result = delisted
|action2oldid = 1111
|currentstatus = DGA
}}
{{BTGProject|class=|importance=low}}

==Release date==
`;
		expect(wg.processDelistForTalkPage(wikicode, garPageTitle, talkPageTitle, oldid)).toBe(output);
	});
});

describe('processDelistForArticle(wikicode)', () => {
	it(`Should remove {{Good article}} 1`, () => {
		let wikicode =
`{{Short description|None}}
{{Good article}}
{{USmusicgenres}}`;
		let output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect(wg.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should handle template being at top of wikicode`, () => {
		let wikicode =
`{{Good article}}
{{USmusicgenres}}`;
		let output =
`{{USmusicgenres}}`;
		expect(wg.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should handle template being at bottom of wikicode`, () => {
		let wikicode =
`{{USmusicgenres}}
{{Good article}}`;
		let output =
`{{USmusicgenres}}
`;
		expect(wg.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should remove {{good article}}`, () => {
		let wikicode =
`{{Short description|None}}
{{good article}}
{{USmusicgenres}}`;
		let output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect(wg.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should remove {{Good Article}} 2`, () => {
		let wikicode =
`{{Short description|None}}
{{Good Article}}
{{USmusicgenres}}`;
		let output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect(wg.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should remove {{GA article}}`, () => {
		let wikicode =
`{{Short description|None}}
{{GA article}}
{{USmusicgenres}}`;
		let output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect(wg.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should remove {{ga article}}`, () => {
		let wikicode =
`{{Short description|None}}
{{ga article}}
{{USmusicgenres}}`;
		let output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect(wg.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should remove {{GA icon}}`, () => {
		let wikicode =
`{{Short description|None}}
{{GA icon}}
{{USmusicgenres}}`;
		let output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect(wg.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should remove {{ga icon}}`, () => {
		let wikicode =
`{{Short description|None}}
{{ga icon}}
{{USmusicgenres}}`;
		let output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect(wg.processDelistForArticle(wikicode)).toBe(output);
	});

	it(`Should remove extra line breaks`, () => {
		let wikicode =
`{{Authority control}}

{{good article}}

{{Use mdy dates|date=December 2014}}`;
		let output =
`{{Authority control}}

{{Use mdy dates|date=December 2014}}`;
		expect(wg.processDelistForArticle(wikicode)).toBe(output);
	});
});

describe('processDelistForGAList(wikicode, articleToRemove)', () => {
	it(`Should remove when first in list`, () => {
		let articleToRemove = `American popular music`;
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
		expect(wg.processDelistForGAList(wikicode, articleToRemove)).toBe(output);
	});

	it(`Should remove when in middle of list`, () => {
		let articleToRemove = `Andorra in the Eurovision Song Contest`;
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
		expect(wg.processDelistForGAList(wikicode, articleToRemove)).toBe(output);
	});

	it(`Should handle piped wikilink`, () => {
		let articleToRemove = `Andorra in the Eurovision Song Contest`;
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
		expect(wg.processDelistForGAList(wikicode, articleToRemove)).toBe(output);
	});

	it(`Should handle piped wikilink surrounded by italics outside`, () => {
		let articleToRemove = `Andorra in the Eurovision Song Contest`;
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
		expect(wg.processDelistForGAList(wikicode, articleToRemove)).toBe(output);
	});

	it(`Should handle piped wikilink surrounded by italics inside`, () => {
		let articleToRemove = `Andorra in the Eurovision Song Contest`;
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
		expect(wg.processDelistForGAList(wikicode, articleToRemove)).toBe(output);
	});

	it(`Should remove when last in list`, () => {
		let articleToRemove = `Andorra in the Eurovision Song Contest`;
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
		expect(wg.processDelistForGAList(wikicode, articleToRemove)).toBe(output);
	});

	it(`Should remove when only item in list`, () => {
		let articleToRemove = `American popular music`;
		let wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
}}`;
		let output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
}}`;
		expect(wg.processDelistForGAList(wikicode, articleToRemove)).toBe(output);
	});

	it(`Should remove when non-piped wikilink surrounded by double quotes`, () => {
		let articleToRemove = `I Don't Miss You at All`;
		let wikicode =
`=====2019 songs=====
{{#invoke:Good Articles|subsection|
[[29 (song)|"29" (song)]]
"[[I Don't Miss You at All]]"
"[[I Don't Search I Find]]"
`;
		let output =
`=====2019 songs=====
{{#invoke:Good Articles|subsection|
[[29 (song)|"29" (song)]]
"[[I Don't Search I Find]]"
`;
		expect(wg.processDelistForGAList(wikicode, articleToRemove)).toBe(output);
	});

	it(`Should do nothing when item not found`, () => {
		let articleToRemove = `Andorra in the Eurovision Song Contest`;
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
		expect(wg.processDelistForGAList(wikicode, articleToRemove)).toBe(output);
	});

	it(`Should handle rare case of the item being listed twice`, () => {
		let articleToRemove = `Multilateral Investment Guarantee Agency`;
		let wikicode =
`===== Globalization =====
{{#invoke:Good Articles|subsection|
[[Globalization and women in China]]
[[Multilateral Investment Guarantee Agency]]
[[Spanish flu]]
}}

=====Businesses and organizations=====
{{#invoke:Good Articles|subsection|
''[[The Accounting Review]]''
[[Multilateral Investment Guarantee Agency]]
[[Mzoli's]]
}}
`;
		let output =
`===== Globalization =====
{{#invoke:Good Articles|subsection|
[[Globalization and women in China]]
[[Spanish flu]]
}}

=====Businesses and organizations=====
{{#invoke:Good Articles|subsection|
''[[The Accounting Review]]''
[[Mzoli's]]
}}
`;
		expect(wg.processDelistForGAList(wikicode, articleToRemove)).toBe(output);
	});

	it(`Should delete the exact article name only`, () => {
		let articleToRemove = `Fish`;
		let wikicode =
`===== Globalization =====
{{#invoke:Good Articles|subsection|
[[Globalization and women in China]]
[[Fish allergy]]
[[Fish]]
[[Fisher (animal)]]
[[Spanish flu]]
}}
`;
		let output =
`===== Globalization =====
{{#invoke:Good Articles|subsection|
[[Globalization and women in China]]
[[Fish allergy]]
[[Fisher (animal)]]
[[Spanish flu]]
}}
`;
		expect(wg.processDelistForGAList(wikicode, articleToRemove)).toBe(output);
	});
});

// private methods

describe('preg_position(regex, haystack)', () => {
	test(`preg_position_false`, () => {
		let regex = new RegExp(`hello`, 'gis');
		let haystack = `How are you?`;
		let result = wg.preg_position(regex, haystack);
		expect(result).toBe(false);
	});
	
	test(`preg_position_zero`, () => {
		let regex = new RegExp(`How`, `gis`);
		let haystack = `How are you?`;
		let result = wg.preg_position(regex, haystack);
		expect(result).toBe(0);
	});
	
	test(`preg_position_positive`, () => {
		let regex = new RegExp(`are`, `gis`);
		let haystack = `How are you?`;
		let result = wg.preg_position(regex, haystack);
		expect(result).toBe(4);
	});
	
	test(`preg_position_end`, () => {
		let regex = new RegExp(`$`, `gis`);
		let haystack = `How are you?`;
		let result = wg.preg_position(regex, haystack);
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
		expect(wg.getParametersFromTemplateWikicode(wikicodeOfSingleTemplate)).toStrictEqual(output);
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
		let result = wg.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
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
		let result = wg.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
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
		let result = wg.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
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
		let result = wg.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
		expect(result).toBe('[[Test]]');
	});
	
	test(`addToTalkPageAboveWikiProjects_start`, () => {
		let talkPageWikicode =
`== Heading 1 ==
Test`;
		let wikicodeToAdd = `[[Test]]`;
		let result = wg.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
		expect(result).toBe(
`[[Test]]
== Heading 1 ==
Test`
		);
	});
	
	test(`addToTalkPageAboveWikiProjects_end`, () => {
		let talkPageWikicode = `Test`;
		let wikicodeToAdd = `[[Test]]`;
		let result = wg.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
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
		let result = wg.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
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
		let result = wg.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
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
		let result = wg.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
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
		let result = wg.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd);
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
		expect(wg.addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd)).toBe(output);
	});
});

describe('deleteMiddleOfString(string, deleteStartPosition, deleteEndPosition)', () => {
	test(`deleteMiddleOfString`, () => {
		let string = `Test DELETE THIS dont delete this`;
		let deleteStartPosition = 5;
		let deleteEndPosition = 17;
		let result = wg.deleteMiddleOfString(string, deleteStartPosition, deleteEndPosition);
		expect(result).toBe('Test dont delete this');
	});
	
	test(`deleteMiddleOfString_blank`, () => {
		let string = ``;
		let deleteStartPosition = 0;
		let deleteEndPosition = 0;
		let result = wg.deleteMiddleOfString(string, deleteStartPosition, deleteEndPosition);
		expect(result).toBe('');
	});
});

describe('regexGetFirstMatchString(regex, haystack)', () => {
	test(`match`, () => {
		let regex = /hello ([^ ]+)/;
		let haystack = `hello test goodbye`;
		let result = wg.regexGetFirstMatchString(regex, haystack);
		expect(result).toBe('test');
	});

	test(`no match`, () => {
		let regex = /hello (bob)/;
		let haystack = `hello test goodbye`;
		let result = wg.regexGetFirstMatchString(regex, haystack);
		expect(result).toBe(null);
	});

	test(`no capture group, no match`, () => {
		let regex = /hello bob/;
		let haystack = `hello test goodbye`;
		let result = wg.regexGetFirstMatchString(regex, haystack);
		expect(result).toBe(null);
	});

	test(`no capture group, yes match`, () => {
		let regex = /hello bob/;
		let haystack = `hello bob`;
		let result = wg.regexGetFirstMatchString(regex, haystack);
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
		expect(wg.convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode)).toBe(output);
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
		expect(wg.convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode)).toBe(output);
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
		expect(wg.convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode)).toBe(output);
	});

	it(`should handle date= instead of the usual 1=`, () => {
		let talkPageTitle =`Talk:Test`;
		let wikicode = `{{GA|date=20:19, 29 June 2022 (UTC)|topic=Language and literature}}`;
		let output =
`{{Article history
|currentstatus = GA
|topic = Language and literature

|action1 = GAN
|action1date = 20:19, 29 June 2022 (UTC)
|action1link = Talk:Test/GA1
|action1result = listed
}}`;
		expect(wg.convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode)).toBe(output);
	});
});

describe('getStrPosOfEndOfFirstTemplateFound(wikicode, templateName)', () => {
	it(`should handle needle template being 1st template on the page`, () => {
		let wikicode = 
`{{Good topic box}}`;
		let templateNameArrayCaseInsensitive = 'good topic box';
		let output = 18;
		expect(wg.getStrPosOfEndOfFirstTemplateFound(wikicode, templateNameArrayCaseInsensitive)).toBe(output);
	});

	it(`should handle needle template being 1st template on the page`, () => {
		let wikicode = 
`Test{{Good topic box}}`;
		let templateNameArrayCaseInsensitive = 'good topic box';
		let output = 22;
		expect(wg.getStrPosOfEndOfFirstTemplateFound(wikicode, templateNameArrayCaseInsensitive)).toBe(output);
	});

	it(`should handle needle template being 1st template on the page`, () => {
		let wikicode = 
`Test
{{Good topic box}}`;
		let templateNameArrayCaseInsensitive = 'good topic box';
		let output = 23;
		expect(wg.getStrPosOfEndOfFirstTemplateFound(wikicode, templateNameArrayCaseInsensitive)).toBe(output);
	});

	it(`should handle needle template being 1st template on the page`, () => {
		let wikicode = 
`Test
{{Good topic box
| algo                = old(120d)
| archive             = Wikipedia talk:Featured and good topic candidates/%(year)d
| archiveheader       = {{Automatic archive navigator}}
| minthreadstoarchive = 1
| minthreadsleft      = 4
}}
{{tmbox
|text= '''Questions about a topic you are working on or about the process in general should be asked at [[Wikipedia talk:Featured and good topic questions|Featured and good topic questions]].'''  This page is primarily for discussion on proposals regarding the FTC process.
}}`;
		let templateNameArrayCaseInsensitive = 'good topic box';
		let output = 249;
		expect(wg.getStrPosOfEndOfFirstTemplateFound(wikicode, templateNameArrayCaseInsensitive)).toBe(output);
	});

	it(`should handle needle template being 2nd template on the page`, () => {
		let wikicode = 
`Test
{{tmbox
|text= '''Questions about a topic you are working on or about the process in general should be asked at [[Wikipedia talk:Featured and good topic questions|Featured and good topic questions]].'''  This page is primarily for discussion on proposals regarding the FTC process.
}}
{{Good topic box
| algo                = old(120d)
| archive             = Wikipedia talk:Featured and good topic candidates/%(year)d
| archiveheader       = {{Automatic archive navigator}}
| minthreadstoarchive = 1
| minthreadsleft      = 4
}}`;
		let templateNameArrayCaseInsensitive = 'good topic box';
		let output = 534;
		expect(wg.getStrPosOfEndOfFirstTemplateFound(wikicode, templateNameArrayCaseInsensitive)).toBe(output);
	});

	it(`should handle template not found`, () => {
		let wikicode = 
`{{User:MiszaBot/config
| algo                = old(120d)
| archive             = Wikipedia talk:Featured and good topic candidates/%(year)d
| archiveheader       = {{Automatic archive navigator}}
| minthreadstoarchive = 1
| minthreadsleft      = 4
}}
{{tmbox
|text= '''Questions about a topic you are working on or about the process in general should be asked at [[Wikipedia talk:Featured and good topic questions|Featured and good topic questions]].'''  This page is primarily for discussion on proposals regarding the FTC process.
}}`;
		let templateNameArrayCaseInsensitive = 'good topic box';
		let output = null;
		expect(wg.getStrPosOfEndOfFirstTemplateFound(wikicode, templateNameArrayCaseInsensitive)).toBe(output);
	});

	it(`should handle nested templates`, () => {
		let wikicode = 
`{{GAR/link|17:09, 22 February 2022 (UTC)|page=2|GARpage=1|status= }}
{{ArticleHistory
|action1=GAN
|action1date=04:22, 26 December 2011 (UTC)
|action1link=Talk:Royce White/GA1
|action1result=listed
|action1oldid=467699196
|dykdate=13 December 2011
|dykentry=... that during '''[[Royce White]]'''{{\`s}} two-and-a-half-year hiatus from competitive [[basketball]], he spent time on his music career and learned how to play the [[piano]]?
|currentstatus=GA
|topic=sports
}}`;
		let templateNameArrayCaseInsensitive = 'ArticleHistory';
		let output = 469;
		expect(wg.getStrPosOfEndOfFirstTemplateFound(wikicode, templateNameArrayCaseInsensitive)).toBe(output);
	});
});