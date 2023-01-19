export class ConvertToSpeciesBox {
	convert(wikicode2) {
		// remove {{Italic title}}, 'DISPLAYTITLE', 'Lowercase title'
		wikicode2 = wikicode2.replace(/\{\{(?:Italic title|DISPLAYTITLE|Lowercase title)[^}]*\}\}\n?/gsi, '');

		// Convert {{Taxobox or {{Automatic taxobox to {{Speciesbox
		wikicode2 = wikicode2.replace(/(?<=\{\{)(?:Taxobox|Automatic taxobox)(?=[\s\n}])/i, 'Speciesbox');

		// handle extinct species
		let hasExtinctTemplate = wikicode2.match(/(\|\s*species\s*=\s*)\{\{Extinct\}\}/i);
		let hasDagger = wikicode2.match(/(\|\s*species\s*=\s*)†/i);
		let hasExtinctParameter = wikicode2.match(/\|\s*extinct\s*=/i);
		if ( (hasExtinctTemplate || hasDagger) && ! hasExtinctParameter ) {
			// add |extinct=yes
			wikicode2 = this._addToSpeciesBox(wikicode2, '| extinct = yes\n');
		}
		// delete dagger
		wikicode2 = wikicode2.replace(/(\|\s*genus\s*=\s*)†/i, '$1');
		wikicode2 = wikicode2.replace(/(\|\s*species\s*=\s*)†/i, '$1');
		// delete {{Extinct}}
		wikicode2 = wikicode2.replace(/(\|\s*genus\s*=\s*)\{\{Extinct\}\}/i, '$1');
		wikicode2 = wikicode2.replace(/(\|\s*species\s*=\s*)\{\{Extinct\}\}/i, '$1');

		// genus: remove italics and wikilinks
		// | genus = ''[[Semicassis]]'' -> | genus = Semicassis
		// | genus = '''''Semicassis''''' -> | genus = Semicassis
		wikicode2 = wikicode2.replace(/(\|\s*genus\s*=\s*)'*\[*([^|}'\]]*)(?:\|[^|}'\]]*)?\]*'* *$/im, '$1$2');

		// species: remove bold, italic, wikilinks, and beginning initial
		// | species = '''''S. faurotis''''' -> | species = faurotis
		// | species = '''''Semicassis faurotis''''' -> | species = faurotis
		// | species = [[moreauviae]] -> | species = moreauviae
		wikicode2 = wikicode2.replace(/(\|\s*species\s*=\s*)\[*'*(?:[A-Za-z.]+ )?([^'|}\]]*)'*\]* */is, '$1$2');

		// if genus and binomial but no species, add species
		let hasGenus = wikicode2.match(/\|\s*genus\s*=\s*([A-Za-z \(\)]+?)\s*[\n|}]/);
		let hasSpecies = wikicode2.match(/\|\s*species\s*=\s*([A-Za-z \(\)]+?)\s*[\n|}]/);
		let hasBinomial = wikicode2.match(/\|\s*binomial\s*=\s*'{0,5}([A-Za-z\(\)]+?) ([A-Za-z\(\)]+?)'{0,5}\s*[\n|}]/);
		if ( hasBinomial && hasGenus && ! hasSpecies ) {
			let species = hasBinomial[2];
			wikicode2 = wikicode2.replace(/(\|\s*genus\s*=\s*([A-Za-z \(\)]+?))([\n|}])/, `$1\n| species = ${species}$3`);
		}

		// TODO: copy/paste this list: https://en.wikipedia.org/wiki/Wikipedia:Automated_taxobox_system/checked_ranks
		let removeParametersList = [
			'binomial',
			'classis',
			'color',
			'divisio',
			'domain',
			'familia_authority',
			'familia',
			'genus_authority',
			'image_width', // throws an error when previewing, I think Speciesbox computes these automatically
			'image2_width',
			'infraclassis',
			'infraordo',
			'infraphylum',
			'ordo',
			'phylum',
			'regnum',
			'subclassis',
			'subfamilia',
			'subgenus',
			'subordo',
			'subphylum_authority',
			'subphylum',
			'subregnum',
			'superclassis_authority',
			'superclassis',
			'superdivisio',
			'superfamilia',
			'superordo',
			'tribus',
			'tribus_authority',
			'unranked_classis',
			'unranked_divisio',
			'unranked_ordo',
			'unranked_phylum',
			'unranked_regnum',
			'unranked_superfamilia',
			'unranked_superphylum',
		];
		for ( let parameter of removeParametersList ) {
			let regex = new RegExp('\\|\\s*' + parameter + '\\s*=.*?\\n(?=[|}])', 'is');
			wikicode2 = wikicode2.replace(regex, '');
		}

		// remove all blank parameters, but only in this taxobox
		// 1) tidies the code, 2) helps prevent duplicate |authority= parameters
		wikicode2 = this._removeBlankParametersFromFirstTemplate('speciesbox', wikicode2);

		// rename binomial_authority, species_authority, and type_species_authority to authority
		wikicode2 = wikicode2.replace(/(\|\s*)binomial_(authority\s*=)/is, '$1$2');
		wikicode2 = wikicode2.replace(/(\|\s*)type_species_(authority\s*=)/is, '$1$2');
		wikicode2 = wikicode2.replace(/(\|\s*)species_(authority\s*=)/is, '$1$2');

		// remove |name= if it contains the latin name. leave alone if non-latin name
		hasSpecies = wikicode2.match(/\|\s*species\s*=\s*([A-Za-z \(\)]+?)\s*[\n|}]/);
		if ( hasGenus && hasSpecies ) {
			let genus = this._regExEscape(hasGenus[1]);
			let species = this._regExEscape(hasSpecies[1]);
			let regex = new RegExp("\\|\\s*name\\s*=\\s*\\[*'*" + genus + ' ' + species + "'*\\]*\\s*(?=[\\n|}])", 'i');
			wikicode2 = wikicode2.replace(regex, '');
		}

		return wikicode2;
	}

	_regExEscape(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

	_addToSpeciesBox(wikicode2, textToAdd) {
		return wikicode2.replace(/(\{\{Speciesbox\s*\n)/i, '$1' + textToAdd);
	}

	/**
	 * @param templateName Needle. A template name, case insensitive. So for example, to find {{Speciesbox}}, you'd input speciesbox with no braces.
	 * @param wikicode Haystack. A bunch of wikicode.
	 */
	_removeBlankParametersFromFirstTemplate(templateName, wikicode) {
		let thirds = this._isolateFirstTemplate(templateName, wikicode);
		// eliminate blank parameters without enters at the end of the line
		thirds[1] = thirds[1].replace(/\|[^=]*=[ \t]*(?=\|)/g, '');
		// eliminate blank parameters with enters at the end of the line
		thirds[1] = thirds[1].replace(/\|[^=\]\n]*=[ \t]*\n(?=\}|\|)/g, '');
		return thirds.join('');
	}

	_indexOfCaseInsensitive(needle, haystack) {
		return haystack.search(new RegExp(this._regExEscape(needle), "i"));
	}

	/**
	 * @returns {string[]} [preTemplateText, templateText, postTemplateText]
	 */
	_isolateFirstTemplate(needle, haystack) {
		// isolate first template needle that is found
		let templateWikicodeStartPos = this._indexOfCaseInsensitive('{{' + needle, haystack);

		// if not found
		if ( templateWikicodeStartPos === -1 ) {
			return [haystack, '', ''];
		}

		let nestingCount = 0;
		let i = 0;
		for ( i = templateWikicodeStartPos; i < haystack.length; i++ ) {
			let nextTwo = haystack.slice(i, i + 2);
			if ( nextTwo == '{{' ) {
				nestingCount++;
			} else if ( nextTwo == '}}' ) {
				nestingCount--;
			}

			if ( nestingCount === 0 ) break;
		}
		let templateWikicodeEndPos = i + 2;
		let thirds = [];
		thirds[0] = haystack.slice(0, templateWikicodeStartPos);
		thirds[1] = haystack.slice(templateWikicodeStartPos, templateWikicodeEndPos);
		thirds[2] = haystack.slice(templateWikicodeEndPos);
		return thirds;
	}
}