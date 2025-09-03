// app/lib/constants.ts

import { Address } from 'viem';

export const LINEA_TOTAL_SUPPLY = 72009990000;
export const REWARDS_GIST_URL = "https://gist.githubusercontent.com/0xFillin/3ba4b98bde295e846bf4617f4d66d399/raw/a1bef60ba6bfe8e3a3b78ac6d25ca268d56b8dcd/linea-week-1"

export const erc20Abi = [
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

export const uniswapV2PairAbi = [
  { name: "token0", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "token1", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "getReserves", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint112", name: "_reserve0" }, { type: "uint112", name: "_reserve1" }, { type: "uint32", name: "_blockTimestampLast" }] },
] as const;

export const chainlinkPriceFeedAbi = [{"inputs":[{"internalType":"address","name":"_aggregator","type":"address"},{"internalType":"address","name":"_accessController","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"int256","name":"current","type":"int256"},{"indexed":true,"internalType":"uint256","name":"roundId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"updatedAt","type":"uint256"}],"name":"AnswerUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"roundId","type":"uint256"},{"indexed":true,"internalType":"address","name":"startedBy","type":"address"},{"indexed":false,"internalType":"uint256","name":"startedAt","type":"uint256"}],"name":"NewRound","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"accessController","outputs":[{"internalType":"contract AccessControllerInterface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"aggregator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_aggregator","type":"address"}],"name":"confirmAggregator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"description","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_roundId","type":"uint256"}],"name":"getAnswer","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint80","name":"_roundId","type":"uint80"}],"name":"getRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_roundId","type":"uint256"}],"name":"getTimestamp","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestAnswer","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRound","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"latestTimestamp","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint16","name":"","type":"uint16"}],"name":"phaseAggregators","outputs":[{"internalType":"contract AggregatorV2V3Interface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"phaseId","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_aggregator","type":"address"}],"name":"proposeAggregator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"proposedAggregator","outputs":[{"internalType":"contract AggregatorV2V3Interface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint80","name":"_roundId","type":"uint80"}],"name":"proposedGetRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"proposedLatestRoundData","outputs":[{"internalType":"uint80","name":"roundId","type":"uint80"},{"internalType":"int256","name":"answer","type":"int256"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"},{"internalType":"uint80","name":"answeredInRound","type":"uint80"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_accessController","type":"address"}],"name":"setController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_to","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"version","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}] as const;

export const aaveATokenAbi = [
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { name: "UNDERLYING_ASSET_ADDRESS", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
] as const;

export const TOKENS = {
  REX: "0xEfD81eeC32B9A8222D1842ec3d99c7532C31e348" as Address,
  ETH: "0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f" as Address, // WETH
  USDC: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff" as Address,
  USDT: "0xA219439258ca9da29E9Cc4cE5596924745e12B93" as Address,
  WBTC: "0x3aAB2285ddcDdaD8edf438C1bAB47e1a9D05a9b4" as Address,
} as const;

export const AAVE_ETH_PRICE_FEED_ADDRESS = '0x3c6cd9cc7c7a4c2cf5a82734cd249d7d593354da' as Address;

export const poolsConfig = [
    { id: "usdc-usdt", name: "Etherex USDC/USDT", address: "0x35521ec62d91375ac9510d1feefe254b4b582ea0" as Address, img: "/etherex.png", category: 'Liquidity' as const, calculationMethod: 'balances' as const, tokens: [TOKENS.USDC, TOKENS.USDT] },
    { id: "usdc-eth", name: "Etherex USDC/ETH", address: "0x90E8a5b881D211f418d77Ba8978788b62544914B" as Address, img: "/etherex.png", category: 'Liquidity' as const, calculationMethod: 'balances' as const, tokens: [TOKENS.USDC, TOKENS.ETH] },
    { id: "wbtc-eth", name: "Etherex WBTC/ETH", address: "0xc0cd56e070e25913d631876218609f2191da1c2a" as Address, img: "/etherex.png", category: 'Liquidity' as const, calculationMethod: 'balances' as const, tokens: [TOKENS.WBTC, TOKENS.ETH] },
    { id: "rex-eth", name: "Etherex REX/ETH", address: "0x5C1Bf4B7563C460282617a0304E3cDE133200f70" as Address, img: "/etherex.png", category: 'Liquidity' as const, calculationMethod: 'reserves' as const, tokens: [TOKENS.REX, TOKENS.ETH] },
];

export const lendingVaultsConfig = [
    { id: 're7-usdc', name: 'Euler USDC (Re7 Labs)', address: '0xfB6448B96637d90FcF2E4Ad2c622A487d0496e6f' as Address, asset: TOKENS.USDC, category: 'Lending' as const, img: '/euler.svg' },
    { id: 'zerolend-usdc', name: 'Euler USDC (ZeroLend)', address: '0x14EfcC1Ae56e2fF75204Ef2Fb0DE43378d0beaDA' as Address, asset: TOKENS.USDC, category: 'Lending' as const, img: '/euler.svg' },
    { id: 're7-usdt', name: 'Euler USDT (Re7 Labs)', address: '0xCBeF9be95738290188B25ca9A6Dd2bEc417a578c' as Address, asset: TOKENS.USDT, category: 'Lending' as const, img: '/euler.svg' },
    { id: 'zerolend-usdt', name: 'Euler USDT (ZeroLend)', address: '0x085f80Df643307e04f23281F6fdbfAA13865E852' as Address, asset: TOKENS.USDT, category: 'Lending' as const, img: '/euler.svg' },
    { id: 're7-weth', name: 'Euler WETH (Re7 Labs)', address: '0xb135dcF653DAFB5ddAa93F926D7000Aa3222EFEE' as Address, asset: TOKENS.ETH, category: 'Lending' as const, img: '/euler.svg' },
    { id: 'zerolend-weth', name: 'Euler WETH (ZeroLend)', address: '0x9aC2F0A564B7396A8692E1558d23a12d5a2aBb1F' as Address, asset: TOKENS.ETH, category: 'Lending' as const, img: '/euler.svg' },
    { id: 'ezeth-cluster', name: 'Euler WETH (ezETH)', address: '0x8bf8EdC911Ab3f0ea4a27c51Cb88b57ccE5356f1' as Address, asset: TOKENS.ETH, category: 'Lending' as const, img: '/euler.svg' },
    { id: 'weeth-cluster', name: 'Euler WETH (weETH)', address: '0xF4712fC5E6483DE9e1Ff661D95DD686664327086' as Address, asset: TOKENS.ETH, category: 'Lending' as const, img: '/euler.svg' },
    { id: 'wrseth-cluster', name: 'Euler WETH (wrsETH)', address: '0x179DfD3eCDC6f5B8F8788584F3289D10c6F1afb8' as Address, asset: TOKENS.ETH, category: 'Lending' as const, img: '/euler.svg' },
    { id: 'wsteth-cluster', name: 'Euler WETH (wstETH)', address: '0xa8A02E6a894a490D04B6cd480857A19477854968' as Address, asset: TOKENS.ETH, category: 'Lending' as const, img: '/euler.svg' },
];

export const aaveMarketsConfig = [
    { id: 'aave-usdc', name: 'AAVE USDC', address: '0x374D7860c4f2f604De0191298dD393703Cce84f3' as Address, category: 'Lending' as const, protocol: 'AAVE' as const, img: '/aave.png' },
    { id: 'aave-usdt', name: 'AAVE USDT', address: '0x88231dfEC71D4FF5c1e466D08C321944A7adC673' as Address, category: 'Lending' as const, protocol: 'AAVE' as const, img: '/aave.png' },
    { id: 'aave-eth', name: 'AAVE ETH', address: '0x787897dF92703BB3Fc4d9Ee98e15C0b8130Bf163' as Address, category: 'Lending' as const, protocol: 'AAVE' as const, img: '/aave.png' },
];

export const allItemsConfig = [...poolsConfig, ...lendingVaultsConfig, ...aaveMarketsConfig];