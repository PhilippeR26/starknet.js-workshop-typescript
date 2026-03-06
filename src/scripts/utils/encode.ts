import { encode } from "starknet";

export function hexU32ArrayToBase64(hexArray: string[]): string {
  const buffer = new ArrayBuffer(hexArray.length * 4); // 4 bytes per u32
  const view = new DataView(buffer);
  hexArray.forEach((hex, index) => {
    const value = parseInt(hex, 16);
    view.setUint32(index * 4, value, false); // false = big-endian
  });
  return encode.btoaUniversal(view.buffer);
}

// *********** Example
// const hexArray = ["0x1A2B3C4D", "0xDEADBEEF", "0x00FF00FF"];
// console.log(hexU32ArrayToBase64(hexArray)); // "Gi88Td6tvu8A/wD/"
