/*

Forked from https://en.wikipedia.org/wiki/User:Ajbura/anrfc-lister.js. A big thanks to the original author, Ajbura.

HOW TO USE:
- go to a talk page
- click More -> ANRFC Lister
- there will now be "List on ANRFC" links next to each section. click one
- fill out the form
- press "Submit"
- the script will add a listing to WP:ANRFC for you :)

SKINS IT WORKS IN:
- vector
- vector-2022
- timeless
- monobook
- modern

SKINS IT DOESNT WORK IN:
- minerva

CHANGES BY NOVEM LINGUAE:
- Linted code. Added comments. Refactored.
- Works on testwiki now (gives a local WP:ANRFC link instead of an enwiki WP:ANRFC link).
- Fixed bug where the script was always in an endless loop
- Fixed bug where the RFC would always get placed at the bottom of the page, not in its proper section
- Fixed bug where section heading (the # part of the wikilink) was not getting added to WP:ANRFC
- Fixed bug where More -> ANRFC Lister link was the wrong size and did not match the style of the skin
- Fixed bug where no signature or a signature too far down caused it to hang forever
- Added a "Cancel" button to the form
- No longer displays on special pages, diffs, editing a page, etc.
- Clicking "Would you like to see it?" now takes you to exact section, instead of top of page.
- Fixed duplicate RFC listing detection.
- Titles shouldn't have underscores
- Fixed bug where the script would always give "signature not found" error if you had MediaWiki:Gadget-CommentsInLocalTime.js gadget installed

NOVEM LINGUAE TODO:
- test unicode titles
- test titles with weird punctuation in section names, e.g. ending in ?

*/

/* global OO */

// <nowiki>
var ANRFC = {
	init: function() {
		// don't run when not viewing articles
		let action = mw.config.get('wgAction');
		let isNotViewing = action != 'view';
		if ( isNotViewing ) {
			return;
		}

		// don't run when viewing diffs
		let isDiff = mw.config.get('wgDiffNewId');
		if ( isDiff ) {
			return;
		}

		// Don't run in virtual namespaces
		let isVirtualNamespace = mw.config.get('wgNamespaceNumber') < 0;
		if ( isVirtualNamespace ) {
			return;
		}

		mw.util.addPortletLink('p-cactions', '#', 'ANRFC lister', 'ca-anrfc');
		$('#ca-anrfc').attr('onClick', 'ANRFC.toggle();');
	},
	toggle: function () {
		let $anrfcListerLinkInMoreMenu = $("#ca-anrfc a");
		if ($anrfcListerLinkInMoreMenu.css('color') == 'rgb(255, 0, 0)') {
			$anrfcListerLinkInMoreMenu.css('color', '');
			ANRFC.removeLabels();
		} else {
			$anrfcListerLinkInMoreMenu.css('color', 'red');
			ANRFC.addLabels();
		}
	},
	removeLabels: function () {
		$('a.mw-ANRFC').each(function() {
			this.remove();
			var keyId = this.getAttribute('indexKey') + "-anrfcBox";
			if (document.getElementById(keyId) != null) {
				return document.getElementById(keyId).remove();
			}
		});
	},
	addLabels: function () {
		// Target the [ vedit | edit source ] buttons by each section heading
		$('span.mw-editsection').each(function(index) {
			// Add it
			$(this.parentElement).append("<a indexKey=" + index + " class='mw-ANRFC' onclick='ANRFC.addForm(this)'>List on ANRFC</a>");
			// Style it
			$('a.mw-ANRFC').css({ "margin-left": "8px", "font-size": "small", "font-family": "sans-serif" });
		});
	},
	/**
	 * @param el HTML element span.mw-editsection
	 */
	addForm: function(el) {
		// If there's a form already created, delete it. (This makes the "List on ANRFC" link a toggle that opens the form or closes the form, based on current state.)
		var keyId = el.getAttribute('indexKey') + "-anrfcBox";
		if (document.getElementById(keyId) != null) {
			return document.getElementById(keyId).remove();
		}

		var $anrfcBox = ANRFC.getFormHtmlAndSetFormListeners(keyId);

		// el (span.mw-editsection) -> parent (h2) -> after
		$(el).parent().after($anrfcBox);
	},
	getFormHtmlAndSetFormListeners(keyId) {
		var $anrfcBox = $('<div>', {
			id: keyId
		});

		$anrfcBox.css({
			'margin': '16px 0',
			'padding': '16px',
			'background-color': '#f3f3f3',
			'border': '1px solid grey',
			'font-size': '14px',
			'font-family': 'sans-serif',
		});

		var dropDown = new OO.ui.DropdownWidget({
			label: 'Dropdown menu: Select discussion section',
			menu: {
				items: [
					new OO.ui.MenuOptionWidget( {
						data: 0,
						label: 'Administrative discussions'
					} ),
					new OO.ui.MenuOptionWidget( {
						data: 1,
						label: 'Requests for comment'
					} ),
					new OO.ui.MenuOptionWidget( {
						data: 2,
						label: 'Deletion discussions'
					} ),
					new OO.ui.MenuOptionWidget( {
						data: 3,
						label: 'Other types of closing requests'
					} )
				]
			}
		});

		var messageInput = new OO.ui.MultilineTextInputWidget({
			placeholder: 'Custom message (optional)',
			multiline: true,
			autosize: true,
			maxRows: 4
		});

		var submitButton = new OO.ui.ButtonWidget({
			label: 'Submit',
			flags: [
				'progressive',
				'primary'
			]
		});

		var cancelButton = new OO.ui.ButtonWidget({
			label: 'Cancel',
		});

		$anrfcBox.append('<h3 style="margin: 0 0 16px;">List this discussion on <a href="/wiki/Wikipedia:Closure_requests" target="_blank">Wikipedia:Closure requests</a></h3>');
		var wrapper = document.createElement('div');
		$(wrapper).append('<p>Under section: </p>');
		$(wrapper).append(dropDown.$element);
		$anrfcBox.append(wrapper);

		wrapper = document.createElement('div');
		$(wrapper).css({ 'margin-top': '8px' });
		$(wrapper).append(messageInput.$element);
		$(wrapper).append($(submitButton.$element).css({
			'margin-top': '8px',
		}));
		$(wrapper).append($(cancelButton.$element).css({
			'margin-top': '8px',
		}));
		$anrfcBox.append(wrapper);

		submitButton.on('click', function() {
			ANRFC.onSubmit(dropDown, messageInput, keyId);
		} );

		cancelButton.on('click', function() {
			document.getElementById(keyId).remove();
		} );

		return $anrfcBox;
	},
	dateToObj(dateString) {
		var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		var oDate = dateString.split(/, | /);
		oDate[0] = oDate[0].match(/[\d]{1,2}:[\d]{1,2}/)[0];
		var time = {
			hh: oDate[0].match(/([\d]{1,2}):/)[1],
			mm: oDate[0].match(/:([\d]{1,2})/)[1]
		};
		return {
			time: time,
			day: parseInt(oDate[1]),
			month: months.indexOf(oDate[2]),
			year: parseInt(oDate[3])
		};
	},
	getRFCDate: function(keyId) {
		// Grab initiated date (the first signature in the section will have the initiated date)

		// Looks for a standard signature: 03:31, 11 January 2024 (UTC)
		var dateRegex = /([\d]{1,2}:[\d]{1,2},\s[\d]{1,2}\s[\w]+\s[\d]{4}\s\([\w]+\))/;
		// Looks for a MediaWiki:Gadget-CommentsInLocalTime.js signature: 10:55 am, 29 November 2016, Tuesday (7 years, 1 month, 13 days ago) (UTC−8)
		var dateRegexForCommentsInLocalTimeGadget = /([\d]{1,2}:[\d]{1,2}(?: am| pm)?,\s[\d]{1,2}\s[\w]+\s[\d]{4}.*?\(UTC[^)]+\))/;
		var initDateMatches = null;
		var textToCheck = '';
		var $nextEl = $('#' + keyId); // #0-anrfcBox
		// TODO: Only check elements between anrfcBox and the next H2 (or end of page). Right now it checks the entire page until it runs out of .next() elements.
		do {
			if ($nextEl.next().hasClass('boilerplate')) {
				$nextEl = $nextEl.next().children('p');
			} else {
				$nextEl = $nextEl.next();
			}

			textToCheck = $nextEl.text();
			initDateMatches = textToCheck.match(dateRegex);
			if ( ! initDateMatches ) {
				// Maybe the user has MediaWiki:Gadget-CommentsInLocalTime.js installed, which changes the format of signature dates. Try the other regex.
				initDateMatches = textToCheck.match(dateRegexForCommentsInLocalTimeGadget);
				if ( initDateMatches ) {
					initDateMatches[0] = ANRFC.convertUtcWhateverToUtcZero(initDateMatches[0]);
				}
			}

			if ( ! $nextEl.length ) {
				// We're out of siblings to check at this level. Try the parent's siblings.
				$nextEl = $nextEl.prevObject.parent().next();
			}
		} while ( ! initDateMatches && $nextEl.length );

		return initDateMatches;
	},
	/**
	 * Convert MediaWiki:Gadget-CommentsInLocalTime.js date strings to regular date strings
	 * @param {string} dateString 10:55 am, 29 November 2016, Tuesday (7 years, 1 month, 13 days ago) (UTC−8)
	 * @returns {string} 18:55, 29 November 2016
	 */
	convertUtcWhateverToUtcZero(dateString) {
		const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

		// chop out unnecessary info in the middle of the string
		var dateStringShort = dateString.replace(/(\d{4}),.+( \(UTC)/, '$1$2'); // 10:55 am, 29 November 2016 (UTC−8)

		var unixTimestampWithMilliseconds = Date.parse(dateStringShort); // 1480445700000
		var date = new Date(unixTimestampWithMilliseconds);
		var dateStringConverted = date.getUTCHours() + ':'
			+ date.getUTCMinutes() + ', '
			+ date.getUTCDate() + ' '
			+ months[date.getUTCMonth()] + ' '
			+ date.getUTCFullYear();
		return dateStringConverted; // 18:55, 29 November 2016
	},
	/**
	 * @param {OO.ui.DropdownWidget} dropDown The discussion section the user selected.
	 * @param {OO.ui.MultilineTextInputWidget} messageInput The message the user typed.
	 * @param {string} keyId The section number (starting at zero), concatenated with -anrfcBox. Example: 0-anrfcBox. This will eventually be used to do $('#0-anrfcBox'), which is the HTML created by ANRFC.addForm()
	 */
	onSubmit: function(dropDown, messageInput, keyId) {
		// Dropdown is required.
		if (dropDown.getMenu().findSelectedItem() == null) {
			return OO.ui.alert( 'Please select discussion section from dropdown menu!' ).then(function() {
				dropDown.focus();
			} );
		}

		// Grab what the user typed into the form.
		var targetSection = dropDown.getMenu().findSelectedItem().getData();
		var message = messageInput.getValue();

		// Grab page title
		var pageName = mw.config.get('wgPageName').replaceAll('_', ' ');

		// Grab section title
		var sectionTitle = $('#' + keyId).prev().find('.mw-headline').text();

		// Grab RFC date by looking for user signature timestamps
		var initDateMatches = ANRFC.getRFCDate(keyId);
		if ( ! initDateMatches ) {
			return OO.ui.alert( 'Unable to find a signature in this section. Unsure what date this RFC occurred. Aborting.' );
		}
		var initiatedDate = initDateMatches[0];

		// Get ready to write some WP:ANRFC wikicode
		var heading = "=== [[" + pageName + "#" + sectionTitle + "]] ===";
		var initiatedTemplate = "{{initiated|" + initiatedDate + "}}";
		var wikitextToWrite = heading + "\n" + initiatedTemplate + " " + message + " ~~~~";

		new mw.Api().get( {
			action: 'parse',
			page: "Wikipedia:Closure_requests",
			prop: 'wikitext'
		}).then(function(result) {
			var wikitext = result.parse.wikitext['*'];
			if (wikitext.replaceAll(' ', '_').match((pageName + "#" + sectionTitle).replaceAll(' ', '_')) != null) {
				return OO.ui.alert('This discussion is already listed.');
			}

			wikitext = ANRFC.makeWikitext(wikitext, wikitextToWrite, initiatedDate, targetSection);

			return new mw.Api().postWithEditToken( {
				action: 'edit',
				title: "Wikipedia:Closure_requests",
				text: wikitext,
				summary: 'Listing new discussion using [[User:Novem Linguae/Scripts/anrfc-lister.js|anrfc-lister]]',
				nocreate: true
			});
		}).then(function(result) {
			if ( result && result.edit && result.edit.result && result.edit.result === 'Success' ) {
				OO.ui.confirm( 'This discussion has been listed on WP:ANRFC. Would you like to see it?' ).then( function ( confirmed ) {
					if ( confirmed ) {
						var sectionPartOfUri = pageName + "#" + sectionTitle;
						sectionPartOfUri = sectionPartOfUri.replaceAll(' ', '_');
						sectionPartOfUri = encodeURI(sectionPartOfUri);
						window.open("/wiki/Wikipedia:Closure_requests#" + sectionPartOfUri, "_blank");
					}
				} );
			}
		});
	},
	isInitDateLatest(matchDate, initDate) {
		if (initDate.year > matchDate.year) {
			return true;
		} else if (initDate.year < matchDate.year) {
			return false;
		} else if (initDate.month > matchDate.month) {
			return true;
		} else if (initDate.month < matchDate.month) {
			return false;
		} else if (initDate.day > matchDate.day) {
			return true;
		} else if (initDate.day < matchDate.day) {
			return false;
		} else if (initDate.time.hh > matchDate.time.hh) {
			return true;
		} else if (initDate.time.hh < matchDate.time.hh) {
			return false;
		} else if (initDate.time.mm > matchDate.time.mm) {
			return true;
		} else if (initDate.time.mm < matchDate.time.mm) {
			return false;
		}
		return true;
	},
	makeWikitext: function(wikitext, wikitextToWrite, initiatedDate, targetSection) {
		var discussions = [
			'== Administrative discussions ==',
			'== Requests for comment ==',
			'== Deletion discussions ==',
			'== Other types of closing requests =='
		];

		var firstPart = wikitext.slice(0, wikitext.indexOf(discussions[targetSection]));
		wikitext = wikitext.slice(wikitext.indexOf(discussions[targetSection]));
		var isLastDiscussion = (targetSection == discussions.length - 1);
		var relventDiscussion = (isLastDiscussion) ? wikitext : wikitext.slice(0, wikitext.indexOf(discussions[targetSection + 1]));
		wikitext = (isLastDiscussion) ? '' : wikitext.slice(wikitext.indexOf(discussions[targetSection + 1]));

		var initMatches = relventDiscussion.match(/((i|I)nitiated\|[\d]{1,2}:[\d]{1,2},\s[\d]{1,2}\s[\w]+\s[\d]{4}\s\([\w]+\))/g);

		var initDateObj = ANRFC.dateToObj(initiatedDate);
		var matchIndex = (initMatches != null) ? initMatches.length - 1 : -1;
		if (initMatches != null) {
			for (; matchIndex >= 0; matchIndex--) {
				if (ANRFC.isInitDateLatest(ANRFC.dateToObj(initMatches[matchIndex]), initDateObj)) {
					break;
				}
			}
		}

		var left;
		if (matchIndex === -1) {
			left = relventDiscussion.slice(0, relventDiscussion.indexOf('==='));
			relventDiscussion = relventDiscussion.slice(relventDiscussion.indexOf('==='));
			relventDiscussion = left + wikitextToWrite + '\n\n' + relventDiscussion;
		} else {
			var afterDate = initMatches[matchIndex];

			left = relventDiscussion.slice(0, relventDiscussion.indexOf(afterDate));
			relventDiscussion = relventDiscussion.slice(relventDiscussion.indexOf(afterDate));
			left = left + relventDiscussion.slice(0, relventDiscussion.indexOf('==='));
			relventDiscussion = relventDiscussion.slice(relventDiscussion.indexOf('==='));

			relventDiscussion = left + wikitextToWrite + '\n\n' + relventDiscussion;
		}

		return (firstPart + relventDiscussion + wikitext);
	},
};

mw.loader.using(['oojs-ui-widgets', 'oojs-ui-windows', 'mediawiki.util'], function() {
	ANRFC.init();
});
// </nowiki>