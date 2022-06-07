// http://kuwamoto.org/2007/12/17/improved-pluralizing-in-php-actionscript-and-ror/
export class Inflect {
	constructor() {
		/*
		this.plural = {
			'(quiz)$'               : "$1zes",
			'^(ox)$'                : "$1en",
			'([m|l])ouse$'          : "$1ice",
			'(matr|vert|ind)ix|ex$' : "$1ices",
			'(x|ch|ss|sh)$'         : "$1es",
			'([^aeiouy]|qu)y$'      : "$1ies",
			'(hive)$'               : "$1s",
			'(?,([^f])fe|([lr])f)$' : "$1$2ves",
			'(shea|lea|loa|thie)f$' : "$1ves",
			'sis$'                  : "ses",
			'([ti])um$'             : "$1a",
			'(tomat|potat|ech|her|vet)o$': "$1oes",
			'(bu)s$'                : "$1ses",
			'(alias)$'              : "$1es",
			'(octop)us$'            : "$1i",
			'(ax|test)is$'          : "$1es",
			'(us)$'                 : "$1es",
			's$'                    : "s",
			'$'                      : "s",
		};
		*/
		
		this.singular = {
			'(quiz)zes$'             : "$1",
			'(matr)ices$'            : "$1ix",
			'(vert|ind)ices$'        : "$1ex",
			'^(ox)en$'               : "$1",
			'(alias)es$'             : "$1",
			'(octop|vir)i$'          : "$1us",
			'(cris|ax|test)es$'      : "$1is",
			'(shoe)s$'               : "$1",
			'(o)es$'                 : "$1",
			'(bus)es$'               : "$1",
			'([m|l])ice$'            : "$1ouse",
			'(x|ch|ss|sh)es$'        : "$1",
			'(m)ovies$'              : "$1ovie",
			'(s)eries$'              : "$1eries",
			'([^aeiouy]|qu)ies$'     : "$1y",
			'([lr])ves$'             : "$1f",
			'(tive)s$'               : "$1",
			'(hive)s$'               : "$1",
			'(li|wi|kni)ves$'        : "$1fe",
			'(shea|loa|lea|thie)ves$': "$1f",
			'(^analy)ses$'           : "$1sis",
			'((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$'  : "$1$2sis",
			'([ti])a$'               : "$1um",
			'(n)ews$'                : "$1ews",
			'(h|bl)ouses$'           : "$1ouse",
			'(corpse)s$'             : "$1",
			'(us)es$'                : "$1",
			's$'                     : "",
		};
		
		this.irregular = {
			'move'   : 'moves',
			'foot'   : 'feet',
			'goose'  : 'geese',
			'sex'    : 'sexes',
			'child'  : 'children',
			'man'    : 'men',
			'tooth'  : 'teeth',
			'person' : 'people',
			'fungus' : 'fungi',
			'bivalve': 'bivalves',
			'genus'  : 'genera',
			'mantis' : 'mantises',
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
			'equipment',
		];

		this.skipWhenSingularizing = [
			'grass',
			'virus',
			'fungus',
			'genus',
			'mantis',
			'moss',
		];
	}
	
	/*
	pluralize( string ) 
	{
		// save some time in the case that singular and plural are the same
		if ( in_array( strtolower( string ), this.uncountable ) )
			return string;
			
	
		// check for irregular singular forms
		foreach ( this.irregular as pattern => result )
		{
			pattern = '/' . pattern . '$/i';
			
			if ( preg_match( pattern, string ) )
				return preg_replace( pattern, result, string);
		}
		
		// check for matches using regular expressions
		foreach ( this.plural as pattern => result )
		{
			if ( preg_match( pattern, string ) )
				return preg_replace( pattern, result, string );
		}
		
		return string;
	}
	*/
	
	/** Convert an English noun from plural to singular. Should be very reliable for incoming plurals. A bit buggy with incoming singulars. */
	singularize(string) {
		// save some time in the case that singular and plural are the same
		if ( this.uncountable.includes(string.toLowerCase()) ) {
			return string;
		}

		// if already singular, skip certain ones that confuse the regex's. this code wasn't originally designed to handle input that was already singular
		if ( this.skipWhenSingularizing.includes(string.toLowerCase()) ) {
			return string;
		}

		// check for irregular plural forms
		for ( let result in this.irregular ) {
			let pattern = this.irregular[result];
			pattern = new RegExp(pattern + '$', 'i');
			if ( string.match(pattern) ) {
				return string.replace(pattern, result);
			}
		}
		
		// check for matches using regular expressions
		for ( let pattern in this.singular ) {
			let result = this.singular[pattern];
			pattern = new RegExp(pattern, 'i');
			if ( string.match(pattern) ) {
				return string.replace(pattern, result);
			}
		}
		
		return string;
	}
	
	/*
	pluralize_if(count, string)
	{
		if (count == 1)
			return "1 string";
		else
			return count + " " + this.pluralize(string);
	}
	*/
}