// <nowiki>

/*
var request = require('request').defaults({jar: true}),
    url = "https://en.wikipedia.org/w/api.php";

function purge(title) {
    var params = {
        action: "purge",
        titles: title,
        format: "json"
    };

    request.post({ url: url, form: params }, function (error, res, body) {
        if (error) {
            return;
        }
        console.log(body);
    });
}

function escapeDoubleQuotes(input) {
	return input.replace(/"/g, '&quot;');
}
*/

/** pageName has namespace, undescores, no quotes, parentheses */
function buildURIComponent(wgPageName, wgNamespaceNumber, namespace, underscores, quotes, parentheses) {
	let output = wgPageName;
	
	// The order of all of these is important, because of RegEx patterns.
	
	if ( ! namespace && wgNamespaceNumber != 0 ) output = output.replace(/^.+?:/, '');
	
	if ( ! parentheses ) {
		let matches = output.match(/^(.*)_\((.+?)\)$/);
		if ( typeof matches !== 'undefined' && matches && matches[1] ) {
			output = matches[1];
		}
	}
	
	if ( quotes ) {
		// If there's parentheses on the right, put the parentheses on the outside of the quotes, and remove the ( ) characters, but not their inner text
		let matches = output.match(/^(.*)_\((.+?)\)$/);
		// if parentheses on the right
		if ( typeof matches !== 'undefined' && matches && matches[2] ) {
			output = '"' + matches[1] + '"_' + matches[2];
		} else {
			output = '"' + output + '"';
		}
	}
	
	if ( ! underscores ) output = output.replace(/_/g, ' ');
	
	output = encodeURIComponent(output);
	return output;
}

let sameTab = window.NPPLinksSameTab ? '' : 'target="_blank"';

// add NPP, Earwig, WP:BEFORE, CSE, Wikipedia duplicate page links to left menu
$(function() {
	// only include most links for action = view and namespace = main, draft
	let action = mw.config.get('wgAction');
	let namespace = mw.config.get('wgNamespaceNumber');
	let desiredNamespace = [0, 118].includes(namespace);
	let lessLinks = false;
	if ( action != 'view' || ! desiredNamespace ) {
		lessLinks = true;
	}
	let pageName = mw.config.get('wgPageName'); // has underscores instead of spaces. has namespace prefix
	let isAFD = pageName.startsWith('Wikipedia:Articles_for_deletion/');
	if ( isAFD ) {
		lessLinks = false;
		pageName = pageName.replace('Wikipedia:Articles_for_deletion/', '');
	}
	
	// Draft:Andrew_Hill_(pharmacologist)
	let underscores = 						buildURIComponent(pageName, namespace, true, true, false, true);
	// Andrew_Hill_(pharmacologist)
	let pageNameNoNamespace = 				buildURIComponent(pageName, namespace, false, true, false, true);
	// "Andrew_Hill"_pharmacologist
	let quotedName = 						buildURIComponent(pageName, namespace, false, true, true, true);
	// "Andrew_Hill"
	let quotedNoParentheses = 				buildURIComponent(pageName, namespace, false, true, true, false);
	// "Andrew Hill" pharmacologist
	let quotedNoUnderscores = 				buildURIComponent(pageName, namespace, false, false, true, true);
	// Andrew Hill (pharmacologist)
	let noUnderscores = 					buildURIComponent(pageName, namespace, false, false, false, true);
	// "Andrew Hill"
	let quotedNoUnderscoresNoParentheses = 	buildURIComponent(pageName, namespace, false, false, true, false);
	// Andrew Hill
	let noUnderscoresNoParentheses = 		buildURIComponent(pageName, namespace, false, false, false, false);
	
	/*
	console.log(underscores);
	console.log(pageNameNoNamespace);
	console.log(quotedName);
	console.log(quotedNoParentheses);
	console.log(quotedNoUnderscores);
	console.log(noUnderscores);
	console.log(quotedNoUnderscoresNoParentheses);
	console.log(noUnderscoresNoParentheses);
	*/
	
	let copyvioURL = 'https://tools.wmflabs.org/copyvios/?lang=en&project=wikipedia&title='+underscores;
	let webSearchURL = 'https://www.google.com/search?q='+quotedNoUnderscores+'+-wikipedia.org';
	let bookSearchURL = 'https://www.google.com/search?q='+quotedNoUnderscores+'&tbm=bks';
	let newsSearchURL = 'https://www.google.com/search?q='+quotedNoUnderscores+'&tbm=nws';
	let newsInTitleSearchURL = 'https://www.google.com/search?q=intitle:'+quotedNoUnderscores+'&tbm=nws';
	let oldNewsSearchURL = 'https://www.google.com/search?q='+quotedNoUnderscores+'%20site:news.google.com/newspapers';
	let journalSearchURL = 'https://scholar.google.com/scholar?q='+quotedNoUnderscores+'';
	// let profileSearchURL = 'https://scholar.google.com/citations?hl=en&view_op=search_authors&mauthors='+quotedNoUnderscoresNoParentheses+'';
	let profileSearchURL = 'https://www.google.com/search?q='+noUnderscoresNoParentheses+'%20%22h-index%22';
	let cseSearchURL = 'https://cse.google.com/cse?cx=007734830908295939403:galkqgoksq0&q='+quotedNoUnderscores+'';
	let wikipediaDuplicateCheckURL = 'https://en.wikipedia.org/w/index.php?search='+noUnderscores+'&title=Special:Search&profile=advanced&fulltext=1&advancedSearch-current=%7B%7D&ns0=1';
	let wikidataSearchURL = `https://www.wikidata.org/w/index.php?search=${quotedNoParentheses}&title=Special%3ASearch&go=Go&ns0=1&ns120=1`
	
	let messages = '';
	
	// WP:BEFORE wikis in other languages
	if ( $('#p-lang li').length ) {
		messages += "<li>WP:BEFORE check foreign wikis</li>\n";
	}
	
	// WP:BEFORE foreign script search
	let articleBody = $('#mw-content-text').html();
	articleBody = articleBody.replace(/(<([^>]+)>)/gi, ''); // remove HTML tags
	articleBody = articleBody.trim().split('Contents')[0]; // lead only. trim everything after the word "Contents" (table of contents)
	let ansiOnly = /^[\u0000-\u036f\ua792\u200b\u2009\u2061\u200e–—−▶◀•←†↓√≠≈→⋯’\u0020-\u002F\u0030-\u0039\u003A-\u0040\u0041-\u005A\u005B-\u0060\u0061-\u007A\u007B-\u007E\u00C0-\u00C3\u00C8-\u00CA\u00CC-\u00CD\u00D0\u00D2-\u00D5\u00D9-\u00DA\u00DD\u00E0-\u00E3\u00E8-\u00EA\u00EC-\u00ED\u00F2-\u00F5\u00F9-\u00FA\u00FD\u0102-\u0103\u0110-\u0111\u0128-\u0129\u0168-\u0169\u01A0-\u01B0\u1EA0-\u1EF9\u02C6-\u0323]*$/.test(articleBody); // the ones at the end are vietnamese
	if ( ! ansiOnly ) {
		messages += "<li>WP:BEFORE search for foreign name</li>\n";
	}
	
	/*
	// debugging/logging code
	console.log(articleBody);
	matches = articleBody.match(/[^\u0000-\u036f\ua792\u200b\u2009\u2061\u200e–—−▶◀•←†↓√≠≈→⋯’\u0020-\u002F\u0030-\u0039\u003A-\u0040\u0041-\u005A\u005B-\u0060\u0061-\u007A\u007B-\u007E\u00C0-\u00C3\u00C8-\u00CA\u00CC-\u00CD\u00D0\u00D2-\u00D5\u00D9-\u00DA\u00DD\u00E0-\u00E3\u00E8-\u00EA\u00EC-\u00ED\u00F2-\u00F5\u00F9-\u00FA\u00FD\u0102-\u0103\u0110-\u0111\u0128-\u0129\u0168-\u0169\u01A0-\u01B0\u1EA0-\u1EF9\u02C6-\u0323]/g);
	if ( matches ) {
		for ( match of matches ) {
			console.log(match);
			console.log(match.charCodeAt(0));
		}
	}
	*/
	
	let links = '';
	if ( ! lessLinks ) {
		links += `
					<li><a href="`+copyvioURL+`" `+sameTab+`>Copyvio check</a></li>
					<li><a href="`+wikipediaDuplicateCheckURL+`" `+sameTab+`>Duplicate article check</a></li>
					<li><a href="`+webSearchURL+`" `+sameTab+`>WP:BEFORE web</a></li>
					<li><a href="`+newsSearchURL+`" `+sameTab+`>WP:BEFORE news</a></li>
					<li><a href="`+oldNewsSearchURL+`" `+sameTab+`>WP:BEFORE news archive</a></li>
					<li><a href="`+bookSearchURL+`" `+sameTab+`>WP:BEFORE books</a></li>
					<li><a href="`+journalSearchURL+`" `+sameTab+`>WP:BEFORE scholar</a></li>
					`+messages+`
					<li><a href="`+profileSearchURL+`" `+sameTab+`>h-index</a></li>
					<li><a href="`+cseSearchURL+`" `+sameTab+`>Google CSE</a></li>
					<li><a href="`+newsInTitleSearchURL+`" `+sameTab+`>News (name in title)</a></li>
					<li><a href="`+wikidataSearchURL+`" `+sameTab+`>Wikidata</a></li>
		`;
		/*
					TODO: https://en.wikipedia.org/wiki/MediaWiki:Gadget-purgetab.js
					
					<li><a onclick="purge(&quot;`+escapeDoubleQuotes(pageNameNoNamespace)+`&quot;);">Purge (for orphan check)</a></li>
					<li><a href="">Orphan check</a></li>
		*/
		// TODO: display message if orphan
		// TODO: display message if no categories
	}
	
	$('#p-navigation').after(`
		<nav id="p-npp-links" class="mw-portlet mw-portlet-npp-links vector-menu vector-menu-portal portal" aria-labelledby="p-npp-links-label" role="npp-links">
			<h3 id="p-npp-links-label" class="vector-menu-heading">
				<span>New page patrol</span>
			</h3>
			<div class="vector-menu-content">
				<ul class="vector-menu-content-list">
					<li><a href="/wiki/Special:NewPagesFeed">New pages feed</a></li>
					`+links+`
				</ul>
			</div>
		</nav>
	`);
});

// </nowiki>