// User:Anne drew Andrew and Drew/admintagger-plus.js, refactored to work cross-wiki
// Requested by User:FormalDude

// Forked from [[User:Amorymeltzer/crathighlighter]]
// <nowiki>

function createEmojiElement(char, title) {
	const emoji = document.createElement("span");
	emoji.textContent = char;
	emoji.setAttribute("title", title);
	emoji.style.marginLeft = "1px";
	return emoji;
}

async function getWikitextFromCache(title) {
	var api = new mw.ForeignApi('https://en.wikipedia.org/w/api.php');
	var wikitext = '';
	await api.get( {
		action: 'query',
		prop: 'revisions',
		titles: title,
		rvslots: '*',
		rvprop: 'content',
		formatversion: '2',
		uselang: 'content', // needed for caching
		smaxage: '86400', // cache for 1 day
		maxage: '86400' // cache for 1 day
	} ).done( function ( data ) {
		wikitext = data.query.pages[0].revisions[0].slots.main.content;
	} );
	return wikitext;
}

mw.hook('wikipage.content').add(async function(){
	await mw.loader.using(['mediawiki.util','mediawiki.Uri', 'mediawiki.Title'], async function() {
		let dataString = await this.getWikitextFromCache('User:NovemBot/userlist.js');
		let dataJSON = JSON.parse(dataString);

		let acData = dataJSON['arbcom'];
		let crData = dataJSON['bureaucrat'];
		let osData = dataJSON['suppress'];
		let cuData = dataJSON['checkuser'];
		let syData = dataJSON['sysop'];
		let swData = dataJSON['steward'];
		let ecData = dataJSON['extendedconfirmed'];
		let tenKData = dataJSON['10k'];

		ADMINHIGHLIGHT_EXTLINKS = window.ADMINHIGHLIGHT_EXTLINKS || false;
		ADMINHIGHLIGHT_NAMESPACES = [2, 3];

		$("#mw-content-text a").each(function (_index, link) {
			try {
				const url = link.getAttribute("href");
				if (!url || url.charAt(0) === "#") {
					return; // Skip <a> elements that aren't actually links; skip anchors
				}
				if (
					url.lastIndexOf("http://", 0) !== 0 &&
					url.lastIndexOf("https://", 0) !== 0 &&
					url.lastIndexOf("/", 0) !== 0
				) {
					return; //require http(s) links, avoid "javascript:..." etc. which mw.Uri does not support
				}
				if (
					link.parentElement.className &&
					link.parentElement.classList[0] == "autocomment"
				) {
					return; // Skip span.autocomment links aka automatic section links in edit summaries
				}

				if (link.id.indexOf("sectiontitlecopy") !== -1) {
					return; // avoid conflict with User:SoledadKabocha/copySectionLink.js
				}
				if (link.className && link.classList[0] == "external") {
					return; // Avoid errors on hard-to-parse external links
				}

				const uri = new mw.Uri(url);
				if (!ADMINHIGHLIGHT_EXTLINKS && !$.isEmptyObject(uri.query)) {
					return; // Skip links with query strings if highlighting external links is disabled
				}
				let thisWikisUri = mw.config.get('wgServer').slice(2);
				if (uri.host == thisWikisUri) {
					// Try to get the title parameter of URL; if not available, remove '/wiki/' and use that
					const mwtitle = new mw.Title(
						mw.util.getParamValue("title", url) ||
						decodeURIComponent(uri.path.slice(6))
					);

					if (
						$.inArray(
						mwtitle.getNamespaceId(),
						ADMINHIGHLIGHT_NAMESPACES
						) >= 0
					) {
						let user = mwtitle.getMain().replace(/_/g, " ");

						if (user.includes("/")) {
							// not a top-level user or user talk page
							return;
						}

						let showEditCountEmoji = true;

						const rolesContainer = document.createElement("sup");
						if (syData[user] == 1) {
							const admin = createEmojiElement("🧹", "Admin");
							rolesContainer.appendChild(admin);
							showEditCountEmoji = false;
						}
						if (acData[user] == 1) {
							const arbcom = createEmojiElement("⚖️", "ArbCom");
							rolesContainer.appendChild(arbcom);
							showEditCountEmoji = false;
						}
						if (crData[user] == 1) {
							const bureaucrat = createEmojiElement("🔧", "Bureaucrat");
							rolesContainer.appendChild(bureaucrat);
							showEditCountEmoji = false;
						}
						if (cuData[user] == 1) {
							const checkuser = createEmojiElement("❓", "Checkuser");
							rolesContainer.appendChild(checkuser);
							showEditCountEmoji = false;
						}
						if (osData[user] == 1) {
							const oversighter = createEmojiElement("👁️", "Oversighter");
							rolesContainer.appendChild(oversighter);
							showEditCountEmoji = false;
						}
						if (swData[user] == 1) {
							const steward = createEmojiElement("🌐", "Steward");
							rolesContainer.appendChild(steward);
							showEditCountEmoji = false;
						}

						if (showEditCountEmoji) {
							if (tenKData[user] == 1) {
								const tenK = createEmojiElement("🟢", ">10k Edits");
								rolesContainer.appendChild(tenK);
							} else if (ecData[user] == 1) {
								const extendedConfirmed = createEmojiElement("🟡", ">500 Edits");
								rolesContainer.appendChild(extendedConfirmed);
							} else {
								const newUser = createEmojiElement("🔴", "New User");
								rolesContainer.appendChild(newUser);
							}
						}

						rolesContainer.style.fontSize = "0.9em";

						// append constructed span to user link
						link.parentNode.insertBefore(rolesContainer, link.nextSibling);
					}
				}
			} catch (e) {
				console.log(link);
				// Sometimes we will run into unparsable links, so just log these and move on
				window.console &&
				console.error("Admin tagger recoverable error", e.message);
			}
		});
	});
});
// </nowiki>
