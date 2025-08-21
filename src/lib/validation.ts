import { z } from 'zod';

// Security validation schemas for input sanitization

export const customerValidationSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .regex(/^[a-zA-Z0-9\s\-&.,'()]+$/, 'Name contains invalid characters'),
  
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .max(50, 'Phone must be less than 50 characters')
    .regex(/^[\d\s\-+()\.]*$/, 'Phone contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  
  city: z.string()
    .max(100, 'City must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]*$/, 'City contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  state: z.string()
    .max(50, 'State must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-'\.]*$/, 'State contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  zip_code: z.string()
    .max(20, 'ZIP code must be less than 20 characters')
    .regex(/^[\d\s\-]*$/, 'ZIP code contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  country: z.string()
    .max(100, 'Country must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]*$/, 'Country contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  aircraft_type: z.string()
    .max(100, 'Aircraft type must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-]*$/, 'Aircraft type contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  tail_number: z.string()
    .max(20, 'Tail number must be less than 20 characters')
    .regex(/^[a-zA-Z0-9\-]*$/, 'Tail number contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  contact_person: z.string()
    .max(255, 'Contact person must be less than 255 characters')
    .regex(/^[a-zA-Z\s\-'\.]*$/, 'Contact person contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal(''))
});

export const profileValidationSchema = z.object({
  full_name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .regex(/^[a-zA-Z\s\-'\.]*$/, 'Name contains invalid characters'),
  
  position: z.string()
    .max(100, 'Position must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-'\.&(),]*$/, 'Position contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .max(50, 'Phone must be less than 50 characters')
    .regex(/^[\d\s\-+()\.]*$/, 'Phone contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  
  staff_code: z.string()
    .max(50, 'Staff code must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\-]*$/, 'Staff code contains invalid characters')
    .optional()
    .or(z.literal(''))
});

export const inventoryProductValidationSchema = z.object({
  part_number: z.string()
    .min(1, 'Part number is required')
    .max(100, 'Part number must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\-\/]*$/, 'Part number contains invalid characters'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  
  unit_of_measure: z.string()
    .max(20, 'Unit of measure must be less than 20 characters')
    .regex(/^[a-zA-Z\s]*$/, 'Unit of measure contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  reorder_point: z.number()
    .min(0, 'Reorder point must be non-negative')
    .max(999999.99, 'Reorder point is too large')
    .optional(),
  
  minimum_stock: z.number()
    .min(0, 'Minimum stock must be non-negative')
    .max(999999.99, 'Minimum stock is too large')
    .optional(),
  
  purchase_price: z.number()
    .min(0, 'Purchase price must be non-negative')
    .max(999999.99, 'Purchase price is too large')
    .optional(),
  
  sale_price: z.number()
    .min(0, 'Sale price must be non-negative')
    .max(999999.99, 'Sale price is too large')
    .optional()
});

// Password validation schema
export const passwordValidationSchema = z.string()
  .min(12, 'Password must be at least 12 characters long')
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

// Generic input sanitization
export const sanitizeInput = (input: string): string => {
  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove HTML/script injection chars
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
    .substring(0, 1000); // Limit length
};

export type CustomerFormData = z.infer<typeof customerValidationSchema>;
export type ProfileFormData = z.infer<typeof profileValidationSchema>;
export type InventoryProductFormData = z.infer<typeof inventoryProductValidationSchema>;