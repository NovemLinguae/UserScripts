import Parser from './Parser.js';

export class TemplateFinder {
	constructor( wikicode ) {
		this.wikiPage = Parser.parse( wikicode, false, 2 );
	}

	static removePrefix( templateName ) {
		return templateName.replace( /^Template:/, '' );
	}

	getWikitext() {
		return String( this.wikiPage );
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
		return this.wikiPage.querySelectorAll( 'template' ).find( filter );
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
		const value = template.getValue( parameter );
		return value === undefined ? null : value;
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

	placeATOP( prependText, levels ) {
		const heading = this.wikiPage.querySelectorAll( 'heading' )
			.find( ( { level } ) => levels.includes( level ) );
		if ( heading ) {
			heading.after( `\n${ prependText }` );
			const { lastChild } = heading.lastChild;
			if ( lastChild && lastChild.type === 'text' ) {
				lastChild.replaceData( lastChild.data.replace( /\n+$/, '' ) );
			}
		} else {
			this.wikiPage.insertAt( prependText + '\n', 0 );
		}
	}

	/**
	 * @param {string|Array} templateNamesCaseInsensitive
	 */
	getTemplates( templateNamesCaseInsensitive ) {
		if ( typeof templateNamesCaseInsensitive === 'string' ) {
			templateNamesCaseInsensitive = [ templateNamesCaseInsensitive ];
		}
		const templateNames = templateNamesCaseInsensitive.map(
			( t ) => `template:${ t.toLowerCase().replace( / /g, '_' ) }`
		);
		return this.wikiPage.querySelectorAll( 'template' )
			.filter( ( { name } ) => templateNames.includes( name.toLowerCase() ) );
	}

	deleteTemplate( templateNameRegExOrArrayCaseInsensitive ) {
		const template = this.firstTemplate( templateNameRegExOrArrayCaseInsensitive );
		if ( template ) {
			const { nextSibling } = template;
			if ( nextSibling && nextSibling.type === 'text' && nextSibling.data.startsWith( '\n' ) ) {
				nextSibling.deleteData( 0, 1 );
			}
			template.remove();
		}
	}

	addWikicodeAfterTemplates( templates, codeToAdd ) {
		const templateNameArray = templates.map( ( name ) => name.toLowerCase().replace( /\s/g, '_' ) );
		const filter = ( { name } ) => templateNameArray.includes( TemplateFinder.removePrefix( name ).toLowerCase() );
		const tokens = this.wikiPage.querySelectorAll( 'template' ).filter( filter );
		if ( tokens.length === 0 ) {
			this.wikiPage.insertAt( codeToAdd, 0 );
		} else {
			const last = tokens[ tokens.length - 1 ];
			const { nextSibling } = last;
			if ( nextSibling && nextSibling.type === 'text' && nextSibling.data.startsWith( '\n' ) ) {
				nextSibling.deleteData( 0, 1 );
			}
			last.after( `\n${ codeToAdd }` );
		}
	}

	hasTemplate( templateNameRegExOrArrayCaseInsensitive ) {
		return Boolean( this.firstTemplate( templateNameRegExOrArrayCaseInsensitive ) );
	}
}
