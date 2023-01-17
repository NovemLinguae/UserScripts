/*
- Gives an approximate count of keeps, deletes, supports, opposes, etc. in deletion discussions and RFCs.
	- For AFD, MFD, and GAR, displays them at top of page.
	- For everything else, displays them by the section heading.
- Counts are approximate. If people do weird things like '''Delete/Merge''', it will be counted twice.
- Adds an extra delete vote to AFDs and MFDs, as it's assumed the nominator is voting delete.
- If you run across terms that aren't counted but should be, leave a message on the talk page. Let's add as many relevant terms as we can :)

*/

$(async function() {
	let vcc = new VoteCounterController();
	await vcc.execute();
});

/*
TEST CASES:
- don't count sections (AFD): https://en.wikipedia.org/wiki/Wikipedia:Articles_for_deletion/Judd_Hamilton_(2nd_nomination)
- count sections (RFC): https://en.wikipedia.org/wiki/Wikipedia:Reliable_sources/Noticeboard/Archive_393#Discussion_(The_Economist)
- count sections and adjust !votes (RFD): https://en.wikipedia.org/wiki/Wikipedia:Redirects_for_discussion/Log/2022_January_1

BUGS:
- 
*/

// TODO: write a parser that keeps track of pairs of ''', to fix issue with '''vote''' text '''vote''' sometimes counting the text between them

// TODO: handle CFD big merge lists, e.g. https://en.wikipedia.org/wiki/Wikipedia:Categories_for_discussion/Log/2021_December_10#Category:Cornish_emigrans_and_related_subcats