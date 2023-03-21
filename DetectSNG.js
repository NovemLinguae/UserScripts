// <nowiki>

/*
- Let reviewer know when certain [[WP:SNG]] keywords are detected. This helps to determine if the article meets an obscure SNG and is therefore notable.
- Displays a green bar at the top of unreviewed articles, listing the detected keywords.
- Examples: Pulitzer Prize, Nobel Prize, House of Representatives, Olympics, National Football League, Order of the British Empire
- Long lists include:
	- National legislatures
	- US state legislatures
	- Indian legislatures
	- National supreme courts
	- Literary awards (awards given to books)
	- Professional soccer leagues
	- Boxing titles
	- Highest level cricket matches
	- College football awards
	- Highest gallantry awards (WP:ANYBIO stuff... Medal Of Honor, etc.)
*/

// TODO: update NSPORTS keywords, currently has a bunch from pre-RFC
// TODO: link to relevant SNG
// TODO: put dictionary in a separate file, call it with the API and set cache settings, less network traffic
// TODO: make an offline tool that converts the dictionary to JSON, then just post the JSON, for faster loading

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
		return [...new Set(array)];
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

	async function isReviewed(pageID) {
		let api = new mw.Api();
		let response = await api.get( {
			action: 'pagetriagelist',
			format: 'json',
			page_id: pageID,
		} );

		// no result
		if ( response.pagetriagelist.result !== 'success' || response.pagetriagelist.pages.length === 0 ) {
			return true;
		// 1, 2, or 3
		} else if ( parseInt(response.pagetriagelist.pages[0].patrol_status) > 0 ) {
			return true;
		// 0
		} else {
			return false;
		}
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

	// Only run on unpatrolled pages
	let pageID = mw.config.get('wgArticleId');
	if ( await isReviewed(pageID) ) return;
	
	let wordString = `
	
// WP:NSPORT ***********************************

Canadian Football League, National Football League, American Football League, All-America Football Conference, United States Football League
Tier 1

//https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Football/Fully_professional_leagues
Albanian Superliga, Albanian First Division
Algerian Ligue Professionnelle 1, Algerian Ligue Professionnelle 2
Argentine Primera División, Primera B Nacional, Primera B Metropolitana
A-League
Austrian Football Bundesliga, Austrian Football Second League
Azerbaijan Premier League
Belarusian Premier League,
Belgian First Division A, Belgian First Division B
Bolivian Primera División
Premier League of Bosnia and Herzegovina
Campeonato Brasileiro Série A, Campeonato Brasileiro Série B, Campeonato Brasileiro Série C, Campeonato Paulista, Campeonato Mineiro, Campeonato Carioca, Campeonato Gaúcho, Campeonato Paraibano, Campeonato Pernambucano, Campeonato Paranaense
First Professional Football League
Canadian Premier League, Major League Soccer, USL Championship, USL League One, North American Soccer League
Chilean Primera División
Chinese Super League, China League One, China League Two
Categoría Primera A
Liga FPD
Croatian First Football League
Cypriot First Division
Czech First League, Czech National Football League
Danish Superliga
Liga Dominicana de Fútbol
Ecuadorian Serie A
Egyptian Premier League
Premier League, English Football League
Veikkausliiga
Ligue 1, Ligue 2
Bundesliga, 2. Bundesliga, 3. Liga
Ghana Premier League
Super League Greece, Super League Greece 2, Gamma Ethniki
Liga Nacional de Fútbol Profesional de Honduras
Hong Kong Premier League, Hong Kong First Division League
Nemzeti Bajnokság I
Indian Super League, I-League
Liga 1
Persian Gulf Pro League
Iraqi Premier League
Israeli Premier League, Liga Leumit
Serie A, Serie B, Serie C
J1 League, J2 League, J3 League
Jordanian Pro League
Kazakhstan Premier League
Malaysia Super League
Liga MX, Ascenso MX 
Moldovan National Division
Botola
Myanmar National League
Eredivisie, Eerste Divisie
A-League
Nigerian Professional Football League
Eliteserien
Paraguayan Primera División, Paraguayan División Intermedia
Peruvian Primera División, Peruvian Segunda División
Philippine Premier League, Philippines Football League 
Ekstraklasa, I liga
Primeira Liga, LigaPro
Qatar Stars League
Liga I
Russian Premier League, Russian Football National League
Saudi Professional League
Scottish Premiership, Scottish Championship
Serbian SuperLiga, Serbian First League
Singapore Premier League
Slovak Super Liga
Slovenian PrvaLiga
South African Premier Division, National First Division
K League 1, K League 2
La Liga, Segunda División
Allsvenskan
Swiss Super League
Syrian Premier League
Thai League 1
Tunisian Ligue Professionnelle 1
Süper Lig
Ukrainian Premier League, Ukrainian First League, Ukrainian Second League
UAE Pro-League
Major League Soccer, USL Championship, USL League One
USSF Division 2 Professional League, USL First Division, North American Soccer League, North American Soccer League, American Soccer League, American Soccer League, Eastern Professional Soccer League, United Soccer League, National Professional Soccer League, United Soccer Association, American Professional Soccer League, A-League, 1995 USISL Professional League, 1996 USISL Professional League, 1996 USISL Select League
Uruguayan Primera División, Uruguayan Segunda División
Venezuelan Primera División, Venezuelan Segunda División
V.League 1
First League of Serbia and Montenegro
Yugoslav First League

Campeonato Brasileiro de Futebol Feminino Série A1
FA Women's Super League
Serie A
WE League
Primera División
National Women's Soccer League
Women's Professional Soccer, Women's United Soccer Association

Olympics, IAAF World Championships in Athletics, IAAF World Indoor Championships in Athletics, IAAF World Cross Country Championships, IAAF World Half Marathon Championships
European Athletics Championships, Commonwealth Games, World Major Marathons
Tokyo Marathon, Boston Marathon, London Marathon, Berlin Marathon, Chicago Marathon, New York Marathon
IAAF Diamond League, IAAF Golden League, Asian Games, IAAF Gold Label Road Race
IAAF World Junior Championships, Youth World Championships
IAAF World Championships
National Track and Field Hall of Fame, Road Runners Club of America Hall of Fame

Australian Football League, AFL Women's
Victorian Football League

BWF World Championships
Continental Championships, BWF Super Series, BWF World Tour, Commonwealth Games
Canadian Open, German Open, Slovak International
BWF Grand Prix Gold and Grand Prix

National Baseball Hall of Fame and Museum, Japanese Baseball Hall of Fame
Major League Baseball, Nippon Professional Baseball, KBO League
World Baseball Classic, Baseball World Cup, Olympics
All-American Girls Professional Baseball League, American Association (19th century), Cuban League, Federal League, Japanese Baseball League, National Association of Professional Base Ball Players, Negro Major Leagues, Players' League, Union Association

American Basketball Association, Liga ACB, EuroLeague, National Basketball Association, National Basketball League (Australia), National Basketball League (United States), Lega Basket Serie A, Women's National Basketball Association, Greek Basket League, Israeli Basketball Premier League
NBA draft
Continental Basketball Association, NBA G League

International Boxing Federation, World Boxing Association, World Boxing Council, World Boxing Organization, NYSAC
International Female Boxers Association, International Women's Boxing Federation, Women's International Boxing Association, Women's International Boxing Federation

// https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Boxing/Title_Assessment
African Boxing Union
Asian Boxing Council
Australian National Boxing Federation
Boxing Union of Ireland
British Boxing Board of Control
Central American Boxing Federation
Commonwealth Boxing Council
European Boxing Union
International Boxing Federation Pan Pacific
National Sporting Club
North American Boxing Association
North American Boxing Federation
North American Boxing Organization
Oriental and Pacific Boxing Federation
United States Boxing Association
World Boxing Association EUROPE
World Boxing Association FEDELATIN
World Boxing Association Oceania
World Boxing Council Silver
World Boxing Organization European
World Boxing Organization Inter-Continental
World Boxing Organization Asia Pacific
World Boxing Organization Oriental

// https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Cricket/Official_cricket
Sheffield Shield
County Championship
Bob Willis Trophy
Irani Cup
Plunket Shield
Pentangular Trophy
Quaid-e-Azam Trophy
Sunfoil Series
Regional Four Day Competition
Marsh One-Day Cup
Friends Provident Trophy
Pro40
Benson & Hedges Cup
ECB 40
Royal London One-Day Cup
Deodhar Trophy
Ford Trophy
Quaid-e-Azam One Day Cup
Pakistan Cup
Momentum One Day Cup
Regional Super50
Afghanistan Premier League
KFC Twenty20 Big Bash
Big Bash League
Bangladesh Premier League
T20 Blast
Indian Cricket League
Indian Premier League
Super Smash
Super 8 Twenty20 Cup
Pakistan Super League
National T20 Cup
CSA T20 Challenge
Mzansi Super League
Sri Lanka Premier League
Lanka Premier League
Masters Champions League
Abu Dhabi T20 Trophy
Stanford 20/20
Caribbean Twenty20
Caribbean Premier League
Champions League Twenty20
Twenty20 International
World T20, Global Qualifier
ICC Trophy, ICC World Cup Qualifier, Women's Cricket World Cup Qualifier, ICC World Twenty20 Qualifier, ICC Women's World Twenty20 Qualifier
The Hundred (cricket)

World Curling Tour, Grand Slam of Curling
World Curling Championships, World Mixed Doubles Curling Championship
World Junior Curling Championships, World Senior Curling Championships, European Curling Championships, World Mixed Curling Championship, Pacific-Asia Curling Championships
The Brier, Tim Hortons Brier, Tournament of Hearts
Canadian Junior Curling Championships
Canadian Mixed Curling Championship, Canadian Senior Curling Championship, Canadian Mixed Doubles Curling Trials
Continental Cup of Curling, Canadian Olympic Curling Trials, TSN Skins Game, Canada Cup of Curling
Canadian Curling Hall of Fame, WCF Hall of Fame

UCI World Tour

// https://en.wikipedia.org/wiki/Grand_Tour_(cycling)
Giro d'Italia, Tour de France, Vuelta a España

// https://en.wikipedia.org/wiki/Cycling_monument
Milan–San Remo
Belgium Tour of Flanders
France Paris–Roubaix
Belgium Liège–Bastogne–Liège
Italy Giro di Lombardia
UCI World Championships, UCI World Cup
World University Cycling Championship

// https://en.wikipedia.org/wiki/UCI_race_classifications
Tour de France
Tour of Flanders
Paris–Roubaix
Liège–Bastogne–Liège
Tour de Suisse
UAE Tour
Paris–Tours
Kuurne-Brussels-Kuurne
Arctic Race of Norway
Tour of Utah
Tour de Langkawi
Tour of Slovenia
Tour de Yorkshire
Vuelta a San Juan
Le Samyn
Tour de Taiwan
Tour of Slovakia
Tour of Thailand
UCI Women's team
UCI World Championships, UCI World Cup

Pan American Games
FEI World Equestrian Games
Eventing World Championship, Show Jumping World Championships, or Dressage World Championship, Combined Driving World Championships, Endurance World Championships, World Vaulting Championships
FEI World Cup

World Figure Skating Championships
World Junior Figure Skating Championships, European Figure Skating Championships, Four Continents Figure Skating Championships
ISU Grand Prix of Figure Skating, Skate America, Skate Canada International, Internationaux de France, Cup of China, Rostelecom Cup, NHK Trophy, Bofrost Cup on Ice, Grand Prix of Helsinki
Nebelhorn Trophy, the Karl Schäfer Memorial, Golden Spin of Zagreb
World Figure Skating Hall of Fame
U.S. Figure Skating Hall of Fame

Ryder Cup,  Presidents Cup, Solheim Cup
World Golf Hall of Fame
PGA Tour, LPGA Tour, European Tour, PGA Tour Champions
U.S. Amateur, British Amateur
Men's major golf championships, Women's major golf championships, Senior major golf championships
PGA Tour, LPGA Tour, European Tour, Champions Tour

World Artistic Gymnastics Championships
International Gymnastics Hall of Fame
Youth Olympic Games
Pan American Games, Asian Games, Commonwealth Games, European Championships, Pacific Rim Championships

Eclipse Award
National Hockey League, Czech Extraliga, Liiga, Kontinental Hockey League, Swedish Hockey League, Soviet Championship League, Czechoslovak First Ice Hockey League, World Hockey Association
Mestis, Deutsche Eishockey Liga, Slovak Extraliga, HockeyAllsvenskan, National League (ice hockey), American Hockey League
Eishockey Liga, Belarusian Extraleague, DEL2, GET-ligaen, ECHL, Elite Ice Hockey League, Ontario Hockey League, Quebec Major Junior Hockey League, Western Hockey League, Elite.A, Beneliga
Atlantic Hockey, Big Ten Conference, ECAC Hockey, Hockey East, National Collegiate Hockey Conference, Western Collegiate Hockey Association
NHL Entry Draft

K-1, WMC, ISKA, WAKO-Pro, Glory (kickboxing), It's Showtime, WKN, WBC Muaythai, PKA, WKA
World Muaythai Council, International Sport Karate Association, World Association of Kickboxing Organizations, World Kickboxing Network, World Boxing Council Muaythai, Professional Karate Association, World Kickboxing Association
Lumpinee, Rajadamnern

// https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Mixed_martial_arts/MMA_notability#Current_list_of_notable_MMA_organizations_and_promotions
Bellator Fighting Championships
Invicta Fighting Championships
Shooto
Ultimate Fighting Championship
UFC
Affliction Entertainment
Dream (mixed martial arts)
Fighting Network Rings
Jewels (mixed martial arts)
Pride Fighting Championships
Strikeforce	X
World Extreme Cagefighting
World Victory Road

Sherdog, Fight Matrix

Trans-Am Series
American Championship Car Racing, 24 Hours of Le Mans
NASCAR Cup, Formula One, IndyCar, World Rally Championship, A1GP, IMSA
World Rally Car, A1 Grand Prix, Championship Auto Racing Teams, International Motor Sports Association

World Orienteering Championships, European Orienteering Championship
H21E, D21E, O-Ringen
Junior World Orienteering Championships
World Orienteering Championships
Tiomila, Jukola relay

Calgary Stampede, Canadian Finals Rodeo, National Finals Rodeo, National Finals Rodeo (Australia)
ProRodeo Hall of Fame, Canadian Pro Rodeo Hall of Fame, National Cowboy & Western Heritage Museum Rodeo Hall of Fame, National Cowgirl Museum and Hall of Fame, Bull Riding Hall of Fame

Rugby League World Cup, Rugby League Four Nations, Pacific Cup, Rugby League European Cup
National Rugby League
Super League
Challenge Cup

// https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Rugby_union/Notability_criteria
Anglo-Welsh Cup
European Rugby Champions Cup
European Rugby Challenge Cup
Super Rugby
United Rugby Championship
Australian Rugby Championship, National Rugby Championship
English Premiership, RFU Championship
Top 14, Pro D2
Japan Rugby League One, Top League
Bunnings NPC
National Provincial Championship, Air New Zealand Cup, ITM Cup, Mitre 10 Cup
Currie Cup
national rugby union team

Rugby World Cup Sevens, World Rugby Sevens Series, Commonwealth Games, Women's Rugby World Cup

Makuuchi, Juryo

International Tennis Hall of Fame
Fed Cup
Davis Cup
Hopman Cup
World Team Cup
Grand slam (tennis)
Australian Open
French Open
Wimbledon
US Open
ATP World Tour
WTA Tour, WTA Premier, WTA International, WTA Tour Championship
ATP Challenger
ITF Women's Circuit, WTA 125K
International Tennis Federation, Association of Tennis Professionals, Women's Tennis Association
Grand Slam
ITF Junior Circuit, Junior ITF

Commonwealth Games
ITU World Triathlon Series, ITU Triathlon World Cup
International Triathlon Union
ITU Continental Championship
Ironman World Championship, Ironman 70.3 World Championship
XTERRA Triathlon championship

// https://en.wikipedia.org/wiki/Template:College_football_award_navbox
AFCA Coach of the Year Award
AFCA Coach of the Year#Assistant Coach of the Year Award
American Athletic Conference football individual awards
Amos Alonzo Stagg Award
Archie Griffin Award
Associated Press College Football Coach of the Year Award
Associated Press College Football Player of the Year
Atlantic Coast Conference football individual awards
Big 12 Conference football individual awards
Big East Conference football individual awards
Big Ten Conference football individual awards
Bobby Bowden National Collegiate Coach of the Year Award
Bobby Dodd Coach of the Year Award
Bronko Nagurski Trophy
Broyles Award
Buck Buchanan Award
Burlsworth Trophy
Butkus Award
Champ Pickens Trophy
Chic Harley Award
Chuck Bednarik Award
College Football All-America Team
College Football Hall of Fame
Conerly Trophy
Davey O'Brien Award
Disney's Wide World of Sports Spirit Award
Doak Walker Award
Dudley Award
Earl Campbell Tyler Rose Award
Eddie Robinson Award
Eddie Robinson Coach of the Year Award
Fred Biletnikoff Award
Gagliardi Trophy
George Munger Award
Harlon Hill Trophy
Heisman Trophy
Home Depot Coach of the Year Award
Jacobs Blocking Trophy
Jerry Rice Award
Jet Award
Jim Thorpe Award
Joe Moore Award
John Mackey Award
Johnny Unitas Golden Arm Award
Jon Cornish Trophy
Joseph V. Paterno Award
Kent Hull Trophy
Liberty Mutual Coach of the Year Award
List of Football Academic All-America Team Members of the Year
List of Senior CLASS Award football winners
Lombardi Award
Lott Trophy
Lou Groza Award
Manning Award
Maxwell Award
Maxwell Football Club
Melberger Award
Mickey Charles Award
Mid-American Conference football individual awards
NAIA Football Player of the Year Award
National Football Foundation
National Football Foundation Distinguished American Award
National Football Foundation Gold Medal Winners
Nils V. "Swede" Nelson Award
Norris Cup
Outland Trophy
Pac-12 Conference football individual awards
Patrick Mannelly Award
Paul "Bear" Bryant Award
Paul Hornung Award
Peter Mortell Holder of the Year Award
Porter Cup (trophy)
Ray Guy Award
Rimington Trophy
Rudy Awards
Southeastern Conference football individual awards
Southwest Conference football individual awards
Sporting News College Football Coach of the Year
Sporting News College Football Player of the Year
STATS FCS Coach of the Year
STATS FCS Defensive Player of the Year
STATS FCS Freshman Player of the Year
STATS FCS Offensive Player of the Year
Ted Hendricks Award
Theodore Roosevelt Award
Touchdown Club of Columbus
UPI College Football Player of the Year
Walter Camp Alumni of the Year
Walter Camp Award
Walter Camp Coach of the Year Award
Walter Camp Football Foundation
Walter Camp Man of the Year
Walter Payton Award
Washington D.C. Touchdown Club
William V. Campbell Trophy
Wuerffel Trophy

NCAA Division I
College Football Hall of Fame

National Football League (Ireland)

Olympics, Paralympic

// WP:POLITICIAN ===========================================================

// federal legislatures
// https://en.wikipedia.org/wiki/List_of_legislatures_by_country
// I simplified some of the repetitive ones from here down into one entry. If I need to reverse that for some reason, check the page history of the script: https://en.wikipedia.org/w/index.php?title=User:Novem_Linguae/Scripts/DetectSNG.js&oldid=1035024105
Althing
American Samoa House of Representatives
American Samoa Senate
Arab Parliament
Argentine Chamber of Deputies
Argentine Senate
Assembly of French Polynesia
Assembly of North Macedonia
Assembly of Representatives (Tajikistan)
Assembly of Turkmenistan
Assembly of Vojvodina
Assembly of the Representatives of the People
Assembly of the Republic (Mozambique)
Assembly of the Republic (Northern Cyprus)
Assembly of the Republic (Portugal)
Assembly of the Union of the Comoros
Australian Senate
Bangsamoro Parliament
Basque Parliament
Brazilian Senate
Bundesrat of Germany
Bundestag
Central American Parliament
Chamber of Deputies (Brazil)
Chamber of Deputies (Equatorial Guinea)
Chamber of Deputies (Haiti)
Chamber of Deputies (Italy)
Chamber of Deputies (Luxembourg)
Chamber of Deputies (Mexico)
Chamber of Deputies (Romania)
Chamber of Deputies (Rwanda)
Chamber of Deputies of Chile
Chamber of Deputies of Paraguay
Chamber of Deputies of the Czech Republic
Chamber of Deputies of the Dominican Republic
Chamber of Representatives (Belgium)
Chamber of Representatives of Colombia
Chamber of Representatives of Uruguay
Chinese People's Political Consultative Conference
Congress of Deputies (Spain)
Congress of Guatemala
Congress of New Caledonia
Congress of the Federated States of Micronesia
Congress of the Republic of Peru
Consultative Assembly of Qatar
Consultative Assembly of Saudi Arabia
Consultative Council (Bahrain)
Corsican Assembly
Council of Representatives (Bahrain)
Council of Representatives of Iraq
Council of States (South Sudan)
Council of States (Sudan)
Council of States (Switzerland)
Council of the European Union
Council of the Nation
Council of the Republic of Belarus
Croatian Parliament
Dewan Negara
Dewan Rakyat
Dáil Éireann
Estates of Aruba
Estates of Curaçao
Estates of Sint Maarten
European Parliament
Federal Council (Austria)
Federal National Council
Federation Council (Russia)
Folketing
General Council (Andorra)
General Fono
Gibraltar Parliament
Grand National Assembly of Turkey
Grand and General Council
Hellenic Parliament
House of Assembly (Anguilla)
House of Assembly (Kiribati)
House of Assembly (Turks and Caicos Islands)
House of Assembly (Zimbabwe)
House of Assembly of Barbados
House of Assembly of Bermuda
House of Assembly of Dominica
House of Assembly of Eswatini
House of Assembly of Saint Lucia
House of Assembly of Saint Vincent and the Grenadines
House of Assembly of the British Virgin Islands
House of Commons of Canada
House of Commons of the United Kingdom
House of Councillors (Japan)
House of Councillors (Morocco)
House of Delegates of Palau
House of Elders (Afghanistan)
House of Elders (Somaliland)
House of Federation
House of Keys
House of Lords
House of Nationalities
House of Peoples of Bosnia and Herzegovina
House of Peoples' Representatives
House of Representatives
House of the People (Afghanistan)
House of the People of Somalia
Inatsisartut
Islamic Consultative Assembly
Island Council (Pitcairn)
Jatiya Sangsad
Knesset
Kurdistan Region Parliament
Landtag of Liechtenstein
Landtag of South Tyrol
Latin American Parliament
Legislative Assembly
Legislative Chamber of Uzbekistan
Legislative Council of Brunei
Legislative Council of Hong Kong
Legislative Council of Saint Helena
Legislative Council of the Isle of Man
Legislative Yuan
Legislature of Guam
Legislature of the Marshall Islands
Legislature of the Virgin Islands
Lok Sabha
Løgting
Mauritanian Parliament
Mazhilis
Mercosur Parliament
National Assembly
National Congress of Honduras
National Council (Austria)
National Council (Bhutan)
National Council (Monaco)
National Council (Namibia)
National Council (Slovakia)
National Council (Slovenia)
National Council (Switzerland)
National Council of Provinces
National Legislative Assembly (South Sudan)
National Parliament (East Timor)
National Parliament of Papua New Guinea
National Parliament of the Solomon Islands
National People's Assembly (Guinea-Bissau)
New Zealand House of Representatives
New Zealand Parliament
Niue Assembly
Northern Ireland Assembly
Northern Mariana Islands House of Representatives
Northern Mariana Islands Senate
Palestinian Legislative Council
Pan-African Parliament
Parliament of
People's Assembly of Abkhazia
People's Council of Syria
People's Council of Turkmenistan
People's Council of the Donetsk People's Republic
People's Council of the Luhansk People's Republic
People's Majlis
People's National Assembly
People's Representative Council
Pontifical Commission for Vatican City State
President of Ireland
President of Malta
Rajya Sabha
Regional Council of Aosta Valley
Regional Council of Sardinia
Regional Council of Trentino-Alto Adige
Regional Representative Council
Riigikogu
Riksdag
Saeima
Sahrawi National Council
Sark
Scottish Parliament
Seanad Éireann
Seimas
Sejm
Senate (Antigua and Barbuda)
Senate (Belgium)
Senate (Belize)
Senate (Burundi)
Senate (Cameroon)
Senate (Democratic Republic of the Congo)
Senate (Equatorial Guinea)
Senate (France)
Senate (Haiti)
Senate (Ivory Coast)
Senate (Jordan)
Senate (Lesotho)
Senate (Madagascar)
Senate (Netherlands)
Senate (Nigeria)
Senate (Republic of the Congo)
Senate (Rwanda)
Senate (Trinidad and Tobago)
Senate of
Senedd
Serbian Cyrillic alphabet
Sicilian Regional Assembly
State Council of Crimea
State Duma
State Great Khural
States Assembly
States of Alderney
States of Guernsey
Storting
Supreme Assembly of Nakhchivan
Supreme Council (Kyrgyzstan)
Supreme Council (Transnistria)
Supreme Council of the Autonomous Republic of Adjara
Supreme People's Assembly
Territorial Assembly of Wallis and Futuna
Territorial Council of Saint Barthélemy
Territorial Council of Saint Pierre and Miquelon
United States House of Representatives
United States Senate
Upper House (Somalia)
Verkhovna Rada

// USA state legislatures
// https://ballotpedia.org/Official_names_of_state_legislatures
State Legislature
State Senate
House of Representatives
State Assembly
General Assembly
House of Delegates
Massachusetts General Court
New Hampshire General Court

// list of state legislatures for India
// https://en.wikipedia.org/wiki/State_legislative_assemblies_of_India
Legislative Assembly
MLA

// federal supreme courts
// https://en.wikipedia.org/wiki/List_of_supreme_courts_by_country
// I shortened Supreme Court and Constitutional Court
Administrative Court of Austria
Administrative Court of Luxembourg
Benelux Court of Justice
Caribbean Court of Justice
Conseil d'État (France)
Constitutional Council (Cambodia)
Constitutional Council (France)
Constitutional Council (Lebanon)
Constitutional Council (Senegal)
Constitutional Council of Chad
Constitutional Council of Kazakhstan
Constitutional Court
Constitutional Tribunal (Poland)
Constitutional Tribunal of Myanmar
Council of State
Council of State (Colombia)
Council of State (Greece)
Council of State (Netherlands)
Council of Twelve (San Marino)
Court of Appeal (Botswana)
Court of Appeal of Kiribati
Court of Appeal of Samoa
Court of Appeal of Solomon Islands
Court of Appeal of Tanzania
Court of Appeal of Tonga
Court of Appeal of Tuvalu
Court of Audit (Greece)
Court of Bosnia and Herzegovina
Court of Cassation
Court of Cassation (Belgium)
Court of Cassation (Democratic Republic of the Congo)
Court of Cassation (France)
Court of Cassation (Jordan)
Court of Cassation (Lebanon)
Court of Cassation (Senegal)
Court of Cassation (Tunisia)
Court of Cassation of Qatar
Court of Cassation of Turkey
Court of Civil Appeals of Malta
Court of Criminal Appeals of Malta
Court of Final Appeal (Hong Kong)
Court of Final Appeal (Macau)
Court of Jurisdictional Disputes
Court of Justice of Suriname
Eastern Caribbean Supreme Court
EFTA Court
European Court of Human Rights
European Court of Justice
Federal Administrative Court of Germany
Federal Constitutional Court of Germany
Federal Court of Justice of Germany
Federal Court of Malaysia
Federal Finance Court of Germany
Federal Labour Court of Germany
Federal Shariat Court
Federal Social Court of Germany
Federal Supreme Court of Ethiopia
Federal Supreme Court of Switzerland
Federal Supreme Court of the United Arab Emirates
High Court of Appeal of Kuwait
High Court of Australia
High Court of Cassation and Justice
High Court of Eritrea
High Court of Eswatini
High Court of Justice (Benin)
High Court of Justiciary
High Court of Lesotho
Judicial Committee of the Privy Council
Judicial Yuan
Judiciary of Bahrain
Judiciary of Egypt
Judiciary of Jamaica
Judiciary of Niger
Judiciary of Northern Cyprus
Judiciary of Somalia
Judiciary of Syria
Magistral Court of the Sovereign Military Order of Malta
National Court of Ecuador
People's Supreme Court of Cuba
People's Supreme Court of Laos
Plurinational Constitutional Court
Privy Council of Tonga
South Sudan Supreme Court
Standing Committee of the National People's Congress
Superior Court of Justice (Andorra)
Superior Court of Justice (Luxembourg)
Supreme Administrative Court of Bulgaria
Supreme Administrative Court of Finland
Supreme Administrative Court of Poland
Supreme Administrative Court of Slovakia
Supreme Administrative Court of Sweden
Supreme Administrative Court of the Czech Republic
Supreme Civil and Criminal Court of Greece
Supreme Constitutional Court of Egypt
Supreme Constitutional Court of Palestine
Supreme Constitutional Court of Syria
Supreme Court
Supreme Federal Court
Supreme Judicial Council of Saudi Arabia
Supreme People's Court
Supreme People's Court of Vietnam
Supreme Special Court
Supreme Tribunal of Justice (Venezuela)
Turkish Council of State

// WP:NBIO ===================================================

Dictionary of National Biography
Presidential Medal of Freedom, Congressional Gold Medal, Order of the British Empire, GBE, KBE, CBE
Metropolitan Museum of Art, National Gallery of Art, Museum of Modern Art, Art Institute of Chicago, Heard Museum
Governor

// https://en.wikipedia.org/wiki/Template:Highest_gallantry_awards
Armed Forces of the Philippines Medal of Valor
Bir Sreshtho
Bundeswehr Cross of Honour for Valour
Castle of Good Hope Decoration
Cross of Liberty (Estonia)
Cross of Valour (Greece)
Cross to the Heroic Valour in Combat
Gold Medal of Military Valour
Grand Cross of Valour
Grass Crown
Hero of Artsakh
Hero of Belarus
Hero of the Russian Federation
Hero of the Soviet Union
Hero of Ukraine
Knight's Cross of the Iron Cross
Laureate Cross of Saint Ferdinand
Laureate Plate of Madrid
Legion of Honour
Mannerheim Cross
Medal of Bravery (Hungary)
Medal of Honor
Medal of Valor (Israel)
Military Medal for Gallantry
Military Merit Medal (Vietnam)
Military Merit Order (Württemberg)
Military Order of Maria Theresa
Military Order of Max Joseph
Military Order of St. Henry
Military William Order
National Hero of Armenia
National Hero of Azerbaijan
Nishan-e-Haider
Nkwe ya Gauta
Order of August First
Order of Bravery
Order of Duke Domagoj
Order of Fath
Order of Freedom (Yugoslavia)
Order of Karađorđe's Star
Order of Katonga
Order of Lāčplēsis
Order of Michael the Brave
Order of Rama
Order of Saint Louis
Order of the Golden Kite
Order of the Sword
Order of the Tower and Sword
Param Vir Chakra
Parama Weera Vibhushanaya
Pour le Mérite
Seri Pahlawan Gagah Perkasa
Valour Cross
Victoria Cross
Victoria Cross (Canada)
Victoria Cross for Australia
Victoria Cross for New Zealand
Virtuti Militari
War Cross (Norway)

// WP:NPROF ===================================================

Swedish Academy of Sciences

Nobel Prize, MacArthur Fellowship, Fields Medal, Bancroft Prize, Pulitzer Prize for History
Guggenheim Fellowship, Linguapax Prize

Institute of Electrical and Electronics Engineers, Geological Society of America, American Society for Neurochemistry

Fellow
President, Chancellor, Provost
Named Chair

chief editor, head editor, editor-in-chief

// WP:NASTRO ==============================================

HR catalogue
Messier catalogue, Caldwell catalogue

// WP:NBOOK =================================================

// https://en.wikipedia.org/wiki/List_of_literary_awards
Ōe Kenzaburō Prize
Śląkfa
9mobile Prize for Literature
Academia Rossica
Adriano González León Biennial Novel Prize
Aga Khan Prize for Fiction
Agatha Award
Agatha Christie Award (Japan)
Aiken Taylor Award for Modern American Poetry
Akutagawa Prize
Alan Paton Award
Alba Bouwer Prize
Ambassador Book Award
America Award in Literature
American Academy of Arts and Letters Gold Medals
American Book Awards
American Literary Translators Association
Amstel Playwright of the Year Award
Ananda Puraskar
Angelus Award
Angus Book Award
Anisfield-Wolf Book Award
Anthony Award
Anton Wildgans Prize
Arab American Book Award
Arthur C. Clarke Award
Arthur Ellis Award
Arthur Ellis Awards
Arthur Rense Prize
Asian American Literary Awards
Asian/Pacific American Awards for Literature
Astrid Lindgren Memorial Award
ATKV Prose Prize
Atlantic Book Awards & Festival
Augustpriset
Aurealis Award
Austrian State Prize for European Literature
Author's Club First Novel Award
Autumn House Press
Ayukawa Tetsuya Award
Babishai Niwe Poetry Foundation
Bagutta Prize
Balint Balassi Memorial Sword Award
Bancroft Prize
Bangla Academy Award
Banipal Prize for Arabic Literary Translation
Bankim Puraskar
Barry Award (for crime novels)
Barry Ronge Fiction Prize
Batty Weber Prize
Baumgarten Prize
Bertelsmann-Preisausschreiben
Bertolt-Brecht-Literaturpreis
Bessie Head Literature Awards
Best Translated Book Award
Betty Trask Award
Bialik Prize
Bing Xin Children's Literature Award
Bobbitt National Prize for Poetry
Bollingen Prize
Booker Prize
Bookseller/Diagram Prize for Oddest Title of the Year
Bram Stoker Award
British Book Awards
British Sports Book Awards
Brunel University African Poetry Prize
BSFA award
Bungei Prize
Burt Award for First Nations, Métis and Inuit Literature
C.P. Hoogenhout Award
Caine Prize
Caldecott Honor
Camões Prize
Campbell award (best novel)
Canadian Jewish Book Awards
Candide
Candide Preis
Carl Zuckmayer
Carnegie Medal (literary award)
Carol Bolt Award
Cartier Diamond Dagger
Casa de las Américas Prize
CASEY Award
CBI Book of the Year Awards
Center for Fiction First Novel Prize
Central News Agency Literary Award
Chancellor's Gold Medal
Chandler Award
Children's Laureate
Children's Literature Legacy Award
Chilean National Prize for Literature
Christopher Hewitt Award
Colby Award
Colorado Book Award
Common Wealth Award of Distinguished Service
Commonwealth Short Story Prize
Commonwealth Writers' Prize
Compton Crook Award
Contemporary Literature (Hyundae Munhak) Award
Coretta Scott King Award
Costa Book Awards
Crime Writers' Association
Croatia rediviva: Ča, Kaj, Što - baštinski dani
Cundill Prize
CWA Ian Fleming Steel Dagger
Dagger in the Library
Dagger of Daggers
Dana Award
Danuta Gleed Literary Award
Dave Moore Award
David Higham Prize for Fiction
Davitt Award
Dayne Ogilvie Prize
Dayton Literary Peace Prize
Dazai Osamu Prize
De Nios Stora Pris
debut novel
Deutscher Jugendliteraturpreis
Dinaane Debut Fiction Award
Ditmar Award
Dong-in Literary Award
Donna J. Stone National Literary Awards
Dorothy Canfield Fisher Children's Book Award
Dos Passos Prize
Doug Wright Award
Dream of the Red Chamber Award
Drue Heinz Literature Prize
DSC Prize for South Asian Literature
Duff Cooper Prize
Duncan Lawrie International Dagger
Dundee International Book Prize
Edasseri Award
Edgar Award
Edna Staebler Award
Edogawa Rampo Prize
Edward Lewis Wallant Award
Encore Award
Endeavour Award
Epigram Books
Erdal Oz Literature Award
Erich Fried Prize
Esther Glen Award
Etisalat Award for Arabic Children's Literature
Etisalat Prize for Literature
Eugène Marais Prize
European Book Prize
European Union Prize for Literature
Exclusive Books Boeke Prize
Ezhuthachan Puraskaram
Fabri Literary Prize
Fabula Award
Feldkircher Lyrikpreis
FIL Award
Finlandia Prize
Flaiano Prize
Flannery O'Connor Award for Short Fiction
Fontane Prize of the City of Neuruppin
Forward Prize
Found in Translation Award
Francis MacManus Award
Frankfurt Book Fair
Franz Kafka Prize
Friedebert Tuglas short story award
Frost Medal
Gdynia Literary Prize
Geffen Award
Gelett burgess children's book award
Geoffrey Bilson Award
Georg Büchner
Georg Büchner Prize
Gerald Lampert Award
German Book Prize
Glass Key award
Gold Dagger
Golden Baobab Prize
Golden Wreath of Struga Poetry Evenings
Goldsmith Book Prize
Goldsmiths Prize
Goodreads Choice Awards
Gotham Book Prize
Governor General's Award
Governor General's Award for English language children's literature
Governor General's Award for French language children's literature
Grand Prix de Littérature Policière
Grand prix du roman de l'Académie française
Grand prix littéraire d'Afrique noire
Grand Prix of Literary Associations
Gratiaen Prize
Gregory Kolovakos Award
Griffin Poetry Prize
Guardian Children's Fiction Prize
Halldis Moren Vesaas Prize
Hammett Prize
Hans Christian Andersen Award
Hans Fallada
Hanseatic Goethe Prize
Harold Morton Landon Translation Award
Harvill Secker
Hawthornden Prize
Heinrich Heine Prize
Heinrich Mann Prize
Helen and Kurt Wolff Translator's Prize
Helmerich Award
Helsingin Sanomat Literature Prize
Hemingway Foundation/PEN Award
Herman Voaden Playwriting Competition
Hermann Kesten Medal
Hermann-Hesse-Preis
Hertzog Prize
Hessell-Tiltman Prize
Hilary Weston Writers' Trust Prize for Nonfiction
Hispanic Heritage Foundation
Ho-Am Prize in the Arts
Honkaku Mystery Award
Honkaku Mystery Writers Club of Japan
Hopwood Award
Hugo Award
Icelandic Literary Prize
Ingeborg Bachmann Prize
Ingrid Jonker Prize
Innis-Gérin Medal
International Botev Prize
International Dublin Literary Award
International Prize for Arabic Fiction
International Rubery Book Award
Irish Book Awards
Isidora Sekulić Award
Izumi Kyōka Prize for Literature
Jakarta Arts Council Novel Competition
Jalal Al-e Ahmad Literary Awards
James Duval Phelan Award
James Jones First Novel Award
James Laughlin Award
James Tait Black Memorial Prize
James Tiptree, Jr. Award
Jan Michalski Prize for Literature
Jane Addams Children's Book Award
Janet Heidinger Kafka Prize
Janusz A. Zajdel Award
Japan Adventure Fiction Association Prize
Japan Fantasy Novel Award
Jenko Award
Jerry Malloy Book Prize
Jerusalem Prize
Jnanpith Award
Joaquín Gallegos Lara National Fiction Prize
Johann Wolfgang von Goethe
John Esten Cooke
John Glassco Translation Prize
John Llewellyn Rhys Prize
John W. Campbell Award for Best New Writer
Joseph Henry Jackson Award
Joy Cowley Award
Juhan Smuul literary award
Kanaka Shree
Kassel Literary Prize
Katara Prize for Arabic Novel
Kate Greenaway Medal
Kate Tufts Discovery Award
Kerala Sahitya Academy Award
Kikuchi Kan Prize
King Faisal International Prize
Kingsley Tufts Poetry Award
Kiriyama Prize
Kitschies
Kleist Prize
Kościelski Award
Kobzar Literary Award
KONS International Literary Award
Kossuth Prize
Kresnik Award
Kumar Suvarna Chandrak
Kurd-Laßwitz-Preis
Lambda Literary Award
Lane Anderson Award
Langhe Ceretto Prize
Lannan Literary Awards
Lao She Literary Award
Le PLIB
Left Coast Crime
Leipzig Book Fair Prize
Levstik Award
Locus Award
Lord Ruthven Award
Lorne Pierce Medal
Los Angeles Times Book Prize
Lotus Prize for Literature
Lu Xun Literary Prize
M-Net Literary Awards
Macavity Award
Madan Puraskar
Magnesia Litera Prize
Maharashtra Sahitya Parishad Puraskar
Maharashtra State Award for literature
Mainchi Cultural prizes
Malaysia Premier's Literary Award
Man Asian Literary Prize
Man Booker International Prize
Manhae Prize
Mao Dun Literature Prize
Margaret Mahy Award
Marsh Award for Children’s Literature in Translation
Marsh Award for Children's Literature in Translation
Marsh Biography Award
Martin Beck Award
Mary Tanenbaum Award for Nonfiction
Maskew Miller Longman Literature Awards
McNally Robinson Aboriginal Book of the Year Award
McNally Robinson Book of the Year Award
Media24 Books Literary Awards
Mephisto Prize
Meyer-Whitworth Award
Michael Braude Award for Light Verse
Michael L. Printz Award
Miguel de Cervantes Prize
Mildred L. Batchelder Award
Miles Franklin Award
Milton Acorn
Minnesota Book Awards
Mishima Yukio Prize
Montreal International Poetry Prize
Muttathu Varkey Award
Mystery Writers of America
Mystery Writers of Japan
Mystery Writers of Japan Award
Nagrada August Šenoa
Nagrada Ksaver Šandor Gjalski
Naguib Mahfouz Medal for Literature
Naoki Prize
Narmad Suvarna Chandrak
National Arts Merit Awards
National Book Award
National Book Critics Circle Award
National Hispanic Cultural Center
National Jewish Book Award
National Outdoor Book Award
National Poetry Series
National Prize for Literature (Spain)
National Translation Award
Native Writers' Circle of the Americas
Nautilus Award
Nautilus Book Awards
NBU-prisen
Nebula Award
Ned Kelly Awards
Nelly Sachs Prize
Nestlé Smarties Book Prize
Neustadt International Prize for Literature
New South Wales Premier's Literary Awards
New Zealand Post Book Awards
Newbery Honor
Newbery Medal
Newdigate Prize
Newman Prize for Chinese Literature
Next Generation Indie Book Awards
Ngaio Marsh Award
Nienke van Hichtum-prijs
Nigeria Prize for Literature
Nihon SF Taisho Award
Nike Award
NIN Award
Nobel Prize in Literature
Noma Award for Publishing in Africa
Noma Prize
Nordic Council's Literature Prize
Norma Fleck Award
Norwegian Academy of Literature and Freedom of Expression
Norwegian Academy Prize in memory of Thorleif Dahl
Norwegian Critics Prize for Literature
Nrupatunga Award
NSK Neustadt Prize for Children's Literature
O. Henry Awards
OCM Bocas Prize for Caribbean Literature
Odakkuzhal Award
Odisha Sahitya Academy Award
Olive Schreiner Prize
Orange Prize for Fiction
Oregon Book Award
Orhan Kemal
Orwell Prize
Outstanding Latino/a Cultural Award in Literary Arts or Publications
Ovid Prize
Oxford-Weidenfeld Translation Prize
Padmarajan Award
Palanca Award
Pampa Award
Paris Literary Prize
Park Kyung-ni Prize
Paszport Polityki
Pat Lowther Award
Patrick White Award
Paul Harland Prize
PEN America
PEN Award for Poetry in Translation
PEN Oakland/Josephine Miles Literary Award
PEN Translation Fund Grants
PEN Translation Prize
PEN/Book-of-the-Month Club Translation Prize
PEN/ESPN Award for Literary Sports Writing
PEN/Faulkner Award for Fiction
PEN/Malamud Award
PEN/Open Book
PEN/Ralph Manheim Medal for Translation
Percy FitzPatrick Award
Percy Janes First Novel Award
Persian Speculative Art and Literature Award
Philip K. Dick Award
Philippine National Book Awards
Poetry Society
Poets' Prize
Portugal Telecom Prize for Literature
Prémio Camões
Prémio Leya
Prémio Literário José Saramago
Prêmio Jabuti
Prêmio Machado de Assis
Prešeren Award
Prešeren Foundation Award
Premanand Suvarna Chandrak
Premi Prudenci Bertrana
Premio Azorín
Premio Aztlán Literary Prize
Premio Bancarella
Premio Campiello
Premio de la Crítica
Premio de Novela Ciudad de Torrevieja
Premio Editorial Costa Rica
Premio Eugenio Espejo
Premio Iberoamericano Planeta-Casa de América de Narrativa
Premio José Rizal de las Letras Filipinas
Premio Nacional de Ciencias y Artes
Premio Nadal
Premio Planeta
Premio Strega
Prime Minister's Awards for Literary Achievement
Prince of Asturias Awards
Pritzker Literature Award
Prix Alain-Fournier
Prix Anne-Hébert
Prix Athanase-David
Prix Aurora Award
Prix Décembre
Prix de Flore
Prix de la Page 112
Prix des Deux-Magots
Prix du Cercle du livre de France
Prix du roman Fnac
Prix Fénéon
Prix Femina
Prix Goncourt
Prix Interallié
Prix Littéraire Valery Larbaud
Prix Médicis
Prix Renaudot
Prix Ringuet
Prix Rosny-Aîné
Prix Sorcières
Prix Tour-Apollo Award
Publishing Innovation Award
Pulitzer Prize
Pulitzer Prize for Drama
Pulitzer Prize for Fiction
Pulitzer Prize for General Non-Fiction
Pulitzer Prize for History
Pulitzer Prize for Poetry
Pura Belpré Award
Pushcart Prize
Pushkin Prize
Queen Mary Wasafiri New Writing Prize
Queensland Premier's Literary Awards
Quill Awards
Rómulo Gallegos Prize
Rabindra Puraskar
Raiziss/de Palchi Translation Awards
Ranjitram Suvarna Chandrak
Rashtrakavi (disambiguation)
ReLit Awards
RITA Award
Rožanc Award
Robert Olen Butler Prize
Rossica Young Translators Prize
Roswitha Prize
Runeberg Prize
Russian Booker Prize
Ruth Lilly Poetry Prize
Ryerson Fiction Award
Ryszard Kapuściński Award for Literary Reportage
São Paulo Prize for Literature
S.E.A.Write Award
SAARC Literary Award
Sahitya Akademi Award
Sahitya Akademi Award to Bengali Writers
Sahitya Gaurav Puraskar
Sait Faik Abasıyanık
Samuel Johnson Prize
Sapir Prize
Saraswati Samman
Schiller Memorial Prize
Scotiabank Giller Prize
Scott Moncrieff Prize
Sedat Simavi Literature Award
Seiun Award
Sense of Gender Awards
Servais Prize
Seymour Medal
SFRA Pioneer Award
Shamus Award
Sheikh Zayed Book Award
Sherwood Anderson Foundation
Shevchenko National Prize
Shi Nai'an Literary Prize
Shirley Jackson Award
Short Story Award
Shota Rustaveli State Prize
SI Leeds Literary Prize
Sibert Medal
Sidewise Award for Alternate History
Sigmund Freud Prize
Silesius Poetry Award
Singapore Literature Prize
Sir Julius Vogel Award
So-Wol Poetry Prize
Sol Plaatje Prize for Translation
Solothurner Literaturpreis
Solzhenitsyn Prize
Somerset Maugham Award
Sor Juana Inés de la Cruz Prize
South African Literary Awards (SALA)
Spur Award
Sriburapha Award
St. Francis College Literary Prize
St. Louis Literary Award
State Literary Award
Staunch Book Prize
Stephen Leacock Award
Stone Award for Lifetime Literary Achievement
Stonewall Book Award
Story Prize
Sunburst Award
Super Dash Novel Rookie of the Year Award
Swedish Crime Writers' Academy
Swiss Book Prize
Sydney Taylor Book Award
Tähtifantasia Award
Tähtivaeltaja Award
T. S. Eliot Prize
Tanizaki Prize
Tasmanian Premier's Literary Prizes
Tchernichovsky Prize
Tchicaya U Tam'si Prize for African Poetry
TD Canadian Children's Literature Award
Thanks for the Book Award
The Australian/Vogel Literary Award
The Best American Poetry series
The Cape Tercentenary Foundation
The Doug Wright Awards
The Eilis Dillon Award
The New Criterion
Theakston's Old Peculier Crime Novel of the Year Award
Thomas D. Clareson Award for Distinguished Service
Thomas Head Raddall Award
Thomas Pringle Award
Tir na n-Og Awards
Tomás Rivera Mexican American Children's Book Award
Toucan Prize
Trillium Award
Tulsa City-County Library
University of Johannesburg Prize
Urania Award
Vallathol Award
Vayalar Award
Veronika Award
Viareggio Prize
Vick Foundation
Victorian Premier's Literary Award
Vilenica Prize
Vinda Karandikar Jeevan Gaurav Puraskar
Vishnupuram Award
W.A Hofmeyr Prize
W.Y. Boyd Literary Award for Excellence in Military Fiction
Wallace Stevens Award
Walt Whitman Award
Warwick Prize for Writing
Waverton Good Read Award
Western Australian Premier's Book Awards
Whiting Awards
William Faulkner – William Wisdom Creative Writing Competition
William Hill Sports Book of the Year
Willis Barnstone Translation Prize
Windham–Campbell Literature Prizes
Winterset Award
Wisława Szymborska Award
Wole Soyinka Prize for Literature in Africa
Wolfson History Prize
World Fantasy Award
Writers of the Future
Writers' Trust of Canada
WSFA Small Press Award
Xavier Villaurrutia Award
Yamamoto Shūgorō Prize
Yasnaya Polyana Literary Award
Yi Sang Literary Award
Yitzhak Sadeh Prize
Yomiuri Prize
Yunus Nadi Abalıoğlu
Yuva Gaurav Puraskar
Yuva Puraskar
Zbigniew Herbert International Literary Award

// WP:NEVENT =========================================================

// no useful content at SNG page

// WP:NFILM ==========================================================

Academy Award, Palme D'or, Camera D'or, Grand Prix (Cannes Film Festival)
United States National Film Registry

// WP:NGEO ==========================================================

Listed building, National Register of Historic Places, World Heritage Site

// WP:NMUSIC ========================================================

// good data here, but too complicated to parse: https://en.wikipedia.org/wiki/Wikipedia:Record_charts
// good data here, but too complicated to parse: https://en.wikipedia.org/wiki/Record_label#Major_labels

Certified Gold, Certified Platinum, Certified Diamond
Grammy Award, Juno Award, Mercury Prize, Choice Music Prize, Grammis

// WP:NNUM ==========================================================

MathWorld, PlanetMath
Online Encyclopedia of Integer Sequence
Dictionary of Curious and Interesting Numbers, Those Fascinating Numbers, erich-friedman.github.io
Mathematical Constants

// WP:NCORP ==========================================================

// no useful content at SNG page

// WP:NWEB ===========================================================

// no useful content at SNG page

	`;
	
	// TODO: get rid of the replace(/championships/) line. because of the use of \b, that is not a good way to do it. maybe copy the entry and add both singular and plural to the dictionary
	wordString = wordString.replace(/^\/\/.*$/gm, ''); // replace comment lines with blank lines. using this approach fixes a bug involving // and comma on the same line
	let wordArray = wordString.replace(/, /g, "\n")
		.trim()
		.split("\n")
		.map(v => v.trim())
		.map(v => v.replace(/championships/i, 'championship'))
		.filter(v => v != '')
		.filter(v => ! v.startsWith('//'));
	wordArray = eliminateDuplicates(wordArray);
	
	// if dictionary entry contains diacritics, add an entry with no diacritics
	let wordArray2 = cloneArray(wordArray);
	for ( let word of wordArray2 ) {
		if ( hasDiacritics(word) ) {
			wordArray.push(normalizeDiacritics(word));
		}
	}
	
	// convert from 1 level array with just text, to 2 level array with text and regex
	let wordObject = [];
	for ( let key in wordArray ) {
		wordObject.push({
			'text': wordArray[key],
			'regex': escapeRegEx(wordArray[key])
		});
	}
	
	// add a couple that need custom RegEx to work correctly
	wordObject.push({
		'text': 'Royal Society',
		'regex': '(?<!Transactions of the )Royal Society'
	});
	wordObject.push({
		'text': 'National Academy of Sciences',
		'regex': '(?<!Proceedings of the )National Academy of Sciences'
	});
	
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
	
	if ( searchResults.length > 10 ) {
		searchResults = searchResults.slice(0, 10);
		searchResults.push('...... and more.');
	}
	
	if ( ! empty(searchResults) ) {
		let html = searchResults.join(', ');
		html = '<div id="DetectSNG" style="background-color: #90EE90"><span style="font-weight: bold;">SNG keywords:</span> ' + html + '</div>';
		
		$('#contentSub').before(html);
	}
});

// </nowiki>