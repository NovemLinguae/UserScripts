( function () {
	// An mw.Api object
	let api;

	// Keep "common" at beginning
	const SKINS = [ 'common', 'monobook', 'minerva', 'vector', 'vector-2022', 'timeless' ];

	// How many scripts do we need before we show the quick filter?
	const NUM_SCRIPTS_FOR_SEARCH = 5;

	// The primary import list, keyed by target. (A "target" is a user JS subpage
	// where the script is imported, like "common" or "vector".) Set in buildImportList
	const imports = {};

	// Local scripts, keyed on name; value will be the target. Set in buildImportList.
	const localScriptsByName = {};

	// How many scripts are installed?
	let scriptCount = 0;

	// Goes on the end of edit summaries
	const ADVERT = ' ([[User:Enterprisey/script-installer|script-installer]])';

	/**
	 * Strings, for translation
	 */
	const STRINGS = {
		skinCommon: 'common (applies to all skins)',
		backlink: 'Backlink:',
		installSummary: 'Installing $1',
		installLinkText: 'Install',
		installProgressMsg: 'Installing...',
		uninstallSummary: 'Uninstalling $1',
		uninstallLinkText: 'Uninstall',
		uninstallProgressMsg: 'Uninstalling...',
		disableSummary: 'Disabling $1',
		disableLinkText: 'Disable',
		disableProgressMsg: 'Disabling...',
		enableSummary: 'Enabling $1',
		enableLinkText: 'Enable',
		enableProgressMsg: 'Enabling...',
		moveLinkText: 'Move',
		moveProgressMsg: 'Moving...',
		movePrompt: 'Destination? Enter one of:', // followed by the names of skins
		normalizeSummary: 'Normalizing script installs',
		remoteUrlDesc: '$1, loaded from $2',
		panelHeader: 'You currently have the following scripts installed (find more at WP:USL)',
		cannotInstall: 'Cannot install',
		cannotInstallSkin: 'This page is one of your user customization pages, and may (will, if common.js) already run on each page load.',
		cannotInstallContentModel: "Page content model is $1, not 'javascript'",
		insecure: '(insecure)', // used at the end of some messages
		notJavaScript: 'not JavaScript',
		installViaPreferences: 'Install via preferences',
		showNormalizeLinks: 'Show "normalize" links?',
		normalize: 'normalize',
		showMoveLinks: 'Show "move" links?',
		quickFilter: 'Quick filter:',
		tempWarning: 'Installation of non-User, non-MediaWiki protected pages is temporary and may be removed in the future.',
		badPageError: 'Page is not User: or MediaWiki: and is unprotected',
		manageUserScripts: 'Manage user scripts',
		bigSecurityWarning: "Warning!$1\n\nAll user scripts could contain malicious content capable of compromising your account. Installing a script means it could be changed by others; make sure you trust its author. If you're unsure whether a script is safe, check at the technical village pump. Install this script?",
		securityWarningSection: ' About to install $1.'
	};

	const USER_NAMESPACE_NAME = mw.config.get( 'wgFormattedNamespaces' )[ 2 ];

	/**
	 * Constructs an Import. An Import is a line in a JS file that imports a
	 * user script. Properties:
	 *
	 *  - "page" is a page name, such as "User:Foo/Bar.js".
	 *  - "wiki" is a wiki from which the script is loaded, such as
	 *    "en.wikipedia". If null, the script is local, on the user's
	 *    wiki.
	 *  - "url" is a URL that can be passed into mw.loader.load.
	 *  - "target" is the title of the user subpage where the script is,
	 *    without the .js ending: for example, "common".
	 *  - "disabled" is whether this import is commented out.
	 *  - "type" is 0 if local, 1 if remotely loaded, and 2 if URL.
	 *
	 * EXACTLY one of "page" or "url" are null for every Import. This
	 * constructor should not be used directly; use the factory
	 * functions (Import.ofLocal, Import.ofUrl, Import.fromJs) instead.
	 */
	function Import( page, wiki, url, target, disabled ) {
		this.page = page;
		this.wiki = wiki;
		this.url = url;
		this.target = target;
		this.disabled = disabled;
		this.type = this.url ? 2 : ( this.wiki ? 1 : 0 );
	}

	Import.ofLocal = function ( page, target, disabled ) {
		if ( disabled === undefined ) {
			disabled = false;
		}
		return new Import( page, null, null, target, disabled );
	};

	/** URL to Import. Assumes wgScriptPath is "/w" */
	Import.ofUrl = function ( url, target, disabled ) {
		if ( disabled === undefined ) {
			disabled = false;
		}
		const URL_RGX = /^(?:https?:)?\/\/(.+?)\.org\/w\/index\.php\?.*?title=(.+?(?:&|$))/;
		let match;
		if ( match = URL_RGX.exec( url ) ) {
			const title = decodeURIComponent( match[ 2 ].replace( /&$/, '' ) ),
				wiki = decodeURIComponent( match[ 1 ] );
			return new Import( title, wiki, null, target, disabled );
		}
		return new Import( null, null, url, target, disabled );
	};

	Import.fromJs = function ( line, target ) {
		const IMPORT_RGX = /^\s*(\/\/)?\s*importScript\s*\(\s*(?:"|')(.+?)(?:"|')\s*\)/;
		let match;
		if ( match = IMPORT_RGX.exec( line ) ) {
			return Import.ofLocal( unescapeForJsString( match[ 2 ] ), target, !!match[ 1 ] );
		}

		const LOADER_RGX = /^\s*(\/\/)?\s*mw\.loader\.load\s*\(\s*(?:"|')(.+?)(?:"|')\s*\)/;
		if ( match = LOADER_RGX.exec( line ) ) {
			return Import.ofUrl( unescapeForJsString( match[ 2 ] ), target, !!match[ 1 ] );
		}
	};

	Import.prototype.getDescription = function ( useWikitext ) {
		switch ( this.type ) {
			case 0: return useWikitext ? ( '[[' + this.page + ']]' ) : this.page;
			case 1: return STRINGS.remoteUrlDesc.replace( '$1', this.page ).replace( '$2', this.wiki );
			case 2: return this.url;
		}
	};

	/**
	 * Human-readable (NOT necessarily suitable for ResourceLoader) URL.
	 */
	Import.prototype.getHumanUrl = function () {
		switch ( this.type ) {
			case 0: return '/wiki/' + encodeURI( this.page );
			case 1: return '//' + this.wiki + '.org/wiki/' + encodeURI( this.page );
			case 2: return this.url;
		}
	};

	Import.prototype.toJs = function () {
		let dis = this.disabled ? '//' : '',
			url = this.url;
		switch ( this.type ) {
			case 0: return dis + "importScript('" + escapeForJsString( this.page ) + "'); // " + STRINGS.backlink + ' [[' + escapeForJsComment( this.page ) + ']]';
			case 1: url = '//' + encodeURIComponent( this.wiki ) + '.org/w/index.php?title=' +
                            encodeURIComponent( this.page ) + '&action=raw&ctype=text/javascript';
				/* FALL THROUGH */
			case 2: return dis + "mw.loader.load('" + escapeForJsString( url ) + "');";
		}
	};

	/**
	 * Installs the import.
	 */
	Import.prototype.install = function () {
		return api.postWithEditToken( {
			action: 'edit',
			title: getFullTarget( this.target ),
			summary: STRINGS.installSummary.replace( '$1', this.getDescription( /* useWikitext */ true ) ) + ADVERT,
			appendtext: '\n' + this.toJs()
		} );
	};

	/**
	 * Get all line numbers from the target page that mention
	 * the specified script.
	 */
	Import.prototype.getLineNums = function ( targetWikitext ) {
		function quoted( s ) {
			return new RegExp( "(['\"])" + escapeForRegex( s ) + '\\1' );
		}
		let toFind;
		switch ( this.type ) {
			case 0:
				toFind = quoted( escapeForJsString( this.page ) );
				break;
			case 1:
				toFind = new RegExp( escapeForRegex( encodeURIComponent( this.wiki ) ) + '.*?' +
                    escapeForRegex( encodeURIComponent( this.page ) ) );
				break;
			case 2:
				toFind = quoted( escapeForJsString( this.url ) );
				break;
		}
		const lineNums = [], lines = targetWikitext.split( '\n' );
		for ( let i = 0; i < lines.length; i++ ) {
			if ( toFind.test( lines[ i ] ) ) {
				lineNums.push( i );
			}
		}
		return lineNums;
	};

	/**
	 * Uninstalls the given import. That is, delete all lines from the
	 * target page that import the specified script.
	 */
	Import.prototype.uninstall = function () {
		const that = this;
		return getWikitext( getFullTarget( this.target ) ).then( function ( wikitext ) {
			const lineNums = that.getLineNums( wikitext ),
				newWikitext = wikitext.split( '\n' ).filter( function ( _, idx ) {
					return lineNums.indexOf( idx ) < 0;
				} ).join( '\n' );
			return api.postWithEditToken( {
				action: 'edit',
				title: getFullTarget( that.target ),
				summary: STRINGS.uninstallSummary.replace( '$1', that.getDescription( /* useWikitext */ true ) ) + ADVERT,
				text: newWikitext
			} );
		} );
	};

	/**
	 * Sets whether the given import is disabled, based on the provided
	 * boolean value.
	 */
	Import.prototype.setDisabled = function ( disabled ) {
		const that = this;
		this.disabled = disabled;
		return getWikitext( getFullTarget( this.target ) ).then( function ( wikitext ) {
			const lineNums = that.getLineNums( wikitext ),
				newWikitextLines = wikitext.split( '\n' );

			if ( disabled ) {
				lineNums.forEach( function ( lineNum ) {
					if ( newWikitextLines[ lineNum ].trim().indexOf( '//' ) != 0 ) {
						newWikitextLines[ lineNum ] = '//' + newWikitextLines[ lineNum ].trim();
					}
				} );
			} else {
				lineNums.forEach( function ( lineNum ) {
					if ( newWikitextLines[ lineNum ].trim().indexOf( '//' ) == 0 ) {
						newWikitextLines[ lineNum ] = newWikitextLines[ lineNum ].replace( /^\s*\/\/\s*/, '' );
					}
				} );
			}

			const summary = ( disabled ? STRINGS.disableSummary : STRINGS.enableSummary )
				.replace( '$1', that.getDescription( /* useWikitext */ true ) ) + ADVERT;
			return api.postWithEditToken( {
				action: 'edit',
				title: getFullTarget( that.target ),
				summary: summary,
				text: newWikitextLines.join( '\n' )
			} );
		} );
	};

	Import.prototype.toggleDisabled = function () {
		this.disabled = !this.disabled;
		return this.setDisabled( this.disabled );
	};

	/**
	 * Move this import to another file.
	 */
	Import.prototype.move = function ( newTarget ) {
		if ( this.target === newTarget ) {
			return;
		}
		const old = new Import( this.page, this.wiki, this.url, this.target, this.disabled );
		this.target = newTarget;
		return $.when( old.uninstall(), this.install() );
	};

	function getAllTargetWikitexts() {
		return $.getJSON(
			mw.util.wikiScript( 'api' ),
			{
				format: 'json',
				action: 'query',
				prop: 'revisions',
				rvprop: 'content',
				rvslots: 'main',
				titles: SKINS.map( getFullTarget ).join( '|' )
			}
		).then( function ( data ) {
			if ( data && data.query && data.query.pages ) {
				const result = {};
				Object.values( data.query.pages ).forEach( function ( moreData ) {
					const nameWithoutExtension = new mw.Title( moreData.title ).getNameText();
					const targetName = nameWithoutExtension.substring( nameWithoutExtension.indexOf( '/' ) + 1 );
					result[ targetName ] = moreData.revisions ? moreData.revisions[ 0 ].slots.main[ '*' ] : null;
				} );
				return result;
			}
		} );
	}

	function buildImportList() {
		return getAllTargetWikitexts().then( function ( wikitexts ) {
			Object.keys( wikitexts ).forEach( function ( targetName ) {
				const targetImports = [];
				if ( wikitexts[ targetName ] ) {
					const lines = wikitexts[ targetName ].split( '\n' );
					let currImport;
					for ( let i = 0; i < lines.length; i++ ) {
						if ( currImport = Import.fromJs( lines[ i ], targetName ) ) {
							targetImports.push( currImport );
							scriptCount++;
							if ( currImport.type === 0 ) {
								if ( !localScriptsByName[ currImport.page ] ) {
									localScriptsByName[ currImport.page ] = [];
								}
								localScriptsByName[ currImport.page ].push( currImport.target );
							}
						}
					}
				}
				imports[ targetName ] = targetImports;
			} );
		} );
	}

	/*
	 * "Normalizes" (standardizes the format of) lines in the given
	 * config page.
	 */
	function normalize( target ) {
		return getWikitext( getFullTarget( target ) ).then( function ( wikitext ) {
			let lines = wikitext.split( '\n' ),
				newLines = Array( lines.length ),
				currImport;
			for ( let i = 0; i < lines.length; i++ ) {
				if ( currImport = Import.fromJs( lines[ i ], target ) ) {
					newLines[ i ] = currImport.toJs();
				} else {
					newLines[ i ] = lines[ i ];
				}
			}
			return api.postWithEditToken( {
				action: 'edit',
				title: getFullTarget( target ),
				summary: STRINGS.normalizeSummary,
				text: newLines.join( '\n' )
			} );
		} );
	}

	function conditionalReload( openPanel ) {
		if ( window.scriptInstallerAutoReload ) {
			if ( openPanel ) {
				document.cookie = 'open_script_installer=yes';
			}
			window.location.reload( true );
		}
	}

	/********************************************
	 *
	 * UI code
	 *
	 ********************************************/
	function makePanel() {
		const list = $( '<div>' ).attr( 'id', 'script-installer-panel' )
			.append( $( '<header>' ).text( STRINGS.panelHeader ) );
		const container = $( '<div>' ).addClass( 'container' ).appendTo( list );

		// Container for checkboxes
		container.append( $( '<div>' )
			.attr( 'class', 'checkbox-container' )
			.append(
				$( '<input>' )
					.attr( { id: 'siNormalize', type: 'checkbox' } )
					.on( 'click', function () {
						$( '.normalize-wrapper' ).toggle( 0 );
					} ),
				$( '<label>' )
					.attr( 'for', 'siNormalize' )
					.text( STRINGS.showNormalizeLinks ),
				$( '<input>' )
					.attr( { id: 'siMove', type: 'checkbox' } )
					.on( 'click', function () {
						$( '.move-wrapper' ).toggle( 0 );
					} ),
				$( '<label>' )
					.attr( 'for', 'siMove' )
					.text( STRINGS.showMoveLinks ) ) );
		if ( scriptCount > NUM_SCRIPTS_FOR_SEARCH ) {
			container.append( $( '<div>' )
				.attr( 'class', 'filter-container' )
				.append(
					$( '<label>' )
						.attr( 'for', 'siQuickFilter' )
						.text( STRINGS.quickFilter ),
					$( '<input>' )
						.attr( { id: 'siQuickFilter', type: 'text' } )
						.on( 'input', function () {
							const filterString = $( this ).val();
							if ( filterString ) {
								const sel = "#script-installer-panel li[name*='" +
                                        $.escapeSelector( $( this ).val() ) + "']";
								$( '#script-installer-panel li.script' ).toggle( false );
								$( sel ).toggle( true );
							} else {
								$( '#script-installer-panel li.script' ).toggle( true );
							}
						} )
				) );

			// Now, get the checkboxes out of the way
			container.find( '.checkbox-container' )
				.css( 'float', 'right' );
		}
		$.each( imports, function ( targetName, targetImports ) {
			const fmtTargetName = ( targetName === 'common' ?
				STRINGS.skinCommon :
				targetName );
			if ( targetImports.length ) {
				container.append(
					$( '<h2>' ).append(
						fmtTargetName,
						$( '<span>' )
							.addClass( 'normalize-wrapper' )
							.append(
								' (',
								$( '<a>' )
									.text( STRINGS.normalize )
									.on( 'click', function () {
										normalize( targetName ).done( function () {
											conditionalReload( true );
										} );
									} ),
								')' )
							.hide() ),
					$( '<ul>' ).append(
						targetImports.map( function ( anImport ) {
							return $( '<li>' )
								.addClass( 'script' )
								.attr( 'name', anImport.getDescription() )
								.append(
									$( '<a>' )
										.text( anImport.getDescription() )
										.addClass( 'script' )
										.attr( 'href', anImport.getHumanUrl() ),
									' (',
									$( '<a>' )
										.text( STRINGS.uninstallLinkText )
										.on( 'click', function () {
											$( this ).text( STRINGS.uninstallProgressMsg );
											anImport.uninstall().done( function () {
												conditionalReload( true );
											} );
										} ),
									' | ',
									$( '<a>' )
										.text( anImport.disabled ? STRINGS.enableLinkText : STRINGS.disableLinkText )
										.on( 'click', function () {
											$( this ).text( anImport.disabled ? STRINGS.enableProgressMsg : STRINGS.disableProgressMsg );
											anImport.toggleDisabled().done( function () {
												$( this ).toggleClass( 'disabled' );
												conditionalReload( true );
											} );
										} ),
									$( '<span>' )
										.addClass( 'move-wrapper' )
										.append(
											' | ',
											$( '<a>' )
												.text( STRINGS.moveLinkText )
												.on( 'click', function () {
													let dest = null;
													const PROMPT = STRINGS.movePrompt + ' ' + SKINS.join( ', ' );
													do {
														dest = ( window.prompt( PROMPT ) || '' ).toLowerCase();
													} while ( dest && SKINS.indexOf( dest ) < 0 );
													if ( !dest ) {
														return;
													}
													$( this ).text( STRINGS.moveProgressMsg );
													anImport.move( dest ).done( function () {
														conditionalReload( true );
													} );
												} )
										)
										.hide(),
									')' )
								.toggleClass( 'disabled', anImport.disabled );
						} ) ) );
			}
		} );
		return list;
	}

	function buildCurrentPageInstallElement() {
		let addingInstallLink = false; // will we be adding a legitimate install link?
		const installElement = $( '<span>' ); // only used if addingInstallLink is set to true

		const namespaceNumber = mw.config.get( 'wgNamespaceNumber' );
		const pageName = mw.config.get( 'wgPageName' );

		// Namespace 2 is User
		if ( namespaceNumber === 2 &&
                pageName.indexOf( '/' ) > 0 ) {
			const contentModel = mw.config.get( 'wgPageContentModel' );
			if ( contentModel === 'javascript' ) {
				const prefixLength = mw.config.get( 'wgUserName' ).length + 6;
				if ( pageName.indexOf( USER_NAMESPACE_NAME + ':' + mw.config.get( 'wgUserName' ) ) === 0 ) {
					const skinIndex = SKINS.indexOf( pageName.substring( prefixLength ).slice( 0, -3 ) );
					if ( skinIndex >= 0 ) {
						return $( '<abbr>' ).text( STRINGS.cannotInstall )
							.attr( 'title', STRINGS.cannotInstallSkin );
					}
				}
				addingInstallLink = true;
			} else {
				return $( '<abbr>' ).text( STRINGS.cannotInstall + ' (' + STRINGS.notJavaScript + ')' )
					.attr( 'title', STRINGS.cannotInstallContentModel.replace( '$1', contentModel ) );
			}
		}

		// Namespace 8 is MediaWiki
		if ( namespaceNumber === 8 ) {
			return $( '<a>' ).text( STRINGS.installViaPreferences )
				.attr( 'href', mw.util.getUrl( 'Special:Preferences' ) + '#mw-prefsection-gadgets' );
		}

		const editRestriction = mw.config.get( 'wgRestrictionEdit' ) || [];
		if ( ( namespaceNumber !== 2 && namespaceNumber !== 8 ) &&
            ( editRestriction.indexOf( 'sysop' ) >= 0 ||
                editRestriction.indexOf( 'editprotected' ) >= 0 ) ) {
			installElement.append( ' ',
				$( '<abbr>' ).append(
					$( '<img>' ).attr( 'src', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Achtung-yellow.svg/20px-Achtung-yellow.svg.png' ).addClass( 'warning' ),
					STRINGS.insecure )
					.attr( 'title', STRINGS.tempWarning ) );
			addingInstallLink = true;
		}

		if ( addingInstallLink ) {
			const fixedPageName = mw.config.get( 'wgPageName' ).replace( /_/g, ' ' );
			installElement.prepend( $( '<a>' )
				.attr( 'id', 'script-installer-main-install' )
				.text( localScriptsByName[ fixedPageName ] ? STRINGS.uninstallLinkText : STRINGS.installLinkText )
				.on( 'click', makeLocalInstallClickHandler( fixedPageName ) ) );

			// If the script is installed but disabled, allow the user to enable it
			const allScriptsInTarget = imports[ localScriptsByName[ fixedPageName ] ];
			const importObj = allScriptsInTarget && allScriptsInTarget.find( function ( anImport ) {
				return anImport.page === fixedPageName;
			} );
			if ( importObj && importObj.disabled ) {
				installElement.append( ' | ',
					$( '<a>' )
						.attr( 'id', 'script-installer-main-enable' )
						.text( STRINGS.enableLinkText )
						.on( 'click', function () {
							$( this ).text( STRINGS.enableProgressMsg );
							importObj.setDisabled( false ).done( function () {
								conditionalReload( false );
							} );
						} ) );
			}
			return installElement;
		}

		return $( '<abbr>' ).text( STRINGS.cannotInstall + ' ' + STRINGS.insecure )
			.attr( 'title', STRINGS.badPageError );
	}

	function showUi() {
		$( '#firstHeading' ).append( $( '<span>' )
			.attr( 'id', 'script-installer-top-container' )
			.append(
				buildCurrentPageInstallElement(),
				' | ',
				$( '<a>' )
					.text( STRINGS.manageUserScripts ).on( 'click', function () {
						if ( !document.getElementById( 'script-installer-panel' ) ) {
							$( '#mw-content-text' ).before( makePanel() );
						} else {
							$( '#script-installer-panel' ).remove();
						}
					} ) ) );
	}

	function attachInstallLinks() {
		// At the end of each {{Userscript}} transclusion, there is
		// <span id='User:Foo/Bar.js' class='scriptInstallerLink'></span>
		$( 'span.scriptInstallerLink' ).each( function () {
			const scriptName = this.id;
			$( this ).append( ' | ', $( '<a>' )
				.text( localScriptsByName[ scriptName ] ? STRINGS.uninstallLinkText : STRINGS.installLinkText )
				.on( 'click', makeLocalInstallClickHandler( scriptName ) ) );
		} );

		$( 'table.infobox-user-script' ).each( function () {
			const infoboxScriptField = $( this ).find( "th:contains('Source')" ).next();
			let scriptName = mw.config.get( 'wgPageName' );
			// quick test to check if we are dealing with a link
			if ( infoboxScriptField.html() !== infoboxScriptField.text() ) {
				const lnk = infoboxScriptField.find( 'a' );
				if ( !lnk.hasClass( 'external' ) ) {
					scriptName = /\/wiki\/(.*)/.exec( lnk.attr( 'href' ) )[ 1 ];
				}
			} else {
				scriptName = infoboxScriptField.text();
			}
			scriptName = /user:.+?\/.+?.js/i.exec( scriptName )[ 0 ];
			$( this ).children( 'tbody' ).append( $( '<tr>' ).append( $( '<td>' )
				.attr( 'colspan', '2' )
				.addClass( 'script-installer-ibx' )
				.append( $( '<button>' )
					.addClass( 'mw-ui-button mw-ui-progressive mw-ui-big' )
					.text( localScriptsByName[ scriptName ] ? STRINGS.uninstallLinkText : STRINGS.installLinkText )
					.on( 'click', makeLocalInstallClickHandler( scriptName ) ) ) ) );
		} );
	}

	function makeLocalInstallClickHandler( scriptName ) {
		return function () {
			const $this = $( this );
			if ( $this.text() === STRINGS.installLinkText ) {
				const okay = window.confirm(
					STRINGS.bigSecurityWarning.replace( '$1',
						STRINGS.securityWarningSection.replace( '$1', scriptName ) ) );
				if ( okay ) {
					$( this ).text( STRINGS.installProgressMsg );
					Import.ofLocal( scriptName, window.scriptInstallerInstallTarget ).install().done( function () {
						$( this ).text( STRINGS.uninstallLinkText );
						conditionalReload( false );
					}.bind( this ) );
				}
			} else {
				$( this ).text( STRINGS.uninstallProgressMsg );
				const uninstalls = uniques( localScriptsByName[ scriptName ] )
					.map( function ( target ) {
						return Import.ofLocal( scriptName, target ).uninstall();
					} );
				$.when.apply( $, uninstalls ).then( function () {
					$( this ).text( STRINGS.installLinkText );
					conditionalReload( false );
				}.bind( this ) );
			}
		};
	}

	/********************************************
	 *
	 * Utility functions
	 *
	 ********************************************/

	/**
	 * Gets the wikitext of a page with the given title (namespace required).
	 */
	function getWikitext( title ) {
		return $.getJSON(
			mw.util.wikiScript( 'api' ),
			{
				format: 'json',
				action: 'query',
				prop: 'revisions',
				rvprop: 'content',
				rvslots: 'main',
				rvlimit: 1,
				titles: title
			}
		).then( function ( data ) {
			const pageId = Object.keys( data.query.pages )[ 0 ];
			if ( data.query.pages[ pageId ].revisions ) {
				return data.query.pages[ pageId ].revisions[ 0 ].slots.main[ '*' ];
			}
			return '';
		} );
	}

	function escapeForRegex( s ) {
		return s.replace( /[-/\\^$*+?.()|[\]{}]/g, '\\$&' );
	}

	/**
	 * Escape a string for use in a JavaScript string literal.
	 * This function is adapted from
	 * https://github.com/joliss/js-string-escape/blob/6887a69003555edf5c6caaa75f2592228558c595/index.js
	 * (released under the MIT licence).
	 */
	function escapeForJsString( s ) {
		return s.replace( /["'\\\n\r\u2028\u2029]/g, function ( character ) {
			// Escape all characters not included in SingleStringCharacters and
			// DoubleStringCharacters on
			// http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
			switch ( character ) {
				case '"':
				case "'":
				case '\\':
					return '\\' + character;
					// Four possible LineTerminator characters need to be escaped:
				case '\n':
					return '\\n';
				case '\r':
					return '\\r';
				case '\u2028':
					return '\\u2028';
				case '\u2029':
					return '\\u2029';
			}
		} );
	}

	/**
	 * Escape a string for use in an inline JavaScript comment (comments that
	 * start with two slashes "//").
	 * This function is adapted from
	 * https://github.com/joliss/js-string-escape/blob/6887a69003555edf5c6caaa75f2592228558c595/index.js
	 * (released under the MIT licence).
	 */
	function escapeForJsComment( s ) {
		return s.replace( /[\n\r\u2028\u2029]/g, function ( character ) {
			switch ( character ) {
				// Escape possible LineTerminator characters
				case '\n':
					return '\\n';
				case '\r':
					return '\\r';
				case '\u2028':
					return '\\u2028';
				case '\u2029':
					return '\\u2029';
			}
		} );
	}

	/**
	 * Unescape a JavaScript string literal.
	 *
	 * This is the inverse of escapeForJsString.
	 */
	function unescapeForJsString( s ) {
		return s.replace( /\\"|\\'|\\\\|\\n|\\r|\\u2028|\\u2029/g, function ( substring ) {
			switch ( substring ) {
				case '\\"':
					return '"';
				case "\\'":
					return "'";
				case '\\\\':
					return '\\';
				case '\\r':
					return '\r';
				case '\\n':
					return '\n';
				case '\\u2028':
					return '\u2028';
				case '\\u2029':
					return '\u2029';
			}
		} );
	}

	function getFullTarget( target ) {
		return USER_NAMESPACE_NAME + ':' + mw.config.get( 'wgUserName' ) + '/' +
                target + '.js';
	}

	// From https://stackoverflow.com/a/10192255
	function uniques( array ) {
		return array.filter( function ( el, index, arr ) {
			return index === arr.indexOf( el );
		} );
	}

	if ( window.scriptInstallerAutoReload === undefined ) {
		window.scriptInstallerAutoReload = true;
	}

	if ( window.scriptInstallerInstallTarget === undefined ) {
		window.scriptInstallerInstallTarget = 'common'; // by default, install things to the user's common.js
	}

	const jsPage = mw.config.get( 'wgPageName' ).slice( -3 ) === '.js' ||
        mw.config.get( 'wgPageContentModel' ) === 'javascript';
	$.when(
		$.ready,
		mw.loader.using( [ 'mediawiki.api', 'mediawiki.util' ] )
	).then( function () {
		api = new mw.Api();
		buildImportList().then( function () {
			attachInstallLinks();
			if ( jsPage ) {
				showUi();
			}

			// Auto-open the panel if we set the cookie to do so (see `conditionalReload()`)
			if ( document.cookie.indexOf( 'open_script_installer=yes' ) >= 0 ) {
				document.cookie = 'open_script_installer=; expires=Thu, 01 Jan 1970 00:00:01 GMT';
				$( "#script-installer-top-container a:contains('Manage')" ).trigger( 'click' );
			}
		} );
	} );
}() );
