import { useState, useEffect } from 'react';

interface CurrencyConfig {
  symbol: string;
  position: 'before' | 'after';
  customSymbol?: string;
}

const DEFAULT_CONFIG: CurrencyConfig = {
  symbol: '',
  position: 'before',
  customSymbol: '',
};

export const useCurrency = () => {
  const [config, setConfig] = useState<CurrencyConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    // Load initial settings
    const loadSettings = () => {
      const saved = localStorage.getItem('currencySettings');
      if (saved) {
        try {
          const parsedConfig = JSON.parse(saved);
          setConfig(parsedConfig);
        } catch (error) {
          console.error('Error loading currency settings:', error);
          setConfig(DEFAULT_CONFIG);
        }
      }
    };

    loadSettings();

    // Listen for settings changes
    const handleSettingsChange = (event: CustomEvent) => {
      setConfig(event.detail);
    };

    window.addEventListener('currencySettingsChanged', handleSettingsChange as EventListener);

    return () => {
      window.removeEventListener('currencySettingsChanged', handleSettingsChange as EventListener);
    };
  }, []);

  const formatCurrency = (amount: number | string, options?: { 
    showZero?: boolean;
    decimals?: number;
  }): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return 'N/A';
    if (numAmount === 0 && !options?.showZero) return '0';

    const decimals = options?.decimals ?? 2;
    const formattedAmount = numAmount.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    if (!config.symbol) return formattedAmount;

    return config.position === 'before' 
      ? `${config.symbol}${formattedAmount}`
      : `${formattedAmount}${config.symbol}`;
  };

  const getCurrencySymbol = (): string => {
    return config.symbol;
  };

  const getCurrencyPosition = (): 'before' | 'after' => {
    return config.position;
  };

  return {
    formatCurrency,
    getCurrencySymbol,
    getCurrencyPosition,
    config,
  };
};