// Sho Kuwamoto, MIT License, https://web.archive.org/web/20190929193523/http://kuwamoto.org/2007/12/17/improved-pluralizing-in-php-actionscript-and-ror/
// The above link also has pluralize() if I ever need it. Deleted it for now as dead code.
export class Inflect {
	constructor() {
		/* eslint-disable key-spacing, quote-props */
		this.singular = {
			'(quiz)zes$'             : '$1',
			'(matr)ices$'            : '$1ix',
			'(vert|ind)ices$'        : '$1ex',
			'^(ox)en$'               : '$1',
			'(alias)es$'             : '$1',
			'(octop|vir)i$'          : '$1us',
			'(cris|ax|test)es$'      : '$1is',
			'(shoe)s$'               : '$1',
			'(o)es$'                 : '$1',
			'(bus)es$'               : '$1',
			'([m|l])ice$'            : '$1ouse',
			'(x|ch|ss|sh)es$'        : '$1',
			'(m)ovies$'              : '$1ovie',
			'(s)eries$'              : '$1eries',
			'([^aeiouy]|qu)ies$'     : '$1y',
			'([lr])ves$'             : '$1f',
			'(tive)s$'               : '$1',
			'(hive)s$'               : '$1',
			'(li|wi|kni)ves$'        : '$1fe',
			'(shea|loa|lea|thie)ves$': '$1f',
			'(^analy)ses$'           : '$1sis',
			'((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$'  : '$1$2sis',
			'([ti])a$'               : '$1um',
			'(n)ews$'                : '$1ews',
			'(h|bl)ouses$'           : '$1ouse',
			'(corpse)s$'             : '$1',
			'(us)es$'                : '$1',
			's$'                     : ''
		};
		/* eslint-enable key-spacing */

		this.irregular = {
			move: 'moves',
			foot: 'feet',
			goose: 'geese',
			sex: 'sexes',
			child: 'children',
			man: 'men',
			tooth: 'teeth',
			person: 'people',
			fungus: 'fungi',
			bivalve: 'bivalves',
			genus: 'genera',
			mantis: 'mantises'
		};

		this.uncountable = [
			'sheep',
			'fish',
			'deer',
			'series',
			'species',
			'money',
			'rice',
			'information',
			'equipment'
		];

		this.skipWhenSingularizing = [
			'grass',
			'virus',
			'fungus',
			'genus',
			'mantis',
			'moss'
		];
	}

	/** Convert an English noun from plural to singular. Should be very reliable for incoming plurals. A bit buggy with incoming singulars. */
	singularize( string ) {
		// save some time in the case that singular and plural are the same
		if ( this.uncountable.includes( string.toLowerCase() ) ) {
			return string;
		}

		// if already singular, skip certain ones that confuse the regex's. this code wasn't originally designed to handle input that was already singular
		if ( this.skipWhenSingularizing.includes( string.toLowerCase() ) ) {
			return string;
		}

		// check for irregular plural forms
		for ( const result in this.irregular ) {
			let pattern = this.irregular[ result ];
			pattern = new RegExp( pattern + '$', 'i' );
			if ( string.match( pattern ) ) {
				return string.replace( pattern, result );
			}
		}

		// check for matches using regular expressions
		for ( let pattern in this.singular ) {
			const result = this.singular[ pattern ];
			pattern = new RegExp( pattern, 'i' );
			if ( string.match( pattern ) ) {
				return string.replace( pattern, result );
			}
		}

		return string;
	}
}
