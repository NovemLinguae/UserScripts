// <nowiki>

/*
	This script adds a left menu below the toolbox called "More tools", and includes some links:

	- userspace only
		- common.js
		- global.js
		- vector.js
		- common.css
		- central auth (good for seeing what global permissions people have)
		- rename log
		- global lock log
		- Twinkle CSD log
		- Twinkle PROD log
		- Twinkle XfD log
		- Draftify log

	- all namespaces
		- subpages
		
	This script also adds "Pending changes" to the left main menu.
*/

$(async function() {
	function getFirstMatch(string, regex) {
		let matches = string.match(regex);
		if ( matches && matches[1] ) {
			return matches[1];
		}
		return '';
	}

	/**
		@param array titles
		@return array
	*/
	async function pagesExist(titles) {
		let api = new mw.Api();
		let response = await api.get( {
			action: 'query',
			format: 'json',
			prop: 'revisions',
			titles: titles.join('|'),
		} );
		/*
		Example format if exists:

		"66442411": {
			"pageid": 66442411,
			"ns": 2,
			"title": "User:Novem Linguae/CSD log",
			"revisions": [
				{
					"revid": 1091295780,
					"parentid": 1091255744,
					"user": "Novem Linguae",
					"timestamp": "2022-06-03T11:38:00Z",
					"comment": "Logging speedy deletion nomination of [[:Liquorose]]."
				}
			]
		},

		Example format if doesn't exist:

		"-1": {
			"ns": 2,
			"title": "User:Jmcclaskey54/CSD log",
			"missing": ""
		},
		*/
		response = response.query.pages;
		let pages = [];
		for ( let key in response ) {
			if ( key > 0 ) {
				pages.push(response[key]['title']);
			}
		}
		return pages;
	}

	mw.util.addPortletLink(
		'p-navigation',
		mw.util.getUrl('Special:PendingChanges'),
		'Pending changes'	// can't put comma here, silent error
	);
	
	let pageName = mw.config.get('wgPageName');
	let username = getFirstMatch(pageName, /(?:User:|User_talk:)([^/]+).*/);
	
	let userLinks = '';
	if ( username ) {
		username = 'User:' + username;
		let usernameURI = encodeURIComponent(username.replace(/_/g, ' ').replace(/^User:/, ''));

		// common.js and similar
		userLinks += `<li><a href="/wiki/${username}/common.js">common.js</a></li>`;
		userLinks += `<li><a href="https://meta.wikimedia.org/wiki/${username}/global.js">global.js</a></li>`;
		userLinks += `<li><a href="/wiki/${username}/vector.js">vector.js</a></li>`;
		userLinks += `<li><a href="/wiki/${username}/common.css">common.css</a></li>`;

		// central auth
		userLinks += `<li><a href="/wiki/Special:CentralAuth?target=${usernameURI}">Central auth</a></li>`;

		// rename  log
		// All modern renames seem to be put into both en:Special:Log->User rename log AND meta:Special:Log->User rename log.
		// One older rename was put only into meta:Special:Log->User rename log.
		// Another older rename was put only into en:Special:Log->User rename log, and was complicated by the fact that ~enwiki had been added to the end of it.
		// Spaces vs underscores don't seem to matter. User: or no User: doesn't seem to matter.
		userLinks += `<li><a href="https://meta.wikimedia.org/wiki/Special:Log?type=renameuser&user=&page=${usernameURI}">Rename log</a></li>`;
		userLinks += `<li><a href="https://en.wikipedia.org/wiki/Special:Log?type=renameuser&user=&page=${usernameURI}%7Eenwiki">Rename log (~enwiki)</a></li>`;

		// global lock log
		userLinks += `<li><a href="https://meta.wikimedia.org/wiki/Special:Log?page=User%3A${usernameURI}%40global">Global lock log</a></li>`;

		// twinkle logs (csd, prod, xfd) and draftify log
		// check if they exist with an API query before adding links
		let logPages = await pagesExist([
			`${username}/CSD log`,
			`${username}/PROD log`,
			`${username}/XfD log`,
			`${username}/Draftify log`,
		]);
		for ( let title of logPages ) {
			let shortTitle = title.replace(/^.*\//, '');
			userLinks += `<li><a href="https://en.wikipedia.org/wiki/${title}">${shortTitle}</a></li>`;
		}
	}
	
	let parentName = pageName + '/';
	let allPageLinks = '';
	if ( pageName.includes('/') ) {
		parentName = getFirstMatch(pageName, /^([^\/]+\/)/);
	}
	allPageLinks += `<li><a href="/wiki/Special:PrefixIndex/${parentName}">Subpages</a></li>`;
	
	$('#p-tb').after(`
		<nav id="p-user-links" class="mw-portlet mw-portlet-user-links vector-menu vector-menu-portal portal" aria-labelledby="p-user-links-label" role="user-links">
			<h3 id="p-user-links-label" class="vector-menu-heading">
				<span>More tools</span>
			</h3>
			<div class="vector-menu-content">
				<ul class="vector-menu-content-list">
					`+userLinks+`
					`+allPageLinks+`
				</ul>
			</div>
		</nav>
	`);
});

// </nowiki>