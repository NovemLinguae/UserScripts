// <nowiki>

// Semi Edit Request - Read FAQ
// Places a link below the {{edit semi-protected}} template that says "[Decline - Read FAQ]"
// Clicking on it changes {{edit semi-protected|Username|answered=no}} to "answered=yes".
// Then it posts the message "{{not done}} Hi, and welcome to Wikipedia. The edit you're requesting has been discussed multiple times, and is against current consensus. For more information, see the FAQ at the top of this page. Thank you! ~~~~"
// Then it reloads the page.
// Requested by [[User:Valereee]]
// https://en.wikipedia.org/wiki/Wikipedia:User_scripts/Requests#Please_Read_the_FAQ
// Test pages:
// https://en.wikipedia.org/wiki/Category:Wikipedia_semi-protected_edit_requests

// TODO: handle blank parentSectionName
// TODO: handle sections with same name
// TODO: handle COI edit requests
// TODO: ping requester

$( () => {
	async function getWikicode( title ) {
		// if page is deleted, return blank
		if ( !mw.config.get( 'wgCurRevisionId' ) ) {
			return '';
		}
		let wikicode = '';
		await $.ajax( {
			url: 'https://en.wikipedia.org/w/api.php?action=parse&page=' + title + '&prop=wikitext&formatversion=2&format=json',
			success: function ( result ) {
				wikicode = result.parse.wikitext;
			},
			dataType: 'json'
		} );
		return wikicode;
	}

	function escapeRegExp( string ) {
		return string.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ); // $& means the whole matched string
	}

	function markAnswered( wikicode, parentSectionName ) {
		const regex = new RegExp( '(' + escapeRegExp( parentSectionName ) + '.*?==.*?\\|answered=)no', 's' );
		wikicode = wikicode.replace( regex, '$1yes' );
		return wikicode;
	}

	function insertComment( wikicode, parentSectionName ) {
		const regex = new RegExp( '(' + escapeRegExp( parentSectionName ) + '.*?==.*?)(\n==)', 's' );
		const comment = "\n:{{not done}} Hi, and welcome to Wikipedia. The edit you're requesting has been discussed multiple times, and is against current consensus. For more information, see the FAQ at the top of this page. Thank you! ~~~~";
		let newWikicode = wikicode.replace( regex, '$1' + comment + '$2' );

		const noCommentInserted = ( newWikicode === wikicode );
		if ( noCommentInserted ) {
			newWikicode = addWikitextAtEndOfPage( wikicode, comment );
		}

		return newWikicode;
	}

	function addWikitextAtEndOfPage( wikitext, textToAdd ) {
		return wikitext + textToAdd;
	}

	function submitEdit( articleName, wikicode ) {
		const summary = 'Answer edit request (via [[User:Novem Linguae/Scripts/EditRequestReadFAQ.js|script]])';
		editPage( articleName, wikicode, summary );
	}

	function getArticleName() {
		return mw.config.get( 'wgPageName' );
	}

	function getParentSectionName( declineElement ) {
		// not chained, to make it easier to debug
		let element = declineElement.prevAll( 'h2' ).first();
		if ( !element ) {
			return '';
		}
		element = element.find( '.mw-headline' );
		const value = element.html();
		return value;
	}

	// borrowed from [[Wikipedia:User scripts/Guide#Edit a page and other common actions]]
	function editPage( articleName, wikicode, summary ) {
		$.ajax( {
			url: mw.util.wikiScript( 'api' ),
			type: 'POST',
			dataType: 'json',
			data: {
				format: 'json',
				action: 'edit',
				title: articleName,
				text: wikicode, // will replace entire page content
				summary: summary,
				token: mw.user.tokens.get( 'csrfToken' )
			},
			async: false
		} );
	}

	function getRandomInt( min, max ) {
		return Math.floor( Math.random() * ( max - min + 1 ) + min );
	}

	function reloadPageAtSection( parentSectionName ) {
		let url = window.location.href;

		// strip off #abcd at the end
		url = url.replace( /#[^#]*$/, '' );

		// fix bug where page won't hard refresh. add &rand=1234 to the end
		const rand = getRandomInt( 1000, 9999 );
		url = url.replace( /&rand=\d{4}/, '' );
		url = url.replace( /\?rand=\d{4}&/, '?' );
		url = url.replace( /\?rand=\d{4}$/, '' );
		if ( url.includes( '?' ) ) {
			url += '&rand=' + rand;
		} else {
			url += '?rand=' + rand;
		}

		// add correct #abcd at the end
		url += '#' + encodeURIComponent( parentSectionName.replace( / /g, '_' ) );

		// refresh
		window.location.href = url;
	}

	// don't run when not viewing articles
	const action = mw.config.get( 'wgAction' );
	if ( action !== 'view' ) {
		return;
	}

	// don't run when viewing diffs
	const isDiff = mw.config.get( 'wgDiffNewId' );
	if ( isDiff ) {
		return;
	}

	const isDeletedPage = ( !mw.config.get( 'wgCurRevisionId' ) );
	if ( isDeletedPage ) {
		return;
	}

	// need all the class stuff, because #editsemiprotected will not work if there is more than one open edit request on the page. ID is supposed to be unique
	$( '#editsemiprotected.editrequest[data-origlevel="semi"]' ).after( '<a class="edit-request-read-faq" style="font-size: 80%;" href="javascript:void(0)">[Decline - Read FAQ]</a>' );

	$( '.edit-request-read-faq' ).on( 'click', async function () {
		const parentSectionName = getParentSectionName( $( this ) );
		const articleName = getArticleName();
		let wikicode = await getWikicode( articleName );

		wikicode = markAnswered( wikicode, parentSectionName );
		wikicode = insertComment( wikicode, parentSectionName );
		submitEdit( articleName, wikicode );
		reloadPageAtSection( parentSectionName );
	} );
} );

// </nowiki>
