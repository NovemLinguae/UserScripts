export class UnblockReview {
	constructor() {
		this.SIGNATURE = '~~~~';
	}

	processAcceptOrDecline( wikitext, appealReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) {
		// HTML does one line break and wikitext does 2ish. Cut off all text after the first line break to avoid breaking our search algorithm.
		appealReason = appealReason.split( '\n' )[ 0 ];

		let initialText = '';
		// Special case: If the user didn't provide a reason, the template will display "Please provide a reason as to why you should be unblocked", and this will be detected as the appealReason.
		const reasonProvided = !appealReason.startsWith( 'Please provide a reason as to why you should be unblocked' );
		if ( !reasonProvided ) {
			initialText = wikitext.match( /(\{\{Unblock)\}\}/i )[ 1 ];
			appealReason = '';
		} else {
			initialText = this.getLeftHalfOfUnblockTemplate( wikitext, appealReason );
		}

		if ( !acceptDeclineReason.trim() ) {
			acceptDeclineReason = DEFAULT_DECLINE_REASON + ' ' + this.SIGNATURE;
		} else if ( !this.hasSignature( acceptDeclineReason ) ) {
			acceptDeclineReason = acceptDeclineReason + ' ' + this.SIGNATURE;
		}

		// eslint-disable-next-line no-useless-concat
		const negativeLookbehinds = '(?<!<' + 'nowiki>)';
		const regEx = new RegExp( negativeLookbehinds + this.escapeRegExp( initialText + appealReason ), 'g' );
		let wikitext2 = wikitext.replace(
			regEx,
			'{{unblock reviewed|' + acceptOrDecline + '=' + acceptDeclineReason + '|1=' + appealReason
		);

		if ( wikitext === wikitext2 ) {
			throw new Error( 'Replacing text with unblock message failed!' );
		}

		// get rid of any [#*:] in front of {{unblock X}} templates. indentation messes up the background color and border of the unblock template.
		wikitext2 = wikitext2.replace( /^[#*: ]{1,}(\{\{\s*unblock)/mi, '$1' );

		return wikitext2;
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
		const regEx = new RegExp( negativeLookbehinds + this.escapeRegExp( appealReason ), 'g' );
		let matches = wikitext.matchAll( regEx );
		matches = [ ...matches ];

		if ( matches.length === 0 ) {
			throw new Error( 'Searching for target text failed!' );
		}

		// Loop through all the potential matches, and peek at the characters in front of the match. Eliminate false positives ({{tlx|unblock}}, the same text not anywhere near an {{unblock}} template, etc.). If a true positive, return the beginning of the template.
		for ( const match of matches ) {
			// The position of the match within the wikicode.
			const MatchPos = match.index;
			// The position of the unblock template of that match within the wikicode. Set them equal initially. Will be adjusted below.
			let UnblockTemplateStartPos = MatchPos;

			// check for {{tlx|unblock. if found, this isn't what we want, skip.
			const startOfSplice = UnblockTemplateStartPos - 50 < 0 ? 0 : UnblockTemplateStartPos - 50;
			const chunkFiftyCharactersWide = wikitext.slice( startOfSplice, UnblockTemplateStartPos );
			if ( /\{\{\s*tlx\s*\|\s*unblock/i.test( chunkFiftyCharactersWide ) ) {
				continue;
			}

			// Scan backwards from the match until we find {{
			let i = 0;
			while ( wikitext[ UnblockTemplateStartPos ] !== '{' && i < 50 ) {
				UnblockTemplateStartPos--;
				i++;
			}

			// If the above scan couldn't find the beginning of the template within 50 characters of the match, then that wasn't it. Even a long template like `{{Unblock-auto|reason=` isn't 50 characters long. Move on to the next match.
			if ( i === 50 ) {
				continue;
			}

			// The above scan stopped at {Unblock. Subtract one so it's {{Unblock
			UnblockTemplateStartPos--;

			const initialText = wikitext.slice( UnblockTemplateStartPos, MatchPos );
			return initialText;
		}

		throw new Error( 'Searching backwards failed!' );
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
		if ( text.indexOf( this.SIGNATURE ) < 0 ) {
			return false;
		}

		// if there's a literal signature and no nowiki elements,
		// there must be a real signature
		if ( text.indexOf( '<nowiki>' ) < 0 ) {
			return true;
		}

		// Save all nowiki spans
		const nowikiSpanStarts = []; // list of ignored span beginnings
		const nowikiSpanLengths = []; // list of ignored span lengths
		const NOWIKI_RE = /<nowiki>.*?<\/nowiki>/g;
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
