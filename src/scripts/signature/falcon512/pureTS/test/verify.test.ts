import { bytesToHex } from '@noble/hashes/utils.js';
import { addAddressPadding, num, typedData } from 'starknet';
import { Falcon512Signer } from '../lib/Falcon512Signer';
import { STARK_PRIME } from '../lib/s2morrow/constants';
import { generateKeyPair, publicKeyToNtt } from '../lib/s2morrow/keys';
import { signHash } from '../lib/s2morrow/signature';
import { verify, verifyMessage } from '../lib/verify';
import { giftTypedData } from './helpers/giftTypedData';

const ADDRESS = '0x7f47dc7d5f2ab40ae668a195fc8eb5724333e436d87a1c37f40d39f2776d5fb';
const { secretKey, publicKey } = generateKeyPair();
const signer = new Falcon512Signer(secretKey);
const msgHash = typedData.getMessageHash(giftTypedData, ADDRESS);

describe('verifyMessage', () => {
  test('with a TypedData and an account address (padded or not)', async () => {
    const sig = await signer.signMessage(giftTypedData, ADDRESS);
    expect(verifyMessage(giftTypedData, sig, publicKey, ADDRESS)).toBe(true);
    expect(verifyMessage(giftTypedData, sig, publicKey, addAddressPadding(ADDRESS))).toBe(true);
    expect(verifyMessage(giftTypedData, sig, publicKey, '0x123')).toBe(false);
    expect(() => (verifyMessage as any)(giftTypedData, sig, publicKey)).toThrow('accountAddress');
  });

  test('with a hash given as hex string, bigint or decimal string', async () => {
    const sig = await signer.signMessage(giftTypedData, ADDRESS);
    expect(verifyMessage(msgHash, sig, publicKey)).toBe(true);
    expect(verifyMessage(num.toBigInt(msgHash), sig, publicKey)).toBe(true);
    expect(verifyMessage(num.toBigInt(msgHash).toString(10), sig, publicKey)).toBe(true);
  });
});

describe('verify', () => {
  test('public key as Uint8Array or hex string with or without 0x', async () => {
    const sig = await signer.signMessage(giftTypedData, ADDRESS);
    expect(verify(sig, msgHash, publicKey)).toBe(true);
    expect(verify(sig, msgHash, '0x' + bytesToHex(publicKey))).toBe(true);
    expect(verify(sig, msgHash, bytesToHex(publicKey))).toBe(true);
  });

  test('a signature formatted as decimal strings is accepted', async () => {
    const sig = (await signer.signMessage(giftTypedData, ADDRESS)) as string[];
    expect(verify(sig.map((x) => BigInt(x).toString(10)), msgHash, publicKey)).toBe(true);
  });

  test('invalid inputs', async () => {
    const sig = await signer.signMessage(giftTypedData, ADDRESS);
    expect(verify({ r: 1n, s: 2n, recovery: 0 } as any, msgHash, publicKey)).toBe(false);
    expect(verify(sig, '0x' + STARK_PRIME.toString(16), publicKey)).toBe(false);
    expect(verify(sig, 'not a hash', publicKey)).toBe(false);
    expect(() => verify(sig, msgHash, publicKey.slice(1))).toThrow('897 bytes');
  });

  test('rejects unclear message hashes ("", " ", "0x", true) like starknet.js Cairo types, but accepts an explicit 0', () => {
    const sigOverZero = signHash(0n, secretKey, publicKeyToNtt(publicKey));
    expect(verify(sigOverZero, 0n, publicKey)).toBe(true);
    expect(verify(sigOverZero, '0x0', publicKey)).toBe(true);
    expect(verify(sigOverZero, '', publicKey)).toBe(false);
    expect(verify(sigOverZero, ' ', publicKey)).toBe(false);
    expect(verify(sigOverZero, '0x', publicKey)).toBe(false);
    expect(verify(sigOverZero, true as any, publicKey)).toBe(false);
  });
});
