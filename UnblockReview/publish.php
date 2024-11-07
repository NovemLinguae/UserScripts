<?php

function apiSendAndReceive($apiData, $WIKIPEDIA_API_URL, $ABSOLUTE_PATH_TO_TEMP_DIRECTORY) {
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
	curl_setopt($ch, CURLOPT_COOKIEJAR, $ABSOLUTE_PATH_TO_TEMP_DIRECTORY . '\\cookie.txt');
	curl_setopt($ch, CURLOPT_COOKIEFILE, $ABSOLUTE_PATH_TO_TEMP_DIRECTORY . '\\cookie.txt');
	$result = curl_exec($ch);
	curl_close($ch);
	$result = json_decode($result, true);
	if ( isset($result['error']) ) {
		throw new Error('API returned an error message. ' . var_export($result['error'], true));
	}
	return $result;
}

function deleteImportStatements($str) {
	return preg_replace('/import .*\n/m', '', $str);
}

function deleteExportStatements($str) {
	return preg_replace('/^export /m', '', $str);
}

function deleteNoWikiTags($str) {
	$str = preg_replace('/<nowiki>/', '', $str);
	$str = preg_replace('/<\/nowiki>/', '', $str);
	return $str;
}

function deleteRequireFunctions($str) {
	return preg_replace('/^.*require\(.*$\n/m', '', $str);
}

function writeWikitextToWikipedia($ABSOLUTE_PATH_TO_TEMP_DIRECTORY, $WIKIPEDIA_API_URL, $WIKIPEDIA_USERNAME, $WIKIPEDIA_PASSWORD) {
	// clear cookies from last session
	$file = fopen($ABSOLUTE_PATH_TO_TEMP_DIRECTORY . '\\cookie.txt', 'w') or die('Unable to open file!');
	fwrite($file, '');
	fclose($file);

	// get login token
	$apiData = [
		'action' => 'query',
		'meta' => 'tokens',
		'type' => 'login',
	];
	$loginToken = apiSendAndReceive($apiData, $WIKIPEDIA_API_URL, $ABSOLUTE_PATH_TO_TEMP_DIRECTORY)['query']['tokens']['logintoken'];

	// log in to Wikipedia using bot key
	$apiData = [
		'action' => 'login',
		'lgname' => $WIKIPEDIA_USERNAME,
		'lgpassword' => $WIKIPEDIA_PASSWORD,
		'lgtoken' => $loginToken,
	];
	$result = apiSendAndReceive($apiData, $WIKIPEDIA_API_URL, $ABSOLUTE_PATH_TO_TEMP_DIRECTORY);

	// get edit token
	$apiData = [
		'action' => 'query',
		'meta' => 'tokens',
		'type' => 'csrf',
	];
	$csrfToken = apiSendAndReceive($apiData, $WIKIPEDIA_API_URL, $ABSOLUTE_PATH_TO_TEMP_DIRECTORY)['query']['tokens']['csrftoken'];

	// make edit
	$apiData = [
		'action' => 'edit',
		'title' => $_POST['pageTitle'],
		'text' => $_POST['wikitext'],
		'summary' => $_POST['editSummary'] . " (publish.php)",
		'token' => $csrfToken,
	];
	$result = apiSendAndReceive($apiData, $WIKIPEDIA_API_URL, $ABSOLUTE_PATH_TO_TEMP_DIRECTORY);

	echo "<h1>Success</h1>";
}

function generateWikitext($MAIN_FILE_PATH, $CLASSES_FOLDER_PATH) {
	$wikitext = "// === Compiled with Novem Linguae's publish.php script ======================\n\n";
	$wikitext .= "$(async function() {\n\n// === $MAIN_FILE_PATH ======================================================\n\n";

	$wikitext .= file_get_contents($MAIN_FILE_PATH);

	$files = scandir($CLASSES_FOLDER_PATH);
	foreach ( $files as $fileName ) {
		if ( $fileName === '.' ) {
			continue;
		}
		if ( $fileName === '..' ) {
			continue;
		}
		$path = $CLASSES_FOLDER_PATH . $fileName;
		$classText = file_get_contents($path);
		$wikitext .= "\n\n// === $path ======================================================\n\n" . $classText;
	}

	$wikitext .= "\n\n});";

	$wikitext = deleteNoWikiTags($wikitext);
	$wikitext = deleteImportStatements($wikitext);
	$wikitext = deleteExportStatements($wikitext);
	$wikitext = deleteRequireFunctions($wikitext);

	$wikitext = "// <nowiki>\n\n" . $wikitext . "\n\n// </nowiki>";

	return $wikitext;
}

ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once('publish.config.php');

$formIsSubmitted = $_POST['submit'] ?? '';
if ( $formIsSubmitted ) {
	$ABSOLUTE_PATH_TO_TEMP_DIRECTORY = sys_get_temp_dir();
	writeWikitextToWikipedia($ABSOLUTE_PATH_TO_TEMP_DIRECTORY, $WIKIPEDIA_API_URL, $WIKIPEDIA_USERNAME, $WIKIPEDIA_PASSWORD);
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