use std::str::FromStr;

use anyhow::Result;
pub use aptos_sdk::{
    crypto::ed25519::Ed25519PrivateKey,
    rest_client::Client,
    types::{account_address::AccountAddress, AccountKey, LocalAccount},
};
use url::Url;

pub async fn get_local_account(private_key_hex: &str, node_url: String) -> Result<LocalAccount> {
    let decoded = hex::decode(private_key_hex.replace("0x", ""))?;
    let private_key = Ed25519PrivateKey::try_from(decoded.as_slice())?;
    let key = AccountKey::from_private_key(private_key);
    let address = key.authentication_key().derived_address();

    let api_client = Client::new(Url::from_str(&node_url).unwrap());
    let account = LocalAccount::new(
        address,
        key,
        api_client.get_account(address).await?.inner().sequence_number,
    );

    Ok(account)
}

pub fn get_address(address_hex: &str) -> Result<AccountAddress> {
    let address = AccountAddress::from_hex_literal(&address_hex)?;
    Ok(address)
}

pub const DEFAULT_NODE_URL: &str = "https://fullnode.testnet.aptoslabs.com";
