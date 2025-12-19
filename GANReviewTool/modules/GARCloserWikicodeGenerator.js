import { TemplateFinder } from './TemplateFinder.js';

export class GARCloserWikicodeGenerator {
	processKeepForGARPage( garPageWikicode, message, isCommunityAssessment ) {
		return this.processGARPage( garPageWikicode, message, isCommunityAssessment, 'Kept.', 'green' );
	}

	processKeepForTalkPage( wikicode, garPageTitle, talkPageTitle, oldid ) {
		wikicode = this.removeTemplate( 'GAR/link', wikicode );
		wikicode = this.convertGATemplateToArticleHistoryIfPresent( talkPageTitle, wikicode );
		wikicode = this.updateArticleHistory( 'keep', wikicode, garPageTitle, oldid );
		return wikicode;
	}

	makeCommunityAssessmentLogEntry( garTitle, wikicode, newArchive, archiveTitle ) {
		let output = '';
		if ( newArchive ) {
			const archiveNumber = this.getArchiveNumber( archiveTitle );
			output +=
`{| class="messagebox"
|-
| [[Image:Filing cabinet icon.svg|50px|Archive]]
| This is an '''[[Wikipedia:How to archive a talk page|archive]]''' of past discussions. Its contents should be preserved in their current form. If you wish to start a new discussion or revive an old one, please do so on the <span class="plainlinks">[{{FULLURL:{{TALKSPACE}}:{{BASEPAGENAME}}}} current talk page]</span>.<!-- Template:Talkarchive -->
|}
{{Template:Process header green
 | title    = Good article reassessment
 | section  = (archive)
 | previous = ([[Wikipedia:Good article reassessment/Archive ${ archiveNumber - 1 }|Page ${ archiveNumber - 1 }]])
 | next     = ([[Wikipedia:Good article reassessment/Archive ${ archiveNumber + 1 }|Page ${ archiveNumber + 1 }]]) 
 | shortcut =
 | notes    =
}}
__TOC__`;
		} else {
			output += wikicode;
		}
		output += `\n{{${ garTitle }}}`;
		return output;
	}

	setGARArchiveTemplate( newArchiveTitle, wikicode ) {
		const archiveNumber = this.getArchiveNumber( newArchiveTitle );
		return wikicode.replace( /^\d{1,}/, archiveNumber );
	}

	/**
	 * @param {'keep'|'delist'} keepOrDelist
	 * @todo too many params. factor the RevisionIDs into their own class
	 */
	makeScriptLogEntryToAppend( username, keepOrDelist, reviewTitle, garRevisionID, talkRevisionID, articleRevisionID, gaListRevisionID, garLogRevisionID, garArchiveTemplateRevisionID, error, categoryRevisionID ) {
		let textToAppend = '\n* ';

		if ( error ) {
			textToAppend += `<span style="color: red; font-weight: bold;">ERROR:</span> ${ error }. `;
		}

		const keepOrDelistPastTense = this.getKeepOrDelistPastTense( keepOrDelist );
		textToAppend += `[[User:${ username }|${ username }]] ${ keepOrDelistPastTense } [[${ reviewTitle }]] at ~~~~~. `;

		if ( garRevisionID ) {
			textToAppend += `[[Special:Diff/${ garRevisionID }|[Atop]]]`;
		}
		if ( talkRevisionID ) {
			textToAppend += `[[Special:Diff/${ talkRevisionID }|[Talk]]]`;
		}
		if ( articleRevisionID ) {
			textToAppend += `[[Special:Diff/${ articleRevisionID }|[Article]]]`;
		}
		if ( gaListRevisionID ) {
			textToAppend += `[[Special:Diff/${ gaListRevisionID }|[List]]]`;
		}
		if ( garLogRevisionID ) {
			textToAppend += `[[Special:Diff/${ garLogRevisionID }|[Log]]]`;
		}
		if ( garArchiveTemplateRevisionID ) {
			textToAppend += `[[Special:Diff/${ garArchiveTemplateRevisionID }|[Tmpl]]]`;
		}
		if ( categoryRevisionID ) {
			textToAppend += `[[Special:Diff/${ categoryRevisionID }|[Cat]]]`;
		}

		return textToAppend;
	}

	processDelistForGARPage( garPageWikicode, message, isCommunityAssessment ) {
		return this.processGARPage( garPageWikicode, message, isCommunityAssessment, 'Delisted.', 'red' );
	}

	processDelistForTalkPage( wikicode, garPageTitle, talkPageTitle, oldid ) {
		wikicode = this.removeTemplate( 'GAR/link', wikicode ); // "this article is undergoing a GAR"
		wikicode = this.removeTemplate( 'GAR request', wikicode ); // "maybe this article needs a GAR"
		wikicode = this.convertGATemplateToArticleHistoryIfPresent( talkPageTitle, wikicode );
		wikicode = this.updateArticleHistory( 'delist', wikicode, garPageTitle, oldid );
		wikicode = this.removeGAStatusFromWikiprojectBanners( wikicode );
		return wikicode;
	}

	processDelistForArticle( wikicode ) {
		const gaTemplateNames = [ 'ga icon', 'ga article', 'good article' ];
		const templateFinder = new TemplateFinder( wikicode );
		for ( const templateName of gaTemplateNames ) {
			const template = templateFinder.firstTemplate( templateName );
			if ( !template ) {
				continue;
			}
			const { previousSibling, nextSibling } = template;
			template.remove();
			// handle lots of line breaks: \n\n{{templateName}}\n\n -> \n\n
			if (
				previousSibling && previousSibling.type === 'text' && previousSibling.data.endsWith( '\n\n' ) &&
				nextSibling && nextSibling.type === 'text' && nextSibling.data.startsWith( '\n\n' )
			) {
				nextSibling.deleteData( 0, 2 );

				// handle normal: {{templateName}}\n -> '', {{templateName}} -> ''
			} else if ( nextSibling && nextSibling.type === 'text' && nextSibling.data.startsWith( '\n' ) ) {
				nextSibling.deleteData( 0, 1 );
			}
		}
		return templateFinder.getWikitext();
	}

	processDelistForGAList( wikicode, articleToRemove ) {
		const regex = new RegExp( `'{0,3}"?\\[\\[${ this.regExEscape( articleToRemove ) }(?:\\|[^\\]]+)?\\]\\]"?'{0,3}\\n`, 'gi' );
		wikicode = wikicode.replace( regex, '' );
		return wikicode;
	}

	processGARPage( garPageWikicode, message, isCommunityAssessment, defaultText, atopColor ) {
		message = this.setMessageIfEmpty( defaultText, message );
		message = this.addSignatureIfMissing( message );
		const messageForAtop = this.getMessageForAtop( isCommunityAssessment, message );
		let result = this.placeATOP( garPageWikicode, messageForAtop, atopColor );
		if ( isCommunityAssessment ) {
			result = this.replaceGARCurrentWithGARResult( message, result );
		}
		return result;
	}

	/**
	 * Public. Used in GARCloserController.
	 */
	getGAListTitleFromTalkPageWikicode( wikicode ) {
		/** Keys should all be lowercase */
		const dictionary = {
			agriculture: 'Wikipedia:Good articles/Agriculture, food and drink',
			'agriculture, food and drink': 'Wikipedia:Good articles/Agriculture, food and drink',
			'agriculture, food, and drink': 'Wikipedia:Good articles/Agriculture, food and drink',
			cuisine: 'Wikipedia:Good articles/Agriculture, food and drink',
			cuisines: 'Wikipedia:Good articles/Agriculture, food and drink',
			cultivation: 'Wikipedia:Good articles/Agriculture, food and drink',
			drink: 'Wikipedia:Good articles/Agriculture, food and drink',
			'farming and cultivation': 'Wikipedia:Good articles/Agriculture, food and drink',
			farming: 'Wikipedia:Good articles/Agriculture, food and drink',
			'food and drink': 'Wikipedia:Good articles/Agriculture, food and drink',
			food: 'Wikipedia:Good articles/Agriculture, food and drink',

			art: 'Wikipedia:Good articles/Art and architecture',
			architecture: 'Wikipedia:Good articles/Art and architecture',
			'art and architecture': 'Wikipedia:Good articles/Art and architecture',

			engtech: 'Wikipedia:Good articles/Engineering and technology',
			'applied sciences and technology': 'Wikipedia:Good articles/Engineering and technology',
			'applied sciences': 'Wikipedia:Good articles/Engineering and technology',
			computers: 'Wikipedia:Good articles/Engineering and technology',
			'computing and engineering': 'Wikipedia:Good articles/Engineering and technology',
			computing: 'Wikipedia:Good articles/Engineering and technology',
			eng: 'Wikipedia:Good articles/Engineering and technology',
			engineering: 'Wikipedia:Good articles/Engineering and technology',
			'engineering and technology': 'Wikipedia:Good articles/Engineering and technology',
			technology: 'Wikipedia:Good articles/Engineering and technology',
			transport: 'Wikipedia:Good articles/Engineering and technology',

			geography: 'Wikipedia:Good articles/Geography and places',
			'geography and places': 'Wikipedia:Good articles/Geography and places',
			places: 'Wikipedia:Good articles/Geography and places',

			history: 'Wikipedia:Good articles/History',
			archaeology: 'Wikipedia:Good articles/History',
			heraldry: 'Wikipedia:Good articles/History',
			nobility: 'Wikipedia:Good articles/History',
			royalty: 'Wikipedia:Good articles/History',
			'royalty, nobility and heraldry': 'Wikipedia:Good articles/History',
			'world history': 'Wikipedia:Good articles/History',

			langlit: 'Wikipedia:Good articles/Language and literature',
			'language and literature': 'Wikipedia:Good articles/Language and literature',
			'languages and linguistics': 'Wikipedia:Good articles/Language and literature',
			'languages and literature': 'Wikipedia:Good articles/Language and literature',
			languages: 'Wikipedia:Good articles/Language and literature',
			linguistics: 'Wikipedia:Good articles/Language and literature',
			lit: 'Wikipedia:Good articles/Language and literature',
			literature: 'Wikipedia:Good articles/Language and literature',

			math: 'Wikipedia:Good articles/Mathematics',
			'mathematics and mathematicians': 'Wikipedia:Good articles/Mathematics',
			mathematics: 'Wikipedia:Good articles/Mathematics',
			maths: 'Wikipedia:Good articles/Mathematics',

			drama: 'Wikipedia:Good articles/Media and drama',
			ballet: 'Wikipedia:Good articles/Media and drama',
			dance: 'Wikipedia:Good articles/Media and drama',
			film: 'Wikipedia:Good articles/Media and drama',
			films: 'Wikipedia:Good articles/Media and drama',
			'media and drama': 'Wikipedia:Good articles/Media and drama',
			media: 'Wikipedia:Good articles/Media and drama',
			opera: 'Wikipedia:Good articles/Media and drama',
			television: 'Wikipedia:Good articles/Media and drama',
			theater: 'Wikipedia:Good articles/Media and drama',
			theatre: 'Wikipedia:Good articles/Media and drama',
			'theatre, film and drama': 'Wikipedia:Good articles/Media and drama',

			music: 'Wikipedia:Good articles/Music',
			albums: 'Wikipedia:Good articles/Music',
			'classical compositions': 'Wikipedia:Good articles/Music',
			'other music articles': 'Wikipedia:Good articles/Music',
			songs: 'Wikipedia:Good articles/Music',

			natsci: 'Wikipedia:Good articles/Natural sciences',
			astronomy: 'Wikipedia:Good articles/Natural sciences',
			astrophysics: 'Wikipedia:Good articles/Natural sciences',
			'atmospheric science': 'Wikipedia:Good articles/Natural sciences',
			'biology and medicine': 'Wikipedia:Good articles/Natural sciences',
			biology: 'Wikipedia:Good articles/Natural sciences',
			'chemistry and materials science': 'Wikipedia:Good articles/Natural sciences',
			chemistry: 'Wikipedia:Good articles/Natural sciences',
			cosmology: 'Wikipedia:Good articles/Natural sciences',
			'earth science': 'Wikipedia:Good articles/Natural sciences',
			'earth sciences': 'Wikipedia:Good articles/Natural sciences',
			geology: 'Wikipedia:Good articles/Natural sciences',
			geophysics: 'Wikipedia:Good articles/Natural sciences',
			medicine: 'Wikipedia:Good articles/Natural sciences',
			'meteorology and atmospheric sciences': 'Wikipedia:Good articles/Natural sciences',
			meteorology: 'Wikipedia:Good articles/Natural sciences',
			mineralogy: 'Wikipedia:Good articles/Natural sciences',
			'natural science': 'Wikipedia:Good articles/Natural sciences',
			'natural sciences': 'Wikipedia:Good articles/Natural sciences',
			'physics and astronomy': 'Wikipedia:Good articles/Natural sciences',
			physics: 'Wikipedia:Good articles/Natural sciences',

			philrelig: 'Wikipedia:Good articles/Philosophy and religion',
			mysticism: 'Wikipedia:Good articles/Philosophy and religion',
			myth: 'Wikipedia:Good articles/Philosophy and religion',
			mythology: 'Wikipedia:Good articles/Philosophy and religion',
			phil: 'Wikipedia:Good articles/Philosophy and religion',
			'philosophy and religion': 'Wikipedia:Good articles/Philosophy and religion',
			philosophy: 'Wikipedia:Good articles/Philosophy and religion',
			relig: 'Wikipedia:Good articles/Philosophy and religion',
			religion: 'Wikipedia:Good articles/Philosophy and religion',
			'religion, mysticism and mythology': 'Wikipedia:Good articles/Philosophy and religion',

			socsci: 'Wikipedia:Good articles/Social sciences and society',
			'business and economics': 'Wikipedia:Good articles/Social sciences and society',
			business: 'Wikipedia:Good articles/Social sciences and society',
			'culture and society': 'Wikipedia:Good articles/Social sciences and society',
			culture: 'Wikipedia:Good articles/Social sciences and society',
			'culture, society and psychology': 'Wikipedia:Good articles/Social sciences and society',
			'economics and business': 'Wikipedia:Good articles/Social sciences and society',
			economics: 'Wikipedia:Good articles/Social sciences and society',
			education: 'Wikipedia:Good articles/Social sciences and society',
			gov: 'Wikipedia:Good articles/Social sciences and society',
			government: 'Wikipedia:Good articles/Social sciences and society',
			'journalism and media': 'Wikipedia:Good articles/Social sciences and society',
			journalism: 'Wikipedia:Good articles/Social sciences and society',
			law: 'Wikipedia:Good articles/Social sciences and society',
			'magazines and print journalism': 'Wikipedia:Good articles/Social sciences and society',
			'media and journalism': 'Wikipedia:Good articles/Social sciences and society',
			'politics and government': 'Wikipedia:Good articles/Social sciences and society',
			politics: 'Wikipedia:Good articles/Social sciences and society',
			psychology: 'Wikipedia:Good articles/Social sciences and society',
			'social science': 'Wikipedia:Good articles/Social sciences and society',
			'social sciences and society': 'Wikipedia:Good articles/Social sciences and society',
			'social sciences': 'Wikipedia:Good articles/Social sciences and society',
			society: 'Wikipedia:Good articles/Social sciences and society',

			sports: 'Wikipedia:Good articles/Sports and recreation',
			'everyday life': 'Wikipedia:Good articles/Sports and recreation',
			everydaylife: 'Wikipedia:Good articles/Sports and recreation',
			games: 'Wikipedia:Good articles/Sports and recreation',
			recreation: 'Wikipedia:Good articles/Sports and recreation',
			'sport and recreation': 'Wikipedia:Good articles/Sports and recreation',
			sport: 'Wikipedia:Good articles/Sports and recreation',
			'sports and recreation': 'Wikipedia:Good articles/Sports and recreation',

			'video games': 'Wikipedia:Good articles/Video games',
			'video and computer games': 'Wikipedia:Good articles/Video games',

			war: 'Wikipedia:Good articles/Warfare',
			aircraft: 'Wikipedia:Good articles/Warfare',
			'battles and exercises': 'Wikipedia:Good articles/Warfare',
			battles: 'Wikipedia:Good articles/Warfare',
			'decorations and memorials': 'Wikipedia:Good articles/Warfare',
			military: 'Wikipedia:Good articles/Warfare',
			'military people': 'Wikipedia:Good articles/Warfare',
			units: 'Wikipedia:Good articles/Warfare',
			'war and military': 'Wikipedia:Good articles/Warfare',
			warfare: 'Wikipedia:Good articles/Warfare',
			warships: 'Wikipedia:Good articles/Warfare',
			'weapons and buildings': 'Wikipedia:Good articles/Warfare',
			weapons: 'Wikipedia:Good articles/Warfare'
		};
		const templateFinder = new TemplateFinder( wikicode );
		const templates = templateFinder.getTemplates( [ 'Article history', 'Articlehistory', 'GA' ] );
		const template = templates.find( ( t ) => t.getArgs( 'topic' ).size || t.getArgs( 'subtopic' ).size );
		let topic = template.getValue( 'topic' );
		if ( topic === undefined ) {
			topic = template.getValue( 'subtopic' );
		}
		topic = topic.toLowerCase();
		const gaListTitle = dictionary[ topic ];
		// throw the error a little later rather than now. that way it doesn't interrupt modifying the article talk page.
		return gaListTitle;
	}

	addSignatureIfMissing( message ) {
		if ( !message.includes( '~~~~' ) ) {
			message += ' ~~~~';
		}
		return message;
	}

	setMessageIfEmpty( defaultText, message ) {
		if ( message === '' ) {
			message = defaultText;
		}
		return message;
	}

	getMessageForAtop( isCommunityAssessment, message ) {
		let messageForAtop = message;
		if ( isCommunityAssessment ) {
			messageForAtop = '';
		}
		return messageForAtop;
	}

	/**
	 * {{GAR/current}} and {{GAR/result}} are templates used in community reassessment GARs. The first needs to be swapped for the second when closing community reassessment GARs.
	 */
	replaceGARCurrentWithGARResult( message, wikicode ) {
		message = message.replace( / ?~~~~/g, '' );
		return wikicode.replace( /\{\{GAR\/current\}\}/i, `{{subst:GAR/result|result=${ this.escapeTemplateParameter( message ) }}} ~~~~` );
	}

	escapeTemplateParameter( parameter ) {
		// TODO: This needs repair. Should only escape the below if they are not inside of a template. Should not escape them at all times. Commenting out for now.
		// parameter = parameter.replace(/\|/g, '{{!}}');
		// parameter = parameter.replace(/=/g, '{{=}}');
		return parameter;
	}

	/**
	 * Takes a Wikipedia page name with a number on the end, and returns that number.
	 */
	getArchiveNumber( title ) {
		return parseInt( title.match( /\d{1,}$/ ) );
	}

	placeATOP( wikicode, result, color ) {
		let colorCode = '';
		switch ( color ) {
			case 'green':
				colorCode = 'g';
				break;
			case 'red':
				colorCode = 'r';
				break;
		}

		// place top piece after first H2 or H3, if it exists
		const resultText = result ? `\n| result = ${ result }\n` : '';
		const prependText =
`{{atop${ colorCode }${ resultText }}}`;
		const templateFinder = new TemplateFinder( wikicode );
		templateFinder.placeATOP( prependText, [ 2, 3 ] );
		wikicode = templateFinder.getWikitext();

		// place bottom piece at end
		const appendText = '{{abot}}';
		wikicode = wikicode.trim();
		wikicode += `\n${ appendText }\n`;

		return wikicode;
	}

	/**
	 * @copyright coolaj86, CC BY-SA 4.0, https://stackoverflow.com/a/6969486/3480193
	 */
	regExEscape( string ) {
		return string.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ); // $& means the whole matched string
	}

	removeTemplate( templateName, wikicode ) {
		const templateFinder = new TemplateFinder( wikicode );
		templateFinder.deleteTemplate( templateName );
		return templateFinder.getWikitext();
	}

	/**
	 * There's a {{GA}} template that some people use instead of {{Article history}}. If this is present, replace it with {{Article history}}.
	 */
	convertGATemplateToArticleHistoryIfPresent( talkPageTitle, wikicode ) {
		const templateFinder = new TemplateFinder( wikicode );
		const hasArticleHistory = templateFinder.hasTemplate( 'Article ?history' );
		const gaTemplate = templateFinder.firstTemplate( 'GA' );
		if ( !hasArticleHistory && gaTemplate ) {
			// delete {{ga}} template
			templateFinder.deleteTemplate( 'GA' );
			wikicode = templateFinder.getWikitext().trim();

			// parse its parameters
			// example: |21:00, 12 March 2017 (UTC)|topic=Sports and recreation|page=1|oldid=769997774
			const parameters = this.getParametersFromTemplateWikicode( gaTemplate );

			// if no page specified, assume page is 1. so then the good article review link will be parsed as /GA1
			const noPageSpecified = parameters.page === undefined;
			if ( noPageSpecified ) {
				parameters.page = 1;
			}

			let topicString = '';
			if ( parameters.topic !== undefined ) {
				topicString = `\n|topic = ${ parameters.topic }`;
			} else if ( parameters.subtopic !== undefined ) { // subtopic is an alias only used in {{ga}}, it is not used in {{article history}}
				topicString = `\n|topic = ${ parameters.subtopic }`;
			}

			let oldIDString = '';
			if ( parameters.oldid !== undefined ) {
				oldIDString = `\n|action1oldid = ${ parameters.oldid }`;
			}

			// if |1= was used for date instead of |date=
			if ( parameters.date === undefined && parameters[ 1 ] !== undefined ) {
				parameters.date = parameters[ 1 ];
			}

			// insert {{article history}} template
			const addToTalkPageAboveWikiProjects =
`{{Article history
|currentstatus = GA${ topicString }

|action1 = GAN
|action1date = ${ parameters.date }
|action1link = ${ talkPageTitle }/GA${ parameters.page }
|action1result = listed${ oldIDString }
}}`;
			wikicode = this.addToTalkPageAboveWikiProjects( wikicode, addToTalkPageAboveWikiProjects );
		}
		return wikicode;
	}

	/**
	 * Adds wikicode right above {{WikiProject X}} or {{WikiProject Banner Shell}} if present, or first ==Header== if present, or at bottom of page. Treat {{Talk:abc/GA1}} as a header.
	 */
	addToTalkPageAboveWikiProjects( talkPageWikicode, wikicodeToAdd ) {
		if ( !talkPageWikicode ) {
			return wikicodeToAdd;
		}

		// Find first WikiProject or WikiProject banner shell template
		let wikiProjectLocation = false;
		const dictionary = [ 'wikiproject', 'wpb', 'wpbs', 'wpbannershell', 'wp banner shell', 'bannershell', 'scope shell', 'project shell', 'multiple wikiprojects', 'football' ];
		for ( const value of dictionary ) {
			const location = talkPageWikicode.toUpperCase().indexOf( '{{' + value.toUpperCase() ); // case insensitive
			if ( location !== -1 ) {
				// if this location is higher up than the previous found location, overwrite it
				if ( wikiProjectLocation === false || wikiProjectLocation > location ) {
					wikiProjectLocation = location;
				}
			}
		}

		// Find first heading
		const headingLocation = talkPageWikicode.indexOf( '==' );

		// Find first {{Talk:abc/GA1}} template
		const gaTemplateLocation = this.preg_position( /\{\{[^}]*\/GA\d{1,2}\}\}/gis, talkPageWikicode );

		// Set insert location
		let insertPosition;
		if ( wikiProjectLocation !== false ) {
			insertPosition = wikiProjectLocation;
		} else if ( headingLocation !== -1 ) {
			insertPosition = headingLocation;
		} else if ( gaTemplateLocation !== false ) {
			insertPosition = gaTemplateLocation;
		} else {
			insertPosition = talkPageWikicode.length; // insert at end of page
		}

		// if there's a {{Talk:abc/GA1}} above a heading, adjust for this
		if (
			headingLocation !== -1 &&
			gaTemplateLocation !== false &&
			gaTemplateLocation < insertPosition
		) {
			insertPosition = gaTemplateLocation;
		}

		// If there's excess newlines in front of the insert location, delete the newlines
		let deleteTopPosition = false;
		let deleteBottomPosition = false;
		let pos = insertPosition <= 0 ? 0 : insertPosition - 1;
		let i = 1;
		while ( pos != 0 ) {
			const char = talkPageWikicode.slice( pos, pos + 1 );
			if ( char == '\n' ) {
				if ( i != 1 && i != 2 ) { // skip first two \n, those are OK to keep
					// @ts-ignore
					deleteTopPosition = pos;
					if ( i == 3 ) {
						deleteBottomPosition = insertPosition;
					}
				}
				insertPosition = pos; // insert position should back up past all \n's.
				i++;
				pos--;
			} else {
				break;
			}
		}
		if ( deleteTopPosition !== false ) {
			talkPageWikicode = this.deleteMiddleOfString( talkPageWikicode, deleteTopPosition, deleteBottomPosition );
		}

		const lengthOfRightHalf = talkPageWikicode.length - insertPosition;
		const leftHalf = talkPageWikicode.slice( 0, insertPosition );
		const rightHalf = talkPageWikicode.slice( insertPosition, insertPosition + lengthOfRightHalf );

		if ( insertPosition == 0 ) {
			return wikicodeToAdd + '\n' + talkPageWikicode;
		} else {
			return leftHalf + '\n' + wikicodeToAdd + rightHalf;
		}
	}

	/**
	 * @param {RegExp} regex
	 */
	preg_position( regex, haystack ) {
		const matches = [ ...haystack.matchAll( regex ) ];
		const hasMatches = matches.length;
		if ( hasMatches ) {
			return matches[ 0 ].index;
		}
		return false;
	}

	deleteMiddleOfString( string, deleteStartPosition, deleteEndPosition ) {
		const part1 = string.slice( 0, deleteStartPosition );
		const part2 = string.slice( deleteEndPosition );
		const final_str = part1 + part2;
		return final_str;
	}

	/**
	 * @return {Object} Parameters, with keys being equivalent to the template parameter names. Unnamed parameters will be 1, 2, 3, etc.
	 */
	getParametersFromTemplateWikicode( template ) {
		if ( typeof template === 'string' ) {
			const templateFinder = new TemplateFinder( template );
			template = templateFinder.wikiPage.firstChild;
		}
		if ( template.type !== 'template' ) {
			throw new Error( 'InvalidArgumentException: Not a template' );
		}
		const parameters = {};
		for ( const parameter of template.getAllArgs() ) {
			parameters[ parameter.name.toLowerCase() ] = parameter.getValue();
		}
		return parameters;
	}

	/**
	 * @param {'keep'|'delist'} keepOrDelist
	 */
	updateArticleHistory( keepOrDelist, wikicode, garPageTitle, oldid ) {
		const nextActionNumber = this.determineNextActionNumber( wikicode );

		if ( keepOrDelist !== 'keep' && keepOrDelist !== 'delist' ) {
			throw new Error( 'InvalidArgumentException' );
		}

		const topic = this.firstTemplateGetParameterValue( wikicode, 'Article ?history', 'topic' );
		let topicString = '';
		if ( !topic ) {
			topicString = `\n|topic = ${ topic }`;
		}

		// https://en.wikipedia.org/wiki/Template:Article_history#How_to_use_in_practice
		const existingStatus = this.firstTemplateGetParameterValue( wikicode, 'Article ?history', 'currentstatus' );
		wikicode = this.firstTemplateDeleteParameter( wikicode, 'Article ?history', 'currentstatus' );
		const currentStatusString = this.getArticleHistoryNewStatus( existingStatus, keepOrDelist );

		const result = this.getKeepOrDelistPastTense( keepOrDelist );

		let addToArticleHistory =
`|action${ nextActionNumber } = GAR
|action${ nextActionNumber }date = ~~~~~
|action${ nextActionNumber }link = ${ garPageTitle }
|action${ nextActionNumber }result = ${ result }
|action${ nextActionNumber }oldid = ${ oldid }`;

		addToArticleHistory += currentStatusString + topicString;

		wikicode = this.firstTemplateInsertCode( wikicode, [ 'Article history', 'ArticleHistory' ], addToArticleHistory );

		return wikicode;
	}

	getKeepOrDelistPastTense( keepOrDelist ) {
		switch ( keepOrDelist ) {
			case 'keep':
				return 'kept';
			case 'delist':
				return 'delisted';
		}
	}

	/**
	 * Determine next |action= number in {{Article history}} template. This is so we can insert an action.
	 */
	determineNextActionNumber( wikicode ) {
		let i = 1;
		while ( true ) {
			const regex = new RegExp( `\\|\\s*action${ i }\\s*=`, 'i' );
			const hasAction = wikicode.match( regex );
			if ( !hasAction ) {
				return i;
			}
			i++;
		}
	}

	firstTemplateGetParameterValue( wikicode, templateRegEx, parameter ) {
		const templateFinder = new TemplateFinder( wikicode );
		return templateFinder.firstTemplateGetParameterValue( templateRegEx, parameter );
	}

	getArticleHistoryNewStatus( existingStatus, keepOrDelist ) {
		if ( keepOrDelist === 'keep' ) {
			return `\n|currentstatus = ${ existingStatus }`;
		} else {
			return '\n|currentstatus = DGA';
		}
	}

	/**
	 * @param {Array} templateNameArrayCaseInsensitive
	 */
	firstTemplateInsertCode( wikicode, templateNameArrayCaseInsensitive, codeToInsert ) {
		const templateFinder = new TemplateFinder( wikicode );
		templateFinder.firstTemplateInsertCode( templateNameArrayCaseInsensitive, codeToInsert );
		return templateFinder.getWikitext();
	}

	removeGAStatusFromWikiprojectBanners( wikicode ) {
		return wikicode.replace( /(\|\s*class\s*=\s*)([^}|\s]*)/gi, '$1' );
	}

	firstTemplateDeleteParameter( wikicode, template, parameter ) {
		const templateFinder = new TemplateFinder( wikicode );
		templateFinder.firstTemplateDeleteParameter( template, parameter );
		return templateFinder.getWikitext();
	}
}
