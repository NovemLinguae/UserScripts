/** Lets you use regex to specify what parts of a very long string you want to specify as "off limits", then you can do additional regex's and search/replace to the remaining parts of the string. */
export class StringFilter {
	/** Does a replace, but specifies areas of the file that should NOT be replaced. Those areas are specified by providing an openingTag and a closingTag, and those areas are marked as off limits. */
	surgicalReplaceOutsideTags(regex, replacement, haystack, openingTags, closingTags) {
		let allTags = [...openingTags, ...closingTags];
		let parts = this._splitStringUsingMultiplePatterns(haystack, allTags);
		let resultArray = [];
		for ( let part of parts ) {
			let openingTagMatch = false;
			for ( let tag of openingTags ) {
				if ( part.startsWith(tag) ) {
					openingTagMatch = true;
					break;
				}
			}
			if ( ! openingTagMatch ) {
				part = part.replace(regex, replacement);
			}
			resultArray.push(part);
		}
		return resultArray.join('');
	}

	/** Does a replace, but specifies areas of the file that SHOULD be replaced, then skips the rest of the file. The area that should be replaced is specified by providing an openingTag and a closingTag. */
	surgicalReplaceInsideTags(regex, replacement, haystack, openingTags, closingTags) {
		let allTags = [...openingTags, ...closingTags];
		let parts = this._splitStringUsingMultiplePatterns(haystack, allTags);
		let resultArray = [];
		for ( let part of parts ) {
			for ( let tag of openingTags ) {
				if ( part.startsWith(tag) ) {
					part = part.replace(regex, replacement);
				}
			}
			resultArray.push(part);
		}
		return resultArray.join('');
	}
	
	/**
	Also keeps the pattern in the result, unlike string.prototype.split. Algorithm isn't perfect, will fail with this pattern: <ref>Test/>Test</ref>. But should be good enough for DraftCleaner stuff.
	
	@param {Array} patterns
	*/
	_splitStringUsingMultiplePatterns(string, patterns) {
		let length = string.length;
		let result = [];
		let positionOfLastMatch = 0;
		for ( let i = 0; i < length; i++ ) {
			let lookAhead = string.substring(i); // the rest of the string after current position
			let patternMatch = false;
			for ( let pattern of patterns ) {
				if ( lookAhead.startsWith(pattern) ) {
					patternMatch = true;
					break;
				}
			}
			if ( patternMatch ) {
				let chunk = string.slice(positionOfLastMatch, i);
				if ( ! chunk ) continue; // if blank (happens if i=0 matches), continue instead of putting an empty "" into the array
				result.push(chunk);
				positionOfLastMatch = i;
			}
		}
		// Don't forget the last chunk.
		result.push(string.substring(positionOfLastMatch));
		return result;
	}
}