//const SpeculosTransport = require("@ledgerhq/hw-transport-node-speculos").default;
const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;

//const { StarknetClient } = require("../");
const { StarknetClient } = require("@ledgerhq/hw-app-starknet");

const { shortString } = require("starknet");

const apduPort = 9999;

async function main() {

    //const transport = await SpeculosTransport.open({ apduPort });
	const transport = await TransportNodeHid.create();

	const stark = new StarknetClient(transport);

	// Get the version of the app
	const version = await stark.getAppVersion();
	console.log(version);

	// Get the Stark public key
	const publicKey = await stark.getPubKey("m/2645'/1195502025'/1148870696'/0'/0'/0");
	console.log(publicKey);

	// Sign a hash
	let signature = await stark.signHash("m/2645'/1195502025'/1148870696'/0'/0'/0", "0x06944d8c6b0e496672d5713a5ddc93ce9245f9866d114d284cd6c96b7be1a49f");
	console.log(signature);

	// Sign a transaction
	let txDetails = {
		accountAddress: "0x02314cdfd81aea140b18a410775ce295205d3dccc5865a3c49444196a39029a9",
		max_fee: "171699675780",
		chainId: "0x534e5f4d41494e",
		nonce: "28",
	}
	
	let calls = [
		{ 
			to: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
			selector: "0x83afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e",
			calldata: ["0x11f5fc2a92ac03434a7937fe982f5e5293b65ad438a989c5b78fb8f04a12016",
					"0x9184e72a000",
					"0x0"]
		},     
	]

	signature = await stark.signTxV1("m/2645'/1195502025'/1148870696'/0'/0'/0", calls, txDetails);
	console.log(signature);

	// Sign a typed data
	const typedDataValidate = {
		types: {
		  StarkNetDomain: [
			{ name: 'name', type: 'string' },
			{ name: 'version', type: 'felt' },
			{ name: 'chainId', type: 'felt' },
		  ],
		  Airdrop: [
			{ name: 'address', type: 'felt' },
			{ name: 'amount', type: 'felt' },
		  ],
		  Validate: [
			{ name: 'id', type: 'felt' },
			{ name: 'from', type: 'felt' },
			{ name: 'amount', type: 'felt' },
			{ name: 'nameGamer', type: 'string' },
			{ name: 'endDate', type: 'felt' },
			{ name: 'itemsAuthorized', type: 'felt*' }, // array of felt
			{ name: 'chkFunction', type: 'selector' }, // name of function
			{ name: 'rootList', type: 'merkletree', contains: 'Airdrop' }, // root of a merkle tree
		  ],
		},
		primaryType: 'Validate',
		domain: {
		  name: 'myToto', // put the name of your dapp to ensure that the signatures will not be used by other DAPP
		  version: '1',
		  chainId: shortString.encodeShortString('SN_SEPOLIA'), // shortString of 'SN_SEPOLIA' (or 'SN_MAIN'), to be sure that signature can't be used by other network.
		},
		message: {
		  id: '0x0000004f000f',
		  from: '0x2c94f628d125cd0e86eaefea735ba24c262b9a441728f63e5776661829a4066',
		  amount: '400',
		  nameGamer: 'Hector26',
		  endDate: '0x27d32a3033df4277caa9e9396100b7ca8c66a4ef8ea5f6765b91a7c17f0109c',
		  itemsAuthorized: ['0x01', '0x03', '0x0a', '0x0e'],
		  chkFunction: 'check_authorization',
		  rootList: [
			{
			  address: '0x69b49c2cc8b16e80e86bfc5b0614a59aa8c9b601569c7b80dde04d3f3151b79',
			  amount: '1554785',
			},
			{
			  address: '0x7447084f620ba316a42c72ca5b8eefb3fe9a05ca5fe6430c65a69ecc4349b3b',
			  amount: '2578248',
			},
			{
			  address: '0x3cad9a072d3cf29729ab2fad2e08972b8cfde01d4979083fb6d15e8e66f8ab1',
			  amount: '4732581',
			},
			{
			  address: '0x7f14339f5d364946ae5e27eccbf60757a5c496bf45baf35ddf2ad30b583541a',
			  amount: '913548',
			},
		  ],
		},
	  };
	
	const exampleAddress = "0x02314cdfd81aea140b18a410775ce295205d3dccc5865a3c49444196a39029a9";

	signature = await stark.signMessage("m/2645'/1195502025'/1148870696'/0'/0'/0", typedDataValidate, exampleAddress);

	console.log(signature);

	transport.close();
}

main();