import { Inflect } from "../modules/Inflect";

describe(`singularize(noun)`, () => {
	// https://stackoverflow.com/a/63596686/3480193
	let tests = [
		// ['plural', 'singular'],
		['bacteria', 'bacterium'],
		['bivalves', 'bivalve'],
		['catfishes', 'catfish'],
		['centipedes', 'centipede'],
		['children', 'child'],
		['corpses', 'corpse'],
		['deer', 'deer'],
		['electrolytes', 'electrolyte'],
		['equipment', 'equipment'],
		['feet', 'foot'],
		['fungi', 'fungus'],
		['grasses', 'grass'],
		['hives', 'hive'],
		['ladies', 'lady'],
		['libraries', 'library'],
		['matrices', 'matrix'],
		['men', 'man'],
		['mites', 'mite'],
		['plants', 'plant'],
		['quizzes', 'quiz'],
		['socks', 'sock'],
		['viruses', 'virus'],
		['genera', 'genus'],
		['mantises', 'mantis'],
		['mosses', 'moss'],
	];
	
	let inflect = new Inflect();

	test.each(tests)('convert plural noun %j to singular noun %j', (input, expected) => {
		expect(inflect.singularize(input)).toEqual(expected);
	});

	test.each(tests)(`do not change singular noun, it is already singular`, (input, expected) => {
		expect(inflect.singularize(expected)).toEqual(expected);
	});
});