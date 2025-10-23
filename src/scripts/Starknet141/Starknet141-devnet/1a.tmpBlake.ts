import { blake2s } from '@noble/hashes/blake2s';
import { constants, num } from 'starknet';

const PRIME = constants.PRIME;

export function blake2sHashMany(data: bigint[]): bigint {
    const SMALL_THRESHOLD = 0x8000000000000000n; // 2^63
    const BIG_MARKER = 0x80000000; // 1 << 31

    // Encode each Felt to u32 words
    const u32Words: number[] = [];
    const buf = new ArrayBuffer(32);
    const feltView = new DataView(buf);
    for (const felt of data) {
        // Convert to 32-byte big-endian representation
        const u64_0 = felt & 0xffffffffffffffffn;
        const u64_1 = (felt & 0xffffffffffffffff0000000000000000n) >> 64n;
        const u64_2 = (felt & 0xffffffffffffffff00000000000000000000000000000000n) >> 128n;
        const u64_3 = (felt & 0xffffffffffffffff000000000000000000000000000000000000000000000000n) >> 192n;
        feltView.setBigUint64(0, u64_3, false);
        feltView.setBigUint64(8, u64_2, false);
        feltView.setBigUint64(16, u64_1, false);
        feltView.setBigUint64(24, u64_0, false);
        if (felt < SMALL_THRESHOLD) {
            // Small value: 2 u32 words from last 8 bytes
            const hi0 = feltView.getUint32(24, false);
            const lo0 = feltView.getUint32(28, false);
            u32Words.push(hi0, lo0);
        } else {
            // Large value: 8 u32 words with MSB marker
            // Set MSB of first word as marker
            const word0 = feltView.getUint32(0, false) | BIG_MARKER;
            const word1 = feltView.getUint32(4, false);
            const word2 = feltView.getUint32(8, false);
            const word3 = feltView.getUint32(12, false);
            const word4 = feltView.getUint32(16, false);
            const word5 = feltView.getUint32(20, false);
            const word6 = feltView.getUint32(24, false);
            const word7 = feltView.getUint32(28, false);
            u32Words.push(word0, word1, word2, word3, word4, word5, word6, word7);
        }
    }

    // Serialize u32 words as little-endian bytes
    const bytes = new ArrayBuffer(u32Words.length * 4);
    const bytesView = new DataView(bytes);
    for (let i = 0; i < u32Words.length; i++) {
        bytesView.setUint32(i * 4, u32Words[i], true);
    }
    const hash = blake2s(new Uint8Array(bytes), { dkLen: 32 }); // Paul version
    let hashBigInt = 0n;
    for (let i = 0; i < 32; i++) {
        hashBigInt |= BigInt(hash[i]) << BigInt(i * 8);
    }
    return hashBigInt % constants.PRIME;
}
