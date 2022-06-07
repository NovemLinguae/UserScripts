// <nowiki>

/*
	This script adds a left menu below the toolbox, and includes some links:
	- users
		- common.js
		- global.js
		- vector.js
		- central auth (good for seeing what global permissions people have)
	- users and articles
		- subpages
		- rename log
		- global lock log
		
	This script also adds "Pending changes" to the left main menu.
*/

function getFirstMatch(string, regex) {
	let matches = string.match(regex);
	if ( matches && matches[1] ) {
		return matches[1];
	}
	return '';
}

$(function() {
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
		userLinks = `
					<li><a href="/wiki/`+username+`/common.js">common.js</a></li>
					<li><a href="https://meta.wikimedia.org/wiki/`+username+`/global.js">global.js</a></li>
					<li><a href="/wiki/`+username+`/vector.js">vector.js</a></li>
					<li><a href="/wiki/Special:CentralAuth?target=`+usernameURI+`">Central auth</a></li>
					<li><a href="https://meta.wikimedia.org/wiki/Special:Log?type=renameuser&user=&page=`+usernameURI+`">Rename log</a></li>
					<li><a href="https://en.wikipedia.org/wiki/Special:Log?type=renameuser&user=&page=`+usernameURI+`%7Eenwiki">Rename log (~enwiki)</a></li>
					<li><a href="https://meta.wikimedia.org/wiki/Special:Log?page=User%3A`+usernameURI+`%40global">Global lock log</a></li>
		`;
		// All modern renames seem to be put into both en:Special:Log->User rename log AND meta:Special:Log->User rename log.
		// One older rename was put only into meta:Special:Log->User rename log.
		// Another older rename was put only into en:Special:Log->User rename log, and was complicated by the fact that ~enwiki had been added to the end of it.
		// Spaces vs underscores don't seem to matter. User: or no User: doesn't seem to matter.
	}
	
	let parentName = pageName + '/';
	let subpageLinks = '';
	if ( pageName.includes('/') ) {
		parentName = getFirstMatch(pageName, /^([^\/]+\/)/);
	}
	subpageLinks = `
					<li><a href="/wiki/Special:PrefixIndex/`+parentName+`">Subpages</a></li>
	`;
	
	$('#p-tb').after(`
		<nav id="p-user-links" class="mw-portlet mw-portlet-user-links vector-menu vector-menu-portal portal" aria-labelledby="p-user-links-label" role="user-links">
			<h3 id="p-user-links-label" class="vector-menu-heading">
				<span>More tools</span>
			</h3>
			<div class="vector-menu-content">
				<ul class="vector-menu-content-list">
					`+userLinks+`
					`+subpageLinks+`
				</ul>
			</div>
		</nav>
	`);});

// </nowiki>