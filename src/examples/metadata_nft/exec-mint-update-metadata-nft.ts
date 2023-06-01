import { mintMetadataNft } from './mint-metadata-nft';

const exec = async () => {
  const { nftId } = await mintMetadataNft({ name: 'Test', someValue: 'test' });
  console.log('\n');
  await mintMetadataNft({ name: 'Test2', someValue: 'test_test2' }, undefined, undefined, nftId);
};

exec();
