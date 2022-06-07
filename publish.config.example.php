<?php

// File should be named publish.config.php and placed in same directory as publish.php
// Run it on localhost with XAMPP or something

$WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';
$PAGE_TITLE = 'User:Novem Linguae/Scripts/SpeciesHelper.js';
$MAIN_FILE_PATH = 'main.js';
$CLASSES_FOLDER_PATH = 'modules/';

// Create at Special:BotPasswords. Assign needed permissions such as ['Edit existing pages', 'Edit your user CSS/JSON/JavaScript', 'Create, edit, and move pages']
// FYI. If you change your main account password, you will have to change all your bot passwords.
$WIKIPEDIA_USERNAME = 'Novem Linguae@publish.php';
$WIKIPEDIA_PASSWORD = 'token goes here';