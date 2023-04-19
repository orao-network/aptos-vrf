# ORAO VRF for Aptos SDKs

This repository provides JS, Rust and Move SDKs. With these libs you'll be able to request on-chain randomness using ORAO VRF module.

SDK sections:
+ `move` - [request on-chain randomness from your move module](https://github.com/orao-network/aptos-vrf/tree/master/move)
+ `js` - [get randomness to your web3 JavaScript dApp](https://github.com/orao-network/aptos-vrf/tree/master/js)
+ `rust` - [SDK libs enabling VRF in your rust aptos app](https://github.com/orao-network/aptos-vrf/tree/master/rust)

## Examples
The example section provides three sample apps for each of the SDKs: Move, JS and Rust. Please note that all sample apps utilize testnet network.

+ For [Aptos Move VRF](https://github.com/orao-network/aptos-vrf/tree/master/examples/move) we've built a Russian Roulette game as a move module.
+ The [JS example](https://github.com/orao-network/aptos-vrf/tree/master/examples/js) provides a frontend web3 dApp built using React. We integrated Pontem and Petra browser wallets. Any wallet for Aptos blockchain should work provided it generates payloads to spec.
+ There's also a [Rust CLI](https://github.com/orao-network/aptos-vrf/tree/master/examples/rust) app that generates a new wallet, gets an airdrop from aptos testnet, requests and outputs randomness.


### Anatomy of randomness request

The `RandomnessData` structure is used to store the requested randomness:

- `seeds` table – stores the request seed as key and the fulfilled randomness as value.

- `responses` field – you may look at this field in case you are willing to perform off-chain verification (there are helpers for this in both SDKs)

### Anatomy of a VRF configuration

The `Vrf` structure holds the on-chain VRF data. The field that may be interesting to you are:

- `fee` – randomness request will cost this many small units
- `fulfillment_authorities` – public keys of fulfillment authorities
- `coin_type` - coin type to pay fees