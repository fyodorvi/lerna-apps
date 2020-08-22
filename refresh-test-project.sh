set -e -x

NR=`date "+%s"`
yarn pack --filename lerna-apps$NR.tgz
cd ./sample-project
yarn remove lerna-apps || true
yarn add ../lerna-apps$NR.tgz
cd ../
rm lerna-apps$NR.tgz
