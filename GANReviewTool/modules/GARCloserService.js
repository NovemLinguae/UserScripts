export class GARCloserService {
	processKeepForTalkPage(wikicode, garPageTitle, talkPageTitle) {
		wikicode = this.removeTemplate('GAR/link', wikicode);
		wikicode = this.convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode);
		wikicode = this.updateArticleHistory('keep', wikicode, garPageTitle);
		return wikicode;
	}

	makeCommunityAssessmentLogEntryToAppend(garTitle) {
		return `\n{{${garTitle}}}`;
	}

	/**
	 * @param {'keep'|'delist'} keepOrDelist
	 */
	makeScriptLogEntryToAppend(username, keepOrDelist, reviewTitle, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, error) {
		let textToAppend = `\n* `;

		if ( error ) {
			textToAppend += `<span style="color: red; font-weight: bold;">ERROR:</span> ${error}. `
		}

		let keepOrDelistPastTense = this.getKeepOrDelistPastTense(keepOrDelist);
		textToAppend += `[[User:${username}|${username}]] ${keepOrDelistPastTense} [[${reviewTitle}]] at ~~~~~. `;
		textToAppend += `[[Special:Diff/${talkRevisionID}|[Talk]]]`;

		if ( articleRevisionID ) {
			textToAppend += `[[Special:Diff/${articleRevisionID}|[Article]]]`;
		}
		if ( gaListRevisionID ) {
			textToAppend += `[[Special:Diff/${gaListRevisionID}|[List]]]`;
		}
		if ( garLogRevisionID ) {
			textToAppend += `[[Special:Diff/${garLogRevisionID}|[Log]]]`;
		}

		return textToAppend;
	}

	processDelistForTalkPage(wikicode, garPageTitle, talkPageTitle) {
		wikicode = this.removeTemplate('GAR/link', wikicode);
		wikicode = this.convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode);
		wikicode = this.updateArticleHistory('delist', wikicode, garPageTitle);
		wikicode = this.removeGAStatusFromWikiprojectBanners(wikicode);
		return wikicode;
	}

	processDelistForArticle(wikicode) {
		wikicode = wikicode.replace(/\{\{ga icon\}\}\n?/i, '');
		wikicode = wikicode.replace(/\{\{ga article\}\}\n?/i, '');
		wikicode = wikicode.replace(/\{\{good article\}\}\n?/i, '');
		return wikicode;
	}

	processDelistForGAList(wikicode, title) {
		let regex = new RegExp(`'{0,3}\\[\\[${this.regExEscape(title)}.*\\]\\]'{0,3}\\n`);
		wikicode = wikicode.replace(regex, '');
		return wikicode;
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
	removeTemplate(templateName, wikicode) {
		let regex = new RegExp(`\\{\\{${this.regExEscape(templateName)}[^\\}]*\\}\\}\\n`, 'i');
		return wikicode.replace(regex, '');
	}

	/**
	 * @private
	 */
	regexGetFirstMatchString(regex, haystack) {
		let matches = haystack.match(regex);
		if ( matches !== null && matches[1] !== undefined ) {
			return matches[1];
		}
		return null;
	}

	/**
	 * There's a {{GA}} template that some people use instead of {{Article history}}. If this is present, replace it with {{Article history}}.
	 * @private
	 */
	convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode) {
		let hasArticleHistory = Boolean(wikicode.match(/\{\{Article ? history([^\}]*)\}\}/gi));
		let gaTemplateWikicode = this.regexGetFirstMatchString(/(\{\{GA[^\}]*\}\})/i, wikicode);
		if ( ! hasArticleHistory && gaTemplateWikicode ) {
			// delete {{ga}} template
			wikicode = wikicode.replace(/\{\{GA[^\}]*\}\}\n?/i, '');
			wikicode = wikicode.trim();
			
			// parse its parameters
			// example: |21:00, 12 March 2017 (UTC)|topic=Sports and recreation|page=1|oldid=769997774
			let parameters = this.getParametersFromTemplateWikicode(gaTemplateWikicode);
			
			// if no page specified, assume page is 1. so then the good article review link will be parsed as /GA1
			let noPageSpecified = parameters['page'] === undefined;
			if ( noPageSpecified ) {
				parameters['page'] = 1;
			}
			
			let topicString = '';
			if ( parameters['topic'] !== undefined ) {
				topicString = `\n|topic = ${parameters['topic']}`;
			} else if ( parameters['subtopic'] !== undefined ) { // subtopic is an alias only used in {{ga}}, it is not used in {{article history}}
				topicString = `\n|topic = ${parameters['subtopic']}`;
			}

			let oldIDString = '';
			if ( parameters['oldid'] !== undefined ) {
				oldIDString = `\n|action1oldid = ${parameters['oldid']}`;
			}

			// insert {{article history}} template
			let addToTalkPageAboveWikiProjects = 
`{{Article history
|currentstatus = GA${topicString}

|action1 = GAN
|action1date = ${parameters[1]}
|action1link = ${talkPageTitle}/GA${parameters['page']}
|action1result = listed${oldIDString}
}}`;
			wikicode = this.addToTalkPageAboveWikiProjects(wikicode, addToTalkPageAboveWikiProjects);
		}
		return wikicode;
	}

	/**
	 * Adds wikicode right above {{WikiProject X}} or {{WikiProject Banner Shell}} if present, or first ==Header== if present, or at bottom of page. Treat {{Talk:abc/GA1}} as a header.
	 * @private
	 */
	addToTalkPageAboveWikiProjects(talkPageWikicode, wikicodeToAdd) {
		if ( ! talkPageWikicode ) {
			return wikicodeToAdd;
		}
		
		// Find first WikiProject or WikiProject banner shell template
		let wikiProjectLocation = false;
		let dictionary = ['wikiproject', 'wpb', 'wpbs', 'wpbannershell', 'wp banner shell', 'bannershell', 'scope shell', 'project shell', 'multiple wikiprojects', 'football'];
		for ( let value of dictionary ) {
			let location = talkPageWikicode.toUpperCase().indexOf('{{' + value.toUpperCase()); // case insensitive
			if ( location !== -1 ) {
				// if this location is higher up than the previous found location, overwrite it
				if ( wikiProjectLocation === false || wikiProjectLocation > location ) {
					wikiProjectLocation = location;
				}
			}
		}
		
		// Find first heading
		let headingLocation = talkPageWikicode.indexOf('==');
		
		// Find first {{Talk:abc/GA1}} template
		let gaTemplateLocation = this.preg_position(new RegExp(`\\{\\{[^\\}]*\\/GA\\d{1,2}\\}\\}`, 'gis'), talkPageWikicode);
		
		// Set insert location
		let insertPosition;
		if ( wikiProjectLocation !== false ) {
			insertPosition = wikiProjectLocation;
		} else if ( headingLocation !== -1 ) {
			insertPosition = headingLocation;
		} else if ( gaTemplateLocation !== false ) {
			insertPosition = gaTemplateLocation;
		} else {
			insertPosition = talkPageWikicode.length; // insert at end of page
		}
		
		// if there's a {{Talk:abc/GA1}} above a heading, adjust for this
		if (
			headingLocation !== -1 &&
			gaTemplateLocation !== false &&
			gaTemplateLocation < insertPosition
		) {
			insertPosition = gaTemplateLocation;
		}
		
		// If there's excess newlines in front of the insert location, delete the newlines
		let deleteTopPosition = false;
		let deleteBottomPosition = false;
		let pos = insertPosition <= 0 ? 0 : insertPosition - 1;
		let i = 1;
		while ( pos != 0 ) {
			let char = talkPageWikicode.substr(pos, 1);
			if ( char == "\n" ) {
				if ( i != 1 && i != 2 ) { // skip first two \n, those are OK to keep
					deleteTopPosition = pos;
					if ( i == 3 ) {
						deleteBottomPosition = insertPosition;
					}
				}
				insertPosition = pos; // insert position should back up past all \n's.
				i++;
				pos--;
			} else {
				break;
			}
		}
		if ( deleteTopPosition !== false ) {
			talkPageWikicode = this.deleteMiddleOfString(talkPageWikicode, deleteTopPosition, deleteBottomPosition);
		}
		
		let lengthOfRightHalf = talkPageWikicode.length - insertPosition;
		let leftHalf = talkPageWikicode.substr(0, insertPosition);
		let rightHalf = talkPageWikicode.substr(insertPosition, lengthOfRightHalf);
		
		if ( insertPosition == 0 ) {
			return wikicodeToAdd + "\n" + talkPageWikicode;
		} else {
			return leftHalf + "\n" + wikicodeToAdd + rightHalf;
		}
	}

	/**
	 * @param {RegExp} regex
	 * @private
	 */
	preg_position(regex, haystack) {
		let matches = [...haystack.matchAll(regex)];
		let hasMatches = matches.length;
		if ( hasMatches ) {
			return matches[0]['index'];
		}
		return false;
	}

	/**
	 * @private
	 */
	deleteMiddleOfString(string, deleteStartPosition, deleteEndPosition) {
		let part1 = string.substr(0, deleteStartPosition);
		let part2 = string.substr(deleteEndPosition);
		
		let final_str = part1 + part2;
		return final_str;
	}

	/**
	 * @returns {Object} Parameters, with keys being equivalent to the template parameter names. Unnamed parameters will be 1, 2, 3, etc.
	 * @private
	 */
	getParametersFromTemplateWikicode(wikicodeOfSingleTemplate) {
		wikicodeOfSingleTemplate = wikicodeOfSingleTemplate.slice(2, -2); // remove {{ and }}
		// TODO: explode without exploding | inside of inner templates
		let strings = wikicodeOfSingleTemplate.split('|');
		let parameters = {};
		let unnamedParameterCount = 1;
		let i = 0;
		for ( let string of strings ) {
			i++;
			if ( i == 1 ) continue; // skip the template name, this is not a parameter 
			let hasEquals = string.indexOf('=');
			if ( hasEquals === -1 ) {
				parameters[unnamedParameterCount] = string;
				unnamedParameterCount++;
			} else {
				let matches = string.match(/^([^=]*)=(.*)/s); // isolate param name and param value by looking for first equals sign
				let paramName = matches[1].trim().toLowerCase(); 
				let paramValue = matches[2].trim();
				parameters[paramName] = paramValue;
			}
		}
		return parameters;
	}

	/**
	 * @param {'keep'|'delist'} keepOrDelist
	 * @private
	 */
	updateArticleHistory(keepOrDelist, wikicode, garPageTitle) {
		let nextActionNumber = this.determineNextActionNumber(wikicode);

		if ( keepOrDelist !== 'keep' && keepOrDelist !== 'delist' ) {
			throw new Error('InvalidArgumentException');
		}

		let topic = this.firstTemplateGetParameterValue(wikicode, 'Artricle history', 'topic');
		let topicString = '';
		if ( ! topic ) {
			topicString = `\n|topic = ${topic}`;
		}

		// https://en.wikipedia.org/wiki/Template:Article_history#How_to_use_in_practice
		let existingStatus = this.firstTemplateGetParameterValue(wikicode, 'Artricle history', 'currentstatus')
		wikicode = this.firstTemplateDeleteParameter(wikicode, 'Article history', 'currentstatus');
		let currentStatusString = this.getArticleHistoryNewStatus(existingStatus, keepOrDelist);

		let result = this.getKeepOrDelistPastTense(keepOrDelist);

		let addToArticleHistory = 
`|action${nextActionNumber} = GAR
|action${nextActionNumber}date = ~~~~~
|action${nextActionNumber}link = ${garPageTitle}
|action${nextActionNumber}result = ${result}`;

		addToArticleHistory += currentStatusString + topicString;

		wikicode = this.firstTemplateInsertCode(wikicode, 'Article ?history', addToArticleHistory);

		return wikicode;
	}

	/**
	 * @private
	 */
	getKeepOrDelistPastTense(keepOrDelist) {
		switch ( keepOrDelist ) {
			case 'keep':
				return 'kept';
			case 'delist':
				return 'delisted';
		}
	}

	/**
	 * Determine next |action= number in {{Article history}} template. This is so we can insert an action.
	 * @private
	 */
	determineNextActionNumber(wikicode) {
		let i = 1;
		while ( true ) {
			let regex = new RegExp(`\\|\\s*action${i}\\s*=`, 'i');
			let hasAction = wikicode.match(regex);
			if ( ! hasAction ) {
				return i;
			}
			i++;
		}
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
	getArticleHistoryNewStatus(existingStatus, keepOrDelist) {
		if ( keepOrDelist === 'keep' ) {
			return `\n|currentstatus = ${existingStatus}`;
		} else {
			return '\n|currentstatus = DGA';
		}
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
	removeGAStatusFromWikiprojectBanners(wikicode) {
		return wikicode.replace(/(\{\{WikiProject [^\}]*\|\s*class\s*=\s*)([^\}\|\s]*)/gi, '$1');
	}

	/**
	 * @private
	 */
	firstTemplateDeleteParameter(wikicode, template, parameter) {
		// TODO: rewrite to be more robust. currently using a simple algorithm that is prone to failure

		let regex = new RegExp(`\\|\\s*${parameter}\\s*=\\s*([^\\n\\|\\}]*)\\s*`, '');
		return wikicode.replace(regex, '');
	}
}