-- Create compliance documents table
CREATE TABLE public.compliance_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rotable_part_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'easa_certificate', 'faa_certificate', 'work_order', 'repair_certificate'
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  certificate_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  job_card_reference TEXT,
  work_order_reference TEXT,
  notes TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit logs table
CREATE TABLE public.rotable_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rotable_part_id UUID,
  action_type TEXT NOT NULL, -- 'created', 'updated', 'installed', 'removed', 'document_uploaded', 'status_changed'
  action_description TEXT NOT NULL,
  performed_by UUID NOT NULL,
  ip_address INET,
  user_agent TEXT,
  old_values JSONB,
  new_values JSONB,
  related_table TEXT,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom roles for rotable management
CREATE TYPE public.rotable_role AS ENUM ('admin', 'technician', 'storekeeper', 'manager', 'auditor');

-- Create rotable user roles table
CREATE TABLE public.rotable_user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role rotable_role NOT NULL,
  granted_by UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotable_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotable_user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compliance_documents
CREATE POLICY "Users can view their own compliance documents"
ON public.compliance_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admin and technicians can manage compliance documents"
ON public.compliance_documents
FOR ALL
USING (
  auth.uid() = user_id AND (
    EXISTS (SELECT 1 FROM public.rotable_user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'technician'))
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- RLS Policies for rotable_audit_logs
CREATE POLICY "Managers and auditors can view audit logs"
ON public.rotable_audit_logs
FOR SELECT
USING (
  auth.uid() = user_id AND (
    EXISTS (SELECT 1 FROM public.rotable_user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'auditor'))
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "System can insert audit logs"
ON public.rotable_audit_logs
FOR INSERT
WITH CHECK (auth.uid() = performed_by);

-- RLS Policies for rotable_user_roles
CREATE POLICY "Admins can manage rotable roles"
ON public.rotable_user_roles
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.rotable_user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view their own rotable roles"
ON public.rotable_user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Add update triggers
CREATE TRIGGER update_compliance_documents_updated_at
BEFORE UPDATE ON public.compliance_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log rotable actions
CREATE OR REPLACE FUNCTION public.log_rotable_action(
  _rotable_part_id UUID,
  _action_type TEXT,
  _action_description TEXT,
  _old_values JSONB DEFAULT NULL,
  _new_values JSONB DEFAULT NULL,
  _related_table TEXT DEFAULT NULL,
  _related_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.rotable_audit_logs (
    user_id,
    rotable_part_id,
    action_type,
    action_description,
    performed_by,
    old_values,
    new_values,
    related_table,
    related_id
  ) VALUES (
    auth.uid(),
    _rotable_part_id,
    _action_type,
    _action_description,
    auth.uid(),
    _old_values,
    _new_values,
    _related_table,
    _related_id
  );
END;
$$;

-- Create function to check rotable role
CREATE OR REPLACE FUNCTION public.has_rotable_role(_user_id UUID, _role rotable_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.rotable_user_roles
    WHERE user_id = _user_id
      AND role = _role
  ) OR has_role(_user_id, 'admin'::app_role);
$$;