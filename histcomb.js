// <nowiki>

/*
	Forked from [[User:Alex Smotrov/histcomb.js]]
	
	Changes:
	- refactoring
	- fix bug when clicking "prev" on multiple diffs
*/

window.histComb = new function() {
	// load any custom user settings
	if (!window.histCombTalk) histCombTalk = 't'
	if (!window.histCombContrib) histCombContrib = 'c'
	if (!window.histCombUndo) histCombUndo = '×'
	if (!window.histCombMyBg) histCombMyBg = '#F0FFF0'

	var pagehis, histRow, histSize, isCombEdits = false

	this.onLoad = function(){
		pagehis = document.getElementById('pagehistory')
		if (!pagehis) return
		histRow = pagehis.getElementsByTagName('li')
		histSize = new Array (histRow.length)
		var row, spans, i, aa, author, author_p = '', size_digits  
		var sameAuthor = 0, thisMinor, allMinor = true

		for (var rr=histRow.length-1; rr>=0; rr--){ //main loop: all rows bottom to top
		row = histRow[rr]
		thisMinor = false
		spans = row.getElementsByTagName('span')
		//check all spans
		for (i=0; i<spans.length; i++)
			switch (spans[i].className){
			case 'history-size':
			size_digits = spans[i].innerHTML.match(/\d+/g)
			histSize[rr] = size_digits ? size_digits.join('') : '0'
			if (histSize[rr+1]){ 
				spans[i].title = spans[i].innerHTML.replace(/&nbsp;/g,' ')
				insertDiffValue(spans[i], histSize[rr] - histSize[rr+1])
			}
			break
			case 'minor':
			thisMinor = true
			break
			case 'history-user': // get user name and shorten talk/contribs
			aa = spans[i].getElementsByTagName('a')
			if (aa.length && aa[1]){
				author = aa[1].title.split(':')[1]
				aa[1].innerHTML = histCombTalk 
				if (aa.length >= 3 && (aa[2].title.indexOf(':Contributions/') != -1)) //for anons this could be 'block'
					aa[2].innerHTML = histCombContrib 
			}
			break
			case 'mw-history-undo':
			aa = spans[i].getElementsByTagName('a')[0]
			aa.title = aa.innerHTML 
			aa.innerHTML = histCombUndo
			break
			//case 'comment':  histSumm = spans[i].innerHTML  break 
			}//end switch inside for 
			
			if (!histSize[rr] && histSize[rr+1]) histSize[rr] = histSize[rr+1] //assume it was '(un)protect' edit

		if (mw.config.get('wgUserName') == author) histRow[rr].style.backgroundColor = histCombMyBg
		//check how many consequent edits
		if (author == author_p) 
			sameAuthor++
		else {
			if (sameAuthor > 1) createCombineEdit(rr+1, sameAuthor, allMinor)
			sameAuthor = 1 
			author_p = author
			allMinor = thisMinor
		}
		if (!thisMinor) allMinor = false
		}//main loop
		
		//collapse top editor too
		if (sameAuthor>1) {
		createCombineEdit(0, sameAuthor, allMinor)
		if (histRow.length > sameAuthor && !window.histCombNoCollapse) //if collapsing top row - make  next row selected
			histRow[sameAuthor].getElementsByTagName('input')[0].click()
		}

		//add  "expand/collapse all" link
		if (isCombEdits) { 
		var togAll = document.createElement('a')
		togAll.appendChild(document.createTextNode('[±]'))
		togAll.href = 'javascript:histComb.toggleAll()'
		pagehis.parentNode.insertBefore(togAll, pagehis.previousSibling)   
		}


		//bonus: link to toоlserver
		var lnk = document.createElement('a')
		lnk.style.marginLeft = '10px'
		lnk.href = 'https://xtools.wmflabs.org/articleinfo/'
		+mw.config.get('wgServer').substring(mw.config.get('wgServer').lastIndexOf('/')+1, mw.config.get('wgServer').indexOf('.'))
		+mw.config.get('wgServer').substring(mw.config.get('wgServer').indexOf('.'))
		+'/'+mw.config.get('wgPageName')+'#top-editors'
		lnk.appendChild(document.createTextNode('Contributors'))
		lnk.title = 'All authors sorted by edits (on Toolforge)'
		if (i=document.getElementsByClassName('mw-history-subtitle')[0]) i.appendChild(lnk)


		}


		this.toggleAll = function(){
		var links = $(pagehis).find('a.collapsedEdits');
		var state = (links[0].innerHTML == '[–]')
		for (var i=0; i<links.length; i++)
		if (state == (links[i].innerHTML == '[–]'))
			eval(links[i].href)
		}


		this.toggle = function (m, len, isMinor){ //handler for collapsing link
		var row = histRow[m]
		var spans = row.getElementsByTagName('span')
		var plus = row.lastChild
		var radios = row.getElementsByTagName('input')
		var topDiff = row.getElementsByTagName('a')[ m > 0 ? 1 : 0] // "diff to last" in the combined edit
		var i, clss, bottomDiff, oldid
		var isHiding = (plus.innerHTML == '[–]')
		if (isHiding) {//need to collapse −
		plus.innerHTML = '[' + len + ']'
		row.style.borderLeft = '1px solid transparent'
		//hide other rows
		for (i=m+1; i<m+len; i++) histRow[i].style.display = 'none'
		//"diff from last" link: get oldid from the lowest collapsed edit
		bottomDiff = histRow[m+len-1].getElementsByTagName('a')[1].href
		if (bottomDiff.indexOf('&diff=') == -1)  topDiff.style.visibility = 'hidden' //the very 1st edit
		oldid = bottomDiff.match(/oldid=(\d+)/)[1]
		topDiff['old'] = topDiff.href
		topDiff.href = topDiff.href.replace(/&oldid=\d+/, '&oldid='+oldid)
		}else{ //need to expand
		plus.innerHTML = '[–]'
		//show other rows and visually reference the whole group
		row.style.borderLeft = '1px dotted gray'
		for (i=m+1; i<m+len; i++){
			histRow[i].style.display = 'block'
			histRow[i].style.borderLeft = '1px dotted gray'
			histRow[i].style.listStyle = 'none none'
		}
		histRow[m+len-1].style.borderBottom = '1px dotted gray'
		topDiff.href = topDiff['old']
		topDiff.style.visibility = 'visible'
		}
		//hide/show/modify spans in this row
		for (i=0; i<spans.length; i++)
		switch (spans[i].className.split(' ')[0]){
		case 'minor':
			spans[i].style.display = (isHiding && !isMinor)?'none':'inline'
			break
		case 'history-size': //switch to  combined diff size and back
			insertDiffValue(spans[i], histSize[m] - (isHiding ? histSize[m+len] : histSize[m+1]))
			break
		case 'comment': //hide/show
			spans[i].style.display = (isHiding && !window.histCombLeaveComment)?'none':'inline'
			break
		case 'mw-history-undo':
			var undoLnk = spans[i].getElementsByTagName('a')[0]
			if (isHiding) {
			undoLnk['old'] = undoLnk.href
			undoLnk.href = undoLnk.href.replace(/&undoafter=\d+/, '&undoafter='+oldid)
			}else
			undoLnk.href = undoLnk['old']
			break
		//case 'history-user':
		}
		}


		function createCombineEdit(m, len, isMinor){ //creates collapsing link for row m down to row m+len
		var row = histRow[m]
		row.style.listStyle = 'none none'
		row.style.position = 'relative'
		var plus = document.createElement('a')
		plus.className = 'collapsedEdits'
		plus.appendChild(document.createTextNode('[–]'))
		plus.style.position = 'absolute'
		plus.style.left = '-22px'
		plus.style.top = '2px'
		plus.href = 'javascript:histComb.toggle('+m+','+len+','+isMinor+')'
		row.appendChild(plus)
		if (!window.histCombNoCollapse) histComb.toggle(m, len, isMinor) //and collapse
		isCombEdits = true
		
		//unexplained IE bug: in row just under collapsed edit  radios were jumping to the left, links were unclickable
		if (navigator.userAgent.indexOf('MSIE') != -1 && m+len < histRow.length){ //make all elements 'relative'
		var els = histRow[m+len].getElementsByTagName('*')
		for (i=0; i<els.length; i++)  
			if (els[i].style && !els[i].style.position) els[i].style.position = 'relative'
		}
		}


		function insertDiffValue(span, value){
		var html, class2
		if (value>0) {
		html = '(+' + value + ')'
		class2 = ' mw-plusminus-pos'
		} else if (value<0) {
		html = '(' + value + ')'
		class2 = ' mw-plusminus-neg'
		} else {
		html = '(0)'
		class2 = ' mw-plusminus-null'
		}
		span.style.fontWeight = (value < -500) ? 'bold' : 'normal'
		span.innerHTML = html
		span.className = span.className.split(' ')[0] + class2
	}
}

if (mw.config.get('wgAction') == 'history') $(histComb.onLoad)

//</nowiki>