const { createServer } = require('node:http');
const hostname = '127.0.0.1';
const port = 3000;
const fs = require('fs');
const generate = require('./code');
const generateSrc = require('./preprocessor');

const server = createServer((req, res) => {
	console.log(req.url);
	res.statusCode = 200
	switch (req.url) {
		case '/':
			res.setHeader('Content-Type', 'file')
			res.end(fs.readFileSync('index.html'))
			break
		case '/test':
			res.end(generateSrc('testModel.json'))
			// res.end(generate())
			break
		default:
			res.statusCode = 404
			res.end(`${req.url} not found`)
			break
	}
})



server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
})