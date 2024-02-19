"use strict";

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

class NPPSG {
	constructor() {
		this.sources = {
			'preprint': [],
			'doi': [],
			'medrs': [],		// descending order, lowest reliability should be displayed
			'green': [],
			'yellow': [],
			'aggregator': [],	// let unreliable aggregators turn red, else purple
			'red': [],
		};
	}
	
	getOutput(input) {
		let lines = input.split("\n");
		let color = '';
		let matches = null;
		
		for ( let line of lines ) {
			// look for ==== X ==== or ===== X =====, if contains "Reliable" "Unreliable" "No consensus", set the color variable
			matches = line.match(/^; ?(reliable and \[\[wp:medrs\]\]|(generally )?reliable|(generally )?unreliable|not reliable|no consensus|reliability unclear|preprint)/i);
			if ( matches !== null ) {
				switch ( matches[1].toLowerCase() ) {
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
			matches = line.match(/(insufficient discussion|insufficient rsn discussion|insufficient participation|not enough mentions|per one editor)/i);
			if ( matches !== null ) continue;
			
			matches = line.match(/^== ?news aggregators/i);
			if ( matches !== null ) {
				color = 'aggregator';
				continue;
			}
			
			// don't process bullets if no color is set yet
			if ( ! color ) continue;
			
			// skip lines with no bullet
			if ( ! line.startsWith('*') ) continue;

			// look for external URL's. add all of them
			// handle both [url] and [url text text text]
			// strip out <ref></ref>, which may contain an external link that we don't want to grab
			line = line.replace(/<ref>.*?<\/ref>/g, '');
			matches = line.matchAll(/(?<!<ref>)\[(http[^ \]]*)/g);
			matches = Array.from(matches);
			for ( let match of matches ) {
				// match[1] = the 2nd column in the array, which is our capture group
				
				// strip out http:// https:// and www.
				match[1] = match[1].replace(/^https?:\/\//, '');
				match[1] = match[1].replace(/^www\./, '');

				// delete right side (everything from / to the end of the string)
				match[1] = match[1].replace(/\/.*$/, '');
				
				this.add(match[1], color);
			}
			
			// look for naked url's, *http, * http
			// look for naked text, *text, * text
				// if contains a forward slash, .split('/') it
			
			// TODO: grab stuff inside of <small>. it's delineated with , usually
		}
		
		this.alphabetizeAndEliminateDuplicates();
		this.fixSources();
		this.alphabetizeAndEliminateDuplicates();

		return this.prettyJSON(this.sources);
		// return JSON.stringify(this.sources);
	}
	
	/** case insensitive */
	alphabetize(array) {
		return array.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
	}
	
	alphabetizeAndEliminateDuplicates() {
		for ( let key in this.sources ) {
			this.sources[key] = this.alphabetize(this.sources[key]);
			this.sources[key] = this.eliminateDuplicates(this.sources[key]);
		}
	}
	
	fixSources() {
		// ALL CASE SENSITIVE
		
		// not helpful to highlight Wikipedia red in places such as the main page and infoboxes.
		// this.deleteAll('Wikipedia', 'wikipedia.org', 'en.wikipedia.org');
		
		// Highlighting Wikidata as unreliable is conflicting in situations when scholarly articles have both a DOI and a Wikidata ID, and there is no other highlight.
		this.deleteAll('Wikidata', 'wikidata.org');
		// TODO: deleteAll('arXiv') too?
		
		// not helpful to highlight book websites red, as it's usually used by inexperienced editors to link to books, which are usually reliable
		this.deleteAll('amazon.com', 'Amazon', 'Goodreads', 'goodreads.com');
		
		// make google.com and subdomains appear red. usually google searches used by inexperienced editors.
		// disable? too many false positives? i.e. maps.google.com should be yellow
		// this.sources.red.push('google.com', 'Google');

		// forbes.com is all 3 colors. override to yellow
		this.deleteAll('Forbes', 'forbes.com', 'Forbes.com');
		this.sources.yellow.push('Forbes', 'forbes.com');
		
		// the guardian is green and yellow. override to green
		this.deleteAll('Guardian', 'theguardian.com', 'theguardian.co.uk', 'guardian.co.uk');
		this.sources.green.push('Guardian', 'theguardian.com', 'theguardian.co.uk', 'guardian.co.uk');
		
		// huffpost is all 3 colors. override to yellow
		this.deleteAll('HuffPost', 'huffpost.com', 'huffingtonpost.com');
		this.sources.yellow.push('HuffPost', 'huffpost.com', 'huffingtonpost.com');

		// https://www.washingtonpost.com/monkey-cage/ is yellow, washingtonpost.com main domain is green. delete all, then add back as green
		this.deleteAll('washingtonpost.com');
		this.sources.green.push('washingtonpost.com');
		
		// cse.google.com is a false posiitive from a "useful links" section. delete.
		this.deleteAll('cse.google.com');
		
		// nih.gov contains the PubMed medical journal database. currently highlights ALL PubMed articles that are linked to nih.gov green. I guess this is OK. PubMed is respected.
		
		// acronyms & alt names
		this.sources.medrs.push('WHO');
		
		// can't add to NPPSG because of spam blacklist. add manually here.
		this.sources.red.push('breitbart.com', 'infowars.com', 'filmreference.com', 'verywellfamily.com', 'verywellhealth.com', 'verywellmind.com', 'nairaland.com', 'globalresearch.ca', 'rocketrobinsoccerintoronto.com', 'lulu.com', 'examiner.com', 'famousbirthdays.com', 'almanachdegotha.org', 'swarajyamag.com', 'opindia.com', 'rightlog.in', 'tfipost.com', 'southfront.org', 'thereligionofpeace.com', 'asianwiki.com', 'metal-observer.com', 'metalwani.com');
		this.sources.preprint.push('vixra.org');
		
		// give preprints at NPPSG their own category. that way they don't turn PubMed and DOI red
		this.deleteAll('bioRxiv', 'biorxiv.org', 'medRxiv', 'medrxiv.org', 'Preprints.org', 'preprints.org', 'Social Science Research Network', 'ssrn.com', 'ResearchGate', 'researchgate.net', 'arXiv', 'arxiv.org');
		this.sources.preprint.push('bioRxiv', 'biorxiv.org', 'medRxiv', 'medrxiv.org', 'Preprints.org', 'preprints.org', 'Social Science Research Network', 'ssrn.com', 'ResearchGate', 'researchgate.net', 'arXiv', 'arxiv.org');
		
		// this.sources.preprint.push('google.com'); // trick to properly highlight // Don't highlight google.com because then it catches google.com/books by accident.
		this.sources.doi.push('doi.org');
		// this.sources.aggregator.push('news.google.com', 'books.google.com'); // These don't need to be purple (i.e. needing to be replaced by better links). They can be un-highlighted.
		
		// GameSpot is red at WP film, green at WP video games. average it out to yellow
		this.deleteAll('GameSpot', 'gamespot.com');
		this.sources.yellow.push('GameSpot', 'gamespot.com');

		// Kirkus is green at RSP, Kirkus Indie is red at NPPSG. Average it out to yellow.
		this.deleteAll('kirkusreviews.com');
		this.sources.yellow.push('kirkusreviews.com');
	}
	
	/** CAREFUL. String is case sensitive. */
	deleteAll(...strings) {
		for ( let string of strings ) {
			for ( let key in this.sources ) {
				this.sources[key] = this.deleteFromArray(string, this.sources[key]);
			}
		}
	}
	
	deleteFromArray(needle, haystack) {
		const index = haystack.indexOf(needle);
		if (index > -1) {
			haystack.splice(index, 1);
		}
		return haystack;
	}
	
	add(name, color) {
		// no blank names
		if ( ! name ) return;
	
		this.addSimple(name, color);
		
		// if text has diacritics, convert to plaintext, then add that too
		let noDiacritics = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		if ( name !== noDiacritics ) {
			this.addSimple(noDiacritics, color);
		}
	}
	
	addSimple(name, color) {
		this.sources[color].push(name);
	}
	
	prettyJSON(input) {
		let output = JSON.stringify(input);
		
		// after every comma, put an enter
		output = output.replace(/\],/g, "],\n\n");
		
		return output;
	}
	
	eliminateDuplicates(array) {
		return [...new Set(array)];
	}
}

window.addEventListener('DOMContentLoaded', async function (e) {
	let inputTextArea = document.getElementById('input');
	let executeButton = document.getElementById('execute');
	let outputTextArea = document.getElementById('output');
		
	// inputTextArea.innerHTML should already have our sources loaded in it, grabbed from two pages onwiki. PHP does this for us. Had to do it in PHP because CORS policy does not let us do third party AJAX in JavaScript.

	let nppsg1 = new NPPSG();
	executeButton.addEventListener('click', function(e) {
		outputTextArea.value = nppsg1.getOutput(inputTextArea.value);
	});
	
	executeButton.dispatchEvent(new Event('click'));
});