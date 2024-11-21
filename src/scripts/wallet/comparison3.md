Final Braavos wallet  
Final ArgentX wallet 

Result of the tests of the wallets  :  

| Id |Subject| ArgentX | Braavos| Comment|
|--|--|--|--|--|
|1|event accountsChanged| <b>A change of account in the same network releases both accountChanged and networkChanged events </b>|**No un-subscription** ||
|2|event networkChanged | OK|<b>**No un-subscription**</b>||
|3|wallet_getPermissions| OK|OK||
|4|wallet_requestAccounts|OK|OK||
|5|wallet_watchAsset|OK|OK||
|6|wallet_addStarknetChain|OK|**Not implemented**||
|7|wallet_switch StarknetChain|Ok |**Not implemented**||
|8|wallet_requestChainId|OK|OK||
|9|starknet_addInvoke Transaction|OK|OK||
|10|starknet_addDeclare Transaction|OK |OK|
|11|starknet_addDeploy AccountTransaction|OK|OK|
|12|starknet_signTypedData|OK|OK||
|13|starknet_supportedSpecs|OK|OK||
|14|GetDeploymentDataResult|OK|OK||