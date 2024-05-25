#!/bin/bash
# make sure Docker is running
cd mediawiki || exit
docker compose up -d
#git checkout master
#git pull
#docker compose exec mediawiki composer update
#npm ci
echo "What's the name of the extension? Capitalize it correctly please."
read -r extensionName
cd extensions || exit
git clone "ssh://novemlinguae@gerrit.wikimedia.org:29418/mediawiki/extensions/$extensionName"
docker compose exec mediawiki composer update --working-dir "extensions/$extensionName"
cd "$extensionName" || exit
npm ci
mkdir .vscode
cd .vscode || exit
touch settings.json
printf "{\n\t\"intelephense.environment.includePaths\": [\n\t\t\"../../\"\n\t]\n}\n" >> settings.json
cd ../../..
echo "wfLoadExtension( '$extensionName' );" >> LocalSettings.php
docker compose exec mediawiki composer update
docker compose exec mediawiki php maintenance/run.php update
