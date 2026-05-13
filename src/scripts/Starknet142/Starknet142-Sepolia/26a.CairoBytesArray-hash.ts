import { CairoByteArray, hash, num } from "starknet";

export function hashByteArray(text: CairoByteArray): string {
    const serialized = text.toApiRequest();
    console.log({serialized});
    return hash.computeHashOnElements(serialized);
}