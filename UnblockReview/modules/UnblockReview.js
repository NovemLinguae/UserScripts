export class UnblockReview {
	constructor() {
		this.SIGNATURE = '~~~~';
	}

	processAcceptOrDecline( wikitext, appealReason, acceptDeclineReason, DEFAULT_DECLINE_REASON, acceptOrDecline ) {
		// HTML does one line break and wikitext does 2ish. Cut off all text after the first line break to avoid breaking our search algorithm.
		appealReason = appealReason.split( '\n' )[ 0 ];

		const initialText = this.getLeftHalfOfUnblockTemplate( wikitext, appealReason );

		if ( !acceptDeclineReason.trim() ) {
			acceptDeclineReason = DEFAULT_DECLINE_REASON + ' ' + this.SIGNATURE;
		} else if ( !this.hasSignature( acceptDeclineReason ) ) {
			acceptDeclineReason = acceptDeclineReason + ' ' + this.SIGNATURE;
		}

		// eslint-disable-next-line no-useless-concat
		const negativeLookbehinds = '(?<!<' + 'nowiki>)';
		const regEx = new RegExp( negativeLookbehinds + this.escapeRegExp( initialText + appealReason ), 'g' );
		wikitext = wikitext.replace(
			regEx,
			'{{unblock reviewed|' + acceptOrDecline + '=' + acceptDeclineReason + '|1=' + appealReason
		);

		// get rid of any [#*:] in front of {{unblock X}} templates. indentation messes up the background color and border of the unblock template.
		wikitext = wikitext.replace( /^[#*: ]{1,}(\{\{\s*unblock)/mi, '$1' );

		return wikitext;
	}

	/**
	 * Given the wikitext of an entire page, and the |reason= parameter of one of the many unblock templates (e.g. {{Unblock}}, {{Unblock-un}}, {{Unblock-auto}}, {{Unblock-bot}}, etc.), return the wikitext of just the beginning of the template.
	 *
	 * For example, "Test {{unblock|reason=Your reason here [[User:Filipe46]]}} Test" as the wikitext and "Your reason here" as the appealReason will return "{{unblock|reason=".
	 *
	 * This can also handle 1=, and no parameter at all (just a pipe)
	 */
	getLeftHalfOfUnblockTemplate( wikitext, appealReason ) {
		// eslint-disable-next-line no-useless-concat
		const negativeLookbehinds = '(?<!<' + 'nowiki>{{unblock\\|reason=)(?<!reviewed ?\\|1=)';
		const regEx = new RegExp( negativeLookbehinds + this.escapeRegExp( appealReason ), 'g' );
		let matches = wikitext.matchAll( regEx );
		matches = [ ...matches ];
		if ( matches.length === 0 ) {
			throw new Error( 'Searching for target text failed!' );
		}
		for ( const match of matches ) {
			const textIdx = match.index;
			let startIdx = textIdx;

			// check for {{tlx|unblock. if found, this isn't what we want, skip.
			const startOfSplice = startIdx - 50 < 0 ? 0 : startIdx - 50;
			const chunkFiftyCharactersWide = wikitext.substring( startOfSplice, startIdx );
			if ( /\{\{\s*tlx\s*\|\s*unblock/i.test( chunkFiftyCharactersWide ) ) {
				continue;
			}

			let i = 0;
			while ( wikitext[ startIdx ] !== '{' && i < 50 ) {
				startIdx--;
				i++;
			}
			if ( i === 50 ) {
				continue;
			}

			// templates start with two opening curly braces
			startIdx--;

			const initialText = wikitext.substring( startIdx, textIdx );
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
