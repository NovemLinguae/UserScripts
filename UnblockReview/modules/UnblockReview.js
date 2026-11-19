export class UnblockReview {
	constructor() {
		this.SIGNATURE = '~~~~';
		this.templatesThatHaveUsernameParameters = [ 'unblock-un', 'unblock-spamun' ];
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
	 * @param {boolean} hasUsernameParameter - Whether the request includes a separate username parameter.
	 * @return {string} wikitext
	 */
	processAcceptOrDecline( wikitext, paramsAndReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline, hasUsernameParameter = false ) {
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
		} else if ( !hasUsernameParameter ) {
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
		acceptDeclineReason = this.escapeUnbalancedTemplateBraces( acceptDeclineReason );

		let matches;
		if ( hasUsernameParameter ) {
			matches = this.getUsernameRequestMatches( wikitext, paramsAndReason );
		} else {
			const regEx = new RegExp(
				this.escapeRegExp( initialText ) + '(' + this.getAppealReasonPattern( paramsAndReason ) + ')',
				'g'
			);
			const nowikiRanges = this.getNowikiRanges( wikitext );
			matches = [ ...wikitext.matchAll( regEx ) ].filter(
				( match ) => !this.isInsideNowiki( match.index, nowikiRanges )
			);
		}
		if ( matches.length > 1 ) {
			throw new Error( 'Too many matching unblock templates found' );
		}
		if ( matches.length === 0 ) {
			throw new Error( 'Replacing text with unblock message failed' );
		}

		const match = matches[ 0 ];
		if ( hasUsernameParameter ) {
			initialText = match[ 1 ];
		}
		const templateName = initialText.match( /^\{\{([A-Za-z-]+)/i )[ 1 ];
		let matchedReason = hasUsernameParameter ? match[ 3 ] : match[ 1 ];
		let remainingText = wikitext.slice( match.index + match[ 0 ].length );
		// Preserve the existing plain-text replacement for a leading {{u|...}}.
		if ( !hasUsernameParameter && /^\{\{\s*u\s*\|/i.test( matchedReason ) ) {
			const reasonAndRemainingText = matchedReason + remainingText;
			const userTemplate = reasonAndRemainingText.match( /^(\{\{\s*u\s*\|\s*)([^{}|\n]+?)(\}\})/i );
			if ( !userTemplate || !matchedReason.startsWith( userTemplate[ 1 ] + userTemplate[ 2 ] ) ) {
				throw new Error( 'Unable to safely match the nested template in the unblock reason' );
			}
			const closeOffset = userTemplate[ 1 ].length + userTemplate[ 2 ].length;
			const remainingStart = Math.max( matchedReason.length, closeOffset + 2 );
			matchedReason = userTemplate[ 2 ] + reasonAndRemainingText.slice( closeOffset + 2, remainingStart );
			remainingText = reasonAndRemainingText.slice( remainingStart );
		}
		// If the match starts inside {{u|...}}, unwrap it without assuming how other templates render.
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

		if ( hasUsernameParameter ) {
			const username = paramsAndReason.slice( 0, paramsAndReason.indexOf( '|' ) );
			const usernamePattern = this.getAppealReasonPattern( username );
			const parameterMatch = matchedReason.match( new RegExp(
				'^(' + usernamePattern + ')(\\s*\\|)(\\s*)(?:(reason|2)(\\s*=\\s*))?'
			) );
			if ( !parameterMatch ) {
				throw new Error( 'Unable to identify the username and reason parameters' );
			}
			const usernamePrefix = initialText.slice( initialText.indexOf( '|' ) + 1 );
			const reasonPrefix = parameterMatch[ 4 ] ?
				parameterMatch[ 3 ] + parameterMatch[ 4 ] + parameterMatch[ 5 ] :
				'2=' + parameterMatch[ 3 ];
			replacement = '{{' + templateName + ' reviewed|' + acceptOrDecline + '=' + acceptDeclineReason +
				'|' + usernamePrefix + parameterMatch[ 1 ] + parameterMatch[ 2 ] + reasonPrefix +
				matchedReason.slice( parameterMatch[ 0 ].length );
		} else if ( templateName.toLowerCase() === 'unblock-spamun' ) {
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
	 * Add an idletimestamp parameter to the matching unblock request.
	 *
	 * @param {string} wikitext - The wikitext of the page.
	 * @param {string} paramsAndReason - The username and reason, or reason, identifying the request.
	 * @param {boolean} hasUsernameParameter - Whether the request includes a separate username parameter.
	 * @return {string} Updated wikitext.
	 */
	processWaitForUserResponse( wikitext, paramsAndReason, hasUsernameParameter = false ) {
		const { start, closePos } = this.getUnblockTemplateRange( wikitext, paramsAndReason, hasUsernameParameter );
		const template = wikitext.slice( start, closePos + 2 );
		const updatedTemplate = template.slice( 0, -2 ) +
			'|idletimestamp={{subst:CURRENTTIMESTAMP}}}}';
		return wikitext.slice( 0, start ) + updatedTemplate + wikitext.slice( closePos + 2 );
	}

	/**
	 * Remove the idletimestamp parameter from the matching unblock request.
	 *
	 * @param {string} wikitext - The wikitext of the page.
	 * @param {string} paramsAndReason - The username and reason, or reason, identifying the request.
	 * @param {boolean} hasUsernameParameter - Whether the request includes a separate username parameter.
	 * @return {string} Updated wikitext.
	 */
	processUnpause( wikitext, paramsAndReason, hasUsernameParameter = false ) {
		const { start, closePos } = this.getUnblockTemplateRange(
			wikitext,
			paramsAndReason,
			hasUsernameParameter,
			true
		);
		const template = wikitext.slice( start, closePos + 2 );
		const updatedTemplate = template.replace( /\s*\|\s*idletimestamp\s*=\s*\d{14}\s*/gi, '' );
		if ( template === updatedTemplate ) {
			throw new Error( 'Unable to find an idletimestamp parameter in the unblock template' );
		}
		return wikitext.slice( 0, start ) + updatedTemplate + wikitext.slice( closePos + 2 );
	}

	/**
	 * Find the matching unblock template's bounds, accounting for nested templates and excluding nowiki content.
	 * Unblock templates that take a username parameter use username-aware matching; unpausing also handles timestamped requests with no reason
	 * and idletimestamp parameters between the username and reason.
	 *
	 * @param {string} wikitext - The page's wikitext.
	 * @param {string} paramsAndReason - Rendered username and reason, or reason, identifying the request.
	 * @param {boolean} hasUsernameParameter - Whether the request has a separate username parameter.
	 * @param {boolean} unpausing - Whether the lookup is for removing an idletimestamp.
	 * @return {{start: number, closePos: number}} The opening and closing positions of the template.
	 */
	getUnblockTemplateRange( wikitext, paramsAndReason, hasUsernameParameter = false, unpausing = false ) {
		paramsAndReason = paramsAndReason.split( '\n' )[ 0 ];
		let matches;
		if ( !hasUsernameParameter && paramsAndReason.startsWith( 'Please provide a reason as to why you should be unblocked' ) ) {
			const nowikiRanges = this.getNowikiRanges( wikitext );
			const pattern = unpausing ?
				/\{\{\s*Unblock(?=\s*(?:\||\}\}))/gi :
				/\{\{Unblock\}\}/gi;
			matches = [ ...wikitext.matchAll( pattern ) ].filter(
				( match ) => !this.isInsideNowiki( match.index, nowikiRanges )
			);
			if ( unpausing ) {
				matches = matches.filter( ( match ) => {
					const range = this.getTemplateRangeAt( wikitext, match.index, nowikiRanges );
					return /\|\s*idletimestamp\s*=\s*\d{14}/i.test(
						wikitext.slice( match.index, range.closePos + 2 )
					);
				} );
			}
		} else if ( hasUsernameParameter && unpausing ) {
			matches = this.getUsernameUnpauseMatches( wikitext, paramsAndReason );
		} else if ( hasUsernameParameter ) {
			matches = this.getUsernameRequestMatches( wikitext, paramsAndReason );
		} else {
			const initialText = this.getLeftHalfOfUnblockTemplate( wikitext, paramsAndReason );
			const pattern = new RegExp(
				this.escapeRegExp( initialText ) + '(' + this.getAppealReasonPattern( paramsAndReason ) + ')',
				'g'
			);
			const nowikiRanges = this.getNowikiRanges( wikitext );
			matches = [ ...wikitext.matchAll( pattern ) ].filter(
				( match ) => !this.isInsideNowiki( match.index, nowikiRanges )
			);
		}
		if ( matches.length > 1 ) {
			throw new Error( 'Too many matching unblock templates found' );
		}
		if ( matches.length === 0 ) {
			throw new Error( 'Searching for target text failed' );
		}

		const nowikiRanges = this.getNowikiRanges( wikitext );
		return this.getTemplateRangeAt( wikitext, matches[ 0 ].index, nowikiRanges );
	}

	getTemplateRangeAt( wikitext, start, nowikiRanges ) {
		let depth = 0;
		let closePos = -1;
		for ( let i = start; i < wikitext.length - 1; i++ ) {
			if ( this.isInsideNowiki( i, nowikiRanges ) ) {
				continue;
			}
			if ( wikitext.slice( i, i + 2 ) === '{{' ) {
				depth++;
				i++;
			} else if ( wikitext.slice( i, i + 2 ) === '}}' ) {
				depth--;
				if ( depth === 0 ) {
					closePos = i;
					break;
				}
				i++;
			}
		}
		if ( closePos === -1 ) {
			throw new Error( 'Failed to find the closing braces of the unblock template' );
		}
		return { start, closePos };
	}

	/**
	 * Find timestamped username-request templates matching the rendered username and reason.
	 * Allows idletimestamp to appear between those parameters and ignores templates inside nowiki.
	 *
	 * @param {string} wikitext - The page's wikitext.
	 * @param {string} paramsAndReason - Rendered username and reason identifying the request.
	 * @return {Array<{ index: number, 0: string, 1: string }>} Matching template-opening matches with their source positions.
	 */
	getUsernameUnpauseMatches( wikitext, paramsAndReason ) {
		const separator = paramsAndReason.indexOf( '|' );
		if ( separator === -1 ) {
			return [];
		}
		const username = paramsAndReason.slice( 0, separator ).trim();
		const reason = paramsAndReason.slice( separator + 1 );
		const reasonIsProvided = !reason.startsWith( 'Please provide a reason as to why you should be unblocked' );
		const usernamePattern = this.getAppealReasonPattern( username );
		const reasonPattern = reasonIsProvided ? new RegExp( this.getAppealReasonPattern( reason ), 'i' ) : null;
		const nowikiRanges = this.getNowikiRanges( wikitext );
		const matches = [];
		for ( const match of wikitext.matchAll( /\{\{\s*([A-Za-z-]+)\s*\|/gi ) ) {
			if ( !this.templatesThatHaveUsernameParameters.includes( match[ 1 ].toLowerCase() ) ||
				this.isInsideNowiki( match.index, nowikiRanges ) ) {
				continue;
			}
			const range = this.getTemplateRangeAt( wikitext, match.index, nowikiRanges );
			const template = wikitext.slice( match.index, range.closePos + 2 );
			const usernameMatch = template.match( new RegExp(
				'^\\{\\{\\s*' + this.escapeRegExp( match[ 1 ] ) + '\\s*\\|\\s*(?:1\\s*=\\s*)?' +
				usernamePattern + '\\s*\\|',
				'i'
			) );
			if ( usernameMatch && /\|\s*idletimestamp\s*=\s*\d{14}/i.test( template ) &&
				( !reasonPattern || reasonPattern.test( template.slice( usernameMatch[ 0 ].length ) ) ) ) {
				matches.push( match );
			}
		}
		return matches;
	}

	/**
	 * @copyright Denys Seguret, CC BY-SA 4.0, https://stackoverflow.com/a/14480366/3480193
	 */
	getPosition( haystack, needle, nthOccurrence ) {
		return haystack.split( needle, nthOccurrence ).join( needle ).length;
	}

	/**
	 * Prevent unbalanced template braces (for example, unescaped `}}`) in a reviewer response from closing its enclosing template.
	 */
	escapeUnbalancedTemplateBraces( text ) {
		const nowikiRanges = this.getNowikiRanges( text );
		const openingBraces = [];
		const unmatchedClosingBraces = new Set();
		let nowikiRangeIndex = 0;
		for ( let i = 0; i < text.length - 1; ) {
			while ( nowikiRangeIndex < nowikiRanges.length && nowikiRanges[ nowikiRangeIndex ][ 1 ] <= i ) {
				nowikiRangeIndex++;
			}
			const nowikiRange = nowikiRanges[ nowikiRangeIndex ];
			if ( nowikiRange && i >= nowikiRange[ 0 ] ) {
				i = nowikiRange[ 1 ];
			} else if ( text.slice( i, i + 2 ) === '{{' ) {
				openingBraces.push( i );
				i += 2;
			} else if ( text.slice( i, i + 2 ) === '}}' ) {
				if ( openingBraces.length ) {
					openingBraces.pop();
				} else {
					unmatchedClosingBraces.add( i );
				}
				i += 2;
			} else {
				i++;
			}
		}

		const unmatchedOpeningBraces = new Set( openingBraces );
		let escapedText = '';
		for ( let i = 0; i < text.length; ) {
			if ( unmatchedOpeningBraces.has( i ) ) {
				escapedText += '{<nowiki/>{';
				i += 2;
			} else if ( unmatchedClosingBraces.has( i ) ) {
				escapedText += '}<nowiki/>}';
				i += 2;
			} else {
				escapedText += text[ i ];
				i++;
			}
		}
		return escapedText;
	}

	getUsernameRequestMatches( wikitext, paramsAndReason ) {
		const pattern = '(\\{\\{([A-Za-z-]+)\\s*\\|\\s*(?:1\\s*=\\s*)?)(' +
			this.getAppealReasonPattern( paramsAndReason, true ) + ')';
		const nowikiRanges = this.getNowikiRanges( wikitext );
		return [ ...wikitext.matchAll( new RegExp( pattern, 'g' ) ) ].filter( ( match ) => {
			if ( !this.templatesThatHaveUsernameParameters.includes( match[ 2 ].toLowerCase() ) ||
				this.isInsideNowiki( match.index, nowikiRanges ) ) {
				return false;
			}
			let depth = 0;
			const end = match.index + match[ 0 ].length;
			for ( let i = match.index; i < end - 1; i++ ) {
				if ( this.isInsideNowiki( i, nowikiRanges ) ) {
					continue;
				}
				if ( wikitext.slice( i, i + 2 ) === '{{' ) {
					depth++;
					i++;
				} else if ( wikitext.slice( i, i + 2 ) === '}}' ) {
					depth--;
					i++;
					if ( depth === 0 ) {
						return false;
					}
				}
			}
			return true;
		} );
	}

	/**
	 * Given the wikitext of an entire page, and the |reason= parameter of one of the many unblock templates (e.g. {{Unblock}}, {{Unblock-un}}, {{Unblock-auto}}, {{Unblock-bot}}, etc.), return the wikitext of just the beginning of the template.
	 *
	 * For example, "Test {{unblock|reason=Your reason here [[User:Filipe46]]}} Test" as the wikitext and "Your reason here" as the appealReason will return "{{unblock|reason=".
	 *
	 * This can also handle 1=, and no parameter at all (just a pipe)
	 */
	getLeftHalfOfUnblockTemplate( wikitext, appealReason, hasUsernameParameter = false ) {
		if ( hasUsernameParameter ) {
			const matches = this.getUsernameRequestMatches( wikitext, appealReason );
			if ( matches.length === 0 ) {
				throw new Error( 'Searching for target text failed' );
			}
			return matches[ 0 ][ 1 ];
		}
		const nowikiRanges = this.getNowikiRanges( wikitext );

		// Find all {{unblock...|reason=... patterns using matchAll
		const structuredMatches = [ ...wikitext.matchAll( /\{\{unblock[^}]*\|reason\s*=\s*/gi ) ].filter(
			( match ) => !this.isInsideNowiki( match.index, nowikiRanges )
		);

		// Try each structured match to see if the reason after it matches appealReason
		for ( const unblockReasonMatch of structuredMatches ) {
			const reasonStartPos = unblockReasonMatch.index + unblockReasonMatch[ 0 ].length;
			const reasonPattern = new RegExp( this.getAppealReasonPattern( appealReason ) );
			const reasonText = wikitext.slice( reasonStartPos );
			const reasonMatch = reasonText.match( reasonPattern );

			if ( reasonMatch ) {
				// Found a match! But need to verify it's the correct template.
				// The match position could be in a nested template if the pattern allows }}
				// Find the closing }} of THIS template to ensure our match is inside it

				// Count braces from the {{unblock start to find where this template closes
				let braceDepth = 2; // Start with the opening {{
				let closePos = unblockReasonMatch.index + unblockReasonMatch[ 0 ].length;

				// Scan forward to find the closing }} that closes this {{unblock template
				for ( let i = closePos; i < wikitext.length - 1; i++ ) {
					if ( wikitext[ i ] === '{' && wikitext[ i + 1 ] === '{' ) {
						braceDepth += 2;
						i++; // Skip next char since we just processed it
					} else if ( wikitext[ i ] === '}' && wikitext[ i + 1 ] === '}' ) {
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
				if ( matchPos < closePos ) {
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
		const regEx = new RegExp( negativeLookbehinds + this.getAppealReasonPattern( appealReason ), 'g' );
		let matches = wikitext.matchAll( regEx );
		matches = [ ...matches ];

		// Filter out matches that are inside nowiki blocks - those aren't valid
		matches = matches.filter( ( match ) => !this.isInsideNowiki( match.index, nowikiRanges ) );

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
	 * @param {boolean} hasUsernameParameter - Whether the request includes a separate username parameter.
	 * @return {string} Regex pattern for matching the original wikitext.
	 */
	getAppealReasonPattern( appealReason, hasUsernameParameter = false ) {
		// Only {{u|...}} is known to render its argument as visible text.
		const markup = '(?:<\\/?[a-zA-Z][a-zA-Z0-9:-]*(?:\\s+(?:"[^"]*"|\'[^\']*\'|[^\'"<>])*)?\\s*\\/?>|\\[\\[[^\\[\\]|\\n]*\\||\\[\\[|\\]\\]|\'{2,}(?!\')|\\{[^{}]*\\}|\\{\\{\\s*[uU]\\s*\\|\\s*|\\{\\{[^}]*\\}\\}|\\}\\})*';
		// The HTML omits parameter names and whitespace around the username separator.
		let usernameSeparator = hasUsernameParameter;
		return Array.from( appealReason, ( character ) => {
			const isSeparator = usernameSeparator && character === '|';
			if ( isSeparator ) {
				usernameSeparator = false;
				return markup + '\\s*\\|\\s*(?:(?:reason|2)\\s*=\\s*)?';
			}
			return markup + this.escapeRegExp( character );
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
