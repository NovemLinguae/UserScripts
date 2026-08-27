// <nowiki>

// a user script to test part of XFDcloser PR https://github.com/wikimedia-gadgets/xfdcloser/pull/157
// and a tool to help FaviFake finish closing AFD merges

( function () {
	async function getWikicode( title ) {
		const pageIsDeleted = !mw.config.get( 'wgCurRevisionId' );
		if ( pageIsDeleted ) {
			return '';
		}

		let wikicode = '';
		title = encodeURIComponent( title );
		await $.ajax( {
			url: 'https://en.wikipedia.org/w/api.php?action=parse&page=' + title + '&prop=wikitext&formatversion=2&format=json',
			success: function ( result ) {
				wikicode = result.parse.wikitext;
			},
			dataType: 'json'
		} );
		return wikicode;
	}

	function goToShowChangesScreen( titleWithNamespaceAndUnderscores, wikicode, editSummary ) {
		const titleEncoded = encodeURIComponent( titleWithNamespaceAndUnderscores );
		const wgServer = mw.config.get( 'wgServer' );
		const wgScriptPath = mw.config.get( 'wgScriptPath' );
		const baseURL = wgServer + wgScriptPath + '/';
		// @copyright devside, CC BY-SA 4.0, https://stackoverflow.com/a/12464290/3480193
		$( `<form action="${ baseURL }index.php?title=${ titleEncoded }&action=submit" method="POST"/>` )
			.append( $( '<input type="hidden" name="wpTextbox1">' ).val( wikicode ) )
			.append( $( '<input type="hidden" name="wpSummary">' ).val( editSummary ) )
			.append( $( '<input type="hidden" name="mode">' ).val( 'preview' ) )
			.append( $( '<input type="hidden" name="wpDiff">' ).val( 'Show changes' ) )
			.append( $( '<input type="hidden" name="wpUltimateParam">' ).val( '1' ) )
			.appendTo( $( document.body ) ) // it has to be added somewhere into the <body>
			.trigger( 'submit' );
	}

	/** returns the pagename, including the namespace name, but with spaces replaced by underscores */
	function getArticleName() {
		return mw.config.get( 'wgPageName' );
	}

	/**
	 * Look at every instance of {{Merge}}, {{merge from}}, {{Merge to}}, {{Article for deletion/dated}}, {{being merged to}}, {{being merged}}, {{being merged from}}, {{Merge portions from}}, or one of their aliases, and remove every one where the Source page or the NominationName appear {{inside it}}. Don't check the parameter names at all, just their values.
	 *
	 * When removing {{Article for deletion/dated}} or one of its aliases, also remove the <!-- hidden comments --> around it.
	 *
	 * This is not able to handle nested templates. Hopefully that never happens, else a more complicated solution will be needed.
	 */
	function removeMergeAndAfdTemplates( oldWikicode, sourcePage, nominationName ) {
		let newWikicode = oldWikicode;
		// {{Merge}}, {{merge from}}, {{Merge to}}, {{Article for deletion/dated}}, {{being merged to}}, {{being merged}}, {{being merged from}}, {{Merge portions from}}
		const mergeTemplates = [
			'Merge', /* aliases: */ 'Mergedisputed', 'Mergewith', 'MergeDisputed', 'MergeVfD', 'Merge-disputed', 'Merge disputed', 'Merge-multiple', 'Mergesplit', 'MergeSplit', 'Mergemulti', 'Mergetomultiple-with', 'Multimerge', 'Proposed merge', 'Merge with',

			'Merge from', /* aliases: */ 'Merge-from', 'Include', 'Mergefrom-multiple', 'Multiplemergefrom', 'Mergefrommulti', 'Mergefrommultiple', 'Multimergefrom', 'Mergefrom-category', 'MergeFrom', 'Mergefrom', 'Merge from draft', 'Merge from AfD',

			'Merge to', /* aliases: */ 'Merge-to', 'Mergeinto', 'MergePartial', 'MergetoCat', 'Mergelist', 'Mergeto-disputed', 'Mergeto-multiple', 'Multiplemergeinto', 'Multiplemergeto', 'Multiple-merge-to', 'Merge into', 'MergeTo', 'Mergeto', 'Merge to article', 'Merge2', 'Merge-into',

			'Being merged to', /* aliases: */ 'Merging to', 'Being Merge to', 'Being merge to', 'Merging into', 'Merginginto', 'Mergingto', 'Merging-to',

			'Being merged', /* aliases: */ 'Merging', 'Mergingsectionto',

			'Being merged from', /* aliases: */ 'Merging from', 'Mergingfrom', 'Being Merge from', 'Being merge from', 'Merging-from',

			'Merge portions from', /* aliases: */ 'Move section portions from', 'Move portions from', 'Merge section portions from'
		];
		const afdTemplates = [
			'Article for deletion/dated', /* aliases: */ 'AfDM', 'Afd/dated', 'AfD/dated', 'Afdm'
		];
		const allTemplates = mergeTemplates.concat( afdTemplates );
		const normalizedSourcePage = spacesToUnderscores( sourcePage );
		const normalizedNominationName = spacesToUnderscores( nominationName );

		// Process AFD templates first, since they have special comments around them that need to be removed as well
		const afdPattern = afdTemplates.map( ( t ) => t.replace( / /g, '[_ ]' ) ).join( '|' );
		newWikicode = newWikicode.replace(
			new RegExp( `<!-- Please do not remove or change this AfD message until the discussion has been closed\\. -->\\s*{{(${ afdPattern })(?:\\|[^}]*)?}}\\s*<!-- Once discussion is closed.*?<!-- End of AfD message.*?-->\\n`, 'gis' ),
			( match ) => {
				if ( spacesToUnderscores( match ).includes( normalizedSourcePage ) || spacesToUnderscores( match ).includes( normalizedNominationName ) ) {
					return '';
				}
				return match;
			}
		);

		// Process all other templates
		const templatePatterns = allTemplates.map( ( t ) => t.replace( / /g, '[_ ]' ) ).join( '|' );
		const templateOpenRegex = new RegExp( `{{(${ templatePatterns })(?:\\s|\\|)?`, 'i' );
		let changed = true;
		while ( changed ) {
			changed = false;
			for ( let i = 0; i < newWikicode.length - 1; i++ ) {
				if ( newWikicode[ i ] === '{' && newWikicode[ i + 1 ] === '{' ) {
					const fullTemplate = extractTemplateContent( newWikicode, i );

					if ( fullTemplate && templateOpenRegex.test( fullTemplate ) ) {
						// Check if this template should be removed
						if ( spacesToUnderscores( fullTemplate ).includes( normalizedSourcePage ) || spacesToUnderscores( fullTemplate ).includes( normalizedNominationName ) ) {
							const templateEnd = i + fullTemplate.length;

							// Check for preceding or trailing newline to also remove
							let removeStart = i;
							let removeEnd = templateEnd;
							if ( i > 0 && newWikicode[ i - 1 ] === '\n' ) {
								removeStart = i - 1;
							} else if ( i === 0 && templateEnd < newWikicode.length && newWikicode[ templateEnd ] === '\n' ) {
								removeEnd = templateEnd + 1;
							}

							// Get characters around the removal point
							const charBefore = removeStart > 0 ? newWikicode[ removeStart - 1 ] : '';
							const charAfter = removeEnd < newWikicode.length ? newWikicode[ removeEnd ] : '';

							// Remove the template
							newWikicode = newWikicode.slice( 0, removeStart ) + newWikicode.slice( removeEnd );

							// Add newline if needed to separate non-newline content
							if ( charBefore && charAfter && charBefore !== '\n' && charAfter !== '\n' ) {
								newWikicode = newWikicode.slice( 0, removeStart ) + '\n' + newWikicode.slice( removeStart );
							}

							changed = true;
							break;
						}
					}
				}
			}
		}

		return newWikicode;
	}

	function spacesToUnderscores( str ) {
		return str.replace( / /g, '_' ).toLowerCase();
	}

	/** Function to extract template content between {{ and }} */
	function extractTemplateContent( wikicode, startIndex ) {
		let braceCount = 0;
		let i = startIndex;
		while ( i < wikicode.length ) {
			if ( wikicode[ i ] === '{' && i + 1 < wikicode.length && wikicode[ i + 1 ] === '{' ) {
				braceCount++;
				i += 2;
			} else if ( wikicode[ i ] === '}' && i + 1 < wikicode.length && wikicode[ i + 1 ] === '}' ) {
				braceCount--;
				i += 2;
				if ( braceCount === 0 ) {
					return wikicode.slice( startIndex, i );
				}
			} else {
				i++;
			}
		}
		return null;
	}

	// don't run when not viewing articles
	const action = mw.config.get( 'wgAction' );
	const isNotViewing = action != 'view';
	if ( isNotViewing ) {
		return;
	}

	// don't run when viewing diffs
	const isDiff = mw.config.get( 'wgDiffNewId' );
	if ( isDiff ) {
		return;
	}

	// Don't run in virtual namespaces
	const isVirtualNamespace = mw.config.get( 'wgNamespaceNumber' ) < 0;
	if ( isVirtualNamespace ) {
		return;
	}

	const menuID = 'p-cactions'; // "More" menu

	const titleWithNamespaceAndUnderscores = getArticleName();

	let running = false;

	// Add RemoveMergeTemplates to the toolbar
	mw.loader.using( [ 'mediawiki.util' ], () => {
		mw.util.addPortletLink( menuID, '#', 'Run RemoveMergeTemplates', 'RemoveMergeTemplatesLink' );
		$( '#RemoveMergeTemplatesLink' ).on( 'click', async () => {
			// prevent running the script while script is already in progress
			if ( running ) {
				return;
			}
			running = true;

			mw.notify( 'Parsing page content...' );

			// get page wikicode
			const originalWikicode = await getWikicode( titleWithNamespaceAndUnderscores );
			let wikicode = originalWikicode;

			const sourcePage = window.prompt( 'Please specify the page that is the source of the merge. For example, if you want to merge A into B, specify A.' );

			const nominationName = window.prompt( 'Please specify the nomination name. In other words, the name of the AFD. It should start with "Wikipedia:Articles for deletion/".' );

			wikicode = removeMergeAndAfdTemplates( wikicode, sourcePage, nominationName );

			const needsChanges = wikicode != originalWikicode;
			if ( needsChanges ) {
				const summary = 'clean up ([[User:Novem Linguae/Scripts/RemoveMergeTemplates.js|RemoveMergeTemplates]])';
				await goToShowChangesScreen( titleWithNamespaceAndUnderscores, wikicode, summary );
			} else {
				mw.notify( 'No changes needed!' );
			}
		} );
	} );
}() );

// </nowiki>
