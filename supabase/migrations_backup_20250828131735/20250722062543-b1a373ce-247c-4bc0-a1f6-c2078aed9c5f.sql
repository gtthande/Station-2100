-- Create job cards related tables

-- Create enum for job status
CREATE TYPE public.job_status AS ENUM ('open', 'awaiting_auth', 'closed');

-- Create enum for item category
CREATE TYPE public.item_category AS ENUM ('spare', 'consumable', 'owner_supplied');

-- Create jobs table (master)
CREATE TABLE public.jobs (
    job_id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    job_no VARCHAR(30) NOT NULL UNIQUE,
    date_opened DATE NOT NULL,
    invoice_date DATE,
    aircraft_reg VARCHAR(20) NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    sub_job_card_of BIGINT REFERENCES public.jobs(job_id),
    status job_status DEFAULT 'open',
    total_fitting_cost DECIMAL(14,2),
    total_cost_price DECIMAL(14,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create job_items table (detail)
CREATE TABLE public.job_items (
    item_id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    job_id BIGINT NOT NULL REFERENCES public.jobs(job_id) ON DELETE CASCADE,
    batch_no BIGINT,
    stock_card_no VARCHAR(64),
    item_date DATE,
    description TEXT,
    warehouse VARCHAR(64),
    qty INTEGER NOT NULL,
    uom VARCHAR(16),
    fitting_price DECIMAL(14,2),
    unit_cost DECIMAL(14,2),
    total_cost DECIMAL(14,2) GENERATED ALWAYS AS (unit_cost * qty) STORED,
    category item_category DEFAULT 'spare',
    verified_by VARCHAR(64),
    received_by VARCHAR(64),
    issued_by_code VARCHAR(32),
    prepaid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create job_authorisations table (control)
CREATE TABLE public.job_authorisations (
    auth_id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    job_id BIGINT NOT NULL REFERENCES public.jobs(job_id) ON DELETE CASCADE,
    ac_approved BOOLEAN DEFAULT false,
    wb_bc_approved BOOLEAN DEFAULT false,
    dss_approved BOOLEAN DEFAULT false,
    closed_by VARCHAR(64),
    closed_at TIMESTAMP WITH TIME ZONE,
    invoice_no VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_authorisations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for jobs
CREATE POLICY "Users can view their own jobs" ON public.jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own jobs" ON public.jobs FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for job_items
CREATE POLICY "Users can view their own job items" ON public.job_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own job items" ON public.job_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own job items" ON public.job_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own job items" ON public.job_items FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for job_authorisations
CREATE POLICY "Users can view their own job authorisations" ON public.job_authorisations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own job authorisations" ON public.job_authorisations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own job authorisations" ON public.job_authorisations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own job authorisations" ON public.job_authorisations FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_jobs_customer ON public.jobs(customer_id);
CREATE INDEX idx_jobs_parent ON public.jobs(sub_job_card_of);
CREATE INDEX idx_jobs_user ON public.jobs(user_id);
CREATE INDEX idx_job_items_job ON public.job_items(job_id);
CREATE INDEX idx_job_items_user ON public.job_items(user_id);
CREATE INDEX idx_job_auth_job ON public.job_authorisations(job_id);
CREATE INDEX idx_job_auth_user ON public.job_authorisations(user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_items_updated_at
    BEFORE UPDATE ON public.job_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_authorisations_updated_at
    BEFORE UPDATE ON public.job_authorisations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger function for invoice validation
CREATE OR REPLACE FUNCTION public.validate_job_authorisation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.closed_at IS NOT NULL AND (NEW.invoice_no IS NULL OR NEW.invoice_no = '') THEN
        RAISE EXCEPTION 'invoice_no is mandatory before closing a job';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invoice validation
CREATE TRIGGER trg_auth_invoice_chk
    BEFORE INSERT OR UPDATE ON public.job_authorisations
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_job_authorisation();