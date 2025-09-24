import React, { useState, useEffect } from 'react'
import { useSupabaseClient } from '@/hooks/useSupabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calculator, DollarSign, Package } from 'lucide-react'
import { useExchangeRates } from '@/hooks/useExchangeRates'
import { toast } from 'sonner'

interface InventoryItem {
  id: string
  name: string
  description?: string
  unit_price: number
  currency: string
  quantity: number
  supplier_id?: string
}

interface InventoryReceivingWithExchangeProps {
  onItemReceived?: (item: InventoryItem) => void
}

export default function InventoryReceivingWithExchange({ onItemReceived }: InventoryReceivingWithExchangeProps) {
  const supabase = useSupabaseClient()
  const { exchangeRates, loading: ratesLoading, convertCurrency } = useExchangeRates()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit_price: '',
    currency: 'KES',
    quantity: '',
    supplier_id: ''
  })
  
  const [localPrice, setLocalPrice] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Available currencies
  const currencies = [
    { code: 'KES', name: 'Kenyan Shilling' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'SCR', name: 'Seychelles Rupee' }
  ]

  // Calculate local price when currency or unit price changes
  useEffect(() => {
    if (formData.unit_price && formData.currency) {
      const price = parseFloat(formData.unit_price)
      if (!isNaN(price)) {
        if (formData.currency === 'KES') {
          setLocalPrice(price)
        } else {
          const converted = convertCurrency(price, formData.currency, 'KES')
          setLocalPrice(converted)
        }
      } else {
        setLocalPrice(null)
      }
    } else {
      setLocalPrice(null)
    }
  }, [formData.unit_price, formData.currency, convertCurrency])

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.unit_price || !formData.quantity) {
      toast.error('Please fill in all required fields')
      return
    }

    const price = parseFloat(formData.unit_price)
    const quantity = parseInt(formData.quantity)

    if (isNaN(price) || isNaN(quantity) || price <= 0 || quantity <= 0) {
      toast.error('Please enter valid price and quantity values')
      return
    }

    try {
      setIsSubmitting(true)

      const itemData = {
        name: formData.name,
        description: formData.description || null,
        unit_price: price,
        currency: formData.currency,
        quantity: quantity,
        supplier_id: formData.supplier_id || null,
        local_price_kes: localPrice,
        received_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('inventory_items')
        .insert([itemData])
        .select()
        .single()

      if (error) throw error

      toast.success('Inventory item received successfully')
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        unit_price: '',
        currency: 'KES',
        quantity: '',
        supplier_id: ''
      })
      setLocalPrice(null)

      // Notify parent component
      if (onItemReceived) {
        onItemReceived(data)
      }

    } catch (error) {
      console.error('Error receiving inventory item:', error)
      toast.error('Failed to receive inventory item')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get exchange rate info for display
  const getExchangeRateInfo = () => {
    if (formData.currency === 'KES') {
      return null
    }

    const rate = exchangeRates.find(
      r => r.base_currency === formData.currency && r.target_currency === 'KES'
    )

    return rate ? {
      rate: rate.rate,
      source: rate.source,
      updated: rate.updated_at
    } : null
  }

  const rateInfo = getExchangeRateInfo()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Receive Inventory Item
        </CardTitle>
        <CardDescription>
          Add new inventory items with automatic currency conversion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter item name"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter item description"
            />
          </div>

          {/* Price and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => handleInputChange('unit_price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exchange Rate Info */}
          {rateInfo && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4" />
                <span className="font-medium">Exchange Rate Information</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Rate:</span>
                  <span className="ml-2 font-mono">{rateInfo.rate.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Source:</span>
                  <Badge variant="outline" className="ml-2">
                    {rateInfo.source}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Local Price Display */}
          {localPrice !== null && formData.currency !== 'KES' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Local Guide Price (KES):</span>
                <span className="font-mono text-green-900">
                  {localPrice.toFixed(2)} KES
                </span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                This is the estimated local price based on current exchange rates
              </p>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              placeholder="1"
              required
            />
          </div>

          {/* Supplier ID */}
          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier ID</Label>
            <Input
              id="supplier_id"
              value={formData.supplier_id}
              onChange={(e) => handleInputChange('supplier_id', e.target.value)}
              placeholder="Enter supplier ID (optional)"
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isSubmitting || ratesLoading}
            className="w-full"
          >
            {isSubmitting ? 'Receiving Item...' : 'Receive Item'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
