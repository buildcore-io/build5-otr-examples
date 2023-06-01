import { mintMetadataNft } from './mint-metadata-nft';

// Remove experimental warnings from the console. Only used for "shell" scripts to prettier the console output.
process.removeAllListeners('warning');

// Sample function to get metadata.
//
// You can also rewrite to GET query to get metadata from the device that should be stored within the digital twin(NFT).
// Maximum metadata size supported is MAX_METADATA_LENGTH: number = 8192
//
// TODO: Enhancement (in-progress) - Utilise multiple UTXO outputs to increase maximum storage soon. This will storage of any metadata size.
const getDeviceMetadata = async () => {
  return {
    // If it has been previously minted you can provide digitalTwinNftId and it'll cause update of the NFT instead.
    digitalTwinNftId: undefined, // '0x2b2fe5b4c1b66275e4dfd4e46cc4e0d5c3563c1cc26dd5b600ca584bf88ed3b2',
    metadata: {
      uid: '1BEjyVUxoCzVZAEQJZzuZDtXHAPxwCy5Hs',
      hostname: 'Demo Switch Config',
      interface: {
        'GigabitEthernet1/1/1': {
          allowed_vlan: ['10', '11', '12', '15'],
        },
        Vlan10: {
          ipv4: '10.10.10.5/24',
          standby: {
            '10': {
              ip: '10.10.10.1',
            },
          },
        },
      },
    },
  };
};

/**
 * Use below example function to mint Metadata NFT (Digital Twin). It's using standard IOTA.js libraries to contract request to Soonaverse.
 * You can use the function to mint new digital twin or update metadata on an exiting twin.
 *
 * This method uses Soonaverse On Tangle requests. API can also be used. Advantage of On Tangle Requests is that all communication
 * happens directly through local node that can run within consumer's infrastructure. It also runs directly on L1 chain. This the most secure way
 * to excute the request.
 *
 * Soonaverse pick-ups these requests and process them through Tangle. It correctly create/updates appropriate records on immutable ledger.
 *
 * There is NO COST in executing these transaction. Only cost is storage deposit. Any data stored on Tangle requires storage deposit. Based on the amount
 * of the data stored this storage deposit requirement can change. Since we only want to always stored most recent config consumer will not occur increasing
 * cost. They will still be able to use "permanodes" to access / view previous versions. Consumer can choose to run permanodes within their infrastructure or
 * utilize Soonaverse.
 *
 *
 * Important:
 * - Make sure wallet address is funded with enough SMR tokens
 * - Keep mnemonic wallet key secure - see config.json
 * - Generated Alias is very important. It's your governer of the NFT created.
 * - This example creates Collection NFT and NFT under it. You can add more NFTs under the collection.
 */
const callMetadataNftCreate = async () => {
  const metadata = await getDeviceMetadata();
  // Execute function to Mint Metadata NFT
  await mintMetadataNft(
    // Get Device Metadata.
    metadata.metadata,
    undefined,
    undefined,
    metadata.digitalTwinNftId,
  );
};

callMetadataNftCreate();
