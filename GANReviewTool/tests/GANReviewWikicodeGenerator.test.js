// import * as service from "../modules/GANReviewWikicodeGenerator.js";
const { GANReviewWikicodeGenerator } = require( '../modules/GANReviewWikicodeGenerator.js' );

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

// npx jest --coverage for HTML code coverage report, in /coverage/lcov-report

const wg = new GANReviewWikicodeGenerator();

// TODO: group each test into 3 paragraphs: given, when, then

// Only unit testing public methods. Recommended best practice, for easier refactoring.

// Fold All (Ctrl+K Ctrl+0) folds all regions in the editor. Unfold All (Ctrl+K Ctrl+J) unfolds all regions in the editor.

describe( 'getPassWikicodeForGANPage(reviewWikicode)', () => {
	test( 'Should place {{atopg}}', () => {
		const reviewWikicode =
`==GA Review==
{{Good article tools}}
<noinclude>{{al|{{#titleparts:2021 French Grand Prix/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:2021 French Grand Prix/GA1]]. The edit link for this section can be used to add comments to the rehg.''</includeonly>
::I'm happy to support the nomination (and will pass now). I've pretty much given you a FAC review above, which is where the article should probably go. I trust that you'll make the neccesary changes I've outlined before taking it to that forum. Great article, fantastic work '''[[User:Lee Vilenski|<span style="color:green">Lee Vilenski</span>]] <sup>([[User talk:Lee Vilenski|talk]] • [[Special:Contribs/Lee Vilenski|contribs]])</sup>''' 12:13, 13 June 2022 (UTC)
`;
		const output =
`==GA Review==
{{atopg
| status = 
| result = Passed. ~~~~
}}
{{Good article tools}}
<noinclude>{{al|{{#titleparts:2021 French Grand Prix/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:2021 French Grand Prix/GA1]]. The edit link for this section can be used to add comments to the rehg.''</includeonly>
::I'm happy to support the nomination (and will pass now). I've pretty much given you a FAC review above, which is where the article should probably go. I trust that you'll make the neccesary changes I've outlined before taking it to that forum. Great article, fantastic work '''[[User:Lee Vilenski|<span style="color:green">Lee Vilenski</span>]] <sup>([[User talk:Lee Vilenski|talk]] • [[Special:Contribs/Lee Vilenski|contribs]])</sup>''' 12:13, 13 June 2022 (UTC)
{{abot}}
`;
		expect( wg.getPassWikicodeForGANPage( reviewWikicode ) ).toBe( output );
	} );
} );

describe( 'getPassWikicodeForTalkPage(talkWikicode, reviewTitle, gaSubpageShortTitle)', () => {
	test( 'Should handle no {{Article history}} present', () => {
		const talkWikicode =
`{{GA nominee|20:49, 10 May 2022 (UTC)|nominator=[[User:Sinopecynic|Sinopecynic]] ([[User talk:Sinopecynic|talk]])|page=1|subtopic=Art and architecture|status=onreview|note=}}
{{WikiProject Visual arts|class=b}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		const reviewTitle = 'Thomas Carlyle (Millais)/GA1';
		const gaSubpageShortTitle = 'Video games';
		const oldid = 1111;
		const output =
`{{GA|~~~~~|topic=Video games|page=1|oldid=1111}}
{{WikiProject Visual arts|class=GA}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		expect( wg.getPassWikicodeForTalkPage( talkWikicode, reviewTitle, gaSubpageShortTitle, oldid ) ).toBe( output );
	} );

	test( 'Should handle {{Article history}} present', () => {
		const talkWikicode =
`{{GA nominee|20:49, 10 May 2022 (UTC)|nominator=[[User:Sinopecynic|Sinopecynic]] ([[User talk:Sinopecynic|talk]])|page=1|subtopic=Art and architecture|status=onreview|note=}}
{{Article history
|ftname=Kanye West studio albums
|action1 = FAC
|action1date = 13:36, 18 April 2022 (UTC)
|action1link = Wikipedia:Featured article candidates/Late Registration/archive1
|action1result = failed
|action1oldid = 1083301278

|currentstatus= GA
|topic=music
}}
{{WikiProject Visual arts|class=b}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		const reviewTitle = 'Thomas Carlyle (Millais)/GA1';
		const gaSubpageShortTitle = 'Warfare';
		const oldid = 1111;
		const output =
`{{Article history
|ftname=Kanye West studio albums
|action1 = FAC
|action1date = 13:36, 18 April 2022 (UTC)
|action1link = Wikipedia:Featured article candidates/Late Registration/archive1
|action1result = failed
|action1oldid = 1083301278

|action2 = GAN
|action2date = ~~~~~
|action2link = Thomas Carlyle (Millais)/GA1
|action2result = listed
|action2oldid = 1111
|currentstatus = GA
|topic = Warfare
}}
{{WikiProject Visual arts|class=GA}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		expect( wg.getPassWikicodeForTalkPage( talkWikicode, reviewTitle, gaSubpageShortTitle, oldid ) ).toBe( output );
	} );

	test( 'Should set |class=GA for templates that don\'t start with {{WikiProject', () => {
		const talkWikicode =
`{{GA nominee|20:49, 10 May 2022 (UTC)|nominator=[[User:Sinopecynic|Sinopecynic]] ([[User talk:Sinopecynic|talk]])|page=1|subtopic=Art and architecture|status=onreview|note=}}
{{WikiProject Visual arts|class=b}}
{{environment|class=B|importance=mid}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		const reviewTitle = 'Thomas Carlyle (Millais)/GA1';
		const gaSubpageShortTitle = 'Sports and recreation';
		const oldid = 1111;
		const output =
`{{GA|~~~~~|topic=Sports and recreation|page=1|oldid=1111}}
{{WikiProject Visual arts|class=GA}}
{{environment|class=GA|importance=mid}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		expect( wg.getPassWikicodeForTalkPage( talkWikicode, reviewTitle, gaSubpageShortTitle, oldid ) ).toBe( output );
	} );

	test( 'Should place {{GA}} below {{Talk page header}}', () => {
		const talkWikicode =
`{{Talk page header}}
{{GA nominee|05:05, 8 June 2022 (UTC)|nominator=[[User:InfiniteNexus|InfiniteNexus]] ([[User talk:InfiniteNexus|talk]])|page=1|subtopic=Computing and engineering|status=onhold|note=}}
{{WikiProject banner shell|
{{WikiProject Computing|class=B|importance=mid|hardware=yes|hardware-importance=mid}}
{{WikiProject Electronics|class=B|importance=mid}}
{{WikiProject Google|class=B|importance=high}}
{{WikiProject Technology|class=B|b1=yes|b2=yes|b3=yes|b4=yes|b5=yes|b6=yes}}
{{WikiProject Telecommunications|class=B|importance=mid}}
}}
{{DYK talk|13 November|2021|entry=... that the '''[[Pixel 6|Pixel&nbsp;6]]''' is the first smartphone to be powered by the Google Tensor [[system on a chip]] (SoC)?|nompage=Template:Did you know nominations/Pixel 6}}
{{Annual readership}}
`;
		const reviewTitle = 'Pixel 6/GA1';
		const gaSubpageShortTitle = 'Engineering and technology';
		const oldid = 1111;
		const output =
`{{Talk page header}}
{{GA|~~~~~|topic=Engineering and technology|page=1|oldid=1111}}
{{WikiProject banner shell|
{{WikiProject Computing|class=GA|importance=mid|hardware=yes|hardware-importance=mid}}
{{WikiProject Electronics|class=GA|importance=mid}}
{{WikiProject Google|class=GA|importance=high}}
{{WikiProject Technology|class=GA|b1=yes|b2=yes|b3=yes|b4=yes|b5=yes|b6=yes}}
{{WikiProject Telecommunications|class=GA|importance=mid}}
}}
{{DYK talk|13 November|2021|entry=... that the '''[[Pixel 6|Pixel&nbsp;6]]''' is the first smartphone to be powered by the Google Tensor [[system on a chip]] (SoC)?|nompage=Template:Did you know nominations/Pixel 6}}
{{Annual readership}}
`;
		expect( wg.getPassWikicodeForTalkPage( talkWikicode, reviewTitle, gaSubpageShortTitle, oldid ) ).toBe( output );
	} );

	test( 'Should change empty |class= to |class=GA', () => {
		const talkWikicode =
`{{GA nominee|17:35, 8 June 2022 (UTC)|nominator=[[User:Underclass King|Underclass King]] ([[User talk:Underclass King|talk]])|page=1|subtopic=Television|status=onreview|note=}}
{{WikiProject Television|class=}}
{{WikiProject LGBT studies|class=Start}}
`;
		const reviewTitle = 'Talk:Seriously, Dude, I\'m Gay/GA1';
		const gaSubpageShortTitle = 'Media and drama';
		const oldid = 1111;
		const output =
`{{GA|~~~~~|topic=Media and drama|page=1|oldid=1111}}
{{WikiProject Television|class=GA}}
{{WikiProject LGBT studies|class=GA}}
`;
		expect( wg.getPassWikicodeForTalkPage( talkWikicode, reviewTitle, gaSubpageShortTitle, oldid ) ).toBe( output );
	} );
} );

describe( 'getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)', () => {
	test( 'Should handle a wikilink with no pipe', () => {
		const gaSubpageHeading = '=====Bodies of water and water formations=====';
		const gaTitle = 'Nile River';
		const gaDisplayTitle = 'Nile River';
		const gaSubpageWikicode =
`===[[File:Gnome-globe.svg|22px|left|alt=|link=]] Geography===
<div class="wp-ga-topic-back">[[#Geography and places|back]]</div>
<div class="mw-collapsible-content">
<!--The level 5 GA subtopics on this page may be first subdivided into new level 4 GA subtopics; see other GA topic pages-->
<!--The level 5 GA subtopics on this page may be subdivided into new level 5 GA subtopics and other level 5 GA subtopics may be added; see other GA topic pages-->

=====Bodies of water and water formations=====
{{#invoke:Good Articles|subsection|
[[Abrahams Creek]]
[[Adams River (British Columbia)]]
[[Zarqa River]]
}}

</div>
</div>
<!--End Geography level 3 GA subtopic-->
<!--Start Places level 3 GA subtopic-->
<div class="mw-collapsible">
`;
		const output =
`===[[File:Gnome-globe.svg|22px|left|alt=|link=]] Geography===
<div class="wp-ga-topic-back">[[#Geography and places|back]]</div>
<div class="mw-collapsible-content">
<!--The level 5 GA subtopics on this page may be first subdivided into new level 4 GA subtopics; see other GA topic pages-->
<!--The level 5 GA subtopics on this page may be subdivided into new level 5 GA subtopics and other level 5 GA subtopics may be added; see other GA topic pages-->

=====Bodies of water and water formations=====
{{#invoke:Good Articles|subsection|
[[Abrahams Creek]]
[[Adams River (British Columbia)]]
[[Nile River]]
[[Zarqa River]]
}}

</div>
</div>
<!--End Geography level 3 GA subtopic-->
<!--Start Places level 3 GA subtopic-->
<div class="mw-collapsible">
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should handle a piped wikilink', () => {
		const gaSubpageHeading = '=====Geographers and explorers=====';
		const gaTitle = 'David Attenborough';
		const gaDisplayTitle = 'Attenborough, David';
		const gaSubpageWikicode =
`===[[File:Gnome-globe.svg|22px|left|alt=|link=]] Geography===
<div class="wp-ga-topic-back">[[#Geography and places|back]]</div>
<div class="mw-collapsible-content">
<!--The level 5 GA subtopics on this page may be first subdivided into new level 4 GA subtopics; see other GA topic pages-->
<!--The level 5 GA subtopics on this page may be subdivided into new level 5 GA subtopics and other level 5 GA subtopics may be added; see other GA topic pages-->

=====Geographers and explorers=====
{{#invoke:Good Articles|subsection|
[[1773 Phipps expedition towards the North Pole]]
[[Herbert E. Balch|Balch, Herbert E.]]
}}

</div>
</div>
<!--End Geography level 3 GA subtopic-->
<!--Start Places level 3 GA subtopic-->
<div class="mw-collapsible">
`;
		const output =
`===[[File:Gnome-globe.svg|22px|left|alt=|link=]] Geography===
<div class="wp-ga-topic-back">[[#Geography and places|back]]</div>
<div class="mw-collapsible-content">
<!--The level 5 GA subtopics on this page may be first subdivided into new level 4 GA subtopics; see other GA topic pages-->
<!--The level 5 GA subtopics on this page may be subdivided into new level 5 GA subtopics and other level 5 GA subtopics may be added; see other GA topic pages-->

=====Geographers and explorers=====
{{#invoke:Good Articles|subsection|
[[1773 Phipps expedition towards the North Pole]]
[[David Attenborough|Attenborough, David]]
[[Herbert E. Balch|Balch, Herbert E.]]
}}

</div>
</div>
<!--End Geography level 3 GA subtopic-->
<!--Start Places level 3 GA subtopic-->
<div class="mw-collapsible">
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should handle when provided heading doesn\'t exactly match list heading', () => {
		const gaSubpageHeading = '=====Landforms=====';
		const gaTitle = 'Amak Volcano';
		const gaDisplayTitle = 'Amak Volcano';
		const gaSubpageWikicode =
`===[[File:Gnome-globe.svg|22px|left|alt=|link=]] Geography===
<div class="wp-ga-topic-back">[[#Geography and places|back]]</div>
<div class="mw-collapsible-content">
<!--The level 5 GA subtopics on this page may be first subdivided into new level 4 GA subtopics; see other GA topic pages-->
<!--The level 5 GA subtopics on this page may be subdivided into new level 5 GA subtopics and other level 5 GA subtopics may be added; see other GA topic pages-->

===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Abyssal plain]]
[[Ailladie]]
[[Alepotrypa Cave]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}

</div>
</div>
<!--End Geography level 3 GA subtopic-->
<!--Start Places level 3 GA subtopic-->
<div class="mw-collapsible">
`;
		const output =
`===[[File:Gnome-globe.svg|22px|left|alt=|link=]] Geography===
<div class="wp-ga-topic-back">[[#Geography and places|back]]</div>
<div class="mw-collapsible-content">
<!--The level 5 GA subtopics on this page may be first subdivided into new level 4 GA subtopics; see other GA topic pages-->
<!--The level 5 GA subtopics on this page may be subdivided into new level 5 GA subtopics and other level 5 GA subtopics may be added; see other GA topic pages-->

===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Abyssal plain]]
[[Ailladie]]
[[Alepotrypa Cave]]
[[Amak Volcano]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}

</div>
</div>
<!--End Geography level 3 GA subtopic-->
<!--Start Places level 3 GA subtopic-->
<div class="mw-collapsible">
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should handle being first in the list', () => {
		const gaSubpageHeading = '=====Landforms=====';
		const gaTitle = 'Aardvark';
		const gaDisplayTitle = 'Aardvark';
		const gaSubpageWikicode =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Abyssal plain]]
[[Ailladie]]
[[Alepotrypa Cave]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}
`;
		const output =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Aardvark]]
[[Abyssal plain]]
[[Ailladie]]
[[Alepotrypa Cave]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should handle being last in the list', () => {
		const gaSubpageHeading = '=====Landforms=====';
		const gaTitle = 'Zebra';
		const gaDisplayTitle = 'Zebra';
		const gaSubpageWikicode =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Abyssal plain]]
[[Ailladie]]
[[Alepotrypa Cave]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}
`;
		const output =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Abyssal plain]]
[[Ailladie]]
[[Alepotrypa Cave]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
[[Zebra]]
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should sort numbers before letters', () => {
		const gaSubpageHeading = '=====Landforms=====';
		const gaTitle = '123';
		const gaDisplayTitle = '123';
		const gaSubpageWikicode =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Abyssal plain]]
[[Ailladie]]
[[Alepotrypa Cave]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}
`;
		const output =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[123]]
[[Abyssal plain]]
[[Ailladie]]
[[Alepotrypa Cave]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should sort by display title, not article name', () => {
		const gaSubpageHeading = '=====Landforms=====';
		const gaTitle = 'Test';
		const gaDisplayTitle = '123';
		const gaSubpageWikicode =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Abyssal plain]]
[[Ailladie]]
[[Alepotrypa Cave]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}
`;
		const output =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Test|123]]
[[Abyssal plain]]
[[Ailladie]]
[[Alepotrypa Cave]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should ignore italics when sorting the haystack', () => {
		const gaSubpageHeading = '=====Landforms=====';
		const gaTitle = '?Antelope';
		const gaDisplayTitle = '?Antelope';
		const gaSubpageWikicode =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Alepotrypa Cave|''Aleoptrypa Cave'']]
}}
`;
		const output =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[?Antelope]]
[[Alepotrypa Cave|''Aleoptrypa Cave'']]
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should ignore italics when sorting the needle', () => {
		const gaSubpageHeading = '=====Landforms=====';
		const gaTitle = 'Building';
		const gaDisplayTitle = '\'\'Building\'\'';
		const gaSubpageWikicode =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Alepotrypa Cave|''Aleoptrypa Cave'']]
[[Alepotrypa Cave|'Hello]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}
`;
		const output =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Alepotrypa Cave|''Aleoptrypa Cave'']]
[[Alepotrypa Cave|'Hello]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
''[[Building]]''
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should ignore {{Further}} when it is present in the list', () => {
		const gaSubpageHeading = '=====Landforms=====';
		const gaTitle = 'ABC';
		const gaDisplayTitle = 'ABC';
		const gaSubpageWikicode =
`===== Landforms =====
{{Further}}
{{#invoke:Good Articles|subsection|
[[Alepotrypa Cave|''Aleoptrypa Cave'']]
[[Alepotrypa Cave|'Hello]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}
`;
		const output =
`===== Landforms =====
{{Further}}
{{#invoke:Good Articles|subsection|
[[ABC]]
[[Alepotrypa Cave|''Aleoptrypa Cave'']]
[[Alepotrypa Cave|'Hello]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should ignore italics when sorting the needle', () => {
		const gaSubpageHeading = '=====Landforms=====';
		const gaTitle = 'Building';
		const gaDisplayTitle = '\'\'Building\'\'';
		const gaSubpageWikicode =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Alepotrypa Cave|''Aleoptrypa Cave'']]
[[Alepotrypa Cave|'Hello]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}
`;
		const output =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Alepotrypa Cave|''Aleoptrypa Cave'']]
[[Alepotrypa Cave|'Hello]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
''[[Building]]''
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should ignore articles (a, an, the) in the haystack', () => {
		const gaSubpageHeading = '=====Cookery books=====';
		const gaTitle = 'Food in the United States';
		const gaDisplayTitle = '\'\'Food in the United States\'\'';
		const gaSubpageWikicode =
`=====Cookery books=====
{{#invoke:Good Articles|subsection|
[[Elizabeth David bibliography]]
''[[The Art of Cookery Made Plain and Easy]]''
''[[A Book of Mediterranean Food]]''
''[[Compendium ferculorum, albo Zebranie potraw]]''
''[[The Compleat Housewife]]''
''[[The Cookery Book of Lady Clark of Tillypronie]]''
''[[The Experienced English Housekeeper]]'' 
''[[Food in England]]''
''[[The Good Huswifes Jewell]]'' 
''[[The Modern Cook]]''
''[[Modern Cookery for Private Families]]'' 
''[[Mrs. Beeton's Book of Household Management]]'' 
''[[A New System of Domestic Cookery]]''
''[[The Accomplisht Cook]]''
}}
`;
		const output =
`=====Cookery books=====
{{#invoke:Good Articles|subsection|
[[Elizabeth David bibliography]]
''[[The Art of Cookery Made Plain and Easy]]''
''[[A Book of Mediterranean Food]]''
''[[Compendium ferculorum, albo Zebranie potraw]]''
''[[The Compleat Housewife]]''
''[[The Cookery Book of Lady Clark of Tillypronie]]''
''[[The Experienced English Housekeeper]]'' 
''[[Food in England]]''
''[[Food in the United States]]''
''[[The Good Huswifes Jewell]]'' 
''[[The Modern Cook]]''
''[[Modern Cookery for Private Families]]'' 
''[[Mrs. Beeton's Book of Household Management]]'' 
''[[A New System of Domestic Cookery]]''
''[[The Accomplisht Cook]]''
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should ignore articles (a, an, the) in the needle', () => {
		const gaSubpageHeading = '=====Cookery books=====';
		const gaTitle = 'The Compleat Housewife';
		const gaDisplayTitle = '\'\'The Compleat Housewife\'\'';
		const gaSubpageWikicode =
`=====Cookery books=====
{{#invoke:Good Articles|subsection|
''[[The Art of Cookery Made Plain and Easy]]''
''[[A Book of Mediterranean Food]]''
''[[Compendium ferculorum, albo Zebranie potraw]]''
''[[The Cookery Book of Lady Clark of Tillypronie]]''
''[[The Experienced English Housekeeper]]'' 
''[[Food in England]]''
''[[The Good Huswifes Jewell]]'' 
''[[The Modern Cook]]''
''[[Modern Cookery for Private Families]]'' 
''[[Mrs. Beeton's Book of Household Management]]'' 
''[[A New System of Domestic Cookery]]''
''[[The Accomplisht Cook]]''
}}
`;
		const output =
`=====Cookery books=====
{{#invoke:Good Articles|subsection|
''[[The Art of Cookery Made Plain and Easy]]''
''[[A Book of Mediterranean Food]]''
''[[Compendium ferculorum, albo Zebranie potraw]]''
''[[The Compleat Housewife]]''
''[[The Cookery Book of Lady Clark of Tillypronie]]''
''[[The Experienced English Housekeeper]]'' 
''[[Food in England]]''
''[[The Good Huswifes Jewell]]'' 
''[[The Modern Cook]]''
''[[Modern Cookery for Private Families]]'' 
''[[Mrs. Beeton's Book of Household Management]]'' 
''[[A New System of Domestic Cookery]]''
''[[The Accomplisht Cook]]''
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should handle when there are multiple of the same heading', () => {
		const gaSubpageHeading = '=====Art=====';
		const gaTitle = 'The Great Wave off Kanagawa';
		const gaDisplayTitle = 'The Great Wave off Kanagawa';
		const gaSubpageWikicode =
`<noinclude>
{{hatnote|[[#Art and architecture|'''↓  Skip to lists  ↓''']]}}
{{Wikipedia:Good article nominations/Tab header}}
{{Wikipedia:Good articles/Summary|shortcuts={{shortcut|WP:GA/AA}}}}
</noinclude><templatestyles src="Wikipedia:Good articles/styles.css"/>
__NOTOC__
<div class="wp-ga-topic">
==Art and architecture==
<includeonly><div class="wp-ga-topic-back">[[#Contents|back]]</div></includeonly>
<div class="wp-ga-topic-contents">
===Contents===
{{plainlist}}
* [[#Art|Art]]
* [[#Architecture|Architecture]]
{{endplainlist}}
</div>
<!--Start Art level 3 GA subtopic-->
<div class="mw-collapsible">
===[[File:Nuvola apps package graphics.svg|22px|left|alt=|link=]] Art===
<div class="wp-ga-topic-back">[[#Art and architecture|back]]</div>
<div class="mw-collapsible-content">
<!--The level 5 GA subtopics on this page may be first subdivided into new level 4 GA subtopics; see other GA topic pages-->
<!--The level 5 GA subtopics on this page may be subdivided into new level 5 GA subtopics and other level 5 GA subtopics may be added; see other GA topic pages-->

=====Art=====
{{#invoke:Good Articles|subsection|
''[[A Boy with a Flying Squirrel]]''
[[Akzidenz-Grotesk]]
[[Zzz]]
}}
`;
		const output =
`<noinclude>
{{hatnote|[[#Art and architecture|'''↓  Skip to lists  ↓''']]}}
{{Wikipedia:Good article nominations/Tab header}}
{{Wikipedia:Good articles/Summary|shortcuts={{shortcut|WP:GA/AA}}}}
</noinclude><templatestyles src="Wikipedia:Good articles/styles.css"/>
__NOTOC__
<div class="wp-ga-topic">
==Art and architecture==
<includeonly><div class="wp-ga-topic-back">[[#Contents|back]]</div></includeonly>
<div class="wp-ga-topic-contents">
===Contents===
{{plainlist}}
* [[#Art|Art]]
* [[#Architecture|Architecture]]
{{endplainlist}}
</div>
<!--Start Art level 3 GA subtopic-->
<div class="mw-collapsible">
===[[File:Nuvola apps package graphics.svg|22px|left|alt=|link=]] Art===
<div class="wp-ga-topic-back">[[#Art and architecture|back]]</div>
<div class="mw-collapsible-content">
<!--The level 5 GA subtopics on this page may be first subdivided into new level 4 GA subtopics; see other GA topic pages-->
<!--The level 5 GA subtopics on this page may be subdivided into new level 5 GA subtopics and other level 5 GA subtopics may be added; see other GA topic pages-->

=====Art=====
{{#invoke:Good Articles|subsection|
''[[A Boy with a Flying Squirrel]]''
[[Akzidenz-Grotesk]]
[[The Great Wave off Kanagawa]]
[[Zzz]]
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'For sorting, should treat lowercase and uppercase letters as identical', () => {
		const gaSubpageHeading = '=====Actors, directors, models, performers, and celebrities=====';
		const gaTitle = 'Amrita Rao';
		const gaDisplayTitle = 'Rao, Amrita';
		const gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Kartik Aaryan|Aaryan, Kartik]]
[[Nina Davuluri|Davuluri, Nina]]
[[Daniel Day-Lewis|Day-Lewis, Daniel]]
[[Olivia de Havilland|de Havilland, Olivia]]
[[Belle Delphine|Delphine, Belle]]
[[Ellen Pompeo|Pompeo, Ellen]]
[[Amanda Seyfried|Seyfried, Amanda]]
}}
`;
		const output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Kartik Aaryan|Aaryan, Kartik]]
[[Nina Davuluri|Davuluri, Nina]]
[[Daniel Day-Lewis|Day-Lewis, Daniel]]
[[Olivia de Havilland|de Havilland, Olivia]]
[[Belle Delphine|Delphine, Belle]]
[[Ellen Pompeo|Pompeo, Ellen]]
[[Amrita Rao|Rao, Amrita]]
[[Amanda Seyfried|Seyfried, Amanda]]
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should trim() extra spaces at end of the display title', () => {
		const gaSubpageHeading = '=====Actors, directors, models, performers, and celebrities=====';
		const gaTitle = 'Amrita Rao';
		const gaDisplayTitle = 'Rao, Amrita ';
		const gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Ellen Pompeo|Pompeo, Ellen]]
[[Amanda Seyfried|Seyfried, Amanda]]
}}
`;
		const output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Ellen Pompeo|Pompeo, Ellen]]
[[Amrita Rao|Rao, Amrita]]
[[Amanda Seyfried|Seyfried, Amanda]]
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should place an article beginning with M after an article beginning with É', () => {
		const gaSubpageHeading = '=====Actors, directors, models, performers, and celebrities=====';
		const gaTitle = 'Minskoff Theatre';
		const gaDisplayTitle = 'Minskoff Theatre';
		const gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Édifice Price]]
}}
`;
		const output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Édifice Price]]
[[Minskoff Theatre]]
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'Should place an article beginning with m after an article beginning with é', () => {
		const gaSubpageHeading = '=====Actors, directors, models, performers, and celebrities=====';
		const gaTitle = 'minskoff theatre';
		const gaDisplayTitle = 'minskoff theatre';
		const gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[édifice price]]
}}
`;
		const output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[édifice price]]
[[minskoff theatre]]
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'should handle empty list', () => {
		const gaSubpageHeading = '=====Actors, directors, models, performers, and celebrities=====';
		const gaTitle = 'Pakeezah';
		const gaDisplayTitle = 'Pakeezah';
		const gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
}}
`;
		const output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Pakeezah]]
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'if only decoration is italics, should place italics outside the wikilink', () => {
		const gaSubpageHeading = '=====Actors, directors, models, performers, and celebrities=====';
		const gaTitle = 'Pakeezah';
		const gaDisplayTitle = '\'\'Pakeezah\'\'';
		const gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Abc]]
}}
`;
		const output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Abc]]
''[[Pakeezah]]''
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'sort in numerical order, not lexographical order', () => {
		const gaSubpageHeading = '=====Actors, directors, models, performers, and celebrities=====';
		const gaTitle = 'Ontario Highway 8';
		const gaDisplayTitle = 'Ontario Highway 8';
		const gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Ontario Highway 79]]
[[Ontario Highway 81]]
}}
`;
		const output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Ontario Highway 8]]
[[Ontario Highway 79]]
[[Ontario Highway 81]]
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'don\'t used a piped wikilink for stuff in double quotes', () => {
		const gaSubpageHeading = '=====Actors, directors, models, performers, and celebrities=====';
		const gaTitle = 'Ontario Highway 8';
		const gaDisplayTitle = '"Ontario Highway 8"';
		const gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
}}
`;
		const output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
"[[Ontario Highway 8]]"
}}
`;
		expect( wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle ) ).toBe( output );
	} );

	test( 'should throw an error if it can\'t find |subsection|\\n near the title', () => {
		const gaSubpageHeading = '=====Cue sports=====';
		const gaTitle = 'Ontario Highway 8';
		const gaDisplayTitle = '"Ontario Highway 8"';
		const gaSubpageWikicode =
`=====Cue sports=====
{{#invoke:Good Articles|subsection|[[1927 World Snooker Championship]]
[[1928 World Snooker Championship]]
}}

=====Curling=====
{{#invoke:Good Articles|subsection|
[[2013 Continental Cup of Curling]]
}}
`;
		expect( () => {
			wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle );
		} ).toThrow();
	} );

	test( 'should throw error when heading does not exist', () => {
		const gaSubpageHeading = '=====Rail transport=====';
		const gaTitle = 'Ontario Highway 8';
		const gaDisplayTitle = '"Ontario Highway 8"';
		const gaSubpageWikicode =
`
===[[File:Nuvola apps display.png|22px|left|alt=|link=]] Computing and engineering===
<div class="wp-ga-topic-back">[[#Engineering and technology|back]]</div>
<div class="mw-collapsible-content">
<!--The level 5 GA subtopics on this page may be first subdivided into new level 4 GA subtopics; see other GA topic pages-->
<!--The level 5 GA subtopics on this page may be subdivided into new level 5 GA subtopics and other level 5 GA subtopics may be added; see other GA topic pages-->

=====Computer-related organizations and people=====
{{#invoke:Good Articles|subsection|
[[Bomis]]
[[Dansk Datamatik Center]]
}}

====Rail transport====
{{#invoke:Good Articles|subsection|
[[2 Line (Sound Transit)]]
[[7 (New York City Subway service)]]
[[7 Subway Extension]]
[[9 (New York City Subway service)]]
}}
`;
		expect( () => {
			wg.getPassWikicodeForGAListPage( gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle );
		} ).toThrow();
	} );
} );

describe( 'getFailWikicodeForGANPage(reviewWikicode)', () => {
	test( 'Should place {{atopr}}', () => {
		const reviewWikicode =
`==GA Review==
{{Good article tools}}
<noinclude>{{al|{{#titleparts:2021 French Grand Prix/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:2021 French Grand Prix/GA1]]. The edit link for this section can be used to add comments to the rehg.''</includeonly>
::I'm happy to support the nomination (and will pass now). I've pretty much given you a FAC review above, which is where the article should probably go. I trust that you'll make the neccesary changes I've outlined before taking it to that forum. Great article, fantastic work '''[[User:Lee Vilenski|<span style="color:green">Lee Vilenski</span>]] <sup>([[User talk:Lee Vilenski|talk]] • [[Special:Contribs/Lee Vilenski|contribs]])</sup>''' 12:13, 13 June 2022 (UTC)
`;
		const output =
`==GA Review==
{{atopr
| status = 
| result = Unsuccessful. ~~~~
}}
{{Good article tools}}
<noinclude>{{al|{{#titleparts:2021 French Grand Prix/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:2021 French Grand Prix/GA1]]. The edit link for this section can be used to add comments to the rehg.''</includeonly>
::I'm happy to support the nomination (and will pass now). I've pretty much given you a FAC review above, which is where the article should probably go. I trust that you'll make the neccesary changes I've outlined before taking it to that forum. Great article, fantastic work '''[[User:Lee Vilenski|<span style="color:green">Lee Vilenski</span>]] <sup>([[User talk:Lee Vilenski|talk]] • [[Special:Contribs/Lee Vilenski|contribs]])</sup>''' 12:13, 13 June 2022 (UTC)
{{abot}}
`;
		expect( wg.getFailWikicodeForGANPage( reviewWikicode ) ).toBe( output );
	} );
} );

describe( 'getFailWikicodeForTalkPage(talkWikicode, reviewTitle)', () => {
	test( 'Should handle no {{Article history}} present', () => {
		const talkWikicode =
`{{GA nominee|20:49, 10 May 2022 (UTC)|nominator=[[User:Sinopecynic|Sinopecynic]] ([[User talk:Sinopecynic|talk]])|page=1|subtopic=Art and architecture|status=onreview|note=}}
{{WikiProject Visual arts|class=b}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		const reviewTitle = 'Thomas Carlyle (Millais)/GA1';
		const oldid = 1111;
		const output =
`{{FailedGA|~~~~~|topic=Art and architecture|page=1|oldid=1111}}
{{WikiProject Visual arts|class=b}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		expect( wg.getFailWikicodeForTalkPage( talkWikicode, reviewTitle, oldid ) ).toBe( output );
	} );

	test( 'Should handle {{Article history}} present', () => {
		const talkWikicode =
`{{GA nominee|04:41, 1 June 2022 (UTC)|nominator=[[User:CactiStaccingCrane|CactiStaccingCrane]] ([[User talk:CactiStaccingCrane|talk]])|page=2|subtopic=Physics and astronomy|status=onreview|note=}}
{{ArticleHistory
|action1 = GAN
|action1date = 07:01, 14 September 2021 (UTC)
|action1link = Talk:SpaceX Starship/GA1
|action1result = failed
|action1oldid = 1044235959

|currentstatus = FGAN

|dykdate = 9 November 2021
|dykentry = ... that [[SpaceX]]'s reusable '''[[SpaceX Starship|Starship]]''' launch vehicle has twice as much thrust as the [[Apollo program]]'s [[Saturn&nbsp;V]]?
|dyknom = Template:Did you know nominations/SpaceX Starship

|topic = Physics and astronomy
}}

{{Talk:SpaceX Starship/GA2}}
`;
		const reviewTitle = 'SpaceX Starship/GA2';
		const oldid = 1111;
		const output =
`{{ArticleHistory
|action1 = GAN
|action1date = 07:01, 14 September 2021 (UTC)
|action1link = Talk:SpaceX Starship/GA1
|action1result = failed
|action1oldid = 1044235959

|dykdate = 9 November 2021
|dykentry = ... that [[SpaceX]]'s reusable '''[[SpaceX Starship|Starship]]''' launch vehicle has twice as much thrust as the [[Apollo program]]'s [[Saturn&nbsp;V]]?
|dyknom = Template:Did you know nominations/SpaceX Starship

|action2 = GAN
|action2date = ~~~~~
|action2link = SpaceX Starship/GA2
|action2result = failed
|action2oldid = 1111
|currentstatus = FGAN
|topic = Physics and astronomy
}}

{{Talk:SpaceX Starship/GA2}}
`;
		expect( wg.getFailWikicodeForTalkPage( talkWikicode, reviewTitle, oldid ) ).toBe( output );
	} );

	test( 'Should handle {{Vital article|topic=', () => {
		const talkWikicode =
`{{GA nominee|21:10, 1 August 2022 (UTC)|nominator=[[User:Paavamjinn|Paavamjinn]] ([[User talk:Paavamjinn|talk]])|page=5|subtopic=Sports and recreation|status=|note=}}
{{Vital article|level=4|topic=People|class=B}}
{{ArticleHistory
|action1       = GAN
|action1date   = 09:41, 6 August 2021 (UTC)
|action1link   = Talk:Cristiano Ronaldo/GA4
|action1result = not listed
|action1oldid  = 1036984152
|currentstatus = FGAN
|topic         = sports
}}
`;
		const reviewTitle = 'Talk:Cristiano Ronaldo/GA5';
		const oldid = 1111;
		const output =
`{{Vital article|level=4|topic=People|class=B}}
{{ArticleHistory
|action1       = GAN
|action1date   = 09:41, 6 August 2021 (UTC)
|action1link   = Talk:Cristiano Ronaldo/GA4
|action1result = not listed
|action1oldid  = 1036984152
|action2 = GAN
|action2date = ~~~~~
|action2link = Talk:Cristiano Ronaldo/GA5
|action2result = failed
|action2oldid = 1111
|currentstatus = FGAN
|topic = Sports and recreation
}}
`;
		expect( wg.getFailWikicodeForTalkPage( talkWikicode, reviewTitle, oldid ) ).toBe( output );
	} );

	test( 'Should handle nested templates (#209)', () => {
		const talkWikicode =
`{{GA nominee|05:47, 28 December 2024 (UTC)|nominator=~{{Smallcaps|[[User:CtasACT|CtasACT]]}}<sup>[[User_talkCtasACT|Talk]]{{nbsp}}•{{nbsp}}[[Special:Contributions/CtasACT|Contribs]]</sup>|page=1|subtopic=Magazines and print journalism|status=onreview|note=|shortdesc=20th century Ethiopian writer and journalist}}
{{WikiProject banner shell|class=C|blp=no|listas=Girma|
{{WikiProject Biography|needs-photo=yes}}
{{WikiProject Articles for creation|ts=20140219040153|reviewer=Kvng}}
{{WikiProject Ethiopia}}
{{WikiProject Journalism}}
}}`;
		const reviewTitle = 'Talk:Baalu Girma';
		const oldid = 1267462501;
		const output =
`{{FailedGA|~~~~~|topic=Magazines and print journalism|page=1|oldid=1267462501}}
{{WikiProject banner shell|class=C|blp=no|listas=Girma|
{{WikiProject Biography|needs-photo=yes}}
{{WikiProject Articles for creation|ts=20140219040153|reviewer=Kvng}}
{{WikiProject Ethiopia}}
{{WikiProject Journalism}}
}}`;
		expect( wg.getFailWikicodeForTalkPage( talkWikicode, reviewTitle, oldid ) ).toBe( output );
	} );
} );

describe( 'getLogMessageToAppend(username, passOrFail, reviewTitle, reviewRevisionID, talkRevisionID, gaRevisionID, error)', () => {
	test( 'Should handle a pass', () => {
		const username = 'Sammi Brie';
		const passOrFail = 'pass';
		const reviewTitle = 'Talk:1982 World\'s Fair/GA1';
		const reviewRevisionID = '1094307525';
		const talkRevisionID = '1094307532';
		const gaRevisionID = '1094307538';
		const error = false;
		const output = '\n* [[User:Sammi Brie|Sammi Brie]] passed [[Talk:1982 World\'s Fair/GA1]] at ~~~~~. [[Special:Diff/1094307525|[Atop]]][[Special:Diff/1094307532|[Talk]]][[Special:Diff/1094307538|[List]]]';
		expect( wg.getLogMessageToAppend( username, passOrFail, reviewTitle, reviewRevisionID, talkRevisionID, gaRevisionID, error ) ).toBe( output );
	} );

	test( 'Should handle a fail', () => {
		const username = 'Sammi Brie';
		const passOrFail = 'fail';
		const reviewTitle = 'Talk:1982 World\'s Fair/GA1';
		const reviewRevisionID = '1094307525';
		const talkRevisionID = '1094307532';
		const gaRevisionID = '';
		const error = false;
		const output = '\n* [[User:Sammi Brie|Sammi Brie]] failed [[Talk:1982 World\'s Fair/GA1]] at ~~~~~. [[Special:Diff/1094307525|[Atop]]][[Special:Diff/1094307532|[Talk]]]';
		expect( wg.getLogMessageToAppend( username, passOrFail, reviewTitle, reviewRevisionID, talkRevisionID, gaRevisionID, error ) ).toBe( output );
	} );

	test( 'Should handle an error', () => {
		const username = 'Novem Linguae';
		const passOrFail = 'pass';
		const reviewTitle = 'Talk:Thomas Carlyle (Millais)/GA1';
		const reviewRevisionID = undefined;
		const talkRevisionID = undefined;
		const gaRevisionID = undefined;
		const error = 'ReferenceError: getPassWikicodeForGANPage is not defined';
		const output = '\n* <span style="color: red; font-weight: bold;">ERROR:</span> ReferenceError: getPassWikicodeForGANPage is not defined. [[User:Novem Linguae|Novem Linguae]] passed [[Talk:Thomas Carlyle (Millais)/GA1]] at ~~~~~. ';
		expect( wg.getLogMessageToAppend( username, passOrFail, reviewTitle, reviewRevisionID, talkRevisionID, gaRevisionID, error ) ).toBe( output );
	} );

	test( 'Should not display [Atop] diff if user selected not to place {{Atop}}', () => {
		const username = 'Sammi Brie';
		const passOrFail = 'pass';
		const reviewTitle = 'Talk:1982 World\'s Fair/GA1';
		const reviewRevisionID = undefined;
		const talkRevisionID = '1094307532';
		const gaRevisionID = '1094307538';
		const error = false;
		const output = '\n* [[User:Sammi Brie|Sammi Brie]] passed [[Talk:1982 World\'s Fair/GA1]] at ~~~~~. [[Special:Diff/1094307532|[Talk]]][[Special:Diff/1094307538|[List]]]';
		expect( wg.getLogMessageToAppend( username, passOrFail, reviewTitle, reviewRevisionID, talkRevisionID, gaRevisionID, error ) ).toBe( output );
	} );
} );

describe( 'getOnHoldWikicodeForTalkPage(talkWikicode)', () => {
	test( 'Should handle no |status= field', () => {
		const talkWikicode =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|note=}}';
		const output =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|note=|status=onhold}}';
		expect( wg.getOnHoldWikicodeForTalkPage( talkWikicode ) ).toBe( output );
	} );

	test( 'Should handle |status= (blank)', () => {
		const talkWikicode =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=|note=}}';
		const output =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}';
		expect( wg.getOnHoldWikicodeForTalkPage( talkWikicode ) ).toBe( output );
	} );

	test( 'Should handle |status=somethingElse', () => {
		const talkWikicode =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=2ndopinion|note=}}';
		const output =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}';
		expect( wg.getOnHoldWikicodeForTalkPage( talkWikicode ) ).toBe( output );
	} );

	test( 'Should handle |status=onhold (same status that we\'re trying to set)', () => {
		const talkWikicode =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}';
		const output =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}';
		expect( wg.getOnHoldWikicodeForTalkPage( talkWikicode ) ).toBe( output );
	} );

	test( 'Should handle text before {{GA nominee}} template', () => {
		const talkWikicode =
`{{Talk header}}
{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}`;
		const output =
`{{Talk header}}
{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}`;
		expect( wg.getOnHoldWikicodeForTalkPage( talkWikicode ) ).toBe( output );
	} );

	test( 'Should handle text after {{GA nominee}} template', () => {
		const talkWikicode =
`{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}
{{WikiProject Football}}`;
		const output =
`{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}
{{WikiProject Football}}`;
		expect( wg.getOnHoldWikicodeForTalkPage( talkWikicode ) ).toBe( output );
	} );

	test( 'Should handle text before and after {{GA nominee}} template', () => {
		const talkWikicode =
`{{Talk header}}
{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}
{{WikiProject Football}}`;
		const output =
`{{Talk header}}
{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}
{{WikiProject Football}}`;
		expect( wg.getOnHoldWikicodeForTalkPage( talkWikicode ) ).toBe( output );
	} );

	test( 'Should handle {{GA nominee}} template touching other templates on same line', () => {
		const talkWikicode =
'{{Talk header}}{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}{{WikiProject Football}}';
		const output =
'{{Talk header}}{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}{{WikiProject Football}}';
		expect( wg.getOnHoldWikicodeForTalkPage( talkWikicode ) ).toBe( output );
	} );

	test( 'Should handle nested templates (#209)', () => {
		const talkWikicode =
`{{GA nominee|05:34, 10 September 2023 (UTC)|nominator={{colored link|#198754|User:Jake-jakubowski|Jake Jakubowski}} <sup>{{colored link|#0d6efd|User_talk:Jake-jakubowski|Talk}}</sup>|page=2|subtopic=Transport|status=onreview|note=|shortdesc=Road bridge in Maine, US}}
{{FailedGA|22:33, 29 August 2023 (UTC)|topic=Transport|page=1|oldid=1171806123}}`;
		const output =
`{{GA nominee|05:34, 10 September 2023 (UTC)|nominator={{colored link|#198754|User:Jake-jakubowski|Jake Jakubowski}} <sup>{{colored link|#0d6efd|User_talk:Jake-jakubowski|Talk}}</sup>|page=2|subtopic=Transport|status=onhold|note=|shortdesc=Road bridge in Maine, US}}
{{FailedGA|22:33, 29 August 2023 (UTC)|topic=Transport|page=1|oldid=1171806123}}`;
		expect( wg.getOnHoldWikicodeForTalkPage( talkWikicode ) ).toBe( output );
	} );
} );

describe( 'getAskSecondOpinionWikicodeForTalkPage(talkWikicode)', () => {
	test( 'Should handle changing |status=onhold to |status=2ndopinion', () => {
		const talkWikicode =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|note=|status=onhold}}';
		const output =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|note=|status=2ndopinion}}';
		expect( wg.getAskSecondOpinionWikicodeForTalkPage( talkWikicode ) ).toBe( output );
	} );

	test('Should handle nested templates', () => {
		let talkWikicode =
`{{GA nominee|14:41, 19 October 2022 (UTC)|nominator=––[[User:FormalDude|<span style="color: #0151D2; font-family: Microsoft Sans Serif; letter-spacing: -.3px;">'''Formal'''{{color|black|'''Dude'''}}</span>]] [[User talk:FormalDude|<span style="color:#0151D2;font-family: Microsoft Sans Serif;font-size:90%;">'''(talk)'''</span>]]|page=1|subtopic=Politics and government|status=|note=}}`;
		let output =
`{{GA nominee|14:41, 19 October 2022 (UTC)|nominator=––[[User:FormalDude|<span style="color: #0151D2; font-family: Microsoft Sans Serif; letter-spacing: -.3px;">'''Formal'''{{color|black|'''Dude'''}}</span>]] [[User talk:FormalDude|<span style="color:#0151D2;font-family: Microsoft Sans Serif;font-size:90%;">'''(talk)'''</span>]]|page=1|subtopic=Politics and government|status=2ndopinion|note=}}`;
		expect(wg.getAskSecondOpinionWikicodeForTalkPage(talkWikicode)).toBe(output);
	});
} );

describe( 'getAnswerSecondOpinionWikicodeForTalkPage(talkWikicode)', () => {
	test( 'Should handle changing |status=onhold to |status=onreview', () => {
		const talkWikicode =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|note=|status=onhold}}';
		const output =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|note=|status=onreview}}';
		expect( wg.getAnswerSecondOpinionWikicodeForTalkPage( talkWikicode ) ).toBe( output );
	} );
} );

// Private methods

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
| status = 
| result = Passed
}}
== Test ==

test

blah
{{abot}}
`;
		expect( wg.placeATOP( wikicode, result, color ) ).toBe( output );
	} );

	test( 'h2 absent', () => {
		const result = 'Passed';
		const color = 'green';
		const wikicode =
`test

blah`;
		const output =
`{{atopg
| status = 
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
| status = 
| result = Failed
}}
test

blah
{{abot}}
`;
		expect( wg.placeATOP( wikicode, result, color ) ).toBe( output );
	} );
} );

describe( 'getTopicFromGANomineeTemplate(talkWikicode)', () => {
	test( 'topic', () => {
		const talkWikicode = '{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}';
		const output = 'Media and drama';
		expect( wg.getTopicFromGANomineeTemplate( talkWikicode ) ).toBe( output );
	} );

	test( 'subtopic', () => {
		const talkWikicode = '{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|subtopic=Media and drama| status=onhold|note=}}';
		const output = 'Media and drama';
		expect( wg.getTopicFromGANomineeTemplate( talkWikicode ) ).toBe( output );
	} );

	test( 'whitespace', () => {
		const talkWikicode = '{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|subtopic= Media and drama | status=onhold|note=}}';
		const output = 'Media and drama';
		expect( wg.getTopicFromGANomineeTemplate( talkWikicode ) ).toBe( output );
	} );

	test( 'lowercase', () => {
		const talkWikicode = '{{ga nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}';
		const output = 'Media and drama';
		expect( wg.getTopicFromGANomineeTemplate( talkWikicode ) ).toBe( output );
	} );

	test( 'line breaks, and space between | and parameterName', () => {
		const talkWikicode =
`{{talkpage}}
{{GA nominee
| 17:45, 6 October 2022 (UTC)
| nominator            = — [[User:JuanGLP|<span style="background-image:linear-gradient(90deg,#8A4FBF,#9B6DC6,#B691D2,#CBAED7);color:black;padding:2.5px">'''JuanGLP'''</span>]] (<span style="font-size:85%;">[[User talk:JuanGLP|talk]]</span>)
| page                 = 1
| subtopic             = Music
| status               =
| note                 =
}}
{{WikiProject banner shell}}
`;
		const output = 'Music';
		expect( wg.getTopicFromGANomineeTemplate( talkWikicode ) ).toBe( output );
	} );
} );

describe( 'deleteGANomineeTemplate(talkWikicode)', () => {
	test( 'normal', () => {
		const talkWikicode = '{{Test}}{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}{{Test2}}';
		const output = '{{Test}}{{Test2}}';
		expect( wg.deleteGANomineeTemplate( talkWikicode ) ).toBe( output );
	} );

	test( 'lowercase', () => {
		const talkWikicode = '{{Test}}{{ga nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}{{Test2}}';
		const output = '{{Test}}{{Test2}}';
		expect( wg.deleteGANomineeTemplate( talkWikicode ) ).toBe( output );
	} );

	test( 'delete a line break too', () => {
		const talkWikicode =
`{{Test}}
{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}
{{Test2}}`;
		const output =
`{{Test}}
{{Test2}}`;
		expect( wg.deleteGANomineeTemplate( talkWikicode ) ).toBe( output );
	} );

	test( 'brackets in the signature (#214)', () => {
		const talkWikicode =
`{{GA nominee|08:24, 7 January 2024 (UTC)|nominator=<b>[[User talk:Praseodymium-141|<span style="color:#028A0F"><sup>141</sup></span>]][[User:Praseodymium-141|<span style="color:#A32CC4">Pr</span>]] {[[Special:Contributions/Praseodymium-141|contribs]]}</b>|page=2|subtopic=Chemistry and materials science|status=onreview|note=|shortdesc=}}
{{Failed GA|17:02, 7 June 2022 (UTC)|page=1|subtopic=Chemistry and materials science}}`;
		const output =
'{{Failed GA|17:02, 7 June 2022 (UTC)|page=1|subtopic=Chemistry and materials science}}';
		expect( wg.deleteGANomineeTemplate( talkWikicode ) ).toBe( output );
	} );
} );

describe( 'getTemplateParameter(wikicode, templateName, parameterName)', () => {
	test( 'found', () => {
		const wikicode = '{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}';
		const templateName = 'GA nominee';
		const parameterName = 'topic';
		const output = 'Media and drama';
		expect( wg.getTemplateParameter( wikicode, templateName, parameterName ) ).toBe( output );
	} );

	test( 'template name case difference', () => {
		const wikicode = '{{ga nomINee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}';
		const templateName = 'GA nominee';
		const parameterName = 'topic';
		const output = 'Media and drama';
		expect( wg.getTemplateParameter( wikicode, templateName, parameterName ) ).toBe( output );
	} );

	test( 'parameter name case difference', () => {
		const wikicode = '{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|toPIc=Media and drama|status=onhold|note=}}';
		const templateName = 'GA nominee';
		const parameterName = 'topic';
		const output = 'Media and drama';
		expect( wg.getTemplateParameter( wikicode, templateName, parameterName ) ).toBe( output );
	} );

	test( 'not found', () => {
		const wikicode = '{{blah|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|toPIc=Media and drama|status=onhold|note=}}';
		const templateName = 'GA nominee';
		const parameterName = 'topic';
		const output = null;
		expect( wg.getTemplateParameter( wikicode, templateName, parameterName ) ).toBe( output );
	} );

	test( 'line breaks, and space between | and parameterName', () => {
		const wikicode =
`{{talkpage}}
{{GA nominee
| 17:45, 6 October 2022 (UTC)
| nominator            = — [[User:JuanGLP|<span style="background-image:linear-gradient(90deg,#8A4FBF,#9B6DC6,#B691D2,#CBAED7);color:black;padding:2.5px">'''JuanGLP'''</span>]] (<span style="font-size:85%;">[[User talk:JuanGLP|talk]]</span>)
| page                 = 1
| subtopic             = Music
| status               =
| note                 =
}}
{{WikiProject banner shell}}
`;
		const templateName = 'GA nominee';
		const parameterName = 'page';
		const output = '1';
		expect( wg.getTemplateParameter( wikicode, templateName, parameterName ) ).toBe( output );
	} );
} );

describe( 'regExEscape(string)', () => {
	test( 'Nothing to escape', () => {
		const string = 'Test Test';
		const output = 'Test Test';
		expect( wg.regExEscape( string ) ).toBe( output );
	} );

	test( 'Escape {', () => {
		const string = 'Test{Test';
		const output = 'Test\\{Test';
		expect( wg.regExEscape( string ) ).toBe( output );
	} );
} );

describe( 'addGATemplate(talkWikicode, topic, gaPageNumber)', () => {
	test( 'Normal', () => {
		const talkWikicode = 'Test Test';
		const topic = 'agriculture, food, and drink';
		const gaPageNumber = 2;
		const oldid = 1111;
		const output =
`{{GA|~~~~~|topic=agriculture, food, and drink|page=2|oldid=1111}}
Test Test`;
		expect( wg.addGATemplate( talkWikicode, topic, gaPageNumber, oldid ) ).toBe( output );
	} );

	test( 'Below {{Talk Header}}', () => {
		const talkWikicode =
`{{Talk Header}}
Test Test`;
		const topic = 'agriculture, food, and drink';
		const gaPageNumber = 2;
		const oldid = 1111;
		const output =
`{{Talk Header}}
{{GA|~~~~~|topic=agriculture, food, and drink|page=2|oldid=1111}}
Test Test`;
		expect( wg.addGATemplate( talkWikicode, topic, gaPageNumber, oldid ) ).toBe( output );
	} );

	test( 'Below {{talkheader}}', () => {
		const talkWikicode =
`{{talkheader}}
Test Test`;
		const topic = 'agriculture, food, and drink';
		const gaPageNumber = 2;
		const oldid = 1111;
		const output =
`{{talkheader}}
{{GA|~~~~~|topic=agriculture, food, and drink|page=2|oldid=1111}}
Test Test`;
		expect( wg.addGATemplate( talkWikicode, topic, gaPageNumber, oldid ) ).toBe( output );
	} );
} );

describe( 'getFirstTemplateNameFromWikicode(wikicode)', () => {
	test( 'No template', () => {
		const wikicode = 'Hi';
		expect( () => wg.getFirstTemplateNameFromWikicode( wikicode ) ).toThrow( 'getFirstTemplateNameFromWikicode: No template found in Wikicode.' );
	} );

	test( 'Normal', () => {
		const wikicode = 'Hi{{Test|hello}}';
		const output = 'Test';
		expect( wg.getFirstTemplateNameFromWikicode( wikicode ) ).toBe( output );
	} );

	test( 'Two templates', () => {
		const wikicode = 'Test {{First}} Test {{Second}} Test';
		const output = 'First';
		expect( wg.getFirstTemplateNameFromWikicode( wikicode ) ).toBe( output );
	} );
} );

describe( 'addTemplateInCorrectMOSTalkOrderPosition(talkWikicode, codeToAdd)', () => {
	test( 'No template', () => {
		const talkWikicode = 'Hi';
		const codeToAdd = '{{NonExistentTemplate0967}}';
		expect( () => wg.addTemplateInCorrectMOSTalkOrderPosition( talkWikicode, codeToAdd ) ).toThrow( 'addTemplateInCorrectMOSTalkOrderPosition: Supplied template is not in dictionary. Unsure where to place it.' );
	} );

	test( 'Don\'t place in WikiProject banner shell', () => {
		const talkWikicode =
`{{Skip to talk}}
{{Talk header|search=yes|archive_age=90|archive_bot=Lowercase sigmabot III}}
{{WikiProject banner shell|collapsed=yes|1=
{{Vital article|class=B|level=4|topic=Geography}}
{{WikiProject East Timor|class=B|importance=Top}}
{{WP1.0|class=B|importance=Low|WPCD=y|b1=yes|b2=yes|b3=yes|b4=yes|b5=yes|b6=yes}}
}}
`;
		const codeToAdd =
'{{GA|17:09, 10 February 2023 (UTC)|topic=Geography and places|page=1|oldid=1138599480}}\n';
		const output =
`{{Skip to talk}}
{{Talk header|search=yes|archive_age=90|archive_bot=Lowercase sigmabot III}}
{{GA|17:09, 10 February 2023 (UTC)|topic=Geography and places|page=1|oldid=1138599480}}
{{WikiProject banner shell|collapsed=yes|1=
{{Vital article|class=B|level=4|topic=Geography}}
{{WikiProject East Timor|class=B|importance=Top}}
{{WP1.0|class=B|importance=Low|WPCD=y|b1=yes|b2=yes|b3=yes|b4=yes|b5=yes|b6=yes}}
}}
`;
		expect( wg.addTemplateInCorrectMOSTalkOrderPosition( talkWikicode, codeToAdd ) ).toBe( output );
	} );

} );

describe( 'addFailedGATemplate(talkWikicode, topic, gaPageNumber)', () => {
	test( 'Normal', () => {
		const talkWikicode = 'Test Test';
		const topic = 'agriculture, food, and drink';
		const gaPageNumber = 2;
		const oldid = 1111;
		const output =
`{{FailedGA|~~~~~|topic=agriculture, food, and drink|page=2|oldid=1111}}
Test Test`;
		expect( wg.addFailedGATemplate( talkWikicode, topic, gaPageNumber, oldid ) ).toBe( output );
	} );

	test( 'below {{Talk Header}}', () => {
		const talkWikicode =
`{{Talk Header}}
Test Test`;
		const topic = 'agriculture, food, and drink';
		const gaPageNumber = 2;
		const oldid = 1111;
		const output =
`{{Talk Header}}
{{FailedGA|~~~~~|topic=agriculture, food, and drink|page=2|oldid=1111}}
Test Test`;
		expect( wg.addFailedGATemplate( talkWikicode, topic, gaPageNumber, oldid ) ).toBe( output );
	} );
} );

describe( 'changeWikiProjectArticleClassToGA(talkWikicode)', () => {
	test( 'change class in {{WikiProject banner shell}}', () => {
		const talkWikicode =
`{{WikiProject banner shell|blp=yes|class=Start|1=
{{WikiProject Biography|living=yes|needs-infobox=no|needs-photo=yes|listas=Amamiya, Sora|musician-work-group=yes|musician-priority=}}
{{WikiProject Anime and manga|biography=yes|importance=low|listas=Amamiya, Sora}}
{{WikiProject Japan|biography|yes|importance=low|listas=Amamiya, Sora}}
{{WikiProject Women in Music |importance=Low|listas=Amamiya, Sora}}
}}`;
		const output =
`{{WikiProject banner shell|blp=yes|class=GA|1=
{{WikiProject Biography|living=yes|needs-infobox=no|needs-photo=yes|listas=Amamiya, Sora|musician-work-group=yes|musician-priority=}}
{{WikiProject Anime and manga|biography=yes|importance=low|listas=Amamiya, Sora}}
{{WikiProject Japan|biography|yes|importance=low|listas=Amamiya, Sora}}
{{WikiProject Women in Music |importance=Low|listas=Amamiya, Sora}}
}}`;
		expect( wg.changeWikiProjectArticleClassToGA( talkWikicode ) ).toBe( output );
	} );

	test( "don't change class in non-WikiProject templates", () => {
		const talkWikicode =
`{{WikiProject Anime and manga|class=Start|biography=yes|importance=low|listas=Amamiya, Sora}}
{{Random template|class=DontChangeMe}}`;
		const output =
`{{WikiProject Anime and manga|class=GA|biography=yes|importance=low|listas=Amamiya, Sora}}
{{Random template|class=DontChangeMe}}`;
		expect( wg.changeWikiProjectArticleClassToGA( talkWikicode ) ).toBe( output );
	} );
} );

describe( 'determineNextActionNumber(talkWikicode)', () => {
	test( '1', () => {
		const talkWikicode =
`{{Article history
|action1=FAC
|action1date=14 January 2004
|action1link=Wikipedia:Featured_article_candidates/Archived_nominations/Index/June_2003_to_January_2004#Bacteria
|action1result=failed
|action1oldid=47350127
}}`;
		const output = 2;
		expect( wg.determineNextActionNumber( talkWikicode ) ).toBe( output );
	} );

	test( '2', () => {
		const talkWikicode =
`{{Article history
|action1=FAC
|action1date=14 January 2004
|action1link=Wikipedia:Featured_article_candidates/Archived_nominations/Index/June_2003_to_January_2004#Bacteria
|action1result=failed
|action1oldid=47350127

|action2=GAN
|action2date=August 11 2006
|action2result=listed
|action2oldid=68920418
}}`;
		const output = 3;
		expect( wg.determineNextActionNumber( talkWikicode ) ).toBe( output );
	} );
} );

// Note that GARCloserWikicodeGenerator.updateArticleHistory() and GANReviewWikicodeGenerator.updateArticleHistory() are different. They take different parameters and output different wikitext.
describe( 'updateArticleHistory(talkWikicode, topic, nominationPageTitle, listedOrFailed)', () => {
	test( 'listed, GA', () => {
		const talkWikicode =
`{{Talk header|archive_age=31|archive_bot=Lowercase sigmabot III}}
{{Article history
|action1=AFD
|action1date=6 June 2007
|action1link=Wikipedia:Articles for deletion/Cow tipping
|action1result=kept
}}`;
		const topic = 'agriculture';
		const nominationPageTitle = 'Talk:Cow tipping/GA1';
		const listedOrFailed = 'listed';
		const oldid = 1111;
		const output =
`{{Talk header|archive_age=31|archive_bot=Lowercase sigmabot III}}
{{Article history
|action1=AFD
|action1date=6 June 2007
|action1link=Wikipedia:Articles for deletion/Cow tipping
|action1result=kept
|action2 = GAN
|action2date = ~~~~~
|action2link = Talk:Cow tipping/GA1
|action2result = listed
|action2oldid = 1111
|currentstatus = GA
|topic = agriculture
}}`;
		expect( wg.updateArticleHistory( talkWikicode, topic, nominationPageTitle, listedOrFailed, oldid ) ).toBe( output );
	} );

	test( 'listed, FFAC/GA', () => {
		const talkWikicode =
`{{Article history
|action1=FAC
|action1date=14 January 2004
|action1link=Wikipedia:Featured_article_candidates/Archived_nominations/Index/June_2003_to_January_2004#Bacteria
|action1result=failed
|action1oldid=47350127
|currentstatus=FFAC
}}`;
		const topic = 'Natural Sciences';
		const nominationPageTitle = 'Talk:Agriculture/GA2';
		const listedOrFailed = 'listed';
		const oldid = 1111;
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
|action2oldid = 1111
|currentstatus = FFAC/GA
|topic = Natural Sciences
}}`;
		expect( wg.updateArticleHistory( talkWikicode, topic, nominationPageTitle, listedOrFailed, oldid ) ).toBe( output );
	} );

	test( 'failed, DGA', () => {
		const talkWikicode =
`{{ArticleHistory
|action1 = GAN
|action1date = 07:01, 14 September 2021 (UTC)
|action1link = Talk:SpaceX Starship/GA1
|action1result = listed
|action1oldid = 1044235959
|action2 = FAC
|action2date = 2021-09-24 
|action2link = Wikipedia:Featured article candidates/SpaceX Starship/archive1
|action2result = failed
|action2oldid = 1046190985
|action3 = PR
|action3date = 2021-10-11
|action3link = Wikipedia:Peer review/SpaceX Starship/archive1
|action3result = reviewed
|action3oldid = 1049302813
|action4 = WPR
|action4date = 2021-10-12
|action4link = Special:Permalink/1049470919#SpaceX_Starship
|action4result = copyedited
|action4oldid = 1049475596
|action5 = FAC
|action5date = 2021-10-21
|action5link = Wikipedia:Featured article candidates/SpaceX Starship/archive2
|action5result = failed
|action5oldid = 1051039901
|action6 = GAR
|action6date = 2021-11-21
|action6link = Wikipedia:Good article reassessment/SpaceX Starship/1
|action6result = kept
|action6oldid = 1056395724
|action7 = WAR
|action7date = 15:20, 2 December 2021 (UTC)
|action7link = Wikipedia:WikiProject Military history/Assessment/SpaceX Starship
|action7result = not approved
|action7oldid = 1058238420
|action8 = PR
|action8date = 2022-01-24
|action8link = Wikipedia:Peer review/SpaceX Starship/archive2
|action8result = reviewed
|action8oldid = 1067572562
|action9 = FAC
|action9date = 2022-03-12
|action9link = Wikipedia:Featured article candidates/SpaceX Starship/archive3
|action9result = failed
|action9oldid = 1076628503
|action10 = GAR
|action10date = 2022-03-17
|action10link = Wikipedia:Good article reassessment/SpaceX Starship/2
|action10result = delisted
|action10oldid = 1077675589
|action11 = PR
|action11date = 2022-06-06
|action11link = Wikipedia:Peer review/SpaceX Starship/archive3
|action11result = reviewed
|action11oldid = 1091682942

|currentstatus = DGA

|dykdate = 9 November 2021
|dykentry = ... that [[SpaceX]]'s reusable '''[[SpaceX Starship|Starship]]''' launch vehicle has twice as much thrust as the [[Apollo program]]'s [[Saturn&nbsp;V]]?
|dyknom = Template:Did you know nominations/SpaceX Starship

|topic = Physics and astronomy
}}
`;
		const topic = 'Physics and astronomy';
		const nominationPageTitle = 'Talk:SpaceX Starship/GA2';
		const listedOrFailed = 'failed';
		const oldid = 1111;
		const output =
`{{ArticleHistory
|action1 = GAN
|action1date = 07:01, 14 September 2021 (UTC)
|action1link = Talk:SpaceX Starship/GA1
|action1result = listed
|action1oldid = 1044235959
|action2 = FAC
|action2date = 2021-09-24 
|action2link = Wikipedia:Featured article candidates/SpaceX Starship/archive1
|action2result = failed
|action2oldid = 1046190985
|action3 = PR
|action3date = 2021-10-11
|action3link = Wikipedia:Peer review/SpaceX Starship/archive1
|action3result = reviewed
|action3oldid = 1049302813
|action4 = WPR
|action4date = 2021-10-12
|action4link = Special:Permalink/1049470919#SpaceX_Starship
|action4result = copyedited
|action4oldid = 1049475596
|action5 = FAC
|action5date = 2021-10-21
|action5link = Wikipedia:Featured article candidates/SpaceX Starship/archive2
|action5result = failed
|action5oldid = 1051039901
|action6 = GAR
|action6date = 2021-11-21
|action6link = Wikipedia:Good article reassessment/SpaceX Starship/1
|action6result = kept
|action6oldid = 1056395724
|action7 = WAR
|action7date = 15:20, 2 December 2021 (UTC)
|action7link = Wikipedia:WikiProject Military history/Assessment/SpaceX Starship
|action7result = not approved
|action7oldid = 1058238420
|action8 = PR
|action8date = 2022-01-24
|action8link = Wikipedia:Peer review/SpaceX Starship/archive2
|action8result = reviewed
|action8oldid = 1067572562
|action9 = FAC
|action9date = 2022-03-12
|action9link = Wikipedia:Featured article candidates/SpaceX Starship/archive3
|action9result = failed
|action9oldid = 1076628503
|action10 = GAR
|action10date = 2022-03-17
|action10link = Wikipedia:Good article reassessment/SpaceX Starship/2
|action10result = delisted
|action10oldid = 1077675589
|action11 = PR
|action11date = 2022-06-06
|action11link = Wikipedia:Peer review/SpaceX Starship/archive3
|action11result = reviewed
|action11oldid = 1091682942

|dykdate = 9 November 2021
|dykentry = ... that [[SpaceX]]'s reusable '''[[SpaceX Starship|Starship]]''' launch vehicle has twice as much thrust as the [[Apollo program]]'s [[Saturn&nbsp;V]]?
|dyknom = Template:Did you know nominations/SpaceX Starship

|action12 = GAN
|action12date = ~~~~~
|action12link = Talk:SpaceX Starship/GA2
|action12result = failed
|action12oldid = 1111
|currentstatus = DGA
|topic = Physics and astronomy
}}
`;
		expect( wg.updateArticleHistory( talkWikicode, topic, nominationPageTitle, listedOrFailed, oldid ) ).toBe( output );
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

describe( 'getGASubpageHeadingPosition(shortenedVersionInComboBox, wikicode)', () => {
	test( 'Exact match', () => {
		const wikicode = '=====Bodies of water and water formations=====';
		const shortenedVersionInComboBox = '=====Bodies of water and water formations=====';
		const output = 0;
		expect( wg.getGASubpageHeadingPosition( shortenedVersionInComboBox, wikicode ) ).toBe( output );
	} );

	test( 'No match', () => {
		const wikicode = 'blah blah blah';
		const shortenedVersionInComboBox = '=====Bodies of water and water formations=====';
		expect( () => {
			wg.getGASubpageHeadingPosition( shortenedVersionInComboBox, wikicode );
		} ).toThrow();
	} );

	test( 'Input no space in front of ===, wikicode yes space in front of ===', () => {
		const wikicode = '===== Landforms =====';
		const shortenedVersionInComboBox = '=====Landforms=====';
		const output = 0;
		expect( wg.getGASubpageHeadingPosition( shortenedVersionInComboBox, wikicode ) ).toBe( output );
	} );

	test( 'Wikicode has [[File:', () => {
		const wikicode = '===[[File:Gnome-globe.svg|22px|left|alt=|link=]] Geography===';
		const shortenedVersionInComboBox = '===Geography===';
		const output = 0;
		expect( wg.getGASubpageHeadingPosition( shortenedVersionInComboBox, wikicode ) ).toBe( output );
	} );

	test( 'two headings with same name', () => {
		const wikicode =
`===[[File:Nuvola apps package graphics.svg|22px|left|alt=|link=]] Art===

=====Art=====

`;
		const shortenedVersionInComboBox = '=====Art=====';
		const output = 74;
		expect( wg.getGASubpageHeadingPosition( shortenedVersionInComboBox, wikicode ) ).toBe( output );
	} );

	test( 'should handle comment in heading', () => {
		const wikicode = '=====Aircraft<!-- civilian aircraft only. Military aircraft covered under warfare -->=====';
		const shortenedVersionInComboBox = '=====Aircraft=====';
		const output = 0;
		expect( wg.getGASubpageHeadingPosition( shortenedVersionInComboBox, wikicode ) ).toBe( output );
	} );
} );

describe( 'findFirstStringAfterPosition(needle, haystack, position)', () => {
	test( 'No match', () => {
		const needle = 'Needle';
		const haystack = 'Haystack';
		const position = 3;
		const output = -1;
		expect( wg.findFirstStringAfterPosition( needle, haystack, position ) ).toBe( output );
	} );

	test( 'Start at 0. Match immediately.', () => {
		const needle = 'Hay';
		const haystack = 'Haystack';
		const position = 0;
		const output = 0;
		expect( wg.findFirstStringAfterPosition( needle, haystack, position ) ).toBe( output );
	} );

	test( 'Start at 3. Match immediately.', () => {
		const needle = 'stack';
		const haystack = 'Haystack';
		const position = 3;
		const output = 3;
		expect( wg.findFirstStringAfterPosition( needle, haystack, position ) ).toBe( output );
	} );

	test( 'Start at 3. Match later.', () => {
		const needle = 'ack';
		const haystack = 'Haystack';
		const position = 0;
		const output = 5;
		expect( wg.findFirstStringAfterPosition( needle, haystack, position ) ).toBe( output );
	} );
} );

describe( 'insertStringIntoStringAtPosition(bigString, insertString, position)', () => {
	test( 'Middle', () => {
		const bigString = 'Haystack';
		const insertString = 'Needle';
		const position = 3;
		const output = 'HayNeedlestack';
		expect( wg.insertStringIntoStringAtPosition( bigString, insertString, position ) ).toBe( output );
	} );

	test( 'Start', () => {
		const bigString = 'Haystack';
		const insertString = 'Needle';
		const position = 0;
		const output = 'NeedleHaystack';
		expect( wg.insertStringIntoStringAtPosition( bigString, insertString, position ) ).toBe( output );
	} );

	test( 'End', () => {
		const bigString = 'Haystack';
		const insertString = 'Needle';
		const position = 8;
		const output = 'HaystackNeedle';
		expect( wg.insertStringIntoStringAtPosition( bigString, insertString, position ) ).toBe( output );
	} );
} );

describe( 'aSortsLowerThanB(a, b)', () => {
	test( 'a, b', () => {
		const a = 'a';
		const b = 'b';
		const output = true;
		expect( wg.aSortsLowerThanB( a, b ) ).toBe( output );
	} );

	test( 'b, a', () => {
		const a = 'b';
		const b = 'a';
		const output = false;
		expect( wg.aSortsLowerThanB( a, b ) ).toBe( output );
	} );

	test( 'numbers should sort lower than letters', () => {
		const a = '1';
		const b = 'a';
		const output = true;
		expect( wg.aSortsLowerThanB( a, b ) ).toBe( output );
	} );

	test( 'lowercase vs uppercase should evaluate the same', () => {
		const a = 'de Havilland, Olivia';
		const b = 'Rao, Amrita';
		const output = true;
		expect( wg.aSortsLowerThanB( a, b ) ).toBe( output );
	} );
} );

describe( 'removeFormattingThatInterferesWithSort(str)', () => {
	test( 'delete [[ ]]', () => {
		const str = '[[Abyssal plain]]';
		const output = 'Abyssal plain';
		expect( wg.removeFormattingThatInterferesWithSort( str ) ).toBe( output );
	} );

	test( 'delete entire first part of piped link', () => {
		const str = '[[Abyssal plain|Test]]';
		const output = 'Test';
		expect( wg.removeFormattingThatInterferesWithSort( str ) ).toBe( output );
	} );

	test( 'delete anything in front of [[', () => {
		const str = '"[[Abyssal plain]]"';
		const output = 'Abyssal plain';
		expect( wg.removeFormattingThatInterferesWithSort( str ) ).toBe( output );
	} );

	test( 'delete "', () => {
		const str = '[[Abyssal plain|"Test"]]';
		const output = 'Test';
		expect( wg.removeFormattingThatInterferesWithSort( str ) ).toBe( output );
	} );

	test( 'delete \'\'', () => {
		const str = '[[Abyssal plain|\'\'Test\'\']]';
		const output = 'Test';
		expect( wg.removeFormattingThatInterferesWithSort( str ) ).toBe( output );
	} );

	test( 'don\'t delete single \'', () => {
		const str = '[[Abyssal plain|I can\'t stop lovin\' you]]';
		const output = 'I can\'t stop lovin\' you';
		expect( wg.removeFormattingThatInterferesWithSort( str ) ).toBe( output );
	} );

	test( '[[David Attenborough|Attenborough, David]]', () => {
		const str = '[[David Attenborough|Attenborough, David]]';
		const output = 'Attenborough, David';
		expect( wg.removeFormattingThatInterferesWithSort( str ) ).toBe( output );
	} );

	test( '[[Herbert E. Balch|Balch, Herbert E.]]', () => {
		const str = '[[Herbert E. Balch|Balch, Herbert E.]]';
		const output = 'Balch, Herbert E.';
		expect( wg.removeFormattingThatInterferesWithSort( str ) ).toBe( output );
	} );

	test( '[[ABC|{{ABC}}]]', () => {
		const str = '[[ABC|{{ABC}}]]';
		const output = '{{ABC}}';
		expect( wg.removeFormattingThatInterferesWithSort( str ) ).toBe( output );
	} );

	test( '[[&Antelope]]', () => {
		const str = '[[&Antelope]]';
		const output = '&Antelope';
		expect( wg.removeFormattingThatInterferesWithSort( str ) ).toBe( output );
	} );

	test( '[[The New York Times]]', () => {
		const str = '[[The New York Times]]';
		const output = 'New York Times';
		expect( wg.removeFormattingThatInterferesWithSort( str ) ).toBe( output );
	} );

	test( '\'\'[[A Book of Mediterranean Food]]\'\'', () => {
		const str = '\'\'[[A Book of Mediterranean Food]]\'\'';
		const output = 'Book of Mediterranean Food';
		expect( wg.removeFormattingThatInterferesWithSort( str ) ).toBe( output );
	} );

	test( '\'\'[[an unexpected journey]]\'\'', () => {
		const str = '\'\'[[an unexpected journey]]\'\'';
		const output = 'unexpected journey';
		expect( wg.removeFormattingThatInterferesWithSort( str ) ).toBe( output );
	} );

	test( '[[The Compleat Housewife|\'\'The Compleat Housewife\'\']]', () => {
		const str = '[[The Compleat Housewife|\'\'The Compleat Housewife\'\']]';
		const output = 'Compleat Housewife';
		expect( wg.removeFormattingThatInterferesWithSort( str ) ).toBe( output );
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

	test( 'ignores templates wrapped in <nowiki>', () => {
		const wikicode = '<nowiki>{{Article history|topic=test1}}</nowiki>{{Article history|topic=test2}}';
		const template = 'Article history';
		const parameter = 'topic';
		const output = 'test2';
		expect( wg.firstTemplateGetParameterValue( wikicode, template, parameter ) ).toBe( output );
	} );

	test( 'ignores {{{params}}}', () => {
		const wikicode = '{{{Article history|topic=test1}}}{{Article history|topic=test2}}';
		const template = 'Article history';
		const parameter = 'topic';
		const output = 'test2';
		expect( wg.firstTemplateGetParameterValue( wikicode, template, parameter ) ).toBe( output );
	} );

	test( 'doesn\'t get confused by nested templates', () => {
		const wikicode = '{{Article history|oldtopic={{Article history|topic=test1}}|topic=test2}}';
		const template = 'Article history';
		const parameter = 'topic';
		const output = 'test2';
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

describe( 'hasArticleHistoryTemplate(wikicode)', () => {
	test( 'no match', () => {
		const wikicode = '{{GA}}';
		const output = false;
		expect( wg.hasArticleHistoryTemplate( wikicode ) ).toBe( output );
	} );

	test( '0 capitals, 1 space', () => {
		const wikicode = '{{article history}}';
		const output = true;
		expect( wg.hasArticleHistoryTemplate( wikicode ) ).toBe( output );
	} );

	test( '1 capital, 1 space', () => {
		const wikicode = '{{Article history}}';
		const output = true;
		expect( wg.hasArticleHistoryTemplate( wikicode ) ).toBe( output );
	} );

	test( '2 capitals, 1 space', () => {
		const wikicode = '{{Article History}}';
		const output = true;
		expect( wg.hasArticleHistoryTemplate( wikicode ) ).toBe( output );
	} );

	test( '2 capitals, 0 spaces', () => {
		const wikicode = '{{ArticleHistory}}';
		const output = true;
		expect( wg.hasArticleHistoryTemplate( wikicode ) ).toBe( output );
	} );

	test( '0 capitals, 0 spaces', () => {
		const wikicode = '{{articlehistory}}';
		const output = true;
		expect( wg.hasArticleHistoryTemplate( wikicode ) ).toBe( output );
	} );
} );

describe( 'addWikicodeAfterTemplates(wikicode, templates, codeToAdd)', () => {
	test( 'at top (no templates detected)', () => {
		const wikicode =
`{{Old AfD multi|page=Murder of Arthur Labinjo-Hughes|date=5 December 2021|result='''[[WP:SNOW|SNOW]] keep'''}}
{{Annual readership}}
{{WikiProject banner shell|blp=no|collapsed=yes|blpo=yes|1=
{{WikiProject Biography |class=GA |living=No |listas=Labinjo-Hughes, Arthur |needs-photo=yes}}
}}`;
		const templates = [ 'GA nominee', 'Featured article candidates', 'Peer review', 'Skip to talk', 'Talk header', 'Talkheader', 'Talk page header', 'Talkpage', 'Ds/talk notice', 'Gs/talk notice', 'BLP others', 'Calm', 'Censor', 'Controversial', 'Not a forum', 'FAQ', 'Round in circles', 'American English', 'British English' ];
		const codeToAdd = '{{GA|18:28, 18 June 2022 (UTC)|topic=socsci|page=1}}\n';
		const output =
`{{GA|18:28, 18 June 2022 (UTC)|topic=socsci|page=1}}
{{Old AfD multi|page=Murder of Arthur Labinjo-Hughes|date=5 December 2021|result='''[[WP:SNOW|SNOW]] keep'''}}
{{Annual readership}}
{{WikiProject banner shell|blp=no|collapsed=yes|blpo=yes|1=
{{WikiProject Biography |class=GA |living=No |listas=Labinjo-Hughes, Arthur |needs-photo=yes}}
}}`;
		expect( wg.addWikicodeAfterTemplates( wikicode, templates, codeToAdd ) ).toBe( output );
	} );

	test( 'after {{Talk header}}', () => {
		const wikicode =
`{{Talk header}}
{{Old AfD multi|page=Murder of Arthur Labinjo-Hughes|date=5 December 2021|result='''[[WP:SNOW|SNOW]] keep'''}}
{{Annual readership}}
{{WikiProject banner shell|blp=no|collapsed=yes|blpo=yes|1=
{{WikiProject Biography |class=GA |living=No |listas=Labinjo-Hughes, Arthur |needs-photo=yes}}
}}`;
		const templates = [ 'GA nominee', 'Featured article candidates', 'Peer review', 'Skip to talk', 'Talk header', 'Talkheader', 'Talk page header', 'Talkpage', 'Ds/talk notice', 'Gs/talk notice', 'BLP others', 'Calm', 'Censor', 'Controversial', 'Not a forum', 'FAQ', 'Round in circles', 'American English', 'British English' ];
		const codeToAdd = '{{GA|18:28, 18 June 2022 (UTC)|topic=socsci|page=1}}\n';
		const output =
`{{Talk header}}
{{GA|18:28, 18 June 2022 (UTC)|topic=socsci|page=1}}
{{Old AfD multi|page=Murder of Arthur Labinjo-Hughes|date=5 December 2021|result='''[[WP:SNOW|SNOW]] keep'''}}
{{Annual readership}}
{{WikiProject banner shell|blp=no|collapsed=yes|blpo=yes|1=
{{WikiProject Biography |class=GA |living=No |listas=Labinjo-Hughes, Arthur |needs-photo=yes}}
}}`;
		expect( wg.addWikicodeAfterTemplates( wikicode, templates, codeToAdd ) ).toBe( output );
	} );

	test( 'case insensitive template names', () => {
		const wikicode =
`{{Talk Header}}
`;
		const templates = [ 'GA nominee', 'Featured article candidates', 'Peer review', 'Skip to talk', 'Talk header', 'Talkheader', 'Talk page header', 'Talkpage', 'Ds/talk notice', 'Gs/talk notice', 'BLP others', 'Calm', 'Censor', 'Controversial', 'Not a forum', 'FAQ', 'Round in circles', 'American English', 'British English' ];
		const codeToAdd = '{{GA|18:28, 18 June 2022 (UTC)|topic=socsci|page=1}}\n';
		const output =
`{{Talk Header}}
{{GA|18:28, 18 June 2022 (UTC)|topic=socsci|page=1}}
`;
		expect( wg.addWikicodeAfterTemplates( wikicode, templates, codeToAdd ) ).toBe( output );
	} );
} );

describe( 'changeGANomineeTemplateStatus( talkWikicode, newStatus )', () => {
	test( 'already has correct status', () => {
		const talkWikicode =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}';
		const output =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}';
		expect( wg.changeGANomineeTemplateStatus( talkWikicode, 'onhold' ) ).toBe( output );
	} );

	test( 'has a blank status', () => {
		const talkWikicode =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=|note=}}';
		const output =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}';
		expect( wg.changeGANomineeTemplateStatus( talkWikicode, 'onhold' ) ).toBe( output );
	} );

	test( 'has a status, but needs to be changed', () => {
		const talkWikicode =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=2ndopinion|note=}}';
		const output =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|status=onhold|note=}}';
		expect( wg.changeGANomineeTemplateStatus( talkWikicode, 'onhold' ) ).toBe( output );
	} );

	test( 'no old status, insert new status', () => {
		const talkWikicode =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|note=}}';
		const output =
'{{GA nominee|23:46, 28 June 2022 (UTC)|nominator=[[User:TonyTheTiger|TonyTheTiger]] <small>([[User talk:TonyTheTiger|T]] / [[Special:Contributions/TonyTheTiger|C]] / [[WP:FOUR]] / [[WP:CHICAGO]] / [[WP:WAWARD]])</small>|page=1|subtopic=Sports and recreation|note=|status=onhold}}';
		expect( wg.changeGANomineeTemplateStatus( talkWikicode, 'onhold' ) ).toBe( output );
	} );

	test( 'Should handle nested templates (#209)', () => {
		const talkWikicode =
`{{GA nominee|05:34, 10 September 2023 (UTC)|nominator={{colored link|#198754|User:Jake-jakubowski|Jake Jakubowski}} <sup>{{colored link|#0d6efd|User_talk:Jake-jakubowski|Talk}}</sup>|page=2|subtopic=Transport|status=onreview|note=|shortdesc=Road bridge in Maine, US}}
{{FailedGA|22:33, 29 August 2023 (UTC)|topic=Transport|page=1|oldid=1171806123}}`;
		const output =
`{{GA nominee|05:34, 10 September 2023 (UTC)|nominator={{colored link|#198754|User:Jake-jakubowski|Jake Jakubowski}} <sup>{{colored link|#0d6efd|User_talk:Jake-jakubowski|Talk}}</sup>|page=2|subtopic=Transport|status=onhold|note=|shortdesc=Road bridge in Maine, US}}
{{FailedGA|22:33, 29 August 2023 (UTC)|topic=Transport|page=1|oldid=1171806123}}`;
		expect( wg.changeGANomineeTemplateStatus( talkWikicode, 'onhold' ) ).toBe( output );
	} );
} );
