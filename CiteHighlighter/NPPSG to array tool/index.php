<?php

/**
 * Can't use JavaScript to grab content from third party websites. Have to use PHP instead.
 */
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
			Automatically loads the contents of <a href="https://en.wikipedia.org/wiki/Wikipedia:New_page_patrol_source_guide" target="_blank">Wikipedia:New page patrol source guide</a> and <a href="https://en.wikipedia.org/wiki/User:Novem_Linguae/Scripts/CiteHighlighter/AllSourcesExceptNPPSG" target="_blank">User:Novem Linguae/Scripts/CiteHighlighter/AllSourcesExceptNPPSG</a>, then parses it into JSON below. There are also some hard-coded domains and changes in this tool's Javascript logic.
		</p>
		<p style="display:none;">
			<textarea id="input"><?= $inputTextArea; ?></textarea>
		</p>
		<p style="display:none;">
			<button id="execute">Execute</button>
		</p>
		<p>
			<textarea id="output" style="white-space: unset;"></textarea>
		</p>
		<p>
			<a href="https://en.wikipedia.org/w/index.php?title=User:Novem_Linguae/Scripts/CiteHighlighter/SourcesJSON.js&action=edit" target="_blank">Click here</a> to open the page where this JSON needs to be copy pasted to on wiki.
		</p>
		<p>
			<a href="https://en.wikipedia.org/wiki/User:Novem_Linguae/Scripts/CiteHighlighter/testcases" target="_blank">Click here</a> to load the testcases page.
		</p>
	</body>
</html>
