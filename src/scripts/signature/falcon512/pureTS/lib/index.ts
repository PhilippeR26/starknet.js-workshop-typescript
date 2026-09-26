// Public API of the Falcon-512 S2morrow signer (future `starknet/falcon` subpath).
export { Falcon512Signer } from './Falcon512Signer';
export { verify, verifyMessage } from './verify';
export {
  exportFalconRsSecretKey,
  generateKeyPair,
  getPublicKey,
  getStarknetPublicKey,
  importFalconRsSecretKey,
  type Falcon512KeyPair,
} from './s2morrow/keys';
