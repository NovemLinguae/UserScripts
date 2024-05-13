#!/bin/bash

# A script for developers to delete and recreate their localhost MediaWiki. Deletes and recreates core, extensions, and skins. Specify extensions and skins in the array below.
# This script assumes: Docker, WSL/Ubuntu, MariaDB not SQLite, installation location of MediaWiki core is ~/mediawiki, VS Code
# TODO: just use advanced patchdemo docker instead of this script? https://gitlab.wikimedia.org/samtar/patchdemo/-/commit/d0fbe70728113c29520fad280bdc5a31ee2221b3

# UPDATE THESE VARIABLES BEFORE RUNNING THE SCRIPT ************************
extensions=("PageTriage")
skins=("Vector")
sshUsername="novemlinguae"
# *************************************************************************

# docker: make sure docker engine is running
dockerStatus=$(docker --help)
if [[ $dockerStatus =~ "could not be found" ]]; then
  echo "Error: Docker is not running. Please start Docker, then try again."
  exit 1
fi

# use node version 18. wikimedia currently uses this version
export NVM_DIR=$HOME/.nvm;
source $NVM_DIR/nvm.sh;
nvm use 18

# save password for this session. will prevent shell constantly asking the user for it
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# docker: delete database (volume = mediawiki_mariadbdata)
if [ -d "$HOME/mediawiki" ]; then
  cd ~/mediawiki || exit
  docker compose down --volumes
fi

# delete files from previous installation
sudo rm -rfv ~/mediawiki

# mediawiki core: download files
# docker: download files (e.g. docker-compose.yml)
cd ~/ || exit
git clone "ssh://$sshUsername@gerrit.wikimedia.org:29418/mediawiki/core" ~/mediawiki

# docker: create .env file
cat > ~/mediawiki/.env << EOF
MW_SCRIPT_PATH=/w
MW_SERVER=http://localhost:8080
MW_DOCKER_PORT=8080
MEDIAWIKI_USER=Admin
MEDIAWIKI_PASSWORD=dockerpass
XDEBUG_ENABLE=true
XDEBUG_CONFIG='mode=debug start_with_request=yes client_host=host.docker.internal client_port=9003 idekey=VSCODE'
XDEBUG_MODE=debug,coverage
XHPROF_ENABLE=true
PHPUNIT_LOGS=0
PHPUNIT_USE_NORMAL_TABLES=1
MW_DOCKER_UID=
MW_DOCKER_GID=
EOF

# docker: create MariaDB configuration file
cat > ~/mediawiki/docker-compose.override.yml << EOF
services:
  mariadb:
    image: 'bitnami/mariadb:latest'
    volumes:
      - mariadbdata:/bitnami/mariadb
    environment:
      - MARIADB_ROOT_PASSWORD=root_password
      - MARIADB_USER=my_user
      - MARIADB_PASSWORD=my_password
      - MARIADB_DATABASE=my_database
    ports:
      - 3306:3306
volumes:
  mariadbdata:
    driver: local
EOF

# start Docker
cd ~/mediawiki || exit
docker compose up -d

# mediawiki core: install PHP dependencies
cd ~/mediawiki || exit
docker compose exec mediawiki composer update

# mediawiki core: install Node dependencies
cd ~/mediawiki || exit
npm ci

# mediawiki core: do initial database creation and initial LocalSettings.php file creation
source ~/mediawiki/.env # import .env variables. else we can't see their values
cd ~/mediawiki || exit
docker compose exec mediawiki php maintenance/run.php install --dbname=my_database --dbuser=my_user --dbpass=my_password --dbserver=mariadb --server="${MW_SERVER}" --scriptpath="${MW_SCRIPT_PATH}" --lang en --pass ${MEDIAWIKI_PASSWORD} mediawiki ${MEDIAWIKI_USER}

# mediawiki core: append some settings to LocalSettings.php configuration file
sudo tee -a ~/mediawiki/LocalSettings.php << EOL
// ***************** EXTRA SETTINGS ********************

\$wgMaxArticleSize = 2048; // default is 20, which is way too small

\$wgGroupPermissions['autoreviewer']['autopatrol'] = true; // autoreviewed
\$wgGroupPermissions['patroller']['patrol'] = true; // NPP
\$wgGroupPermissions['sysop']['autopatrol'] = false; // to better match enwiki

// let sysop group (which doesn't have userrights permission) add and remove these groups
\$wgAddGroups['sysop'][] = 'autoreviewer';
\$wgAddGroups['sysop'][] = 'patroller';
\$wgRemoveGroups['sysop'][] = 'autoreviewer';
\$wgRemoveGroups['sysop'][] = 'patroller';

\$wgShowExceptionDetails = true; // verbose error messages

// user script stuff
\$wgAllowUserJs = true;
\$wgAllowUserCss = true;
\$wgResourceLoaderValidateJS = false;

\$wgWatchlistExpiry = true;

\$wgEnableUploads = true;

\$wgDefaultSkin = "vector";

// ***************** EXTENSIONS & SKINS ********************
EOL

# make uploads directory writeable
chmod 0777 ~/mediawiki/images

# install extensions
for extensionName in "${extensions[@]}"; do
  cd ~/mediawiki/extensions || exit
  git clone "ssh://$sshUsername@gerrit.wikimedia.org:29418/mediawiki/extensions/$extensionName"
  docker compose exec mediawiki composer update --working-dir "extensions/$extensionName"
  cd "$extensionName" || exit
  npm ci
  mkdir .vscode
  cd .vscode || exit
  touch settings.json
  printf "{\n\t\"intelephense.environment.includePaths\": [\n\t\t\"../../\"\n\t]\n}\n" >> settings.json
  echo "wfLoadExtension( '$extensionName' );" | sudo tee -a ~/mediawiki/LocalSettings.php
done

# install skins
for skinName in "${skins[@]}"; do
  cd ~/mediawiki/skins || exit
  git clone "ssh://$sshUsername@gerrit.wikimedia.org:29418/mediawiki/skins/$skinName"
  docker compose exec mediawiki composer update --working-dir "skins/$skinName"
  cd "$skinName" || exit
  npm ci
  mkdir .vscode
  cd .vscode || exit
  touch settings.json
  printf "{\n\t\"intelephense.environment.includePaths\": [\n\t\t\"../../\"\n\t]\n}\n" >> settings.json
  echo "wfLoadSkin( '$skinName' );" | sudo tee -a ~/mediawiki/LocalSettings.php
done

# run database update
cd ~/mediawiki || exit
docker compose exec mediawiki php maintenance/run.php update
