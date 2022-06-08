import * as functions from "../modules/functions.js";

// Babel is required to use ES6 module syntax
// Copy package.json and .babelrc from a project that already has this working
// Babel tutorial: https://www.sitepoint.com/babel-beginners-guide/

describe('isGASubPage(title)', () => {
	test('capitalized, single digit', () => {
		let title = `Talk:Sora Amamiya/GA2`;
		let output = true;
		expect(functions.isGASubPage(title)).toBe(output);
	});

	test('capitalized, double digits', () => {
		let title = `Talk:Sora Amamiya/GA21`;
		let output = true;
		expect(functions.isGASubPage(title)).toBe(output);
	});

	test('subpage of GA page', () => {
		let title = `Talk:Sora Amamiya/GA2/test`;
		let output = false;
		expect(functions.isGASubPage(title)).toBe(output);
	});

	test('talk page', () => {
		let title = `Talk:Sora Amamiya`;
		let output = false;
		expect(functions.isGASubPage(title)).toBe(output);
	});

	test('main article', () => {
		let title = `Sora Amamiya`;
		let output = false;
		expect(functions.isGASubPage(title)).toBe(output);
	});

	test('lowercase', () => {
		let title = `Talk:Sora Amamiya/ga2`;
		let output = false;
		expect(functions.isGASubPage(title)).toBe(output);
	});
});

describe('getGATitle(title)', () => {
	test('talk and subpage', () => {
		let title = `Talk:Sora_Amamiya/GA2`;
		let output = 'Sora Amamiya';
		expect(functions.getGATitle(title)).toBe(output);
	});

	test('talk page', () => {
		let title = `Talk:Sora_Amamiya`;
		let output = 'Sora Amamiya';
		expect(functions.getGATitle(title)).toBe(output);
	});

	test('user page', () => {
		let title = `User:Novem_Linguae/sandbox`;
		let output = 'User:Novem Linguae';
		expect(functions.getGATitle(title)).toBe(output);
	});

	test('article itself', () => {
		let title = `Sora_Amamiya`;
		let output = 'Sora Amamiya';
		expect(functions.getGATitle(title)).toBe(output);
	});

	test('no underscores', () => {
		let title = `Sora_Amamiya`;
		let output = 'Sora Amamiya';
		expect(functions.getGATitle(title)).toBe(output);
	});
});

describe('escapeHtml(unsafe)', () => {
	test('Test', () => {
		let unsafe = `Test`;
		let output = 'Test';
		expect(functions.escapeHtml(unsafe)).toBe(output);
	});

	test(`"&<>`, () => {
		let unsafe = `"&<>`;
		let output = '&quot;&amp;&lt;&gt;';
		expect(functions.escapeHtml(unsafe)).toBe(output);
	});
});

describe('getGATalkTitle(gaTitle)', () => {
	test('mainspace', () => {
		let gaTitle = `Sora Amamiya`;
		let output = 'Talk:Sora Amamiya';
		expect(functions.getGATalkTitle(gaTitle)).toBe(output);
	});

	test('userspace', () => {
		let gaTitle = `User:Novem Linguae`;
		let output = 'User talk:Novem Linguae';
		expect(functions.getGATalkTitle(gaTitle)).toBe(output);
	});

	test('two colons', () => {
		let gaTitle = `User:Novem Linguae:test`;
		let output = 'User talk:Novem Linguae:test';
		expect(functions.getGATalkTitle(gaTitle)).toBe(output);
	});
});

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
`

== Test ==
{{atopg
| status = 
| result = Passed
}}


== Test ==

test

blah
{{abot}}`;
		expect(functions.placeATOP(wikicode, result, color)).toBe(output);
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
{{abot}}`;
		expect(functions.placeATOP(wikicode, result, color)).toBe(output);
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
{{abot}}`;
		expect(functions.placeATOP(wikicode, result, color)).toBe(output);
	});
});

describe('getTopicFromGANomineeTemplate(talkWikicode)', () => {
	test('topic', () => {
		let talkWikicode = `{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}`;
		let output = 'Media and drama';
		expect(functions.getTopicFromGANomineeTemplate(talkWikicode)).toBe(output);
	});

	test('subtopic', () => {
		let talkWikicode = `{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|subtopic=Media and drama| status=onhold|note=}}`;
		let output = 'Media and drama';
		expect(functions.getTopicFromGANomineeTemplate(talkWikicode)).toBe(output);
	});

	test('whitespace', () => {
		let talkWikicode = `{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|subtopic= Media and drama | status=onhold|note=}}`;
		let output = 'Media and drama';
		expect(functions.getTopicFromGANomineeTemplate(talkWikicode)).toBe(output);
	});

	test('lowercase', () => {
		let talkWikicode = `{{ga nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}`;
		let output = 'Media and drama';
		expect(functions.getTopicFromGANomineeTemplate(talkWikicode)).toBe(output);
	});
});

describe('deleteGANomineeTemplate(talkWikicode)', () => {
	test('normal', () => {
		let talkWikicode = `{{Test}}{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}{{Test2}}`;
		let output = '{{Test}}{{Test2}}';
		expect(functions.deleteGANomineeTemplate(talkWikicode)).toBe(output);
	});

	test('lowercase', () => {
		let talkWikicode = `{{Test}}{{ga nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}{{Test2}}`;
		let output = '{{Test}}{{Test2}}';
		expect(functions.deleteGANomineeTemplate(talkWikicode)).toBe(output);
	});

	test('delete a line break too', () => {
		let talkWikicode =
`{{Test}}
{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}
{{Test2}}`;
		let output =
`{{Test}}
{{Test2}}`;
		expect(functions.deleteGANomineeTemplate(talkWikicode)).toBe(output);
	});
});

describe('getTemplateParameter(wikicode, templateName, parameterName)', () => {
	test('found', () => {
		let wikicode = `{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}`;
		let templateName = 'GA nominee';
		let parameterName = 'topic';
		let output = 'Media and drama';
		expect(functions.getTemplateParameter(wikicode, templateName, parameterName)).toBe(output);
	});

	test('template name case difference', () => {
		let wikicode = `{{ga nomINee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|topic=Media and drama|status=onhold|note=}}`;
		let templateName = 'GA nominee';
		let parameterName = 'topic';
		let output = 'Media and drama';
		expect(functions.getTemplateParameter(wikicode, templateName, parameterName)).toBe(output);
	});

	test('parameter name case difference', () => {
		let wikicode = `{{GA nominee|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|toPIc=Media and drama|status=onhold|note=}}`;
		let templateName = 'GA nominee';
		let parameterName = 'topic';
		let output = 'Media and drama';
		expect(functions.getTemplateParameter(wikicode, templateName, parameterName)).toBe(output);
	});

	test('not found', () => {
		let wikicode = `{{blah|11:39, 17 January 2022 (UTC)|nominator=[[User:Narutolovehinata5|<B><span style="color:#0038A8">Naruto</span><span style="color:#FCD116">love</span><span style="color:#CE1126">hinata</span>5</B>]] ([[User talk:Narutolovehinata5|talk]] · [[Special:Contributions/Narutolovehinata5|contributions]])|page=2|toPIc=Media and drama|status=onhold|note=}}`;
		let templateName = 'GA nominee';
		let parameterName = 'topic';
		let output = null;
		expect(functions.getTemplateParameter(wikicode, templateName, parameterName)).toBe(output);
	});
});

describe('regExEscape(string)', () => {
	test('Nothing to escape', () => {
		let string = `Test Test`;
		let output = 'Test Test';
		expect(functions.regExEscape(string)).toBe(output);
	});

	test('Escape {', () => {
		let string = `Test{Test`;
		let output = 'Test\\{Test';
		expect(functions.regExEscape(string)).toBe(output);
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
		expect(functions.addGATemplate(talkWikicode, topic, gaPageNumber)).toBe(output);
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
		expect(functions.addFailedGATemplate(talkWikicode, topic, gaPageNumber)).toBe(output);
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
		expect(functions.changeWikiProjectArticleClassToGA(talkWikicode)).toBe(output);
	});

	test(`don't change |class in non-WikiProject templates`, () => {
		let talkWikicode =
`{{WikiProject Anime and manga|class=Start|biography=yes|importance=low|listas=Amamiya, Sora}}
{{Random template|class=DontChangeMe}}`;
		let output =
`{{WikiProject Anime and manga|class=GA|biography=yes|importance=low|listas=Amamiya, Sora}}
{{Random template|class=DontChangeMe}}`;
		expect(functions.changeWikiProjectArticleClassToGA(talkWikicode)).toBe(output);
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
		expect(functions.determineNextActionNumber(talkWikicode)).toBe(output);
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
		expect(functions.determineNextActionNumber(talkWikicode)).toBe(output);
	});
});

describe('updateArticleHistory(talkWikicode, nextActionNumber, topic, nominationPageTitle)', () => {
	test('{{Article history}}', () => {
		let talkWikicode =
`{{Article history
|action1=FAC
|action1date=14 January 2004
|action1link=Wikipedia:Featured_article_candidates/Archived_nominations/Index/June_2003_to_January_2004#Bacteria
|action1result=failed
|action1oldid=47350127
}}`;
		let nextActionNumber = 2;
		let topic = 'Natural Sciences';
		let nominationPageTitle = 'Talk:Agriculture/GA2';
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
		expect(functions.updateArticleHistory(talkWikicode, nextActionNumber, topic, nominationPageTitle)).toBe(output);
	});
});

describe('insertCodeAtEndOfFirstTemplate(wikicode, templateNameRegExNoDelimiters, codeToInsert)', () => {
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
		expect(functions.insertCodeAtEndOfFirstTemplate(wikicode, templateNameRegExNoDelimiters, codeToInsert)).toBe(output);
	});
});