import { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

interface ExchangeRate {
  id: string
  base_currency: string
  target_currency: string
  rate: number
  source: string
  updated_at: string
  created_at: string
}

interface UseExchangeRatesReturn {
  exchangeRates: ExchangeRate[]
  loading: boolean
  error: string | null
  getExchangeRate: (baseCurrency: string, targetCurrency: string) => number | null
  convertCurrency: (amount: number, baseCurrency: string, targetCurrency: string) => number | null
  refreshRates: () => Promise<void>
}

export function useExchangeRates(): UseExchangeRatesReturn {
  const supabase = useSupabaseClient()
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch exchange rates from database
  const fetchExchangeRates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('base_currency', { ascending: true })

      if (error) throw error
      setExchangeRates(data || [])
    } catch (err) {
      console.error('Error fetching exchange rates:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange rates')
    } finally {
      setLoading(false)
    }
  }

  // Get exchange rate for a specific currency pair
  const getExchangeRate = (baseCurrency: string, targetCurrency: string): number | null => {
    const rate = exchangeRates.find(
      r => r.base_currency === baseCurrency && r.target_currency === targetCurrency
    )
    return rate ? rate.rate : null
  }

  // Convert amount from base currency to target currency
  const convertCurrency = (amount: number, baseCurrency: string, targetCurrency: string): number | null => {
    if (baseCurrency === targetCurrency) {
      return amount
    }

    const rate = getExchangeRate(baseCurrency, targetCurrency)
    return rate ? amount * rate : null
  }

  // Refresh exchange rates
  const refreshRates = async () => {
    await fetchExchangeRates()
  }

  useEffect(() => {
    fetchExchangeRates()
  }, [])

  return {
    exchangeRates,
    loading,
    error,
    getExchangeRate,
    convertCurrency,
    refreshRates
  }
}
