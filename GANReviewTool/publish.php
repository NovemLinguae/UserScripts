<?php

function apiSendAndReceive($apiData, $WIKIPEDIA_API_URL, &$cookieJar) {
	$apiData['format'] = 'json'; // always get return data in JSON format
	if ( ! isset($apiData['action']) ) {
		throw new Error('Action is required.');
	}
	$ch = curl_init();

	// always POST, never GET. 1) login requires POST. 2) edit -> text can be too long for GET
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($apiData));
	$url = $WIKIPEDIA_API_URL;

	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); // don't echo the output
	curl_setopt($ch, CURLOPT_URL, $url); // set the URL
	curl_setopt($ch, CURLOPT_USERAGENT, "[[w:User:Novem Linguae]]'s publish.php script. Concatenates .js files together and writes them to .js pages onwiki."); // set user agent

	// Use in-memory cookie handling
	if (!empty($cookieJar)) {
		curl_setopt($ch, CURLOPT_COOKIE, $cookieJar);
	}
	curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) use (&$cookieJar) {
		if (preg_match('/^Set-Cookie:\s*(.*?);/i', $header, $matches)) {
			$cookieJar .= $matches[1] . '; ';
		}
		return strlen($header);
	});

	$result = curl_exec($ch);
	curl_close($ch);
	$resultJson = json_decode($result, true);
	if ( !$resultJson || isset($resultJson['error']) ) {
		throw new Error('API returned an error message. ' . var_export($result, true));
	}
	return $resultJson;
}

function writeWikitextToWikipedia($WIKIPEDIA_API_URL, $WIKIPEDIA_USERNAME, $WIKIPEDIA_PASSWORD) {
	$cookieJar = '';

	// get login token
	$apiData = [
		'action' => 'query',
		'meta' => 'tokens',
		'type' => 'login',
	];
	$loginToken = apiSendAndReceive($apiData, $WIKIPEDIA_API_URL, $cookieJar)['query']['tokens']['logintoken'];

	// log in to Wikipedia using bot key
	$apiData = [
		'action' => 'login',
		'lgname' => $WIKIPEDIA_USERNAME,
		'lgpassword' => $WIKIPEDIA_PASSWORD,
		'lgtoken' => $loginToken,
	];
	$result = apiSendAndReceive($apiData, $WIKIPEDIA_API_URL, $cookieJar);

	// get edit token
	$apiData = [
		'action' => 'query',
		'meta' => 'tokens',
		'type' => 'csrf',
	];
	$csrfToken = apiSendAndReceive($apiData, $WIKIPEDIA_API_URL, $cookieJar)['query']['tokens']['csrftoken'];

	// make edit
	$apiData = [
		'action' => 'edit',
		'title' => $_POST['pageTitle'],
		'text' => $_POST['wikitext'],
		'summary' => $_POST['editSummary'] . " (publish.php)",
		'token' => $csrfToken,
	];
	$result = apiSendAndReceive($apiData, $WIKIPEDIA_API_URL, $cookieJar);

	// Redirect to the diff page of the successful edit
	if (isset($result['edit']['newrevid'])) {
		$revisionId = $result['edit']['newrevid'];
		$title = urlencode($_POST['pageTitle']);
		header("Location: https://en.wikipedia.org/w/index.php?title=$title&diff=prev&oldid=$revisionId");
	} else {
		echo "<h1>Edit attempted, but onwiki code already matches the code we just attempted to write</h1>";
	}
}

function generateWikitext($MAIN_FILE_PATH, $CLASSES_FOLDER_PATH) {
	$wikitext = "// === Compiled with esbuild and Novem Linguae's publish.php script ======================\n\n";

	$wikitext .= file_get_contents($MAIN_FILE_PATH);

	$wikitext = "// <nowiki>\n\n" . $wikitext . "\n\n// </nowiki>";

	return $wikitext;
}

ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once('publish.config.php');

$formIsSubmitted = $_POST['submit'] ?? '';
if ( $formIsSubmitted ) {
	$ABSOLUTE_PATH_TO_TEMP_DIRECTORY = sys_get_temp_dir();
	writeWikitextToWikipedia($WIKIPEDIA_API_URL, $WIKIPEDIA_USERNAME, $WIKIPEDIA_PASSWORD);
	die;
}

$wikitext = generateWikitext($MAIN_FILE_PATH, $CLASSES_FOLDER_PATH);

?>

<html>
	<head>
		<style>
			textarea { width:800px; height:20em; }
			input[type="text"] { width:800px; }
		</style>
	</head>
	<body>
		<form method="post">
			<p>
				Page Title:<br />
				<input type="text" name="pageTitle" value="<?php echo htmlentities($PAGE_TITLE); ?>" />
			</p>
			<p>
				Wikitext:<br />
				<textarea name="wikitext"><?php echo htmlentities($wikitext); ?></textarea>
			</p>
			<p>
				Edit Summary:<br />
				<input type="text" name="editSummary" value="" />
			</p>
			<p>
				<input type="submit" name="submit" value="Submit" />
			</p>
		</form>
	</body>
	<script>
		document.querySelector('[name="editSummary"]').focus();

		document.addEventListener('keydown', async function(event) {
			if ( event.altKey && event.shiftKey && event.key === 'S' ) {
				document.querySelector('[name="submit"]').click();
			}
		});
	</script>
</html>