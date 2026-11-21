// RN-safe ASCII base64 encoder for HTTP Basic auth. React Native has no Node
// Buffer and no browser btoa, so encode the string's byte values directly.
const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const PAD = '=';

/**
 * Base64-encode an ASCII string (e.g. "clientId:clientSecret").
 * Non-ASCII code points are truncated to their low byte; Basic credentials
 * are expected to be ASCII.
 */
export function encodeBase64(input: string): string {
  let output = '';
  let index = 0;

  while (index < input.length) {
    const b1 = input.charCodeAt(index++) & 0xff;
    const b2 = index < input.length ? input.charCodeAt(index++) & 0xff : -1;
    const b3 = index < input.length ? input.charCodeAt(index++) & 0xff : -1;

    output += ALPHABET[b1 >> 2];
    output += ALPHABET[((b1 & 0x03) << 4) | (b2 < 0 ? 0 : b2 >> 4)];
    output +=
      b2 < 0 ? PAD : ALPHABET[((b2 & 0x0f) << 2) | (b3 < 0 ? 0 : b3 >> 6)];
    output += b3 < 0 ? PAD : ALPHABET[b3 & 0x3f];
  }

  return output;
}
