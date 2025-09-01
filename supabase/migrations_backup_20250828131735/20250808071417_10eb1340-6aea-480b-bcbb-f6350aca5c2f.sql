-- Add staff management fields to profiles table for staff interaction logging
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS staff_code VARCHAR(50) UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_id VARCHAR(100) UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS biometric_data TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_staff BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS staff_active BOOLEAN DEFAULT true;

-- Add staff interaction fields to job_items table
ALTER TABLE job_items ADD COLUMN IF NOT EXISTS received_by_staff_id UUID REFERENCES profiles(id);
ALTER TABLE job_items ADD COLUMN IF NOT EXISTS issued_by_staff_id UUID REFERENCES profiles(id);
ALTER TABLE job_items ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_items ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP WITH TIME ZONE;

-- Add approval tracking to job_cards
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS warehouse_a_approved BOOLEAN DEFAULT false;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS warehouse_bc_approved BOOLEAN DEFAULT false;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS owner_supplied_approved BOOLEAN DEFAULT false;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS warehouse_a_approved_by UUID REFERENCES profiles(id);
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS warehouse_bc_approved_by UUID REFERENCES profiles(id);
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS owner_supplied_approved_by UUID REFERENCES profiles(id);
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS warehouse_a_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS warehouse_bc_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS owner_supplied_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS job_status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS finalized_by UUID REFERENCES profiles(id);

-- Create staff authentication log table
CREATE TABLE IF NOT EXISTS staff_auth_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES profiles(id) NOT NULL,
  auth_method VARCHAR(20) NOT NULL, -- 'badge', 'biometric', 'pin', 'manual'
  auth_data TEXT, -- badge scan data, biometric hash, etc.
  job_item_id BIGINT REFERENCES job_items(item_id),
  action VARCHAR(20) NOT NULL, -- 'receive', 'issue'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES profiles(id) NOT NULL
);

-- Enable RLS on staff_auth_log
ALTER TABLE staff_auth_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for staff_auth_log
CREATE POLICY "Users can view their own staff auth logs" ON staff_auth_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own staff auth logs" ON staff_auth_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create job approval notifications table
CREATE TABLE IF NOT EXISTS job_approval_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id BIGINT REFERENCES job_cards(jobcardid) NOT NULL,
  tab_type VARCHAR(20) NOT NULL, -- 'warehouse_a', 'warehouse_bc', 'owner_supplied'
  message TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES profiles(id),
  user_id UUID REFERENCES profiles(id) NOT NULL
);

-- Enable RLS on job_approval_notifications
ALTER TABLE job_approval_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_approval_notifications
CREATE POLICY "Users can view their own job notifications" ON job_approval_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job notifications" ON job_approval_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job notifications" ON job_approval_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create staff permissions table for granular permissions
CREATE TABLE IF NOT EXISTS staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES profiles(id) NOT NULL,
  permission VARCHAR(50) NOT NULL,
  granted BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES profiles(id) NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  UNIQUE(staff_id, permission)
);

-- Enable RLS on staff_permissions
ALTER TABLE staff_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for staff_permissions
CREATE POLICY "Users can view their own staff permissions" ON staff_permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage staff permissions" ON staff_permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_auth_log_staff_id ON staff_auth_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_auth_log_job_item ON staff_auth_log(job_item_id);
CREATE INDEX IF NOT EXISTS idx_job_approval_notifications_job_id ON job_approval_notifications(job_id);
CREATE INDEX IF NOT EXISTS idx_staff_permissions_staff_id ON staff_permissions(staff_id);