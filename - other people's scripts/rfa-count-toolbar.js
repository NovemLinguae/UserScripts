// Forked from https://en.wikipedia.org/w/index.php?title=User:Enterprisey/rfa-count-toolbar.js&oldid=880750020

( function () {
	const RFA_PG = 'Wikipedia:Requests for adminship';

	/**
	 * Gets the wikitext of a page with the given title (namespace required).
	 */
	function getWikitext( title ) {
		return $.getJSON(
			mw.util.wikiScript( 'api' ),
			{
				format: 'json',
				action: 'query',
				prop: 'revisions',
				rvprop: 'content',
				rvslots: 'main',
				rvlimit: 1,
				titles: title
			}
		).then( ( data ) => {
			const pageId = Object.keys( data.query.pages )[ 0 ];
			if ( data.query.pages[ pageId ].revisions ) {
				return { title: data.query.pages[ pageId ].title, content: data.query.pages[ pageId ].revisions[ 0 ].slots.main[ '*' ] };
			}
			return {};
		} );
	}

	/**
	 * This function converts any (index-able) iterable into a list.
	 */
	function iterableToList( nl ) {
		const len = nl.length;
		const arr = new Array( len );
		for ( let i = 0; i < len; i++ ) {
			arr[ i ] = nl[ i ];
		}
		return arr;
	}

	function numMatches( re, text ) {
		let count = 0;
		while ( re.exec( text ) !== null ) {
			count++;
		}
		return count;
	}

	function wikitextToVoteCounts( pageText ) {
		// Strip struck stuff
		// If we're striking stuff longer than 50 chars, it's
		// probably a malformed tag (left unclosed, maybe)
		pageText = pageText.replace( /<s>[\s\S]+?<\/s>/g, ( match ) => match.length < 50 ? '' : match );

		// Strip <ins> tags, because they confuse the parser too
		pageText = pageText.replace( /<ins>([\s\S]+?)<\/ins>/g, '$1' );

		console.log( pageText );

		const supportIndex = pageText.search( /===== ?Support ?=====/ ),
			opposeIndex = pageText.search( /===== ?Oppose ?=====/ ),
			neutralIndex = pageText.search( /===== ?Neutral ?=====/ ),
			generalCommentsIndex = pageText.search( /===== ?General comments ?=====/ ),
			sections = [
				pageText.substring( supportIndex, opposeIndex ),
				pageText.substring( opposeIndex, neutralIndex ),
				pageText.substring( neutralIndex, generalCommentsIndex ) ];

		const bulletRegEx = /^\s*#[^#:*]/mg;
		const counts = Array( 3 );
		for ( let i = 0; i < 3; i++ ) {
			counts[ i ] = sections[ i ].indexOf( '(UTC)' ) >= 0 ?
				numMatches( bulletRegEx, sections[ i ] ) : 0;
		}
		return { support: counts[ 0 ], oppose: counts[ 1 ], neutral: counts[ 2 ] };
	}

	function rfaWikitextToLinkLabel( wikitext ) {
		const voteCounts = wikitextToVoteCounts( wikitext );
		return voteCounts.support + '/' + voteCounts.oppose + '/' + voteCounts.neutral;
	}

	$.when(
		mw.loader.using( 'mediawiki.util' ),
		$.ready
	).then( () => getWikitext( RFA_PG ) ).then( ( rfaWikitext ) => {
		const rfaTemplateRegEx = /\{\{(Wikipedia:Requests for adminship\/.+?)\}\}/g;
		const rfaMatches = rfaWikitext.content.match( rfaTemplateRegEx );

		// The first one is always /Header, and the last one is
		// always /bureaucratship
		if ( rfaMatches.length > 2 ) {
			const pages = rfaMatches.slice( 1, -1 );
			const wikitexts = pages.map( ( p ) => getWikitext( p.slice( 2, -2 ) ) );
			$.when.apply( $, wikitexts ).then( function () {
				iterableToList( arguments ).forEach( ( revObj, rfaIdx ) => {
					mw.util.addPortletLink(
						'p-personal',
						mw.util.getUrl( revObj.title ),
						rfaWikitextToLinkLabel( revObj.content ),
						'pt-rfa-' + rfaIdx,
						revObj.title,
						null,
						'#pt-mytalk'
					);
				} );
			} );
		}
	} );
}() );
