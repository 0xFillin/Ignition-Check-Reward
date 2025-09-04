// app/lib/pools.ts

import { createPublicClient, http, formatUnits, Address, PublicClient } from 'viem';
import { linea } from 'viem/chains';
// ++ IMPORT the new ABI
import { allItemsConfig, TOKENS, erc20Abi, uniswapV2PairAbi, aaveATokenAbi, chainlinkPriceFeedAbi, AAVE_ETH_PRICE_FEED_ADDRESS, REWARDS_GIST_URL, eulerVaultAbi } from './constants';

const publicClient: PublicClient = createPublicClient({
  chain: linea,
  transport: http('https://rpc.linea.build'),
});

type RewardsData = {
  [id: string]: string;
};

const parseNumberFromString = (value: string | undefined): number => {
    if (!value) return 0;
    return parseFloat(value.replace(/,/g, '')) || 0;
};

export async function fetchPoolsData() {
    // This part remains the same
    const allUniqueTokens = [...new Set(allItemsConfig.flatMap(item => 'tokens' in item ? item.tokens : ('asset' in item ? [item.asset] : [])))].filter(Boolean);

    const contractsToCall: any[] = [
        { address: AAVE_ETH_PRICE_FEED_ADDRESS, abi: chainlinkPriceFeedAbi, functionName: 'latestAnswer' },
        { address: AAVE_ETH_PRICE_FEED_ADDRESS, abi: chainlinkPriceFeedAbi, functionName: 'decimals' },
        ...allUniqueTokens.map(tokenAddress => ({ address: tokenAddress, abi: erc20Abi, functionName: 'decimals' })),
    ];

    allItemsConfig.forEach(item => {
        if ('protocol' in item && item.protocol === 'AAVE') {
            contractsToCall.push({ address: item.address, abi: aaveATokenAbi, functionName: 'totalSupply' });
            contractsToCall.push({ address: item.address, abi: aaveATokenAbi, functionName: 'UNDERLYING_ASSET_ADDRESS' });
        } else if (item.category === 'Liquidity') {
            if (item.calculationMethod === 'balances') {
                item.tokens.forEach(tokenAddress => {
                    contractsToCall.push({ address: tokenAddress, abi: erc20Abi, functionName: 'balanceOf', args: [item.address] });
                });
            } else if (item.calculationMethod === 'reserves') {
                contractsToCall.push({ address: item.address, abi: uniswapV2PairAbi, functionName: 'token0' });
                contractsToCall.push({ address: item.address, abi: uniswapV2PairAbi, functionName: 'token1' });
                contractsToCall.push({ address: item.address, abi: uniswapV2PairAbi, functionName: 'getReserves' });
            }
        } else if (item.category === 'Lending') {
            // ** CHANGED LOGIC FOR EULER VAULTS **
            // Instead of checking the balance of the underlying asset, we call totalSupply on the vault contract itself.
            contractsToCall.push({ address: item.address, abi: eulerVaultAbi, functionName: 'totalSupply' });
        }
    });
    
    // This part remains the same
    const multicallPromise = publicClient.multicall({ contracts: contractsToCall, allowFailure: false });
    
    const rewardsPromise = fetch(REWARDS_GIST_URL)
        .then(response => {
            if (!response.ok) throw new Error('Gist fetch failed');
            return response.json();
        })
        .catch(error => {
            console.error("Failed to fetch rewards from Gist:", error);
            return {};
        });

    const [multicallResults, rewardsData] = await Promise.all([
        multicallPromise,
        rewardsPromise as Promise<RewardsData>
    ]);

    let resultIndex = 0;
    const chainlinkEthPriceRaw = multicallResults[resultIndex++] as bigint;
    const chainlinkDecimals = multicallResults[resultIndex++] as number;
    const ethPrice = parseFloat(formatUnits(chainlinkEthPriceRaw, chainlinkDecimals));

    const decimalsMap = new Map<Address, number>();
    allUniqueTokens.forEach(token => decimalsMap.set(token, multicallResults[resultIndex++] as number));

    const itemRawData = new Map<string, any>();
    allItemsConfig.forEach(item => {
        if ('protocol' in item && item.protocol === 'AAVE') {
            itemRawData.set(item.id, {
                totalSupply: multicallResults[resultIndex++] as bigint,
                underlyingAsset: multicallResults[resultIndex++] as Address
            });
        } else if (item.category === 'Liquidity') {
            if (item.calculationMethod === 'balances') {
                const balances: { [key: Address]: bigint } = {};
                item.tokens.forEach(tokenAddress => {
                    balances[tokenAddress] = multicallResults[resultIndex++] as bigint;
                });
                itemRawData.set(item.id, { balances });
            } else if (item.calculationMethod === 'reserves') {
                itemRawData.set(item.id, {
                    token0: multicallResults[resultIndex++] as Address,
                    token1: multicallResults[resultIndex++] as Address,
                    reserves: multicallResults[resultIndex++] as readonly [bigint, bigint, number],
                });
            }
        } else if (item.category === 'Lending') {
            // ** CHANGED: store totalSupply instead of balance **
            itemRawData.set(item.id, { totalSupply: multicallResults[resultIndex++] as bigint });
        }
    });

    // Price calculation logic remains the same
    const prices = new Map<Address, number>();
    prices.set(TOKENS.USDC, 1);
    prices.set(TOKENS.USDT, 1);
    prices.set(TOKENS.ETH, ethPrice);
    
    const wbtcEthPoolBalances = itemRawData.get('wbtc-eth')!.balances;
    const wbtcPrice = (parseFloat(formatUnits(wbtcEthPoolBalances[TOKENS.ETH], decimalsMap.get(TOKENS.ETH)!)) / parseFloat(formatUnits(wbtcEthPoolBalances[TOKENS.WBTC], decimalsMap.get(TOKENS.WBTC)!))) * ethPrice;
    prices.set(TOKENS.WBTC, wbtcPrice);

    const rexEthPoolReserves = itemRawData.get('rex-eth')!;
    const reserveREX = rexEthPoolReserves.token0.toLowerCase() === TOKENS.REX.toLowerCase() ? rexEthPoolReserves.reserves[0] : rexEthPoolReserves.reserves[1];
    const reserveETH_rex = rexEthPoolReserves.token0.toLowerCase() === TOKENS.REX.toLowerCase() ? rexEthPoolReserves.reserves[1] : rexEthPoolReserves.reserves[0];
    const rexPrice = (parseFloat(formatUnits(reserveETH_rex, decimalsMap.get(TOKENS.ETH)!)) / parseFloat(formatUnits(reserveREX, decimalsMap.get(TOKENS.REX)!))) * ethPrice;
    prices.set(TOKENS.REX, rexPrice);

    return allItemsConfig.map(itemConf => {
        let tvl = 0;
        let finalItemData: any = { ...itemConf };
        const data = itemRawData.get(itemConf.id)!;

        if ('protocol' in itemConf && itemConf.protocol === 'AAVE') {
            const underlyingAsset = data.underlyingAsset;
            const underlyingDecimals = decimalsMap.get(underlyingAsset) ?? 18;
            const amount = parseFloat(formatUnits(data.totalSupply, underlyingDecimals));
            tvl = amount * (prices.get(underlyingAsset) || 0);
            finalItemData.underlyingAsset = underlyingAsset;
        } else if (itemConf.category === 'Liquidity') {
            if (itemConf.calculationMethod === 'balances') {
                itemConf.tokens.forEach(tokenAddress => {
                    const amount = parseFloat(formatUnits(data.balances[tokenAddress], decimalsMap.get(tokenAddress)!));
                    tvl += amount * (prices.get(tokenAddress) || 0);
                });
            } else if (itemConf.calculationMethod === 'reserves') {
                const { token0, token1, reserves } = data;
                const amount0 = parseFloat(formatUnits(reserves[0], decimalsMap.get(token0)!));
                const amount1 = parseFloat(formatUnits(reserves[1], decimalsMap.get(token1)!));
                tvl = (amount0 * (prices.get(token0) || 0)) + (amount1 * (prices.get(token1) || 0));
            }
        } else if (itemConf.category === 'Lending') {
            // ** CHANGED: Use totalSupply and format it with underlying asset's decimals **
            if ('asset' in itemConf && itemConf.asset) {
                const amount = parseFloat(formatUnits(data.totalSupply, decimalsMap.get(itemConf.asset)!));
                tvl = amount * (prices.get(itemConf.asset) || 0);
            }
        }
        
        const rewardString = rewardsData[itemConf.id] || "0";

        return {
            ...finalItemData,
            tvlRaw: tvl,
            tvlFormatted: tvl.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }),
            rewardLastWeekRaw: parseNumberFromString(rewardString),
            rewardLastWeekFormatted: rewardString,
            type: itemConf.category,
        };
    });
}