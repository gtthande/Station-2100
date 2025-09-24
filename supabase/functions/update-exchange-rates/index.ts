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

    // Fetch exchange rates from API
    const response = await fetch('https://api.exchangerate.host/latest?base=USD')
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`)
    }

    const data: ExchangeRateResponse = await response.json()
    
    if (!data.rates) {
      throw new Error('Invalid response from exchange rate API')
    }

    // Define target currencies we want to track
    const targetCurrencies = ['KES', 'EUR', 'SCR']
    const exchangeRates: ExchangeRate[] = []

    // Extract rates for our target currencies
    for (const targetCurrency of targetCurrencies) {
      if (data.rates[targetCurrency]) {
        exchangeRates.push({
          base_currency: 'USD',
          target_currency: targetCurrency,
          rate: data.rates[targetCurrency],
          source: 'api'
        })
      }
    }

    // Also add EUR to KES and SCR to KES if available
    if (data.rates['EUR'] && data.rates['KES']) {
      const eurToKes = data.rates['KES'] / data.rates['EUR']
      exchangeRates.push({
        base_currency: 'EUR',
        target_currency: 'KES',
        rate: eurToKes,
        source: 'api'
      })
    }

    if (data.rates['SCR'] && data.rates['KES']) {
      const scrToKes = data.rates['KES'] / data.rates['SCR']
      exchangeRates.push({
        base_currency: 'SCR',
        target_currency: 'KES',
        rate: scrToKes,
        source: 'api'
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
          source: rate.source,
          updated_at: new Date().toISOString()
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
        message: 'Exchange rates updated successfully',
        rates: exchangeRates,
        timestamp: new Date().toISOString()
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

