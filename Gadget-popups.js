// STARTFILE: main.js
// **********************************************************************
// **                                                                  **
// **             changes to this file affect many users.              **
// **           please discuss on the talk page before editing         **
// **                                                                  **
// **********************************************************************
// **                                                                  **
// ** if you do edit this file, be sure that your editor recognizes it **
// ** as utf8, or the weird and wonderful characters in the namespaces **
// **   below will be completely broken. You can check with the show   **
// **            changes button before submitting the edit.            **
// **                      test: مدیا מיוחד Мэдыя                      **
// **                                                                  **
// **********************************************************************
/* eslint-env browser  */
/* global $, jQuery, mw, window */

// Fix later
/* global log, errlog, popupStrings, wikEdUseWikEd, WikEdUpdateFrame */
/* eslint no-mixed-spaces-and-tabs: 0, no-empty: 0 */

$(function () {
	//////////////////////////////////////////////////
	// Globals
	//

	// Trying to shove as many of these as possible into the pg (popup globals) object
	var pg = {
		api: {}, // MediaWiki API requests
		re: {}, // regexps
		ns: {}, // namespaces
		string: {}, // translatable strings
		wiki: {}, // local site info
		user: {}, // current user info
		misc: {}, // YUCK PHOOEY
		option: {}, // options, see newOption etc
		optionDefault: {}, // default option values
		flag: {}, // misc flags
		cache: {}, // page and image cache
		structures: {}, // navlink structures
		timer: {}, // all sorts of timers (too damn many)
		counter: {}, // .. and all sorts of counters
		current: {}, // state info
		fn: {}, // functions
		endoflist: null,
	};

	/* Bail if the gadget/script is being loaded twice */
	/* An element with id "pg" would add a window.pg property, ignore such property */
	if (window.pg && !(window.pg instanceof HTMLElement)) {
		return;
	}

	/* Export to global context */
	window.pg = pg;

	/// Local Variables: ///
	/// mode:c ///
	/// End: ///
	// ENDFILE: main.js

	// STARTFILE: actions.js
	function setupTooltips(container, remove, force, popData) {
		log('setupTooltips, container=' + container + ', remove=' + remove);
		if (!container) {
			// the main initial call
			if (
				getValueOf('popupOnEditSelection') &&
				document &&
				document.editform &&
				document.editform.wpTextbox1
			) {
				document.editform.wpTextbox1.onmouseup = doSelectionPopup;
			}
			// article/content is a structure-dependent thing
			container = defaultPopupsContainer();
		}

		if (!remove && !force && container.ranSetupTooltipsAlready) {
			return;
		}
		container.ranSetupTooltipsAlready = !remove;

		var anchors;
		anchors = container.getElementsByTagName('A');
		setupTooltipsLoop(anchors, 0, 250, 100, remove, popData);
	}

	function defaultPopupsContainer() {
		if (getValueOf('popupOnlyArticleLinks')) {
			return (
				document.querySelector('.skin-vector-2022 .vector-body') ||
				document.getElementById('mw_content') ||
				document.getElementById('content') ||
				document.getElementById('article') ||
				document
			);
		}
		return document;
	}

	function setupTooltipsLoop(anchors, begin, howmany, sleep, remove, popData) {
		log(simplePrintf('setupTooltipsLoop(%s,%s,%s,%s,%s)', arguments));
		var finish = begin + howmany;
		var loopend = Math.min(finish, anchors.length);
		var j = loopend - begin;
		log(
			'setupTooltips: anchors.length=' +
				anchors.length +
				', begin=' +
				begin +
				', howmany=' +
				howmany +
				', loopend=' +
				loopend +
				', remove=' +
				remove
		);
		var doTooltip = remove ? removeTooltip : addTooltip;
		// try a faster (?) loop construct
		if (j > 0) {
			do {
				var a = anchors[loopend - j];
				if (typeof a === 'undefined' || !a || !a.href) {
					log('got null anchor at index ' + loopend - j);
					continue;
				}
				doTooltip(a, popData);
			} while (--j);
		}
		if (finish < anchors.length) {
			setTimeout(function () {
				setupTooltipsLoop(anchors, finish, howmany, sleep, remove, popData);
			}, sleep);
		} else {
			if (!remove && !getValueOf('popupTocLinks')) {
				rmTocTooltips();
			}
			pg.flag.finishedLoading = true;
		}
	}

	// eliminate popups from the TOC
	// This also kills any onclick stuff that used to be going on in the toc
	function rmTocTooltips() {
		var toc = document.getElementById('toc');
		if (toc) {
			var tocLinks = toc.getElementsByTagName('A');
			var tocLen = tocLinks.length;
			for (var j = 0; j < tocLen; ++j) {
				removeTooltip(tocLinks[j], true);
			}
		}
	}

	function addTooltip(a, popData) {
		if (!isPopupLink(a)) {
			return;
		}
		a.onmouseover = mouseOverWikiLink;
		a.onmouseout = mouseOutWikiLink;
		a.onmousedown = killPopup;
		a.hasPopup = true;
		a.popData = popData;
	}

	function removeTooltip(a) {
		if (!a.hasPopup) {
			return;
		}
		a.onmouseover = null;
		a.onmouseout = null;
		if (a.originalTitle) {
			a.title = a.originalTitle;
		}
		a.hasPopup = false;
	}

	function removeTitle(a) {
		if (!a.originalTitle) {
			a.originalTitle = a.title;
		}
		a.title = '';
	}

	function restoreTitle(a) {
		if (a.title || !a.originalTitle) {
			return;
		}
		a.title = a.originalTitle;
	}

	function registerHooks(np) {
		var popupMaxWidth = getValueOf('popupMaxWidth');

		if (typeof popupMaxWidth === 'number') {
			var setMaxWidth = function () {
				np.mainDiv.style.maxWidth = popupMaxWidth + 'px';
				np.maxWidth = popupMaxWidth;
			};
			np.addHook(setMaxWidth, 'unhide', 'before');
		}
		np.addHook(addPopupShortcuts, 'unhide', 'after');
		np.addHook(rmPopupShortcuts, 'hide', 'before');
	}

	function removeModifierKeyHandler(a) {
		//remove listeners for modifier key if any that were added in mouseOverWikiLink
		document.removeEventListener('keydown', a.modifierKeyHandler, false);
		document.removeEventListener('keyup', a.modifierKeyHandler, false);
	}

	function mouseOverWikiLink(evt) {
		if (!evt && window.event) {
			evt = window.event;
		}

		// if the modifier is needed, listen for it,
		// we will remove the listener when we mouseout of this link or kill popup.
		if (getValueOf('popupModifier')) {
			// if popupModifierAction = enable, we should popup when the modifier is pressed
			// if popupModifierAction = disable, we should popup unless the modifier is pressed
			var action = getValueOf('popupModifierAction');
			var key = action == 'disable' ? 'keyup' : 'keydown';
			var a = this;
			a.modifierKeyHandler = function (evt) {
				mouseOverWikiLink2(a, evt);
			};
			document.addEventListener(key, a.modifierKeyHandler, false);
		}

		return mouseOverWikiLink2(this, evt);
	}

	/**
	 * Gets the references list item that the provided footnote link targets. This
	 * is typically a li element within the ol.references element inside the reflist.
	 * @param {Element} a - A footnote link.
	 * @returns {Element|boolean} The targeted element, or false if one can't be found.
	 */
	function footnoteTarget(a) {
		var aTitle = Title.fromAnchor(a);
		// We want ".3A" rather than "%3A" or "?" here, so use the anchor property directly
		var anch = aTitle.anchor;
		if (!/^(cite_note-|_note-|endnote)/.test(anch)) {
			return false;
		}

		var lTitle = Title.fromURL(location.href);
		if (lTitle.toString(true) !== aTitle.toString(true)) {
			return false;
		}

		var el = document.getElementById(anch);
		while (el && typeof el.nodeName === 'string') {
			var nt = el.nodeName.toLowerCase();
			if (nt === 'li') {
				return el;
			} else if (nt === 'body') {
				return false;
			} else if (el.parentNode) {
				el = el.parentNode;
			} else {
				return false;
			}
		}
		return false;
	}

	function footnotePreview(x, navpop) {
		setPopupHTML('<hr />' + x.innerHTML, 'popupPreview', navpop.idNumber);
	}

	function modifierPressed(evt) {
		var mod = getValueOf('popupModifier');
		if (!mod) {
			return false;
		}

		if (!evt && window.event) {
			evt = window.event;
		}

		return evt && mod && evt[mod.toLowerCase() + 'Key'];
	}

	// Checks if the correct modifier pressed/unpressed if needed
	function isCorrectModifier(a, evt) {
		if (!getValueOf('popupModifier')) {
			return true;
		}
		// if popupModifierAction = enable, we should popup when the modifier is pressed
		// if popupModifierAction = disable, we should popup unless the modifier is pressed
		var action = getValueOf('popupModifierAction');
		return (
			(action == 'enable' && modifierPressed(evt)) || (action == 'disable' && !modifierPressed(evt))
		);
	}

	function mouseOverWikiLink2(a, evt) {
		if (!isCorrectModifier(a, evt)) {
			return;
		}
		if (getValueOf('removeTitles')) {
			removeTitle(a);
		}
		if (a == pg.current.link && a.navpopup && a.navpopup.isVisible()) {
			return;
		}
		pg.current.link = a;

		if (getValueOf('simplePopups') && !pg.option.popupStructure) {
			// reset *default value* of popupStructure
			setDefault('popupStructure', 'original');
		}

		var article = new Title().fromAnchor(a);
		// set global variable (ugh) to hold article (wikipage)
		pg.current.article = article;

		if (!a.navpopup) {
			a.navpopup = newNavpopup(a, article);
			pg.current.linksHash[a.href] = a.navpopup;
			pg.current.links.push(a);
		}
		if (a.navpopup.pending === null || a.navpopup.pending !== 0) {
			// either fresh popups or those with unfinshed business are redone from scratch
			simplePopupContent(a, article);
		}
		a.navpopup.showSoonIfStable(a.navpopup.delay);

		clearInterval(pg.timer.checkPopupPosition);
		pg.timer.checkPopupPosition = setInterval(checkPopupPosition, 600);

		if (getValueOf('simplePopups')) {
			if (getValueOf('popupPreviewButton') && !a.simpleNoMore) {
				var d = document.createElement('div');
				d.className = 'popupPreviewButtonDiv';
				var s = document.createElement('span');
				d.appendChild(s);
				s.className = 'popupPreviewButton';
				s['on' + getValueOf('popupPreviewButtonEvent')] = function () {
					a.simpleNoMore = true;
					d.style.display = 'none';
					nonsimplePopupContent(a, article);
				};
				s.innerHTML = popupString('show preview');
				setPopupHTML(d, 'popupPreview', a.navpopup.idNumber);
			}
		}

		if (a.navpopup.pending !== 0) {
			nonsimplePopupContent(a, article);
		}
	}

	// simplePopupContent: the content that do not require additional download
	// (it is shown even when simplePopups is true)
	function simplePopupContent(a, article) {
		/* FIXME hack */ a.navpopup.hasPopupMenu = false;
		a.navpopup.setInnerHTML(popupHTML(a));
		fillEmptySpans({ navpopup: a.navpopup });

		if (getValueOf('popupDraggable')) {
			var dragHandle = getValueOf('popupDragHandle') || null;
			if (dragHandle && dragHandle != 'all') {
				dragHandle += a.navpopup.idNumber;
			}
			setTimeout(function () {
				a.navpopup.makeDraggable(dragHandle);
			}, 150);
		}

		if (getValueOf('popupRedlinkRemoval') && a.className == 'new') {
			setPopupHTML('<br>' + popupRedlinkHTML(article), 'popupRedlink', a.navpopup.idNumber);
		}
	}

	function debugData(navpopup) {
		if (getValueOf('popupDebugging') && navpopup.idNumber) {
			setPopupHTML(
				'idNumber=' + navpopup.idNumber + ', pending=' + navpopup.pending,
				'popupError',
				navpopup.idNumber
			);
		}
	}

	function newNavpopup(a, article) {
		var navpopup = new Navpopup();
		navpopup.fuzz = 5;
		navpopup.delay = getValueOf('popupDelay') * 1000;
		// increment global counter now
		navpopup.idNumber = ++pg.idNumber;
		navpopup.parentAnchor = a;
		navpopup.parentPopup = a.popData && a.popData.owner;
		navpopup.article = article;
		registerHooks(navpopup);
		return navpopup;
	}

	// Should we show nonsimple context?
	// If simplePopups is set to true, then we do not show nonsimple context,
	// but if a bottom "show preview" was clicked we do show nonsimple context
	function shouldShowNonSimple(a) {
		return !getValueOf('simplePopups') || a.simpleNoMore;
	}

	// Should we show nonsimple context govern by the option (e.g. popupUserInfo)?
	// If the user explicitly asked for nonsimple context by setting the option to true,
	// then we show it even in nonsimple mode.
	function shouldShow(a, option) {
		if (shouldShowNonSimple(a)) {
			return getValueOf(option);
		} else {
			return typeof window[option] != 'undefined' && window[option];
		}
	}

	function nonsimplePopupContent(a, article) {
		var diff = null,
			history = null;
		var params = parseParams(a.href);
		var oldid = typeof params.oldid == 'undefined' ? null : params.oldid;
		if (shouldShow(a, 'popupPreviewDiffs')) {
			diff = params.diff;
		}
		if (shouldShow(a, 'popupPreviewHistory')) {
			history = params.action == 'history';
		}
		a.navpopup.pending = 0;
		var referenceElement = footnoteTarget(a);
		if (referenceElement) {
			footnotePreview(referenceElement, a.navpopup);
		} else if (diff || diff === 0) {
			loadDiff(article, oldid, diff, a.navpopup);
		} else if (history) {
			loadAPIPreview('history', article, a.navpopup);
		} else if (shouldShowNonSimple(a) && pg.re.contribs.test(a.href)) {
			loadAPIPreview('contribs', article, a.navpopup);
		} else if (shouldShowNonSimple(a) && pg.re.backlinks.test(a.href)) {
			loadAPIPreview('backlinks', article, a.navpopup);
		} else if (
			// FIXME should be able to get all preview combinations with options
			article.namespaceId() == pg.nsImageId &&
			(shouldShow(a, 'imagePopupsForImages') || !anchorContainsImage(a))
		) {
			loadAPIPreview('imagepagepreview', article, a.navpopup);
			loadImage(article, a.navpopup);
		} else {
			if (article.namespaceId() == pg.nsCategoryId && shouldShow(a, 'popupCategoryMembers')) {
				loadAPIPreview('category', article, a.navpopup);
			} else if (
				(article.namespaceId() == pg.nsUserId || article.namespaceId() == pg.nsUsertalkId) &&
				shouldShow(a, 'popupUserInfo')
			) {
				loadAPIPreview('userinfo', article, a.navpopup);
			}
			if (shouldShowNonSimple(a)) {
				startArticlePreview(article, oldid, a.navpopup);
			}
		}
	}

	function pendingNavpopTask(navpop) {
		if (navpop && navpop.pending === null) {
			navpop.pending = 0;
		}
		++navpop.pending;
		debugData(navpop);
	}

	function completedNavpopTask(navpop) {
		if (navpop && navpop.pending) {
			--navpop.pending;
		}
		debugData(navpop);
	}

	function startArticlePreview(article, oldid, navpop) {
		navpop.redir = 0;
		loadPreview(article, oldid, navpop);
	}

	function loadPreview(article, oldid, navpop) {
		if (!navpop.redir) {
			navpop.originalArticle = article;
		}
		article.oldid = oldid;
		loadAPIPreview('revision', article, navpop);
	}

	function loadPreviewFromRedir(redirMatch, navpop) {
		// redirMatch is a regex match
		var target = new Title().fromWikiText(redirMatch[2]);
		// overwrite (or add) anchor from original target
		// mediawiki does overwrite; eg [[User:Lupin/foo3#Done]]
		if (navpop.article.anchor) {
			target.anchor = navpop.article.anchor;
		}
		navpop.redir++;
		navpop.redirTarget = target;
		var warnRedir = redirLink(target, navpop.article);
		setPopupHTML(warnRedir, 'popupWarnRedir', navpop.idNumber);
		navpop.article = target;
		fillEmptySpans({ redir: true, redirTarget: target, navpopup: navpop });
		return loadPreview(target, null, navpop);
	}

	function insertPreview(download) {
		if (!download.owner) {
			return;
		}

		var redirMatch = pg.re.redirect.exec(download.data);
		if (download.owner.redir === 0 && redirMatch) {
			loadPreviewFromRedir(redirMatch, download.owner);
			return;
		}

		if (download.owner.visible || !getValueOf('popupLazyPreviews')) {
			insertPreviewNow(download);
		} else {
			var id = download.owner.redir ? 'PREVIEW_REDIR_HOOK' : 'PREVIEW_HOOK';
			download.owner.addHook(
				function () {
					insertPreviewNow(download);
					return true;
				},
				'unhide',
				'after',
				id
			);
		}
	}

	function insertPreviewNow(download) {
		if (!download.owner) {
			return;
		}
		var wikiText = download.data;
		var navpop = download.owner;
		var art = navpop.redirTarget || navpop.originalArticle;

		makeFixDabs(wikiText, navpop);
		if (getValueOf('popupSummaryData')) {
			getPageInfo(wikiText, download);
			setPopupTrailer(getPageInfo(wikiText, download), navpop.idNumber);
		}

		var imagePage = '';
		if (art.namespaceId() == pg.nsImageId) {
			imagePage = art.toString();
		} else {
			imagePage = getValidImageFromWikiText(wikiText);
		}
		if (imagePage) {
			loadImage(Title.fromWikiText(imagePage), navpop);
		}

		if (getValueOf('popupPreviews')) {
			insertArticlePreview(download, art, navpop);
		}
	}

	function insertArticlePreview(download, art, navpop) {
		if (download && typeof download.data == typeof '') {
			if (art.namespaceId() == pg.nsTemplateId && getValueOf('popupPreviewRawTemplates')) {
				// FIXME compare/consolidate with diff escaping code for wikitext
				var h =
					'<hr /><span style="font-family: monospace;">' +
					download.data.entify().split('\\n').join('<br />\\n') +
					'</span>';
				setPopupHTML(h, 'popupPreview', navpop.idNumber);
			} else {
				var p = prepPreviewmaker(download.data, art, navpop);
				p.showPreview();
			}
		}
	}

	function prepPreviewmaker(data, article, navpop) {
		// deal with tricksy anchors
		var d = anchorize(data, article.anchorString());
		var urlBase = joinPath([pg.wiki.articlebase, article.urlString()]);
		var p = new Previewmaker(d, urlBase, navpop);
		return p;
	}

	// Try to imitate the way mediawiki generates HTML anchors from section titles
	function anchorize(d, anch) {
		if (!anch) {
			return d;
		}
		var anchRe = RegExp(
			'(?:=+\\s*' +
				literalizeRegex(anch).replace(/[_ ]/g, '[_ ]') +
				'\\s*=+|\\{\\{\\s*' +
				getValueOf('popupAnchorRegexp') +
				'\\s*(?:\\|[^|}]*)*?\\s*' +
				literalizeRegex(anch) +
				'\\s*(?:\\|[^}]*)?}})'
		);
		var match = d.match(anchRe);
		if (match && match.length > 0 && match[0]) {
			return d.substring(d.indexOf(match[0]));
		}

		// now try to deal with == foo [[bar|baz]] boom == -> #foo_baz_boom
		var lines = d.split('\n');
		for (var i = 0; i < lines.length; ++i) {
			lines[i] = lines[i]
				.replace(RegExp('[[]{2}([^|\\]]*?[|])?(.*?)[\\]]{2}', 'g'), '$2')
				.replace(/'''([^'])/g, '$1')
				.replace(RegExp("''([^'])", 'g'), '$1');
			if (lines[i].match(anchRe)) {
				return d.split('\n').slice(i).join('\n').replace(RegExp('^[^=]*'), '');
			}
		}
		return d;
	}

	function killPopup() {
		removeModifierKeyHandler(this);
		if (getValueOf('popupShortcutKeys')) {
			rmPopupShortcuts();
		}
		if (!pg) {
			return;
		}
		if (pg.current.link && pg.current.link.navpopup) {
			pg.current.link.navpopup.banish();
		}
		pg.current.link = null;
		abortAllDownloads();
		if (pg.timer.checkPopupPosition) {
			clearInterval(pg.timer.checkPopupPosition);
			pg.timer.checkPopupPosition = null;
		}
		return true; // preserve default action
	}
	// ENDFILE: actions.js

	// STARTFILE: domdrag.js
	/**
	@fileoverview
	The {@link Drag} object, which enables objects to be dragged around.

	<pre>
	*************************************************
	dom-drag.js
	09.25.2001
	www.youngpup.net
	**************************************************
	10.28.2001 - fixed minor bug where events
	sometimes fired off the handle, not the root.
	*************************************************
	Pared down, some hooks added by [[User:Lupin]]

	Copyright Aaron Boodman.
	Saying stupid things daily since March 2001.
	</pre>
	*/

	/**
	 * Creates a new Drag object. This is used to make various DOM elements draggable.
	 * @constructor
	 */
	function Drag() {
		/**
		 * Condition to determine whether or not to drag. This function should take one parameter,
		 * an Event.  To disable this, set it to <code>null</code>.
		 * @type {Function}
		 */
		this.startCondition = null;

		/**
		 * Hook to be run when the drag finishes. This is passed the final coordinates of the
		 * dragged object (two integers, x and y). To disables this, set it to <code>null</code>.
		 * @type {Function}
		 */
		this.endHook = null;
	}

	/**
	 * Gets an event in a cross-browser manner.
	 * @param {Event} e
	 * @private
	 */
	Drag.prototype.fixE = function (e) {
		if (typeof e == 'undefined') {
			e = window.event;
		}
		if (typeof e.layerX == 'undefined') {
			e.layerX = e.offsetX;
		}
		if (typeof e.layerY == 'undefined') {
			e.layerY = e.offsetY;
		}
		return e;
	};

	/**
	 * Initialises the Drag instance by telling it which object you want to be draggable, and what
	 * you want to drag it by.
	 * @param {DOMElement} o The "handle" by which <code>oRoot</code> is dragged.
	 * @param {DOMElement} oRoot The object which moves when <code>o</code> is dragged, or <code>o</code> if omitted.
	 */
	Drag.prototype.init = function (o, oRoot) {
		var dragObj = this;
		this.obj = o;
		o.onmousedown = function (e) {
			dragObj.start.apply(dragObj, [e]);
		};
		o.dragging = false;
		o.popups_draggable = true;
		o.hmode = true;
		o.vmode = true;

		o.root = oRoot ? oRoot : o;

		if (isNaN(parseInt(o.root.style.left, 10))) {
			o.root.style.left = '0px';
		}
		if (isNaN(parseInt(o.root.style.top, 10))) {
			o.root.style.top = '0px';
		}

		o.root.onthisStart = function () {};
		o.root.onthisEnd = function () {};
		o.root.onthis = function () {};
	};

	/**
	 * Starts the drag.
	 * @private
	 * @param {Event} e
	 */
	Drag.prototype.start = function (e) {
		var o = this.obj; // = this;
		e = this.fixE(e);
		if (this.startCondition && !this.startCondition(e)) {
			return;
		}
		var y = parseInt(o.vmode ? o.root.style.top : o.root.style.bottom, 10);
		var x = parseInt(o.hmode ? o.root.style.left : o.root.style.right, 10);
		o.root.onthisStart(x, y);

		o.lastMouseX = e.clientX;
		o.lastMouseY = e.clientY;

		var dragObj = this;
		o.onmousemoveDefault = document.onmousemove;
		o.dragging = true;
		document.onmousemove = function (e) {
			dragObj.drag.apply(dragObj, [e]);
		};
		document.onmouseup = function (e) {
			dragObj.end.apply(dragObj, [e]);
		};
		return false;
	};

	/**
	 * Does the drag.
	 * @param {Event} e
	 * @private
	 */
	Drag.prototype.drag = function (e) {
		e = this.fixE(e);
		var o = this.obj;

		var ey = e.clientY;
		var ex = e.clientX;
		var y = parseInt(o.vmode ? o.root.style.top : o.root.style.bottom, 10);
		var x = parseInt(o.hmode ? o.root.style.left : o.root.style.right, 10);
		var nx, ny;

		nx = x + (ex - o.lastMouseX) * (o.hmode ? 1 : -1);
		ny = y + (ey - o.lastMouseY) * (o.vmode ? 1 : -1);

		this.obj.root.style[o.hmode ? 'left' : 'right'] = nx + 'px';
		this.obj.root.style[o.vmode ? 'top' : 'bottom'] = ny + 'px';
		this.obj.lastMouseX = ex;
		this.obj.lastMouseY = ey;

		this.obj.root.onthis(nx, ny);
		return false;
	};

	/**
	 * Ends the drag.
	 * @private
	 */
	Drag.prototype.end = function () {
		document.onmousemove = this.obj.onmousemoveDefault;
		document.onmouseup = null;
		this.obj.dragging = false;
		if (this.endHook) {
			this.endHook(
				parseInt(this.obj.root.style[this.obj.hmode ? 'left' : 'right'], 10),
				parseInt(this.obj.root.style[this.obj.vmode ? 'top' : 'bottom'], 10)
			);
		}
	};
	// ENDFILE: domdrag.js

	// STARTFILE: structures.js
	pg.structures.original = {};
	pg.structures.original.popupLayout = function () {
		return [
			'popupError',
			'popupImage',
			'popupTopLinks',
			'popupTitle',
			'popupUserData',
			'popupData',
			'popupOtherLinks',
			'popupRedir',
			[
				'popupWarnRedir',
				'popupRedirTopLinks',
				'popupRedirTitle',
				'popupRedirData',
				'popupRedirOtherLinks',
			],
			'popupMiscTools',
			['popupRedlink'],
			'popupPrePreviewSep',
			'popupPreview',
			'popupSecondPreview',
			'popupPreviewMore',
			'popupPostPreview',
			'popupFixDab',
		];
	};
	pg.structures.original.popupRedirSpans = function () {
		return [
			'popupRedir',
			'popupWarnRedir',
			'popupRedirTopLinks',
			'popupRedirTitle',
			'popupRedirData',
			'popupRedirOtherLinks',
		];
	};
	pg.structures.original.popupTitle = function (x) {
		log('defaultstructure.popupTitle');
		if (!getValueOf('popupNavLinks')) {
			return navlinkStringToHTML('<b><<mainlink>></b>', x.article, x.params);
		}
		return '';
	};
	pg.structures.original.popupTopLinks = function (x) {
		log('defaultstructure.popupTopLinks');
		if (getValueOf('popupNavLinks')) {
			return navLinksHTML(x.article, x.hint, x.params);
		}
		return '';
	};
	pg.structures.original.popupImage = function (x) {
		log('original.popupImage, x.article=' + x.article + ', x.navpop.idNumber=' + x.navpop.idNumber);
		return imageHTML(x.article, x.navpop.idNumber);
	};
	pg.structures.original.popupRedirTitle = pg.structures.original.popupTitle;
	pg.structures.original.popupRedirTopLinks = pg.structures.original.popupTopLinks;

	function copyStructure(oldStructure, newStructure) {
		pg.structures[newStructure] = {};
		for (var prop in pg.structures[oldStructure]) {
			pg.structures[newStructure][prop] = pg.structures[oldStructure][prop];
		}
	}

	copyStructure('original', 'nostalgia');
	pg.structures.nostalgia.popupTopLinks = function (x) {
		var str = '';
		str += '<b><<mainlink|shortcut= >></b>';

		// user links
		// contribs - log - count - email - block
		// count only if applicable; block only if popupAdminLinks
		str += 'if(user){<br><<contribs|shortcut=c>>';
		str += 'if(wikimedia){*<<count|shortcut=#>>}';
		str += 'if(ipuser){}else{*<<email|shortcut=E>>}if(admin){*<<block|shortcut=b>>}}';

		// editing links
		// talkpage   -> edit|new - history - un|watch - article|edit
		// other page -> edit - history - un|watch - talk|edit|new
		var editstr = '<<edit|shortcut=e>>';
		var editOldidStr =
			'if(oldid){<<editOld|shortcut=e>>|<<revert|shortcut=v|rv>>|<<edit|cur>>}else{' +
			editstr +
			'}';
		var historystr = '<<history|shortcut=h>>';
		var watchstr = '<<unwatch|unwatchShort>>|<<watch|shortcut=w|watchThingy>>';

		str +=
			'<br>if(talk){' +
			editOldidStr +
			'|<<new|shortcut=+>>' +
			'*' +
			historystr +
			'*' +
			watchstr +
			'*' +
			'<b><<article|shortcut=a>></b>|<<editArticle|edit>>' +
			'}else{' + // not a talk page
			editOldidStr +
			'*' +
			historystr +
			'*' +
			watchstr +
			'*' +
			'<b><<talk|shortcut=t>></b>|<<editTalk|edit>>|<<newTalk|shortcut=+|new>>}';

		// misc links
		str += '<br><<whatLinksHere|shortcut=l>>*<<relatedChanges|shortcut=r>>';
		str += 'if(admin){<br>}else{*}<<move|shortcut=m>>';

		// admin links
		str +=
			'if(admin){*<<unprotect|unprotectShort>>|<<protect|shortcut=p>>*' +
			'<<undelete|undeleteShort>>|<<delete|shortcut=d>>}';
		return navlinkStringToHTML(str, x.article, x.params);
	};
	pg.structures.nostalgia.popupRedirTopLinks = pg.structures.nostalgia.popupTopLinks;

	/** -- fancy -- **/
	copyStructure('original', 'fancy');
	pg.structures.fancy.popupTitle = function (x) {
		return navlinkStringToHTML('<font size=+0><<mainlink>></font>', x.article, x.params);
	};
	pg.structures.fancy.popupTopLinks = function (x) {
		var hist =
			'<<history|shortcut=h|hist>>|<<lastEdit|shortcut=/|last>>|<<editors|shortcut=E|eds>>';
		var watch = '<<unwatch|unwatchShort>>|<<watch|shortcut=w|watchThingy>>';
		var move = '<<move|shortcut=m|move>>';
		return navlinkStringToHTML(
			'if(talk){' +
				'<<edit|shortcut=e>>|<<new|shortcut=+|+>>*' +
				hist +
				'*' +
				'<<article|shortcut=a>>|<<editArticle|edit>>' +
				'*' +
				watch +
				'*' +
				move +
				'}else{<<edit|shortcut=e>>*' +
				hist +
				'*<<talk|shortcut=t|>>|<<editTalk|edit>>|<<newTalk|shortcut=+|new>>' +
				'*' +
				watch +
				'*' +
				move +
				'}<br>',
			x.article,
			x.params
		);
	};
	pg.structures.fancy.popupOtherLinks = function (x) {
		var admin =
			'<<unprotect|unprotectShort>>|<<protect|shortcut=p>>*<<undelete|undeleteShort>>|<<delete|shortcut=d|del>>';
		var user = '<<contribs|shortcut=c>>if(wikimedia){|<<count|shortcut=#|#>>}';
		user +=
			'if(ipuser){|<<arin>>}else{*<<email|shortcut=E|' +
			popupString('email') +
			'>>}if(admin){*<<block|shortcut=b>>}';

		var normal = '<<whatLinksHere|shortcut=l|links here>>*<<relatedChanges|shortcut=r|related>>';
		return navlinkStringToHTML(
			'<br>if(user){' + user + '*}if(admin){' + admin + 'if(user){<br>}else{*}}' + normal,
			x.article,
			x.params
		);
	};
	pg.structures.fancy.popupRedirTitle = pg.structures.fancy.popupTitle;
	pg.structures.fancy.popupRedirTopLinks = pg.structures.fancy.popupTopLinks;
	pg.structures.fancy.popupRedirOtherLinks = pg.structures.fancy.popupOtherLinks;

	/** -- fancy2 -- **/
	// hack for [[User:MacGyverMagic]]
	copyStructure('fancy', 'fancy2');
	pg.structures.fancy2.popupTopLinks = function (x) {
		// hack out the <br> at the end and put one at the beginning
		return '<br>' + pg.structures.fancy.popupTopLinks(x).replace(RegExp('<br>$', 'i'), '');
	};
	pg.structures.fancy2.popupLayout = function () {
		// move toplinks to after the title
		return [
			'popupError',
			'popupImage',
			'popupTitle',
			'popupUserData',
			'popupData',
			'popupTopLinks',
			'popupOtherLinks',
			'popupRedir',
			[
				'popupWarnRedir',
				'popupRedirTopLinks',
				'popupRedirTitle',
				'popupRedirData',
				'popupRedirOtherLinks',
			],
			'popupMiscTools',
			['popupRedlink'],
			'popupPrePreviewSep',
			'popupPreview',
			'popupSecondPreview',
			'popupPreviewMore',
			'popupPostPreview',
			'popupFixDab',
		];
	};

	/** -- menus -- **/
	copyStructure('original', 'menus');
	pg.structures.menus.popupLayout = function () {
		return [
			'popupError',
			'popupImage',
			'popupTopLinks',
			'popupTitle',
			'popupOtherLinks',
			'popupRedir',
			[
				'popupWarnRedir',
				'popupRedirTopLinks',
				'popupRedirTitle',
				'popupRedirData',
				'popupRedirOtherLinks',
			],
			'popupUserData',
			'popupData',
			'popupMiscTools',
			['popupRedlink'],
			'popupPrePreviewSep',
			'popupPreview',
			'popupSecondPreview',
			'popupPreviewMore',
			'popupPostPreview',
			'popupFixDab',
		];
	};

	pg.structures.menus.popupTopLinks = function (x, shorter) {
		// FIXME maybe this stuff should be cached
		var s = [];
		var dropclass = 'popup_drop';
		var enddiv = '</div>';
		var hist = '<<history|shortcut=h>>';
		if (!shorter) {
			hist = '<menurow>' + hist + '|<<historyfeed|rss>>|<<editors|shortcut=E>></menurow>';
		}
		var lastedit = '<<lastEdit|shortcut=/|show last edit>>';
		var thank = 'if(diff){<<thank|send thanks>>}';
		var jsHistory = '<<lastContrib|last set of edits>><<sinceMe|changes since mine>>';
		var linkshere = '<<whatLinksHere|shortcut=l|what links here>>';
		var related = '<<relatedChanges|shortcut=r|related changes>>';
		var search =
			'<menurow><<search|shortcut=s>>if(wikimedia){|<<globalsearch|shortcut=g|global>>}' +
			'|<<google|shortcut=G|web>></menurow>';
		var watch = '<menurow><<unwatch|unwatchShort>>|<<watch|shortcut=w|watchThingy>></menurow>';
		var protect =
			'<menurow><<unprotect|unprotectShort>>|' +
			'<<protect|shortcut=p>>|<<protectlog|log>></menurow>';
		var del =
			'<menurow><<undelete|undeleteShort>>|<<delete|shortcut=d>>|' + '<<deletelog|log>></menurow>';
		var move = '<<move|shortcut=m|move page>>';
		var nullPurge = '<menurow><<nullEdit|shortcut=n|null edit>>|<<purge|shortcut=P>></menurow>';
		var viewOptions = '<menurow><<view|shortcut=v>>|<<render|shortcut=S>>|<<raw>></menurow>';
		var editRow =
			'if(oldid){' +
			'<menurow><<edit|shortcut=e>>|<<editOld|shortcut=e|this&nbsp;revision>></menurow>' +
			'<menurow><<revert|shortcut=v>>|<<undo>></menurow>' +
			'}else{<<edit|shortcut=e>>}';
		var markPatrolled = 'if(rcid){<<markpatrolled|mark patrolled>>}';
		var newTopic = 'if(talk){<<new|shortcut=+|new topic>>}';
		var protectDelete = 'if(admin){' + protect + del + '}';

		if (getValueOf('popupActionsMenu')) {
			s.push('<<mainlink>>*' + menuTitle(dropclass, 'actions'));
		} else {
			s.push('<div class="' + dropclass + '">' + '<<mainlink>>');
		}
		s.push('<menu>');
		s.push(editRow + markPatrolled + newTopic + hist + lastedit + thank);
		if (!shorter) {
			s.push(jsHistory);
		}
		s.push(move + linkshere + related);
		if (!shorter) {
			s.push(nullPurge + search);
		}
		if (!shorter) {
			s.push(viewOptions);
		}
		s.push('<hr />' + watch + protectDelete);
		s.push(
			'<hr />' +
				'if(talk){<<article|shortcut=a|view article>><<editArticle|edit article>>}' +
				'else{<<talk|shortcut=t|talk page>><<editTalk|edit talk>>' +
				'<<newTalk|shortcut=+|new topic>>}</menu>' +
				enddiv
		);

		// user menu starts here
		var email = '<<email|shortcut=E|email user>>';
		var contribs =
			'if(wikimedia){<menurow>}<<contribs|shortcut=c|contributions>>if(wikimedia){</menurow>}' +
			'if(admin){<menurow><<deletedContribs>></menurow>}';

		s.push('if(user){*' + menuTitle(dropclass, 'user'));
		s.push('<menu>');
		s.push('<menurow><<userPage|shortcut=u|user&nbsp;page>>|<<userSpace|space>></menurow>');
		s.push(
			'<<userTalk|shortcut=t|user talk>><<editUserTalk|edit user talk>>' +
				'<<newUserTalk|shortcut=+|leave comment>>'
		);
		if (!shorter) {
			s.push('if(ipuser){<<arin>>}else{' + email + '}');
		} else {
			s.push('if(ipuser){}else{' + email + '}');
		}
		s.push('<hr />' + contribs + '<<userlog|shortcut=L|user log>>');
		s.push('if(wikimedia){<<count|shortcut=#|edit counter>>}');
		s.push(
			'if(admin){<menurow><<unblock|unblockShort>>|<<block|shortcut=b|block user>></menurow>}'
		);
		s.push('<<blocklog|shortcut=B|block log>>');
		s.push('</menu>' + enddiv + '}');

		// popups menu starts here
		if (getValueOf('popupSetupMenu') && !x.navpop.hasPopupMenu /* FIXME: hack */) {
			x.navpop.hasPopupMenu = true;
			s.push('*' + menuTitle(dropclass, 'popupsMenu') + '<menu>');
			s.push('<<togglePreviews|toggle previews>>');
			s.push('<<purgePopups|reset>>');
			s.push('<<disablePopups|disable>>');
			s.push('</menu>' + enddiv);
		}
		return navlinkStringToHTML(s.join(''), x.article, x.params);
	};

	function menuTitle(dropclass, s) {
		var text = popupString(s); // i18n
		var len = text.length;
		return '<div class="' + dropclass + '" style="--navpop-m-len:' + len + 'ch">' + '<a href="#" noPopup=1>' + text + '</a>';
	}

	pg.structures.menus.popupRedirTitle = pg.structures.menus.popupTitle;
	pg.structures.menus.popupRedirTopLinks = pg.structures.menus.popupTopLinks;

	copyStructure('menus', 'shortmenus');
	pg.structures.shortmenus.popupTopLinks = function (x) {
		return pg.structures.menus.popupTopLinks(x, true);
	};
	pg.structures.shortmenus.popupRedirTopLinks = pg.structures.shortmenus.popupTopLinks;

	pg.structures.lite = {};
	pg.structures.lite.popupLayout = function () {
		return ['popupTitle', 'popupPreview'];
	};
	pg.structures.lite.popupTitle = function (x) {
		log(x.article + ': structures.lite.popupTitle');
		//return navlinkStringToHTML('<b><<mainlink>></b>',x.article,x.params);
		return '<div><span class="popup_mainlink"><b>' + x.article.toString() + '</b></span></div>';
	};
	// ENDFILE: structures.js

	// STARTFILE: autoedit.js
	function substitute(data, cmdBody) {
		// alert('sub\nfrom: '+cmdBody.from+'\nto: '+cmdBody.to+'\nflags: '+cmdBody.flags);
		var fromRe = RegExp(cmdBody.from, cmdBody.flags);
		return data.replace(fromRe, cmdBody.to);
	}

	function execCmds(data, cmdList) {
		for (var i = 0; i < cmdList.length; ++i) {
			data = cmdList[i].action(data, cmdList[i]);
		}
		return data;
	}

	function parseCmd(str) {
		// returns a list of commands
		if (!str.length) {
			return [];
		}
		var p = false;
		switch (str.charAt(0)) {
			case 's':
				p = parseSubstitute(str);
				break;
			default:
				return false;
		}
		if (p) {
			return [p].concat(parseCmd(p.remainder));
		}
		return false;
	}

	// FIXME: Only used once here, confusing with native (and more widely-used) unescape, should probably be replaced
	// Then again, unescape is semi-soft-deprecated, so we should look into replacing that too
	function unEscape(str, sep) {
		return str
			.split('\\\\')
			.join('\\')
			.split('\\' + sep)
			.join(sep)
			.split('\\n')
			.join('\n');
	}

	function parseSubstitute(str) {
		// takes a string like s/a/b/flags;othercmds and parses it

		var from, to, flags, tmp;

		if (str.length < 4) {
			return false;
		}
		var sep = str.charAt(1);
		str = str.substring(2);

		tmp = skipOver(str, sep);
		if (tmp) {
			from = tmp.segment;
			str = tmp.remainder;
		} else {
			return false;
		}

		tmp = skipOver(str, sep);
		if (tmp) {
			to = tmp.segment;
			str = tmp.remainder;
		} else {
			return false;
		}

		flags = '';
		if (str.length) {
			tmp = skipOver(str, ';') || skipToEnd(str, ';');
			if (tmp) {
				flags = tmp.segment;
				str = tmp.remainder;
			}
		}

		return {
			action: substitute,
			from: from,
			to: to,
			flags: flags,
			remainder: str,
		};
	}

	function skipOver(str, sep) {
		var endSegment = findNext(str, sep);
		if (endSegment < 0) {
			return false;
		}
		var segment = unEscape(str.substring(0, endSegment), sep);
		return { segment: segment, remainder: str.substring(endSegment + 1) };
	}

	/*eslint-disable*/
	function skipToEnd(str, sep) {
		return { segment: str, remainder: '' };
	}
	/*eslint-enable */

	function findNext(str, ch) {
		for (var i = 0; i < str.length; ++i) {
			if (str.charAt(i) == '\\') {
				i += 2;
			}
			if (str.charAt(i) == ch) {
				return i;
			}
		}
		return -1;
	}

	function setCheckbox(param, box) {
		var val = mw.util.getParamValue(param);
		if (val) {
			switch (val) {
				case '1':
				case 'yes':
				case 'true':
					box.checked = true;
					break;
				case '0':
				case 'no':
				case 'false':
					box.checked = false;
			}
		}
	}

	function autoEdit() {
		setupPopups(function () {
			if (mw.util.getParamValue('autoimpl') !== popupString('autoedit_version')) {
				return false;
			}
			if (
				mw.util.getParamValue('autowatchlist') &&
				mw.util.getParamValue('actoken') === autoClickToken()
			) {
				pg.fn.modifyWatchlist(mw.util.getParamValue('title'), mw.util.getParamValue('action'));
			}
			if (!document.editform) {
				return false;
			}
			if (autoEdit.alreadyRan) {
				return false;
			}
			autoEdit.alreadyRan = true;
			var cmdString = mw.util.getParamValue('autoedit');
			if (cmdString) {
				try {
					var editbox = document.editform.wpTextbox1;
					var cmdList = parseCmd(cmdString);
					var input = editbox.value;
					var output = execCmds(input, cmdList);
					editbox.value = output;
				} catch (dang) {
					return;
				}
				// wikEd user script compatibility
				if (typeof wikEdUseWikEd != 'undefined') {
					if (wikEdUseWikEd === true) {
						WikEdUpdateFrame();
					}
				}
			}
			setCheckbox('autominor', document.editform.wpMinoredit);
			setCheckbox('autowatch', document.editform.wpWatchthis);

			var rvid = mw.util.getParamValue('autorv');
			if (rvid) {
				var url =
					pg.wiki.apiwikibase +
					'?action=query&format=json&formatversion=2&prop=revisions&revids=' +
					rvid;
				startDownload(url, null, autoEdit2);
			} else {
				autoEdit2();
			}
		});
	}

	function autoEdit2(d) {
		var summary = mw.util.getParamValue('autosummary');
		var summaryprompt = mw.util.getParamValue('autosummaryprompt');
		var summarynotice = '';
		if (d && d.data && mw.util.getParamValue('autorv')) {
			var s = getRvSummary(summary, d.data);
			if (s === false) {
				summaryprompt = true;
				summarynotice = popupString(
					'Failed to get revision information, please edit manually.\n\n'
				);
				summary = simplePrintf(summary, [
					mw.util.getParamValue('autorv'),
					'(unknown)',
					'(unknown)',
				]);
			} else {
				summary = s;
			}
		}
		if (summaryprompt) {
			var txt =
				summarynotice + popupString('Enter a non-empty edit summary or press cancel to abort');
			var response = prompt(txt, summary);
			if (response) {
				summary = response;
			} else {
				return;
			}
		}
		if (summary) {
			document.editform.wpSummary.value = summary;
		}
		// Attempt to avoid possible premature clicking of the save button
		// (maybe delays in updates to the DOM are to blame?? or a red herring)
		setTimeout(autoEdit3, 100);
	}

	function autoClickToken() {
		return mw.user.sessionId();
	}

	function autoEdit3() {
		if (mw.util.getParamValue('actoken') != autoClickToken()) {
			return;
		}

		var btn = mw.util.getParamValue('autoclick');
		if (btn) {
			if (document.editform && document.editform[btn]) {
				var button = document.editform[btn];
				var msg = tprintf(
					'The %s button has been automatically clicked. Please wait for the next page to load.',
					[button.value]
				);
				bannerMessage(msg);
				document.title = '(' + document.title + ')';
				button.click();
			} else {
				alert(
					tprintf('Could not find button %s. Please check the settings in your javascript file.', [
						btn,
					])
				);
			}
		}
	}

	function bannerMessage(s) {
		var headings = document.getElementsByTagName('h1');
		if (headings) {
			var div = document.createElement('div');
			div.innerHTML = '<font size=+1><b>' + pg.escapeQuotesHTML(s) + '</b></font>';
			headings[0].parentNode.insertBefore(div, headings[0]);
		}
	}

	function getRvSummary(template, json) {
		try {
			var o = getJsObj(json);
			var edit = anyChild(o.query.pages).revisions[0];
			var timestamp = edit.timestamp
				.split(/[A-Z]/g)
				.join(' ')
				.replace(/^ *| *$/g, '');
			return simplePrintf(template, [
				edit.revid,
				timestamp,
				edit.userhidden ? '(hidden)' : edit.user,
			]);
		} catch (badness) {
			return false;
		}
	}

	// ENDFILE: autoedit.js

	// STARTFILE: downloader.js
	/**
	 * @fileoverview
	 * {@link Downloader}, a xmlhttprequest wrapper, and helper functions.
	 */

	/**
	 * Creates a new Downloader
	 * @constructor
	 * @class The Downloader class. Create a new instance of this class to download stuff.
	 * @param {String} url The url to download. This can be omitted and supplied later.
	 */
	function Downloader(url) {
		if (typeof XMLHttpRequest != 'undefined') {
			this.http = new XMLHttpRequest();
		}

		/**
		 * The url to download
		 * @type {string}
		 */
		this.url = url;

		/**
		 * A universally unique ID number
		 * @type {number}
		 */
		this.id = null;

		/**
		 * Modification date, to be culled from the incoming headers
		 * @type Date
		 * @private
		 */
		this.lastModified = null;

		/**
		 * What to do when the download completes successfully
		 * @type {Function}
		 * @private
		 */
		this.callbackFunction = null;

		/**
		 * What to do on failure
		 * @type {Function}
		 * @private
		 */
		this.onFailure = null;

		/**
		 * Flag set on <code>abort</code>
		 * @type {boolean}
		 */
		this.aborted = false;

		/**
		 * HTTP method. See https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html for
		 * possibilities.
		 * @type {string}
		 */
		this.method = 'GET';
		/**
		Async flag.
		@type {boolean}
	*/
		this.async = true;
	}

	new Downloader();

	/** Submits the http request. */
	Downloader.prototype.send = function (x) {
		if (!this.http) {
			return null;
		}
		return this.http.send(x);
	};

	/** Aborts the download, setting the <code>aborted</code> field to true.  */
	Downloader.prototype.abort = function () {
		if (!this.http) {
			return null;
		}
		this.aborted = true;
		return this.http.abort();
	};

	/** Returns the downloaded data. */
	Downloader.prototype.getData = function () {
		if (!this.http) {
			return null;
		}
		return this.http.responseText;
	};

	/** Prepares the download. */
	Downloader.prototype.setTarget = function () {
		if (!this.http) {
			return null;
		}
		this.http.open(this.method, this.url, this.async);
		this.http.setRequestHeader('Api-User-Agent', pg.api.userAgent);
	};

	/** Gets the state of the download. */
	Downloader.prototype.getReadyState = function () {
		if (!this.http) {
			return null;
		}
		return this.http.readyState;
	};

	pg.misc.downloadsInProgress = {};

	/**
	 * Starts the download.
	 * Note that setTarget {@link Downloader#setTarget} must be run first
	 */
	Downloader.prototype.start = function () {
		if (!this.http) {
			return;
		}
		pg.misc.downloadsInProgress[this.id] = this;
		this.http.send(null);
	};

	/**
	 * Gets the 'Last-Modified' date from the download headers.
	 * Should be run after the download completes.
	 * Returns <code>null</code> on failure.
	 * @return {Date}
	 */
	Downloader.prototype.getLastModifiedDate = function () {
		if (!this.http) {
			return null;
		}
		var lastmod = null;
		try {
			lastmod = this.http.getResponseHeader('Last-Modified');
		} catch (err) {}
		if (lastmod) {
			return new Date(lastmod);
		}
		return null;
	};

	/**
	 * Sets the callback function.
	 * @param {Function} f callback function, called as <code>f(this)</code> on success
	 */
	Downloader.prototype.setCallback = function (f) {
		if (!this.http) {
			return;
		}
		this.http.onreadystatechange = f;
	};

	Downloader.prototype.getStatus = function () {
		if (!this.http) {
			return null;
		}
		return this.http.status;
	};

	//////////////////////////////////////////////////
	// helper functions

	/**
	 * Creates a new {@link Downloader} and prepares it for action.
	 * @param {String} url The url to download
	 * @param {number} id The ID of the {@link Downloader} object
	 * @param {Function} callback The callback function invoked on success
	 * @return {String/Downloader} the {@link Downloader} object created, or 'ohdear' if an unsupported browser
	 */
	function newDownload(url, id, callback, onfailure) {
		var d = new Downloader(url);
		if (!d.http) {
			return 'ohdear';
		}
		d.id = id;
		d.setTarget();
		if (!onfailure) {
			onfailure = 2;
		}
		var f = function () {
			if (d.getReadyState() == 4) {
				delete pg.misc.downloadsInProgress[this.id];
				try {
					if (d.getStatus() == 200) {
						d.data = d.getData();
						d.lastModified = d.getLastModifiedDate();
						callback(d);
					} else if (typeof onfailure == typeof 1) {
						if (onfailure > 0) {
							// retry
							newDownload(url, id, callback, onfailure - 1);
						}
					} else if (typeof onfailure === 'function') {
						onfailure(d, url, id, callback);
					}
				} catch (somerr) {
					/* ignore it */
				}
			}
		};
		d.setCallback(f);
		return d;
	}
	/**
	 * Simulates a download from cached data.
	 * The supplied data is put into a {@link Downloader} as if it had downloaded it.
	 * @param {String} url The url.
	 * @param {number} id The ID.
	 * @param {Function} callback The callback, which is invoked immediately as <code>callback(d)</code>,
	 * where <code>d</code> is the new {@link Downloader}.
	 * @param {String} data The (cached) data.
	 * @param {Date} lastModified The (cached) last modified date.
	 */
	function fakeDownload(url, id, callback, data, lastModified, owner) {
		var d = newDownload(url, callback);
		d.owner = owner;
		d.id = id;
		d.data = data;
		d.lastModified = lastModified;
		return callback(d);
	}

	/**
	 * Starts a download.
	 * @param {String} url The url to download
	 * @param {number} id The ID of the {@link Downloader} object
	 * @param {Function} callback The callback function invoked on success
	 * @return {String/Downloader} the {@link Downloader} object created, or 'ohdear' if an unsupported browser
	 */
	function startDownload(url, id, callback) {
		var d = newDownload(url, id, callback);
		if (typeof d == typeof '') {
			return d;
		}
		d.start();
		return d;
	}

	/**
	 * Aborts all downloads which have been started.
	 */
	function abortAllDownloads() {
		for (var x in pg.misc.downloadsInProgress) {
			try {
				pg.misc.downloadsInProgress[x].aborted = true;
				pg.misc.downloadsInProgress[x].abort();
				delete pg.misc.downloadsInProgress[x];
			} catch (e) {}
		}
	}
	// ENDFILE: downloader.js

	// STARTFILE: livepreview.js
	// TODO: location is often not correct (eg relative links in previews)
	// NOTE: removed md5 and image and math parsing. was broken, lots of bytes.
	/**
	 * InstaView - a Mediawiki to HTML converter in JavaScript
	 * Version 0.6.1
	 * Copyright (C) Pedro Fayolle 2005-2006
	 * https://en.wikipedia.org/wiki/User:Pilaf
	 * Distributed under the BSD license
	 *
	 * Changelog:
	 *
	 * 0.6.1
	 * - Fixed problem caused by \r characters
	 * - Improved inline formatting parser
	 *
	 * 0.6
	 * - Changed name to InstaView
	 * - Some major code reorganizations and factored out some common functions
	 * - Handled conversion of relative links (i.e. [[/foo]])
	 * - Fixed misrendering of adjacent definition list items
	 * - Fixed bug in table headings handling
	 * - Changed date format in signatures to reflect Mediawiki's
	 * - Fixed handling of [[:Image:...]]
	 * - Updated MD5 function (hopefully it will work with UTF-8)
	 * - Fixed bug in handling of links inside images
	 *
	 * To do:
	 * - Better support for math tags
	 * - Full support for <nowiki>
	 * - Parser-based (as opposed to RegExp-based) inline wikicode handling (make it one-pass and
	 *   bullet-proof)
	 * - Support for templates (through AJAX)
	 * - Support for coloured links (AJAX)
	 */

	var Insta = {};

	function setupLivePreview() {
		// options
		Insta.conf = {
			baseUrl: '',

			user: {},

			wiki: {
				lang: pg.wiki.lang,
				interwiki: pg.wiki.interwiki,
				default_thumb_width: 180,
			},

			paths: {
				articles: pg.wiki.articlePath + '/',
				// Only used for Insta previews with images. (not in popups)
				math: '/math/',
				images: '//upload.wikimedia.org/wikipedia/en/', // FIXME getImageUrlStart(pg.wiki.hostname),
				images_fallback: '//upload.wikimedia.org/wikipedia/commons/',
			},

			locale: {
				user: mw.config.get('wgFormattedNamespaces')[pg.nsUserId],
				image: mw.config.get('wgFormattedNamespaces')[pg.nsImageId],
				category: mw.config.get('wgFormattedNamespaces')[pg.nsCategoryId],
				// shouldn't be used in popup previews, i think
				months: [
					'Jan',
					'Feb',
					'Mar',
					'Apr',
					'May',
					'Jun',
					'Jul',
					'Aug',
					'Sep',
					'Oct',
					'Nov',
					'Dec',
				],
			},
		};

		// options with default values or backreferences
		Insta.conf.user.name = Insta.conf.user.name || 'Wikipedian';
		Insta.conf.user.signature =
			'[[' +
			Insta.conf.locale.user +
			':' +
			Insta.conf.user.name +
			'|' +
			Insta.conf.user.name +
			']]';
		//Insta.conf.paths.images = '//upload.wikimedia.org/wikipedia/' + Insta.conf.wiki.lang + '/';

		// define constants
		Insta.BLOCK_IMAGE = new RegExp(
			'^\\[\\[(?:File|Image|' +
				Insta.conf.locale.image +
				'):.*?\\|.*?(?:frame|thumbnail|thumb|none|right|left|center)',
			'i'
		);
	}

	Insta.dump = function (from, to) {
		if (typeof from == 'string') {
			from = document.getElementById(from);
		}
		if (typeof to == 'string') {
			to = document.getElementById(to);
		}
		to.innerHTML = this.convert(from.value);
	};

	Insta.convert = function (wiki) {
		var ll = typeof wiki == 'string' ? wiki.replace(/\r/g, '').split(/\n/) : wiki, // lines of wikicode
			o = '', // output
			p = 0, // para flag
			r; // result of passing a regexp to compareLineStringOrReg()

		// some shorthands
		function remain() {
			return ll.length;
		}
		function sh() {
			return ll.shift();
		} // shift
		function ps(s) {
			o += s;
		} // push

		// similar to C's printf, uses ? as placeholders, ?? to escape question marks
		function f() {
			var i = 1,
				a = arguments,
				f = a[0],
				o = '',
				c,
				p;
			for (; i < a.length; i++) {
				if ((p = f.indexOf('?')) + 1) {
					// allow character escaping
					i -= c = f.charAt(p + 1) == '?' ? 1 : 0;
					o += f.substring(0, p) + (c ? '?' : a[i]);
					f = f.substr(p + 1 + c);
				} else {
					break;
				}
			}
			return o + f;
		}

		function html_entities(s) {
			return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		}

		// Wiki text parsing to html is a nightmare.
		// The below functions deliberately don't escape the ampersand since this would make it more
		// difficult, and we don't absolutely need to for how we need it. This means that any
		// unescaped ampersands in wikitext will remain unescaped and can cause invalid HTML.
		// Browsers should all be able to handle it though. We also escape significant wikimarkup
		// characters to prevent further matching on the processed text.
		function htmlescape_text(s) {
			return s
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/:/g, '&#58;')
				.replace(/\[/g, '&#91;')
				.replace(/]/g, '&#93;');
		}
		function htmlescape_attr(s) {
			return htmlescape_text(s).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
		}

		// return the first non matching character position between two strings
		function str_imatch(a, b) {
			for (var i = 0, l = Math.min(a.length, b.length); i < l; i++) {
				if (a.charAt(i) != b.charAt(i)) {
					break;
				}
			}
			return i;
		}

		// compare current line against a string or regexp
		// if passed a string it will compare only the first string.length characters
		// if passed a regexp the result is stored in r
		function compareLineStringOrReg(c) {
			return typeof c == 'string'
				? ll[0] && ll[0].substr(0, c.length) == c
				: (r = ll[0] && ll[0].match(c));
		}

		function compareLineString(c) {
			return ll[0] == c;
		} // compare current line against a string
		function charAtPoint(p) {
			return ll[0].charAt(p);
		} // return char at pos p

		function endl(s) {
			ps(s);
			sh();
		}

		function parse_list() {
			var prev = '';

			while (remain() && compareLineStringOrReg(/^([*#:;]+)(.*)$/)) {
				var l_match = r;

				sh();

				var ipos = str_imatch(prev, l_match[1]);

				// close uncontinued lists
				for (var prevPos = prev.length - 1; prevPos >= ipos; prevPos--) {
					var pi = prev.charAt(prevPos);

					if (pi == '*') {
						ps('</ul>');
					} else if (pi == '#') {
						ps('</ol>');
					}
					// close a dl only if the new item is not a dl item (:, ; or empty)
					else if ($.inArray(l_match[1].charAt(prevPos), ['', '*', '#'])) {
						ps('</dl>');
					}
				}

				// open new lists
				for (var matchPos = ipos; matchPos < l_match[1].length; matchPos++) {
					var li = l_match[1].charAt(matchPos);

					if (li == '*') {
						ps('<ul>');
					} else if (li == '#') {
						ps('<ol>');
					}
					// open a new dl only if the prev item is not a dl item (:, ; or empty)
					else if ($.inArray(prev.charAt(matchPos), ['', '*', '#'])) {
						ps('<dl>');
					}
				}

				switch (l_match[1].charAt(l_match[1].length - 1)) {
					case '*':
					case '#':
						ps('<li>' + parse_inline_nowiki(l_match[2]));
						break;

					case ';':
						ps('<dt>');

						var dt_match = l_match[2].match(/(.*?)(:.*?)$/);

						// handle ;dt :dd format
						if (dt_match) {
							ps(parse_inline_nowiki(dt_match[1]));
							ll.unshift(dt_match[2]);
						} else {
							ps(parse_inline_nowiki(l_match[2]));
						}
						break;

					case ':':
						ps('<dd>' + parse_inline_nowiki(l_match[2]));
				}

				prev = l_match[1];
			}

			// close remaining lists
			for (var i = prev.length - 1; i >= 0; i--) {
				ps(f('</?>', prev.charAt(i) == '*' ? 'ul' : prev.charAt(i) == '#' ? 'ol' : 'dl'));
			}
		}

		function parse_table() {
			endl(f('<table>', compareLineStringOrReg(/^\{\|( .*)$/) ? r[1] : ''));

			for (; remain(); ) {
				if (compareLineStringOrReg('|')) {
					switch (charAtPoint(1)) {
						case '}':
							endl('</table>');
							return;
						case '-':
							endl(f('<tr>', compareLineStringOrReg(/\|-*(.*)/)[1]));
							break;
						default:
							parse_table_data();
					}
				} else if (compareLineStringOrReg('!')) {
					parse_table_data();
				} else {
					sh();
				}
			}
		}

		function parse_table_data() {
			var td_line, match_i;

			// 1: "|+", '|' or '+'
			// 2: ??
			// 3: attributes ??
			// TODO: finish commenting this regexp
			var td_match = sh().match(/^(\|\+|\||!)((?:([^[|]*?)\|(?!\|))?(.*))$/);

			if (td_match[1] == '|+') {
				ps('<caption');
			} else {
				ps('<t' + (td_match[1] == '|' ? 'd' : 'h'));
			}

			if (typeof td_match[3] != 'undefined') {
				//ps(' ' + td_match[3])
				match_i = 4;
			} else {
				match_i = 2;
			}

			ps('>');

			if (td_match[1] != '|+') {
				// use || or !! as a cell separator depending on context
				// NOTE: when split() is passed a regexp make sure to use non-capturing brackets
				td_line = td_match[match_i].split(td_match[1] == '|' ? '||' : /(?:\|\||!!)/);

				ps(parse_inline_nowiki(td_line.shift()));

				while (td_line.length) {
					ll.unshift(td_match[1] + td_line.pop());
				}
			} else {
				ps(parse_inline_nowiki(td_match[match_i]));
			}

			var tc = 0,
				td = [];

			while (remain()) {
				td.push(sh());
				if (compareLineStringOrReg('|')) {
					if (!tc) {
						break;
					}
					// we're at the outer-most level (no nested tables), skip to td parse
					else if (charAtPoint(1) == '}') {
						tc--;
					}
				} else if (!tc && compareLineStringOrReg('!')) {
					break;
				} else if (compareLineStringOrReg('{|')) {
					tc++;
				}
			}

			if (td.length) {
				ps(Insta.convert(td));
			}
		}

		function parse_pre() {
			ps('<pre>');
			do {
				endl(parse_inline_nowiki(ll[0].substring(1)) + '\n');
			} while (remain() && compareLineStringOrReg(' '));
			ps('</pre>');
		}

		function parse_block_image() {
			ps(parse_image(sh()));
		}

		function parse_image(str) {
			// get what's in between "[[Image:" and "]]"
			var tag = str.substring(str.indexOf(':') + 1, str.length - 2);
			var width;
			var attr = [],
				filename,
				caption = '';
			var thumb = 0,
				frame = 0,
				center = 0;
			var align = '';

			if (tag.match(/\|/)) {
				// manage nested links
				var nesting = 0;
				var last_attr;
				for (var i = tag.length - 1; i > 0; i--) {
					if (tag.charAt(i) == '|' && !nesting) {
						last_attr = tag.substr(i + 1);
						tag = tag.substring(0, i);
						break;
					} else {
						switch (tag.substr(i - 1, 2)) {
							case ']]':
								nesting++;
								i--;
								break;
							case '[[':
								nesting--;
								i--;
						}
					}
				}

				attr = tag.split(/\s*\|\s*/);
				attr.push(last_attr);
				filename = attr.shift();

				var w_match;

				for (; attr.length; attr.shift()) {
					w_match = attr[0].match(/^(\d*)(?:[px]*\d*)?px$/);
					if (w_match) {
						width = w_match[1];
					} else {
						switch (attr[0]) {
							case 'thumb':
							case 'thumbnail':
								thumb = true;
								frame = true;
								break;
							case 'frame':
								frame = true;
								break;
							case 'none':
							case 'right':
							case 'left':
								center = false;
								align = attr[0];
								break;
							case 'center':
								center = true;
								align = 'none';
								break;
							default:
								if (attr.length == 1) {
									caption = attr[0];
								}
						}
					}
				}
			} else {
				filename = tag;
			}

			return '';
		}

		function parse_inline_nowiki(str) {
			var start,
				lastend = 0;
			var substart = 0,
				nestlev = 0,
				open,
				close,
				subloop;
			var html = '';

			while ((start = str.indexOf('<nowiki>', substart)) != -1) {
				html += parse_inline_wiki(str.substring(lastend, start));
				start += 8;
				substart = start;
				subloop = true;
				do {
					open = str.indexOf('<nowiki>', substart);
					close = str.indexOf('</nowiki>', substart);
					if (close <= open || open == -1) {
						if (close == -1) {
							return html + html_entities(str.substr(start));
						}
						substart = close + 9;
						if (nestlev) {
							nestlev--;
						} else {
							lastend = substart;
							html += html_entities(str.substring(start, lastend - 9));
							subloop = false;
						}
					} else {
						substart = open + 8;
						nestlev++;
					}
				} while (subloop);
			}

			return html + parse_inline_wiki(str.substr(lastend));
		}

		function parse_inline_images(str) {
			var start,
				substart = 0,
				nestlev = 0;
			var loop, close, open, wiki, html;

			while ((start = str.indexOf('[[', substart)) != -1) {
				if (
					str.substr(start + 2).match(RegExp('^(Image|File|' + Insta.conf.locale.image + '):', 'i'))
				) {
					loop = true;
					substart = start;
					do {
						substart += 2;
						close = str.indexOf(']]', substart);
						open = str.indexOf('[[', substart);
						if (close <= open || open == -1) {
							if (close == -1) {
								return str;
							}
							substart = close;
							if (nestlev) {
								nestlev--;
							} else {
								wiki = str.substring(start, close + 2);
								html = parse_image(wiki);
								str = str.replace(wiki, html);
								substart = start + html.length;
								loop = false;
							}
						} else {
							substart = open;
							nestlev++;
						}
					} while (loop);
				} else {
					break;
				}
			}

			return str;
		}

		// the output of this function doesn't respect the FILO structure of HTML
		// but since most browsers can handle it I'll save myself the hassle
		function parse_inline_formatting(str) {
			var em,
				st,
				i,
				li,
				o = '';
			while ((i = str.indexOf("''", li)) + 1) {
				o += str.substring(li, i);
				li = i + 2;
				if (str.charAt(i + 2) == "'") {
					li++;
					st = !st;
					o += st ? '<strong>' : '</strong>';
				} else {
					em = !em;
					o += em ? '<em>' : '</em>';
				}
			}
			return o + str.substr(li);
		}

		function parse_inline_wiki(str) {
			str = parse_inline_images(str);

			// math
			str = str.replace(/<(?:)math>(.*?)<\/math>/gi, '');

			// Build a Mediawiki-formatted date string
			var date = new Date();
			var minutes = date.getUTCMinutes();
			if (minutes < 10) {
				minutes = '0' + minutes;
			}
			date = f(
				'?:?, ? ? ? (UTC)',
				date.getUTCHours(),
				minutes,
				date.getUTCDate(),
				Insta.conf.locale.months[date.getUTCMonth()],
				date.getUTCFullYear()
			);

			// text formatting
			str =
				str
					// signatures
					.replace(/~{5}(?!~)/g, date)
					.replace(/~{4}(?!~)/g, Insta.conf.user.name + ' ' + date)
					.replace(/~{3}(?!~)/g, Insta.conf.user.name)
					// [[:Category:...]], [[:Image:...]], etc...
					.replace(
						RegExp(
							'\\[\\[:((?:' +
								Insta.conf.locale.category +
								'|Image|File|' +
								Insta.conf.locale.image +
								'|' +
								Insta.conf.wiki.interwiki +
								'):[^|]*?)\\]\\](\\w*)',
							'gi'
						),
						function ($0, $1, $2) {
							return f(
								"<a href='?'>?</a>",
								Insta.conf.paths.articles + htmlescape_attr($1),
								htmlescape_text($1) + htmlescape_text($2)
							);
						}
					)
					// remove straight category and interwiki tags
					.replace(
						RegExp(
							'\\[\\[(?:' +
								Insta.conf.locale.category +
								'|' +
								Insta.conf.wiki.interwiki +
								'):.*?\\]\\]',
							'gi'
						),
						''
					)
					// [[:Category:...|Links]], [[:Image:...|Links]], etc...
					.replace(
						RegExp(
							'\\[\\[:((?:' +
								Insta.conf.locale.category +
								'|Image|File|' +
								Insta.conf.locale.image +
								'|' +
								Insta.conf.wiki.interwiki +
								'):.*?)\\|([^\\]]+?)\\]\\](\\w*)',
							'gi'
						),
						function ($0, $1, $2, $3) {
							return f(
								"<a href='?'>?</a>",
								Insta.conf.paths.articles + htmlescape_attr($1),
								htmlescape_text($2) + htmlescape_text($3)
							);
						}
					)
					// [[/Relative links]]
					.replace(/\[\[(\/[^|]*?)\]\]/g, function ($0, $1) {
						return f(
							"<a href='?'>?</a>",
							Insta.conf.baseUrl + htmlescape_attr($1),
							htmlescape_text($1)
						);
					})
					// [[/Replaced|Relative links]]
					.replace(/\[\[(\/.*?)\|(.+?)\]\]/g, function ($0, $1, $2) {
						return f(
							"<a href='?'>?</a>",
							Insta.conf.baseUrl + htmlescape_attr($1),
							htmlescape_text($2)
						);
					})
					// [[Common links]]
					.replace(/\[\[([^[|]*?)\]\](\w*)/g, function ($0, $1, $2) {
						return f(
							"<a href='?'>?</a>",
							Insta.conf.paths.articles + htmlescape_attr($1),
							htmlescape_text($1) + htmlescape_text($2)
						);
					})
					// [[Replaced|Links]]
					.replace(/\[\[([^[]*?)\|([^\]]+?)\]\](\w*)/g, function ($0, $1, $2, $3) {
						return f(
							"<a href='?'>?</a>",
							Insta.conf.paths.articles + htmlescape_attr($1),
							htmlescape_text($2) + htmlescape_text($3)
						);
					})
					// [[Stripped:Namespace|Namespace]]
					.replace(/\[\[([^\]]*?:)?(.*?)( *\(.*?\))?\|\]\]/g, function ($0, $1, $2, $3) {
						return f(
							"<a href='?'>?</a>",
							Insta.conf.paths.articles +
								htmlescape_attr($1) +
								htmlescape_attr($2) +
								htmlescape_attr($3),
							htmlescape_text($2)
						);
					})
					// External links
					.replace(
						/\[(https?|news|ftp|mailto|gopher|irc):(\/*)([^\]]*?) (.*?)\]/g,
						function ($0, $1, $2, $3, $4) {
							return f(
								"<a class='external' href='?:?'>?</a>",
								htmlescape_attr($1),
								htmlescape_attr($2) + htmlescape_attr($3),
								htmlescape_text($4)
							);
						}
					)
					.replace(/\[http:\/\/(.*?)\]/g, function ($0, $1) {
						return f("<a class='external' href='http://?'>[#]</a>", htmlescape_attr($1));
					})
					.replace(/\[(news|ftp|mailto|gopher|irc):(\/*)(.*?)\]/g, function ($0, $1, $2, $3) {
						return f(
							"<a class='external' href='?:?'>?:?</a>",
							htmlescape_attr($1),
							htmlescape_attr($2) + htmlescape_attr($3),
							htmlescape_text($1),
							htmlescape_text($2) + htmlescape_text($3)
						);
					})
					.replace(
						/(^| )(https?|news|ftp|mailto|gopher|irc):(\/*)([^ $]*[^.,!?;: $])/g,
						function ($0, $1, $2, $3, $4) {
							return f(
								"?<a class='external' href='?:?'>?:?</a>",
								htmlescape_text($1),
								htmlescape_attr($2),
								htmlescape_attr($3) + htmlescape_attr($4),
								htmlescape_text($2),
								htmlescape_text($3) + htmlescape_text($4)
							);
						}
					)
					.replace('__NOTOC__', '')
					.replace('__NOINDEX__', '')
					.replace('__INDEX__', '')
					.replace('__NOEDITSECTION__', '')
			;
			return parse_inline_formatting(str);
		}

		// begin parsing
		for (; remain(); ) {
			if (compareLineStringOrReg(/^(={1,6})(.*)\1(.*)$/)) {
				p = 0;
				endl(f('<h?>?</h?>?', r[1].length, parse_inline_nowiki(r[2]), r[1].length, r[3]));
			} else if (compareLineStringOrReg(/^[*#:;]/)) {
				p = 0;
				parse_list();
			} else if (compareLineStringOrReg(' ')) {
				p = 0;
				parse_pre();
			} else if (compareLineStringOrReg('{|')) {
				p = 0;
				parse_table();
			} else if (compareLineStringOrReg(/^----+$/)) {
				p = 0;
				endl('<hr />');
			} else if (compareLineStringOrReg(Insta.BLOCK_IMAGE)) {
				p = 0;
				parse_block_image();
			} else {
				// handle paragraphs
				if (compareLineString('')) {
					p = remain() > 1 && ll[1] === '';
					if (p) {
						endl('<p><br>');
					}
				} else {
					if (!p) {
						ps('<p>');
						p = 1;
					}
					ps(parse_inline_nowiki(ll[0]) + ' ');
				}

				sh();
			}
		}

		return o;
	};

	function wiki2html(txt, baseurl) {
		Insta.conf.baseUrl = baseurl;
		return Insta.convert(txt);
	}
	// ENDFILE: livepreview.js

	// STARTFILE: pageinfo.js
	function popupFilterPageSize(data) {
		return formatBytes(data.length);
	}

	function popupFilterCountLinks(data) {
		var num = countLinks(data);
		return String(num) + '&nbsp;' + (num != 1 ? popupString('wikiLinks') : popupString('wikiLink'));
	}

	function popupFilterCountImages(data) {
		var num = countImages(data);
		return String(num) + '&nbsp;' + (num != 1 ? popupString('images') : popupString('image'));
	}

	function popupFilterCountCategories(data) {
		var num = countCategories(data);
		return (
			String(num) + '&nbsp;' + (num != 1 ? popupString('categories') : popupString('category'))
		);
	}

	function popupFilterLastModified(data, download) {
		var lastmod = download.lastModified;
		var now = new Date();
		var age = now - lastmod;
		if (lastmod && getValueOf('popupLastModified')) {
			return tprintf('%s old', [formatAge(age)]).replace(RegExp(' ', 'g'), '&nbsp;');
		}
		return '';
	}

	function popupFilterWikibaseItem(data, download) {
		return download.wikibaseItem
			? tprintf('<a href="%s">%s</a>', [
				download.wikibaseRepo.replace(/\$1/g, download.wikibaseItem),
				download.wikibaseItem,
			])
			: '';
	}

	function formatAge(age) {
		// coerce into a number
		var a = 0 + age,
			aa = a;

		var seclen = 1000;
		var minlen = 60 * seclen;
		var hourlen = 60 * minlen;
		var daylen = 24 * hourlen;
		var weeklen = 7 * daylen;

		var numweeks = (a - (a % weeklen)) / weeklen;
		a = a - numweeks * weeklen;
		var sweeks = addunit(numweeks, 'week');
		var numdays = (a - (a % daylen)) / daylen;
		a = a - numdays * daylen;
		var sdays = addunit(numdays, 'day');
		var numhours = (a - (a % hourlen)) / hourlen;
		a = a - numhours * hourlen;
		var shours = addunit(numhours, 'hour');
		var nummins = (a - (a % minlen)) / minlen;
		a = a - nummins * minlen;
		var smins = addunit(nummins, 'minute');
		var numsecs = (a - (a % seclen)) / seclen;
		a = a - numsecs * seclen;
		var ssecs = addunit(numsecs, 'second');

		if (aa > 4 * weeklen) {
			return sweeks;
		}
		if (aa > weeklen) {
			return sweeks + ' ' + sdays;
		}
		if (aa > daylen) {
			return sdays + ' ' + shours;
		}
		if (aa > 6 * hourlen) {
			return shours;
		}
		if (aa > hourlen) {
			return shours + ' ' + smins;
		}
		if (aa > 10 * minlen) {
			return smins;
		}
		if (aa > minlen) {
			return smins + ' ' + ssecs;
		}
		return ssecs;
	}

	function addunit(num, str) {
		return String(num) + ' ' + (num != 1 ? popupString(str + 's') : popupString(str));
	}

	function runPopupFilters(list, data, download) {
		var ret = [];
		for (var i = 0; i < list.length; ++i) {
			if (list[i] && typeof list[i] == 'function') {
				var s = list[i](data, download, download.owner.article);
				if (s) {
					ret.push(s);
				}
			}
		}
		return ret;
	}

	function getPageInfo(data, download) {
		if (!data || data.length === 0) {
			return popupString('Empty page');
		}

		var popupFilters = getValueOf('popupFilters') || [];
		var extraPopupFilters = getValueOf('extraPopupFilters') || [];
		var pageInfoArray = runPopupFilters(popupFilters.concat(extraPopupFilters), data, download);

		var pageInfo = pageInfoArray.join(', ');
		if (pageInfo !== '') {
			pageInfo = upcaseFirst(pageInfo);
		}
		return pageInfo;
	}

	// this could be improved!
	function countLinks(wikiText) {
		return wikiText.split('[[').length - 1;
	}

	// if N = # matches, n = # brackets, then
	// String.parenSplit(regex) intersperses the N+1 split elements
	// with Nn other elements. So total length is
	// L= N+1 + Nn = N(n+1)+1. So N=(L-1)/(n+1).

	function countImages(wikiText) {
		return (wikiText.parenSplit(pg.re.image).length - 1) / (pg.re.imageBracketCount + 1);
	}

	function countCategories(wikiText) {
		return (wikiText.parenSplit(pg.re.category).length - 1) / (pg.re.categoryBracketCount + 1);
	}

	function popupFilterStubDetect(data, download, article) {
		var counts = stubCount(data, article);
		if (counts.real) {
			return popupString('stub');
		}
		if (counts.sect) {
			return popupString('section stub');
		}
		return '';
	}

	function popupFilterDisambigDetect(data, download, article) {
		if (!getValueOf('popupAllDabsStubs') && article.namespace()) {
			return '';
		}
		return isDisambig(data, article) ? popupString('disambig') : '';
	}

	function formatBytes(num) {
		return num > 949
			? Math.round(num / 100) / 10 + popupString('kB')
			: num + '&nbsp;' + popupString('bytes');
	}
	// ENDFILE: pageinfo.js

	// STARTFILE: titles.js
	/**
	 * @fileoverview Defines the {@link Title} class, and associated crufty functions.

	 * <code>Title</code> deals with article titles and their various
	 * forms.  {@link Stringwrapper} is the parent class of
	 * <code>Title</code>, which exists simply to make things a little
	 * neater.
	 */

	/**
	 * Creates a new Stringwrapper.
	 * @constructor

	 * @class the Stringwrapper class. This base class is not really
	 * useful on its own; it just wraps various common string operations.
	 */
	function Stringwrapper() {
		/**
		 * Wrapper for this.toString().indexOf()
		 * @param {String} x
		 * @type {number}
		 */
		this.indexOf = function (x) {
			return this.toString().indexOf(x);
		};
		/**
		 * Returns this.value.
		 * @type {string}
		 */
		this.toString = function () {
			return this.value;
		};
		/**
		 * Wrapper for {@link String#parenSplit} applied to this.toString()
		 * @param {RegExp} x
		 * @type {Array}
		 */
		this.parenSplit = function (x) {
			return this.toString().parenSplit(x);
		};
		/**
		 * Wrapper for this.toString().substring()
		 * @param {String} x
		 * @param {String} y (optional)
		 * @type {string}
		 */
		this.substring = function (x, y) {
			if (typeof y == 'undefined') {
				return this.toString().substring(x);
			}
			return this.toString().substring(x, y);
		};
		/**
		 * Wrapper for this.toString().split()
		 * @param {String} x
		 * @type {Array}
		 */
		this.split = function (x) {
			return this.toString().split(x);
		};
		/**
		 * Wrapper for this.toString().replace()
		 * @param {String} x
		 * @param {String} y
		 * @type {string}
		 */
		this.replace = function (x, y) {
			return this.toString().replace(x, y);
		};
	}

	/**
	 * Creates a new <code>Title</code>.
	 * @constructor
	 *
	 * @class The Title class. Holds article titles and converts them into
	 * various forms. Also deals with anchors, by which we mean the bits
	 * of the article URL after a # character, representing locations
	 * within an article.
	 *
	 * @param {String} value The initial value to assign to the
	 * article. This must be the canonical title (see {@link
	 * Title#value}. Omit this in the constructor and use another function
	 * to set the title if this is unavailable.
	 */
	function Title(val) {
		/**
		 * The canonical article title. This must be in UTF-8 with no
		 * entities, escaping or nasties. Also, underscores should be
		 * replaced with spaces.
		 * @type {string}
		 * @private
		 */
		this.value = null;

		/**
		 * The canonical form of the anchor. This should be exactly as
		 * it appears in the URL, i.e. with the .C3.0A bits in.
		 * @type {string}
		 */
		this.anchor = '';

		this.setUtf(val);
	}
	Title.prototype = new Stringwrapper();
	/**
	 * Returns the canonical representation of the article title, optionally without anchor.
	 * @param {boolean} omitAnchor
	 * @fixme Decide specs for anchor
	 * @return String The article title and the anchor.
	 */
	Title.prototype.toString = function (omitAnchor) {
		return this.value + (!omitAnchor && this.anchor ? '#' + this.anchorString() : '');
	};
	Title.prototype.anchorString = function () {
		if (!this.anchor) {
			return '';
		}
		var split = this.anchor.parenSplit(/((?:[.][0-9A-F]{2})+)/);
		var len = split.length;
		var value;
		for (var j = 1; j < len; j += 2) {
			// FIXME s/decodeURI/decodeURIComponent/g ?
			value = split[j].split('.').join('%');
			try {
				value = decodeURIComponent(value);
			} catch (e) {
				// cannot decode
			}
			split[j] = value.split('_').join(' ');
		}
		return split.join('');
	};
	Title.prototype.urlAnchor = function () {
		var split = this.anchor.parenSplit('/((?:[%][0-9A-F]{2})+)/');
		var len = split.length;
		for (var j = 1; j < len; j += 2) {
			split[j] = split[j].split('%').join('.');
		}
		return split.join('');
	};
	Title.prototype.anchorFromUtf = function (str) {
		this.anchor = encodeURIComponent(str.split(' ').join('_'))
			.split('%3A')
			.join(':')
			.split("'")
			.join('%27')
			.split('%')
			.join('.');
	};
	Title.fromURL = function (h) {
		return new Title().fromURL(h);
	};
	Title.prototype.fromURL = function (h) {
		if (typeof h != 'string') {
			this.value = null;
			return this;
		}

		// NOTE : playing with decodeURI, encodeURI, escape, unescape,
		// we seem to be able to replicate the IE borked encoding

		// IE doesn't do this new-fangled utf-8 thing.
		// and it's worse than that.
		// IE seems to treat the query string differently to the rest of the url
		// the query is treated as bona-fide utf8, but the first bit of the url is pissed around with

		// we fix up & for all browsers, just in case.
		var splitted = h.split('?');
		splitted[0] = splitted[0].split('&').join('%26');

		h = splitted.join('?');

		var contribs = pg.re.contribs.exec(h);
		if (contribs) {
			if (contribs[1] == 'title=') {
				contribs[3] = contribs[3].split('+').join(' ');
			}
			var u = new Title(contribs[3]);
			this.setUtf(
				this.decodeNasties(
					mw.config.get('wgFormattedNamespaces')[pg.nsUserId] + ':' + u.stripNamespace()
				)
			);
			return this;
		}

		var email = pg.re.email.exec(h);
		if (email) {
			this.setUtf(
				this.decodeNasties(
					mw.config.get('wgFormattedNamespaces')[pg.nsUserId] +
						':' +
						new Title(email[3]).stripNamespace()
				)
			);
			return this;
		}

		var backlinks = pg.re.backlinks.exec(h);
		if (backlinks) {
			this.setUtf(this.decodeNasties(new Title(backlinks[3])));
			return this;
		}

		//A dummy title object for a Special:Diff link.
		var specialdiff = pg.re.specialdiff.exec(h);
		if (specialdiff) {
			this.setUtf(
				this.decodeNasties(
					new Title(mw.config.get('wgFormattedNamespaces')[pg.nsSpecialId] + ':Diff')
				)
			);
			return this;
		}

		// no more special cases to check --
		// hopefully it's not a disguised user-related or specially treated special page
		// Includes references
		var m = pg.re.main.exec(h);
		if (m === null) {
			this.value = null;
		} else {
			var fromBotInterface = /[?](.+[&])?title=/.test(h);
			if (fromBotInterface) {
				m[2] = m[2].split('+').join('_');
			}
			var extracted = m[2] + (m[3] ? '#' + m[3] : '');
			if (pg.flag.isSafari && /%25[0-9A-Fa-f]{2}/.test(extracted)) {
				// Fix Safari issue
				// Safari sometimes encodes % as %25 in UTF-8 encoded strings like %E5%A3 -> %25E5%25A3.
				this.setUtf(decodeURIComponent(unescape(extracted)));
			} else {
				this.setUtf(this.decodeNasties(extracted));
			}
		}
		return this;
	};
	Title.prototype.decodeNasties = function (txt) {
		// myDecodeURI uses decodeExtras, which removes _,
		// thus ruining citations previews, which are formated as "cite_note-1"
		try {
			var ret = decodeURI(this.decodeEscapes(txt));
			ret = ret.replace(/[_ ]*$/, '');
			return ret;
		} catch (e) {
			return txt; // cannot decode
		}
	};
	// Decode valid %-encodings, otherwise escape them
	Title.prototype.decodeEscapes = function (txt) {
		var split = txt.parenSplit(/((?:[%][0-9A-Fa-f]{2})+)/);
		var len = split.length;
		// No %-encoded items found, so replace the literal %
		if (len === 1) {
			return split[0].replace(/%(?![0-9a-fA-F][0-9a-fA-F])/g, '%25');
		}
		for (var i = 1; i < len; i = i + 2) {
			split[i] = decodeURIComponent(split[i]);
		}
		return split.join('');
	};
	Title.fromAnchor = function (a) {
		return new Title().fromAnchor(a);
	};
	Title.prototype.fromAnchor = function (a) {
		if (!a) {
			this.value = null;
			return this;
		}
		return this.fromURL(a.href);
	};
	Title.fromWikiText = function (txt) {
		return new Title().fromWikiText(txt);
	};
	Title.prototype.fromWikiText = function (txt) {
		// FIXME - testing needed
		txt = myDecodeURI(txt);
		this.setUtf(txt);
		return this;
	};
	Title.prototype.hintValue = function () {
		if (!this.value) {
			return '';
		}
		return safeDecodeURI(this.value);
	};
	Title.prototype.toUserName = function (withNs) {
		if (this.namespaceId() != pg.nsUserId && this.namespaceId() != pg.nsUsertalkId) {
			this.value = null;
			return;
		}
		this.value =
			(withNs ? mw.config.get('wgFormattedNamespaces')[pg.nsUserId] + ':' : '') +
			this.stripNamespace().split('/')[0];
	};
	Title.prototype.userName = function (withNs) {
		var t = new Title(this.value);
		t.toUserName(withNs);
		if (t.value) {
			return t;
		}
		return null;
	};
	Title.prototype.toTalkPage = function () {
		// convert article to a talk page, or if we can't, return null
		// In other words: return null if this ALREADY IS a talk page
		// and return the corresponding talk page otherwise
		//
		// Per https://www.mediawiki.org/wiki/Manual:Namespace#Subject_and_talk_namespaces
		// * All discussion namespaces have odd-integer indices
		// * The discussion namespace index for a specific namespace with index n is n + 1
		if (this.value === null) {
			return null;
		}

		var namespaceId = this.namespaceId();
		if (namespaceId >= 0 && namespaceId % 2 === 0) {
			//non-special and subject namespace
			var localizedNamespace = mw.config.get('wgFormattedNamespaces')[namespaceId + 1];
			if (typeof localizedNamespace !== 'undefined') {
				if (localizedNamespace === '') {
					this.value = this.stripNamespace();
				} else {
					this.value = localizedNamespace.split(' ').join('_') + ':' + this.stripNamespace();
				}
				return this.value;
			}
		}

		this.value = null;
		return null;
	};
	// Return canonical, localized namespace
	Title.prototype.namespace = function () {
		return mw.config.get('wgFormattedNamespaces')[this.namespaceId()];
	};
	Title.prototype.namespaceId = function () {
		var n = this.value.indexOf(':');
		if (n < 0) {
			return 0;
		} //mainspace
		var namespaceId =
			mw.config.get('wgNamespaceIds')[
				this.value.substring(0, n).split(' ').join('_').toLowerCase()
			];
		if (typeof namespaceId == 'undefined') {
			return 0;
		} //mainspace
		return namespaceId;
	};
	Title.prototype.talkPage = function () {
		var t = new Title(this.value);
		t.toTalkPage();
		if (t.value) {
			return t;
		}
		return null;
	};
	Title.prototype.isTalkPage = function () {
		if (this.talkPage() === null) {
			return true;
		}
		return false;
	};
	Title.prototype.toArticleFromTalkPage = function () {
		//largely copy/paste from toTalkPage above.
		if (this.value === null) {
			return null;
		}

		var namespaceId = this.namespaceId();
		if (namespaceId >= 0 && namespaceId % 2 == 1) {
			//non-special and talk namespace
			var localizedNamespace = mw.config.get('wgFormattedNamespaces')[namespaceId - 1];
			if (typeof localizedNamespace !== 'undefined') {
				if (localizedNamespace === '') {
					this.value = this.stripNamespace();
				} else {
					this.value = localizedNamespace.split(' ').join('_') + ':' + this.stripNamespace();
				}
				return this.value;
			}
		}

		this.value = null;
		return null;
	};
	Title.prototype.articleFromTalkPage = function () {
		var t = new Title(this.value);
		t.toArticleFromTalkPage();
		if (t.value) {
			return t;
		}
		return null;
	};
	Title.prototype.articleFromTalkOrArticle = function () {
		var t = new Title(this.value);
		if (t.toArticleFromTalkPage()) {
			return t;
		}
		return this;
	};
	Title.prototype.isIpUser = function () {
		return pg.re.ipUser.test(this.userName());
	};
	Title.prototype.stripNamespace = function () {
		// returns a string, not a Title
		var n = this.value.indexOf(':');
		if (n < 0) {
			return this.value;
		}
		var namespaceId = this.namespaceId();
		if (namespaceId === pg.nsMainspaceId) {
			return this.value;
		}
		return this.value.substring(n + 1);
	};
	Title.prototype.setUtf = function (value) {
		if (!value) {
			this.value = '';
			return;
		}
		var anch = value.indexOf('#');
		if (anch < 0) {
			this.value = value.split('_').join(' ');
			this.anchor = '';
			return;
		}
		this.value = value.substring(0, anch).split('_').join(' ');
		this.anchor = value.substring(anch + 1);
		this.ns = null; // wait until namespace() is called
	};
	Title.prototype.setUrl = function (urlfrag) {
		var anch = urlfrag.indexOf('#');
		this.value = safeDecodeURI(urlfrag.substring(0, anch));
		this.anchor = this.value.substring(anch + 1);
	};
	Title.prototype.append = function (x) {
		this.setUtf(this.value + x);
	};
	Title.prototype.urlString = function (x) {
		if (!x) {
			x = {};
		}
		var v = this.toString(true);
		if (!x.omitAnchor && this.anchor) {
			v += '#' + this.urlAnchor();
		}
		if (!x.keepSpaces) {
			v = v.split(' ').join('_');
		}
		return encodeURI(v).split('&').join('%26').split('?').join('%3F').split('+').join('%2B');
	};
	Title.prototype.removeAnchor = function () {
		return new Title(this.toString(true));
	};
	Title.prototype.toUrl = function () {
		return pg.wiki.titlebase + this.urlString();
	};

	function parseParams(url) {
		var specialDiff = pg.re.specialdiff.exec(url);
		if (specialDiff) {
			var split = specialDiff[1].split('/');
			if (split.length == 1) {
				return { oldid: split[0], diff: 'prev' };
			} else if (split.length == 2) {
				return { oldid: split[0], diff: split[1] };
			}
		}

		var ret = {};
		if (url.indexOf('?') == -1) {
			return ret;
		}
		url = url.split('#')[0];
		var s = url.split('?').slice(1).join();
		var t = s.split('&');
		for (var i = 0; i < t.length; ++i) {
			var z = t[i].split('=');
			z.push(null);
			ret[z[0]] = z[1];
		}
		//Diff revision with no oldid is interpreted as a diff to the previous revision by MediaWiki
		if (ret.diff && typeof ret.oldid === 'undefined') {
			ret.oldid = 'prev';
		}
		//Documentation seems to say something different, but oldid can also accept prev/next, and
		//Echo is emitting such URLs. Simple fixup during parameter decoding:
		if (ret.oldid && (ret.oldid === 'prev' || ret.oldid === 'next' || ret.oldid === 'cur')) {
			var helper = ret.diff;
			ret.diff = ret.oldid;
			ret.oldid = helper;
		}
		return ret;
	}

	// (a) myDecodeURI (first standard decodeURI, then pg.re.urlNoPopup)
	// (b) change spaces to underscores
	// (c) encodeURI (just the straight one, no pg.re.urlNoPopup)

	function myDecodeURI(str) {
		var ret;
		// FIXME decodeURIComponent??
		try {
			ret = decodeURI(str.toString());
		} catch (summat) {
			return str;
		}
		for (var i = 0; i < pg.misc.decodeExtras.length; ++i) {
			var from = pg.misc.decodeExtras[i].from;
			var to = pg.misc.decodeExtras[i].to;
			ret = ret.split(from).join(to);
		}
		return ret;
	}

	function safeDecodeURI(str) {
		var ret = myDecodeURI(str);
		return ret || str;
	}

	///////////
	// TESTS //
	///////////

	function isDisambig(data, article) {
		if (!getValueOf('popupAllDabsStubs') && article.namespace()) {
			return false;
		}
		return !article.isTalkPage() && pg.re.disambig.test(data);
	}

	function stubCount(data, article) {
		if (!getValueOf('popupAllDabsStubs') && article.namespace()) {
			return false;
		}
		var sectStub = 0;
		var realStub = 0;
		if (pg.re.stub.test(data)) {
			var s = data.parenSplit(pg.re.stub);
			for (var i = 1; i < s.length; i = i + 2) {
				if (s[i]) {
					++sectStub;
				} else {
					++realStub;
				}
			}
		}
		return { real: realStub, sect: sectStub };
	}

	function isValidImageName(str) {
		// extend as needed...
		return str.indexOf('{') == -1;
	}

	function isInStrippableNamespace(article) {
		// Does the namespace allow subpages
		// Note, would be better if we had access to wgNamespacesWithSubpages
		return article.namespaceId() !== 0;
	}

	function isInMainNamespace(article) {
		return article.namespaceId() === 0;
	}

	function anchorContainsImage(a) {
		// iterate over children of anchor a
		// see if any are images
		if (a === null) {
			return false;
		}
		var kids = a.childNodes;
		for (var i = 0; i < kids.length; ++i) {
			if (kids[i].nodeName == 'IMG') {
				return true;
			}
		}
		return false;
	}
	function isPopupLink(a) {
		// NB for performance reasons, TOC links generally return true
		// they should be stripped out later

		if (!markNopopupSpanLinks.done) {
			markNopopupSpanLinks();
		}
		if (a.inNopopupSpan) {
			return false;
		}

		// FIXME is this faster inline?
		if (a.onmousedown || a.getAttribute('nopopup')) {
			return false;
		}
		var h = a.href;
		if (h === document.location.href + '#') {
			return false;
		}
		if (!pg.re.basenames.test(h)) {
			return false;
		}
		if (!pg.re.urlNoPopup.test(h)) {
			return true;
		}
		return (
			(pg.re.email.test(h) ||
				pg.re.contribs.test(h) ||
				pg.re.backlinks.test(h) ||
				pg.re.specialdiff.test(h)) &&
			h.indexOf('&limit=') == -1
		);
	}

	function markNopopupSpanLinks() {
		if (!getValueOf('popupOnlyArticleLinks')) {
			fixVectorMenuPopups();
		}

		var s = $('.nopopups').toArray();
		for (var i = 0; i < s.length; ++i) {
			var as = s[i].getElementsByTagName('a');
			for (var j = 0; j < as.length; ++j) {
				as[j].inNopopupSpan = true;
			}
		}

		markNopopupSpanLinks.done = true;
	}

	function fixVectorMenuPopups() {
		$('nav.vector-menu h3:first a:first').prop('inNopopupSpan', true);
	}
	// ENDFILE: titles.js

	// STARTFILE: getpage.js
	//////////////////////////////////////////////////
	// Wiki-specific downloading
	//

	// Schematic for a getWiki call
	//
	//             getPageWithCaching
	//					|
	//	   false		|		  true
	// getPage<-[findPictureInCache]->-onComplete(a fake download)
	//   \.
	//	 (async)->addPageToCache(download)->-onComplete(download)

	// check cache to see if page exists

	function getPageWithCaching(url, onComplete, owner) {
		log('getPageWithCaching, url=' + url);
		var i = findInPageCache(url);
		var d;
		if (i > -1) {
			d = fakeDownload(
				url,
				owner.idNumber,
				onComplete,
				pg.cache.pages[i].data,
				pg.cache.pages[i].lastModified,
				owner
			);
		} else {
			d = getPage(url, onComplete, owner);
			if (d && owner && owner.addDownload) {
				owner.addDownload(d);
				d.owner = owner;
			}
		}
	}

	function getPage(url, onComplete, owner) {
		log('getPage');
		var callback = function (d) {
			if (!d.aborted) {
				addPageToCache(d);
				onComplete(d);
			}
		};
		return startDownload(url, owner.idNumber, callback);
	}

	function findInPageCache(url) {
		for (var i = 0; i < pg.cache.pages.length; ++i) {
			if (url == pg.cache.pages[i].url) {
				return i;
			}
		}
		return -1;
	}

	function addPageToCache(download) {
		log('addPageToCache ' + download.url);
		var page = {
			url: download.url,
			data: download.data,
			lastModified: download.lastModified,
		};
		return pg.cache.pages.push(page);
	}
	// ENDFILE: getpage.js

	// STARTFILE: parensplit.js
	//////////////////////////////////////////////////
	// parenSplit

	// String.prototype.parenSplit should do what ECMAscript says String.prototype.split does,
	// interspersing paren matches (regex capturing groups) between the split elements.
	// i.e. 'abc'.split(/(b)/)) should return ['a','b','c'], not ['a','c']

	if (String('abc'.split(/(b)/)) != 'a,b,c') {
		// broken String.split, e.g. konq, IE < 10
		String.prototype.parenSplit = function (re) {
			re = nonGlobalRegex(re);
			var s = this;
			var m = re.exec(s);
			var ret = [];
			while (m && s) {
				// without the following loop, we have
				// 'ab'.parenSplit(/a|(b)/) != 'ab'.split(/a|(b)/)
				for (var i = 0; i < m.length; ++i) {
					if (typeof m[i] == 'undefined') {
						m[i] = '';
					}
				}
				ret.push(s.substring(0, m.index));
				ret = ret.concat(m.slice(1));
				s = s.substring(m.index + m[0].length);
				m = re.exec(s);
			}
			ret.push(s);
			return ret;
		};
	} else {
		String.prototype.parenSplit = function (re) {
			return this.split(re);
		};
		String.prototype.parenSplit.isNative = true;
	}

	function nonGlobalRegex(re) {
		var s = re.toString();
		var flags = '';
		for (var j = s.length; s.charAt(j) != '/'; --j) {
			if (s.charAt(j) != 'g') {
				flags += s.charAt(j);
			}
		}
		var t = s.substring(1, j);
		return RegExp(t, flags);
	}
	// ENDFILE: parensplit.js

	// STARTFILE: tools.js
	// IE madness with encoding
	// ========================
	//
	// suppose throughout that the page is in utf8, like wikipedia
	//
	// if a is an anchor DOM element and a.href should consist of
	//
	// http://host.name.here/wiki/foo?bar=baz
	//
	// then IE gives foo as "latin1-encoded" utf8; we have foo = decode_utf8(decodeURI(foo_ie))
	// but IE gives bar=baz correctly as plain utf8
	//
	// ---------------------------------
	//
	// IE's xmlhttp doesn't understand utf8 urls. Have to use encodeURI here.
	//
	// ---------------------------------
	//
	// summat else

	// Source: http://aktuell.de.selfhtml.org/artikel/javascript/utf8b64/utf8.htm

	function getJsObj(json) {
		try {
			var json_ret = JSON.parse(json);
			if (json_ret.warnings) {
				for (var w = 0; w < json_ret.warnings.length; w++) {
					if (json_ret.warnings[w]['*']) {
						log(json_ret.warnings[w]['*']);
					} else {
						log(json_ret.warnings[w].warnings);
					}
				}
			} else if (json_ret.error) {
				errlog(json_ret.error.code + ': ' + json_ret.error.info);
			}
			return json_ret;
		} catch (someError) {
			errlog('Something went wrong with getJsObj, json=' + json);
			return 1;
		}
	}

	function anyChild(obj) {
		for (var p in obj) {
			return obj[p];
		}
		return null;
	}

	function upcaseFirst(str) {
		if (typeof str != typeof '' || str === '') {
			return '';
		}
		return str.charAt(0).toUpperCase() + str.substring(1);
	}

	function findInArray(arr, foo) {
		if (!arr || !arr.length) {
			return -1;
		}
		var len = arr.length;
		for (var i = 0; i < len; ++i) {
			if (arr[i] == foo) {
				return i;
			}
		}
		return -1;
	}

	/* eslint-disable no-unused-vars */
	function nextOne(array, value) {
		// NB if the array has two consecutive entries equal
		//	then this will loop on successive calls
		var i = findInArray(array, value);
		if (i < 0) {
			return null;
		}
		return array[i + 1];
	}
	/* eslint-enable no-unused-vars */

	function literalizeRegex(str) {
		return mw.util.escapeRegExp(str);
	}

	String.prototype.entify = function () {
		//var shy='&shy;';
		return this.split('&')
			.join('&amp;')
			.split('<')
			.join('&lt;')
			.split('>')
			.join('&gt;' /*+shy*/)
			.split('"')
			.join('&quot;');
	};

	// Array filter function
	function removeNulls(val) {
		return val !== null;
	}

	function joinPath(list) {
		return list.filter(removeNulls).join('/');
	}

	function simplePrintf(str, subs) {
		if (!str || !subs) {
			return str;
		}
		var ret = [];
		var s = str.parenSplit(/(%s|\$[0-9]+)/);
		var i = 0;
		do {
			ret.push(s.shift());
			if (!s.length) {
				break;
			}
			var cmd = s.shift();
			if (cmd == '%s') {
				if (i < subs.length) {
					ret.push(subs[i]);
				} else {
					ret.push(cmd);
				}
				++i;
			} else {
				var j = parseInt(cmd.replace('$', ''), 10) - 1;
				if (j > -1 && j < subs.length) {
					ret.push(subs[j]);
				} else {
					ret.push(cmd);
				}
			}
		} while (s.length > 0);
		return ret.join('');
	}

	/* eslint-disable no-unused-vars */
	function isString(x) {
		return typeof x === 'string' || x instanceof String;
	}

	function isNumber(x) {
		return typeof x === 'number' || x instanceof Number;
	}

	function isRegExp(x) {
		return x instanceof RegExp;
	}

	function isArray(x) {
		return x instanceof Array;
	}

	function isObject(x) {
		return x instanceof Object;
	}

	function isFunction(x) {
		return !isRegExp(x) && (typeof x === 'function' || x instanceof Function);
	}
	/* eslint-enable no-unused-vars */

	function repeatString(s, mult) {
		var ret = '';
		for (var i = 0; i < mult; ++i) {
			ret += s;
		}
		return ret;
	}

	function zeroFill(s, min) {
		min = min || 2;
		var t = s.toString();
		return repeatString('0', min - t.length) + t;
	}

	function map(f, o) {
		if (isArray(o)) {
			return map_array(f, o);
		}
		return map_object(f, o);
	}
	function map_array(f, o) {
		var ret = [];
		for (var i = 0; i < o.length; ++i) {
			ret.push(f(o[i]));
		}
		return ret;
	}
	function map_object(f, o) {
		var ret = {};
		for (var i in o) {
			ret[o] = f(o[i]);
		}
		return ret;
	}

	pg.escapeQuotesHTML = function (text) {
		return text
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	};

	pg.unescapeQuotesHTML = function (html) {
		// From https://stackoverflow.com/a/7394787
		// This seems to be implemented correctly on all major browsers now, so we
		// don't have to make our own function.
		var txt = document.createElement('textarea');
		txt.innerHTML = html;
		return txt.value;
	};

	// ENDFILE: tools.js

	// STARTFILE: dab.js
	//////////////////////////////////////////////////
	// Dab-fixing code
	//

	function retargetDab(newTarget, oldTarget, friendlyCurrentArticleName, titleToEdit) {
		log('retargetDab: newTarget=' + newTarget + ' oldTarget=' + oldTarget);
		return changeLinkTargetLink({
			newTarget: newTarget,
			text: newTarget.split(' ').join('&nbsp;'),
			hint: tprintf('disambigHint', [newTarget]),
			summary: simplePrintf(getValueOf('popupFixDabsSummary'), [
				friendlyCurrentArticleName,
				newTarget,
			]),
			clickButton: getValueOf('popupDabsAutoClick'),
			minor: true,
			oldTarget: oldTarget,
			watch: getValueOf('popupWatchDisambiggedPages'),
			title: titleToEdit,
		});
	}

	function listLinks(wikitext, oldTarget, titleToEdit) {
		// mediawiki strips trailing spaces, so we do the same
		// testcase: https://en.wikipedia.org/w/index.php?title=Radial&oldid=97365633
		var reg = RegExp('\\[\\[([^|]*?) *(\\||\\]\\])', 'gi');
		var ret = [];
		var splitted = wikitext.parenSplit(reg);
		// ^[a-z]+ should match interwiki links, hopefully (case-insensitive)
		// and ^[a-z]* should match those and [[:Category...]] style links too
		var omitRegex = RegExp('^[a-z]*:|^[Ss]pecial:|^[Ii]mage|^[Cc]ategory');
		var friendlyCurrentArticleName = oldTarget.toString();
		var wikPos = getValueOf('popupDabWiktionary');

		for (var i = 1; i < splitted.length; i = i + 3) {
			if (
				typeof splitted[i] == typeof 'string' &&
				splitted[i].length > 0 &&
				!omitRegex.test(splitted[i])
			) {
				ret.push(retargetDab(splitted[i], oldTarget, friendlyCurrentArticleName, titleToEdit));
			} /* if */
		} /* for loop */

		ret = rmDupesFromSortedList(ret.sort());

		if (wikPos) {
			var wikTarget =
				'wiktionary:' +
				friendlyCurrentArticleName.replace(RegExp('^(.+)\\s+[(][^)]+[)]\\s*$'), '$1');

			var meth;
			if (wikPos.toLowerCase() == 'first') {
				meth = 'unshift';
			} else {
				meth = 'push';
			}

			ret[meth](retargetDab(wikTarget, oldTarget, friendlyCurrentArticleName, titleToEdit));
		}

		ret.push(
			changeLinkTargetLink({
				newTarget: null,
				text: popupString('remove this link').split(' ').join('&nbsp;'),
				hint: popupString('remove all links to this disambig page from this article'),
				clickButton: getValueOf('popupDabsAutoClick'),
				oldTarget: oldTarget,
				summary: simplePrintf(getValueOf('popupRmDabLinkSummary'), [friendlyCurrentArticleName]),
				watch: getValueOf('popupWatchDisambiggedPages'),
				title: titleToEdit,
			})
		);
		return ret;
	}

	function rmDupesFromSortedList(list) {
		var ret = [];
		for (var i = 0; i < list.length; ++i) {
			if (ret.length === 0 || list[i] != ret[ret.length - 1]) {
				ret.push(list[i]);
			}
		}
		return ret;
	}

	function makeFixDab(data, navpop) {
		// grab title from parent popup if there is one; default exists in changeLinkTargetLink
		var titleToEdit = navpop.parentPopup && navpop.parentPopup.article.toString();
		var list = listLinks(data, navpop.originalArticle, titleToEdit);
		if (list.length === 0) {
			log('listLinks returned empty list');
			return null;
		}
		var html = '<hr />' + popupString('Click to disambiguate this link to:') + '<br>';
		html += list.join(', ');
		return html;
	}

	function makeFixDabs(wikiText, navpop) {
		if (
			getValueOf('popupFixDabs') &&
			isDisambig(wikiText, navpop.article) &&
			Title.fromURL(location.href).namespaceId() != pg.nsSpecialId &&
			navpop.article.talkPage()
		) {
			setPopupHTML(makeFixDab(wikiText, navpop), 'popupFixDab', navpop.idNumber);
		}
	}

	function popupRedlinkHTML(article) {
		return changeLinkTargetLink({
			newTarget: null,
			text: popupString('remove this link').split(' ').join('&nbsp;'),
			hint: popupString('remove all links to this page from this article'),
			clickButton: getValueOf('popupRedlinkAutoClick'),
			oldTarget: article.toString(),
			summary: simplePrintf(getValueOf('popupRedlinkSummary'), [article.toString()]),
		});
	}
	// ENDFILE: dab.js

	// STARTFILE: htmloutput.js

	// this has to use a timer loop as we don't know if the DOM element exists when we want to set the text
	function setPopupHTML(str, elementId, popupId, onSuccess, append) {
		if (typeof popupId === 'undefined') {
			//console.error('popupId is not defined in setPopupHTML, html='+str.substring(0,100));
			popupId = pg.idNumber;
		}

		var popupElement = document.getElementById(elementId + popupId);
		if (popupElement) {
			if (!append) {
				popupElement.innerHTML = '';
			}
			if (isString(str)) {
				popupElement.innerHTML += str;
			} else {
				popupElement.appendChild(str);
			}
			if (onSuccess) {
				onSuccess();
			}
			setTimeout(checkPopupPosition, 100);
			return true;
		} else {
			// call this function again in a little while...
			setTimeout(function () {
				setPopupHTML(str, elementId, popupId, onSuccess);
			}, 600);
		}
		return null;
	}

	function setPopupTrailer(str, id) {
		return setPopupHTML(str, 'popupData', id);
	}

	// args.navpopup is mandatory
	// optional: args.redir, args.redirTarget
	// FIXME: ye gods, this is ugly stuff
	function fillEmptySpans(args) {
		// if redir is present and true then redirTarget is mandatory
		var redir = true;
		var rcid;
		if (typeof args != 'object' || typeof args.redir == 'undefined' || !args.redir) {
			redir = false;
		}
		var a = args.navpopup.parentAnchor;

		var article,
			hint = null,
			oldid = null,
			params = {};
		if (redir && typeof args.redirTarget == typeof {}) {
			article = args.redirTarget;
			//hint=article.hintValue();
		} else {
			article = new Title().fromAnchor(a);
			hint = a.originalTitle || article.hintValue();
			params = parseParams(a.href);
			oldid = getValueOf('popupHistoricalLinks') ? params.oldid : null;
			rcid = params.rcid;
		}
		var x = {
			article: article,
			hint: hint,
			oldid: oldid,
			rcid: rcid,
			navpop: args.navpopup,
			params: params,
		};

		var structure = pg.structures[getValueOf('popupStructure')];
		if (typeof structure != 'object') {
			setPopupHTML(
				'popupError',
				'Unknown structure (this should never happen): ' + pg.option.popupStructure,
				args.navpopup.idNumber
			);
			return;
		}
		var spans = flatten(pg.misc.layout);
		var numspans = spans.length;
		var redirs = pg.misc.redirSpans;

		for (var i = 0; i < numspans; ++i) {
			var found = redirs && redirs.indexOf(spans[i]) !== -1;
			//log('redir='+redir+', found='+found+', spans[i]='+spans[i]);
			if ((found && !redir) || (!found && redir)) {
				//log('skipping this set of the loop');
				continue;
			}
			var structurefn = structure[spans[i]];
			if (structurefn === undefined) {
				// nothing to do for this structure part
				continue;
			}
			var setfn = setPopupHTML;
			if (
				getValueOf('popupActiveNavlinks') &&
				(spans[i].indexOf('popupTopLinks') === 0 || spans[i].indexOf('popupRedirTopLinks') === 0)
			) {
				setfn = setPopupTipsAndHTML;
			}
			switch (typeof structurefn) {
				case 'function':
					log(
						'running ' +
							spans[i] +
							'({article:' +
							x.article +
							', hint:' +
							x.hint +
							', oldid: ' +
							x.oldid +
							'})'
					);
					setfn(structurefn(x), spans[i], args.navpopup.idNumber);
					break;
				case 'string':
					setfn(structurefn, spans[i], args.navpopup.idNumber);
					break;
				default:
					errlog('unknown thing with label ' + spans[i] + ' (span index was ' + i + ')');
					break;
			}
		}
	}

	// flatten an array
	function flatten(list, start) {
		var ret = [];
		if (typeof start == 'undefined') {
			start = 0;
		}
		for (var i = start; i < list.length; ++i) {
			if (typeof list[i] == typeof []) {
				return ret.concat(flatten(list[i])).concat(flatten(list, i + 1));
			} else {
				ret.push(list[i]);
			}
		}
		return ret;
	}

	// Generate html for whole popup
	function popupHTML(a) {
		getValueOf('popupStructure');
		var structure = pg.structures[pg.option.popupStructure];
		if (typeof structure != 'object') {
			//return 'Unknown structure: '+pg.option.popupStructure;
			// override user choice
			pg.option.popupStructure = pg.optionDefault.popupStructure;
			return popupHTML(a);
		}
		if (typeof structure.popupLayout != 'function') {
			return 'Bad layout';
		}
		pg.misc.layout = structure.popupLayout();
		if (typeof structure.popupRedirSpans === 'function') {
			pg.misc.redirSpans = structure.popupRedirSpans();
		} else {
			pg.misc.redirSpans = [];
		}
		return makeEmptySpans(pg.misc.layout, a.navpopup);
	}

	function makeEmptySpans(list, navpop) {
		var ret = '';
		for (var i = 0; i < list.length; ++i) {
			if (typeof list[i] == typeof '') {
				ret += emptySpanHTML(list[i], navpop.idNumber, 'div');
			} else if (typeof list[i] == typeof [] && list[i].length > 0) {
				ret = ret.parenSplit(RegExp('(</[^>]*?>$)')).join(makeEmptySpans(list[i], navpop));
			} else if (typeof list[i] == typeof {} && list[i].nodeType) {
				ret += emptySpanHTML(list[i].name, navpop.idNumber, list[i].nodeType);
			}
		}
		return ret;
	}

	function emptySpanHTML(name, id, tag, classname) {
		tag = tag || 'span';
		if (!classname) {
			classname = emptySpanHTML.classAliases[name];
		}
		classname = classname || name;
		if (name == getValueOf('popupDragHandle')) {
			classname += ' popupDragHandle';
		}
		return simplePrintf('<%s id="%s" class="%s"></%s>', [tag, name + id, classname, tag]);
	}
	emptySpanHTML.classAliases = { popupSecondPreview: 'popupPreview' };

	// generate html for popup image
	// <a id="popupImageLinkn"><img id="popupImagen">
	// where n=idNumber
	function imageHTML(article, idNumber) {
		return simplePrintf(
			'<a id="popupImageLink$1">' +
				'<img align="right" valign="top" id="popupImg$1" style="display: none;"></img>' +
				'</a>',
			[idNumber]
		);
	}

	function popTipsSoonFn(id, when, popData) {
		if (!when) {
			when = 250;
		}
		var popTips = function () {
			setupTooltips(document.getElementById(id), false, true, popData);
		};
		return function () {
			setTimeout(popTips, when, popData);
		};
	}

	function setPopupTipsAndHTML(html, divname, idnumber, popData) {
		setPopupHTML(
			html,
			divname,
			idnumber,
			getValueOf('popupSubpopups') ? popTipsSoonFn(divname + idnumber, null, popData) : null
		);
	}
	// ENDFILE: htmloutput.js

	// STARTFILE: mouseout.js
	//////////////////////////////////////////////////
	// fuzzy checks

	function fuzzyCursorOffMenus(x, y, fuzz, parent) {
		if (!parent) {
			return null;
		}
		var uls = parent.getElementsByTagName('ul');
		for (var i = 0; i < uls.length; ++i) {
			if (uls[i].className == 'popup_menu') {
				if (uls[i].offsetWidth > 0) {
					return false;
				}
			} // else {document.title+='.';}
		}
		return true;
	}

	function checkPopupPosition() {
		// stop the popup running off the right of the screen
		// FIXME avoid pg.current.link
		if (pg.current.link && pg.current.link.navpopup) {
			pg.current.link.navpopup.limitHorizontalPosition();
		}
	}

	function mouseOutWikiLink() {
		//console ('mouseOutWikiLink');
		var a = this;

		removeModifierKeyHandler(a);

		if (a.navpopup === null || typeof a.navpopup === 'undefined') {
			return;
		}
		if (!a.navpopup.isVisible()) {
			a.navpopup.banish();
			return;
		}
		restoreTitle(a);
		Navpopup.tracker.addHook(posCheckerHook(a.navpopup));
	}

	function posCheckerHook(navpop) {
		return function () {
			if (!navpop.isVisible()) {
				return true; /* remove this hook */
			}
			if (Navpopup.tracker.dirty) {
				return false;
			}
			var x = Navpopup.tracker.x,
				y = Navpopup.tracker.y;
			var mouseOverNavpop =
				navpop.isWithin(x, y, navpop.fuzz, navpop.mainDiv) ||
				!fuzzyCursorOffMenus(x, y, navpop.fuzz, navpop.mainDiv);

			// FIXME it'd be prettier to do this internal to the Navpopup objects
			var t = getValueOf('popupHideDelay');
			if (t) {
				t = t * 1000;
			}
			if (!t) {
				if (!mouseOverNavpop) {
					if (navpop.parentAnchor) {
						restoreTitle(navpop.parentAnchor);
					}
					navpop.banish();
					return true; /* remove this hook */
				}
				return false;
			}
			// we have a hide delay set
			var d = Number(new Date());
			if (!navpop.mouseLeavingTime) {
				navpop.mouseLeavingTime = d;
				return false;
			}
			if (mouseOverNavpop) {
				navpop.mouseLeavingTime = null;
				return false;
			}
			if (d - navpop.mouseLeavingTime > t) {
				navpop.mouseLeavingTime = null;
				navpop.banish();
				return true; /* remove this hook */
			}
			return false;
		};
	}

	function runStopPopupTimer(navpop) {
		// at this point, we should have left the link but remain within the popup
		// so we call this function again until we leave the popup.
		if (!navpop.stopPopupTimer) {
			navpop.stopPopupTimer = setInterval(posCheckerHook(navpop), 500);
			navpop.addHook(
				function () {
					clearInterval(navpop.stopPopupTimer);
				},
				'hide',
				'before'
			);
		}
	}
	// ENDFILE: mouseout.js

	// STARTFILE: previewmaker.js
	/**
	 * @fileoverview
	 * Defines the {@link Previewmaker} object, which generates short previews from wiki markup.
	 */

	/**
	 * Creates a new Previewmaker
	 * @constructor
	 * @class The Previewmaker class. Use an instance of this to generate short previews from Wikitext.
	 * @param {String} wikiText The Wikitext source of the page we wish to preview.
	 * @param {String} baseUrl The url we should prepend when creating relative urls.
	 * @param {Navpopup} owner The navpop associated to this preview generator
	 */
	function Previewmaker(wikiText, baseUrl, owner) {
		/** The wikitext which is manipulated to generate the preview. */
		this.originalData = wikiText;
		this.baseUrl = baseUrl;
		this.owner = owner;

		this.maxCharacters = getValueOf('popupMaxPreviewCharacters');
		this.maxSentences = getValueOf('popupMaxPreviewSentences');

		this.setData();
	}

	Previewmaker.prototype.setData = function () {
		var maxSize = Math.max(10000, 2 * this.maxCharacters);
		this.data = this.originalData.substring(0, maxSize);
	};

	/**
	 * Remove HTML comments
	 * @private
	 */
	Previewmaker.prototype.killComments = function () {
		// this also kills one trailing newline, eg [[diamyo]]
		this.data = this.data.replace(
			RegExp('^<!--[^$]*?-->\\n|\\n<!--[^$]*?-->(?=\\n)|<!--[^$]*?-->', 'g'),
			''
		);
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.killDivs = function () {
		// say goodbye, divs (can be nested, so use * not *?)
		this.data = this.data.replace(RegExp('< *div[^>]* *>[\\s\\S]*?< */ *div *>', 'gi'), '');
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.killGalleries = function () {
		this.data = this.data.replace(RegExp('< *gallery[^>]* *>[\\s\\S]*?< */ *gallery *>', 'gi'), '');
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.kill = function (opening, closing, subopening, subclosing, repl) {
		var oldk = this.data;
		var k = this.killStuff(this.data, opening, closing, subopening, subclosing, repl);
		while (k.length < oldk.length) {
			oldk = k;
			k = this.killStuff(k, opening, closing, subopening, subclosing, repl);
		}
		this.data = k;
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.killStuff = function (
		txt,
		opening,
		closing,
		subopening,
		subclosing,
		repl
	) {
		var op = this.makeRegexp(opening);
		var cl = this.makeRegexp(closing, '^');
		var sb = subopening ? this.makeRegexp(subopening, '^') : null;
		var sc = subclosing ? this.makeRegexp(subclosing, '^') : cl;
		if (!op || !cl) {
			alert('Navigation Popups error: op or cl is null! something is wrong.');
			return;
		}
		if (!op.test(txt)) {
			return txt;
		}
		var ret = '';
		var opResult = op.exec(txt);
		ret = txt.substring(0, opResult.index);
		txt = txt.substring(opResult.index + opResult[0].length);
		var depth = 1;
		while (txt.length > 0) {
			var removal = 0;
			if (depth == 1 && cl.test(txt)) {
				depth--;
				removal = cl.exec(txt)[0].length;
			} else if (depth > 1 && sc.test(txt)) {
				depth--;
				removal = sc.exec(txt)[0].length;
			} else if (sb && sb.test(txt)) {
				depth++;
				removal = sb.exec(txt)[0].length;
			}
			if (!removal) {
				removal = 1;
			}
			txt = txt.substring(removal);
			if (depth === 0) {
				break;
			}
		}
		return ret + (repl || '') + txt;
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.makeRegexp = function (x, prefix, suffix) {
		prefix = prefix || '';
		suffix = suffix || '';
		var reStr = '';
		var flags = '';
		if (isString(x)) {
			reStr = prefix + literalizeRegex(x) + suffix;
		} else if (isRegExp(x)) {
			var s = x.toString().substring(1);
			var sp = s.split('/');
			flags = sp[sp.length - 1];
			sp[sp.length - 1] = '';
			s = sp.join('/');
			s = s.substring(0, s.length - 1);
			reStr = prefix + s + suffix;
		} else {
			log('makeRegexp failed');
		}

		log('makeRegexp: got reStr=' + reStr + ', flags=' + flags);
		return RegExp(reStr, flags);
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.killBoxTemplates = function () {
		// taxobox removal... in fact, there's a saudiprincebox_begin, so let's be more general
		// also, have float_begin, ... float_end
		this.kill(RegExp('[{][{][^{}\\s|]*?(float|box)[_ ](begin|start)', 'i'), /[}][}]\s*/, '{{');

		// infoboxes etc
		// from [[User:Zyxw/popups.js]]: kill frames too
		this.kill(RegExp('[{][{][^{}\\s|]*?(infobox|elementbox|frame)[_ ]', 'i'), /[}][}]\s*/, '{{');
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.killTemplates = function () {
		this.kill('{{', '}}', '{', '}', ' ');
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.killTables = function () {
		// tables are bad, too
		// this can be slow, but it's an inprovement over a browser hang
		// torture test: [[Comparison_of_Intel_Central_Processing_Units]]
		this.kill('{|', /[|]}\s*/, '{|');
		this.kill(/<table.*?>/i, /<\/table.*?>/i, /<table.*?>/i);
		// remove lines starting with a pipe for the hell of it (?)
		this.data = this.data.replace(RegExp('^[|].*$', 'mg'), '');
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.killImages = function () {
		var forbiddenNamespaceAliases = [];
		jQuery.each(mw.config.get('wgNamespaceIds'), function (_localizedNamespaceLc, _namespaceId) {
			if (_namespaceId != pg.nsImageId && _namespaceId != pg.nsCategoryId) {
				return;
			}
			forbiddenNamespaceAliases.push(_localizedNamespaceLc.split(' ').join('[ _]')); //todo: escape regexp fragments!
		});

		// images and categories are a nono
		this.kill(
			RegExp('[[][[]\\s*(' + forbiddenNamespaceAliases.join('|') + ')\\s*:', 'i'),
			/\]\]\s*/,
			'[',
			']'
		);
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.killHTML = function () {
		// kill <ref ...>...</ref>
		this.kill(/<ref\b[^/>]*?>/i, /<\/ref>/i);

		// let's also delete entire lines starting with <. it's worth a try.
		this.data = this.data.replace(RegExp('(^|\\n) *<.*', 'g'), '\n');

		// and those pesky html tags, but not <nowiki> or <blockquote>
		var splitted = this.data.parenSplit(/(<[\w\W]*?(?:>|$|(?=<)))/);
		var len = splitted.length;
		for (var i = 1; i < len; i = i + 2) {
			switch (splitted[i]) {
				case '<nowiki>':
				case '</nowiki>':
				case '<blockquote>':
				case '</blockquote>':
					break;
				default:
					splitted[i] = '';
			}
		}
		this.data = splitted.join('');
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.killChunks = function () {
		// heuristics alert
		// chunks of italic text? you crazy, man?
		var italicChunkRegex = new RegExp(
			"((^|\\n)\\s*:*\\s*''[^']([^']|'''|'[^']){20}(.|\\n[^\\n])*''[.!?\\s]*\\n)+",
			'g'
		);
		// keep stuff separated, though, so stick in \n (fixes [[Union Jack]]?
		this.data = this.data.replace(italicChunkRegex, '\n');
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.mopup = function () {
		// we simply *can't* be doing with horizontal rules right now
		this.data = this.data.replace(RegExp('^-{4,}', 'mg'), '');

		// no indented lines
		this.data = this.data.replace(RegExp('(^|\\n) *:[^\\n]*', 'g'), '');

		// replace __TOC__, __NOTOC__ and whatever else there is
		// this'll probably do
		this.data = this.data.replace(RegExp('^__[A-Z_]*__ *$', 'gmi'), '');
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.firstBit = function () {
		// dont't be givin' me no subsequent paragraphs, you hear me?
		/// first we "normalize" section headings, removing whitespace after, adding before
		var d = this.data;

		if (getValueOf('popupPreviewCutHeadings')) {
			this.data = this.data.replace(RegExp('\\s*(==+[^=]*==+)\\s*', 'g'), '\n\n$1 ');
			/// then we want to get rid of paragraph breaks whose text ends badly
			this.data = this.data.replace(RegExp('([:;]) *\\n{2,}', 'g'), '$1\n');

			this.data = this.data.replace(RegExp('^[\\s\\n]*'), '');
			var stuff = RegExp('^([^\\n]|\\n[^\\n\\s])*').exec(this.data);
			if (stuff) {
				d = stuff[0];
			}
			if (!getValueOf('popupPreviewFirstParOnly')) {
				d = this.data;
			}

			/// now put \n\n after sections so that bullets and numbered lists work
			d = d.replace(RegExp('(==+[^=]*==+)\\s*', 'g'), '$1\n\n');
		}

		// Split sentences. Superfluous sentences are RIGHT OUT.
		// note: exactly 1 set of parens here needed to make the slice work
		d = d.parenSplit(RegExp('([!?.]+["' + "'" + ']*\\s)', 'g'));
		// leading space is bad, mmkay?
		d[0] = d[0].replace(RegExp('^\\s*'), '');

		var notSentenceEnds = RegExp(
			'([^.][a-z][.] *[a-z]|etc|sic|Dr|Mr|Mrs|Ms|St|no|op|cit|\\[[^\\]]*|\\s[A-Zvclm])$',
			'i'
		);
		d = this.fixSentenceEnds(d, notSentenceEnds);

		this.fullLength = d.join('').length;
		var n = this.maxSentences;
		var dd = this.firstSentences(d, n);

		do {
			dd = this.firstSentences(d, n);
			--n;
		} while (dd.length > this.maxCharacters && n !== 0);

		this.data = dd;
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.fixSentenceEnds = function (strs, reg) {
		// take an array of strings, strs
		// join strs[i] to strs[i+1] & strs[i+2] if strs[i] matches regex reg

		for (var i = 0; i < strs.length - 2; ++i) {
			if (reg.test(strs[i])) {
				var a = [];
				for (var j = 0; j < strs.length; ++j) {
					if (j < i) {
						a[j] = strs[j];
					}
					if (j == i) {
						a[i] = strs[i] + strs[i + 1] + strs[i + 2];
					}
					if (j > i + 2) {
						a[j - 2] = strs[j];
					}
				}
				return this.fixSentenceEnds(a, reg);
			}
		}
		return strs;
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.firstSentences = function (strs, howmany) {
		var t = strs.slice(0, 2 * howmany);
		return t.join('');
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.killBadWhitespace = function () {
		// also cleans up isolated '''', eg [[Suntory Sungoliath]]
		this.data = this.data.replace(RegExp("^ *'+ *$", 'gm'), '');
	};

	/**
	 * Runs the various methods to generate the preview.
	 * The preview is stored in the <code>html</html> field.
	 * @private
	 */
	Previewmaker.prototype.makePreview = function () {
		if (
			this.owner.article.namespaceId() != pg.nsTemplateId &&
			this.owner.article.namespaceId() != pg.nsImageId
		) {
			this.killComments();
			this.killDivs();
			this.killGalleries();
			this.killBoxTemplates();

			if (getValueOf('popupPreviewKillTemplates')) {
				this.killTemplates();
			} else {
				this.killMultilineTemplates();
			}
			this.killTables();
			this.killImages();
			this.killHTML();
			this.killChunks();
			this.mopup();

			this.firstBit();
			this.killBadWhitespace();
		} else {
			this.killHTML();
		}
		this.html = wiki2html(this.data, this.baseUrl); // needs livepreview
		this.fixHTML();
		this.stripLongTemplates();
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.esWiki2HtmlPart = function (data) {
		var reLinks = /(?:\[\[([^|\]]*)(?:\|([^|\]]*))*]]([a-z]*))/gi; //match a wikilink
		reLinks.lastIndex = 0; //reset regex

		var match;
		var result = '';
		var postfixIndex = 0;
		while ((match = reLinks.exec(data))) {
			//match all wikilinks
			//FIXME: the way that link is built here isn't perfect. It is clickable, but popups preview won't recognize it in some cases.
			result +=
				pg.escapeQuotesHTML(data.substring(postfixIndex, match.index)) +
				'<a href="' +
				Insta.conf.paths.articles +
				pg.escapeQuotesHTML(match[1]) +
				'">' +
				pg.escapeQuotesHTML((match[2] ? match[2] : match[1]) + match[3]) +
				'</a>';
			postfixIndex = reLinks.lastIndex;
		}
		//append the rest
		result += pg.escapeQuotesHTML(data.substring(postfixIndex));

		return result;
	};
	Previewmaker.prototype.editSummaryPreview = function () {
		var reAes = /\/\* *(.*?) *\*\//g; //match the first section marker
		reAes.lastIndex = 0; //reset regex

		var match;

		match = reAes.exec(this.data);
		if (match) {
			//we have a section link. Split it, process it, combine it.
			var prefix = this.data.substring(0, match.index - 1);
			var section = match[1];
			var postfix = this.data.substring(reAes.lastIndex);

			var start = "<span class='autocomment'>";
			var end = '</span>';
			if (prefix.length > 0) {
				start = this.esWiki2HtmlPart(prefix) + ' ' + start + '- ';
			}
			if (postfix.length > 0) {
				end = ': ' + end + this.esWiki2HtmlPart(postfix);
			}

			var t = new Title().fromURL(this.baseUrl);
			t.anchorFromUtf(section);
			var sectionLink =
				Insta.conf.paths.articles +
				pg.escapeQuotesHTML(t.toString(true)) +
				'#' +
				pg.escapeQuotesHTML(t.anchor);
			return (
				start + '<a href="' + sectionLink + '">&rarr;</a> ' + pg.escapeQuotesHTML(section) + end
			);
		}

		//else there's no section link, htmlify the whole thing.
		return this.esWiki2HtmlPart(this.data);
	};

	/** Test function for debugging preview problems one step at a time. */
	/*eslint-disable */
	function previewSteps(txt) {
		try {
			txt = txt || document.editform.wpTextbox1.value;
		} catch (err) {
			if (pg.cache.pages.length > 0) {
				txt = pg.cache.pages[pg.cache.pages.length - 1].data;
			} else {
				alert('provide text or use an edit page');
			}
		}
		txt = txt.substring(0, 10000);
		var base = pg.wiki.articlebase + Title.fromURL(document.location.href).urlString();
		var p = new Previewmaker(txt, base, pg.current.link.navpopup);
		if (this.owner.article.namespaceId() != pg.nsTemplateId) {
			p.killComments();
			if (!confirm('done killComments(). Continue?\n---\n' + p.data)) {
				return;
			}
			p.killDivs();
			if (!confirm('done killDivs(). Continue?\n---\n' + p.data)) {
				return;
			}
			p.killGalleries();
			if (!confirm('done killGalleries(). Continue?\n---\n' + p.data)) {
				return;
			}
			p.killBoxTemplates();
			if (!confirm('done killBoxTemplates(). Continue?\n---\n' + p.data)) {
				return;
			}

			if (getValueOf('popupPreviewKillTemplates')) {
				p.killTemplates();
				if (!confirm('done killTemplates(). Continue?\n---\n' + p.data)) {
					return;
				}
			} else {
				p.killMultilineTemplates();
				if (!confirm('done killMultilineTemplates(). Continue?\n---\n' + p.data)) {
					return;
				}
			}

			p.killTables();
			if (!confirm('done killTables(). Continue?\n---\n' + p.data)) {
				return;
			}
			p.killImages();
			if (!confirm('done killImages(). Continue?\n---\n' + p.data)) {
				return;
			}
			p.killHTML();
			if (!confirm('done killHTML(). Continue?\n---\n' + p.data)) {
				return;
			}
			p.killChunks();
			if (!confirm('done killChunks(). Continue?\n---\n' + p.data)) {
				return;
			}
			p.mopup();
			if (!confirm('done mopup(). Continue?\n---\n' + p.data)) {
				return;
			}

			p.firstBit();
			if (!confirm('done firstBit(). Continue?\n---\n' + p.data)) {
				return;
			}
			p.killBadWhitespace();
			if (!confirm('done killBadWhitespace(). Continue?\n---\n' + p.data)) {
				return;
			}
		}

		p.html = wiki2html(p.data, base); // needs livepreview
		p.fixHTML();
		if (!confirm('done fixHTML(). Continue?\n---\n' + p.html)) {
			return;
		}
		p.stripLongTemplates();
		if (!confirm('done stripLongTemplates(). Continue?\n---\n' + p.html)) {
			return;
		}
		alert('finished preview - end result follows.\n---\n' + p.html);
	}
	/*eslint-enable */

	/**
	 * Works around livepreview bugs.
	 * @private
	 */
	Previewmaker.prototype.fixHTML = function () {
		if (!this.html) {
			return;
		}

		var ret = this.html;

		// fix question marks in wiki links
		// maybe this'll break some stuff :-(
		ret = ret.replace(
			RegExp('(<a href="' + pg.wiki.articlePath + '/[^"]*)[?](.*?")', 'g'),
			'$1%3F$2'
		);
		ret = ret.replace(
			RegExp("(<a href='" + pg.wiki.articlePath + "/[^']*)[?](.*?')", 'g'),
			'$1%3F$2'
		);
		// FIXME fix up % too

		this.html = ret;
	};

	/**
	 * Generates the preview and displays it in the current popup.

	 * Does nothing if the generated preview is invalid or consists of whitespace only.
	 * Also activates wikilinks in the preview for subpopups if the popupSubpopups option is true.
	 */
	Previewmaker.prototype.showPreview = function () {
		this.makePreview();
		if (typeof this.html != typeof '') {
			return;
		}
		if (RegExp('^\\s*$').test(this.html)) {
			return;
		}
		setPopupHTML('<hr />', 'popupPrePreviewSep', this.owner.idNumber);
		setPopupTipsAndHTML(this.html, 'popupPreview', this.owner.idNumber, {
			owner: this.owner,
		});
		var more = this.fullLength > this.data.length ? this.moreLink() : '';
		setPopupHTML(more, 'popupPreviewMore', this.owner.idNumber);
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.moreLink = function () {
		var a = document.createElement('a');
		a.className = 'popupMoreLink';
		a.innerHTML = popupString('more...');
		var savedThis = this;
		a.onclick = function () {
			savedThis.maxCharacters += 2000;
			savedThis.maxSentences += 20;
			savedThis.setData();
			savedThis.showPreview();
		};
		return a;
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.stripLongTemplates = function () {
		// operates on the HTML!
		this.html = this.html.replace(
			RegExp('^.{0,1000}[{][{][^}]*?(<(p|br)( /)?>\\s*){2,}([^{}]*?[}][}])?', 'gi'),
			''
		);
		this.html = this.html.split('\n').join(' '); // workaround for <pre> templates
		this.html = this.html.replace(RegExp('[{][{][^}]*<pre>[^}]*[}][}]', 'gi'), '');
	};

	/**
	 * @private
	 */
	Previewmaker.prototype.killMultilineTemplates = function () {
		this.kill('{{{', '}}}');
		this.kill(RegExp('\\s*[{][{][^{}]*\\n'), '}}', '{{');
	};
	// ENDFILE: previewmaker.js

	// STARTFILE: querypreview.js
	function loadAPIPreview(queryType, article, navpop) {
		var art = new Title(article).urlString();
		var url = pg.wiki.apiwikibase + '?format=json&formatversion=2&action=query&';
		var htmlGenerator = function (/*a, d*/) {
			alert('invalid html generator');
		};
		var usernameart = '';
		switch (queryType) {
			case 'history':
				url +=
					'titles=' + art + '&prop=revisions&rvlimit=' + getValueOf('popupHistoryPreviewLimit');
				htmlGenerator = APIhistoryPreviewHTML;
				break;
			case 'category':
				url += 'list=categorymembers&cmtitle=' + art;
				htmlGenerator = APIcategoryPreviewHTML;
				break;
			case 'userinfo':
				var username = new Title(article).userName();
				usernameart = encodeURIComponent(username);
				if (pg.re.ipUser.test(username)) {
					url += 'list=blocks&bkprop=range|restrictions&bkip=' + usernameart;
				} else {
					url +=
						'list=users|usercontribs&usprop=blockinfo|groups|editcount|registration|gender&ususers=' +
						usernameart +
						'&meta=globaluserinfo&guiprop=groups|unattached&guiuser=' +
						usernameart +
						'&uclimit=1&ucprop=timestamp&ucuser=' +
						usernameart;
				}
				htmlGenerator = APIuserInfoPreviewHTML;
				break;
			case 'contribs':
				usernameart = encodeURIComponent(new Title(article).userName());
				url +=
					'list=usercontribs&ucuser=' +
					usernameart +
					'&uclimit=' +
					getValueOf('popupContribsPreviewLimit');
				htmlGenerator = APIcontribsPreviewHTML;
				break;
			case 'imagepagepreview':
				var trail = '';
				if (getValueOf('popupImageLinks')) {
					trail = '&list=imageusage&iutitle=' + art;
				}
				url += 'titles=' + art + '&prop=revisions|imageinfo&rvslots=main&rvprop=content' + trail;
				htmlGenerator = APIimagepagePreviewHTML;
				break;
			case 'backlinks':
				url += 'list=backlinks&bltitle=' + art;
				htmlGenerator = APIbacklinksPreviewHTML;
				break;
			case 'revision':
				if (article.oldid) {
					url += 'revids=' + article.oldid;
				} else {
					url += 'titles=' + article.removeAnchor().urlString();
				}
				url +=
					'&prop=revisions|pageprops|info|images|categories&meta=wikibase&rvslots=main&rvprop=ids|timestamp|flags|comment|user|content&cllimit=max&imlimit=max';
				htmlGenerator = APIrevisionPreviewHTML;
				break;
		}
		pendingNavpopTask(navpop);
		var callback = function (d) {
			log('callback of API functions was hit');
			if (queryType === 'userinfo') {
				// We need to do another API request
				fetchUserGroupNames(d.data).then(function () {
					showAPIPreview(queryType, htmlGenerator(article, d, navpop), navpop.idNumber, navpop, d);
				});
				return;
			}
			showAPIPreview(queryType, htmlGenerator(article, d, navpop), navpop.idNumber, navpop, d);
		};
		var go = function () {
			getPageWithCaching(url, callback, navpop);
			return true;
		};

		if (navpop.visible || !getValueOf('popupLazyDownloads')) {
			go();
		} else {
			navpop.addHook(go, 'unhide', 'before', 'DOWNLOAD_' + queryType + '_QUERY_DATA');
		}
	}

	function linkList(list) {
		list.sort(function (x, y) {
			return x == y ? 0 : x < y ? -1 : 1;
		});
		var buf = [];
		for (var i = 0; i < list.length; ++i) {
			buf.push(
				wikiLink({
					article: new Title(list[i]),
					text: list[i].split(' ').join('&nbsp;'),
					action: 'view',
				})
			);
		}
		return buf.join(', ');
	}

	function getTimeOffset() {
		var tz = mw.user.options.get('timecorrection');

		if (tz) {
			if (tz.indexOf('|') > -1) {
				// New format
				return parseInt(tz.split('|')[1], 10);
			}
		}
		return 0;
	}

	function getTimeZone() {
		if (!pg.user.timeZone) {
			var tz = mw.user.options.get('timecorrection');
			pg.user.timeZone = 'UTC';

			if (tz) {
				var tzComponents = tz.split('|');
				if (tzComponents.length === 3 && tzComponents[0] === 'ZoneInfo') {
					pg.user.timeZone = tzComponents[2];
				} else {
					errlog('Unexpected timezone information: ' + tz);
				}
			}
		}
		return pg.user.timeZone;
	}

	/**
	 * Should we use an offset or can we use proper timezones
	 */
	function useTimeOffset() {
		if (typeof Intl.DateTimeFormat.prototype.formatToParts === 'undefined') {
			// IE 11
			return true;
		}
		var tz = mw.user.options.get('timecorrection');
		if (tz && tz.indexOf('ZoneInfo|') === -1) {
			// System| Default system time, default for users who didn't configure timezone
			// Offset| Manual defined offset by user
			return true;
		}
		return false;
	}

	/**
	 * Array of locales for the purpose of javascript locale based formatting
	 * Filters down to those supported by the browser. Empty [] === System's default locale
	 */
	function getLocales() {
		if (!pg.user.locales) {
			var userLanguage = document.querySelector('html').getAttribute('lang'); // make sure we have HTML locale
			if (getValueOf('popupLocale')) {
				userLanguage = getValueOf('popupLocale');
			} else if (userLanguage === 'en') {
				// en.wp tends to treat this as international english / unspecified
				// but we have more specific settings in user options
				if (getMWDateFormat() === 'mdy') {
					userLanguage = 'en-US';
				} else {
					userLanguage = 'en-GB';
				}
			}
			pg.user.locales = Intl.DateTimeFormat.supportedLocalesOf([userLanguage, navigator.language]);
		}
		return pg.user.locales;
	}

	/**
	 * Retrieve configured MW date format for this user
	 * These can be
	 * default
	 * dmy: time, dmy
	 * mdy: time, mdy
	 * ymd: time, ymd
	 * dmyt: dmy, time
	 * dmyts: dmy, time + seconds
	 * ISO 8601: YYYY-MM-DDThh:mm:ss (local time)
	 *
	 * This isn't too useful for us, as JS doesn't have formatters to match these private specifiers
	 */
	function getMWDateFormat() {
		return mw.user.options.get('date');
	}

	/**
	 * Creates a HTML table that's shown in the history and user-contribs popups.
	 * @param {Object[]} h - a list of revisions, returned from the API
	 * @param {boolean} reallyContribs - true only if we're displaying user contributions
	 */
	function editPreviewTable(article, h, reallyContribs) {
		var html = ['<table>'];
		var day = null;
		var curart = article;
		var page = null;

		var makeFirstColumnLinks;
		if (reallyContribs) {
			// We're showing user contributions, so make (diff | hist) links
			makeFirstColumnLinks = function (currentRevision) {
				var result = '(';
				result +=
					'<a href="' +
					pg.wiki.titlebase +
					new Title(currentRevision.title).urlString() +
					'&diff=prev' +
					'&oldid=' +
					currentRevision.revid +
					'">' +
					popupString('diff') +
					'</a>';
				result += '&nbsp;|&nbsp;';
				result +=
					'<a href="' +
					pg.wiki.titlebase +
					new Title(currentRevision.title).urlString() +
					'&action=history">' +
					popupString('hist') +
					'</a>';
				result += ')';
				return result;
			};
		} else {
			// It's a regular history page, so make (cur | last) links
			var firstRevid = h[0].revid;
			makeFirstColumnLinks = function (currentRevision) {
				var result = '(';
				result +=
					'<a href="' +
					pg.wiki.titlebase +
					new Title(curart).urlString() +
					'&diff=' +
					firstRevid +
					'&oldid=' +
					currentRevision.revid +
					'">' +
					popupString('cur') +
					'</a>';
				result += '&nbsp;|&nbsp;';
				result +=
					'<a href="' +
					pg.wiki.titlebase +
					new Title(curart).urlString() +
					'&diff=prev&oldid=' +
					currentRevision.revid +
					'">' +
					popupString('last') +
					'</a>';
				result += ')';
				return result;
			};
		}

		for (var i = 0; i < h.length; ++i) {
			if (reallyContribs) {
				page = h[i].title;
				curart = new Title(page);
			}
			var minor = h[i].minor ? '<b>m </b>' : '';
			var editDate = new Date(h[i].timestamp);
			var thisDay = formattedDate(editDate);
			var thisTime = formattedTime(editDate);
			if (thisDay == day) {
				thisDay = '';
			} else {
				day = thisDay;
			}
			if (thisDay) {
				html.push(
					'<tr><td colspan=3><span class="popup_history_date">' + thisDay + '</span></td></tr>'
				);
			}
			html.push('<tr class="popup_history_row_' + (i % 2 ? 'odd' : 'even') + '">');
			html.push('<td>' + makeFirstColumnLinks(h[i]) + '</td>');
			html.push(
				'<td>' +
					'<a href="' +
					pg.wiki.titlebase +
					new Title(curart).urlString() +
					'&oldid=' +
					h[i].revid +
					'">' +
					thisTime +
					'</a></td>'
			);
			var col3url = '',
				col3txt = '';
			if (!reallyContribs) {
				var user = h[i].user;
				if (!h[i].userhidden) {
					if (pg.re.ipUser.test(user)) {
						col3url =
							pg.wiki.titlebase +
							mw.config.get('wgFormattedNamespaces')[pg.nsSpecialId] +
							':Contributions&target=' +
							new Title(user).urlString();
					} else {
						col3url =
							pg.wiki.titlebase +
							mw.config.get('wgFormattedNamespaces')[pg.nsUserId] +
							':' +
							new Title(user).urlString();
					}
					col3txt = pg.escapeQuotesHTML(user);
				} else {
					col3url = getValueOf('popupRevDelUrl');
					col3txt = pg.escapeQuotesHTML(popupString('revdel'));
				}
			} else {
				col3url = pg.wiki.titlebase + curart.urlString();
				col3txt = pg.escapeQuotesHTML(page);
			}
			html.push(
				'<td>' +
					(reallyContribs ? minor : '') +
					'<a href="' +
					col3url +
					'">' +
					col3txt +
					'</a></td>'
			);
			var comment = '';
			var c = h[i].comment || ( typeof h[i].slots !== 'undefined' ? h[i].slots.main.content : null );
			if (c) {
				comment = new Previewmaker(c, new Title(curart).toUrl()).editSummaryPreview();
			} else if (h[i].commenthidden) {
				comment = popupString('revdel');
			}
			html.push('<td>' + (!reallyContribs ? minor : '') + comment + '</td>');
			html.push('</tr>');
			html = [html.join('')];
		}
		html.push('</table>');
		return html.join('');
	}

	function adjustDate(d, offset) {
		// offset is in minutes
		var o = offset * 60 * 1000;
		return new Date(Number(d) + o);
	}

	/**
	 * This relies on the Date parser understanding en-US dates,
	 * which is pretty safe assumption, but not perfect.
	 */
	function convertTimeZone(date, timeZone) {
		return new Date(date.toLocaleString('en-US', { timeZone: timeZone }));
	}

	function formattedDateTime(date) {
		// fallback for IE11 and unknown timezones
		if (useTimeOffset()) {
			return formattedDate(date) + ' ' + formattedTime(date);
		}

		if (getMWDateFormat() === 'ISO 8601') {
			var d2 = convertTimeZone(date, getTimeZone());
			return (
				map(zeroFill, [d2.getFullYear(), d2.getMonth() + 1, d2.getDate()]).join('-') +
				'T' +
				map(zeroFill, [d2.getHours(), d2.getMinutes(), d2.getSeconds()]).join(':')
			);
		}

		var options = getValueOf('popupDateTimeFormatterOptions');
		options['timeZone'] = getTimeZone();
		return date.toLocaleString(getLocales(), options);
	}

	function formattedDate(date) {
		// fallback for IE11 and unknown timezones
		if (useTimeOffset()) {
			// we adjust the UTC time, so we print the adjusted UTC, but not really UTC values
			var d2 = adjustDate(date, getTimeOffset());
			return map(zeroFill, [d2.getUTCFullYear(), d2.getUTCMonth() + 1, d2.getUTCDate()]).join('-');
		}

		if (getMWDateFormat() === 'ISO 8601') {
			var d2 = convertTimeZone(date, getTimeZone());
			return map(zeroFill, [d2.getFullYear(), d2.getMonth() + 1, d2.getDate()]).join('-');
		}

		var options = getValueOf('popupDateFormatterOptions');
		options['timeZone'] = getTimeZone();
		return date.toLocaleDateString(getLocales(), options);
	}

	function formattedTime(date) {
		// fallback for IE11 and unknown timezones
		if (useTimeOffset()) {
			// we adjust the UTC time, so we print the adjusted UTC, but not really UTC values
			var d2 = adjustDate(date, getTimeOffset());
			return map(zeroFill, [d2.getUTCHours(), d2.getUTCMinutes(), d2.getUTCSeconds()]).join(':');
		}

		if (getMWDateFormat() === 'ISO 8601') {
			var d2 = convertTimeZone(date, getTimeZone());
			return map(zeroFill, [d2.getHours(), d2.getMinutes(), d2.getSeconds()]).join(':');
		}

		var options = getValueOf('popupTimeFormatterOptions');
		options['timeZone'] = getTimeZone();
		return date.toLocaleTimeString(getLocales(), options);
	}

	// Get the proper groupnames for the technicalgroups
	function fetchUserGroupNames(userinfoResponse) {
		var queryObj = getJsObj(userinfoResponse).query;
		var user = anyChild(queryObj.users);
		var messages = [];
		if (user.groups) {
			user.groups.forEach(function (groupName) {
				if (['*', 'user', 'autoconfirmed', 'extendedconfirmed', 'named'].indexOf(groupName) === -1) {
					messages.push('group-' + groupName + '-member');
				}
			});
		}
		if (queryObj.globaluserinfo && queryObj.globaluserinfo.groups) {
			queryObj.globaluserinfo.groups.forEach(function (groupName) {
				messages.push('group-' + groupName + '-member');
			});
		}
		return getMwApi().loadMessagesIfMissing(messages);
	}

	function showAPIPreview(queryType, html, id, navpop, download) {
		// DJ: done
		var target = 'popupPreview';
		completedNavpopTask(navpop);

		switch (queryType) {
			case 'imagelinks':
			case 'category':
				target = 'popupPostPreview';
				break;
			case 'userinfo':
				target = 'popupUserData';
				break;
			case 'revision':
				insertPreview(download);
				return;
		}
		setPopupTipsAndHTML(html, target, id);
	}

	function APIrevisionPreviewHTML(article, download) {
		try {
			var jsObj = getJsObj(download.data);
			var page = anyChild(jsObj.query.pages);
			if (page.missing) {
				// TODO we need to fix this proper later on
				download.owner = null;
				return;
			}
			var content =
				page && page.revisions && page.revisions[0] &&
				page.revisions[0].slots && page.revisions[0].slots.main &&
				page.revisions[0].slots.main.contentmodel === 'wikitext'
					? page.revisions[0].slots.main.content
					: null;
			if (typeof content === 'string') {
				download.data = content;
				download.lastModified = new Date(page.revisions[0].timestamp);
			}
			if (page.pageprops.wikibase_item) {
				download.wikibaseItem = page.pageprops.wikibase_item;
				download.wikibaseRepo = jsObj.query.wikibase.repo.url.base
										+ jsObj.query.wikibase.repo.url.articlepath;
			}
		} catch (someError) {
			return 'Revision preview failed :(';
		}
	}

	function APIbacklinksPreviewHTML(article, download /*, navpop*/) {
		try {
			var jsObj = getJsObj(download.data);
			var list = jsObj.query.backlinks;

			var html = [];
			if (!list) {
				return popupString('No backlinks found');
			}
			for (var i = 0; i < list.length; i++) {
				var t = new Title(list[i].title);
				html.push(
					'<a href="' + pg.wiki.titlebase + t.urlString() + '">' + t.toString().entify() + '</a>'
				);
			}
			html = html.join(', ');
			if (jsObj['continue'] && jsObj['continue'].blcontinue) {
				html += popupString(' and more');
			}
			return html;
		} catch (someError) {
			return 'backlinksPreviewHTML went wonky';
		}
	}

	pg.fn.APIsharedImagePagePreviewHTML = function APIsharedImagePagePreviewHTML(obj) {
		log('APIsharedImagePagePreviewHTML');
		var popupid = obj.requestid;
		if (obj.query && obj.query.pages) {
			var page = anyChild(obj.query.pages);
			var content =
				page && page.revisions && page.revisions[0] &&
				page.revisions[0].slots && page.revisions[0].slots.main &&
				page.revisions[0].slots.main.contentmodel === 'wikitext'
					? page.revisions[0].slots.main.content
					: null;
			if (
				typeof content === 'string' &&
				pg &&
				pg.current &&
				pg.current.link &&
				pg.current.link.navpopup
			) {
				/* Not entirely safe, but the best we can do */
				var p = new Previewmaker(
					content,
					pg.current.link.navpopup.article,
					pg.current.link.navpopup
				);
				p.makePreview();
				setPopupHTML(p.html, 'popupSecondPreview', popupid);
			}
		}
	};

	function APIimagepagePreviewHTML(article, download, navpop) {
		try {
			var jsObj = getJsObj(download.data);
			var page = anyChild(jsObj.query.pages);
			var content =
				page && page.revisions && page.revisions[0] &&
				page.revisions[0].slots && page.revisions[0].slots.main &&
				page.revisions[0].slots.main.contentmodel === 'wikitext'
					? page.revisions[0].slots.main.content
					: null;
			var ret = '';
			var alt = '';
			try {
				alt = navpop.parentAnchor.childNodes[0].alt;
			} catch (e) {}
			if (alt) {
				ret = ret + '<hr /><b>' + popupString('Alt text:') + '</b> ' + pg.escapeQuotesHTML(alt);
			}
			if (typeof content === 'string') {
				var p = prepPreviewmaker(content, article, navpop);
				p.makePreview();
				if (p.html) {
					ret += '<hr />' + p.html;
				}
				if (getValueOf('popupSummaryData')) {
					var info = getPageInfo(content, download);
					log(info);
					setPopupTrailer(info, navpop.idNumber);
				}
			}
			if (page && page.imagerepository == 'shared') {
				var art = new Title(article);
				var encart = encodeURIComponent('File:' + art.stripNamespace());
				var shared_url =
					pg.wiki.apicommonsbase +
					'?format=json&formatversion=2' +
					'&callback=pg.fn.APIsharedImagePagePreviewHTML' +
					'&requestid=' +
					navpop.idNumber +
					'&action=query&prop=revisions&rvslots=main&rvprop=content&titles=' +
					encart;

				ret =
					ret +
					'<hr />' +
					popupString('Image from Commons') +
					': <a href="' +
					pg.wiki.commonsbase +
					'?title=' +
					encart +
					'">' +
					popupString('Description page') +
					'</a>';
				mw.loader.load(shared_url);
			}
			showAPIPreview(
				'imagelinks',
				APIimagelinksPreviewHTML(article, download),
				navpop.idNumber,
				download
			);
			return ret;
		} catch (someError) {
			return 'API imagepage preview failed :(';
		}
	}

	function APIimagelinksPreviewHTML(article, download) {
		try {
			var jsobj = getJsObj(download.data);
			var list = jsobj.query.imageusage;
			if (list) {
				var ret = [];
				for (var i = 0; i < list.length; i++) {
					ret.push(list[i].title);
				}
				if (ret.length === 0) {
					return popupString('No image links found');
				}
				return '<h2>' + popupString('File links') + '</h2>' + linkList(ret);
			} else {
				return popupString('No image links found');
			}
		} catch (someError) {
			return 'Image links preview generation failed :(';
		}
	}

	function APIcategoryPreviewHTML(article, download) {
		try {
			var jsobj = getJsObj(download.data);
			var list = jsobj.query.categorymembers;
			var ret = [];
			for (var p = 0; p < list.length; p++) {
				ret.push(list[p].title);
			}
			if (ret.length === 0) {
				return popupString('Empty category');
			}
			ret = '<h2>' + tprintf('Category members (%s shown)', [ret.length]) + '</h2>' + linkList(ret);
			if (jsobj['continue'] && jsobj['continue'].cmcontinue) {
				ret += popupString(' and more');
			}
			return ret;
		} catch (someError) {
			return 'Category preview failed :(';
		}
	}

	function APIuserInfoPreviewHTML(article, download) {
		var ret = [];
		var queryobj = {};
		try {
			queryobj = getJsObj(download.data).query;
		} catch (someError) {
			return 'Userinfo preview failed :(';
		}

		var user = anyChild(queryobj.users);
		if (user) {
			var globaluserinfo = queryobj.globaluserinfo;
			if (user.invalid === '') {
				ret.push(popupString('Invalid user'));
			} else if (user.missing === '') {
				ret.push(popupString('Not a registered username'));
			}
			if (user.blockedby) {
				if (user.blockpartial) {
					ret.push('<b>' + popupString('Has blocks') + '</b>');
				} else {
					ret.push('<b>' + popupString('BLOCKED') + '</b>');
				}
			}
			if (globaluserinfo && ('locked' in globaluserinfo || 'hidden' in globaluserinfo)) {
				var lockedSulAccountIsAttachedToThis = true;
				for (var i = 0; globaluserinfo.unattached && i < globaluserinfo.unattached.length; i++) {
					if (globaluserinfo.unattached[i].wiki === mw.config.get('wgDBname')) {
						lockedSulAccountIsAttachedToThis = false;
						break;
					}
				}
				if (lockedSulAccountIsAttachedToThis) {
					if ('locked' in globaluserinfo) {
						ret.push('<b><i>' + popupString('LOCKED') + '</i></b>');
					}
					if ('hidden' in globaluserinfo) {
						ret.push('<b><i>' + popupString('HIDDEN') + '</i></b>');
					}
				}
			}
			if (getValueOf('popupShowGender') && user.gender) {
				switch (user.gender) {
					case 'male':
						ret.push(popupString('he/him') + ' · ');
						break;
					case 'female':
						ret.push(popupString('she/her') + ' · ');
						break;
				}
			}
			if (user.groups) {
				user.groups.forEach(function (groupName) {
					if (['*', 'user', 'autoconfirmed', 'extendedconfirmed', 'named'].indexOf(groupName) === -1) {
						ret.push(
							pg.escapeQuotesHTML(mw.message('group-' + groupName + '-member', user.gender).text())
						);
					}
				});
			}
			if (globaluserinfo && globaluserinfo.groups) {
				globaluserinfo.groups.forEach(function (groupName) {
					ret.push(
						'<i>' +
							pg.escapeQuotesHTML(
								mw.message('group-' + groupName + '-member', user.gender).text()
							) +
							'</i>'
					);
				});
			}
			if (user.registration) {
				ret.push(
					pg.escapeQuotesHTML(
						(user.editcount ? user.editcount : '0') +
							popupString(' edits since: ') +
							(user.registration ? formattedDate(new Date(user.registration)) : '')
					)
				);
			}
		}

		if (queryobj.usercontribs && queryobj.usercontribs.length) {
			ret.push(
				popupString('last edit on ') + formattedDate(new Date(queryobj.usercontribs[0].timestamp))
			);
		}

		if (queryobj.blocks) {
			ret.push(popupString('IP user')); //we only request list=blocks for IPs
			for (var l = 0; l < queryobj.blocks.length; l++) {
				var rbstr =
					queryobj.blocks[l].rangestart === queryobj.blocks[l].rangeend ? 'BLOCK' : 'RANGEBLOCK';
				rbstr = !Array.isArray(queryobj.blocks[l].restrictions)
					? 'Has ' + rbstr.toLowerCase() + 's'
					: rbstr + 'ED';
				ret.push('<b>' + popupString(rbstr) + '</b>');
			}
		}

		// if any element of ret ends with ' · ', merge it with the next element to avoid
		// the .join(', ') call inserting a comma after it
		for (var m = 0; m < ret.length - 1; m++) {
			if (ret[m].length > 3 && ret[m].substring(ret[m].length - 3) === ' · ') {
				ret[m] = ret[m] + ret[m + 1];
				ret.splice(m + 1, 1); // delete element at index m+1
				m--;
			}
		}

		ret = '<hr />' + ret.join(', ');
		return ret;
	}

	function APIcontribsPreviewHTML(article, download, navpop) {
		return APIhistoryPreviewHTML(article, download, navpop, true);
	}

	function APIhistoryPreviewHTML(article, download, navpop, reallyContribs) {
		try {
			var jsobj = getJsObj(download.data);
			var edits = [];
			if (reallyContribs) {
				edits = jsobj.query.usercontribs;
			} else {
				edits = anyChild(jsobj.query.pages).revisions;
			}

			var ret = editPreviewTable(article, edits, reallyContribs);
			return ret;
		} catch (someError) {
			return popupString('History preview failed');
		}
	}

	// ENDFILE: querypreview.js

	// STARTFILE: debug.js
	////////////////////////////////////////////////////////////////////
	// Debugging functions
	////////////////////////////////////////////////////////////////////

	function setupDebugging() {
		if (window.popupDebug) {
			// popupDebug is set from .version
			window.log = function (x) {
				//if(gMsg!='')gMsg += '\n'; gMsg+=time() + ' ' + x; };
				window.console.log(x);
			};
			window.errlog = function (x) {
				window.console.error(x);
			};
			log('Initializing logger');
		} else {
			window.log = function () {};
			window.errlog = function () {};
		}
	}
	// ENDFILE: debug.js

	// STARTFILE: images.js

	// load image of type Title.
	function loadImage(image, navpop) {
		if (typeof image.stripNamespace != 'function') {
			alert('loadImages bad');
		}
		// API call to retrieve image info.

		if (!getValueOf('popupImages')) {
			return;
		}
		if (!isValidImageName(image)) {
			return false;
		}

		var art = image.urlString();

		var url = pg.wiki.apiwikibase + '?format=json&formatversion=2&action=query';
		url += '&prop=imageinfo&iiprop=url|mime&iiurlwidth=' + getValueOf('popupImageSizeLarge');
		url += '&titles=' + art;

		pendingNavpopTask(navpop);
		var callback = function (d) {
			popupsInsertImage(navpop.idNumber, navpop, d);
		};
		var go = function () {
			getPageWithCaching(url, callback, navpop);
			return true;
		};
		if (navpop.visible || !getValueOf('popupLazyDownloads')) {
			go();
		} else {
			navpop.addHook(go, 'unhide', 'after', 'DOWNLOAD_IMAGE_QUERY_DATA');
		}
	}

	function popupsInsertImage(id, navpop, download) {
		log('popupsInsertImage');
		var imageinfo;
		try {
			var jsObj = getJsObj(download.data);
			var imagepage = anyChild(jsObj.query.pages);
			if (typeof imagepage.imageinfo === 'undefined') {
				return;
			}
			imageinfo = imagepage.imageinfo[0];
		} catch (someError) {
			log('popupsInsertImage failed :(');
			return;
		}

		var popupImage = document.getElementById('popupImg' + id);
		if (!popupImage) {
			log('could not find insertion point for image');
			return;
		}

		popupImage.width = getValueOf('popupImageSize');
		popupImage.style.display = 'inline';

		// Set the source for the image.
		if (imageinfo.thumburl) {
			popupImage.src = imageinfo.thumburl;
		} else if (imageinfo.mime.indexOf('image') === 0) {
			popupImage.src = imageinfo.url;
			log('a thumb could not be found, using original image');
		} else {
			log("fullsize imagethumb, but not sure if it's an image");
		}

		var a = document.getElementById('popupImageLink' + id);
		if (a === null) {
			return null;
		}

		// Determine the action of the surrouding imagelink.
		switch (getValueOf('popupThumbAction')) {
			case 'imagepage':
				if (pg.current.article.namespaceId() != pg.nsImageId) {
					a.href = imageinfo.descriptionurl;
					// FIXME: unreliable pg.idNumber
					popTipsSoonFn('popupImage' + id)();
					break;
				}
			/* falls through */
			case 'sizetoggle':
				a.onclick = toggleSize;
				a.title = popupString('Toggle image size');
				return;
			case 'linkfull':
				a.href = imageinfo.url;
				a.title = popupString('Open full-size image');
				return;
		}
	}

	// Toggles the image between inline small and navpop fullwidth.
	// It's the same image, no actual sizechange occurs, only display width.
	function toggleSize() {
		var imgContainer = this;
		if (!imgContainer) {
			alert('imgContainer is null :/');
			return;
		}
		var img = imgContainer.firstChild;
		if (!img) {
			alert('img is null :/');
			return;
		}

		if (!img.style.width || img.style.width === '') {
			img.style.width = '100%';
		} else {
			img.style.width = '';
		}
	}

	// Returns one title of an image from wikiText.
	function getValidImageFromWikiText(wikiText) {
		// nb in pg.re.image we're interested in the second bracketed expression
		// this may change if the regex changes :-(
		//var match=pg.re.image.exec(wikiText);
		var matched = null;
		var match;
		// strip html comments, used by evil bots :-(
		var t = removeMatchesUnless(
			wikiText,
			RegExp('(<!--[\\s\\S]*?-->)'),
			1,
			RegExp('^<!--[^[]*popup', 'i')
		);

		while ((match = pg.re.image.exec(t))) {
			// now find a sane image name - exclude templates by seeking {
			var m = match[2] || match[6];
			if (isValidImageName(m)) {
				matched = m;
				break;
			}
		}
		pg.re.image.lastIndex = 0;
		if (!matched) {
			return null;
		}
		return mw.config.get('wgFormattedNamespaces')[pg.nsImageId] + ':' + upcaseFirst(matched);
	}

	function removeMatchesUnless(str, re1, parencount, re2) {
		var split = str.parenSplit(re1);
		var c = parencount + 1;
		for (var i = 0; i < split.length; ++i) {
			if (i % c === 0 || re2.test(split[i])) {
				continue;
			}
			split[i] = '';
		}
		return split.join('');
	}

	// ENDFILE: images.js

	// STARTFILE: namespaces.js
	// Set up namespaces and other non-strings.js localization
	// (currently that means redirs too)

	function setNamespaces() {
		pg.nsSpecialId = -1;
		pg.nsMainspaceId = 0;
		pg.nsImageId = 6;
		pg.nsUserId = 2;
		pg.nsUsertalkId = 3;
		pg.nsCategoryId = 14;
		pg.nsTemplateId = 10;
	}

	function setRedirs() {
		var r = 'redirect';
		var R = 'REDIRECT';
		var redirLists = {
			ar: [R, 'تحويل'],
			be: [r, 'перанакіраваньне'],
			bg: [r, 'пренасочване', 'виж'],
			bs: [r, 'Preusmjeri', 'preusmjeri', 'PREUSMJERI'],
			bn: [R, 'পুনর্নির্দেশ'],
			cs: [R, 'PŘESMĚRUJ'],
			cy: [r, 'ail-cyfeirio'],
			de: [R, 'WEITERLEITUNG'],
			el: [R, 'ΑΝΑΚΑΤΕΥΘΥΝΣΗ'],
			eo: [R, 'ALIDIREKTU', 'ALIDIREKTI'],
			es: [R, 'REDIRECCIÓN'],
			et: [r, 'suuna'],
			ga: [r, 'athsheoladh'],
			gl: [r, 'REDIRECCIÓN', 'REDIRECIONAMENTO'],
			he: [R, 'הפניה'],
			hu: [R, 'ÁTIRÁNYÍTÁS'],
			is: [r, 'tilvísun', 'TILVÍSUN'],
			it: [R, 'RINVIA', 'Rinvia'],
			ja: [R, '転送'],
			mk: [r, 'пренасочување', 'види'],
			nds: [r, 'wiederleiden'],
			'nds-nl': [R, 'DEURVERWIEZING', 'DUURVERWIEZING'],
			nl: [R, 'DOORVERWIJZING'],
			nn: [r, 'omdiriger'],
			pl: [R, 'PATRZ', 'PRZEKIERUJ', 'TAM'],
			pt: [R, 'redir'],
			ru: [R, 'ПЕРЕНАПРАВЛЕНИЕ', 'ПЕРЕНАПР'],
			sk: [r, 'presmeruj'],
			sr: [r, 'Преусмери', 'преусмери', 'ПРЕУСМЕРИ', 'Preusmeri', 'preusmeri', 'PREUSMERI'],
			tr: [R, 'YÖNLENDİRME', 'yönlendirme', 'YÖNLENDİR', 'yönlendir'],
			tt: [R, 'yünältü', 'перенаправление', 'перенапр'],
			uk: [R, 'ПЕРЕНАПРАВЛЕННЯ', 'ПЕРЕНАПР'],
			vi: [r, 'đổi'],
			yi: [R, 'ווייטערפירן'],
			zh: [R, '重定向'], // no comma
		};
		var redirList = redirLists[pg.wiki.lang] || [r, R];
		// Mediawiki is very tolerant about what comes after the #redirect at the start
		pg.re.redirect = RegExp(
			'^\\s*[#](' + redirList.join('|') + ').*?\\[{2}([^\\|\\]]*)(|[^\\]]*)?\\]{2}\\s*(.*)',
			'i'
		);
	}

	function setInterwiki() {
		if (pg.wiki.wikimedia) {
			// From https://meta.wikimedia.org/wiki/List_of_Wikipedias
			//en.wikipedia.org/w/api.php?action=sitematrix&format=json&smtype=language&smlangprop=code&formatversion=2
			pg.wiki.interwiki =
				'aa|ab|ace|af|ak|als|am|an|ang|ar|arc|arz|as|ast|av|ay|az|ba|bar|bat-smg|bcl|be|be-x-old|bg|bh|bi|bjn|bm|bn|bo|bpy|br|bs|bug|bxr|ca|cbk-zam|cdo|ce|ceb|ch|cho|chr|chy|ckb|co|cr|crh|cs|csb|cu|cv|cy|da|de|diq|dsb|dv|dz|ee|el|eml|en|eo|es|et|eu|ext|fa|ff|fi|fiu-vro|fj|fo|fr|frp|frr|fur|fy|ga|gag|gan|gd|gl|glk|gn|got|gu|gv|ha|hak|haw|he|hi|hif|ho|hr|hsb|ht|hu|hy|hz|ia|id|ie|ig|ii|ik|ilo|io|is|it|iu|ja|jbo|jv|ka|kaa|kab|kbd|kg|ki|kj|kk|kl|km|kn|ko|koi|kr|krc|ks|ksh|ku|kv|kw|ky|la|lad|lb|lbe|lg|li|lij|lmo|ln|lo|lt|ltg|lv|map-bms|mdf|mg|mh|mhr|mi|mk|ml|mn|mo|mr|mrj|ms|mt|mus|mwl|my|myv|mzn|na|nah|nap|nds|nds-nl|ne|new|ng|nl|nn|no|nov|nrm|nv|ny|oc|om|or|os|pa|pag|pam|pap|pcd|pdc|pfl|pi|pih|pl|pms|pnb|pnt|ps|pt|qu|rm|rmy|rn|ro|roa-rup|roa-tara|ru|rue|rw|sa|sah|sc|scn|sco|sd|se|sg|sh|si|simple|sk|sl|sm|sn|so|sq|sr|srn|ss|st|stq|su|sv|sw|szl|ta|te|tet|tg|th|ti|tk|tl|tn|to|tpi|tr|ts|tt|tum|tw|ty|udm|ug|uk|ur|uz|ve|vec|vi|vls|vo|wa|war|wo|wuu|xal|xh|yi|yo|za|zea|zh|zh-classical|zh-min-nan|zh-yue|zu';
			pg.re.interwiki = RegExp('^' + pg.wiki.interwiki + ':');
		} else {
			pg.wiki.interwiki = null;
			pg.re.interwiki = RegExp('^$');
		}
	}

	// return a regexp pattern matching all variants to write the given namespace
	function nsRe(namespaceId) {
		var imageNamespaceVariants = [];
		jQuery.each(mw.config.get('wgNamespaceIds'), function (_localizedNamespaceLc, _namespaceId) {
			if (_namespaceId != namespaceId) {
				return;
			}
			_localizedNamespaceLc = upcaseFirst(_localizedNamespaceLc);
			imageNamespaceVariants.push(
				mw.util.escapeRegExp(_localizedNamespaceLc).split(' ').join('[ _]')
			);
			imageNamespaceVariants.push(mw.util.escapeRegExp(encodeURI(_localizedNamespaceLc)));
		});

		return '(?:' + imageNamespaceVariants.join('|') + ')';
	}

	function nsReImage() {
		return nsRe(pg.nsImageId);
	}
	// ENDFILE: namespaces.js

	// STARTFILE: selpop.js
	function getEditboxSelection() {
		// see http://www.webgurusforum.com/8/12/0
		var editbox;
		try {
			editbox = document.editform.wpTextbox1;
		} catch (dang) {
			return;
		}
		// IE, Opera
		if (document.selection) {
			return document.selection.createRange().text;
		}
		// Mozilla
		var selStart = editbox.selectionStart;
		var selEnd = editbox.selectionEnd;
		return editbox.value.substring(selStart, selEnd);
	}

	function doSelectionPopup() {
		// popup if the selection looks like [[foo|anything afterwards at all
		// or [[foo|bar]]text without ']]'
		// or [[foo|bar]]
		var sel = getEditboxSelection();
		var open = sel.indexOf('[[');
		var pipe = sel.indexOf('|');
		var close = sel.indexOf(']]');
		if (open == -1 || (pipe == -1 && close == -1)) {
			return;
		}
		if ((pipe != -1 && open > pipe) || (close != -1 && open > close)) {
			return;
		}
		var article = new Title(sel.substring(open + 2, pipe < 0 ? close : pipe));
		if (getValueOf('popupOnEditSelection') == 'boxpreview') {
			return doSeparateSelectionPopup(sel, article);
		}
		if (close > 0 && sel.substring(close + 2).indexOf('[[') >= 0) {
			return;
		}
		var a = document.createElement('a');
		a.href = pg.wiki.titlebase + article.urlString();
		mouseOverWikiLink2(a);
		if (a.navpopup) {
			a.navpopup.addHook(
				function () {
					runStopPopupTimer(a.navpopup);
				},
				'unhide',
				'after'
			);
		}
	}

	function doSeparateSelectionPopup(str, article) {
		var div = document.getElementById('selectionPreview');
		if (!div) {
			div = document.createElement('div');
			div.id = 'selectionPreview';
			try {
				var box = document.editform.wpTextbox1;
				box.parentNode.insertBefore(div, box);
			} catch (error) {
				return;
			}
		}
		var p = prepPreviewmaker(str, article, newNavpopup(document.createElement('a'), article));
		p.makePreview();
		if (p.html) {
			div.innerHTML = p.html;
		}
		div.ranSetupTooltipsAlready = false;
		popTipsSoonFn('selectionPreview')();
	}
	// ENDFILE: selpop.js

	// STARTFILE: navpopup.js
	/**
	 * @fileoverview  Defines two classes: {@link Navpopup} and {@link Mousetracker}.
	 *
	 * <code>Navpopup</code> describes popups: when they appear, where, what
	 * they look like and so on.
	 *
	 * <code>Mousetracker</code> "captures" the mouse using
	 * <code>document.onmousemove</code>.
	 */

	/**
	 * Creates a new Mousetracker.
	 * @constructor
	 * @class The Mousetracker class. This monitors mouse movements and manages associated hooks.
	 */
	function Mousetracker() {
		/**
		 * Interval to regularly run the hooks anyway, in milliseconds.
		 * @type {number}
		 */
		this.loopDelay = 400;

		/**
		 * Timer for the loop.
		 * @type Timer
		 */
		this.timer = null;

		/**
		 * Flag - are we switched on?
		 * @type {boolean}
		 */
		this.active = false;

		/**
		 * Flag - are we probably inaccurate, i.e. not reflecting the actual mouse position?
		 */
		this.dirty = true;

		/**
		 * Array of hook functions.
		 * @private
		 * @type {Array}
		 */
		this.hooks = [];
	}

	/**
	 * Adds a hook, to be called when we get events.
	 * @param {Function} f A function which is called as
	 * <code>f(x,y)</code>. It should return <code>true</code> when it
	 * wants to be removed, and <code>false</code> otherwise.
	 */
	Mousetracker.prototype.addHook = function (f) {
		this.hooks.push(f);
	};

	/**
	 * Runs hooks, passing them the x
	 * and y coords of the mouse.  Hook functions that return true are
	 * passed to {@link Mousetracker#removeHooks} for removal.
	 * @private
	 */
	Mousetracker.prototype.runHooks = function () {
		if (!this.hooks || !this.hooks.length) {
			return;
		}
		//log('Mousetracker.runHooks; we got some hooks to run');
		var remove = false;
		var removeObj = {};
		// this method gets called a LOT -
		// pre-cache some variables
		var x = this.x,
			y = this.y,
			len = this.hooks.length;

		for (var i = 0; i < len; ++i) {
			//~ run the hook function, and remove it if it returns true
			if (this.hooks[i](x, y) === true) {
				remove = true;
				removeObj[i] = true;
			}
		}
		if (remove) {
			this.removeHooks(removeObj);
		}
	};

	/**
	 * Removes hooks.
	 * @private
	 * @param {Object} removeObj An object whose keys are the index
	 * numbers of functions for removal, with values that evaluate to true
	 */
	Mousetracker.prototype.removeHooks = function (removeObj) {
		var newHooks = [];
		var len = this.hooks.length;
		for (var i = 0; i < len; ++i) {
			if (!removeObj[i]) {
				newHooks.push(this.hooks[i]);
			}
		}
		this.hooks = newHooks;
	};

	/**
	 * Event handler for mouse wiggles.
	 * We simply grab the event, set x and y and run the hooks.
	 * This makes the cpu all hot and bothered :-(
	 * @private
	 * @param {Event} e Mousemove event
	 */
	Mousetracker.prototype.track = function (e) {
		//~ Apparently this is needed in IE.
		e = e || window.event;
		var x, y;
		if (e) {
			if (e.pageX) {
				x = e.pageX;
				y = e.pageY;
			} else if (typeof e.clientX != 'undefined') {
				var left,
					top,
					docElt = document.documentElement;

				if (docElt) {
					left = docElt.scrollLeft;
				}
				left = left || document.body.scrollLeft || document.scrollLeft || 0;

				if (docElt) {
					top = docElt.scrollTop;
				}
				top = top || document.body.scrollTop || document.scrollTop || 0;

				x = e.clientX + left;
				y = e.clientY + top;
			} else {
				return;
			}
			this.setPosition(x, y);
		}
	};

	/**
	 * Sets the x and y coordinates stored and takes appropriate action,
	 * running hooks as appropriate.
	 * @param {number} x, y Screen coordinates to set
	 */
	Mousetracker.prototype.setPosition = function (x, y) {
		this.x = x;
		this.y = y;
		if (this.dirty || this.hooks.length === 0) {
			this.dirty = false;
			return;
		}
		if (typeof this.lastHook_x != 'number') {
			this.lastHook_x = -100;
			this.lastHook_y = -100;
		}
		var diff = (this.lastHook_x - x) * (this.lastHook_y - y);
		diff = diff >= 0 ? diff : -diff;
		if (diff > 1) {
			this.lastHook_x = x;
			this.lastHook_y = y;
			if (this.dirty) {
				this.dirty = false;
			} else {
				this.runHooks();
			}
		}
	};

	/**
	 * Sets things in motion, unless they are already that is, registering an event handler on
	 * <code>document.onmousemove</code>. A half-hearted attempt is made to preserve the old event
	 * handler if there is one.
	 */
	Mousetracker.prototype.enable = function () {
		if (this.active) {
			return;
		}
		this.active = true;
		//~ Save the current handler for mousemove events. This isn't too
		//~ robust, of course.
		this.savedHandler = document.onmousemove;
		//~ Gotta save @tt{this} again for the closure, and use apply for
		//~ the member function.
		var savedThis = this;
		document.onmousemove = function (e) {
			savedThis.track.apply(savedThis, [e]);
		};
		if (this.loopDelay) {
			this.timer = setInterval(function () {
				//log('loop delay in mousetracker is working');
				savedThis.runHooks();
			}, this.loopDelay);
		}
	};

	/**
	 * Disables the tracker, removing the event handler.
	 */
	Mousetracker.prototype.disable = function () {
		if (!this.active) {
			return;
		}
		if (typeof this.savedHandler === 'function') {
			document.onmousemove = this.savedHandler;
		} else {
			delete document.onmousemove;
		}
		if (this.timer) {
			clearInterval(this.timer);
		}
		this.active = false;
	};

	/**
	 * Creates a new Navpopup.
	 * Gets a UID for the popup and
	 * @param init Contructor object. If <code>init.draggable</code> is true or absent, the popup becomes draggable.
	 * @constructor
	 * @class The Navpopup class. This generates popup hints, and does some management of them.
	 */
	function Navpopup(/*init*/) {
		//alert('new Navpopup(init)');

		/**
		 * UID for each Navpopup instance.
		 * Read-only.
		 * @type {number}
		 */
		this.uid = Navpopup.uid++;

		/**
		 * Read-only flag for current visibility of the popup.
		 * @type {boolean}
		 * @private
		 */
		this.visible = false;

		/** Flag to be set when we want to cancel a previous request to
		 * show the popup in a little while.
		 * @private
		 * @type {boolean}
		 */
		this.noshow = false;

		/** Categorised list of hooks.
		 * @see #runHooks
		 * @see #addHook
		 * @private
		 * @type {Object}
		 */
		this.hooks = {
			create: [],
			unhide: [],
			hide: [],
		};

		/**
		 * list of unique IDs of hook functions, to avoid duplicates
		 * @private
		 */
		this.hookIds = {};

		/** List of downloads associated with the popup.
		 * @private
		 * @type {Array}
		 */
		this.downloads = [];

		/**
		 * Number of uncompleted downloads.
		 * @type {number}
		 */
		this.pending = null;

		/**
		 * Tolerance in pixels when detecting whether the mouse has left the popup.
		 * @type {number}
		 */
		this.fuzz = 5;

		/**
		 * Flag to toggle running {@link #limitHorizontalPosition} to regulate the popup's position.
		 * @type {boolean}
		 */
		this.constrained = true;

		/**
		 * The popup width in pixels.
		 * @private
		 * @type {number}
		 */
		this.width = 0;

		/**
		 * The popup width in pixels.
		 * @private
		 * @type {number}
		 */
		this.height = 0;

		/**
		 * The main content DIV element.
		 * @type HTMLDivElement
		 */
		this.mainDiv = null;
		this.createMainDiv();

		//	if (!init || typeof init.popups_draggable=='undefined' || init.popups_draggable) {
		//		this.makeDraggable(true);
		//	}
	}

	/**
	 * A UID for each Navpopup. This constructor property is just a counter.
	 * @type {number}
	 * @private
	 */
	Navpopup.uid = 0;

	/**
	 * Retrieves the {@link #visible} attribute, indicating whether the popup is currently visible.
	 * @type {boolean}
	 */
	Navpopup.prototype.isVisible = function () {
		return this.visible;
	};

	/**
	 * Repositions popup using CSS style.
	 * @private
	 * @param {number} x x-coordinate (px)
	 * @param {number} y y-coordinate (px)
	 * @param {boolean} noLimitHor Don't call {@link #limitHorizontalPosition}
	 */
	Navpopup.prototype.reposition = function (x, y, noLimitHor) {
		log('reposition(' + x + ',' + y + ',' + noLimitHor + ')');
		if (typeof x != 'undefined' && x !== null) {
			this.left = x;
		}
		if (typeof y != 'undefined' && y !== null) {
			this.top = y;
		}
		if (typeof this.left != 'undefined' && typeof this.top != 'undefined') {
			this.mainDiv.style.left = this.left + 'px';
			this.mainDiv.style.top = this.top + 'px';
		}
		if (!noLimitHor) {
			this.limitHorizontalPosition();
		}
		//console.log('navpop'+this.uid+' - (left,top)=(' + this.left + ',' + this.top + '), css=('
		//+ this.mainDiv.style.left + ',' + this.mainDiv.style.top + ')');
	};

	/**
	 * Prevents popups from being in silly locations. Hopefully.
	 * Should not be run if {@link #constrained} is true.
	 * @private
	 */
	Navpopup.prototype.limitHorizontalPosition = function () {
		if (!this.constrained || this.tooWide) {
			return;
		}
		this.updateDimensions();
		var x = this.left;
		var w = this.width;
		var cWidth = document.body.clientWidth;

		//	log('limitHorizontalPosition: x='+x+
		//			', this.left=' + this.left +
		//			', this.width=' + this.width +
		//			', cWidth=' + cWidth);

		if (
			x + w >= cWidth ||
			(x > 0 &&
				this.maxWidth &&
				this.width < this.maxWidth &&
				this.height > this.width &&
				x > cWidth - this.maxWidth)
		) {
			// This is a very nasty hack. There has to be a better way!
			// We find the "natural" width of the div by positioning it at the far left
			// then reset it so that it should be flush right (well, nearly)
			this.mainDiv.style.left = '-10000px';
			this.mainDiv.style.width = this.maxWidth + 'px';
			var naturalWidth = parseInt(this.mainDiv.offsetWidth, 10);
			var newLeft = cWidth - naturalWidth - 1;
			if (newLeft < 0) {
				newLeft = 0;
				this.tooWide = true;
			} // still unstable for really wide popups?
			log(
				'limitHorizontalPosition: moving to (' +
					newLeft +
					',' +
					this.top +
					');' +
					' naturalWidth=' +
					naturalWidth +
					', clientWidth=' +
					cWidth
			);
			this.reposition(newLeft, null, true);
		}
	};

	/**
	 * Counter indicating the z-order of the "highest" popup.
	 * We start the z-index at 1000 so that popups are above everything
	 * else on the screen.
	 * @private
	 * @type {number}
	 */
	Navpopup.highest = 1000;

	/**
	 * Brings popup to the top of the z-order.
	 * We increment the {@link #highest} property of the contructor here.
	 * @private
	 */
	Navpopup.prototype.raise = function () {
		this.mainDiv.style.zIndex = Navpopup.highest + 1;
		++Navpopup.highest;
	};

	/**
	 * Shows the popup provided {@link #noshow} is not true.
	 * Updates the position, brings the popup to the top of the z-order and unhides it.
	 */
	Navpopup.prototype.show = function () {
		//document.title+='s';
		if (this.noshow) {
			return;
		}
		//document.title+='t';
		this.reposition();
		this.raise();
		this.unhide();
	};

	/**
	 * Checks to see if the mouse pointer has
	 * stabilised (checking every <code>time</code>/2 milliseconds) and runs the
	 * {@link #show} method if it has.
	 * @param {number} time The minimum time (ms) before the popup may be shown.
	 */
	Navpopup.prototype.showSoonIfStable = function (time) {
		log('showSoonIfStable, time=' + time);
		if (this.visible) {
			return;
		}
		this.noshow = false;

		//~ initialize these variables so that we never run @tt{show} after
		//~ just half the time
		this.stable_x = -10000;
		this.stable_y = -10000;

		var stableShow = function () {
			log('stableShow called');
			var new_x = Navpopup.tracker.x,
				new_y = Navpopup.tracker.y;
			var dx = savedThis.stable_x - new_x,
				dy = savedThis.stable_y - new_y;
			var fuzz2 = 0; // savedThis.fuzz * savedThis.fuzz;
			//document.title += '[' + [savedThis.stable_x,new_x, savedThis.stable_y,new_y, dx, dy, fuzz2].join(',') + '] ';
			if (dx * dx <= fuzz2 && dy * dy <= fuzz2) {
				log('mouse is stable');
				clearInterval(savedThis.showSoonStableTimer);
				savedThis.reposition.apply(savedThis, [new_x + 2, new_y + 2]);
				savedThis.show.apply(savedThis, []);
				savedThis.limitHorizontalPosition.apply(savedThis, []);
				return;
			}
			savedThis.stable_x = new_x;
			savedThis.stable_y = new_y;
		};
		var savedThis = this;
		this.showSoonStableTimer = setInterval(stableShow, time / 2);
	};

	/**
	 * Sets the {@link #noshow} flag and hides the popup. This should be called
	 * when the mouse leaves the link before
	 * (or after) it's actually been displayed.
	 */
	Navpopup.prototype.banish = function () {
		log('banish called');
		// hide and prevent showing with showSoon in the future
		this.noshow = true;
		if (this.showSoonStableTimer) {
			log('clearing showSoonStableTimer');
			clearInterval(this.showSoonStableTimer);
		}
		this.hide();
	};

	/**
	 * Runs hooks added with {@link #addHook}.
	 * @private
	 * @param {String} key Key name of the {@link #hooks} array - one of 'create', 'unhide', 'hide'
	 * @param {String} when Controls exactly when the hook is run: either 'before' or 'after'
	 */
	Navpopup.prototype.runHooks = function (key, when) {
		if (!this.hooks[key]) {
			return;
		}
		var keyHooks = this.hooks[key];
		var len = keyHooks.length;
		for (var i = 0; i < len; ++i) {
			if (keyHooks[i] && keyHooks[i].when == when) {
				if (keyHooks[i].hook.apply(this, [])) {
					// remove the hook
					if (keyHooks[i].hookId) {
						delete this.hookIds[keyHooks[i].hookId];
					}
					keyHooks[i] = null;
				}
			}
		}
	};

	/**
	 * Adds a hook to the popup. Hook functions are run with <code>this</code> set to refer to the
	 * Navpopup instance, and no arguments.
	 * @param {Function} hook The hook function. Functions that return true are deleted.
	 * @param {String} key Key name of the {@link #hooks} array - one of 'create', 'unhide', 'hide'
	 * @param {String} when Controls exactly when the hook is run: either 'before' or 'after'
	 * @param {String} uid A truthy string identifying the hook function; if it matches another hook
	 * in this position, it won't be added again.
	 */
	Navpopup.prototype.addHook = function (hook, key, when, uid) {
		when = when || 'after';
		if (!this.hooks[key]) {
			return;
		}
		// if uid is specified, don't add duplicates
		var hookId = null;
		if (uid) {
			hookId = [key, when, uid].join('|');
			if (this.hookIds[hookId]) {
				return;
			}
			this.hookIds[hookId] = true;
		}
		this.hooks[key].push({ hook: hook, when: when, hookId: hookId });
	};

	/**
	 * Creates the main DIV element, which contains all the actual popup content.
	 * Runs hooks with key 'create'.
	 * @private
	 */
	Navpopup.prototype.createMainDiv = function () {
		if (this.mainDiv) {
			return;
		}
		this.runHooks('create', 'before');
		var mainDiv = document.createElement('div');

		var savedThis = this;
		mainDiv.onclick = function (e) {
			savedThis.onclickHandler(e);
		};
		mainDiv.className = this.className ? this.className : 'navpopup_maindiv';
		mainDiv.id = mainDiv.className + this.uid;

		mainDiv.style.position = 'absolute';
		mainDiv.style.minWidth = '350px';
		mainDiv.style.display = 'none';
		mainDiv.className = 'navpopup';

		// easy access to javascript object through DOM functions
		mainDiv.navpopup = this;

		this.mainDiv = mainDiv;
		document.body.appendChild(mainDiv);
		this.runHooks('create', 'after');
	};

	/**
	 * Calls the {@link #raise} method.
	 * @private
	 */
	Navpopup.prototype.onclickHandler = function (/*e*/) {
		this.raise();
	};

	/**
	 * Makes the popup draggable, using a {@link Drag} object.
	 * @private
	 */
	Navpopup.prototype.makeDraggable = function (handleName) {
		if (!this.mainDiv) {
			this.createMainDiv();
		}
		var drag = new Drag();
		if (!handleName) {
			drag.startCondition = function (e) {
				try {
					if (!e.shiftKey) {
						return false;
					}
				} catch (err) {
					return false;
				}
				return true;
			};
		}
		var dragHandle;
		if (handleName) {
			dragHandle = document.getElementById(handleName);
		}
		if (!dragHandle) {
			dragHandle = this.mainDiv;
		}
		var np = this;
		drag.endHook = function (x, y) {
			Navpopup.tracker.dirty = true;
			np.reposition(x, y);
		};
		drag.init(dragHandle, this.mainDiv);
	};

	/**
	 * Hides the popup using CSS. Runs hooks with key 'hide'.
	 * Sets {@link #visible} appropriately.
	 * {@link #banish} should be called externally instead of this method.
	 * @private
	 */
	Navpopup.prototype.hide = function () {
		this.runHooks('hide', 'before');
		this.abortDownloads();
		if (typeof this.visible != 'undefined' && this.visible) {
			this.mainDiv.style.display = 'none';
			this.visible = false;
		}
		this.runHooks('hide', 'after');
	};

	/**
	 * Shows the popup using CSS. Runs hooks with key 'unhide'.
	 * Sets {@link #visible} appropriately.   {@link #show} should be called externally instead of this method.
	 * @private
	 */
	Navpopup.prototype.unhide = function () {
		this.runHooks('unhide', 'before');
		if (typeof this.visible != 'undefined' && !this.visible) {
			this.mainDiv.style.display = 'inline';
			this.visible = true;
		}
		this.runHooks('unhide', 'after');
	};

	/**
	 * Sets the <code>innerHTML</code> attribute of the main div containing the popup content.
	 * @param {String} html The HTML to set.
	 */
	Navpopup.prototype.setInnerHTML = function (html) {
		this.mainDiv.innerHTML = html;
	};

	/**
	 * Updates the {@link #width} and {@link #height} attributes with the CSS properties.
	 * @private
	 */
	Navpopup.prototype.updateDimensions = function () {
		this.width = parseInt(this.mainDiv.offsetWidth, 10);
		this.height = parseInt(this.mainDiv.offsetHeight, 10);
	};

	/**
	 * Checks if the point (x,y) is within {@link #fuzz} of the
	 * {@link #mainDiv}.
	 * @param {number} x x-coordinate (px)
	 * @param {number} y y-coordinate (px)
	 * @type {boolean}
	 */
	Navpopup.prototype.isWithin = function (x, y) {
		//~ If we're not even visible, no point should be considered as
		//~ being within the popup.
		if (!this.visible) {
			return false;
		}
		this.updateDimensions();
		var fuzz = this.fuzz || 0;
		//~ Use a simple box metric here.
		return (
			x + fuzz >= this.left &&
			x - fuzz <= this.left + this.width &&
			y + fuzz >= this.top &&
			y - fuzz <= this.top + this.height
		);
	};

	/**
	 * Adds a download to {@link #downloads}.
	 * @param {Downloader} download
	 */
	Navpopup.prototype.addDownload = function (download) {
		if (!download) {
			return;
		}
		this.downloads.push(download);
	};

	/**
	 * Aborts the downloads listed in {@link #downloads}.
	 * @see Downloader#abort
	 */
	Navpopup.prototype.abortDownloads = function () {
		for (var i = 0; i < this.downloads.length; ++i) {
			var d = this.downloads[i];
			if (d && d.abort) {
				d.abort();
			}
		}
		this.downloads = [];
	};

	/**
	 * A {@link Mousetracker} instance which is a property of the constructor (pseudo-global).
	 */
	Navpopup.tracker = new Mousetracker();
	// ENDFILE: navpopup.js

	// STARTFILE: diff.js
	/*
	 * Javascript Diff Algorithm
	 *  By John Resig (http://ejohn.org/) and [[:en:User:Lupin]]
	 *
	 * More Info:
	 *  http://ejohn.org/projects/javascript-diff-algorithm/
	 */

	function delFmt(x) {
		if (!x.length) {
			return '';
		}
		return "<del class='popupDiff'>" + x.join('') + '</del>';
	}

	function insFmt(x) {
		if (!x.length) {
			return '';
		}
		return "<ins class='popupDiff'>" + x.join('') + '</ins>';
	}

	function countCrossings(a, b, i, eject) {
		// count the crossings on the edge starting at b[i]
		if (!b[i].row && b[i].row !== 0) {
			return -1;
		}
		var count = 0;
		for (var j = 0; j < a.length; ++j) {
			if (!a[j].row && a[j].row !== 0) {
				continue;
			}
			if ((j - b[i].row) * (i - a[j].row) > 0) {
				if (eject) {
					return true;
				}
				count++;
			}
		}
		return count;
	}

	function shortenDiffString(str, context) {
		var re = RegExp('(<del[\\s\\S]*?</del>|<ins[\\s\\S]*?</ins>)');
		var splitted = str.parenSplit(re);
		var ret = [''];
		for (var i = 0; i < splitted.length; i += 2) {
			if (splitted[i].length < 2 * context) {
				ret[ret.length - 1] += splitted[i];
				if (i + 1 < splitted.length) {
					ret[ret.length - 1] += splitted[i + 1];
				}
				continue;
			} else {
				if (i > 0) {
					ret[ret.length - 1] += splitted[i].substring(0, context);
				}
				if (i + 1 < splitted.length) {
					ret.push(splitted[i].substring(splitted[i].length - context) + splitted[i + 1]);
				}
			}
		}
		while (ret.length > 0 && !ret[0]) {
			ret = ret.slice(1);
		}
		return ret;
	}

	function diffString(o, n, simpleSplit) {
		var splitRe = RegExp('([[]{2}|[\\]]{2}|[{]{2,3}|[}]{2,3}|[|]|=|<|>|[*:]+|\\s|\\b)');

		//  We need to split the strings o and n first, and entify() the parts
		//  individually, so that the HTML entities are never cut apart. (AxelBoldt)
		var out, i, oSplitted, nSplitted;
		if (simpleSplit) {
			oSplitted = o.split(/\b/);
			nSplitted = n.split(/\b/);
		} else {
			oSplitted = o.parenSplit(splitRe);
			nSplitted = n.parenSplit(splitRe);
		}
		for (i = 0; i < oSplitted.length; ++i) {
			oSplitted[i] = oSplitted[i].entify();
		}
		for (i = 0; i < nSplitted.length; ++i) {
			nSplitted[i] = nSplitted[i].entify();
		}

		out = diff(oSplitted, nSplitted);
		var str = '';
		var acc = []; // accumulator for prettier output

		// crossing pairings -- eg 'A B' vs 'B A' -- cause problems, so let's iron them out
		// this doesn't always do things optimally but it should be fast enough
		var maxOutputPair = 0;
		for (i = 0; i < out.n.length; ++i) {
			if (out.n[i].paired) {
				if (maxOutputPair > out.n[i].row) {
					// tangle - delete pairing
					out.o[out.n[i].row] = out.o[out.n[i].row].text;
					out.n[i] = out.n[i].text;
				}
				if (maxOutputPair < out.n[i].row) {
					maxOutputPair = out.n[i].row;
				}
			}
		}

		// output the stuff preceding the first paired old line
		for (i = 0; i < out.o.length && !out.o[i].paired; ++i) {
			acc.push(out.o[i]);
		}
		str += delFmt(acc);
		acc = [];

		// main loop
		for (i = 0; i < out.n.length; ++i) {
			// output unpaired new "lines"
			while (i < out.n.length && !out.n[i].paired) {
				acc.push(out.n[i++]);
			}
			str += insFmt(acc);
			acc = [];
			if (i < out.n.length) {
				// this new "line" is paired with the (out.n[i].row)th old "line"
				str += out.n[i].text;
				// output unpaired old rows starting after this new line's partner
				var m = out.n[i].row + 1;
				while (m < out.o.length && !out.o[m].paired) {
					acc.push(out.o[m++]);
				}
				str += delFmt(acc);
				acc = [];
			}
		}
		return str;
	}

	// see http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Object
	// FIXME: use obj.hasOwnProperty instead of this kludge!
	var jsReservedProperties = RegExp(
		'^(constructor|prototype|__((define|lookup)[GS]etter)__' +
			'|eval|hasOwnProperty|propertyIsEnumerable' +
			'|to(Source|String|LocaleString)|(un)?watch|valueOf)$'
	);

	function diffBugAlert(word) {
		if (!diffBugAlert.list[word]) {
			diffBugAlert.list[word] = 1;
			alert('Bad word: ' + word + '\n\nPlease report this bug.');
		}
	}

	diffBugAlert.list = {};

	function makeDiffHashtable(src) {
		var ret = {};
		for (var i = 0; i < src.length; i++) {
			if (jsReservedProperties.test(src[i])) {
				src[i] += '<!-- -->';
			}
			if (!ret[src[i]]) {
				ret[src[i]] = [];
			}
			try {
				ret[src[i]].push(i);
			} catch (err) {
				diffBugAlert(src[i]);
			}
		}
		return ret;
	}

	function diff(o, n) {
		// pass 1: make hashtable ns with new rows as keys
		var ns = makeDiffHashtable(n);

		// pass 2: make hashtable os with old rows as keys
		var os = makeDiffHashtable(o);

		// pass 3: pair unique new rows and matching unique old rows
		var i;
		for (i in ns) {
			if (ns[i].length == 1 && os[i] && os[i].length == 1) {
				n[ns[i][0]] = { text: n[ns[i][0]], row: os[i][0], paired: true };
				o[os[i][0]] = { text: o[os[i][0]], row: ns[i][0], paired: true };
			}
		}

		// pass 4: pair matching rows immediately following paired rows (not necessarily unique)
		for (i = 0; i < n.length - 1; i++) {
			if (
				n[i].paired &&
				!n[i + 1].paired &&
				n[i].row + 1 < o.length &&
				!o[n[i].row + 1].paired &&
				n[i + 1] == o[n[i].row + 1]
			) {
				n[i + 1] = { text: n[i + 1], row: n[i].row + 1, paired: true };
				o[n[i].row + 1] = { text: o[n[i].row + 1], row: i + 1, paired: true };
			}
		}

		// pass 5: pair matching rows immediately preceding paired rows (not necessarily unique)
		for (i = n.length - 1; i > 0; i--) {
			if (
				n[i].paired &&
				!n[i - 1].paired &&
				n[i].row > 0 &&
				!o[n[i].row - 1].paired &&
				n[i - 1] == o[n[i].row - 1]
			) {
				n[i - 1] = { text: n[i - 1], row: n[i].row - 1, paired: true };
				o[n[i].row - 1] = { text: o[n[i].row - 1], row: i - 1, paired: true };
			}
		}

		return { o: o, n: n };
	}
	// ENDFILE: diff.js

	// STARTFILE: init.js
	function setSiteInfo() {
		if (window.popupLocalDebug) {
			pg.wiki.hostname = 'en.wikipedia.org';
		} else {
			pg.wiki.hostname = location.hostname; // use in preference to location.hostname for flexibility (?)
		}
		pg.wiki.wikimedia = RegExp(
			'(wiki([pm]edia|source|books|news|quote|versity|species|voyage|data)|metawiki|wiktionary|mediawiki)[.]org'
		).test(pg.wiki.hostname);
		pg.wiki.wikia = RegExp('[.]wikia[.]com$', 'i').test(pg.wiki.hostname);
		pg.wiki.isLocal = RegExp('^localhost').test(pg.wiki.hostname);
		pg.wiki.commons =
			pg.wiki.wikimedia && pg.wiki.hostname != 'commons.wikimedia.org'
				? 'commons.wikimedia.org'
				: null;
		pg.wiki.lang = mw.config.get('wgContentLanguage');
		var port = location.port ? ':' + location.port : '';
		pg.wiki.sitebase = pg.wiki.hostname + port;
	}

	function setUserInfo() {
		var params = {
			action: 'query',
			list: 'users',
			ususers: mw.config.get('wgUserName'),
			usprop: 'rights',
		};

		pg.user.canReview = false;
		if (getValueOf('popupReview')) {
			getMwApi()
				.get(params)
				.done(function (data) {
					var rights = data.query.users[0].rights;
					pg.user.canReview = rights.indexOf('review') !== -1; // TODO: Should it be a getValueOf('ReviewRight') ?
				});
		}
	}

	function fetchSpecialPageNames() {
		var params = {
			action: 'query',
			meta: 'siteinfo',
			siprop: 'specialpagealiases',
			formatversion: 2,
			// cache for an hour
			uselang: 'content',
			maxage: 3600,
		};
		return getMwApi()
			.get(params)
			.then(function (data) {
				pg.wiki.specialpagealiases = data.query.specialpagealiases;
			});
	}

	function setTitleBase() {
		var protocol = window.popupLocalDebug ? 'http:' : location.protocol;
		pg.wiki.articlePath = mw.config.get('wgArticlePath').replace(/\/\$1/, ''); // as in http://some.thing.com/wiki/Article
		pg.wiki.botInterfacePath = mw.config.get('wgScript');
		pg.wiki.APIPath = mw.config.get('wgScriptPath') + '/api.php';
		// default mediawiki setting is paths like http://some.thing.com/articlePath/index.php?title=foo

		var titletail = pg.wiki.botInterfacePath + '?title=';
		//var titletail2 = joinPath([pg.wiki.botInterfacePath, 'wiki.phtml?title=']);

		// other sites may need to add code here to set titletail depending on how their urls work

		pg.wiki.titlebase = protocol + '//' + pg.wiki.sitebase + titletail;
		//pg.wiki.titlebase2  = protocol + '//' + joinPath([pg.wiki.sitebase, titletail2]);
		pg.wiki.wikibase = protocol + '//' + pg.wiki.sitebase + pg.wiki.botInterfacePath;
		pg.wiki.apiwikibase = protocol + '//' + pg.wiki.sitebase + pg.wiki.APIPath;
		pg.wiki.articlebase = protocol + '//' + pg.wiki.sitebase + pg.wiki.articlePath;
		pg.wiki.commonsbase = protocol + '//' + pg.wiki.commons + pg.wiki.botInterfacePath;
		pg.wiki.apicommonsbase = protocol + '//' + pg.wiki.commons + pg.wiki.APIPath;
		pg.re.basenames = RegExp(
			'^(' +
				map(literalizeRegex, [
					pg.wiki.titlebase, //pg.wiki.titlebase2,
					pg.wiki.articlebase,
				]).join('|') +
				')'
		);
	}

	//////////////////////////////////////////////////
	// Global regexps

	function setMainRegex() {
		var reStart = '[^:]*://';
		var preTitles =
			literalizeRegex(mw.config.get('wgScriptPath')) + '/(?:index[.]php|wiki[.]phtml)[?]title=';
		preTitles += '|' + literalizeRegex(pg.wiki.articlePath + '/');

		var reEnd = '(' + preTitles + ')([^&?#]*)[^#]*(?:#(.+))?';
		pg.re.main = RegExp(reStart + literalizeRegex(pg.wiki.sitebase) + reEnd);
	}

	function buildSpecialPageGroup(specialPageObj) {
		var variants = [];
		variants.push(mw.util.escapeRegExp(specialPageObj['realname']));
		variants.push(mw.util.escapeRegExp(encodeURI(specialPageObj['realname'])));
		specialPageObj.aliases.forEach(function (alias) {
			variants.push(mw.util.escapeRegExp(alias));
			variants.push(mw.util.escapeRegExp(encodeURI(alias)));
		});
		return variants.join('|');
	}

	function setRegexps() {
		setMainRegex();
		var sp = nsRe(pg.nsSpecialId);
		pg.re.urlNoPopup = RegExp('((title=|/)' + sp + '(?:%3A|:)|section=[0-9]|^#$)');

		pg.wiki.specialpagealiases.forEach(function (specialpage) {
			if (specialpage.realname === 'Contributions') {
				pg.re.contribs = RegExp(
					'(title=|/)' +
						sp +
						'(?:%3A|:)(?:' +
						buildSpecialPageGroup(specialpage) +
						')' +
						'(&target=|/|/' +
						nsRe(pg.nsUserId) +
						':)(.*)',
					'i'
				);
			} else if (specialpage.realname === 'Diff') {
				pg.re.specialdiff = RegExp(
					'/' + sp + '(?:%3A|:)(?:' + buildSpecialPageGroup(specialpage) + ')' + '/([^?#]*)',
					'i'
				);
			} else if (specialpage.realname === 'Emailuser') {
				pg.re.email = RegExp(
					'(title=|/)' +
						sp +
						'(?:%3A|:)(?:' +
						buildSpecialPageGroup(specialpage) +
						')' +
						'(&target=|/|/(?:' +
						nsRe(pg.nsUserId) +
						':)?)(.*)',
					'i'
				);
			} else if (specialpage.realname === 'Whatlinkshere') {
				pg.re.backlinks = RegExp(
					'(title=|/)' +
						sp +
						'(?:%3A|:)(?:' +
						buildSpecialPageGroup(specialpage) +
						')' +
						'(&target=|/)([^&]*)',
					'i'
				);
			}
		});

		var im = nsReImage();
		// note: tries to get images in infobox templates too, e.g. movie pages, album pages etc
		//					  (^|\[\[)image: *([^|\]]*[^|\] ]) *
		//					  (^|\[\[)image: *([^|\]]*[^|\] ])([^0-9\]]*([0-9]+) *px)?
		//														$4 = 120 as in 120px
		pg.re.image = RegExp(
			'(^|\\[\\[)' +
				im +
				': *([^|\\]]*[^|\\] ])' +
				'([^0-9\\]]*([0-9]+) *px)?|(?:\\n *[|]?|[|]) *' +
				'(' +
				getValueOf('popupImageVarsRegexp') +
				')' +
				' *= *(?:\\[\\[ *)?(?:' +
				im +
				':)?' +
				'([^|]*?)(?:\\]\\])? *[|]? *\\n',
			'img'
		);
		pg.re.imageBracketCount = 6;

		pg.re.category = RegExp('\\[\\[' + nsRe(pg.nsCategoryId) + ': *([^|\\]]*[^|\\] ]) *', 'i');
		pg.re.categoryBracketCount = 1;

		pg.re.ipUser = RegExp(
			'^' +
				// IPv6
				'(?::(?::|(?::[0-9A-Fa-f]{1,4}){1,7})|[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4}){0,6}::|[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4}){7})' +
				// IPv4
				'|(((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}' +
				'(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9]))$'
		);

		pg.re.stub = RegExp(getValueOf('popupStubRegexp'), 'im');
		pg.re.disambig = RegExp(getValueOf('popupDabRegexp'), 'im');

		// FIXME replace with general parameter parsing function, this is daft
		pg.re.oldid = RegExp('[?&]oldid=([^&]*)');
		pg.re.diff = RegExp('[?&]diff=([^&]*)');
	}

	//////////////////////////////////////////////////
	// miscellany

	function setupCache() {
		// page caching
		pg.cache.pages = [];
	}

	function setMisc() {
		pg.current.link = null;
		pg.current.links = [];
		pg.current.linksHash = {};

		setupCache();

		pg.timer.checkPopupPosition = null;
		pg.counter.loop = 0;

		// ids change with each popup: popupImage0, popupImage1 etc
		pg.idNumber = 0;

		// for myDecodeURI
		pg.misc.decodeExtras = [
			{ from: '%2C', to: ',' },
			{ from: '_', to: ' ' },
			{ from: '%24', to: '$' },
			{ from: '%26', to: '&' }, // no ,
		];
	}

	function getMwApi() {
		if (!pg.api.client) {
			pg.api.userAgent = 'Navigation popups/1.0 (' + mw.config.get('wgServerName') + ')';
			pg.api.client = new mw.Api({
				ajax: {
					headers: {
						'Api-User-Agent': pg.api.userAgent,
					},
				},
			});
		}
		return pg.api.client;
	}

	// We need a callback since this might end up asynchronous because of
	// the mw.loader.using() call.
	function setupPopups(callback) {
		if (setupPopups.completed) {
			if (typeof callback === 'function') {
				callback();
			}
			return;
		}
		// These dependencies should alse be enforced from the gadget,
		// but not everyone loads this as a gadget, so double check
		mw.loader
			.using([
				'mediawiki.util',
				'mediawiki.api',
				'mediawiki.user',
				'user.options',
				'mediawiki.jqueryMsg',
			])
			.then(fetchSpecialPageNames)
			.then(function () {
				// NB translatable strings should be set up first (strings.js)
				// basics
				setupDebugging();
				setSiteInfo();
				setTitleBase();
				setOptions(); // see options.js
				setUserInfo();

				// namespaces etc
				setNamespaces();
				setInterwiki();

				// regexps
				setRegexps();
				setRedirs();

				// other stuff
				setMisc();
				setupLivePreview();

				// main deal here
				setupTooltips();
				log('In setupPopups(), just called setupTooltips()');
				Navpopup.tracker.enable();

				setupPopups.completed = true;
				if (typeof callback === 'function') {
					callback();
				}
			});
	}
	// ENDFILE: init.js

	// STARTFILE: navlinks.js
	//////////////////////////////////////////////////
	// navlinks... let the fun begin
	//

	function defaultNavlinkSpec() {
		var str = '';
		str += '<b><<mainlink|shortcut= >></b>';
		if (getValueOf('popupLastEditLink')) {
			str +=
				'*<<lastEdit|shortcut=/>>|<<lastContrib>>|<<sinceMe>>if(oldid){|<<oldEdit>>|<<diffCur>>}';
		}

		// user links
		// contribs - log - count - email - block
		// count only if applicable; block only if popupAdminLinks
		str += 'if(user){<br><<contribs|shortcut=c>>*<<userlog|shortcut=L|log>>';
		str += 'if(ipuser){*<<arin>>}if(wikimedia){*<<count|shortcut=#>>}';
		str +=
			'if(ipuser){}else{*<<email|shortcut=E>>}if(admin){*<<block|shortcut=b>>|<<blocklog|log>>}}';

		// editing links
		// talkpage   -> edit|new - history - un|watch - article|edit
		// other page -> edit - history - un|watch - talk|edit|new
		var editstr = '<<edit|shortcut=e>>';
		var editOldidStr =
			'if(oldid){<<editOld|shortcut=e>>|<<revert|shortcut=v|rv>>|<<edit|cur>>}else{' +
			editstr +
			'}';
		var historystr = '<<history|shortcut=h>>|<<editors|shortcut=E|>>';
		var watchstr = '<<unwatch|unwatchShort>>|<<watch|shortcut=w|watchThingy>>';

		str +=
			'<br>if(talk){' +
			editOldidStr +
			'|<<new|shortcut=+>>' +
			'*' +
			historystr +
			'*' +
			watchstr +
			'*' +
			'<b><<article|shortcut=a>></b>|<<editArticle|edit>>' +
			'}else{' + // not a talk page
			editOldidStr +
			'*' +
			historystr +
			'*' +
			watchstr +
			'*' +
			'<b><<talk|shortcut=t>></b>|<<editTalk|edit>>|<<newTalk|shortcut=+|new>>}';

		// misc links
		str += '<br><<whatLinksHere|shortcut=l>>*<<relatedChanges|shortcut=r>>*<<move|shortcut=m>>';

		// admin links
		str +=
			'if(admin){<br><<unprotect|unprotectShort>>|<<protect|shortcut=p>>|<<protectlog|log>>*' +
			'<<undelete|undeleteShort>>|<<delete|shortcut=d>>|<<deletelog|log>>}';
		return str;
	}

	function navLinksHTML(article, hint, params) {
		//oldid, rcid) {
		var str = '<span class="popupNavLinks">' + defaultNavlinkSpec() + '</span>';
		// BAM
		return navlinkStringToHTML(str, article, params);
	}

	function expandConditionalNavlinkString(s, article, z, recursionCount) {
		var oldid = z.oldid,
			rcid = z.rcid,
			diff = z.diff;
		// nested conditionals (up to 10 deep) are ok, hopefully! (work from the inside out)
		if (typeof recursionCount != typeof 0) {
			recursionCount = 0;
		}
		var conditionalSplitRegex = RegExp(
			//(1	 if	\\(	(2	2)	\\)	  {(3	3)}  (4   else	  {(5	 5)}  4)1)
			'(;?\\s*if\\s*\\(\\s*([\\w]*)\\s*\\)\\s*\\{([^{}]*)\\}(\\s*else\\s*\\{([^{}]*?)\\}|))',
			'i'
		);
		var splitted = s.parenSplit(conditionalSplitRegex);
		// $1: whole conditional
		// $2: test condition
		// $3: true expansion
		// $4: else clause (possibly empty)
		// $5: false expansion (possibly null)
		var numParens = 5;
		var ret = splitted[0];
		for (var i = 1; i < splitted.length; i = i + numParens + 1) {
			var testString = splitted[i + 2 - 1];
			var trueString = splitted[i + 3 - 1];
			var falseString = splitted[i + 5 - 1];
			if (typeof falseString == 'undefined' || !falseString) {
				falseString = '';
			}
			var testResult = null;

			switch (testString) {
				case 'user':
					testResult = !!article.userName();
					break;
				case 'talk':
					testResult = !article.talkPage(); // talkPage converts _articles_ to talkPages
					break;
				case 'admin':
					testResult = !!getValueOf('popupAdminLinks');
					break;
				case 'oldid':
					testResult = !!(typeof oldid != 'undefined' && oldid);
					break;
				case 'rcid':
					testResult = !!(typeof rcid != 'undefined' && rcid);
					break;
				case 'ipuser':
					testResult = !!article.isIpUser();
					break;
				case 'mainspace_en':
					testResult = isInMainNamespace(article) && pg.wiki.hostname == 'en.wikipedia.org';
					break;
				case 'wikimedia':
					testResult = !!pg.wiki.wikimedia;
					break;
				case 'diff':
					testResult = !!(typeof diff != 'undefined' && diff);
					break;
			}

			switch (testResult) {
				case null:
					ret += splitted[i];
					break;
				case true:
					ret += trueString;
					break;
				case false:
					ret += falseString;
					break;
			}

			// append non-conditional string
			ret += splitted[i + numParens];
		}
		if (conditionalSplitRegex.test(ret) && recursionCount < 10) {
			return expandConditionalNavlinkString(ret, article, z, recursionCount + 1);
		}
		return ret;
	}

	function navlinkStringToArray(s, article, params) {
		s = expandConditionalNavlinkString(s, article, params);
		var splitted = s.parenSplit(RegExp('<<(.*?)>>'));
		var ret = [];
		for (var i = 0; i < splitted.length; ++i) {
			if (i % 2) {
				// i odd, so s is a tag
				var t = new navlinkTag();
				var ss = splitted[i].split('|');
				t.id = ss[0];
				for (var j = 1; j < ss.length; ++j) {
					var sss = ss[j].split('=');
					if (sss.length > 1) {
						t[sss[0]] = sss[1];
					} else {
						// no assignment (no "="), so treat this as a title (overwriting the last one)
						t.text = popupString(sss[0]);
					}
				}
				t.article = article;
				var oldid = params.oldid,
					rcid = params.rcid,
					diff = params.diff;
				if (typeof oldid !== 'undefined' && oldid !== null) {
					t.oldid = oldid;
				}
				if (typeof rcid !== 'undefined' && rcid !== null) {
					t.rcid = rcid;
				}
				if (typeof diff !== 'undefined' && diff !== null) {
					t.diff = diff;
				}
				if (!t.text && t.id !== 'mainlink') {
					t.text = popupString(t.id);
				}
				ret.push(t);
			} else {
				// plain HTML
				ret.push(splitted[i]);
			}
		}
		return ret;
	}

	function navlinkSubstituteHTML(s) {
		return s
			.split('*')
			.join(getValueOf('popupNavLinkSeparator'))
			.split('<menurow>')
			.join('<li class="popup_menu_row">')
			.split('</menurow>')
			.join('</li>')
			.split('<menu>')
			.join('<ul class="popup_menu">')
			.split('</menu>')
			.join('</ul>');
	}

	function navlinkDepth(magic, s) {
		return s.split('<' + magic + '>').length - s.split('</' + magic + '>').length;
	}

	// navlinkString: * becomes the separator
	//				<<foo|bar=baz|fubar>> becomes a foo-link with attribute bar='baz'
	//									  and visible text 'fubar'
	//				if(test){...} and if(test){...}else{...} work too (nested ok)

	function navlinkStringToHTML(s, article, params) {
		//limitAlert(navlinkStringToHTML, 5, 'navlinkStringToHTML\n' + article + '\n' + (typeof article));
		var p = navlinkStringToArray(s, article, params);
		var html = '';
		var menudepth = 0; // nested menus not currently allowed, but doesn't do any harm to code for it
		var menurowdepth = 0;
		for (var i = 0; i < p.length; ++i) {
			if (typeof p[i] == typeof '') {
				html += navlinkSubstituteHTML(p[i]);
				menudepth += navlinkDepth('menu', p[i]);
				menurowdepth += navlinkDepth('menurow', p[i]);
				//			if (menudepth === 0) {
				//				tagType='span';
				//			} else if (menurowdepth === 0) {
				//				tagType='li';
				//			} else {
				//				tagType = null;
				//			}
			} else if (typeof p[i].type != 'undefined' && p[i].type == 'navlinkTag') {
				if (menudepth > 0 && menurowdepth === 0) {
					html += '<li class="popup_menu_item">' + p[i].html() + '</li>';
				} else {
					html += p[i].html();
				}
			}
		}
		return html;
	}

	function navlinkTag() {
		this.type = 'navlinkTag';
	}

	navlinkTag.prototype.html = function () {
		this.getNewWin();
		this.getPrintFunction();
		var html = '';
		var opening, closing;
		var tagType = 'span';
		if (!tagType) {
			opening = '';
			closing = '';
		} else {
			opening = '<' + tagType + ' class="popup_' + this.id + '">';
			closing = '</' + tagType + '>';
		}
		if (typeof this.print != 'function') {
			errlog('Oh dear - invalid print function for a navlinkTag, id=' + this.id);
		} else {
			html = this.print(this);
			if (typeof html != typeof '') {
				html = '';
			} else if (typeof this.shortcut != 'undefined') {
				html = addPopupShortcut(html, this.shortcut);
			}
		}
		return opening + html + closing;
	};

	navlinkTag.prototype.getNewWin = function () {
		getValueOf('popupLinksNewWindow');
		if (typeof pg.option.popupLinksNewWindow[this.id] === 'undefined') {
			this.newWin = null;
		}
		this.newWin = pg.option.popupLinksNewWindow[this.id];
	};

	navlinkTag.prototype.getPrintFunction = function () {
		//think about this some more
		// this.id and this.article should already be defined
		if (typeof this.id != typeof '' || typeof this.article != typeof {}) {
			return;
		}

		this.noPopup = 1;
		switch (this.id) {
			case 'contribs':
			case 'history':
			case 'whatLinksHere':
			case 'userPage':
			case 'monobook':
			case 'userTalk':
			case 'talk':
			case 'article':
			case 'lastEdit':
				this.noPopup = null;
		}
		switch (this.id) {
			case 'email':
			case 'contribs':
			case 'block':
			case 'unblock':
			case 'userlog':
			case 'userSpace':
			case 'deletedContribs':
				this.article = this.article.userName();
		}

		switch (this.id) {
			case 'userTalk':
			case 'newUserTalk':
			case 'editUserTalk':
			case 'userPage':
			case 'monobook':
			case 'editMonobook':
			case 'blocklog':
				this.article = this.article.userName(true);
			/* fall through */
			case 'pagelog':
			case 'deletelog':
			case 'protectlog':
				delete this.oldid;
		}

		if (this.id == 'editMonobook' || this.id == 'monobook') {
			this.article.append('/monobook.js');
		}

		if (this.id != 'mainlink') {
			// FIXME anchor handling should be done differently with Title object
			this.article = this.article.removeAnchor();
			// if (typeof this.text=='undefined') this.text=popupString(this.id);
		}

		switch (this.id) {
			case 'undelete':
				this.print = specialLink;
				this.specialpage = 'Undelete';
				this.sep = '/';
				break;
			case 'whatLinksHere':
				this.print = specialLink;
				this.specialpage = 'Whatlinkshere';
				break;
			case 'relatedChanges':
				this.print = specialLink;
				this.specialpage = 'Recentchangeslinked';
				break;
			case 'move':
				this.print = specialLink;
				this.specialpage = 'Movepage';
				break;
			case 'contribs':
				this.print = specialLink;
				this.specialpage = 'Contributions';
				break;
			case 'deletedContribs':
				this.print = specialLink;
				this.specialpage = 'Deletedcontributions';
				break;
			case 'email':
				this.print = specialLink;
				this.specialpage = 'EmailUser';
				this.sep = '/';
				break;
			case 'block':
				this.print = specialLink;
				this.specialpage = 'Blockip';
				this.sep = '&ip=';
				break;
			case 'unblock':
				this.print = specialLink;
				this.specialpage = 'Ipblocklist';
				this.sep = '&action=unblock&ip=';
				break;
			case 'userlog':
				this.print = specialLink;
				this.specialpage = 'Log';
				this.sep = '&user=';
				break;
			case 'blocklog':
				this.print = specialLink;
				this.specialpage = 'Log';
				this.sep = '&type=block&page=';
				break;
			case 'pagelog':
				this.print = specialLink;
				this.specialpage = 'Log';
				this.sep = '&page=';
				break;
			case 'protectlog':
				this.print = specialLink;
				this.specialpage = 'Log';
				this.sep = '&type=protect&page=';
				break;
			case 'deletelog':
				this.print = specialLink;
				this.specialpage = 'Log';
				this.sep = '&type=delete&page=';
				break;
			case 'userSpace':
				this.print = specialLink;
				this.specialpage = 'PrefixIndex';
				this.sep = '&namespace=2&prefix=';
				break;
			case 'search':
				this.print = specialLink;
				this.specialpage = 'Search';
				this.sep = '&fulltext=Search&search=';
				break;
			case 'thank':
				this.print = specialLink;
				this.specialpage = 'Thanks';
				this.sep = '/';
				this.article.value = this.diff !== 'prev' ? this.diff : this.oldid;
				break;
			case 'unwatch':
			case 'watch':
				this.print = magicWatchLink;
				this.action =
					this.id +
					'&autowatchlist=1&autoimpl=' +
					popupString('autoedit_version') +
					'&actoken=' +
					autoClickToken();
				break;
			case 'history':
			case 'historyfeed':
			case 'unprotect':
			case 'protect':
				this.print = wikiLink;
				this.action = this.id;
				break;

			case 'delete':
				this.print = wikiLink;
				this.action = 'delete';
				if (this.article.namespaceId() == pg.nsImageId) {
					var img = this.article.stripNamespace();
					this.action += '&image=' + img;
				}
				break;

			case 'markpatrolled':
			case 'edit': // editOld should keep the oldid, but edit should not.
				delete this.oldid;
			/* fall through */
			case 'view':
			case 'purge':
			case 'render':
				this.print = wikiLink;
				this.action = this.id;
				break;
			case 'raw':
				this.print = wikiLink;
				this.action = 'raw';
				break;
			case 'new':
				this.print = wikiLink;
				this.action = 'edit&section=new';
				break;
			case 'mainlink':
				if (typeof this.text == 'undefined') {
					this.text = this.article.toString().entify();
				}
				if (getValueOf('popupSimplifyMainLink') && isInStrippableNamespace(this.article)) {
					// only show the /subpage part of the title text
					var s = this.text.split('/');
					this.text = s[s.length - 1];
					if (this.text === '' && s.length > 1) {
						this.text = s[s.length - 2];
					}
				}
				this.print = titledWikiLink;
				if (
					typeof this.title === 'undefined' &&
					pg.current.link &&
					typeof pg.current.link.href !== 'undefined'
				) {
					this.title = safeDecodeURI(
						pg.current.link.originalTitle ? pg.current.link.originalTitle : this.article
					);
					if (typeof this.oldid !== 'undefined' && this.oldid) {
						this.title = tprintf('Revision %s of %s', [this.oldid, this.title]);
					}
				}
				this.action = 'view';
				break;
			case 'userPage':
			case 'article':
			case 'monobook':
			case 'editMonobook':
			case 'editArticle':
				delete this.oldid;
				//alert(this.id+'\n'+this.article + '\n'+ typeof this.article);
				this.article = this.article.articleFromTalkOrArticle();
				//alert(this.id+'\n'+this.article + '\n'+ typeof this.article);
				this.print = wikiLink;
				if (this.id.indexOf('edit') === 0) {
					this.action = 'edit';
				} else {
					this.action = 'view';
				}
				break;
			case 'userTalk':
			case 'talk':
				this.article = this.article.talkPage();
				delete this.oldid;
				this.print = wikiLink;
				this.action = 'view';
				break;
			case 'arin':
				this.print = arinLink;
				break;
			case 'count':
				this.print = editCounterLink;
				break;
			case 'google':
				this.print = googleLink;
				break;
			case 'editors':
				this.print = editorListLink;
				break;
			case 'globalsearch':
				this.print = globalSearchLink;
				break;
			case 'lastEdit':
				this.print = titledDiffLink;
				this.title = popupString('Show the last edit');
				this.from = 'prev';
				this.to = 'cur';
				break;
			case 'oldEdit':
				this.print = titledDiffLink;
				this.title = popupString('Show the edit made to get revision') + ' ' + this.oldid;
				this.from = 'prev';
				this.to = this.oldid;
				break;
			case 'editOld':
				this.print = wikiLink;
				this.action = 'edit';
				break;
			case 'undo':
				this.print = wikiLink;
				this.action = 'edit&undo=';
				break;
			case 'revert':
				this.print = wikiLink;
				this.action = 'revert';
				break;
			case 'nullEdit':
				this.print = wikiLink;
				this.action = 'nullEdit';
				break;
			case 'diffCur':
				this.print = titledDiffLink;
				this.title = tprintf('Show changes since revision %s', [this.oldid]);
				this.from = this.oldid;
				this.to = 'cur';
				break;
			case 'editUserTalk':
			case 'editTalk':
				delete this.oldid;
				this.article = this.article.talkPage();
				this.action = 'edit';
				this.print = wikiLink;
				break;
			case 'newUserTalk':
			case 'newTalk':
				this.article = this.article.talkPage();
				this.action = 'edit&section=new';
				this.print = wikiLink;
				break;
			case 'lastContrib':
			case 'sinceMe':
				this.print = magicHistoryLink;
				break;
			case 'togglePreviews':
				this.text = popupString(pg.option.simplePopups ? 'enable previews' : 'disable previews');
			/* fall through */
			case 'disablePopups':
			case 'purgePopups':
				this.print = popupMenuLink;
				break;
			default:
				this.print = function () {
					return 'Unknown navlink type: ' + String(this.id);
				};
		}
	};
	//
	//  end navlinks
	//////////////////////////////////////////////////
	// ENDFILE: navlinks.js

	// STARTFILE: shortcutkeys.js
	function popupHandleKeypress(evt) {
		var keyCode = window.event ? window.event.keyCode : evt.keyCode ? evt.keyCode : evt.which;
		if (!keyCode || !pg.current.link || !pg.current.link.navpopup) {
			return;
		}
		if (keyCode == 27) {
			// escape
			killPopup();
			return false; // swallow keypress
		}

		var letter = String.fromCharCode(keyCode);
		var links = pg.current.link.navpopup.mainDiv.getElementsByTagName('A');
		var startLink = 0;
		var i, j;

		if (popupHandleKeypress.lastPopupLinkSelected) {
			for (i = 0; i < links.length; ++i) {
				if (links[i] == popupHandleKeypress.lastPopupLinkSelected) {
					startLink = i;
				}
			}
		}
		for (j = 0; j < links.length; ++j) {
			i = (startLink + j + 1) % links.length;
			if (links[i].getAttribute('popupkey') == letter) {
				if (evt && evt.preventDefault) {
					evt.preventDefault();
				}
				links[i].focus();
				popupHandleKeypress.lastPopupLinkSelected = links[i];
				return false; // swallow keypress
			}
		}

		// pass keypress on
		if (document.oldPopupOnkeypress) {
			return document.oldPopupOnkeypress(evt);
		}
		return true;
	}

	function addPopupShortcuts() {
		if (document.onkeypress != popupHandleKeypress) {
			document.oldPopupOnkeypress = document.onkeypress;
		}
		document.onkeypress = popupHandleKeypress;
	}

	function rmPopupShortcuts() {
		popupHandleKeypress.lastPopupLinkSelected = null;
		try {
			if (document.oldPopupOnkeypress && document.oldPopupOnkeypress == popupHandleKeypress) {
				// panic
				document.onkeypress = null; //function () {};
				return;
			}
			document.onkeypress = document.oldPopupOnkeypress;
		} catch (nasties) {
			/* IE goes here */
		}
	}

	function addLinkProperty(html, property) {
		// take "<a href=...>...</a> and add a property
		// not sophisticated at all, easily broken
		var i = html.indexOf('>');
		if (i < 0) {
			return html;
		}
		return html.substring(0, i) + ' ' + property + html.substring(i);
	}

	function addPopupShortcut(html, key) {
		if (!getValueOf('popupShortcutKeys')) {
			return html;
		}
		var ret = addLinkProperty(html, 'popupkey="' + key + '"');
		if (key == ' ') {
			key = popupString('spacebar');
		}
		return ret.replace(RegExp('^(.*?)(title=")(.*?)(".*)$', 'i'), '$1$2$3 [' + key + ']$4');
	}
	// ENDFILE: shortcutkeys.js

	// STARTFILE: diffpreview.js
	/**
	 * Load diff data.
	 *
	 * lets jump through hoops to find the rev ids we need to retrieve
	 *
	 * @param {Title} article
	 * @param {String} oldid
	 * @param {String} diff
	 * @param {Navpopup} navpop
	 */
	function loadDiff(article, oldid, diff, navpop) {
		navpop.diffData = { oldRev: {}, newRev: {} };
		mw.loader.using('mediawiki.api').then(function () {
			var api = getMwApi();
			var params = {
				action: 'compare',
				prop: 'ids|title',
			};
			params.fromtitle = article.toString();

			switch (diff) {
				case 'cur':
					switch (oldid) {
						case null:
						case '':
						case 'prev':
							// this can only work if we have the title
							// cur -> prev
							params.torelative = 'prev';
							break;
						default:
							params.fromrev = oldid;
							params.torelative = 'cur';
							break;
					}
					break;
				case 'prev':
					if (oldid && oldid !== 'cur') {
						params.fromrev = oldid;
					}
					params.torelative = 'prev';
					break;
				case 'next':
					params.fromrev = oldid || 0;
					params.torelative = 'next';
					break;
				default:
					params.fromrev = oldid || 0;
					params.torev = diff || 0;
					break;
			}

			api.get(params).then(function (data) {
				navpop.diffData.oldRev.revid = data.compare.fromrevid;
				navpop.diffData.newRev.revid = data.compare.torevid;

				addReviewLink(navpop, 'popupMiscTools');

				var go = function () {
					pendingNavpopTask(navpop);
					var url = pg.wiki.apiwikibase + '?format=json&formatversion=2&action=query&';

					url += 'revids=' + navpop.diffData.oldRev.revid + '|' + navpop.diffData.newRev.revid;
					url += '&prop=revisions&rvslots=main&rvprop=ids|timestamp|content';

					getPageWithCaching(url, doneDiff, navpop);

					return true; // remove hook once run
				};
				if (navpop.visible || !getValueOf('popupLazyDownloads')) {
					go();
				} else {
					navpop.addHook(go, 'unhide', 'before', 'DOWNLOAD_DIFFS');
				}
			});
		});
	}

	// Put a "mark patrolled" link to an element target
	// TODO: Allow patrol a revision, as well as a diff
	function addReviewLink(navpop, target) {
		if (!pg.user.canReview) {
			return;
		}
		// If 'newRev' is older than 'oldRev' than it could be confusing, so we do not show the review link.
		if (navpop.diffData.newRev.revid <= navpop.diffData.oldRev.revid) {
			return;
		}
		var params = {
			action: 'query',
			prop: 'info|flagged',
			revids: navpop.diffData.oldRev.revid,
			formatversion: 2,
		};
		getMwApi()
			.get(params)
			.then(function (data) {
				var stable_revid =
					(data.query.pages[0].flagged && data.query.pages[0].flagged.stable_revid) || 0;
				// The diff can be reviewed if the old version is the last reviewed version
				// TODO: Other possible conditions that we may want to implement instead of this one:
				//  * old version is patrolled and the new version is not patrolled
				//  * old version is patrolled and the new version is more recent than the last reviewed version
				if (stable_revid == navpop.diffData.oldRev.revid) {
					var a = document.createElement('a');
					a.innerHTML = popupString('mark patrolled');
					a.title = popupString('markpatrolledHint');
					a.onclick = function () {
						var params = {
							action: 'review',
							revid: navpop.diffData.newRev.revid,
							comment: tprintf('defaultpopupReviewedSummary', [
								navpop.diffData.oldRev.revid,
								navpop.diffData.newRev.revid,
							]),
						};
						getMwApi()
							.postWithToken('csrf', params)
							.done(function () {
								a.style.display = 'none';
								// TODO: Update current page and other already constructed popups
							})
							.fail(function () {
								alert(popupString('Could not marked this edit as patrolled'));
							});
					};
					setPopupHTML(a, target, navpop.idNumber, null, true);
				}
			});
	}

	function doneDiff(download) {
		if (!download.owner || !download.owner.diffData) {
			return;
		}
		var navpop = download.owner;
		completedNavpopTask(navpop);

		var pages,
			revisions = [];
		try {
			// Process the downloads
			pages = getJsObj(download.data).query.pages;
			for (var i = 0; i < pages.length; i++) {
				revisions = revisions.concat(pages[i].revisions);
			}
			for (i = 0; i < revisions.length; i++) {
				if (revisions[i].revid == navpop.diffData.oldRev.revid) {
					navpop.diffData.oldRev.revision = revisions[i];
				} else if (revisions[i].revid == navpop.diffData.newRev.revid) {
					navpop.diffData.newRev.revision = revisions[i];
				}
			}
		} catch (someError) {
			errlog('Could not get diff');
		}

		insertDiff(navpop);
	}

	function rmBoringLines(a, b, context) {
		if (typeof context == 'undefined') {
			context = 2;
		}
		// this is fairly slow... i think it's quicker than doing a word-based diff from the off, though
		var aa = [],
			aaa = [];
		var bb = [],
			bbb = [];
		var i, j;

		// first, gather all disconnected nodes in a and all crossing nodes in a and b
		for (i = 0; i < a.length; ++i) {
			if (!a[i].paired) {
				aa[i] = 1;
			} else if (countCrossings(b, a, i, true)) {
				aa[i] = 1;
				bb[a[i].row] = 1;
			}
		}

		// pick up remaining disconnected nodes in b
		for (i = 0; i < b.length; ++i) {
			if (bb[i] == 1) {
				continue;
			}
			if (!b[i].paired) {
				bb[i] = 1;
			}
		}

		// another pass to gather context: we want the neighbours of included nodes which are not
		// yet included we have to add in partners of these nodes, but we don't want to add context
		// for *those* nodes in the next pass
		for (i = 0; i < b.length; ++i) {
			if (bb[i] == 1) {
				for (j = Math.max(0, i - context); j < Math.min(b.length, i + context); ++j) {
					if (!bb[j]) {
						bb[j] = 1;
						aa[b[j].row] = 0.5;
					}
				}
			}
		}

		for (i = 0; i < a.length; ++i) {
			if (aa[i] == 1) {
				for (j = Math.max(0, i - context); j < Math.min(a.length, i + context); ++j) {
					if (!aa[j]) {
						aa[j] = 1;
						bb[a[j].row] = 0.5;
					}
				}
			}
		}

		for (i = 0; i < bb.length; ++i) {
			if (bb[i] > 0) {
				// it's a row we need
				if (b[i].paired) {
					bbb.push(b[i].text);
				} // joined; partner should be in aa
				else {
					bbb.push(b[i]);
				}
			}
		}
		for (i = 0; i < aa.length; ++i) {
			if (aa[i] > 0) {
				// it's a row we need
				if (a[i].paired) {
					aaa.push(a[i].text);
				} // joined; partner should be in aa
				else {
					aaa.push(a[i]);
				}
			}
		}

		return { a: aaa, b: bbb };
	}

	function stripOuterCommonLines(a, b, context) {
		var i = 0;
		while (i < a.length && i < b.length && a[i] == b[i]) {
			++i;
		}
		var j = a.length - 1;
		var k = b.length - 1;
		while (j >= 0 && k >= 0 && a[j] == b[k]) {
			--j;
			--k;
		}

		return {
			a: a.slice(Math.max(0, i - 1 - context), Math.min(a.length + 1, j + context + 1)),
			b: b.slice(Math.max(0, i - 1 - context), Math.min(b.length + 1, k + context + 1)),
		};
	}

	function insertDiff(navpop) {
		// for speed reasons, we first do a line-based diff, discard stuff that seems boring, then
		// do a word-based diff
		// FIXME: sometimes this gives misleading diffs as distant chunks are squashed together
		var oldlines = navpop.diffData.oldRev.revision.slots.main.content.split('\n');
		var newlines = navpop.diffData.newRev.revision.slots.main.content.split('\n');
		var inner = stripOuterCommonLines(oldlines, newlines, getValueOf('popupDiffContextLines'));
		oldlines = inner.a;
		newlines = inner.b;
		var truncated = false;
		getValueOf('popupDiffMaxLines');
		if (
			oldlines.length > pg.option.popupDiffMaxLines ||
			newlines.length > pg.option.popupDiffMaxLines
		) {
			// truncate
			truncated = true;
			inner = stripOuterCommonLines(
				oldlines.slice(0, pg.option.popupDiffMaxLines),
				newlines.slice(0, pg.option.popupDiffMaxLines),
				pg.option.popupDiffContextLines
			);
			oldlines = inner.a;
			newlines = inner.b;
		}

		var lineDiff = diff(oldlines, newlines);
		var lines2 = rmBoringLines(lineDiff.o, lineDiff.n);
		var oldlines2 = lines2.a;
		var newlines2 = lines2.b;

		var simpleSplit = !String.prototype.parenSplit.isNative;
		var html = '<hr />';
		if (getValueOf('popupDiffDates')) {
			html += diffDatesTable(navpop);
			html += '<hr />';
		}
		html += shortenDiffString(
			diffString(oldlines2.join('\n'), newlines2.join('\n'), simpleSplit),
			getValueOf('popupDiffContextCharacters')
		).join('<hr />');
		setPopupTipsAndHTML(
			html.split('\n').join('<br>') +
				(truncated
					? '<hr /><b>' + popupString('Diff truncated for performance reasons') + '</b>'
					: ''),
			'popupPreview',
			navpop.idNumber
		);
	}

	function diffDatesTable(navpop) {
		var html = '<table class="popup_diff_dates">';
		html += diffDatesTableRow(navpop.diffData.newRev.revision, tprintf('New revision'));
		html += diffDatesTableRow(navpop.diffData.oldRev.revision, tprintf('Old revision'));
		html += '</table>';
		return html;
	}
	function diffDatesTableRow(revision, label) {
		var txt = '';
		var lastModifiedDate = new Date(revision.timestamp);

		txt = formattedDateTime(lastModifiedDate);

		var revlink = generalLink({
			url: mw.config.get('wgScript') + '?oldid=' + revision.revid,
			text: label,
			title: label,
		});
		return simplePrintf('<tr><td>%s</td><td>%s</td></tr>', [revlink, txt]);
	}
	// ENDFILE: diffpreview.js

	// STARTFILE: links.js
	/////////////////////
	// LINK GENERATION //
	/////////////////////

	// titledDiffLink --> titledWikiLink --> generalLink
	// wikiLink	   --> titledWikiLink --> generalLink
	// editCounterLink --> generalLink

	// TODO Make these functions return Element objects, not just raw HTML strings.

	function titledDiffLink(l) {
		// article, text, title, from, to) {
		return titledWikiLink({
			article: l.article,
			action: l.to + '&oldid=' + l.from,
			newWin: l.newWin,
			noPopup: l.noPopup,
			text: l.text,
			title: l.title,
			/* hack: no oldid here */
			actionName: 'diff',
		});
	}

	function wikiLink(l) {
		//{article:article, action:action, text:text, oldid, newid}) {
		if (
			!(typeof l.article == typeof {} && typeof l.action == typeof '' && typeof l.text == typeof '')
		) {
			return null;
		}
		if (typeof l.oldid == 'undefined') {
			l.oldid = null;
		}
		var savedOldid = l.oldid;
		if (!/^(edit|view|revert|render)$|^raw/.test(l.action)) {
			l.oldid = null;
		}
		var hint = popupString(l.action + 'Hint'); // revertHint etc etc etc
		var oldidData = [l.oldid, safeDecodeURI(l.article)];
		var revisionString = tprintf('revision %s of %s', oldidData);
		log('revisionString=' + revisionString);
		switch (l.action) {
			case 'edit&section=new':
				hint = popupString('newSectionHint');
				break;
			case 'edit&undo=':
				if (l.diff && l.diff != 'prev' && savedOldid) {
					l.action += l.diff + '&undoafter=' + savedOldid;
				} else if (savedOldid) {
					l.action += savedOldid;
				}
				hint = popupString('undoHint');
				break;
			case 'raw&ctype=text/css':
				hint = popupString('rawHint');
				break;
			case 'revert':
				var p = parseParams(pg.current.link.href);
				l.action =
					'edit&autoclick=wpSave&actoken=' +
					autoClickToken() +
					'&autoimpl=' +
					popupString('autoedit_version') +
					'&autosummary=' +
					revertSummary(l.oldid, p.diff);
				if (p.diff == 'prev') {
					l.action += '&direction=prev';
					revisionString = tprintf('the revision prior to revision %s of %s', oldidData);
				}
				if (getValueOf('popupRevertSummaryPrompt')) {
					l.action += '&autosummaryprompt=true';
				}
				if (getValueOf('popupMinorReverts')) {
					l.action += '&autominor=true';
				}
				log('revisionString is now ' + revisionString);
				break;
			case 'nullEdit':
				l.action =
					'edit&autoclick=wpSave&actoken=' +
					autoClickToken() +
					'&autoimpl=' +
					popupString('autoedit_version') +
					'&autosummary=null';
				break;
			case 'historyfeed':
				l.action = 'history&feed=rss';
				break;
			case 'markpatrolled':
				l.action = 'markpatrolled&rcid=' + l.rcid;
		}

		if (hint) {
			if (l.oldid) {
				hint = simplePrintf(hint, [revisionString]);
			} else {
				hint = simplePrintf(hint, [safeDecodeURI(l.article)]);
			}
		} else {
			hint = safeDecodeURI(l.article + '&action=' + l.action) + l.oldid ? '&oldid=' + l.oldid : '';
		}

		return titledWikiLink({
			article: l.article,
			action: l.action,
			text: l.text,
			newWin: l.newWin,
			title: hint,
			oldid: l.oldid,
			noPopup: l.noPopup,
			onclick: l.onclick,
		});
	}

	function revertSummary(oldid, diff) {
		var ret = '';
		if (diff == 'prev') {
			ret = getValueOf('popupQueriedRevertToPreviousSummary');
		} else {
			ret = getValueOf('popupQueriedRevertSummary');
		}
		return ret + '&autorv=' + oldid;
	}

	function titledWikiLink(l) {
		// possible properties of argument:
		// article, action, text, title, oldid, actionName, className, noPopup
		// oldid = null is fine here

		// article and action are mandatory args

		if (typeof l.article == 'undefined' || typeof l.action == 'undefined') {
			errlog('got undefined article or action in titledWikiLink');
			return null;
		}

		var base = pg.wiki.titlebase + l.article.urlString();
		var url = base;

		if (typeof l.actionName == 'undefined' || !l.actionName) {
			l.actionName = 'action';
		}

		// no need to add &action=view, and this confuses anchors
		if (l.action != 'view') {
			url = base + '&' + l.actionName + '=' + l.action;
		}

		if (typeof l.oldid != 'undefined' && l.oldid) {
			url += '&oldid=' + l.oldid;
		}

		var cssClass = pg.misc.defaultNavlinkClassname;
		if (typeof l.className != 'undefined' && l.className) {
			cssClass = l.className;
		}

		return generalNavLink({
			url: url,
			newWin: l.newWin,
			title: typeof l.title != 'undefined' ? l.title : null,
			text: typeof l.text != 'undefined' ? l.text : null,
			className: cssClass,
			noPopup: l.noPopup,
			onclick: l.onclick,
		});
	}

	pg.fn.getLastContrib = function getLastContrib(wikipage, newWin) {
		getHistoryInfo(wikipage, function (x) {
			processLastContribInfo(x, { page: wikipage, newWin: newWin });
		});
	};

	function processLastContribInfo(info, stuff) {
		if (!info.edits || !info.edits.length) {
			alert('Popups: an odd thing happened. Please retry.');
			return;
		}
		if (!info.firstNewEditor) {
			alert(
				tprintf('Only found one editor: %s made %s edits', [
					info.edits[0].editor,
					info.edits.length,
				])
			);
			return;
		}
		var newUrl =
			pg.wiki.titlebase +
			new Title(stuff.page).urlString() +
			'&diff=cur&oldid=' +
			info.firstNewEditor.oldid;
		displayUrl(newUrl, stuff.newWin);
	}

	pg.fn.getDiffSinceMyEdit = function getDiffSinceMyEdit(wikipage, newWin) {
		getHistoryInfo(wikipage, function (x) {
			processDiffSinceMyEdit(x, { page: wikipage, newWin: newWin });
		});
	};

	function processDiffSinceMyEdit(info, stuff) {
		if (!info.edits || !info.edits.length) {
			alert('Popups: something fishy happened. Please try again.');
			return;
		}
		var friendlyName = stuff.page.split('_').join(' ');
		if (!info.myLastEdit) {
			alert(
				tprintf("Couldn't find an edit by %s\nin the last %s edits to\n%s", [
					info.userName,
					getValueOf('popupHistoryLimit'),
					friendlyName,
				])
			);
			return;
		}
		if (info.myLastEdit.index === 0) {
			alert(
				tprintf('%s seems to be the last editor to the page %s', [info.userName, friendlyName])
			);
			return;
		}
		var newUrl =
			pg.wiki.titlebase +
			new Title(stuff.page).urlString() +
			'&diff=cur&oldid=' +
			info.myLastEdit.oldid;
		displayUrl(newUrl, stuff.newWin);
	}

	function displayUrl(url, newWin) {
		if (newWin) {
			window.open(url);
		} else {
			document.location = url;
		}
	}

	pg.fn.purgePopups = function purgePopups() {
		processAllPopups(true);
		setupCache(); // deletes all cached items (not browser cached, though...)
		pg.option = {};
		abortAllDownloads();
	};

	function processAllPopups(nullify, banish) {
		for (var i = 0; pg.current.links && i < pg.current.links.length; ++i) {
			if (!pg.current.links[i].navpopup) {
				continue;
			}
			if (nullify || banish) {
				pg.current.links[i].navpopup.banish();
			}
			pg.current.links[i].simpleNoMore = false;
			if (nullify) {
				pg.current.links[i].navpopup = null;
			}
		}
	}

	pg.fn.disablePopups = function disablePopups() {
		processAllPopups(false, true);
		setupTooltips(null, true);
	};

	pg.fn.togglePreviews = function togglePreviews() {
		processAllPopups(true, true);
		pg.option.simplePopups = !pg.option.simplePopups;
		abortAllDownloads();
	};

	function magicWatchLink(l) {
		//Yuck!! Would require a thorough redesign to add this as a click event though ...
		l.onclick = simplePrintf("pg.fn.modifyWatchlist('%s','%s');return false;", [
			l.article.toString(true).split('\\').join('\\\\').split("'").join("\\'"),
			this.id,
		]);
		return wikiLink(l);
	}

	pg.fn.modifyWatchlist = function modifyWatchlist(title, action) {
		var reqData = {
			action: 'watch',
			formatversion: 2,
			titles: title,
			uselang: mw.config.get('wgUserLanguage'),
		};
		if (action === 'unwatch') {
			reqData.unwatch = true;
		}

		// Load the Addedwatchtext or Removedwatchtext message and show it
		var mwTitle = mw.Title.newFromText(title);
		var messageName;
		if (mwTitle && mwTitle.getNamespaceId() > 0 && mwTitle.getNamespaceId() % 2 === 1) {
			messageName = action === 'watch' ? 'addedwatchtext-talk' : 'removedwatchtext-talk';
		} else {
			messageName = action === 'watch' ? 'addedwatchtext' : 'removedwatchtext';
		}
		$.when(
			getMwApi().postWithToken('watch', reqData),
			getMwApi().loadMessagesIfMissing([messageName])
		).done(function () {
			mw.notify(mw.message(messageName, title).parseDom());
		});
	};

	function magicHistoryLink(l) {
		// FIXME use onclick change href trick to sort this out instead of window.open

		var jsUrl = '',
			title = '',
			onClick = '';
		switch (l.id) {
			case 'lastContrib':
				onClick = simplePrintf("pg.fn.getLastContrib('%s',%s)", [
					l.article.toString(true).split('\\').join('\\\\').split("'").join("\\'"),
					l.newWin,
				]);
				title = popupString('lastContribHint');
				break;
			case 'sinceMe':
				onClick = simplePrintf("pg.fn.getDiffSinceMyEdit('%s',%s)", [
					l.article.toString(true).split('\\').join('\\\\').split("'").join("\\'"),
					l.newWin,
				]);
				title = popupString('sinceMeHint');
				break;
		}
		jsUrl = 'javascript:' + onClick; // jshint ignore:line
		onClick += ';return false;';

		return generalNavLink({
			url: jsUrl,
			newWin: false, // can't have new windows with JS links, I think
			title: title,
			text: l.text,
			noPopup: l.noPopup,
			onclick: onClick,
		});
	}

	function popupMenuLink(l) {
		var jsUrl = simplePrintf('javascript:pg.fn.%s()', [l.id]); // jshint ignore:line
		var title = popupString(simplePrintf('%sHint', [l.id]));
		var onClick = simplePrintf('pg.fn.%s();return false;', [l.id]);
		return generalNavLink({
			url: jsUrl,
			newWin: false,
			title: title,
			text: l.text,
			noPopup: l.noPopup,
			onclick: onClick,
		});
	}

	function specialLink(l) {
		// properties: article, specialpage, text, sep
		if (typeof l.specialpage == 'undefined' || !l.specialpage) {
			return null;
		}
		var base =
			pg.wiki.titlebase +
			mw.config.get('wgFormattedNamespaces')[pg.nsSpecialId] +
			':' +
			l.specialpage;
		if (typeof l.sep == 'undefined' || l.sep === null) {
			l.sep = '&target=';
		}
		var article = l.article.urlString({
			keepSpaces: l.specialpage == 'Search',
		});
		var hint = popupString(l.specialpage + 'Hint');
		switch (l.specialpage) {
			case 'Log':
				switch (l.sep) {
					case '&user=':
						hint = popupString('userLogHint');
						break;
					case '&type=block&page=':
						hint = popupString('blockLogHint');
						break;
					case '&page=':
						hint = popupString('pageLogHint');
						break;
					case '&type=protect&page=':
						hint = popupString('protectLogHint');
						break;
					case '&type=delete&page=':
						hint = popupString('deleteLogHint');
						break;
					default:
						log('Unknown log type, sep=' + l.sep);
						hint = 'Missing hint (FIXME)';
				}
				break;
			case 'PrefixIndex':
				article += '/';
				break;
		}
		if (hint) {
			hint = simplePrintf(hint, [safeDecodeURI(l.article)]);
		} else {
			hint = safeDecodeURI(l.specialpage + ':' + l.article);
		}

		var url = base + l.sep + article;
		return generalNavLink({
			url: url,
			title: hint,
			text: l.text,
			newWin: l.newWin,
			noPopup: l.noPopup,
		});
	}

	/**
	 * Builds a link from a object representing a link
	 * @param {object} link
	 * @param {string} link.url URL
	 * @param {string} link.text The text to show for a link
	 * @param {string} link.title Title of the link, this shows up 
	 * when you hover over the link
	 * @param {boolean} link.newWin Should open in a new Window
	 * @param {number} link.noPopup Should nest new popups from link (0 or 1)
	 * @param {string} link.onclick
	 * @returns {string|null} null if no url is given
	 */
	function generalLink(link) {
		if (typeof link.url == 'undefined') {
			return null;
		}

		var elem = document.createElement( 'a' );

		elem.href = link.url;
		elem.title = link.title;
		// The onclick event adds raw JS in textual form to the HTML.
		// TODO: We should look into removing this, and/or auditing what gets sent.
		elem.setAttribute( 'onclick', link.onclick );

		if ( link.noPopup ) {
			elem.setAttribute('noPopup', '1' );
		}

		var newWin;
		if (typeof link.newWin == 'undefined' || link.newWin === null) {
			newWin = getValueOf('popupNewWindows');
		} else {
			newWin = link.newWin;
		}
		if (newWin) {
			elem.target = '_blank';
		}
		if (link.className) {
			elem.className = link.className;
		}
		elem.innerText = pg.unescapeQuotesHTML(link.text);

		return elem.outerHTML;
	}

	function appendParamsToLink(linkstr, params) {
		var sp = linkstr.parenSplit(RegExp('(href="[^"]+?)"', 'i'));
		if (sp.length < 2) {
			return null;
		}
		var ret = sp.shift() + sp.shift();
		ret += '&' + params + '"';
		ret += sp.join('');
		return ret;
	}

	function changeLinkTargetLink(x) {
		// newTarget, text, hint, summary, clickButton, minor, title (optional), alsoChangeLabel {
		if (x.newTarget) {
			log('changeLinkTargetLink: newTarget=' + x.newTarget);
		}
		if (x.oldTarget !== decodeURIComponent(x.oldTarget)) {
			log('This might be an input problem: ' + x.oldTarget);
		}

		// FIXME: first character of page title as well as namespace should be case insensitive
		// eg [[:category:X1]] and [[:Category:X1]] are equivalent
		// this'll break if charAt(0) is nasty
		var cA = mw.util.escapeRegExp(x.oldTarget);
		var chs = cA.charAt(0).toUpperCase();
		chs = '[' + chs + chs.toLowerCase() + ']';
		var currentArticleRegexBit = chs + cA.substring(1);
		currentArticleRegexBit = currentArticleRegexBit
			.split(RegExp('(?:[_ ]+|%20)', 'g'))
			.join('(?:[_ ]+|%20)')
			.split('\\(')
			.join('(?:%28|\\()')
			.split('\\)')
			.join('(?:%29|\\))'); // why does this need to match encoded strings ? links in the document ?
		// leading and trailing space should be ignored, and anchor bits optional:
		currentArticleRegexBit = '\\s*(' + currentArticleRegexBit + '(?:#[^\\[\\|]*)?)\\s*';
		// e.g. Computer (archaic) -> \s*([Cc]omputer[_ ](?:%2528|\()archaic(?:%2528|\)))\s*

		// autoedit=s~\[\[([Cc]ad)\]\]~[[Computer-aided%20design|$1]]~g;s~\[\[([Cc]AD)[|]~[[Computer-aided%20design|~g

		var title = x.title || mw.config.get('wgPageName').split('_').join(' ');
		var lk = titledWikiLink({
			article: new Title(title),
			newWin: x.newWin,
			action: 'edit',
			text: x.text,
			title: x.hint,
			className: 'popup_change_title_link',
		});
		var cmd = '';
		if (x.newTarget) {
			// escape '&' and other nasties
			var t = x.newTarget;
			var s = mw.util.escapeRegExp(x.newTarget);
			if (x.alsoChangeLabel) {
				cmd += 's~\\[\\[' + currentArticleRegexBit + '\\]\\]~[[' + t + ']]~g;';
				cmd += 's~\\[\\[' + currentArticleRegexBit + '[|]~[[' + t + '|~g;';
				cmd += 's~\\[\\[' + s + '\\|' + s + '\\]\\]~[[' + t + ']]~g';
			} else {
				cmd += 's~\\[\\[' + currentArticleRegexBit + '\\]\\]~[[' + t + '|$1]]~g;';
				cmd += 's~\\[\\[' + currentArticleRegexBit + '[|]~[[' + t + '|~g;';
				cmd += 's~\\[\\[' + s + '\\|' + s + '\\]\\]~[[' + t + ']]~g';
			}
		} else {
			cmd += 's~\\[\\[' + currentArticleRegexBit + '\\]\\]~$1~g;';
			cmd += 's~\\[\\[' + currentArticleRegexBit + '[|](.*?)\\]\\]~$2~g';
		}
		// Build query
		cmd = 'autoedit=' + encodeURIComponent(cmd);
		cmd +=
			'&autoclick=' +
			encodeURIComponent(x.clickButton) +
			'&actoken=' +
			encodeURIComponent(autoClickToken());
		cmd += x.minor === null ? '' : '&autominor=' + encodeURIComponent(x.minor);
		cmd += x.watch === null ? '' : '&autowatch=' + encodeURIComponent(x.watch);
		cmd += '&autosummary=' + encodeURIComponent(x.summary);
		cmd += '&autoimpl=' + encodeURIComponent(popupString('autoedit_version'));
		return appendParamsToLink(lk, cmd);
	}

	function redirLink(redirMatch, article) {
		// NB redirMatch is in wikiText
		var ret = '';

		if (getValueOf('popupAppendRedirNavLinks') && getValueOf('popupNavLinks')) {
			ret += '<hr />';

			if (getValueOf('popupFixRedirs') && typeof autoEdit != 'undefined' && autoEdit) {
				ret += popupString('Redirects to: (Fix ');
				log('redirLink: newTarget=' + redirMatch);
				ret += addPopupShortcut(
					changeLinkTargetLink({
						newTarget: redirMatch,
						text: popupString('target'),
						hint: popupString('Fix this redirect, changing just the link target'),
						summary: simplePrintf(getValueOf('popupFixRedirsSummary'), [
							article.toString(),
							redirMatch,
						]),
						oldTarget: article.toString(),
						clickButton: getValueOf('popupRedirAutoClick'),
						minor: true,
						watch: getValueOf('popupWatchRedirredPages'),
					}),
					'R'
				);
				ret += popupString(' or ');
				ret += addPopupShortcut(
					changeLinkTargetLink({
						newTarget: redirMatch,
						text: popupString('target & label'),
						hint: popupString('Fix this redirect, changing the link target and label'),
						summary: simplePrintf(getValueOf('popupFixRedirsSummary'), [
							article.toString(),
							redirMatch,
						]),
						oldTarget: article.toString(),
						clickButton: getValueOf('popupRedirAutoClick'),
						minor: true,
						watch: getValueOf('popupWatchRedirredPages'),
						alsoChangeLabel: true,
					}),
					'R'
				);
				ret += popupString(')');
			} else {
				ret += popupString('Redirects') + popupString(' to ');
			}

			return ret;
		} else {
			return (
				'<br> ' +
				popupString('Redirects') +
				popupString(' to ') +
				titledWikiLink({
					article: new Title().fromWikiText(redirMatch),
					action: 'view' /* FIXME: newWin */,
					text: safeDecodeURI(redirMatch),
					title: popupString('Bypass redirect'),
				})
			);
		}
	}

	function arinLink(l) {
		if (!saneLinkCheck(l)) {
			return null;
		}
		if (!l.article.isIpUser() || !pg.wiki.wikimedia) {
			return null;
		}

		var uN = l.article.userName();

		return generalNavLink({
			url: 'http://ws.arin.net/cgi-bin/whois.pl?queryinput=' + encodeURIComponent(uN),
			newWin: l.newWin,
			title: tprintf('Look up %s in ARIN whois database', [uN]),
			text: l.text,
			noPopup: 1,
		});
	}

	function toolDbName(cookieStyle) {
		var ret = mw.config.get('wgDBname');
		if (!cookieStyle) {
			ret += '_p';
		}
		return ret;
	}

	function saneLinkCheck(l) {
		if (typeof l.article != typeof {} || typeof l.text != typeof '') {
			return false;
		}
		return true;
	}
	function editCounterLink(l) {
		if (!saneLinkCheck(l)) {
			return null;
		}
		if (!pg.wiki.wikimedia) {
			return null;
		}
		var uN = l.article.userName();
		var tool = getValueOf('popupEditCounterTool');
		var url;
		var defaultToolUrl = 'https://xtools.wmflabs.org/ec?user=$1&project=$2.$3&uselang=' + mw.config.get('wgUserLanguage');

		switch (tool) {
			case 'custom':
				url = simplePrintf(getValueOf('popupEditCounterUrl'), [
					encodeURIComponent(uN),
					toolDbName(),
				]);
				break;
			case 'soxred': // no longer available
			case 'kate': // no longer available
			case 'interiot': // no longer available
			/* fall through */
			case 'supercount':
			default:
				var theWiki = pg.wiki.hostname.split('.');
				url = simplePrintf(defaultToolUrl, [encodeURIComponent(uN), theWiki[0], theWiki[1]]);
		}
		return generalNavLink({
			url: url,
			title: tprintf('editCounterLinkHint', [uN]),
			newWin: l.newWin,
			text: l.text,
			noPopup: 1,
		});
	}

	function globalSearchLink(l) {
		if (!saneLinkCheck(l)) {
			return null;
		}

		var base = 'https://global-search.toolforge.org/?uselang=' + mw.config.get('wgUserLanguage') + '&q=';
		var article = l.article.urlString({ keepSpaces: true });

		return generalNavLink({
			url: base + article,
			newWin: l.newWin,
			title: tprintf('globalSearchHint', [safeDecodeURI(l.article)]),
			text: l.text,
			noPopup: 1,
		});
	}

	function googleLink(l) {
		if (!saneLinkCheck(l)) {
			return null;
		}

		var base = 'https://www.google.com/search?q=';
		var article = l.article.urlString({ keepSpaces: true });

		return generalNavLink({
			url: base + '%22' + article + '%22',
			newWin: l.newWin,
			title: tprintf('googleSearchHint', [safeDecodeURI(l.article)]),
			text: l.text,
			noPopup: 1,
		});
	}

	function editorListLink(l) {
		if (!saneLinkCheck(l)) {
			return null;
		}
		var article = l.article.articleFromTalkPage() || l.article;
		var url =
			'https://xtools.wmflabs.org/articleinfo/' +
			encodeURI(pg.wiki.hostname) +
			'/' +
			article.urlString() +
			'?uselang=' +
			mw.config.get('wgUserLanguage');
		return generalNavLink({
			url: url,
			title: tprintf('editorListHint', [article]),
			newWin: l.newWin,
			text: l.text,
			noPopup: 1,
		});
	}

	function generalNavLink(l) {
		l.className = l.className === null ? 'popupNavLink' : l.className;
		return generalLink(l);
	}

	//////////////////////////////////////////////////
	// magic history links
	//

	function getHistoryInfo(wikipage, whatNext) {
		log('getHistoryInfo');
		getHistory(
			wikipage,
			whatNext
				? function (d) {
					whatNext(processHistory(d));
				  }
				: processHistory
		);
	}

	// FIXME eliminate pg.idNumber ... how? :-(

	function getHistory(wikipage, onComplete) {
		log('getHistory');
		var url =
			pg.wiki.apiwikibase +
			'?format=json&formatversion=2&action=query&prop=revisions&titles=' +
			new Title(wikipage).urlString() +
			'&rvlimit=' +
			getValueOf('popupHistoryLimit');
		log('getHistory: url=' + url);
		return startDownload(url, pg.idNumber + 'history', onComplete);
	}

	function processHistory(download) {
		var jsobj = getJsObj(download.data);
		try {
			var revisions = anyChild(jsobj.query.pages).revisions;
			var edits = [];
			for (var i = 0; i < revisions.length; ++i) {
				edits.push({ oldid: revisions[i].revid, editor: revisions[i].user });
			}
			log('processed ' + edits.length + ' edits');
			return finishProcessHistory(edits, mw.config.get('wgUserName'));
		} catch (someError) {
			log('Something went wrong with JSON business');
			return finishProcessHistory([]);
		}
	}

	function finishProcessHistory(edits, userName) {
		var histInfo = {};

		histInfo.edits = edits;
		histInfo.userName = userName;

		for (var i = 0; i < edits.length; ++i) {
			if (typeof histInfo.myLastEdit === 'undefined' && userName && edits[i].editor == userName) {
				histInfo.myLastEdit = {
					index: i,
					oldid: edits[i].oldid,
					previd: i === 0 ? null : edits[i - 1].oldid,
				};
			}
			if (typeof histInfo.firstNewEditor === 'undefined' && edits[i].editor != edits[0].editor) {
				histInfo.firstNewEditor = {
					index: i,
					oldid: edits[i].oldid,
					previd: i === 0 ? null : edits[i - 1].oldid,
				};
			}
		}
		//pg.misc.historyInfo=histInfo;
		return histInfo;
	}
	// ENDFILE: links.js

	// STARTFILE: options.js
	//////////////////////////////////////////////////
	// options

	// check for existing value, else use default
	function defaultize(x) {
		if (pg.option[x] === null || typeof pg.option[x] == 'undefined') {
			if (typeof window[x] != 'undefined') {
				pg.option[x] = window[x];
			} else {
				pg.option[x] = pg.optionDefault[x];
			}
		}
	}

	function newOption(x, def) {
		pg.optionDefault[x] = def;
	}

	function setDefault(x, def) {
		return newOption(x, def);
	}

	function getValueOf(varName) {
		defaultize(varName);
		return pg.option[varName];
	}

	/*eslint-disable */
	function useDefaultOptions() {
		// for testing
		for (var p in pg.optionDefault) {
			pg.option[p] = pg.optionDefault[p];
			if (typeof window[p] != 'undefined') {
				delete window[p];
			}
		}
	}
	/*eslint-enable */

	function setOptions() {
		// user-settable parameters and defaults
		var userIsSysop = false;
		if (mw.config.get('wgUserGroups')) {
			for (var g = 0; g < mw.config.get('wgUserGroups').length; ++g) {
				if (mw.config.get('wgUserGroups')[g] == 'sysop') {
					userIsSysop = true;
				}
			}
		}

		// Basic options
		newOption('popupDelay', 0.5);
		newOption('popupHideDelay', 0.5);
		newOption('simplePopups', false);
		newOption('popupStructure', 'shortmenus'); // see later - default for popupStructure is 'original' if simplePopups is true
		newOption('popupActionsMenu', true);
		newOption('popupSetupMenu', true);
		newOption('popupAdminLinks', userIsSysop);
		newOption('popupShortcutKeys', false);
		newOption('popupHistoricalLinks', true);
		newOption('popupOnlyArticleLinks', true);
		newOption('removeTitles', true);
		newOption('popupMaxWidth', 350);
		newOption('popupSimplifyMainLink', true);
		newOption('popupAppendRedirNavLinks', true);
		newOption('popupTocLinks', false);
		newOption('popupSubpopups', true);
		newOption('popupDragHandle', false /* 'popupTopLinks'*/);
		newOption('popupLazyPreviews', true);
		newOption('popupLazyDownloads', true);
		newOption('popupAllDabsStubs', false);
		newOption('popupDebugging', false);
		newOption('popupActiveNavlinks', true);
		newOption('popupModifier', false); // ctrl, shift, alt or meta
		newOption('popupModifierAction', 'enable'); // or 'disable'
		newOption('popupDraggable', true);
		newOption('popupReview', false);
		newOption('popupLocale', false);
		newOption('popupDateTimeFormatterOptions', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});
		newOption('popupDateFormatterOptions', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
		newOption('popupTimeFormatterOptions', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});

		// images
		newOption('popupImages', true);
		newOption('imagePopupsForImages', true);
		newOption('popupNeverGetThumbs', false);
		//newOption('popupImagesToggleSize',       true);
		newOption('popupThumbAction', 'imagepage'); //'sizetoggle');
		newOption('popupImageSize', 60);
		newOption('popupImageSizeLarge', 200);

		// redirs, dabs, reversion
		newOption('popupFixRedirs', false);
		newOption('popupRedirAutoClick', 'wpDiff');
		newOption('popupFixDabs', false);
		newOption('popupDabsAutoClick', 'wpDiff');
		newOption('popupRevertSummaryPrompt', false);
		newOption('popupMinorReverts', false);
		newOption('popupRedlinkRemoval', false);
		newOption('popupRedlinkAutoClick', 'wpDiff');
		newOption('popupWatchDisambiggedPages', null);
		newOption('popupWatchRedirredPages', null);
		newOption('popupDabWiktionary', 'last');

		// navlinks
		newOption('popupNavLinks', true);
		newOption('popupNavLinkSeparator', ' &sdot; ');
		newOption('popupLastEditLink', true);
		newOption('popupEditCounterTool', 'supercount');
		newOption('popupEditCounterUrl', '');

		// previews etc
		newOption('popupPreviews', true);
		newOption('popupSummaryData', true);
		newOption('popupMaxPreviewSentences', 5);
		newOption('popupMaxPreviewCharacters', 600);
		newOption('popupLastModified', true);
		newOption('popupPreviewKillTemplates', true);
		newOption('popupPreviewRawTemplates', true);
		newOption('popupPreviewFirstParOnly', true);
		newOption('popupPreviewCutHeadings', true);
		newOption('popupPreviewButton', false);
		newOption('popupPreviewButtonEvent', 'click');

		// diffs
		newOption('popupPreviewDiffs', true);
		newOption('popupDiffMaxLines', 100);
		newOption('popupDiffContextLines', 2);
		newOption('popupDiffContextCharacters', 40);
		newOption('popupDiffDates', true);
		newOption('popupDiffDatePrinter', 'toLocaleString'); // no longer in use

		// edit summaries. God, these are ugly.
		newOption('popupReviewedSummary', popupString('defaultpopupReviewedSummary'));
		newOption('popupFixDabsSummary', popupString('defaultpopupFixDabsSummary'));
		newOption('popupExtendedRevertSummary', popupString('defaultpopupExtendedRevertSummary'));
		newOption('popupRevertSummary', popupString('defaultpopupRevertSummary'));
		newOption('popupRevertToPreviousSummary', popupString('defaultpopupRevertToPreviousSummary'));
		newOption('popupQueriedRevertSummary', popupString('defaultpopupQueriedRevertSummary'));
		newOption(
			'popupQueriedRevertToPreviousSummary',
			popupString('defaultpopupQueriedRevertToPreviousSummary')
		);
		newOption('popupFixRedirsSummary', popupString('defaultpopupFixRedirsSummary'));
		newOption('popupRedlinkSummary', popupString('defaultpopupRedlinkSummary'));
		newOption('popupRmDabLinkSummary', popupString('defaultpopupRmDabLinkSummary'));
		// misc
		newOption('popupHistoryLimit', 50);
		newOption('popupFilters', [
			popupFilterStubDetect,
			popupFilterDisambigDetect,
			popupFilterPageSize,
			popupFilterCountLinks,
			popupFilterCountImages,
			popupFilterCountCategories,
			popupFilterLastModified,
			popupFilterWikibaseItem,
		]);
		newOption('extraPopupFilters', []);
		newOption('popupOnEditSelection', 'cursor');
		newOption('popupPreviewHistory', true);
		newOption('popupImageLinks', true);
		newOption('popupCategoryMembers', true);
		newOption('popupUserInfo', true);
		newOption('popupHistoryPreviewLimit', 25);
		newOption('popupContribsPreviewLimit', 25);
		newOption('popupRevDelUrl', '//en.wikipedia.org/wiki/Wikipedia:Revision_deletion');
		newOption('popupShowGender', true);

		// new windows
		newOption('popupNewWindows', false);
		newOption('popupLinksNewWindow', { lastContrib: true, sinceMe: true });

		// regexps
		newOption(
			'popupDabRegexp',
			'disambiguation\\}\\}|\\{\\{\\s*(d(ab|isamb(ig(uation)?)?)|(((geo|hn|road?|school|number)dis)|[234][lc][acw]|(road|ship)index))\\s*(\\|[^}]*)?\\}\\}|is a .*disambiguation.*page'
		);
		newOption('popupAnchorRegexp', 'anchors?'); //how to identify an anchors template
		newOption('popupStubRegexp', '(sect)?stub[}][}]|This .*-related article is a .*stub');
		newOption(
			'popupImageVarsRegexp',
			'image|image_(?:file|skyline|name|flag|seal)|cover|badge|logo'
		);
	}
	// ENDFILE: options.js

	// STARTFILE: strings.js
	//////////////////////////////////////////////////
	// Translatable strings
	//////////////////////////////////////////////////
	//
	// See instructions at
	// https://en.wikipedia.org/wiki/Wikipedia:Tools/Navigation_popups/Translation

	pg.string = {
		/////////////////////////////////////
		// summary data, searching etc.
		/////////////////////////////////////
		article: 'article',
		category: 'category',
		categories: 'categories',
		image: 'image',
		images: 'images',
		stub: 'stub',
		'section stub': 'section stub',
		'Empty page': 'Empty page',
		kB: 'kB',
		bytes: 'bytes',
		day: 'day',
		days: 'days',
		hour: 'hour',
		hours: 'hours',
		minute: 'minute',
		minutes: 'minutes',
		second: 'second',
		seconds: 'seconds',
		week: 'week',
		weeks: 'weeks',
		search: 'search',
		SearchHint: 'Find English Wikipedia articles containing %s',
		web: 'web',
		global: 'global',
		globalSearchHint: 'Search across Wikipedias in different languages for %s',
		googleSearchHint: 'Google for %s',
		/////////////////////////////////////
		// article-related actions and info
		// (some actions also apply to user pages)
		/////////////////////////////////////
		actions: 'actions', ///// view articles and view talk
		popupsMenu: 'popups',
		togglePreviewsHint: 'Toggle preview generation in popups on this page',
		'enable previews': 'enable previews',
		'disable previews': 'disable previews',
		'toggle previews': 'toggle previews',
		'show preview': 'show preview',
		reset: 'reset',
		'more...': 'more...',
		disable: 'disable popups',
		disablePopupsHint: 'Disable popups on this page. Reload page to re-enable.',
		historyfeedHint: 'RSS feed of recent changes to this page',
		purgePopupsHint: 'Reset popups, clearing all cached popup data.',
		PopupsHint: 'Reset popups, clearing all cached popup data.',
		spacebar: 'space',
		view: 'view',
		'view article': 'view article',
		viewHint: 'Go to %s',
		talk: 'talk',
		'talk page': 'talk page',
		'this&nbsp;revision': 'this&nbsp;revision',
		'revision %s of %s': 'revision %s of %s',
		'Revision %s of %s': 'Revision %s of %s',
		'the revision prior to revision %s of %s': 'the revision prior to revision %s of %s',
		'Toggle image size': 'Click to toggle image size',
		del: 'del', ///// delete, protect, move
		delete: 'delete',
		deleteHint: 'Delete %s',
		undeleteShort: 'un',
		UndeleteHint: 'Show the deletion history for %s',
		protect: 'protect',
		protectHint: 'Restrict editing rights to %s',
		unprotectShort: 'un',
		unprotectHint: 'Allow %s to be edited by anyone again',
		'send thanks': 'send thanks',
		ThanksHint: 'Send a thank you notification to this user',
		move: 'move',
		'move page': 'move page',
		MovepageHint: 'Change the title of %s',
		edit: 'edit', ///// edit articles and talk
		'edit article': 'edit article',
		editHint: 'Change the content of %s',
		'edit talk': 'edit talk',
		new: 'new',
		'new topic': 'new topic',
		newSectionHint: 'Start a new section on %s',
		'null edit': 'null edit',
		nullEditHint: 'Submit an edit to %s, making no changes ',
		hist: 'hist', ///// history, diffs, editors, related
		history: 'history',
		historyHint: 'List the changes made to %s',
		'History preview failed': 'History preview failed :-(',
		last: 'prev', // For labelling the previous revision in history pages; the key is "last" for backwards compatibility
		lastEdit: 'lastEdit',
		'mark patrolled': 'mark patrolled',
		markpatrolledHint: 'Mark this edit as patrolled',
		'Could not marked this edit as patrolled': 'Could not marked this edit as patrolled',
		'show last edit': 'most recent edit',
		'Show the last edit': 'Show the effects of the most recent change',
		lastContrib: 'lastContrib',
		'last set of edits': 'latest edits',
		lastContribHint: 'Show the net effect of changes made by the last editor',
		cur: 'cur',
		diffCur: 'diffCur',
		'Show changes since revision %s': 'Show changes since revision %s',
		'%s old': '%s old', // as in 4 weeks old
		oldEdit: 'oldEdit',
		purge: 'purge',
		purgeHint: 'Demand a fresh copy of %s',
		raw: 'source',
		rawHint: 'Download the source of %s',
		render: 'simple',
		renderHint: 'Show a plain HTML version of %s',
		'Show the edit made to get revision': 'Show the edit made to get revision',
		sinceMe: 'sinceMe',
		'changes since mine': 'diff my edit',
		sinceMeHint: 'Show changes since my last edit',
		"Couldn't find an edit by %s\nin the last %s edits to\n%s":
			"Couldn't find an edit by %s\nin the last %s edits to\n%s",
		eds: 'eds',
		editors: 'editors',
		editorListHint: 'List the users who have edited %s',
		related: 'related',
		relatedChanges: 'relatedChanges',
		'related changes': 'related changes',
		RecentchangeslinkedHint: 'Show changes in articles related to %s',
		editOld: 'editOld', ///// edit old version, or revert
		rv: 'rv',
		revert: 'revert',
		revertHint: 'Revert to %s',
		defaultpopupReviewedSummary:
			'Accepted by reviewing the [[Special:diff/%s/%s|difference]] between this version and previously accepted version using [[:en:Wikipedia:Tools/Navigation_popups|popups]]',
		defaultpopupRedlinkSummary:
			'Removing link to empty page [[%s]] using [[:en:Wikipedia:Tools/Navigation_popups|popups]]',
		defaultpopupFixDabsSummary:
			'Disambiguate [[%s]] to [[%s]] using [[:en:Wikipedia:Tools/Navigation_popups|popups]]',
		defaultpopupFixRedirsSummary:
			'Redirect bypass from [[%s]] to [[%s]] using [[:en:Wikipedia:Tools/Navigation_popups|popups]]',
		defaultpopupExtendedRevertSummary:
			'Revert to revision dated %s by %s, oldid %s using [[:en:Wikipedia:Tools/Navigation_popups|popups]]',
		defaultpopupRevertToPreviousSummary:
			'Revert to the revision prior to revision %s using [[:en:Wikipedia:Tools/Navigation_popups|popups]]',
		defaultpopupRevertSummary:
			'Revert to revision %s using [[:en:Wikipedia:Tools/Navigation_popups|popups]]',
		defaultpopupQueriedRevertToPreviousSummary:
			'Revert to the revision prior to revision $1 dated $2 by $3 using [[:en:Wikipedia:Tools/Navigation_popups|popups]]',
		defaultpopupQueriedRevertSummary:
			'Revert to revision $1 dated $2 by $3 using [[:en:Wikipedia:Tools/Navigation_popups|popups]]',
		defaultpopupRmDabLinkSummary:
			'Remove link to dab page [[%s]] using [[:en:Wikipedia:Tools/Navigation_popups|popups]]',
		Redirects: 'Redirects', // as in Redirects to ...
		' to ': ' to ', // as in Redirects to ...
		'Bypass redirect': 'Bypass redirect',
		'Fix this redirect': 'Fix this redirect',
		disambig: 'disambig', ///// add or remove dab etc.
		disambigHint: 'Disambiguate this link to [[%s]]',
		'Click to disambiguate this link to:': 'Click to disambiguate this link to:',
		'remove this link': 'remove this link',
		'remove all links to this page from this article':
			'remove all links to this page from this article',
		'remove all links to this disambig page from this article':
			'remove all links to this disambig page from this article',
		mainlink: 'mainlink', ///// links, watch, unwatch
		wikiLink: 'wikiLink',
		wikiLinks: 'wikiLinks',
		'links here': 'links here',
		whatLinksHere: 'whatLinksHere',
		'what links here': 'what links here',
		WhatlinkshereHint: 'List the pages that are hyperlinked to %s',
		unwatchShort: 'un',
		watchThingy: 'watch', // called watchThingy because {}.watch is a function
		watchHint: 'Add %s to my watchlist',
		unwatchHint: 'Remove %s from my watchlist',
		'Only found one editor: %s made %s edits': 'Only found one editor: %s made %s edits',
		'%s seems to be the last editor to the page %s':
			'%s seems to be the last editor to the page %s',
		rss: 'rss',
		/////////////////////////////////////
		// diff previews
		/////////////////////////////////////
		'Diff truncated for performance reasons': 'Diff truncated for performance reasons',
		'Old revision': 'Old revision',
		'New revision': 'New revision',
		'Something went wrong :-(': 'Something went wrong :-(',
		'Empty revision, maybe non-existent': 'Empty revision, maybe non-existent',
		'Unknown date': 'Unknown date',
		/////////////////////////////////////
		// other special previews
		/////////////////////////////////////
		'Empty category': 'Empty category',
		'Category members (%s shown)': 'Category members (%s shown)',
		'No image links found': 'No image links found',
		'File links': 'File links',
		'No image found': 'No image found',
		'Image from Commons': 'Image from Commons',
		'Description page': 'Description page',
		'Alt text:': 'Alt text:',
		revdel: 'Hidden revision',
		/////////////////////////////////////
		// user-related actions and info
		/////////////////////////////////////
		user: 'user', ///// user page, talk, email, space
		'user&nbsp;page': 'user&nbsp;page',
		'user talk': 'user talk',
		'edit user talk': 'edit user talk',
		'leave comment': 'leave comment',
		email: 'email',
		'email user': 'email user',
		EmailuserHint: 'Send an email to %s',
		space: 'space', // short form for userSpace link
		PrefixIndexHint: 'Show pages in the userspace of %s',
		count: 'count', ///// contributions, log
		'edit counter': 'edit counter',
		editCounterLinkHint: 'Count the contributions made by %s',
		contribs: 'contribs',
		contributions: 'contributions',
		deletedContribs: 'deleted contributions',
		DeletedcontributionsHint: 'List deleted edits made by %s',
		ContributionsHint: 'List the contributions made by %s',
		log: 'log',
		'user log': 'user log',
		userLogHint: "Show %s's user log",
		arin: 'ARIN lookup', ///// ARIN lookup, block user or IP
		'Look up %s in ARIN whois database': 'Look up %s in the ARIN whois database',
		unblockShort: 'un',
		block: 'block',
		'block user': 'block user',
		IpblocklistHint: 'Unblock %s',
		BlockipHint: 'Prevent %s from editing',
		'block log': 'block log',
		blockLogHint: 'Show the block log for %s',
		protectLogHint: 'Show the protection log for %s',
		pageLogHint: 'Show the page log for %s',
		deleteLogHint: 'Show the deletion log for %s',
		'Invalid %s %s': 'The option %s is invalid: %s',
		'No backlinks found': 'No backlinks found',
		' and more': ' and more',
		undo: 'undo',
		undoHint: 'undo this edit',
		'Download preview data': 'Download preview data',
		'Invalid or IP user': 'Invalid or IP user',
		'Not a registered username': 'Not a registered username',
		BLOCKED: 'BLOCKED',
		'Has blocks': 'Has blocks',
		' edits since: ': ' edits since: ',
		'last edit on ': 'last edit on ',
		'he/him': 'he/him',
		'she/her': 'she/her',
		/////////////////////////////////////
		// Autoediting
		/////////////////////////////////////
		'Enter a non-empty edit summary or press cancel to abort':
			'Enter a non-empty edit summary or press cancel to abort',
		'Failed to get revision information, please edit manually.\n\n':
			'Failed to get revision information, please edit manually.\n\n',
		'The %s button has been automatically clicked. Please wait for the next page to load.':
			'The %s button has been automatically clicked. Please wait for the next page to load.',
		'Could not find button %s. Please check the settings in your javascript file.':
			'Could not find button %s. Please check the settings in your javascript file.',
		/////////////////////////////////////
		// Popups setup
		/////////////////////////////////////
		'Open full-size image': 'Open full-size image',
		zxy: 'zxy',
		autoedit_version: 'np20140416',
	};

	function popupString(str) {
		if (typeof popupStrings != 'undefined' && popupStrings && popupStrings[str]) {
			return popupStrings[str];
		}
		if (pg.string[str]) {
			return pg.string[str];
		}
		return str;
	}

	function tprintf(str, subs) {
		if (typeof subs != typeof []) {
			subs = [subs];
		}
		return simplePrintf(popupString(str), subs);
	}

	// ENDFILE: strings.js

	// STARTFILE: run.js
	////////////////////////////////////////////////////////////////////
	// Run things
	////////////////////////////////////////////////////////////////////

	// For some reason popups requires a fully loaded page jQuery.ready(...) causes problems for some.
	// The old addOnloadHook did something similar to the below
	if (document.readyState == 'complete') {
		autoEdit();
	}
	//will setup popups
	else {
		$(window).on('load', autoEdit);
	}

	// Support for MediaWiki's live preview, VisualEditor's saves and Echo's flyout.
	(function () {
		var once = true;
		function dynamicContentHandler($content) {
			// Try to detect the hook fired on initial page load and disregard
			// it, we already hook to onload (possibly to different parts of
			// page - it's configurable) and running twice might be bad. Ugly…
			if ($content.attr('id') == 'mw-content-text') {
				if (once) {
					once = false;
					return;
				}
			}

			function registerHooksForVisibleNavpops() {
				for (var i = 0; pg.current.links && i < pg.current.links.length; ++i) {
					var navpop = pg.current.links[i].navpopup;
					if (!navpop || !navpop.isVisible()) {
						continue;
					}

					Navpopup.tracker.addHook(posCheckerHook(navpop));
				}
			}

			function doIt() {
				registerHooksForVisibleNavpops();
				$content.each(function () {
					this.ranSetupTooltipsAlready = false;
					setupTooltips(this);
				});
			}

			setupPopups(doIt);
		}

		// This hook is also fired after page load.
		mw.hook('wikipage.content').add(dynamicContentHandler);

		mw.hook('ext.echo.overlay.beforeShowingOverlay').add(function ($overlay) {
			dynamicContentHandler($overlay.find('.mw-echo-state'));
		});
	})();
});
// ENDFILE: run.js
