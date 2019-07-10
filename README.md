# express-test-server

> A minimal but customizable Express server for testing

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

## License

MIT
