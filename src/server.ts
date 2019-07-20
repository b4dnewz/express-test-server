import bodyParser from "body-parser";
import { CertificateKeys } from "create-cert";
import {Application, default as express} from "express";
import { PathParams } from "express-serve-static-core";
import http from "http";
import https from "https";
import { AddressInfo } from "net";
import { promisify } from "util";

export interface ServerOptions {
  bodyParser?: boolean | bodyParser.Options;
  listen?: boolean;
}

export interface ExpressTestServer extends Pick<
  Application,
  Exclude<keyof Application, "listen" | "close">
> {
  (req: Request | http.IncomingMessage, res: Response | http.ServerResponse): any;

  http: http.Server;
  https?: https.Server;
  port?: number;
  url?: string;
  caCert?: string;
  sslPort?: number;
  sslUrl?: string;

  listen(): Promise<void[]>;
  close(): Promise<void[]>;
}

// Custom send method that optionally call user defined handler
const send = (fn?: any) => {
  return (req, res, next) => {
    const cb = typeof fn === "function" ? fn(req, res, next) : fn;

    Promise.resolve(cb).then((val) => {
      if (val) {
        res.send(val);
      }
    });
  };
};

// List of application methods to override
const methods = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
];

export function createServer(keys: null | CertificateKeys, options: ServerOptions): Promise<ExpressTestServer> {

  options = {
    listen: true,
    ...options,
  };

  const server: ExpressTestServer = express() as any;
  server.http = http.createServer(server);

  // Setup https server
  if (keys) {
    server.https = https.createServer(keys, server);
    server.caCert = keys.caCert;
  }

  // Disable requests caching
  server.disable("etag");

  // Setup application body parsers
  if (options.bodyParser !== false) {
    options.bodyParser = typeof options.bodyParser === "boolean" ? {
      limit: "1mb",
    } : {
        limit: "1mb",
        ...options.bodyParser,
      };

    server.use(bodyParser.json({
      ...options.bodyParser,
      type: "application/json",
    }));

    server.use(bodyParser.text({
      ...options.bodyParser,
      type: "text/plain",
    }));

    server.use(bodyParser.urlencoded({
      ...options.bodyParser,
      extended: true,
      type: "application/x-www-form-urlencoded",
    }));

    server.use(bodyParser.raw({
      ...options.bodyParser,
      type: "application/octet-stream",
    }));
  }

  // Rewrite application routing methods
  methods.forEach((method) => {
    const fn = server[method].bind(server);
    server[method] = (path: PathParams, ...handlers: any[]) => {
      for (const handler of handlers) {
        fn(path, send(handler));
      }
    };
  });

  // Override listen method
  server.listen = () => {
    const promises = [
      promisify(server.http.listen.bind(server.http))().then(() => {
        server.port = (server.http.address() as AddressInfo).port;
        server.url = `http://localhost:${server.port}`;
      }),
    ];
    if (server.https) {
      promises.push(
        promisify(server.https.listen.bind(server.https))().then(() => {
          server.sslPort = (server.https.address() as AddressInfo).port;
          server.sslUrl = `https://localhost:${server.sslPort}`;
        }),
      );
    }
    return Promise.all(promises);
  };

  // Override server close method
  server.close = () => {
    const promises = [
      promisify(server.http.close.bind(server.http))().then(() => {
        server.port = undefined;
        server.url = undefined;
      }),
    ];
    if (server.https) {
      promises.push(
        promisify(server.https.close.bind(server.https))().then(() => {
          server.sslPort = undefined;
          server.sslUrl = undefined;
        }),
      );
    }
    return Promise.all(promises);
  };

  if (!options.listen) {
    return Promise.resolve(server);
  }

  return server.listen().then(() => server);

}
