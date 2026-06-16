-- Fix RLS policies for funding_options table
-- Run this in Supabase SQL Editor

-- Enable RLS on funding_options if not already enabled
ALTER TABLE public.funding_options ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view active funding options" ON public.funding_options;
DROP POLICY IF EXISTS "Admins can view all funding options" ON public.funding_options;
DROP POLICY IF EXISTS "Admins can insert funding options" ON public.funding_options;
DROP POLICY IF EXISTS "Admins can update funding options" ON public.funding_options;
DROP POLICY IF EXISTS "Anyone can view funding options" ON public.funding_options;

-- Create simple policies - allow all operations for now (you can restrict later)
CREATE POLICY "Anyone can view funding options" ON public.funding_options
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert funding options" ON public.funding_options
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update funding options" ON public.funding_options
    FOR UPDATE USING (true);
