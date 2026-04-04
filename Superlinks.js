// Forked from https://en.wikipedia.org/w/index.php?title=User:Bradv/Scripts/Superlinks.js&oldid=1171577516, with thanks to the author of that user script, Bradv.

/* eslint-disable no-var, no-irregular-whitespace, no-jquery/no-constructor-attributes, no-use-before-define, no-redeclare, no-jquery/no-done-fail, no-jquery/no-each-util, unicorn/prefer-string-slice */

( function ( $, mw ) {
	var app = {
		links: {}
	};

	function execute() {
		// Looks like this user script only works with skin Vector 2010
		if ( mw.config.get( 'skin' ) !== 'vector' ) {
			return;
		}
		loadCss();
		placeHtmlAndClickListeners();
	}

	function loadCss() {
		mw.util.addCSS( `
			#superlinks {
				display:inline-block;
				line-height: 24px;
			}
			#superlinks-links {
				font-size: 0.75em;
				color:#555;
			}
			#superlinks-links label {
				padding: 0 0.2em;
			}
			#superlinks-links > span:before {
				content: '(';
			}
			#superlinks-links > span:after {
				content: ') ';
			}
			#superlinks-links > span > a {
				text-transform: lowercase;
			}
			#superlinks-links a {
				padding: 0 0.2em;
				color: #0645ad !important;
				text-decoration: none !important;
			}
			#superlinks-links a.active, 
			#superlinks-links a:hover {
				border-bottom: 2px solid #a7d7f9;
			}
			#superlinks-window {
				position: absolute;
				top: 48px;
				right: 5px;
				border: 2px solid #a7d7f9;
				width: 45vw;
				height: 75vh;
				box-shadow: 0px 0px 4px 2px #eee;
				z-index: 1;
			}
			#superlinks-window:before {
				content: '';
				position: absolute;
				top: -20px;
				width: 0;
				height: 0;
				border: 10px solid transparent;
				border-bottom-color: #a7d7f9;
				margin-right: -16px;
			}
			#superlinks-window:after {
				content: '';
				position: absolute;
				top: -17px;
				width: 0;
				height: 0;
				border: 10px solid transparent;
				border-bottom-color: transparent;
				margin-right: -16px;
			}
			#superlinks-icons {
				position:absolute;
				left:-2px;
				top:-14px;
				font-size:10px;
				line-height:10px;
				background-color:#a7d7f9;
				padding: 2px 8px;
			}
			#superlinks-icons a:not(:first-child) {
				margin-left: 20px;
			}
			#superlinks-icons img {
				height: 8px;
				margin-top: -1px;
			}
			#superlinks-content {
				overflow: auto;
				height: calc(100% - 10px);
				width: calc(100% - 10px);
				font-size: 90%;
				padding:5px;
				background-color: #f6fbfe;
			}
			#superlinks-content > ul#pagehistory > li > input {
				display: none;
			}
			#superlinks-content > #empty {
				position:absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				color: #a7d7f9;
				font-size: 1.5em;
				font-weight: bold;
				text-align:center;
			}
			#superlinks-content > #empty img {
				width: 30px;
				height: 30px;
				opacity:0.5;
			}
			#superlinks-content > #empty #empty-sub {
				font-size: 0.8em;
				font-weight: normal;
				padding-top: 1em;
			}
			#superlinks-content > #empty #empty-sub a {
				opacity: 0.5;
			}
			#superlinks-content .mw-changeslist-separator:empty:before {
				content: '. .';
			}
			#superlinks-content .mw-changeslist-links {
				display: inline-block;
				margin: 0;
				padding: 0;
			}
			#superlinks-content .mw-changeslist-links:before {
				content: '(';
			}
			#superlinks-content .mw-changeslist-links:after {
				content: ')';
			}
			#superlinks-content .mw-changeslist-links > span:not(:first-child):before {
				content: ' | ';
			}
			#superlinks-content .snippet {
				line-height: 1.5em;
				margin-bottom: 1.5em;
			}
			#superlinks-content .searchmatch {
				font-weight: bold;
			}
		` );
	}

	function makeLink( caption, group ) {
		const $link = $( '<a>', { href: '#' } ).text( caption );
		if ( group ) {
			group.append( $link );
		} else {
			$( '#superlinks-links' ).append( $link );
		}
		$link.on( 'click', ( e ) => {
			handleClick( e );
		} );
		return $link[ 0 ];
	}

	function makeLinkGroup( caption ) {
		if ( caption ) {
			$( '#superlinks-links' ).append( $( '<label/>' ).text( caption ) );
		}
		return $( '<span/>' ).appendTo( $( '#superlinks-links' ) );
	}

	function makeSpecialPageLinks() {
		const cspn = mw.config.get( 'wgCanonicalSpecialPageName' );
		app.links.userpage = makeLink( 'User', usergrp );
		var usergrp = makeLinkGroup();
		app.links.usertalk = makeLink( 'Talk', usergrp );
		if ( cspn != 'Contributions' ) {
			app.links.contribs = makeLink( 'Contribs', usergrp );
		}
		if ( mw.config.get( 'wgUserGroups' ).includes( 'sysop' ) && cspn != 'DeletedContributions' ) {
			app.links.deleted = makeLink( 'Deleted', usergrp );
		}
		app.links.actions = makeLink( 'Actions', usergrp );
		app.links.userFilter = makeLink( 'Filter', usergrp );
		app.links.rights = makeLink( 'Rights', usergrp );
		app.links.blocklog = makeLink( 'Blocks', usergrp );
		if ( mw.config.get( 'wgWikiID' ) == 'enwiki' ) {
			app.links.dsalerts = makeLink( 'DS Alerts', usergrp );
			app.links.restrict = makeLink( 'Restrictions', usergrp );
		}
		if ( mw.config.get( 'wgUserGroups' ).includes( 'checkuser' ) ) {
			app.links.culog = makeLink( 'checks', usergrp );
		}
	}

	function makeArticleOrArticleHistoryLinks() {
		if ( !app.$articleElement.hasClass( 'new' ) ) {
			if ( app.$historyElement.hasClass( 'selected' ) ) { // on history page
				app.links.article = makeLink( app.$articleElement.find( 'a' ).text() );
			}
			if ( app.$historyElement.length && ( !app.$historyElement.hasClass( 'selected' ) ) ) { // not on history page (but it exists)
				app.links.history = makeLink( 'History' );
			}
		}
		app.links.logs = makeLink( 'Log' );
		app.links.filter = makeLink( 'Filter' );
		if ( !app.$talkElement.hasClass( 'new' ) ) { // talk exists
			app.links.talk = makeLink( 'Talk' );
		}
		app.links.notice = makeLink( 'Page Notice' );
	}

	function makeTalkOrTalkHistoryLinks() {
		let pagegrp, talkgrp;
		if ( !app.$articleElement.hasClass( 'new' ) ) { // article exists
			app.links.article = makeLink( app.$articleElement.find( 'a' ).text() );
			pagegrp = makeLinkGroup();
			app.links.articleHistory = makeLink( 'History', pagegrp );
		} else {
			pagegrp = makeLinkGroup( app.$articleElement.find( 'a' ).text() );
		}
		app.links.articleLogs = makeLink( 'Log', pagegrp );
		app.links.articleFilter = makeLink( 'Filter', pagegrp );
		app.links.notice = makeLink( 'Page Notice', pagegrp );

		if ( !app.$talkElement.hasClass( 'new' ) ) { // talk exists
			if ( app.$historyElement.hasClass( 'selected' ) ) { // on history page
				app.links.talk = makeLink( 'Talk' );
				talkgrp = makeLinkGroup();
			} else {
				talkgrp = makeLinkGroup( 'Talk' );
				app.links.history = makeLink( 'History', talkgrp );
			}
		} else {
			talkgrp = makeLinkGroup( 'Talk' );
		}
		app.links.logs = makeLink( 'Log', talkgrp );
		app.links.filter = makeLink( 'Filter', talkgrp );
	}

	function makeUserLinks() {
		var usergrp = makeLinkGroup( 'User' );
		app.links.contribs = makeLink( 'Contribs', usergrp );
		if ( mw.config.get( 'wgUserGroups' ).includes( 'sysop' ) ) {
			app.links.deleted = makeLink( 'Deleted', usergrp );
		}
		app.links.actions = makeLink( 'Actions', usergrp );
		app.links.userFilter = makeLink( 'Filter', usergrp );
		app.links.rights = makeLink( 'Rights', usergrp );
		app.links.blocklog = makeLink( 'Blocks', usergrp );
		if ( mw.config.get( 'wgWikiID' ) == 'enwiki' ) {
			app.links.dsalerts = makeLink( 'DS Alerts', usergrp );
			app.links.restrict = makeLink( 'Restrictions', usergrp );
		}
		if ( mw.config.get( 'wgUserGroups' ).includes( 'checkuser' ) ) {
			app.links.culog = makeLink( 'checks', usergrp );
		}
	}

	function placeHtmlAndClickListeners() {
		app.$root = $( '<div>', { id: 'superlinks' } ).text( '[' ).append( $( '<span>', { id: 'superlinks-links' } ) );
		app.$root.prependTo( $( 'div.mw-indicators' ) );

		app.$articleElement = $( '#p-associated-pages ul > li:first-child' );
		app.$talkElement = $( '#ca-talk' );
		app.$historyElement = $( '#ca-history' );
		app.relevantUser = mw.config.get( 'wgRelevantUserName' );
		if ( app.relevantUser ) {
			app.relevantUser = mw.util.wikiUrlencode( app.relevantUser );
		}

		if ( app.$articleElement.attr( 'id' ) == 'ca-nstab-special' ) { // on special page, like contribs
			if ( app.relevantUser ) {
				makeSpecialPageLinks();
			}
		} else {
			if ( app.$articleElement.hasClass( 'selected' ) ) { // on article or article history
				makeArticleOrArticleHistoryLinks();
			} else { // on talk or talk history
				makeTalkOrTalkHistoryLinks();
			}

			if ( app.relevantUser ) {
				makeUserLinks();
			}

			const ns = mw.config.get( 'wgNamespaceNumber' );
			if ( mw.config.get( 'wgWikiID' ) == 'enwiki' && ns == 0 && mw.loader.getState( 'ext.pageTriage.util' ) != 'registered' ) {
				app.links.nppflowchart = makeLink( 'NPP Flowchart' );
			}

			if ( mw.config.get( 'wgWikiID' ) == 'enwiki' && mw.config.get( 'wgCategories' ).includes( 'Pending AfC submissions' ) ) {
				app.links.afcflowchart = makeLink( 'AfC Flowchart' );
			}
		}

		app.$root.append( ']' );
	}

	function putMessageInPanel( text ) { // blank for loading icon
		app.$content.empty();
		const $div = $( '<div>', { id: 'empty' } );
		if ( text ) {
			$div.text( text );
		} else {
			$div.append( $( '<img>', { src: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Chromiumthrobber.svg' } ) );
		}
		app.$content.append( $div );
	}

	function putErrorMessageInPanel() {
		app.$content.empty().append( $( `
			<div id='empty'>
				The page does not exist or could not be loaded.
				<div id='empty-sub'>
					Report this error <a href='/wiki/User_talk:Novem_Linguae/Scripts/Superlinks.js' target='_blank'>here</a>.
				</div>
			</div>
		` ) );
	}

	function doFinalPanelLoadingTasks() {
		if ( app.$content.children().length === 0 ) {
			putMessageInPanel( 'No results' );
		}
		app.$content.find( 'a[href]' ).not( '[href^="#"]' ).attr( 'target', '_blank' );
		app.$content.find( 'input' ).remove();
		try {
			app.$content.find( '.mw-collapsible' ).makeCollapsible();
		} catch ( e ) {}
	}

	function checkForErrors( response, status ) {
		if ( status == 'success' ) {
			doFinalPanelLoadingTasks();
		} else {
			putErrorMessageInPanel();
		}
	}

	function openPanel( url ) {
		app.$root.find( '#superlinks-popout' ).remove();
		if ( url ) {
			app.$root.find( '#superlinks-icons' ).append(
				$( '<a>', { id: 'superlinks-popout', href: url, target: '_blank' } ).append(
					$( '<img>', { src: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/OOjs_UI_icon_newWindow-ltr.svg' } )
				)
			);
		}
	}

	function handleClick( e ) {
		e.preventDefault();
		if ( app.active == e.target ) {
			closeAllPanels( e );
		} else {
			closeAllPanels( e );
			app.active = e.target;
			$( app.active ).addClass( 'active' );

			app.$window = $( '<div>', { id: 'superlinks-window' } ).appendTo( app.$root );

			const el = $( e.target )[ 0 ];
			const pos = el.offsetParent.offsetWidth - el.offsetLeft - ( el.offsetWidth / 2 );
			app.styleSheetFragment = mw.util.addCSS( '#superlinks-window:before {right: ' + pos + 'px} #superlinks-window:after {right: ' + pos + 'px}' );

			// Draw the outline of the panel
			app.$window.append(
				$( '<span>', { id: 'superlinks-icons' } )
					.append(
						$( '<a>', { href: '#' } )
							.text( 'close' )
							.on( 'click', ( e ) => closeAllPanels( e ) )
					)
			);

			// Draw the inside of the panel, including a spinner
			app.$content = $( '<div>', { id: 'superlinks-content' } ).appendTo( app.$window );
			putMessageInPanel();

			// Run the API query and put real content in the panel
			switch ( e.target ) {
				case app.links.userpage:
					var url = '/w/index.php?action=render&title=User:' + app.relevantUser;
					app.$content.load( url, checkForErrors );
					openPanel( '/wiki/User:' + app.relevantUser );
					break;
				case app.links.usertalk:
					var url = '/w/index.php?action=render&title=User_talk:' + app.relevantUser;
					app.$content.load( url, checkForErrors );
					openPanel( '/wiki/User_talk:' + app.relevantUser );
					break;
				case app.links.article:
					var url = app.$articleElement.find( 'a' )[ 0 ].href.replace( '/wiki/', '/w/index.php?action=render&title=' );
					app.$content.load( url, checkForErrors );
					openPanel( app.$articleElement.find( 'a' )[ 0 ].href );
					break;
				case app.links.articleHistory:
					var url = app.$articleElement.find( 'a' )[ 0 ].href.replace( '/wiki/', '/w/index.php?action=history&safemode=1&limit=100&title=' );
					app.$content.load( url + ' #pagehistory', checkForErrors );
					openPanel( app.$articleElement.find( 'a' )[ 0 ].href.replace( '/wiki/', '/w/index.php?action=history&title=' ) );
					break;
				case app.links.talk:
					var url = $( '#ca-talk > a' )[ 0 ].href.replace( '/wiki/', '/w/index.php?action=render&title=' );
					app.$content.load( url, checkForErrors );
					openPanel( $( '#ca-talk > a' )[ 0 ].href );
					break;
				case app.links.history:
					var url = $( '#ca-history > a' )[ 0 ].href + '&safemode=1&limit=100';
					app.$content.load( url + ' #pagehistory', checkForErrors );
					openPanel( $( '#ca-history > a' )[ 0 ].href );
					break;
				case app.links.articleLogs:
					var url = app.$articleElement.find( 'a' )[ 0 ].href.replace( '/wiki/', '/wiki/Special:Log?wpfilters%5B%5D=patrol&safemode=1&limit=100&page=' );
					app.$content.load( url + ' #mw-content-text ul', checkForErrors );
					openPanel( app.$articleElement.find( 'a' )[ 0 ].href.replace( '/wiki/', '/wiki/Special:Log?wpfilters%5B%5D=patrol&page=' ) );
					break;
				case app.links.logs:
					var url = '/w/index.php?title=Special:Log&wpfilters%5B%5D=patrol&page=' + mw.config.get( 'wgPageName' ) + '&safemode=1&limit=100';
					app.$content.load( url + ' #mw-content-text ul', checkForErrors );
					openPanel( '/w/index.php?title=Special:Log&wpfilters%5B%5D=patrol&page=' + mw.config.get( 'wgPageName' ) );
					break;
				case app.links.notice:
					var url = app.$articleElement.find( 'a' )[ 0 ].href.replace( '/wiki/', '/w/index.php?action=render&title=Template:Editnotices/Page/' );
					app.$content.load( url, checkForErrors );
					openPanel( url.replace( 'action=render&', '' ) );
					break;
				case app.links.contribs:
					var url = '/w/index.php?title=Special:Contributions/' + app.relevantUser + '&safemode=1&limit=100';
					app.$content.load( url + ' #mw-content-text ul.mw-contributions-list', checkForErrors );
					openPanel( '/w/index.php?title=Special:Contributions/' + app.relevantUser );
					break;
				case app.links.deleted:
					var url = '/w/index.php?title=Special:DeletedContributions/' + app.relevantUser + '&safemode=1&limit=100';
					app.$content.load( url + ' #mw-content-text > section', checkForErrors );
					openPanel( '/w/index.php?title=Special:DeletedContributions/' + app.relevantUser );
					break;
				case app.links.actions:
					var url = '/wiki/Special:Log/' + app.relevantUser;
					app.$content.load( url + ' #mw-content-text ul', checkForErrors );
					openPanel( '/wiki/Special:Log/' + app.relevantUser );
					break;
				case app.links.blocklog:
					var url = '/w/index.php?title=Special:Log/block&page=' + app.relevantUser + '&safemode=1';
					app.$content.load( url + ' #mw-content-text ul', checkForErrors );
					openPanel( '/w/index.php?title=Special:Log/block&page=' + app.relevantUser );
					break;
				case app.links.filter:
					var url = '/w/index.php?title=Special:AbuseLog&wpSearchTitle=' + mw.config.get( 'wgPageName' ) + '&safemode=1';
					app.$content.load( url + ' #mw-content-text ul', checkForErrors );
					openPanel( '/w/index.php?title=Special:AbuseLog&wpSearchTitle=' + mw.config.get( 'wgPageName' ) );
					break;
				case app.links.articleFilter:
					var url = app.$articleElement.find( 'a' )[ 0 ].href.replace( '/wiki/', '/wiki/Special:AbuseLog?safemode=1&wpSearchTitle=' );
					app.$content.load( url + ' #mw-content-text ul', checkForErrors );
					openPanel( app.$articleElement.find( 'a' )[ 0 ].href.replace( '/wiki/', '/wiki/Special:AbuseLog?wpSearchTitle=' ) );
					break;
				case app.links.userFilter:
					var url = '/w/index.php?title=Special:AbuseLog&wpSearchUser=' + app.relevantUser + '&safemode=1';
					app.$content.load( url + ' #mw-content-text ul', checkForErrors );
					openPanel( '/w/index.php?title=Special:AbuseLog&wpSearchUser=' + app.relevantUser );
					break;
				case app.links.rights:
					var url = '/w/index.php?title=Special:UserRights&user=' + app.relevantUser + '&safemode=1';
					app.$content.load( url + ' #mw-content-text > ul', checkForErrors );
					openPanel( '/wiki/Special:UserRights/' + app.relevantUser );
					break;
				case app.links.culog:
					var url = '/w/index.php?title=Special:CheckUserLog&cuSearchType=target&cuSearch=' + app.relevantUser;
					app.$content.load( url + ' #mw-content-text > ul', checkForErrors );
					openPanel( '/w/index.php?title=Special:CheckUserLog&cuSearchType=target&cuSearch=' + app.relevantUser );
					break;
				case app.links.nppflowchart:
					var $obj = $( '<object>', {
						id: 'nppsvg',
						type: 'image/svg+xml',
						style: 'width: 100%'
					} );
					app.$content.empty().append( $obj );
					$obj.attr( 'data', 'https://upload.wikimedia.org/wikipedia/commons/f/f4/NPP_flowchart.svg' );
					break;
				case app.links.afcflowchart:
					app.$content.empty().append(
						$( '<img>', {
							src: 'https://upload.wikimedia.org/wikipedia/en/a/a8/Flow_chart_for_AFC_3.1.png',
							style: 'width: 100%'
						} )
					);
					break;
				case app.links.dsalerts:
					openDsAlertPanel();
					break;
				case app.links.restrict:
					openEditingRestrictionsPanel();
					break;
			}

			app.$keyup = $( 'body' ).on( 'keyup', ( event ) => {
				if ( event.which == 27 ) {
					closeAllPanels( event );
				}
			} );
		}
	}

	function openEditingRestrictionsPanel() {
		var $er = $( '<div>' ).appendTo( app.$content );
		$.getJSON( '/w/api.php', {
			action: 'query',
			format: 'json',
			list: 'search',
			srsearch: 'User:' + app.relevantUser + ' prefix:Wikipedia:Editing restrictions/',
			srnamespace: 4
		} )
			.done( ( data ) => {
				app.$content.find( '#empty' ).remove();
				if ( data.query.search.length ) {
					$er.append( $( '<h2/>' )
						.append( '<span/>', { class: 'mw-headline' } )
						.text( 'Search results: Wikipedia:Editing restrictions' ) );
					$.each( data.query.search, ( i, result ) => {
						$er.append( $( '<p style="font-weight:bold"/>' )
							.append( $( '<a/>', {
								href: '/wiki/' + result.title.replace( / /g, '_' ) + '#:~:text=' + app.relevantUser,
								title: result.title
							} ).text( result.title ) ) );
						$er.append( $( '<p class="snippet">' + result.snippet + '</p>' ) );
						$er.append( $( '<hr/>' ) );
					} );
				} else {
					$er.remove();
				}
				doFinalPanelLoadingTasks();
			} )
			.fail( () => {
				putErrorMessageInPanel();
			} );

		var $ae = $( '<div>' ).appendTo( app.$content );
		$.getJSON( '/w/api.php', {
			action: 'query',
			format: 'json',
			list: 'search',
			srsearch: 'User:' + app.relevantUser + ' prefix:Wikipedia:Arbitration enforcement log/',
			srnamespace: 4
		} )
			.done( ( data ) => {
				app.$content.find( '#empty' ).remove();
				if ( data.query.search.length ) {
					$ae.append( $( '<h2/>' )
						.append( '<span/>', { class: 'mw-headline' } )
						.text( 'Search results: Wikipedia:Arbitration enforcement log' ) );
					$.each( data.query.search, ( i, result ) => {
						$ae.append( $( '<p style="font-weight:bold"/>' )
							.append( $( '<a/>', {
								href: '/wiki/' + result.title.replace( / /g, '_' ) + '#:~:text=' + app.relevantUser,
								title: result.title
							} ).text( result.title ) ) );
						$ae.append( $( '<p class="snippet">' + result.snippet + '</p>' ) );
						$ae.append( $( '<hr/>' ) );
					} );
				} else {
					$ae.remove();
				}
				doFinalPanelLoadingTasks();
			} )
			.fail( () => {
				putErrorMessageInPanel();
			} );
	}

	function openDsAlertPanel() {
		openPanel( '/wiki/Special:AbuseLog?wpSearchTitle=User_talk%3A' + app.relevantUser + '&wpSearchFilter=602' );
		$.getJSON( '/w/api.php', {
			action: 'query',
			format: 'json',
			list: 'abuselog',
			afldir: 'older',
			afltitle: 'User talk:' + app.relevantUser,
			aflfilter: 602
		} )
			.done( ( data ) => {
				app.$content.empty();
				if ( data.query.abuselog.filter( ( item ) => ( item.revid ) ).length ) {
					$.each( data.query.abuselog, ( i, item ) => {
						if ( item.result == 'tag' && item.revid ) {
							const $item = $( '<div>' ).appendTo( app.$content );
							$.getJSON( '/w/api.php', {
								action: 'compare',
								format: 'json',
								fromrev: item.revid,
								torelative: 'prev',
								prop: 'user|comment|diff'
							} )
								.done( ( comparedata ) => {
									let ts = new Date( item.timestamp ).toUTCString();
									ts = ts.substring( 5, ts.indexOf( 'GMT' ) - 1 );
									const sum = ts + ' [[User:' + comparedata.compare.touser + '|' + comparedata.compare.touser + ']] ([[Special:Diff/' + item.revid + '|diff]])\n';

									let diff = '';
									$( comparedata.compare[ '*' ] ).find( 'td.diff-addedline > div' ).each( ( i, item ) => {
										diff += $( item ).html() + '\n';
									} );

									diff = $( '<textarea/>' ).html( diff ).text();
									diff = diff + "<div style='text-align:right'>" + sum + '</div>\n{{hr}}';
									$.getJSON( '/w/api.php', { action: 'parse', format: 'json', contentmodel: 'wikitext', text: diff } )
										.done( ( parsedata ) => {
											$item.append( parsedata.parse.text[ '*' ] );
											$item.find( '.mw-editsection' ).remove();
											doFinalPanelLoadingTasks();
										} );
								} );
						}
					} );
				} else {
					doFinalPanelLoadingTasks();
				}
			} )
			.fail( () => {
				putErrorMessageInPanel();
			} );
	}

	function closeAllPanels( e ) {
		if ( e ) {
			e.preventDefault();
		}
		$( 'body' ).off( 'keyup', app.$keyup );
		if ( app.styleSheetFragment ) {
			$( app.styleSheetFragment.ownerNode ).remove();
			app.styleSheetFragment = null;
		}
		$( app.$window ).remove();
		$( app.active ).removeClass( 'active' );
		app.active = null;
	}

	execute();
}( jQuery, mediaWiki ) );
