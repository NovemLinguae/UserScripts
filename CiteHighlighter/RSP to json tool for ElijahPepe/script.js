"use strict";

class Tool {
	getOutput(input) {
		let output = [];
		let dicedUpWikicode = input.split("|-");
		
		for ( let row of dicedUpWikicode ) {
			let buffer = {};

			let source = row.match(/^\| ((?!data)[^\n]+)\n/mi);
			if ( source === null ) continue;
			buffer.source = source[1];
			// TODO: strip out wikilinks, piped wikilinks, {{/Shortcut}}, etc.

			let domains = row.match(/^\| \{\{\/Uses\|([^\}]*)\}/mi);
			buffer.domains = domains === null ? [] : domains[1].split('|');

			// TODO:
			let reliability = '';

			// TODO:
			let blacklisted = '';

			// TODO:
			let summary = '';

			output.push(buffer);
		}

		// format it in JSON
		
		return JSON.stringify(output, null, 4);
	}
}

window.addEventListener('DOMContentLoaded', (e) => {
	let input = document.getElementById('input');
	let execute = document.getElementById('execute');
	let output = document.getElementById('output');
	
	let Tool1 = new Tool();
	
	// load Tool.txt into input box
	try {
		let fileToLoad = './default.txt';
		let xmlhttp = new XMLHttpRequest();
		xmlhttp.open('GET', fileToLoad, false);
		xmlhttp.send();
		input.innerHTML = xmlhttp.responseText;
	} catch(DOMException) {
		input.innerHTML = "Error loading file. Maybe related to filepath or CORS?";
	}
	
	execute.addEventListener('click', function(e) {
		output.value = Tool1.getOutput(input.value);
	});
	
	execute.dispatchEvent(new Event('click'));
});