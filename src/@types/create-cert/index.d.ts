declare module "create-cert" {
  export interface CertificateKeys {
    key: string;
    cert: string;
    caCert: string;
  }

  export interface CertificateOptions {
    days?: number;
    commonName?: string;
  }

  export default function createCert(opts: string|CertificateOptions): Promise<CertificateKeys>;
}
