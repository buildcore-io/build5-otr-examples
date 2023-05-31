import { mintMetadataNft } from './mint-metadata-nft';

// Sample function to get metadata. Use GET query to get metadata from the device that should be stored within the NFT.
const getDeviceMetadata = async () => {
  return { name: 'Test', someValue: 'test' };
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
  // Execute function to Mint Metadata NFT
  await mintMetadataNft(
    // Get Device Metadata.
    await getDeviceMetadata(),
  );
};

callMetadataNftCreate();