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
  var url = request.url.split('?');
  var pathname;
  try {
    pathname = decodeURIComponent(url[0]);
  } catch (e) {
    response.writeHead(400);
    return response.end('Bad request');
  }
  if (pathname.slice(-1) === '/') { pathname += 'index.html'; }
  var file = path.join(root, pathname);

  if (file.indexOf(root + path.sep) !== 0) {
    response.writeHead(403);
    return response.end();
  }

  fs.readFile(file, function (error, data) {
    if (error && error.code === 'EISDIR') {
      // Redirect directories to their trailing-slash URL (/spec -> /spec/).
      response.writeHead(301, {
        Location: url[0] + '/' + (url.length > 1 ? '?' + url.slice(1).join('?') : '')
      });
      return response.end();
    }
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
