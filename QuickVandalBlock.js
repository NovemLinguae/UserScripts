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
	const IP_BLOCK_LENGTH = '31 hours';

	function addLinksAndListener( obj ) {
		obj.find( 'span.mw-usertoollinks' ).each( function ( idx, element ) {
			const isAnon = this.previousElementSibling.className.includes( 'mw-anonuserlink' );
			$( element ).contents().last().before( ' | ',
				$( '<a>' ).attr( 'href', '#' )
					.text( isAnon ? '31h' : 'indef' )
					.on( 'click', function () {
						block( this, isAnon );
					} )
			);
		} );
	}

	function block( that, isAnon ) {
		const username = $( that ).parent().get( 0 ).previousElementSibling.textContent;
		// eslint-disable-next-line no-alert
		if ( confirm( 'Block ' + username + '?' ) ) {
			new mw.Api().postWithToken( 'csrf', {
				action: 'block',
				user: username,
				expiry: isAnon ? '31 hours' : 'never',
				reason: '[[Wikipedia:Vandalism|Vandalism]]',
				nocreate: 'true',
				autoblock: 'true',
				watchuser: 'true',
				allowusertalk: 'true'
			} ).then( () => {
				mw.notify( 'Blocked ' + username + '; sending notification...' );
				deliverBlockTemplate( username, isAnon );
			} );
			return false;
		}
	}

	function deliverBlockTemplate( username, isAnon ) {
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
			textToAdd += '{{subst:uw-vblock|';
			textToAdd += ( isAnon ? 'anon=yes|time=' + IP_BLOCK_LENGTH + '|' : 'indef=yes|' );
			textToAdd += 'sig=yes';
			textToAdd += ( mw.config.get( 'wgNamespaceNumber' ) >= 0 ? '|page=' + mw.config.get( 'wgPageName' ) : '' );
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
