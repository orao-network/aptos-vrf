# VRF for Aptos JS SDK

Library to interact with `orao-vrf` smart contract on Aptos network.

Provides interface to request verifiable randomness (Ed25519 Signature) on the Aptos network.

### Randomness request

```typescript
const oraoVrf = new OraoVrfClient(NODE_URL);
const seed = new Uint8Array(randomBytes(32));
const alice = new AptosAccount();

const txnHash = await oraoVrf.waitFulfilled(alice, seed);
await oraoVrf.aptosClient.waitForTransaction(txnHash);
console.log("Your transaction hash is", txnHash);

const randomness = await oraoVrf.waitFulfilled(alice.address(), seed);
console.log("Your randomness is", randomness)
	
```

### Example app
An example frontend app that uses [ORAO VRF is available](https://github.com/orao-network/aptos-vrf/tree/master/examples/js) in the examples section.
The library interacts with Pontem wallet through a React frontend.