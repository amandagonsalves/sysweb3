import axios from 'axios';
import camelcaseKeys from 'camelcase-keys';
import sys from 'syscoinjs-lib';

import { IEthereumAddress, createContractUsingAbi } from '.';
import abi20 from './abi/erc20.json';
import abi from './abi/erc721.json';
import tokens from './tokens.json';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

/**
 *
 * @param contract Address of the token contract
 * @param tokenId ID of the token
 * @returns the link of the image for the given token
 */
export const getNftImage = async (
  contract: string,
  tokenId: number
): Promise<string> => {
  try {
    const nft = await (await createContractUsingAbi(abi, contract)).methods
      .tokenURI(tokenId)
      .call();

    if (nft) {
      const ipfsUrl = String(nft).replace('ipfs://', 'https://ipfs.io/ipfs/');

      const url = await axios.get(ipfsUrl);

      return String(url.data.image).replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    throw new Error('NFTinfo not found.');
  } catch (error) {
    console.error(
      'Verify current network. Set the same network of NFT contract.'
    );

    throw error;
  }
};

export const getTokenIconBySymbol = async (
  symbol: string
): Promise<string | undefined> => {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/search?query=${symbol.toUpperCase()}`
    );

    const tokens = response.data.coins.filter((token: any) => {
      return token.symbol.toUpperCase() === symbol.toLocaleUpperCase();
    });

    if (tokens) {
      return tokens[0].thumb;
    }
  } catch (error) {
    throw new Error('Token icon not found');
  }
};

export const isNFT = (guid: number) => {
  const assetGuid = BigInt.asUintN(64, BigInt(guid));

  return assetGuid >> BigInt(32) > 0;
};

export const getHost = (url: string) => {
  if (typeof url === 'string' && url !== '') {
    return new URL(url).host;
  }

  return url;
};

export const getToken = async (id: string): Promise<ICoingeckoToken> => {
  let token;
  try {
    const response = await axios.get(`${COINGECKO_API}/coins/${id}`);
    token = response.data;
  } catch (error) {
    throw new Error('Unable to retrieve token data');
  }

  return camelcaseKeys(token, { deep: true });
};

/**
 * Converts a token to a fiat value
 *
 * Parameters should be all lower case and written by extense
 *
 * @param token Token to get fiat price from
 * @param fiat Fiat to convert token price to, should be a {@link [ISO 4217 code](https://docs.1010data.com/1010dataReferenceManual/DataTypesAndFormats/currencyUnitCodes.html)}
 * @example 'syscoin' for token | 'usd' for fiat
 */
export const getFiatValueByToken = async (
  token: string,
  fiat: string
): Promise<{
  price: number;
  priceChange: number;
}> => {
  const { marketData } = await getToken(token);

  return {
    price: marketData.currentPrice[fiat],
    priceChange: marketData.priceChange24H,
  };
};

/**
 * Get token symbol by chain
 * @param chain should be written in lower case and by extense
 * @example 'ethereum' | 'syscoin'
 */
export const getSymbolByChain = async (chain: string): Promise<string> => {
  const { symbol } = await getToken(chain);

  return symbol.toUpperCase();
};

export const getTokenBySymbol = async (
  symbol: string
): Promise<{
  symbol: string;
  icon: string;
  description: string;
  contract: string;
}> => {
  const {
    data: {
      symbol: _symbol,
      contract_address: contractAddress,
      description,
      image,
    },
  } = await axios.get(
    `https://api.coingecko.com/api/v3/search?query=${symbol}`
  );

  const symbolToUpperCase = _symbol.toString().toUpperCase();

  return {
    symbol: symbolToUpperCase,
    icon: image.small,
    description: description.en,
    contract: contractAddress,
  };
};

export const getSearch = async (
  query: string
): Promise<ICoingeckoSearchResults> => {
  const response = await axios.get(`${COINGECKO_API}/search?query=${query}`);

  return camelcaseKeys(response.data, { deep: true });
};

/**
 *
 * @param tokenAddress Contract address of the token to get info from
 */

export const getWeb3TokenData = async (tokenAddress: string) => {
  try {
    const {
      data: {
        id,
        symbol,
        name,
        asset_platform_id: assetPlatformId,
        description: { en },
        links: { homepage },
        blockchain_site: blockchainSite,
        image: { thumb },
        current_price: currentPrice,
      },
    } = await axios.get(
      `https://api.coingecko.com/api/v3/coins/ethereum/contract/${tokenAddress}`
    );

    return {
      id,
      symbol,
      name,
      assetPlatformId,
      description: en,
      links: homepage,
      explorer: blockchainSite,
      image: thumb,
      currentPrice,
    };
  } catch (error) {
    throw new Error('Token not found, verify the Token Contract Address.');
  }
};

/**
 *
 * @param address Contract address of the token to validate
 */
export const validateToken = async (
  address: string
): Promise<IErc20Token | any> => {
  try {
    const contract = await createContractUsingAbi(abi20, address);

    const [decimals, name, symbol]: IErc20Token[] = await Promise.all([
      contract.methods.decimals().call(),
      contract.methods.name().call(),
      contract.methods.symbol().call(),
    ]);

    const validToken = decimals && name && symbol;

    if (validToken) {
      return {
        name: String(name),
        symbol: String(symbol),
        decimals: Number(decimals),
      };
    }

    return console.error('Invalid token');
  } catch (error) {
    return console.error('Token not found, verify the Token Contract Address.');
  }
};

export const getTokenJson = () => tokens;

export const getAsset = async (
  explorerUrl: string,
  assetGuid: string
): Promise<{
  assetGuid: string;
  contract: string;
  decimals: number;
  maxSupply: string;
  pubData: any;
  symbol: string;
  totalSupply: string;
  updateCapabilityFlags: number;
}> => sys.utils.fetchBackendAsset(explorerUrl, assetGuid);

export const countDecimals = (x: number) => {
  if (Math.floor(x) === x) return 0;

  return x.toString().split('.')[1].length || 0;
};

/** types */

// the source is in snake case
export interface ICoingeckoToken {
  id: string;
  symbol: string;
  name: string;
  assetPlatformId: string;
  platforms: object;
  blockTimeInMinutes: number;
  hashingAlgorithm?: string;
  categories: string[];
  localization: object;
  description: object;
  links: object;
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  countryOrigin: string;
  genesisDate?: string;
  contractAddress?: string;
  sentimentVotesUpPercentage: number;
  sentimentVotesDownPercentage: number;
  icoData?: object;
  marketCapRank: number;
  coingeckoRank: number;
  coingeckoScore: number;
  developerScore: number;
  communityScore: number;
  liquidityScore: number;
  publicInterestScore: number;
  marketData: {
    currentPrice: { [fiat: string]: number };
    marketCap: { [fiat: string]: number };
    totalVolume: { [fiat: string]: number };
    fullyDilutedValuation: object;
    totalValueLocked?: object;
    fdvToTvlRatio?: number;
    mcapToTvlRatio?: number;
    circulatingSupply: number;
    totalSupply?: number;
    maxSupply?: number;
    priceChange24H: number;
  };
  communityData: object;
  developerData: object;
  publicInterestStats: object;
  lastUpdated: string;
  tickers: object[];
}

export interface ICoingeckoSearchResults {
  coins: {
    id: string;
    name: string;
    symbol: string;
    marketCapRank: number;
    thumb: string;
    large: string;
  }[];
  exchanges: object[];
  icos: object[];
  categories: object[];
  nfts: object[];
}

export type EthTokenDetails = {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  description: string;
  contract: string;
};

export type IEthereumTokensResponse = {
  ethereum: IEthereumAddress;
};

export type IEthereumToken = {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  large: string;
};

export type TokenIcon = {
  thumbImage: string;
  largeImage: string;
};

export type IEthereumNft = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  tokenID: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
};

export type IErc20Token = {
  name: string;
  symbol: string;
  decimals: number;
};

export enum IKeyringTokenType {
  SYS = 'SYS',
  ETH = 'ETH',
  ERC20 = 'ERC20',
}

export type ISyscoinToken = {
  type: string;
  name: string;
  path: string;
  tokenId: string;
  transfers: number;
  symbol: string;
  decimals: number;
  balance: number;
  totalReceived: string;
  totalSent: string;
};

export type IAddressMap = {
  changeAddress: string;
  outputs: [
    {
      value: number;
      address: string;
    }
  ];
};

export type ITokenMap = Map<string, IAddressMap>;
/** end */
