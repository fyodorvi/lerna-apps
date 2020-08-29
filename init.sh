cd tests
rm -rf .lerna-source
git clone https://github.com/lerna/lerna.git .lerna-source
cd .lerna-source
git checkout tags/v3.22.1
find . -maxdepth 1 ! -iname helpers ! -iname core -exec rm -rf {} \;
