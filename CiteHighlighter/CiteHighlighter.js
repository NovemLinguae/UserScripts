//<nowiki>

$(async function() {
	var sources = 
{"preprint":["aasopenresearch.org","agrirxiv.org","amrcopenresearch.org","arabixiv.org","arXiv","arxiv.org","authorea.com","beilstein-archives.org","biohackrxiv.org","bioRxiv","biorxiv.org","chemrxiv.org","chinaxiv.org","cogprints.org","crimrxiv.com","eartharxiv.org","ecoevorxiv.org","ecsarxiv.org","edarxiv.org","engrxiv.org","eprint.iacr.org","eprints.rclis.org","essoar.org","f1000research.com","frenxiv.org","gatesopenresearch.org","hal-hprints.archives-ouvertes.fr","hal.archives-ouvertes.fr","hrbopenresearch.org","indiarxiv.in","info.africarxiv.org","lawarxiv.info","lissarchive.org","mediarxiv.com","medRxiv","medrxiv.org","mindrxiv.org","osf.io","paleorxiv.org","peerj.com","philsci-archive.pitt.edu","precedings.nature.com","preprints.apsanet.org","preprints.arphahub.com","preprints.jmir.org","Preprints.org","preprints.org","preprints.ru","preprints.scielo.org","psyarxiv.com","qeios.com","repec.org","ResearchGate","researchgate.net","researchsquare.com","Social Science Research Network","sportrxiv.org","ssrn.com","techrxiv.org","thelancet.com","vixra.org","wellcomeopenresearch.org","zenodo.org"],

"doi":["doi.org"],

"medrs":["acpjournals.org","ahrq.gov","ama-assn.org","bmj.com","cancerresearchuk.org","cdc.gov","cmaj.ca","cochrane.org","heart.org","jamanetwork.com","nam.edu","nasonline.org","nejm.org","nhs.uk","nice.org.uk","nih.gov","thelancet.com","WHO","who.int"],

"green":["100.daum.net","11v11.com","1up.com","216.92.236.126","365daysofinspiringmedia.com","4gamer.net","7ball.com","9to5mac.com","abacusnews.com","abc-clio.com","abc.net.au","abcnews.com","abcnews.go.com","activeanime.com","adelaidenow.com.au","adl.org","adventuregamers.com","aestheticism.com","afp.com","afr.com","africanindy.com","aftenposten.no","ag.ru","aga-search.com","ahram.org.eg","aintitcool.com","akc.org","algaebase.org","aljazeera.com","aljazeera.net","allaboutworship.com","allgame.com","allmusic.com","allure.vanguardngr.com","almasdarnews.com","alphaomeganews.org","altnews.in","altpress.com","altrocklive.com","americanorchestras.org","americanradiohistory.com","americantheatre.org","americanviolasociety.org","amnesty.org","amr.abime.net","ancient-asia-journal.com","andriasang.com","animaldiversity.ummz.umich.edu","animatetimes.com","anime.about.com","anime.webnt.jp","animecons.com","animefeminist.com","animefringe.com","animejump.com","animeland.com","animemangastudies.wordpress.com","animenation.libsyn.com","animepro.de","animeworldorder.com","ap.org","apnews.com","arcade-museum.com","armando.info","arstechnica.com","artbomb.net","asahi.com","atlantablackstar.com","autosport.com","autoweek.com","avclub.com","avn.com","awardsdatabase.oscars.org","awn.com","axios.com","bacterio.cict.fr","balkaninsight.com","baseball-reference.com","bassquarterly.de","bbc.co.uk","bbc.com","bcfilmcommission.com","bdgest.com","bellingcat.com","bibliofep.fundacionempresaspolar.org","billboard-japan.com","billboard.com","biologie.uni-ulm.de","bizjournals.com","biztribune.co.kr","blender.com","blog.chron.com","blog.us.playstation.com","bloody-disgusting.com","bloomberg.com","bluesnews.com","bluff.com","bntnews.co.uk","boomlive.in","bostonglobe.com","botany.hawaii.edu","boutique.editions-lariviere.fr","boxoffice.com","boxofficemojo.com","breathecast.christianpost.com","brightlightsfilm.com","britannica.co.kr","bsc-eoc.org","btselem.org","bucknell.edu","bugguide.net","business-standard.com","buzzfeednews.com","bw.edu","caixin.com","caixinglobal.com","californialawreview.org","cambodiadaily.com","cambridge.org","caranddriver.com","caravanmagazine.in","cardschat.com","catalogueoflife.org","catholicnews.com","cbc.ca","cbn.com","cbsnews.com","cbssports.com","ccmmagazine.com","cell.com","cephbase.utmb.edu","CgSociety.org","charismamag.com","chart-track.co.uk","chemapps.stolaf.edu","chemspider.com","chicagotribune.com","chil-chil.net","cho-animedia.jp","chosun.com","christcore.net","christianitytoday.com","christianmusicreview.org","christianmusiczine.com","christianpost.com","chron.com","cia.gov","cineaste.com","cinefantastiqueonline.com","cinefex.com","civilbeat.org","ckc.ca","clarinet.org","clashmusic.com","classical-music.com","cliffsnotes.com","cmaddict.com","cmportal.in","cmspin.com","cmusicweb.com","cnet.com","cnn.com","codastory.com","collegefootballnews.com","columbialawreview.org","comicbookbin.com","comics.shogakukan.co.jp","comicsreporter.com","comicsworthreading.com","commonchemistry.org","commonsensemedia.org","comptiq.com","comptox.epa.gov","conifers.org","cornerstonemag.com","corp.itmedia.co.jp","corriere.it","countryweekly.com","courthousenews.com","cpcwiki.eu","crashonline.org.uk","craveonline.com","crisisgroup.org","crossrhythms.co.uk","crosswalk.com","crq.org.uk","crsreports.congress.gov","csmonitor.com","csosoundsandstories.org","cybersport.com","cyclingnews.com","cyclingweekly.com","czech-music.net","dailydot.com","dailymed.nlm.nih.gov","dailythanthi.com","danas.rs","dawn.com","deadline.com","deadpress.co.uk","decibelmagazine.com","delta-intkey.com","denofgeek.com","develop-online.net","dicebreaker.com","diena.lv","diepresse.com","digitallydownloaded.net","diptera.info","discovermagazine.com","dn.se","donga.com","dotesports.com","dreadcentral.com","drugbank.ca","drugs.com","du9.org","easyallies.com","ebc.net.tw","ebi.ac.uk","echa.europa.eu","economist.com","efectococuyo.com","egmnow.com","eiga.com","elcomercio.pe","elcooperante.com","eldiario.net","elestimulo.com","elmercurio.com","elnacional.com","elnuevoherald.com","elpais.com","elpitazo.net","elspa.com","eluniversal.com","empireonline.com","en.asiatoday.co.kr","en.matt-thorn.com","enews24.tving.com","engadget.com","entermusicstore.biz","esforce.com","espn.co.uk","espn.com","espn.go.com","espncricinfo.com","espnf1.com","espnfc.com","esportsobserver.com","estadao.com.br","ettelaat.com","ettoday.net","eurogamer.net","eurosport.co.uk","eurosport.com","ew.com","ex.org","exclaim.ca","expressindia.com","expresso.pt","extratime.com","extratime.ie","famitsu.com","fandompost.com","fangoria.com","fastcompany.com","faunaeur.org","faz.net","fci.be","fdasis.nlm.nih.gov","fdtimes.com","federalnewsnetwork.com","feminisminindia.com","fia.com","filmjournal.com","filmmakermagazine.com","filmmusicmag.com","filmschoolrejects.com","filtermagazine.com","financialexpress.com","financialgazette.co.zw","firingsquad.com","fishbase.org","fmnh.helsinki.fi","folha.uol.com.br","foreignpolicy.com","formula1.com","fortune.com","forum.hymis.de","ft.com","funet.fi","fxguide.com","gallica.bnf.fr","gallup.co.kr","gamasutra.com","gamedaily.com","gameinformer.com","gamekult.com","gameplanet.co.nz","gamepro.com","gamer.nl","gamerankings.com","gamerbytes.com","gamerevolution.com","gamesetwatch.com","gamesindustry.biz","gamespy.com","gamesradar.com","gamestar.de","gamestudies.org","gameswirtschaft.de","gametrailers.com","gamezone.com","gaonchart.co.kr","gazeta.pl","gb.zinio.com","gbct.org","geekwire.com","gematsu.com","georgia.org","gizmodo.com","glamour.com","globalnames.org","globalnews.ca","globo.com","gmt.sagepub.com","gomanga.com","gph.sakura.ne.jp","gq.com","graphicnovelreporter.com","groups.ultimate-guitar.com","grubstreet.com","gsmarena.com","guardian.ng","guidetopharmacology.org","guitarworld.myshopify.com","haaretz.com","hancinema.net","hani.co.kr","hankookilbo.com","hankyung.com","hardcoregamer.com","hardcoregaming101.net","harpercollins.ca","harvardlawreview.org","heraldscotland.com","herbarium.usu.edu","heroesneverdie.com","highsnobiety.com","hindustantimes.com","historisches-lexikon-bayerns.de","hisutton.com","hive-conference.com","hmmagazine.com","hobby.dengeki.com","hobbyconsolas.com","hollywoodreporter.com","home.arcor.de","hongkongfp.com","hookshotinc.com","horrornews.net","horseedmedia.net","hrw.org","hs.fi","hurriyet.com.tr","icgmagazine.com","icv2.com","idnes.cz","idolator.com","ign.com","igromania.ru","ihned.cz","ildis.org","impressholdings.com","independent.co.uk","indexfungorum.org","indianexpress.com","indiatimes.com","indievisionmusic.com","indiewire.com","industrygamers.com","inquirer.net","inreview.net","inrock.ru","insecta.bio.pu.ru","insidemacgames.com","invenglobal.com","io9.gizmodo.com","iol.co.za","ipni.org","iranicaonline.org","irishexaminer.com","irishtimes.com","irmng.org","itis.gov","itmedia.co.jp","j-mediaarts.jp","jamaica-gleaner.com","jamthehype.com","japanator.com","japantimes.co.jp","jazzedmagazine.com","jazzhot.net","jazzmagazine.com","jazzman.fr","jazztimes.com","jesusfreakhideout.com","jesuswired.com","jeuneafrique.com","jeuxvideo.com","jewishjournal.com","jewishweek.timesofisrael.com","jn.pt","journal-club.ru","joystiq.com","justadventure.com","justia.com","kadokawa.co.jp","kedglobal.com","kegg.jp","keyboardcompanion.com","khan.co.kr","killscreendaily.com","kmib.co.kr","kompas.com","kookje.co.kr","koreaherald.com","koreajoongangdaily.joins.com","koreana.or.kr","koreanfilm.or.kr","koreatimes.co.kr","kotaku.com","kotobank.jp","kpopherald.com","kritiker.se","lanacion.com.ar","lapatilla.com","lapresse.ca","latimes.com","latinbeatmagazine.com","law.georgetown.edu","lawfareblog.com","lawreview.uchicago.edu","leadstories.com","ledevoir.com","lefigaro.fr","lemonde.fr","letemps.ch","liberation.fr","lidovky.cz","limelightmagazine.com.au","livemint.com","livingblues.com","loudandquiet.com","louderthanthemusic.com","lumiere.obs.coe.int","lv.lv","m-create.com","m1.buysub.com","magazinescanada.zinio.com","mainernews.com","mainichi.jp","majornelson.com","mamacolive.com","manga-news.com","manga-sanctuary.com","manga.about.com","manga.jadedragononline.com","manga.tokyo","mangablog.mangabookshelf.com","mangabookshelf.com","mangalife.com","manoramaonline.com","marinespecies.org","mashable.com","matt-thorn.com","maximkorea.net","mb.com.ph","mcst.go.kr","mcvuk.com","meanmachinesmag.co.uk","mediaarts-db.bunka.go.jp","medlineplus.gov","metabomb.net","metacritic.com","metalforcesmagazine.com","metalstorm.net","metalsucks.net","metroseoul.co.kr","miamiherald.com","milligazette.com","mindspring.com","mistengine.com","mixmag.subscribeonline.co.uk","mlb.com","mobot.org","moderndrummer.com","mojo4music.com","mon-compte.lesinrocks.com","monde-diplomatique.fr","mondediplo.com","motherjones.com","motorsport.com","msnbc.com","muse.jhu.edu","music.theaureview.com","music4games.net","musicradar.com","mwave.interest.me","mycobank.org","mydaily.co.kr","myfavouritemagazines.co.uk","n1info.com","nasa.gov","nasaspaceflight.com","nascar.com","natalie.mu","nate.com","nation.africa","nation.cymru","nationalgeographic.com","natoonline.org","natsukashi.skr.jp","nature.com","naver.com","nbcnews.com","ndlawreview.org","ndlopac.ndl.go.jp","newh2o.com","newreleasetoday.com","newrepublic.com","news-press.com","news.artnet.com","news.dengeki.com","news.kukinews.com","news.naver.com","news.sky.com","news1.kr","newscientist.com","newsen.com","newsis.com","newslaundry.com","newspim.com","newstatesman.com","newsweek.com","newvision.co.ug","newyorker.com","nfaonline.org","nhk.or.jp","nikkei.com","nintendoforcemagazine.com","nintendolife.com","nintendoworldreport.com","nlife.com","nme.com","noaa.gov","nocutnews.co.kr","nowtoronto.com","npr.org","nst.com.my","nymag.com","nytimes.com","nzherald.co.nz","nzz.ch","officialnintendomagazine.co.uk","okazu.yuricon.com","olympedia.org","olympics.com","omdc.on.ca","oncourse.ag.org","onemileatatime.com","opera.escosubs.co.uk","operanews.com","opinionjournal.com","orchestra-magazine.com","organismnames.com","oricon.co.jp","osen.mt.co.kr","paleobiodb.org","paleopolis.rediris.es","palgn.com.au","pastemagazine.com","patrika.com","paulgravett.com","pbs.org","pcgamesn.com","pcmag.com","pennlawreview.com","penny-arcade.com","people.com","people.search.naver.com","pewresearch.org","phantastik-news.de","philstar.com","phnompenhpost.com","phytomorphology.org","pianistmagazine.com","pinknews.co.uk","planetebd.com","plants.usda.gov","playmagazine.com","pocketmags.com","politico.com","politifact.com","politika.rs","polityka.pl","polygon.com","popcultureshock.com:80","popsci.com","poynter.org","pravo.cz","premiumtimesng.com","prensa.com","press.uchicago.edu","primagames.com","pro-gmedia.com","procyclingstats.com","prodavinci.com","propublica.org","pu.nl","pubchem.ncbi.nlm.nih.gov","punchng.com","punkmagazine.com","punknews.org","purexbox.com","pushsquare.com","qz.com","ranking.oricon.co.jp","rapzilla.com","rcsb.org","readaboutcomics.com","recordcollectormag.com","redbull.com","reliefweb.int","religionnews.com","research.amnh.org","reshiftmedia.com","retractionwatch.com","reuters.com","revolvermag.com","rhinegold.subscribeonline.co.uk","riftherald.com","rightstuf.com","rockhard.de","rockpapershotgun.com","rocksound.tv","rollcall.com","rollingstone.com","rottentomatoes.com","rp.pl","rpgamer.com","rpgfan.com","rpgsite.net","rpgvaultarchive.ign.com","runrun.es","saxophonetoday.com","sbo.magserv.com","sciencebasedmedicine.org","sciencemag.org","scientificamerican.com","scmp.com","scotsman.com","scotusblog.com","scout.com","screenanarchy.com","seattletimes.com","secure.palmcoastd.com","sedaily.com","seiyuawards.jp","seoul.co.kr","sequentialtart.com","sfchronicle.com","sfgate.com","sgn.cc","shacknews.com","shaenon.com","shethepeople.tv","shocktillyoudrop.com","shop.kodansha.jp","shop.magicrpm.com","shop.nqsm.com","shop.rhinegold.co.uk","si.com","siliconera.com","silverbirdtv.com","singingnews.com","skepdic.com","skeptoid.com","skoar.digit.in","skysports.com","slashfilm.com","slate.com","slidetoplay.com","smh.com.au","sn2000.taxonomy.nl","snopes.com","soaphub.com","soar.wichita.edu","soc.org","soccerbase.com","soccerway.com","soliloquyinblue.mangabookshelf.com","sonic-seducer.de","soundonsound.com","soundtrack.net","sp2000.org","sparknotes.com","sphereofhiphop.com","spiegel.de","spillmagazine.com","spin.com","splashcomics.de","splcenter.org","sportinglife.com","sports-reference.com","springer.com","stanfordlawreview.org","star.mk.co.kr","star.mt.co.kr","starnnews.com","startribune.com","store.acousticguitar.com","store.magnetmagazine.com","store.stringsmagazine.com","strategy-gaming.com","stratosgroup.com","streetroots.org","sueddeutsche.de","suitablefortreatment.mangabookshelf.com","sunnewsonline.com","svg.com","sweetyhigh.com","swimmingworldmagazine.com","swimswam.com","taiwannews.com.tw","talcualdigital.com","talk.ictvonline.org","tapeop.com","tatler.com","tcawestern.org","tcj.com","teamxbox.com","technologytell.com","techradar.com","teenreads.com","teenvogue.com","telegraph.co.uk","telegraphindia.com","tenasia.hankyung.com","the-magicbox.com","the-numbers.com","theage.com.au","theasc.com","theatlantic.com","theaustralian.com.au","thechristianbeat.org","thechristianmanifesto.com","thechristianmusicreviewblog.com","thechristianrock20.com","thecinemaholic.com","theconversation.com","thecut.com","thedailybeast.com","thedailystar.net","thediapason.com","thediplomat.com","thefa.com","thefader.com","thefluteview.com","theflyingcourier.com","thefrontrowreport.com","thefutoncritic.com","thegamesmachine.it","theglobeandmail.com","thehill.com","thehindu.com","thehindubusinessline.com","theindependent.co.zw","theinstrumentalist.com","theintercept.com","thejc.com","thekennelclub.org.uk","themagazineshop.com","themanime.org","themarysue.com","thenation.com","thenationonlineng.net","theneedledrop.com","thenewhumanitarian.org","theorganmag.com","theplantlist.org","theprint.in","theregister.com","therockacrossaustralia.com","theskinny.co.uk","thesoundopinion.com","thespinoff.co.nz","thestatesman.com","thesundaytimes.co.uk","thetablet.co.uk","thetimes.co.uk","theundergroundsite.com","theverge.com","thewrap.com","theyworkforyou.com","thisisfakediy.co.uk","thoughtco.com","time.com","todayschristianent.com","todayschristianmusic.com","tohan.jp","tollbooth.org","tomodachi.de","toondoctor.com","toronto.ca","torrentfreak.com","toucharcade.com","transfermarkt.com","transfermarkt.us","travelnbike.com","tropicos.org","tvdrama-db.com","tvguide.com","ucmp.berkeley.edu","ugo.com","uk-anime.net","ukcdogs.com","undertheradarmag.com","uproxx.com","uptv.com","usagi.org","usatoday.com","usnews.com","vanguardngr.com","vanityfair.com","variety.com","ve3d.ign.com","venturebeat.com","vg247.com","vice.com","videogamer.com","videogameschronicle.com","videor.co.jp","visitkorea.or.kr","visitseoul.net","vivoplay.net","voanews.com","vogue.com","voice-online.co.uk","volkskrant.nl","vox.com","vpesports.com","vpitv.com","vulture.com","wadeoradio.com","wargamer.com","washingtonpost.com","watch.impress.co.jp","weekly.ascii.jp","weeklystandard.com","whocc.no","wired.com","world.kbs.co.kr","worldatlas.com","worldbirdnames.org","worldsinmotion.biz","worldsnooker.com","worshipleader.com","wsc.nmbe.ch","wsj.com","wst.tv","www-sp2000ao.nies.go.jp","wwwsshe.murdoch.edu.au","wyborcza.pl","x-play.com","xportsnews.com","yalelawjournal.org","yenpress.com","yna.co.kr","ysrnry.co.uk","zdnet.com","zeit.de"],

"yellow":["123telugu.com","aa.com.tr","aawsat.com","about.com","abplive.com","afterellen.com","ahaber.com.tr","ahvalnews.com","al-akhbar.com","albertonews.com","algemeiner.com","alhayat.com","allaccess.com","allmusic.com","allssc.com","allthatsinteresting.com","american-rails.com","aninews.in","aporrea.org","appledaily.com","arabnews.com","arcadiapublishing.com","arlingtoncemetery.net","asianexpress.co.uk","aspi.org.au","astanatimes.com","atlasobscura.com","aydinlik.com.tr","babynames.com","ballotpedia.org","baseballinwartime.com","bbb.org","beebom.com","bellanaija.com","bet.com","biography.com","bitcoinmagazine.com","bitmob.com","boingboing.net","bollywoodhungama.com","bostonherald.com","boundingintocomics.com","britannica.com","brookings.edu","burkespeerage.com","businessinsider.com","businessinsider.in","buzzfeed.com","bylinetimes.com","c-c-netzwerk.ch","caracaschronicles.com","caraotadigital.net","carbondalereporter.com","catholicnewsagency.com","cato.org","cctv.com","census.gov","cepr.net","cfr.org","chambanasun.com","chicagocitywire.com","chinadaily.com","christianpost.com","cinco8.com","cleantechnica.com","cnbc.com","collider.com","colombopage.com","cosmopolitan.com","couriernewsroom.com","creativespirits.info","cripsygamer.com","cruxnow.com","daily-mail.co.zm","daily.bandcamp.com","dailysabah.com","dar-alifta.org","datatransmission.com","deafgamers.com","debka.com","debretts.com","defendinghistory.com","dekalbtimes.com","democracynow.org","deseret.com","desmog.co.uk","desmog.uk","desmogblog.com","destructoid.com","distractify.com","dolartoday.com","dupagepolicyjournal.com","eastcentralreporter.com","economictimes.indiatimes.com","edge.kz","ekathimerini.com","entrepreneur.com","eonline.com","escapistmagazine.com","etymonline.com","eureporter.co","ezks.org","fair.org","fitsnews.com","flamesrising.com","fool.com","Forbes","forbes.com","foxnews.com","fullhyderabad.com","galesburgreporter.com","gameo.org","GameSpot","gamespot.com","gaycitynews.com","gcatholic.org","genocidewatch.com","giantbomb.com","globalsecurity.org","globalvoices.org","gritdaily.com","grundyreporter.com","guancha.cn","Guardian","guardian.co.uk","gulfnews.com","guns.com","hackaday.com","halonoviny.cz","hansard.parliament.uk","harpalgeo.tv","hkv.hr","hopenothate.org.uk","hotairengines.org","howstuffworks.com","huffingtonpost.com","HuffPost","huffpost.com","hymnary.org","hypebeast.com","idlebrain.com","ijr.com","illinoisvalleytimes.com","indiaglitz.com","internethaber.com","investopedia.com","irna.ir","islamansiklopedisi.org.tr","jacobinmag.com","jamestown.org","jantakareporter.com","jayisgames.com","jaysmusikblog.com","jns.org","joshuaproject.net","kanecountyreporter.com","kankakeetimes.com","kathimerini.gr","kathmandutribune.com","kendallcountytimes.com","kommersant.ru","kurdistanhumanrights.org","lacancha.net","lakecountygazette.com","latinaustralian.com.au","lgis.co","libcom.org","maconreporter.com","maduradas.com","makeuseof.com","makorrishon.co.il","mantleplumes.org","maps.google.com","mayoclinic.com","mayoclinic.org","mchenrytimes.com","mcleancountytimes.com","mediamatters.org","meduza.io","memri.org","metalforjesus.org","metalmaidens.com","metalreviews.com","metalsucks.net","metroeastsun.com","middleeasteye.net","mirror.co.uk","mises.org.br","mlg.com","mondoweiss.net","morningstaronline.co.uk","multiplayerblog.mtv.com","muo.com","namibian.com.na","nasdaq.com","natemat.pl","nationalheraldindia.com","nationalreview.com","nccih.nih.gov","ncert.nic.in","ndtv.com","newera.com.na","newindianexpress.com","newsarawaktribune.com.my","newsoftheworld.co.uk","newsweek.com","nifc.pl","nlpg.com","nolifetilmetal.com","northcooknews.com","northegyptnews.com","novayagazeta.ru","nrc.nl","nwillinoisnews.com","nydailynews.com","offworld.com","oko.press","oregonencyclopedia.org","orissapost.com","oryxspioenkop.com","ourtownstjames.com","pando.com","pastemagazine.com","peakbagger.com","people.cn","peoriastandard.com","piracyreport.com","pmldaily.com","popularmechanics.com","post-gazette.com","prairiestatewire.com","pride.com","protothema.gr","prsa.com.pl","psychologytoday.com","pulse.ng","qstheory.cn","quackwatch.org","quincyreporter.com","radianceweekly.in","rbc.ru","rbc.ua","readsludge.com","realclearpolitics.com","realtor.com","reason.com","reasonablefaith.org","reframingrussia.com","resumen-english.org","retaildive.com","ria.ru","rightwingwatch.org","rockfordsun.com","rockislandtoday.com","rollingstone.com","rulers.org","salon.com","sangamonsun.com","sbnation.com","scienceblogs.com","scottish-places.info","screenrant.com","scroll.in","sega-16.com","seillinoisnews.com","shmuplations.com","sify.com","silnews.com","skeptic.com","skepticalinquirer.org","sketchthejournalist.blogspot.com","softpedia.com","southcentralreporter.com","southcooknews.com","space.com","spectator.co.uk","spectrumculture.com","spiked-online.com","standard.co.uk","steamspy.com","straitstimes.com","sundayguardianlive.com","supercars.net","superyachttimes.com","swillinoisnews.com","talkingpointsmemo.com","talkorigins.org","tapol.org","tass.com","techcabal.com","techcrunch.com","tehrantimes.com","tennesseestar.com","tghat.com","the-beacon.ie","the-eye.wales","theamericanconservative.com","thearkenstone.blogspot.com","thedelimagazine.com","thedispatch.com","thegreenpapers.com","theguardian.co.uk","theguardian.com","thehustle.co","thejimquisition.com","thelibertyherald.com","themarysue.com","themichiganstar.com","theminnesotasun.com","thenational.scot","thenationalnews.com","theneedledrop.com","theneweuropean.co.uk","thenextweb.com","theohiostar.com","thequint.com","theronin.org","thesunniway.com","thetab.com","thetyee.ca","theweek.co.uk","theweek.com","theweek.in","thewhippingpost.tripod.com","thewire.in","tibet.net","timesnownews.com","timesofindia.indiatimes.com","timesofisrael.com","tmz.com","tohokingdom.com","toledoblade.com","townhall.com","trtworld.com","tvp.pl","twingalaxies.com","uboat.net","uk.jkp.com","ukrailnews.com","ukwhoswho.com","ultimasnoticias.com.ve","unian.ua","usmagazine.com","varldenshistoria.se","venezuelatuya.com","vgmonline.net","vice.com","vietnamnet.vn","wafa.ps","warisboring.com","washingtonexaminer.com","washingtontimes.com","webmd.com","westcentralreporter.com","westcooknews.com","whatsonweibo.com","willcountygazette.com","womengamers.com","worldofwonder.net","wsws.org","xbiz.com","xbox.com","xinhuanet.com","yenicaggazetesi.com.tr","youth-time.eu","youtube.com","zeenews.india.com"],

"aggregator":["aol.com","boston.com","bt.com","buzzflash.com","canada.com","daum.net","focus.de","msn.com","naver.com","netscape.com","news.ycombinator.com","newsbreak.com","newspapers.com","phys.org","sina.com","thelogicalindian.com","theworldnews.net","yahoo.com"],

"red":["101dogbreeds.com","112.ua","45cat.com","adfontesmedia.com","aeronet.cz","africanprintinfashion.com","ahaonline.cz","albumoftheyear.org","aleteia.org","allkpop.com","allsides.com","allthingsdogs.com","almanachdegotha.org","alternativenation.net","alternativevision.co.uk","alternet.org","amricanrf.org","ancestry.com","angel.co","angelfire.com","animals24-7.org","animemaru.com","animetric.com","anphoblacht.com","answeringmuslims.com","arcadeheroes.com","artofmanliness.com","asianwiki.com","askmen.com","askubuntu.com","audiopinions.net","austinemedia.com","baike.baidu.com","bandcamp.com","bdmilitary.com","beatportal.com","bild.de","bitchute.com","blackagendareport.com","blesk.cz","blogger.com","blogspot.com","blu-ray.com","bnrmetal.com","boredpanda.com","bradysnario.com","breitbart.com","bulldoginformation.com","buzznigeria.com","californiaglobe.com","cambridgescholars.com","canna-pet.com","capitalresearch.org","carfolio.com","catholicism.org","celebitchy.com","celebritynetworth.com","cesnur.net","cgtn.com","chabad.org","channel-korea.com","chartmasters.org","chiomajesus.org","chivalricorders.com","churchmilitant.com","cinemacats.com","cnsnews.com","coindesk.com","comicbookmovie.com","completedogsguide.com","conservativehome.com","conservativereview.com","consortiumnews.com","countere.com","counterpunch.org","cracked.com","cracroftspeerage.co.uk","crunchbase.com","crypticrock.com","cyworld.com","daily-beat.com","dailycaller.com","dailykos.com","dailymail.co.uk","dailyo.in","dailysport.co.uk","dailystar.co.uk","dailywire.com","danielpipes.org","daxtonsfriends.com","defence-blog.com","defseca.com","designerdoginfo.wordpress.com","diandian.com","discogs.com","dissidentvoice.org","djbooth.net","dkpopnews.net","dnd.com.pk","dogable.net","dogappy.com","dogbitelaw.com","dogbreedinfo.com","dogbreedplus.com","dogdisease.info","doggiedesigner.com","dogpage.us","dogs.petbreeds.com","dogsbite.org","dogster.com","dogtime.com","dogzone.com","dorzeczy.pl","douban.com","earnthenecklace.com","edtechpress.co.uk","elchiguirebipolar.net","electronicbeats.net","electronicintifada.net","elrompehielos.com.ar","en.koreaportal.com","en.somoynews.tv","enciclopediadarte.eu","encycolorpedia.com","englishmonarchs.co.uk","epinions.com","epistlenews.co.uk","europeanheraldry.org","evolvepolitics.com","examiner.com","express.co.uk","facebook.com","faluninfo.net","familysearch.org","famousbirthdays.com","famousbirthsdeaths.com","fandom.com","fatalpitbullattacks.com","filmaffinity.com","filmmusicreporter.com","filmreference.com","findagrave.com","findmypast.com","firefox.org","firestream.net","forces-war-records.co.uk","freebeacon.com","frontiersin.org","frontpagemag.com","futuremagmusic.org","gamefaqs.gamespot.com","gameskinny.com","Garden.org","gawker.com","gazetabankowa.pl","gazetapolska.pl","geni.com","genius.com","github.com","github.io","gitlab.com","glitchwave.com","globalmbwatch.com","globalresearch.ca","globaltimes.cn","gmusicplus.com","gospelmusicnaija.com","grande-rock.com","greekcitytimes.com","gript.ie","guide2womenleaders.com","haribhakt.com","headlineplanet.com","heatst.com","helloasia.com.au","hellokpop.com","hellomagazine.com","highschool.latimes.com","highstakesdb.com","hindi2news.com","hispantv.com","history.com","HistoryOfRoyalWomen.org","hrvc.net","hwaiting.jp","hwaiting.me","iams.com","ibtimes.com","ifcj.org","imdb.com","independentaustralia.net","indymedia.org","informationng.com","infowars.com","inkinews.com","inquisitr.com","insightmusic.co.uk","insistposthindi.in","instagram.com","intoleranceagainstchristians.eu","isfdb.org","ishkur.com","islamicstudies.org","islamqa.info","israelunwired.com","jacobite.ca","jacobitemag.com","jadovno.com","jammersreviews.com","japakomusic.com","jewishvirtuallibrary.org","jezebel.com","jihadwatch.org","jnasci.org","jnsbm.org","jocmr.com","josepvinaixa.com","joshuaproject.net","jpopasia.com","k9rl.com","kakao.com","kdramastars.com","kenrockwell.com","knowyourmeme.com","korea.com","koreaboo.com","koreaportal.com","koreastardaily.com","kpopfans.net","kpopmap.com","kpopping.com","kpopstarz.com","kprofiles.com","kstarlive.com","kworb.net","last.fm","lawofficer.com","leafly.com","leashesandlovers.com","lechuguinos.com","lesbianandgaynews.com","lifehacker.com","lifesitenews.com","liliputing.com","lindaikejisblog.com","linkedin.com","listverse.com","livehistoryindia.com","livejournal.com","looktothestars.org","loudestgist.com","lulu.com","madainproject.com","mailonsunday.co.uk","mangaupdates.com","marquiswhoswho.com","marriedceleb.com","masala.com","mastiffdogssite.com","mathoverflow.net","meaww.com","mediabiasfactcheck.com","medium.com","meforum.org","meituan.com","metal-archives.com","metal-experience.com","metal-observer.com","metalheadzone.com","metalmusicarchives.com","metalwani.com","metro.co.uk","metrolyrics.com","middleeastmonitor.com","military-today.com","mintpressnews.com","mises.org","mixbreeddog.com","mobilereference.com","modelmayhem.com","monergism.com","moneyinc.com","moneylife.in","mpps.gob.ve","mrc.org","muflihun.com","musixmatch.com","mwave.interest.me","myanimelist.net","nairaland.com","namu.wiki","naszdziennik.pl","nationalenquirer.com","nationalpitbullvictimawareness.org","ncc.org.au","nczas.com","newsblaze.com","newsbreak.com","newsmax.com","newsoftheworld.co.uk","nickiswift.com","niezalezna.pl","nihonreview.com","ninetofiverecords.com","ningen.com","nndb.com","ntd.com","ntdtv.com","nypost.com","occupydemocrats.com","odmp.org","officiallykmusic.com","omniglot.com","onehallyu.com","onobello.com","opindia.com","order-order.com","ordoiuris.pl","otakufridge.com","otakunews.com","ourcampaigns.com","pagesix.com","panampost.com","panarmenian.net","parlamentnilisty.cz","patheos.com","patreon.com","pawculture.com","pengyou.com","peoples.ru","peopo.org","perezhilton.com","perfectdogbreeds.com","peta.org","petguide.com","petpremium.com","pets4homes.co.uk","phoronix.com","plasticmag.co.uk","police1.com","politicalislam.com","popcrush.com","popsugar.com","postcard.news","prageru.com","praise.com","presstv.com","prnewswire.com","progarchives.com","propertyofzack.com","proprivacy.com","puppiesclub.com","puppiesndogs.com","puppy-basics.com","puppydogweb.com","quadrant.org.au","quillette.com","quora.com","radiomaryja.pl","rateyourmusic.com","rawstory.com","readthedocs.org","rebelion.org","rebelnews.com","reddit.com","redstate.com","renren.com","republicworld.com","retrieverbud.com","rightlog.in","rigvedawiki.net","rockdetector.com","rocketrobinsoccerintoronto.com","rockonthenet.com","rollingout.com","rt.com","scamperingpaws.com","scaruffi.com","scribd.com","seaoftranquility.org","secretshoresmusic.com","section.blog.naver.com","seoulbeats.com","serverfault.com","setlist.fm","sfloman.com","sibci.gob.ve","siberiantimes.com","sina.com","sites.google.com","sittersforcritters.com","sixthtone.com","skwawkbox.org","somalidispatch.com","somoynews.tv","sonemic.com","songfacts.com","songmeaningsandfacts.com","soompi.com","soshified.com","soundcloud.com","soundofmetal.se","southfront.org","sportskeeda.com","spotify.com","sputniknews.com","stackexchange.com","stackoverflow.com","stalkerzone.org","stargist.com","stars.ng","starshipcampaign.com","stefczyk.info","substack.com","super.cz","superuser.com","swarajyamag.com","t.qq.com","takimag.com","teacupdogdaily.com","techno.org","telesurenglish.net","telesurtv.net","tfipost.com","the-sun.com","theaerodrome.com","theblaze.com","theblot.com","thecanary.co","thecubanhistory.com","thedogsjournal.com","theepochtimes.com","thefederalist.com","thegoodypet.com","thegrayzone.com","thehappypuppysite.com","thehustlersdigest.com","thekrazemagazine.com","thelabradorsite.com","theleectrichawk.com","thelogicalindian.com","themetalcritic.com","theneedledrop.com","theonion.com","theplayground.co.uk","thepostmillennial.com","thereligionofpeace.com","thesportster.com","thestandom.com","thesun.co.uk","thetruthaboutguns.com","thetunemusic.com","thevpme.com","theworshipcommunity.com","thrashocore.com","tiktok.com","tokyohive.com","topdogtips.com","torontoguardian.com","trekbbs.com","treknation.com","trektoday.com","tumblr.com","tunefind.com","tuttoandroid.net","tv-trwam.pl","tv.com","tv.msn.com","tvrepublika.pl","tvtropes.org","twitch.com","twitter.com","tygodnikpodlaski.pl","ukdefencejournal.org.uk","underthegunreview.net","unitedkpop.com","urbandictionary.com","vdare.com","venezuelanalysis.com","verywellfamily.com","verywellhealth.com","verywellmind.com","vetstreet.com","vgchartz.com","victimsofcommunism.org","vimeo.com","voices.yahoo.com","vpnpro.com","warhistoryonline.com","watchmojo.com","weaponsandwarfare.com","weebly.com","wegotthiscovered.com","wehuntedthemammoth.com","weibo.com","wenweipo.com","westernjournal.com","wGospodarce.pl","whosampled.com","wikia.org","wikibooks.org","wikileaks.org","wikinews.org","wikipedia.org","wikiquote.org","wikispecies.org","wikiversity.org","wikivoyage.org","wiktionary.org","wNas.pl","wnd.com","wordpress.com","wordspy.com","wrldrels.org","wsieciprawdy.pl","wSumie.pl","xing.com","youku.com","yourpurebredpuppy.com","youthkiawaaz.com","youthvillageng.com","youtube.com","zerohedge.com","zhihu.com"]}
;

	// /(blog|blogspot|caard|\/comment|fandom|forum|preprint|railfan|thread|weebly|wix|wordpress|blockchain|crypto|innovative|podcast|about|newswire|release|announce|acquire)/gm
	let unreliableWords = [
		'/comment',
		'about-me',
		'about-us',
		'/about/',
		'acquire',
		'announce',
		//'blockchain',
		'blog', // by far the most common hit
		'blogspot',
		'businesswire',
		'caard',
		'contact-us',
		'contactus',
		//'crypto',
		'fandom',
		'/forum/',
		'google.com/search',
		'innovative',
		'newswire',
		'podcast',
		'/post/',
		'preprint',
		'press-release',
		'pressrelease',
		'prnews',
		'railfan',
		'sponsored',
		'thread',
		'weebly',
		'wix',
		'wordpress',
	];

	/** CAREFUL. This is case sensitive. */
	function deleteAll(...strings) {
		for ( let string of strings ) {
			for ( let key in sources ) {
				sources[key] = deleteFromArray(string, sources[key]);
			}
		}
	}

	function deleteFromArray(needle, haystack) {
		const index = haystack.indexOf(needle);
		if (index > -1) {
			haystack.splice(index, 1);
		}
		return haystack;
	}
	
	async function getWikicode(title) {
		if ( ! mw.config.get('wgCurRevisionId') ) return ''; // if page is deleted, return blank
		var wikicode = '';
		title = encodeURIComponent(title);
		await $.ajax({
			url: '/w/api.php?action=parse&page='+title+'&prop=wikitext&formatversion=2&format=json',
			success: function (result) {
				wikicode = result['parse']['wikitext'];
			},
			dataType: "json",
			async: false
		});
		return wikicode;
	}

	// if config variables aren't set in user's common.js file, set it to default
	if ( window.citeHighlighterHighlightEverything === undefined ) {
		window.citeHighlighterHighlightEverything = false;
	}
	if ( window.citeHighlighterLighterColors === undefined ) {
		window.citeHighlighterLighterColors = false;
	}
	if ( window.citeHighlighterAlwaysHighlightSourceLists === undefined ) {
		window.citeHighlighterAlwaysHighlightSourceLists = false;
	}

	await mw.loader.using(['mediawiki.util','mediawiki.Uri', 'mediawiki.Title'], async function() {
		// don't highlight certain pages, for speed and visual appearance reasons.
		// on pages with a lot of links (watchlist, WP:FA), highlighting EVERYTHING will double the load time. e.g. watchlist 5 seconds -> 10 seconds
		let articleTitle = mw.config.get('wgPageName');
		if (
			mw.config.get('wgAction') == 'history' ||
			articleTitle == 'Main_Page' ||
			articleTitle == 'Wikipedia:Featured_articles' ||
			articleTitle == 'Special:Watchlist'
		) {
			return;
		}
		
		// if page is a source quality list, highlight everything, even if highlightEverything = false; goal: easily see if the script is highlighting anything wrong
		if ( window.citeHighlighterAlwaysHighlightSourceLists == true) {
			let highlightEverythingList = [
				'Wikipedia:Reliable_sources/Perennial_sources',
				'Wikipedia:New_page_patrol_source_guide',
				'Wikipedia:WikiProject_Albums/Sources',
				'Wikipedia:WikiProject_Video_games/Sources#Reliable_sources',
				'Wikipedia:WikiProject_Anime_and_manga/Online_reliable_sources',
				'Wikipedia:WikiProject_Africa/Africa_Sources_List',
				'Wikipedia:WikiProject_Dungeons_%26_Dragons/References',
			];
			if ( highlightEverythingList.includes(articleTitle) ) {
				window.citeHighlighterHighlightEverything = true;
			}
		}
		
		// if page is a draft, highlight everything, as the # of links is small, and oftentimes inline citations are malformed
		if ( mw.config.get('wgNamespaceNumber') == 118 ) {
			window.citeHighlighterHighlightEverything = true;
		}
		
		// if highlightEverything = true, delete wikipedia.org and wiktionary. Too many false positives.
		if ( window.citeHighlighterHighlightEverything ) {
			deleteAll('en.wikipedia.org', 'wikipedia.org', 'wiktionary.org');
			deleteFromArray('wiki', unreliableWords);
		}
		
		let colors = {
			// order of these first 3 fixes an issue where published academic papers were being colored preprint red
			// lowest priority
			'unreliableWord':	'#ffb347', // orange for now, for easier testing. later will be red.
			'preprint':			'lightcoral',
			'doi':				'transparent',
			'medrs': 			'limegreen',
			'green': 			'lightgreen',
			'yellow': 			'khaki',
			'red': 				'lightcoral',
			//'aggregator':	'plum',	// turning off aggregator for now, red/yellow/green is nice and simple, purple makes the color scheme more complicated
			// highest priority
		};
		
		if ( window.citeHighlighterLighterColors ) {
			colors = {
				'unreliableWord':	'#ffb347',
				'preprint':			'#ffcfd5',
				'doi':				'transparent',
				'medrs': 			'#63ff70',
				'green': 			'#a6ffb9',
				'yellow': 			'#ffffcc',
				'red': 				'#ffcfd5',
			};
		}
		
		for ( let key in colors ) {
			mw.util.addCSS('.cite-highlighter-' + key + ' {background-color: ' + colors[key] + ';}');
			mw.util.addCSS('.rt-tooltipTail.cite-highlighter-' + key + '::after {background: ' + colors[key] + ';}');
		}
		
		let wikicode = await getWikicode(articleTitle);
		let i = 0, total = 0;
		
		for ( let color in colors ) {
			if ( typeof sources[color] === 'undefined' ) continue;
			
			for ( let source of sources[color] ) {
				total++;
				
				// This code makes the algorithm more efficient, by not adding CSS for sources that aren't found in the wikicode.
				// I programmed some exceptions to fix bugs. For example:
				// - {{Cite journal}} with a pubmed ID generates nih.gov without putting it in the wikicode
				// - {{Cite tweet}} generates twitter.com without putting it in the wikicode
				if ( wikicode.includes(source) || source === 'nih.gov' || source === 'twitter.com' ) {
					i++;
					
					// highlight external links, if it contains a period and no space (i.e. a domain name)
					if ( source.includes('.') && ! source.includes(' ') ) {
						// highlight whole cite
						// [title="source" i]... the "i" part is not working in :has() for some reason
						// use .toLowerCase() for now
						// using .addClass() instead of .css() or .attr('style') because I'm having issues getting medrs to override arXiv/Wikidata/other red sources
						$('li[id^="cite_note-"]').has('a[href*="/'+source.toLowerCase()+'"]').addClass('cite-highlighter-' + color);
						$('li[id^="cite_note-"]').has('a[href*=".'+source.toLowerCase()+'"]').addClass('cite-highlighter-' + color);
						
						// Also support any {{Cite}} template in a list. For example, a works cited section supporting a references section consisting of "Smith 1986, pp. 573-574" type citations. Example: https://en.wikipedia.org/wiki/C._J._Cregg#Articles_and_tweets
						$('li').has('.citation a[href*="/'+source.toLowerCase()+'"]').addClass('cite-highlighter-' + color);
						$('li').has('.citation a[href*=".'+source.toLowerCase()+'"]').addClass('cite-highlighter-' + color);

						if ( window.citeHighlighterHighlightEverything ) {
							// highlight external link only
							// !important; needed for highlighting PDF external links. otherwise the HTML that generates the PDF icon has higher specificity, and makes it transparent
							// [title="source" i]... the "i" means case insensitive. Default is case sensitive.
							mw.util.addCSS('#bodyContent a[href*="/'+source+'" i] {background-color: '+colors[color]+' !important;}');
							mw.util.addCSS('#bodyContent a[href*=".'+source+'" i] {background-color: '+colors[color]+' !important;}');
						}
					}
				}
			}
		}

    function observeTooltips() {
      new MutationObserver(function (mutations) {
        var el = document.getElementsByClassName('rt-tooltip')[0]
        if (el) {
          for (let color in colors) {
            if (typeof sources[color] === 'undefined') continue

            for (let source of sources[color]) {
              total++

              if (wikicode.includes(source) || source === 'nih.gov' || source === 'twitter.com') {
                i++

                if (source.includes('.') && !source.includes(' ')) {
                  $(el).has(`a[href*="${source.toLowerCase()}"]`).addClass('cite-highlighter-' + color)
                  $(el).has(`a[href*="${source.toLowerCase()}"]`).children().first().addClass('cite-highlighter-' + color)
                }
              }
            }
          }
        }
      }).observe(document.body, {
        subtree: false,
        childList: true,
      })
    }

		// Be more aggressive with this list of words. Doesn't have to be the domain name. Can be anywhere in the URL. Example unreliableWord: blog.
		for ( let word of unreliableWords ) {
			let color = 'unreliableWord';
			if ( wikicode.includes(word) ) {
				$('li[id^="cite_note-"]').has('a[href*="'+word.toLowerCase()+'"]').addClass('cite-highlighter-' + color);
				if ( window.citeHighlighterHighlightEverything ) {
					mw.util.addCSS('#bodyContent a[href*="'+word+'" i] {background-color: '+colors[color]+' !important;}');
				}
			}
		}

		observeTooltips()

		//console.log(`Added ${i} of ${total} CSS rules`);
	});
});

//</nowiki>