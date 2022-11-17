# ORAO VRF for Aptos SDKs

This repository provides off-chain JS and Rust SDKs. With these libs you'll be able to request on-chain randomness using ORAO VRF contract.

Browse through `js` and `rust` subdirectories for more info - they contain sample code as well as the SDK.



## `Please note that dynamic calls are not yet available on Aptos`
This means you won't be able to request randomness from your contract on Aptos. The examples are off-chain only meaning you can request on-chain randomness from your off-chain apps. As soon as dynamic calls functionality is enabled on Aptos Mainnet we will update the examples section.

## Examples
We've prepared two off-chain usage examples.
The JS example provides a frontend web3 dApp built using React.  which uses Pontem wallet and a CLI Rust app that generates a new wallet, gets an airdrop from aptos devnet, requests randomness 
