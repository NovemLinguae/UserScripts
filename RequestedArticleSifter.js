//<nowiki>

// [[Wikipedia:Requested Articles]] Cleanup Tool
// When the user EDITS a page starting with [[Wikipedia:Requested articles/Business and economics/Companies]], this script adds a "Remove Bullets With Too Few References" button that the user can click.
// Clicking it will delete all bullets with 1 or 0 URL's, because these entries will not pass [[WP:GNG]].
// Certain things will safelist the bullet, including clerk endorsement, a link to a draft, and some other conditions.
// The [[WP:RA]] company lists are massive. So far, this tool has helped delete 150 companies that did not follow our submission instructions that require providing enough sources.

"use strict";

class CleanUp {
	constructor() {
		this.log = '';
		this.deleteCount = 0;
	}

	deleteTooFewReferences(code) {
		// \n{{ and \n== and \n*
		// templates, sections, and bullets (of bulleted list)
		let sectionDelimiters = /(\n\{\{|\n\=\=|\n\*)/g;
		
		// get strpos of every delimiter
		var result;
		let indices = [0];
		while ( (result = sectionDelimiters.exec(code)) ) {
			indices.push(result.index);
		}
		
		// Loop through every chunk.
		// A chunk is usually one line/bullet/entry, but can also be a section or a template.
		result = '';
		let deleteCount = 0;
		let safelistedCount = 0;
		let totalCount = 0;
		for ( let key in indices ) {
			// figure out the chunk
			let startPos = indices[key];
			let endPos = indices[(parseInt(key)+1).toString()] || code.length;
			let chunk = code.slice(startPos, endPos);
			
			// determine company name
			// skip this chunk if it's not a company name
			// *[[company name]]
			let companyNameRegEx = / *\* *\[\[(.+?)\]\]/;
			let companyName = chunk.match(companyNameRegEx);
			if ( ! companyName ) {
				result += chunk;
				continue;
			}
			companyName = companyName[1];
			totalCount++;
			
			// count number of links (by searching for http)
			// let countRegEx = /(<ref|(?<!\[)(?<!>)\[(?!\[)|[^\[>=\/]http)/g;
			// let countRegEx = /http/g;
			let countRegEx = /(http|<ref.+?<\/ref>)/g;
			let count = (chunk.match(countRegEx) || []).length;
			
			this.log += totalCount + " Company Name: " + companyName + " || Ref Count: " + count;
			
			/* skip if
				- clerk {{endorsed}} or {{likely}}
				- draft created
				- links to wikipedia articles in other languages
				- link to google search
			*/
			let safelistedRegEx = /({{[Ee]ndorse}}|{{[Ll]ikely}}|[Dd]raft|[^en]\.wikipedia\.org|google\.com\/search)/;
			let safelisted = chunk.match(safelistedRegEx);
			if ( safelisted ) {
				safelistedCount++;
				this.log += " || SAFELISTED ====================================\n";
				result += chunk;
				continue;
			}
			
			// delete?
			let remove = (count < 2);
			if ( remove ) {
				deleteCount++;
				this.log += " || DELETED ************************************\n";
			} else {
				result += chunk;
				this.log += "\n";
			}
		}
		
		this.log = "WP:RA Cleanup Tool - Debug Log\nDeleted Entries: " + deleteCount + "\nSafelisted: " + safelistedCount + "\nTotal Companies Before: " + totalCount + "\nTotal Companies After: " + (totalCount - deleteCount) + "\n\n" + this.log;
		
		this.deleteCount = deleteCount;
				
		return result;
	}
	
	getLog() {
		return this.log;
	}
	
	getEditSummary() {
		return this.deleteCount ? 'Delete '+this.deleteCount+' companies with insufficient sources (0 or 1 sources). Need at least 2, preferrably 3 or more, to prove [[WP:GNG]]. See also [[WP:3REFS]]. Using userscript [[User:Novem_Linguae/wp-ra.js]]' : '';
	}
}

// if correct page
let pageName = mw.config.get('wgPageName');
let isCompanyPage = pageName.startsWith('Wikipedia:Requested_articles/Business_and_economics/Companies');
let isEditPage = ( mw.config.get('wgAction') == 'edit' || mw.config.get('wgAction') == 'submit' /* edit preview */ );
if ( isCompanyPage && isEditPage ) {
	// create "Remove Bullets With Too Few References" button x2
	// must have type="button", or it will submit the form
	$('#bodyContent').prepend('<button type="button" class="wp-ra-button" style="margin-bottom: 1em;">Remove Bullets With Too Few References</button>');
	$('.editOptions').prepend(`<button type="button" class="wp-ra-button" style="margin-bottom: 1em;">Remove Bullets With Too Few References</button>
	
	<textarea id="wp-ra-log" style="display: none; height: 15em;"></textarea>
	`);
	
	$('.wp-ra-button').click(function(e) {
		let cu = new CleanUp();
		
		// execute script
		// replaces value of edit textarea with our modified wikicode
		let code = $('#wpTextbox1');
		code.val(cu.deleteTooFewReferences(code.val()));
		
		// display debug log
		$('#wp-ra-log').val(cu.getLog()).show();
		
		// set edit summary
		$('#wpSummary').val(cu.getEditSummary());
	});
}

/*

	TODO:
	- google search links should not be exempt
	- Look through other WP:RA's for weird formatting. Make sure this can handle that.
	- Need to handle nested bulleted lists.
	- make sure {{isbn|18927639821}} and {{ISBN|892037923}} are counted

*/
//</nowiki>