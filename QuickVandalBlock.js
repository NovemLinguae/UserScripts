// Copied content from https://en.wikipedia.org/wiki/User:Enterprisey/quick-vand-block.js. Please see that page's history for attribution.
/*
Changes:
* linted/refactored
* added ? to end of question in popup
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
				$linkAndListener = $( '<a>' ).attr( 'href', '#' )
					.text( '31h' )
					.on( 'click', function () {
						const username = $( this ).parent().get( 0 ).previousElementSibling.textContent;
						const duration = '31 hours';
						const logReason = '[[Wikipedia:Vandalism|Vandalism]]';
						const templateName = 'uw-vblock';
						const templateParams = {};
						templateParams.anon = 'yes';
						templateParams.time = '31 hours';
						templateParams.sig = 'yes';
						const isMainspaceSpecialOrMedia = mw.config.get( 'wgNamespaceNumber' ) < 1;
						if ( !isMainspaceSpecialOrMedia ) {
							templateParams.page = mw.config.get( 'wgPageName' );
						}
						block( username, duration, logReason, templateName, templateParams );
					} );
				$( element ).contents().last().before( ' | ', $linkAndListener );
			} else {
				$linkAndListener = $( '<a>' ).attr( 'href', '#' )
					.text( 'indef' )
					.on( 'click', function () {
						const username = $( this ).parent().get( 0 ).previousElementSibling.textContent;
						const duration = 'never';
						const logReason = '[[Wikipedia:Vandalism|Vandalism]]';
						const templateName = 'uw-vblock';
						const templateParams = {};
						templateParams.indef = 'yes';
						templateParams.sig = 'yes';
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
		// eslint-disable-next-line no-alert
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
				mw.notify( 'Blocked ' + username + '; sending notification...' );
				deliverBlockTemplate( username, templateName, templateParams );
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
