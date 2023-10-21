/*
- A Wikidata user script
- Requested by [[User:Pigsonthewing]]
- Tool to bulk replace long-hand citations with items
- Example diff: https://www.wikidata.org/w/index.php?title=Q108309703&type=revision&diff=1519224286&oldid=1490690953

TODO:
- add a hook to re-add the deleted button when someone finishes editing a reference
- delete the button when someone switches into edit mode
*/

async function addButtonNextToEachReference() {
	// z-index: 1; position: relative; is needed to make the button clickable. else another element is on top of it
	$('.wikibase-referenceview-listview').prepend('<button class="long-hand-citation-replacer-first-button" style="float: right; z-index: 1; position: relative;">Fix Long Hand Citation</button>');

	$('.long-hand-citation-replacer-first-button').on('click', async function () {
		await collectNewQid(this);
	});
}

/**
  * Build a form to collect new QID
  */
async function collectNewQid(that) {
	let $button = $(that);
	$button.after('<div id="long-hand-citation-replacer-collect-new-qid" style="float: right; z-index: 1; position: relative;"><input type="text" /><button id="long-hand-citation-replacer-qid-button">Do it!</button></div>');

	// hide all the buttons so that there aren't 2 QID collection forms open at the same time
	$('.long-hand-citation-replacer-first-button').hide();

	$('#long-hand-citation-replacer-qid-button').on('click', async function () {
		await editWikidata();
	});
}

async function editWikidata() {
	// hide the collectNewQid form
	$('#long-hand-citation-replacer-collect-new-qid').hide();

	// display a status label
	$('#long-hand-citation-replacer-collect-new-qid')
		.after('<div id="long-hand-citation-replacer-status" style="float: right; z-index: 1; position: relative;">Edits in progress. Do not reload the page.</div>');

	let api = new mw.Api();
	let response = await api.get( {
		action: 'wbgetentities',
		format: 'json',
		ids: 'Q4115189',
	} );



	console.log(response);

	// https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=Q4115189&formatversion=2

	// foreach
		// figure out what we need to edit (will be an array of items on this page)
		// edit all those items
}

addButtonNextToEachReference();

/*

Wikidata terminology

- data namespaces (containing pages aka entities)
	- main (Q123) - items
	- property (P123) - a category of data
	- lexeme
- when creating a page...
	- item
	- label
	- description
	- alias
-
	- item "Douglas Adams"
	- property "educated at"
	- value "St. John's College"
- api
	wbsetaliases: ⧼Apihelp-wbsetaliases-description⧽
	wbsetclaim: ⧼Apihelp-wbsetclaim-description⧽
	wbsetclaimvalue: ⧼Apihelp-wbsetclaimvalue-description⧽ - I think Tgr said I should use this one
	wbsetdescription: ⧼Apihelp-wbsetdescription-description⧽
	wbsetlabel: ⧼Apihelp-wbsetlabel-description⧽
	wbsetqualifier: ⧼Apihelp-wbsetqualifier-description⧽
	wbsetreference: ⧼Apihelp-wbsetreference-description⧽
	wbsetsitelink: ⧼Apihelp-wbsetsitelink-description⧽
- or did Tgr say to use wbgetentityclaim and wbsetentityclaim?

*/