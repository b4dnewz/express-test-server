// @ts-ignore
import got from "got";
import * as querystring from "querystring";
import createTestServer from "../src";

describe("Express Test Server", () => {

  it("export is a function", () => {
    expect(typeof createTestServer).toBe("function");
  });

  it("function returns a Promise", (done) => {
    const server = createTestServer();
    expect(server instanceof Promise);
    server.then((s) => {
      return s.close();
    }).then(() => done());
  });

  describe("execution", () => {
    let server;

    beforeAll(async () => {
      server = await createTestServer();
    });

    afterAll(async () => {
      await server.close();
    });

    it("expose useful properties", () => {
      expect(typeof server.port === "number").toBeTruthy();
      expect(typeof server.url === "string").toBeTruthy();
      expect(typeof server.listen === "function").toBeTruthy();
      expect(typeof server.close === "function").toBeTruthy();
    });

    it("wxpose raw http server", () => {
      expect(server.http.listening).toBeTruthy();
    });

    it("can be stopped and restarted", async () => {
      server.get("/foo", (req, res) => {
        res.send("bar");
      });

      const { body } = await got(server.url + "/foo");
      expect(body).toEqual("bar");

      const closedUrl = server.url;
      await server.close();

      await got(closedUrl + "/foo", { timeout: 100 }).catch((err) => {
        expect(err.code).toEqual("ECONNREFUSED");
      });

      await server.listen();

      const { body: bodyRestarted } = await got(server.url + "/foo");
      expect(bodyRestarted).toEqual("bar");
    });

    it("uses a new port on each listen", async () => {
      const origPort = server.port;
      await server.close();
      await server.listen();

      expect(origPort).not.toEqual(server.port);
    });

    it("automatically parses JSON request body", async () => {
      const object = { foo: "bar" };

      server.post("/json", (req, res) => {
        expect(req.body).toEqual(object);
        res.end();
      });

      await got(server.url + "/json", {
        body: JSON.stringify(object),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
    });

    it("automatically parses text request body", async () => {
      const text = "foo";

      server.post("/text", (req, res) => {
        expect(req.body).toEqual(text);
        res.end();
      });

      await got(server.url + "/text", {
        body: text,
        headers: { "content-type": "text/plain" },
        method: "POST",
      });
    });

    it("automatically parses URL-encoded form request body", async () => {
      const object = { foo: "bar" };

      server.post("/encoded", (req, res) => {
        expect(req.body).toEqual(object);
        res.end();
      });

      await got(server.url + "/encoded", {
        body: querystring.stringify(object),
        headers: { "content-type": "application/x-www-form-urlencoded" },
        method: "POST",
      });
    });

    it("automatically parses binary request body", async () => {
      const buffer = Buffer.from("foo");

      server.post("/binary", (req, res) => {
        expect(req.body).toEqual(buffer);
        res.end();
      });

      await got(server.url + "/binary", {
        body: buffer,
        headers: { "content-type": "application/octet-stream" },
        method: "POST",
      });
    });

    it("support returning body directly", async () => {
      server.get("/foo", () => "bar");
      server.get("/bar", () => ({ foo: "bar" }));
      server.get("/async", () => Promise.resolve("bar"));

      const bodyString = (await got(server.url + "/foo")).body;
      const bodyJson = (await got(server.url + "/bar", { json: true })).body;
      const bodyAsync = (await got(server.url + "/async")).body;
      expect(bodyString).toEqual("bar");
      expect(bodyJson).toEqual({ foo: "bar" });
      expect(bodyAsync).toEqual("bar");
    });

    it("support returning body directly without wrapping in function", async () => {
      server.get("/foo", "bar");
      server.get("/bar", ({ foo: "bar" }));
      server.get("/async", Promise.resolve("bar"));

      const bodyString = (await got(server.url + "/foo")).body;
      const bodyJson = (await got(server.url + "/bar", { json: true })).body;
      const bodyAsync = (await got(server.url + "/async")).body;
      expect(bodyString).toEqual("bar");
      expect(bodyJson).toEqual({ foo: "bar" });
      expect(bodyAsync).toEqual("bar");
    });

    it("accepts multiple callbacks in .get()", async () => {
      server.get("/foo", (req, res, next) => {
        res.set("foo", "bar");
        next();
      }, (req, res) => res.get("foo"));

      const { body } = await got(server.url + "/foo");
      expect(body).toEqual("bar");
    });

    it("accepts multiple callbacks in .post()", async () => {
      server.post("/foo", (req, res, next) => {
        res.set("foo", "bar");
        next();
      }, (req, res) => res.get("foo"));

      const { body } = await got(server.url + "/foo", {method: "POST"});
      expect(body).toEqual("bar");
    });

    it("accepts multiple callbacks in .put()", async () => {
      server.put("/foo", (req, res, next) => {
        res.set("foo", "bar");
        next();
      }, (req, res) => res.get("foo"));

      const { body } = await got(server.url + "/foo", {method: "PUT"});
      expect(body).toEqual("bar");
    });

    it("accepts multiple callbacks in .patch()", async () => {
      server.patch("/foo", (req, res, next) => {
        res.set("foo", "bar");
        next();
      }, (req, res) => res.get("foo"));

      const { body } = await got(server.url + "/foo", {method: "PATCH"});
      expect(body).toEqual("bar");
    });

    it("accepts multiple callbacks in .delete()", async () => {
      server.delete("/foo", (req, res, next) => {
        res.set("foo", "bar");
        next();
      }, (req, res) => res.get("foo"));

      const { body } = await got(server.url + "/foo", {method: "DELETE"});
      expect(body).toEqual("bar");
    });
  });

  describe("ssl server", () => {
    let server;

    beforeAll(async () => {
      server = await createTestServer({
        certificate: true,
      });
    });

    afterAll(async () => {
      await server.close();
    });

    it("expose useful properties", () => {
      expect(typeof server.sslPort === "number").toBeTruthy();
      expect(typeof server.sslUrl === "string").toBeTruthy();
      expect(typeof server.caCert === "string").toBeTruthy();
    });

    it("expose raw https server", () => {
      expect(server.https.listening).toBeTruthy();
    });

    it("listens for SSL traffic", async () => {
      server.get("/foo", (req, res) => {
        res.send("bar");
      });

      const { body } = await got(server.sslUrl + "/foo", { rejectUnauthorized: false });
      expect(body).toEqual("bar");
    });
  });

  describe("options", () => {
    it("if certificate is falsy server wont create ssl", async () => {
      const server = await createTestServer({
        certificate: false,
      });

      expect(typeof server.sslPort === "undefined").toBeTruthy();
      expect(typeof server.sslUrl === "undefined").toBeTruthy();
      expect(typeof server.caCert === "undefined").toBeTruthy();

      await server.close();
    });

    it("certificate option is passed through to createCert()", async () => {
      const server = await createTestServer({ certificate: "foo.bar" });

      server.get("/foo", (req, res) => {
        res.send("bar");
      });

      const { body } = await got(server.sslUrl + "/foo", {
        ca: server.caCert,
        headers: { host: "foo.bar" },
      });
      expect(body).toEqual("bar");

      await server.close();
    });

    it("if bodyParser is false body parsing middleware is disabled", async () => {
      const server = await createTestServer({ bodyParser: false });
      const text = "foo";

      server.post("/echo", (req, res) => {
        expect(req.body).toEqual(undefined);
        res.end();
      });

      await got(server.url + "/echo", {
        body: text,
        headers: { "content-type": "text/plain" },
        method: "POST",
      });

      await server.close();
    });

    it("bodyParser is passed through to bodyParser", async () => {
      const smallServer = await createTestServer({ bodyParser: { limit: "100kb" } });
      const bigServer = await createTestServer({ bodyParser: { limit: "200kb" } });
      const buf = Buffer.alloc(150 * 1024);

      // Custom error handler so we don't dump the stack trace in the test output
      smallServer.use((err, req, res, next) => {
        res.status(500).end();
      });

      smallServer.post("/", (req, res) => {
        throw new Error("Failed");
        res.end();
      });

      bigServer.post("/", (req, res) => {
        expect(req.body.length === buf.length).toBeTruthy();
        res.end();
      });

      await expect(got(smallServer.url, {
        body: buf,
        headers: { "content-type": "application/octet-stream" },
        method: "POST",
      })).rejects.toThrow();

      await expect(got(bigServer.url, {
        body: buf,
        headers: { "content-type": "application/octet-stream" },
        method: "POST",
      })).resolves.not.toThrow();

      await smallServer.close();
      await bigServer.close();
    });
  });
});
