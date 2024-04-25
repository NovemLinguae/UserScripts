// <nowiki>

class NPPLinks {
	/** add NPP, Earwig, WP:BEFORE, CSE, Wikipedia duplicate page links to left menu */
	execute() {
		this._setVariables();
		this._decideIfWeShouldUseLessLinks();
		this._setURIVariables( this.pageName, this.namespace );
		// this._debugURIVariables();
		this._setURLVariables();
		this._checkForArticlesInOtherLanguages();
		this._checkForForeignCharacters();
		// this._debugForeignCharacterDetection();
		this._generateLinks();
		this._insertHTML();
	}

	// TODO: convert to mw.util.addPortlet()
	_insertHTML() {
		const menuTitle = 'New page patrol';
		let html = '';
		const skin = mw.config.get( 'skin' );
		switch ( skin ) {
			case 'minerva':
				// TODO: insert into the "More" menu, rather than the hamburger

				html = `
					<ul id="p-npp-links">
						${ this.links }
					</ul>`;

				html = html.replace( /<li>/g, '<li class="menu__item--preferences">' );
				html = html.replace( /(<a[^>]*>)/g, '$1<span class="mw-ui-icon"></span><span>' );
				html = html.replace( /<\/a>/g, '<span></a>' );

				$( '#p-navigation' ).after( html );
				break;
			case 'monobook':
				html = `
					<div role="navigation" class="portlet mw-portlet mw-portlet-npp-links" id="p-npp-links" aria-labelledby="p-npp-links-label">
						<h3 id="p-npp-links-label">
							${ menuTitle }
						</h3>
						<div class="pBody">
							<ul>
								${ this.links }
							</ul>
						</div>
					</div>
				`;
				$( '#p-navigation' ).after( html );
				break;
			case 'modern':
				html = `
					<div class="portlet mw-portlet mw-portlet-npp-links" d="p-npp-links" role="navigation">
						<h3 id="p-npp-links-label" lang="en" dir="ltr">
							${ menuTitle }
						</h3>
						<div class="mw-portlet-body">
							<ul lang="en" dir="ltr">
								${ this.links }
							</ul>
						</div>
					</div>
				`;
				$( '#p-navigation' ).after( html );
				break;
			case 'timeless':
				html = `
					<div role="navigation" class="mw-portlet" id="p-npp-links" aria-labelledby="p-npp-links-label">
						<h3 id="p-npp-links-label" lang="en" dir="ltr">
							${ menuTitle }
						</h3>
						<div class="mw-portlet-body">
							<ul lang="en" dir="ltr">
								${ this.links }
							</ul>
						</div>
					</div>
				`;
				$( '#p-navigation' ).after( html );
				break;
			case 'vector-2022':
				html = `
					<nav id="p-npp-links" class="vector-main-menu-group vector-menu mw-portlet mw-portlet-interaction">
						<div class="vector-menu-heading">
							<span class="vector-menu-heading-label">
								${ menuTitle }
							</span>
						</div>
						<div class="vector-menu-content">
							<ul class="vector-menu-content-list">
								${ this.links }
							</ul>
						</div>
					</nav>
				`;
				$( '#p-navigation' ).after( html );
				break;
			case 'vector':
			default:
				html = `
					<nav id="p-npp-links" class="mw-portlet mw-portlet-npp-links vector-menu vector-menu-portal portal" aria-labelledby="p-npp-links-label" role="npp-links">
						<h3 id="p-npp-links-label" class="vector-menu-heading">
							${ menuTitle }
						</h3>
						<div class="vector-menu-content">
							<ul class="vector-menu-content-list">
								${ this.links }
							</ul>
						</div>
					</nav>
				`;
				$( '#p-navigation' ).after( html );
				break;
		}
	}

	_generateLinks() {
		// always display a link to Special:NewPagesFeed
		this.links += '<li><a href="/wiki/Special:NewPagesFeed">New pages feed</a></li>';

		// if on a page where NPPLinks should run (mainspace), display all the links, so the person can do WP:BEFORE
		if ( !this.lessLinks ) {
			this.links += `
				<li><a href="${ this.copyvioURL }" ${ this.sameTab }>Copyvio check</a></li>
				<li><a href="${ this.wikipediaDuplicateCheckURL }" ${ this.sameTab }>Duplicate article check</a></li>
				<li><a href="https://gptzero.me/" ${ this.sameTab }>AI/LLM check</a></li>
				<li><a href="${ this.webSearchURL }" ${ this.sameTab }>WP:BEFORE web</a></li>
				<li><a href="${ this.newsSearchURL }" ${ this.sameTab }>WP:BEFORE news</a></li>
				<li><a href="${ this.oldNewsSearchURL }" ${ this.sameTab }>WP:BEFORE news archive</a></li>
				<li><a href="${ this.bookSearchURL }" ${ this.sameTab }>WP:BEFORE books</a></li>
				<li><a href="${ this.journalSearchURL }" ${ this.sameTab }>WP:BEFORE scholar</a></li>
				${ this.messages }
				<li><a href="${ this.profileSearchURL }" ${ this.sameTab }>Professor (Google)</a></li>
				<li><a href="${ this.profileSearchURL2 }" ${ this.sameTab }>Professor (Scopus)</a></li>
				<li><a href="${ this.cseSearchURL }" ${ this.sameTab }>Reliable sources search</a></li>
				<li><a href="${ this.newsInTitleSearchURL }" ${ this.sameTab }>News (name in title)</a></li>
				<li><a href="${ this.wikidataSearchURL }" ${ this.sameTab }>Wikidata</a></li>
				<li><a href="${ this.catalogueOfLifeSearchURL }" ${ this.sameTab }>Species search</a></li>
			`;

			// TODO: purge page, so orphan count is correct
			// TODO: display message if orphan
			// TODO: display message if no categories
		}
	}

	_checkForForeignCharacters() {
		// WP:BEFORE foreign script search
		this.articleBody = $( '#mw-content-text' ).html();
		this.articleBody = this.articleBody.replace( /(<([^>]+)>)/gi, '' ); // remove HTML tags
		this.articleBody = this.articleBody.trim().split( 'Contents' )[ 0 ]; // lead only. trim everything after the word "Contents" (table of contents)
		const regEx = new RegExp( `^[${ this.listOfNonForeignCharacters }]*$`, '' );
		const ansiOnly = regEx.test( this.articleBody ); // the ones at the end are vietnamese
		if ( !ansiOnly ) {
			// Use an <a> tag with CSS to turn off the hyperlink. This is so that Minerva skin works correctly. Minerva always expects an <a> tag.
			this.messages += '<li><a style="pointer-events: none; cursor: default; color:black;">WP:BEFORE search for foreign name</a></li>\n';
		}
	}

	_checkForArticlesInOtherLanguages() {
		// WP:BEFORE wikis in other languages
		if ( $( '#p-lang li' ).length ) {
			// Use an <a> tag with CSS to turn off the hyperlink. This is so that Minerva skin works correctly. Minerva always expects an <a> tag.
			this.messages += '<li><a style="pointer-events: none; cursor: default; color:black;">WP:BEFORE check foreign wikis</a></li>\n';
		}
	}

	_setURLVariables() {
		this.copyvioURL = `https://copyvios.toolforge.org/?lang=en&project=wikipedia&title=${ this.underscores }`;
		this.webSearchURL = `https://www.google.com/search?q=${ this.quotedNoUnderscores }+-wikipedia.org`;
		this.bookSearchURL = `https://www.google.com/search?q=${ this.quotedNoUnderscores }&tbm=bks`;
		this.newsSearchURL = `https://www.google.com/search?q=${ this.quotedNoUnderscores }&tbm=nws`;
		this.newsInTitleSearchURL = `https://www.google.com/search?q=intitle:${ this.quotedNoUnderscores }&tbm=nws`;
		this.oldNewsSearchURL = `https://www.google.com/search?tbm=bks&tbs=bkt:s&source=newspapers&q=${ this.quotedNoUnderscores }`;
		this.journalSearchURL = `https://scholar.google.com/scholar?q=${ this.quotedNoUnderscores }`;
		this.profileSearchURL = `https://www.google.com/search?q=${ this.noUnderscoresNoParentheses }%20%22h-index%22`;
		this.profileSearchURL2 = `https://www.scopus.com/results/authorNamesList.uri?st1=${ this.lastName }&st2=${ this.firstName }`;
		this.cseSearchURL = `https://cse.google.com/cse?cx=007734830908295939403:galkqgoksq0&q=${ this.quotedNoUnderscores }`;
		this.wikipediaDuplicateCheckURL = `https://en.wikipedia.org/w/index.php?search=${ this.noUnderscores }&title=Special:Search&profile=advanced&fulltext=1&advancedSearch-current=%7B%7D&ns0=1`;
		this.wikidataSearchURL = `https://www.wikidata.org/w/index.php?search=${ this.quotedNoParentheses }&title=Special%3ASearch&go=Go&ns0=1&ns120=1`;
		this.catalogueOfLifeSearchURL = `https://www.catalogueoflife.org/data/search?facet=rank&facet=issue&facet=status&facet=nomStatus&facet=nameType&facet=field&facet=authorship&facet=extinct&facet=environment&limit=50&offset=0&q=${ this.noUnderscores }&sortBy=taxonomic`;
	}

	_setVariables() {
		// This is a preference the user can set in their common.js
		// @ts-ignore
		this.sameTab = window.NPPLinksSameTab ? '' : 'target="_blank"';

		// Here's some commonly used variables
		this.namespace = mw.config.get( 'wgNamespaceNumber' );
		this.pageName = mw.config.get( 'wgPageName' ); // has underscores instead of spaces. has namespace prefix
		this.listOfNonForeignCharacters = '\u0000-\u036f\ua792\u200b\u2009\u2061\u200e–—−▶◀•←†↓√≠≈→⋯’\u0020-\u002F\u0030-\u0039\u003A-\u0040\u0041-\u005A\u005B-\u0060\u0061-\u007A\u007B-\u007E\u00C0-\u00C3\u00C8-\u00CA\u00CC-\u00CD\u00D0\u00D2-\u00D5\u00D9-\u00DA\u00DD\u00E0-\u00E3\u00E8-\u00EA\u00EC-\u00ED\u00F2-\u00F5\u00F9-\u00FA\u00FD\u0102-\u0103\u0110-\u0111\u0128-\u0129\u0168-\u0169\u01A0-\u01B0\u1EA0-\u1EF9\u02C6-\u0323';
		this.messages = '';
		this.links = '';
	}

	/** Prints to console a list of foreign characters detected. Any characters in this list that aren't foreign characters, such as unicode whitespace characters or unicode symbols that aren't language-related, are bugs. The fix is to add them to the RegEx as an exception. */
	_debugForeignCharacterDetection() {
		console.log( this.articleBody );
		const regEx = new RegExp( `[^${ this.listOfNonForeignCharacters }]`, 'g' );
		const matches = this.articleBody.match( regEx );
		if ( matches ) {
			for ( const match of matches ) {
				console.log( match );
				console.log( match.charCodeAt( 0 ) );
			}
		}
	}

	_decideIfWeShouldUseLessLinks() {
		// only include most links for action = view and namespace = main, draft
		const action = mw.config.get( 'wgAction' );
		const desiredNamespace = [ 0, 118 ].includes( this.namespace );
		this.lessLinks = false;
		if ( action !== 'view' || !desiredNamespace ) {
			this.lessLinks = true;
		}
		const isAFD = this.pageName.startsWith( 'Wikipedia:Articles_for_deletion/' );
		if ( isAFD ) {
			this.lessLinks = false;
			this.pageName = this.pageName.replace( 'Wikipedia:Articles_for_deletion/', '' );
		}
	}

	_debugURIVariables() {
		console.log( this.underscores );
		console.log( this.pageNameNoNamespace );
		console.log( this.quotedName );
		console.log( this.quotedNoParentheses );
		console.log( this.quotedNoUnderscores );
		console.log( this.noUnderscores );
		console.log( this.quotedNoUnderscoresNoParentheses );
		console.log( this.noUnderscoresNoParentheses );
	}

	/** pageName has namespace, undescores, no quotes, parentheses */
	_buildURIComponent(
		wgPageName,
		wgNamespaceNumber,
		keepNamespace,
		keepUnderscores,
		wrapInDoubleQuotes,
		keepDisambiguator
	) {
		let output = wgPageName;

		// The order of all of these is important, because of RegEx patterns.

		if ( !keepNamespace && wgNamespaceNumber !== 0 ) {
			output = output.replace( /^.+?:/, '' );
		}

		if ( !keepDisambiguator ) {
			const matches = output.match( /^(.*)_\((.+?)\)$/ );
			if ( typeof matches !== 'undefined' && matches && matches[ 1 ] ) {
				output = matches[ 1 ];
			}
		}

		if ( wrapInDoubleQuotes ) {
			// If there's parentheses on the right, put the parentheses on the outside of the quotes, and remove the ( ) characters, but not their inner text
			const matches = output.match( /^(.*)_\((.+?)\)$/ );
			// if parentheses on the right
			if ( typeof matches !== 'undefined' && matches && matches[ 2 ] ) {
				output = '"' + matches[ 1 ] + '"_' + matches[ 2 ];
			} else {
				output = '"' + output + '"';
			}
		}

		if ( !keepUnderscores ) {
			output = output.replace( /_/g, ' ' );
		}

		output = encodeURIComponent( output );
		return output;
	}

	_setURIVariables( pageName, namespace ) {
		// Draft:Andrew_Hill_(pharmacologist)
		this.underscores = this._buildURIComponent( pageName, namespace, true, true, false, true );
		// Andrew_Hill_(pharmacologist)
		this.pageNameNoNamespace = this._buildURIComponent( pageName, namespace, false, true, false, true );
		// "Andrew_Hill"_pharmacologist
		this.quotedName = this._buildURIComponent( pageName, namespace, false, true, true, true );
		// "Andrew_Hill"
		this.quotedNoParentheses = this._buildURIComponent( pageName, namespace, false, true, true, false );
		// "Andrew Hill" pharmacologist
		this.quotedNoUnderscores = this._buildURIComponent( pageName, namespace, false, false, true, true );
		// Andrew Hill (pharmacologist)
		this.noUnderscores = this._buildURIComponent( pageName, namespace, false, false, false, true );
		// "Andrew Hill"
		this.quotedNoUnderscoresNoParentheses = this._buildURIComponent( pageName, namespace, false, false, true, false );
		// Andrew Hill
		this.noUnderscoresNoParentheses = this._buildURIComponent( pageName, namespace, false, false, false, false );
		// Andrew
		this.firstName = this._getFirstName( pageName );
		// Hill
		this.lastName = this._getLastName( pageName );
	}

	_getLastName( pageName ) {
		// TODO: this can probably be refactored to use this._buildURIComponent() to delete the underscores and disambiguators, then do the regex

		// underscores to spaces
		pageName = pageName.replace( '_', ' ' );

		// delete disambiguators, e.g. Andrew Hill (pharmacologist) -> Andrew Hill
		pageName = pageName.replace( / \([^)]+\)$/, '' );

		// RegEx test cases: https://regex101.com/r/PcmHrN/1
		const match = pageName.match( /\s?(\S+)$/ );
		if ( match && match[ 1 ] ) {
			// spaces, not underscores
			return encodeURIComponent( match[ 1 ] );
		}
		return '';
	}

	_getFirstName( pageName ) {
		// TODO: this can probably be refactored to use this._buildURIComponent() to delete the underscores and disambiguators, then do the regex

		// underscores to spaces
		pageName = pageName.replace( '_', ' ' );

		// delete disambiguators, e.g. Andrew Hill (pharmacologist) -> Andrew Hill
		pageName = pageName.replace( / \([^)]+\)$/, '' );

		// RegEx test cases: https://regex101.com/r/imLZ0j/1
		const match = pageName.match( /^(.*)\s\S+$/ );
		if ( match && match[ 1 ] ) {
			// spaces, not underscores
			return encodeURIComponent( match[ 1 ] );
		}
		return '';
	}
}

$( function () {
	( new NPPLinks() ).execute();
} );

// </nowiki>
