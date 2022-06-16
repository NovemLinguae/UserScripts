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

	test('no underscores for multi-word titles', () => {
		let title = `2021_French_Grand_Prix`;
		let output = '2021 French Grand Prix';
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
		expect(functions.updateArticleHistory(talkWikicode, topic, nominationPageTitle, listedOrFailed)).toBe(output);
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
		expect(functions.updateArticleHistory(talkWikicode, topic, nominationPageTitle, listedOrFailed)).toBe(output);
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

|topic = Physics and astronomy

|action12 = GAN
|action12date = ~~~~~
|action12link = Talk:SpaceX Starship/GA2
|action12result = failed
|currentstatus = DGA
}}
`;
		expect(functions.updateArticleHistory(talkWikicode, topic, nominationPageTitle, listedOrFailed)).toBe(output);
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
		expect(functions.firstTemplateInsertCode(wikicode, templateNameRegExNoDelimiters, codeToInsert)).toBe(output);
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
		expect(functions.firstTemplateInsertCode(wikicode, templateNameRegExNoDelimiters, codeToInsert)).toBe(output);
	});
});

describe('getGASubpageHeadingPosition(shortenedVersionInComboBox, wikicode)', () => {
	test('Exact match', () => {
		let wikicode = `=====Bodies of water and water formations=====`;
		let shortenedVersionInComboBox = `=====Bodies of water and water formations=====`;
		let output = 0;
		expect(functions.getGASubpageHeadingPosition(shortenedVersionInComboBox, wikicode)).toBe(output);
	});

	test('No match', () => {
		let wikicode = `blah blah blah`;
		let shortenedVersionInComboBox = `=====Bodies of water and water formations=====`;
		let output = -1;
		expect(functions.getGASubpageHeadingPosition(shortenedVersionInComboBox, wikicode)).toBe(output);
	});

	test('Input no space in front of ===, wikicode yes space in front of ===', () => {
		let wikicode = `===== Landforms =====`;
		let shortenedVersionInComboBox = `=====Landforms=====`;
		let output = 0;
		expect(functions.getGASubpageHeadingPosition(shortenedVersionInComboBox, wikicode)).toBe(output);
	});

	test('Wikicode has [[File:', () => {
		let wikicode = `===[[File:Gnome-globe.svg|22px|left|alt=|link=]] Geography===`;
		let shortenedVersionInComboBox = `===Geography===`;
		let output = 0;
		expect(functions.getGASubpageHeadingPosition(shortenedVersionInComboBox, wikicode)).toBe(output);
	});
});

describe('findFirstStringAfterPosition(needle, haystack, position)', () => {
	test('No match', () => {
		let needle = `Needle`;
		let haystack = `Haystack`;
		let position = 3;
		let output = -1;
		expect(functions.findFirstStringAfterPosition(needle, haystack, position)).toBe(output);
	});

	test('Start at 0. Match immediately.', () => {
		let needle = `Hay`;
		let haystack = `Haystack`;
		let position = 0;
		let output = 0;
		expect(functions.findFirstStringAfterPosition(needle, haystack, position)).toBe(output);
	});

	test('Start at 3. Match immediately.', () => {
		let needle = `stack`;
		let haystack = `Haystack`;
		let position = 3;
		let output = 3;
		expect(functions.findFirstStringAfterPosition(needle, haystack, position)).toBe(output);
	});

	test('Start at 3. Match later.', () => {
		let needle = `ack`;
		let haystack = `Haystack`;
		let position = 0;
		let output = 5;
		expect(functions.findFirstStringAfterPosition(needle, haystack, position)).toBe(output);
	});
});

describe('insertStringIntoStringAtPosition(bigString, insertString, position)', () => {
	test('Middle', () => {
		let bigString = 'Haystack';
		let insertString = 'Needle';
		let position = 3;
		let output = 'HayNeedlestack';
		expect(functions.insertStringIntoStringAtPosition(bigString, insertString, position)).toBe(output);
	});

	test('Start', () => {
		let bigString = 'Haystack';
		let insertString = 'Needle';
		let position = 0;
		let output = 'NeedleHaystack';
		expect(functions.insertStringIntoStringAtPosition(bigString, insertString, position)).toBe(output);
	});

	test('End', () => {
		let bigString = 'Haystack';
		let insertString = 'Needle';
		let position = 8;
		let output = 'HaystackNeedle';
		expect(functions.insertStringIntoStringAtPosition(bigString, insertString, position)).toBe(output);
	});
});

describe('aSortsLowerAlphabeticallyThanB(a, b)', () => {
	test('a, b', () => {
		let a = 'a';
		let b = 'b';
		let output = true;
		expect(functions.aSortsLowerAlphabeticallyThanB(a, b)).toBe(output);
	});

	test('b, a', () => {
		let a = 'b';
		let b = 'a';
		let output = false;
		expect(functions.aSortsLowerAlphabeticallyThanB(a, b)).toBe(output);
	});

	test('numbers should sort lower than letters', () => {
		let a = '1';
		let b = 'a';
		let output = true;
		expect(functions.aSortsLowerAlphabeticallyThanB(a, b)).toBe(output);
	});
});

describe('removeFormattingThatInterferesWithSort(str)', () => {
	test('delete [[ ]]', () => {
		let str = `[[Abyssal plain]]`
		let output = `Abyssal plain`;
		expect(functions.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test('delete entire first part of piped link', () => {
		let str = `[[Abyssal plain|Test]]`
		let output = `Test`;
		expect(functions.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test('delete anything in front of [[', () => {
		let str = `"[[Abyssal plain]]"`
		let output = `Abyssal plain`;
		expect(functions.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`delete "`, () => {
		let str = `[[Abyssal plain|"Test"]]`
		let output = `Test`;
		expect(functions.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`delete ''`, () => {
		let str = `[[Abyssal plain|''Test'']]`
		let output = `Test`;
		expect(functions.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`don't delete single '`, () => {
		let str = `[[Abyssal plain|I can't stop lovin' you]]`
		let output = `I can't stop lovin' you`;
		expect(functions.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`[[David Attenborough|Attenborough, David]]`, () => {
		let str = `[[David Attenborough|Attenborough, David]]`
		let output = `Attenborough, David`;
		expect(functions.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`[[Herbert E. Balch|Balch, Herbert E.]]`, () => {
		let str = `[[Herbert E. Balch|Balch, Herbert E.]]`
		let output = `Balch, Herbert E.`;
		expect(functions.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`[[ABC|{{ABC}}]]`, () => {
		let str = `[[ABC|{{ABC}}]]`
		let output = `{{ABC}}`;
		expect(functions.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`[[&Antelope]]`, () => {
		let str = `[[&Antelope]]`
		let output = `&Antelope`;
		expect(functions.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`[[The New York Times]]`, () => {
		let str = `[[The New York Times]]`
		let output = `New York Times`;
		expect(functions.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`''[[A Book of Mediterranean Food]]''`, () => {
		let str = `''[[A Book of Mediterranean Food]]''`
		let output = `Book of Mediterranean Food`;
		expect(functions.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`''[[an unexpected journey]]''`, () => {
		let str = `''[[an unexpected journey]]''`
		let output = `unexpected journey`;
		expect(functions.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});

	test(`[[The Compleat Housewife|''The Compleat Housewife'']]`, () => {
		let str = `[[The Compleat Housewife|''The Compleat Housewife'']]`
		let output = `Compleat Housewife`;
		expect(functions.removeFormattingThatInterferesWithSort(str)).toBe(output);
	});
});

describe('addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)', () => {
	test('[[Nile River]]', () => {
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
		expect(functions.addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('[[David Attenborough|Attenborough, David]]', () => {
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
		expect(functions.addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Extra spaces in heading near equals signs', () => {
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
		expect(functions.addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('First in section', () => {
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
		expect(functions.addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Last in section', () => {
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
		expect(functions.addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Numbers before letters', () => {
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
		expect(functions.addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Display title', () => {
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
		expect(functions.addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Italics should be ignored when sorting the haystack', () => {
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
		expect(functions.addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Italics should be ignored when sorting the needle', () => {
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
[[Building|''Building'']]
}}
`;
		expect(functions.addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('{{Further}}', () => {
		let gaSubpageHeading = `=====Landforms=====`;
		let gaTitle = `ABC`;
		let gaDisplayTitle = `{{ABC}}`;
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
[[Alepotrypa Cave|''Aleoptrypa Cave'']]
[[Alepotrypa Cave|'Hello]]
[[Ampato]]
[[Andagua volcanic field]]
[[Antofalla]]
[[ABC|{{ABC}}]]
}}
`;
		expect(functions.addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('Italics should be ignored when sorting the needle', () => {
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
[[Building|''Building'']]
}}
`;
		expect(functions.addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('ignore articles (a, an, the) in haystack', () => {
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
[[Food in the United States|''Food in the United States'']]
''[[The Good Huswifes Jewell]]'' 
''[[The Modern Cook]]''
''[[Modern Cookery for Private Families]]'' 
''[[Mrs. Beeton's Book of Household Management]]'' 
''[[A New System of Domestic Cookery]]''
''[[The Accomplisht Cook]]''
}}
`;
		expect(functions.addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
	});

	test('ignore articles (a, an, the) in needle', () => {
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
[[The Compleat Housewife|''The Compleat Housewife'']]
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
		expect(functions.addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle)).toBe(output);
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
		expect(functions.firstTemplateGetParameterValue(wikicode, template, parameter)).toBe(output);
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
		expect(functions.firstTemplateGetParameterValue(wikicode, template, parameter)).toBe(output);
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
		expect(functions.firstTemplateDeleteParameter(wikicode, template, parameter)).toBe(output);
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
		expect(functions.firstTemplateDeleteParameter(wikicode, template, parameter)).toBe(output);
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
		expect(functions.firstTemplateDeleteParameter(wikicode, template, parameter)).toBe(output);
	});
});

describe('hasArticleHistoryTemplate(wikicode)', () => {
	test('no match', () => {
		let wikicode = `{{GA}}`;
		let output = false;
		expect(functions.hasArticleHistoryTemplate(wikicode)).toBe(output);
	});

	test('0 capitals, 1 space', () => {
		let wikicode = `{{article history}}`;
		let output = true;
		expect(functions.hasArticleHistoryTemplate(wikicode)).toBe(output);
	});

	test('1 capital, 1 space', () => {
		let wikicode = `{{Article history}}`;
		let output = true;
		expect(functions.hasArticleHistoryTemplate(wikicode)).toBe(output);
	});

	test('2 capitals, 1 space', () => {
		let wikicode = `{{Article History}}`;
		let output = true;
		expect(functions.hasArticleHistoryTemplate(wikicode)).toBe(output);
	});

	test('2 capitals, 0 spaces', () => {
		let wikicode = `{{ArticleHistory}}`;
		let output = true;
		expect(functions.hasArticleHistoryTemplate(wikicode)).toBe(output);
	});

	test('0 capitals, 0 spaces', () => {
		let wikicode = `{{articlehistory}}`;
		let output = true;
		expect(functions.hasArticleHistoryTemplate(wikicode)).toBe(output);
	});
});