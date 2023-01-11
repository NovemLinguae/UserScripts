import { StringFilter } from "../modules/StringFilter.js";

export class DraftCleaner {
	cleanDraft(wikicode, namespaceNumber, titleWithNamespaceAndSpaces) {
		// run before other stuff
		wikicode = this.deleteSomeHTMLTags(wikicode);

		wikicode = this.fixWikilinksContainingURL(wikicode);
		wikicode = this.fixExternalLinksToWikipediaArticles(wikicode);
		wikicode = this.deleteWeirdUnicodeCharacters(wikicode);
		wikicode = this.trimEveryLine(wikicode);
		wikicode = this.convertH1ToH2(wikicode);
		wikicode = this.convertVeryLongHeadingToParagraph(wikicode);
		wikicode = this.deleteHeadingsWithTitle(wikicode, titleWithNamespaceAndSpaces);
		wikicode = this.unlinkWikilinksToThisTitle(wikicode, titleWithNamespaceAndSpaces);
		wikicode = this.capitalizeCOVID19(wikicode);
		wikicode = this.removeBoldFromHeadings(wikicode);
		wikicode = this.convertReferenceToReferences(wikicode);
		wikicode = this.deleteMultipleReferenceTags(wikicode);
		wikicode = this.addReferencesSectionIfMissing(wikicode);
		wikicode = this.fixEmptyReferencesSection(wikicode);
		wikicode = this.deleteWhitespaceAtEndOfLines(wikicode);
		wikicode = this.convertSmartQuotesToRegularQuotes(wikicode);
		// wikicode = this.fixWordEmphasizedWithSingleQuotes(wikicode); // most of these appear in citations as names of newspaper articles, arguably should keep these single quotes
		wikicode = this.convertDoubleSpacesToSingleSpaces(wikicode);
		wikicode = this.deleteBlankHeadings(wikicode);
		wikicode = this.changeYearRangeDashToNDash(wikicode);
		wikicode = this.disableCategoriesInDraftspace(wikicode, namespaceNumber);
		// wikicode = this.deleteBRTagsOutsideInfoboxes(wikicode, namespaceNumber); // edge case in image captions, and probably other places
		// wikicode = this.rightAlignImages(wikicode); // commenting out, too many false positives in featured articles
		wikicode = this.correctCapitalizationOfEndMatterHeaders(wikicode);
		wikicode = this.ifNoLeadSectionDeleteFirstHeading(wikicode);
		wikicode = this.deleteCopyPastedEditAndEditSource(wikicode);
		wikicode = this.replaceUnicodeBulletsWithAsterisks(wikicode);
		wikicode = this.deleteEmptySections(wikicode);
		wikicode = this.fixHeadingsInAllCaps(wikicode);
		wikicode = this.deleteDuplicateReferencesSection(wikicode);
		wikicode = this.deleteBlankLinesBetweenBullets(wikicode);
		wikicode = this.removeUnderscoresFromWikilinks(wikicode);
		wikicode = this.removeBorderFromImagesInInfoboxes(wikicode);
		wikicode = this.removeExtraAFCSubmissionTemplates(wikicode);

		// all ==sections== should start with a capital letter
		// after swap, if citation has no spaces on either side, and is not touching two other citations, add a space on the right
		// strip [[File: from infobox's image field
			// example 1: | image               = [[File:SAMIR 1626.png|thumb|Samir Mohanty]]
			// example 2: | image               = [[File:SAMIR 1626.png]]
		// trim whitespace inside refs, e.g. <ref> abc </ref>
		// replace unreliable sources with {{cn}}.
			// if adjacent to other sources, just delete
			// if ref is used multiple times, account for that
		// duplicate citation fixer
		// move refs that are below {{Reflist}}, to above {{Reflist}}
		// move refs out of headings
		// delete AFC submission templates located mid-article, they end up self-hiding then appear as inexplicable whitespace. example: {{AfC submission|t||ts=20211212134609|u=Doezdemir|ns=118|demo=}}<!-- Important, do not remove this line before article has been created. -->
		// fix redundant wikilinks, e.g. [[Spotify|Spotify]]
		// change youtu.be to youtube.com, to avoid the blacklist. test: https://youtu.be/bnWHeRNIPiA
		// delete ©®™
		// convert all <references /> to {{Reflist}}. <references /> doesn't use two column format and looks weird with a large # of references
		// remove px from images, should use default

		// convert refs toward the end. we want deleteSomeHTMLTags() to run first, to get rid of <nowiki> tags around URLs
		wikicode = this.bareURLToRef(wikicode);
		wikicode = this.refShortLinkToLongLink(wikicode);
		wikicode = this.inlineExternalLinksToRefs(wikicode);
		wikicode = this.deleteSpacesInFrontOfRefs(wikicode);
		wikicode = this.deleteNewLinesBetweenRefs(wikicode);
		wikicode = this.swapRefPeriodWithPeriodRef(wikicode);
		
		// stuff we want to run at the end
		wikicode = this.fixDoublePeriod(wikicode); // need test cases. I've seen this one not work.
		wikicode = this.boldArticleTitle(wikicode, titleWithNamespaceAndSpaces);
		wikicode = this.trimEmptyLines(wikicode);
		wikicode = this.deleteMoreThanTwoEntersInARow(wikicode);
		return wikicode;
	}

	_escapeRegEx(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

	// surround bare URL's with <ref></ref>
	// Useful for seeing all URL's in the reflist section, and for CiteHighlighter ref quality highlighting
	bareURLToRef(wikicode) {
		return wikicode.replace(/^(http[^\n ]*) {0,}$/gm, "<ref>$1</ref>");
	}
	
	// in refs, turn [short links] into long links, so you can see the domain
	// also fixes <ref> link </ref> issues with extra spaces in the ref
	refShortLinkToLongLink(wikicode) {
		// <ref>[https://test.com''Test'']</ref>
		wikicode = wikicode.replace(/(<ref[^>]*>) {0,}\[ {0,}([^'\]]*)(''[^\]]*)\] {0,}(<\/ref>)/gm, '$1$2 $3$4');
		// <ref>[https://test.com Test]</ref>
		wikicode = wikicode.replace(/(<ref[^>]*>) {0,}\[ {0,}([^\]]*) {0,}\] {0,}(<\/ref>)/gm, '$1$2$3');
		return wikicode;
	}
	
	// convert inline external links to references
	inlineExternalLinksToRefs(wikicode) {
		let sectionsToSkip = ['External link', 'Further reading', 'Links'];
		let regExString = '== ?(?:';
		for ( let sectionToSkip of sectionsToSkip ) {
			regExString += sectionToSkip + '|';
		}
		regExString = regExString.slice(0, -1) + ')';
		let hasSectionToSkip = wikicode.match(new RegExp(regExString, 'i'));

		let sf = new StringFilter();

		if ( hasSectionToSkip ) {
			let regExToSplitArticle = new RegExp('((' + regExString + ').*$)', 'is');
			let topHalf = wikicode.replace(regExToSplitArticle, '');
			let bottomHalf = wikicode.match(regExToSplitArticle)[1];
			let buffer = sf.surgicalReplaceOutsideTags(/(?<!>|> )\[(http[^ \]]+) ?(.*?)\](?!<\/ref>| <\/ref>)/gm, '$2<ref>$1</ref>', topHalf, ['<ref', '{{'], ['</ref>', '/>', '}}']);
			wikicode = buffer + bottomHalf;
		} else {
			wikicode = sf.surgicalReplaceOutsideTags(/(?<!>|> )\[(http[^ \]]+) ?(.*?)\](?!<\/ref>| <\/ref>)/gm, '$2<ref>$1</ref>', wikicode, ['<ref', '{{'], ['</ref>', '/>', '}}']);
		}
		return wikicode;
	}
	
	// get rid of spaces in front of <refs>
	deleteSpacesInFrontOfRefs(wikicode) {
		return wikicode.replace(/(?<!(?:\||=)) {1,}<ref/gm, "<ref");
	}
	
	// get rid of any level 2 heading that contains the article's title
	// this takes care of 2 common cases: heading at the bottom next to the {{AFC Submission}} template, and heading at the top above the lead
	deleteHeadingsWithTitle(wikicode, titleWithNamespaceAndSpaces) {
		let headingNameToLookFor = titleWithNamespaceAndSpaces;
		headingNameToLookFor = headingNameToLookFor.replace(/^Draft:/, '');
		headingNameToLookFor = this._escapeRegEx(headingNameToLookFor);
		let regEx = new RegExp("^== ?"+headingNameToLookFor+" ?==\n", "gmi");
		wikicode = wikicode.replace(regEx, "");
		// now look for titles that contain Draft: at the beginning, too
		headingNameToLookFor = titleWithNamespaceAndSpaces;
		headingNameToLookFor = this._escapeRegEx(headingNameToLookFor);
		regEx = new RegExp("^== ?"+headingNameToLookFor+" ?==\n", "gmi");
		wikicode = wikicode.replace(regEx, "");
		return wikicode;
	}
	
	// remove wikilinks to article name
	// Example: if title is Draft:Menna Shahin, change [[Menna Shahin]] to Menna Shahin
	unlinkWikilinksToThisTitle(wikicode, titleWithNamespaceAndSpaces) {
		let wikilinkToLookFor = titleWithNamespaceAndSpaces;
		wikilinkToLookFor = wikilinkToLookFor.replace(/^Draft:/, '');
		wikilinkToLookFor = this._escapeRegEx(wikilinkToLookFor);
		let regEx = new RegExp("\\[\\[("+wikilinkToLookFor+")\\]\\]", "gm");
		wikicode = wikicode.replace(regEx, "$1");
		return wikicode;
	}
	
	// if located in the first paragraph, bold the article title
	boldArticleTitle(wikicode, titleWithNamespaceAndSpaces) {
		let titleToLookFor = titleWithNamespaceAndSpaces;
		titleToLookFor = titleToLookFor.replace(/^Draft:/, '');
		titleToLookFor = titleToLookFor.replace(/ \(.*?\)$/, '');
		titleToLookFor = this._escapeRegEx(titleToLookFor);
		// Don't bold the title if it's already bolded. Fixes a "bold twice" bug.
		let hasBoldedTitle = wikicode.match(new RegExp(`'''${titleToLookFor}'''`, 'i'));
		if ( hasBoldedTitle ) return wikicode;
		// Be pretty strict, to avoid adding ''' to image paths and infoboxes, which messes up the image. Also, only replace first match.
		let regEx = new RegExp("^(The )?("+titleToLookFor+")([ <,])", "mi");
		wikicode = wikicode.replace(regEx, "$1'''$2'''$3");
		return wikicode;
	}
	
	// /covid-19/i -> COVID-19
	// Careful of this string in URLs.
	capitalizeCOVID19(wikicode) {
		let sf = new StringFilter();
		wikicode = sf.surgicalReplaceOutsideTags(/ covid-19/gmi, ' COVID-19', wikicode, ['{{', '[['], ['}}', ']]']);
		wikicode = sf.surgicalReplaceOutsideTags(/\ncovid-19/gmi, "\nCOVID-19", wikicode, ['{{', '[['], ['}}', ']]']);
		return wikicode;
	}
	
	// remove bold from headings
	removeBoldFromHeadings(wikicode) {
		return wikicode.replace(/^(=.*)'''(.*)'''(.*=)$/gm, '$1$2$3');
	}
	
	// remove enter characters between <ref>s
	deleteNewLinesBetweenRefs(wikicode) {
		return wikicode.replace(/<\/ref>\n{1,}<ref>/gm, '<\/ref><ref>');
	}
	
	// convert ==Reference== to ==References==
	convertReferenceToReferences(wikicode) {
		return wikicode.replace(/^== ?Reference ?==$/gmi, '== References ==');
	}
	
	// TOOL  - swap ref period with period ref
	swapRefPeriodWithPeriodRef(wikicode) {
		wikicode = wikicode.replace(/((?:<ref[^>]*?>[^>]*?<\/ref>){1,})\. /gm, '.$1 ');
		wikicode = wikicode.replace(/((?:<ref[^>]*?>[^>]*?<\/ref>){1,})\.\n/gm, ".$1\n");
		return wikicode;
	}
	
	// fix errant spaces at beginning of lines, which makes a blockquote looking thing (AFCH does it)
	trimEveryLine(wikicode) {
		let output = '';
		let lines = wikicode.split("\n");
		let lineCount = lines.length;
		let i = 0;
		for ( let line of lines ) {
			i++;
			let trimmed = line.trim();
			if ( trimmed.startsWith('|') || trimmed.startsWith('}') ) { // don't trim lines that start with | or }. It is common in FAs to indent these a bit.
				output += line;
			} else {
				output += line.trim();
			}
			if ( i !== lineCount ) {
				output += "\n";
			}
		}
		return output;
	}
	
	// add references section if missing
	addReferencesSectionIfMissing(wikicode) {
		let hasRefSection = wikicode.match(/^== ?References ?==$/mi);
		let hasReflist = wikicode.match(/(?:{{Reflist|<references)/mi);
		if ( ! hasRefSection && ! hasReflist ) {
			let hasBottomAFCTemplate = wikicode.match(/(\n{{AfC submission[^}]*}}\s*)$/);
			if ( hasBottomAFCTemplate ) {
				wikicode = wikicode.replace(/(\n{{AfC submission[^}]*}}\s*)$/, "\n\n== References ==\n{{Reflist}}$1");
			} else {
				wikicode = wikicode.replace(/$/, "\n\n== References ==\n{{Reflist}}");
			}
		}
		return wikicode;
	}
	
	// fix empty references section
	fixEmptyReferencesSection(wikicode) {
		let hasRefSection = wikicode.match(/^== ?References ?==$/mi);
		let hasReflist = wikicode.match(/(?:{{Reflist|<references)/mi);
		if ( ! hasReflist && hasRefSection ) {
			wikicode = wikicode.replace(/(?<=== ?References ?==)/gmi, "\n{{Reflist}}");
		}
		return wikicode;
	}
	
	// delete whitespace at the end of lines
	// (?!\|)(?!\}\}) is to stop this from deleting spaces after = in infoboxes
	deleteWhitespaceAtEndOfLines(wikicode) {
		return wikicode.replace(/[ \t]+\n(?!\|)(?!\}\})/g, "\n");
	}
	
	// convert smart quotes to regular quotes
	convertSmartQuotesToRegularQuotes(wikicode) {
		let sf = new StringFilter();
		wikicode = sf.surgicalReplaceOutsideTags(/”/g, '"', wikicode, ['[[File:'], [']]']);
		wikicode = sf.surgicalReplaceOutsideTags(/“/g, '"', wikicode, ['[[File:'], [']]']);
		wikicode = sf.surgicalReplaceOutsideTags(/‘/g, "'", wikicode, ['[[File:'], [']]']);
		wikicode = sf.surgicalReplaceOutsideTags(/’/g, "'", wikicode, ['[[File:'], [']]']);
		wikicode = sf.surgicalReplaceOutsideTags(/…/g, '...', wikicode, ['[[File:'], [']]']);
		return wikicode;
	}
	
	// convert double spaces to single spaces
	convertDoubleSpacesToSingleSpaces(wikicode) {
		return wikicode.replace(/\. {2,}/g, '. ');
	}
	
	// remove blank heading
	deleteBlankHeadings(wikicode) {
		return wikicode.replace(/\n={2,} {0,}={2,}\n/g, "\n");
	}
	
	// Change year range dash to ndash. Skip text inside of [[File:
	changeYearRangeDashToNDash(wikicode) {
		let sf = new StringFilter();
		// (1111-1111)
		wikicode = sf.surgicalReplaceOutsideTags(/(\(\d{4}) ?- ?(\d{4}\))/gm, '$1–$2', wikicode, ['[[File:'], [']]']);
		//  1839 - 1926)
		wikicode = sf.surgicalReplaceOutsideTags(/( \d{4}) ?- ?(\d{4}\))/gm, '$1–$2', wikicode, ['[[File:'], [']]']);
		return wikicode;
	}
	
	// if in draftspace, and draft has categories, disable the categories
	disableCategoriesInDraftspace(wikicode, namespace) {
		let draft = (namespace == 118);
		if ( draft ) {
			wikicode = wikicode.replace(/:?(\[\[)(Category:[^\]]*\]\])/gm, '$1:$2');
		}
		return wikicode;
	}

	// delete <br> in drafts, these are usually poorly placed
	deleteBRTagsOutsideInfoboxes(wikicode) {
		let output = '';
		let lines = wikicode.split("\n");
		let lineCount = lines.length;
		let i = 0;
		for ( let line of lines ) {
			i++;
			// Skip lines that start with { or |. This is the easiest way to detect infoboxes
			if ( line.startsWith('{') || line.startsWith('|') ) {
				output += line;
			} else {
				output += line.replace(/\<br ?\/?\>/gm, '');
			}
			if ( i !== lineCount ) {
				output += "\n";
			}
		}
		return output;
	}
	
	// right align images
	rightAlignImages(wikicode) {
		return wikicode.replace(/(\[\[File:[^\]]*\|)left(\|[^\]]*\]\])/gm, '$1right$2');
	}
	
	// correct capitalization of see also, references, further reading, external links
	correctCapitalizationOfEndMatterHeaders(wikicode) {
		wikicode = wikicode.replace(/^(== ?)References( ?==)$/gmi, "$1References$2");
		wikicode = wikicode.replace(/^(== ?)External links( ?==)$/gmi, "$1External links$2");
		wikicode = wikicode.replace(/^(== ?)Further reading( ?==)$/gmi, "$1Further reading$2");
		wikicode = wikicode.replace(/^(== ?)See also( ?==)$/gmi, "$1See also$2");
		return wikicode;
	}
	
	// if article has headings but no lead, remove first heading
	ifNoLeadSectionDeleteFirstHeading(wikicode) {
		let output = '';
		let lines = wikicode.split("\n");
		let lineCount = lines.length;
		let i = 0;
		let textCount = 0;
		for ( let line of lines ) {
			i++;
			// scan for first heading.
			// empty lines, lines with templates, or lines with images do not count.
			if ( line.startsWith('{') || line.length === 0 || line.startsWith('[[File:') ) {
				output += line;
			} else if ( line.startsWith('==') && ! textCount ) {
				continue; // delete this line by not putting it in the output string
			} else {
				textCount++;
				output += line;
			}
			if ( i !== lineCount ) {
				output += "\n";
			}
		}
		return output;
	}
	
	// delete [edit], [edit source], and [editar] from headings
	deleteCopyPastedEditAndEditSource(wikicode) {
		wikicode = wikicode.replace(/\[edit\]( ?={2,})$/gm, '$1');
		wikicode = wikicode.replace(/\[edit source\]( ?={2,})$/gm, '$1');
		wikicode = wikicode.replace(/\[editar\]( ?={2,})$/gm, '$1');
		return wikicode;
	}
	
	// at beginning of lines, replace unicode bullets with asterisks
	replaceUnicodeBulletsWithAsterisks(wikicode) {
		return wikicode.replace(/^\s{0,}[·•●]\s{0,}/gm, '* ');
	}
	
	// remove whitespace if that is the only character on a line
	trimEmptyLines(wikicode) {
		return wikicode.replace(/^\s*$/gm, '');
	}
	
	// no more than 2 newlines (1 blank line) in a row. except stubs, which get 3 newlines (2 blank lines)
	// Note: AFCH does this too
	deleteMoreThanTwoEntersInARow(wikicode) {
		wikicode = wikicode.replace(/\n{3,}/gm, "\n\n");
		wikicode = wikicode.replace(/\n{2}(\{\{[^}]*stub\}\})/gi, '\n\n\n$1');
		return wikicode;
	}
	
	// convert =TitleHeading= to ==H2Heading==
	convertH1ToH2(wikicode) {
		return wikicode.replace(/^= ?([^=]*?) ?=$/gm, '== $1 ==');
	}

	convertVeryLongHeadingToParagraph(wikicode) {
		let output = '';
		let lines = wikicode.split("\n");
		let lineCount = lines.length;
		let i = 0;
		for ( let line of lines ) {
			i++;
			if ( line.length > 150 && line.match(/^==.*==$/gm) && ! line.match(/<ref/) ) {
				output += line.replace(/^={1,}\s*(.*?)\s*={1,}$/m, '$1');
			} else {
				output += line;
			}
			if ( i !== lineCount ) {
				output += "\n";
			}
		}
		return output;
	}

	fixWordEmphasizedWithSingleQuotes(wikicode) {
		return wikicode.replace(/ '(\w+)' /g, ' "$1" ');
	}

	fixDoublePeriod(wikicode) {
		return wikicode.replace(/(?<=[A-Za-z\]])\.\.(?=<ref| |\n)/g, '.');
	}

	fixWikilinksContainingURL(wikicode) {
		// non-piped wikilink
		wikicode = wikicode.replace(/\[\[https?:\/\/en\.(?:m\.)?wikipedia\.org\/wiki\/([^|]*)\]\]/g, '[[$1]]');
		// piped wikilink
		wikicode = wikicode.replace(/\[\[https?:\/\/en\.(?:m\.)?wikipedia\.org\/wiki\/([^|]*)\|([^\]]*)\]\]/g, '[[$1|$2]]');
		// non-piped external link
		wikicode = wikicode.replace(/\[\[(http[^|]*)\]\]/g, '[$1]');
		// piped external link
		wikicode = wikicode.replace(/\[\[(http[^|]*)\|([^\]]*)\]\]/g, '[$1 $2]');
		return wikicode;
	}

	fixExternalLinksToWikipediaArticles(wikicode) {
		// [https://en.wikipedia.org/wiki/Article] and [https://en.wikipedia.org/wiki/Article Article name]
		return wikicode.replace(/(?<!\[)\[https?:\/\/en\.wikipedia\.org\/wiki\/([^ \]]*)( [^\]]*)?\]/gs, function(match, p1) {
			p1 = decodeURIComponent(p1);
			p1 = p1.replace(/_/g, ' ');
			return `[[${p1}]]`;
		});
	}

	deleteBlankLinesBetweenBullets(wikicode) {
		let lines = wikicode.split('\n');
		let buffer = [];
		let length = lines.length;
		for ( let i = 0; i < length; i++ ) {
			let previous = lines[i-1];
			let current = lines[i];
			let next = lines[i+1];
			if (
				typeof previous !== 'undefined' &&
				typeof next !== 'undefined' &&
				previous.startsWith('*') &&
				current === '' &&
				next.startsWith('*')
			) {
				continue;
			}
			buffer.push(current);
		}
		return buffer.join('\n');
	}

	deleteWeirdUnicodeCharacters(wikicode) {
		return wikicode.replace(/[]/g, '');
	}

	deleteSomeHTMLTags(wikicode) {
		wikicode = wikicode.replace(/<\/?p( [^>]*)?\/?>/g, '');
		wikicode = wikicode.replace(/<\/?strong( [^>]*)?\/?>/g, '');
		wikicode = wikicode.replace(/<\/?em( [^>]*)?\/?>/g, '');
		wikicode = wikicode.replace(/<\/?nowiki( [^>]*)?\/?>/g, '');
		wikicode = wikicode.replace(/<\/?u( [^>]*)?\/?>/g, '');
		wikicode = wikicode.replace(/(?:<big>|<\/big>)/g, '');

		return wikicode;
	}

	fixHeadingsInAllCaps(wikicode) {
		// create a concatenated string with the text from every heading
		let matches = wikicode.matchAll(/== {0,}(.+) {0,}==/g);
		let headingString = '';
		for ( let match of matches ) {
			headingString += match[1];
		}

		// if string only contains caps
		if ( this._isUpperCase(headingString) ) {
			// convert all headings to sentence case
			let matches = wikicode.matchAll(/== {0,}(.+) {0,}==/g);
			for ( let match of matches ) {
				let matchRegex = this._escapeRegEx(match[1].trim());
				matchRegex = new RegExp('== {0,}' + matchRegex + ' {0,}==', 'g');
				let sentenceCase = this._toSentenceCase(match[1].trim());
				wikicode = wikicode.replace(matchRegex, '== ' + sentenceCase + ' ==');
			}
		}

		return wikicode;
	}

	deleteEmptySections(wikicode) {
		return wikicode.replace(/\n*== ?(?:See also|External links) ?==\n*$/, '');
	}

	deleteDuplicateReferencesSection(wikicode) {
		let matches = wikicode.match(/==\s*References\s*==/gi);
		if ( matches !== null && matches.length > 1 ) {
			// run regexes that are likely to delete the extra section
			let attempt = wikicode.replace(
`== References ==
<!-- Inline citations added to your article will automatically display here. See en.wikipedia.org/wiki/WP:REFB for instructions on how to add citations. -->
{{reflist}}`
			, '');
			let matches2 = attempt.match(/==\s*References\s*==/gi);
			if ( matches2.length === 1 ) {
				wikicode = attempt.trim();
				wikicode = wikicode.replace(/==\s*References\s*==/gi, '== References ==');
			}
		}
		return wikicode;
	}

	removeUnderscoresFromWikilinks(wikicode) {
		let sf = new StringFilter();
		wikicode = sf.surgicalReplaceInsideTags(/_/g, ' ', wikicode, ['[['], [']]']);
		return wikicode;
	}

	removeBorderFromImagesInInfoboxes(wikicode) {
		wikicode = wikicode.replace(/(\|\s*logo\s*=\s*)\[\[File:([^\]\|]*)[^\]\]]*\]\]/g, '$1$2');
		wikicode = wikicode.replace(/(\|\s*cover\s*=\s*)\[\[File:([^\]\|]*)[^\]\]]*\]\]/g, '$1$2');
		return wikicode;
	}

	/** These often hide towards the bottom of a draft. When the draft is submitted, unsubmitted templates (t) detect this and show up as blank, creating a weird extra line break. So this basically fixes the line break. */
	removeExtraAFCSubmissionTemplates(wikicode) {
		let hasSubmittedTemplate = wikicode.match(/{{AfC submission\|\|/);
		let hasUnsubmittedTemplate = wikicode.match(/{{AfC submission\|t\|/);
		if ( hasSubmittedTemplate && hasUnsubmittedTemplate ) {
			wikicode = wikicode.replace(/{{AfC submission\|t\|[^\}\}]*\}\}\n?/gm, '');
		}
		return wikicode;
	}

	deleteMultipleReferenceTags(wikicode) {
		let hasReflist = wikicode.match(/{{Reflist}}/i);
		let hasReferencesTag = wikicode.match(/<references ?\/>/i);
		if ( hasReflist && hasReferencesTag ) {
			// delete all references tags
			wikicode = wikicode.replace(/<references ?\/>\n?/gi, '');
		}
		return wikicode;
	}

	_isUpperCase(str) {
		return str === str.toUpperCase();
	}

	_toSentenceCase(string) {
		return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
	}
}