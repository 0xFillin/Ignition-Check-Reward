'use client';

import Image from "next/image";
import { useState, useEffect, useCallback, useMemo } from "react";

import * as RadixDialog from '@radix-ui/react-dialog';

import { ChevronsUpDown, ChevronUp, ChevronDown, X, ChartBar, HelpCircle, Info } from 'lucide-react';

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

const formatTime = (time: number) => time < 10 ? `0${time}` : time;

export default function Home() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [manualLineaPrice, setManualLineaPrice] = useState<string>('');
  const [fetchedLineaPrice, setFetchedLineaPrice] = useState<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(true);

  const [globalDeposit, setGlobalDeposit] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [isFdvModalOpen, setIsFdvModalOpen] = useState(false);
  const [modalAllMarkets, setModalAllMarkets] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CalculableItem | null>(null);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ row: number | null; col: number | null }>({ row: null, col: null });

  useEffect(() => {
    const fetchPrice = async () => {
      if (!fetchedLineaPrice) {
        setIsPriceLoading(true);
      }
      try {
        const response = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=LINEAUSDT');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const price = parseFloat(data.markPrice);
        setFetchedLineaPrice(price);
      } catch (error) {
        console.error("Failed to fetch Linea price:", error);
        setFetchedLineaPrice(null);
      } finally {
        setIsPriceLoading(false);
      }
    };

    fetchPrice();
    const priceInterval = setInterval(fetchPrice, 60000);

    return () => clearInterval(priceInterval);
  }, [fetchedLineaPrice]);

  const [countdown, setCountdown] = useState({
    days: '0',
    hours: '00',
    minutes: '00',
    seconds: '00',
    isFinished: false
  });

  useEffect(() => {
    const countdownDate = new Date('2025-10-27T00:00:00Z').getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = countdownDate - now;
      if (distance < 0) {
        clearInterval(interval);
        setCountdown({ days: '0', hours: '00', minutes: '00', seconds: '00', isFinished: true });
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setCountdown({
        days: String(days),
        hours: String(formatTime(hours)),
        minutes: String(formatTime(minutes)),
        seconds: String(formatTime(seconds)),
        isFinished: false
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const disclaimerAccepted = localStorage.getItem('disclaimerAccepted');
    if (!disclaimerAccepted) {
      setIsDisclaimerOpen(true);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('disclaimerAccepted', 'true');
    setIsDisclaimerOpen(false);
  };


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
    const priceToUse = manualLineaPrice !== '' ? parseFloat(manualLineaPrice) : fetchedLineaPrice;
    const priceOfLinea = priceToUse || 0;

    return (items || []).map(item => {
      const tvl = item.tvlRaw || 0;
      const weeklyReward = item.rewardLastWeekRaw || 0;
      const apr = (tvl > 0 && weeklyReward > 0) ? (weeklyReward / tvl) * 52 * 100 : 0;
      const depositValue = parseFloat(globalDeposit) || 0;
      const userWeeklyRewards = (tvl > 0 && depositValue > 0) ? (depositValue / tvl) * weeklyReward : 0;
      const userWeeklyProfit = userWeeklyRewards * priceOfLinea;
      return { ...item, apr, userWeeklyRewards, userWeeklyProfit };
    });
  }, [items, globalDeposit, manualLineaPrice, fetchedLineaPrice]);

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
    { key: 'userWeeklyProfit', label: 'Your Weekly Profit', sortable: true },
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

  function openFdvModalForItem(item: CalculableItem) {
    setSelectedItem(item);
    setModalAllMarkets(false);
    setIsFdvModalOpen(true);
  }

  function openFdvModalAllMarkets() {
    setSelectedItem(null);
    setModalAllMarkets(true);
    setIsFdvModalOpen(true);
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
      <div className="site-container">

        <div className="linea-calculate-container">
{/* --- КАРТОЧКА 1: ИНФО (ОБНОВЛЕННЫЙ ДИЗАЙН) --- */}
          <div className="lc-card lc-card-info">
            <div className="lc-header">
              <div>
                  <h2 className="lc-title">Linea Rewards Calculator</h2>
                  <p className="lc-subtitle">Estimate weekly LINEA rewards</p>
              </div>
              <div className="lc-header-actions">
                <a href="https://linea-ignition-docs.brevis.network/" target="_blank" rel="noopener noreferrer" className="lc-header-icon" title="About">
                  <Info size={18} />
                </a>
                <button className="lc-header-icon" onClick={openFdvModalAllMarkets} title="Open FDV table for all markets" aria-label="Open FDV table for all markets">
                  <ChartBar size={18} />
                </button>
              </div>
            </div>

            <div className="price-display-panel">
              <Image src="/linea.png" alt="Linea Logo" width={28} height={28} />
              <div className="price-info">
                  <span className="price-info-label">Linea Market Price</span>
                  <span className="price-info-value">
                      {isPriceLoading ? <LoadingSpinner /> : fetchedLineaPrice ? `$${fetchedLineaPrice.toFixed(4)}` : 'Error'}
                  </span>
              </div>
            </div>
          </div>
          
          <div className="lc-card lc-card-inputs">
            <div className="lc-field">
              <label htmlFor="global-deposit" className="lc-label">Deposit ($)</label>
              <input type="number" id="global-deposit" value={globalDeposit} onChange={(e) => setGlobalDeposit(e.target.value)} placeholder="e.g., 1000" className="lc-input" />
            </div>
            <div className="lc-field">
              <label htmlFor="linea-price" className="lc-label">Linea Price ($)</label>
              <input type="number" id="linea-price" value={manualLineaPrice} onChange={(e) => setManualLineaPrice(e.target.value)} placeholder="Manual override" className="lc-input" />
            </div>
          </div>

          <div className="lc-card lc-card-countdown">
            <h3 className="countdown-title">Time to end Linea Ignition</h3>
            {countdown.isFinished ? (
              <div className="countdown-finished">The event has started!</div>
            ) : (
              <div className="countdown-container">
                <div className="countdown-item">
                  <span className="countdown-number">{countdown.days}</span>
                  <span className="countdown-label">Days</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-number">{countdown.hours}</span>
                  <span className="countdown-label">Hours</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-number">{countdown.minutes}</span>
                  <span className="countdown-label">Minutes</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-number">{countdown.seconds}</span>
                  <span className="countdown-label">Seconds</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="table-card">
          <div className="grid-table" role="grid">
            {headers.map((header) => {
              const isSortable = header.sortable;
              const headerClassKey = header.key === 'name' ? 'market' : header.key;
              return (
                <div key={header.key} className={`cell-header cell-header--${headerClassKey}`} role="columnheader">
                  {isSortable ? (
                    <button className="header-button" onClick={() => handleSort(header.key as keyof CalculableItem)}>
                      <span>{header.label}</span>
                      <SortIcon columnKey={header.key as keyof CalculableItem} />
                    </button>
                  ) : (
                    <div className="header-cell">{header.label}</div>
                  )}
                </div>
              );
            })}

            {isLoading && items.length === 0 ? (
              <div className="loading-cell"><LoadingSpinner /></div>
            ) : (
              sortedItems.map((item) => (
                <div className="table-row" key={item.id} role="row">
                  <div className="cell-table cell-table--market" role="gridcell">
                    <a href={generateMarketUrl(item)} target="_blank" rel="noopener noreferrer" className="link-style" title={item.name}>
                      <Image src={item.img} alt={item.name} width={20} height={20} className="rounded-full" />
                      <span className="market-name" title={item.name}>{item.name}</span>
                    </a>
                  </div>
                  <div className="cell-table cell-table--type" role="gridcell">{item.type}</div>
                  <div className="cell-table cell-table--tvlRaw num" role="gridcell">{item.tvlFormatted}</div>
                  <div className="cell-table cell-table--rewardLastWeekRaw num" role="gridcell">
                    {typeof item.rewardLastWeekRaw === 'number' && item.rewardLastWeekRaw > 0 ? item.rewardLastWeekRaw.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : <Placeholder />}
                  </div>

                  <div className="cell-table cell-table--userWeeklyRewards num" role="gridcell">
                    <div className="rewards-cell-content">
                        <span>
                            {item.userWeeklyRewards > 0 ? item.userWeeklyRewards.toFixed(2) : <Placeholder />}
                        </span>
                        {item.type === 'Liquidity' && (
                            <div className="tooltip-icon" title="Rewards may not be accurate, as they are calculated based on the principle userWeeklyRewards = (depositValue / tvl) * weeklyReward.">
                                <HelpCircle size={14} />
                            </div>
                        )}
                    </div>
                  </div>
                  
                  <div className="cell-table cell-table--userWeeklyProfit" role="gridcell">
                    <div className="profit-cell-content">
                      <span className="profit-amount">{item.userWeeklyProfit > 0 ? item.userWeeklyProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '—'}</span>
                      <button className="icon-button" onClick={() => openFdvModalForItem(item)} aria-label={`Open FDV simulation for ${item.name}`} title="Open FDV simulation">
                        <ChartBar size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <RadixDialog.Root open={isFdvModalOpen} onOpenChange={setIsFdvModalOpen}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="rd-overlay" />
          <RadixDialog.Content className="rd-content">
            <div className="rd-header">
              <RadixDialog.Title className="rd-title">
                {modalAllMarkets ? 'FDV Profit — All Markets' : `FDV Profit — ${selectedItem ? selectedItem.name : ''}`}
              </RadixDialog.Title>
              <button className="rd-close" onClick={() => setIsFdvModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="rd-body">
              {modalAllMarkets ? (
                <div 
                  className="fdv-table-wrapper" 
                  onMouseLeave={() => setHoveredCell({ row: null, col: null })}
                >
                  <table className="fdv-table">
                    <thead>
                      <tr>
                        <th className="sticky-header sticky-corner">FDV</th>
                        {sortedItems.map((market, colIndex) => (
                          <th 
                            key={market.id} 
                            className={`sticky-header ${hoveredCell.col === colIndex ? 'highlight-col-header' : ''}`}
                            onMouseEnter={() => setHoveredCell({ row: hoveredCell.row, col: colIndex })}
                          >
                            {market.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fdvList.map((fdv, rowIndex) => (
                        <tr 
                          key={fdv}
                          className={hoveredCell.row === rowIndex ? 'highlight-row' : ''}
                        >
                          <th 
                            className={`sticky-col ${hoveredCell.row === rowIndex ? 'highlight-row-header' : ''}`}
                            onMouseEnter={() => setHoveredCell({ col: hoveredCell.col, row: rowIndex })}
                          >
                            {fdv.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                          </th>
                          {sortedItems.map((market, colIndex) => {
                            const price = fdv / LINEA_TOTAL_SUPPLY;
                            const profit = market.userWeeklyRewards > 0 ? market.userWeeklyRewards * price : 0;
                            const isHovered = hoveredCell.row === rowIndex && hoveredCell.col === colIndex;

                            return (
                              <td
                                key={market.id}
                                className={hoveredCell.col === colIndex ? 'highlight-col' : ''}
                                onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                              >
                                <div className={`market-cell-content ${isHovered ? 'highlight-cell' : ''}`}>
                                  {profit > 0 ? profit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '—'}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : selectedItem ? (
                <div className="fdv-table-wrapper">
                  <table className="fdv-table fdv-table-single">
                    <thead>
                      <tr>
                        <th>FDV</th>
                        <th>Your Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fdvList.map(fdv => {
                        const price = fdv / LINEA_TOTAL_SUPPLY;
                        const profit = selectedItem.userWeeklyRewards > 0 ? selectedItem.userWeeklyRewards * price : 0;
                        return (
                          <tr key={fdv}>
                            <td>{fdv.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</td>
                            <td className="market-cell-profit">
                              {profit > 0 ? profit.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div>No data</div>
              )}
            </div>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>

      <RadixDialog.Root open={isDisclaimerOpen} onOpenChange={setIsDisclaimerOpen}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="rd-overlay" />
          <RadixDialog.Content className="rd-content disclaimer-content">
            <div className="rd-header">
              <RadixDialog.Title className="rd-title">Disclaimer</RadixDialog.Title>
            </div>
            <div className="rd-body">
              <p className="disclaimer-text">
                Please be aware of the risks involved. This is NOT an official rewards checker.
                It is a custom-coded tool that calculates potential rewards based on the documentation provided at: <a href="https://linea-ignition-docs.brevis.network/linea-ignition-campaign/rewards-calculation" target="_blank" rel="noopener noreferrer">Linea Ignition Docs</a>.
              </p>
              <p className="disclaimer-text">
                The actual rewards you receive may differ. Use this tool at your own discretion.
              </p>
              <div className="disclaimer-actions">
                <button className="disclaimer-accept-button" onClick={handleAcceptDisclaimer}>
                  I Understand and Accept
                </button>
              </div>
            </div>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>

    </main>
  );
}