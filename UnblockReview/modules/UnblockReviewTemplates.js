/**
 * Detect specific templates in HTML and match them to wikitext.
 */
export class UnblockReviewTemplates {
	/**
	 * Match the opening of a {{u}} template.
	 */
	static getUserTemplateOpeningPattern() {
		return '\\{\\{\\s*[uU]\\s*\\|\\s*';
	}

	/**
	 * Match the displayed form of a {{tl}} template while preserving its source.
	 */
	static getTemplateLinkPattern( part, literalPattern, markup, escapeRegExp ) {
		if ( !/^\{\{[^{}|\n]+\}\}$/.test( part ) ) {
			return literalPattern;
		}
		const templateName = escapeRegExp( part.slice( 2, -2 ) );
		return '(?:' + markup + '\\{\\{\\s*[tT][lL]\\s*\\|\\s*' + templateName +
			'\\s*\\}\\}|' + literalPattern + ')';
	}

	/**
	 * Unwrap leading templates displaying only their first parameter: {{u}}.
	 * Unlike {{u}}, {{tl}} displays the parameter surrounded by braces.
	 */
	static unwrapCertainTemplates( wikitext, match, initialText, matchedReason, remainingText, hasUsernameParameter ) {
		return this.unwrapLeadingUserTemplate(
			wikitext, match, initialText, matchedReason, remainingText, hasUsernameParameter
		);
	}

	/**
	 * Unwrap a leading {{u}} template from a matched reason.
	 */
	static unwrapLeadingUserTemplate( wikitext, match, initialText, matchedReason, remainingText, hasUsernameParameter ) {
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
		const nestedStart = initialText.lastIndexOf( '{{' );
		if ( nestedStart > 0 && nestedStart > initialText.lastIndexOf( '}}' ) ) {
			// A fallback match may begin inside the template; reject other nested templates.
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
		return { matchedReason, remainingText };
	}
}
