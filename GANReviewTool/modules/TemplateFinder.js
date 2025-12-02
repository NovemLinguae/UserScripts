// TODO: A couple of recent bugs will require a lexer or template parser type class to solve.
import Parser from './Parser.js';

export class TemplateFinder {
	constructor( wikicode ) {
		this.root = Parser.parse( wikicode, false, 2 );
	}

	static removePrefix( templateName ) {
		return templateName.replace( /^Template:/, '' );
	}

	getWikitext() {
		return String( this.root );
	}

	firstTemplate( templateNameRegExOrArrayCaseInsensitive ) {
		let filter;
		if ( !templateNameRegExOrArrayCaseInsensitive ) {
			filter = () => true;
		} else if ( Array.isArray( templateNameRegExOrArrayCaseInsensitive ) ) {
			const templateNameArray = templateNameRegExOrArrayCaseInsensitive
				.map( ( name ) => name.toLowerCase().replace( /\s/g, '_' ) );
			filter = ( { name } ) => templateNameArray.includes( TemplateFinder.removePrefix( name ).toLowerCase() );
		} else {
			const regEx = new RegExp( `^Template:${ templateNameRegExOrArrayCaseInsensitive }$`, 'i' );
			filter = ( { name } ) => regEx.test( name.replace( /_/g, ' ' ) );
		}
		return this.root.querySelectorAll( 'template' ).find( filter );
	}

	firstTemplateInsertCode( templateNameRegExOrArrayCaseInsensitive, codeToInsert ) {
		const template = this.firstTemplate( templateNameRegExOrArrayCaseInsensitive );
		if ( template ) {
			template.append( `${ codeToInsert.replace( /^\|/, '' ) }\n` );
		}
	}

	firstTemplateGetParameterValue( templateNameRegExOrArrayCaseInsensitive, parameter ) {
		const template = this.firstTemplate( templateNameRegExOrArrayCaseInsensitive );
		if ( !template ) {
			return null;
		}
		return template.getValue( parameter ) || null;
	}

	firstTemplateDeleteParameter( templateNameRegExOrArrayCaseInsensitive, parameter ) {
		const template = this.firstTemplate( templateNameRegExOrArrayCaseInsensitive );
		if ( template ) {
			for ( const token of template.getAllArgs() ) {
				if ( token.name.toLowerCase() === parameter ) {
					token.remove();
				}
			}
		}
	}
}
