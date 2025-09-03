'use client';

import Image from "next/image";
import { useState, useEffect, useCallback, useMemo } from "react";

import * as RadixDialog from '@radix-ui/react-dialog';

import { ChevronsUpDown, ChevronUp, ChevronDown, X, ChartBar } from 'lucide-react';

import { fetchPoolsData } from "./lib/pools";
import { LINEA_TOTAL_SUPPLY } from "./lib/constants";
import { Address } from "viem";

type FetchedItemData = Awaited<ReturnType<typeof fetchPoolsData>>[0];
type ItemData = FetchedItemData & { underlyingAsset?: Address };
interface CachedData {
  timestamp: number;
  data: ItemData[];
}
const CACHE_KEY = 'lineaMarketsCache';
const TEN_MINUTES_MS = 10 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

const Placeholder = () => <span style={{ color: "var(--text-muted)" }}>—</span>;
const LoadingSpinner = () => <div className="spinner" />;

type SortConfig = {
  key: keyof CalculableItem | null;
  direction: 'asc' | 'desc' | null;
};
type CalculableItem = ItemData & {
  apr: number;
  userWeeklyRewards: number;
  userWeeklyProfit: number;
};

export default function Home() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lineaPrice, setLineaPrice] = useState<string>('');
  const [globalDeposit, setGlobalDeposit] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAllMarkets, setModalAllMarkets] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalculableItem | null>(null);

  const loadItems = useCallback(async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) setIsLoading(true);
    try {
      const data = await fetchPoolsData();
      setItems(data as ItemData[]);
      const cache: CachedData = { timestamp: Date.now(), data: data as ItemData[] };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error("Не удалось загрузить данные:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkCacheAndFetch = () => {
      const cachedItem = localStorage.getItem(CACHE_KEY);
      if (cachedItem) {
        try {
          const cache: CachedData = JSON.parse(cachedItem);
          const age = Date.now() - cache.timestamp;

          if (age > ONE_HOUR_MS) {
            loadItems();
            return;
          }

          setItems(cache.data);
          setIsLoading(false);

          if (age > TEN_MINUTES_MS) {
            loadItems(true);
          }
        } catch (error) {
          loadItems();
        }
      } else {
        loadItems();
      }
    };

    checkCacheAndFetch();
    const intervalId = setInterval(checkCacheAndFetch, TEN_MINUTES_MS);
    return () => clearInterval(intervalId);
  }, [loadItems]);

  const handleSort = (key: keyof CalculableItem) => {
    let direction: 'asc' | 'desc' | null = 'desc';

    if (sortConfig.key === key) {
      if (sortConfig.direction === 'desc') {
        direction = 'asc';
      } else if (sortConfig.direction === 'asc') {
        direction = null;
      }
    }
    setSortConfig({ key, direction });
  };

  const calculableItems = useMemo(() => {
    return (items || []).map(item => {
      const tvl = item.tvlRaw || 0;
      const weeklyReward = item.rewardLastWeekRaw || 0;
      const apr = (tvl > 0 && weeklyReward > 0) ? (weeklyReward / tvl) * 52 * 100 : 0;

      const depositValue = parseFloat(globalDeposit) || 0;
      const userWeeklyRewards = (tvl > 0 && depositValue > 0) ? (depositValue / tvl) * weeklyReward : 0;
      const priceOfLinea = parseFloat(lineaPrice) || 0;
      const userWeeklyProfit = userWeeklyRewards * priceOfLinea;

      return { ...item, apr, userWeeklyRewards, userWeeklyProfit };
    });
  }, [items, globalDeposit, lineaPrice]);

  const sortedItems = useMemo(() => {
    if (!calculableItems || calculableItems.length === 0) return [];
    if (sortConfig.key === null || sortConfig.direction === null) return calculableItems;

    return [...calculableItems].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [calculableItems, sortConfig]);

  const headers = [
    { key: 'name', label: 'Market', sortable: false },
    { key: 'type', label: 'Type', sortable: false },
    { key: 'tvlRaw', label: 'TVL', sortable: true },
    { key: 'rewardLastWeekRaw', label: 'Reward Last Week', sortable: true }, 
    { key: 'userWeeklyRewards', label: 'Your Rewards', sortable: true },
    { key: 'userWeeklyProfit', label: 'Your Profit', sortable: true },
  ];

  const generateMarketUrl = (item: ItemData) => {
    if ('protocol' in item && item.protocol === 'AAVE') {
      if (item.underlyingAsset) {
        return `https://app.aave.com/reserve-overview/?underlyingAsset=${item.underlyingAsset}&marketName=proto_linea_v3`;
      }
      return `https://lineascan.build/address/${item.address}`;
    }
    if (item.category === 'Liquidity') {
      return `https://www.etherex.finance/liquidity/${item.address}`;
    }
    if (item.category === 'Lending') {
      return `https://app.euler.finance/vault/${item.address}?network=lineamainnet`;
    }
    return '#';
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof CalculableItem }) => {
    if (sortConfig.key !== columnKey || sortConfig.direction === null) {
      return <ChevronsUpDown size={14} className="sort-icon" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ChevronUp size={14} className="sort-icon-active" />;
    }
    return <ChevronDown size={14} className="sort-icon-active" />;
  };

  function openModalForItem(item: CalculableItem) {
    setSelectedItem(item);
    setModalAllMarkets(false);
    setIsModalOpen(true);
  }

  function openModalAllMarkets() {
    setSelectedItem(null);
    setModalAllMarkets(true);
    setIsModalOpen(true);
  }

  const generateFdvs = (): number[] => {
    const arr: number[] = [];
    for (let b = 1; b <= 20; b++) arr.push(b * 1_000_000_000);
    for (let b = 25; b <= 100; b += 5) arr.push(b * 1_000_000_000);
    return arr;
  };
  const fdvList = generateFdvs();

  return (
    <main className="min-h-screen page-wrap">
      <div className="max-w-7xl mx-auto">

        <div className="profit-calculator-wrap">
          <div className="profit-calculator-card">
            <div className="pc-header">
              <div>
                <h2 className="pc-title">Profit Calculator</h2>
                <p className="pc-subtitle">Estimate weekly LINEA rewards & USD profit for deposit</p>
              </div>

              <button className="pc-header-icon" onClick={openModalAllMarkets} title="Open FDV table for all markets" aria-label="Open FDV table for all markets">
                <ChartBar size={18} />
              </button>
            </div>

            <div className="pc-grid">
              <div className="pc-field">
                <label htmlFor="global-deposit" className="pc-label">Deposit ($)</label>
                <input
                  type="number"
                  id="global-deposit"
                  value={globalDeposit}
                  onChange={(e) => setGlobalDeposit(e.target.value)}
                  placeholder="e.g., 1000"
                  className="pc-input"
                />
              </div>

              <div className="pc-field">
                <label htmlFor="linea-price" className="pc-label">Current LINEA Price ($)</label>
                <input
                  type="number"
                  id="linea-price"
                  value={lineaPrice}
                  onChange={(e) => setLineaPrice(e.target.value)}
                  placeholder="e.g., 2.5"
                  className="pc-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <div className="table-card">
            <table className="customTable compact" role="table">
              <thead>
                <tr>
                  {headers.map((header) => {
                    const isSortable = header.sortable;
                    return (
                      <th key={header.key}>
                        {isSortable ? (
                          <button className="header-button" onClick={() => handleSort(header.key as keyof CalculableItem)}>
                            <span>{header.label}</span>
                            <SortIcon columnKey={header.key as keyof CalculableItem} />
                          </button>
                        ) : (
                          <div className="header-cell">{header.label}</div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {isLoading && items.length === 0 ? (
                  <tr><td colSpan={headers.length} className="text-center p-6"><LoadingSpinner /></td></tr>
                ) : sortedItems.map((item) => {
                  return (
                    <tr key={item.id}>
                      <td className="cell-left">
                        <a href={generateMarketUrl(item)} target="_blank" rel="noopener noreferrer" className="link-style" title={item.name}>
                          <Image src={item.img} alt={item.name} width={20} height={20} className="rounded-full" />
                          <span className="market-name" title={item.name}>{item.name}</span>
                        </a>
                      </td>
                      <td><div className="center-cell">{item.type}</div></td>
                      <td><div className="right-cell num">{item.tvlFormatted}</div></td>
                      <td>
                        <div className="right-cell num">
                          {typeof item.rewardLastWeekRaw === 'number' && item.rewardLastWeekRaw > 0
                            ? item.rewardLastWeekRaw.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : <Placeholder />}
                        </div>
                      </td>

                      <td><div className="right-cell num">{item.userWeeklyRewards > 0 ? item.userWeeklyRewards.toFixed(2) : <Placeholder />}</div></td>
                      <td>
                        <div className="profit-cell">
                          <span className="profit-amount">{item.userWeeklyProfit > 0 ? item.userWeeklyProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '—'}</span>
                          <button
                            className="icon-button"
                            onClick={() => openModalForItem(item)}
                            aria-label={`Open FDV simulation for ${item.name}`}
                            title="Open FDV simulation"
                          >
                            <ChartBar size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RadixDialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="rd-overlay" />
          <RadixDialog.Content className="rd-content">
            <div className="rd-header">
              <RadixDialog.Title className="rd-title">
                {modalAllMarkets ? 'FDV Profit — All Markets' : `FDV Profit — ${selectedItem ? selectedItem.name : ''}`}
              </RadixDialog.Title>
              <button className="rd-close" onClick={() => setIsModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="rd-body">
              {modalAllMarkets ? (
                <div className="fdv-grid-wrapper">
                  <div
                    className="fdv-grid"
                    style={{
                      gridTemplateColumns: `180px repeat(${sortedItems.length}, 160px)`
                    }}
                    role="grid"
                    aria-label="FDV profit table for all markets"
                  >
                    <div className="fdv-header">FDV</div>
                    {sortedItems.map(m => (
                      <div key={m.id} className="fdv-header market-col" title={m.name}>{m.name}</div>
                    ))}

                    {fdvList.map(fdv => {
                      const fdvLabel = fdv.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
                      return (
                        <FragmentRow key={fdv} fdv={fdv} fdvLabel={fdvLabel} markets={sortedItems} />
                      );
                    })}
                  </div>
                </div>
              ) : selectedItem ? (
                <div className="fdv-grid-wrapper single">
                  <div className="fdv-grid single" style={{ gridTemplateColumns: `220px 1fr` }}>
                    <div className="fdv-header">FDV</div>
                    <div className="fdv-header">Your Profit</div>

                    {fdvList.map(fdv => {
                      const price = fdv / LINEA_TOTAL_SUPPLY;
                      const profit = selectedItem.userWeeklyRewards > 0 ? selectedItem.userWeeklyRewards * price : 0;
                      return (
                        <FragmentSimpleRow key={fdv} fdv={fdv} profit={profit} />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>No data</div>
              )}
            </div>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </main>
  );
}

function FragmentRow({ fdv, fdvLabel, markets }: { fdv: number; fdvLabel: string; markets: CalculableItem[] }) {
  return (
    <>
      <div className="fdv-cell fdv-left">{fdvLabel}</div>
      {markets.map(m => {
        const price = fdv / LINEA_TOTAL_SUPPLY;
        const profit = m.userWeeklyRewards > 0 ? m.userWeeklyRewards * price : 0;
        return (
          <div key={m.id} className="fdv-cell market-cell">
            {profit > 0 ? profit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '—'}
          </div>
        );
      })}
    </>
  );
}

function FragmentSimpleRow({ fdv, profit }: { fdv: number; profit: number }) {
  return (
    <>
      <div className="fdv-cell fdv-left">{fdv.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</div>
      <div className="fdv-cell market-cell">
        {profit > 0 ? profit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '—'}
      </div>
    </>
  );
}