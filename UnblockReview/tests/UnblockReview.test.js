function getInitialText(wikitext, appealReason) {
	// https://stackoverflow.com/a/6969486/3480193
	function escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

	let regEx = new RegExp(escapeRegExp(appealReason), 'g');
	let matches = wikitext.matchAll(regEx);
	matches = [...matches];
	if( matches.length === 0 ) {
		throw new Error( "Searching for target text failed!" );
	}
	for ( let match of matches ) {
		var textIdx = match.index;
		var startIdx = textIdx;

		// check for {{tlx|unblock. if found, this isn't what we want, skip.
		let startOfSplice = startIdx - 50 < 0 ? 0 : startIdx - 50;
		var chunkFiftyCharactersWide = wikitext.substring(startOfSplice, startIdx);
		if ( /\{\{\s*tlx\s*\|\s*unblock/i.test(chunkFiftyCharactersWide) ) {
			continue;
		}

		let i = 0;
		while( wikitext[startIdx] != "{" && i < 50 ) {
			startIdx--;
			i++;
		}
		if( i == 50 ) {
			continue;
		}

		startIdx--; // templates start with two opening curly braces

		var initialText = wikitext.substring( startIdx, textIdx );
    	return initialText;
	}

	throw new Error( "Searching backwards failed!" );
}

test('{{unblock|reason=Your reason here }}', () => {
	let wikitext = `Test {{unblock|reason=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}} Test`;
	let appealReason = `Your reason here `;
	let output = `{{unblock|reason=`;
	expect(getInitialText(wikitext, appealReason)).toBe(output);
});

test('{{unblock |1=Your reason here }}', () => {
	let wikitext = `Test {{unblock |1=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}} Test`;
	let appealReason = `Your reason here `;
	let output = `{{unblock |1=`;
	expect(getInitialText(wikitext, appealReason)).toBe(output);
});

test('{{Unblock | Your reason here }}', () => {
	let wikitext = `Test {{Unblock | Your reason here }} Test`;
	let appealReason = `Your reason here `;
	let output = `{{Unblock | `;
	expect(getInitialText(wikitext, appealReason)).toBe(output);
});

test('Start of page', () => {
	let wikitext = `{{Unblock | Your reason here }} Test
`;
	let appealReason = `Your reason here `;
	let output = `{{Unblock | `;
	expect(getInitialText(wikitext, appealReason)).toBe(output);
});

test('End of page', () => {
	let wikitext = `Test {{Unblock | Your reason here }}
`;
	let appealReason = `Your reason here `;
	let output = `{{Unblock | `;
	expect(getInitialText(wikitext, appealReason)).toBe(output);
});

test('Only item on page', () => {
	let wikitext = `{{Unblock | Your reason here }}
`;
	let appealReason = `Your reason here `;
	let output = `{{Unblock | `;
	expect(getInitialText(wikitext, appealReason)).toBe(output);
});

test('{{tlx|unblock|Your reason here }} {{unblock|Your reason here }}', () => {
	let wikitext = `Test <!-- Copy the text as it appears on your page, not as it appears in this edit area. Do not include the "tlx|" code. -->{{tlx|unblock|2=reason=''Your reason here &#126;&#126;&#126;&#126;''}}. {{unblock|reason=Your reason here [[User:Filipe46|Filipe46]] ([[User talk:Filipe46#top|talk]]) 21:54, 25 November 2021 (UTC)}} Test`;
	let appealReason = `Your reason here `;
	let output = `{{unblock|reason=`;
	expect(getInitialText(wikitext, appealReason)).toBe(output);
});

test('{{Unblock-un|Your reason here }}', () => {
	let wikitext = `Test {{Unblock-un|Your reason here }} Test`;
	let appealReason = `Your reason here `;
	let output = `{{Unblock-un|`;
	expect(getInitialText(wikitext, appealReason)).toBe(output);
});

test('{{Unblock-auto|Your reason here }}', () => {
	let wikitext = `Test {{Unblock-auto|Your reason here }} Test`;
	let appealReason = `Your reason here `;
	let output = `{{Unblock-auto|`;
	expect(getInitialText(wikitext, appealReason)).toBe(output);
});

test('{{Unblock-bot|Your reason here }}', () => {
	let wikitext = `Test {{Unblock-bot|Your reason here }} Test`;
	let appealReason = `Your reason here `;
	let output = `{{Unblock-bot|`;
	expect(getInitialText(wikitext, appealReason)).toBe(output);
});

test('No target text', () => {
	let wikitext = `No target text`;
	let appealReason = `Your reason here `;
	expect(() => {getInitialText(wikitext, appealReason)}).toThrow(Error);
	expect(() => {getInitialText(wikitext, appealReason)}).toThrow("Searching for target text failed!");
});

test('No start of template', () => {
	let wikitext = `Test Your reason here Test`;
	let appealReason = `Your reason here `;
	expect(() => {getInitialText(wikitext, appealReason)}).toThrow(Error);
	expect(() => {getInitialText(wikitext, appealReason)}).toThrow("Searching backwards failed!");
});
