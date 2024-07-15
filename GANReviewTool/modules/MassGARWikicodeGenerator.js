export class MassGARWikicodeGenerator {
	hasGoodArticleTemplate( mainArticleWikicode ) {
		const gaTemplateNames = [ 'ga icon', 'ga article', 'good article' ];
		return this._wikicodeHasTemplate( mainArticleWikicode, gaTemplateNames );
	}

	talkPageIndicatesGA( talkPageWikicode ) {
		// Check for {{GA}}
		const gaTemplateNames = [ 'GA' ];
		if ( this._wikicodeHasTemplate( talkPageWikicode, gaTemplateNames ) ) {
			return true;
		}

		// Check for {{Article history|currentstatus=GA}}
		// TODO: currently just checks for |currentstatus=GA anywhere on the page. Could improve this algorithm if there end up being false positives.
		const matches = talkPageWikicode.match( /\|\s*currentstatus\s*=\s*GA\b/i );
		if ( matches ) {
			return true;
		}
		return false;
	}

	hasOpenGAR( talkPageWikicode ) {
		const garTemplateNames = [ 'GAR/link' ];
		return this._wikicodeHasTemplate( talkPageWikicode, garTemplateNames );
	}

	/**
	 * @param {string} wikicode
	 * @param {Array} listOfTemplates Case insensitive.
	 */
	_wikicodeHasTemplate( wikicode, listOfTemplates ) {
		const stringForRegEx = listOfTemplates
			.map( ( v ) => this._regExEscape( v ) )
			.join( '|' );
		const regex = new RegExp( `{{(?:${ stringForRegEx })\\b`, 'i' );
		const matches = wikicode.match( regex );
		if ( matches ) {
			return true;
		}
		return false;
	}

	/**
	 * @copyright coolaj86, CC BY-SA 4.0 https://stackoverflow.com/a/6969486/3480193
	 */
	_regExEscape( string ) {
		return string.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ); // $& means the whole matched string
	}
}
