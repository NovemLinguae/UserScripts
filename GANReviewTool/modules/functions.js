// Pure functions

export function isGASubPage(title) {
	return Boolean(title.match(/\/GA\d{1,2}$/));
}

export function getGATitle(title) {
	title = title.replace('Talk:', '');
	//title = title.replace('User:', '');
	title = title.replace('_', ' ');
	title = title.match(/^[^\/]*/)[0];
	return title;
}

export function getGATalkTitle(gaTitle) {
	if ( gaTitle.includes(':') ) {
		return gaTitle.replace(/^([^:]*)(:.*)$/gm, '$1 talk$2');
	} else {
		return 'Talk:' + gaTitle;
	}
}

// https://stackoverflow.com/a/6234804/3480193
// CC BY-SA 4.0
export function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

export function placeATOP(wikicode, result, color) {
	let colorCode = '';
	switch ( color ) {
		case 'green':
			colorCode = 'g';
			break;
		case 'red':
			colorCode = 'r';
			break;
	}

	// place top piece after first H2, if it exists
	let prependText =
`{{atop${colorCode}
| status = 
| result = ${result}
}}`;
	let hasH2 = wikicode.match(/^==[^=]+==$/m);
	if ( hasH2 ) {
		wikicode = wikicode.replace(/^(.*?==[^=]+==\n)(.*)$/s, '$1' + prependText + '\n$2');
	} else {
		wikicode = prependText + "\n" + wikicode;
	}

	// place bottom piece at end
	let appendText = `{{abot}}`;
	wikicode += "\n" + appendText;

	return wikicode;
}

export function getTopicFromGANomineeTemplate(talkWikicode) {
	let topic = getTemplateParameter(talkWikicode, 'GA nominee', 'topic');
	if ( ! topic ) {
		topic = getTemplateParameter(talkWikicode, 'GA nominee', 'subtopic');
	}
	return topic;
}

export function getTemplateParameter(wikicode, templateName, parameterName) {
	templateName = regExEscape(templateName);
	parameterName = regExEscape(parameterName);
	let regex = new RegExp(`\\{\\{${templateName}[^\\}]+\\|${parameterName}\\s*=\\s*([^\\}\\|]+)\\s*[^\\}]*\\}\\}`, 'i');
	let parameterValue = wikicode.match(regex)
	if ( Array.isArray(parameterValue) && parameterValue[1] !== undefined ) {
		return parameterValue[1].trim();
	} else {
		return null;
	}
}

// https://stackoverflow.com/a/6969486/3480193
// CC BY-SA 4.0
export function regExEscape(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function deleteGANomineeTemplate(talkWikicode) {
	return talkWikicode.replace(/\{\{GA nominee[^\}]+\}\}\n?/i, '');
}

export function addGATemplate(talkWikicode, topic, gaPageNumber) {
	let prependString = `{{GA|~~~~~|topic=${topic}|page=${gaPageNumber}}}`;
	return prependString + '\n' + talkWikicode;
}

export function changeWikiProjectArticleClassToGA(talkWikicode) {
	return talkWikicode.replace(/(\{\{WikiProject [^\}]*\|\s*class\s*=\s*)([^\}\|\s]*)/gi, '$1GA');
}

/** Determine next |action= number in {{Article history}} template. This is so we can insert an action. */
export function determineNextActionNumber(talkWikicode) {
	let ARTICLE_HISTORY_MAX_ACTIONS = 50;
	for ( let i = ARTICLE_HISTORY_MAX_ACTIONS; i >= 1; i-- ) {
		let regex = new RegExp(`\\|\\s*action${i}\\s*=`, 'i');
		let hasAction = talkWikicode.match(regex);
		if ( hasAction ) {
			return i + 1;
		}
	}
}

export function updateArticleHistory(talkWikicode, nextActionNumber, topic, nominationPageTitle) {
	let addToArticleHistory = 
`|action${nextActionNumber} = GAN
|action${nextActionNumber}date = ~~~~~
|action${nextActionNumber}link = ${nominationPageTitle}
|action${nextActionNumber}result = listed
|currentstatus = GA
|topic = ${topic}`;
	talkWikicode = insertCodeAtEndOfFirstTemplate(talkWikicode, 'Article ?history', addToArticleHistory);
	return talkWikicode;
}

export function insertCodeAtEndOfFirstTemplate(wikicode, templateNameRegExNoDelimiters, codeToInsert) {
	// TODO: handle nested templates
	let regex = new RegExp(`(\\{\\{${templateNameRegExNoDelimiters}[^\\}]*)(\\}\\})`, '');
	return wikicode.replace(regex, `$1\n${codeToInsert}\n$2`);
}

export function addFailedGATemplate(talkWikicode, topic, gaPageNumber) {
	let prependString = `{{FailedGA|~~~~~|topic=${topic}|page=${gaPageNumber}}}`;
	return prependString + '\n' + talkWikicode;
}