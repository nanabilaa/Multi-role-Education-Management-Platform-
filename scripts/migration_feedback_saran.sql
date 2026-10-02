-- Migration: Create feedback/saran table for ortu to send suggestions to admin
-- Run this in Supabase SQL Editor

-- Create the feedback table
CREATE TABLE IF NOT EXISTS public.feedback_saran (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ortu_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kategori VARCHAR(50) NOT NULL DEFAULT 'umum', -- 'umum', 'jadwal', 'pembayaran', 'fasilitas', 'lainnya'
    judul VARCHAR(255) NOT NULL,
    isi TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'baru', -- 'baru', 'dibaca', 'diproses', 'selesai', 'ditutup'
    admin_response TEXT,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_saran_ortu_id ON public.feedback_saran(ortu_id);
CREATE INDEX IF NOT EXISTS idx_feedback_saran_status ON public.feedback_saran(status);
CREATE INDEX IF NOT EXISTS idx_feedback_saran_created_at ON public.feedback_saran(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_saran_kategori ON public.feedback_saran(kategori);

-- Enable RLS
ALTER TABLE public.feedback_saran ENABLE ROW LEVEL SECURITY;

-- Policy: Ortu can insert their own feedback
CREATE POLICY "Ortu can insert own feedback" ON public.feedback_saran
    FOR INSERT WITH CHECK (auth.uid() = ortu_id);

-- Policy: Ortu can view their own feedback
CREATE POLICY "Ortu can view own feedback" ON public.feedback_saran
    FOR SELECT USING (auth.uid() = ortu_id);

-- Policy: Admin can view all feedback
CREATE POLICY "Admin can view all feedback" ON public.feedback_saran
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admin can update feedback (respond, change status)
CREATE POLICY "Admin can update feedback" ON public.feedback_saran
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_feedback_saran_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_feedback_saran_updated_at ON public.feedback_saran;
CREATE TRIGGER trigger_update_feedback_saran_updated_at
    BEFORE UPDATE ON public.feedback_saran
    FOR EACH ROW
    EXECUTE FUNCTION public.update_feedback_saran_updated_at();

-- Verify table creation
SELECT * FROM public.feedback_saran LIMIT 1;