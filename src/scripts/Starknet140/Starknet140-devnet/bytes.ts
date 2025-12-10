// Typescript v5.9 is introducing chaos in bytes handling.
// A summary of what has to be done.

export function typedArrayToArrayBuffer(array: Uint8Array): ArrayBuffer {
    return  array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset) as ArrayBuffer;
}

const myArrBuff: ArrayBuffer = new ArrayBuffer(4); // for monoTask usage
const myArrBuff1: SharedArrayBuffer = new SharedArrayBuffer(4); // for multiTask usage
const size0 = myArrBuff.byteLength;
// ArrayBufferLike = ArrayBuffer | SharedArrayBuffer . Not recommended.
const copy1: ArrayBufferLike = myArrBuff;
const copy2: Uint8Array<ArrayBuffer> = new Uint8Array(copy1);
const myArrBuff4: ArrayBuffer = copy2.slice().buffer; // ArrayBufferLike -> ArrayBuffer
const copy3: Uint8Array<SharedArrayBuffer> = new Uint8Array(myArrBuff1);
const myArrBuff5: ArrayBuffer = copy3.slice().buffer; // SharedArrayBuffer -> ArrayBuffer

// TypedData: Uint8array, ...
const myTypedData1: Uint8Array = Uint8Array.from([1, 2, 3]);
const myTypedData2: Uint8Array = new Uint8Array(myArrBuff);
const size1 = myTypedData1.byteLength;
const pos1 = myTypedData1.byteOffset;
const dataExtract1: number | undefined = myTypedData1.at(2);
const dataExtract2: ArrayIterator<[number, number]> = myTypedData1.entries();
const dataExtract3: number | undefined = myTypedData1.find((val, pos) => { return val === 2 }); // res = 2
const dataExtract4: Uint8Array = myTypedData1.filter((val, pos) => { return val === 2 }); // res = [2]
const toBuff: ArrayBufferLike = myTypedData1.buffer;

// DataView allows to read and write multiple types in an ArrayBuffer
const myDataView: DataView<ArrayBuffer> = new DataView(myArrBuff);
const myTypedData3: number = myDataView.getUint8(2); // content of pos 2
const myArrBuff3: ArrayBuffer = myDataView.buffer;

// Buffer is node.js / browser specific.
// Even more functionality than TypedData (Uint8Array, ...)
const buf0: Buffer = Buffer.from([1, 2, 3]);
const buf1: Buffer = Buffer.from(myArrBuff); // ArrayBuffer -> Buffer
const buf2: Buffer = Buffer.from(myTypedData1);
const buf3: Buffer = Buffer.from("Hello✅", "utf8");
const decode3: string = buf3.toString("utf8"); // Hello✅
const buf4: Buffer = Buffer.alloc(4);
const res: boolean = Buffer.isBuffer(buf4);
const added: Buffer = Buffer.concat([buf0, buf1]);
// BufferSource = ArrayBufferView | ArrayBuffer ≡ ArrayBuffer |DataView | UintArray | ...
// ArrayBufferView is an abstract type used for DataView, Uint8Array, ...
const myTypedData: ArrayBuffer = new Uint8Array(buf3).buffer; // Buffer -> ArrayBuffer

// handling of strings
const myTypedData4 = new TextEncoder().encode("Hello✅"); // utf8
const text1 = new TextDecoder().decode(myTypedData4);
console.log(text1);
