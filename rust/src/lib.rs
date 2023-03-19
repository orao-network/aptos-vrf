pub mod utils;

use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

use anyhow::{Context, Result};
use aptos_sdk::bcs;
use aptos_sdk::move_types::identifier::Identifier;
use aptos_sdk::move_types::language_storage::{ModuleId, TypeTag};
use aptos_sdk::rest_client::Client;
use aptos_sdk::transaction_builder::TransactionBuilder;
use aptos_sdk::types::account_address::AccountAddress;
use aptos_sdk::types::chain_id::ChainId;
use aptos_sdk::types::transaction::{EntryFunction, TransactionPayload};
use aptos_sdk::types::LocalAccount;
use serde::{Deserialize, Serialize};
use url::Url;
use utils::get_address;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VrfData {
    pub coin_type: String,
    pub fee: String,
    pub treasury: String,
    pub num_received: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Table {
    pub handle: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RequestData {
    pub seeds: Table,
}

#[derive(Debug)]
pub struct OraoVrf {
    api_client: Client,
    vrf_address: AccountAddress,
}

impl OraoVrf {
    pub fn new(node_url: String) -> Self {
        let api_client = Client::new(Url::from_str(&node_url).unwrap());
        Self {
            api_client,
            vrf_address: AccountAddress::from_hex_literal(
                "0x16e91756990842e0848b11cbbd5671a522af7f6af1fdc98fcee09082f50f300e",
            )
            .unwrap(),
        }
    }

    pub async fn request(
        &self,
        signer: &mut LocalAccount,
        seed: Vec<u8>,
        coin_type: String,
        options: Option<TransferOptions>,
    ) -> Result<String> {
        let options = options.unwrap_or_default();
        let seq_num = self.get_sequence_number(signer.address()).await?;
        *signer.sequence_number_mut() = seq_num;
        let chain_id = self
            .api_client
            .get_index()
            .await
            .context("Failed to get chain ID")?
            .inner()
            .chain_id;
        let transaction_builder = TransactionBuilder::new(
            TransactionPayload::EntryFunction(EntryFunction::new(
                ModuleId::new(self.vrf_address, Identifier::new("vrf").unwrap()),
                Identifier::new("request").unwrap(),
                vec![TypeTag::from_str(coin_type.as_ref()).unwrap()],
                vec![bcs::to_bytes(&seed).unwrap()],
            )),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs()
                + options.timeout_secs,
            ChainId::new(chain_id),
        )
        .sender(signer.address())
        .sequence_number(signer.sequence_number())
        .max_gas_amount(options.max_gas_amount)
        .gas_unit_price(options.gas_unit_price);
        let signed_txn = signer.sign_with_transaction_builder(transaction_builder);

        let txn_hash = self
            .api_client
            .submit(&signed_txn)
            .await
            .context("Failed to submit transfer transaction")?
            .into_inner();

        self.api_client
            .wait_for_transaction(&txn_hash)
            .await
            .context("Failed when waiting for the request transaction")?;
        Ok(txn_hash.hash.to_string())
    }

    pub async fn get_network_config(&self) -> Result<VrfData> {
        let resource_type = self.vrf_address.to_hex_literal() + "::vrf::Vrf";
        let response = self
            .api_client
            .get_resource::<VrfData>(self.vrf_address, &resource_type)
            .await
            .context("Failed to get network resources")?;
        Ok(response.into_inner())
    }

    async fn get_sequence_number(&self, address: AccountAddress) -> Result<u64> {
        let response = self
            .api_client
            .get_account(address)
            .await
            .context("Failed to get account")?;
        let account = response.inner();
        Ok(account.sequence_number)
    }

    pub async fn get_randomness(&self, address: AccountAddress, seed: String) -> Result<String> {
        let resource_type = self.vrf_address.to_hex_literal() + "::vrf::RandomnessData";
        let response = self
            .api_client
            .get_resource::<RequestData>(address, &resource_type)
            .await
            .context("Failed to get randomness request data")?;
        let randomness_request = response.into_inner();
        let table_handle = get_address(&randomness_request.seeds.handle)?;
        let key_type = "vector<u8>";
        let value_type = "vector<u8>";
        let randomness = self
            .api_client
            .get_table_item(table_handle, key_type, value_type, seed)
            .await
            .context("Failed to get randomness")?;
        let randomness_inner = randomness.into_inner();
        let randomness = randomness_inner.as_str().unwrap();
        Ok(randomness.to_string())
    }
}

pub struct TransferOptions {
    pub max_gas_amount: u64,
    pub gas_unit_price: u64,
    pub timeout_secs: u64,
}

impl Default for TransferOptions {
    fn default() -> Self {
        Self {
            max_gas_amount: 5_000,
            gas_unit_price: 100,
            timeout_secs: 10,
        }
    }
}
