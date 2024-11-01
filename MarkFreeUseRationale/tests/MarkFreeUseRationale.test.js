/* eslint-disable quotes */

function insertImageHasRationaleYes( wikicode ) {
	return wikicode.replace( /({{Non-free (?!use)[^|}]+)([|}])/i, '$1|image_has_rationale=yes$2' );
}

test( `should touch {{Non-free X}}`, () => {
	const wikitext = `{{Non-free biog-pic}}`;
	const output = `{{Non-free biog-pic|image_has_rationale=yes}}`;
	expect( insertImageHasRationaleYes( wikitext ) ).toBe( output );
} );

test( `shouldn't touch {{Non-free use rationale X}}`, () => {
	const wikitext =
`{{Non-free use rationale 2
|Description = This is a photo of Harry Conover
}}`;
	const output =
`{{Non-free use rationale 2
|Description = This is a photo of Harry Conover
}}`;
	expect( insertImageHasRationaleYes( wikitext ) ).toBe( output );
} );

test( `should handle {{Non-free X}} with parameters`, () => {
	const wikitext = `{{Non-free biog-pic|Harry Conover|year=1944}}`;
	const output = `{{Non-free biog-pic|image_has_rationale=yes|Harry Conover|year=1944}}`;
	expect( insertImageHasRationaleYes( wikitext ) ).toBe( output );
} );
