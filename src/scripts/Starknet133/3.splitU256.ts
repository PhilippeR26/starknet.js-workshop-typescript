import { num } from "starknet";
const myU256: string = "0x304c822792da45bf6f8e6957aa9515bd7b365f05b5c1678f61ae0c46213251c"; // 63 chars
const bits = 32n; // a power of 2: 8, 16, 32, 64 or 128
const UINT_MAX = (1n << bits) - 1n
const bigNum = BigInt(myU256);
let res0: bigint[] = [];
for (let i = 0n; i < (256n / bits); i++) {
    const limb = (bigNum & (UINT_MAX << (bits * i))) >> (bits *i);
    res0.push(limb);
}
const hexArr = res0.map(u32 => num.toHex(u32));
console.log(hexArr);
console.log("or");
console.log(hexArr.reverse());

