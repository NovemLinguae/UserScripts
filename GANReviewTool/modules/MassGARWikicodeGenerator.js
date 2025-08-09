import Parser from './Parser.js';
import { articleHistorySelector } from './GANReviewWikicodeGenerator.js';

export class MassGARWikicodeGenerator {
	hasGoodArticleTemplate( mainArticleWikicode ) {
		const gaTemplateNames = [ 'GA icon', 'GA article', 'Good article', 'Good Article' ];
		return this._wikicodeHasTemplate( mainArticleWikicode, gaTemplateNames );
	}

	talkPageIndicatesGA( talkPageWikicode ) {
		// Check for {{GA}}
		const gaTemplateNames = [ 'GA', 'Ga' ];
		if ( this._wikicodeHasTemplate( talkPageWikicode, gaTemplateNames ) ) {
			return true;
		}

		// Check for {{Article history|currentstatus=GA}}
		const root = Parser.parse( talkPageWikicode );
		/** @type {import('wikiparser-template').TranscludeToken | undefined} */
		const template = root.querySelector( articleHistorySelector );
		if ( template && template.getArg( 'currentstatus' ) ) {
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
		const selector = listOfTemplates.map( ( v ) => `template#Template:${ v.replace( / /g, '_' ) }` ).join();
		const root = Parser.parse( wikicode );
		return Boolean( root.querySelector( selector ) );
	}
}
