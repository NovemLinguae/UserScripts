//<nowiki>

/*
	PURPOSE:
	- Displays the Visual Editor "Edit" tab and "Edit" section link in all namespaces, including Talk, Wikipedia, and Template.
	
	TO INSTALL:
	- Copy paste the below into your User:YourUserName/common.js file
			importScript('User:Novem Linguae/Scripts/VisualEditorEverywhere.js'); // Backlink: [[User:Novem Linguae/Scripts/VisualEditorEverywhere.js]]
*/

if( jQuery !== undefined && mediaWiki !== undefined ) {
    let currNamespace = mw.config.get('wgNamespaceNumber');
	let articleName = mw.config.get('wgPageName');
	articleName = encodeURIComponent(articleName); // fix bug involving & not getting converted to &amp;
	let buttonIsPresent = $('#ca-ve-edit').length;
	// let namespaceNeedsButton = ( currNamespace == 4 || currNamespace == 5 || currNamespace == 10 || currNamespace == 11 || currNamespace == 3 );
	// console.log('currNamespace: ' + currNamespace);
	// let blacklistedNamespaces = [-2, -1, 6]; // media, special, file
	// let blacklistedNamespace = blacklistedNamespaces.includes(currNamespace);
	let pageIsUserScript = articleName.match(/(?:\.js|\.css)$/);
	
	if ( ! buttonIsPresent && ! pageIsUserScript ) {
		// Insert Edit tab at top of page
		let htmlToInsert = '<li id="ca-ve-edit" class="collapsible"><a href="/w/index.php?title='+articleName+'&amp;veaction=edit" title="Edit this page [alt-shift-v]" accesskey="v">Edit</a></li>';
		$('#ca-edit').before(htmlToInsert);
		$('#ca-ve-edit').show();
		
		// Insert [ edit ] by each section
		$('.mw-editsection').each(function(i, obj) {
			htmlToInsert = '<a href="/w/index.php?title='+articleName+'&amp;veaction=edit&amp;section='+(i+1)+'" class="mw-editsection-visualeditor">edit</a>    <span class="mw-editsection-divider"> | </span>';
			$('.mw-editsection').eq(i).children('span:first-of-type').after(htmlToInsert); // Inline tags such as <span> do not work with :nth-child, .before(), etc. Must use :first-of-type.
		});
		$('.mw-editsection-visualeditor, .mw-editsection-divider').show();
	}
}

/*
	
	TODO:
	- BUG - no section edit buttons at all in User talk:Novem Linguae/Archive 1
	- BUG - race condition about 25% of the time, edit tab and/or section links get hidden, probably because VisualEditorEverywhere executed too early
	- When editing Wikipedia namespace articles such as [[Wikipedia:Tips for pending changes reviewers]], if you choose "Edit Source", it hides the button to switch to the visual editor. Un-hide it.
	- Make sure "Create" button shows up in Wikipedia, User talk, etc. namespaces when trying to create a page.
	- BUG - if preferences are not set to "show me both editor tabs", the two tabs say "edit" and "edit", instead of "edit" and "edit source"
	- make sure that, on the source editor page, in the top right corner, that the option to switch to VE is added when needed.
			
	TEST PAGES:
	- Regular page - https://en.wikipedia.org/wiki/Lauren_Chamberlain
	- Wikipedia namespace - https://en.wikipedia.org/wiki/Wikipedia:Notability
	- Wikipedia namespace, fully protected - https://en.wikipedia.org/wiki/Wikipedia:Wiki_Ed/tour/example_bio_template
	- Template namespace - https://en.wikipedia.org/wiki/Template:Noticeboard_links
	- Template talk namespace (good for testing section links) - https://en.wikipedia.org/wiki/Template_talk:Noticeboard_links

*/

//</nowiki>