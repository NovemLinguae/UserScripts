/**
 * Giving this its own class because of the very large number of tests it has. I couldn't bring over any of its helper methods though, because those are used by other methods. Also if the main strategy for matching wikitext gets really good, we can eventually delete this fallback strategy.
 */
export class UnblockReviewWikitextLeftHalf {
	constructor( wikitextProcessor ) {
		this.wikitextProcessor = wikitextProcessor;
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
			const matches = this.wikitextProcessor.getUsernameRequestMatches( wikitext, appealReason );
			if ( matches.length === 0 ) {
				throw new Error( 'Searching for target text failed' );
			}
			return matches[ 0 ][ 1 ];
		}
		const nowikiRanges = this.wikitextProcessor.getNowikiRanges( wikitext );

		// Find all {{unblock...|reason=... patterns using matchAll
		const structuredMatches = [ ...wikitext.matchAll( /\{\{unblock[^}]*\|reason\s*=\s*/gi ) ].filter(
			( match ) => !this.wikitextProcessor.isInsideNowiki( match.index, nowikiRanges )
		);

		// Try each structured match to see if the reason after it matches appealReason
		for ( const unblockReasonMatch of structuredMatches ) {
			// Reviewed requests can retain a reason parameter, but are never valid review targets.
			if ( /^\{\{\s*unblock\s+reviewed(?:\s|\|)/i.test( unblockReasonMatch[ 0 ] ) ) {
				continue;
			}
			const reasonStartPos = unblockReasonMatch.index + unblockReasonMatch[ 0 ].length;
			const reasonPattern = new RegExp( this.wikitextProcessor.getAppealReasonPattern( appealReason ) );
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
		const regEx = new RegExp( negativeLookbehinds + this.wikitextProcessor.getAppealReasonPattern( appealReason ), 'g' );
		let matches = wikitext.matchAll( regEx );
		matches = [ ...matches ];

		// Filter out matches that are inside nowiki blocks - those aren't valid
		matches = matches.filter( ( match ) => !this.wikitextProcessor.isInsideNowiki( match.index, nowikiRanges ) );

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

					if ( this.wikitextProcessor.isInsideNowiki( potentialStart, nowikiRanges ) ) {
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
}
