-- Migration: Enforce payment consistency constraints
-- Prevents duplicate payment records for the same tenant in the same billing cycle

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_tenant_billing_month 
ON public.payments (tenant_id, billing_month);
