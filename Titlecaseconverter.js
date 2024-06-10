// Forked from https://en.wikipedia.org/wiki/User:ZKang123/Titlecaseconverter.js

/* eslint-disable no-alert, no-console */

$( () => {
	/**
	 * Convert titles to title case
	 */
	function toTitleCase( title ) {
		const isAllCaps = title.toUpperCase() === title;
		if ( isAllCaps ) {
			title = title.toLowerCase();
		}

		title = title.split( ' ' ).map( ( word, index, array ) => {
			// Retain words that are already in uppercase or are special cases
			if ( word.toUpperCase() === word || isSpecialCase( word ) ) {
				return word;
			}

			// Retain capitalization for words following certain punctuation marks
			if ( index > 0 && /[/;\-,]/.test( array[ index - 1 ] ) ) {
				return word.charAt( 0 ).toUpperCase() + word.slice( 1 );
			}

			// if there's already a capital letter in the word, we probably don't want to change it
			const hasUpperCaseLetter = word.toLowerCase() !== word;
			if ( hasUpperCaseLetter ) {
				return word;
			} else if ( shouldCapitalize( word, index, array ) ) {
				return word.charAt( 0 ).toUpperCase() + word.slice( 1 ).toLowerCase();
			} else {
				return word.toLowerCase();
			}
		} ).join( ' ' );

		// Capitalize first letters that occur after punctuation
		title = title.replace( / [^A-Za-z][a-z]/g, ( match ) => ' ' + match.slice( 1, 2 ) + match.slice( 2 ).toUpperCase() );

		// Capitalize anything after a semicolon
		title = title.replace( /;[a-z]/g, ( match ) => ';' + match.slice( 1 ).toUpperCase() );

		// Capitalize letters mid-word that occur after hyphens or slashes
		title = title.replace( /-[a-z]/g, ( match ) => '-' + match.slice( 1 ).toUpperCase() );
		title = title.replace( /\/[a-z]/g, ( match ) => '/' + match.slice( 1 ).toUpperCase() );

		return title;
	}

	/**
	 * Check if a word is an abbreviation or an exception
	 */
	function isSpecialCase( word ) {
		// Define custom exceptions for abbreviations and specific titles
		const exceptions = [ 'MRT', 'LTA', 'S$', 'US$', 'NASA', 'FBI', 'MP3' ]; // Add more exceptions as needed
		return exceptions.includes( word ) || /^[A-Z0-9]+$/.test( word );
	}

	function shouldCapitalize( word, index, array ) {
		const alwaysCapitalize = [ 'Me', 'It', 'His', 'If', 'Be', 'Am', 'Is', 'Are', 'Being', 'Was', 'Were', 'Been', 'During', 'Through', 'About', 'Until', 'Below', 'Under' ];
		const doNotCapitalize = [ 'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'as', 'in', 'of', 'on', 'to', 'from', 'into', 'like', 'over', 'with', 'upon' ];
		const punctuationMarks = [ '.', ',', ';', ':', '?', '!' ];

		const isAbbr = isSpecialCase( word );
		const isProperNoun = alwaysCapitalize.includes( word );
		const isShortWord = doNotCapitalize.includes( word );
		const isFirstOrLastWord = index === 0 || index === array.length - 1;
		const isLongPreposition = word.length >= 5;
		const isVerb = [ 'be', 'am', 'is', 'are', 'being', 'was', 'were', 'been' ].includes( word.toLowerCase() );

		// Preserve capitalization after punctuation marks
		if ( index > 0 ) {
			const prevWord = array[ index - 1 ];
			const lastChar = prevWord.charAt( prevWord.length - 1 );
			if ( punctuationMarks.includes( lastChar ) ) {
				return true;
			}
		}

		return isAbbr || isFirstOrLastWord || isProperNoun || isLongPreposition || !isShortWord || isVerb;
	}

	/**
	 * Convert reference titles in the HTML content
	 */
	function convertReferenceTitles( htmlString ) {
		const citationRegex = /<ref[^>]*>.*?<\/ref>/gi;
		const titleRegex = /(\|title=)([^|]+)(\|)/i;

		return htmlString.replace( citationRegex, ( match ) => match.replace( titleRegex, ( titleMatch, p1, p2, p3 ) => {
			const originalTitle = p2.trim();
			const titleCaseTitle = toTitleCase( originalTitle );
			return `${ p1 }${ titleCaseTitle }${ p3 }`;
		} ) );
	}

	/**
	 * Load the script and add the sidebar link
	 */
	function loadTitleCaseConverter() {
		// Create the sidebar link
		const sidebarLink = document.createElement( 'li' );
		const link = document.createElement( 'a' );
		link.innerText = 'Convert Ref Titles to Title Case';
		link.href = '#';
		link.style.cssText = 'cursor: pointer; color: #0645ad;';

		// Add click event listener to the link
		link.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			const textArea = document.querySelector( '#wpTextbox1' );
			if ( textArea ) {
				const summary = 'Converted reference titles to title case per [[MOS:CT]]';
				textArea.value = convertReferenceTitles( textArea.value );
				// Set default editing summary
				const summaryInput = document.querySelector( '#wpSummary' );
				if ( summaryInput && !summaryInput.value.trim() ) {
					summaryInput.value = summary;
				}
			} else {
				alert( 'Error: Editing area not found!' );
			}
		} );

		sidebarLink.appendChild( link );

		// Add the link to the sidebar (p-tb section)
		const sidebar = document.getElementById( 'p-tb' );
		const ul = sidebar ? sidebar.querySelector( 'ul' ) : null;
		if ( ul ) {
			ul.appendChild( sidebarLink );
		} else {
			alert( 'Error: Sidebar section not found!' );
		}
	}

	function runUnitTests() {
		const tests = [
			// normal
			{
				old: 'The South and West lines',
				new: 'The South and West Lines'
			},
			{
				old: 'Work on second phase of MRT system ahead of schedule',
				new: 'Work on Second Phase of MRT System Ahead of Schedule'
			},
			{
				old: 'Earlier target date for Phase II MRT',
				new: 'Earlier Target Date for Phase II MRT'
			},
			{
				old: 'MRT System to be Implemented in Eight Stages',
				new: 'MRT System to Be Implemented in Eight Stages'
			},
			{
				old: 'MRT to Bt Batok, Bt Gombak and Choa Chu Kang on Mar 10',
				new: 'MRT to Bt Batok, Bt Gombak and Choa Chu Kang on Mar 10'
			},
			// mid-word hyphens and slashes
			{
				old: 'Revived, re-opened, newly appreciated',
				new: 'Revived, Re-Opened, Newly Appreciated'
			},
			{
				old: "Streetscapes/eldridge street Synagogue;a prayer-filled time capsule from the 1880's",
				new: "Streetscapes/Eldridge Street Synagogue;A Prayer-Filled Time Capsule from the 1880's"
			},
			{
				old: 'Phase 2 gets go-ahead to ensure continuity',
				new: 'Phase 2 Gets Go-Ahead To Ensure Continuity'
			},
			// weird mid-word capitalization
			{
				old: 'Phase 2 gets go-ahead to build iPad',
				new: 'Phase 2 Gets Go-Ahead To Build iPad'
			},
			{
				old: 'Phase 2 gets go-ahead to build DataMall',
				new: 'Phase 2 Gets Go-Ahead To Build DataMall'
			},
			// all caps
			{
				old: 'PHASE 2 GETS GO-AHEAD TO ENSURE CONTINUITY',
				new: 'Phase 2 Gets Go-Ahead To Ensure Continuity'
			},
			// punctuation at beginning of word
			{
				old: 'She was "amazingly spectacular"',
				new: 'She Was "Amazingly Spectacular"'
			}
		];

		let i = 1;
		let failures = 0;
		for ( const test of tests ) {
			const actual = toTitleCase( test.old );
			if ( actual !== test.new ) {
				console.log( `[Titlecaseconverter.js] Failed unit test ${ i }. Received "${ actual }" instead of "${ test.new }".` );
				failures++;
			}
			i++;
		}
		if ( !failures ) {
			console.log( '[Titlecaseconverter.js] All unit tests passed. Yay.' );
		}
	}

	// Load the script when the page is ready
	if ( document.readyState !== 'loading' ) {
		loadTitleCaseConverter();
	} else {
		document.addEventListener( 'DOMContentLoaded', loadTitleCaseConverter );
	}

	// Put this at the top of your common.js file to run unit tests in the browser devtools console:
	// window.TitleCaseConverterUnitTests = true;
	if ( window.TitleCaseConverterUnitTests ) {
		runUnitTests();
	}
} );
