// <nowiki>

/*
- Testing a powerful class called MOSOrderPositionFinder. Feed it an article's wikitext, and it finds the location of every section listed at [[MOS:ORDER]].
- This is useful because then you can use that position to insert something in that section, or check for the existence of that section.

- Test articles
	- https://en.wikipedia.org/w/index.php?title=California
	- https://en.wikipedia.org/w/index.php?title=Rohingya_genocide
*/

$(async function() {
	async function getWikicodeOfDiff(diffID) {
		if ( ! mw.config.get('wgCurRevisionId') ) return ''; // if page is deleted, return blank
		var wikicode = '';
		diffID = encodeURIComponent(diffID);
		await $.ajax({
			url: 'https://en.wikipedia.org/w/api.php?action=parse&oldid='+diffID+'&prop=wikitext&formatversion=2&format=json',
			success: function (result) {
				wikicode = result['parse']['wikitext'];
			},
			dataType: "json",
		});
		return wikicode;
	}
	
	function shouldRunOnThisPage(title) {
		// don't run when not viewing articles
		let action = mw.config.get('wgAction');
		if ( action != 'view' ) return false;
		
		// don't run when viewing diffs
		//let isDiff = mw.config.get('wgDiffNewId');
		//if ( isDiff ) return false;
		
		let isDeletedPage = ( ! mw.config.get('wgCurRevisionId') );
		if ( isDeletedPage ) return false;
		
		// Only run in mainspace or draftspace
		let namespace = mw.config.get('wgNamespaceNumber');
		let isMainspaceOrDraftspace = ( [0, 118].includes(namespace) );
		if ( ! isMainspaceOrDraftspace && title != 'User:Novem_Linguae/sandbox' ) return false;

		return true;
	}

	// Making this more complex than needed for this program. There are some other things I can use this for and I want to start developing it.
	class MOSOrderPositionFinder {
		constructor(wikitext, debug = false) {
			this.debug = debug;
			this.wikitext = wikitext;
			this._recalculate();
		}

		_recalculate() {
			this.sectionOrder = [
				'top',
				'shortDescription',
				'displayTitle',
				'hatnotes',
				'featured',
				'deletionAndProtection',
				'maintenanceTags',
				'engvar',
				'infoboxes',
				'languageScriptNeeded',
				'sidebars',
				'lead',
				'tableOfContents',
				'body',
				'worksOrPublications',
				'seeAlso',
				'notesAndReferences',
				'furtherReading',
				'externalLinks',
				'successionAndGeographyBoxes',
				'navboxes',
				'portalBar',
				'taxonBar',
				'authorityControl',
				'geographicalCoordinates',
				'defaultSort',
				'categories',
				'stubTemplates',
				'bottom',
			];

			this.sectionStartPositions = {
				top: 0,
				shortDescription: -1,
				displayTitle: -1,
				hatnotes: -1,
				featured: -1,
				deletionAndProtection: -1,
				maintenanceTags: -1,
				engvar: -1,
				infoboxes: -1,
				languageScriptNeeded: -1,
				sidebars: -1,
				lead: -1,
				tableOfContents: -1,
				body: -1,
				worksOrPublications: -1,
				seeAlso: -1,
				notesAndReferences: -1,
				furtherReading: -1,
				externalLinks: -1,
				successionAndGeographyBoxes: -1,
				navboxes: -1,
				portalBar: -1,
				taxonBar: -1,
				authorityControl: -1,
				geographicalCoordinates: -1,
				defaultSort: -1,
				categories: -1,
				stubTemplates: -1,
				bottom: this.wikitext.length,
			};

			// https://en.wikipedia.org/w/index.php?title=Special:WhatLinksHere/Template:Short_description&hidelinks=1&hidetrans=1
			this.sectionStartPositions.shortDescription = this._lookForTemplates(this.wikitext, [
				'Short description',
				'Shortdesc',
				'Shortdescription',
				'Short desc'
			]);

			this.sectionStartPositions.displayTitle = this._lookForTemplates(this.wikitext, [
				'DISPLAYTITLE',
				'Lowercase title',
				'Italic title'
			]);
			
			// https://en.wikipedia.org/wiki/Wikipedia:Hatnote
			this.sectionStartPositions.hatnotes = this._lookForTemplates(this.wikitext, [
				'About-distinguish',
				'About',
				'About other people',
				'Distinguish',
				'For',
				'For2',
				'Hatnote',
				'Other hurricanes',
				'Other people',
				'Other places',
				'Other ships',
				'Other uses of',
				'Other uses',
				'Other uses',
				'Redirect-distinguish',
				'Redirect-distinguish-text',
				'Redirect-distinguish2',
				'Redirect-multi',
				'Redirect',
				'Redirect2',
				'Self reference',
				'Similar names',
				'Technical reasons',
				'Malay name', // TODO: add more {{X name}} type templates.
			]);

			this.sectionStartPositions.featured = this._lookForTemplates(this.wikitext, [
				'Featured list',
				'Featured article',
				'Good article',
			]);

			// https://en.wikipedia.org/wiki/Wikipedia:Criteria_for_speedy_deletion
			// https://en.wikipedia.org/w/index.php?title=Special:WhatLinksHere/Template:Proposed_deletion&hidelinks=1&hidetrans=1
			this.sectionStartPositions.deletionAndProtection = this._lookForTemplates(this.wikitext, [
				'Db-a1', // CSD
				'Db-a10',
				'Db-a11',
				'Db-a2',
				'Db-a3',
				'Db-a5',
				'Db-a7',
				'Db-a9',
				'Db-afc',
				'Db-album',
				'Db-animal',
				'Db-attack',
				'Db-attackorg',
				'Db-author',
				'Db-badfairuse',
				'Db-badfiletype',
				'Db-band',
				'Db-banned',
				'db-blankdraft',
				'Db-blanked',
				'Db-c1',
				'db-catempty',
				'Db-club',
				'Db-contact',
				'Db-copypaste',
				'Db-copyvio',
				'Db-disambig',
				'Db-discog',
				'Db-empty',
				'Db-emptyportal',
				'Db-error',
				'Db-event',
				'Db-f1',
				'Db-f10',
				'Db-f2',
				'Db-f3',
				'Db-f5',
				'Db-f7',
				'Db-f8',
				'Db-f9',
				'Db-filecopyvio',
				'Db-foreign',
				'Db-fpcfail',
				'Db-g1',
				'Db-g10',
				'Db-g11',
				'Db-g12',
				'Db-g13',
				'Db-g14',
				'Db-g2',
				'Db-g3',
				'Db-g4',
				'Db-g5',
				'Db-g6',
				'Db-g7',
				'Db-g8',
				'Db-hoax',
				'Db-imagepage',
				'Db-inc',
				'Db-invented',
				'Db-madeup',
				'Db-move',
				'Db-moved',
				'Db-multiple',
				'Db-negublp',
				'Db-nocontent',
				'Db-nocontext',
				'Db-nofile',
				'Db-noncom',
				'Db-nonsense',
				'Db-notwebhost',
				'Db-nouser',
				'Db-p1',
				'Db-p2',
				'Db-person',
				'Db-personal attack',
				'Db-promo',
				'Db-r2',
				'Db-r3',
				'Db-r4',
				'Db-redircom',
				'Db-redirnone',
				'Db-redirtypo',
				'Db-rediruser',
				'Db-redundantfile',
				'Db-repost',
				'Db-same',
				'Db-self',
				'Db-song',
				'Db-spam',
				'Db-spamuser',
				'Db-subpage',
				'Db-talk',
				'Db-templatecat',
				'Db-test',
				'Db-transwiki',
				'Db-u1',
				'Db-u2',
				'Db-u5',
				'Db-userreq',
				'Db-vandalism',
				'Db-web',
				'Db-xfd',
				'Proposed deletion', // PROD
				'Prod',
				'Proposed delete',
				'Proposal to delete',
				'Propose deletion',
				'Draft-prod',
				'Article for deletion', // AFD
				'Pp', // page protection padlocks, includes {{Pp}} and {{Pp-*}}
			]);

			// Source: Twinkle
			this.sectionStartPositions.maintenanceTags = this._lookForTemplates(this.wikitext, [
				'Cleanup',
				'Cleanup rewrite',
				'Copy edit',
				'Close paraphrasing',
				'Copypaste',
				'External links',
				'Non-free',
				'Cleanup reorganize',
				'Lead missing',
				'Lead rewrite',
				'Lead too long',
				'Lead too short',
				'Sections',
				'Too many sections',
				'Very long',
				'All plot',
				'Fiction',
				'In-universe',
				'Long plot',
				'No plot',
				'Notability',
				'Advert',
				'Cleanup tense',
				'Essay-like',
				'Fanpov',
				'Like resume',
				'Manual',
				'Cleanup-PR',
				'Over-quotation',
				'Prose',
				'Technical',
				'Tone',
				'Confusing',
				'Incomprehensible',
				'Unfocused',
				'Context',
				'Expert needed',
				'Overly detailed',
				'Undue weight',
				'Current',
				'Update',
				'Autobiography',
				'COI',
				'Disputed',
				'Hoax',
				'Globalize',
				'Over-coverage',
				'Paid contributions',
				'Peacock',
				'POV',
				'Recentism',
				'Too few opinions',
				'Undisclosed paid',
				'Weasel',
				'BLP sources',
				'BLP unsourced',
				'More citations needed',
				'One source',
				'Original research',
				'Primary sources',
				'Self-published',
				'Sources exist',
				'Third-party',
				'Unreferenced',
				'Unreliable sources',
				'Not English',
				'Rough translation',
				'Expand language',
				'Dead end',
				'Orphan',
				'Overlinked',
				'Underlinked',
				'Citation style',
				'Cleanup bare URLs',
				'More footnotes',
				'No footnotes',
				'Improve categories',
				'Uncategorized',
				'History merge',
				'Merge',
				'Merge from',
				'Merge to',
				'GOCEinuse',
				'In use',
				'Under construction',
			]);

			// https://en.wikipedia.org/wiki/Template:Use_X_English
			this.sectionStartPositions.engvar = this._lookForTemplates(this.wikitext, [
				'Engvar', // engvar
				'EngvarA',
				'EngvarB',
				'Use American English',
				'Use Australian English',
				'Use Bangladeshi English',
				'Use British English',
				'Use Oxford spelling',
				'Use Canadian English',
				'Use Ghanaian English',
				'Use Hiberno-English',
				'Use Hong Kong English',
				'Use Indian English',
				'Use Jamaican English',
				'Use Kenyan English',
				'Use Liberian English',
				'Use New Zealand English',
				'Use Nigerian English',
				'Use Pakistani English',
				'Use Philippine English',
				'Use Singapore English',
				'Use South African English',
				'Use Trinidad and Tobago English',
				'Use dmy dates', // dates
				'Use mdy dates',
			]);

			this.sectionStartPositions.infoboxes = this._lookForTemplates(this.wikitext, [
				'Infobox',
				'Speciesbox',
				'Automatic taxobox',
				'Taxobox',
				'Subspeciesbox',
				'Infraspeciesbox',
				'Hybridbox',
				'Virusbox',
			]);

			// https://en.wikipedia.org/wiki/Category:Language_maintenance_templates
			this.sectionStartPositions.languageScriptNeeded = this._lookForTemplates(this.wikitext, [
				'Arabic script needed',
				'Armenian script needed',
				'Berber script needed',
				'Burmese script needed',
				'Cherokee script needed',
				'Chinese script needed',
				'Chinese script needed inline',
				'Contains special characters',
				'Devanagari script needed',
				'Egyptian hieroglyphic script needed',
				'EngvarB',
				'Ge\'ez script needed',
				'Georgian script needed',
				'Greek script needed',
				'Hebrew script needed',
				'IPA-ga notice',
				'Japanese script needed',
				'Khmer script needed',
				'Korean script needed',
				'Lao script needed',
				'Needchunom',
				'Needhanja',
				'Needhiragana',
				'Needkanji',
				'Needs IPA',
				'Nepali script needed',
				'Persian script needed',
				'Pronunciation needed',
				'Romanization needed',
				'Samoan script needed',
				'Syriac script needed',
				'Tamil script needed',
				'Thai script needed',
				'Tibetan script needed',
				'Tok Pisin script needed',
				'User language subcategory',
				'User programming subcategory',
				'Verify spelling',
				'Vietnamese script needed',
				'Yiddish script needed',
			]);

			// No reliable way to search for these. Some end in sidebar, many don't. Example of ones that don't: [[Rohingya genocide]] -> {{Rohingya conflict}}, {{Genocide}}.
			// TODO: Will need to return the position of any template between top and first sentence that isn't in one of the lists above.
			this.sectionStartPositions.sidebars = -1;

			// Return first text that isn't whitespace, a template, or inside a template. This is the article's first sentence.
			this.sectionStartPositions.lead = this._getFirstNonTemplateNonWhitespace(this.wikitext);

			// https://en.wikipedia.org/wiki/Help:Magic_words#Behavior_switches
			this.sectionStartPositions.tableOfContents = this._lookForStrings(this.wikitext, [
				'__TOC__',
			]);

			this.sectionStartPositions.body = this._lookForRegEx(this.wikitext, /(?<=\n)==/i);

			this.sectionStartPositions.worksOrPublications = this._lookForHeadings(this.wikitext, [
				'Works\\s*==',
				'Publications',
				'Discography',
				'Filmography',
			]);

			this.sectionStartPositions.seeAlso = this._lookForHeadings(this.wikitext, [
				'See also',
			]);

			this.sectionStartPositions.notesAndReferences = this._lookForHeadings(this.wikitext, [
				'Bibliography',
				'Citations',
				'Endnotes',
				'Footnotes',
				'Notes',
				'References',
				'Sources',
				'Works cited',
			]);

			this.sectionStartPositions.furtherReading = this._lookForHeadings(this.wikitext, [
				'Further reading',
			]);

			this.sectionStartPositions.externalLinks = this._lookForHeadings(this.wikitext, [
				'External links',
			]);

			// https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Succession_Box_Standardization/Templates
			// TODO: figure out what "geography boxes" are, add them
			this.sectionStartPositions.successionAndGeographyBoxes = this._lookForTemplates(this.wikitext, [
				'S-', // they all are of the format {{S-*}}
			]);

			// Hard to figure these out, unless they are contained in the {{Navbox}} wrapper
			// TODO: assume any templates in this area that aren't on other lists are navboxes
			// https://en.wikipedia.org/w/index.php?title=Special%3AWhatLinksHere&hidetrans=1&hidelinks=1&target=Template%3ANavbox&namespace=
			this.sectionStartPositions.navboxes = this._lookForTemplates(this.wikitext, [
				'Navbox',
				'Dynamic navigation box',
				'Navigation',
				'Hider hiding',
				'Horror navbox',
				'VG navigation',
				'CVG navigation',
				'TransNB',
				'Navtable',
			]);

			// https://en.wikipedia.org/w/index.php?title=Special:WhatLinksHere/Template:Portal_bar&hidetrans=1&hidelinks=1
			this.sectionStartPositions.portalBar = this._lookForTemplates(this.wikitext, [
				'Portal bar',
				'Prb',
			]);

			// https://en.wikipedia.org/w/index.php?title=Special%3AWhatLinksHere&hidetrans=1&hidelinks=1&target=Template%3ATaxonbar&namespace=
			this.sectionStartPositions.taxonBar = this._lookForTemplates(this.wikitext, [
				'Taxonbar',
				'Taxon-bar',
				'Taxobar',
				'TaxonIDs',
				'Taxon identifiers',
			]);

			// https://en.wikipedia.org/w/index.php?title=Special%3AWhatLinksHere&hidetrans=1&hidelinks=1&target=Template%3AAuthority+control&namespace=
			this.sectionStartPositions.authorityControl = this._lookForTemplates(this.wikitext, [
				'Authority control',
				'Normdaten',
				'Authoritycontrol',
				'External identifiers',
				'Autorité',
				'Control de autoridades',
				'전거 통제',
				'Normativna kontrola',
			]);

			// https://en.wikipedia.org/w/index.php?title=Special:WhatLinksHere/Template:Coord&hidetrans=1&hidelinks=1
			// https://en.wikipedia.org/w/index.php?title=Special:WhatLinksHere/Template:Coord_missing&hidetrans=1&hidelinks=1
			// using _findStringNotInsideTemplate because {{Coord}} inside infobox doesn't count
			this.sectionStartPositions.geographicalCoordinates =  this._findTemplateNotInsideTemplate(this.wikitext, [
				'Coord', // coord
				'Coor',
				'Location',
				'Geocoord',
				'Geobox coor',
				'Co-ord',
				'Coord missing', // coord missing
				'No geolocation',
				'Missing coord',
				'Coords missing',
				'Locate me',
				'Needs coordinates',
			]);

			// https://en.wikipedia.org/w/index.php?title=Special:WhatLinksHere/Template:DEFAULTSORT&hidetrans=1&hidelinks=1
			this.sectionStartPositions.defaultSort = this._lookForTemplates(this.wikitext, [
				'DEFAULTSORT',
				'Default sort',
				'SORTIERUNG',
			]);

			this.sectionStartPositions.categories = this._lookForRegEx(this.wikitext, /\[\[:?Category:/i);

			this.sectionStartPositions.stubTemplates = this._lookForRegEx(this.wikitext, /\{\{[^\}]*-stub\}\}/i);

			// If the body is the same position as any of the appendices, set body to -1, since there isn't really a body, just appendices.
			let appendices = [
				this.sectionStartPositions.worksOrPublications,
				this.sectionStartPositions.seeAlso,
				this.sectionStartPositions.notesAndReferences,
				this.sectionStartPositions.furtherReading,
				this.sectionStartPositions.externalLinks,
			];
			if ( this.sectionStartPositions.body !== -1 && appendices.includes(this.sectionStartPositions.body) ) {
				this.sectionStartPositions.body = -1;
			}

			if ( this.debug ) {
				for ( let section of this.sectionOrder ) {
					let position = this.sectionStartPositions[section];
					let chunkPreview = this.wikitext.slice(position, position + 50);
					console.log(`${section}: ${position}: ${chunkPreview}`);
				}
			}
		}

		_getFirstNonTemplateNonWhitespace(wikicode) {
			let length = wikicode.length;
			let nesting = 0;
			for ( let i = 0; i < length; i++ ) {
				let chunk = wikicode.slice(i);
				if ( chunk.startsWith('{{') ) {
					nesting++;
				} else if ( chunk.startsWith('}}') ) {
					nesting--;
					i++; // skip 2nd }
				} else if ( nesting === 0 && ! chunk.match(/^\s/) ) {
					return i;
				}
			}
			return -1;
		}

		_findTemplateNotInsideTemplate(wikicode, arrayOfStrings) {
			let length = wikicode.length;
			for ( let string of arrayOfStrings ) {
				let nesting = 0;
				for ( let i = 0; i < length; i++ ) {
					let chunk = wikicode.slice(i, i+20);
					let match = chunk.match(new RegExp('^\\{\\{' + string, 'i'));
					if ( nesting === 0 && match ) {
						return i;
					} else if ( chunk.startsWith('{{') ) {
						nesting++;
					} else if ( chunk.startsWith('}}') ) {
						nesting--;
						i++; // skip 2nd }
					}
				}
			}
			return -1;
		}

		/** Template names are not RegEx escaped. */
		_lookForTemplates(haystack, arrayOfTemplateNames) {
			let regExString = '\\{\\{(?:';
			for ( let name of arrayOfTemplateNames ) {
				// space or underscore, same thing
				name = name.replace('_', ' ');
				name = name.replace(' ', '[ _]');
				regExString += name + '|';
			}
			regExString = regExString.slice(0, -1); // delete last character |
			regExString += ')(?![ -\\|]section)'; // don't match section maintenance tags, e.g. {{More citations needed section}} and {{More citations needed|section}}
			let matches = haystack.match(new RegExp(regExString, 'i'));
			return matches ? matches.index : -1;
		}

		/** Heading names are not RegEx escaped. */
		_lookForHeadings(haystack, arrayOfHeadingNames) {
			let regExString = '={2,}\\s*(?:';
			for ( let name of arrayOfHeadingNames ) {
				regExString += name + '|';
			}
			regExString = regExString.slice(0, -1); // delete last character |
			regExString += ')';
			let matches = haystack.match(new RegExp(regExString, 'i'));
			return matches ? matches.index : -1;
		}

		_lookForStrings(haystack, arrayOfRegExStrings) {
			let regExString = '(?:';
			for ( let name of arrayOfRegExStrings ) {
				regExString += name + '|';
			}
			regExString = regExString.slice(0, -1); // delete last character |
			regExString += ')';
			let matches = haystack.match(new RegExp(regExString, 'i'));
			return matches ? matches.index : -1;
		}

		_lookForRegEx(haystack, regEx) {
			let matches = haystack.match(regEx);
			return matches ? matches.index : -1;
		}

		hasSection(section) {
			return this.sectionStartPositions[section] !== -1;
		}

		/** @return {int} sectionPosition: -1 if no section, integer if section */
		getSectionPosition(section) {
			let position = this.sectionStartPositions[section];
			if ( position === -1 ) {
				position = this._getPositionOfClosestSection(section);
			}
			return position;
		}

		getWikicode() {
			return this.wikitext;
		}

		/** If section is absent, we will guess where the section should go. Do not add whitespace, we will figure it out for you. */
		insertAtSection(needle, section) {
			let position = this.sectionStartPositions[section];
			if ( position === -1 ) {
				position = this._getPositionOfClosestSection(section);
			}

			let topHalf = this.wikitext.slice(0, position);
			let bottomHalf = this.wikitext.slice(position);

			if ( topHalf.endsWith('\n') && ! topHalf.endsWith('\n\n') ) {
				topHalf += '\n';
			} else {
				topHalf += '\n\n';
			}

			if ( ! bottomHalf.startsWith('\n') ) {
				bottomHalf = '\n' + bottomHalf;
			}

			this.wikitext = topHalf + needle + bottomHalf;
			this.wikitext = this.wikitext.trim();
			this._recalculate();
			return this.wikitext;
		}

		// https://stackoverflow.com/a/13109786/3480193
		_arraySearch(arr, val) {
			for ( var i = 0; i < arr.length; i++ ) {
				if ( arr[i] === val ) {
					return i;
				}
			}
			return false;
		}

		_getPositionOfClosestSection(section) {
			let sectionKey = this._arraySearch(this.sectionOrder, section);

			// scan until you find a section that is not -1
			// can scan in either direction. I chose to scan down.
			for ( let i = sectionKey; i < this.sectionOrder.length; i++ ) {
				let sectionKey2 = this.sectionOrder[i];
				let sectionPosition = this.sectionStartPositions[sectionKey2];
				if ( sectionPosition !== -1 ) {
					return sectionPosition;
				}
			}
		}
	}

	let title = mw.config.get('wgPageName'); // includes namespace, underscores instead of spaces
	if ( ! shouldRunOnThisPage(title) ) return;

	let diffID = mw.config.get('wgRevisionId');
	let wikicode = await getWikicodeOfDiff(diffID);

	let pf = new MOSOrderPositionFinder(wikicode, true);
});

// </nowiki>