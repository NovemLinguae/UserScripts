export class GARCloserWikicodeGenerator {
	processKeepForGARPage(garPageWikicode, message, isCommunityAssessment) {
		return this.processGARPage(garPageWikicode, message, isCommunityAssessment, 'Kept.', 'green');
	}

	processKeepForTalkPage(wikicode, garPageTitle, talkPageTitle, oldid) {
		wikicode = this.removeTemplate('GAR/link', wikicode);
		wikicode = this.convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode);
		wikicode = this.updateArticleHistory('keep', wikicode, garPageTitle, oldid);
		return wikicode;
	}

	makeCommunityAssessmentLogEntry(garTitle, wikicode, newArchive, archiveTitle) {
		let output = ``;
		if ( newArchive ) {
			let archiveNumber = this.getArchiveNumber(archiveTitle);
			output +=
`{| class="messagebox"
|-
| [[Image:Filing cabinet icon.svg|50px|Archive]]
| This is an '''[[Wikipedia:How to archive a talk page|archive]]''' of past discussions. Its contents should be preserved in their current form. If you wish to start a new discussion or revive an old one, please do so on the <span class="plainlinks">[{{FULLURL:{{TALKSPACE}}:{{BASEPAGENAME}}}} current talk page]</span>.<!-- Template:Talkarchive -->
|}
{{Template:Process header green
 | title    = Good article reassessment
 | section  = (archive)
 | previous = ([[Wikipedia:Good article reassessment/Archive ${archiveNumber-1}|Page ${archiveNumber-1}]])
 | next     = ([[Wikipedia:Good article reassessment/Archive ${archiveNumber+1}|Page ${archiveNumber+1}]]) 
 | shortcut =
 | notes    =
}}
__TOC__`;
		} else {
			output += wikicode;
		}
		output += `\n{{${garTitle}}}`;
		return output;
	}

	setGARArchiveTemplate(newArchiveTitle, wikicode) {
		let archiveNumber = this.getArchiveNumber(newArchiveTitle);
		return wikicode.replace(/^\d{1,}/, archiveNumber);
	}

	/**
	 * @param {'keep'|'delist'} keepOrDelist
	 * @todo too many params. factor the RevisionIDs into their own class
	 */
	makeScriptLogEntryToAppend(username, keepOrDelist, reviewTitle, garRevisionID, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID) {
		if ( arguments.length !== 11 ) throw new Error('Incorrect # of arguments');

		let textToAppend = `\n* `;

		if ( error ) {
			textToAppend += `<span style="color: red; font-weight: bold;">ERROR:</span> ${error}. `;
		}

		let keepOrDelistPastTense = this.getKeepOrDelistPastTense(keepOrDelist);
		textToAppend += `[[User:${username}|${username}]] ${keepOrDelistPastTense} [[${reviewTitle}]] at ~~~~~. `;

		if ( garRevisionID ) {
			textToAppend += `[[Special:Diff/${garRevisionID}|[Atop]]]`;
		}
		if ( talkRevisionID ) {
			textToAppend += `[[Special:Diff/${talkRevisionID}|[Talk]]]`;
		}
		if ( articleRevisionID ) {
			textToAppend += `[[Special:Diff/${articleRevisionID}|[Article]]]`;
		}
		if ( gaListRevisionID ) {
			textToAppend += `[[Special:Diff/${gaListRevisionID}|[List]]]`;
		}
		if ( garLogRevisionID ) {
			textToAppend += `[[Special:Diff/${garLogRevisionID}|[Log]]]`;
		}
		if ( garArchiveTemplateRevisionID ) {
			textToAppend += `[[Special:Diff/${garArchiveTemplateRevisionID}|[Tmpl]]]`;
		}
		if ( categoryRevisionID ) {
			textToAppend += `[[Special:Diff/${categoryRevisionID}|[Cat]]]`;
		}

		return textToAppend;
	}

	processDelistForGARPage(garPageWikicode, message, isCommunityAssessment) {
		return this.processGARPage(garPageWikicode, message, isCommunityAssessment, 'Delisted.', 'red');
	}

	processDelistForTalkPage(wikicode, garPageTitle, talkPageTitle, oldid) {
		wikicode = this.removeTemplate('GAR/link', wikicode); // "this article is undergoing a GAR"
		wikicode = this.removeTemplate('GAR request', wikicode); // "maybe this article needs a GAR"
		wikicode = this.convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode);
		wikicode = this.updateArticleHistory('delist', wikicode, garPageTitle, oldid);
		wikicode = this.removeGAStatusFromWikiprojectBanners(wikicode);
		return wikicode;
	}

	processDelistForArticle(wikicode) {
		let gaTemplateNames = ['ga icon', 'ga article', 'good article'];
		for ( let templateName of gaTemplateNames ) {
			// handle lots of line breaks: \n\n{{templateName}}\n\n -> \n\n
			let regex = new RegExp('\\n\\n\\{\\{' + templateName + '\\}\\}\\n\\n', 'i');
			wikicode = wikicode.replace(regex, '\n\n');
			
			// handle normal: {{templateName}}\n -> '', {{templateName}} -> ''
			regex = new RegExp('\\{\\{' + templateName + '\\}\\}\\n?', 'i');
			wikicode = wikicode.replace(regex, '');
		}
		return wikicode;
	}

	processDelistForGAList(wikicode, articleToRemove) {
		let regex = new RegExp(`'{0,3}"?\\[\\[${this.regExEscape(articleToRemove)}(?:\\|[^\\]]+)?\\]\\]"?'{0,3}\\n`, 'gi');
		wikicode = wikicode.replace(regex, '');
		return wikicode;
	}

	processGARPage(garPageWikicode, message, isCommunityAssessment, defaultText, atopColor) {
		message = this.setMessageIfEmpty(defaultText, message);
		message = this.addSignatureIfMissing(message);
		let messageForAtop = this.getMessageForAtop(isCommunityAssessment, message);
		let result = this.placeATOP(garPageWikicode, messageForAtop, atopColor);
		if ( isCommunityAssessment ) {
			result = this.replaceGARCurrentWithGARResult(message, result);
		}
		return result;
	}

	/**
	  * Public. Used in GARCloserController.
	  */
	getGAListTitleFromTalkPageWikicode(wikicode) {
		/** Keys should all be lowercase */
		let dictionary = {
			'agriculture': 'Wikipedia:Good articles/Agriculture, food and drink',
			'agriculture, food and drink': 'Wikipedia:Good articles/Agriculture, food and drink',
			'agriculture, food, and drink': 'Wikipedia:Good articles/Agriculture, food and drink',
			'cuisine': 'Wikipedia:Good articles/Agriculture, food and drink',
			'cuisines': 'Wikipedia:Good articles/Agriculture, food and drink',
			'cultivation': 'Wikipedia:Good articles/Agriculture, food and drink',
			'drink': 'Wikipedia:Good articles/Agriculture, food and drink',
			'farming and cultivation': 'Wikipedia:Good articles/Agriculture, food and drink',
			'farming': 'Wikipedia:Good articles/Agriculture, food and drink',
			'food and drink': 'Wikipedia:Good articles/Agriculture, food and drink',
			'food': 'Wikipedia:Good articles/Agriculture, food and drink',

			'art': 'Wikipedia:Good articles/Art and architecture',
			'architecture': 'Wikipedia:Good articles/Art and architecture',
			'art and architecture': 'Wikipedia:Good articles/Art and architecture',

			'engtech': 'Wikipedia:Good articles/Engineering and technology',
			'applied sciences and technology': 'Wikipedia:Good articles/Engineering and technology',
			'applied sciences': 'Wikipedia:Good articles/Engineering and technology',
			'computers': 'Wikipedia:Good articles/Engineering and technology',
			'computing and engineering': 'Wikipedia:Good articles/Engineering and technology',
			'computing': 'Wikipedia:Good articles/Engineering and technology',
			'eng': 'Wikipedia:Good articles/Engineering and technology',
			'engineering': 'Wikipedia:Good articles/Engineering and technology',
			'engineering and technology': 'Wikipedia:Good articles/Engineering and technology',
			'technology': 'Wikipedia:Good articles/Engineering and technology',
			'transport': 'Wikipedia:Good articles/Engineering and technology',

			'geography': 'Wikipedia:Good articles/Geography and places',
			'geography and places': 'Wikipedia:Good articles/Geography and places',
			'places': 'Wikipedia:Good articles/Geography and places',

			'history': 'Wikipedia:Good articles/History',
			'archaeology': 'Wikipedia:Good articles/History',
			'heraldry': 'Wikipedia:Good articles/History',
			'nobility': 'Wikipedia:Good articles/History',
			'royalty': 'Wikipedia:Good articles/History',
			'royalty, nobility and heraldry': 'Wikipedia:Good articles/History',
			'world history': 'Wikipedia:Good articles/History',

			'langlit': 'Wikipedia:Good articles/Language and literature',
			'language and literature': 'Wikipedia:Good articles/Language and literature',
			'languages and linguistics': 'Wikipedia:Good articles/Language and literature',
			'languages and literature': 'Wikipedia:Good articles/Language and literature',
			'languages': 'Wikipedia:Good articles/Language and literature',
			'linguistics': 'Wikipedia:Good articles/Language and literature',
			'lit': 'Wikipedia:Good articles/Language and literature',
			'literature': 'Wikipedia:Good articles/Language and literature',

			'math': 'Wikipedia:Good articles/Mathematics',
			'mathematics and mathematicians': 'Wikipedia:Good articles/Mathematics',
			'mathematics': 'Wikipedia:Good articles/Mathematics',
			'maths': 'Wikipedia:Good articles/Mathematics',

			'drama': 'Wikipedia:Good articles/Media and drama',
			'ballet': 'Wikipedia:Good articles/Media and drama',
			'dance': 'Wikipedia:Good articles/Media and drama',
			'film': 'Wikipedia:Good articles/Media and drama',
			'films': 'Wikipedia:Good articles/Media and drama',
			'media and drama': 'Wikipedia:Good articles/Media and drama',
			'media': 'Wikipedia:Good articles/Media and drama',
			'opera': 'Wikipedia:Good articles/Media and drama',
			'television': 'Wikipedia:Good articles/Media and drama',
			'theater': 'Wikipedia:Good articles/Media and drama',
			'theatre': 'Wikipedia:Good articles/Media and drama',
			'theatre, film and drama': 'Wikipedia:Good articles/Media and drama',

			'music': 'Wikipedia:Good articles/Music',
			'albums': 'Wikipedia:Good articles/Music',
			'classical compositions': 'Wikipedia:Good articles/Music',
			'other music articles': 'Wikipedia:Good articles/Music',
			'songs': 'Wikipedia:Good articles/Music',

			'natsci': 'Wikipedia:Good articles/Natural sciences',
			'astronomy': 'Wikipedia:Good articles/Natural sciences',
			'astrophysics': 'Wikipedia:Good articles/Natural sciences',
			'atmospheric science': 'Wikipedia:Good articles/Natural sciences',
			'biology and medicine': 'Wikipedia:Good articles/Natural sciences',
			'biology': 'Wikipedia:Good articles/Natural sciences',
			'chemistry and materials science': 'Wikipedia:Good articles/Natural sciences',
			'chemistry': 'Wikipedia:Good articles/Natural sciences',
			'cosmology': 'Wikipedia:Good articles/Natural sciences',
			'earth science': 'Wikipedia:Good articles/Natural sciences',
			'earth sciences': 'Wikipedia:Good articles/Natural sciences',
			'geology': 'Wikipedia:Good articles/Natural sciences',
			'geophysics': 'Wikipedia:Good articles/Natural sciences',
			'medicine': 'Wikipedia:Good articles/Natural sciences',
			'meteorology and atmospheric sciences': 'Wikipedia:Good articles/Natural sciences',
			'meteorology': 'Wikipedia:Good articles/Natural sciences',
			'mineralogy': 'Wikipedia:Good articles/Natural sciences',
			'natural science': 'Wikipedia:Good articles/Natural sciences',
			'natural sciences': 'Wikipedia:Good articles/Natural sciences',
			'physics and astronomy': 'Wikipedia:Good articles/Natural sciences',
			'physics': 'Wikipedia:Good articles/Natural sciences',

			'philrelig': 'Wikipedia:Good articles/Philosophy and religion',
			'mysticism': 'Wikipedia:Good articles/Philosophy and religion',
			'myth': 'Wikipedia:Good articles/Philosophy and religion',
			'mythology': 'Wikipedia:Good articles/Philosophy and religion',
			'phil': 'Wikipedia:Good articles/Philosophy and religion',
			'philosophy and religion': 'Wikipedia:Good articles/Philosophy and religion',
			'philosophy': 'Wikipedia:Good articles/Philosophy and religion',
			'relig': 'Wikipedia:Good articles/Philosophy and religion',
			'religion': 'Wikipedia:Good articles/Philosophy and religion',
			'religion, mysticism and mythology': 'Wikipedia:Good articles/Philosophy and religion',

			'socsci': 'Wikipedia:Good articles/Social sciences and society',
			'business and economics': 'Wikipedia:Good articles/Social sciences and society',
			'business': 'Wikipedia:Good articles/Social sciences and society',
			'culture and society': 'Wikipedia:Good articles/Social sciences and society',
			'culture': 'Wikipedia:Good articles/Social sciences and society',
			'culture, society and psychology': 'Wikipedia:Good articles/Social sciences and society',
			'economics and business': 'Wikipedia:Good articles/Social sciences and society',
			'economics': 'Wikipedia:Good articles/Social sciences and society',
			'education': 'Wikipedia:Good articles/Social sciences and society',
			'gov': 'Wikipedia:Good articles/Social sciences and society',
			'government': 'Wikipedia:Good articles/Social sciences and society',
			'journalism and media': 'Wikipedia:Good articles/Social sciences and society',
			'journalism': 'Wikipedia:Good articles/Social sciences and society',
			'law': 'Wikipedia:Good articles/Social sciences and society',
			'magazines and print journalism': 'Wikipedia:Good articles/Social sciences and society',
			'media and journalism': 'Wikipedia:Good articles/Social sciences and society',
			'politics and government': 'Wikipedia:Good articles/Social sciences and society',
			'politics': 'Wikipedia:Good articles/Social sciences and society',
			'psychology': 'Wikipedia:Good articles/Social sciences and society',
			'social science': 'Wikipedia:Good articles/Social sciences and society',
			'social sciences and society': 'Wikipedia:Good articles/Social sciences and society',
			'social sciences': 'Wikipedia:Good articles/Social sciences and society',
			'society': 'Wikipedia:Good articles/Social sciences and society',

			'sports': 'Wikipedia:Good articles/Sports and recreation',
			'everyday life': 'Wikipedia:Good articles/Sports and recreation',
			'everydaylife': 'Wikipedia:Good articles/Sports and recreation',
			'games': 'Wikipedia:Good articles/Sports and recreation',
			'recreation': 'Wikipedia:Good articles/Sports and recreation',
			'sport and recreation': 'Wikipedia:Good articles/Sports and recreation',
			'sport': 'Wikipedia:Good articles/Sports and recreation',
			'sports and recreation': 'Wikipedia:Good articles/Sports and recreation',

			'video games': 'Wikipedia:Good articles/Video games',
			'video and computer games': 'Wikipedia:Good articles/Video games',

			'war': 'Wikipedia:Good articles/Warfare',
			'aircraft': 'Wikipedia:Good articles/Warfare',
			'battles and exercises': 'Wikipedia:Good articles/Warfare',
			'battles': 'Wikipedia:Good articles/Warfare',
			'decorations and memorials': 'Wikipedia:Good articles/Warfare',
			'military': 'Wikipedia:Good articles/Warfare',
			'military people': 'Wikipedia:Good articles/Warfare',
			'units': 'Wikipedia:Good articles/Warfare',
			'war and military': 'Wikipedia:Good articles/Warfare',
			'warfare': 'Wikipedia:Good articles/Warfare',
			'warships': 'Wikipedia:Good articles/Warfare',
			'weapons and buildings': 'Wikipedia:Good articles/Warfare',
			'weapons': 'Wikipedia:Good articles/Warfare',
		};
		let topic = wikicode.match(/(?:\{\{Article ?history|\{\{GA\s*(?=\|)).*?\|\s*(?:sub)?topic\s*=\s*([^\|\}\n]+)/is)[1];
		topic = topic.toLowerCase().trim();
		let gaListTitle = dictionary[topic];
		// throw the error a little later rather than now. that way it doesn't interrupt modifying the article talk page.
		return gaListTitle;
	}

	addSignatureIfMissing(message) {
		if ( ! message.includes('~~~~') ) {
			message += ' ~~~~';
		}
		return message;
	}

	setMessageIfEmpty(defaultText, message) {
		if ( message === '' ) {
			message = defaultText;
		}
		return message;
	}

	getMessageForAtop(isCommunityAssessment, message) {
		let messageForAtop = message;
		if ( isCommunityAssessment ) {
			messageForAtop = '';
		}
		return messageForAtop;
	}

	/**
	 * {{GAR/current}} and {{GAR/result}} are templates used in community reassessment GARs. The first needs to be swapped for the second when closing community reassessment GARs.
	 */
	replaceGARCurrentWithGARResult(message, wikicode) {
		message = message.replace(/ ?~~~~/g, '');
		return wikicode.replace(/\{\{GAR\/current\}\}/i, `{{subst:GAR/result|result=${this.escapeTemplateParameter(message)}}} ~~~~`);
	}

	escapeTemplateParameter(parameter) {
		// TODO: This needs repair. Should only escape the below if they are not inside of a template. Should not escape them at all times. Commenting out for now.
		// parameter = parameter.replace(/\|/g, '{{!}}');
		// parameter = parameter.replace(/=/g, '{{=}}');
		return parameter;
	}

	/**
	 * Takes a Wikipedia page name with a number on the end, and returns that number.
	 */
	getArchiveNumber(title) {
		return parseInt(title.match(/\d{1,}$/));
	}

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

		// place top piece after first H2 or H3, if it exists
		let resultText = result ? `\n| result = ${result}\n` : '';
		let prependText =
`{{atop${colorCode}${resultText}}}`;
		let hasH2OrH3 = wikicode.match(/^===?[^=]+===?$/m);
		if ( hasH2OrH3 ) {
			wikicode = wikicode.replace(/^(.*?===?[^=]+===?\n)\n*(.*)$/s, '$1' + prependText + '\n$2');
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
	 * CC BY-SA 4.0, coolaj86, https://stackoverflow.com/a/6969486/3480193
	 */
	regExEscape(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

	removeTemplate(templateName, wikicode) {
		let regex = new RegExp(`\\{\\{${this.regExEscape(templateName)}[^\\}]*\\}\\}\\n?`, 'i');
		return wikicode.replace(regex, '');
	}

	regexGetFirstMatchString(regex, haystack) {
		let matches = haystack.match(regex);
		if ( matches !== null && matches[1] !== undefined ) {
			return matches[1];
		}
		return null;
	}

	/**
	 * There's a {{GA}} template that some people use instead of {{Article history}}. If this is present, replace it with {{Article history}}.
	 */
	convertGATemplateToArticleHistoryIfPresent(talkPageTitle, wikicode) {
		let hasArticleHistory = Boolean(wikicode.match(/\{\{Article ?history([^\}]*)\}\}/gi));
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

			// if |1= was used for date instead of |date=
			if ( parameters['date'] === undefined && parameters[1] !== undefined) {
				parameters['date'] = parameters[1];
			}

			// insert {{article history}} template
			let addToTalkPageAboveWikiProjects = 
`{{Article history
|currentstatus = GA${topicString}

|action1 = GAN
|action1date = ${parameters['date']}
|action1link = ${talkPageTitle}/GA${parameters['page']}
|action1result = listed${oldIDString}
}}`;
			wikicode = this.addToTalkPageAboveWikiProjects(wikicode, addToTalkPageAboveWikiProjects);
		}
		return wikicode;
	}

	/**
	 * Adds wikicode right above {{WikiProject X}} or {{WikiProject Banner Shell}} if present, or first ==Header== if present, or at bottom of page. Treat {{Talk:abc/GA1}} as a header.
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
					// @ts-ignore
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
	 */
	preg_position(regex, haystack) {
		let matches = [...haystack.matchAll(regex)];
		let hasMatches = matches.length;
		if ( hasMatches ) {
			return matches[0]['index'];
		}
		return false;
	}

	deleteMiddleOfString(string, deleteStartPosition, deleteEndPosition) {
		let part1 = string.substr(0, deleteStartPosition);
		let part2 = string.substr(deleteEndPosition);
		let final_str = part1 + part2;
		return final_str;
	}

	/**
	 * @returns {Object} Parameters, with keys being equivalent to the template parameter names. Unnamed parameters will be 1, 2, 3, etc.
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
			if ( i == 1 ) {
				continue; // skip the template name, this is not a parameter 
			}
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
	 */
	updateArticleHistory(keepOrDelist, wikicode, garPageTitle, oldid) {
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
		let existingStatus = this.firstTemplateGetParameterValue(wikicode, 'Artricle history', 'currentstatus');
		wikicode = this.firstTemplateDeleteParameter(wikicode, 'Article history', 'currentstatus');
		let currentStatusString = this.getArticleHistoryNewStatus(existingStatus, keepOrDelist);

		let result = this.getKeepOrDelistPastTense(keepOrDelist);

		let addToArticleHistory = 
`|action${nextActionNumber} = GAR
|action${nextActionNumber}date = ~~~~~
|action${nextActionNumber}link = ${garPageTitle}
|action${nextActionNumber}result = ${result}
|action${nextActionNumber}oldid = ${oldid}`;

		addToArticleHistory += currentStatusString + topicString;

		wikicode = this.firstTemplateInsertCode(wikicode, ['Article history', 'ArticleHistory'], addToArticleHistory);

		return wikicode;
	}

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

	getArticleHistoryNewStatus(existingStatus, keepOrDelist) {
		if ( keepOrDelist === 'keep' ) {
			return `\n|currentstatus = ${existingStatus}`;
		} else {
			return '\n|currentstatus = DGA';
		}
	}

	/**
	 * @param {Array} templateNameArrayCaseInsensitive
	 */
	firstTemplateInsertCode(wikicode, templateNameArrayCaseInsensitive, codeToInsert) {
		for ( let templateName of templateNameArrayCaseInsensitive ) {
			let strPosOfEndOfFirstTemplate = this.getStrPosOfEndOfFirstTemplateFound(wikicode, templateName);
			if ( strPosOfEndOfFirstTemplate !== null ) {
				let insertPosition = strPosOfEndOfFirstTemplate - 2; // 2 characters from the end, right before }}
				let result = this.insertStringIntoStringAtPosition(wikicode, `\n${codeToInsert}\n`, insertPosition);
				return result;
			}
		}
	}

	/**
	 * CC BY-SA 4.0, jAndy, https://stackoverflow.com/a/4364902/3480193
	 */
	insertStringIntoStringAtPosition(bigString, insertString, position) {
		return [
			bigString.slice(0, position),
			insertString,
			bigString.slice(position)
		].join('');
	}

	/**
	 * Grabs string position of the END of first {{template}} contained in wikicode. Case insensitive. Returns null if no template found. Handles nested templates.
	 * @returns {number|null}
	 */
	getStrPosOfEndOfFirstTemplateFound(wikicode, templateName) {
		let starting_position = wikicode.toLowerCase().indexOf("{{" + templateName.toLowerCase());
		if ( starting_position === -1 ) return null;
		let counter = 0;
		let length = wikicode.length;
		for ( let i = starting_position + 2; i < length; i++ ) {
			let next_two = wikicode.substr(i, 2);
			if ( next_two == "{{" ) {
				counter++;
				continue;
			} else if ( next_two == "}}" ) {
				if ( counter == 0 ) {
					return i + 2; // +2 to account for next_two being }} (2 characters)
				} else {
					counter--;
					continue;
				}
			}
		}
		return null;
	}

	removeGAStatusFromWikiprojectBanners(wikicode) {
		return wikicode.replace(/(\|\s*class\s*=\s*)([^\}\|\s]*)/gi, '$1');
	}

	firstTemplateDeleteParameter(wikicode, template, parameter) {
		// TODO: rewrite to be more robust. currently using a simple algorithm that is prone to failure
		let regex = new RegExp(`\\|\\s*${parameter}\\s*=\\s*([^\\n\\|\\}]*)\\s*`, '');
		return wikicode.replace(regex, '');
	}
}