Novem Linguae's Wikipedia user scripts. A user script is custom JavaScript that a logged in Wikipedia user can install, and that JS will then run on every Wikipedia page they visit. The main use case is tools for power users.

My list of user scripts onwiki is located at https://en.wikipedia.org/wiki/User:Novem_Linguae/Templates/Scripts. Please visit this page to see a description of each user script, and the # of users that have installed it.

# Files and folders

User scripts in the root directory as standalone files are simple and just use that one file.

User scripts in folders are more complex scripts usually spanning multiple files, have unit tests, and have a deploy script. These tools are all located in the folder. There may also be PHP or browser tools related to the user script.

# Linter

- Install the linter by running `npm update` from the root directory. The linter is run in CI and should always be passing before merging to the master branch. We use MediaWiki's JavaScript linting rules, with some turned off.

# Unit tests

- Install unit tests by running `npm update` in applicable subdirectories. Then run the tests with `npm test`. Unit tests are run in CI and should always be passing before merging to the master branch.

# Deploying

- For single file user scripts in the root directory, just copy paste them onwiki.
- For folders with a `deploy.js`, copy that folder's `deploy.config.example.json` to `deploy.config.json` and configure a bot password. Run `npm run deploy` from the folder and enter an edit summary when prompted. Node.js 20 or newer is required. GANReviewTool also builds its bundle before publishing.
- Set `ESBUILD_BUNDLE` to `true` when `MAIN_FILE_PATH` points to an existing esbuild bundle. In that mode the publisher uses the bundle as-is instead of combining the classes folder and main file. As of 2026, this is only applicable for GANReviewTool.

# Issues and pull requests

Issues and pull requests are both accepted. Feel free to create some.
