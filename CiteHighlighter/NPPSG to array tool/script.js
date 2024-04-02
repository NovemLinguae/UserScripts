'use strict';

/* TODO:
	- have this tool pre-generate a CSS file. would be quicker in browser
	- This section is missing a lot of highlights for some reason:
		- https://en.wikipedia.org/wiki/Talk:Rohingya_genocide#Additional_major_media_&_official_sources_on_the_%22genocide%22
		- New York Times, Wall Street Journal, Washington Post - not recognized because missing "the"
		- The Epoch Times - not recognized because has "the"
		- BBC News - missing "News"
		- National Public Radio - "NPR" is on the list
	- move Amazon.com to purple section. usually people linking to books.
	- nccih.nih.gov should be yellow, not medrs dark green
	- trim common language and generic subdomains:
		- english, en, secure, shop, store
	- truncate :80 from end of domain
	- preprints such as bioarXiv can get DOI numbers. may need attention.
*/

class SourceListWikitextToJson {
	constructor() {
		this.sources = {
			preprint: [],
			doi: [],
			medrs: [], // descending order, lowest reliability should be displayed
			green: [],
			yellow: [],
			aggregator: [], // let unreliable aggregators turn red, else purple
			red: []
		};
	}

	getJson( input ) {
		const lines = input.split( '\n' );
		let color = '';
		let matches = null;

		for ( let line of lines ) {
			// look for ==== X ==== or ===== X =====, if contains "Reliable" "Unreliable" "No consensus", set the color variable
			matches = line.match( /^; ?(reliable and \[\[wp:medrs\]\]|(generally )?reliable|(generally )?unreliable|not reliable|no consensus|reliability unclear|preprint)/i );
			if ( matches !== null ) {
				switch ( matches[ 1 ].toLowerCase() ) {
					case 'reliable and [[wp:medrs]]':
						color = 'medrs';
						break;
					case 'generally reliable':
					case 'reliable':
						color = 'green';
						break;
					case 'unreliable':
					case 'not reliable':
					case 'generally unreliable':
					case 'reliability unclear':
						color = 'red';
						break;
					case 'no consensus':
						color = 'yellow';
						break;
					case 'preprint':
						color = 'preprint';
						break;
				}

				continue;
			}

			// Skip lines with insufficient discussion. We want these to appear with no highlight, not with a yellow highlight.
			matches = line.match( /(insufficient discussion|insufficient rsn discussion|insufficient participation|not enough mentions|per one editor)/i );
			if ( matches !== null ) {
				continue;
			}

			matches = line.match( /^== ?news aggregators/i );
			if ( matches !== null ) {
				color = 'aggregator';
				continue;
			}

			// don't process bullets if no color is set yet
			if ( !color ) {
				continue;
			}

			// skip lines with no bullet
			if ( !line.startsWith( '*' ) ) {
				continue;
			}

			// look for external URL's. add all of them
			// handle both [url] and [url text text text]
			// strip out <ref></ref>, which may contain an external link that we don't want to grab
			line = line.replace( /<ref>.*?<\/ref>/g, '' );
			matches = line.matchAll( /(?<!<ref>)\[(http[^ \]]*)/g );
			matches = Array.from( matches );
			for ( const match of matches ) {
				// match[1] = the 2nd column in the array, which is our capture group

				// strip out http:// https:// and www.
				match[ 1 ] = match[ 1 ].replace( /^https?:\/\//, '' );
				match[ 1 ] = match[ 1 ].replace( /^www\./, '' );

				// delete right side (everything from / to the end of the string)
				match[ 1 ] = match[ 1 ].replace( /\/.*$/, '' );

				this.add( match[ 1 ], color );
			}

			// look for naked url's, *http, * http
			// look for naked text, *text, * text
			// if contains a forward slash, .split('/') it

			// TODO: grab stuff inside of <small>. it's delineated with , usually
		}

		this.alphabetizeAndEliminateDuplicates();
		this.fixSources();
		this.alphabetizeAndEliminateDuplicates();

		return this.makeJsonPretty( this.sources );
		// return JSON.stringify(this.sources);
	}

	/**
	 * case insensitive
	 * @param {Array} array
	 * @return {Array}
	 */
	alphabetize( array ) {
		return array.sort( ( a, b ) => a.localeCompare( b, undefined, { sensitivity: 'base' } ) );
	}

	alphabetizeAndEliminateDuplicates() {
		for ( const key in this.sources ) {
			this.sources[ key ] = this.alphabetize( this.sources[ key ] );
			this.sources[ key ] = this.eliminateDuplicates( this.sources[ key ] );
		}
	}

	fixSources() {
		// ALL CASE SENSITIVE

		// Highlighting Wikidata as unreliable is conflicting in situations when scholarly articles have both a DOI and a Wikidata ID, and there is no other highlight.
		this.deleteAll( 'wikidata.org' );

		// not helpful to highlight book websites red, as it's usually used by inexperienced editors to link to books, which are usually reliable
		this.deleteAll( 'amazon.com', 'goodreads.com' );

		// forbes.com is all 3 colors. override to yellow
		this.deleteAll( 'forbes.com', 'Forbes.com' );
		this.sources.yellow.push( 'forbes.com' );

		// the guardian is green and yellow. override to green
		this.deleteAll( 'theguardian.com', 'theguardian.co.uk', 'guardian.co.uk' );
		this.sources.green.push( 'theguardian.com', 'theguardian.co.uk', 'guardian.co.uk' );

		// huffpost is all 3 colors. override to yellow
		this.deleteAll( 'huffpost.com', 'huffingtonpost.com' );
		this.sources.yellow.push( 'huffpost.com', 'huffingtonpost.com' );

		// https://www.washingtonpost.com/monkey-cage/ is yellow, washingtonpost.com main domain is green. delete all, then add back as green
		this.deleteAll( 'washingtonpost.com' );
		this.sources.green.push( 'washingtonpost.com' );

		// cse.google.com is a false posiitive from a "useful links" section. delete.
		this.deleteAll( 'cse.google.com' );

		// can't add to NPPSG because of spam blacklist. add manually here.
		this.sources.red.push( 'breitbart.com', 'infowars.com', 'filmreference.com', 'verywellfamily.com', 'verywellhealth.com', 'verywellmind.com', 'nairaland.com', 'globalresearch.ca', 'rocketrobinsoccerintoronto.com', 'lulu.com', 'examiner.com', 'famousbirthdays.com', 'almanachdegotha.org', 'swarajyamag.com', 'opindia.com', 'rightlog.in', 'tfipost.com', 'southfront.org', 'thereligionofpeace.com', 'asianwiki.com', 'metal-observer.com', 'metalwani.com' );
		this.sources.preprint.push( 'vixra.org' );

		// give preprints at NPPSG their own category. that way they don't turn PubMed and DOI red
		this.deleteAll( 'biorxiv.org', 'medrxiv.org', 'preprints.org', 'ssrn.com', 'researchgate.net', 'arxiv.org' );
		this.sources.preprint.push( 'biorxiv.org', 'medrxiv.org', 'preprints.org', 'ssrn.com', 'researchgate.net', 'arxiv.org' );

		this.sources.doi.push( 'doi.org' );

		// GameSpot is red at WP film, green at WP video games. average it out to yellow
		this.deleteAll( 'gamespot.com' );
		this.sources.yellow.push( 'gamespot.com' );

		// Kirkus is green at RSP, Kirkus Indie is red at NPPSG. Average it out to yellow.
		this.deleteAll( 'kirkusreviews.com' );
		this.sources.yellow.push( 'kirkusreviews.com' );
	}

	/**
	 * CAREFUL. String is case sensitive.
	 * @param {...any} strings
	 */
	deleteAll( ...strings ) {
		for ( const string of strings ) {
			for ( const key in this.sources ) {
				this.sources[ key ] = this.deleteFromArray( string, this.sources[ key ] );
			}
		}
	}

	deleteFromArray( needle, haystack ) {
		const index = haystack.indexOf( needle );
		if ( index > -1 ) {
			haystack.splice( index, 1 );
		}
		return haystack;
	}

	add( name, color ) {
		// no blank names
		if ( !name ) {
			return;
		}

		this.addSimple( name, color );

		// if text has diacritics, convert to plaintext, then add that too
		const noDiacritics = name.normalize( 'NFD' ).replace( /[\u0300-\u036f]/g, '' );
		if ( name !== noDiacritics ) {
			this.addSimple( noDiacritics, color );
		}
	}

	addSimple( name, color ) {
		this.sources[ color ].push( name );
	}

	makeJsonPretty( input ) {
		// the third parameter being '\t' results in output with line breaks and tabs, which is what I want, for easier-to-read diffs onwiki
		const output = JSON.stringify( input, null, '\t' );
		return output;
	}

	eliminateDuplicates( array ) {
		return [ ...new Set( array ) ];
	}
}

window.addEventListener( 'DOMContentLoaded', async function () {
	// This input textarea already contains the wikitext source of both NPPSG and AllSourcesExceptNPPSG. See PHP file for the code that fetches that wikitext. Had to do it in PHP due to CORS policy.
	const inputTextArea = document.getElementById( 'input' );
	const executeButton = document.getElementById( 'execute' );
	const outputTextArea = document.getElementById( 'output' );

	executeButton.addEventListener( 'click', function () {
		outputTextArea.value = ( new SourceListWikitextToJson() ).getJson( inputTextArea.value );
	} );

	executeButton.dispatchEvent( new Event( 'click' ) );
} );
