import { N, PACKED_SLOTS, Q, QB, STARK_PRIME } from '../lib/s2morrow/constants';
import { feltToHex, parseFelt } from '../lib/s2morrow/felt';
import { packPoly, unpackPoly } from '../lib/s2morrow/packing';
import { readJsonBig, SerdeReader, toNumbers } from './helpers/fixtures';

const randomPoly = (): number[] => Array.from({ length: N }, () => Math.floor(Math.random() * Q));

describe('packPoly / unpackPoly (base-Q, 29 felts)', () => {
  test('matches the Rust/Cairo reference data', () => {
    const reader = new SerdeReader(readJsonBig('cairo/packing_test_int.json').packing_test);
    const values = toNumbers(reader.array());
    const packed = reader.array();
    expect(reader.done()).toBe(true);
    expect(packPoly(values)).toEqual(packed);
    expect(Array.from(unpackPoly(packed))).toEqual(values);
  });

  test('round trip: random, zeros, all q - 1', () => {
    for (const p of [randomPoly(), new Array(N).fill(0), new Array(N).fill(Q - 1)]) {
      const packed = packPoly(p);
      expect(packed).toHaveLength(PACKED_SLOTS);
      expect(Array.from(unpackPoly(packed))).toEqual(p);
    }
  });

  test('packPoly rejects bad polynomials', () => {
    expect(() => packPoly(new Array(N - 1).fill(0))).toThrow('512 coefficients');
    const p = randomPoly();
    p[7] = Q;
    expect(() => packPoly(p)).toThrow('out of range');
    p[7] = -1;
    expect(() => packPoly(p)).toThrow('out of range');
    p[7] = 1.5;
    expect(() => packPoly(p)).toThrow('out of range');
  });

  test('unpackPoly rejects non-canonical encodings', () => {
    const packed = packPoly(randomPoly());
    expect(() => unpackPoly(packed.slice(0, 28))).toThrow('29 felts');
    expect(() => unpackPoly([...packed, 0n])).toThrow('29 felts');
    const lowTooBig = [...packed];
    lowTooBig[0] = QB ** 9n;
    expect(() => unpackPoly(lowTooBig)).toThrow('non-canonical');
    const highTooBig = [...packed];
    highTooBig[0] = (QB ** 9n) << 128n;
    expect(() => unpackPoly(highTooBig)).toThrow('non-canonical');
    const lastHigh = [...packed];
    lastHigh[28] = packed[28] + (1n << 128n);
    expect(() => unpackPoly(lastHigh)).toThrow('non-canonical');
    const lastLow = [...packed];
    lastLow[28] = QB ** 8n;
    expect(() => unpackPoly(lastLow)).toThrow('non-canonical');
    const notFelt = [...packed];
    notFelt[3] = STARK_PRIME;
    expect(() => unpackPoly(notFelt)).toThrow('not a felt252');
  });
});

describe('felt helpers', () => {
  test('parseFelt accepts bigint, safe integer, hex and decimal strings', () => {
    expect(parseFelt(5n, 'x')).toBe(5n);
    expect(parseFelt(5, 'x')).toBe(5n);
    expect(parseFelt('0x1F', 'x')).toBe(31n);
    expect(parseFelt('31', 'x')).toBe(31n);
  });

  test('parseFelt rejects other values', () => {
    for (const bad of ['', '0x', 'zz', '-1', 1.5, -1n, STARK_PRIME, null, undefined, {}]) {
      expect(() => parseFelt(bad, 'x')).toThrow('not a felt252');
    }
  });

  test('feltToHex', () => {
    expect(feltToHex(0n)).toBe('0x0');
    expect(feltToHex(255n)).toBe('0xff');
  });
});
