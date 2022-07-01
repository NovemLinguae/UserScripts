function convertTimeZoneFromMediaWikiToBrowser(timestamp, medaWikiTimeZoneString, browserTimeZoneOffset) {
	let mediaWikiTimeZoneOffsetInMinutes = getMediaWikiTimeZoneOffset(medaWikiTimeZoneString);
	let mediaWikiTimeZoneOffsetInSeconds = mediaWikiTimeZoneOffsetInMinutes * 60;
	let browserTimeZoneOffsetInSeconds = browserTimeZoneOffset * 60;
	let conversion = parseInt(mediaWikiTimeZoneOffsetInSeconds) - parseInt(browserTimeZoneOffsetInSeconds);
	return parseInt(timestamp) + conversion;
}

/**
	* Converts a MediaWiki mw.user.options.get('timecorrection') from something like 'ZoneInfo|-420|America/Los_Angeles' or 'System|0' to -420 or 0.
	*/
function getMediaWikiTimeZoneOffset(string) {
	return parseInt(string.match(/\d+/)[0]);
}

describe('convertTimeZoneFromMediaWikiToBrowser(timestamp, medaWikiTimeZoneString, browserTimeZoneOffset)', () => {
	test(`should handle mediawiki UTC and browser pacific standard time`, () => {
		let timestamp = 1656495780; // UTC
		let medaWikiTimeZoneString = `System|0`; // UTC
		let browserTimeZoneOffset = 420; // USA pacific time
		expect(convertTimeZoneFromMediaWikiToBrowser(timestamp, medaWikiTimeZoneString, browserTimeZoneOffset)).toBe(1656470580);
	});
});