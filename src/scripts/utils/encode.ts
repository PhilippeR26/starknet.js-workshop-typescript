import { encode, num } from "starknet";

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


export function base64ToHexU32Array(base64: string): string[] {
  const buffer = encode.atobUniversal(base64);
  const view = new DataView(buffer.buffer);
  const result: string[] = [];
  for (let i = 0; i < view.byteLength; i += 4) {
    const value = view.getUint32(i, false); // big-endian
    result.push(num.toHex(value));
  }
  return result;
}
// *********** Example
// console.log(base64ToHexU32Array("AAAAABorPE3erb7vAP8A/w==")); // [ '0x0', '0x1a2b3c4d', '0xdeadbeef', '0xff00ff' ]
