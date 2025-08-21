// Security middleware for API routes and request handling

interface SecurityHeaders {
  [key: string]: string;
}

// Security headers configuration
export const getSecurityHeaders = (): SecurityHeaders => ({
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://jarlvtojzqkccovburmi.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://jarlvtojzqkccovburmi.supabase.co wss://jarlvtojzqkccovburmi.supabase.co",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ')
});

// Rate limiting state (in-memory for demo - use Redis in production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export const checkRateLimit = (identifier: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): boolean => {
  const now = Date.now();
  const entry = rateLimits.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    rateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
};

// Input validation and sanitization
export const validateAndSanitizeInput = (input: any, maxSize: number = 1024 * 1024): any => {
  if (typeof input === 'string') {
    if (input.length > maxSize) {
      throw new Error('Input size exceeds limit');
    }
    return input.trim().replace(/[<>\"'&]/g, '');
  }
  
  if (Array.isArray(input)) {
    return input.map(item => validateAndSanitizeInput(item, maxSize));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof key === 'string' && key.length < 100) {
        sanitized[key] = validateAndSanitizeInput(value, maxSize);
      }
    }
    return sanitized;
  }
  
  return input;
};

// Simple input sanitizer function
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove HTML/script injection chars
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .substring(0, 1000); // Limit length
};

// Error sanitization - remove sensitive information
export const sanitizeError = (error: any): { message: string; code?: string } => {
  if (error instanceof Error) {
    // Don't expose internal error details
    const safeMessages = [
      'Invalid input',
      'Access denied',
      'Resource not found',
      'Rate limit exceeded',
      'Authentication required',
      'Insufficient permissions'
    ];
    
    const message = safeMessages.includes(error.message) 
      ? error.message 
      : 'An error occurred while processing your request';
    
    return { message };
  }
  
  return { message: 'An unexpected error occurred' };
};

// Session security utilities
export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// SQL injection prevention helpers
export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

// Secure cookie configuration
export const getSecureCookieConfig = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 1000, // 1 hour
  path: '/'
});