# ORAO VRF web3 demo app for Aptos
### Install the necessary dependencies

```sh
yarn
```

### Build the demo app

```sh
next build
```

or if you don't have `next` installed globally run it from the node_modules

```sh
./node_modules/next/dist/bin/next build
```

### Run the demo app
```sh
next start
```
or
```sh
/node_modules/next/dist/bin/next start
```

4. Make sure your wallet (Pontem Wallet is used for this example) is connected to devnet
5. Make sure you have some devnet APT in your wallet, if not use the `Faucet` button in your Wallet
6. Click the `Request` button. When Randomness is generated and verified it will show up in the `Randomness` text area.
