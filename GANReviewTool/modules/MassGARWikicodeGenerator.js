import { TemplateFinder } from './TemplateFinder.js';

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
		const templateFinder = new TemplateFinder( talkPageWikicode );
		const aliases = [ 'Articlehistory', 'Article milestones', 'Articlemilestones', 'Article History', 'ArticleHistory' ];
		const articleHistoryTemplate = templateFinder.firstTemplate( aliases );
		return Boolean(articleHistoryTemplate) && articleHistoryTemplate.getValue( 'currentstatus' )?.toUpperCase() === 'GA';
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
		const templateFinder = new TemplateFinder( wikicode );
		return templateFinder.hasTemplate( listOfTemplates );
	}
}
