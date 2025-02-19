module.exports = {
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: [ 'mock-mediawiki' ],
	testURL: 'https://test.wikipedia.org' // this is only needed if you plan to use mw.Api or mw.storage
};
