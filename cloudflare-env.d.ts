declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    ACCOUNT_PEPPER?: string;
    BUCKET?: R2Bucket;
  }
}
declare module 'cloudflare:workers' { export const env: Cloudflare.Env; }
