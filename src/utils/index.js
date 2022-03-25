import crypto from 'crypto';

export function hash (text) {
  return crypto.createHash('md5', '').update(text).digest('hex');
}
