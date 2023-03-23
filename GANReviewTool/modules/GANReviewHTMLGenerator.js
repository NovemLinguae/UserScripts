export class GANReviewHTMLGenerator {
	getHTML(gaTitle) {
		let defaultDisplayText = this.getDefaultDisplayText(gaTitle);
		defaultDisplayText = this.escapeHtml(defaultDisplayText);

		return `
<style>
	#GANReviewTool {
		border: 1px solid black;
		padding: 1em;
		margin-bottom: 1em;
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
		line-height: 1.5em;
	}

	#GANReviewTool option:disabled {
		font-weight: bold;
		color: green;
	}

	#GANReviewTool-ProcessingMessage {
		display: none;
	}

	.GANReviewTool-ValidationError {
		display: none;
		color: red;
		font-weight: bold;
	}

	.GANReviewTool-ErrorNotice {
		color: red;
		font-weight: bold;
	}

	#GANReviewTool-MainForm {
		display: none;
	}
</style>

<div id="GANReviewTool">
	<div id="GANReviewTool-Form">
		<h2>
			GAN Review Tool
		</h2>

		<p class="GANReviewTool-Collapsed">
			<a id="GANReviewTool-Uncollapse">Click here</a> to open GANReviewTool.
		</p>

		<div id="GANReviewTool-MainForm">
			<p>
				<strong>Action</strong><br />
				<input type="radio" name="GANReviewTool-PassOrFail" value="pass" checked /> Pass<br />
				<input type="radio" name="GANReviewTool-PassOrFail" value="fail" /> Fail<br />
				<input type="radio" name="GANReviewTool-PassOrFail" value="placeOnHold" /> Place On Hold<br />
				<input type="radio" name="GANReviewTool-PassOrFail" value="askSecondOpinion" /> Ask 2nd Opinion<br />
				<input type="radio" name="GANReviewTool-PassOrFail" value="answerSecondOpinion" /> Answer 2nd Opinion<br />
			</p>

			<!-- if pass or fail -->
			<div id="GANReviewTool-PassFailDiv">
				<p>
					<input type="checkbox" name="GANReviewTool-ATOPYesNo" value="1" checked /> Place {{<a href="/wiki/Template:Archive_top">Archive top</a>}} and {{Archive bottom}} templates on GA review page
				</p>

				<!-- if pass -->
				<div id="GANReviewTool-PassDiv">
					<p>
						<strong>Topic, subtopic, and sub-subtopic:</strong><br />
						<select name="GANReviewTool-Topic">
							<option></option>

							<option value="Agriculture, food and drink" disabled>==Agriculture, food, and drink==</option>
							<option value="Agriculture, food and drink" disabled>===Agriculture, food, and drink===</option>
							<option value="Agriculture, food and drink">=====Agriculture and farming=====</option>
							<option value="Agriculture, food and drink">=====Horticulture and forestry=====</option>
							<option value="Agriculture, food and drink">=====Food and drink establishments=====</option>
							<option value="Agriculture, food and drink">=====Cuisines=====</option>
							<option value="Agriculture, food and drink">=====Food=====</option>
							<option value="Agriculture, food and drink">=====Drink=====</option>
							<option value="Agriculture, food and drink">=====Food and drink companies=====</option>
							<option value="Agriculture, food and drink">=====Food and drink people=====</option>
							<option value="Agriculture, food and drink">=====Cookery books=====</option>
							<option value="Agriculture, food and drink">=====Miscellaneous=====</option>

							<option value="Art and architecture" disabled>==Art and architecture==</option>
							<option value="Art and architecture" disabled>===Art===</option>
							<option value="Art and architecture">====Art====</option>
							<option value="Art and architecture">=====Painting=====</option>
							<option value="Art and architecture">=====Artists and art organizations=====</option>
							<option value="Art and architecture" disabled>===Architecture===</option>
							<option value="Art and architecture">====Architecture====</option>
							<option value="Art and architecture">====Architecture – Bridges and tunnels====</option>
							<option value="Art and architecture">====Architecture – Buildings====</option>
							<option value="Art and architecture">=====Architecture – Buildings of the United States=====</option>
							<option value="Art and architecture">======Architecture – Buildings of Manhattan======</option>
							<option value="Art and architecture">====Architecture – Forts and fortifications====</option>
							<option value="Art and architecture">====Architecture – Hotels and inns====</option>
							<option value="Art and architecture">====Architecture – Houses and residences====</option>
							<option value="Art and architecture">====Architecture – Lighthouses====</option>
							<option value="Art and architecture">====Architecture – Memorials and monuments====</option>
							<option value="Art and architecture">====Architecture – Museums and galleries====</option>
							<option value="Art and architecture">====Architecture – Religious====</option>
							<option value="Art and architecture">====Architecture – Theatres====</option>
							<option value="Art and architecture">====Architects====</option>

							<option value="Engineering and technology" disabled>==Engineering and technology==</option>
							<option value="Engineering and technology" disabled>===Computing and engineering===</option>
							<option value="Engineering and technology">=====Computer-related organizations and people=====</option>
							<option value="Engineering and technology">=====Cryptography=====</option>
							<option value="Engineering and technology">=====Engineers and inventors=====</option>
							<option value="Engineering and technology">=====Engineering technology=====</option>
							<option value="Engineering and technology">=====Engineering failures and disasters=====</option>
							<option value="Engineering and technology">=====Hardware, standards and protocols=====</option>
							<option value="Engineering and technology">=====Power and water infrastructure=====</option>
							<option value="Engineering and technology">=====Programming=====</option>
							<option value="Engineering and technology">=====Software=====</option>
							<option value="Engineering and technology">=====Websites and the Internet=====</option>
							<option value="Engineering and technology" disabled>===Transport===</option>
							<option value="Engineering and technology">====Air transport====</option>
							<option value="Engineering and technology">=====Air transport people=====</option>
							<option value="Engineering and technology">=====Civilian aircraft=====</option>
							<option value="Engineering and technology">=====Airlines=====</option>
							<option value="Engineering and technology">=====Airports and terminals =====</option>
							<option value="Engineering and technology">=====Aviation incidents=====</option>
							<option value="Engineering and technology">====Maritime transport====</option>
							<option value="Engineering and technology">=====Civilian ships=====</option>
							<option value="Engineering and technology">====Rail transport====</option>
							<option value="Engineering and technology">=====Rail bridges, tunnels, and stations=====</option>
							<option value="Engineering and technology">=====Trains and locomotives=====</option>
							<option value="Engineering and technology" disabled>====Road infrastructure====</option>
							<option value="Engineering and technology">=====Road infrastructure: Canada=====</option>
							<option value="Engineering and technology">=====Road infrastructure: United States=====</option>
							<option value="Engineering and technology">=====Road infrastructure: Northeastern United States=====</option>
							<option value="Engineering and technology">=====Road infrastructure: Southern United States=====</option>
							<option value="Engineering and technology">=====Road infrastructure: Midwestern United States=====</option>
							<option value="Engineering and technology">=====Road infrastructure: Western United States=====</option>
							<option value="Engineering and technology">=====Road infrastructure: Other=====</option>
							<option value="Engineering and technology">=====Road transportation: Buses, vans, and paratransit=====</option>
							<option value="Engineering and technology">=====Road transportation: Cars and motorcycles=====</option>
							<option value="Engineering and technology">=====Road transportation: Other=====</option>
							<option value="Engineering and technology">=====Transport by region=====</option>

							<option value="Geography and places" disabled>==Geography and places==</option>
							<option value="Geography and places" disabled>===Geography===</option>
							<option value="Geography and places">=====Bodies of water and water formations=====</option>
							<option value="Geography and places">=====Geographers and explorers=====</option>
							<option value="Geography and places">=====General and human geography=====</option>
							<option value="Geography and places">=====Islands=====</option>
							<option value="Geography and places">=====Landforms=====</option>
							<option value="Geography and places">=====National and state parks, nature reserves, conservation areas, and countryside routes=====</option>
							<option value="Geography and places">=====Urban and historical sites=====</option>
							<option value="Geography and places">=====Geography miscellanea=====</option>
							<option value="Geography and places" disabled>===Places===</option>
							<option value="Geography and places">=====Countries and Regions=====</option>
							<option value="Geography and places">=====Africa=====</option>
							<option value="Geography and places">=====Antarctica=====</option>
							<option value="Geography and places">=====Asia=====</option>
							<option value="Geography and places">=====Australia and the Pacific=====</option>
							<option value="Geography and places">=====Europe=====</option>
							<option value="Geography and places">=====North America=====</option>
							<option value="Geography and places">=====South America=====</option>

							<option value="History" disabled>==History==</option>
							<option value="History" disabled>===World history===</option>
							<option value="History">=====Archaeology and archaeologists=====</option>
							<option value="History">=====Historians, chroniclers and history books=====</option>
							<option value="History">=====Historical figures: heads of state and heads of government=====</option>
							<option value="History">=====Historical figures: politicians=====</option>
							<option value="History">=====Historical figures: other=====</option>
							<option value="History">=====African history=====</option>
							<option value="History">=====North American history=====</option>
							<option value="History">=====South American history=====</option>
							<option value="History">=====Asian history=====</option>
							<option value="History">=====Australian and Oceania history=====</option>
							<option value="History">=====European history=====</option>
							<option value="History">=====Middle Eastern history=====</option>
							<option value="History">=====Global history=====</option>
							<option value="History" disabled>===Royalty, nobility, and heraldry===</option>
							<option value="History">=====Flags and heraldry=====</option>
							<option value="History">=====Monarchs=====</option>
							<option value="History">=====Royalty and nobility=====</option>

							<option value="Language and literature" disabled>==Language and literature==</option>
							<option value="Language and literature" disabled>===Language and literature===</option>
							<option value="Language and literature">=====Alphabets and transliteration=====</option>
							<option value="Language and literature">=====Ancient texts=====</option>
							<option value="Language and literature">=====Biographies, autobiographies, essays, diaries, and travelogues=====</option>
							<option value="Language and literature">=====Characters and fictional items=====</option>
							<option value="Language and literature">=====Children's books, fairy tales, and nursery rhymes=====</option>
							<option value="Language and literature">=====Comics=====</option>
							<option value="Language and literature">=====Genres and literary theory=====</option>
							<option value="Language and literature">=====Languages=====</option>
							<option value="Language and literature">=====Linguists and philologists=====</option>
							<option value="Language and literature">=====Non-fiction=====</option>
							<option value="Language and literature">=====Novels=====</option>
							<option value="Language and literature">=====Plays=====</option>
							<option value="Language and literature">=====Poetry=====</option>
							<option value="Language and literature">=====Short fiction and anthologies=====</option>
							<option value="Language and literature">=====Tolkien=====</option>
							<option value="Language and literature">=====Words and linguistics=====</option>
							<option value="Language and literature">=====Writers, publishers, and critics=====</option>

							<option value="Mathematics" disabled>==Mathematics==</option>
							<option value="Mathematics" disabled>===Mathematics and mathematicians===</option>
							<option value="Mathematics">=====Mathematical concepts and topics=====</option>
							<option value="Mathematics">=====Mathematical texts and artifacts=====</option>
							<option value="Mathematics">=====Mathematicians=====</option>

							<option value="Media and drama" disabled>==Media and drama==</option>
							<option value="Media and drama" disabled>===Film===</option>
							<option value="Media and drama">=====Cinema=====</option>
							<option value="Media and drama">=====Film franchises, overview articles and production articles=====</option>
							<option value="Media and drama">=====Pre-1910s films=====</option>
							<option value="Media and drama">=====1910s films=====</option>
							<option value="Media and drama">=====1920s films=====</option>
							<option value="Media and drama">=====1930s films=====</option>
							<option value="Media and drama">=====1940s films=====</option>
							<option value="Media and drama">=====1950s films=====</option>
							<option value="Media and drama">=====1960s films=====</option>
							<option value="Media and drama">=====1970s films=====</option>
							<option value="Media and drama">=====1980s films=====</option>
							<option value="Media and drama">=====1990s films=====</option>
							<option value="Media and drama">=====2000 to 2004 films=====</option>
							<option value="Media and drama">=====2005 to 2009 films=====</option>
							<option value="Media and drama">=====2010 to 2014 films=====</option>
							<option value="Media and drama">=====2015 to 2019 films=====</option>
							<option value="Media and drama">=====2020 to 2024 films=====</option>
							<option value="Media and drama" disabled>===Television===</option>
							<option value="Media and drama">=====Television networks and overview articles=====</option>
							<option value="Media and drama">====Television series====</option>
							<option value="Media and drama">=====''30 Rock''=====</option>
							<option value="Media and drama">=====''Ackley Bridge''=====</option>
							<option value="Media and drama">=====''Adventure Time''=====</option>
							<option value="Media and drama">=====''American Dad!''=====</option>
							<option value="Media and drama">=====''American Horror Story''=====</option>
							<option value="Media and drama">=====''Archer''=====</option>
							<option value="Media and drama">=====Arrowverse=====</option>
							<option value="Media and drama">=====Avatarverse=====</option>
							<option value="Media and drama">=====''Awake''=====</option>
							<option value="Media and drama">=====''Battlestar Galactica''=====</option>
							<option value="Media and drama">=====''Better Call Saul''=====</option>
							<option value="Media and drama">=====''The Big Bang Theory''=====</option>
							<option value="Media and drama">=====''Black Mirror''=====</option>
							<option value="Media and drama">=====''Body of Proof''=====</option>
							<option value="Media and drama">=====''BoJack Horseman''=====</option>
							<option value="Media and drama">=====''Breaking Bad''=====</option>
							<option value="Media and drama">=====''Buffy the Vampire Slayer''=====</option>
							<option value="Media and drama">=====''Casualty''=====</option>
							<option value="Media and drama">=====''Cheers''=====</option>
							<option value="Media and drama">=====''Chuck''=====</option>
							<option value="Media and drama">=====''Cold Feet''=====</option>
							<option value="Media and drama">=====''Community''=====</option>
							<option value="Media and drama">=====''Coronation Street''=====</option>
							<option value="Media and drama">=====''Daredevil''=====</option>
							<option value="Media and drama">=====''Desperate Housewives''=====</option>
							<option value="Media and drama">=====''Dexter''=====</option>
							<option value="Media and drama">=====''Doctor Who'' series=====</option>
							<option value="Media and drama">=====''Doctor Who'' episodes=====</option>
							<option value="Media and drama">=====''Doctors''=====</option>
							<option value="Media and drama">=====''EastEnders''=====</option>
							<option value="Media and drama">=====''Ed, Edd n Eddy''=====</option>
							<option value="Media and drama">=====''Emmerdale''=====</option>
							<option value="Media and drama">=====''Family Guy''=====</option>
							<option value="Media and drama">=====''Friends''=====</option>
							<option value="Media and drama">=====''Fringe'' series=====</option>
							<option value="Media and drama">=====''Fringe'' episodes=====</option>
							<option value="Media and drama">=====''Futurama''=====</option>
							<option value="Media and drama">=====''Game of Thrones''=====</option>
							<option value="Media and drama">=====''Glee'' series=====</option>
							<option value="Media and drama">=====''Glee'' episodes=====</option>
							<option value="Media and drama">=====''The Good Place''=====</option>
							<option value="Media and drama">=====''Gossip Girl''=====</option>
							<option value="Media and drama">=====''Grey's Anatomy'' series=====</option>
							<option value="Media and drama">=====''Grey's Anatomy'' episodes=====</option>
							<option value="Media and drama">=====''Hawaii Five-0 (2010 TV series)''=====</option>
							<option value="Media and drama">=====''The Hills''=====</option>
							<option value="Media and drama">=====''Home and Away''=====</option>
							<option value="Media and drama">=====''Holby City''=====</option>
							<option value="Media and drama">=====''Hollyoaks''=====</option>
							<option value="Media and drama">=====''Homicide: Life on the Street''=====</option>
							<option value="Media and drama">=====''House''=====</option>
							<option value="Media and drama">=====''House of Cards''=====</option>
							<option value="Media and drama">=====''The House of Flowers''=====</option>
							<option value="Media and drama">=====''Inside No. 9''=====</option>
							<option value="Media and drama">=====''Last Week Tonight with John Oliver''=====</option>
							<option value="Media and drama">=====''Law & Order: Special Victims Unit''=====</option>
							<option value="Media and drama">=====''Lost'' series=====</option>
							<option value="Media and drama">=====''Lost'' episodes=====</option>
							<option value="Media and drama">=====''Mad Men''=====</option>
							<option value="Media and drama">=====''Magnum P.I.''=====</option>
							<option value="Media and drama">=====Marvel Cinematic Universe=====</option>
							<option value="Media and drama">=====''Millennium''=====</option>
							<option value="Media and drama">=====''Modern Family''=====</option>
							<option value="Media and drama">=====''Monk''=====</option>
							<option value="Media and drama">=====''My Little Pony: Friendship Is Magic''=====</option>
							<option value="Media and drama">=====''Neighbours''=====</option>
							<option value="Media and drama">=====''Neon Genesis Evangelion''=====</option>
							<option value="Media and drama">=====''The Office'' series=====</option>
							<option value="Media and drama">=====''The Office'' episodes=====</option>
							<option value="Media and drama">=====''Once Upon a Time''=====</option>
							<option value="Media and drama">=====''Parks and Recreation''=====</option>
							<option value="Media and drama">=====''Phineas and Ferb''=====</option>
							<option value="Media and drama">=====''Psych''=====</option>
							<option value="Media and drama">=====''Rugrats''=====</option>
							<option value="Media and drama">=====''Sanctuary''=====</option>
							<option value="Media and drama">=====''Seinfeld''=====</option>
							<option value="Media and drama">=====''Sesame Street'' series and co-productions=====</option>
							<option value="Media and drama">=====''The Simpsons'' series=====</option>
							<option value="Media and drama">=====''The Simpsons'' episodes=====</option>
							<option value="Media and drama">=====''Skins''=====</option>
							<option value="Media and drama">=====''Smallville''=====</option>
							<option value="Media and drama">=====''South Park'' series=====</option>
							<option value="Media and drama">=====''South Park'' episodes=====</option>
							<option value="Media and drama">=====''The Spectacular Spider-Man''=====</option>
							<option value="Media and drama">=====''SpongeBob SquarePants''=====</option>
							<option value="Media and drama">=====''Spooks''=====</option>
							<option value="Media and drama">=====''Stargate''=====</option>
							<option value="Media and drama">=====''Star Trek'' series=====</option>
							<option value="Media and drama">=====''Star Trek'' series episodes=====</option>
							<option value="Media and drama">=====''Supernatural''=====</option>
							<option value="Media and drama">=====''Thunderbirds''=====</option>
							<option value="Media and drama">=====''Torchwood''=====</option>
							<option value="Media and drama">=====''Twin Peaks''=====</option>
							<option value="Media and drama">=====''Ugly Americans''=====</option>
							<option value="Media and drama">=====''Veronica Mars''=====</option>
							<option value="Media and drama">=====''The Walking Dead''=====</option>
							<option value="Media and drama">=====''WandaVision''=====</option>
							<option value="Media and drama">=====''The West Wing''=====</option>
							<option value="Media and drama">=====''White Collar''=====</option>
							<option value="Media and drama">=====''Will & Grace''=====</option>
							<option value="Media and drama">=====''The X-Files'' series=====</option>
							<option value="Media and drama">=====''The X-Files'' episodes=====</option>
							<option value="Media and drama">=====Other television series, 1950s debuts=====</option>
							<option value="Media and drama">=====Other television series, 1960s debuts=====</option>
							<option value="Media and drama">=====Other television series, 1970s debuts=====</option>
							<option value="Media and drama">=====Other television series, 1980s debuts=====</option>
							<option value="Media and drama">=====Other television series, 1990s debuts=====</option>
							<option value="Media and drama">=====Other television series, 2000s debuts=====</option>
							<option value="Media and drama">=====Other television series, 2010s debuts=====</option>
							<option value="Media and drama">=====Other television series, 2020s debuts=====</option>
							<option value="Media and drama">=====Other television seasons and related articles=====</option>
							<option value="Media and drama">=====Other episodes and specials=====</option>
							<option value="Media and drama" disabled>===Media and drama===</option>
							<option value="Media and drama">=====Actors, directors, models, performers, and celebrities=====</option>
							<option value="Media and drama">=====Animation=====</option>
							<option value="Media and drama">=====Fictional characters and technologies=====</option>
							<option value="Media and drama">=====Radio=====</option>
							<option value="Media and drama">=====Theatre, musical theatre, dance, and opera=====</option>

							<option value="Music" disabled>==Music==</option>
							<option value="Music" disabled>===Albums===</option>
							<option value="Music">=====1950 to 1969 albums=====</option>
							<option value="Music">=====1970 to 1979 albums=====</option>
							<option value="Music">=====1980 to 1989 albums=====</option>
							<option value="Music">=====1990 to 1994 albums=====</option>
							<option value="Music">=====1995 to 1999 albums=====</option>
							<option value="Music">=====2000 to 2004 albums=====</option>
							<option value="Music">=====2005 to 2009 albums=====</option>
							<option value="Music">=====2010 to 2014 albums=====</option>
							<option value="Music">=====2015 to 2019 albums=====</option>
							<option value="Music">=====2020 to 2024 albums=====</option>
							<option value="Music">=====Soundtracks=====</option>
							<option value="Music">=====Video albums=====</option>
							<option value="Music" disabled>===Classical compositions===</option>
							<option value="Music">=====Classical compositions=====</option>
							<option value="Music" disabled>===Songs===</option>
							<option value="Music">=====Pre-1900 songs=====</option>
							<option value="Music">=====1900 to 1959 songs=====</option>
							<option value="Music">=====1960 to 1969 songs=====</option>
							<option value="Music">=====1970 to 1979 songs=====</option>
							<option value="Music">=====1980 to 1989 songs=====</option>
							<option value="Music">=====1990 to 1999 songs=====</option>
							<option value="Music">=====2000 to 2004 songs=====</option>
							<option value="Music">=====2005 to 2006 songs=====</option>
							<option value="Music">=====2007 to 2008 songs=====</option>
							<option value="Music">=====2009 songs=====</option>
							<option value="Music">=====2010 songs=====</option>
							<option value="Music">=====2011 songs=====</option>
							<option value="Music">=====2012 songs=====</option>
							<option value="Music">=====2013 songs=====</option>
							<option value="Music">=====2014 songs=====</option>
							<option value="Music">=====2015 songs=====</option>
							<option value="Music">=====2016 songs=====</option>
							<option value="Music">=====2017 songs=====</option>
							<option value="Music">=====2018 songs=====</option>
							<option value="Music">=====2019 songs=====</option>
							<option value="Music">=====2020 songs=====</option>
							<option value="Music">=====2021 songs=====</option>
							<option value="Music">=====2022 songs=====</option>
							<option value="Music" disabled>===Other music articles===</option>
							<option value="Music">=====Music awards=====</option>
							<option value="Music">=====Music by nation, people, region, or country=====</option>
							<option value="Music">=====Music genres, music styles, music eras=====</option>
							<option value="Music">=====Musical theory, musical instruments, and music techniques=====</option>
							<option value="Music">=====Music businesses and events=====</option>
							<option value="Music">=====Performers, groups, composers, and other music-related people=====</option>

							<option value="Natural sciences" disabled>==Natural sciences==</option>
							<option value="Natural sciences" disabled>===Biology and medicine===</option>
							<option value="Natural sciences">====Biology====</option>
							<option value="Natural sciences">=====Anatomy=====</option>
							<option value="Natural sciences">=====Biologists=====</option>
							<option value="Natural sciences">=====Biology books=====</option>
							<option value="Natural sciences">=====Ecology=====</option>
							<option value="Natural sciences">=====Evolution=====</option>
							<option value="Natural sciences">=====Molecular and cellular biology=====</option>
							<option value="Natural sciences">=====Miscellaneous biology=====</option>
							<option value="Natural sciences">====Medicine====</option>
							<option value="Natural sciences">=====Medicine books=====</option>
							<option value="Natural sciences">=====Diseases and medical conditions=====</option>
							<option value="Natural sciences">=====History of medicine=====</option>
							<option value="Natural sciences">=====Medical people and institutions=====</option>
							<option value="Natural sciences">=====Medical procedures=====</option>
							<option value="Natural sciences">====Pharmacology====</option>
							<option value="Natural sciences">=====Vaccines=====</option>
							<option value="Natural sciences">=====Drug classes and individual drugs=====</option>
							<option value="Natural sciences">=====Pharmacology miscellanea=====</option>
							<option value="Natural sciences">====Viruses====</option>
							<option value="Natural sciences">====Organisms====</option>
							<option value="Natural sciences">=====Bacterial species=====</option>
							<option value="Natural sciences">=====Protists=====</option>
							<option value="Natural sciences">=====Fungi=====</option>
							<option value="Natural sciences">=====Plants=====</option>
							<option value="Natural sciences">=====Animals=====</option>
							<option value="Natural sciences">======Mammals and other synapsids======</option>
							<option value="Natural sciences">======Birds======</option>
							<option value="Natural sciences">======Non-avian dinosaurs======</option>
							<option value="Natural sciences">======Reptiles and amphibians======</option>
							<option value="Natural sciences">======Fish======</option>
							<option value="Natural sciences">======Arthropods======</option>
							<option value="Natural sciences">======Other invertebrates======</option>
							<option value="Natural sciences">======Animal domestic breeds, types, and individuals======</option>
							<option value="Natural sciences" disabled>===Chemistry and materials science===</option>
							<option value="Natural sciences">=====Areas of chemistry theory=====</option>
							<option value="Natural sciences">=====Chemistry books=====</option>
							<option value="Natural sciences">=====Types of chemical analyses=====</option>
							<option value="Natural sciences">=====Types of chemical transformations=====</option>
							<option value="Natural sciences">=====Named reactions=====</option>
							<option value="Natural sciences">=====Classes of chemical compounds and materials=====</option>
							<option value="Natural sciences">=====Chemical compounds and materials=====</option>
							<option value="Natural sciences">=====Periodic table groups and periods=====</option>
							<option value="Natural sciences">=====Elements=====</option>
							<option value="Natural sciences">=====Chemistry and materials science organizations=====</option>
							<option value="Natural sciences">=====Chemists and materials scientists=====</option>
							<option value="Natural sciences">=====Chemistry miscellanea=====</option>
							<option value="Natural sciences">=====Materials science miscellanea=====</option>
							<option value="Natural sciences" disabled>===Earth science===</option>
							<option value="Natural sciences" disabled>====Geology====</option>
							<option value="Natural sciences">=====Geology and geophysics=====</option>
							<option value="Natural sciences">=====Geologists, geophysicists and mineralogists=====</option>
							<option value="Natural sciences">=====Mineralogy=====</option>
							<option value="Natural sciences">=====Earthquakes and similar natural disasters=====</option>
							<option value="Natural sciences">====Meteorology====</option>
							<option value="Natural sciences">=====Climate=====</option>
							<option value="Natural sciences">=====Climate change=====</option>
							<option value="Natural sciences">=====Meteorological observatories=====</option>
							<option value="Natural sciences">=====Storm sciences, tropical cyclone seasons, and storm effects=====</option>
							<option value="Natural sciences">=====Tropical cyclones: Atlantic=====</option>
							<option value="Natural sciences">=====Tropical cyclones: Eastern Pacific=====</option>
							<option value="Natural sciences">=====Tropical cyclones: Northwestern Pacific=====</option>
							<option value="Natural sciences">=====Tropical cyclones: Southern Pacific and the Indian Ocean=====</option>
							<option value="Natural sciences">=====Weather=====</option>
							<option value="Natural sciences">=====Severe weather and winter storms=====</option>
							<option value="Natural sciences" disabled>===Physics and astronomy===</option>
							<option value="Natural sciences">====Physics====</option>
							<option value="Natural sciences">=====Physics=====</option>
							<option value="Natural sciences">=====Physicists=====</option>
							<option value="Natural sciences">====Astronomy====</option>
							<option value="Natural sciences">=====Space travelers=====</option>
							<option value="Natural sciences">=====Astronomy and astrophysics=====</option>
							<option value="Natural sciences">=====Astronomers and astrophysicists=====</option>
							<option value="Natural sciences">=====Solar system=====</option>
							<option value="Natural sciences">=====Constellations and asterisms=====</option>
							<option value="Natural sciences">=====Stars, galaxies and extrasolar objects=====</option>
							<option value="Natural sciences">=====Rocketry and spaceflight=====</option>
							<option value="Natural sciences">=====Astronomy miscellanea=====</option>

							<option value="Philosophy and religion" disabled>==Philosophy and religion==</option>
							<option value="Philosophy and religion" disabled>===Philosophy===</option>
							<option value="Philosophy and religion">=====Divinities and protohistoric figures=====</option>
							<option value="Philosophy and religion">=====Myths, mythology, and miracles=====</option>
							<option value="Philosophy and religion">=====Philosophies and philosophical movements=====</option>
							<option value="Philosophy and religion">=====Philosophical doctrines, teachings, texts, events, and symbols=====</option>
							<option value="Philosophy and religion">=====Philosophers=====</option>
							<option value="Philosophy and religion" disabled>===Religion===</option>
							<option value="Philosophy and religion">=====Religions and religious movements=====</option>
							<option value="Philosophy and religion">=====Religious congregations, denominations, and organizations=====</option>
							<option value="Philosophy and religion">=====Religious doctrines, teachings, texts, events, and symbols=====</option>
							<option value="Philosophy and religion">=====Religious figures=====</option>

							<option value="Social sciences and society" disabled>==Social sciences and society==</option>
							<option value="Social sciences and society" disabled>===Culture, sociology, and psychology===</option>
							<option value="Social sciences and society">=====Culture and cultural studies=====</option>
							<option value="Social sciences and society">=====Clothing, fashion, and beauty=====</option>
							<option value="Social sciences and society">=====Cultural symbols=====</option>
							<option value="Social sciences and society">=====Internet culture=====</option>
							<option value="Social sciences and society">=====Cultural organizations and events=====</option>
							<option value="Social sciences and society">=====Ethnic groups=====</option>
							<option value="Social sciences and society">=====Psychology and psychologists=====</option>
							<option value="Social sciences and society">=====Anthropology, anthropologists, sociology and sociologists=====</option>
							<option value="Social sciences and society" disabled>===Education===</option>
							<option value="Social sciences and society">=====Educational institutions=====</option>
							<option value="Social sciences and society">=====Educators=====</option>
							<option value="Social sciences and society">=====Education miscellanea=====</option>
							<option value="Social sciences and society" disabled>===Economics and business===</option>
							<option value="Social sciences and society">=====Advertising and marketing=====</option>
							<option value="Social sciences and society">=====Businesspeople=====</option>
							<option value="Social sciences and society">=====Businesses and organizations=====</option>
							<option value="Social sciences and society">=====Economics=====</option>
							<option value="Social sciences and society">=====Numismatics and currencies=====</option>
							<option value="Social sciences and society" disabled>===Law===</option>
							<option value="Social sciences and society">=====Case law and litigation=====</option>
							<option value="Social sciences and society">=====Constitutional law=====</option>
							<option value="Social sciences and society">=====Criminal justice, law enforcement, and ethics=====</option>
							<option value="Social sciences and society">=====Criminals, crimes, allegations, and victims=====</option>
							<option value="Social sciences and society">=====Domestic law=====</option>
							<option value="Social sciences and society">=====International laws and treaties=====</option>
							<option value="Social sciences and society">=====Lawyers, judges and legal academics=====</option>
							<option value="Social sciences and society">=====Legal institutions, publications, and buildings=====</option>
							<option value="Social sciences and society">=====Legislation and statutory law=====</option>
							<option value="Social sciences and society">=====Law miscellanea=====</option>
							<option value="Social sciences and society" disabled>===Magazines and print journalism===</option>
							<option value="Social sciences and society">=====Journalism and newspapers=====</option>
							<option value="Social sciences and society">=====Magazines and journals=====</option>
							<option value="Social sciences and society" disabled>===Politics and government===</option>
							<option value="Social sciences and society">=====Heads of state and heads of government=====</option>
							<option value="Social sciences and society">=====Spouses of heads of state and heads of government=====</option>
							<option value="Social sciences and society">=====Intelligence and espionage=====</option>
							<option value="Social sciences and society">=====International organizations=====</option>
							<option value="Social sciences and society">=====National non-governmental organizations=====</option>
							<option value="Social sciences and society">=====Political and governmental institutions=====</option>
							<option value="Social sciences and society">=====Political districts, direction and governance=====</option>
							<option value="Social sciences and society">=====Political events and elections=====</option>
							<option value="Social sciences and society">=====Political figures=====</option>
							<option value="Social sciences and society">=====Political issues, theory and analysis=====</option>
							<option value="Social sciences and society">=====Political parties and movements=====</option>

							<option value="Sports and recreation" disabled>==Sports and recreation==</option>
							<option value="Sports and recreation" disabled>===Football===</option>
							<option value="Sports and recreation">=====American football teams, events, seasons, concepts=====</option>
							<option value="Sports and recreation">=====American football people=====</option>
							<option value="Sports and recreation">=====Association football teams, events, and concepts=====</option>
							<option value="Sports and recreation">=====Association football people=====</option>
							<option value="Sports and recreation">=====Australian rules and Gaelic football=====</option>
							<option value="Sports and recreation">=====Canadian football=====</option>
							<option value="Sports and recreation">=====Rugby and rugby league football=====</option>
							<option value="Sports and recreation" disabled>===Baseball===</option>
							<option value="Sports and recreation">=====Baseball teams, venues, events, and concepts=====</option>
							<option value="Sports and recreation">=====Baseball people=====</option>
							<option value="Sports and recreation" disabled>===Basketball===</option>
							<option value="Sports and recreation">=====Basketball teams, venues and events=====</option>
							<option value="Sports and recreation">=====Basketball people=====</option>
							<option value="Sports and recreation" disabled>===Cricket===</option>
							<option value="Sports and recreation">=====Cricket teams, venues and events=====</option>
							<option value="Sports and recreation">=====Cricket people=====</option>
							<option value="Sports and recreation" disabled>===Hockey===</option>
							<option value="Sports and recreation">=====Field hockey=====</option>
							<option value="Sports and recreation">=====Ice hockey teams, venues and events=====</option>
							<option value="Sports and recreation">=====Ice hockey people=====</option>
							<option value="Sports and recreation" disabled>===Motorsport===</option>
							<option value="Sports and recreation">=====Races and seasons=====</option>
							<option value="Sports and recreation">=====Racers, racecars, and tracks=====</option>
							<option disabled>===Pro wrestling===</option>
							<option value="Sports and recreation">=====Professional wrestling events=====</option>
							<option value="Sports and recreation">=====Professional wrestling groups=====</option>
							<option value="Sports and recreation">=====Professional wrestling people=====</option>
							<option value="Sports and recreation">=====Professional wrestling championships=====</option>
							<option value="Sports and recreation">=====Professional wrestling (other)=====</option>
							<option value="Sports and recreation" disabled>===Recreation===</option>
							<option value="Sports and recreation">=====Board, card, and role-playing games=====</option>
							<option value="Sports and recreation">=====Chess=====</option>
							<option value="Sports and recreation">=====Climbing=====</option>
							<option value="Sports and recreation">=====Diving=====</option>
							<option value="Sports and recreation">=====Poker=====</option>
							<option value="Sports and recreation">=====Toys=====</option>
							<option value="Sports and recreation">=====Stadiums, public parks, and amusements=====</option>
							<option value="Sports and recreation">=====Yoga=====</option>
							<option value="Sports and recreation">=====Zoos and public aquariums=====</option>
							<option value="Sports and recreation" disabled>===Multi-sport event===</option>
							<option value="Sports and recreation">=====Olympics=====</option>
							<option value="Sports and recreation">=====Summer Olympics=====</option>
							<option value="Sports and recreation">=====Winter Olympics=====</option>
							<option value="Sports and recreation">=====Paralympics=====</option>
							<option value="Sports and recreation">=====Other multi-sport events=====</option>
							<option value="Sports and recreation" disabled>===Other sports===</option>
							<option value="Sports and recreation">=====Archery=====</option>
							<option value="Sports and recreation">=====Badminton=====</option>
							<option value="Sports and recreation">=====Cue sports=====</option>
							<option value="Sports and recreation">=====Curling=====</option>
							<option value="Sports and recreation">=====Cycling=====</option>
							<option value="Sports and recreation">=====Darts=====</option>
							<option value="Sports and recreation">=====Equestrianism/Horse racing=====</option>
							<option value="Sports and recreation">=====Fencing=====</option>
							<option value="Sports and recreation">=====Goalball=====</option>
							<option value="Sports and recreation">=====Golf=====</option>
							<option value="Sports and recreation">=====Gymnastics=====</option>
							<option value="Sports and recreation">=====Handball=====</option>
							<option value="Sports and recreation">=====Lacrosse=====</option>
							<option value="Sports and recreation">=====Mixed martial arts, martial arts, and boxing=====</option>
							<option value="Sports and recreation">=====Netball=====</option>
							<option value="Sports and recreation">=====Rowing=====</option>
							<option value="Sports and recreation">=====Running, track and field=====</option>
							<option value="Sports and recreation">=====Shooting=====</option>
							<option value="Sports and recreation">=====Skating=====</option>
							<option value="Sports and recreation">=====Skiing=====</option>
							<option value="Sports and recreation">=====Snowboarding=====</option>
							<option value="Sports and recreation">=====Softball=====</option>
							<option value="Sports and recreation">=====Squash=====</option>
							<option value="Sports and recreation">=====Swimming and water sports=====</option>
							<option value="Sports and recreation">=====Table tennis=====</option>
							<option value="Sports and recreation">=====Tennis=====</option>
							<option value="Sports and recreation">=====Volleyball=====</option>
							<option value="Sports and recreation">=====Sports mascots and supporters=====</option>
							<option value="Sports and recreation">=====Multiple sports=====</option>
							<option value="Sports and recreation">=====Sports miscellanea=====</option>

							<option value="Video games" disabled>==Video games==</option>
							<option value="Video games" disabled>===Video games===</option>
							<option value="Video games">=====Early video games=====</option>
							<option value="Video games">=====1970s video games=====</option>
							<option value="Video games">=====1980–84 video games=====</option>
							<option value="Video games">=====1985–89 video games=====</option>
							<option value="Video games">=====1990–94 video games=====</option>
							<option value="Video games">=====1995–99 video games=====</option>
							<option value="Video games">=====2000–04 video games=====</option>
							<option value="Video games">=====2005–09 video games=====</option>
							<option value="Video games">=====2010–14 video games=====</option>
							<option value="Video games">=====2015–19 video games=====</option>
							<option value="Video games">=====2020–24 video games=====</option>
							<option value="Video games">=====Cancelled video games=====</option>
							<option value="Video games">=====Video game series=====</option>
							<option value="Video games">=====Video game characters=====</option>
							<option value="Video games">=====Video game genres=====</option>
							<option value="Video games">=====Video game systems and services=====</option>
							<option value="Video games">=====Video game history and development=====</option>
							<option value="Video games">=====Video game industry and developers=====</option>
							<option value="Video games">=====Video game terms and game elements=====</option>
							<option value="Video games">=====Video game miscellanea=====</option>

							<option value="Warfare" disabled>==Warfare==</option>
							<option value="Warfare" disabled>===Armies and military units===</option>
							<option value="Warfare">====Air force====</option>
							<option value="Warfare">====Army====</option>
							<option value="Warfare">=====Australian army=====</option>
							<option value="Warfare">=====United States and Confederate armies=====</option>
							<option value="Warfare">====Navy====</option>
							<option value="Warfare">====Other====</option>
							<option value="Warfare" disabled>===Battles, exercises, and conflicts===</option>
							<option value="Warfare">====Ancient and classical history (before 500)====</option>
							<option value="Warfare">====Middle Ages (500–1499)====</option>
							<option value="Warfare">====Early modern period (1500–1799)====</option>
							<option value="Warfare">====American Revolutionary War (1775–1783)====</option>
							<option value="Warfare">====French Revolutionary and Napoleonic Wars (1792–1815)====</option>
							<option value="Warfare">====Long nineteenth century (1800–1914)====</option>
							<option value="Warfare">====World War I and interwar (1914–1939)====</option>
							<option value="Warfare">====World War II (1939–1945)====</option>
							<option value="Warfare">====Post-World War II (1945–present)====</option>
							<option value="Warfare">====Massacres, war crimes, and legal issues of warfare====</option>
							<option value="Warfare" disabled>===Military aircraft===</option>
							<option value="Warfare">====Aircraft technology and doctrine====</option>
							<option value="Warfare">====Military aircraft====</option>
							<option value="Warfare" disabled>===Military decorations and memorials===</option>
							<option value="Warfare">====Awards and decorations====</option>
							<option value="Warfare">====Military museums and memorials====</option>
							<option value="Warfare" disabled>===Military people===</option>
							<option value="Warfare">====Military people (A–C)====</option>
							<option value="Warfare">====Military people (D–F)====</option>
							<option value="Warfare">====Military people (G–K)====</option>
							<option value="Warfare">====Military people (L–M)====</option>
							<option value="Warfare">====Military people (N–R)====</option>
							<option value="Warfare">====Military people (S–Z)====</option>
							<option value="Warfare">====Warfare and race====</option>
							<option value="Warfare" disabled>===Military ranks and positions===</option>
							<option value="Warfare">====Military ranks and positions====</option>
							<option value="Warfare" disabled>===Warships and naval units===</option>
							<option value="Warfare">====Ship types====</option>
							<option value="Warfare">====Naval technology====</option>
							<option value="Warfare">====Warships====</option>
							<option value="Warfare">=====Warships of Argentina=====</option>
							<option value="Warfare">=====Warships of Australia=====</option>
							<option value="Warfare">=====Warships of Austria-Hungary=====</option>
							<option value="Warfare">=====Warships of Belgium=====</option>
							<option value="Warfare">=====Warships of Brazil=====</option>
							<option value="Warfare">=====Warships of Canada=====</option>
							<option value="Warfare">=====Warships of Chile=====</option>
							<option value="Warfare">=====Warships of China=====</option>
							<option value="Warfare">=====Warships of the Confederate States of America=====</option>
							<option value="Warfare">=====Warships of Croatia=====</option>
							<option value="Warfare">=====Warships of Denmark=====</option>
							<option value="Warfare">=====Warships of France=====</option>
							<option value="Warfare">=====Warships of Germany=====</option>
							<option value="Warfare">=====Warships of Greece=====</option>
							<option value="Warfare">=====Warships of Iceland=====</option>
							<option value="Warfare">=====Warships of India=====</option>
							<option value="Warfare">=====Warships of Indonesia=====</option>
							<option value="Warfare">=====Warships of Italy=====</option>
							<option value="Warfare">=====Warships of Japan=====</option>
							<option value="Warfare">=====Warships of Norway=====</option>
							<option value="Warfare">=====Warships of Peru=====</option>
							<option value="Warfare">=====Warships of Portugal=====</option>
							<option value="Warfare">=====Warships of Romania=====</option>
							<option value="Warfare">=====Warships of Russia and the Soviet Union=====</option>
							<option value="Warfare">=====Warships of South Africa=====</option>
							<option value="Warfare">=====Warships of Spain=====</option>
							<option value="Warfare">=====Warships of Sweden=====</option>
							<option value="Warfare">=====Warships of Turkey and the Ottoman Empire=====</option>
							<option value="Warfare">=====Warships of the United Kingdom=====</option>
							<option value="Warfare">=====Warships of the United States=====</option>
							<option value="Warfare">=====Warships of Yugoslavia=====</option>
							<option value="Warfare" disabled>===Weapons, equipment, and buildings===</option>
							<option value="Warfare">====Weapons, military equipment and programs====</option>
							<option value="Warfare">====Military uniforms and clothing====</option>
							<option value="Warfare">====Fortifications and military installations====</option>
							<option value="Warfare">====Castles====</option>
							<option value="Warfare">=====For testing purposes only. Will throw error.=====</option>
						</select>
					</p>

					<p>
						<strong>Wikicode to display when adding this to the list of good articles at [[<a href="/wiki/Wikipedia:Good_articles">WP:GA</a>]]</strong><br />
						People should be in format: <code>Lastname, Firstname</code><br />
						Albums, television shows, <a href="/wiki/Genus">genus</a>, <a href="/wiki/Binomial_nomenclature">species</a>, court cases should be italicized: <code>''Jeopardy''</code><br />
						Television episodes should be surrounded by double quotes: <code>"Episode name"</code><br />
						Parentheses at the end should not be formatted: <code>''Revolver'' (Beatles album)</code><br />
						Artwork, poetry, etc. may also require special formatting<br />
						More info at [[<a href="/wiki/Wikipedia:Manual_of_Style/Titles_of_works#Italics">MOS:TITLE#Italics</a>]] and [[<a href="/wiki/Wikipedia:Manual_of_Style/Titles_of_works#Quotation_marks">MOS:TITLE#Quotation marks</a>]]<br />
						<input type="text" name="GANReviewTool-DisplayWikicode" value="${defaultDisplayText}" />
					</p>
				</div>
				<!-- endif -->
			</div>
			<!-- endif -->

			<p>
				<button id="GANReviewTool-Submit">Submit</button>
			</p>

			<div id="GANReviewTool-NoTopicMessage" class="GANReviewTool-ValidationError">
				You must select a topic from the combo box above.
			</div>

			<div id="GANReviewTool-NoPipesMessage" class="GANReviewTool-ValidationError">
				"Wikicode to display" should not contain a pipe "|"
			</div>
		</div>
	</div>

	<div id="GANReviewTool-ProcessingMessage">
		<p>
			Processing...
		</p>
	</div>
</div>
`;
	}

	/**
	 * CC BY-SA 4.0, bjornd, https://stackoverflow.com/a/6234804/3480193
	 */
	escapeHtml(unsafe) {
		return unsafe
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}

	getDefaultDisplayText(gaTitle) {
		let endsWithParentheticalDisambiguator = gaTitle.match(/^.+ \(.+\)$/);
		if ( ! endsWithParentheticalDisambiguator ) {
			return gaTitle;
		}
		
		let suffixesThatTriggerItalics = [
			'album',
			'book',
			'comic',
			'comics',
			'film series',
			'film',
			'magazine',
			'manga',
			'novel',
			'painting',
			'poem',
			'sculpture',
			'season 1',
			'season 10',
			'season 2',
			'season 3',
			'season 4',
			'season 5',
			'season 6',
			'season 7',
			'season 8',
			'season 9',
			'series 1',
			'series 10',
			'series 2',
			'series 3',
			'series 4',
			'series 5',
			'series 6',
			'series 7',
			'series 8',
			'series 9',
			'soundtrack',
		];
		let suffixesThatTriggerDoubleQuotes = [
			'song',
		];
		let suffixesThatTriggerDoubleQuotesAndItalics = [
			'30 Rock',
			'Family Guy',
			'Fringe',
			'Glee',
			'Lost',
			'Parks and Recreation',
			'South Park',
			'Star Trek: Enterprise',
			'Star Trek: The Next Generation',
			'The Office',
			'The Simpsons',
			'The Walking Dead',
			'The X-Files'
		];

		let firstHalf = gaTitle.match(/^(.+) \((.+)\)$/)[1];
		let secondHalf = gaTitle.match(/^(.+) \((.+)\)$/)[2];
		
		for ( let suffixToCheck of suffixesThatTriggerItalics ) {
			if ( gaTitle.endsWith(suffixToCheck + ')') ) {
				return `''${firstHalf}'' (${secondHalf})`;
			}
		}
		
		for ( let suffixToCheck of suffixesThatTriggerDoubleQuotes ) {
			if ( gaTitle.endsWith(suffixToCheck + ')') ) {
				return `"${firstHalf}" (${secondHalf})`;
			}
		}
		
		for ( let suffixToCheck of suffixesThatTriggerDoubleQuotesAndItalics ) {
			if ( gaTitle.endsWith(suffixToCheck + ')') ) {
				return `"${firstHalf}" (''${secondHalf}'')`;
			}
		}

		return gaTitle;
	}
}