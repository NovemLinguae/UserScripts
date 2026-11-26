import { UnblockReviewTemplates } from '../modules/UnblockReviewTemplates.js';

describe( 'getUserTemplateOpeningPattern', () => {
	test( 'Recognizes a user template opening without matching another template', () => {
		const pattern = new RegExp( '^' + UnblockReviewTemplates.getUserTemplateOpeningPattern() );
		expect( pattern.test( '{{ U | Example}}' ) ).toBe( true );
		expect( pattern.test( '{{other|Example}}' ) ).toBe( false );
	} );
} );

describe( 'getTemplateLinkPattern', () => {
	const escapeRegExp = ( text ) => text.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

	test( 'Matches the named template link or literal text, but not a different name', () => {
		const literal = escapeRegExp( '{{request edit}}' );
		const pattern = new RegExp(
			'^' + UnblockReviewTemplates.getTemplateLinkPattern( '{{request edit}}', literal, '', escapeRegExp ) + '$'
		);
		expect( pattern.test( '{{TL | request edit }}' ) ).toBe( true );
		expect( pattern.test( '{{request edit}}' ) ).toBe( true );
		expect( pattern.test( '{{tl|different}}' ) ).toBe( false );
	} );

	test( 'Escapes special characters in template names and leaves ordinary text unchanged', () => {
		const pattern = new RegExp(
			'^' + UnblockReviewTemplates.getTemplateLinkPattern( '{{a.b}}', escapeRegExp( '{{a.b}}' ), '', escapeRegExp ) + '$'
		);
		expect( pattern.test( '{{tl|a.b}}' ) ).toBe( true );
		expect( pattern.test( '{{tl|axb}}' ) ).toBe( false );
		expect( UnblockReviewTemplates.getTemplateLinkPattern( 'plain text', 'literal', '', escapeRegExp ) )
			.toBe( 'literal' );
	} );
} );

describe( 'unwrapLeadingUserTemplate', () => {
	test( 'Unwraps a leading user template while preserving the unmatched remainder', () => {
		expect( UnblockReviewTemplates.unwrapLeadingUserTemplate(
			'{{unblock|reason={{u|Example}} and more}}', { index: 0 },
			'{{unblock|reason=', '{{u|Example', '}} and more}}', false
		) ).toEqual( { matchedReason: 'Example', remainingText: ' and more}}' } );
	} );

	test( 'Unwraps a user template when the match starts inside it', () => {
		expect( UnblockReviewTemplates.unwrapLeadingUserTemplate(
			'{{unblock|reason={{u|Example}} and more}}', { index: 0 },
			'{{unblock|reason={{u|', 'Example', '}} and more}}', false
		) ).toEqual( { matchedReason: 'Example', remainingText: ' and more}}' } );
	} );

	test( 'Rejects an unrecognized or incomplete nested template', () => {
		const error = 'Unable to safely match the nested template in the unblock reason';
		expect( () => UnblockReviewTemplates.unwrapLeadingUserTemplate(
			'{{unblock|reason={{other|Example}}}}', { index: 0 },
			'{{unblock|reason={{other|', 'Example', '}}}}', false
		) ).toThrow( error );
		expect( () => UnblockReviewTemplates.unwrapLeadingUserTemplate(
			'{{unblock|reason={{u|Example}}}}', { index: 0 },
			'{{unblock|reason=', '{{u|Example', ' and more}}', false
		) ).toThrow( error );
	} );

	test( 'Leaves a username request and a non-leading user template unchanged', () => {
		for ( const hasUsernameParameter of [ false, true ] ) {
			const matchedReason = hasUsernameParameter ? '{{u|Example}}' : 'See {{u|Example}}';
			expect( UnblockReviewTemplates.unwrapLeadingUserTemplate(
				'', { index: 0 }, '{{unblock|reason=', matchedReason, '}}', hasUsernameParameter
			) ).toEqual( { matchedReason, remainingText: '}}' } );
		}
	} );
} );
