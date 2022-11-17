# VRF for Aptos JS SDK

Library to interact with `orao-vrf` smart contract on Aptos network.

Provides interface to request for a verifiable randomness (Ed25519 Signature) on the Aptos network.

### Randomness request

```typescript
const oraoVrf = new OraoVrf(NODE_URL);

const alice = new AptosAccount();

const [seed, tx] = await oraoVrf.request(alice);
console.log("Your transaction hash is", tx);

const randomness = await oraoVrf.waitFulfilled(alice.address(), seed);
console.log("Your randomness is", randomness)
```