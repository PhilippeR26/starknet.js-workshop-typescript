"name"
import { cairo, type BigNumberish, type Uint256 } from "starknet"

: "src::utils::ClaimData",
      "type": "struct",
      "members": [
        {
          "name": "identity",
          "type": "core::felt252"
        },
        {
          "name": "balance",
          "type": "core::integer::u256"
        },
        {
          "name": "index",
          "type": "core::integer::u128"
        },
        {
          "name": "merkle_path",
          "type": "core::array::Span::<core::felt252>"
        }
      ]

    type ClaimData= {
        identity:BigNumberish,
        balance:Uint256,
        index: BigNumberish,
        merkle_path: BigNumberish[]
    }

    const myClaim: ClaimData = {
        identity:"0x0354634564357435673456",
        balance: cairo.uint256(1500000000n),
        index: 896753,
        merkle_path: ["0x234c34", "0x87e345"]
    }
    await contract.is_claimable(myClaim);
