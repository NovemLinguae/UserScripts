const { GARCloserWikicodeGenerator } = require( '../modules/GARCloserWikicodeGenerator.js' );

let wg;
beforeEach( () => {
	wg = new GARCloserWikicodeGenerator();
} );

describe( 'processKeepForGARPage(garPageWikicode, message, isCommunityAssessment)', () => {
	test( 'Should place {{atopg}}, and should provide default message if no message specified', () => {
		const isCommunityAssessment = false;
		const garPageWikicode =
`===GA Review===
{{Good article tools}}
<noinclude>{{al|{{#titleparts:2021 French Grand Prix/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:2021 French Grand Prix/GA1]]. The edit link for this section can be used to add comments to the rehg.''</includeonly>
::I'm happy to support the nomination (and will pass now). I've pretty much given you a FAC review above, which is where the article should probably go. I trust that you'll make the neccesary changes I've outlined before taking it to that forum. Great article, fantastic work '''[[User:Lee Vilenski|<span style="color:green">Lee Vilenski</span>]] <sup>([[User talk:Lee Vilenski|talk]] • [[Special:Contribs/Lee Vilenski|contribs]])</sup>''' 12:13, 13 June 2022 (UTC)
`;
		const message = '';
		const output =
`===GA Review===
{{atopg
| result = Kept. ~~~~
}}
{{Good article tools}}
<noinclude>{{al|{{#titleparts:2021 French Grand Prix/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:2021 French Grand Prix/GA1]]. The edit link for this section can be used to add comments to the rehg.''</includeonly>
::I'm happy to support the nomination (and will pass now). I've pretty much given you a FAC review above, which is where the article should probably go. I trust that you'll make the neccesary changes I've outlined before taking it to that forum. Great article, fantastic work '''[[User:Lee Vilenski|<span style="color:green">Lee Vilenski</span>]] <sup>([[User talk:Lee Vilenski|talk]] • [[Special:Contribs/Lee Vilenski|contribs]])</sup>''' 12:13, 13 June 2022 (UTC)
{{abot}}
`;
		expect( wg.processKeepForGARPage( garPageWikicode, message, isCommunityAssessment ) ).toBe( output );
	} );

	test( 'Should handle community reassessment, which has a slightly different format', () => {
		const isCommunityAssessment = true;
		const garPageWikicode =
`===[[Wikipedia:Good article reassessment/NASA/1|NASA]]===

: {{al|NASA|noname=yes}} • <span class="plainlinksneverexpand">[//en.wikipedia.org/w/index.php?title=Wikipedia:Good_article_reassessment/NASA/1&action=watch Watch article reassessment page]</span> • [[Talk:NASA/GA1|Most recent review]]
: {{GAR/current}}<br/>
<!-- Please add the rationale for reassessment below this comment. Subsequent discussion should be added below, until the reassessment is closed.-->
I have never performed a good article review, nor a good article reassessment, so not confident in doing this as an individual reassessment.  ― [[User:Hebsen|Hebsen]] ([[User_talk:Hebsen|talk]]) 23:45, 27 May 2020 (UTC)
`;
		const message = 'Keep. Great work everyone. ~~~~';
		const output =
`===[[Wikipedia:Good article reassessment/NASA/1|NASA]]===
{{atopg}}
: {{al|NASA|noname=yes}} • <span class="plainlinksneverexpand">[//en.wikipedia.org/w/index.php?title=Wikipedia:Good_article_reassessment/NASA/1&action=watch Watch article reassessment page]</span> • [[Talk:NASA/GA1|Most recent review]]
: {{subst:GAR/result|result=Keep. Great work everyone.}} ~~~~<br/>
<!-- Please add the rationale for reassessment below this comment. Subsequent discussion should be added below, until the reassessment is closed.-->
I have never performed a good article review, nor a good article reassessment, so not confident in doing this as an individual reassessment.  ― [[User:Hebsen|Hebsen]] ([[User_talk:Hebsen|talk]]) 23:45, 27 May 2020 (UTC)
{{abot}}
`;
		expect( wg.processKeepForGARPage( garPageWikicode, message, isCommunityAssessment ) ).toBe( output );
	} );

	test( 'Should not place signature twice', () => {
		const isCommunityAssessment = false;
		const garPageWikicode =
'abc';
		const message = 'Test ~~~~';
		const output =
`{{atopg
| result = Test ~~~~
}}
abc
{{abot}}
`;
		expect( wg.processKeepForGARPage( garPageWikicode, message, isCommunityAssessment ) ).toBe( output );
	} );

	test( 'Should handle custom message, and should add signature if user doesn\'t specify it', () => {
		const isCommunityAssessment = false;
		const garPageWikicode =
'abc';
		const message = 'Test';
		const output =
`{{atopg
| result = Test ~~~~
}}
abc
{{abot}}
`;
		expect( wg.processKeepForGARPage( garPageWikicode, message, isCommunityAssessment ) ).toBe( output );
	} );

	test( 'Should trim line breaks between heading and first text', () => {
		const isCommunityAssessment = true;
		const garPageWikicode =
`===Test===


test2
`;
		const message = '';
		const output =
`===Test===
{{atopg}}
test2
{{abot}}
`;
		expect( wg.processKeepForGARPage( garPageWikicode, message, isCommunityAssessment ) ).toBe( output );
	} );
} );

describe( 'processKeepForTalkPage(wikicode, garPageTitle, talkPageTitle)', () => {
	it( 'Should remove {{GAR/link}}, add action4 to {{Article history}}, leave currentstatus alone, leave class=GA alone', () => {
		const garPageTitle = 'Wikipedia:Good article reassessment/American popular music/1';
		const talkPageTitle = 'Talk:American popular music';
		const oldid = 1111;
		const wikicode =
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
		const output =
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
		expect( wg.processKeepForTalkPage( wikicode, garPageTitle, talkPageTitle, oldid ) ).toBe( output );
	} );

	it( 'Should remove {{GAR/link}}, remove {{GA}}, add {{Article history}}, leave currentstatus alone, leave class=GA alone', () => {
		const garPageTitle = 'Wikipedia:Good article reassessment/American popular music/1';
		const talkPageTitle = 'Talk:American popular music';
		const oldid = 1111;
		const wikicode =
`{{GAR/link|13:56, 16 March 2022 (UTC)|page=1|GARpage=1|status= }}
{{GA|20:19, 29 June 2022 (UTC)|topic=Language and literature|page=1}}
{{WikiProject banner shell|1=
{{WP1.0 |v0.7=pass |class=GA |category=Arts |WPCD=yes |importance=Low}}
{{WikiProject Regional and national music|class=GA|importance=High}}
{{WikiProject United States|class=GA|importance=Mid|USMusic=yes|USMusic-importance=High}}
{{WikiProject Rock music|class=GA|importance=high}}
}}`;
		const output =
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
		expect( wg.processKeepForTalkPage( wikicode, garPageTitle, talkPageTitle, oldid ) ).toBe( output );
	} );

	it( 'Should handle {{GAR/link}} not ending in \\n', () => {
		const garPageTitle = 'Wikipedia:Good article reassessment/Proxima Centauri b/1';
		const talkPageTitle = 'Talk:Proxima Centauri b';
		const oldid = 1111;
		const wikicode =
`{{GAR/link|10:35, 13 December 2021 (UTC)|page=3|GARpage=1|status= }}{{Talk header}}
{{GA|16:22, 26 February 2017 (UTC)|oldid=767553501|topic=Physics and astronomy|page=2}}
{{Vital article|class=GA|level=5|link=Wikipedia:Vital articles/Level/5/Physical sciences/Astronomy|topic=Science|subpage=Astronomy|anchor=Notable exoplanets (11 articles)}}
{{British English Oxford spelling}}
{{WikiProject Astronomy|class=GA|importance=mid|object=yes}}
{{ITN talk|24 August|2016}}

[[/archive 1]]
== New study regarding life-supporting chances ==`;
		const output =
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
		expect( wg.processKeepForTalkPage( wikicode, garPageTitle, talkPageTitle, oldid ) ).toBe( output );
	} );
} );

describe( 'makeCommunityAssessmentLogEntry(garTitle, wikicode, newArchive, archiveTitle)', () => {
	it( 'Should handle non-full archive', () => {
		const garTitle = 'Wikipedia:Good article reassessment/American popular music/1';
		const newArchive = false;
		const archiveTitle = 'Wikipedia:Good article reassessment/Archive 67';
		const wikicode =
`__TOC__
{{Wikipedia:Good article reassessment/Trucking industry in the United States/2}}`;
		const output =
`__TOC__
{{Wikipedia:Good article reassessment/Trucking industry in the United States/2}}
{{Wikipedia:Good article reassessment/American popular music/1}}`;
		expect( wg.makeCommunityAssessmentLogEntry( garTitle, wikicode, newArchive, archiveTitle ) ).toBe( output );
	} );

	it( 'Should handle full archive', () => {
		const garTitle = 'Wikipedia:Good article reassessment/American popular music/1';
		const newArchive = true;
		const wikicode = '';
		const archiveTitle = 'Wikipedia:Good article reassessment/Archive 67';
		const output =
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
		expect( wg.makeCommunityAssessmentLogEntry( garTitle, wikicode, newArchive, archiveTitle ) ).toBe( output );
	} );
} );

describe( 'setGARArchiveTemplate(newArchiveTitle)', () => {
	it( 'Should increment 67 to 68', () => {
		const newArchiveTitle = 'Wikipedia:Good article reassessment/Archive 68';
		const wikicode =
`67<noinclude>

[[Category:Wikipedia GA templates|{{PAGENAME}}]]
</noinclude>
`;
		const output =
`68<noinclude>

[[Category:Wikipedia GA templates|{{PAGENAME}}]]
</noinclude>
`;
		expect( wg.setGARArchiveTemplate( newArchiveTitle, wikicode ) ).toBe( output );
	} );
} );

describe( 'makeScriptLogEntryToAppend(username, keepOrDelist, reviewTitle, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID)', () => {
	it( 'Should handle individual pass', () => {
		const username = 'Novem Linguae';
		const keepOrDelist = 'keep';
		const reviewTitle = 'Talk:Geothermal energy/GA2';
		const garRevisionID = 987;
		const talkRevisionID = 123;
		const articleRevisionID = undefined;
		const gaListRevisionID = undefined;
		const garLogRevisionID = undefined;
		const garArchiveTemplateRevisionID = undefined;
		const error = false;
		const categoryRevisionID = undefined;
		const output = '\n* [[User:Novem Linguae|Novem Linguae]] kept [[Talk:Geothermal energy/GA2]] at ~~~~~. [[Special:Diff/987|[Atop]]][[Special:Diff/123|[Talk]]]';
		expect( wg.makeScriptLogEntryToAppend( username, keepOrDelist, reviewTitle, garRevisionID, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID ) ).toBe( output );
	} );

	it( 'Should handle individual fail', () => {
		const username = 'Novem Linguae';
		const keepOrDelist = 'delist';
		const reviewTitle = 'Talk:Geothermal energy/GA2';
		const garRevisionID = 987;
		const talkRevisionID = 123;
		const articleRevisionID = 456;
		const gaListRevisionID = 789;
		const garLogRevisionID = undefined;
		const garArchiveTemplateRevisionID = undefined;
		const error = false;
		const categoryRevisionID = undefined;
		const output = '\n* [[User:Novem Linguae|Novem Linguae]] delisted [[Talk:Geothermal energy/GA2]] at ~~~~~. [[Special:Diff/987|[Atop]]][[Special:Diff/123|[Talk]]][[Special:Diff/456|[Article]]][[Special:Diff/789|[List]]]';
		expect( wg.makeScriptLogEntryToAppend( username, keepOrDelist, reviewTitle, garRevisionID, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID ) ).toBe( output );
	} );

	it( 'Should handle community pass', () => {
		const username = 'Novem Linguae';
		const keepOrDelist = 'keep';
		const reviewTitle = 'Wikipedia:Good article reassessment/WIN Television/1';
		const garRevisionID = 987;
		const talkRevisionID = 123;
		const articleRevisionID = undefined;
		const gaListRevisionID = undefined;
		const garLogRevisionID = 456;
		const garArchiveTemplateRevisionID = undefined;
		const error = false;
		const categoryRevisionID = undefined;
		const output = '\n* [[User:Novem Linguae|Novem Linguae]] kept [[Wikipedia:Good article reassessment/WIN Television/1]] at ~~~~~. [[Special:Diff/987|[Atop]]][[Special:Diff/123|[Talk]]][[Special:Diff/456|[Log]]]';
		expect( wg.makeScriptLogEntryToAppend( username, keepOrDelist, reviewTitle, garRevisionID, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID ) ).toBe( output );
	} );

	it( 'Should handle community fail', () => {
		const username = 'Novem Linguae';
		const keepOrDelist = 'delist';
		const reviewTitle = 'Wikipedia:Good article reassessment/WIN Television/1';
		const garRevisionID = 987;
		const talkRevisionID = 123;
		const articleRevisionID = 456;
		const gaListRevisionID = 789;
		const garLogRevisionID = 101112;
		const garArchiveTemplateRevisionID = undefined;
		const error = false;
		const categoryRevisionID = undefined;
		const output = '\n* [[User:Novem Linguae|Novem Linguae]] delisted [[Wikipedia:Good article reassessment/WIN Television/1]] at ~~~~~. [[Special:Diff/987|[Atop]]][[Special:Diff/123|[Talk]]][[Special:Diff/456|[Article]]][[Special:Diff/789|[List]]][[Special:Diff/101112|[Log]]]';
		expect( wg.makeScriptLogEntryToAppend( username, keepOrDelist, reviewTitle, garRevisionID, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID ) ).toBe( output );
	} );

	it( 'Should handle community pass when the archive is full, requiring a new archive page', () => {
		const username = 'Novem Linguae';
		const keepOrDelist = 'keep';
		const reviewTitle = 'Wikipedia:Good article reassessment/WIN Television/1';
		const garRevisionID = 987;
		const talkRevisionID = 123;
		const articleRevisionID = undefined;
		const gaListRevisionID = undefined;
		const garLogRevisionID = 456;
		const garArchiveTemplateRevisionID = 987;
		const error = false;
		const categoryRevisionID = 555;
		const output = '\n* [[User:Novem Linguae|Novem Linguae]] kept [[Wikipedia:Good article reassessment/WIN Television/1]] at ~~~~~. [[Special:Diff/987|[Atop]]][[Special:Diff/123|[Talk]]][[Special:Diff/456|[Log]]][[Special:Diff/987|[Tmpl]]][[Special:Diff/555|[Cat]]]';
		expect( wg.makeScriptLogEntryToAppend( username, keepOrDelist, reviewTitle, garRevisionID, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID ) ).toBe( output );
	} );

	it( 'Should handle error', () => {
		const username = 'Novem Linguae';
		const keepOrDelist = 'delist';
		const reviewTitle = 'Wikipedia:Good article reassessment/WIN Television/1';
		const garRevisionID = 987;
		const talkRevisionID = 123;
		const articleRevisionID = 456;
		const gaListRevisionID = 789;
		const garLogRevisionID = 101112;
		const garArchiveTemplateRevisionID = undefined;
		const categoryRevisionID = undefined;
		const error = 'ReferenceError: getPassWikicodeForGANPage is not defined';
		const output = '\n* <span style="color: red; font-weight: bold;">ERROR:</span> ReferenceError: getPassWikicodeForGANPage is not defined. [[User:Novem Linguae|Novem Linguae]] delisted [[Wikipedia:Good article reassessment/WIN Television/1]] at ~~~~~. [[Special:Diff/987|[Atop]]][[Special:Diff/123|[Talk]]][[Special:Diff/456|[Article]]][[Special:Diff/789|[List]]][[Special:Diff/101112|[Log]]]';
		expect( wg.makeScriptLogEntryToAppend( username, keepOrDelist, reviewTitle, garRevisionID, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID ) ).toBe( output );
	} );
} );

describe( 'processDelistForGARPage(garPageWikicode, message, isCommunityAssessment)', () => {
	test( 'Should place {{atopr}}', () => {
		const isCommunityAssessment = false;
		const garPageWikicode =
`===GA Review===
{{Good article tools}}
<noinclude>{{al|{{#titleparts:2021 French Grand Prix/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:2021 French Grand Prix/GA1]]. The edit link for this section can be used to add comments to the rehg.''</includeonly>
::I'm happy to support the nomination (and will pass now). I've pretty much given you a FAC review above, which is where the article should probably go. I trust that you'll make the neccesary changes I've outlined before taking it to that forum. Great article, fantastic work '''[[User:Lee Vilenski|<span style="color:green">Lee Vilenski</span>]] <sup>([[User talk:Lee Vilenski|talk]] • [[Special:Contribs/Lee Vilenski|contribs]])</sup>''' 12:13, 13 June 2022 (UTC)
`;
		const message = '';
		const output =
`===GA Review===
{{atopr
| result = Delisted. ~~~~
}}
{{Good article tools}}
<noinclude>{{al|{{#titleparts:2021 French Grand Prix/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:2021 French Grand Prix/GA1]]. The edit link for this section can be used to add comments to the rehg.''</includeonly>
::I'm happy to support the nomination (and will pass now). I've pretty much given you a FAC review above, which is where the article should probably go. I trust that you'll make the neccesary changes I've outlined before taking it to that forum. Great article, fantastic work '''[[User:Lee Vilenski|<span style="color:green">Lee Vilenski</span>]] <sup>([[User talk:Lee Vilenski|talk]] • [[Special:Contribs/Lee Vilenski|contribs]])</sup>''' 12:13, 13 June 2022 (UTC)
{{abot}}
`;
		expect( wg.processDelistForGARPage( garPageWikicode, message, isCommunityAssessment ) ).toBe( output );
	} );

	test( 'Should handle H2', () => {
		const isCommunityAssessment = false;
		const garPageWikicode =
`==GA Reassessment==
<noinclude>{{al|{{#titleparts:First Macedonian War/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This discussion is [[WP:transclusion|transcluded]] from [[Talk:First Macedonian War/GA1]]. The edit link for this section can be used to add comments to the reassessment.''</includeonly>
<!-- Please add all reassessment comments below this comment, and do not alter what is above. To keep the discussion within a single section, please do not use level 2 headers (==...==) below to break up the reassessment. Use level 3 (===...===), level 4 and so on.-->
`;
		const message = '';
		const output =
`==GA Reassessment==
{{atopr
| result = Delisted. ~~~~
}}
<noinclude>{{al|{{#titleparts:First Macedonian War/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This discussion is [[WP:transclusion|transcluded]] from [[Talk:First Macedonian War/GA1]]. The edit link for this section can be used to add comments to the reassessment.''</includeonly>
<!-- Please add all reassessment comments below this comment, and do not alter what is above. To keep the discussion within a single section, please do not use level 2 headers (==...==) below to break up the reassessment. Use level 3 (===...===), level 4 and so on.-->
{{abot}}
`;
		expect( wg.processDelistForGARPage( garPageWikicode, message, isCommunityAssessment ) ).toBe( output );
	} );
} );

describe( 'processDelistForTalkPage(wikicode, garPageTitle, talkPageTitle)', () => {
	it( 'Should remove {{GAR/link}}, add action4 to {{Article history}}, set currentstatus to DGA, and remove class=GA', () => {
		const garPageTitle = 'Wikipedia:Good article reassessment/American popular music/1';
		const talkPageTitle = 'Talk:American popular music';
		const oldid = 1111;
		const wikicode =
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
		const output =
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
		expect( wg.processDelistForTalkPage( wikicode, garPageTitle, talkPageTitle, oldid ) ).toBe( output );
	} );

	it( 'Should remove {{GAR/link}}, remove {{GA}}, add {{Article history}}, and remove class=GA', () => {
		const garPageTitle = 'Wikipedia:Good article reassessment/American popular music/1';
		const talkPageTitle = 'Talk:American popular music';
		const oldid = 1111;
		const wikicode =
`{{GAR/link|13:56, 16 March 2022 (UTC)|page=1|GARpage=1|status= }}
{{GA|20:19, 29 June 2022 (UTC)|topic=Language and literature|page=1}}
{{WikiProject banner shell|1=
{{WP1.0 |v0.7=pass |class=GA |category=Arts |WPCD=yes |importance=Low}}
{{WikiProject Regional and national music|class=GA|importance=High}}
{{WikiProject United States|class=GA|importance=Mid|USMusic=yes|USMusic-importance=High}}
{{WikiProject Rock music|class=GA|importance=high}}
}}`;
		const output =
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
		expect( wg.processDelistForTalkPage( wikicode, garPageTitle, talkPageTitle, oldid ) ).toBe( output );
	} );

	it( 'should handle {{ArticleHistory}} containing a nested template', () => {
		const garPageTitle = 'Wikipedia:Good article reassessment/Royce White/1';
		const talkPageTitle = 'Talk:Royce White';
		const oldid = 1111;
		const wikicode =
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
		const output =
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
		expect( wg.processDelistForTalkPage( wikicode, garPageTitle, talkPageTitle, oldid ) ).toBe( output );
	} );

	it( 'should handle {{football|class=GA', () => {
		const garPageTitle = 'Talk:Sudan women\'s national football team/GA3';
		const talkPageTitle = 'Talk:Sudan women\'s national football team';
		const oldid = 1111;
		const wikicode =
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
		const output =
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
		expect( wg.processDelistForTalkPage( wikicode, garPageTitle, talkPageTitle, oldid ) ).toBe( output );
	} );

	it( 'should remove {{GAR request}}', () => {
		const garPageTitle = 'Wikipedia:Good article reassessment/Once Upon a Time (game)/1';
		const talkPageTitle = 'Talk:Once Upon a Time (game)';
		const oldid = 1111;
		const wikicode =
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
		const output =
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
		expect( wg.processDelistForTalkPage( wikicode, garPageTitle, talkPageTitle, oldid ) ).toBe( output );
	} );

	it( 'should handle {{ArticleHistory}} with no space', () => {
		const garPageTitle = 'Wikipedia:Good article reassessment/Once Upon a Time (game)/1';
		const talkPageTitle = 'Talk:Once Upon a Time (game)';
		const oldid = 1111;
		const wikicode =
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
		const output =
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
		expect( wg.processDelistForTalkPage( wikicode, garPageTitle, talkPageTitle, oldid ) ).toBe( output );
	} );
} );

describe( 'getGAListTitleFromTalkPageWikicode(wikicode)', () => {
	it( 'Should return a falsy value (and not throw error) if topic is not in dictionary', () => {
		const wikicode = '{{Article history|topic=InvalidTopic}}';
		expect( wg.getGAListTitleFromTalkPageWikicode( wikicode ) ).toBeFalsy();
		// it returns undefined
	} );
	it( 'Should handle {{Article history}}', () => {
		const wikicode = '{{Article history|topic=sports}}';
		const output = 'Wikipedia:Good articles/Sports and recreation';
		expect( wg.getGAListTitleFromTalkPageWikicode( wikicode ) ).toBe( output );
	} );

	it( 'Should handle {{GA}}', () => {
		const wikicode = '{{GA|topic=sports}}';
		const output = 'Wikipedia:Good articles/Sports and recreation';
		expect( wg.getGAListTitleFromTalkPageWikicode( wikicode ) ).toBe( output );
	} );

	it( 'Should be case insensitive', () => {
		const wikicode = '{{aRTiClE HiStOrY|topic=SpOrTs}}';
		const output = 'Wikipedia:Good articles/Sports and recreation';
		expect( wg.getGAListTitleFromTalkPageWikicode( wikicode ) ).toBe( output );
	} );

	it( 'Should ignore {{Vital article}}', () => {
		const wikicode =
`{{Vital article|level=5|topic=People|subpage=Entertainers|class=}}
{{Article history|action1=GAN
|action1date=22:40, 2 June 2008
|action1link=/GA1
|action1result=listed
|action1oldid=216607709
|topic=sports
|currentstatus = DGA
}}`;
		const output = 'Wikipedia:Good articles/Sports and recreation';
		expect( wg.getGAListTitleFromTalkPageWikicode( wikicode ) ).toBe( output );
	} );

	it( 'Should ignore {{Vital article}} 2', () => {
		const wikicode =
`{{GAR/link|17:25, 24 December 2022 (UTC)|page=1|GARpage=1|status= }}
{{Talk header}}
{{Vital article|topic=Society|level=5|class=GA}}
{{Article history
|action1=GAN
|action1date=21:19, 17 December 2006
|action1result=listed
|action1oldid=94955852

|action2=GAR
|action2date=18:59, 2 April 2008 (UTC)
|action2result=kept
|action2oldid=202860759

|currentstatus=GA
|topic=television
}}`;
		const output = 'Wikipedia:Good articles/Media and drama';
		expect( wg.getGAListTitleFromTalkPageWikicode( wikicode ) ).toBe( output );
	} );

	it( 'Should ignore {{Vital article}} and not ignore {{ArticleHistory}}', () => {
		const wikicode =
`{{GAR/link|17:25, 24 December 2022 (UTC)|page=1|GARpage=1|status= }}
{{Talk header}}
{{Vital article|topic=Society|level=5|class=GA}}
{{ArticleHistory
|action1=GAN
|action1date=21:19, 17 December 2006
|action1result=listed
|action1oldid=94955852

|action2=GAR
|action2date=18:59, 2 April 2008 (UTC)
|action2result=kept
|action2oldid=202860759

|currentstatus=GA
|topic=television
}}`;
		const output = 'Wikipedia:Good articles/Media and drama';
		expect( wg.getGAListTitleFromTalkPageWikicode( wikicode ) ).toBe( output );
	} );

	it( 'Should throw an error if no |topic= found', () => {
		const wikicode = 'Test :)';
		expect( () => {
			wg.getGAListTitleFromTalkPageWikicode( wikicode );
		} ).toThrow();
	} );

	it( 'Should handle topic', () => {
		const wikicode = '{{Article history|topic=television}}';
		const output = 'Wikipedia:Good articles/Media and drama';
		expect( wg.getGAListTitleFromTalkPageWikicode( wikicode ) ).toBe( output );
	} );

	it( 'Should handle subtopic', () => {
		const wikicode = '{{Article history|subtopic=television}}';
		const output = 'Wikipedia:Good articles/Media and drama';
		expect( wg.getGAListTitleFromTalkPageWikicode( wikicode ) ).toBe( output );
	} );

	it( 'Should handle uppercase', () => {
		const wikicode = '{{Article history|topic=Television}}';
		const output = 'Wikipedia:Good articles/Media and drama';
		expect( wg.getGAListTitleFromTalkPageWikicode( wikicode ) ).toBe( output );
	} );

	it( 'Should handle spaces', () => {
		const wikicode = '{{Article history|topic=agriculture, food, and drink}}';
		const output = 'Wikipedia:Good articles/Agriculture, food and drink';
		expect( wg.getGAListTitleFromTalkPageWikicode( wikicode ) ).toBe( output );
	} );

	it( 'Should handle multiline', () => {
		const wikicode =
`{{GAR/link|04:19, 11 January 2022 (UTC)|page=1|GARpage=1|status= }}
{{Article history|action1=GAN
|action1date=19 August 2007
|action1result=listed
|action1link=
|action1oldid=152335196

|action2=GAR
|action2date=12:58, 10 June 2009 (UTC)
|action2link=Talk:WIN Television#GA Sweeps
|action2result=kept
|action2oldid=293945032

|currentstatus=GA
|topic=Television
}}`;
		const output = 'Wikipedia:Good articles/Media and drama';
		expect( wg.getGAListTitleFromTalkPageWikicode( wikicode ) ).toBe( output );
	} );

	it( 'Should handle extra whitespace around the topic', () => {
		const wikicode =
`{{ArticleHistory
|action1=GAN
|topic=film 
|currentstatus=GA
}}`;
		const output = 'Wikipedia:Good articles/Media and drama';
		expect( wg.getGAListTitleFromTalkPageWikicode( wikicode ) ).toBe( output );
	} );
} );

describe( 'processDelistForArticle(wikicode)', () => {
	it( 'Should remove {{Good article}} 1', () => {
		const wikicode =
`{{Short description|None}}
{{Good article}}
{{USmusicgenres}}`;
		const output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect( wg.processDelistForArticle( wikicode ) ).toBe( output );
	} );

	it( 'Should handle template being at top of wikicode', () => {
		const wikicode =
`{{Good article}}
{{USmusicgenres}}`;
		const output =
'{{USmusicgenres}}';
		expect( wg.processDelistForArticle( wikicode ) ).toBe( output );
	} );

	it( 'Should handle template being at bottom of wikicode', () => {
		const wikicode =
`{{USmusicgenres}}
{{Good article}}`;
		const output =
`{{USmusicgenres}}
`;
		expect( wg.processDelistForArticle( wikicode ) ).toBe( output );
	} );

	it( 'Should remove {{good article}}', () => {
		const wikicode =
`{{Short description|None}}
{{good article}}
{{USmusicgenres}}`;
		const output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect( wg.processDelistForArticle( wikicode ) ).toBe( output );
	} );

	it( 'Should remove {{Good Article}} 2', () => {
		const wikicode =
`{{Short description|None}}
{{Good Article}}
{{USmusicgenres}}`;
		const output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect( wg.processDelistForArticle( wikicode ) ).toBe( output );
	} );

	it( 'Should remove {{GA article}}', () => {
		const wikicode =
`{{Short description|None}}
{{GA article}}
{{USmusicgenres}}`;
		const output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect( wg.processDelistForArticle( wikicode ) ).toBe( output );
	} );

	it( 'Should remove {{ga article}}', () => {
		const wikicode =
`{{Short description|None}}
{{ga article}}
{{USmusicgenres}}`;
		const output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect( wg.processDelistForArticle( wikicode ) ).toBe( output );
	} );

	it( 'Should remove {{GA icon}}', () => {
		const wikicode =
`{{Short description|None}}
{{GA icon}}
{{USmusicgenres}}`;
		const output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect( wg.processDelistForArticle( wikicode ) ).toBe( output );
	} );

	it( 'Should remove {{ga icon}}', () => {
		const wikicode =
`{{Short description|None}}
{{ga icon}}
{{USmusicgenres}}`;
		const output =
`{{Short description|None}}
{{USmusicgenres}}`;
		expect( wg.processDelistForArticle( wikicode ) ).toBe( output );
	} );

	it( 'Should remove extra line breaks', () => {
		const wikicode =
`{{Authority control}}

{{good article}}

{{Use mdy dates|date=December 2014}}`;
		const output =
`{{Authority control}}

{{Use mdy dates|date=December 2014}}`;
		expect( wg.processDelistForArticle( wikicode ) ).toBe( output );
	} );
} );

describe( 'processDelistForGAList(wikicode, articleToRemove)', () => {
	it( 'Should remove when first in list', () => {
		const articleToRemove = 'American popular music';
		const wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Andorra in the Eurovision Song Contest]]
}}`;
		const output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[Andorra in the Eurovision Song Contest]]
}}`;
		expect( wg.processDelistForGAList( wikicode, articleToRemove ) ).toBe( output );
	} );

	it( 'Should remove when in middle of list', () => {
		const articleToRemove = 'Andorra in the Eurovision Song Contest';
		const wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Andorra in the Eurovision Song Contest]]
[[Test]]
}}`;
		const output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Test]]
}}`;
		expect( wg.processDelistForGAList( wikicode, articleToRemove ) ).toBe( output );
	} );

	it( 'Should handle piped wikilink', () => {
		const articleToRemove = 'Andorra in the Eurovision Song Contest';
		const wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Andorra in the Eurovision Song Contest|Test]]
[[Test]]
}}`;
		const output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Test]]
}}`;
		expect( wg.processDelistForGAList( wikicode, articleToRemove ) ).toBe( output );
	} );

	it( 'Should handle piped wikilink surrounded by italics outside', () => {
		const articleToRemove = 'Andorra in the Eurovision Song Contest';
		const wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
''[[Andorra in the Eurovision Song Contest|Test]]''
[[Test]]
}}`;
		const output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Test]]
}}`;
		expect( wg.processDelistForGAList( wikicode, articleToRemove ) ).toBe( output );
	} );

	it( 'Should handle piped wikilink surrounded by italics inside', () => {
		const articleToRemove = 'Andorra in the Eurovision Song Contest';
		const wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Andorra in the Eurovision Song Contest|''Test'']]
[[Test]]
}}`;
		const output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Test]]
}}`;
		expect( wg.processDelistForGAList( wikicode, articleToRemove ) ).toBe( output );
	} );

	it( 'Should remove when last in list', () => {
		const articleToRemove = 'Andorra in the Eurovision Song Contest';
		const wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
[[Andorra in the Eurovision Song Contest]]
}}`;
		const output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
}}`;
		expect( wg.processDelistForGAList( wikicode, articleToRemove ) ).toBe( output );
	} );

	it( 'Should remove when only item in list', () => {
		const articleToRemove = 'American popular music';
		const wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
}}`;
		const output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
}}`;
		expect( wg.processDelistForGAList( wikicode, articleToRemove ) ).toBe( output );
	} );

	it( 'Should remove when non-piped wikilink surrounded by double quotes', () => {
		const articleToRemove = 'I Don\'t Miss You at All';
		const wikicode =
`=====2019 songs=====
{{#invoke:Good Articles|subsection|
[[29 (song)|"29" (song)]]
"[[I Don't Miss You at All]]"
"[[I Don't Search I Find]]"
`;
		const output =
`=====2019 songs=====
{{#invoke:Good Articles|subsection|
[[29 (song)|"29" (song)]]
"[[I Don't Search I Find]]"
`;
		expect( wg.processDelistForGAList( wikicode, articleToRemove ) ).toBe( output );
	} );

	it( 'Should do nothing when item not found', () => {
		const articleToRemove = 'Andorra in the Eurovision Song Contest';
		const wikicode =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
}}`;
		const output =
`=====Music by nation, people, region, or country=====
{{#invoke:Good Articles|subsection|
[[American popular music]]
}}`;
		expect( wg.processDelistForGAList( wikicode, articleToRemove ) ).toBe( output );
	} );

	it( 'Should handle rare case of the item being listed twice', () => {
		const articleToRemove = 'Multilateral Investment Guarantee Agency';
		const wikicode =
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
		const output =
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
		expect( wg.processDelistForGAList( wikicode, articleToRemove ) ).toBe( output );
	} );

	it( 'Should delete the exact article name only', () => {
		const articleToRemove = 'Fish';
		const wikicode =
`===== Globalization =====
{{#invoke:Good Articles|subsection|
[[Globalization and women in China]]
[[Fish allergy]]
[[Fish]]
[[Fisher (animal)]]
[[Spanish flu]]
}}
`;
		const output =
`===== Globalization =====
{{#invoke:Good Articles|subsection|
[[Globalization and women in China]]
[[Fish allergy]]
[[Fisher (animal)]]
[[Spanish flu]]
}}
`;
		expect( wg.processDelistForGAList( wikicode, articleToRemove ) ).toBe( output );
	} );
} );

// private methods

describe( 'preg_position(regex, haystack)', () => {
	test( 'preg_position_false', () => {
		const regex = /hello/gis;
		const haystack = 'How are you?';
		const result = wg.preg_position( regex, haystack );
		expect( result ).toBe( false );
	} );

	test( 'preg_position_zero', () => {
		const regex = /How/gis;
		const haystack = 'How are you?';
		const result = wg.preg_position( regex, haystack );
		expect( result ).toBe( 0 );
	} );

	test( 'preg_position_positive', () => {
		const regex = /are/gis;
		const haystack = 'How are you?';
		const result = wg.preg_position( regex, haystack );
		expect( result ).toBe( 4 );
	} );

	test( 'preg_position_end', () => {
		const regex = /$/gis;
		const haystack = 'How are you?';
		const result = wg.preg_position( regex, haystack );
		expect( result ).toBe( 12 );
	} );
} );

describe( 'getParametersFromTemplateWikicode(wikicodeOfSingleTemplate)', () => {
	test( '', () => {
		const wikicodeOfSingleTemplate =
'{{GAR/link|13:56, 16 March 2022 (UTC)|page=1|GARpage=1|status= }}';
		const output = {
			1: '13:56, 16 March 2022 (UTC)',
			page: '1',
			garpage: '1',
			status: ''
		};
		expect( wg.getParametersFromTemplateWikicode( wikicodeOfSingleTemplate ) ).toStrictEqual( output );
	} );
} );

describe( 'addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd)', () => {
	test( 'addToTalkPageAboveWikiProjects_normal', () => {
		const talkPageWikicode =
`{{Article history}}
{{Talk header}}

== Heading 1 ==
Test

== Heading 2 ==
Text`;
		const wikicodeToAdd = '[[Test]]';
		const result = wg.addToTalkPageAboveWikiProjects( talkPageWikicode, wikicodeToAdd );
		expect( result ).toBe(
			`{{Article history}}
{{Talk header}}
[[Test]]

== Heading 1 ==
Test

== Heading 2 ==
Text`
		);
	} );

	test( 'addToTalkPageAboveWikiProjects_ga1_1', () => {
		const talkPageWikicode =
`{{Article history}}
{{Talk header}}

{{Talk:abc/GA1}}

== Heading 1 ==
Test

== Heading 2 ==
Text`;
		const wikicodeToAdd = '[[Test]]';
		const result = wg.addToTalkPageAboveWikiProjects( talkPageWikicode, wikicodeToAdd );
		expect( result ).toBe(
			`{{Article history}}
{{Talk header}}
[[Test]]

{{Talk:abc/GA1}}

== Heading 1 ==
Test

== Heading 2 ==
Text`
		);
	} );

	test( 'addToTalkPageAboveWikiProjects_ga1_2', () => {
		const talkPageWikicode =
`{{Article history}}
{{Talk header}}

== Heading 1 ==
Test

{{Talk:abc/GA1}}

== Heading 2 ==
Text`;
		const wikicodeToAdd = '[[Test]]';
		const result = wg.addToTalkPageAboveWikiProjects( talkPageWikicode, wikicodeToAdd );
		expect( result ).toBe(
			`{{Article history}}
{{Talk header}}
[[Test]]

== Heading 1 ==
Test

{{Talk:abc/GA1}}

== Heading 2 ==
Text`
		);
	} );

	test( 'addToTalkPageAboveWikiProjects_blank', () => {
		const talkPageWikicode = '';
		const wikicodeToAdd = '[[Test]]';
		const result = wg.addToTalkPageAboveWikiProjects( talkPageWikicode, wikicodeToAdd );
		expect( result ).toBe( '[[Test]]' );
	} );

	test( 'addToTalkPageAboveWikiProjects_start', () => {
		const talkPageWikicode =
`== Heading 1 ==
Test`;
		const wikicodeToAdd = '[[Test]]';
		const result = wg.addToTalkPageAboveWikiProjects( talkPageWikicode, wikicodeToAdd );
		expect( result ).toBe(
			`[[Test]]
== Heading 1 ==
Test`
		);
	} );

	test( 'addToTalkPageAboveWikiProjects_end', () => {
		const talkPageWikicode = 'Test';
		const wikicodeToAdd = '[[Test]]';
		const result = wg.addToTalkPageAboveWikiProjects( talkPageWikicode, wikicodeToAdd );
		expect( result ).toBe(
			`Test
[[Test]]`
		);
	} );

	test( 'addToTalkPageAboveWikiProjects_WikiProjectBannerShellPresent', () => {
		const talkPageWikicode =
`{{Test1}}
{{wikiproject banner shell}}
{{Test2}}

== Test3 ==`;
		const wikicodeToAdd = '[[Test]]';
		const result = wg.addToTalkPageAboveWikiProjects( talkPageWikicode, wikicodeToAdd );
		expect( result ).toBe(
			`{{Test1}}
[[Test]]
{{wikiproject banner shell}}
{{Test2}}

== Test3 ==`
		);
	} );

	test( 'addToTalkPageAboveWikiProjects_WikiProjectPresent', () => {
		const talkPageWikicode =
`{{Test1}}
{{wikiproject tree of life}}
{{Test2}}

== Test3 ==`;
		const wikicodeToAdd = '[[Test]]';
		const result = wg.addToTalkPageAboveWikiProjects( talkPageWikicode, wikicodeToAdd );
		expect( result ).toBe(
			`{{Test1}}
[[Test]]
{{wikiproject tree of life}}
{{Test2}}

== Test3 ==`
		);
	} );

	test( 'addToTalkPageAboveWikiProjects_deleteExtraNewLines', () => {
		const talkPageWikicode =
`{{GTC|Dua Lipa (album)|1}}
{{GA|06:30, 12 August 2020 (UTC)|topic=Music|page=1|oldid=972465209}}




{{Talk:Homesick (Dua Lipa song)/GA1}}

== this is a piano song ==`;
		const wikicodeToAdd = '[[Test]]';
		const result = wg.addToTalkPageAboveWikiProjects( talkPageWikicode, wikicodeToAdd );
		expect( result ).toBe(
			`{{GTC|Dua Lipa (album)|1}}
{{GA|06:30, 12 August 2020 (UTC)|topic=Music|page=1|oldid=972465209}}
[[Test]]

{{Talk:Homesick (Dua Lipa song)/GA1}}

== this is a piano song ==`
		);
	} );

	test( 'addToTalkPageAboveWikiProjects_recognizeFootballTemplateAsWikiProject', () => {
		const talkPageWikicode = '{{football}}';
		const wikicodeToAdd = '[[Test]]';
		const result = wg.addToTalkPageAboveWikiProjects( talkPageWikicode, wikicodeToAdd );
		expect( result ).toBe(
			`[[Test]]
{{football}}`
		);
	} );

	test( 'two wikiproject tempaltes detected', () => {
		const talkPageWikicode = '{{wp banner shell}}{{football}}';
		const wikicodeToAdd = '[[Test]]';
		const output =
`[[Test]]
{{wp banner shell}}{{football}}`;
		expect( wg.addToTalkPageAboveWikiProjects( talkPageWikicode, wikicodeToAdd ) ).toBe( output );
	} );
} );

describe( 'deleteMiddleOfString(string, deleteStartPosition, deleteEndPosition)', () => {
	test( 'deleteMiddleOfString', () => {
		const string = 'Test DELETE THIS dont delete this';
		const deleteStartPosition = 5;
		const deleteEndPosition = 17;
		const result = wg.deleteMiddleOfString( string, deleteStartPosition, deleteEndPosition );
		expect( result ).toBe( 'Test dont delete this' );
	} );

	test( 'deleteMiddleOfString_blank', () => {
		const string = '';
		const deleteStartPosition = 0;
		const deleteEndPosition = 0;
		const result = wg.deleteMiddleOfString( string, deleteStartPosition, deleteEndPosition );
		expect( result ).toBe( '' );
	} );
} );

describe( 'convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode)', () => {
	it( 'should default to page=1 when no page parameter', () => {
		const talkPageTitle = 'Talk:Test';
		const wikicode = '{{GA|20:19, 29 June 2022 (UTC)|topic=Language and literature}}';
		const output =
`{{Article history
|currentstatus = GA
|topic = Language and literature

|action1 = GAN
|action1date = 20:19, 29 June 2022 (UTC)
|action1link = Talk:Test/GA1
|action1result = listed
}}`;
		expect( wg.convertGATemplateToArticleHistoryIfPresent( talkPageTitle, wikicode ) ).toBe( output );
	} );

	it( 'should handle subtopic parameter', () => {
		const talkPageTitle = 'Talk:Test';
		const wikicode = '{{GA|20:19, 29 June 2022 (UTC)|subtopic=Language and literature|page=1}}';
		const output =
`{{Article history
|currentstatus = GA
|topic = Language and literature

|action1 = GAN
|action1date = 20:19, 29 June 2022 (UTC)
|action1link = Talk:Test/GA1
|action1result = listed
}}`;
		expect( wg.convertGATemplateToArticleHistoryIfPresent( talkPageTitle, wikicode ) ).toBe( output );
	} );

	it( 'should handle oldid parameter', () => {
		const talkPageTitle = 'Talk:Test';
		const wikicode = '{{GA|20:19, 29 June 2022 (UTC)|topic=Language and literature|page=1|oldid=123456789}}';
		const output =
`{{Article history
|currentstatus = GA
|topic = Language and literature

|action1 = GAN
|action1date = 20:19, 29 June 2022 (UTC)
|action1link = Talk:Test/GA1
|action1result = listed
|action1oldid = 123456789
}}`;
		expect( wg.convertGATemplateToArticleHistoryIfPresent( talkPageTitle, wikicode ) ).toBe( output );
	} );

	it( 'should handle date= instead of the usual 1=', () => {
		const talkPageTitle = 'Talk:Test';
		const wikicode = '{{GA|date=20:19, 29 June 2022 (UTC)|topic=Language and literature}}';
		const output =
`{{Article history
|currentstatus = GA
|topic = Language and literature

|action1 = GAN
|action1date = 20:19, 29 June 2022 (UTC)
|action1link = Talk:Test/GA1
|action1result = listed
}}`;
		expect( wg.convertGATemplateToArticleHistoryIfPresent( talkPageTitle, wikicode ) ).toBe( output );
	} );
} );

// Note that GARCloserWikicodeGenerator.updateArticleHistory() and GANReviewWikicodeGenerator.updateArticleHistory() are different. They take different parameters and output different wikitext.
describe( 'updateArticleHistory( keepOrDelist, wikicode, garPageTitle, oldid )', () => {
	test( 'kept', () => {
		const keepOrDelist = 'keep';
		const wikicode =
`{{ArticleHistory|action1=GAN
|action1date=04:56, 21 June 2008
|action1link=Talk:Archaeoraptor/GA1
|action1result=listed
|action1oldid=220708372
|currentstatus=GA
|topic=Biology
}}`;
		const garPageTitle = 'Wikipedia:Good article reassessment/Archaeoraptor/1';
		const oldid = 1111;
		const output =
`{{ArticleHistory|action1=GAN
|action1date=04:56, 21 June 2008
|action1link=Talk:Archaeoraptor/GA1
|action1result=listed
|action1oldid=220708372
|topic=Biology
|action2 = GAR
|action2date = ~~~~~
|action2link = Wikipedia:Good article reassessment/Archaeoraptor/1
|action2result = kept
|action2oldid = 1111
|currentstatus = GA
}}`;
		expect( wg.updateArticleHistory( keepOrDelist, wikicode, garPageTitle, oldid, oldid ) ).toBe( output );
	} );
} );

describe( 'firstTemplateInsertCode(wikicode, templateNameRegExNoDelimiters, codeToInsert)', () => {
	test( '{{Article history}}', () => {
		const wikicode =
`{{Article history
|action1=FAC
|action1date=14 January 2004
|action1link=Wikipedia:Featured_article_candidates/Archived_nominations/Index/June_2003_to_January_2004#Bacteria
|action1result=failed
|action1oldid=47350127
}}`;
		const templateNameRegExNoDelimiters = 'Article ?history';
		const codeToInsert =
`|action2 = GAN
|action2date = ~~~~~
|action2link = Talk:Agriculture/GA2
|action2result = listed
|currentstatus = GA
|topic = Natural Sciences`;
		const output =
`{{Article history
|action1=FAC
|action1date=14 January 2004
|action1link=Wikipedia:Featured_article_candidates/Archived_nominations/Index/June_2003_to_January_2004#Bacteria
|action1result=failed
|action1oldid=47350127
|action2 = GAN
|action2date = ~~~~~
|action2link = Talk:Agriculture/GA2
|action2result = listed
|currentstatus = GA
|topic = Natural Sciences
}}`;
		expect( wg.firstTemplateInsertCode( wikicode, templateNameRegExNoDelimiters, codeToInsert ) ).toBe( output );
	} );

	test( 'should be case insensitive', () => {
		const wikicode =
`{{ArticleHistory
|topic = Physics and astronomy
}}
`;
		const templateNameRegExNoDelimiters = 'Article ?history';
		const codeToInsert =
`|action12 = GAN
|action12date = ~~~~~
|action12link = Talk:SpaceX Starship/GA1
|action12result = failed
|currentstatus = DGA`;
		const output =
`{{ArticleHistory
|topic = Physics and astronomy
|action12 = GAN
|action12date = ~~~~~
|action12link = Talk:SpaceX Starship/GA1
|action12result = failed
|currentstatus = DGA
}}
`;
		expect( wg.firstTemplateInsertCode( wikicode, templateNameRegExNoDelimiters, codeToInsert ) ).toBe( output );
	} );
} );

describe( 'firstTemplateGetParameterValue(wikicode, template, parameter)', () => {
	test( 'param exists', () => {
		const wikicode =
`{{Article history
|action1=AFD
|action1date=6 June 2007
|action1link=Wikipedia:Articles for deletion/Cow tipping
|action1result=kept

|action2=GAN
|action2date=~~~~~
|action2link=Talk:Cow tipping/GA1
|action2result=listed
|currentstatus=GA
|topic=agriculture
}}`;
		const template = 'Article history';
		const parameter = 'topic';
		const output = 'agriculture';
		expect( wg.firstTemplateGetParameterValue( wikicode, template, parameter ) ).toBe( output );
	} );

	test( 'param does not exist', () => {
		const wikicode =
`{{Article history
|action1=AFD
|action1date=6 June 2007
|action1link=Wikipedia:Articles for deletion/Cow tipping
|action1result=kept
}}`;
		const template = 'Article history';
		const parameter = 'topic';
		const output = null;
		expect( wg.firstTemplateGetParameterValue( wikicode, template, parameter ) ).toBe( output );
	} );
} );

describe( 'firstTemplateDeleteParameter(wikicode, template, parameter)', () => {
	test( 'param exists', () => {
		const wikicode =
`{{Article history
|action1=AFD
|action1date=6 June 2007
|action1link=Wikipedia:Articles for deletion/Cow tipping
|action1result=kept

|action2=GAN
|action2date=~~~~~
|action2link=Talk:Cow tipping/GA1
|action2result=listed
|currentstatus=GA
|topic=agriculture
}}`;
		const template = 'Article history';
		const parameter = 'topic';
		const output =
`{{Article history
|action1=AFD
|action1date=6 June 2007
|action1link=Wikipedia:Articles for deletion/Cow tipping
|action1result=kept

|action2=GAN
|action2date=~~~~~
|action2link=Talk:Cow tipping/GA1
|action2result=listed
|currentstatus=GA
}}`;
		expect( wg.firstTemplateDeleteParameter( wikicode, template, parameter ) ).toBe( output );
	} );

	test( 'param does not exist', () => {
		const wikicode =
`{{Article history
|action1=AFD
|action1date=6 June 2007
|action1link=Wikipedia:Articles for deletion/Cow tipping
|action1result=kept
}}`;
		const template = 'Article history';
		const parameter = 'topic';
		const output =
`{{Article history
|action1=AFD
|action1date=6 June 2007
|action1link=Wikipedia:Articles for deletion/Cow tipping
|action1result=kept
}}`;
		expect( wg.firstTemplateDeleteParameter( wikicode, template, parameter ) ).toBe( output );
	} );

	test( 'edge case', () => {
		const wikicode =
`{{Article history
|action1=FAC
|action1date=14 January 2004
|action1link=Wikipedia:Featured_article_candidates/Archived_nominations/Index/June_2003_to_January_2004#Bacteria
|action1result=failed
|action1oldid=47350127
|currentstatus=FFAC
}}`;
		const template = 'Article history';
		const parameter = 'currentstatus';
		const output =
`{{Article history
|action1=FAC
|action1date=14 January 2004
|action1link=Wikipedia:Featured_article_candidates/Archived_nominations/Index/June_2003_to_January_2004#Bacteria
|action1result=failed
|action1oldid=47350127
}}`;
		expect( wg.firstTemplateDeleteParameter( wikicode, template, parameter ) ).toBe( output );
	} );
} );

describe( 'placeATOP(wikicode, result, color)', () => {
	test( 'h2 present', () => {
		const result = 'Passed';
		const color = 'green';
		const wikicode =
`

== Test ==


== Test ==

test

blah`;
		const output =
`== Test ==
{{atopg
| result = Passed
}}
== Test ==

test

blah
{{abot}}
`;
		expect( wg.placeATOP( wikicode, result, color ) ).toBe( output );
	} );

	test( 'h3 present', () => {
		const result = 'Passed';
		const color = 'green';
		const wikicode =
`

=== Test ===


== Test ==

test

blah`;
		const output =
`=== Test ===
{{atopg
| result = Passed
}}
== Test ==

test

blah
{{abot}}
`;
		expect( wg.placeATOP( wikicode, result, color ) ).toBe( output );
	} );

	test( 'h2/h3 absent', () => {
		const result = 'Passed';
		const color = 'green';
		const wikicode =
`test

blah`;
		const output =
`{{atopg
| result = Passed
}}
test

blah
{{abot}}
`;
		expect( wg.placeATOP( wikicode, result, color ) ).toBe( output );
	} );

	test( 'failed instead of passed', () => {
		const result = 'Failed';
		const color = 'red';
		const wikicode =
`test

blah`;
		const output =
`{{atopr
| result = Failed
}}
test

blah
{{abot}}
`;
		expect( wg.placeATOP( wikicode, result, color ) ).toBe( output );
	} );
} );
