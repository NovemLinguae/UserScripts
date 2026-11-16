export class UnblockReview {
	constructor() {
		this.SIGNATURE = '~~~~';
	}

	/**
	 * Process the accept or decline of an unblock request.
	 *
	 * @param {string} wikitext - The wikitext of the page.
	 * @param {string} paramsAndReason - The parameters and reason of the unblock request, e.g.
	 *                                   "NewUsername|Reason" or "Reason". The initial pipe is omitted.
	 * @param {string} acceptDeclineReason - The reason for accepting or declining the unblock request.
	 * @param {string} DEFAULT_DECLINE_REASON - The default reason for declining the unblock request.
	 * @param {string} acceptOrDecline - Either "accept" or "decline".
	 * @return {string} wikitext
	 */
	processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) {
		// HTML does one line break and wikitext does 2ish. Cut off all text after the first line break to avoid breaking our search algorithm.
		paramsAndReason = paramsAndReason.split( '\n' )[ 0 ];

		let initialText = '';
		// Special case: If the user didn't provide a reason, the template will display "Please provide a reason as to why you should be unblocked", and this will be detected as the appealReason.
		const reasonIsProvided = !paramsAndReason.startsWith( 'Please provide a reason as to why you should be unblocked' );
		if ( !reasonIsProvided ) {
			const nowikiRanges = this.getNowikiRanges( wikitext );
			const match = [ ...wikitext.matchAll( /(\{\{Unblock)\}\}/gi ) ].find(
				( candidate ) => !this.isInsideNowiki( candidate.index, nowikiRanges )
			);
			if ( !match ) {
				throw new Error( 'Searching for target text failed' );
			}
			initialText = match[ 1 ];
			paramsAndReason = '';
		} else {
			initialText = this.getLeftHalfOfUnblockTemplate( wikitext, paramsAndReason );
		}

		// if reason is blank, use the default decline reason
		if ( !acceptDeclineReason.trim() && acceptOrDecline === 'decline' ) {
			acceptDeclineReason = DEFAULT_DECLINE_REASON;
		}

		// if someone accepts using the default decline reason, blank it.
		// we can't combine this line with the above because the default decline reason can also be entered by the user, and this is common because it's the default reason in the HTML form.
		if ( acceptOrDecline === 'accept' && acceptDeclineReason === DEFAULT_DECLINE_REASON ) {
			acceptDeclineReason = '';
		}

		// add signature if not present, including if the reason is blank
		if ( acceptDeclineReason && !this.hasSignature( acceptDeclineReason ) ) {
			acceptDeclineReason += ' ' + this.SIGNATURE;
		} else if ( !acceptDeclineReason ) {
			acceptDeclineReason = this.SIGNATURE;
		}

		const regEx = new RegExp(
			this.escapeRegExp( initialText ) + '(' + this.getAppealReasonPattern( paramsAndReason ) + ')',
			'g'
		);
		const nowikiRanges = this.getNowikiRanges( wikitext );
		const matches = [ ...wikitext.matchAll( regEx ) ].filter(
			( match ) => !this.isInsideNowiki( match.index, nowikiRanges )
		);
		if ( matches.length > 1 ) {
			throw new Error( 'Too many matching unblock templates found' );
		}
		if ( matches.length === 0 ) {
			throw new Error( 'Replacing text with unblock message failed' );
		}

		const templateName = initialText.match( /^\{\{([A-Za-z-]+)/i )[ 1 ];
		const match = matches[ 0 ];
		// Always add 1=. That way if there's an unescaped equals sign after it, it won't break things.
		let replacement = '{{' + templateName + ' reviewed|' + acceptOrDecline + '=' + acceptDeclineReason + '|1=' + match[ 1 ];

		// {{Unblock-spamun}} has an extra parameter for the new username. Example:
		// {{Unblock-spamun|NewUsername|Your reason here}}
		// So the output need to have a 2= instead of a 1=. Example:
		// {{Unblock-spamun reviewed|accept=I accept. ~~~~|NewUsername|2=Your reason here}}
		const hasExtraUsernameParameter = templateName.toLowerCase() === 'unblock-spamun';
		if ( hasExtraUsernameParameter ) {
			// delete the first 1=
			replacement = replacement.replace( '|1=', '|' );
			// add a 2= after the third pipe
			const thirdPipePos = this.getPosition( replacement, '|', 3 );
			replacement = replacement.slice( 0, thirdPipePos ) + '|2=' + replacement.slice( thirdPipePos + 1 );
		}

		let wikitext2 = wikitext.slice( 0, match.index ) + replacement + wikitext.slice( match.index + match[ 0 ].length );
		if ( wikitext === wikitext2 ) {
			throw new Error( 'Replacing text with unblock message failed' );
		}

		// get rid of any [#*:] in front of {{unblock X}} templates. indentation messes up the background color and border of the unblock template.
		const updatedNowikiRanges = this.getNowikiRanges( wikitext2 );
		wikitext2 = wikitext2.replace(
			/^[#*: ]{1,}(\{\{\s*unblock)/gmi,
			( fullMatch, template, offset ) => this.isInsideNowiki( offset, updatedNowikiRanges ) ? fullMatch : template
		);

		return wikitext2;
	}

	/**
	 * @copyright Denys Seguret, CC BY-SA 4.0, https://stackoverflow.com/a/14480366/3480193
	 */
	getPosition( haystack, needle, nthOccurrence ) {
		return haystack.split( needle, nthOccurrence ).join( needle ).length;
	}

	/**
	 * Given the wikitext of an entire page, and the |reason= parameter of one of the many unblock templates (e.g. {{Unblock}}, {{Unblock-un}}, {{Unblock-auto}}, {{Unblock-bot}}, etc.), return the wikitext of just the beginning of the template.
	 *
	 * For example, "Test {{unblock|reason=Your reason here [[User:Filipe46]]}} Test" as the wikitext and "Your reason here" as the appealReason will return "{{unblock|reason=".
	 *
	 * This can also handle 1=, and no parameter at all (just a pipe)
	 */
	getLeftHalfOfUnblockTemplate( wikitext, appealReason ) {
		// Isolate the reason, stripping out all template syntax. So `{{Unblock|reason=ABC}}` becomes matches = [ 'ABC ']
		// eslint-disable-next-line no-useless-concat
		const negativeLookbehinds = '(?<!<' + 'nowiki>{{unblock\\|reason=)(?<!reviewed ?\\|1=)';
		const regEx = new RegExp( negativeLookbehinds + this.getAppealReasonPattern( appealReason ), 'g' );
		let matches = wikitext.matchAll( regEx );
		matches = [ ...matches ];
		const nowikiRanges = this.getNowikiRanges( wikitext );
		let hasNonNowikiMatch = false;

		if ( matches.length === 0 ) {
			throw new Error( 'Searching for target text failed' );
		}

		// Loop through all the potential matches, trying to find an {{Unblock template. If found, return the beginning of the template.
		for ( const match of matches ) {
			const matchPos = match.index;
			let unblockTemplateStartPos;

			// Scan backwards from the match until we find {{
			// Stop at the beginning of the string OR after 50 characters
			const stopPos = Math.max( 0, matchPos - 50 );
			for ( let i = matchPos; i > stopPos; i-- ) {
				if ( wikitext[ i ] === '{' && wikitext[ i - 1 ] === '{' ) {
					unblockTemplateStartPos = i - 1;
					break;
				}
			}

			if ( this.isInsideNowiki( unblockTemplateStartPos === undefined ? matchPos : unblockTemplateStartPos, nowikiRanges ) ) {
				continue;
			}
			hasNonNowikiMatch = true;

			// Don't match stuff that isn't an unblock template
			const initialText = wikitext.slice( unblockTemplateStartPos, matchPos );
			if ( !initialText.match( /^\{\{unblock/i ) ) {
				continue;
			}

			// Don't match already reviewed templates. These are marked with the word "reviewed". Example: {{unblock-spamun reviewed|
			if ( initialText.match( /\s+reviewed\s*\|/ ) ) {
				continue;
			}

			return initialText;
		}

		throw new Error( hasNonNowikiMatch ? 'Failed to find left half of unblock template in the wikicode' : 'Searching for target text failed' );
	}

	/**
	 * Find non-self-closing nowiki elements, including unterminated ones.
	 *
	 * @param {string} wikitext - The wikitext to search.
	 * @return {Array<number[]>} Start-inclusive, end-exclusive UTF-16 offset pairs.
	 */
	getNowikiRanges( wikitext ) {
		// eslint-disable-next-line no-useless-concat
		const tagPattern = new RegExp( '<\\/?no' + 'wiki\\b(?:\\s+(?:"[^"]*"|\'[^\']*\'|[^\'"<>])*)?\\s*\\/?>', 'gi' );
		const ranges = [];
		let start;
		for ( const match of wikitext.matchAll( tagPattern ) ) {
			if ( match[ 0 ][ 1 ] === '/' ) {
				if ( start !== undefined ) {
					ranges.push( [ start, match.index + match[ 0 ].length ] );
					start = undefined;
				}
			} else if ( start === undefined && !/\/\s*>$/.test( match[ 0 ] ) ) {
				start = match.index;
			}
		}
		if ( start !== undefined ) {
			ranges.push( [ start, wikitext.length ] );
		}
		return ranges;
	}

	isInsideNowiki( position, ranges ) {
		return ranges.some( ( range ) => position >= range[ 0 ] && position < range[ 1 ] );
	}

	/**
	 * Return a regex pattern that matches the appeal reason wikitext, even if it contains <tags> or wikilinks.
	 *
	 * @param {string} appealReason - The rendered appeal text.
	 * @return {string} Regex pattern for matching the original wikitext.
	 */
	getAppealReasonPattern( appealReason ) {
		// Matches HTML-style tags, wikilink delimiters, and piped link targets between rendered characters.
		const markup = '(?:<\\/?[a-zA-Z][a-zA-Z0-9:-]*(?:\\s+(?:"[^"]*"|\'[^\']*\'|[^\'"<>])*)?\\s*\\/?>|\\[\\[[^\\[\\]|\\n]*\\||\\[\\[|\\]\\])*';
		return Array.from( appealReason, ( character ) => markup + this.escapeRegExp( character ) ).join( '' );
	}

	/**
	 * @copyright coolaj86, CC BY-SA 4.0, https://stackoverflow.com/a/6969486/3480193
	 */
	escapeRegExp( string ) {
		// $& means the whole matched string
		return string.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	}

	/**
	 * Is there a signature (four tildes) present in the given text, outside of a nowiki element?
	 */
	hasSignature( text ) {
		// no literal signature?
		if ( !text.includes( this.SIGNATURE ) ) {
			return false;
		}

		// if there's a literal signature and no nowiki elements,
		// there must be a real signature
		// eslint-disable-next-line no-useless-concat
		if ( !text.includes( '<no' + 'wiki>' ) ) {
			return true;
		}

		// Save all nowiki spans
		const nowikiSpanStarts = []; // list of ignored span beginnings
		const nowikiSpanLengths = []; // list of ignored span lengths
		// eslint-disable-next-line no-useless-concat
		const NOWIKI_RE = new RegExp( '<no' + 'wiki>.*?</no' + 'wiki>', 'g' );
		let spanMatch;
		do {
			spanMatch = NOWIKI_RE.exec( text );
			if ( spanMatch ) {
				nowikiSpanStarts.push( spanMatch.index );
				nowikiSpanLengths.push( spanMatch[ 0 ].length );
			}
		} while ( spanMatch );

		// So that we don't check every ignore span every time
		let nowikiSpanStartIdx = 0;

		const SIG_RE = new RegExp( this.SIGNATURE, 'g' );
		let sigMatch;

		matchLoop:
		do {
			sigMatch = SIG_RE.exec( text );
			if ( sigMatch ) {
				// Check that we're not inside a nowiki
				for ( let nwIdx = nowikiSpanStartIdx; nwIdx <
					nowikiSpanStarts.length; nwIdx++ ) {
					if ( sigMatch.index > nowikiSpanStarts[ nwIdx ] ) {
						if ( sigMatch.index + sigMatch[ 0 ].length <=
							nowikiSpanStarts[ nwIdx ] + nowikiSpanLengths[ nwIdx ] ) {

							// Invalid sig
							continue matchLoop;
						} else {
							// We'll never encounter this span again, since
							// headers only get later and later in the wikitext
							nowikiSpanStartIdx = nwIdx;
						}
					}
				}

				// We aren't inside a nowiki
				return true;
			}
		} while ( sigMatch );
		return false;
	}
}
