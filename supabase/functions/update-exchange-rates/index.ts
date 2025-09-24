import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExchangeRateResponse {
  rates: Record<string, number>
  base: string
  date: string
}

interface ExchangeRate {
  base_currency: string
  target_currency: string
  rate: number
  source: string
}

interface ExchangeRateSource {
  name: string
  url: string
  parser: (data: any) => Record<string, number>
}

// Define multiple exchange rate sources
const exchangeRateSources: ExchangeRateSource[] = [
  {
    name: 'exchangerate.host',
    url: 'https://api.exchangerate.host/latest?base=USD',
    parser: (data: any) => data.rates || {}
  },
  {
    name: 'fixer.io',
    url: 'https://api.fixer.io/latest?base=USD&access_key=YOUR_API_KEY', // Note: Requires API key
    parser: (data: any) => data.rates || {}
  },
  {
    name: 'currencylayer',
    url: 'https://api.currencylayer.com/live?access_key=YOUR_API_KEY&currencies=KES,EUR,SCR', // Note: Requires API key
    parser: (data: any) => data.quotes || {}
  },
  {
    name: 'exchangerate-api',
    url: 'https://api.exchangerate-api.com/v4/latest/USD',
    parser: (data: any) => data.rates || {}
  }
]

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get source parameter from request
    const url = new URL(req.url)
    const requestedSource = url.searchParams.get('source') || 'exchangerate.host'
    
    // Find the requested source
    const source = exchangeRateSources.find(s => s.name === requestedSource)
    if (!source) {
      throw new Error(`Unknown source: ${requestedSource}. Available sources: ${exchangeRateSources.map(s => s.name).join(', ')}`)
    }

    // Fetch exchange rates from selected source
    const response = await fetch(source.url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates from ${source.name}: ${response.statusText}`)
    }

    const data = await response.json()
    const rates = source.parser(data)
    
    if (!rates || Object.keys(rates).length === 0) {
      throw new Error(`Invalid response from ${source.name} API`)
    }

    // Define target currencies we want to track
    const targetCurrencies = ['KES', 'EUR', 'SCR']
    const exchangeRates: ExchangeRate[] = []

    // Extract rates for our target currencies
    for (const targetCurrency of targetCurrencies) {
      if (rates[targetCurrency]) {
        exchangeRates.push({
          base_currency: 'USD',
          target_currency: targetCurrency,
          rate: rates[targetCurrency],
          source: source.name
        })
      }
    }

    // Also add EUR to KES and SCR to KES if available
    if (rates['EUR'] && rates['KES']) {
      const eurToKes = rates['KES'] / rates['EUR']
      exchangeRates.push({
        base_currency: 'EUR',
        target_currency: 'KES',
        rate: eurToKes,
        source: source.name
      })
    }

    if (rates['SCR'] && rates['KES']) {
      const scrToKes = rates['KES'] / rates['SCR']
      exchangeRates.push({
        base_currency: 'SCR',
        target_currency: 'KES',
        rate: scrToKes,
        source: source.name
      })
    }

    // Update exchange rates in database
    const updatePromises = exchangeRates.map(async (rate) => {
      const { error } = await supabaseClient
        .from('exchange_rates')
        .upsert({
          base_currency: rate.base_currency,
          target_currency: rate.target_currency,
          rate: rate.rate,
          last_updated: new Date().toISOString(),
          manual_override: false
        }, {
          onConflict: 'base_currency,target_currency'
        })

      if (error) {
        console.error(`Error updating ${rate.base_currency}/${rate.target_currency}:`, error)
        throw error
      }
    })

    await Promise.all(updatePromises)

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Exchange rates updated successfully from ${source.name}`,
        source: source.name,
        rates: exchangeRates,
        timestamp: new Date().toISOString(),
        availableSources: exchangeRateSources.map(s => s.name)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error updating exchange rates:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

