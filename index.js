const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = 'localhost';
const port = 3000;
const dbFilePath = 'db.txt';

function handleCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

const server = http.createServer((req, res) => {
  if (handleCors(req, res)) {
    return;
  }

  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  }[extname] || 'application/octet-stream';

  if (req.method === 'GET' && filePath === './db') {
    fs.readFile(dbFilePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('500 Internal Server Error: ' + err.code);
      } else {
        const messages = data.trim().split('\n').map(message => {
          const [timestamp, content] = message.split('|').map(str => str.trim());
          return { timestamp, content };
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(messages));
      }
    });
  } else if (req.method === 'GET') {
    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code == 'ENOENT') {
          fs.readFile('./404.html', (err, content) => {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          });
        } else {
          res.writeHead(500);
          res.end('500 Internal Server Error: ' + err.code);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  } else if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const newMessage = JSON.parse(body).message;

      fs.readFile(dbFilePath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(500);
          res.end('500 Internal Server Error: ' + err.code);
        } else {
          let messages = data.trim().split('\n');
          messages.push(`${new Date().toLocaleString()} | ${newMessage} |`);
          const newData = messages.join('\n');

          fs.writeFile(dbFilePath, newData, 'utf8', err => {
            if (err) {
              res.writeHead(500);
              res.end('500 Internal Server Error: ' + err.code);
            } else {
              res.writeHead(200);
              res.end('Message saved successfully');
            }
          });
        }
      });
    });
  } else {
    res.writeHead(405);
    res.end('405 Method Not Allowed');
  }
});

server.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}/`);
});