import { bytesToHex } from '@noble/hashes/utils.js';
import { falcon512 } from '../lib/engine/noble/falcon';
import { N, Q } from '../lib/s2morrow/constants';
import {
  decodePublicKey,
  decodeSecretKey,
  encodePublicKey,
  encodeSecretKey,
  exportFalconRsSecretKey,
  generateKeyPair,
  getPublicKey,
  getPackedPublicKey,
  importFalconRsSecretKey,
  publicKeyToNtt,
  toBytes,
} from '../lib/s2morrow/keys';
import { loadFalconRsFixture } from './helpers/falconRsFixture';

const fixture = loadFalconRsFixture();

describe('NIST key codecs, cross-checked with noble', () => {
  const pairs = [0, 1, 2].map(() => falcon512.keygen());

  test('secret key decode then encode is byte-exact', () => {
    for (const { secretKey } of pairs) {
      expect(bytesToHex(encodeSecretKey(decodeSecretKey(secretKey)))).toBe(bytesToHex(secretKey));
    }
  });

  test('getPublicKey equals the public key produced by noble', () => {
    for (const { secretKey, publicKey } of pairs) {
      expect(bytesToHex(getPublicKey(secretKey))).toBe(bytesToHex(publicKey));
    }
  });

  test('public key decode then encode is byte-exact, coefficients < q', () => {
    for (const { publicKey } of pairs) {
      const h = decodePublicKey(publicKey);
      expect(Array.from(h).every((v) => v < Q)).toBe(true);
      expect(bytesToHex(encodePublicKey(h))).toBe(bytesToHex(publicKey));
    }
  });

  test('decodeSecretKey returns the four NTRU polynomials', () => {
    const { f, g, F, G } = decodeSecretKey(pairs[0].secretKey);
    expect([f.length, g.length, F.length, G.length]).toEqual([N, N, N, N]);
  });
});

describe('secret key validation', () => {
  const { secretKey } = falcon512.keygen();

  test('rejects a wrong length or header', () => {
    expect(() => decodeSecretKey(secretKey.slice(1))).toThrow('1281 bytes');
    const bad = secretKey.slice();
    bad[0] = 0x58;
    expect(() => decodeSecretKey(bad)).toThrow('header');
  });

  test('rejects the forbidden coefficient -32 in f', () => {
    const bad = secretKey.slice();
    bad[1] = 0x80 | (bad[1] & 0x03);
    expect(() => decodeSecretKey(bad)).toThrow('forbidden');
  });

  test('rejects a tampered F (the recomputed G is out of range)', () => {
    const bad = secretKey.slice();
    bad[769] = (bad[769] + 1) & 0xff;
    expect(() => decodeSecretKey(bad)).toThrow('Falcon512: invalid secret key');
  });

  test('rejects a negated F, which only the NTRU equation check catches', () => {
    const { f, g, F } = decodeSecretKey(secretKey);
    const bad = encodeSecretKey({ f, g, F: Int8Array.from(F, (v) => -v) });
    expect(() => decodeSecretKey(bad)).toThrow('NTRU equation not satisfied');
  });

  test('accepts hex strings with or without 0x, in any case, and rejects bad hex', () => {
    const hex = bytesToHex(secretKey);
    const expected = bytesToHex(getPublicKey(secretKey));
    expect(bytesToHex(getPublicKey('0x' + hex))).toBe(expected);
    expect(bytesToHex(getPublicKey(hex))).toBe(expected);
    expect(bytesToHex(getPublicKey(hex.toUpperCase()))).toBe(expected);
    expect(() => getPublicKey('0x' + hex.slice(0, -1))).toThrow('hex');
    expect(() => getPublicKey('0x' + hex.slice(0, -2))).toThrow('1281 bytes');
    expect(() => getPublicKey('0xzz' + hex.slice(2))).toThrow('hex');
  });

  test('toBytes copies its input', () => {
    const source = new Uint8Array([1, 2, 3]);
    const copy = toBytes(source, 3, 'x');
    source[0] = 9;
    expect(copy[0]).toBe(1);
  });
});

describe('public key validation', () => {
  const { publicKey } = falcon512.keygen();

  test('rejects a wrong length or header', () => {
    expect(() => decodePublicKey(publicKey.slice(1))).toThrow('897 bytes');
    const bad = publicKey.slice();
    bad[0] = 0x0a;
    expect(() => decodePublicKey(bad)).toThrow('header');
  });

  test('rejects a coefficient >= q', () => {
    const bad = publicKey.slice();
    bad[1] = 0xff;
    bad[2] |= 0xfc;
    expect(() => decodePublicKey(bad)).toThrow('out of range');
  });
});

describe('generateKeyPair', () => {
  test('returns NIST lengths', () => {
    const kp = generateKeyPair();
    expect(kp.secretKey).toHaveLength(1281);
    expect(kp.publicKey).toHaveLength(897);
  });

  test('is deterministic for a 48-byte seed', () => {
    const seed = new Uint8Array(48).fill(5);
    expect(bytesToHex(generateKeyPair(seed).secretKey)).toBe(bytesToHex(generateKeyPair(seed).secretKey));
  });

  test('rejects a seed that is not 48 bytes', () => {
    expect(() => generateKeyPair(new Uint8Array(32))).toThrow('48 bytes');
  });
});

describe('falcon-rs key format (reference data generated with the falcon-rs WASM)', () => {
  test('import then export gives back the falcon-rs bytes', () => {
    const nist = importFalconRsSecretKey(fixture.secretKey);
    expect(nist).toHaveLength(1281);
    expect('0x' + bytesToHex(exportFalconRsSecretKey(nist))).toBe(fixture.secretKey);
  });

  test('the imported key gives the falcon-rs NTT public key and packed public key', () => {
    const publicKey = getPublicKey(importFalconRsSecretKey(fixture.secretKey));
    expect(Array.from(publicKeyToNtt(publicKey))).toEqual(fixture.pkNtt);
    expect(getPackedPublicKey(publicKey)).toEqual(fixture.packedPublicKey);
  });

  test('rejects a tampered G, a coefficient >= q and a wrong length', () => {
    const tamperedG = toBytes(fixture.secretKey, 3584, 'fixture');
    tamperedG[3 * 896] ^= 0x01;
    expect(() => importFalconRsSecretKey(tamperedG)).toThrow('Falcon512: invalid');
    const tooBig = toBytes(fixture.secretKey, 3584, 'fixture');
    tooBig[0] = 0xff;
    tooBig[1] |= 0x3f;
    expect(() => importFalconRsSecretKey(tooBig)).toThrow('out of range');
    expect(() => importFalconRsSecretKey(tooBig.slice(1))).toThrow('3584 bytes');
  });
});
