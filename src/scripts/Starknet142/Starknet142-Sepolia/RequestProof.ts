// send a virtual transaction to a execute/proof server

import type { INVOKE_TXN_V3 } from "@starknet-io/starknet-types-0102";
import type { BigNumberish } from "starknet";

export type ProofMessage = {
    from_address: BigNumberish;
    payload: BigNumberish[];
    to_address: BigNumberish;
}

export type ProveResult = {
    proof: string;
    proofFacts: BigNumberish[];
    l2ToL1Messages?: ProofMessage[];
}

export async function requestProof(currentBlock: number, tx: INVOKE_TXN_V3): Promise<ProveResult> {
    const response = await fetch("http://localhost:3030/prove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            blockNumber: currentBlock,
            tx,
        }),
    });
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = ""; // store chunks
    let proofRes: ProveResult | undefined = undefined;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // a SSE message is delimited by \n\n
        const messages = buffer.split("\n\n");
        buffer = messages.pop() ?? "";
        for (const message of messages) {
            if (!message.trim()) continue;
            const eventMatch = message.match(/^event: (\w+)/);
            const dataMatch = message.match(/^data: (.+)$/m);
            if (!eventMatch || !dataMatch) continue;
            const event = eventMatch[1];
            const data = JSON.parse(dataMatch[1]);
            if (event === "log") {
                console.log(`[${data.stream}]`, data.line);
            }
            if (event === "done") {
                proofRes = data;
                console.log("proof length:", data.proof.length);
                console.log("proofFacts:", data.proofFacts);
                if (data.l2ToL1Messages) {
                    console.log("l2ToL1Messages:", data.l2ToL1Messages);
                }
            }
            if (event === "error") {
                console.error("Error:", data.message, data.stderr);
            }
        }
    }
    if (!proofRes) {
        throw new Error("Problem encountered to generate proof!!!");
    }
    return proofRes;
}