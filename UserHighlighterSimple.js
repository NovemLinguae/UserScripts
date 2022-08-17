//<nowiki>

class UserHighlighterSimple {
	addCSS(htmlClass, cssDeclaration) {
		// .plainlinks is for Wikipedia Signpost articles
		// To support additional custom signature edge cases, add to the selectors here.
		mw.util.addCSS(`
			.plainlinks .${htmlClass}.external,
			.${htmlClass},
			.${htmlClass} span,
			.${htmlClass} b,
			.${htmlClass} big,
			.${htmlClass} font {
				${cssDeclaration}
			}
		`);
	}

	async getWikitextFromCache(title) {
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

	setHighlightColors() {
		// Highest specificity goes on bottom. So if you want an admin+steward to be highlighted steward, place the steward CSS below the admin CSS in this section.
		this.addCSS('override-signature-colors', `
			color: #0645ad !important;
			background-color: transparent !important;
			background: unset !important;
		`);
		mw.util.addCSS(`.userhighlighter_noperms { border: 1px solid black !important; }`);
		this.addCSS('userhighlighter_excon', `background-color: lightgray !important;`);
		this.addCSS('userhighlighter_tenk', `background-color: #9c9 !important;`);
		this.addCSS('userhighlighter_npruser', `background-color: #99f !important;`);
		this.addCSS('userhighlighter_formeradmin', `background-color: #D3AC8B !important;`);
		this.addCSS('userhighlighter_sysop', `background-color: #9ff !important;`);
		this.addCSS('userhighlighter_bureaucrat', `background-color: orange !important; color: #0645ad !important;`);
		this.addCSS('userhighlighter_arbcom', `background-color: #FF3F3F !important; color: white !important;`);
		this.addCSS('userhighlighter_steward', `background-color: hotpink !important; color: #0645ad !important;`);
	}

	async getUsernames() {
		let dataString = await this.getWikitextFromCache('User:NovemBot/userlist.js');
		let dataJSON = JSON.parse(dataString);

		this.global = {
			...dataJSON['founder'],
			...dataJSON['steward'],
			// WMF is hard-coded a bit further down. The script detects those strings in the username. This is safe to do because the WMF string is blacklisted from names, so has to be specially created.
			//...dataJSON['sysadmin'],
			//...dataJSON['staff'],
			//...dataJSON['global-interface-editor'],
			//...dataJSON['wmf-supportsafety'],
			//...dataJSON['mediawikiPlusTwo'],
			//...dataJSON['global-sysop'],
		};
		this.arbcom = dataJSON['arbcom'];
		this.bureaucrats = dataJSON['bureaucrat'];
		this.admins = dataJSON['sysop'];
		this.formeradmins = dataJSON['formeradmin'];
		this.newPageReviewers = dataJSON['patroller'];
		this.tenThousandEdits = dataJSON['10k'];
		this.extendedConfirmed = {
			...dataJSON['extendedconfirmed'],
			...dataJSON['bot'],
			...dataJSON['productiveIPs'],
		};
	}

	hasHREF(url) {
		return url;
	}

	isAnchor(url) {
		return url.charAt(0) === '#';
	}

	isHTTPorHTTPS(url) {
		return url.lastIndexOf("http://", 0) === 0 ||
			url.lastIndexOf("https://", 0) === 0 ||
			url.lastIndexOf("/", 0) === 0;
	}

	// Figure out the wikipedia article title of the link
	getTitle(url, uri) {
		// for links in the format /w/index.php?title=Blah
		let titleParameterOfURL = mw.util.getParamValue('title', url);

		// for links in the format /wiki/PageName. Slice off the /wiki/ (first 6 characters)
		let URI = decodeURIComponent(uri.path.slice(6));

		if ( titleParameterOfURL ) {
			return titleParameterOfURL;
		} else {
			return URI;
		}
	}

	inSpecialUserOrUserTalk() {
		return $.inArray(this.mwtitle.getNamespaceId(), [-1,2,3]) >= 0;
	}

	linksToUser() {
		var url = this.link.attr('href');
		
		if ( ! this.hasHREF(url) || this.isAnchor(url) || ! this.isHTTPorHTTPS(url) ) {
			return false;
		}
		
		var uri = new mw.Uri(url);
		
		// Skip links with query strings
		// Example: The pagination links, diff links, and revision links on the Special:Contributions page
		// Those all have "query strings" such as "&oldid=1003511328"
		// Exception: Users without a user page (red link) need to be highlighted
		let isRedLinkUserPage = url.startsWith('/w/index.php?title=User:') && url.endsWith('&action=edit&redlink=1');
		if ( ! $.isEmptyObject(uri.query) && ! isRedLinkUserPage ) {
			return false;
		}
		
		// wgServer is not in the format //meta.wikimedia.org
		// if en.wikipedia.org != en.wikipedia.org
		// TODO: when I figure it out, need to document what edge case this fixes
		if ( uri.host != mw.config.get('wgServer').slice(2) ) {
			return false;
		}

		let title = this.getTitle(url, uri);
		this.mwtitle = new mw.Title(title);
		
		if ( ! this.inSpecialUserOrUserTalk() ) {
			return false;
		}

		return true;
	}

	getUserName() {
		var user = this.mwtitle.getMain().replace(/_/g," ");
		if (this.mwtitle.getNamespaceId() === -1) {
			user = user.replace('Contributions/',''); // For special page "Contributions/<username>"
			user = user.replace('Contribs/',''); // The Contribs abbreviation too
		}
		return user;
	}

	checkForPermission(listOfUsernames, className, descriptionForHover) {
		if ( listOfUsernames[this.user] == 1 ) {
			this.addClassAndTitle(className, descriptionForHover);
		}
	}

	addClassAndTitle(className, descriptionForHover) {
		this.link.addClass(this.link.attr('class') + ` ${className}`);

		if ( this.link.attr("title") == null || this.link.attr("title").startsWith("User:") ) {
			this.link.attr("title", descriptionForHover);
		}

		this.hasAdvancedPermissions = true;
	}

	addClassAndTitleIfNeeded() {
		// in addition to folks in the global group, highlight anybody with "WMF" in their name, case insensitive. this should not generate false positives because WMF is on the username blacklist.
		if ( this.user.match(/WMF/i) ) {
			this.addClassAndTitle('userhighlighter_steward', 'WMF, Steward, or Founder');
		}

		this.checkForPermission(this.global, 'userhighlighter_steward', 'WMF, Steward, or Founder');
		this.checkForPermission(this.bureaucrats, 'userhighlighter_bureaucrat', 'Bureaucrat');
		this.checkForPermission(this.arbcom, 'userhighlighter_arbcom', 'Arbitration Committee member');
		this.checkForPermission(this.admins, 'userhighlighter_sysop', 'Admin');
		this.checkForPermission(this.formeradmins, 'userhighlighter_formeradmin', 'Former Admin');
		this.checkForPermission(this.newPageReviewers, 'userhighlighter_npruser', 'New page reviewer');
		this.checkForPermission(this.tenThousandEdits, 'userhighlighter_tenk', 'More than 10,000 edits');
		this.checkForPermission(this.extendedConfirmed, 'userhighlighter_excon', 'Extended confirmed');

		// If they have no perms, just draw a box around their username, to make it more visible.
		if ( ! this.hasAdvancedPermissions && this.link.hasClass('userlink') ) {
			this.link.addClass( this.link.attr('class') + " userhighlighter_noperms" );
			if (this.link.attr("title") == null || this.link.attr("title").startsWith("User:")) {
				this.link.attr("title", "Less than 500 edits");
			}
		}
	}

	async execute() {
		await this.getUsernames();
		this.setHighlightColors();
		let that = this;
		$('#article a, #bodyContent a, #mw_contentholder a').each(function(index, linkraw){
			try {
				that.link = $(linkraw);
				if ( ! that.linksToUser() ) {
					return;
				}
				that.user = that.getUserName();
				that.hasAdvancedPermissions = false;
				that.addClassAndTitleIfNeeded();
				// If the user has any advanced perms, they are likely to have a signature, so be aggressive about overriding the background and foreground color. That way there's no risk their signature is unreadable due to background color and foreground color being too similar. Don't do this for users without advanced perms... being able to see a redlinked username is useful.
				if ( that.hasAdvancedPermissions ) {
					that.link.addClass(that.link.attr('class') + ' override-signature-colors');
				}
			} catch(e) {
				console.error('UserHighlighterSimple link parsing error:', e.message, that.link);
			}
		});
	}
}

mw.hook('wikipage.content').add(async function(){
	await mw.loader.using(['mediawiki.util','mediawiki.Uri', 'mediawiki.Title'], async function() {
		let uhs = new UserHighlighterSimple();
		await uhs.execute();
	});
});

//</nowiki>
