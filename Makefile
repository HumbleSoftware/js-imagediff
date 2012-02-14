default: test
	smoosh make/build.json
test:
	cd spec; jasmine-headless-webkit js -j jasmine.yml -c
