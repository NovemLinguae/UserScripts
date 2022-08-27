<?php

// Can't use JavaScript to grab content from third party websites. Have to use PHP instead.

function getWikitextFromEnWiki($article) {
	$article = rawurlencode($article);
	$url = "https://en.wikipedia.org/w/api.php?action=query&prop=revisions&titles=$article&rvslots=*&rvprop=content&formatversion=2&format=json";
	$jsonString = file_get_contents($url);
	$json = json_decode($jsonString, true);
	return $json['query']['pages'][0]['revisions'][0]['slots']['main']['content'];
}

$inputTextArea = getWikitextFromEnWiki('Wikipedia:New page patrol source guide') . "\n\n" . getWikitextFromEnWiki('User:Novem Linguae/Scripts/CiteHighlighter/AllSourcesExceptNPPSG');

?><!DOCTYPE html>
<html lang="en-us">
	<head>
		<title>Cite Highlighter - NPPSG and MySources to array tool</title>
		<link rel="stylesheet" href="style.css" />
		<script type="module" src="script.js"></script>
		<meta charset="utf-8">
	</head>
	<body>
		<h1>
			Cite Highlighter - NPPSG and MySources to array tool
		</h1>
		<p>
			<textarea id="input"><?= $inputTextArea; ?></textarea>
		</p>
		<p>
			<button id="execute">Execute</button>
		</p>
		<p>
			<textarea id="output" style="white-space: unset;"></textarea>
		</p>
	</body>
</html>
