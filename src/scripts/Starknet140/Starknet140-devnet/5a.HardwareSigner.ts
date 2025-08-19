import { ec, num, type BigNumberish, type Signature } from "starknet";

/**
 * Simulate a Hardware signer.
 * This signer ask the nonce of the transaction, and return a signature corresponding to this nonce.
 * It means that the hardware signer is authorizing the transaction for a specific nonce, whatever the content of this transaction, and whatever the account address. It can be complexified to increase the safety, but it's here simplified for pedagogical purpose.
 * If somebody gets the private key of the corresponding account, it will not be able to process any new transaction, as the signature for the new nonces are known only by the hardware signer.
 * This signer can be used only for one account.
 * ONLY for educational purpose ; the level of safety of this signer is low.
 */
export class HardwareSigner {
  protected pk: string;

  constructor(pk: string) {
    this.pk = num.toHex(pk);
  }

  public async getPubKey(): Promise<string> {
    return ec.starkCurve.getStarkKey(this.pk);
  }

  public async signNonce(nonce: BigNumberish): Promise<Signature> {
    // *** to test wrong answer
    let tmpVal: bigint;
    if (BigInt(nonce) == 0n) {
      tmpVal = 0n
    }
    else {
      tmpVal = BigInt(nonce) + 0n; // change value for tests
    }
    console.log({tmpVal});
    // ***
    return this.signRaw(tmpVal);
  }

  protected async signRaw(hash: BigNumberish): Promise<Signature> {
    // simulation of an external hardware signer
    return ec.starkCurve.sign(num.toHex(hash), this.pk);
  }
}
