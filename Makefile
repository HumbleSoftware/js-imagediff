default: test test-node imagediff

imagediff:
	./node_modules/.bin/smoosh make/build.json

test:
	npm run test
