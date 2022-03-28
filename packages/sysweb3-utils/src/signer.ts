import { BitcoinNetwork, ISyscoinPubTypes, SyscoinHDSigner } from 'types/index'
const sys = require('syscoinjs-lib');

let mainSigner = null;
let hdSigner: SyscoinHDSigner | null = null;

const getPrimaryAccount = () => {};

const getMainSigner = ({ SignerIn, blockbookURL, network }) => {
  if (!mainSigner) {
    mainSigner = new sys.SyscoinJSLib(SignerIn, blockbookURL, network);
  }

  return mainSigner;
};

const getHdSigner = ({
  walletMnemonic,
  walletPassword,
  isTestnet,
  networks,
  SLIP44,
  pubTypes,
}: {
  SLIP44?: string;
  isTestnet: boolean;
  networks?: BitcoinNetwork;
  pubTypes?: ISyscoinPubTypes;
  walletMnemonic: string;
  walletPassword?: string;
}): SyscoinHDSigner | null => {
  if (!hdSigner) {
    hdSigner = new sys.utils.HDSigner(
      walletMnemonic,
      walletPassword,
      isTestnet,
      networks,
      SLIP44,
      pubTypes
    );
  }

  return hdSigner;
};

return {
  getPrimaryAccount,
  getMainSigner,
  getHdSigner,
};