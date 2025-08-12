import { num } from "starknet";
// ☥😅Azş`://Nunc est bibendum
const word:string="bibendum";
const a=word.charCodeAt(2);
const he=a.toString(16);
const a0=he.slice(0,2);
const a1=he.slice(2,4);
console.log(a,"length=",word.length,he,a0,a1);

const byteArr0 = Buffer.from(word,"ascii");
const byteArr1 = Buffer.from(word,"utf-8");
const byteArr2 = Buffer.from(word,"utf-16le");
const u8enc=new TextEncoder().encode(word);
const u8dec=new TextDecoder().decode(u8enc);
const u16dec=new TextDecoder("utf-16").decode(byteArr2);
console.log("ASCII=",byteArr0.length,byteArr0 );
console.log(String.fromCharCode(...byteArr0));
console.log("UTF8=",byteArr1.length,byteArr1);
console.log("UTF16=",byteArr2.length,byteArr2);
console.log(u16dec);
console.log("Utf8=",u8enc.length,u8enc);
console.log(u8dec);