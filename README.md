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

## On-chain example

The contract we'll use to illustrate the C2C is a simple single-player Russian Roulette where the outcome of a round is derived from a fulfilled randomness. ([full code is available on GitHub](https://github.com/orao-network/vrf-aptos/tree/master/sdk/examples/move))

*Note*: the randomness will not be immediately available for your contract, so you'll need to design it in a way that it'll wait for randomness being fulfilled. In our example a player won't be able to start another round until the current one is finished (until the randomness is fulfilled).

### 1. Create the contract

This examples is based on Move programming language.

To perform a C2C call you'll need to add the orao VRF move SDK into the list of your dependencies:

```toml
[dependencies.AptosFramework]
git = 'https://github.com/aptos-labs/aptos-core.git'
rev = 'mainnet'
subdir = 'aptos-move/framework/aptos-framework'

[dependencies.orao-vrf]
git = 'https://github.com/orao-network/aptos-vrf.git'
rev = 'master'
subdir = 'move'
```

### 2. Perform a C2C call

```move
vrf_v2::request(user, force);
```

### 3. Use the fulfilled randomness

```move
let randomness: vector<u8> = vrf_v2::get_randomness(user_addr, *option::borrow(&player_state.force));
assert!(successfull_outcome(&randomness), E_DEAD);
```


## Off-chain Rust example

This section will illustrate the off-chain usage ([full code is available on GitHub](https://github.com/orao-network/aptos-vrf/tree/master/rust))

### Setup the connection

```rs
let client = OraoVrfV2::new(NODE_URL.clone().to_string());
```

### Create a request

```rs
let seed = rand::random::<[u8; 32]>().to_vec();
let hash = client
    .request(&mut alice, seed.clone(), None)
    .await?;
```

### Wait for fulfillment

```rs
let randomness = wait_fulfilled(&client, &alice.address(), &seed).await?;
```
