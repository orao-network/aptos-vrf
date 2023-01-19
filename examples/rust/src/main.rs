use std::{str::FromStr, thread::sleep, time::Duration};

use anyhow::{Context, Result};
use aptos_sdk::{
    rest_client::FaucetClient, types::account_address::AccountAddress, types::LocalAccount,
};
use indicatif::ProgressBar;
use once_cell::sync::Lazy;
use orao_aptos_vrf::OraoVrf;
use url::Url;

static NODE_URL: Lazy<Url> = Lazy::new(|| {
    Url::from_str(
        std::env::var("APTOS_NODE_URL")
            .as_ref()
            .map(|s| s.as_str())
            .unwrap_or("https://fullnode.devnet.aptoslabs.com"),
    )
    .unwrap()
});

static FAUCET_URL: Lazy<Url> = Lazy::new(|| {
    Url::from_str(
        std::env::var("APTOS_FAUCET_URL")
            .as_ref()
            .map(|s| s.as_str())
            .unwrap_or("https://faucet.devnet.aptoslabs.com"),
    )
    .unwrap()
});

#[tokio::main]
async fn main() -> Result<()> {
    let faucet_client = FaucetClient::new(FAUCET_URL.clone(), NODE_URL.clone());
    let mut alice = LocalAccount::generate(&mut rand::rngs::OsRng);

    // Print account addresses.
    println!("\n=== Addresses ===");
    println!("Alice: {}", alice.address().to_hex_literal());

    println!("Requesting 1 APT from faucet");
    faucet_client
        .fund(alice.address(), 100_000_000)
        .await
        .context("Failed to fund Alice's account")?;

    let client = OraoVrf::new(NODE_URL.clone().to_string());
    let network_config = client.get_network_config().await?;

    let seed = rand::random::<[u8; 32]>().to_vec();

    println!(
        "Requesting randomness for seed 0x{} ...",
        hex::encode(seed.clone())
    );

    let hash = client
        .request(&mut alice, seed.clone(), network_config.coin_type, None)
        .await?;

    println!("Request performed in {}", hash);

    let randomness = wait_fulfilled(&client, &alice.address(), &seed).await?;
    println!("Randomness: {}", randomness);

    Ok(())
}

pub async fn wait_fulfilled(
    client: &OraoVrf,
    address: &AccountAddress,
    seed: &Vec<u8>,
) -> Result<String> {
    let progress = ProgressBar::new_spinner();
    progress.enable_steady_tick(std::time::Duration::from_millis(120));
    progress.set_message("Waiting for randomness to be fulfilled...");

    loop {
        let randomness = client
            .get_randomness(*address, format!("0x{}", hex::encode(seed)))
            .await?;
        if randomness != "0x" {
            break Ok(randomness)
        }
        sleep(Duration::from_secs(1));
    }
}
