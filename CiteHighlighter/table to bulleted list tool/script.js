"use strict";

class Tool {
	getOutput(input) {
		// convert {{url|example.com}} to [https://example.com/]
		input = input.replace(/{{url\|(.+?)}}/g, '[https://$1/]');
		
		// delete anything in <ref> tags. we don't want to grab external links in <ref> tags.
		input = input.replace(/<ref.+?<\/ref>/g, '');
		
		// chop off https://web.archive.org/web/3898369836396/ from front of links
		input = input.replace(/https?:\/\/web.archive.org\/web\/\d*?\//g, '');
		
		// chop off http://wayback.archive.org/web/*/ from front of links
		input = input.replace(/http:\/\/wayback.archive.org\/web\/*\//g, '');
	
		let output = '';
		let lines = input.split("\n");
		
		for ( let line of lines ) {
			// if heading, print a level 3 heading
			let matches = line.match(/==([^=]*?)==/);
			if ( matches ) {
				output += '===' + matches[1] + "===\n";
				continue;
			}
			
			// else check for external links
			matches = line.match(/[^\[]\[(http[^\] ]+)/);
			if ( matches ) {
				for ( let key in matches ) {
					if ( key != 0 && this.isPositiveInteger(key) ) {
						output += '* [' + matches[key] + "]\n";
					}
				}
			}
		}
		
		return output;
	}
	
	/** evaluate if a string is a positive integer */
	isPositiveInteger(n) {
    	return n >>> 0 === parseFloat(n);
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