I added most of my Wikipedia user scripts to this GitHub to make pull requests/collaboration easier.

Keep in mind that the versions on Wikipedia may be slightly more up-to-date.

# Folders

User scripts in folders tend to contain some or all of the following:

- Unit tests (needs npm packages: Jest, Babel)
- PHP tools (meant to be run on localhost) that do something useful related to the script
- publish.php script - compiles multiple files into one file and writes it to my userspace on Wikipedia, requires a publish.config.php file though. See example file publish.config.example.php

# Unit tests

I like unit tests. Lots of Wikipedia user scripts can be broken into true functions that input 1 string (wikicode) and output 1 string (wikicode). So they are a perfect fit for unit tests. Userscripts with a lot of unit tests include GANReviewTool, DraftCleaner, and SpeciesHelper.