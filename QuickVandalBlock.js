// Forked from https://en.wikipedia.org/wiki/User:Enterprisey/quick-vand-block.js, with thanks to the original creator, Enterprisey.

// This is a script to help admins process [[WP:AIV]] requests quickly.

// In diffs and filter logs, places ( indef ) links next to usernames, and ( 31h | proxy ) links next to IPs. Clicking one of these will prompt you "are you sure you want to block X?", then will block them for that duration, and leave vandalism-related talk page notifications and edit summaries. Note that clicking "proxy" will skip leaving a talk page notification.

/*
Changes:
* linted/refactored
* added ? to end of question in popup
* added proxy block
* fixed the indef button to work with temporary accounts
*/

// <nowiki>
$.when( mw.loader.using( [ 'mediawiki.api', 'mediawiki.util' ] ), $.ready ).then( () => {
	const MONTHS = mw.config.get( 'wgMonthNames' ).slice( 1 ); // theirs starts with the empty string
	const api = new mw.Api();

	function addLinksAndListener( obj ) {
		obj.find( 'span.mw-usertoollinks' ).each( function ( idx, element ) {
			const isIp = this.previousElementSibling.className.includes( 'mw-anonuserlink' );
			let $linkAndListener;

			if ( isIp ) {
				$linkAndListener = $( '<a>' )
					.attr( 'href', '#' )
					.text( '31h' )
					.on( 'click', function () {
						const username = $( this ).parent().get( 0 ).previousElementSibling.textContent;
						const duration = '31 hours';
						const logReason = '[[Wikipedia:Vandalism|Vandalism]]';
						const templateName = 'uw-vblock';
						const templateParams = {
							anon: 'yes',
							time: '31 hours',
							sig: 'yes'
						};
						const isMainspaceSpecialOrMedia = mw.config.get( 'wgNamespaceNumber' ) < 1;
						if ( !isMainspaceSpecialOrMedia ) {
							templateParams.page = mw.config.get( 'wgPageName' );
						}
						block( username, duration, logReason, templateName, templateParams );
					} );
				$( element ).contents().last().before( ' | ', $linkAndListener );

				$linkAndListener = $( '<a>' )
					.attr( 'href', '#' )
					.text( 'proxy' )
					.on( 'click', function () {
						const username = $( this ).parent().get( 0 ).previousElementSibling.textContent;
						const duration = '1 year';
						const logReason = '[[Wikipedia:Vandalism|Vandalism]]';
						// no talk page message
						const templateName = null;
						const templateParams = {};
						const isMainspaceSpecialOrMedia = mw.config.get( 'wgNamespaceNumber' ) < 1;
						if ( !isMainspaceSpecialOrMedia ) {
							templateParams.page = mw.config.get( 'wgPageName' );
						}
						block( username, duration, logReason, templateName, templateParams );
					} );
				$( element ).contents().last().before( ' | ', $linkAndListener );
			} else {
				$linkAndListener = $( '<a>' )
					.attr( 'href', '#' )
					.text( 'indef' )
					.on( 'click', function () {
						const username = $( this ).parent().siblings( '.mw-userlink' ).find( 'bdi' ).text();
						const duration = 'never';
						const logReason = '[[Wikipedia:Vandalism|Vandalism]]';
						const templateName = 'uw-vblock';
						const templateParams = {
							indef: 'yes',
							sig: 'yes'
						};
						const isMainspaceSpecialOrMedia = mw.config.get( 'wgNamespaceNumber' ) < 1;
						if ( !isMainspaceSpecialOrMedia ) {
							templateParams.page = mw.config.get( 'wgPageName' );
						}
						block( username, duration, logReason, templateName, templateParams );
					} );
				$( element ).contents().last().before( ' | ', $linkAndListener );
			}
		} );
	}

	function block( username, duration, logReason, templateName, templateParams ) {
		if ( confirm( 'Block ' + username + '?' ) ) {
			new mw.Api().postWithToken( 'csrf', {
				action: 'block',
				user: username,
				expiry: duration,
				reason: logReason,
				nocreate: 'true',
				autoblock: 'true',
				watchuser: 'true',
				allowusertalk: 'true'
			} ).then( () => {
				if ( templateName ) {
					mw.notify( 'Blocked ' + username + '; sending notification...' );
					deliverBlockTemplate( username, templateName, templateParams );
				} else {
					mw.notify( 'Blocked ' + username + '. No talk page notification sent.' );
				}
			} );
			return false;
		}
	}

	function deliverBlockTemplate( username, templateName, templateParams ) {
		const now = new Date();
		const sectionName = MONTHS[ now.getMonth() ] + ' ' + now.getFullYear();
		api.get( {
			prop: 'revisions',
			rvprop: 'content',
			rvlimit: '1',
			rvslots: 'main',
			titles: 'User talk:' + username,
			formatversion: '2'
		} ).then( ( data ) => {
			let existingText;
			if ( data.query.pages[ 0 ].missing ) {
				existingText = '';
			} else {
				existingText = data.query.pages[ 0 ].revisions[ 0 ].slots.main.content;
			}
			const shouldAddSectionHeader = !( new RegExp( /==\s*/.source +
				sectionName.replace( ' ', '\\s*' ) + /\s*==/.source ).test( existingText ) );

			let textToAdd = '\n\n';
			textToAdd += ( shouldAddSectionHeader ? '== ' + sectionName + ' ==\n\n' : '' );
			textToAdd += '{{subst:' + templateName;
			textToAdd += Object.entries( templateParams )
				.map( ( [ key, value ] ) => `|${ key }=${ value }` )
				.join( '' );
			textToAdd += '}}';

			return api.postWithToken( 'csrf', {
				action: 'edit',
				title: 'User talk:' + username,
				appendtext: textToAdd,
				summary: 'You have been blocked from editing for persistent vandalism.'
			} );
		} ).then( () => {
			mw.notify( 'Notification sent.' );
		} );
	}

	mw.hook( 'wikipage.content' ).add( ( obj ) => {
		addLinksAndListener( obj );
	} );
} );
// </nowiki>
