/*

Forked from https://en.wikipedia.org/wiki/User:Ajbura/anrfc-lister.js. A big thanks to the original author, Ajbura.

HOW TO USE:
- go to a talk page
- click More -> ANRFC Lister
- there will now be "List on ANRFC" links next to each section. click one
- fill out the form
- press "Submit"
- the script will add a listing to WP:ANRFC for you :)

TODO:
- No signature causes it to hang forever.
- Change "init" to use mw.util.addPortletLink() (and make corresponding change to mw.loader.using at the bottom, and corresponding changes to toggle), so that the portlet link text isn't weird looking and gigantic.
- Add a "Cancel"/"Close" button that nukes the current form. There is already code for this if you click "List on ANRFC" again.
- It won't let you list two RFCs on the same page. Should be able to do so. Change the duplicate check to check the section title instead of the page title.
- Change .done() to .then()
- Sometimes closes the wrong section. (Old bug. Test and see if I can reproduce.)
- seems to use a vector class to do its targeting. probably doesn't work on other skins. get working on other skins
- verify that it inserts in the right spot based on date. so for example if WP:ANRFC has two listings in a section that are Jan 1 and Jan 31, and this RFC is Jan 15, it should insert in the middle
- add unit tests for stuff like the above bullet

- Notify original author
- Send user talk messages to all users of the old script, letting them know about this updated one.
- Update [[WP:US/L]]. Remove the old one completely, it is too buggy. Replace with this one.
- Post on [[WT:ANRFC]] talk page.

BUGS FIXED:
- Linted code. Added comments. Refactored.
- Works on testwiki now (gives a local WP:ANRFC link instead of an enwiki WP:ANRFC link).
- Fixed bug where the script was always in an endless loop
- Fixed bug where the RFC would always get placed at the end of the page, not in its proper section
- Fixed bug where section heading was not getting added to WP:ANRFC

*/

/* global OO */

// <nowiki>
var ANRFC = {
	init: function() {
		$("#p-cactions ul.vector-menu-content-list").append("<li id='ca-anrfc' style='color: unset' onclick='ANRFC.toggle();'><a>ANRFC lister</a></li>");
	},
	dateToObj(dateString) {
		var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		var oDate = dateString.split(/, | /);
		oDate[0] = oDate[0].match(/[\d]{1,2}:[\d]{1,2}/)[0];
		var time = {
			hh: oDate[0].match(/([\d]{1,2}):/)[1],
			mm: oDate[0].match(/:([\d]{1,2})/)[1]
		};
		var date = {
			time: time,
			day: parseInt(oDate[1]),
			month: months.indexOf(oDate[2]),
			year: parseInt(oDate[3])
		};
		return date;
	},
	isInitDateLatest(matchDate, initDate) {
		if (initDate.year > matchDate.year) {
			return true;
		}
		if (initDate.year < matchDate.year) {
			return false;
		}
		if (initDate.month > matchDate.month) {
			return true;
		}
		if (initDate.month < matchDate.month) {
			return false;
		}
		if (initDate.day > matchDate.day) {
			return true;
		}
		if (initDate.day < matchDate.day) {
			return false;
		}
		if (initDate.time.hh > matchDate.time.hh) {
			return true;
		}
		if (initDate.time.hh < matchDate.time.hh) {
			return false;
		}
		if (initDate.time.mm > matchDate.time.mm) {
			return true;
		}
		if (initDate.time.mm < matchDate.time.mm) {
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
		var pageName = mw.config.get('wgPageName');

		// Grab section title
		var sectionTitle = $('#' + keyId).prev().find('.mw-headline').text();

		// Grab initiated date (the first signature in the section will have the initiated date)
		var initDateRegx = /([\d]{1,2}:[\d]{1,2},\s[\d]{1,2}\s[\w]+\s[\d]{4}\s\([\w]+\))/;
		var initDateMatches = null;
		var nextEl = $('#' + keyId); // #0-anrfcBox
		// TODO: Only check elements between anrfcBox and the next section heading (or end of page). Right now it checks the entire page until it runs out of .next() elements.
		do {
			if (nextEl.next().hasClass('boilerplate')) {
				nextEl = nextEl.next().children('p');
			} else {
				nextEl = nextEl.next();
			}

			initDateMatches = nextEl.text().match(initDateRegx);
		} while ( ! initDateMatches && nextEl );
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
						window.open("/wiki/Wikipedia:Closure_requests", "_blank");
					}
				} );
			}
		});
	},
	addForm: function(el) {
		var keyId = el.getAttribute('indexKey') + "-anrfcBox";
		if (document.getElementById(keyId) != null) {
			return document.getElementById(keyId).remove();
		}
		$(el).parent().parent().after('<div id="' + keyId + '"></div>');
		$('#' + keyId).css({
			'margin': '16px 0',
			'padding': '16px',
			'background-color': '#f3f3f3',
			'border': '1px solid grey'
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
				'primary',
				'progressive'
			]
		});

		$('#' + keyId).append('<h3 style="margin: 0 0 16px;">List this discussion on <a href="/wiki/Wikipedia:Closure_requests" target="_blank">Wikipedia:Closure requests</a></h3>');
		var wrapper = document.createElement('div');
		$(wrapper).append('<p>Under section: </p>');
		$(wrapper).append(dropDown.$element);
		$('#' + keyId).append(wrapper);

		wrapper = document.createElement('div');
		$(wrapper).css({ 'margin-top': '8px' });
		$(wrapper).append(messageInput.$element);
		$(wrapper).append($(submitButton.$element).css({
			'margin-top': '8px',
		}));
		$('#' + keyId).append(wrapper);

		submitButton.on('click', function() {
			ANRFC.onSubmit(dropDown, messageInput, keyId);
		} );

	},
	addLabels: function () {
		$('span.mw-editsection').each(function(index) {
			$(this.parentElement).append("<a indexKey=" + index + " class='mw-ANRFC' onclick='ANRFC.addForm(this)'>List on ANRFC</a>");
			$('a.mw-ANRFC').css({ "margin-left": "8px", "font-size": "small", "font-family": "sans-serif" });
		});
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
	toggle: function () {
		if ($("#ca-anrfc a").css('color') == 'rgb(255, 0, 0)') {
			$("#ca-anrfc a").css('color', '');
			ANRFC.removeLabels();
		} else {
			$("#ca-anrfc a").css('color', 'red');
			ANRFC.addLabels();
		}
	},
};

mw.loader.using(['oojs-ui-widgets', 'oojs-ui-windows'], function() {
	ANRFC.init();
});
// </nowiki>