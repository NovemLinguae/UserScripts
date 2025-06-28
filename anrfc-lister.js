// {{Wikipedia:USync |repo=https://github.com/NovemLinguae/UserScripts |ref=refs/heads/master |path=anrfc-lister.js}}
/*

Forked from https://en.wikipedia.org/wiki/User:Ajbura/anrfc-lister.js. A big thanks to the original author, Ajbura.

HOW TO USE:
- go to a talk page
- click More -> ANRFC Lister
- there will now be "List on ANRFC" links next to each section. click one
- fill out the form
- press "Submit"
- the script will add a listing to WP:ANRFC for you :)    

SKINS IT WORKS IN:
- vector
- vector-2022
- timeless
- monobook
- modern

SKINS IT DOESNT WORK IN:
- minerva

CHANGES BY NOVEM LINGUAE:
- Linted code. Added comments. Refactored.
- Works on testwiki now (gives a local WP:ANRFC link instead of an enwiki WP:ANRFC link).
- Fixed bug where the script was always in an endless loop
- Fixed bug where the RFC would always get placed at the bottom of the page, not in its proper section
- Fixed bug where section heading (the # part of the wikilink) was not getting added to WP:ANRFC
- Fixed bug where More -> ANRFC Lister link was the wrong size and did not match the style of the skin
- Fixed bug where no signature or a signature too far down caused it to hang forever
- Added a "Cancel" button to the form
- No longer displays on special pages, diffs, editing a page, etc.
- Clicking "Would you like to see it?" now takes you to exact section, instead of top of page.
- Fixed duplicate RFC listing detection.
- Titles shouldn't have underscores
- Fixed bug where the script would always give "signature not found" error if you had MediaWiki:Gadget-CommentsInLocalTime.js gadget installed

NOVEM LINGUAE TODO:
- test unicode titles
- test titles with weird punctuation in section names, e.g. ending in ?
- get it working in Minerva

*/

// <nowiki>

class ANRFC {
	constructor( document, mw, $ ) {
		this.document = document;
		this.mw = mw;
		// eslint-disable-next-line no-jquery/variable-pattern
		this.$ = $;
		this.sections = [
			'Administrative discussions',
			'Requests for comment',
			'Deletion discussions',
			'Other types of closing requests'
		];
	}

	async execute() {
		const isNotViewing = this.mw.config.get( 'wgAction' ) !== 'view';
		if ( isNotViewing ) {
			return;
		}

		const isDiff = this.mw.config.get( 'wgDiffNewId' );
		if ( isDiff ) {
			return;
		}

		const isVirtualNamespace = this.mw.config.get( 'wgNamespaceNumber' ) < 0;
		if ( isVirtualNamespace ) {
			return;
		}

		this.mw.util.addPortletLink( 'p-cactions', '#', 'ANRFC lister', 'ca-anrfc' );
		this.$( '#ca-anrfc' ).on( 'click', () => {
			this.toggle();
		} );
	}

	toggle() {
		const $anrfcListerLinkInMoreMenu = this.$( '#ca-anrfc a' );
		if ( $anrfcListerLinkInMoreMenu.css( 'color' ) === 'rgb(255, 0, 0)' ) {
			$anrfcListerLinkInMoreMenu.css( 'color', '' );
			this.removeLabels();
		} else {
			$anrfcListerLinkInMoreMenu.css( 'color', 'red' );
			this.addLabels();
		}
	}

	removeLabels() {
		const that = this;
		this.$( 'a.mw-ANRFC' ).each( function () {
			this.remove();
			const keyId = this.getAttribute( 'indexKey' ) + '-anrfcBox';
			if ( that.document.getElementById( keyId ) !== null ) {
				return that.document.getElementById( keyId ).remove();
			}
		} );
	}

	addLabels() {
		// Target the [ vedit | edit source ] buttons by each section heading
		const that = this;
		this.$( 'span.mw-editsection' ).each( function ( index ) {
			// Add it
			that.$( this.parentElement ).append( '<a indexKey=' + index + " class='mw-ANRFC'>List on ANRFC</a>" );
			// Style it
			that.$( 'a[indexkey="' + index + '"]' ).on( 'click', function () {
				that.addForm( this );
			} );
			that.$( 'a.mw-ANRFC' ).css( { 'margin-left': '8px', 'font-size': 'small', 'font-family': 'sans-serif' } );
		} );
	}

	/**
	 * @param el HTML element span.mw-editsection
	 */
	addForm( el ) {
		// If there's a form already created, delete it. (This makes the "List on ANRFC" link a toggle that opens the form or closes the form, based on current state.)
		const keyId = el.getAttribute( 'indexKey' ) + '-anrfcBox';
		if ( this.document.getElementById( keyId ) !== null ) {
			return this.document.getElementById( keyId ).remove();
		}

		const $anrfcBox = this.getFormHtmlAndSetFormListeners( keyId );

		// el (span.mw-editsection) -> parent (h2) -> after
		this.$( el ).parent().after( $anrfcBox );
	}

	getFormHtmlAndSetFormListeners( keyId ) {
		const $anrfcBox = this.$( '<div>', {
			id: keyId
		} );

		$anrfcBox.css( {
			margin: '16px 0',
			padding: '16px',
			'background-color': '#f3f3f3',
			border: '1px solid grey',
			'font-size': '14px',
			'font-family': 'sans-serif'
		} );

		const items = [];
		let i = 0;
		for ( const section of this.sections ) {
			items.push( new OO.ui.MenuOptionWidget( {
				data: i,
				label: section
			} ) );
			i++;
		}
		const dropDown = new OO.ui.DropdownWidget( {
			label: 'Dropdown menu: Select discussion section',
			menu: {
				items: items
			}
		} );

		const messageInput = new OO.ui.MultilineTextInputWidget( {
			placeholder: 'Custom message (optional)',
			multiline: true,
			autosize: true,
			maxRows: 4
		} );

		const submitButton = new OO.ui.ButtonWidget( {
			label: 'Submit',
			flags: [
				'progressive',
				'primary'
			]
		} );

		const cancelButton = new OO.ui.ButtonWidget( {
			label: 'Cancel'
		} );

		$anrfcBox.append( '<h3 style="margin: 0 0 16px;">List this discussion on <a href="/wiki/Wikipedia:Closure_requests" target="_blank">Wikipedia:Closure requests</a></h3>' );
		let wrapper = this.document.createElement( 'div' );
		this.$( wrapper ).append( '<p>Under section: </p>' );
		this.$( wrapper ).append( dropDown.$element );
		$anrfcBox.append( wrapper );

		wrapper = this.document.createElement( 'div' );
		this.$( wrapper ).css( { 'margin-top': '8px' } );
		this.$( wrapper ).append( messageInput.$element );
		this.$( wrapper ).append( this.$( submitButton.$element ).css( {
			'margin-top': '8px'
		} ) );
		this.$( wrapper ).append( this.$( cancelButton.$element ).css( {
			'margin-top': '8px'
		} ) );
		$anrfcBox.append( wrapper );

		submitButton.on( 'click', () => {
			this.onSubmit( dropDown, messageInput, keyId );
		} );

		cancelButton.on( 'click', function () {
			this.document.getElementById( keyId ).remove();
		} );

		return $anrfcBox;
	}

	/**
	 * @param {OO.ui.DropdownWidget} dropDown The discussion section the user selected.
	 * @param {OO.ui.MultilineTextInputWidget} messageInput The message the user typed.
	 * @param {string} keyId The section number (starting at zero), concatenated with -anrfcBox. Example: 0-anrfcBox. This will eventually be used to do $('#0-anrfcBox'), which is the HTML created by addForm()
	 */
	async onSubmit( dropDown, messageInput, keyId ) {
		// Dropdown is required.
		if ( dropDown.getMenu().findSelectedItem() === null ) {
			return OO.ui.alert( 'Please select discussion section from dropdown menu!' ).then( () => {
				dropDown.focus();
			} );
		}

		// Grab what the user typed into the form.
		const targetSection = dropDown.getMenu().findSelectedItem().getData();
		const message = messageInput.getValue();

		// Grab page title
		const pageName = this.mw.config.get( 'wgPageName' ).replaceAll( '_', ' ' );

		// Grab section title
		const sectionTitle = this.$( '#' + keyId ).prev().find( 'h2, h3, h4, h5, h6' ).text();
		if ( !sectionTitle ) {
			return OO.ui.alert( 'Unable to find the section heading name. This is a bug. Please report the bug at User talk:Novem Linguae/Scripts/anrfc-lister.js. Aborting.' );
		}

		// Grab RFC date by looking for user signature timestamps
		const initDateMatches = this.getRFCDate( keyId );
		if ( !initDateMatches ) {
			return OO.ui.alert( 'Unable to find a signature in this section. Unsure what date this RFC occurred. Aborting.' );
		}
		const initiatedDate = initDateMatches[ 0 ];

		// Get ready to write some WP:ANRFC wikicode
		const heading = '=== [[' + pageName + '#' + sectionTitle + ']] ===';
		const initiatedTemplate = '{{initiated|' + initiatedDate + '}}';
		const wikitextToWrite = heading + '\n' + initiatedTemplate + ' ' + message + ' ~~~~';

		const api = new this.mw.Api();
		let result = await api.get( {
			action: 'parse',
			page: 'Wikipedia:Closure_requests',
			prop: 'wikitext'
		} );

		let wikitext = result.parse.wikitext[ '*' ];
		if ( wikitext.replaceAll( ' ', '_' ).match( ( pageName + '#' + sectionTitle ).replaceAll( ' ', '_' ) ) !== null ) {
			return OO.ui.alert( 'This discussion is already listed.' );
		}

		wikitext = this.makeWikitext( wikitext, wikitextToWrite, initiatedDate, targetSection );

		result = await api.postWithEditToken( {
			action: 'edit',
			title: 'Wikipedia:Closure_requests',
			text: wikitext,
			summary: 'Listing new discussion using [[User:Novem Linguae/Scripts/anrfc-lister.js|anrfc-lister]]',
			nocreate: true
		} );

		if ( result && result.edit && result.edit.result && result.edit.result === 'Success' ) {
			const confirmed = await OO.ui.confirm( 'This discussion has been listed on WP:ANRFC. Would you like to see it?' );

			if ( confirmed ) {
				let sectionPartOfUri = pageName + '#' + sectionTitle;
				sectionPartOfUri = sectionPartOfUri.replaceAll( ' ', '_' );
				sectionPartOfUri = encodeURI( sectionPartOfUri );
				window.open( '/wiki/Wikipedia:Closure_requests#' + sectionPartOfUri, '_blank' );
			}
		}
	}

	dateToObj( dateString ) {
		const months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
		const oDate = dateString.split( /, | / );
		oDate[ 0 ] = oDate[ 0 ].match( /[\d]{1,2}:[\d]{1,2}/ )[ 0 ];
		const time = {
			hh: oDate[ 0 ].match( /([\d]{1,2}):/ )[ 1 ],
			mm: oDate[ 0 ].match( /:([\d]{1,2})/ )[ 1 ]
		};
		return {
			time: time,
			day: parseInt( oDate[ 1 ] ),
			month: months.indexOf( oDate[ 2 ] ),
			year: parseInt( oDate[ 3 ] )
		};
	}

	getRFCDate( keyId ) {
		// Grab initiated date (the first signature in the section will have the initiated date)

		// Looks for a standard signature: 03:31, 11 January 2024 (UTC)
		const dateRegex = /([\d]{1,2}:[\d]{1,2},\s[\d]{1,2}\s[\w]+\s[\d]{4}\s\([\w]+\))/;
		// Looks for a MediaWiki:Gadget-CommentsInLocalTime.js signature: 10:55 am, 29 November 2016, Tuesday (7 years, 1 month, 13 days ago) (UTC−8)
		const dateRegexForCommentsInLocalTimeGadget = /([\d]{1,2}:[\d]{1,2}(?: am| pm)?,\s[\d]{1,2}\s[\w]+\s[\d]{4}.*?\(UTC[^)]+\))/;
		let initDateMatches = null;
		let textToCheck = '';
		let $nextEl = this.$( '#' + keyId ); // #0-anrfcBox
		// TODO: Only check elements between anrfcBox and the next H2 (or end of page). Right now it checks the entire page until it runs out of .next() elements.
		do {
			if ( $nextEl.next().hasClass( 'boilerplate' ) ) {
				$nextEl = $nextEl.next().children( 'p' );
			} else {
				$nextEl = $nextEl.next();
			}

			textToCheck = $nextEl.text();
			initDateMatches = textToCheck.match( dateRegex );
			if ( !initDateMatches ) {
				// Maybe the user has MediaWiki:Gadget-CommentsInLocalTime.js installed, which changes the format of signature dates. Try the other regex.
				initDateMatches = textToCheck.match( dateRegexForCommentsInLocalTimeGadget );
				if ( initDateMatches ) {
					initDateMatches[ 0 ] = this.convertUtcWhateverToUtcZero( initDateMatches[ 0 ] );
				}
			}

			if ( !$nextEl.length ) {
				// We're out of siblings to check at this level. Try the parent's siblings.
				$nextEl = $nextEl.prevObject.parent().next();
			}
		} while ( !initDateMatches && $nextEl.length );

		return initDateMatches;
	}

	/**
	 * Convert MediaWiki:Gadget-CommentsInLocalTime.js date strings to regular date strings
	 *
	 * @param {string} dateString 10:55 am, 29 November 2016, Tuesday (7 years, 1 month, 13 days ago) (UTC−8)
	 * @return {string} 18:55, 29 November 2016
	 */
	convertUtcWhateverToUtcZero( dateString ) {
		const months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];

		// chop out unnecessary info in the middle of the string
		const dateStringShort = dateString.replace( /(\d{4}),.+( \(UTC)/, '$1$2' ); // 10:55 am, 29 November 2016 (UTC−8)

		const unixTimestampWithMilliseconds = Date.parse( dateStringShort ); // 1480445700000
		const date = new Date( unixTimestampWithMilliseconds );
		const dateStringConverted = date.getUTCHours() + ':' +
			date.getUTCMinutes() + ', ' +
			date.getUTCDate() + ' ' +
			months[ date.getUTCMonth() ] + ' ' +
			date.getUTCFullYear();
		return dateStringConverted; // 18:55, 29 November 2016
	}

	isInitDateLatest( matchDate, initDate ) {
		if ( initDate.year > matchDate.year ) {
			return true;
		} else if ( initDate.year < matchDate.year ) {
			return false;
		} else if ( initDate.month > matchDate.month ) {
			return true;
		} else if ( initDate.month < matchDate.month ) {
			return false;
		} else if ( initDate.day > matchDate.day ) {
			return true;
		} else if ( initDate.day < matchDate.day ) {
			return false;
		} else if ( initDate.time.hh > matchDate.time.hh ) {
			return true;
		} else if ( initDate.time.hh < matchDate.time.hh ) {
			return false;
		} else if ( initDate.time.mm > matchDate.time.mm ) {
			return true;
		} else if ( initDate.time.mm < matchDate.time.mm ) {
			return false;
		}
		return true;
	}

	makeWikitext( wikitext, wikitextToWrite, initiatedDate, targetSection ) {
		const discussions = [
			'== Administrative discussions ==',
			'== Requests for comment ==',
			'== Deletion discussions ==',
			'== Other types of closing requests =='
		];

		const firstPart = wikitext.slice( 0, wikitext.indexOf( discussions[ targetSection ] ) );
		wikitext = wikitext.slice( wikitext.indexOf( discussions[ targetSection ] ) );
		const isLastDiscussion = ( targetSection === discussions.length - 1 );
		let relventDiscussion = ( isLastDiscussion ) ? wikitext : wikitext.slice( 0, wikitext.indexOf( discussions[ targetSection + 1 ] ) );
		wikitext = ( isLastDiscussion ) ? '' : wikitext.slice( wikitext.indexOf( discussions[ targetSection + 1 ] ) );

		const initMatches = relventDiscussion.match( /((i|I)nitiated\|[\d]{1,2}:[\d]{1,2},\s[\d]{1,2}\s[\w]+\s[\d]{4}\s\([\w]+\))/g );

		const initDateObj = this.dateToObj( initiatedDate );
		let matchIndex = ( initMatches !== null ) ? initMatches.length - 1 : -1;
		if ( initMatches !== null ) {
			for ( ; matchIndex >= 0; matchIndex-- ) {
				if ( this.isInitDateLatest( this.dateToObj( initMatches[ matchIndex ] ), initDateObj ) ) {
					break;
				}
			}
		}

		let left;
		if ( matchIndex === -1 ) {
			left = relventDiscussion.slice( 0, relventDiscussion.indexOf( '===' ) );
			relventDiscussion = relventDiscussion.slice( relventDiscussion.indexOf( '===' ) );
			relventDiscussion = left + wikitextToWrite + '\n\n' + relventDiscussion;
		} else {
			const afterDate = initMatches[ matchIndex ];

			left = relventDiscussion.slice( 0, relventDiscussion.indexOf( afterDate ) );
			relventDiscussion = relventDiscussion.slice( relventDiscussion.indexOf( afterDate ) );
			left = left + relventDiscussion.slice( 0, relventDiscussion.indexOf( '===' ) );
			relventDiscussion = relventDiscussion.slice( relventDiscussion.indexOf( '===' ) );

			relventDiscussion = left + wikitextToWrite + '\n\n' + relventDiscussion;
		}

		return ( firstPart + relventDiscussion + wikitext );
	}
}

$( async () => {
	await mw.loader.using( [ 'oojs-ui-widgets', 'oojs-ui-windows', 'mediawiki.util', 'mediawiki.api' ], async () => {
		await ( new ANRFC( document, mw, $ ) ).execute();
	} );
} );

// </nowiki>
