import { CairoInt8, CairoOptionVariant, num, type CairoResultVariant } from "starknet";
// ☥😅Azş`://Nunc est bibendum
const word: string = "bibendum";
const A = word.charCodeAt(2);
const he = A.toString(16);
const a0 = he.slice(0, 2);
const a1 = he.slice(2, 4);
console.log(A, "length=", word.length, he, a0, a1);

const byteArr0 = Buffer.from(word, "ascii");
const byteArr1 = Buffer.from(word, "utf-8");
const byteArr2 = Buffer.from(word, "utf-16le");
const u8enc = new TextEncoder().encode(word);
const u8dec = new TextDecoder().decode(u8enc);
const u16dec = new TextDecoder("utf-16").decode(byteArr2);
console.log("ASCII=", byteArr0.length, byteArr0);
console.log(String.fromCharCode(...byteArr0));
console.log("UTF8=", byteArr1.length, byteArr1);
console.log("UTF16=", byteArr2.length, byteArr2);
console.log(u16dec);
console.log("Utf8=", u8enc.length, u8enc);
console.log(u8dec);

type Person = {
  name: string,
  age: number;
}
const guy: Person = { name: "edmund", age: 34 };
type A = typeof guy;
type Simplify<T> = { [K in keyof T]: T[K] } & {}; // to have a comprehensible view of a complex type in Intellisense.
type Simplify2<T> = T extends any[] | Date ? T : { [K in keyof T]: T[K]; } & {};
type B = keyof A;
type B1 = keyof Person;
type C = Simplify<B>
const e: B = "name";
type G = Person[keyof Person];
type G1 = Person[keyof typeof guy];
type H = Person["name"];
const f: G = guy[e as B1];
type AA = {
  [clef in B]: (res: Person[clef]) => void;
};

const i8=new CairoInt8(-1).toHexString();
console.log({i8})

type VariantType = CairoOptionVariant | CairoResultVariant | string | number;
const input: VariantType=1;
const t0=Object.values(CairoOptionVariant);
const nu=Number(input);
const valid = [0,1].includes(nu);
console.log({valid});

class A1 {}
class A2 {}
class A3 {}
const At=new A2();
const classArray=[A1, A2,A3];
if (classArray.some(cls => At instanceof cls)){
  console.log("Ok");
}
