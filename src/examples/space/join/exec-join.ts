import config from '../../../config.json';
import { joinSpace } from './join';

const exec = async () => {
  if (!process.argv[2]) {
    throw Error('You must provide space UID');
  }
  await joinSpace(config.mnemonic, process.argv[2]);
};

exec();
