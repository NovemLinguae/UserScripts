Novem Linguae's Wikipedia user scripts. A user script is custom JavaScript that a logged in Wikipedia user can install, and that JS will then run on every Wikipedia page they visit. The main use case is tools for power users.

My list of user scripts onwiki is located at https://en.wikipedia.org/wiki/User:Novem_Linguae/Templates/Scripts. Please visit this page to see a description of each user script, and the # of users that have installed it.

# Files and folders

User scripts in the root directory as standalone files are simple and just use that one file.

User scripts in folders are more complex scripts usually spanning multiple files, have unit tests, and have a deploy script. These tools are all located in the folder. There may also be PHP or browser tools related to the user script.

# Linter

- Install the linter by running `npm update` from the root directory. The linter is not run in CI, and is mainly for your IDE.

# Unit tests

- Install unit tests by running `npm update` in applicable subdirectories. Then run the tests with `npm test`. Unit tests are run in CI and should always be passing before merging to the master branch.

# Deploying

- For single file user scripts in the root directory, just copy paste them onwiki.
- For folders, spin up a PHP localhost, create a publish.config.php file in that folder (see publish.config.example.php as an example), then in browser visit that folder's publish.php file. Then you can click a button to deploy.

# Issues and pull requests

Issues and pull requests are both accepted. Feel free to create some.
