# Starkware Starknet network ^0.13.6
# Cairo Accounts and ERC20 Demo 
# Typescript code, using Starknet.js v7.6.2 and local Starknet-devnet 0.4.3
![Starknet.js](/src/img/starknet-js.png)

If you want to implement the Starknet network in your DAPP, you can use starknet.js to interact with it.
 
These little scripts shows how to use and test very quickly your starknet.js code without any user interface.

Even if these codes are very small, it's a good guideline to always write them in Typescript.

Starknet mainnet and testnet are slow. To speed up the execution, we use Starknet-devnet, that creates a local Starknet network.

## 🛠️ Installation 🛠️

copy this repo to your local disk.
Use `cd starknet.js-workshop-typescript` to go to the root of the project.

If necessary :

- Install latest LTS version of node [here](https://kinsta.com/blog/how-to-install-node-js/#how-to-install-nodejs-on-linux)
  
Run `npm install` in this directory.

This repo is configured to be able to perform debugging of your typescript code. Just CTRL+SHIFT+D, then click on the green arrow.

This script has been written with Starknet, Starknet-devnet & starknet.js. Due to fast iterations of Starknet and Cairo, these scripts will probably be quickly out-of-date.



The Account contract used in this workshop is made by [OpenZeppelin](https://github.com/OpenZeppelin/cairo-contracts), contract version 1.0.0.

##  🚀 Start the demo 🚀  🎆 ↘️  💩

Open a console, and launch the script :  
`npx ts-node src/starknet_jsNewAccount.ts` 
devnet is automatically launched and closed in this script.

More easy : use `npx ts-node src/starknet_jsExistingAccount.ts`, using a preexisting account #0 created automatically at Devnet launch.

## 📜 scripts :
In the folder 'scripts', you can find many pedagogical codes :

### Accounts :
- Create accounts
    - Create OZ account [script2](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/scripts/2.createNewOZaccount.ts)
    - Create ArgentX account [script3](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/scripts/3.createNewArgentXaccount.ts)
    - Create Ethereum account [script15](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/scripts/15.createNewETHaccount.ts)
    -  Create Braavos v1.2.0 account [script14](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/scripts/14.createNewBraavosAccount.ts)
    - Create your abstracted account [script10](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/scripts/10.createAccountAbstraction.ts)
- Connect account
    - Connect pre-deployed account (only on devnet) [script1](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/scripts/1.openPredeployedAccount.ts)
    - Connect created account [script8](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/scripts/8.ConnectAccount.ts)
### Contracts :
- Declare contract [script9](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/scripts/9.declareContract.ts)
- Deploy contract [script4](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/scripts/4.deployContract.ts)
- Declare & deploy  [script5](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/scripts/5.declareDeployContract.ts)
### Interactions
- Connect a contract [script7](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/scripts/7.connectContract.ts)
- Call
    - contract.nameFunction [workshop](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/starknet_jsExistingAccount.ts#L50)
    - contract.call [script11](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/scripts/11.CallInvokeContract.ts)
- Invoke  
    - without need of signature
        - contract.nameFunction [workshop](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/starknet_jsExistingAccount.ts#L56)
        - contract.invoke [script11](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/scripts/11.CallInvokeContract.ts)
    - with a signature : account.execute [workshop](https://github.com/PhilippeR26/starknet.js-workshop-typescript/blob/main/src/starknet_jsExistingAccount.ts#L69)


### Devnet :
Devnet is launched and ended automatically in the main scripts of this tuto, using the `starknet-devnet` library : https://github.com/0xSpaceShard/starknet-devnet-js/blob/master/README.md  
If you prefer to have a devnet already launched in its own console :
- To install and launch an instance of the local devnet : https://0xspaceshard.github.io/starknet-devnet/docs/running/install  
- Open a console, and launch devnet `starknet-devnet --seed 0`
- In all scripts, replace opening of a new Devnet by : 
```typescript
const myProvider = new RpcProvider({ nodeUrl: "http://127.0.0.1:5050/rpc" });
```
  and remove `kill` commands.  
Most of the scripts in the subdirectories are using an already running devnet.

### Others :

You can find in this repo tons of other scripts. Dig in and find many useful examples of code (exotic signatures, Ledger Nano, L1L2 messaging, events handling, WebSocket, SNIP-9 outside execution, SNIP-29 paymaster ...).  
To simplify the test of these scripts, take advantage to install the extension `code runner`. In the code window, right click, then `run code`.

## Demo DAPPs :

Be able to create some scripts is a good first step. The next step is the creation of DAPPs (decentralized application) ; see my [demo DAPP](https://github.com/PhilippeR26/Cairo1JS) for Starknet.  
I made also an [Airdrop DAPP demo](https://github.com/PhilippeR26/Airdrop-for-Starknet-soon).

Explore the code to see how to communicate with the wallet extensions of your browser.

## 🤔 Questions?

Have a look in the starknet.js [documentation](https://starknetjs.com/docs/next/guides/intro).

Ask in #starknet-js channel in the [Starknet Discord](https://discord.com/channels/793094838509764618/1270119831559078061)

Philippe. ROSTAN @ critical.devs.fr - Phil26#1686 on Discord

## 🙏 Inspiration :
This script is a fork of https://github.com/0xs34n/starknet.js-workshop
