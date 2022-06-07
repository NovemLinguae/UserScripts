// <nowiki>

// See also: https://en.wikipedia.org/wiki/User:Novem_Linguae/Work_instructions/GAN

$(async function() {
	// Non-pure functions ===================================

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

	// https://en.wikipedia.org/w/api.php?action=edit&format=json&title=User%3ANovem%20Linguae%2Fsandbox2&text=Test!&summary=Testing%20script&token=77ad2e923fb2bb511466fdd33f71df8d629fb7b1%2B%5C
	async function makeEdit(title, editSummary, wikicode) {
		let api = new mw.Api();
		let params = {
			"action": "edit",
			"format": "json",
			"title": title,
			"text": wikicode,
			"summary": editSummary,
		};
		let response = await api.postWithToken('csrf', params);
		console.log(response);

		/*
		let api = new mw.Api();
		let response = await api.post( {
			"action": "edit",
			"format": "json",
			"title": title,
			"text": wikicode,
			"summary": editSummary,
			"token": mw.user.tokens.get('csrfToken'),
		} );
		console.log(response);
		*/
	}

	function shouldRunOnThisPage(title) {
		// don't run when not viewing articles
		let action = mw.config.get('wgAction');
		if ( action != 'view' ) return false;
		
		// don't run when viewing diffs
		let isDiff = mw.config.get('wgDiffNewId');
		if ( isDiff ) return false;
		
		let isDeletedPage = ( ! mw.config.get('wgCurRevisionId') );
		if ( isDeletedPage ) return false;

		// always run in Novem's sandbox
		if ( title === 'User:Novem_Linguae/sandbox' ) return true;
		
		// only run in talk namespace
		let namespace = mw.config.get('wgNamespaceNumber');
		let isTalkNamespace = ( namespace === 1 );
		if ( ! isTalkNamespace ) return false;

		// only run on pages that end in /GA##
		if ( ! isGASubPage(title) ) return false;

		return true;
	}

	// Main ============================================

	let title = mw.config.get('wgPageName'); // includes namespace, underscores instead of spaces
	if ( ! shouldRunOnThisPage(title) ) return;

	// only run if this review hasn't already been closed. check for {{atopg}}
	let reviewWikicode = await getWikicode(title);
	if ( reviewWikicode.match(/\{\{atopg/i) ) return;

	// only run if talk page has {{GA nominee}}
	let gaTitle = getGATitle(title);
	let gaTalkTitle = getGATalkTitle(gaTitle);
	let talkWikicode = await getWikicode(gaTalkTitle);
	if ( title !== 'User:Novem_Linguae/sandbox' && ! talkWikicode.match(/\{\{GA nominee/i) ) return;

	// display HTML form
	$('#contentSub2').prepend(
`
<style>
	#GANReviewTool {
		border: 1px solid black;
		padding: 1em;
	}

	#GANReviewTool h2 {
		margin-top: 0;
	}

	#GANReviewTool strong {
		text-decoration: underline;
	}

	#GANReviewTool code {
		/* font-family: monospace; */
	}

	#GANReviewTool input[type="text"] {
		width: 50em;
	}

	#GANReviewTool p {
		margin-top: 1.5em;
		margin-bottom: 1.5em;
	}

	#GANReviewTool option:disabled {
		font-weight: bold;
		color: green;
	}

	#GANReviewTool-ProcessingMessage {
		display: none;
	}
</style>

<div id="GANReviewTool">
	<div id="GANReviewTool-Form">
		<h2>
			GAN Review Tool
		</h2>

		<p>
			<strong>Pass or fail?</strong><br />
			<input type="radio" name="GANReviewTool-PassOrFail" value="pass" checked /> Pass
			<input type="radio" name="GANReviewTool-PassOrFail" value="fail" /> Fail
		</p>

		<!-- if pass -->
		<div id="GANReviewTool-PassDiv">
			<p>
				<strong>Topic, subtopic, and sub-subtopic:</strong><br />
				<select>
					<option disabled>==Agriculture, food, and drink==</option>
					<option disabled>===Agriculture, food, and drink===</option>
					<option>=====Agriculture and farming=====</option>
					<option>=====Horticulture and forestry=====</option>
					<option>=====Food and drink establishments=====</option>
					<option>=====Cuisines=====</option>
					<option>=====Food=====</option>
					<option>=====Drink=====</option>
					<option>=====Food and drink companies=====</option>
					<option>=====Food and drink people=====</option>
					<option>=====Cookery books=====</option>
					<option>=====Miscellaneous=====</option>

					<option disabled>==Art and architecture==</option>
					<option disabled>===Art===</option>
					<option>=====Art=====</option>
					<option>=====Artists and art organizations=====</option>
					<option disabled>===Architecture===</option>
					<option>=====Architecture=====</option>
					<option>=====Architecture – Bridges and tunnels=====</option>
					<option>=====Architecture – Buildings=====</option>
					<option>=====Architecture – Forts and fortifications=====</option>
					<option>=====Architecture – Hotels and inns=====</option>
					<option>=====Architecture – Houses and residences=====</option>
					<option>=====Architecture – Lighthouses=====</option>
					<option>=====Architecture – Memorials and monuments=====</option>
					<option>=====Architecture – Museums and galleries=====</option>
					<option>=====Architecture – Religious=====</option>
					<option>=====Architects=====</option>

					<option disabled>==Engineering and technology==</option>
					<option disabled>===Computing and engineering===</option>
					<option>=====Computer-related organizations and people=====</option>
					<option>=====Cryptography=====</option>
					<option>=====Engineers and inventors=====</option>
					<option>=====Engineering technology=====</option>
					<option>=====Engineering failures and disasters=====</option>
					<option>=====Hardware, standards and protocols=====</option>
					<option>=====Power and water infrastructure=====</option>
					<option>=====Programming=====</option>
					<option>=====Software=====</option>
					<option>=====Websites and the Internet=====</option>
					<option disabled>===Transport===</option>
					<option>=====Air transport=====</option>
					<option>=====Maritime transport=====</option>
					<option>=====Rail transport=====</option>
					<option>=====Rail bridges, tunnels, and stations=====</option>
					<option>=====Trains and locomotives=====</option>
					<option>=====Road infrastructure: Canada=====</option>
					<option>=====Road infrastructure: United States=====</option>
					<option>=====Road infrastructure: Northeastern United States=====</option>
					<option>=====Road infrastructure: Southern United States=====</option>
					<option>=====Road infrastructure: Midwestern United States=====</option>
					<option>=====Road infrastructure: Western United States=====</option>
					<option>=====Road infrastructure: Other=====</option>
					<option>=====Road transportation: Buses, vans, and paratransit=====</option>
					<option>=====Road transportation: Cars and motorcycles=====</option>
					<option>=====Road transportation: Other=====</option>
					<option>=====Transport by region=====</option>

					<option disabled>==Geography and places==</option>
					<option disabled>===Geography===</option>
					<option>=====Bodies of water and water formations=====</option>
					<option>=====Geographers and explorers=====</option>
					<option>=====General and human geography=====</option>
					<option>=====Islands=====</option>
					<option>=====Landforms=====</option>
					<option>=====National and state parks, nature reserves, conservation areas, and countryside routes=====</option>
					<option>=====Urban and historical sites=====</option>
					<option>=====Geography miscellanea=====</option>
					<option disabled>===Places===</option>
					<option>=====Countries=====</option>
					<option>=====Africa=====</option>
					<option>=====Antarctica=====</option>
					<option>=====Asia=====</option>
					<option>=====Australia and the Pacific=====</option>
					<option>=====Europe=====</option>
					<option>=====Middle East=====</option>
					<option>=====North America=====</option>
					<option>=====South America=====</option>

					<option disabled>==History==</option>
					<option disabled>===World history===</option>
					<option>=====Archaeology and archaeologists=====</option>
					<option>=====Historians, chroniclers and history books=====</option>
					<option>=====Historical figures: heads of state and heads of government=====</option>
					<option>=====Historical figures: politicians=====</option>
					<option>=====Historical figures: other=====</option>
					<option>=====African history=====</option>
					<option>=====North American history=====</option>
					<option>=====South American history=====</option>
					<option>=====Asian history=====</option>
					<option>=====Australian and Oceania history=====</option>
					<option>=====European history=====</option>
					<option>=====Middle Eastern history=====</option>
					<option>=====Global history=====</option>
					<option disabled>===Royalty, nobility, and heraldry===</option>
					<option>=====Flags and heraldry=====</option>
					<option>=====Monarchs=====</option>
					<option>=====Royalty and nobility=====</option>

					<option disabled>==Language and literature==</option>
					<option disabled>===Language and literature===</option>
					<option>=====Alphabets and transliteration=====</option>
					<option>=====Ancient texts=====</option>
					<option>=====Biographies, autobiographies, essays, diaries, and travelogues=====</option>
					<option>=====Characters and fictional items=====</option>
					<option>=====Children's books, fairy tales, and nursery rhymes=====</option>
					<option>=====Comics=====</option>
					<option>=====Genres and literary theory=====</option>
					<option>=====Languages=====</option>
					<option>=====Linguists and philologists=====</option>
					<option>=====Non-fiction=====</option>
					<option>=====Novels=====</option>
					<option>=====Plays=====</option>
					<option>=====Poetry=====</option>
					<option>=====Short fiction and anthologies=====</option>
					<option>=====Words and linguistics=====</option>
					<option>=====Writers, publishers, and critics=====</option>

					<option disabled>==Mathematics==</option>
					<option disabled>===Mathematics and mathematicians===</option>
					<option>=====Mathematical concepts and topics=====</option>
					<option>=====Mathematical texts and artifacts=====</option>
					<option>=====Mathematicians=====</option>

					<option disabled>==Media and drama==</option>
					<option disabled>===Film===</option>
					<option>=====Cinema=====</option>
					<option>=====Film franchises, overview articles and production articles=====</option>
					<option>=====Pre-1910s films=====</option>
					<option>=====1910s films=====</option>
					<option>=====1920s films=====</option>
					<option>=====1930s films=====</option>
					<option>=====1940s films=====</option>
					<option>=====1950s films=====</option>
					<option>=====1960s films=====</option>
					<option>=====1970s films=====</option>
					<option>=====1980s films=====</option>
					<option>=====1990s films=====</option>
					<option>=====2000 to 2004 films=====</option>
					<option>=====2005 to 2009 films=====</option>
					<option>=====2010 to 2014 films=====</option>
					<option>=====2015 to 2019 films=====</option>
					<option>=====2020 to 2024 films=====</option>
					<option disabled>===Television===</option>
					<option>=====Television networks and overview articles=====</option>
					<option>====Television series====</option>
					<option>=====''30 Rock''=====</option>
					<option>=====''Ackley Bridge''=====</option>
					<option>=====''Adventure Time''=====</option>
					<option>=====''American Dad!''=====</option>
					<option>=====''American Horror Story''=====</option>
					<option>=====''Archer''=====</option>
					<option>=====Arrowverse=====</option>
					<option>=====Avatarverse=====</option>
					<option>=====''Awake''=====</option>
					<option>=====''Battlestar Galactica''=====</option>
					<option>=====''Better Call Saul''=====</option>
					<option>=====''The Big Bang Theory''=====</option>
					<option>=====''Black Mirror''=====</option>
					<option>=====''Body of Proof''=====</option>
					<option>=====''BoJack Horseman''=====</option>
					<option>=====''Breaking Bad''=====</option>
					<option>=====''Buffy the Vampire Slayer''=====</option>
					<option>=====''Casualty''=====</option>
					<option>=====''Cheers''=====</option>
					<option>=====''Chuck''=====</option>
					<option>=====''Cold Feet''=====</option>
					<option>=====''Community''=====</option>
					<option>=====''Coronation Street''=====</option>
					<option>=====''Daredevil''=====</option>
					<option>=====''Desperate Housewives''=====</option>
					<option>=====''Dexter''=====</option>
					<option>=====''Doctor Who'' series=====</option>
					<option>=====''Doctor Who'' episodes=====</option>
					<option>=====''Doctors''=====</option>
					<option>=====''EastEnders''=====</option>
					<option>=====''Ed, Edd n Eddy''=====</option>
					<option>=====''Emmerdale''=====</option>
					<option>=====''Family Guy''=====</option>
					<option>=====''Friends''=====</option>
					<option>=====''Fringe'' series=====</option>
					<option>=====''Fringe'' episodes=====</option>
					<option>=====''Futurama''=====</option>
					<option>=====''Game of Thrones''=====</option>
					<option>=====''Glee'' series=====</option>
					<option>=====''Glee'' episodes=====</option>
					<option>=====''The Good Place''=====</option>
					<option>=====''Gossip Girl''=====</option>
					<option>=====''Grey's Anatomy'' series=====</option>
					<option>=====''Grey's Anatomy'' episodes=====</option>
					<option>=====''Hawaii Five-0 (2010 TV series)''=====</option>
					<option>=====''The Hills''=====</option>
					<option>=====''Home and Away''=====</option>
					<option>=====''Holby City''=====</option>
					<option>=====''Hollyoaks''=====</option>
					<option>=====''Homicide: Life on the Street''=====</option>
					<option>=====''House''=====</option>
					<option>=====''House of Cards''=====</option>
					<option>=====''The House of Flowers''=====</option>
					<option>=====''Inside No. 9''=====</option>
					<option>=====''Last Week Tonight with John Oliver''=====</option>
					<option>=====''Law & Order: Special Victims Unit''=====</option>
					<option>=====''Lost'' series=====</option>
					<option>=====''Lost'' episodes=====</option>
					<option>=====''Mad Men''=====</option>
					<option>=====''Magnum P.I.''=====</option>
					<option>=====Marvel Cinematic Universe=====</option>
					<option>=====''Millennium''=====</option>
					<option>=====''Modern Family''=====</option>
					<option>=====''Monk''=====</option>
					<option>=====''My Little Pony: Friendship Is Magic''=====</option>
					<option>=====''Neighbours''=====</option>
					<option>=====''Neon Genesis Evangelion''=====</option>
					<option>=====''The Office'' series=====</option>
					<option>=====''The Office'' episodes=====</option>
					<option>=====''Once Upon a Time''=====</option>
					<option>=====''Parks and Recreation''=====</option>
					<option>=====''Phineas and Ferb''=====</option>
					<option>=====''Psych''=====</option>
					<option>=====''Rugrats''=====</option>
					<option>=====''Sanctuary''=====</option>
					<option>=====''Seinfeld''=====</option>
					<option>=====''Sesame Street'' series and co-productions=====</option>
					<option>=====''The Simpsons'' series=====</option>
					<option>=====''The Simpsons'' episodes=====</option>
					<option>=====''Skins''=====</option>
					<option>=====''Smallville''=====</option>
					<option>=====''South Park'' series=====</option>
					<option>=====''South Park'' episodes=====</option>
					<option>=====''The Spectacular Spider-Man''=====</option>
					<option>=====''SpongeBob SquarePants''=====</option>
					<option>=====''Spooks''=====</option>
					<option>=====''Stargate''=====</option>
					<option>=====''Star Trek'' series=====</option>
					<option>=====''Star Trek'' series episodes=====</option>
					<option>=====''Supernatural''=====</option>
					<option>=====''Thunderbirds''=====</option>
					<option>=====''Torchwood''=====</option>
					<option>=====''Twin Peaks''=====</option>
					<option>=====''Ugly Americans''=====</option>
					<option>=====''Veronica Mars''=====</option>
					<option>=====''The Walking Dead''=====</option>
					<option>=====''WandaVision''=====</option>
					<option>=====''The West Wing''=====</option>
					<option>=====''White Collar''=====</option>
					<option>=====''Will & Grace''=====</option>
					<option>=====''The X-Files'' series=====</option>
					<option>=====''The X-Files'' episodes=====</option>
					<option>=====Other television series, 1950s debuts=====</option>
					<option>=====Other television series, 1960s debuts=====</option>
					<option>=====Other television series, 1970s debuts=====</option>
					<option>=====Other television series, 1980s debuts=====</option>
					<option>=====Other television series, 1990s debuts=====</option>
					<option>=====Other television series, 2000s debuts=====</option>
					<option>=====Other television series, 2010s debuts=====</option>
					<option>=====Other television series, 2020s debuts=====</option>
					<option>=====Other television seasons and related articles=====</option>
					<option>=====Other episodes and specials=====</option>
					<option disabled>===Media and drama===</option>
					<option>=====Actors, directors, models, performers, and celebrities=====</option>
					<option>=====Animation=====</option>
					<option>=====Fictional characters and technologies=====</option>
					<option>=====Radio=====</option>
					<option>=====Theatre, musical theatre, dance, and opera=====</option>

					<option disabled>==Music==</option>
					<option disabled>===Albums===</option>
					<option>=====1950 to 1969 albums=====</option>
					<option>=====1970 to 1979 albums=====</option>
					<option>=====1980 to 1989 albums=====</option>
					<option>=====1990 to 1994 albums=====</option>
					<option>=====1995 to 1999 albums=====</option>
					<option>=====2000 to 2004 albums=====</option>
					<option>=====2005 to 2009 albums=====</option>
					<option>=====2010 to 2014 albums=====</option>
					<option>=====2015 to 2019 albums=====</option>
					<option>=====2020 to 2024 albums=====</option>
					<option>=====Soundtracks=====</option>
					<option>=====Video albums=====</option>
					<option disabled>===Classical compositions===</option>
					<option>=====Classical compositions=====</option>
					<option disabled>===Songs===</option>
					<option>=====Pre-1900 songs=====</option>
					<option>=====1900 to 1959 songs=====</option>
					<option>=====1960 to 1969 songs=====</option>
					<option>=====1970 to 1979 songs=====</option>
					<option>=====1980 to 1989 songs=====</option>
					<option>=====1990 to 1999 songs=====</option>
					<option>=====2000 to 2004 songs=====</option>
					<option>=====2005 to 2006 songs=====</option>
					<option>=====2007 to 2008 songs=====</option>
					<option>=====2009 songs=====</option>
					<option>=====2010 songs=====</option>
					<option>=====2011 songs=====</option>
					<option>=====2012 songs=====</option>
					<option>=====2013 songs=====</option>
					<option>=====2014 songs=====</option>
					<option>=====2015 songs=====</option>
					<option>=====2016 songs=====</option>
					<option>=====2017 songs=====</option>
					<option>=====2018 songs=====</option>
					<option>=====2019 songs=====</option>
					<option>=====2020 songs=====</option>
					<option>=====2021 songs=====</option>
					<option>=====2022 songs=====</option>
					<option disabled>===Other music articles===</option>
					<option>=====Music awards=====</option>
					<option>=====Music by nation, people, region, or country=====</option>
					<option>=====Music genres, music styles, music eras=====</option>
					<option>=====Musical theory, musical instruments, and music techniques=====</option>
					<option>=====Music businesses and events=====</option>
					<option>=====Performers, groups, composers, and other music-related people=====</option>

					<option disabled>==Natural sciences==</option>
					<option disabled>===Biology and medicine===</option>
					<option>====Biology====</option>
					<option>=====Anatomy=====</option>
					<option>=====Biologists=====</option>
					<option>=====Biology books=====</option>
					<option>=====Ecology=====</option>
					<option>=====Evolution and reproduction=====</option>
					<option>=====Molecular and cellular biology=====</option>
					<option>=====Miscellaneous biology=====</option>
					<option>====Medicine====</option>
					<option>=====Medicine books=====</option>
					<option>=====Diseases and medical conditions=====</option>
					<option>=====History of medicine=====</option>
					<option>=====Medical people and institutions=====</option>
					<option>=====Medical procedures=====</option>
					<option>====Pharmacology====</option>
					<option>=====Vaccines=====</option>
					<option>=====Drug classes and individual drugs=====</option>
					<option>=====Pharmacology miscellanea=====</option>
					<option>====Viruses====</option>
					<option>====Organisms====</option>
					<option>=====Bacterial species=====</option>
					<option>=====Protists=====</option>
					<option>=====Fungi=====</option>
					<option>=====Plants=====</option>
					<option>=====Animals=====</option>
					<option>======Mammals and other synapsids======</option>
					<option>======Birds======</option>
					<option>======Non-avian dinosaurs======</option>
					<option>======Reptiles and amphibians======</option>
					<option>======Fish======</option>
					<option>======Arthropods======</option>
					<option>======Other invertebrates======</option>
					<option>======Animal domestic breeds, types, and individuals======</option>
					<option disabled>===Chemistry and materials science===</option>
					<option>=====Areas of chemistry theory=====</option>
					<option>=====Chemistry books=====</option>
					<option>=====Types of chemical analyses=====</option>
					<option>=====Types of chemical transformations=====</option>
					<option>=====Named reactions=====</option>
					<option>=====Classes of chemical compounds and materials=====</option>
					<option>=====Chemical compounds and materials=====</option>
					<option>=====Periodic table groups and periods=====</option>
					<option>=====Elements=====</option>
					<option>=====Chemistry and materials science organizations=====</option>
					<option>=====Chemists and materials scientists=====</option>
					<option>=====Chemistry miscellanea=====</option>
					<option>=====Materials science miscellanea=====</option>
					<option disabled>===Earth science===</option>
					<option>====Geology====</option>
					<option>=====Geology and geophysics=====</option>
					<option>=====Geologists, geophysicists and mineralogists=====</option>
					<option>=====Mineralogy=====</option>
					<option>=====Earthquakes and similar natural disasters=====</option>
					<option>====Meteorology====</option>
					<option>=====Climate=====</option>
					<option>=====Climate change=====</option>
					<option>=====Meteorological observatories=====</option>
					<option>=====Storm sciences, tropical cyclone seasons, and storm effects=====</option>
					<option>=====Tropical cyclones: Atlantic=====</option>
					<option>=====Tropical cyclones: Eastern Pacific=====</option>
					<option>=====Tropical cyclones: Northwestern Pacific=====</option>
					<option>=====Tropical cyclones: Southern Pacific and the Indian Ocean=====</option>
					<option>=====Weather=====</option>
					<option>=====Severe weather and winter storms=====</option>
					<option disabled>===Physics and astronomy===</option>
					<option>====Physics====</option>
					<option>=====Physics=====</option>
					<option>=====Physicists=====</option>
					<option>====Astronomy====</option>
					<option>=====Space travelers=====</option>
					<option>=====Astronomy and astrophysics=====</option>
					<option>=====Astronomers and astrophysicists=====</option>
					<option>=====Solar system=====</option>
					<option>=====Constellations and asterisms=====</option>
					<option>=====Stars, galaxies and extrasolar objects=====</option>
					<option>=====Rocketry and spaceflight=====</option>
					<option>=====Astronomy miscellanea=====</option>

					<option disabled>==Philosophy and religion==</option>
					<option disabled>===Philosophy===</option>
					<option>=====Divinities and protohistoric figures=====</option>
					<option>=====Myths, mythology, and miracles=====</option>
					<option>=====Philosophies and philosophical movements=====</option>
					<option>=====Philosophical doctrines, teachings, texts, events, and symbols=====</option>
					<option>=====Philosophers=====</option>
					<option disabled>===Religion===</option>
					<option>=====Religions and religious movements=====</option>
					<option>=====Religious congregations, denominations, and organizations=====</option>
					<option>=====Religious doctrines, teachings, texts, events, and symbols=====</option>
					<option>=====Religious figures=====</option>

					<option disabled>==Social sciences and society==</option>
					<option disabled>===Culture, sociology, and psychology===</option>
					<option>=====Culture and cultural studies=====</option>
					<option>=====Cultural symbols=====</option>
					<option>=====Internet culture=====</option>
					<option>=====Cultural organizations and events=====</option>
					<option>=====Ethnic groups=====</option>
					<option>=====Psychology and psychologists=====</option>
					<option>=====Anthropology, anthropologists, sociology and sociologists=====</option>
					<option>=====Globalization=====</option>
					<option disabled>===Education===</option>
					<option>=====Educational institutions=====</option>
					<option>=====Educators=====</option>
					<option>=====Education miscellanea=====</option>
					<option disabled>===Economics and business===</option>
					<option>=====Advertising and marketing=====</option>
					<option>=====Businesspeople=====</option>
					<option>=====Businesses and organizations=====</option>
					<option>=====Economics=====</option>
					<option>=====Numismatics and currencies=====</option>
					<option disabled>===Law===</option>
					<option>=====Case law and litigation=====</option>
					<option>=====Constitutional law=====</option>
					<option>=====Criminal justice, law enforcement, and ethics=====</option>
					<option>=====Criminals, crimes, allegations, and victims=====</option>
					<option>=====Domestic law=====</option>
					<option>=====International laws and treaties=====</option>
					<option>=====Lawyers, judges and legal academics=====</option>
					<option>=====Legal institutions, publications, and buildings=====</option>
					<option>=====Legislation and statutory law=====</option>
					<option>=====Law miscellanea=====</option>
					<option disabled>===Magazines and print journalism===</option>
					<option>=====Journalism and newspapers=====</option>
					<option>=====Magazines and journals=====</option>
					<option disabled>===Politics and government===</option>
					<option>=====Heads of state and heads of government=====</option>
					<option>=====Spouses of heads of state and heads of government=====</option>
					<option>=====Intelligence and espionage=====</option>
					<option>=====International organizations=====</option>
					<option>=====National non-governmental organizations=====</option>
					<option>=====Political and governmental institutions=====</option>
					<option>=====Political districts, direction and governance=====</option>
					<option>=====Political events and elections=====</option>
					<option>=====Political figures=====</option>
					<option>=====Political issues, theory and analysis=====</option>
					<option>=====Political parties and movements=====</option>

					<option disabled>==Sports and recreation==</option>
					<option disabled>===Football===</option>
					<option>=====American football teams, events, seasons, concepts=====</option>
					<option>=====American football people=====</option>
					<option>=====Association football teams, events, and concepts=====</option>
					<option>=====Association football people=====</option>
					<option>=====Australian rules and Gaelic football=====</option>
					<option>=====Canadian football=====</option>
					<option>=====Rugby and rugby league football=====</option>
					<option disabled>===Baseball===</option>
					<option>=====Baseball teams, venues, events, and concepts=====</option>
					<option>=====Baseball people=====</option>
					<option disabled>===Basketball===</option>
					<option>=====Basketball teams, venues and events=====</option>
					<option>=====Basketball people=====</option>
					<option disabled>===Cricket===</option>
					<option>=====Cricket teams, venues and events=====</option>
					<option>=====Cricket people=====</option>
					<option disabled>===Hockey===</option>
					<option>=====Field hockey=====</option>
					<option>=====Ice hockey teams, venues and events=====</option>
					<option>=====Ice hockey people=====</option>
					<option disabled>===Motorsport===</option>
					<option>=====Races and seasons=====</option>
					<option>=====Racers, racecars, and tracks=====</option>
					<optio disabledn>===Pro wrestling===</option>
					<option>=====Professional wrestling events=====</option>
					<option>=====Professional wrestling groups=====</option>
					<option>=====Professional wrestling people=====</option>
					<option>=====Professional wrestling championships=====</option>
					<option>=====Professional wrestling (other)=====</option>
					<option disabled>===Recreation===</option>
					<option>=====Board, card, and role-playing games=====</option>
					<option>=====Chess=====</option>
					<option>=====Climbing=====</option>
					<option>=====Diving=====</option>
					<option>=====Poker=====</option>
					<option>=====Toys=====</option>
					<option>=====Stadiums, public parks, and amusements=====</option>
					<option>=====Yoga=====</option>
					<option>=====Zoos and public aquariums=====</option>
					<option disabled>===Multi-sport event===</option>
					<option>=====Olympics=====</option>
					<option>=====Summer Olympics=====</option>
					<option>=====Winter Olympics=====</option>
					<option>=====Paralympics=====</option>
					<option>=====Other multi-sport events=====</option>
					<option disabled>===Other sports===</option>
					<option>=====Archery=====</option>
					<option>=====Badminton=====</option>
					<option>=====Cue sports=====</option>
					<option>=====Curling=====</option>
					<option>=====Cycling=====</option>
					<option>=====Darts=====</option>
					<option>=====Equestrianism/Horse racing=====</option>
					<option>=====Fencing=====</option>
					<option>=====Goalball=====</option>
					<option>=====Golf=====</option>
					<option>=====Gymnastics=====</option>
					<option>=====Handball=====</option>
					<option>=====Lacrosse=====</option>
					<option>=====Mixed martial arts, martial arts, and boxing=====</option>
					<option>=====Netball=====</option>
					<option>=====Rowing=====</option>
					<option>=====Running, track and field=====</option>
					<option>=====Shooting=====</option>
					<option>=====Skating=====</option>
					<option>=====Skiing=====</option>
					<option>=====Snowboarding=====</option>
					<option>=====Softball=====</option>
					<option>=====Squash=====</option>
					<option>=====Swimming and water sports=====</option>
					<option>=====Table tennis=====</option>
					<option>=====Tennis=====</option>
					<option>=====Volleyball=====</option>
					<option>=====Sports mascots and supporters=====</option>
					<option>=====Multiple sports=====</option>
					<option>=====Sports miscellanea=====</option>

					<option disabled>==Video games==</option>
					<option disabled>===Video games===</option>
					<option>=====Early video games=====</option>
					<option>=====1970s video games=====</option>
					<option>=====1980–84 video games=====</option>
					<option>=====1985–89 video games=====</option>
					<option>=====1990–94 video games=====</option>
					<option>=====1995–99 video games=====</option>
					<option>=====2000–04 video games=====</option>
					<option>=====2005–09 video games=====</option>
					<option>=====2010–14 video games=====</option>
					<option>=====2015–19 video games=====</option>
					<option>=====2020–24 video games=====</option>
					<option>=====Cancelled video games=====</option>
					<option>=====Video game series=====</option>
					<option>=====Video game characters=====</option>
					<option>=====Video game genres=====</option>
					<option>=====Video game systems and services=====</option>
					<option>=====Video game history and development=====</option>
					<option>=====Video game industry and developers=====</option>
					<option>=====Video game terms and game elements=====</option>
					<option>=====Video game miscellanea=====</option>

					<option disabled>==Warfare==</option>
					<option disabled>===Armies and military units===</option>
					<option>====Air force====</option>
					<option>====Army====</option>
					<option>=====Australian army=====</option>
					<option>=====United States and Confederate armies=====</option>
					<option>====Navy====</option>
					<option>====Other====</option>
					<option disabled>===Battles, exercises, and conflicts===</option>
					<option>====Ancient and classical history (before 500)====</option>
					<option>====Middle Ages (500–1499)====</option>
					<option>====Early modern period (1500–1799)====</option>
					<option>====American Revolutionary War (1775–1783)====</option>
					<option>====French Revolutionary and Napoleonic Wars (1792–1815)====</option>
					<option>====Long nineteenth century (1800–1914)====</option>
					<option>====World War I and interwar (1914–1939)====</option>
					<option>====World War II (1939–1945)====</option>
					<option>====Post-World War II (1945–present)====</option>
					<option>====Massacres, war crimes, and legal issues of warfare====</option>
					<option disabled>===Military aircraft===</option>
					<option>====Aircraft technology and doctrine====</option>
					<option>====Military aircraft====</option>
					<option disabled>===Military decorations and memorials===</option>
					<option>====Awards and decorations====</option>
					<option>====Military museums and memorials====</option>
					<option disabled>===Military people===</option>
					<option>====Military people (A–C)====</option>
					<option>====Military people (D–F)====</option>
					<option>====Military people (G–K)====</option>
					<option>====Military people (L–M)====</option>
					<option>====Military people (N–R)====</option>
					<option>====Military people (S–Z)====</option>
					<option>====Warfare and race====</option>
					<option disabled>===Military ranks and positions===</option>
					<option>====Military ranks and positions====</option>
					<option disabled>===Warships and naval units===</option>
					<option>====Ship types====</option>
					<option>====Naval technology====</option>
					<option>====Warships====</option>
					<option>=====Warships of Argentina=====</option>
					<option>=====Warships of Australia=====</option>
					<option>=====Warships of Austria-Hungary=====</option>
					<option>=====Warships of Belgium=====</option>
					<option>=====Warships of Brazil=====</option>
					<option>=====Warships of Canada=====</option>
					<option>=====Warships of Chile=====</option>
					<option>=====Warships of China=====</option>
					<option>=====Warships of the Confederate States of America=====</option>
					<option>=====Warships of Croatia=====</option>
					<option>=====Warships of Denmark=====</option>
					<option>=====Warships of France=====</option>
					<option>=====Warships of Germany=====</option>
					<option>=====Warships of Greece=====</option>
					<option>=====Warships of Iceland=====</option>
					<option>=====Warships of India=====</option>
					<option>=====Warships of Indonesia=====</option>
					<option>=====Warships of Italy=====</option>
					<option>=====Warships of Japan=====</option>
					<option>=====Warships of Norway=====</option>
					<option>=====Warships of Peru=====</option>
					<option>=====Warships of Portugal=====</option>
					<option>=====Warships of Romania=====</option>
					<option>=====Warships of Russia and the Soviet Union=====</option>
					<option>=====Warships of South Africa=====</option>
					<option>=====Warships of Spain=====</option>
					<option>=====Warships of Sweden=====</option>
					<option>=====Warships of Turkey and the Ottoman Empire=====</option>
					<option>=====Warships of the United Kingdom=====</option>
					<option>=====Warships of the United States=====</option>
					<option>=====Warships of Yugoslavia=====</option>
					<option disabled>===Weapons, equipment, and buildings===</option>
					<option>====Weapons, military equipment and programs====</option>
					<option>====Military uniforms and clothing====</option>
					<option>====Fortifications and military installations====</option>
					<option>====Castles====</option>
				</select>
			</p>

			<p>
				<strong>Wikicode to display when adding this to the list of good articles at [[<a href="https://en.wikipedia.org/wiki/Wikipedia:Good_articles">WP:GA</a>]].</strong><br />
				Names should be in format: <code>Lastname, Firstname</code><br />
				Television shows should be in format: <code>''Television show''</code><br />
				Television episodes should be in format: <code>"Episode name"</code><br />
				<input type="text" name="GANReviewTool-DisplayWikicode" value="${escapeHtml(gaTitle)}" />
			</p>
		</div>
		<!-- endif -->

		<p>
			<button id="GANReviewTool-Submit">Submit</button>
		</p>
	</div>

	<div id="GANReviewTool-ProcessingMessage">
		<p>
			Processing...
		</p>
	</div>
</div>
`
	);

	// Show or hide different parts of the form depending on whether the user clicks pass or fail
	$(`[name="GANReviewTool-PassOrFail"]`).on('change', function() {
		if ( $(`[name="GANReviewTool-PassOrFail"]:checked`).val() === 'pass' ) {
			$(`#GANReviewTool-PassDiv`).show();
		} else {
			$(`#GANReviewTool-PassDiv`).hide();
		}
	});

	// Submit button
	$(`#GANReviewTool-Submit`).on('click', async function() {
		/*
		let title = 'User:Novem Linguae/sandbox2';
		let wikicode = 'Test 3';
		let editSummary = 'Testing script';
		await makeEdit(title, editSummary, wikicode);
		*/

		// hide form elements
		$(`#GANReviewTool-Form`).hide();
		$(`#GANReviewTool-ProcessingMessage`).show();

		// display status messages

		// if pass:

			// Add below the first level 2 heading: {{atopg|result = Passed}} and {{abotg}} to the nomination page, if not present?
			
			// Article talk page: Replace {{GA nominee}} with
				//{{GA|~~~~~|topic=use GA nominee data|page=use GA nominee data}}. "Topic" and "subtopic" parameters are aliases of each other, detect both and convert to "topic". Delete other parameters. See also: Wikipedia:WikiProject Good articles/Topic Values.
				// Or if {{Article history}} is present, add an entry to that instead.

			// Update WikiProject templates so that class=GA

			// List the article at Wikipedia:Good articles in the appropriate section
				// Subtopic lists appear to be alphabetized. If it is a person, the alphabetizing is by last name.
				// The list is wrapped in module #invoke code, and line breaks are used as the item separators.

		// if fail:

			// Add below the first level 2 heading: {{atopr|result = Failed}} and {{abotr}} to the nomination page, if not present


	});
});

// </nowiki>