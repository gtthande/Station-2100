import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordCheckRequest {
  password: string;
  userId?: string;
}

interface PasswordCheckResponse {
  isCompromised: boolean;
  occurrences?: number;
  recommendation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const haveibeenpwnedApiKey = Deno.env.get('HAVEIBEENPWNED_API_KEY');
    if (!haveibeenpwnedApiKey) {
      console.error('HaveIBeenPwned API key not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Password security service not configured',
          isCompromised: false,
          recommendation: 'Unable to verify password security at this time',
          severity: 'medium'
        }),
        {
          status: 200, // Return 200 to not break auth flow
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { password, userId }: PasswordCheckRequest = await req.json();

    if (!password) {
      return new Response(
        JSON.stringify({ 
          error: 'Password is required',
          isCompromised: false,
          recommendation: 'Please provide a password to check',
          severity: 'low'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Checking password security for ${userId ? `user ${userId}` : 'anonymous user'}`);

    // Create SHA-1 hash of the password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Use k-anonymity: send only first 5 characters of hash
    const hashPrefix = hashHex.substring(0, 5);
    const hashSuffix = hashHex.substring(5);

    console.log(`Checking hash prefix: ${hashPrefix}`);

    // Query HaveIBeenPwned API using k-anonymity
    const pwnedResponse = await fetch(
      `https://api.pwnedpasswords.com/range/${hashPrefix}`,
      {
        method: 'GET',
        headers: {
          'hibp-api-key': haveibeenpwnedApiKey,
          'User-Agent': 'Security-Audit-System',
          'Add-Padding': 'true', // Adds padding to responses for additional privacy
        },
      }
    );

    if (!pwnedResponse.ok) {
      console.error(`HaveIBeenPwned API error: ${pwnedResponse.status}`);
      return new Response(
        JSON.stringify({
          error: 'Password security service temporarily unavailable',
          isCompromised: false,
          recommendation: 'Unable to verify password security. Please try again later.',
          severity: 'medium'
        }),
        {
          status: 200, // Return 200 to not break auth flow
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const responseText = await pwnedResponse.text();
    const lines = responseText.split('\n');
    
    let occurrences = 0;
    let isCompromised = false;

    // Look for our hash suffix in the response
    for (const line of lines) {
      const [suffix, count] = line.split(':');
      if (suffix === hashSuffix) {
        occurrences = parseInt(count, 10);
        isCompromised = true;
        break;
      }
    }

    console.log(`Password check result: compromised=${isCompromised}, occurrences=${occurrences}`);

    // Determine severity and recommendation
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let recommendation = '';

    if (isCompromised) {
      if (occurrences >= 100000) {
        severity = 'critical';
        recommendation = 'This password has been found in major data breaches and is extremely unsafe. Change it immediately.';
      } else if (occurrences >= 10000) {
        severity = 'high';
        recommendation = 'This password has been compromised in data breaches. Please choose a different password.';
      } else if (occurrences >= 100) {
        severity = 'medium';
        recommendation = 'This password has been found in some data breaches. Consider using a different password.';
      } else {
        severity = 'medium';
        recommendation = 'This password has been found in data breaches. We recommend choosing a different password.';
      }
    } else {
      recommendation = 'Password has not been found in known data breaches.';
    }

    const result: PasswordCheckResponse = {
      isCompromised,
      occurrences: isCompromised ? occurrences : undefined,
      recommendation,
      severity
    };

    // Log security audit if password is compromised
    if (isCompromised && userId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase.rpc('log_security_audit', {
          _event_type: 'password_security_check',
          _table_name: 'auth.users',
          _record_id: userId,
          _action: 'compromised_password_detected',
          _changes_summary: {
            occurrences: occurrences,
            severity: severity,
            timestamp: new Date().toISOString()
          },
          _severity: severity
        });

        console.log(`Logged security audit for compromised password - User: ${userId}, Occurrences: ${occurrences}`);
      } catch (auditError) {
        console.error('Failed to log security audit:', auditError);
        // Don't fail the password check if audit logging fails
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-leaked-password function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        isCompromised: false,
        recommendation: 'Unable to verify password security due to technical error',
        severity: 'medium'
      }),
      {
        status: 200, // Return 200 to not break auth flow
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});