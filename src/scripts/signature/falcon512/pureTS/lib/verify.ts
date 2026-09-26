import { typedData as starknetTypedData, type BigNumberish, type Signature, type TypedData } from 'starknet';
import { parseFelt } from './s2morrow/felt';
import { publicKeyToNtt } from './s2morrow/keys';
import { verifyHash } from './s2morrow/signature';

/** Strict parsing (like starknet.js Cairo types): "", " ", "0x" or booleans are not a message hash. */
function toMessageHash(value: BigNumberish): bigint | undefined {
  try {
    return parseFelt(value, 'message hash');
  } catch {
    return undefined;
  }
}

/**
 * Low-level verification, same shape as `ec.starkCurve.verify(signature, msgHash, fullPublicKey)`.
 * @param fullPublicKey NIST Falcon-512 public key (897 bytes), as returned by `getPubKey()`.
 * @returns false for an invalid or malformed signature; throws for an invalid public key.
 */
export function verify(signature: Signature, msgHash: BigNumberish, fullPublicKey: Uint8Array | string): boolean {
  const pkNtt = publicKeyToNtt(fullPublicKey);
  const h = toMessageHash(msgHash);
  if (h === undefined || !Array.isArray(signature)) return false;
  return verifyHash(h, signature, pkNtt);
}

/** Same shapes as `typedData.verifyMessage`, for S2morrow Falcon-512 signatures. */
export function verifyMessage(
  message: TypedData,
  signature: Signature,
  fullPublicKey: Uint8Array | string,
  accountAddress: BigNumberish
): boolean;
export function verifyMessage(message: BigNumberish, signature: Signature, fullPublicKey: Uint8Array | string): boolean;
export function verifyMessage(
  message: BigNumberish | TypedData,
  signature: Signature,
  fullPublicKey: Uint8Array | string,
  accountAddress?: BigNumberish
): boolean {
  if (typeof message === 'object' && message !== null) {
    if (accountAddress === undefined) {
      throw new Error('Falcon512: accountAddress is required to verify a TypedData message');
    }
    return verify(signature, starknetTypedData.getMessageHash(message, accountAddress), fullPublicKey);
  }
  return verify(signature, message, fullPublicKey);
}
