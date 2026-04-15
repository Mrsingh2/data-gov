import * as crypto from 'crypto';

const SALT = process.env.ANONYMIZE_SALT || 'data-gov-salt-2024';

export function applyAnonymize(value: any): string {
  if (value === null || value === undefined) return null;
  const hash = crypto
    .createHmac('sha256', SALT)
    .update(String(value))
    .digest('hex')
    .substring(0, 12);
  return `anon_${hash}`;
}
