export class UnblockReview {
	/**
	 * Given the wikitext of an entire page, and the |reason= parameter of one of the many unblock templates (e.g. {{Unblock}}, {{Unblock-un}}, {{Unblock-auto}}, {{Unblock-bot}}, etc.), return the wikitext of just the beginning of the template.
	 *
	 * For example, "Test {{unblock|reason=Your reason here [[User:Filipe46]]}} Test" as the wikitext and "Your reason here" as the appealReason will return "{{unblock|reason=".
	 *
	 * This can also handle 1=, and no parameter at all (just a pipe)
	 */
	getLeftHalfOfUnblockTemplate( wikitext, appealReason ) {
		// https://stackoverflow.com/a/6969486/3480193
		function escapeRegExp( string ) {
			// $& means the whole matched string
			return string.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
		}

		const regEx = new RegExp( escapeRegExp( appealReason ), 'g' );
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
}
