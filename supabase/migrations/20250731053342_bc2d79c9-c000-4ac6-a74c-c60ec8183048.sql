-- Check for views with SECURITY DEFINER property
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND definition ILIKE '%security definer%';

-- Fix: Remove SECURITY DEFINER from any problematic views
-- First, let's check what views exist in public schema
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public';