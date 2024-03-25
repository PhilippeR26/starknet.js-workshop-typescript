// Enum like for tx response
// launch with : npx ts-node src/scripts/cairo12/cairo12-devnet/17b.transactionResponse.ts
// Coded with Starknet.js v5.21.0

import type { GetTransactionReceiptResponseWoHelper } from "starknet";
import { BigNumberish, GetTransactionReceiptResponse, RejectedTransactionReceiptResponse, RevertedTransactionReceiptResponse, SuccessfulTransactionReceiptResponse, TransactionExecutionStatus, TransactionStatus } from "starknet";

interface TransactionResponse {
    Success: SuccessfulTransactionReceiptResponse,
    Rejected: RejectedTransactionReceiptResponse,
    Reverted: RevertedTransactionReceiptResponse,
    Error: Error,
};
type TxVariants = keyof TransactionResponse;

type Rec = Record<string, any>;
type MatchAuthorizedFns<U extends Rec> = {
    [V in TxVariants]: ((f: U[V]) => any);
}
type MatchAuthorizedFnsDefault = Partial<MatchAuthorizedFns<TransactionResponse>> & { "_": () => any };

type TxRVariant = {
    readonly status: TxVariants,
    readonly content: TransactionResponse[TxVariants],
    match(handlerFns: MatchAuthorizedFns<TransactionResponse> | MatchAuthorizedFnsDefault): any;
    isSuccess: () => boolean,
    isRejected: () => boolean,
    isReverted: () => boolean,
    isError: () => boolean,
};

type Factory = {
    [V in TxVariants]: (data: TransactionResponse[V]) => TxRVariant
}

class TxResponseVariant {
    public status: TxVariants;
    public content: any;
    private readonly isSuccessValue: boolean;
    private readonly isRejectedValue: boolean;
    private readonly isRevertedValue: boolean;
    private readonly isErrorValue: boolean;

    constructor(...args: any[]) {
        this.status = args[0];
        this.content = args.length > 2 ? args.slice(1) : args[1];
        this.isSuccessValue = this.status === "Success";
        this.isRejectedValue = this.status === "Rejected";
        this.isRevertedValue = this.status === "Reverted";
        this.isErrorValue = this.status === "Error";
    }

    match(this: TxResponseVariant, handlerFns: Record<TxVariants | "_", CallableFunction | undefined>): any {
        if (typeof handlerFns[this.status] !== "undefined") {
            return handlerFns[this.status]!(this.content);
        } else {
            return handlerFns["_"]!();
        }
    }

    get isSuccess() { return () => this.isSuccessValue; }
    get isRejected() { return () => this.isRejectedValue; }
    get isReverted() { return () => this.isRevertedValue; }
    get isError() { return () => this.isErrorValue; }
}

function create(...args: any[]) {
    return new TxResponseVariant(...args);
}



function responseTxFactory(): Factory {
    return factoryProxy as Factory;
}

const factoryProxy = new Proxy({}, {
    get(target, prop, receiver) {
        return (...args: any[]) => create(prop, ...args);
    }
});


// *********** test ********


function transactionResponse(txH: BigNumberish): TxRVariant {
    // const resp: GetTransactionReceiptResponse = {
    //     type: 'DECLARE',
    //     transaction_hash: '0x5ad959d524679cd3a3913e75fb90eefe83fbfbad7ac750a5b87f8cb6474d7ec',
    //     actual_fee: '0x1509a9f080800',
    //     messages_sent: [],
    //     events: [
    //         {
    //             from_address: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    //             keys: ['0x01'],
    //             data: ['0x02']
    //         }
    //     ],
    //     execution_status: 'SUCCEEDED',
    //     finality_status: 'ACCEPTED_ON_L2',
    //     block_hash: '0x2580c9b48f90a6a17f830aa4081ea9085382cf8a7f0d23787f003f4be53c566',
    //     block_number: 0
    // }

    const resp: GetTransactionReceiptResponseWoHelper =  {
        type: 'INVOKE',
        transaction_hash: '0x57bb080a6f79cb7a67c4f690b84c83a06dededa82c28dbab1e514a093cea6cd',
        actual_fee: '0xe219b2b0f000',
        messages_sent: [],
        events: [
          {
            from_address: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
            keys: ['0x01'],
            data: ['0x02']
          }
        ],
        execution_status: 'REVERTED',
        revert_reason: 'Error in the called contract (0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691):\n' +
          'Error at pc=0:81:\n' +
          'Got an exception while executing a hint: Custom Hint Error: Execution failed. Failure reason: "Fatal".\n' +
          'Cairo traceback (most recent call last):\n' +
          'Unknown location (pc=0:731)\n' +
          'Unknown location (pc=0:677)\n' +
          'Unknown location (pc=0:291)\n' +
          'Unknown location (pc=0:314)\n',
        finality_status: 'ACCEPTED_ON_L2',
        block_hash: '0x3b2711fe29eba45f2a0250c34901d15e37b495599fac1a74960a09cc83e1234',
        block_number: 4,
    //     execution_resources: {
    //       steps: '0xeb9',
    //       memory_holes: '0x2a',
    //       range_check_builtin_applications: '0x52',
    //       pedersen_builtin_applications: '0x10',
    //       poseidon_builtin_applications: '0x0',
    //       ec_op_builtin_applications: '0x0',
    //       ecdsa_builtin_applications: '0x1',
    //       bitwise_builtin_applications: '0x0',
    //       keccak_builtin_applications: '0x0'
    //     }
   }

    const TransactionResponse: Factory = responseTxFactory();
    console.log("txr =", TransactionResponse);
    switch (true) {
        case ("execution_status" in resp) && resp.execution_status === TransactionExecutionStatus.SUCCEEDED: {
            return TransactionResponse.Success(resp as SuccessfulTransactionReceiptResponse);
        }
        case 'status' in resp && resp.status === TransactionStatus.REJECTED: {
            return TransactionResponse.Rejected(resp as unknown as RejectedTransactionReceiptResponse);
          }
          case 'execution_status' in resp &&
          resp.execution_status === TransactionExecutionStatus.REVERTED: {
            return TransactionResponse.Reverted(resp as RevertedTransactionReceiptResponse);
          }
        default: { return TransactionResponse.Error(new Error("It has fail somewhere.")); }
    }
}


const transactionResp: TxRVariant = transactionResponse("0x00");
console.log(transactionResp.content);
console.log(transactionResp.status);
console.log(transactionResp.isSuccess());
console.log(transactionResp.isRejected());
console.log(transactionResp.isReverted());
console.log(transactionResp.match({
    Success: () => "success!",
    _: () => "unsuccess"
}));

function handleError(mes: TxRVariant): string {
    return mes.match({
        Error: (err) => err,
        _: () => "No Error"
    })
}

transactionResp.match({
    Success: (txR: SuccessfulTransactionReceiptResponse) => { console.log("success =", txR) },
    Rejected: (txR: RejectedTransactionReceiptResponse) => { console.log("Rejected =", txR) },
    Reverted: (txR: RevertedTransactionReceiptResponse) => { console.log("Reverted =", txR) },
    Error: (err: Error) => { console.log("no success =", err) },

});
