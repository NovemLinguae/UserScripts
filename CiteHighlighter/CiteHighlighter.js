// <nowiki>

class CiteHighlighter {
	constructor( window, $, mw ) {
		this.window = window;
		this.$ = $;
		this.mw = mw;
	}

	async execute() {
		this.sources = await this.getListOfSourcesAndRatings();
		this.unreliableWordsForOrangeHighlighting = this.getUnreliableWords();
		this.setConfigVariableDefaultsIfNeeded();
		this.articleTitle = this.mw.config.get( 'wgPageName' );
		if ( this.isSlowPage() ) {
			return;
		}
		this.highlightSourceListsMoreAggressively();
		this.highlightDraftsMoreAggressively();
		this.preventWikipediaFalsePositives();
		this.colors = this.getColors();
		this.writeCSS();
		this.wikicode = await this.getWikicode( this.articleTitle );
		this.addHTMLClassesToRefs();
		this.addHTMLClassesForUnreliableWords();
		this.observeAndAddClassesToTooltips();
	}

	getUnreliableWords() {
		// /(blog|blogspot|caard|\/comment|fandom|forum|preprint|railfan|thread|weebly|wix|wordpress|blockchain|crypto|innovative|podcast|about|newswire|release|announce|acquire)/gm
		return [
			'/comment',
			'about-me',
			'about-us',
			'/about/',
			'acquire',
			'announce',
			// 'blockchain',
			'blog', // by far the most common hit
			'blogspot',
			'businesswire',
			'caard', // caard.co - "Simple, free, fully responsive one-page sites for pretty much anything."
			'contact-us',
			'contactus',
			// 'crypto',
			'essay',
			'fandom',
			'/forum/',
			'google.com/search',
			'innovative',
			'newswire',
			'podcast',
			'/post/',
			'preprint',
			'press-release',
			'pressrelease',
			'prnews',
			'railfan',
			'sponsored',
			'thread',
			'user-review',
			'viewtopic',
			'weebly',
			'wix',
			'wordpress',
			'/wp-' // WordPress, e.g. wp-content
		];
	}

	async getListOfSourcesAndRatings() {
		let sources = await this.getWikicodeFromCache( 'User:Novem Linguae/Scripts/CiteHighlighter/SourcesJSON.js' );
		sources = JSON.parse( sources );
		return sources;
	}

	setConfigVariableDefaultsIfNeeded() {
		// Defaults
		this.config = {
			HighlightEverything: false,
			HighlightLighterColors: false,
			AlwaysHighlightSourceLists: false
		};

		// Override defaults if window.citeHighlighterXYZ is already set (typically at the top of the user's common.js file)
		for ( const key in this.config ) {
			const value = this.window[ 'citeHighlighter' + key ];
			if ( value !== undefined ) {
				this.config[ key ] = value;
			}
		}
	}

	/**
	 * Don't highlight certain pages, for speed and visual appearance reasons.
	 *
	 * On pages with a lot of links (watchlist, WP:FA), highlighting EVERYTHING will double the
	 * load time. e.g. watchlist 5 seconds -> 10 seconds.
	 *
	 * @return {boolean} isSlowPage
	 */
	isSlowPage() {
		if (
			this.mw.config.get( 'wgAction' ) === 'history' ||
			this.articleTitle === 'Main_Page' ||
			this.articleTitle === 'Wikipedia:Featured_articles' ||
			this.articleTitle === 'Special:Watchlist' ||
			this.articleTitle === 'Wikipedia:New_page_patrol_source_guide'
		) {
			return true;
		}

		return false;
	}

	/**
	 * If page is a source quality list, highlight everything, even if highlightEverything =
	 * false. Goal: easily see if the script is highlighting anything wrong.
	 */
	highlightSourceListsMoreAggressively() {
		const highlightEverythingList = [
			'Wikipedia:Reliable_sources/Perennial_sources',
			// 'Wikipedia:New_page_patrol_source_guide', // so slow that I hard-coded this never to load by placing a check in isSlowPage()
			'Wikipedia:WikiProject_Albums/Sources',
			'Wikipedia:WikiProject_Video_games/Sources#Reliable_sources',
			'Wikipedia:WikiProject_Anime_and_manga/Online_reliable_sources',
			'Wikipedia:WikiProject_Africa/Africa_Sources_List',
			'Wikipedia:WikiProject_Dungeons_%26_Dragons/References'
		];

		if ( this.config.AlwaysHighlightSourceLists ) {
			if ( highlightEverythingList.includes( this.articleTitle ) ) {
				this.config.HighlightEverything = true;
			}
		}
	}

	/**
	 * If page is a draft, highlight everything, as the # of links is small, and oftentimes
	 * inline citations are malformed
	 */
	highlightDraftsMoreAggressively() {
		if ( this.mw.config.get( 'wgNamespaceNumber' ) === 118 ) {
			this.config.HighlightEverything = true;
		}
	}

	/**
	 * If highlightEverything = true, delete wikipedia.org and wiktionary. Too many false positives.
	 */
	preventWikipediaFalsePositives() {
		if ( this.config.HighlightEverything ) {
			this.deleteAll( this.sources, 'en.wikipedia.org', 'wikipedia.org', 'wiktionary.org' );
			this.deleteFromArray( this.unreliableWordsForOrangeHighlighting, 'wiki' );
		}
	}

	getColors() {
		if ( this.config.LighterColors ) {
			return {
				unreliableWord: '#ffb347',
				preprint: '#ffcfd5',
				doi: 'transparent',
				medrs: '#63ff70',
				green: '#a6ffb9',
				yellow: '#ffffcc',
				red: '#ffcfd5'
			};
		} else {
			return {
				// in general, we give less reliable stuff more priority. so if one source list has it as yellow and another has it as red, we highlight it as red. that way we don't accidentally highlight something unreliable with a good color

				// order of these first 3 fixes an issue where published academic papers were being colored preprint red
				// lowest priority
				unreliableWord: '#ffb347', // orange for now, for easier testing. later will be red.
				preprint: 'lightcoral',
				doi: 'transparent',
				medrs: 'limegreen',
				green: 'lightgreen',
				yellow: 'khaki',
				red: 'lightcoral'
				// 'aggregator': 'plum', // turning off aggregator for now, red/yellow/green is nice and simple, purple makes the color scheme more complicated
				// highest priority
			};
		}
	}

	writeCSS() {
		for ( const key in this.colors ) {
			this.mw.util.addCSS( '.cite-highlighter-' + key + ' {background-color: ' + this.colors[ key ] + ';}' );
			this.mw.util.addCSS( '.rt-tooltipTail.cite-highlighter-' + key + '::after {background: ' + this.colors[ key ] + ';}' );
		}
	}

	addHTMLClassesToRefs() {
		for ( const color in this.colors ) {
			const colorIsMissing = typeof this.sources[ color ] === 'undefined';
			if ( colorIsMissing ) {
				continue;
			}

			for ( const source of this.sources[ color ] ) {
				// Don't check the DOM for every domain. Too expensive. Instead, examine the wikitext and only check the DOM for domains found in the wikitext.

				// alwaysIncludeDomains are domains that we should always write a CSS rule for, even if they are not found in the wikitext. This makes sure that domains in {{Cite}} templates are detected. For example, {{Cite journal}} uses nih.gov, and {{Cite tweet}} uses twitter.com
				const isAlwaysIncludeDomain = source === 'nih.gov' || source === 'twitter.com';

				if ( this.wikicode.includes( source ) || isAlwaysIncludeDomain ) {
					const isExternalLinkContainingDomainName = source.includes( '.' ) && !source.includes( ' ' );
					if ( isExternalLinkContainingDomainName ) {
						this.highlightCitation( source, color );
						this.highlightUnorderedListItem( source, color );

						if ( this.config.HighlightEverything ) {
							this.highlightExternalLinks( source, color );
						}
					}
				}
			}
		}
	}

	highlightCitation( source, color ) {
		// highlight whole cite
		// [title="source" i]... the "i" part is not working in :has() for some reason
		// use .toLowerCase() for now
		// using .addClass() instead of .css() or .attr('style') because I'm having issues getting medrs to override arXiv/Wikidata/other red sources
		this.$( 'li[id^="cite_note-"]' ).has( 'a[href*="/' + source.toLowerCase() + '"]' ).addClass( 'cite-highlighter-' + color );
		this.$( 'li[id^="cite_note-"]' ).has( 'a[href*=".' + source.toLowerCase() + '"]' ).addClass( 'cite-highlighter-' + color );
	}

	highlightUnorderedListItem( source, color ) {
		// Also support any {{Cite}} template inside an unordered list. For example, a works cited section supporting a references section consisting of "Smith 1986, pp. 573-574" type citations. Example: https://en.wikipedia.org/wiki/C._J._Cregg#Articles_and_tweets
		this.$( 'li' ).has( '.citation a[href*="/' + source.toLowerCase() + '"]' ).addClass( 'cite-highlighter-' + color );
		this.$( 'li' ).has( '.citation a[href*=".' + source.toLowerCase() + '"]' ).addClass( 'cite-highlighter-' + color );
	}

	highlightExternalLinks( source, color ) {
		// highlight external link only
		// !important; needed for highlighting PDF external links. otherwise the HTML that generates the PDF icon has higher specificity, and makes it transparent
		// [title="source" i]... the "i" means case insensitive. Default is case sensitive.
		this.mw.util.addCSS( '#bodyContent a[href*="/' + source + '" i] {background-color: ' + this.colors[ color ] + ' !important;}' );
		this.mw.util.addCSS( '#bodyContent a[href*=".' + source + '" i] {background-color: ' + this.colors[ color ] + ' !important;}' );
	}

	/**
	 * Observe and highlight popups created by the gadget Reference Tooltips.
	 */
	observeAndAddClassesToTooltips() {
		// TODO: switch from MutationObserver to mw.hook().add(). https://github.com/NovemLinguae/UserScripts/issues/167
		new MutationObserver( function () {
			const el = document.getElementsByClassName( 'rt-tooltip' )[ 0 ];
			if ( el ) {
				for ( const color in this.colors ) {
					if ( typeof this.sources[ color ] === 'undefined' ) {
						continue;
					}

					for ( const source of this.sources[ color ] ) {
						if ( this.wikicode.includes( source ) || source === 'nih.gov' || source === 'twitter.com' ) {
							if ( source.includes( '.' ) && !source.includes( ' ' ) ) {
								this.$( el ).has( `a[href*="${ source.toLowerCase() }"]` ).addClass( 'cite-highlighter-' + color );
								this.$( el ).has( `a[href*="${ source.toLowerCase() }"]` ).children().first().addClass( 'cite-highlighter-' + color );
							}
						}
					}
				}
			}
		} ).observe( document.body, {
			subtree: false,
			childList: true
		} );
	}

	/**
	 * Be more aggressive with this list of words. Doesn't have to be the domain name. Can be
	 * anywhere in the URL. Example unreliableWord: blog.
	 */
	addHTMLClassesForUnreliableWords() {
		for ( const word of this.unreliableWordsForOrangeHighlighting ) {
			const color = 'unreliableWord';
			if ( this.wikicode.includes( word ) ) {
				this.$( 'li[id^="cite_note-"]' ).has( 'a[href*="' + word.toLowerCase() + '"]' ).addClass( 'cite-highlighter-' + color );
				/* Too many false positives. Turning off for now. See https://github.com/NovemLinguae/UserScripts/issues/146 and https://github.com/NovemLinguae/UserScripts/issues/148
				if ( this.config.HighlightEverything ) {
					this.mw.util.addCSS('#bodyContent a[href*="'+word+'" i] {background-color: '+this.colors[color]+' !important;}');
				}
				*/
			}
		}
	}

	/**
	 * CAREFUL. This is case sensitive.
	 * @param {Object} haystack
	 * @param {...any} strings
	 */
	deleteAll( haystack, ...strings ) {
		for ( const string of strings ) {
			for ( const key in haystack ) {
				haystack[ key ] = this.deleteFromArray( haystack[ key ], string );
			}
		}
	}

	deleteFromArray( haystack, needle ) {
		const index = haystack.indexOf( needle );
		if ( index > -1 ) {
			haystack.splice( index, 1 );
		}
		return haystack;
	}

	async getWikicode( title ) {
		const pageIsDeleted = !this.mw.config.get( 'wgCurRevisionId' );
		if ( pageIsDeleted ) {
			return '';
		}

		const api = new this.mw.Api();
		const response = await api.get( {
			action: 'parse',
			page: title,
			prop: 'wikitext',
			formatversion: '2',
			format: 'json'
		} );
		return response.parse.wikitext;
	}

	async getWikicodeFromCache( title ) {
		// ForeignApi so that CiteHighlighter can be loaded on any wiki
		const api = new this.mw.ForeignApi( 'https://en.wikipedia.org/w/api.php' );
		const response = await api.get( {
			action: 'query',
			prop: 'revisions',
			titles: title,
			rvslots: '*',
			rvprop: 'content',
			formatversion: '2',
			uselang: 'content', // needed for caching
			smaxage: '86400', // cache for 1 day
			maxage: '86400' // cache for 1 day
		} );
		const wikicode = response.query.pages[ 0 ].revisions[ 0 ].slots.main.content;
		return wikicode;
	}
}

// TODO: Idea from chlod: use mw.hook("wikipage.content").add( () => { rehiglight(); } ); instead. will listen for VE finishes saving or the page gets reloaded in any way. Gets called multiple times by accident sometimes though, so need to be careful not to apply duplicate classes to HTML elements.
$( async function () {
	await mw.loader.using(
		[ 'mediawiki.util', 'mediawiki.api' ],
		async function () {
			await ( new CiteHighlighter( window, $, mw ) ).execute();
		}
	);
} );

// </nowiki>
