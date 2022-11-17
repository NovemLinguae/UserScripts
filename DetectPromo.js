// <nowiki>

/*
- Let reviewer know when certain promotional and POV keywords are detected.
- Displays an orange bar at the top of the article, listing the detected keywords.
*/

$(async function() {
	async function getWikicode(title) {
		if ( ! mw.config.get('wgCurRevisionId') ) return ''; // if page is deleted, return blank
		var wikicode = '';
		title = encodeURIComponent(title);
		await $.ajax({
			url: 'https://en.wikipedia.org/w/api.php?action=parse&page='+title+'&prop=wikitext&formatversion=2&format=json',
			success: function (result) {
				wikicode = result['parse']['wikitext'];
			},
			dataType: "json",
			async: false
		});
		return wikicode;
	}
	
	function eliminateDuplicates(array) {
		return uniq = [...new Set(array)];
	}
	
	/** returns the pagename, including the namespace name, but with spaces replaced by underscores */
	function getArticleName() {
		return mw.config.get('wgPageName');
	}
	
	function hasDiacritics(str) {
		let str2 = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		return str != str2;
	}
	
	function normalizeDiacritics(str) {
		return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	}
	
	function cloneArray(arr) {
		return JSON.parse(JSON.stringify(arr));
	}
	
	function empty(arr) {
		if ( arr === undefined ) return true;
		if ( arr.length == 0 ) return true;
		return false;
	}

	function escapeRegEx(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}
	
	// don't run when not viewing articles
	let action = mw.config.get('wgAction');
	if ( action != 'view' ) return;
	
	// don't run when viewing diffs
	let isDiff = mw.config.get('wgDiffNewId');
	if ( isDiff ) return;
	
	let isDeletedPage = ( ! mw.config.get('wgCurRevisionId') );
	if ( isDeletedPage ) return;
	
	// Only run in mainspace and draftspace
	let namespace = mw.config.get('wgNamespaceNumber');
	let title = getArticleName();
	if ( ! [0, 118].includes(namespace) && title != 'User:Novem_Linguae/sandbox' ) return;
	
	let wordString = `

// An impressive amount of promo in this draft: https://en.wikipedia.org/w/index.php?title=Draft:Imre_Van_opstal&oldid=1060259849

% growth
6-figure
7-figure
8-figure
9-figure
a record
around the world
best available
bestselling
comprehensive
countless hours
create a revolution
critical acclaim
disrupt
drastically
elevate
excelled
expert
expertise
extensive
famous
fast growing
fast-growing
fastest-growing
fastest growing
growing popularity
highlights
highly praised
historic
honored with
hypnotic
impressive
inexhaustible
influential
innovation
innovative
leverag
massive
mastermind
more than
most highly
most important
most impressive
mystical
organically
outstanding
perfect
pioneer
prestigious
prominent
promulgator
ranked
renowned
reinvent
rising star
sensual
several offers
striking
transcend
transform
very first
wide selection
widely used
worldwide
B2B
B2C
inspired by
ventured into
globally
integrate
evangelist
legendary
zero to hero
are a necessity
philanthropist
entrepreneur
dynamic
engaging
save millions
pioneering
world-class
world class
respected
numerous
noteworthy
promising
signature
leading
underpin
exemplify
exemplified
fully integrated
fully-integrated
highly specialized
award-winning
leader in
leading
prominence
eminent
most notable
super famous

	`;
	
	wordString = wordString.replace(/^\/\/.*$/gm, ''); // replace comment lines with blank lines. using this approach fixes a bug involving // and comma on the same line
	let wordArray = wordString.replace(/, /g, "\n")
		.trim()
		.split("\n")
		.map(v => v.trim(v))
		.filter(v => v != '')
		.filter(v => ! v.startsWith('//'));
	wordArray = eliminateDuplicates(wordArray);
	
	// convert from 1 level array with just text, to 2 level array with text and regex
	let wordObject = [];
	for ( let key in wordArray ) {
		wordObject.push({
			'text': wordArray[key],
			'regex': escapeRegEx(wordArray[key])
		});
	}
	
	let wikicode = await getWikicode(title);
	
	// eliminate [[ ]], so that phrases with wikilink syntax in the middle don't mess up our search
	wikicode = wikicode.replace(/\[\[/g, '')
		.replace(/\]\]/g, '');
	
	let searchResults = [];
	for ( let word of wordObject ) {
		// can't use \b here because \)\b doesn't work correctly. using lookarounds instead
		let regEx = new RegExp('(?<!\\w)' + word['regex'] + '(?!\\w)', "i");
		if ( wikicode.match(regEx) ) {
			searchResults.push(word['text']);
		}
	}
	
	let MAX_DISPLAYED_RESULTS = 20;
	if ( searchResults.length > MAX_DISPLAYED_RESULTS ) {
		searchResults = searchResults.slice(0, MAX_DISPLAYED_RESULTS);
		searchResults.push('...... and more.');
	}
	
	if ( ! empty(searchResults) ) {
		let html = searchResults.join(', ');
		html = '<div id="DetectPromo" style="background-color: orange"><span style="font-weight: bold;">Promotional words:</span> ' + html + '</div>';
		
		$('#contentSub').before(html);
	}
});

// </nowiki>