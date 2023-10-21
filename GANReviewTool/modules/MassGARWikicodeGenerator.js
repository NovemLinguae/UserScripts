export class MassGARWikicodeGenerator {
	hasGoodArticleTemplate(mainArticleWikicode) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');
		let gaTemplateNames = ['ga icon', 'ga article', 'good article'];
		return this._wikicodeHasTemplate(mainArticleWikicode, gaTemplateNames);
	}

	talkPageIndicatesGA(talkPageWikicode) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');

		// Check for {{GA}}
		let gaTemplateNames = ['GA'];
		if ( this._wikicodeHasTemplate(talkPageWikicode, gaTemplateNames) ) {
			return true;
		}

		// Check for {{Article history|currentstatus=GA}}
		// TODO: currently just checks for |currentstatus=GA anywhere on the page. Could improve this algorithm if there end up being false positives.
		let matches = talkPageWikicode.match(/\|\s*currentstatus\s*=\s*GA\b/i);
		if ( matches ) {
			return true;
		}
		return false;
	}

	hasOpenGAR(talkPageWikicode) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');
		let garTemplateNames = ['GAR/link'];
		return this._wikicodeHasTemplate(talkPageWikicode, garTemplateNames);
	}

	/**
	  * @param {string} wikicode
	  * @param {Array} listOfTemplates Case insensitive.
	  */
	_wikicodeHasTemplate(wikicode, listOfTemplates) {
		let stringForRegEx = listOfTemplates
			.map(v => this._regExEscape(v))
			.join('|');
		let regex = new RegExp(`{{(?:${stringForRegEx})\\b`, 'i');
		let matches = wikicode.match(regex);
		if ( matches ) {
			return true;
		}
		return false;
	}

	/**
	 * CC BY-SA 4.0, coolaj86, https://stackoverflow.com/a/6969486/3480193
	 */
	_regExEscape(string) {
		if ( arguments.length !== 1 ) throw new Error('Incorrect # of arguments');
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}
}