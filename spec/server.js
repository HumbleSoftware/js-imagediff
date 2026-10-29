// Static file server for the browser specs.
// Usage: node spec/server.js, then open http://localhost:8085/spec/
var http = require('http');
var fs = require('fs');
var path = require('path');

var root = path.resolve(__dirname, '..');
var port = Number(process.env.PORT) || 8085;
var types = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

http.createServer(function (request, response) {
  var pathname = decodeURIComponent(request.url.split('?')[0]);
  if (pathname.slice(-1) === '/') { pathname += 'index.html'; }
  var file = path.join(root, pathname);

  if (file.indexOf(root + path.sep) !== 0) {
    response.writeHead(403);
    return response.end();
  }

  fs.readFile(file, function (error, data) {
    if (error) {
      response.writeHead(404);
      return response.end('Not found');
    }
    response.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream'
    });
    response.end(data);
  });
}).listen(port, function () {
  console.log('Specs: http://localhost:' + port + '/spec/');
});
