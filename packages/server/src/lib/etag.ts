import { createHash } from 'node:crypto';

export function makeEtag(payload: unknown): string {
  const hash = createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
    .slice(0, 16);
  return `"${hash}"`;
}

export function setCacheHeaders(
  headers: Headers,
  etag: string,
  ttlSeconds: number,
): void {
  headers.set('ETag', etag);
  headers.set('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`);
}
