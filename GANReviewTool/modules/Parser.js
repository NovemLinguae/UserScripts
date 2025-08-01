import Parser from 'wikiparser-template';

Parser.config = {
	ext: [
		'pre',
		'nowiki',
		'gallery',
		'indicator',
		'langconvert',
		'graph',
		'timeline',
		'hiero',
		'charinsert',
		'ref',
		'references',
		'inputbox',
		'imagemap',
		'source',
		'syntaxhighlight',
		'poem',
		'categorytree',
		'section',
		'score',
		'templatestyles',
		'templatedata',
		'math',
		'ce',
		'chem',
		'maplink',
		'mapframe',
		'page-collection',
		'phonos'
	]
};

export default Parser;
