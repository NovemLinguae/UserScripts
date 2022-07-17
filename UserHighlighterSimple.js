//<nowiki>

mw.hook('wikipage.content').add(async function($content){
	async function getWikitextFromCache(title) {
		var api = new mw.ForeignApi('https://en.wikipedia.org/w/api.php');
		var wikitext = '';
		await api.get( {
			action: 'query',
			prop: 'revisions',
			titles: title,
			rvslots: '*',
			rvprop: 'content',
			formatversion: '2',
			uselang: 'content', // needed for caching
			smaxage: '86400', // cache for 1 day
			maxage: '86400' // cache for 1 day
		} ).done( function ( data ) {
			wikitext = data.query.pages[0].revisions[0].slots.main.content;
		} );
		return wikitext;
	}

	let dataString = await getWikitextFromCache('User:NovemBot/userlist.js');
	let dataJSON = JSON.parse(dataString);

	let global = {
		...dataJSON['founder'],
		...dataJSON['steward'],
		...dataJSON['sysadmin'],
		...dataJSON['staff'],
		...dataJSON['global-interface-editor'],
		...dataJSON['wmf-supportsafety'],
	};
	let arbcom = dataJSON['arbcom'];
	let bureaucrats = dataJSON['bureaucrat'];
	let admins = dataJSON['sysop'];
	let newPageReviewers = dataJSON['patroller'];
	let tenThousandEdits = dataJSON['10k'];
	let extendedConfirmed = {
		...dataJSON['extendedconfirmed'],
		...dataJSON['bot'],
		...dataJSON['productiveIPs'],
	};
	
	ADMINHIGHLIGHT_NAMESPACES = [-1,2,3];
	mw.loader.using(['mediawiki.util','mediawiki.Uri', 'mediawiki.Title'], function() {
		// Note: .plainlinks is for Wikipedia Signpost articles


		mw.util.addCSS(".override-signature-colors, .override-signature-colors span, .plainlinks .override-signature-colors.external, .override-signature-colors b, .override-signature-colors font {color: #0645ad !important; background-color: transparent !important;}");
		
		// no perms
		mw.util.addCSS(".userhighlighter_noperms {border: 1px solid black !important;}"); // darkgray
		
		// extended confirmed (53,000)
		mw.util.addCSS(".userhighlighter_excon, .userhighlighter_excon span, .plainlinks .userhighlighter_excon.external, .userhighlighter_excon b, .userhighlighter_excon font {background-color: lightgray !important;}"); // darkgray
		
		// 10k edits (10,000)
		mw.util.addCSS(".userhighlighter_tenk, .userhighlighter_tenk span, .plainlinks .userhighlighter_tenk.external, .userhighlighter_tenk b, .userhighlighter_tenk font {background-color: #9c9 !important;}"); // light brown: #d2691e
		
		// New page reviewer (714)
		mw.util.addCSS(".userhighlighter_npruser, .userhighlighter_npruser span, .plainlinks .userhighlighter_npruser.external, .userhighlighter_npruser b, .userhighlighter_npruser font {background-color: #99f !important;}");
		
		// Admin
		mw.util.addCSS(".userhighlighter_sysop, .userhighlighter_sysop span, .plainlinks .userhighlighter_sysop.external, .userhighlighter_sysop b, .userhighlighter_sysop font {background-color: #9ff !important;}");
		
		// bureaucrat
		mw.util.addCSS(".userhighlighter_bureaucrat, .userhighlighter_bureaucrat span, .plainlinks .userhighlighter_bureaucrat.external, .userhighlighter_bureaucrat b, .userhighlighter_bureaucrat font {background-color: orange !important; color: #0645ad !important; }");
		
		// arbcom
		mw.util.addCSS(".userhighlighter_arbcom, .userhighlighter_arbcom span, .plainlinks .userhighlighter_arbcom.external, .userhighlighter_arbcom b, .userhighlighter_arbcom font {background-color: #FF3F3F !important; color: white !important;}");
		
		// steward
		mw.util.addCSS(".userhighlighter_steward, .userhighlighter_steward span, .plainlinks .userhighlighter_steward.external, .userhighlighter_steward b, .userhighlighter_steward font {background-color: hotpink !important; color: #0645ad !important; }");
		
		$('#article a, #bodyContent a, #mw_contentholder a').each(function(index,linkraw){
			try {
				var link = $(linkraw);
				var url = link.attr('href');
				
				// Skip <a> elements that aren't actually links; skip anchors
				if ( ! url || url.charAt(0) === '#' ) return; 
				
				//require http(s) links, avoid "javascript:..." etc. which mw.Uri does not support
				if (
					url.lastIndexOf("http://", 0) !== 0 &&
					url.lastIndexOf("https://", 0) !== 0 &&
					url.lastIndexOf("/", 0) !== 0
				) {
					return;
				}
				
				var uri = new mw.Uri(url);
				
				// Skip links with query strings
				// Example: The pagination links, diff links, and revision links on the Special:Contributions page
				// Those all have "query strings" such as "&oldid=1003511328"
				// Exception: Users without a user page (red link) need to be highlighted
				let isRedLinkUserPage = url.startsWith('/w/index.php?title=User:') && url.endsWith('&action=edit&redlink=1');
				if ( ! $.isEmptyObject(uri.query) && ! isRedLinkUserPage ) return;
				
				// wgServer is in the format //meta.wikimedia.org
				if ( uri.host == mw.config.get('wgServer').slice(2) ) {
					// Figure out the wikipedia article title of the link
					let titleParameterOfURL = mw.util.getParamValue('title', url); // for links in the format /w/index.php?title=Blah
					let URI = decodeURIComponent(uri.path.slice(6)); // for links in the format /wiki/PageName. Slice off the /wiki/ (first 6 characters)
					let title = titleParameterOfURL || URI;
					var mwtitle = new mw.Title(title);
					
					if ( $.inArray(mwtitle.getNamespaceId(), ADMINHIGHLIGHT_NAMESPACES) >= 0 ) {
						var user = mwtitle.getMain().replace(/_/g," ");
						
						if (mwtitle.getNamespaceId() === -1) {
							user = user.replace('Contributions/',''); // For special page "Contributions/<username>"
							user = user.replace('Contribs/',''); // The Contribs abbreviation too
						}
						
						let hasAdvancedPermissions = false;
						
						// in addition to folks in the global group, highlight anybody with "WMF" in their name, case insensitive. this should not generate false positives because WMF is on the username blacklist.
						if (global[user] == 1 || user.match(/WMF/i)) {
							link.addClass(link.attr('class') + ' userhighlighter_steward');
							if (link.attr("title") == null || link.attr("title").startsWith("User:")) link.attr("title", "Steward");
							hasAdvancedPermissions = true;
						}
						if(bureaucrats[user] == 1) {
							link.addClass(link.attr('class') + ' userhighlighter_bureaucrat');
							if (link.attr("title") == null || link.attr("title").startsWith("User:")) link.attr("title", "Bureaucrat");
							hasAdvancedPermissions = true;
						}
						if(arbcom[user] == 1) {
							link.addClass(link.attr('class') + ' userhighlighter_arbcom');
							if (link.attr("title") == null || link.attr("title").startsWith("User:")) link.attr("title", "Arbitration Committee member");
							hasAdvancedPermissions = true;
						}
						if (admins[user] == 1) {
							link.addClass(link.attr('class') + ' userhighlighter_sysop');
							if (link.attr("title") == null || link.attr("title").startsWith("User:")) link.attr("title", "Admin");
							hasAdvancedPermissions = true;
						}
						if(newPageReviewers[user] == 1) {
							link.addClass(link.attr('class') + " userhighlighter_npruser");
							if (link.attr("title") == null || link.attr("title").startsWith("User:")) link.attr("title", "New page reviewer");
							hasAdvancedPermissions = true;
						}
						if(tenThousandEdits[user] == 1) {
							link.addClass(link.attr('class') + " userhighlighter_tenk");
							if (link.attr("title") == null || link.attr("title").startsWith("User:")) link.attr("title", "More than 10,000 edits");
							hasAdvancedPermissions = true;
						}
						if(extendedConfirmed[user] == 1) {
							link.addClass(link.attr('class') + " userhighlighter_excon");
							if (link.attr("title") == null || link.attr("title").startsWith("User:")) link.attr("title", "Extended confirmed");
							hasAdvancedPermissions = true;
						}
						
						// If the user has any advanced perms, they are likely to have a signature, so be aggressive about overriding the background and foreground color. That way there's no risk their signature is unreadable due to background color and foreground color being too similar. Don't do this for users without advanced perms... being able to see a redlinked username is useful.
						if ( hasAdvancedPermissions ) {
							link.addClass(link.attr('class') + ' override-signature-colors');
						// If they have no perms, just draw a box around their username, to make it more visible.
						} else if ( ! hasAdvancedPermissions && link.hasClass('userlink') ) {
							link.addClass(link.attr('class') + " userhighlighter_noperms");
							if (link.attr("title") == null || link.attr("title").startsWith("User:")) link.attr("title", "Less than 500 edits");
						}
					}
				}
			} catch (e) {
				// Sometimes we will run into unparsable links. No big deal. Just move on.
			}
		});
	});
});

//</nowiki>