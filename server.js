const http = require('http');
const fs   = require('fs');
const path = require('path');

const BASE = __dirname;
const PORT = 8000;

const MIME = {
  '.html'    : 'text/html; charset=utf-8',
  '.js'      : 'text/javascript',
  '.css'     : 'text/css',
  '.json'    : 'application/json',
  '.geojson' : 'application/geo+json',
  '.pmtiles' : 'application/octet-stream',
  '.csv'     : 'text/csv',
  '.png'     : 'image/png',
  '.jpg'     : 'image/jpeg',
  '.ico'     : 'image/x-icon',
};

http.createServer(function (req, res) {
  var url      = req.url.split('?')[0];
  var filePath = path.join(BASE, url === '/' ? 'index.html' : url);

  fs.stat(filePath, function (err, stat) {
    if (err || stat.isDirectory()) {
      res.writeHead(404); res.end('Not found'); return;
    }

    var ext      = path.extname(filePath).toLowerCase();
    var mime     = MIME[ext] || 'application/octet-stream';
    var total    = stat.size;
    var range    = req.headers['range'];

    if (range) {
      // Parse "bytes=start-end"
      var m     = range.match(/bytes=(\d+)-(\d*)/);
      var start = parseInt(m[1], 10);
      var end   = m[2] ? parseInt(m[2], 10) : total - 1;
      end       = Math.min(end, total - 1);
      var chunk = end - start + 1;

      res.writeHead(206, {
        'Content-Type'   : mime,
        'Content-Range'  : 'bytes ' + start + '-' + end + '/' + total,
        'Accept-Ranges'  : 'bytes',
        'Content-Length' : chunk,
      });
      fs.createReadStream(filePath, { start: start, end: end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Type'   : mime,
        'Content-Length' : total,
        'Accept-Ranges'  : 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
}).listen(PORT, function () {
  console.log('');
  console.log('  Grid Dashboard  →  http://localhost:' + PORT);
  console.log('');
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});
