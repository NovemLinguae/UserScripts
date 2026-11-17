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
	 * @param {boolean} isSpamUn - Whether the request includes a separate username parameter.
	 * @return {string} wikitext
	 */
	processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline, isSpamUn = false ) {
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
			initialText = this.getLeftHalfOfUnblockTemplate( wikitext, paramsAndReason, isSpamUn );
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
			this.escapeRegExp( initialText ) + '(' + this.getAppealReasonPattern( paramsAndReason, isSpamUn ) + ')',
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

		// If the match starts inside {{u|...}}, unwrap it without assuming how other templates render.
		const templateName = initialText.match( /^\{\{([A-Za-z-]+)/i )[ 1 ];
		const match = matches[ 0 ];
		let matchedReason = match[ 1 ];
		let remainingText = wikitext.slice( match.index + match[ 0 ].length );
		const nestedStart = initialText.lastIndexOf( '{{' );
		if ( nestedStart > 0 && nestedStart > initialText.lastIndexOf( '}}' ) ) {
			// The opening markup is in initialText, so remove its matching closing braces as well.
			const nestedTemplate = wikitext.slice( match.index + nestedStart ).match( /^\{\{\s*u\s*\|\s*([^{}|\n]+?)\}\}/i );
			if ( !nestedTemplate || !matchedReason.startsWith( nestedTemplate[ 1 ] ) ) {
				throw new Error( 'Unable to safely match the nested template in the unblock reason' );
			}
			const closeOffset = nestedTemplate[ 1 ].length;
			const reasonAndRemainingText = matchedReason + remainingText;
			if ( reasonAndRemainingText.slice( closeOffset, closeOffset + 2 ) !== '}}' ) {
				throw new Error( 'Unable to safely match the nested template in the unblock reason' );
			}
			const remainingStart = Math.max( matchedReason.length, closeOffset + 2 );
			matchedReason = reasonAndRemainingText.slice( 0, closeOffset ) +
				reasonAndRemainingText.slice( closeOffset + 2, remainingStart );
			remainingText = reasonAndRemainingText.slice( remainingStart );
		}
		// Always add 1=. That way if there's an unescaped equals sign after it, it won't break things.
		let replacement = '{{' + templateName + ' reviewed|' + acceptOrDecline + '=' + acceptDeclineReason + '|1=' + matchedReason;

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

		let wikitext2 = wikitext.slice( 0, match.index ) + replacement + remainingText;
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
	getLeftHalfOfUnblockTemplate( wikitext, appealReason, isSpamUn = false ) {
		const nowikiRanges = this.getNowikiRanges( wikitext );
		
		// Find all {{unblock...|reason=... patterns using matchAll
		const structuredMatches = [ ...wikitext.matchAll( /\{\{unblock[^}]*\|reason\s*=\s*/gi ) ].filter(
			( match ) => !this.isInsideNowiki( match.index, nowikiRanges ) &&
				( !isSpamUn || /^\{\{unblock-spamun\s*\|/i.test( match[ 0 ] ) )
		);
		
		// Try each structured match to see if the reason after it matches appealReason
		for ( const unblockReasonMatch of structuredMatches ) {
			const reasonStartPos = unblockReasonMatch.index + unblockReasonMatch[0].length;
			const reasonPattern = new RegExp( this.getAppealReasonPattern( appealReason, isSpamUn ) );
			const reasonText = wikitext.substring( reasonStartPos );
			const reasonMatch = reasonText.match( reasonPattern );

			if ( reasonMatch ) {
				// Found a match! But need to verify it's the correct template.
				// The match position could be in a nested template if the pattern allows }}
				// Find the closing }} of THIS template to ensure our match is inside it
				
				// Count braces from the {{unblock start to find where this template closes
				let braceDepth = 2; // Start with the opening {{
				let closePos = unblockReasonMatch.index + unblockReasonMatch[0].length;
				
				// Scan forward to find the closing }} that closes this {{unblock template
				for ( let i = closePos; i < wikitext.length - 1; i++ ) {
					if ( wikitext[i] === '{' && wikitext[i+1] === '{' ) {
						braceDepth += 2;
						i++; // Skip next char since we just processed it
					} else if ( wikitext[i] === '}' && wikitext[i+1] === '}' ) {
						braceDepth -= 2;
						if ( braceDepth === 0 ) {
							closePos = i;
							break;
						}
						i++; // Skip next char since we just processed it
					}
				}
				
				const matchPos = reasonStartPos + reasonMatch.index;
				
				// Verify the match is within this template (before the closing }})
				if ( matchPos < closePos && ( !isSpamUn || matchPos + reasonMatch[ 0 ].length <= closePos ) ) {
					const initialText = wikitext.slice( unblockReasonMatch.index, matchPos );
					
					if ( !initialText.match( /^\{\{unblock/i ) ) {
						throw new Error( 'Failed to find left half of unblock template in the wikicode' );
					}

					return initialText;
				}
				// Otherwise, continue to the next structured match
			}
		}
		
		// If we didn't find a match via the structured approach, fall back to pattern-based approach
		// Isolate the reason, stripping out all template syntax. So `{{Unblock|reason=ABC}}` becomes matches = [ 'ABC ']
		// eslint-disable-next-line no-useless-concat
		const negativeLookbehinds = '(?<!<' + 'nowiki>{{unblock\\|reason=)(?<!reviewed ?\\|1=)';
		const regEx = new RegExp( negativeLookbehinds + this.getAppealReasonPattern( appealReason, isSpamUn ), 'g' );
		let matches = wikitext.matchAll( regEx );
		matches = [ ...matches ];
		
		// Filter out matches that are inside nowiki blocks - those aren't valid
		matches = matches.filter( match => !this.isInsideNowiki( match.index, nowikiRanges ) );
		
		if ( matches.length === 0 ) {
			throw new Error( 'Searching for target text failed' );
		}

		// Loop through all the potential matches, trying to find an {{Unblock template. If found, return the beginning of the template.
		for ( const match of matches ) {
			const matchPos = match.index;

			// Scan backwards from the match until we find the {{unblock template
			// Keep scanning through nested templates until we find one that starts with {{unblock
			// Stop at the beginning of the string OR after 100 characters
			const stopPos = Math.max( 0, matchPos - 100 );
			
			for ( let i = matchPos; i > stopPos; i-- ) {
				if ( wikitext[ i ] === '{' && wikitext[ i - 1 ] === '{' ) {
					const potentialStart = i - 1;
					
					if ( this.isInsideNowiki( potentialStart, nowikiRanges ) ) {
						// Skip {{  inside nowiki tags
						continue;
					}

					const initialText = wikitext.slice( potentialStart, matchPos );
					if ( isSpamUn && !/^\{\{unblock-spamun\s*\|[^{}]*$/i.test( initialText ) ) {
						continue;
					}
					
					// If this is an unblock template, we found it
					if ( initialText.match( /^\{\{unblock/i ) ) {
						// Don't match already reviewed templates
						if ( !initialText.match( /\s+reviewed\s*\|/ ) ) {
							return initialText;
						}
					}
					// Otherwise, continue searching backward for the outer template
				}
			}
		}

		// If we got here, we found the target text but no valid unblock template
		throw new Error( 'Failed to find left half of unblock template in the wikicode' );
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
	 * Return a regex pattern that matches appeal reason wikitext with tags, wikilinks, templates, or emphasis.
	 *
	 * @param {string} appealReason - The rendered appeal text.
	 * @param {boolean} isSpamUn - Whether the request includes a separate username parameter.
	 * @return {string} Regex pattern for matching the original wikitext.
	 */
	getAppealReasonPattern( appealReason, isSpamUn = false ) {
		// Matches tags, wikilink markup, templates, and emphasis apostrophes between rendered characters.
		// Template pattern allows both opening {{ and closing }} to appear between characters,
		// since rendered text from {{u|username}} renders as just "username" with the template markup invisible.
		// The brace depth check in getLeftHalfOfUnblockTemplate() ensures we don't match inside nested templates.
		const markup = '(?:<\\/?[a-zA-Z][a-zA-Z0-9:-]*(?:\\s+(?:"[^"]*"|\'[^\']*\'|[^\'"<>])*)?\\s*\\/?>|\\[\\[[^\\[\\]|\\n]*\\||\\[\\[|\\]\\]|\'{2,}(?!\')|\\{[^{}]*\\}|\\{\\{[^}]*\\}\\}|\\}\\})*';
		// The HTML omits whitespace at the start of the second spam-unblock parameter.
		let usernameSeparator = isSpamUn;
		return Array.from( appealReason, ( character ) => {
			const isSeparator = usernameSeparator && character === '|';
			if ( isSeparator ) {
				usernameSeparator = false;
			}
			return markup + this.escapeRegExp( character ) + ( isSeparator ? '\\s*' : '' );
		} ).join( '' );
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
