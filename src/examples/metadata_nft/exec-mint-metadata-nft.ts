import { mintMetadataNft } from './mint-metadata-nft';

const exec = async () => {
  await mintMetadataNft({ name: 'Test', someValue: 'test' });
};

exec();
