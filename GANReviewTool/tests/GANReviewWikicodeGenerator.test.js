//import * as service from "../modules/GANReviewWikicodeGenerator.js";
const { GANReviewWikicodeGenerator } = require("../modules/GANReviewWikicodeGenerator");

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

// npx jest --coverage for HTML code coverage report, in /coverage/lcov-report

let wg = new GANReviewWikicodeGenerator();

// TODO: group each test into 3 paragraphs: given, when, then

// Only unit testing public methods. Recommended best practice, for easier refactoring.

// Fold All (Ctrl+K Ctrl+0) folds all regions in the editor. Unfold All (Ctrl+K Ctrl+J) unfolds all regions in the editor.

describe('getPassWikicodeForGANPage(reviewWikicode)', () => {
	test('Should place {{atopg}}', () => {
		let reviewWikicode = 
`==GA Review==
{{Good article tools}}
<noinclude>{{al|{{#titleparts:2021 French Grand Prix/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:2021 French Grand Prix/GA1]]. The edit link for this section can be used to add comments to the rehg.''</includeonly>
::I'm happy to support the nomination (and will pass now). I've pretty much given you a FAC review above, which is where the article should probably go. I trust that you'll make the neccesary changes I've outlined before taking it to that forum. Great article, fantastic work '''[[User:Lee Vilenski|<span style="color:green">Lee Vilenski</span>]] <sup>([[User talk:Lee Vilenski|talk]] • [[Special:Contribs/Lee Vilenski|contribs]])</sup>''' 12:13, 13 June 2022 (UTC)
`;
		let output = 
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
		expect(wg.getPassWikicodeForGANPage(reviewWikicode)).toBe(output);
	});
});

describe('getPassWikicodeForTalkPage(talkWikicode, reviewTitle, gaSubpageShortTitle)', () => {
	test('Should handle no {{Article history}} present', () => {
		let talkWikicode =
`{{GA nominee|20:49, 10 May 2022 (UTC)|nominator=[[User:Sinopecynic|Sinopecynic]] ([[User talk:Sinopecynic|talk]])|page=1|subtopic=Art and architecture|status=onreview|note=}}
{{WikiProject Visual arts|class=b}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		let reviewTitle = `Thomas Carlyle (Millais)/GA1`;
		let gaSubpageShortTitle = `Video games`;
		let output =
`{{GA|~~~~~|topic=Video games|page=1}}
{{WikiProject Visual arts|class=GA}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		expect(wg.getPassWikicodeForTalkPage(talkWikicode, reviewTitle, gaSubpageShortTitle)).toBe(output);
	});

	test('Should handle {{Article history}} present', () => {
		let talkWikicode =
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
		let reviewTitle = `Thomas Carlyle (Millais)/GA1`;
		let gaSubpageShortTitle = `Warfare`;
		let output =
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
|currentstatus = GA
|topic = Warfare
}}
{{WikiProject Visual arts|class=GA}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		expect(wg.getPassWikicodeForTalkPage(talkWikicode, reviewTitle, gaSubpageShortTitle)).toBe(output);
	});

	test(`Should set |class=GA for templates that don't start with {{WikiProject`, () => {
		let talkWikicode =
`{{GA nominee|20:49, 10 May 2022 (UTC)|nominator=[[User:Sinopecynic|Sinopecynic]] ([[User talk:Sinopecynic|talk]])|page=1|subtopic=Art and architecture|status=onreview|note=}}
{{WikiProject Visual arts|class=b}}
{{environment|class=B|importance=mid}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		let reviewTitle = `Thomas Carlyle (Millais)/GA1`;
		let gaSubpageShortTitle = `Sports and recreation`;
		let output =
`{{GA|~~~~~|topic=Sports and recreation|page=1}}
{{WikiProject Visual arts|class=GA}}
{{environment|class=GA|importance=mid}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		expect(wg.getPassWikicodeForTalkPage(talkWikicode, reviewTitle, gaSubpageShortTitle)).toBe(output);
	});

	test(`Should place {{GA}} below {{Talk page header}}`, () => {
		let talkWikicode =
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
		let reviewTitle = `Pixel 6/GA1`;
		let gaSubpageShortTitle = `Engineering and technology`;
		let output =
`{{Talk page header}}
{{GA|~~~~~|topic=Engineering and technology|page=1}}
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
		expect(wg.getPassWikicodeForTalkPage(talkWikicode, reviewTitle, gaSubpageShortTitle)).toBe(output);
	});

	test(`Should change empty |class= to |class=GA`, () => {
		let talkWikicode =
`{{GA nominee|17:35, 8 June 2022 (UTC)|nominator=[[User:Underclass King|Underclass King]] ([[User talk:Underclass King|talk]])|page=1|subtopic=Television|status=onreview|note=}}
{{WikiProject Television|class=}}
{{WikiProject LGBT studies|class=Start}}
`;
		let reviewTitle = `Talk:Seriously, Dude, I'm Gay/GA1`;
		let gaSubpageShortTitle = `Media and drama`;
		let output =
`{{GA|~~~~~|topic=Media and drama|page=1}}
{{WikiProject Television|class=GA}}
{{WikiProject LGBT studies|class=GA}}
`;
		expect(wg.getPassWikicodeForTalkPage(talkWikicode, reviewTitle, gaSubpageShortTitle)).toBe(output);
	});

	test(`Should change {{WikiProject}} template with no parameters to include |class=GA`, () => {
		let talkWikicode =
`{{GA nominee|17:35, 8 June 2022 (UTC)|nominator=[[User:Underclass King|Underclass King]] ([[User talk:Underclass King|talk]])|page=1|subtopic=Television|status=onreview|note=}}
{{WikiProject Television}}
`;
		let reviewTitle = `Talk:Seriously, Dude, I'm Gay/GA1`;
		let gaSubpageShortTitle = `Media and drama`;
		let output =
`{{GA|~~~~~|topic=Media and drama|page=1}}
{{WikiProject Television|class=GA}}
`;
		expect(wg.getPassWikicodeForTalkPage(talkWikicode, reviewTitle, gaSubpageShortTitle)).toBe(output);
	});

	/*
	test(`When the [[MOS:TALKORDER]] of the page is wrong, err on the side of placing {{GA}} higher`, () => {
		let talkWikicode =
`{{GA nominee|20:56, 20 August 2022 (UTC)|nominator=[[User:Aoidh|Aoidh]] ([[User talk:Aoidh|talk]])|page=1|subtopic=Computing and engineering|status=onhold|note=}}
{{Talk header}}
{{WikiProject banner shell|1=
{{WikiProject Linux|class=B|importance=low}}
{{WikiProject Computing |class=B |importance= |free-software=yes |free-software-importance=low |software=yes }}
}}
{{American English}}
{{Annual readership|expanded=true}}
`;
		let reviewTitle = `Talk:Seriously, Dude, I'm Gay/GA1`;
		let gaSubpageShortTitle = `Engineering and technology`;
		let output =
`{{Talk header}}
{{GA|~~~~~|topic=Engineering and technology|page=1}}
{{WikiProject banner shell|1=
{{WikiProject Linux|class=GA|importance=low}}
{{WikiProject Computing |class=GA |importance= |free-software=yes |free-software-importance=low |software=yes }}
}}
{{American English}}
{{Annual readership|expanded=true}}
`;
		expect(wg.getPassWikicodeForTalkPage(talkWikicode, reviewTitle, gaSubpageShortTitle)).toBe(output);
	});
	*/
});

describe('getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)', () => {
	test('Should handle a wikilink with no pipe', () => {
		let gaSubpageHeading = `=====Bodies of water and water formations=====`;
		let gaTitle = `Nile River`;
		let gaDisplayTitle = `Nile River`;
		let gaSubpageWikicode =
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
		let output =
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
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should handle a piped wikilink', () => {
		let gaSubpageHeading = `=====Geographers and explorers=====`;
		let gaTitle = `David Attenborough`;
		let gaDisplayTitle = `Attenborough, David`;
		let gaSubpageWikicode =
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
		let output =
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
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test(`Should handle when provided heading doesn't exactly match list heading`, () => {
		let gaSubpageHeading = `=====Landforms=====`;
		let gaTitle = `Amak Volcano`;
		let gaDisplayTitle = `Amak Volcano`;
		let gaSubpageWikicode =
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
		let output =
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
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should handle being first in the list', () => {
		let gaSubpageHeading = `=====Landforms=====`;
		let gaTitle = `Aardvark`;
		let gaDisplayTitle = `Aardvark`;
		let gaSubpageWikicode =
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
		let output =
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
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should handle being last in the list', () => {
		let gaSubpageHeading = `=====Landforms=====`;
		let gaTitle = `Zebra`;
		let gaDisplayTitle = `Zebra`;
		let gaSubpageWikicode =
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
		let output =
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
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should sort numbers before letters', () => {
		let gaSubpageHeading = `=====Landforms=====`;
		let gaTitle = `123`;
		let gaDisplayTitle = `123`;
		let gaSubpageWikicode =
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
		let output =
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
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should sort by display title, not article name', () => {
		let gaSubpageHeading = `=====Landforms=====`;
		let gaTitle = `Test`;
		let gaDisplayTitle = `123`;
		let gaSubpageWikicode =
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
		let output =
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
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should ignore italics when sorting the haystack', () => {
		let gaSubpageHeading = `=====Landforms=====`;
		let gaTitle = `?Antelope`;
		let gaDisplayTitle = `?Antelope`;
		let gaSubpageWikicode =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Alepotrypa Cave|''Aleoptrypa Cave'']]
}}
`;
		let output =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[?Antelope]]
[[Alepotrypa Cave|''Aleoptrypa Cave'']]
}}
`;
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should ignore italics when sorting the needle', () => {
		let gaSubpageHeading = `=====Landforms=====`;
		let gaTitle = `Building`;
		let gaDisplayTitle = `''Building''`;
		let gaSubpageWikicode =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Alepotrypa Cave|''Aleoptrypa Cave'']]
[[Alepotrypa Cave|'Hello]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}
`;
		let output =
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
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should ignore {{Further}} when it is present in the list', () => {
		let gaSubpageHeading = `=====Landforms=====`;
		let gaTitle = `ABC`;
		let gaDisplayTitle = `ABC`;
		let gaSubpageWikicode =
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
		let output =
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
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should ignore italics when sorting the needle', () => {
		let gaSubpageHeading = `=====Landforms=====`;
		let gaTitle = `Building`;
		let gaDisplayTitle = `''Building''`;
		let gaSubpageWikicode =
`===== Landforms =====
{{#invoke:Good Articles|subsection|
[[Alepotrypa Cave|''Aleoptrypa Cave'']]
[[Alepotrypa Cave|'Hello]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
}}
`;
		let output =
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
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should ignore articles (a, an, the) in the haystack', () => {
		let gaSubpageHeading = `=====Cookery books=====`;
		let gaTitle = `Food in the United States`;
		let gaDisplayTitle = `''Food in the United States''`;
		let gaSubpageWikicode =
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
		let output =
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
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should ignore articles (a, an, the) in the needle', () => {
		let gaSubpageHeading = `=====Cookery books=====`;
		let gaTitle = `The Compleat Housewife`;
		let gaDisplayTitle = `''The Compleat Housewife''`;
		let gaSubpageWikicode =
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
		let output =
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
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should handle when there are multiple of the same heading', () => {
		let gaSubpageHeading = `=====Art=====`;
		let gaTitle = `The Great Wave off Kanagawa`;
		let gaDisplayTitle = `The Great Wave off Kanagawa`;
		let gaSubpageWikicode =
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
		let output =
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
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('For sorting, should treat lowercase and uppercase letters as identical', () => {
		let gaSubpageHeading = `=====Actors, directors, models, performers, and celebrities=====`;
		let gaTitle = `Amrita Rao`;
		let gaDisplayTitle = `Rao, Amrita`;
		let gaSubpageWikicode =
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
		let output =
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
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should trim() extra spaces at end of the display title', () => {
		let gaSubpageHeading = `=====Actors, directors, models, performers, and celebrities=====`;
		let gaTitle = `Amrita Rao`;
		let gaDisplayTitle = `Rao, Amrita `;
		let gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Ellen Pompeo|Pompeo, Ellen]]
[[Amanda Seyfried|Seyfried, Amanda]]
}}
`;
		let output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Ellen Pompeo|Pompeo, Ellen]]
[[Amrita Rao|Rao, Amrita]]
[[Amanda Seyfried|Seyfried, Amanda]]
}}
`;
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should place an article beginning with M after an article beginning with É', () => {
		let gaSubpageHeading = `=====Actors, directors, models, performers, and celebrities=====`;
		let gaTitle = `Minskoff Theatre`;
		let gaDisplayTitle = `Minskoff Theatre`;
		let gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Édifice Price]]
}}
`;
		let output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Édifice Price]]
[[Minskoff Theatre]]
}}
`;
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Should place an article beginning with m after an article beginning with é', () => {
		let gaSubpageHeading = `=====Actors, directors, models, performers, and celebrities=====`;
		let gaTitle = `minskoff theatre`;
		let gaDisplayTitle = `minskoff theatre`;
		let gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[édifice price]]
}}
`;
		let output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[édifice price]]
[[minskoff theatre]]
}}
`;
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('should handle empty list', () => {
		let gaSubpageHeading = `=====Actors, directors, models, performers, and celebrities=====`;
		let gaTitle = `Pakeezah`;
		let gaDisplayTitle = `Pakeezah`;
		let gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
}}
`;
		let output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Pakeezah]]
}}
`;
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('if only decoration is italics, should place italics outside the wikilink', () => {
		let gaSubpageHeading = `=====Actors, directors, models, performers, and celebrities=====`;
		let gaTitle = `Pakeezah`;
		let gaDisplayTitle = `''Pakeezah''`;
		let gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Abc]]
}}
`;
		let output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Abc]]
''[[Pakeezah]]''
}}
`;
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('sort in numerical order, not lexographical order', () => {
		let gaSubpageHeading = `=====Actors, directors, models, performers, and celebrities=====`;
		let gaTitle = `Ontario Highway 8`;
		let gaDisplayTitle = `Ontario Highway 8`;
		let gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Ontario Highway 79]]
[[Ontario Highway 81]]
}}
`;
		let output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
[[Ontario Highway 8]]
[[Ontario Highway 79]]
[[Ontario Highway 81]]
}}
`;
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test(`don't used a piped wikilink for stuff in double quotes`, () => {
		let gaSubpageHeading = `=====Actors, directors, models, performers, and celebrities=====`;
		let gaTitle = `Ontario Highway 8`;
		let gaDisplayTitle = `"Ontario Highway 8"`;
		let gaSubpageWikicode =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
}}
`;
		let output =
`=====Actors, directors, models, performers, and celebrities=====
{{#invoke:Good Articles|subsection|
"[[Ontario Highway 8]]"
}}
`;
		expect(wg.getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});
});

describe('getFailWikicodeForGANPage(reviewWikicode)', () => {
	test('Should place {{atopr}}', () => {
		let reviewWikicode = 
`==GA Review==
{{Good article tools}}
<noinclude>{{al|{{#titleparts:2021 French Grand Prix/GA1|-1}}|noname=yes}}<br/></noinclude><includeonly>:''This review is [[WP:transclusion|transcluded]] from [[Talk:2021 French Grand Prix/GA1]]. The edit link for this section can be used to add comments to the rehg.''</includeonly>
::I'm happy to support the nomination (and will pass now). I've pretty much given you a FAC review above, which is where the article should probably go. I trust that you'll make the neccesary changes I've outlined before taking it to that forum. Great article, fantastic work '''[[User:Lee Vilenski|<span style="color:green">Lee Vilenski</span>]] <sup>([[User talk:Lee Vilenski|talk]] • [[Special:Contribs/Lee Vilenski|contribs]])</sup>''' 12:13, 13 June 2022 (UTC)
`;
		let output = 
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
		expect(wg.getFailWikicodeForGANPage(reviewWikicode)).toBe(output);
	});
});

describe('getFailWikicodeForTalkPage(talkWikicode, reviewTitle)', () => {
	test('Should handle no {{Article history}} present', () => {
		let talkWikicode = 
`{{GA nominee|20:49, 10 May 2022 (UTC)|nominator=[[User:Sinopecynic|Sinopecynic]] ([[User talk:Sinopecynic|talk]])|page=1|subtopic=Art and architecture|status=onreview|note=}}
{{WikiProject Visual arts|class=b}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		let reviewTitle = `Thomas Carlyle (Millais)/GA1`;
		let output = 
`{{FailedGA|~~~~~|topic=Art and architecture|page=1}}
{{WikiProject Visual arts|class=b}}

{{Talk:Thomas Carlyle (Millais)/GA1}}
`;
		expect(wg.getFailWikicodeForTalkPage(talkWikicode, reviewTitle)).toBe(output);
	});

	test('Should handle {{Article history}} present', () => {
		let talkWikicode = 
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
		let reviewTitle = `SpaceX Starship/GA2`;
		let output = 
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
|currentstatus = FGAN
|topic = Physics and astronomy
}}

{{Talk:SpaceX Starship/GA2}}
`;
		expect(wg.getFailWikicodeForTalkPage(talkWikicode, reviewTitle)).toBe(output);
	});

	test('Should handle {{Vital article|topic=', () => {
		let talkWikicode = 
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
		let reviewTitle = `Talk:Cristiano Ronaldo/GA5`;
		let output = 
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
|currentstatus = FGAN
|topic = Sports and recreation
}}
`;
		expect(wg.getFailWikicodeForTalkPage(talkWikicode, reviewTitle)).toBe(output);
	});
});

describe('getLogMessageToAppend(username, passOrFail, reviewTitle, reviewRevisionID, talkRevisionID, gaRevisionID, error)', () => {
	test('Should handle a pass', () => {
		let username = 'Sammi Brie';
		let passOrFail = 'pass';
		let reviewTitle = `Talk:1982 World's Fair/GA1`;
		let reviewRevisionID = `1094307525`;
		let talkRevisionID = `1094307532`;
		let gaRevisionID = `1094307538`;
		let error = false;
		let output = `\n* [[User:Sammi Brie|Sammi Brie]] passed [[Talk:1982 World's Fair/GA1]] at ~~~~~. [[Special:Diff/1094307525|[Atop]]][[Special:Diff/1094307532|[Talk]]][[Special:Diff/1094307538|[List]]]`;
		expect(wg.getLogMessageToAppend(username, passOrFail, reviewTitle, reviewRevisionID, talkRevisionID, gaRevisionID, error)).toBe(output);
	});

	test('Should handle a fail', () => {
		let username = 'Sammi Brie';
		let passOrFail = 'fail';
		let reviewTitle = `Talk:1982 World's Fair/GA1`;
		let reviewRevisionID = `1094307525`;
		let talkRevisionID = `1094307532`;
		let gaRevisionID = ``;
		let error = false;
		let output = `\n* [[User:Sammi Brie|Sammi Brie]] failed [[Talk:1982 World's Fair/GA1]] at ~~~~~. [[Special:Diff/1094307525|[Atop]]][[Special:Diff/1094307532|[Talk]]]`;
		expect(wg.getLogMessageToAppend(username, passOrFail, reviewTitle, reviewRevisionID, talkRevisionID, gaRevisionID, error)).toBe(output);
	});

	test('Should handle an error', () => {
		let username = 'Novem Linguae';
		let passOrFail = 'pass';
		let reviewTitle = `Talk:Thomas Carlyle (Millais)/GA1`;
		let reviewRevisionID = undefined;
		let talkRevisionID = undefined;
		let gaRevisionID = undefined;
		let error = `ReferenceError: getPassWikicodeForGANPage is not defined`;
		let output = `\n* <span style="color: red; font-weight: bold;">ERROR:</span> ReferenceError: getPassWikicodeForGANPage is not defined. [[User:Novem Linguae|Novem Linguae]] passed [[Talk:Thomas Carlyle (Millais)/GA1]] at ~~~~~. `;
		expect(wg.getLogMessageToAppend(username, passOrFail, reviewTitle, reviewRevisionID, talkRevisionID, gaRevisionID, error)).toBe(output);
	});

	test('Should not display [Atop] diff if user selected not to place {{Atop}}', () => {
		let username = 'Sammi Brie';
		let passOrFail = 'pass';
		let reviewTitle = `Talk:1982 World's Fair/GA1`;
		let reviewRevisionID = undefined;
		let talkRevisionID = `1094307532`;
		let gaRevisionID = `1094307538`;
		let error = false;
		let output = `\n* [[User:Sammi Brie|Sammi Brie]] passed [[Talk:1982 World's Fair/GA1]] at ~~~~~. [[Special:Diff/1094307532|[Talk]]][[Special:Diff/1094307538|[List]]]`;
		expect(wg.getLogMessageToAppend(username, passOrFail, reviewTitle, reviewRevisionID, talkRevisionID, gaRevisionID, error)).toBe(output);
	});
});

// Private methods. Only unit testing public methods. Best practice for easier refactoring.

describe('placeATOP(wikicode, result, color)', () => {
	test('h2 present', () => {
		let result = 'Passed';
		let color = 'green';
		let wikicode =
`

== Test ==


== Test ==

test

blah`;
		let output =
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
		expect(wg.placeATOP(wikicode, result, color)).toBe(output);
	});

	test('h2 absent', () => {
		let result = 'Passed';
		let color = 'green';
		let wikicode =
`test

blah`;
		let output =
`{{atopg
| status = 
| result = Passed
}}
test

blah
{{abot}}
`;
		expect(wg.placeATOP(wikicode, result, color)).toBe(output);
	});

	test('failed instead of passed', () => {
		let result = 'Failed';
		let color = 'red';
		let wikicode =
`test

blah`;
		let output =
`{{atopr
| status = 
| result = Failed
}}
test

blah
{{abot}}
`;
		expect(wg.placeATOP(wikicode, result, color)).toBe(output);
	});
});

describe('getTopicFromGANomineeTemplate(talkWikicode)', () => {
	test('topic', () => {
		let talkWikicode = `{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}`;
		let output = 'Media and drama';
		expect(wg.getTopicFromGANomineeTemplate(talkWikicode)).toBe(output);
	});

	test('subtopic', () => {
		let talkWikicode = `{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|subtopic=Media and drama| status=onhold|note=}}`;
		let output = 'Media and drama';
		expect(wg.getTopicFromGANomineeTemplate(talkWikicode)).toBe(output);
	});

	test('whitespace', () => {
		let talkWikicode = `{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|subtopic= Media and drama | status=onhold|note=}}`;
		let output = 'Media and drama';
		expect(wg.getTopicFromGANomineeTemplate(talkWikicode)).toBe(output);
	});

	test('lowercase', () => {
		let talkWikicode = `{{ga nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}`;
		let output = 'Media and drama';
		expect(wg.getTopicFromGANomineeTemplate(talkWikicode)).toBe(output);
	});
});

describe('deleteGANomineeTemplate(talkWikicode)', () => {
	test('normal', () => {
		let talkWikicode = `{{Test}}{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}{{Test2}}`;
		let output = '{{Test}}{{Test2}}';
		expect(wg.deleteGANomineeTemplate(talkWikicode)).toBe(output);
	});

	test('lowercase', () => {
		let talkWikicode = `{{Test}}{{ga nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}{{Test2}}`;
		let output = '{{Test}}{{Test2}}';
		expect(wg.deleteGANomineeTemplate(talkWikicode)).toBe(output);
	});

	test('delete a line break too', () => {
		let talkWikicode =
`{{Test}}
{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}
{{Test2}}`;
		let output =
`{{Test}}
{{Test2}}`;
		expect(wg.deleteGANomineeTemplate(talkWikicode)).toBe(output);
	});
});

describe('getTemplateParameter(wikicode, templateName, parameterName)', () => {
	test('found', () => {
		let wikicode = `{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}`;
		let templateName = 'GA nominee';
		let parameterName = 'topic';
		let output = 'Media and drama';
		expect(wg.getTemplateParameter(wikicode, templateName, parameterName)).toBe(output);
	});

	test('template name case difference', () => {
		let wikicode = `{{ga nomINee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}`;
		let templateName = 'GA nominee';
		let parameterName = 'topic';
		let output = 'Media and drama';
		expect(wg.getTemplateParameter(wikicode, templateName, parameterName)).toBe(output);
	});

	test('parameter name case difference', () => {
		let wikicode = `{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|toPIc=Media and drama|status=onhold|note=}}`;
		let templateName = 'GA nominee';
		let parameterName = 'topic';
		let output = 'Media and drama';
		expect(wg.getTemplateParameter(wikicode, templateName, parameterName)).toBe(output);
	});

	test('not found', () => {
		let wikicode = `{{blah|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|toPIc=Media and drama|status=onhold|note=}}`;
		let templateName = 'GA nominee';
		let parameterName = 'topic';
		let output = null;
		expect(wg.getTemplateParameter(wikicode, templateName, parameterName)).toBe(output);
	});
});

describe('regExEscape(string)', () => {
	test('Nothing to escape', () => {
		let string = `Test Test`;
		let output = 'Test Test';
		expect(wg.regExEscape(string)).toBe(output);
	});

	test('Escape {', () => {
		let string = `Test{Test`;
		let output = 'Test\\{Test';
		expect(wg.regExEscape(string)).toBe(output);
	});
});

describe('addGATemplate(talkWikicode, topic, gaPageNumber)', () => {
	test('Normal', () => {
		let talkWikicode = `Test Test`;
		let topic = 'agriculture, food, and drink';
		let gaPageNumber = 2;
		let output =
`{{GA|~~~~~|topic=agriculture, food, and drink|page=2}}
Test Test`;
		expect(wg.addGATemplate(talkWikicode, topic, gaPageNumber)).toBe(output);
	});

	test('Below {{Talk Header}}', () => {
		let talkWikicode =
`{{Talk Header}}
Test Test`;
		let topic = 'agriculture, food, and drink';
		let gaPageNumber = 2;
		let output =
`{{Talk Header}}
{{GA|~~~~~|topic=agriculture, food, and drink|page=2}}
Test Test`;
		expect(wg.addGATemplate(talkWikicode, topic, gaPageNumber)).toBe(output);
	});

	test('Below {{talkheader}}', () => {
		let talkWikicode =
`{{talkheader}}
Test Test`;
		let topic = 'agriculture, food, and drink';
		let gaPageNumber = 2;
		let output =
`{{talkheader}}
{{GA|~~~~~|topic=agriculture, food, and drink|page=2}}
Test Test`;
		expect(wg.addGATemplate(talkWikicode, topic, gaPageNumber)).toBe(output);
	});
});

describe('getFirstTemplateNameFromWikicode(wikicode)', () => {
	test('No template', () => {
		let wikicode = `Hi`;
		expect(() => wg.getFirstTemplateNameFromWikicode(wikicode)).toThrow('getFirstTemplateNameFromWikicode: No template found in Wikicode.');
	});

	test('Normal', () => {
		let wikicode = `Hi{{Test|hello}}`;
		let output = `Test`;
		expect(wg.getFirstTemplateNameFromWikicode(wikicode)).toBe(output);
	});
});

describe('addTemplateInCorrectMOSTalkOrderPosition(talkWikicode, codeToAdd)', () => {
	test('No template', () => {
		let talkWikicode = `Hi`;
		let codeToAdd = `{{NonExistentTemplate0967}}`;
		expect(() => wg.addTemplateInCorrectMOSTalkOrderPosition(talkWikicode,codeToAdd)).toThrow('addTemplateInCorrectMOSTalkOrderPosition: Supplied template is not in dictionary. Unsure where to place it.');
	});
});

describe('addFailedGATemplate(talkWikicode, topic, gaPageNumber)', () => {
	test('Normal', () => {
		let talkWikicode = `Test Test`;
		let topic = 'agriculture, food, and drink';
		let gaPageNumber = 2;
		let output =
`{{FailedGA|~~~~~|topic=agriculture, food, and drink|page=2}}
Test Test`;
		expect(wg.addFailedGATemplate(talkWikicode, topic, gaPageNumber)).toBe(output);
	});

	test('below {{Talk Header}}', () => {
		let talkWikicode =
`{{Talk Header}}
Test Test`;
		let topic = 'agriculture, food, and drink';
		let gaPageNumber = 2;
		let output =
`{{Talk Header}}
{{FailedGA|~~~~~|topic=agriculture, food, and drink|page=2}}
Test Test`;
		expect(wg.addFailedGATemplate(talkWikicode, topic, gaPageNumber)).toBe(output);
	});
});

describe('changeWikiProjectArticleClassToGA(talkWikicode)', () => {
	test('normal', () => {
		let talkWikicode =
`{{WikiProject banner shell|blp=yes|1=
{{WikiProject Biography|living=yes|needs-infobox=no|needs-photo=yes|listas=Amamiya, Sora|class=Start|musician-work-group=yes|musician-priority=}}
{{WikiProject Anime and manga|class=Start|biography=yes|importance=low|listas=Amamiya, Sora}}
{{WikiProject Japan|class=Start|biography|yes|importance=low|listas=Amamiya, Sora}}
{{WikiProject Women in Music |class=Start |importance=Low|listas=Amamiya, Sora}}
}}`;
		let output =
`{{WikiProject banner shell|blp=yes|1=
{{WikiProject Biography|living=yes|needs-infobox=no|needs-photo=yes|listas=Amamiya, Sora|class=GA|musician-work-group=yes|musician-priority=}}
{{WikiProject Anime and manga|class=GA|biography=yes|importance=low|listas=Amamiya, Sora}}
{{WikiProject Japan|class=GA|biography|yes|importance=low|listas=Amamiya, Sora}}
{{WikiProject Women in Music |class=GA |importance=Low|listas=Amamiya, Sora}}
}}`;
		expect(wg.changeWikiProjectArticleClassToGA(talkWikicode)).toBe(output);
	});

	test(`don't change |class in non-WikiProject templates`, () => {
		let talkWikicode =
`{{WikiProject Anime and manga|class=Start|biography=yes|importance=low|listas=Amamiya, Sora}}
{{Random template|class=DontChangeMe}}`;
		let output =
`{{WikiProject Anime and manga|class=GA|biography=yes|importance=low|listas=Amamiya, Sora}}
{{Random template|class=DontChangeMe}}`;
		expect(wg.changeWikiProjectArticleClassToGA(talkWikicode)).toBe(output);
	});
});

describe('determineNextActionNumber(talkWikicode)', () => {
	test('1', () => {
		let talkWikicode =
`{{Article history
|action1=FAC
|action1date=14 January 2004
|action1link=Wikipedia:Featured_article_candidates/Archived_nominations/Index/June_2003_to_January_2004#Bacteria
|action1result=failed
|action1oldid=47350127
}}`;
		let output = 2;
		expect(wg.determineNextActionNumber(talkWikicode)).toBe(output);
	});

	test('2', () => {
		let talkWikicode =
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
		let output = 3;
		expect(wg.determineNextActionNumber(talkWikicode)).toBe(output);
	});
});

describe('updateArticleHistory(talkWikicode, topic, nominationPageTitle, listedOrFailed)', () => {
	test('listed, GA', () => {
		let talkWikicode =
`{{Talk header|archive_age=31|archive_bot=Lowercase sigmabot III}}
{{Article history
|action1=AFD
|action1date=6 June 2007
|action1link=Wikipedia:Articles for deletion/Cow tipping
|action1result=kept
}}`;
		let topic = 'agriculture';
		let nominationPageTitle = 'Talk:Cow tipping/GA1';
		let listedOrFailed = 'listed';
		let output =
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
|currentstatus = GA
|topic = agriculture
}}`;
		expect(wg.updateArticleHistory(talkWikicode, topic, nominationPageTitle, listedOrFailed)).toBe(output);
	});

	test('listed, FFAC/GA', () => {
		let talkWikicode =
`{{Article history
|action1=FAC
|action1date=14 January 2004
|action1link=Wikipedia:Featured_article_candidates/Archived_nominations/Index/June_2003_to_January_2004#Bacteria
|action1result=failed
|action1oldid=47350127
|currentstatus=FFAC
}}`;
		let topic = 'Natural Sciences';
		let nominationPageTitle = 'Talk:Agriculture/GA2';
		let listedOrFailed = 'listed';
		let output =
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
|currentstatus = FFAC/GA
|topic = Natural Sciences
}}`;
		expect(wg.updateArticleHistory(talkWikicode, topic, nominationPageTitle, listedOrFailed)).toBe(output);
	});

	test('failed, DGA', () => {
		let talkWikicode =
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
		let topic = 'Physics and astronomy';
		let nominationPageTitle = 'Talk:SpaceX Starship/GA2';
		let listedOrFailed = 'failed';
		let output =
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
|currentstatus = DGA
|topic = Physics and astronomy
}}
`;
		expect(wg.updateArticleHistory(talkWikicode, topic, nominationPageTitle, listedOrFailed)).toBe(output);
	});
});

describe('firstTemplateInsertCode(wikicode, templateNameRegExNoDelimiters, codeToInsert)', () => {
	test('{{Article history}}', () => {
		let wikicode =
`{{Article history
|action1=FAC
|action1date=14 January 2004
|action1link=Wikipedia:Featured_article_candidates/Archived_nominations/Index/June_2003_to_January_2004#Bacteria
|action1result=failed
|action1oldid=47350127
}}`;
		let templateNameRegExNoDelimiters = 'Article ?history';
		let codeToInsert =
`|action2 = GAN
|action2date = ~~~~~
|action2link = Talk:Agriculture/GA2
|action2result = listed
|currentstatus = GA
|topic = Natural Sciences`;
		let output =
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
		expect(wg.firstTemplateInsertCode(wikicode, templateNameRegExNoDelimiters, codeToInsert)).toBe(output);
	});

	test('should be case insensitive', () => {
		let wikicode =
`{{ArticleHistory
|topic = Physics and astronomy
}}
`;
		let templateNameRegExNoDelimiters = 'Article ?history';
		let codeToInsert =
`|action12 = GAN
|action12date = ~~~~~
|action12link = Talk:SpaceX Starship/GA1
|action12result = failed
|currentstatus = DGA`;
		let output =
`{{ArticleHistory
|topic = Physics and astronomy

|action12 = GAN
|action12date = ~~~~~
|action12link = Talk:SpaceX Starship/GA1
|action12result = failed
|currentstatus = DGA
}}
`;
		expect(wg.firstTemplateInsertCode(wikicode, templateNameRegExNoDelimiters, codeToInsert)).toBe(output);
	});
});

describe('getGASubpageHeadingPosition(shortenedVersionInComboBox, wikicode)', () => {
	test('Exact match', () => {
		let wikicode = `=====Bodies of water and water formations=====`;
		let shortenedVersionInComboBox = `=====Bodies of water and water formations=====`;
		let output = 0;
		expect(wg.getGASubpageHeadingPosition(shortenedVersionInComboBox, wikicode)).toBe(output);
	});

	test('No match', () => {
		let wikicode = `blah blah blah`;
		let shortenedVersionInComboBox = `=====Bodies of water and water formations=====`;
		let output = -1;
		expect(wg.getGASubpageHeadingPosition(shortenedVersionInComboBox, wikicode)).toBe(output);
	});

	test('Input no space in front of ===, wikicode yes space in front of ===', () => {
		let wikicode = `===== Landforms =====`;
		let shortenedVersionInComboBox = `=====Landforms=====`;
		let output = 0;
		expect(wg.getGASubpageHeadingPosition(shortenedVersionInComboBox, wikicode)).toBe(output);
	});

	test('Wikicode has [[File:', () => {
		let wikicode = `===[[File:Gnome-globe.svg|22px|left|alt=|link=]] Geography===`;
		let shortenedVersionInComboBox = `===Geography===`;
		let output = 0;
		expect(wg.getGASubpageHeadingPosition(shortenedVersionInComboBox, wikicode)).toBe(output);
	});

	test('two headings with same name', () => {
		let wikicode =
`===[[File:Nuvola apps package graphics.svg|22px|left|alt=|link=]] Art===

=====Art=====

`;
		let shortenedVersionInComboBox = `=====Art=====`;
		let output = 74;
		expect(wg.getGASubpageHeadingPosition(shortenedVersionInComboBox, wikicode)).toBe(output);
	});
});

describe('findFirstStringAfterPosition(needle, haystack, position)', () => {
	test('No match', () => {
		let needle = `Needle`;
		let haystack = `Haystack`;
		let position = 3;
		let output = -1;
		expect(wg.findFirstStringAfterPosition(needle, haystack, position)).toBe(output);
	});

	test('Start at 0. Match immediately.', () => {
		let needle = `Hay`;
		let haystack = `Haystack`;
		let position = 0;
		let output = 0;
		expect(wg.findFirstStringAfterPosition(needle, haystack, position)).toBe(output);
	});

	test('Start at 3. Match immediately.', () => {
		let needle = `stack`;
		let haystack = `Haystack`;
		let position = 3;
		let output = 3;
		expect(wg.findFirstStringAfterPosition(needle, haystack, position)).toBe(output);
	});

	test('Start at 3. Match later.', () => {
		let needle = `ack`;
		let haystack = `Haystack`;
		let position = 0;
		let output = 5;
		expect(wg.findFirstStringAfterPosition(needle, haystack, position)).toBe(output);
	});
});

describe('insertStringIntoStringAtPosition(bigString, insertString, position)', () => {
	test('Middle', () => {
		let bigString = 'Haystack';
		let insertString = 'Needle';
		let position = 3;
		let output = 'HayNeedlestack';
		expect(wg.insertStringIntoStringAtPosition(bigString, insertString, position)).toBe(output);
	});

	test('Start', () => {
		let bigString = 'Haystack';
		let insertString = 'Needle';
		let position = 0;
		let output = 'NeedleHaystack';
		expect(wg.insertStringIntoStringAtPosition(bigString, insertString, position)).toBe(output);
	});

	test('End', () => {
		let bigString = 'Haystack';
		let insertString = 'Needle';
		let position = 8;
		let output = 'HaystackNeedle';
		expect(wg.insertStringIntoStringAtPosition(bigString, insertString, position)).toBe(output);
	});
});

describe('aSortsLowerThanB(a, b)', () => {
	test('a, b', () => {
		let a = 'a';
		let b = 'b';
		let output = true;
		expect(wg.aSortsLowerThanB(a, b)).toBe(output);
	});

	test('b, a', () => {
		let a = 'b';
		let b = 'a';
		let output = false;
		expect(wg.aSortsLowerThanB(a, b)).toBe(output);
	});

	test('numbers should sort lower than letters', () => {
		let a = '1';
		let b = 'a';
		let output = true;
		expect(wg.aSortsLowerThanB(a, b)).toBe(output);
	});

	test('lowercase vs uppercase should evaluate the same', () => {
		let a = 'de Havilland, Olivia';
		let b = 'Rao, Amrita';
		let output = true;
		expect(wg.aSortsLowerThanB(a, b)).toBe(output);
	});
});

describe('removeFormattingThatInterferesWithSort(str)', () => {
	test('delete [[ ]]', () => {
		let str = `[[Abyssal plain]]`
		let output = `Abyssal plain`;
		expect(wg.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test('delete entire first part of piped link', () => {
		let str = `[[Abyssal plain|Test]]`
		let output = `Test`;
		expect(wg.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test('delete anything in front of [[', () => {
		let str = `"[[Abyssal plain]]"`
		let output = `Abyssal plain`;
		expect(wg.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`delete "`, () => {
		let str = `[[Abyssal plain|"Test"]]`
		let output = `Test`;
		expect(wg.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`delete ''`, () => {
		let str = `[[Abyssal plain|''Test'']]`
		let output = `Test`;
		expect(wg.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`don't delete single '`, () => {
		let str = `[[Abyssal plain|I can't stop lovin' you]]`
		let output = `I can't stop lovin' you`;
		expect(wg.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`[[David Attenborough|Attenborough, David]]`, () => {
		let str = `[[David Attenborough|Attenborough, David]]`
		let output = `Attenborough, David`;
		expect(wg.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`[[Herbert E. Balch|Balch, Herbert E.]]`, () => {
		let str = `[[Herbert E. Balch|Balch, Herbert E.]]`
		let output = `Balch, Herbert E.`;
		expect(wg.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`[[ABC|{{ABC}}]]`, () => {
		let str = `[[ABC|{{ABC}}]]`
		let output = `{{ABC}}`;
		expect(wg.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`[[&Antelope]]`, () => {
		let str = `[[&Antelope]]`
		let output = `&Antelope`;
		expect(wg.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`[[The New York Times]]`, () => {
		let str = `[[The New York Times]]`
		let output = `New York Times`;
		expect(wg.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`''[[A Book of Mediterranean Food]]''`, () => {
		let str = `''[[A Book of Mediterranean Food]]''`
		let output = `Book of Mediterranean Food`;
		expect(wg.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`''[[an unexpected journey]]''`, () => {
		let str = `''[[an unexpected journey]]''`
		let output = `unexpected journey`;
		expect(wg.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`[[The Compleat Housewife|''The Compleat Housewife'']]`, () => {
		let str = `[[The Compleat Housewife|''The Compleat Housewife'']]`
		let output = `Compleat Housewife`;
		expect(wg.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});
});

describe('firstTemplateGetParameterValue(wikicode, template, parameter)', () => {
	test('param exists', () => {
		let wikicode =
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
		let template = `Article history`;
		let parameter = `topic`;
		let output = 'agriculture';
		expect(wg.firstTemplateGetParameterValue(wikicode, template, parameter)).toBe(output);
	});

	test('param does not exist', () => {
		let wikicode =
`{{Article history
|action1=AFD
|action1date=6 June 2007
|action1link=Wikipedia:Articles for deletion/Cow tipping
|action1result=kept
}}`;
		let template = `Article history`;
		let parameter = `topic`;
		let output = null;
		expect(wg.firstTemplateGetParameterValue(wikicode, template, parameter)).toBe(output);
	});
});

describe('firstTemplateDeleteParameter(wikicode, template, parameter)', () => {
	test('param exists', () => {
		let wikicode =
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
		let template = `Article history`;
		let parameter = `topic`;
		let output =
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
		expect(wg.firstTemplateDeleteParameter(wikicode, template, parameter)).toBe(output);
	});

	test('param does not exist', () => {
		let wikicode =
`{{Article history
|action1=AFD
|action1date=6 June 2007
|action1link=Wikipedia:Articles for deletion/Cow tipping
|action1result=kept
}}`;
		let template = `Article history`;
		let parameter = `topic`;
		let output =
`{{Article history
|action1=AFD
|action1date=6 June 2007
|action1link=Wikipedia:Articles for deletion/Cow tipping
|action1result=kept
}}`;
		expect(wg.firstTemplateDeleteParameter(wikicode, template, parameter)).toBe(output);
	});

	test('edge case', () => {
		let wikicode =
`{{Article history
|action1=FAC
|action1date=14 January 2004
|action1link=Wikipedia:Featured_article_candidates/Archived_nominations/Index/June_2003_to_January_2004#Bacteria
|action1result=failed
|action1oldid=47350127
|currentstatus=FFAC
}}`;
		let template = 'Article history';
		let parameter = 'currentstatus';
		let output =
`{{Article history
|action1=FAC
|action1date=14 January 2004
|action1link=Wikipedia:Featured_article_candidates/Archived_nominations/Index/June_2003_to_January_2004#Bacteria
|action1result=failed
|action1oldid=47350127
}}`;
		expect(wg.firstTemplateDeleteParameter(wikicode, template, parameter)).toBe(output);
	});
});

describe('hasArticleHistoryTemplate(wikicode)', () => {
	test('no match', () => {
		let wikicode = `{{GA}}`;
		let output = false;
		expect(wg.hasArticleHistoryTemplate(wikicode)).toBe(output);
	});

	test('0 capitals, 1 space', () => {
		let wikicode = `{{article history}}`;
		let output = true;
		expect(wg.hasArticleHistoryTemplate(wikicode)).toBe(output);
	});

	test('1 capital, 1 space', () => {
		let wikicode = `{{Article history}}`;
		let output = true;
		expect(wg.hasArticleHistoryTemplate(wikicode)).toBe(output);
	});

	test('2 capitals, 1 space', () => {
		let wikicode = `{{Article History}}`;
		let output = true;
		expect(wg.hasArticleHistoryTemplate(wikicode)).toBe(output);
	});

	test('2 capitals, 0 spaces', () => {
		let wikicode = `{{ArticleHistory}}`;
		let output = true;
		expect(wg.hasArticleHistoryTemplate(wikicode)).toBe(output);
	});

	test('0 capitals, 0 spaces', () => {
		let wikicode = `{{articlehistory}}`;
		let output = true;
		expect(wg.hasArticleHistoryTemplate(wikicode)).toBe(output);
	});
});

describe('addWikicodeAfterTemplates(wikicode, templates, codeToAdd)', () => {
	test('at top (no templates detected)', () => {
		let wikicode =
`{{Old AfD multi|page=Murder of Arthur Labinjo-Hughes|date=5 December 2021|result='''[[WP:SNOW|SNOW]] keep'''}}
{{Annual readership}}
{{WikiProject banner shell|blp=no|collapsed=yes|blpo=yes|1=
{{WikiProject Biography |class=GA |living=No |listas=Labinjo-Hughes, Arthur |needs-photo=yes}}
}}`;
		let templates = ['GA nominee', 'Featured article candidates', 'Peer review', 'Skip to talk', 'Talk header', 'Vital article', 'Ds/talk notice', 'Gs/talk notice', 'BLP others', 'Calm', 'Censor', 'Controversial', 'Not a forum', 'FAQ', 'Round in circles', 'American English', 'British English'];
		let codeToAdd = `{{GA|18:28, 18 June 2022 (UTC)|topic=socsci|page=1}}\n`;
		let output =
`{{GA|18:28, 18 June 2022 (UTC)|topic=socsci|page=1}}
{{Old AfD multi|page=Murder of Arthur Labinjo-Hughes|date=5 December 2021|result='''[[WP:SNOW|SNOW]] keep'''}}
{{Annual readership}}
{{WikiProject banner shell|blp=no|collapsed=yes|blpo=yes|1=
{{WikiProject Biography |class=GA |living=No |listas=Labinjo-Hughes, Arthur |needs-photo=yes}}
}}`;
		expect(wg.addWikicodeAfterTemplates(wikicode, templates, codeToAdd)).toBe(output);
	});

	test('after {{Talk header}}', () => {
		let wikicode =
`{{Talk header}}
{{Old AfD multi|page=Murder of Arthur Labinjo-Hughes|date=5 December 2021|result='''[[WP:SNOW|SNOW]] keep'''}}
{{Annual readership}}
{{WikiProject banner shell|blp=no|collapsed=yes|blpo=yes|1=
{{WikiProject Biography |class=GA |living=No |listas=Labinjo-Hughes, Arthur |needs-photo=yes}}
}}`;
		let templates = ['GA nominee', 'Featured article candidates', 'Peer review', 'Skip to talk', 'Talk header', 'Vital article', 'Ds/talk notice', 'Gs/talk notice', 'BLP others', 'Calm', 'Censor', 'Controversial', 'Not a forum', 'FAQ', 'Round in circles', 'American English', 'British English'];
		let codeToAdd = `{{GA|18:28, 18 June 2022 (UTC)|topic=socsci|page=1}}\n`;
		let output =
`{{Talk header}}
{{GA|18:28, 18 June 2022 (UTC)|topic=socsci|page=1}}
{{Old AfD multi|page=Murder of Arthur Labinjo-Hughes|date=5 December 2021|result='''[[WP:SNOW|SNOW]] keep'''}}
{{Annual readership}}
{{WikiProject banner shell|blp=no|collapsed=yes|blpo=yes|1=
{{WikiProject Biography |class=GA |living=No |listas=Labinjo-Hughes, Arthur |needs-photo=yes}}
}}`;
		expect(wg.addWikicodeAfterTemplates(wikicode, templates, codeToAdd)).toBe(output);
	});

	test('case insensitive template names', () => {
		let wikicode =
`{{Talk Header}}
`;
		let templates = ['GA nominee', 'Featured article candidates', 'Peer review', 'Skip to talk', 'Talk header', 'Vital article', 'Ds/talk notice', 'Gs/talk notice', 'BLP others', 'Calm', 'Censor', 'Controversial', 'Not a forum', 'FAQ', 'Round in circles', 'American English', 'British English'];
		let codeToAdd = `{{GA|18:28, 18 June 2022 (UTC)|topic=socsci|page=1}}\n`;
		let output =
`{{Talk Header}}
{{GA|18:28, 18 June 2022 (UTC)|topic=socsci|page=1}}
`;
		expect(wg.addWikicodeAfterTemplates(wikicode, templates, codeToAdd)).toBe(output);
	});
});

describe('getEndOfStringPositionOfLastMatch(haystack, regex)', () => {
	test('No match', () => {
		let haystack = `AAA BBB`;
		let regex = new RegExp('ghi', 'ig');
		let output = 0;
		expect(wg.getEndOfStringPositionOfLastMatch(haystack, regex)).toBe(output);
	});

	test('1 match', () => {
		let haystack = `Abc def`;
		let regex = new RegExp('Abc', 'ig');
		let output = 3;
		expect(wg.getEndOfStringPositionOfLastMatch(haystack, regex)).toBe(output);
	});

	test('2 matches', () => {
		let haystack = `Abc Abc def`;
		let regex = new RegExp('Abc', 'ig');
		let output = 7;
		expect(wg.getEndOfStringPositionOfLastMatch(haystack, regex)).toBe(output);
	});

	test('Case insensitive', () => {
		let haystack = `Abc Abc def`;
		let regex = new RegExp('abc', 'ig');
		let output = 7;
		expect(wg.getEndOfStringPositionOfLastMatch(haystack, regex)).toBe(output);
	});
});