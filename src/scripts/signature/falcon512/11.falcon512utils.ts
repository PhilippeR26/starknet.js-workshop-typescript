export function parseFalcon512PublicKey(vkBytes: Uint8Array): Int32Array {
  const Q = 12289;
  const N = 512;
  const BITS = 14;
  const coeffs = new Int32Array(N);
  let bitBuffer = 0;
  let bitsInBuffer = 0;
  let byteIndex = 0;

  for (let i = 0; i < N; i++) {
    while (bitsInBuffer < BITS) {
      bitBuffer |= vkBytes[byteIndex++] << bitsInBuffer;
      bitsInBuffer += 8;
    }
    const coeff = bitBuffer & ((1 << BITS) - 1);
    bitBuffer >>= BITS;
    bitsInBuffer -= BITS;
    if (coeff >= Q) throw new Error(`Invalid coeff ${coeff} at position ${i}`);
    coeffs[i] = coeff;
  }
  return coeffs;
}

