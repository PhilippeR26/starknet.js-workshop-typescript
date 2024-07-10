import { ec, encode, hash, num, validateAndParseAddress, } from "starknet"


async function main() {
    const privK = "0x03f568733c46280a8c36992fc53808061a877e75dff67b8d2367409a4c9896ce";
    //const pubK = encode.addHexPrefix(encode.buf2hex(ec.starkCurve.getPublicKey(privK, false)));
    const pubK="0x0463f424439f5342ba7ca8bb69496d2326643a8475e28693d3f771e34a29dbe7";
    console.log({ pubK });
    const hash0 = hash.computePedersenHashOnElements([0, 1]);
    const trH = "0x0511111111111111111111111111111111111111111111111111111111111112";
    const trH2=BigInt(trH) << 4n;
    console.log("shifted Hash =",num.toHex(trH2));
    //const trH = validateAndParseAddress(hash0);
    const sign = ec.starkCurve.sign(trH, privK);
    console.log({ sign });
    const rBit = sign.recovery;
    console.log({ rBit }); // 0 (y is even) or 1 (y is odd)
    console.log("r=", validateAndParseAddress(num.toHex(sign.r)));
    console.log("s=", validateAndParseAddress(num.toHex(sign.s)));
    // const b=sign.toDERHex();
    // const c=sign.toCompactHex();
    // console.log({b});
    // console.log({c});
    // const sign3=ec.starkCurve.Signature.fromCompact(c);
    // console.log({sign3});
    const liSign="0x05ab6fe0d58074a1962169ac8969f4c228233e79116ee97beca8b6dc74047ea6014653ee807fadfa50a57caa9d6e75b5773779f470d2467fb905fdbec04d0423";
    const liSignX=liSign.slice(0,66);
    const liSignY=encode.addHexPrefix(liSign.slice(66));
    console.log({liSignX,liSignY});

    const sign2 = new ec.starkCurve.Signature(BigInt(liSignX),BigInt(liSignY));
    // const sign2 = new ec.starkCurve.Signature(sign.r, sign.s);
    const sign4 = sign2.addRecoveryBit(rBit!);
    console.log({ sign4 });
    const recPubK = sign4.recoverPublicKey(encode.removeHexPrefix(trH));
    const recX = validateAndParseAddress(num.toHex(recPubK.x));
    const recY = validateAndParseAddress(num.toHex(recPubK.y));
    const par = recPubK.hasEvenY() ? "03" : "04";
    console.log({ recX, recY, par });
    const recFullPubK = "0x" + par + encode.removeHexPrefix(recX) + encode.removeHexPrefix(recY);
    console.log({ recFullPubK });
    console.log("Public key is correctly recovered :", recX == pubK);
    console.log("✅ Test Completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

