# express-test-server

> A minimal but customizable Express server for testing

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]

Typescript based preconfigured Express application intended for quick testing requests and responses, it can can be customized to listen for HTTP and HTTPS traffic and alter the default body parser behavior.

The following `Content-Type` headers will be parsed and exposed via `req.body`:

- JSON (`application/json`)
- Text (`text/plain`)
- URL-Encoded (`application/x-www-form-urlencoded`)
- Buffer (`application/octet-stream`)


## Installation

```
npm install --save-dev @b4dnewz/express-test-server
```

## Getting started

```js
import createServer from "@b4dnewz/express-test-server"

const server = await createServer({
  // server options
});

// Express route handler
server.get('/foo', (req, res) => {
  res.send('bar');
});

// Express alternative route handlers
server.get('/bar', () => 'foo');
server.get('/baz', 'foo');
```

## Perfect for testing

```js

import createServer from "@b4dnewz/express-test-server"

let server;

beforeAll(async () => {
  server = await createServer();
});

afterAll(async () => {
  await server.close();
});

it("respond to get requests", async () => {
  sever.get("/foo", "bar")
  const {body} = await got(`${server.url}/foo`)
  expect(body).toEqual("bar")
})
```

## Options

__port__ (default 0)  
Specify a custom port for the HTTP server instance, otherwise it will automatically choose a random free TCP port

```js
await createServer({
  port: 8888
})
```

__sslPort__ (default _443_)  
Specify a custom port for the HTTPS server instance, otherwise it will try to default ssl port

```js
await createServer({
  sslPort: 4443
})
```

__hostname__ (default _localhost_)  
Specify a custom hostname for both HTTP and HTTPS servers, remember that you need a resolvable DNS host name for this to work.

```js
await createServer({
  hostname: "0.0.0.0"
})

await createServer({
  hostname: "test.example.com"
})
```

__listen__ (default _true_)  
If false will prevent the test server to automatically start to listen for requests when instanciated.

```js
const server = await createServer({
  listen: false
})

// listen later on a desired port
await server.listen({
  port: 8888
})
```

## License

MIT

[npm-image]: https://badge.fury.io/js/%40b4dnewz%2Fexpress-test-server.svg
[npm-url]: https://npmjs.org/package/@b4dnewz/express-test-server
[travis-image]: https://travis-ci.org/b4dnewz/express-test-server.svg?branch=master
[travis-url]: https://travis-ci.org/b4dnewz/express-test-server
[daviddm-image]: https://david-dm.org/b4dnewz/express-test-server.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/b4dnewz/express-test-server
[coveralls-image]: https://coveralls.io/repos/b4dnewz/express-test-server/badge.svg
[coveralls-url]: https://coveralls.io/r/b4dnewz/express-test-server
