default: test
	smoosh make/build.json
test:
	jasmine-headless-webkit js -j spec/jasmine.yml -c
