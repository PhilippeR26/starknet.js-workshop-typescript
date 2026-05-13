import { CairoByteArray, ec, transaction, type BigNumberish, type Call } from "starknet";
import { hashByteArray } from "./26a.CairoBytesArray-hash";

export function hashProposal(calls: Array<Call>, name: string): string {
    const hashString = hashByteArray(new CairoByteArray(name));
    const dataToHash = [
        ...transaction.getExecuteCalldata(calls, "1"),
        hashString
    ];
    return dataToHash.reduce(
        (x: BigNumberish, y: BigNumberish) => ec.starkCurve.pedersen(BigInt(x), BigInt(y))
        , 0
    )
        .toString();
}

