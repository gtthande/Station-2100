import React, { useState, useEffect } from 'react'
import { useSupabaseClient } from '@/hooks/useSupabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Edit, RotateCcw, DollarSign, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ExchangeRate {
  id: string
  base_currency: string
  target_currency: string
  rate: number
  source: string
  updated_at: string
  created_at: string
}

export default function ExchangeRatesManager() {
  const supabase = useSupabaseClient()
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState('exchangerate.host')
  const [availableSources, setAvailableSources] = useState<string[]>(['exchangerate.host', 'exchangerate-api'])

  // Fetch exchange rates from database
  const fetchExchangeRates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('base_currency', { ascending: true })

      if (error) throw error
      setExchangeRates(data || [])
    } catch (error) {
      console.error('Error fetching exchange rates:', error)
      toast.error('Failed to fetch exchange rates')
    } finally {
      setLoading(false)
    }
  }

  // Update exchange rates from API
  const updateExchangeRates = async () => {
    try {
      setUpdating(true)
      const { data, error } = await supabase.functions.invoke('update-exchange-rates', {
        body: { source: selectedSource }
      })

      if (error) throw error

      if (data.success) {
        toast.success(`Exchange rates updated successfully from ${data.source}`)
        setAvailableSources(data.availableSources || availableSources)
        await fetchExchangeRates()
      } else {
        throw new Error(data.error || 'Failed to update exchange rates')
      }
    } catch (error) {
      console.error('Error updating exchange rates:', error)
      toast.error(`Failed to update exchange rates from ${selectedSource}`)
    } finally {
      setUpdating(false)
    }
  }

  // Update a specific exchange rate
  const updateExchangeRate = async (id: string, newRate: number) => {
    try {
      const { error } = await supabase
        .from('exchange_rates')
        .update({ 
          rate: newRate, 
          source: 'manual',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Exchange rate updated successfully')
      await fetchExchangeRates()
    } catch (error) {
      console.error('Error updating exchange rate:', error)
      toast.error('Failed to update exchange rate')
    }
  }

  // Reset exchange rate to API value
  const resetExchangeRate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exchange_rates')
        .update({ 
          source: 'api',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Exchange rate reset to API value')
      await fetchExchangeRates()
    } catch (error) {
      console.error('Error resetting exchange rate:', error)
      toast.error('Failed to reset exchange rate')
    }
  }

  // Handle edit dialog
  const handleEdit = (rate: ExchangeRate) => {
    setEditingRate(rate)
    setEditValue(rate.rate.toString())
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingRate && editValue) {
      const newRate = parseFloat(editValue)
      if (isNaN(newRate) || newRate <= 0) {
        toast.error('Please enter a valid positive number')
        return
      }
      updateExchangeRate(editingRate.id, newRate)
      setIsEditDialogOpen(false)
      setEditingRate(null)
      setEditValue('')
    }
  }

  const handleReset = (rate: ExchangeRate) => {
    resetExchangeRate(rate.id)
  }

  // Format currency pair
  const formatCurrencyPair = (base: string, target: string) => {
    return `${base}/${target}`
  }

  // Format rate with appropriate decimal places
  const formatRate = (rate: number) => {
    return rate.toFixed(6)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Get source badge variant
  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'api': return 'default'
      case 'manual': return 'secondary'
      case 'system': return 'outline'
      default: return 'default'
    }
  }

  useEffect(() => {
    fetchExchangeRates()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Exchange Rates Manager
          </CardTitle>
          <CardDescription>
            Manage currency exchange rates for inventory cost calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading exchange rates...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Exchange Rates Manager
        </CardTitle>
        <CardDescription>
          Manage currency exchange rates for inventory cost calculations
        </CardDescription>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <Label htmlFor="source-select">Source:</Label>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {availableSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={updateExchangeRates} 
            disabled={updating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
            {updating ? 'Updating...' : 'Update from API'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Currency Pair</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exchangeRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">
                    {formatCurrencyPair(rate.base_currency, rate.target_currency)}
                  </TableCell>
                  <TableCell>{formatRate(rate.rate)}</TableCell>
                  <TableCell>
                    <Badge variant={getSourceBadgeVariant(rate.source)}>
                      {rate.source}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(rate.updated_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rate)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      {rate.source === 'manual' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReset(rate)}
                          className="flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reset
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {exchangeRates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No exchange rates found. Click "Update from API" to fetch current rates.
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exchange Rate</DialogTitle>
            <DialogDescription>
              Update the exchange rate for {editingRate && formatCurrencyPair(editingRate.base_currency, editingRate.target_currency)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rate" className="text-right">
                Rate
              </Label>
              <Input
                id="rate"
                type="number"
                step="0.000001"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="col-span-3"
                placeholder="Enter exchange rate"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

