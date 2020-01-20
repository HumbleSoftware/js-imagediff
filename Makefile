default: test test-node imagediff

imagediff:
	./node_modules/.bin/smoosh make/build.json

test:
	cd spec; jasmine-headless-webkit js -j jasmine.yml -c

test-node:
	cd spec; jasmine-node .
