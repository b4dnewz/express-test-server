import { CertificateOptions, default as createCert } from "create-cert";
import { createServer, ExpressTestServer, ServerOptions } from "./server";

export interface TestServerOptions extends ServerOptions {
  certificate?: boolean | string | CertificateOptions;
}

export default function(opts: TestServerOptions = {
  bodyParser: true,
  certificate: false,
}): Promise<ExpressTestServer> {
  if (!opts.certificate) {
    return createServer(null, opts);
  }

  opts.certificate = opts.certificate === true ? {} : opts.certificate;
  return createCert(opts.certificate)
    .then((keys) => createServer(keys, opts));
}
