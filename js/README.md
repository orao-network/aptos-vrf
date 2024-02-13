# VRF for Aptos JS SDK

Library to interact with `orao-vrf` smart contract on Aptos network.

Provides interface to request for a verifiable randomness (Ed25519 Signature) on the Aptos network.

## V1

```typescript
const oraoVrf = new OraoVrfClient(Network.MAINNET);

const alice = new AptosAccount();

const txnHash = await oraoVrf.request(alice, seed);
await oraoVrf.aptosClient.waitForTransaction(txnHash);
console.log("Your transaction hash is", txnHash);

const randomness = await oraoVrf.waitFulfilled(alice.address(), seed);
console.log("Your randomness is", randomness)
```

## V2

```typescript
const oraoVrfV2 = new OraoVrfV2Client(Network.MAINNET);

const alice = new AptosAccount();

let txnHash = await oraoVrfV2.deposit(alice, '0x1::aptos_coin::AptosCoin', '100000000');
await oraoVrfV2.provider.waitForTransaction(txnHash);
console.log("Your transaction hash is", txnHash);

txnHash = await oraoVrfV2.request(alice, seed);
await oraoVrf.aptosClient.waitForTransaction(txnHash);
console.log("Your transaction hash is", txnHash);

const randomness = await oraoVrfV2.waitFulfilled(alice.address(), seed);
console.log("Your randomness is", randomness)
```