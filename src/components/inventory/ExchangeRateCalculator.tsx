import React, { useState, useEffect } from 'react'
import { useExchangeRates } from '@/hooks/useExchangeRates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calculator, RefreshCw, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExchangeRateCalculatorProps {
  onRateCalculated?: (localAmount: number, rate: number) => void
  initialAmount?: number
  initialCurrency?: string
  targetCurrency?: string
  showAsCard?: boolean
}

export default function ExchangeRateCalculator({
  onRateCalculated,
  initialAmount = 0,
  initialCurrency = 'USD',
  targetCurrency = 'KES',
  showAsCard = true
}: ExchangeRateCalculatorProps) {
  const { exchangeRates, loading, getExchangeRate, convertCurrency, refreshRates } = useExchangeRates()
  const [amount, setAmount] = useState(initialAmount.toString())
  const [fromCurrency, setFromCurrency] = useState(initialCurrency)
  const [toCurrency, setToCurrency] = useState(targetCurrency)
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [currentRate, setCurrentRate] = useState<number | null>(null)

  // Available currencies from exchange rates
  const availableCurrencies = React.useMemo(() => {
    const currencies = new Set<string>()
    exchangeRates.forEach(rate => {
      currencies.add(rate.base_currency)
      currencies.add(rate.target_currency)
    })
    return Array.from(currencies).sort()
  }, [exchangeRates])

  // Calculate conversion when inputs change
  useEffect(() => {
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setConvertedAmount(null)
      setCurrentRate(null)
      return
    }

    const rate = getExchangeRate(fromCurrency, toCurrency)
    if (rate) {
      const converted = convertCurrency(numericAmount, fromCurrency, toCurrency)
      setConvertedAmount(converted)
      setCurrentRate(rate)
      
      // Notify parent component
      if (onRateCalculated && converted) {
        onRateCalculated(converted, rate)
      }
    } else {
      setConvertedAmount(null)
      setCurrentRate(null)
    }
  }, [amount, fromCurrency, toCurrency, getExchangeRate, convertCurrency, onRateCalculated])

  const handleRefresh = async () => {
    await refreshRates()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: toCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatRate = (rate: number) => {
    return rate.toFixed(6)
  }

  const content = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="from-currency">From Currency</Label>
          <Select value={fromCurrency} onValueChange={setFromCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {availableCurrencies.map(currency => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="to-currency">To Currency</Label>
          <Select value={toCurrency} onValueChange={setToCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {availableCurrencies.map(currency => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading exchange rates...</span>
        </div>
      )}

      {currentRate && convertedAmount !== null && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Exchange Rate</p>
              <p className="text-lg font-semibold">
                {fromCurrency}/{toCurrency}: {formatRate(currentRate)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>
          
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">Converted Amount</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(convertedAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Local Guide Price
            </p>
          </div>
        </div>
      )}

      {!loading && !currentRate && amount && parseFloat(amount) > 0 && (
        <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <p className="text-sm text-destructive">
            No exchange rate available for {fromCurrency}/{toCurrency}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Please contact an administrator to add this currency pair.
          </p>
        </div>
      )}
    </div>
  )

  if (showAsCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Exchange Rate Calculator
          </CardTitle>
          <CardDescription>
            Calculate local currency equivalent for inventory items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    )
  }

  return content
}
