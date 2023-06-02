import { mintMetadataNft } from './mint-metadata-nft';

// Remove experimental warnings from the console. Only used for "shell" scripts to prettier the console output.
process.removeAllListeners('warning');

// Sample function to get metadata.
//
// You can also rewrite to GET query and get metadata from the device that should be stored within the digital twin(NFT).
// Maximum metadata size supported is MAX_METADATA_LENGTH: number = 8192
//
// TODO: Enhancement (in-progress) - Utilise multiple UTXO outputs to increase maximum storage. This will sypport storage of muuch larger metadata size. We will also enable storage for non JSON data.
const getDeviceMetadata = async () => {
  return {
    // If it has been previously minted you can provide digitalTwinNftId and it'll cause update of the NFT instead.
    digitalTwinNftId: undefined,
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
 * This can be technically replicated in other languages using other IOTA libraries.
 *
 * You can use the function to mint new digital twin or update metadata on an exiting one.
 *
 * This method uses Soonaverse On Tangle requests. API can also be used. Advantage of On Tangle Requests is that all communication
 * happens directly through local node that can run within consumer's infrastructure. It also runs directly on L1 chain. This provides more secure way
 * to execute the request as requester IPs are not exposed.
 *
 * Soonaverse pick-ups these requests and process them through Tangle. It correctly create/updates appropriate records on immutable ledger.
 *
 * There is NO COST in executing these transaction. Only cost is storage deposit. Any data stored on Tangle requires storage deposit. Based on the amount
 * of the data stored this storage deposit requirement can change. Since we only want to always store most recent config consumer will not occur increasing
 * cost. They will still be able to use "permanodes" to access / view previous versions. Consumer can choose to run permanodes within their infrastructure or
 * utilize Soonaverse to keep historical changes forever.
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
  const result = await mintMetadataNft(
    // Get Device Metadata.
    metadata.metadata,
    undefined,
    undefined,
    metadata.digitalTwinNftId,
  );

  if (result?.nftId) {
    console.log('Digital Twin ID (NFT): ' + result.nftId + '\n\n');
    console.log(
      'See in Shimmer Explorer: ' +
        'https://explorer.shimmer.network/shimmer/search/' +
        result.nftId +
        '\n',
    );
  }
};

callMetadataNftCreate();
