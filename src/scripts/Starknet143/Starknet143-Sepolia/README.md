## Want to test STRK20 tokens from a backend (so, without any wallet)? 
Why not — but to access the official pools on Mainnet/Testnet, you must reach a StarkWare service that provides both the proofs and the SCREENING signatures (anti-money-laundering, AML). The catch: to this day, only Ready and Xverse have whitelisted IPs, so they're the only ones able to shield (deposit) tokens.

So, to run tests without a wallet, we'll use the unofficial Testnet pool (which lets you generate the screening signature yourself): address : `0xc7784a608eec3a1b933fe7f2630440188d61b3bbe28b597c76a06fd3686353`, Screening private key: `0xcafebabe`. You'll also need a local prover; I use this server https://github.com/PhilippeR26/secure-voty/tree/main/proofServer (heads-up: it's heavy, especially the amount of RAM it needs), which is a wrapper around the snip36 tool (https://github.com/starknet-innovation/snip-36-prover-backend).

- If you want example code showing how it works at a low level, have a look at scripts 4 to 8.
- If you'd rather have simpler, higher-level code, use the Privacy SDK. Examples in `withSTRK20SDK` directory (with a README).

Discover, by using them, just how awesome STRK20 tokens are!