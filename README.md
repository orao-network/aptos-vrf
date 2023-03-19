# ORAO VRF for Aptos SDKs

This repository provides off-chain JS and Rust SDKs. With these libs you'll be able to request on-chain randomness using ORAO VRF module.

Browse through `js` and `rust` subdirectories for more info - they contain sample code as well as the SDK.

### Please note that dynamic calls are not yet available on Aptos
This means you won't be able to request randomness from your module on Aptos using this method. The examples are off-chain only meaning you can request on-chain randomness from your off-chain apps. As soon as dynamic calls functionality is enabled on Aptos Mainnet we will update the examples section.
- Currently we're implementing a workaround through move scripts.

## Examples
We've prepared two off-chain usage examples for devnet.
- The [JS example](https://github.com/orao-network/aptos-vrf/tree/master/examples/js) provides a frontend web3 dApp built using React. We integrated Pontem wallet but any aptos browser wallet should work in this web example.
- There's also a [Rust CLI](https://github.com/orao-network/aptos-vrf/tree/master/examples/rust) app that generates a new wallet, gets an airdrop from aptos devnet, requests and outputs randomness.
