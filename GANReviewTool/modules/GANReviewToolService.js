export class GANReviewToolService {
	getPassWikicodeForGANPage(reviewWikicode) {
		return this.placeATOP(reviewWikicode, 'Passed ~~~~', 'green')
	}

	getPassWikicodeForTalkPage(talkWikicode, reviewTitle) {
		// Deleting {{GA nominee}} from article talk page.
		let topic = this.getTopicFromGANomineeTemplate(talkWikicode);
		let gaPageNumber = this.getTemplateParameter(talkWikicode, 'GA nominee', 'page');
		talkWikicode = this.deleteGANomineeTemplate(talkWikicode);

		// Adding {{GA}} or {{Article history}} to article talk page.
		// TODO: get top revision ID of main article, pass it into below functions, have it add the revision ID
		let boolHasArticleHistoryTemplate = this.hasArticleHistoryTemplate(talkWikicode);
		if ( boolHasArticleHistoryTemplate ) {
			talkWikicode = this.updateArticleHistory(talkWikicode, topic, reviewTitle, 'listed');
		} else {
			talkWikicode = this.addGATemplate(talkWikicode, topic, gaPageNumber);
		}

		// Changing WikiProject template class parameters to GA on article talk page.
		talkWikicode = this.changeWikiProjectArticleClassToGA(talkWikicode);

		return talkWikicode;
	}

	getPassWikicodeForGAListPage(gaSubpageHeading, gaSubpageWikicode, gaTitle, gaDisplayTitle) {
		// find heading
		let headingStartPosition = this.getGASubpageHeadingPosition(gaSubpageHeading, gaSubpageWikicode);
		// now move down a bit, to the first line with an item. skip {{Further}}, {{#invoke:Good Articles|subsection|, etc.
		headingStartPosition = this.findFirstStringAfterPosition('[[', gaSubpageWikicode, headingStartPosition);
		let headingEndPosition = this.findFirstStringAfterPosition('}}', gaSubpageWikicode, headingStartPosition);
		let wikicodeToInsert;
		gaDisplayTitle = gaDisplayTitle.trim();
		if ( gaDisplayTitle === gaTitle ) {
			wikicodeToInsert = `[[${gaTitle}]]\n`;
		} else {
			wikicodeToInsert = `[[${gaTitle}|${gaDisplayTitle}]]\n`;
		}
		let insertPosition;
		let startOfLine = headingStartPosition;
		while ( startOfLine < headingEndPosition ) {
			let endOfLine = this.findFirstStringAfterPosition('\n', gaSubpageWikicode, startOfLine);
			let line = gaSubpageWikicode.slice(startOfLine, endOfLine);
			let lineWithSomeFormattingRemoved = this.removeFormattingThatInterferesWithSort(line);
			let displayTitleWithSomeFormattingRemoved = this.removeFormattingThatInterferesWithSort(gaDisplayTitle);
			if ( ! this.aSortsLowerAlphabeticallyThanB(lineWithSomeFormattingRemoved, displayTitleWithSomeFormattingRemoved) ) {
				insertPosition = startOfLine;
				break;
			}
			startOfLine = endOfLine + 1;
		}
		if ( ! insertPosition ) {
			insertPosition = headingEndPosition;
		}
		return this.insertStringIntoStringAtPosition(gaSubpageWikicode, wikicodeToInsert, insertPosition);
	}

	getFailWikicodeForGANPage(reviewWikicode) {
		return this.placeATOP(reviewWikicode, 'Unsuccessful ~~~~', 'red');
	}

	getFailWikicodeForTalkPage(talkWikicode, reviewTitle) {
		// Deleting {{GA nominee}} from article talk page.
		let topic = this.getTopicFromGANomineeTemplate(talkWikicode);
		let gaPageNumber = this.getTemplateParameter(talkWikicode, 'GA nominee', 'page');
		talkWikicode = this.deleteGANomineeTemplate(talkWikicode);

		// Adding {{FailedGA}} or {{Article history}} to article talk page.
		// TODO: get top revision ID of main article, pass it into below functions, have it add the revision ID
		let boolHasArticleHistoryTemplate = this.hasArticleHistoryTemplate(talkWikicode);
		if ( boolHasArticleHistoryTemplate ) {
			talkWikicode = this.updateArticleHistory(talkWikicode, topic, reviewTitle, 'failed');
		} else {
			talkWikicode = this.addFailedGATemplate(talkWikicode, topic, gaPageNumber);
		}

		return talkWikicode;
	}

	getLogMessage(username, passOrFail, reviewTitle, reviewRevisionID, talkRevisionID, gaRevisionID, error) {
		let textToAppend = `\n* `;
		if ( error ) {
			textToAppend += `<span style="color: red; font-weight: bold;">ERROR:</span> ${error}. `
		}
		textToAppend += `[[User:${username}|${username}]] ${passOrFail}ed [[${reviewTitle}]] at ~~~~~. [[Special:Diff/${reviewRevisionID}|[1]]][[Special:Diff/${talkRevisionID}|[2]]]`;
		if ( gaRevisionID ) {
			textToAppend += `[[Special:Diff/${gaRevisionID}|[3]]]`;
		}
		return textToAppend;
	}

	/**
	  * @private
	  */
	placeATOP(wikicode, result, color) {
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
		wikicode = wikicode.trim();
		wikicode += `\n${appendText}\n`;

		return wikicode;
	}

	/**
	  * @private
	  */
	getTopicFromGANomineeTemplate(talkWikicode) {
		let topic = this.getTemplateParameter(talkWikicode, 'GA nominee', 'topic');
		if ( ! topic ) {
			topic = this.getTemplateParameter(talkWikicode, 'GA nominee', 'subtopic');
		}
		return topic;
	}

	/**
	  * @private
	  */
	getTemplateParameter(wikicode, templateName, parameterName) {
		templateName = this.regExEscape(templateName);
		parameterName = this.regExEscape(parameterName);
		let regex = new RegExp(`\\{\\{${templateName}[^\\}]+\\|${parameterName}\\s*=\\s*([^\\}\\|]+)\\s*[^\\}]*\\}\\}`, 'i');
		let parameterValue = wikicode.match(regex)
		if ( Array.isArray(parameterValue) && parameterValue[1] !== undefined ) {
			return parameterValue[1].trim();
		} else {
			return null;
		}
	}

	/**
	  * CC BY-SA 4.0, coolaj86, https://stackoverflow.com/a/6969486/3480193
	  * @private
	  */
	regExEscape(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

	/**
	  * @private
	  */
	deleteGANomineeTemplate(talkWikicode) {
		return talkWikicode.replace(/\{\{GA nominee[^\}]+\}\}\n?/i, '');
	}

	/**
	  * @private
	  */
	addGATemplate(talkWikicode, topic, gaPageNumber) {
		let codeToAdd = `{{GA|~~~~~|topic=${topic}|page=${gaPageNumber}}}\n`;
		return this.addTemplateInCorrectMOSTalkOrderPosition(talkWikicode, codeToAdd);
	}

	/**
	  * @private
	  */
	addFailedGATemplate(talkWikicode, topic, gaPageNumber) {
		let codeToAdd = `{{FailedGA|~~~~~|topic=${topic}|page=${gaPageNumber}}}\n`;
		return this.addTemplateInCorrectMOSTalkOrderPosition(talkWikicode, codeToAdd);
	}

	/**
	  * @private
	  */
	addTemplateInCorrectMOSTalkOrderPosition(talkWikicode, codeToAdd) {
		let templateName = this.getFirstTemplateNameFromWikicode(codeToAdd);
		let templatesThatGoBefore;
		switch ( templateName ) {
			case 'FailedGA':
			case 'GA':
				templatesThatGoBefore = ['GA nominee', 'Featured article candidates', 'Peer review', 'Skip to talk', 'Talk header', 'Talkheader', 'Vital article', 'Ds/talk notice', 'Gs/talk notice', 'BLP others', 'Calm', 'Censor', 'Controversial', 'Not a forum', 'FAQ', 'Round in circles', 'American English', 'British English']; // [[MOS:TALKORDER]]
				break;
			default:
				throw new Error('addTemplateInCorrectMOSTalkOrderPosition: Supplied template is not in dictionary. Unsure where to place it.');
		}
		return this.addWikicodeAfterTemplates(talkWikicode, templatesThatGoBefore, codeToAdd);
	}

	/**
	  * @private
	  */
	getFirstTemplateNameFromWikicode(wikicode) {
		let match = wikicode.match(/(?<=\{\{)[^\|\}]+/)
		if ( ! match ) {
			throw new Error('getFirstTemplateNameFromWikicode: No template found in Wikicode.');
		}
		return match[0];
	}

	/**
	  * Search algorithm looks for \n after the searched templates. If not present, it will not match.
	  * @param {array} templates
	  * @private
	  */
	addWikicodeAfterTemplates(wikicode, templates, codeToAdd) {
		let insertPosition = 0;
		for ( let template of templates ) {
			// TODO: handle nested templates
			let regex = new RegExp(`{{${this.regExEscape(template)}[^\\}]*}}\\n`, 'ig');
			let endOfTemplatePosition = this.getEndOfStringPositionOfLastMatch(wikicode, regex);
			if ( endOfTemplatePosition > insertPosition ) {
				insertPosition = endOfTemplatePosition;
			}
		}
		return this.insertStringIntoStringAtPosition(wikicode, codeToAdd, insertPosition);
	}

	/**
	  * @param {RegExp} regex /g flag must be set
	  * @returns {int} endOfStringPosition Returns zero if not found
	  * @private
	  */
	getEndOfStringPositionOfLastMatch(haystack, regex) {
		let matches = [...haystack.matchAll(regex)];
		let hasMatches = matches.length;
		if ( hasMatches ) {
			let lastMatch = matches[matches.length - 1];
			let lastMatchStartPosition = lastMatch['index'];
			let lastMatchStringLength = lastMatch[0].length;
			let lastMatchEndPosition = lastMatchStartPosition + lastMatchStringLength;
			return lastMatchEndPosition;
		}
		return 0;
	}

	/**
	  * @private
	  */
	changeWikiProjectArticleClassToGA(talkWikicode) {
		return talkWikicode.replace(/(\{\{WikiProject [^\}]*\|\s*class\s*=\s*)([^\}\|\s]*)/gi, '$1GA');
	}

	/**
	  * Determine next |action= number in {{Article history}} template. This is so we can insert an action.
	  * @private
	  */
	determineNextActionNumber(talkWikicode) {
		let i = 1;
		while ( true ) {
			let regex = new RegExp(`\\|\\s*action${i}\\s*=`, 'i');
			let hasAction = talkWikicode.match(regex);
			if ( ! hasAction ) {
				return i;
			}
			i++;
		}
	}

	/**
	  * @private
	  */
	updateArticleHistory(talkWikicode, topic, nominationPageTitle, listedOrFailed) {
		let nextActionNumber = this.determineNextActionNumber(talkWikicode);

		if ( listedOrFailed !== 'listed' && listedOrFailed !== 'failed' ) {
			throw new Error('InvalidArgumentException');
		}

		let needsTopic = ! Boolean(this.firstTemplateGetParameterValue(talkWikicode, 'Artricle history', 'topic'));
		let topicString = '';
		if ( needsTopic ) {
			topicString = `\n|topic = ${topic}`;
		}

		// https://en.wikipedia.org/wiki/Template:Article_history#How_to_use_in_practice
		let currentStatusString = '';
		let existingStatus = this.firstTemplateGetParameterValue(talkWikicode, 'Artricle history', 'currentstatus')
		talkWikicode = this.firstTemplateDeleteParameter(talkWikicode, 'Article history', 'currentstatus');
		if ( listedOrFailed === 'listed' ) {
			switch ( existingStatus ) {
				case 'FFA':
					currentStatusString += '\n|currentstatus = FFA/GA';
					break;
				case 'FFAC':
					currentStatusString += '\n|currentstatus = FFAC/GA';
					break;
				default:
					currentStatusString += '\n|currentstatus = GA';
					break;
			}
		} else {
			switch ( existingStatus ) {
				case 'FFA':
					currentStatusString += '\n|currentstatus = FFA';
					break;
				case 'FFAC':
					currentStatusString += '\n|currentstatus = FFAC';
					break;
				case 'DGA':
					currentStatusString += '\n|currentstatus = DGA';
					break;
				default:
					currentStatusString += '\n|currentstatus = FGAN';
					break;
			}
		}

		let addToArticleHistory = 
`|action${nextActionNumber} = GAN
|action${nextActionNumber}date = ~~~~~
|action${nextActionNumber}link = ${nominationPageTitle}
|action${nextActionNumber}result = ${listedOrFailed}`;

		addToArticleHistory += currentStatusString + topicString;

		talkWikicode = this.firstTemplateInsertCode(talkWikicode, 'Article ?history', addToArticleHistory);

		return talkWikicode;
	}

	/**
	  * @private
	  */
	firstTemplateInsertCode(wikicode, templateNameRegExNoDelimiters, codeToInsert) {
		// TODO: handle nested templates
		let regex = new RegExp(`(\\{\\{${templateNameRegExNoDelimiters}[^\\}]*)(\\}\\})`, 'i');
		return wikicode.replace(regex, `$1\n${codeToInsert}\n$2`);
	}

	/**
	  * @private
	  */
	firstTemplateGetParameterValue(wikicode, template, parameter) {
		// TODO: rewrite to be more robust. currently using a simple algorithm that is prone to failure
		// new algorithm:
			// find start of template. use regex /i (ignore case)
			// iterate using loops until end of template found
				// handle <nowiki>
				// handle triple {{{
				// handle nested
		
		let regex = new RegExp(`\\|\\s*${parameter}\\s*=\\s*([^\\n\\|\\}]*)\\s*`, '');
		let result = wikicode.match(regex);
		if ( wikicode.match(regex) === null ) return null;
		return result[1];
	}

	/**
	  * @private
	  */
	firstTemplateDeleteParameter(wikicode, template, parameter) {
		// TODO: rewrite to be more robust. currently using a simple algorithm that is prone to failure

		let regex = new RegExp(`\\|\\s*${parameter}\\s*=\\s*([^\\n\\|\\}]*)\\s*`, '');
		return wikicode.replace(regex, '');
	}

	/**
	  * @private
	  */
	removeFormattingThatInterferesWithSort(str) {
		return str.replace(/^[^\[]*\[\[(?:[^\|]+\|)?/, '') // delete anything in front of [[, [[, and anything inside the left half of a piped wikilink
			.replace(/\]\][^\]]*$/, '') // delete ]], and anything after ]]
			.replace(/"/g, '') // delete "
			.replace(/''/g, '') // delete '' but not '
			.replace(/^A /gi, '') // delete indefinite article "a"
			.replace(/^An /gi, '') // delete indefinite article "an"
			.replace(/^The /gi, '') // delete definite article "the"
	}

	/**
	  * @private
	  */
	aSortsLowerAlphabeticallyThanB(a, b) {
		// JavaScript appears to use an ASCII sort. See https://en.wikipedia.org/wiki/ASCII#Printable_characters

		// make sure "A" and "a" sort the same. prevents a bug
		a = a.toLowerCase();
		b = b.toLowerCase();

		let arr1 = [a, b];
		let arr2 = [a, b];
		return JSON.stringify(arr1.sort()) === JSON.stringify(arr2);
	}

	/**
	  * @private
	  */
	getGASubpageHeadingPosition(shortenedVersionInComboBox, wikicode) {
		// chop off equals at beginning and end of line. we want to isolate a smaller piece to use as our needle.
		let needle = /^={2,5}\s*(.*?)\s*={2,5}$/gm.exec(shortenedVersionInComboBox)[1];
		// keep the === === equals signs surrounding the heading the same. to prevent matching the wrong heading when there are multiple headings with the same needle, e.g. ===Art=== and =====Art=====
		let equalsSignsOnOneSide = /^(={2,5})/gm.exec(shortenedVersionInComboBox)[1];
		// then insert this needle into a wide regex that includes equals, optional spaces next to the equals, and optional [[File:]]
		let regex = new RegExp(`^${equalsSignsOnOneSide}\\s*(?:\\[\\[File:[^\\]]*\\]\\]\\s*)?${this.regExEscape(needle)}\\s*${equalsSignsOnOneSide}$`, 'gm');
		let result = regex.exec(wikicode);
		// if needle not found in haystack, return -1
		if ( ! Array.isArray(result) ) return -1;
		// else return location of first match
		return result.index;
	}

	/**
	  * @private
	  */
	findFirstStringAfterPosition(needle, haystack, position) {
		let len = haystack.length;
		for ( let i = position; i < len; i++ ) {
			let buffer = haystack.slice(i, len);
			if ( buffer.startsWith(needle) ) {
				return i;
			}
		}
		return -1;
	}

	/**
	  * CC BY-SA 4.0, jAndy, https://stackoverflow.com/a/4364902/3480193
	  * @private
	  */
	insertStringIntoStringAtPosition(bigString, insertString, position) {
		return [
			bigString.slice(0, position),
			insertString,
			bigString.slice(position)
		].join('');
	}

	/**
	  * @private
	  */
	hasArticleHistoryTemplate(wikicode) {
		return Boolean(wikicode.match(/\{\{Article ?history/i));
	}
}