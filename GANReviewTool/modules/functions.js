// Pure functions

export function isGASubPage(title) {
	return Boolean(title.match(/\/GA\d{1,2}$/));
}

export function getGATitle(title) {
	title = title.replace('Talk:', '');
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

export function addToGASubpage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle) {
	// find heading
	let headingStartPosition = getGASubpageHeadingPosition(gaSubpageHeading, gaSubpageWikicode);
	// now move down a bit, to the first line with an item. skip {{Further}}, {{#invoke:Good Articles|subsection|, etc.
	headingStartPosition = findFirstStringAfterPosition('[[', gaSubpageWikicode, headingStartPosition);
	let headingEndPosition = findFirstStringAfterPosition('}}', gaSubpageWikicode, headingStartPosition);
	let wikicodeToInsert;
	if ( gaDisplayTitle === gaTitle ) {
		wikicodeToInsert = `[[${gaTitle}]]\n`;
	} else {
		wikicodeToInsert = `[[${gaTitle}|${gaDisplayTitle}]]\n`;
	}
	let insertPosition;
	let startOfLine = headingStartPosition;
	while ( startOfLine < headingEndPosition ) {
		let endOfLine = findFirstStringAfterPosition('\n', gaSubpageWikicode, startOfLine);
		let line = gaSubpageWikicode.slice(startOfLine, endOfLine);
		let lineWithSomeFormattingRemoved = removeFormattingThatInterferesWithSort(line);
		let displayTitleWithSomeFormattingRemoved = removeFormattingThatInterferesWithSort(gaDisplayTitle);
		if ( ! aSortsLowerAlphabeticallyThanB(lineWithSomeFormattingRemoved, displayTitleWithSomeFormattingRemoved) ) {
			insertPosition = startOfLine;
			break;
		}
		startOfLine = endOfLine + 1;
	}
	if ( ! insertPosition ) {
		insertPosition = headingEndPosition;
	}
	return insertStringIntoStringAtPosition(gaSubpageWikicode, wikicodeToInsert, insertPosition);
}

export function removeFormattingThatInterferesWithSort(str) {
	return str.replace(/^[^\[]*\[\[(?:[^\|]+\|)?/, '') // delete anything in front of [[, [[, and anything inside the left half of a piped wikilink
		.replace(/\]\][^\]]*$/, '') // delete ]], and anything after ]]
		.replace(/"/g, '') // delete "
		.replace(/''/g, '') // delete '' but not '
		.replace(/^A /gi, '') // delete indefinite article "a"
		.replace(/^An /gi, '') // delete indefinite article "an"
		.replace(/^The /gi, '') // delete definite article "the"
}

export function aSortsLowerAlphabeticallyThanB(a, b) {
	// JavaScript appears to use an ASCII sort. See https://en.wikipedia.org/wiki/ASCII#Printable_characters
	let arr1 = [a, b];
	let arr2 = [a, b];
	return JSON.stringify(arr1.sort()) === JSON.stringify(arr2);
}

export function getGASubpageHeadingPosition(shortenedVersionInComboBox, wikicode) {
	// chop off equals at beginning and end of line. we want to isolate a smaller piece to use as our needle.
	let needle = /^={2,5}\s*(.*?)\s*={2,5}$/gm.exec(shortenedVersionInComboBox)[1];
	// then insert this needle into a wide regex that includes equals, optional spaces next to the equals, and optional [[File:]]
	let regex = new RegExp(`^={2,5}\\s*(?:\\[\\[File:[^\\]]*\\]\\]\\s*)?${regExEscape(needle)}\\s*={2,5}$`, 'gm');
	let result = regex.exec(wikicode);
	// if needle not found in haystack, return -1
	if ( ! Array.isArray(result) ) return -1;
	// else return location of first match
	return result.index;
}

export function findFirstStringAfterPosition(needle, haystack, position) {
	let len = haystack.length;
	for ( let i = position; i < len; i++ ) {
		let buffer = haystack.slice(i, len);
		if ( buffer.startsWith(needle) ) {
			return i;
		}
	}
	return -1;
}

// https://stackoverflow.com/a/4364902/3480193
// CC BY-SA 4.0
export function insertStringIntoStringAtPosition(bigString, insertString, position) {
	return [bigString.slice(0, position), insertString, bigString.slice(position)].join('');
}