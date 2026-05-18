--
-- PostgreSQL database dump
--

\restrict HCYIuBXfYe21ZI9bsQSoaoZ8zPB6ZmJJaU8mZfDxaPoCcR736ineAC1MwRvwGbB

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.vitals DROP CONSTRAINT vitals_encounter_id_fkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_tenant_id_fkey;
ALTER TABLE ONLY public.user_roles DROP CONSTRAINT user_roles_user_id_fkey;
ALTER TABLE ONLY public.user_roles DROP CONSTRAINT user_roles_role_id_fkey;
ALTER TABLE ONLY public.user_mfa_recovery_codes DROP CONSTRAINT user_mfa_recovery_codes_user_id_fkey;
ALTER TABLE ONLY public.user_branches DROP CONSTRAINT user_branches_user_id_fkey;
ALTER TABLE ONLY public.user_branches DROP CONSTRAINT user_branches_tenant_id_fkey;
ALTER TABLE ONLY public.user_branches DROP CONSTRAINT user_branches_branch_id_fkey;
ALTER TABLE ONLY public.suppliers DROP CONSTRAINT suppliers_tenant_id_fkey;
ALTER TABLE ONLY public.stock_logs DROP CONSTRAINT stock_logs_tenant_id_fkey;
ALTER TABLE ONLY public.stock_logs DROP CONSTRAINT stock_logs_inventory_item_id_fkey;
ALTER TABLE ONLY public.stock_logs DROP CONSTRAINT stock_logs_branch_id_fkey;
ALTER TABLE ONLY public.sla_alerts DROP CONSTRAINT sla_alerts_tenant_id_fkey;
ALTER TABLE ONLY public.sessions DROP CONSTRAINT sessions_user_id_fkey;
ALTER TABLE ONLY public.service_prices DROP CONSTRAINT service_prices_tenant_id_fkey;
ALTER TABLE ONLY public.service_prices DROP CONSTRAINT service_prices_service_item_id_fkey;
ALTER TABLE ONLY public.service_prices DROP CONSTRAINT service_prices_branch_id_fkey;
ALTER TABLE ONLY public.service_items DROP CONSTRAINT service_items_tenant_id_fkey;
ALTER TABLE ONLY public.service_items DROP CONSTRAINT service_items_category_id_fkey;
ALTER TABLE ONLY public.service_categories DROP CONSTRAINT service_categories_tenant_id_fkey;
ALTER TABLE ONLY public.roles DROP CONSTRAINT roles_tenant_id_fkey;
ALTER TABLE ONLY public.role_permissions DROP CONSTRAINT role_permissions_role_id_fkey;
ALTER TABLE ONLY public.role_permissions DROP CONSTRAINT role_permissions_permission_id_fkey;
ALTER TABLE ONLY public.report_exports DROP CONSTRAINT report_exports_tenant_id_fkey;
ALTER TABLE ONLY public.report_exports DROP CONSTRAINT report_exports_requested_by_fkey;
ALTER TABLE ONLY public.report_exports DROP CONSTRAINT report_exports_decided_by_id_fkey;
ALTER TABLE ONLY public.refunds DROP CONSTRAINT refunds_payment_id_fkey;
ALTER TABLE ONLY public.refunds DROP CONSTRAINT refunds_invoice_id_fkey;
ALTER TABLE ONLY public.referrers DROP CONSTRAINT referrers_tenant_id_fkey;
ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_tenant_id_fkey;
ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_referred_by_id_fkey;
ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_patient_id_fkey;
ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_encounter_id_fkey;
ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_branch_id_fkey;
ALTER TABLE ONLY public.referral_records DROP CONSTRAINT referral_records_tenant_id_fkey;
ALTER TABLE ONLY public.referral_records DROP CONSTRAINT referral_records_referrer_id_fkey;
ALTER TABLE ONLY public.receiving_records DROP CONSTRAINT receiving_records_tenant_id_fkey;
ALTER TABLE ONLY public.receiving_records DROP CONSTRAINT receiving_records_purchase_order_id_fkey;
ALTER TABLE ONLY public.queue_entries DROP CONSTRAINT queue_entries_tenant_id_fkey;
ALTER TABLE ONLY public.purchase_requests DROP CONSTRAINT purchase_requests_tenant_id_fkey;
ALTER TABLE ONLY public.purchase_orders DROP CONSTRAINT purchase_orders_tenant_id_fkey;
ALTER TABLE ONLY public.purchase_orders DROP CONSTRAINT purchase_orders_supplier_id_fkey;
ALTER TABLE ONLY public.purchase_orders DROP CONSTRAINT purchase_orders_purchase_request_id_fkey;
ALTER TABLE ONLY public.prescriptions DROP CONSTRAINT prescriptions_tenant_id_fkey;
ALTER TABLE ONLY public.prescriptions DROP CONSTRAINT prescriptions_prescribed_by_id_fkey;
ALTER TABLE ONLY public.prescriptions DROP CONSTRAINT prescriptions_patient_id_fkey;
ALTER TABLE ONLY public.prescriptions DROP CONSTRAINT prescriptions_encounter_id_fkey;
ALTER TABLE ONLY public.prescriptions DROP CONSTRAINT prescriptions_branch_id_fkey;
ALTER TABLE ONLY public.permissions DROP CONSTRAINT permissions_tenant_id_fkey;
ALTER TABLE ONLY public.payslips DROP CONSTRAINT payslips_tenant_id_fkey;
ALTER TABLE ONLY public.payslips DROP CONSTRAINT payslips_employee_id_fkey;
ALTER TABLE ONLY public.payslips DROP CONSTRAINT payslips_branch_id_fkey;
ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_tenant_id_fkey;
ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_invoice_id_fkey;
ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_cashier_session_id_fkey;
ALTER TABLE ONLY public.payment_voids DROP CONSTRAINT payment_voids_payment_id_fkey;
ALTER TABLE ONLY public.payment_reversals DROP CONSTRAINT payment_reversals_payment_id_fkey;
ALTER TABLE ONLY public.payment_reversals DROP CONSTRAINT payment_reversals_invoice_id_fkey;
ALTER TABLE ONLY public.payment_reversals DROP CONSTRAINT payment_reversals_approval_request_id_fkey;
ALTER TABLE ONLY public.patients DROP CONSTRAINT patients_tenant_id_fkey;
ALTER TABLE ONLY public.patient_users DROP CONSTRAINT patient_users_tenant_id_fkey;
ALTER TABLE ONLY public.patient_users DROP CONSTRAINT patient_users_patient_id_fkey;
ALTER TABLE ONLY public.patient_merge_requests DROP CONSTRAINT patient_merge_requests_tenant_id_fkey;
ALTER TABLE ONLY public.patient_merge_requests DROP CONSTRAINT patient_merge_requests_requester_id_fkey;
ALTER TABLE ONLY public.patient_merge_requests DROP CONSTRAINT patient_merge_requests_approver_id_fkey;
ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_tenant_id_fkey;
ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_patient_id_fkey;
ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_branch_id_fkey;
ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_tenant_id_fkey;
ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_order_id_fkey;
ALTER TABLE ONLY public.numbering_sequences DROP CONSTRAINT numbering_sequences_tenant_id_fkey;
ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_tenant_id_fkey;
ALTER TABLE ONLY public.license_records DROP CONSTRAINT license_records_employee_id_fkey;
ALTER TABLE ONLY public.ledger_entries DROP CONSTRAINT ledger_entries_tenant_id_fkey;
ALTER TABLE ONLY public.ledger_entries DROP CONSTRAINT ledger_entries_branch_id_fkey;
ALTER TABLE ONLY public.leave_requests DROP CONSTRAINT leave_requests_employee_id_fkey;
ALTER TABLE ONLY public.lab_results DROP CONSTRAINT lab_results_tenant_id_fkey;
ALTER TABLE ONLY public.lab_results DROP CONSTRAINT lab_results_order_id_fkey;
ALTER TABLE ONLY public.lab_result_versions DROP CONSTRAINT lab_result_versions_lab_result_id_fkey;
ALTER TABLE ONLY public.lab_result_signatures DROP CONSTRAINT lab_result_signatures_lab_result_id_fkey;
ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_tenant_id_fkey;
ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_order_id_fkey;
ALTER TABLE ONLY public.inventory_items DROP CONSTRAINT inventory_items_tenant_id_fkey;
ALTER TABLE ONLY public.insurance_claims DROP CONSTRAINT insurance_claims_tenant_id_fkey;
ALTER TABLE ONLY public.insurance_claims DROP CONSTRAINT insurance_claims_patient_id_fkey;
ALTER TABLE ONLY public.insurance_claims DROP CONSTRAINT insurance_claims_invoice_id_fkey;
ALTER TABLE ONLY public.insurance_claims DROP CONSTRAINT insurance_claims_branch_id_fkey;
ALTER TABLE ONLY public.idempotency_records DROP CONSTRAINT idempotency_records_tenant_id_fkey;
ALTER TABLE ONLY public.hmo_partners DROP CONSTRAINT hmo_partners_tenant_id_fkey;
ALTER TABLE ONLY public.files DROP CONSTRAINT files_tenant_id_fkey;
ALTER TABLE ONLY public.encounters DROP CONSTRAINT encounters_tenant_id_fkey;
ALTER TABLE ONLY public.encounters DROP CONSTRAINT encounters_patient_id_fkey;
ALTER TABLE ONLY public.encounters DROP CONSTRAINT encounters_doctor_id_fkey;
ALTER TABLE ONLY public.encounters DROP CONSTRAINT encounters_branch_id_fkey;
ALTER TABLE ONLY public.encounters DROP CONSTRAINT encounters_attending_id_fkey;
ALTER TABLE ONLY public.encounter_diagnoses DROP CONSTRAINT encounter_diagnoses_icd10_code_id_fkey;
ALTER TABLE ONLY public.encounter_diagnoses DROP CONSTRAINT encounter_diagnoses_encounter_id_fkey;
ALTER TABLE ONLY public.employees DROP CONSTRAINT employees_user_id_fkey;
ALTER TABLE ONLY public.employees DROP CONSTRAINT employees_tenant_id_fkey;
ALTER TABLE ONLY public.employees DROP CONSTRAINT employees_department_id_fkey;
ALTER TABLE ONLY public.employees DROP CONSTRAINT employees_branch_id_fkey;
ALTER TABLE ONLY public.employee_branches DROP CONSTRAINT employee_branches_tenant_id_fkey;
ALTER TABLE ONLY public.employee_branches DROP CONSTRAINT employee_branches_employee_id_fkey;
ALTER TABLE ONLY public.employee_branches DROP CONSTRAINT employee_branches_branch_id_fkey;
ALTER TABLE ONLY public.diagnoses DROP CONSTRAINT diagnoses_encounter_id_fkey;
ALTER TABLE ONLY public.departments DROP CONSTRAINT departments_tenant_id_fkey;
ALTER TABLE ONLY public.cpt_codes DROP CONSTRAINT cpt_codes_tenant_id_fkey;
ALTER TABLE ONLY public.clinical_notes DROP CONSTRAINT clinical_notes_locked_by_fkey;
ALTER TABLE ONLY public.clinical_notes DROP CONSTRAINT clinical_notes_encounter_id_fkey;
ALTER TABLE ONLY public.clinical_notes DROP CONSTRAINT clinical_notes_author_id_fkey;
ALTER TABLE ONLY public.claims DROP CONSTRAINT claims_tenant_id_fkey;
ALTER TABLE ONLY public.claims DROP CONSTRAINT claims_invoice_id_fkey;
ALTER TABLE ONLY public.claims DROP CONSTRAINT claims_hmo_partner_id_fkey;
ALTER TABLE ONLY public.cashier_sessions DROP CONSTRAINT cashier_sessions_tenant_id_fkey;
ALTER TABLE ONLY public.cashier_ledger_entries DROP CONSTRAINT cashier_ledger_entries_cashier_session_id_fkey;
ALTER TABLE ONLY public.branches DROP CONSTRAINT branches_tenant_id_fkey;
ALTER TABLE ONLY public.branch_stocks DROP CONSTRAINT branch_stocks_tenant_id_fkey;
ALTER TABLE ONLY public.branch_stocks DROP CONSTRAINT branch_stocks_inventory_item_id_fkey;
ALTER TABLE ONLY public.branch_stocks DROP CONSTRAINT branch_stocks_branch_id_fkey;
ALTER TABLE ONLY public.audit_logs DROP CONSTRAINT audit_logs_user_id_fkey;
ALTER TABLE ONLY public.audit_logs DROP CONSTRAINT audit_logs_tenant_id_fkey;
ALTER TABLE ONLY public.attendance_logs DROP CONSTRAINT attendance_logs_employee_id_fkey;
ALTER TABLE ONLY public.approval_requests DROP CONSTRAINT approval_requests_tenant_id_fkey;
ALTER TABLE ONLY public.approval_requests DROP CONSTRAINT approval_requests_requester_id_fkey;
ALTER TABLE ONLY public.approval_requests DROP CONSTRAINT approval_requests_approver_id_fkey;
DROP TRIGGER audit_log_immutable ON public.audit_logs;
DROP INDEX public.vitals_tenant_id_encounter_id_idx;
DROP INDEX public.users_tenant_id_email_key;
DROP INDEX public.user_mfa_recovery_codes_user_id_idx;
DROP INDEX public.user_branches_user_id_idx;
DROP INDEX public.user_branches_tenant_id_user_id_idx;
DROP INDEX public.user_branches_tenant_id_user_id_branch_id_key;
DROP INDEX public.user_branches_tenant_id_idx;
DROP INDEX public.user_branches_tenant_id_branch_id_idx;
DROP INDEX public.user_branches_branch_id_idx;
DROP INDEX public.sla_alerts_tenant_id_idx;
DROP INDEX public.sessions_user_id_idx;
DROP INDEX public.sessions_tenant_id_idx;
DROP INDEX public.sessions_refresh_token_hash_key;
DROP INDEX public.service_prices_tenant_id_idx;
DROP INDEX public.service_prices_service_item_id_idx;
DROP INDEX public.service_prices_branch_id_idx;
DROP INDEX public.service_items_tenant_id_idx;
DROP INDEX public.service_items_tenant_id_code_key;
DROP INDEX public.service_items_category_id_idx;
DROP INDEX public.service_categories_tenant_id_idx;
DROP INDEX public.report_exports_tenant_id_idx;
DROP INDEX public.report_exports_branch_id_idx;
DROP INDEX public.referrals_tenant_id_encounter_id_idx;
DROP INDEX public.referrals_patient_id_idx;
DROP INDEX public.purchase_orders_tenant_id_order_number_key;
DROP INDEX public.prescriptions_tenant_id_encounter_id_idx;
DROP INDEX public.prescriptions_patient_id_idx;
DROP INDEX public.permissions_tenant_id_name_key;
DROP INDEX public.payslips_tenant_id_employee_id_branch_id_idx;
DROP INDEX public.payslips_tenant_id_branch_id_idx;
DROP INDEX public.payments_tenant_id_receipt_number_key;
DROP INDEX public.payment_voids_payment_id_key;
DROP INDEX public.payment_reversals_type_idx;
DROP INDEX public.payment_reversals_tenant_id_idx;
DROP INDEX public.payment_reversals_status_idx;
DROP INDEX public.payment_reversals_payment_id_idx;
DROP INDEX public.payment_reversals_invoice_id_idx;
DROP INDEX public.payment_reversals_branch_id_idx;
DROP INDEX public.payment_reversals_approval_request_id_key;
DROP INDEX public.patients_tenant_id_patient_number_key;
DROP INDEX public.patient_users_tenant_id_email_key;
DROP INDEX public.patient_users_patient_id_key;
DROP INDEX public.patient_merge_requests_tenant_id_idx;
DROP INDEX public.patient_merge_requests_status_idx;
DROP INDEX public.patient_merge_requests_branch_id_idx;
DROP INDEX public.orders_tenant_id_order_number_key;
DROP INDEX public.order_items_tenant_id_idx;
DROP INDEX public.order_items_order_id_idx;
DROP INDEX public.numbering_sequences_tenant_id_branch_id_entity_type_key;
DROP INDEX public.ledger_entries_tenant_id_branch_id_idx;
DROP INDEX public.ledger_entries_reference_type_reference_id_idx;
DROP INDEX public.lab_results_order_id_key;
DROP INDEX public.lab_result_signatures_lab_result_id_key;
DROP INDEX public.invoices_tenant_id_invoice_number_key;
DROP INDEX public.invoices_order_id_key;
DROP INDEX public.inventory_items_tenant_id_sku_key;
DROP INDEX public.insurance_claims_tenant_id_branch_id_idx;
DROP INDEX public.insurance_claims_patient_id_idx;
DROP INDEX public.insurance_claims_invoice_id_idx;
DROP INDEX public.idempotency_records_tenant_id_operation_key_key;
DROP INDEX public.idempotency_records_tenant_id_idx;
DROP INDEX public.idempotency_records_status_idx;
DROP INDEX public.icd_10_codes_code_key;
DROP INDEX public.hmo_partners_tenant_id_code_key;
DROP INDEX public.encounters_tenant_id_status_idx;
DROP INDEX public.encounters_tenant_id_patient_id_idx;
DROP INDEX public.encounters_tenant_id_idx;
DROP INDEX public.encounters_status_idx;
DROP INDEX public.encounters_patient_id_idx;
DROP INDEX public.encounters_branch_id_idx;
DROP INDEX public.employees_tenant_id_employee_number_key;
DROP INDEX public.employee_branches_tenant_id_idx;
DROP INDEX public.employee_branches_tenant_id_employee_id_idx;
DROP INDEX public.employee_branches_tenant_id_employee_id_branch_id_key;
DROP INDEX public.employee_branches_tenant_id_branch_id_idx;
DROP INDEX public.employee_branches_employee_id_idx;
DROP INDEX public.employee_branches_branch_id_idx;
DROP INDEX public.diagnoses_tenant_id_encounter_id_idx;
DROP INDEX public.departments_tenant_id_code_key;
DROP INDEX public.cpt_codes_tenant_id_code_key;
DROP INDEX public.clinical_notes_tenant_id_encounter_id_idx;
DROP INDEX public.claims_tenant_id_claim_number_key;
DROP INDEX public.cashier_sessions_one_open_per_user_branch_idx;
DROP INDEX public.branch_stocks_tenant_id_idx;
DROP INDEX public.branch_stocks_tenant_id_branch_id_inventory_item_id_key;
DROP INDEX public.branch_stocks_tenant_id_branch_id_idx;
DROP INDEX public.branch_stocks_inventory_item_id_idx;
DROP INDEX public.branch_stocks_branch_id_idx;
DROP INDEX public.audit_logs_tenant_id_idx;
DROP INDEX public.audit_logs_branch_id_idx;
ALTER TABLE ONLY public.vitals DROP CONSTRAINT vitals_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.user_roles DROP CONSTRAINT user_roles_pkey;
ALTER TABLE ONLY public.user_mfa_recovery_codes DROP CONSTRAINT user_mfa_recovery_codes_pkey;
ALTER TABLE ONLY public.user_branches DROP CONSTRAINT user_branches_pkey;
ALTER TABLE ONLY public.tenants DROP CONSTRAINT tenants_pkey;
ALTER TABLE ONLY public.suppliers DROP CONSTRAINT suppliers_pkey;
ALTER TABLE ONLY public.stock_logs DROP CONSTRAINT stock_logs_pkey;
ALTER TABLE ONLY public.sla_alerts DROP CONSTRAINT sla_alerts_pkey;
ALTER TABLE ONLY public.sessions DROP CONSTRAINT sessions_pkey;
ALTER TABLE ONLY public.service_prices DROP CONSTRAINT service_prices_pkey;
ALTER TABLE ONLY public.service_items DROP CONSTRAINT service_items_pkey;
ALTER TABLE ONLY public.service_categories DROP CONSTRAINT service_categories_pkey;
ALTER TABLE ONLY public.roles DROP CONSTRAINT roles_pkey;
ALTER TABLE ONLY public.role_permissions DROP CONSTRAINT role_permissions_pkey;
ALTER TABLE ONLY public.report_exports DROP CONSTRAINT report_exports_pkey;
ALTER TABLE ONLY public.refunds DROP CONSTRAINT refunds_pkey;
ALTER TABLE ONLY public.referrers DROP CONSTRAINT referrers_pkey;
ALTER TABLE ONLY public.referrals DROP CONSTRAINT referrals_pkey;
ALTER TABLE ONLY public.referral_records DROP CONSTRAINT referral_records_pkey;
ALTER TABLE ONLY public.receiving_records DROP CONSTRAINT receiving_records_pkey;
ALTER TABLE ONLY public.queue_entries DROP CONSTRAINT queue_entries_pkey;
ALTER TABLE ONLY public.purchase_requests DROP CONSTRAINT purchase_requests_pkey;
ALTER TABLE ONLY public.purchase_orders DROP CONSTRAINT purchase_orders_pkey;
ALTER TABLE ONLY public.prescriptions DROP CONSTRAINT prescriptions_pkey;
ALTER TABLE ONLY public.permissions DROP CONSTRAINT permissions_pkey;
ALTER TABLE ONLY public.payslips DROP CONSTRAINT payslips_pkey;
ALTER TABLE ONLY public.payments DROP CONSTRAINT payments_pkey;
ALTER TABLE ONLY public.payment_voids DROP CONSTRAINT payment_voids_pkey;
ALTER TABLE ONLY public.payment_reversals DROP CONSTRAINT payment_reversals_pkey;
ALTER TABLE ONLY public.patients DROP CONSTRAINT patients_pkey;
ALTER TABLE ONLY public.patient_users DROP CONSTRAINT patient_users_pkey;
ALTER TABLE ONLY public.patient_merge_requests DROP CONSTRAINT patient_merge_requests_pkey;
ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_pkey;
ALTER TABLE ONLY public.order_items DROP CONSTRAINT order_items_pkey;
ALTER TABLE ONLY public.numbering_sequences DROP CONSTRAINT numbering_sequences_pkey;
ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_pkey;
ALTER TABLE ONLY public.notification_outbox DROP CONSTRAINT notification_outbox_pkey;
ALTER TABLE ONLY public.license_records DROP CONSTRAINT license_records_pkey;
ALTER TABLE ONLY public.ledger_entries DROP CONSTRAINT ledger_entries_pkey;
ALTER TABLE ONLY public.leave_requests DROP CONSTRAINT leave_requests_pkey;
ALTER TABLE ONLY public.lab_results DROP CONSTRAINT lab_results_pkey;
ALTER TABLE ONLY public.lab_result_versions DROP CONSTRAINT lab_result_versions_pkey;
ALTER TABLE ONLY public.lab_result_signatures DROP CONSTRAINT lab_result_signatures_pkey;
ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_pkey;
ALTER TABLE ONLY public.inventory_items DROP CONSTRAINT inventory_items_pkey;
ALTER TABLE ONLY public.insurance_claims DROP CONSTRAINT insurance_claims_pkey;
ALTER TABLE ONLY public.idempotency_records DROP CONSTRAINT idempotency_records_pkey;
ALTER TABLE ONLY public.icd_10_codes DROP CONSTRAINT icd_10_codes_pkey;
ALTER TABLE ONLY public.hmo_partners DROP CONSTRAINT hmo_partners_pkey;
ALTER TABLE ONLY public.files DROP CONSTRAINT files_pkey;
ALTER TABLE ONLY public.encounters DROP CONSTRAINT encounters_pkey;
ALTER TABLE ONLY public.encounter_diagnoses DROP CONSTRAINT encounter_diagnoses_pkey;
ALTER TABLE ONLY public.employees DROP CONSTRAINT employees_pkey;
ALTER TABLE ONLY public.employee_branches DROP CONSTRAINT employee_branches_pkey;
ALTER TABLE ONLY public.diagnoses DROP CONSTRAINT diagnoses_pkey;
ALTER TABLE ONLY public.departments DROP CONSTRAINT departments_pkey;
ALTER TABLE ONLY public.cpt_codes DROP CONSTRAINT cpt_codes_pkey;
ALTER TABLE ONLY public.clinical_notes DROP CONSTRAINT clinical_notes_pkey;
ALTER TABLE ONLY public.claims DROP CONSTRAINT claims_pkey;
ALTER TABLE ONLY public.cashier_sessions DROP CONSTRAINT cashier_sessions_pkey;
ALTER TABLE ONLY public.cashier_ledger_entries DROP CONSTRAINT cashier_ledger_entries_pkey;
ALTER TABLE ONLY public.branches DROP CONSTRAINT branches_pkey;
ALTER TABLE ONLY public.branch_stocks DROP CONSTRAINT branch_stocks_pkey;
ALTER TABLE ONLY public.audit_logs DROP CONSTRAINT audit_logs_pkey;
ALTER TABLE ONLY public.attendance_logs DROP CONSTRAINT attendance_logs_pkey;
ALTER TABLE ONLY public.approval_requests DROP CONSTRAINT approval_requests_pkey;
ALTER TABLE ONLY public._prisma_migrations DROP CONSTRAINT _prisma_migrations_pkey;
DROP TABLE public.vitals;
DROP TABLE public.users;
DROP TABLE public.user_roles;
DROP TABLE public.user_mfa_recovery_codes;
DROP TABLE public.user_branches;
DROP TABLE public.tenants;
DROP TABLE public.suppliers;
DROP TABLE public.stock_logs;
DROP TABLE public.sla_alerts;
DROP TABLE public.sessions;
DROP TABLE public.service_prices;
DROP TABLE public.service_items;
DROP TABLE public.service_categories;
DROP TABLE public.roles;
DROP TABLE public.role_permissions;
DROP TABLE public.report_exports;
DROP TABLE public.refunds;
DROP TABLE public.referrers;
DROP TABLE public.referrals;
DROP TABLE public.referral_records;
DROP TABLE public.receiving_records;
DROP TABLE public.queue_entries;
DROP TABLE public.purchase_requests;
DROP TABLE public.purchase_orders;
DROP TABLE public.prescriptions;
DROP TABLE public.permissions;
DROP TABLE public.payslips;
DROP TABLE public.payments;
DROP TABLE public.payment_voids;
DROP TABLE public.payment_reversals;
DROP TABLE public.patients;
DROP TABLE public.patient_users;
DROP TABLE public.patient_merge_requests;
DROP TABLE public.orders;
DROP TABLE public.order_items;
DROP TABLE public.numbering_sequences;
DROP TABLE public.notifications;
DROP TABLE public.notification_outbox;
DROP TABLE public.license_records;
DROP TABLE public.ledger_entries;
DROP TABLE public.leave_requests;
DROP TABLE public.lab_results;
DROP TABLE public.lab_result_versions;
DROP TABLE public.lab_result_signatures;
DROP TABLE public.invoices;
DROP TABLE public.inventory_items;
DROP TABLE public.insurance_claims;
DROP TABLE public.idempotency_records;
DROP TABLE public.icd_10_codes;
DROP TABLE public.hmo_partners;
DROP TABLE public.files;
DROP TABLE public.encounters;
DROP TABLE public.encounter_diagnoses;
DROP TABLE public.employees;
DROP TABLE public.employee_branches;
DROP TABLE public.diagnoses;
DROP TABLE public.departments;
DROP TABLE public.cpt_codes;
DROP TABLE public.clinical_notes;
DROP TABLE public.claims;
DROP TABLE public.cashier_sessions;
DROP TABLE public.cashier_ledger_entries;
DROP TABLE public.branches;
DROP TABLE public.branch_stocks;
DROP TABLE public.audit_logs;
DROP TABLE public.attendance_logs;
DROP TABLE public.approval_requests;
DROP TABLE public._prisma_migrations;
DROP FUNCTION public.prevent_audit_log_modification();
DROP TYPE public."UserRoleEnum";
DROP TYPE public."ReferralUrgency";
DROP TYPE public."ReferralStatus";
DROP TYPE public."PrescriptionStatus";
DROP TYPE public."NoteType";
DROP TYPE public."EncounterStatus";
--
-- Name: EncounterStatus; Type: TYPE; Schema: public; Owner: hms_prod_user
--

CREATE TYPE public."EncounterStatus" AS ENUM (
    'PLANNED',
    'ARRIVED',
    'IN_PROGRESS',
    'FINISHED',
    'CANCELLED',
    'ENTERED_IN_ERROR',
    'UNKNOWN',
    'OPEN',
    'CLOSED'
);


ALTER TYPE public."EncounterStatus" OWNER TO hms_prod_user;

--
-- Name: NoteType; Type: TYPE; Schema: public; Owner: hms_prod_user
--

CREATE TYPE public."NoteType" AS ENUM (
    'CHIEF_COMPLAINT',
    'PROGRESS',
    'NURSING',
    'DISCHARGE'
);


ALTER TYPE public."NoteType" OWNER TO hms_prod_user;

--
-- Name: PrescriptionStatus; Type: TYPE; Schema: public; Owner: hms_prod_user
--

CREATE TYPE public."PrescriptionStatus" AS ENUM (
    'ACTIVE',
    'CANCELLED',
    'DISPENSED'
);


ALTER TYPE public."PrescriptionStatus" OWNER TO hms_prod_user;

--
-- Name: ReferralStatus; Type: TYPE; Schema: public; Owner: hms_prod_user
--

CREATE TYPE public."ReferralStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."ReferralStatus" OWNER TO hms_prod_user;

--
-- Name: ReferralUrgency; Type: TYPE; Schema: public; Owner: hms_prod_user
--

CREATE TYPE public."ReferralUrgency" AS ENUM (
    'ROUTINE',
    'URGENT',
    'EMERGENCY'
);


ALTER TYPE public."ReferralUrgency" OWNER TO hms_prod_user;

--
-- Name: UserRoleEnum; Type: TYPE; Schema: public; Owner: hms_prod_user
--

CREATE TYPE public."UserRoleEnum" AS ENUM (
    'ADMIN',
    'ANALYST'
);


ALTER TYPE public."UserRoleEnum" OWNER TO hms_prod_user;

--
-- Name: prevent_audit_log_modification(); Type: FUNCTION; Schema: public; Owner: hms_prod_user
--

CREATE FUNCTION public.prevent_audit_log_modification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Audit log records are immutable and cannot be updated. Record ID: %', OLD.id;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Audit log records are immutable and cannot be deleted. Record ID: %', OLD.id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION public.prevent_audit_log_modification() OWNER TO hms_prod_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO hms_prod_user;

--
-- Name: approval_requests; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.approval_requests (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    requester_id uuid NOT NULL,
    approver_id uuid,
    type text NOT NULL,
    "riskLevel" text NOT NULL,
    record_id text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    reason text,
    remarks text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    details jsonb
);


ALTER TABLE public.approval_requests OWNER TO hms_prod_user;

--
-- Name: attendance_logs; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.attendance_logs (
    id uuid NOT NULL,
    employee_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    date date NOT NULL,
    check_in timestamp(3) without time zone NOT NULL,
    check_out timestamp(3) without time zone,
    source text DEFAULT 'WEB'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.attendance_logs OWNER TO hms_prod_user;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    event_key text NOT NULL,
    record_type text NOT NULL,
    record_id uuid NOT NULL,
    old_values jsonb,
    new_values jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    branch_id uuid,
    active_role text,
    ip_address text,
    session_id uuid,
    user_agent text,
    hash character(64),
    previous_hash character(64),
    signature text
);


ALTER TABLE public.audit_logs OWNER TO hms_prod_user;

--
-- Name: branch_stocks; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.branch_stocks (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    inventory_item_id uuid NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    reorder_level integer DEFAULT 10 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.branch_stocks OWNER TO hms_prod_user;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.branches (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.branches OWNER TO hms_prod_user;

--
-- Name: cashier_ledger_entries; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.cashier_ledger_entries (
    id uuid NOT NULL,
    cashier_session_id uuid NOT NULL,
    type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    reference_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.cashier_ledger_entries OWNER TO hms_prod_user;

--
-- Name: cashier_sessions; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.cashier_sessions (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'OPEN'::text NOT NULL,
    opening_balance numeric(12,2) NOT NULL,
    closing_balance numeric(12,2),
    opened_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closed_at timestamp(3) without time zone
);


ALTER TABLE public.cashier_sessions OWNER TO hms_prod_user;

--
-- Name: claims; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.claims (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    hmo_partner_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    claim_number text NOT NULL,
    loa_number text,
    amount_claimed numeric(12,2) NOT NULL,
    amount_approved numeric(12,2),
    status text DEFAULT 'PENDING'::text NOT NULL,
    remarks text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.claims OWNER TO hms_prod_user;

--
-- Name: clinical_notes; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.clinical_notes (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    encounter_id uuid NOT NULL,
    note_type public."NoteType" DEFAULT 'PROGRESS'::public."NoteType" NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    created_by uuid NOT NULL,
    updated_by uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    assessment text,
    author_id uuid,
    locked_at timestamp(3) without time zone,
    locked_by uuid,
    objective text,
    plan text,
    subjective text,
    deleted_at timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.clinical_notes OWNER TO hms_prod_user;

--
-- Name: cpt_codes; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.cpt_codes (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    code text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    fees numeric(10,2) NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cpt_codes OWNER TO hms_prod_user;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.departments (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.departments OWNER TO hms_prod_user;

--
-- Name: diagnoses; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.diagnoses (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    encounter_id uuid NOT NULL,
    icd_10_code text NOT NULL,
    description text NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.diagnoses OWNER TO hms_prod_user;

--
-- Name: employee_branches; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.employee_branches (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.employee_branches OWNER TO hms_prod_user;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.employees (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    department_id uuid,
    employee_number text NOT NULL,
    first_name text,
    last_name text,
    job_title text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    joining_date date,
    salary numeric(12,2),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    branch_id uuid NOT NULL,
    department text DEFAULT ''::text NOT NULL,
    hire_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "position" text DEFAULT ''::text NOT NULL,
    user_id uuid
);


ALTER TABLE public.employees OWNER TO hms_prod_user;

--
-- Name: encounter_diagnoses; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.encounter_diagnoses (
    id uuid NOT NULL,
    encounter_id uuid NOT NULL,
    icd10_code_id uuid NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_reason text,
    deleted_at timestamp(3) without time zone,
    deleted_by_id uuid
);


ALTER TABLE public.encounter_diagnoses OWNER TO hms_prod_user;

--
-- Name: encounters; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.encounters (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    status public."EncounterStatus" DEFAULT 'OPEN'::public."EncounterStatus" NOT NULL,
    type text,
    started_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at timestamp(3) without time zone,
    reason text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    attending_id uuid,
    created_by uuid NOT NULL,
    updated_by uuid NOT NULL,
    chief_complaint text DEFAULT ''::text NOT NULL,
    doctor_id uuid,
    encountered_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    archive_reason text,
    archived_at timestamp(3) without time zone
);


ALTER TABLE public.encounters OWNER TO hms_prod_user;

--
-- Name: files; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.files (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    record_type text NOT NULL,
    record_id uuid NOT NULL,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    storage_path text NOT NULL,
    uploaded_by_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.files OWNER TO hms_prod_user;

--
-- Name: hmo_partners; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.hmo_partners (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    contact_person text,
    email text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.hmo_partners OWNER TO hms_prod_user;

--
-- Name: icd_10_codes; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.icd_10_codes (
    id uuid NOT NULL,
    code text NOT NULL,
    description text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.icd_10_codes OWNER TO hms_prod_user;

--
-- Name: idempotency_records; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.idempotency_records (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    operation text NOT NULL,
    key text NOT NULL,
    request_fingerprint text NOT NULL,
    status text DEFAULT 'IN_PROGRESS'::text NOT NULL,
    payment_id uuid,
    response_data jsonb,
    error text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.idempotency_records OWNER TO hms_prod_user;

--
-- Name: insurance_claims; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.insurance_claims (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    provider_code text NOT NULL,
    claim_number text,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    submitted_at timestamp(3) without time zone,
    settled_at timestamp(3) without time zone,
    claimed_amount numeric(12,2) NOT NULL,
    settled_amount numeric(12,2),
    rejection_reason text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.insurance_claims OWNER TO hms_prod_user;

--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.inventory_items (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    sku text,
    category text NOT NULL,
    unit text NOT NULL,
    reorder_level integer DEFAULT 10 NOT NULL,
    current_stock integer DEFAULT 0 NOT NULL,
    price numeric(12,2) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL
);


ALTER TABLE public.inventory_items OWNER TO hms_prod_user;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.invoices (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    invoice_number text,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'UNPAID'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    tenant_id uuid NOT NULL,
    created_by_id uuid,
    deleted_at timestamp(3) without time zone,
    updated_by_id uuid,
    version integer DEFAULT 0 NOT NULL,
    archive_reason text,
    archived_at timestamp(3) without time zone
);


ALTER TABLE public.invoices OWNER TO hms_prod_user;

--
-- Name: lab_result_signatures; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.lab_result_signatures (
    id uuid NOT NULL,
    lab_result_id uuid NOT NULL,
    signed_by_id uuid NOT NULL,
    signed_at timestamp(3) without time zone NOT NULL,
    signature_hash text NOT NULL
);


ALTER TABLE public.lab_result_signatures OWNER TO hms_prod_user;

--
-- Name: lab_result_versions; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.lab_result_versions (
    id uuid NOT NULL,
    lab_result_id uuid NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    old_status text NOT NULL,
    new_status text NOT NULL,
    amended_by_id uuid NOT NULL,
    reason text NOT NULL,
    old_data jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.lab_result_versions OWNER TO hms_prod_user;

--
-- Name: lab_results; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.lab_results (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    status text DEFAULT 'PENDING_COLLECTION'::text NOT NULL,
    approved_by_id uuid,
    locked_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    tenant_id uuid NOT NULL,
    remarks text,
    results jsonb,
    created_by_id uuid,
    deleted_at timestamp(3) without time zone,
    updated_by_id uuid,
    version integer DEFAULT 0 NOT NULL,
    archive_reason text,
    archived_at timestamp(3) without time zone
);


ALTER TABLE public.lab_results OWNER TO hms_prod_user;

--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.leave_requests (
    id uuid NOT NULL,
    employee_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    type text NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    reason text NOT NULL,
    approved_by_id uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.leave_requests OWNER TO hms_prod_user;

--
-- Name: ledger_entries; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.ledger_entries (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    entry_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    debit_account text NOT NULL,
    credit_account text NOT NULL,
    amount numeric(12,2) NOT NULL,
    reference_type text NOT NULL,
    reference_id uuid NOT NULL,
    description text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ledger_entries OWNER TO hms_prod_user;

--
-- Name: license_records; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.license_records (
    id uuid NOT NULL,
    employee_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    license_type text NOT NULL,
    license_number text NOT NULL,
    issued_at timestamp(3) without time zone NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.license_records OWNER TO hms_prod_user;

--
-- Name: notification_outbox; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.notification_outbox (
    id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    type text NOT NULL,
    payload text NOT NULL,
    scheduled_at timestamp(3) without time zone NOT NULL,
    sent_at timestamp(3) without time zone,
    status text DEFAULT 'PENDING'::text NOT NULL
);


ALTER TABLE public.notification_outbox OWNER TO hms_prod_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    patient_id uuid,
    type text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    recipient text NOT NULL,
    subject text,
    content text NOT NULL,
    template_key text,
    category text DEFAULT 'SYSTEM'::text NOT NULL,
    priority text DEFAULT 'NORMAL'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    last_error text,
    sent_at timestamp(3) without time zone,
    read_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO hms_prod_user;

--
-- Name: numbering_sequences; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.numbering_sequences (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid,
    entity_type text NOT NULL,
    prefix text NOT NULL,
    current_val integer DEFAULT 0 NOT NULL,
    padding integer DEFAULT 6 NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.numbering_sequences OWNER TO hms_prod_user;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.order_items (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    order_id uuid NOT NULL,
    item_type text NOT NULL,
    item_id uuid NOT NULL,
    name text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_items OWNER TO hms_prod_user;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.orders (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    order_number text NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    created_by_id uuid,
    deleted_at timestamp(3) without time zone,
    updated_by_id uuid,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.orders OWNER TO hms_prod_user;

--
-- Name: patient_merge_requests; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.patient_merge_requests (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid,
    requester_id uuid NOT NULL,
    approver_id uuid,
    source_patient_id uuid NOT NULL,
    target_patient_id uuid NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    reason text NOT NULL,
    remarks text,
    "riskLevel" text DEFAULT 'HIGH'::text NOT NULL,
    field_snapshots jsonb,
    applied_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.patient_merge_requests OWNER TO hms_prod_user;

--
-- Name: patient_users; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.patient_users (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.patient_users OWNER TO hms_prod_user;

--
-- Name: patients; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.patients (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_number text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    dob date NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    created_by_id uuid,
    deleted_at timestamp(3) without time zone,
    updated_by_id uuid,
    version integer DEFAULT 0 NOT NULL,
    archive_reason text,
    archived_at timestamp(3) without time zone
);


ALTER TABLE public.patients OWNER TO hms_prod_user;

--
-- Name: payment_reversals; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.payment_reversals (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    payment_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    approval_request_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    reason text NOT NULL,
    requested_by uuid NOT NULL,
    approved_by uuid,
    applied_by uuid,
    requested_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    approved_at timestamp(3) without time zone,
    applied_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payment_reversals OWNER TO hms_prod_user;

--
-- Name: payment_voids; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.payment_voids (
    id uuid NOT NULL,
    payment_id uuid NOT NULL,
    approval_id uuid NOT NULL,
    voided_by uuid NOT NULL,
    voided_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reason text NOT NULL
);


ALTER TABLE public.payment_voids OWNER TO hms_prod_user;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.payments (
    id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    cashier_session_id uuid NOT NULL,
    receipt_number text,
    amount numeric(12,2) NOT NULL,
    payment_method text NOT NULL,
    status text DEFAULT 'POSTED'::text NOT NULL,
    idempotency_key text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tenant_id uuid NOT NULL,
    created_by_id uuid,
    deleted_at timestamp(3) without time zone,
    updated_at timestamp(3) without time zone NOT NULL,
    updated_by_id uuid,
    version integer DEFAULT 0 NOT NULL,
    archive_reason text,
    archived_at timestamp(3) without time zone
);


ALTER TABLE public.payments OWNER TO hms_prod_user;

--
-- Name: payslips; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.payslips (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    basic_salary numeric(12,2) NOT NULL,
    total_allowances numeric(12,2) NOT NULL,
    total_deductions numeric(12,2) NOT NULL,
    net_salary numeric(12,2) NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    branch_id uuid NOT NULL
);


ALTER TABLE public.payslips OWNER TO hms_prod_user;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    scope text,
    risk_level text DEFAULT 'PRIVILEGED'::text NOT NULL
);


ALTER TABLE public.permissions OWNER TO hms_prod_user;

--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.prescriptions (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    encounter_id uuid NOT NULL,
    prescribed_by_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    medication_name text NOT NULL,
    dosage text NOT NULL,
    frequency text NOT NULL,
    duration text NOT NULL,
    notes text,
    status public."PrescriptionStatus" DEFAULT 'ACTIVE'::public."PrescriptionStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    created_by_id uuid,
    deleted_at timestamp(3) without time zone,
    updated_by_id uuid,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.prescriptions OWNER TO hms_prod_user;

--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.purchase_orders (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    purchase_request_id uuid NOT NULL,
    order_number text NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.purchase_orders OWNER TO hms_prod_user;

--
-- Name: purchase_requests; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.purchase_requests (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    requested_by_id uuid NOT NULL,
    items jsonb NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    reason text,
    approved_by_id uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.purchase_requests OWNER TO hms_prod_user;

--
-- Name: queue_entries; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.queue_entries (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    patient_id uuid,
    patient_name text,
    queue_number text NOT NULL,
    category text DEFAULT 'REGULAR'::text NOT NULL,
    service_type text NOT NULL,
    status text DEFAULT 'WAITING'::text NOT NULL,
    counter_number text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.queue_entries OWNER TO hms_prod_user;

--
-- Name: receiving_records; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.receiving_records (
    id uuid NOT NULL,
    purchase_order_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    received_by_id uuid NOT NULL,
    received_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.receiving_records OWNER TO hms_prod_user;

--
-- Name: referral_records; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.referral_records (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    order_id uuid NOT NULL,
    referrer_id uuid NOT NULL,
    referral_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    rebate_amount numeric(12,2) NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.referral_records OWNER TO hms_prod_user;

--
-- Name: referrals; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.referrals (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    encounter_id uuid NOT NULL,
    referred_by_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    referred_to_name text NOT NULL,
    specialty text NOT NULL,
    reason text NOT NULL,
    urgency public."ReferralUrgency" DEFAULT 'ROUTINE'::public."ReferralUrgency" NOT NULL,
    status public."ReferralStatus" DEFAULT 'PENDING'::public."ReferralStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    created_by_id uuid,
    deleted_at timestamp(3) without time zone,
    updated_by_id uuid,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.referrals OWNER TO hms_prod_user;

--
-- Name: referrers; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.referrers (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'DOCTOR'::text NOT NULL,
    contact_info text,
    rebate_rate numeric(5,2) NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.referrers OWNER TO hms_prod_user;

--
-- Name: refunds; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.refunds (
    id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    payment_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    approved_by uuid NOT NULL,
    refunded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    method text NOT NULL,
    reason text NOT NULL
);


ALTER TABLE public.refunds OWNER TO hms_prod_user;

--
-- Name: report_exports; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.report_exports (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid,
    report_type text NOT NULL,
    filters jsonb NOT NULL,
    reason text NOT NULL,
    row_count integer NOT NULL,
    status text DEFAULT 'PENDING_APPROVAL'::text NOT NULL,
    requested_by uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp(3) without time zone,
    allowed_fields jsonb,
    approved_at timestamp(3) without time zone,
    checksum text,
    decided_at timestamp(3) without time zone,
    decided_by_id uuid,
    decision_reason text,
    download_count integer DEFAULT 0 NOT NULL,
    expires_at timestamp(3) without time zone,
    failure_reason text,
    field_policy_snapshot jsonb,
    filters_snapshot jsonb,
    format text,
    generated_at timestamp(3) without time zone,
    last_downloaded_at timestamp(3) without time zone,
    masked_fields jsonb,
    requested_fields jsonb,
    risk_level text DEFAULT 'HIGH'::text NOT NULL,
    storage_key text
);


ALTER TABLE public.report_exports OWNER TO hms_prod_user;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO hms_prod_user;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.roles (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    archived_at timestamp(3) without time zone,
    archived_reason text
);


ALTER TABLE public.roles OWNER TO hms_prod_user;

--
-- Name: service_categories; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.service_categories (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    created_by uuid NOT NULL,
    updated_by uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.service_categories OWNER TO hms_prod_user;

--
-- Name: service_items; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.service_items (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    category_id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    updated_by uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.service_items OWNER TO hms_prod_user;

--
-- Name: service_prices; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.service_prices (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    service_item_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    effective_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    updated_by uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.service_prices OWNER TO hms_prod_user;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    refresh_token_hash text NOT NULL,
    is_mfa_verified boolean DEFAULT false NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    last_rotated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_agent text,
    ip_address text
);


ALTER TABLE public.sessions OWNER TO hms_prod_user;

--
-- Name: sla_alerts; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.sla_alerts (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    metric_name text NOT NULL,
    threshold_value double precision NOT NULL,
    actual_value double precision NOT NULL,
    status text DEFAULT 'TRIGGERED'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sla_alerts OWNER TO hms_prod_user;

--
-- Name: stock_logs; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.stock_logs (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    inventory_item_id uuid NOT NULL,
    type text NOT NULL,
    quantity integer NOT NULL,
    previous_stock integer NOT NULL,
    new_stock integer NOT NULL,
    reference_type text,
    reference_id uuid,
    remarks text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    branch_id uuid NOT NULL
);


ALTER TABLE public.stock_logs OWNER TO hms_prod_user;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.suppliers (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    contact_name text,
    contact_email text,
    contact_phone text,
    address text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.suppliers OWNER TO hms_prod_user;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.tenants (
    id uuid NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tenants OWNER TO hms_prod_user;

--
-- Name: user_branches; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.user_branches (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_branches OWNER TO hms_prod_user;

--
-- Name: user_mfa_recovery_codes; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.user_mfa_recovery_codes (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    code_hash text NOT NULL,
    used_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_mfa_recovery_codes OWNER TO hms_prod_user;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    revoked_at timestamp(3) without time zone,
    revoked_reason text
);


ALTER TABLE public.user_roles OWNER TO hms_prod_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    is_mfa_enabled boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    deactivated_at timestamp(3) without time zone,
    deactivated_reason text,
    token_version integer DEFAULT 0 NOT NULL,
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp(3) without time zone,
    mfa_secret text
);


ALTER TABLE public.users OWNER TO hms_prod_user;

--
-- Name: vitals; Type: TABLE; Schema: public; Owner: hms_prod_user
--

CREATE TABLE public.vitals (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    encounter_id uuid NOT NULL,
    temperature numeric(5,2),
    systolic_bp integer,
    diastolic_bp integer,
    heart_rate integer,
    respiratory_rate integer,
    weight_kg numeric(6,2),
    created_by uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.vitals OWNER TO hms_prod_user;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
4e0f8d37-8bea-4c0e-a396-5c4097c20346	e4f4823058965051480db4a5ae5c9a2a632d579c5ce7a888f6261859d534506b	2026-05-17 12:05:15.48514+00	20260510081754_add_user_branch_assignments	\N	\N	2026-05-17 12:05:15.005304+00	1
3468e12d-2ca5-43bb-976f-c3152be6ea4a	7a247aa30372dcc2f2543cfb494c4ca2343f04eddc735f1bfd4ee4fb285be242	2026-05-17 12:05:15.921141+00	20260515014422_add_service_catalog_and_order_items	\N	\N	2026-05-17 12:05:15.843775+00	1
70a1ab3b-addb-4b3b-aa00-aed6f4e76024	7054187719f78c74b1561b356eec99135a540f17aa67cbaaa123db9a70ac84ec	2026-05-17 12:05:15.534705+00	20260511124138_add_branch_scoped_inventory_stock	\N	\N	2026-05-17 12:05:15.486871+00	1
ea5f871b-474f-4e12-a25b-ee943b5acda8	691c0214f9b4cefd8e352104945ef0ac6ef8aaba90464209abdc448718f059bf	2026-05-17 12:05:15.596101+00	20260511130310_add_employee_branch_assignments	\N	\N	2026-05-17 12:05:15.536458+00	1
2aa22057-2053-454e-ad10-c1101af96e8f	cd9b510bdbc28737d18480a4ff0762a8e26f8c3a8e0680bc4e06cddeb8644bdb	2026-05-17 12:05:16.652215+00	20260517100000_add_audit_log_immutability_trigger	\N	\N	2026-05-17 12:05:16.64363+00	1
ca3b4d56-60c3-47a8-a66c-3255b7eea8aa	9f5c09a9257a594764413b63e63484696b8f4b8ea8bbd774cd483223ac4bc062	2026-05-17 12:05:15.607337+00	20260512170000_add_admin_lifecycle_schema_foundations	\N	\N	2026-05-17 12:05:15.59771+00	1
0c7ce79c-b037-406d-9330-7323cebe3760	f0ed99a38f5dd3e1f7bcae41f5a990a76b00cfecf63c43828f4b110c6682189f	2026-05-17 12:05:15.928993+00	20260515035948_add_status_to_inventory_item	\N	\N	2026-05-17 12:05:15.922909+00	1
6ffda150-a9eb-4bc9-9a9d-e6f6eea933d6	d80ead13ec2907dc480067c23968f549c9ffb751be4aab557dd10558d8411d1f	2026-05-17 12:05:15.619781+00	20260512183000_add_user_role_lifecycle_fields	\N	\N	2026-05-17 12:05:15.609359+00	1
df5bc1ea-b272-4a58-b009-f195a7170b47	08d6ad59ed740c3feb2d25f91dcc6ab667e957f5d30039270096dfeace02fdcf	2026-05-17 12:05:15.628161+00	20260512194500_add_permission_risk_classification	\N	\N	2026-05-17 12:05:15.621465+00	1
a006dd90-c7dc-4f6a-9095-e786d31c747a	238bb9f128c55aa35e5bee838176f74ed49d17a85031c870b8971b1e0d658143	2026-05-17 12:05:15.730645+00	20260513034434_add_approval_request_user_relations	\N	\N	2026-05-17 12:05:15.630016+00	1
827909a8-b4b4-46d3-9bae-e86eee7691d0	70b215ea8ff46ce387212b151ccae915451053cdd585311940291b7788eedef0	2026-05-17 12:05:15.936261+00	20260515052709_add_lab_result_data_fields	\N	\N	2026-05-17 12:05:15.930592+00	1
b11fa560-acef-40ae-8857-44b7e7cd1d47	32a46c1f8f1b25bf2616e0ddf1c0f92510d833431c90fa24176789f0893eeee2	2026-05-17 12:05:15.748806+00	20260513095804_add_approval_metadata_workflow	\N	\N	2026-05-17 12:05:15.732632+00	1
e5f856d2-0892-439b-9219-8bfc0c3d82dd	8f57cb3b2e0db19d5d68d7bade700c4dc95abee8bc66c224d2ab9947d4a48b12	2026-05-17 12:05:15.787446+00	20260513112533_add_patient_merge_request	\N	\N	2026-05-17 12:05:15.750926+00	1
71ab01f5-d72f-452f-bb98-fd7c0396b247	2ebc84375203f675419fb946bead83d61bce6b6246d376c7051ab710abf60949	2026-05-17 12:05:16.714267+00	20260517103715_add_audit_log_hash_chain	\N	\N	2026-05-17 12:05:16.707363+00	1
19c43988-17a5-4620-8978-606a18119366	e9656b624b31dde01116ad3800335eb789b25106b7b8b12b0484a38f383c8cbb	2026-05-17 12:05:15.821124+00	20260513133000_add_idempotency_records_table	\N	\N	2026-05-17 12:05:15.789297+00	1
491b2b15-8a6e-4881-b43a-3eee550aae6b	ca9f32e636fec8019a2ab4abdfe77995b0aaa645d8443ea2f465a24bfdf8c76d	2026-05-17 12:05:15.980927+00	20260515154400_fix_encounter_uuid_permissions	\N	\N	2026-05-17 12:05:15.937817+00	1
cb223f93-49e1-4788-9d67-abe633d5c4f5	2602063a732b27d338ef3627e73361cbd371302458ca1a84e57e80e1c7313a9b	2026-05-17 12:05:15.829611+00	20260513152000_drop_global_payment_idempotency_key_uniqueness	\N	\N	2026-05-17 12:05:15.822852+00	1
87926f35-a377-4d5a-9534-ea531258714d	f212bd6bacd0aca8624470207ecdf412a4ed02433b1f65df50b72c424b676115	2026-05-17 12:05:15.841999+00	20260513193000_add_unique_open_cashier_session_guard	\N	\N	2026-05-17 12:05:15.831286+00	1
48d923d6-b023-4064-9916-f73a45e306b7	ab579b3eecb534beab92fbf2577f635871fcc4ab62a7616d4e1fd29d25d97b13	2026-05-17 12:05:16.659731+00	20260517100051_add_encounter_diagnosis_soft_delete	\N	\N	2026-05-17 12:05:16.653786+00	1
9e15b116-e0fb-4144-be90-efc03f8dab5a	bf2578272dd6de7ab8cd25c493ceb71dd367b124ea9c82d69e3372427b0c1fde	2026-05-17 12:05:16.137479+00	20260517010201_enforce_audit_log_immutability	\N	\N	2026-05-17 12:05:15.982533+00	1
b7049449-b103-4ce4-bbfd-f01c0377522c	0c029d612b443d075e6c3ca19706da4ba9db21bfed804653bde6f88d6f9ba3f8	2026-05-17 12:05:16.177647+00	20260517040054_add_sessions_table	\N	\N	2026-05-17 12:05:16.139066+00	1
1b11d4fd-faf7-4230-ae6d-cbeaa75d90ae	eb8db9064fedde5dfcec959eb0376afd15e635d0b3a8d2dff47af0032e94cbb3	2026-05-17 12:05:16.613558+00	20260517074722_add_user_lockout_fields	\N	\N	2026-05-17 12:05:16.179469+00	1
39c9d588-6c96-422d-88ce-a95c99be0b35	b211002ce8adbaa1e449c1f3d34dad89b63c6cf434aa4a54af4db7fe7ed03ca4	2026-05-17 12:05:16.66793+00	20260517100308_add_audit_log_forensic_context	\N	\N	2026-05-17 12:05:16.661281+00	1
026510b2-cd91-4d8c-8a44-a20890c79da7	98f5af32c321191ff2b434d8df0c632c66385103e2ba4ce268a6cb251e13ddaa	2026-05-17 12:05:16.64105+00	20260517080536_add_audit_fields_and_soft_delete	\N	\N	2026-05-17 12:05:16.615314+00	1
6bb8bfd5-0bc9-4780-8113-1b44ef34d3e2	9a79b1ba2fa5af9f9c2ff8304d8f5392fa1fd36e7f2c5cb775b77cbd965db209	2026-05-17 12:05:16.698952+00	20260517100555_add_lab_signature_and_notification_outbox	\N	\N	2026-05-17 12:05:16.669601+00	1
4fef2555-6d2d-49f7-bfad-7e45c855062e	2589cf2fba5a32e092dca8ee07fb3bf7c69dcb76dbbdc95e407ec9a4396a3c83	2026-05-17 12:05:16.736934+00	20260517103904_add_sla_alerts	\N	\N	2026-05-17 12:05:16.715828+00	1
5ef0a437-7237-400c-b28f-121e69124705	98e503b6a012f052222a2d9813b8b95c8a02ef9976692949d0deff2c3da19f25	2026-05-17 12:05:16.705619+00	20260517103541_add_user_role_enum	\N	\N	2026-05-17 12:05:16.700486+00	1
6cd94583-7483-4319-8f73-3efe9db79954	7aeb3ec01d544db96bffb7ac85187b6305d145d2e5c8e1f98340a2f86729c897	2026-05-17 12:05:16.751056+00	20260517113236_add_data_retention_fields	\N	\N	2026-05-17 12:05:16.738483+00	1
379727c6-b6d3-48ca-acbc-fd9397b4cc84	0f85d8d58a2aea00fdccace91622a79dd31b5ff4783667a5e8deb79af9d2f82e	2026-05-17 12:05:16.773263+00	20260517113825_add_cpt_code_model	\N	\N	2026-05-17 12:05:16.752791+00	1
\.


--
-- Data for Name: approval_requests; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.approval_requests (id, tenant_id, requester_id, approver_id, type, "riskLevel", record_id, status, reason, remarks, created_at, updated_at, details) FROM stdin;
\.


--
-- Data for Name: attendance_logs; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.attendance_logs (id, employee_id, tenant_id, branch_id, date, check_in, check_out, source, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.audit_logs (id, tenant_id, user_id, event_key, record_type, record_id, old_values, new_values, created_at, branch_id, active_role, ip_address, session_id, user_agent, hash, previous_hash, signature) FROM stdin;
\.


--
-- Data for Name: branch_stocks; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.branch_stocks (id, tenant_id, branch_id, inventory_item_id, quantity, reorder_level, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.branches (id, tenant_id, name, code, created_at, updated_at) FROM stdin;
00000000-0000-0000-0000-000000000010	00000000-0000-0000-0000-000000000001	Main Branch	MAIN	2026-05-17 12:05:22.429	2026-05-17 12:05:22.429
074dd2b6-f1d0-433c-8b52-333932f132ab	234f5c00-f6a3-4d55-996a-281e1306d7ca	Primary Branch	MAIN	2026-05-17 12:11:34.646	2026-05-17 12:11:34.646
\.


--
-- Data for Name: cashier_ledger_entries; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.cashier_ledger_entries (id, cashier_session_id, type, amount, reference_id, created_at) FROM stdin;
\.


--
-- Data for Name: cashier_sessions; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.cashier_sessions (id, tenant_id, branch_id, user_id, status, opening_balance, closing_balance, opened_at, closed_at) FROM stdin;
\.


--
-- Data for Name: claims; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.claims (id, tenant_id, hmo_partner_id, invoice_id, claim_number, loa_number, amount_claimed, amount_approved, status, remarks, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: clinical_notes; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.clinical_notes (id, tenant_id, encounter_id, note_type, content, created_by, updated_by, created_at, updated_at, assessment, author_id, locked_at, locked_by, objective, plan, subjective, deleted_at, version) FROM stdin;
\.


--
-- Data for Name: cpt_codes; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.cpt_codes (id, tenant_id, code, description, category, fees, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.departments (id, tenant_id, name, code, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: diagnoses; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.diagnoses (id, tenant_id, encounter_id, icd_10_code, description, is_primary, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: employee_branches; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.employee_branches (id, tenant_id, employee_id, branch_id, is_primary, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.employees (id, tenant_id, department_id, employee_number, first_name, last_name, job_title, status, joining_date, salary, created_at, updated_at, branch_id, department, hire_date, "position", user_id) FROM stdin;
\.


--
-- Data for Name: encounter_diagnoses; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.encounter_diagnoses (id, encounter_id, icd10_code_id, is_primary, notes, created_at, delete_reason, deleted_at, deleted_by_id) FROM stdin;
\.


--
-- Data for Name: encounters; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.encounters (id, tenant_id, branch_id, patient_id, status, type, started_at, ended_at, reason, notes, created_at, updated_at, attending_id, created_by, updated_by, chief_complaint, doctor_id, encountered_at, archive_reason, archived_at) FROM stdin;
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.files (id, tenant_id, record_type, record_id, file_name, file_size, mime_type, storage_path, uploaded_by_id, created_at) FROM stdin;
\.


--
-- Data for Name: hmo_partners; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.hmo_partners (id, tenant_id, name, code, contact_person, email, status, created_at) FROM stdin;
\.


--
-- Data for Name: icd_10_codes; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.icd_10_codes (id, code, description, created_at) FROM stdin;
\.


--
-- Data for Name: idempotency_records; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.idempotency_records (id, tenant_id, operation, key, request_fingerprint, status, payment_id, response_data, error, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: insurance_claims; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.insurance_claims (id, tenant_id, branch_id, invoice_id, patient_id, provider_code, claim_number, status, submitted_at, settled_at, claimed_amount, settled_amount, rejection_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.inventory_items (id, tenant_id, name, sku, category, unit, reorder_level, current_stock, price, created_at, updated_at, status) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.invoices (id, order_id, invoice_number, total_amount, paid_amount, status, created_at, updated_at, tenant_id, created_by_id, deleted_at, updated_by_id, version, archive_reason, archived_at) FROM stdin;
\.


--
-- Data for Name: lab_result_signatures; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.lab_result_signatures (id, lab_result_id, signed_by_id, signed_at, signature_hash) FROM stdin;
\.


--
-- Data for Name: lab_result_versions; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.lab_result_versions (id, lab_result_id, version, old_status, new_status, amended_by_id, reason, old_data, created_at) FROM stdin;
\.


--
-- Data for Name: lab_results; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.lab_results (id, order_id, status, approved_by_id, locked_at, created_at, updated_at, tenant_id, remarks, results, created_by_id, deleted_at, updated_by_id, version, archive_reason, archived_at) FROM stdin;
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.leave_requests (id, employee_id, tenant_id, type, start_date, end_date, status, reason, approved_by_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ledger_entries; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.ledger_entries (id, tenant_id, branch_id, entry_date, debit_account, credit_account, amount, reference_type, reference_id, description, created_at) FROM stdin;
\.


--
-- Data for Name: license_records; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.license_records (id, employee_id, tenant_id, license_type, license_number, issued_at, expires_at, status, created_at) FROM stdin;
\.


--
-- Data for Name: notification_outbox; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.notification_outbox (id, recipient_id, type, payload, scheduled_at, sent_at, status) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.notifications (id, tenant_id, user_id, patient_id, type, status, recipient, subject, content, template_key, category, priority, attempts, last_error, sent_at, read_at, created_at) FROM stdin;
\.


--
-- Data for Name: numbering_sequences; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.numbering_sequences (id, tenant_id, branch_id, entity_type, prefix, current_val, padding, updated_at) FROM stdin;
ff63c9f9-e499-4d76-a3e1-d7a1330989e4	234f5c00-f6a3-4d55-996a-281e1306d7ca	074dd2b6-f1d0-433c-8b52-333932f132ab	PATIENT	PAT-	0	6	2026-05-17 12:11:34.829
7ceff4dc-a274-437d-902f-5c6939cc89be	234f5c00-f6a3-4d55-996a-281e1306d7ca	074dd2b6-f1d0-433c-8b52-333932f132ab	INVOICE	INV-	0	6	2026-05-17 12:11:34.832
cba681c2-cbcc-4657-9b20-7819be60e5b8	234f5c00-f6a3-4d55-996a-281e1306d7ca	074dd2b6-f1d0-433c-8b52-333932f132ab	RECEIPT	REC-	0	6	2026-05-17 12:11:34.834
3d3d7cf1-8c79-4825-8cd0-ab0864b44fd5	234f5c00-f6a3-4d55-996a-281e1306d7ca	074dd2b6-f1d0-433c-8b52-333932f132ab	ORDER	ORD-	0	6	2026-05-17 12:11:34.835
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.order_items (id, tenant_id, order_id, item_type, item_id, name, quantity, unit_price, line_total, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.orders (id, tenant_id, branch_id, patient_id, order_number, status, created_at, updated_at, created_by_id, deleted_at, updated_by_id, version) FROM stdin;
\.


--
-- Data for Name: patient_merge_requests; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.patient_merge_requests (id, tenant_id, branch_id, requester_id, approver_id, source_patient_id, target_patient_id, status, reason, remarks, "riskLevel", field_snapshots, applied_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: patient_users; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.patient_users (id, tenant_id, patient_id, email, password_hash, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.patients (id, tenant_id, patient_number, first_name, last_name, dob, status, created_at, updated_at, created_by_id, deleted_at, updated_by_id, version, archive_reason, archived_at) FROM stdin;
\.


--
-- Data for Name: payment_reversals; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.payment_reversals (id, tenant_id, branch_id, payment_id, invoice_id, approval_request_id, amount, type, status, reason, requested_by, approved_by, applied_by, requested_at, approved_at, applied_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payment_voids; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.payment_voids (id, payment_id, approval_id, voided_by, voided_at, reason) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.payments (id, invoice_id, cashier_session_id, receipt_number, amount, payment_method, status, idempotency_key, created_at, tenant_id, created_by_id, deleted_at, updated_at, updated_by_id, version, archive_reason, archived_at) FROM stdin;
\.


--
-- Data for Name: payslips; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.payslips (id, tenant_id, employee_id, period_start, period_end, basic_salary, total_allowances, total_deductions, net_salary, status, created_at, branch_id) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.permissions (id, tenant_id, name, scope, risk_level) FROM stdin;
80ebc3ec-0570-4a35-8df1-b5b2e57302ce	00000000-0000-0000-0000-000000000001	patient.view	tenant/branch	LOW
0cd37212-5abf-45f4-95bd-647d32942cdc	00000000-0000-0000-0000-000000000001	patient.create	tenant/branch	LOW
e303247d-0638-4890-aac3-71ba68ab5210	00000000-0000-0000-0000-000000000001	patient.update	tenant/branch	LOW
2c1ad9c1-74d3-4866-8dd4-2ca5710bdcfd	00000000-0000-0000-0000-000000000001	patient.merge.request	tenant	HIGH
9f0776df-8c4a-4ac3-8883-d43fc5c51389	00000000-0000-0000-0000-000000000001	patient.merge.approve	tenant	PRIVILEGED
23b02a8a-5252-4010-bd2a-0729028dcdd9	00000000-0000-0000-0000-000000000001	order.create	tenant/branch	LOW
4ab45e91-3ea7-4f92-a218-b6fbbcb5aa99	00000000-0000-0000-0000-000000000001	order.cancel	tenant/branch	LOW
44003681-12a6-411b-85e9-a69dd4efee6a	00000000-0000-0000-0000-000000000001	order.view	tenant/branch	LOW
3e36c92a-f6d9-406d-a95c-9623bd0ad9e2	00000000-0000-0000-0000-000000000001	billing.payment.create	tenant/branch/cashier session	LOW
5fdc09af-181f-4065-a626-b3b80c4e627d	00000000-0000-0000-0000-000000000001	billing.invoice.view	tenant/branch	LOW
48f842e7-383b-435a-92d7-75217ef023dd	00000000-0000-0000-0000-000000000001	billing.refund.request	tenant/branch	MEDIUM
f1919cf4-5da5-4dbb-8eaa-0d35a57683e0	00000000-0000-0000-0000-000000000001	billing.refund.approve	tenant/branch	HIGH
f16c466e-2a1a-4495-9383-5840df7bebd8	00000000-0000-0000-0000-000000000001	billing.payment.void.request	tenant/branch	MEDIUM
46db34e6-50d1-4dc2-a450-1b098016cb74	00000000-0000-0000-0000-000000000001	billing.claim.view	tenant/branch	LOW
59642819-6898-44ee-b82e-e85621640cc5	00000000-0000-0000-0000-000000000001	billing.claim.create	tenant/branch	LOW
1c5c8f5e-5561-4fff-96e7-af7ed2c5e17e	00000000-0000-0000-0000-000000000001	billing.claim.process	tenant/branch	HIGH
ac8b9ba3-5969-4c9c-8b4b-4bb1983a9130	00000000-0000-0000-0000-000000000001	lab.result.encode	tenant/branch/department	LOW
f924ea57-9ea3-45e9-9f83-20d1e1697e91	00000000-0000-0000-0000-000000000001	lab.result.validate	tenant/branch/department	MEDIUM
2a69f02e-08fa-4118-a94e-c0848b3d2e50	00000000-0000-0000-0000-000000000001	lab.result.approve	tenant/branch/department	HIGH
e412e0a6-c163-453e-acd7-c61afe32174f	00000000-0000-0000-0000-000000000001	lab.result.release	tenant/branch/department	HIGH
53bf41f0-1dc1-4841-89f3-28ee0fbf8507	00000000-0000-0000-0000-000000000001	lab.result.view	tenant/branch/department	LOW
b9714f1c-bff5-4911-83c6-53e6a1bbfa3c	00000000-0000-0000-0000-000000000001	lab.result.amend.request	tenant/branch	MEDIUM
f4bbd0d6-702d-487f-9dbe-59dd3951b24b	00000000-0000-0000-0000-000000000001	catalog.service.view	tenant	LOW
b662d4d7-e894-4c1c-985e-2902ca82b52c	00000000-0000-0000-0000-000000000001	catalog.service.create	tenant	MEDIUM
7f919bbc-b0c3-4e0e-ab97-f2f72926abf2	00000000-0000-0000-0000-000000000001	catalog.service.update	tenant	MEDIUM
f080e195-fbe1-4971-a1b4-70f0476bb78d	00000000-0000-0000-0000-000000000001	catalog.service.deactivate	tenant	HIGH
94aa3153-946d-4ea1-8d62-29278718988c	00000000-0000-0000-0000-000000000001	inventory.item.view	tenant/branch	LOW
a4bccfbf-2031-44ed-9d6c-f58bc75c6acb	00000000-0000-0000-0000-000000000001	inventory.item.create	tenant/branch	LOW
10cfafc3-83dd-4e0f-8b54-edade543cebc	00000000-0000-0000-0000-000000000001	inventory.item.update	tenant/branch	LOW
de4eca85-256d-4bc6-b761-6de83f5ef1bb	00000000-0000-0000-0000-000000000001	inventory.item.deactivate	tenant/branch	MEDIUM
dabda4aa-b970-4d23-aac1-7513846418a1	00000000-0000-0000-0000-000000000001	inventory.stock.receive	tenant/branch	LOW
d6181975-ce71-43c8-a71c-55459dfceed4	00000000-0000-0000-0000-000000000001	inventory.stock.dispense	tenant/branch	LOW
70e9cbf5-5342-416d-b562-8ac3bdc06b38	00000000-0000-0000-0000-000000000001	inventory.adjust.request	tenant/branch	MEDIUM
8f6684d9-4577-42dd-bb8c-df7f63ddc388	00000000-0000-0000-0000-000000000001	inventory.adjust.approve	tenant/branch	HIGH
e0fc614c-6c07-4de4-8345-dd1abbb23509	00000000-0000-0000-0000-000000000001	report.export	tenant/branch/role scope	HIGH
ca18b847-8415-48a1-907b-bfc28f4f185e	00000000-0000-0000-0000-000000000001	audit.view	tenant/branch/role scope	HIGH
bf4bbdd0-7857-4dbf-a674-740e38da8311	00000000-0000-0000-0000-000000000001	admin.role.change	tenant/system	PRIVILEGED
a5d506c2-91aa-46ef-8514-6c1cd0e8dffb	00000000-0000-0000-0000-000000000001	approval.request.create	tenant/branch	MEDIUM
c8c22fc0-7b0c-4d66-9a32-ebcebdef52e3	00000000-0000-0000-0000-000000000001	approval.request.view	tenant/branch	MEDIUM
a4344564-68f4-4dda-aa88-d20cf141ed89	00000000-0000-0000-0000-000000000001	approval.request.process	tenant/branch	HIGH
f4f88065-3579-4240-891b-fcbe64bab4ef	00000000-0000-0000-0000-000000000001	billing.reversal.apply	tenant/branch	HIGH
2248b7f6-98a1-4365-a2e8-0f6f37af9cea	00000000-0000-0000-0000-000000000001	queue.view	tenant/branch	LOW
3132e171-2799-47c7-bc1c-a46864149d39	00000000-0000-0000-0000-000000000001	queue.manage	tenant/branch	LOW
6830d983-f70c-4b74-86fc-6997b42ec6b2	00000000-0000-0000-0000-000000000001	notification.view	tenant/user	LOW
e91a287d-137a-4d0b-ae94-dbbf173030a1	00000000-0000-0000-0000-000000000001	notification.manage	tenant/branch	MEDIUM
d1c9d3af-85d1-448f-a6dd-01dda865065e	00000000-0000-0000-0000-000000000001	encounter.create	tenant/branch	LOW
71a7c79e-bc05-429a-a61a-d7d6df310d9e	00000000-0000-0000-0000-000000000001	encounter.view	tenant/branch	LOW
9b79f9e8-450d-4c25-a807-24395d8b5c3f	00000000-0000-0000-0000-000000000001	encounter.update	tenant/branch	LOW
00000000-0000-0000-0000-000000000999	00000000-0000-0000-0000-000000000001	admin.health.view	tenant	HIGH
00000000-0000-0000-0000-000000000998	00000000-0000-0000-0000-000000000001	admin.metrics.view	tenant	HIGH
8b463b00-e1b5-4dea-a6cc-2d599e2c92e5	234f5c00-f6a3-4d55-996a-281e1306d7ca	patient.view	tenant/branch	LOW
67d01183-773a-46ca-b802-bc3d269d3b41	234f5c00-f6a3-4d55-996a-281e1306d7ca	patient.create	tenant/branch	LOW
dea8b526-9044-4447-b821-ab487e40bc28	234f5c00-f6a3-4d55-996a-281e1306d7ca	patient.update	tenant/branch	LOW
faef3942-9599-43d2-89a4-be2ead6cb9de	234f5c00-f6a3-4d55-996a-281e1306d7ca	patient.merge.request	tenant	HIGH
8526a658-0968-4321-835a-6d3cfddbaef2	234f5c00-f6a3-4d55-996a-281e1306d7ca	patient.merge.approve	tenant	PRIVILEGED
21880fed-2eef-4620-b9f5-2f9005dec31f	234f5c00-f6a3-4d55-996a-281e1306d7ca	order.create	tenant/branch	LOW
6efcffb3-8b5d-4d6f-a2c6-c1bb75807d35	234f5c00-f6a3-4d55-996a-281e1306d7ca	order.cancel	tenant/branch	LOW
5012dc3c-acf6-4d72-86b4-e5077de99edc	234f5c00-f6a3-4d55-996a-281e1306d7ca	order.view	tenant/branch	LOW
af576eb3-565e-4f03-940a-cea14ea008ab	234f5c00-f6a3-4d55-996a-281e1306d7ca	billing.payment.create	tenant/branch/cashier session	LOW
d5f27d3d-23e8-4042-8a85-111f0cd310e5	234f5c00-f6a3-4d55-996a-281e1306d7ca	billing.invoice.view	tenant/branch	LOW
3d8f06d1-6593-4f52-b37f-663b7f981d87	234f5c00-f6a3-4d55-996a-281e1306d7ca	billing.refund.request	tenant/branch	MEDIUM
3fce2341-ce08-4944-9f53-93ed81ad5226	234f5c00-f6a3-4d55-996a-281e1306d7ca	billing.refund.approve	tenant/branch	HIGH
10970539-6314-4fe0-9cd2-48ddb28511a2	234f5c00-f6a3-4d55-996a-281e1306d7ca	billing.payment.void.request	tenant/branch	MEDIUM
6de9443c-cee8-42f0-bb73-4ce1f47ddf80	234f5c00-f6a3-4d55-996a-281e1306d7ca	billing.claim.view	tenant/branch	LOW
e83e7e48-7bab-450e-b925-c0b18db0b57d	234f5c00-f6a3-4d55-996a-281e1306d7ca	billing.claim.create	tenant/branch	LOW
8e35e6cc-8ce8-4d43-8438-2790cfac58a8	234f5c00-f6a3-4d55-996a-281e1306d7ca	billing.claim.process	tenant/branch	HIGH
0761660b-959b-4d25-8244-8293843ea3ad	234f5c00-f6a3-4d55-996a-281e1306d7ca	lab.result.encode	tenant/branch/department	LOW
ed2487dc-34a0-46e6-8ccd-3eeb36d176de	234f5c00-f6a3-4d55-996a-281e1306d7ca	lab.result.validate	tenant/branch/department	MEDIUM
1e291170-66a9-47ef-91f0-ae8a992d8315	234f5c00-f6a3-4d55-996a-281e1306d7ca	lab.result.approve	tenant/branch/department	HIGH
dee2112f-b34b-4044-8c81-3b1b4949aa6e	234f5c00-f6a3-4d55-996a-281e1306d7ca	lab.result.release	tenant/branch/department	HIGH
a8412538-b3e9-4541-88db-a3e5443873c6	234f5c00-f6a3-4d55-996a-281e1306d7ca	lab.result.view	tenant/branch/department	LOW
495d6d42-4317-43fa-824e-3159b21466f8	234f5c00-f6a3-4d55-996a-281e1306d7ca	lab.result.amend.request	tenant/branch	MEDIUM
2ef8c9bb-3cfe-4566-b7d8-18fa63be5acd	234f5c00-f6a3-4d55-996a-281e1306d7ca	catalog.service.view	tenant	LOW
7b56e036-a37c-4349-8804-09c51506b983	234f5c00-f6a3-4d55-996a-281e1306d7ca	catalog.service.create	tenant	MEDIUM
a464f288-80d3-4838-b5f9-24494ec95889	234f5c00-f6a3-4d55-996a-281e1306d7ca	catalog.service.update	tenant	MEDIUM
7ac94f52-01d2-440b-b6a8-402987ca56bc	234f5c00-f6a3-4d55-996a-281e1306d7ca	catalog.service.deactivate	tenant	HIGH
f7981d19-1d80-4c8c-8ef2-c961b5ee0930	234f5c00-f6a3-4d55-996a-281e1306d7ca	inventory.item.view	tenant/branch	LOW
85e84b74-95d6-45e0-96af-c97b3dc47c4e	234f5c00-f6a3-4d55-996a-281e1306d7ca	inventory.item.create	tenant/branch	LOW
d6a7c8fc-8346-4a6f-8e91-df80ebc4eb23	234f5c00-f6a3-4d55-996a-281e1306d7ca	inventory.item.update	tenant/branch	LOW
707acfbf-4495-4eda-aa85-3da861a77b12	234f5c00-f6a3-4d55-996a-281e1306d7ca	inventory.item.deactivate	tenant/branch	MEDIUM
6402ca82-2e3e-4ae5-99b1-d03cd1540e85	234f5c00-f6a3-4d55-996a-281e1306d7ca	inventory.stock.receive	tenant/branch	LOW
94604994-963f-41cc-a075-42940e3fcaf1	234f5c00-f6a3-4d55-996a-281e1306d7ca	inventory.stock.dispense	tenant/branch	LOW
8e1e83ba-1c0a-4a8b-b7d2-226d41c03595	234f5c00-f6a3-4d55-996a-281e1306d7ca	inventory.adjust.request	tenant/branch	MEDIUM
cc85e2f6-4ff4-4d06-9cc8-fbb484d980f6	234f5c00-f6a3-4d55-996a-281e1306d7ca	inventory.adjust.approve	tenant/branch	HIGH
51594d2a-e7cb-4235-bbed-b62b7b83d6a5	234f5c00-f6a3-4d55-996a-281e1306d7ca	report.export	tenant/branch/role scope	HIGH
73bf89a7-3ed6-4d8c-9f23-b6c16a18751e	234f5c00-f6a3-4d55-996a-281e1306d7ca	audit.view	tenant/branch/role scope	HIGH
f7ea19c3-9c83-4c10-8c9c-382251a62196	234f5c00-f6a3-4d55-996a-281e1306d7ca	admin.role.change	tenant/system	PRIVILEGED
47282ae2-dfd3-4dd7-81ba-f98928efe5fc	234f5c00-f6a3-4d55-996a-281e1306d7ca	approval.request.create	tenant/branch	MEDIUM
f00b62d6-5c49-44a2-8903-596c5e4884c4	234f5c00-f6a3-4d55-996a-281e1306d7ca	approval.request.view	tenant/branch	MEDIUM
b40f3a30-80de-4389-a4b9-5fac84db3e77	234f5c00-f6a3-4d55-996a-281e1306d7ca	approval.request.process	tenant/branch	HIGH
eeb7d4ef-8800-4a82-91de-ca4e247dde3c	234f5c00-f6a3-4d55-996a-281e1306d7ca	billing.reversal.apply	tenant/branch	HIGH
11e6c225-cfc1-422c-a2c5-e416da43861e	234f5c00-f6a3-4d55-996a-281e1306d7ca	queue.view	tenant/branch	LOW
cfbc7e9f-907f-4952-9d0f-fe6bfc758d05	234f5c00-f6a3-4d55-996a-281e1306d7ca	queue.manage	tenant/branch	LOW
0f8490f9-f2ab-4396-b945-e29869d16d6f	234f5c00-f6a3-4d55-996a-281e1306d7ca	notification.view	tenant/user	LOW
457463f6-1173-4478-9b71-1f0c0b952a3c	234f5c00-f6a3-4d55-996a-281e1306d7ca	notification.manage	tenant/branch	MEDIUM
b107f47e-cddc-417c-9310-53ef972b3b4c	234f5c00-f6a3-4d55-996a-281e1306d7ca	encounter.create	tenant/branch	LOW
33a51550-2bd1-402f-85e1-1e494a570721	234f5c00-f6a3-4d55-996a-281e1306d7ca	encounter.view	tenant/branch	LOW
3a630836-aedf-4ac7-8dfd-708d4bcf5dad	234f5c00-f6a3-4d55-996a-281e1306d7ca	encounter.update	tenant/branch	LOW
35da1ffa-290a-4e20-bde1-4e1dff935deb	234f5c00-f6a3-4d55-996a-281e1306d7ca	admin.health.view	tenant	HIGH
b0bc4225-fa72-433d-a278-c6d2cea011dc	234f5c00-f6a3-4d55-996a-281e1306d7ca	admin.metrics.view	tenant	HIGH
\.


--
-- Data for Name: prescriptions; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.prescriptions (id, tenant_id, branch_id, encounter_id, prescribed_by_id, patient_id, medication_name, dosage, frequency, duration, notes, status, created_at, updated_at, created_by_id, deleted_at, updated_by_id, version) FROM stdin;
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.purchase_orders (id, tenant_id, branch_id, supplier_id, purchase_request_id, order_number, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: purchase_requests; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.purchase_requests (id, tenant_id, branch_id, requested_by_id, items, status, reason, approved_by_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: queue_entries; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.queue_entries (id, tenant_id, branch_id, patient_id, patient_name, queue_number, category, service_type, status, counter_number, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: receiving_records; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.receiving_records (id, purchase_order_id, tenant_id, branch_id, received_by_id, received_at, notes, created_at) FROM stdin;
\.


--
-- Data for Name: referral_records; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.referral_records (id, tenant_id, patient_id, order_id, referrer_id, referral_date, rebate_amount, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.referrals (id, tenant_id, branch_id, encounter_id, referred_by_id, patient_id, referred_to_name, specialty, reason, urgency, status, created_at, updated_at, created_by_id, deleted_at, updated_by_id, version) FROM stdin;
\.


--
-- Data for Name: referrers; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.referrers (id, tenant_id, name, type, contact_info, rebate_rate, status, created_at) FROM stdin;
\.


--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.refunds (id, invoice_id, payment_id, amount, approved_by, refunded_at, method, reason) FROM stdin;
\.


--
-- Data for Name: report_exports; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.report_exports (id, tenant_id, branch_id, report_type, filters, reason, row_count, status, requested_by, created_at, completed_at, allowed_fields, approved_at, checksum, decided_at, decided_by_id, decision_reason, download_count, expires_at, failure_reason, field_policy_snapshot, filters_snapshot, format, generated_at, last_downloaded_at, masked_fields, requested_fields, risk_level, storage_key) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
00000000-0000-0000-0000-000000000002	80ebc3ec-0570-4a35-8df1-b5b2e57302ce
00000000-0000-0000-0000-000000000002	0cd37212-5abf-45f4-95bd-647d32942cdc
00000000-0000-0000-0000-000000000002	e303247d-0638-4890-aac3-71ba68ab5210
00000000-0000-0000-0000-000000000002	2c1ad9c1-74d3-4866-8dd4-2ca5710bdcfd
00000000-0000-0000-0000-000000000002	9f0776df-8c4a-4ac3-8883-d43fc5c51389
00000000-0000-0000-0000-000000000002	23b02a8a-5252-4010-bd2a-0729028dcdd9
00000000-0000-0000-0000-000000000002	4ab45e91-3ea7-4f92-a218-b6fbbcb5aa99
00000000-0000-0000-0000-000000000002	44003681-12a6-411b-85e9-a69dd4efee6a
00000000-0000-0000-0000-000000000002	3e36c92a-f6d9-406d-a95c-9623bd0ad9e2
00000000-0000-0000-0000-000000000002	5fdc09af-181f-4065-a626-b3b80c4e627d
00000000-0000-0000-0000-000000000002	48f842e7-383b-435a-92d7-75217ef023dd
00000000-0000-0000-0000-000000000002	f1919cf4-5da5-4dbb-8eaa-0d35a57683e0
00000000-0000-0000-0000-000000000002	f16c466e-2a1a-4495-9383-5840df7bebd8
00000000-0000-0000-0000-000000000002	46db34e6-50d1-4dc2-a450-1b098016cb74
00000000-0000-0000-0000-000000000002	59642819-6898-44ee-b82e-e85621640cc5
00000000-0000-0000-0000-000000000002	1c5c8f5e-5561-4fff-96e7-af7ed2c5e17e
00000000-0000-0000-0000-000000000002	ac8b9ba3-5969-4c9c-8b4b-4bb1983a9130
00000000-0000-0000-0000-000000000002	f924ea57-9ea3-45e9-9f83-20d1e1697e91
00000000-0000-0000-0000-000000000002	2a69f02e-08fa-4118-a94e-c0848b3d2e50
00000000-0000-0000-0000-000000000002	e412e0a6-c163-453e-acd7-c61afe32174f
00000000-0000-0000-0000-000000000002	53bf41f0-1dc1-4841-89f3-28ee0fbf8507
00000000-0000-0000-0000-000000000002	b9714f1c-bff5-4911-83c6-53e6a1bbfa3c
00000000-0000-0000-0000-000000000002	f4bbd0d6-702d-487f-9dbe-59dd3951b24b
00000000-0000-0000-0000-000000000002	b662d4d7-e894-4c1c-985e-2902ca82b52c
00000000-0000-0000-0000-000000000002	7f919bbc-b0c3-4e0e-ab97-f2f72926abf2
00000000-0000-0000-0000-000000000002	f080e195-fbe1-4971-a1b4-70f0476bb78d
00000000-0000-0000-0000-000000000002	94aa3153-946d-4ea1-8d62-29278718988c
00000000-0000-0000-0000-000000000002	a4bccfbf-2031-44ed-9d6c-f58bc75c6acb
00000000-0000-0000-0000-000000000002	10cfafc3-83dd-4e0f-8b54-edade543cebc
00000000-0000-0000-0000-000000000002	de4eca85-256d-4bc6-b761-6de83f5ef1bb
00000000-0000-0000-0000-000000000002	dabda4aa-b970-4d23-aac1-7513846418a1
00000000-0000-0000-0000-000000000002	d6181975-ce71-43c8-a71c-55459dfceed4
00000000-0000-0000-0000-000000000002	70e9cbf5-5342-416d-b562-8ac3bdc06b38
00000000-0000-0000-0000-000000000002	8f6684d9-4577-42dd-bb8c-df7f63ddc388
00000000-0000-0000-0000-000000000002	e0fc614c-6c07-4de4-8345-dd1abbb23509
00000000-0000-0000-0000-000000000002	ca18b847-8415-48a1-907b-bfc28f4f185e
00000000-0000-0000-0000-000000000002	bf4bbdd0-7857-4dbf-a674-740e38da8311
00000000-0000-0000-0000-000000000002	a5d506c2-91aa-46ef-8514-6c1cd0e8dffb
00000000-0000-0000-0000-000000000002	c8c22fc0-7b0c-4d66-9a32-ebcebdef52e3
00000000-0000-0000-0000-000000000002	a4344564-68f4-4dda-aa88-d20cf141ed89
00000000-0000-0000-0000-000000000002	f4f88065-3579-4240-891b-fcbe64bab4ef
00000000-0000-0000-0000-000000000002	2248b7f6-98a1-4365-a2e8-0f6f37af9cea
00000000-0000-0000-0000-000000000002	3132e171-2799-47c7-bc1c-a46864149d39
00000000-0000-0000-0000-000000000002	6830d983-f70c-4b74-86fc-6997b42ec6b2
00000000-0000-0000-0000-000000000002	e91a287d-137a-4d0b-ae94-dbbf173030a1
00000000-0000-0000-0000-000000000002	d1c9d3af-85d1-448f-a6dd-01dda865065e
00000000-0000-0000-0000-000000000002	71a7c79e-bc05-429a-a61a-d7d6df310d9e
00000000-0000-0000-0000-000000000002	9b79f9e8-450d-4c25-a807-24395d8b5c3f
00000000-0000-0000-0000-000000000003	80ebc3ec-0570-4a35-8df1-b5b2e57302ce
00000000-0000-0000-0000-000000000003	0cd37212-5abf-45f4-95bd-647d32942cdc
00000000-0000-0000-0000-000000000003	e303247d-0638-4890-aac3-71ba68ab5210
00000000-0000-0000-0000-000000000003	44003681-12a6-411b-85e9-a69dd4efee6a
00000000-0000-0000-0000-000000000003	23b02a8a-5252-4010-bd2a-0729028dcdd9
00000000-0000-0000-0000-000000000003	4ab45e91-3ea7-4f92-a218-b6fbbcb5aa99
00000000-0000-0000-0000-000000000003	5fdc09af-181f-4065-a626-b3b80c4e627d
00000000-0000-0000-0000-000000000003	46db34e6-50d1-4dc2-a450-1b098016cb74
00000000-0000-0000-0000-000000000003	59642819-6898-44ee-b82e-e85621640cc5
00000000-0000-0000-0000-000000000003	94aa3153-946d-4ea1-8d62-29278718988c
00000000-0000-0000-0000-000000000003	a4bccfbf-2031-44ed-9d6c-f58bc75c6acb
00000000-0000-0000-0000-000000000003	dabda4aa-b970-4d23-aac1-7513846418a1
00000000-0000-0000-0000-000000000003	d6181975-ce71-43c8-a71c-55459dfceed4
00000000-0000-0000-0000-000000000003	2248b7f6-98a1-4365-a2e8-0f6f37af9cea
00000000-0000-0000-0000-000000000003	3132e171-2799-47c7-bc1c-a46864149d39
00000000-0000-0000-0000-000000000003	c8c22fc0-7b0c-4d66-9a32-ebcebdef52e3
00000000-0000-0000-0000-000000000003	a4344564-68f4-4dda-aa88-d20cf141ed89
00000000-0000-0000-0000-000000000003	e0fc614c-6c07-4de4-8345-dd1abbb23509
00000000-0000-0000-0000-000000000003	ca18b847-8415-48a1-907b-bfc28f4f185e
00000000-0000-0000-0000-000000000003	d1c9d3af-85d1-448f-a6dd-01dda865065e
00000000-0000-0000-0000-000000000003	71a7c79e-bc05-429a-a61a-d7d6df310d9e
00000000-0000-0000-0000-000000000003	9b79f9e8-450d-4c25-a807-24395d8b5c3f
00000000-0000-0000-0000-000000000004	80ebc3ec-0570-4a35-8df1-b5b2e57302ce
00000000-0000-0000-0000-000000000004	0cd37212-5abf-45f4-95bd-647d32942cdc
00000000-0000-0000-0000-000000000004	e303247d-0638-4890-aac3-71ba68ab5210
00000000-0000-0000-0000-000000000004	23b02a8a-5252-4010-bd2a-0729028dcdd9
00000000-0000-0000-0000-000000000004	44003681-12a6-411b-85e9-a69dd4efee6a
00000000-0000-0000-0000-000000000004	2248b7f6-98a1-4365-a2e8-0f6f37af9cea
00000000-0000-0000-0000-000000000004	3132e171-2799-47c7-bc1c-a46864149d39
00000000-0000-0000-0000-000000000004	d1c9d3af-85d1-448f-a6dd-01dda865065e
00000000-0000-0000-0000-000000000004	71a7c79e-bc05-429a-a61a-d7d6df310d9e
00000000-0000-0000-0000-000000000005	80ebc3ec-0570-4a35-8df1-b5b2e57302ce
00000000-0000-0000-0000-000000000005	44003681-12a6-411b-85e9-a69dd4efee6a
00000000-0000-0000-0000-000000000005	5fdc09af-181f-4065-a626-b3b80c4e627d
00000000-0000-0000-0000-000000000005	3e36c92a-f6d9-406d-a95c-9623bd0ad9e2
00000000-0000-0000-0000-000000000005	48f842e7-383b-435a-92d7-75217ef023dd
00000000-0000-0000-0000-000000000005	46db34e6-50d1-4dc2-a450-1b098016cb74
00000000-0000-0000-0000-000000000006	80ebc3ec-0570-4a35-8df1-b5b2e57302ce
00000000-0000-0000-0000-000000000006	53bf41f0-1dc1-4841-89f3-28ee0fbf8507
00000000-0000-0000-0000-000000000006	ac8b9ba3-5969-4c9c-8b4b-4bb1983a9130
00000000-0000-0000-0000-000000000006	94aa3153-946d-4ea1-8d62-29278718988c
00000000-0000-0000-0000-000000000007	80ebc3ec-0570-4a35-8df1-b5b2e57302ce
00000000-0000-0000-0000-000000000007	53bf41f0-1dc1-4841-89f3-28ee0fbf8507
00000000-0000-0000-0000-000000000007	2a69f02e-08fa-4118-a94e-c0848b3d2e50
00000000-0000-0000-0000-000000000007	e412e0a6-c163-453e-acd7-c61afe32174f
00000000-0000-0000-0000-000000000007	94aa3153-946d-4ea1-8d62-29278718988c
00000000-0000-0000-0000-000000000007	d1c9d3af-85d1-448f-a6dd-01dda865065e
00000000-0000-0000-0000-000000000007	71a7c79e-bc05-429a-a61a-d7d6df310d9e
00000000-0000-0000-0000-000000000007	9b79f9e8-450d-4c25-a807-24395d8b5c3f
00000000-0000-0000-0000-000000000002	00000000-0000-0000-0000-000000000999
00000000-0000-0000-0000-000000000002	00000000-0000-0000-0000-000000000998
3b0a1662-41ab-46e3-8275-601721b53124	8b463b00-e1b5-4dea-a6cc-2d599e2c92e5
3b0a1662-41ab-46e3-8275-601721b53124	67d01183-773a-46ca-b802-bc3d269d3b41
3b0a1662-41ab-46e3-8275-601721b53124	dea8b526-9044-4447-b821-ab487e40bc28
3b0a1662-41ab-46e3-8275-601721b53124	faef3942-9599-43d2-89a4-be2ead6cb9de
3b0a1662-41ab-46e3-8275-601721b53124	8526a658-0968-4321-835a-6d3cfddbaef2
3b0a1662-41ab-46e3-8275-601721b53124	21880fed-2eef-4620-b9f5-2f9005dec31f
3b0a1662-41ab-46e3-8275-601721b53124	6efcffb3-8b5d-4d6f-a2c6-c1bb75807d35
3b0a1662-41ab-46e3-8275-601721b53124	5012dc3c-acf6-4d72-86b4-e5077de99edc
3b0a1662-41ab-46e3-8275-601721b53124	af576eb3-565e-4f03-940a-cea14ea008ab
3b0a1662-41ab-46e3-8275-601721b53124	d5f27d3d-23e8-4042-8a85-111f0cd310e5
3b0a1662-41ab-46e3-8275-601721b53124	3d8f06d1-6593-4f52-b37f-663b7f981d87
3b0a1662-41ab-46e3-8275-601721b53124	3fce2341-ce08-4944-9f53-93ed81ad5226
3b0a1662-41ab-46e3-8275-601721b53124	10970539-6314-4fe0-9cd2-48ddb28511a2
3b0a1662-41ab-46e3-8275-601721b53124	6de9443c-cee8-42f0-bb73-4ce1f47ddf80
3b0a1662-41ab-46e3-8275-601721b53124	e83e7e48-7bab-450e-b925-c0b18db0b57d
3b0a1662-41ab-46e3-8275-601721b53124	8e35e6cc-8ce8-4d43-8438-2790cfac58a8
3b0a1662-41ab-46e3-8275-601721b53124	0761660b-959b-4d25-8244-8293843ea3ad
3b0a1662-41ab-46e3-8275-601721b53124	ed2487dc-34a0-46e6-8ccd-3eeb36d176de
3b0a1662-41ab-46e3-8275-601721b53124	1e291170-66a9-47ef-91f0-ae8a992d8315
3b0a1662-41ab-46e3-8275-601721b53124	dee2112f-b34b-4044-8c81-3b1b4949aa6e
3b0a1662-41ab-46e3-8275-601721b53124	a8412538-b3e9-4541-88db-a3e5443873c6
3b0a1662-41ab-46e3-8275-601721b53124	495d6d42-4317-43fa-824e-3159b21466f8
3b0a1662-41ab-46e3-8275-601721b53124	2ef8c9bb-3cfe-4566-b7d8-18fa63be5acd
3b0a1662-41ab-46e3-8275-601721b53124	7b56e036-a37c-4349-8804-09c51506b983
3b0a1662-41ab-46e3-8275-601721b53124	a464f288-80d3-4838-b5f9-24494ec95889
3b0a1662-41ab-46e3-8275-601721b53124	7ac94f52-01d2-440b-b6a8-402987ca56bc
3b0a1662-41ab-46e3-8275-601721b53124	f7981d19-1d80-4c8c-8ef2-c961b5ee0930
3b0a1662-41ab-46e3-8275-601721b53124	85e84b74-95d6-45e0-96af-c97b3dc47c4e
3b0a1662-41ab-46e3-8275-601721b53124	d6a7c8fc-8346-4a6f-8e91-df80ebc4eb23
3b0a1662-41ab-46e3-8275-601721b53124	707acfbf-4495-4eda-aa85-3da861a77b12
3b0a1662-41ab-46e3-8275-601721b53124	6402ca82-2e3e-4ae5-99b1-d03cd1540e85
3b0a1662-41ab-46e3-8275-601721b53124	94604994-963f-41cc-a075-42940e3fcaf1
3b0a1662-41ab-46e3-8275-601721b53124	8e1e83ba-1c0a-4a8b-b7d2-226d41c03595
3b0a1662-41ab-46e3-8275-601721b53124	cc85e2f6-4ff4-4d06-9cc8-fbb484d980f6
3b0a1662-41ab-46e3-8275-601721b53124	51594d2a-e7cb-4235-bbed-b62b7b83d6a5
3b0a1662-41ab-46e3-8275-601721b53124	73bf89a7-3ed6-4d8c-9f23-b6c16a18751e
3b0a1662-41ab-46e3-8275-601721b53124	f7ea19c3-9c83-4c10-8c9c-382251a62196
3b0a1662-41ab-46e3-8275-601721b53124	47282ae2-dfd3-4dd7-81ba-f98928efe5fc
3b0a1662-41ab-46e3-8275-601721b53124	f00b62d6-5c49-44a2-8903-596c5e4884c4
3b0a1662-41ab-46e3-8275-601721b53124	b40f3a30-80de-4389-a4b9-5fac84db3e77
3b0a1662-41ab-46e3-8275-601721b53124	eeb7d4ef-8800-4a82-91de-ca4e247dde3c
3b0a1662-41ab-46e3-8275-601721b53124	11e6c225-cfc1-422c-a2c5-e416da43861e
3b0a1662-41ab-46e3-8275-601721b53124	cfbc7e9f-907f-4952-9d0f-fe6bfc758d05
3b0a1662-41ab-46e3-8275-601721b53124	0f8490f9-f2ab-4396-b945-e29869d16d6f
3b0a1662-41ab-46e3-8275-601721b53124	457463f6-1173-4478-9b71-1f0c0b952a3c
3b0a1662-41ab-46e3-8275-601721b53124	b107f47e-cddc-417c-9310-53ef972b3b4c
3b0a1662-41ab-46e3-8275-601721b53124	33a51550-2bd1-402f-85e1-1e494a570721
3b0a1662-41ab-46e3-8275-601721b53124	3a630836-aedf-4ac7-8dfd-708d4bcf5dad
3b0a1662-41ab-46e3-8275-601721b53124	35da1ffa-290a-4e20-bde1-4e1dff935deb
3b0a1662-41ab-46e3-8275-601721b53124	b0bc4225-fa72-433d-a278-c6d2cea011dc
be36b359-9407-4f4d-9246-82181b6c2eec	8b463b00-e1b5-4dea-a6cc-2d599e2c92e5
be36b359-9407-4f4d-9246-82181b6c2eec	67d01183-773a-46ca-b802-bc3d269d3b41
be36b359-9407-4f4d-9246-82181b6c2eec	dea8b526-9044-4447-b821-ab487e40bc28
be36b359-9407-4f4d-9246-82181b6c2eec	5012dc3c-acf6-4d72-86b4-e5077de99edc
be36b359-9407-4f4d-9246-82181b6c2eec	21880fed-2eef-4620-b9f5-2f9005dec31f
be36b359-9407-4f4d-9246-82181b6c2eec	6efcffb3-8b5d-4d6f-a2c6-c1bb75807d35
be36b359-9407-4f4d-9246-82181b6c2eec	d5f27d3d-23e8-4042-8a85-111f0cd310e5
be36b359-9407-4f4d-9246-82181b6c2eec	6de9443c-cee8-42f0-bb73-4ce1f47ddf80
be36b359-9407-4f4d-9246-82181b6c2eec	e83e7e48-7bab-450e-b925-c0b18db0b57d
be36b359-9407-4f4d-9246-82181b6c2eec	f7981d19-1d80-4c8c-8ef2-c961b5ee0930
be36b359-9407-4f4d-9246-82181b6c2eec	85e84b74-95d6-45e0-96af-c97b3dc47c4e
be36b359-9407-4f4d-9246-82181b6c2eec	6402ca82-2e3e-4ae5-99b1-d03cd1540e85
be36b359-9407-4f4d-9246-82181b6c2eec	94604994-963f-41cc-a075-42940e3fcaf1
be36b359-9407-4f4d-9246-82181b6c2eec	11e6c225-cfc1-422c-a2c5-e416da43861e
be36b359-9407-4f4d-9246-82181b6c2eec	cfbc7e9f-907f-4952-9d0f-fe6bfc758d05
be36b359-9407-4f4d-9246-82181b6c2eec	f00b62d6-5c49-44a2-8903-596c5e4884c4
be36b359-9407-4f4d-9246-82181b6c2eec	b40f3a30-80de-4389-a4b9-5fac84db3e77
be36b359-9407-4f4d-9246-82181b6c2eec	51594d2a-e7cb-4235-bbed-b62b7b83d6a5
be36b359-9407-4f4d-9246-82181b6c2eec	73bf89a7-3ed6-4d8c-9f23-b6c16a18751e
be36b359-9407-4f4d-9246-82181b6c2eec	b107f47e-cddc-417c-9310-53ef972b3b4c
be36b359-9407-4f4d-9246-82181b6c2eec	33a51550-2bd1-402f-85e1-1e494a570721
be36b359-9407-4f4d-9246-82181b6c2eec	3a630836-aedf-4ac7-8dfd-708d4bcf5dad
422bb983-3099-4517-be7e-a5fe84181dd0	8b463b00-e1b5-4dea-a6cc-2d599e2c92e5
422bb983-3099-4517-be7e-a5fe84181dd0	a8412538-b3e9-4541-88db-a3e5443873c6
422bb983-3099-4517-be7e-a5fe84181dd0	1e291170-66a9-47ef-91f0-ae8a992d8315
422bb983-3099-4517-be7e-a5fe84181dd0	dee2112f-b34b-4044-8c81-3b1b4949aa6e
422bb983-3099-4517-be7e-a5fe84181dd0	f7981d19-1d80-4c8c-8ef2-c961b5ee0930
422bb983-3099-4517-be7e-a5fe84181dd0	b107f47e-cddc-417c-9310-53ef972b3b4c
422bb983-3099-4517-be7e-a5fe84181dd0	33a51550-2bd1-402f-85e1-1e494a570721
422bb983-3099-4517-be7e-a5fe84181dd0	3a630836-aedf-4ac7-8dfd-708d4bcf5dad
20f6a3e2-1dc6-4dd2-93d2-ebc40472ef42	8b463b00-e1b5-4dea-a6cc-2d599e2c92e5
20f6a3e2-1dc6-4dd2-93d2-ebc40472ef42	5012dc3c-acf6-4d72-86b4-e5077de99edc
20f6a3e2-1dc6-4dd2-93d2-ebc40472ef42	d5f27d3d-23e8-4042-8a85-111f0cd310e5
20f6a3e2-1dc6-4dd2-93d2-ebc40472ef42	af576eb3-565e-4f03-940a-cea14ea008ab
20f6a3e2-1dc6-4dd2-93d2-ebc40472ef42	3d8f06d1-6593-4f52-b37f-663b7f981d87
20f6a3e2-1dc6-4dd2-93d2-ebc40472ef42	6de9443c-cee8-42f0-bb73-4ce1f47ddf80
82237fe9-eb9c-4530-aa71-d3dc482dc05f	8b463b00-e1b5-4dea-a6cc-2d599e2c92e5
82237fe9-eb9c-4530-aa71-d3dc482dc05f	11e6c225-cfc1-422c-a2c5-e416da43861e
82237fe9-eb9c-4530-aa71-d3dc482dc05f	cfbc7e9f-907f-4952-9d0f-fe6bfc758d05
82237fe9-eb9c-4530-aa71-d3dc482dc05f	b107f47e-cddc-417c-9310-53ef972b3b4c
82237fe9-eb9c-4530-aa71-d3dc482dc05f	33a51550-2bd1-402f-85e1-1e494a570721
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.roles (id, tenant_id, name, status, is_system, archived_at, archived_reason) FROM stdin;
00000000-0000-0000-0000-000000000002	00000000-0000-0000-0000-000000000001	Super Admin	ACTIVE	t	\N	\N
00000000-0000-0000-0000-000000000003	00000000-0000-0000-0000-000000000001	Branch Admin	ACTIVE	t	\N	\N
00000000-0000-0000-0000-000000000004	00000000-0000-0000-0000-000000000001	Receptionist	ACTIVE	t	\N	\N
00000000-0000-0000-0000-000000000005	00000000-0000-0000-0000-000000000001	Cashier	ACTIVE	t	\N	\N
00000000-0000-0000-0000-000000000006	00000000-0000-0000-0000-000000000001	Med-Tech	ACTIVE	t	\N	\N
00000000-0000-0000-0000-000000000007	00000000-0000-0000-0000-000000000001	Doctor	ACTIVE	t	\N	\N
3b0a1662-41ab-46e3-8275-601721b53124	234f5c00-f6a3-4d55-996a-281e1306d7ca	Super Admin	ACTIVE	t	\N	\N
be36b359-9407-4f4d-9246-82181b6c2eec	234f5c00-f6a3-4d55-996a-281e1306d7ca	Branch Admin	ACTIVE	t	\N	\N
422bb983-3099-4517-be7e-a5fe84181dd0	234f5c00-f6a3-4d55-996a-281e1306d7ca	Doctor	ACTIVE	t	\N	\N
20f6a3e2-1dc6-4dd2-93d2-ebc40472ef42	234f5c00-f6a3-4d55-996a-281e1306d7ca	Cashier	ACTIVE	t	\N	\N
82237fe9-eb9c-4530-aa71-d3dc482dc05f	234f5c00-f6a3-4d55-996a-281e1306d7ca	Nurse	ACTIVE	t	\N	\N
\.


--
-- Data for Name: service_categories; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.service_categories (id, tenant_id, name, description, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: service_items; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.service_items (id, tenant_id, category_id, code, name, description, is_active, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: service_prices; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.service_prices (id, tenant_id, service_item_id, branch_id, amount, effective_date, is_active, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.sessions (id, user_id, tenant_id, refresh_token_hash, is_mfa_verified, expires_at, last_rotated_at, user_agent, ip_address) FROM stdin;
8df34e99-2622-4156-af24-c04e4a93eb73	d350afea-90a5-4177-88c1-108b7236d74f	00000000-0000-0000-0000-000000000001	$2b$10$jwomhe5jbbVYe3i6sk2UkOvbAjANf/OArFmeVGOVMoXNDDXhVzhxq	f	2026-05-24 12:06:59.455	2026-05-17 12:06:59.468	\N	\N
831813ef-3420-4afd-affc-d4b44059a4e5	d350afea-90a5-4177-88c1-108b7236d74f	00000000-0000-0000-0000-000000000001	$2b$10$BHI9g3nq3pRm2K3xY.2M3ONPRHQ.WR33EssYFoKm/hsiIm7fJaoWC	t	2026-05-24 12:07:23.637	2026-05-17 12:07:23.783	\N	\N
49cab7d9-7bb2-464f-aa18-05ff8c2d5ed4	d350afea-90a5-4177-88c1-108b7236d74f	00000000-0000-0000-0000-000000000001	$2b$10$sp.Vir0lau7iL6x0HUr1Auq9wfTAFwAkHOHgM8Nf69Z3QbuvUAz4y	f	2026-05-24 12:08:14.293	2026-05-17 12:08:14.294	\N	\N
28fd2362-fb9c-4f97-9575-aa2102ddd089	d350afea-90a5-4177-88c1-108b7236d74f	00000000-0000-0000-0000-000000000001	$2b$10$z8yaUATsej6WUyfoovGSuO.o69U.sKsSagsOH.lEk.J2CR/iBgGvS	t	2026-05-24 12:08:19.939	2026-05-17 12:08:20.065	\N	\N
\.


--
-- Data for Name: sla_alerts; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.sla_alerts (id, tenant_id, metric_name, threshold_value, actual_value, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: stock_logs; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.stock_logs (id, tenant_id, inventory_item_id, type, quantity, previous_stock, new_stock, reference_type, reference_id, remarks, created_at, branch_id) FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.suppliers (id, tenant_id, name, contact_name, contact_email, contact_phone, address, status, created_at) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.tenants (id, name, status, created_at, updated_at) FROM stdin;
00000000-0000-0000-0000-000000000001	Central Hospital (Main Branch)	ACTIVE	2026-05-17 12:05:22.405	2026-05-17 12:05:22.405
00000000-0000-0000-0000-00000000000a	tenant-alpha	ACTIVE	2026-05-17 12:05:22.414	2026-05-17 12:05:22.414
00000000-0000-0000-0000-00000000000b	tenant-beta	ACTIVE	2026-05-17 12:05:22.42	2026-05-17 12:05:22.42
234f5c00-f6a3-4d55-996a-281e1306d7ca	Clinic A	ACTIVE	2026-05-17 12:11:34.636	2026-05-17 12:11:34.636
\.


--
-- Data for Name: user_branches; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.user_branches (id, tenant_id, user_id, branch_id, is_active, created_at, updated_at) FROM stdin;
e73b5718-455a-4935-9153-9dd66863f2a5	00000000-0000-0000-0000-000000000001	d350afea-90a5-4177-88c1-108b7236d74f	00000000-0000-0000-0000-000000000010	t	2026-05-17 12:05:22.663	2026-05-17 12:05:22.663
3751510a-5b05-43ef-ac9d-b6e26b365652	234f5c00-f6a3-4d55-996a-281e1306d7ca	70239b23-f23f-4475-a310-7ab6adbbb4bb	074dd2b6-f1d0-433c-8b52-333932f132ab	t	2026-05-17 12:11:34.823	2026-05-17 12:11:34.823
\.


--
-- Data for Name: user_mfa_recovery_codes; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.user_mfa_recovery_codes (id, user_id, code_hash, used_at, created_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.user_roles (user_id, role_id, status, revoked_at, revoked_reason) FROM stdin;
d350afea-90a5-4177-88c1-108b7236d74f	00000000-0000-0000-0000-000000000002	ACTIVE	\N	\N
70239b23-f23f-4475-a310-7ab6adbbb4bb	3b0a1662-41ab-46e3-8275-601721b53124	ACTIVE	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.users (id, tenant_id, email, password_hash, is_mfa_enabled, created_at, updated_at, status, deactivated_at, deactivated_reason, token_version, failed_login_attempts, locked_until, mfa_secret) FROM stdin;
d350afea-90a5-4177-88c1-108b7236d74f	00000000-0000-0000-0000-000000000001	admin@hospital.com	$2b$10$HodpKwaXROafRiHOEUIwXOXReYPjxkGI2vNhSEpu3lKnRXi4W9nEC	t	2026-05-17 12:05:22.643	2026-05-17 12:08:19.998	ACTIVE	\N	\N	0	0	\N	db89df60a7a2dd886b05dd53:f726ef5f5b094e2fdf88915755ad07b17baa94fcb4663a55672702d6c5c879aa36db4e536d1921c13c6ec0b16e21a321518d18f2:b1f740a125e9062567153e5c8b3a9b9a
70239b23-f23f-4475-a310-7ab6adbbb4bb	234f5c00-f6a3-4d55-996a-281e1306d7ca	admin@clinica.com	$2b$10$qdlzAtQlW33uqldm1L14mu.ShcwBu.kGlsdEPuNJUnYgSgsjGDL5G	t	2026-05-17 12:11:34.814	2026-05-17 12:11:34.814	ACTIVE	\N	\N	0	0	\N	\N
\.


--
-- Data for Name: vitals; Type: TABLE DATA; Schema: public; Owner: hms_prod_user
--

COPY public.vitals (id, tenant_id, encounter_id, temperature, systolic_bp, diastolic_bp, heart_rate, respiratory_rate, weight_kg, created_by, created_at) FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: approval_requests approval_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_pkey PRIMARY KEY (id);


--
-- Name: attendance_logs attendance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: branch_stocks branch_stocks_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.branch_stocks
    ADD CONSTRAINT branch_stocks_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: cashier_ledger_entries cashier_ledger_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.cashier_ledger_entries
    ADD CONSTRAINT cashier_ledger_entries_pkey PRIMARY KEY (id);


--
-- Name: cashier_sessions cashier_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.cashier_sessions
    ADD CONSTRAINT cashier_sessions_pkey PRIMARY KEY (id);


--
-- Name: claims claims_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_pkey PRIMARY KEY (id);


--
-- Name: clinical_notes clinical_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.clinical_notes
    ADD CONSTRAINT clinical_notes_pkey PRIMARY KEY (id);


--
-- Name: cpt_codes cpt_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.cpt_codes
    ADD CONSTRAINT cpt_codes_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: diagnoses diagnoses_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT diagnoses_pkey PRIMARY KEY (id);


--
-- Name: employee_branches employee_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.employee_branches
    ADD CONSTRAINT employee_branches_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: encounter_diagnoses encounter_diagnoses_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.encounter_diagnoses
    ADD CONSTRAINT encounter_diagnoses_pkey PRIMARY KEY (id);


--
-- Name: encounters encounters_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: hmo_partners hmo_partners_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.hmo_partners
    ADD CONSTRAINT hmo_partners_pkey PRIMARY KEY (id);


--
-- Name: icd_10_codes icd_10_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.icd_10_codes
    ADD CONSTRAINT icd_10_codes_pkey PRIMARY KEY (id);


--
-- Name: idempotency_records idempotency_records_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.idempotency_records
    ADD CONSTRAINT idempotency_records_pkey PRIMARY KEY (id);


--
-- Name: insurance_claims insurance_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: lab_result_signatures lab_result_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.lab_result_signatures
    ADD CONSTRAINT lab_result_signatures_pkey PRIMARY KEY (id);


--
-- Name: lab_result_versions lab_result_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.lab_result_versions
    ADD CONSTRAINT lab_result_versions_pkey PRIMARY KEY (id);


--
-- Name: lab_results lab_results_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: ledger_entries ledger_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_pkey PRIMARY KEY (id);


--
-- Name: license_records license_records_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.license_records
    ADD CONSTRAINT license_records_pkey PRIMARY KEY (id);


--
-- Name: notification_outbox notification_outbox_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.notification_outbox
    ADD CONSTRAINT notification_outbox_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: numbering_sequences numbering_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.numbering_sequences
    ADD CONSTRAINT numbering_sequences_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: patient_merge_requests patient_merge_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.patient_merge_requests
    ADD CONSTRAINT patient_merge_requests_pkey PRIMARY KEY (id);


--
-- Name: patient_users patient_users_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.patient_users
    ADD CONSTRAINT patient_users_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payment_reversals payment_reversals_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.payment_reversals
    ADD CONSTRAINT payment_reversals_pkey PRIMARY KEY (id);


--
-- Name: payment_voids payment_voids_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.payment_voids
    ADD CONSTRAINT payment_voids_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payslips payslips_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: purchase_requests purchase_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_pkey PRIMARY KEY (id);


--
-- Name: queue_entries queue_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.queue_entries
    ADD CONSTRAINT queue_entries_pkey PRIMARY KEY (id);


--
-- Name: receiving_records receiving_records_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.receiving_records
    ADD CONSTRAINT receiving_records_pkey PRIMARY KEY (id);


--
-- Name: referral_records referral_records_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.referral_records
    ADD CONSTRAINT referral_records_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrers referrers_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.referrers
    ADD CONSTRAINT referrers_pkey PRIMARY KEY (id);


--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- Name: report_exports report_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.report_exports
    ADD CONSTRAINT report_exports_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: service_categories service_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_pkey PRIMARY KEY (id);


--
-- Name: service_items service_items_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT service_items_pkey PRIMARY KEY (id);


--
-- Name: service_prices service_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.service_prices
    ADD CONSTRAINT service_prices_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sla_alerts sla_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.sla_alerts
    ADD CONSTRAINT sla_alerts_pkey PRIMARY KEY (id);


--
-- Name: stock_logs stock_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.stock_logs
    ADD CONSTRAINT stock_logs_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: user_branches user_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.user_branches
    ADD CONSTRAINT user_branches_pkey PRIMARY KEY (id);


--
-- Name: user_mfa_recovery_codes user_mfa_recovery_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.user_mfa_recovery_codes
    ADD CONSTRAINT user_mfa_recovery_codes_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vitals vitals_pkey; Type: CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX audit_logs_branch_id_idx ON public.audit_logs USING btree (branch_id);


--
-- Name: audit_logs_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX audit_logs_tenant_id_idx ON public.audit_logs USING btree (tenant_id);


--
-- Name: branch_stocks_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX branch_stocks_branch_id_idx ON public.branch_stocks USING btree (branch_id);


--
-- Name: branch_stocks_inventory_item_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX branch_stocks_inventory_item_id_idx ON public.branch_stocks USING btree (inventory_item_id);


--
-- Name: branch_stocks_tenant_id_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX branch_stocks_tenant_id_branch_id_idx ON public.branch_stocks USING btree (tenant_id, branch_id);


--
-- Name: branch_stocks_tenant_id_branch_id_inventory_item_id_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX branch_stocks_tenant_id_branch_id_inventory_item_id_key ON public.branch_stocks USING btree (tenant_id, branch_id, inventory_item_id);


--
-- Name: branch_stocks_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX branch_stocks_tenant_id_idx ON public.branch_stocks USING btree (tenant_id);


--
-- Name: cashier_sessions_one_open_per_user_branch_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX cashier_sessions_one_open_per_user_branch_idx ON public.cashier_sessions USING btree (tenant_id, user_id, branch_id) WHERE (status = 'OPEN'::text);


--
-- Name: claims_tenant_id_claim_number_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX claims_tenant_id_claim_number_key ON public.claims USING btree (tenant_id, claim_number);


--
-- Name: clinical_notes_tenant_id_encounter_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX clinical_notes_tenant_id_encounter_id_idx ON public.clinical_notes USING btree (tenant_id, encounter_id);


--
-- Name: cpt_codes_tenant_id_code_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX cpt_codes_tenant_id_code_key ON public.cpt_codes USING btree (tenant_id, code);


--
-- Name: departments_tenant_id_code_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX departments_tenant_id_code_key ON public.departments USING btree (tenant_id, code);


--
-- Name: diagnoses_tenant_id_encounter_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX diagnoses_tenant_id_encounter_id_idx ON public.diagnoses USING btree (tenant_id, encounter_id);


--
-- Name: employee_branches_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX employee_branches_branch_id_idx ON public.employee_branches USING btree (branch_id);


--
-- Name: employee_branches_employee_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX employee_branches_employee_id_idx ON public.employee_branches USING btree (employee_id);


--
-- Name: employee_branches_tenant_id_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX employee_branches_tenant_id_branch_id_idx ON public.employee_branches USING btree (tenant_id, branch_id);


--
-- Name: employee_branches_tenant_id_employee_id_branch_id_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX employee_branches_tenant_id_employee_id_branch_id_key ON public.employee_branches USING btree (tenant_id, employee_id, branch_id);


--
-- Name: employee_branches_tenant_id_employee_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX employee_branches_tenant_id_employee_id_idx ON public.employee_branches USING btree (tenant_id, employee_id);


--
-- Name: employee_branches_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX employee_branches_tenant_id_idx ON public.employee_branches USING btree (tenant_id);


--
-- Name: employees_tenant_id_employee_number_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX employees_tenant_id_employee_number_key ON public.employees USING btree (tenant_id, employee_number);


--
-- Name: encounters_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX encounters_branch_id_idx ON public.encounters USING btree (branch_id);


--
-- Name: encounters_patient_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX encounters_patient_id_idx ON public.encounters USING btree (patient_id);


--
-- Name: encounters_status_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX encounters_status_idx ON public.encounters USING btree (status);


--
-- Name: encounters_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX encounters_tenant_id_idx ON public.encounters USING btree (tenant_id);


--
-- Name: encounters_tenant_id_patient_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX encounters_tenant_id_patient_id_idx ON public.encounters USING btree (tenant_id, patient_id);


--
-- Name: encounters_tenant_id_status_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX encounters_tenant_id_status_idx ON public.encounters USING btree (tenant_id, status);


--
-- Name: hmo_partners_tenant_id_code_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX hmo_partners_tenant_id_code_key ON public.hmo_partners USING btree (tenant_id, code);


--
-- Name: icd_10_codes_code_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX icd_10_codes_code_key ON public.icd_10_codes USING btree (code);


--
-- Name: idempotency_records_status_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX idempotency_records_status_idx ON public.idempotency_records USING btree (status);


--
-- Name: idempotency_records_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX idempotency_records_tenant_id_idx ON public.idempotency_records USING btree (tenant_id);


--
-- Name: idempotency_records_tenant_id_operation_key_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX idempotency_records_tenant_id_operation_key_key ON public.idempotency_records USING btree (tenant_id, operation, key);


--
-- Name: insurance_claims_invoice_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX insurance_claims_invoice_id_idx ON public.insurance_claims USING btree (invoice_id);


--
-- Name: insurance_claims_patient_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX insurance_claims_patient_id_idx ON public.insurance_claims USING btree (patient_id);


--
-- Name: insurance_claims_tenant_id_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX insurance_claims_tenant_id_branch_id_idx ON public.insurance_claims USING btree (tenant_id, branch_id);


--
-- Name: inventory_items_tenant_id_sku_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX inventory_items_tenant_id_sku_key ON public.inventory_items USING btree (tenant_id, sku);


--
-- Name: invoices_order_id_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX invoices_order_id_key ON public.invoices USING btree (order_id);


--
-- Name: invoices_tenant_id_invoice_number_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX invoices_tenant_id_invoice_number_key ON public.invoices USING btree (tenant_id, invoice_number);


--
-- Name: lab_result_signatures_lab_result_id_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX lab_result_signatures_lab_result_id_key ON public.lab_result_signatures USING btree (lab_result_id);


--
-- Name: lab_results_order_id_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX lab_results_order_id_key ON public.lab_results USING btree (order_id);


--
-- Name: ledger_entries_reference_type_reference_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX ledger_entries_reference_type_reference_id_idx ON public.ledger_entries USING btree (reference_type, reference_id);


--
-- Name: ledger_entries_tenant_id_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX ledger_entries_tenant_id_branch_id_idx ON public.ledger_entries USING btree (tenant_id, branch_id);


--
-- Name: numbering_sequences_tenant_id_branch_id_entity_type_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX numbering_sequences_tenant_id_branch_id_entity_type_key ON public.numbering_sequences USING btree (tenant_id, branch_id, entity_type);


--
-- Name: order_items_order_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);


--
-- Name: order_items_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX order_items_tenant_id_idx ON public.order_items USING btree (tenant_id);


--
-- Name: orders_tenant_id_order_number_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX orders_tenant_id_order_number_key ON public.orders USING btree (tenant_id, order_number);


--
-- Name: patient_merge_requests_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX patient_merge_requests_branch_id_idx ON public.patient_merge_requests USING btree (branch_id);


--
-- Name: patient_merge_requests_status_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX patient_merge_requests_status_idx ON public.patient_merge_requests USING btree (status);


--
-- Name: patient_merge_requests_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX patient_merge_requests_tenant_id_idx ON public.patient_merge_requests USING btree (tenant_id);


--
-- Name: patient_users_patient_id_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX patient_users_patient_id_key ON public.patient_users USING btree (patient_id);


--
-- Name: patient_users_tenant_id_email_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX patient_users_tenant_id_email_key ON public.patient_users USING btree (tenant_id, email);


--
-- Name: patients_tenant_id_patient_number_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX patients_tenant_id_patient_number_key ON public.patients USING btree (tenant_id, patient_number);


--
-- Name: payment_reversals_approval_request_id_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX payment_reversals_approval_request_id_key ON public.payment_reversals USING btree (approval_request_id);


--
-- Name: payment_reversals_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX payment_reversals_branch_id_idx ON public.payment_reversals USING btree (branch_id);


--
-- Name: payment_reversals_invoice_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX payment_reversals_invoice_id_idx ON public.payment_reversals USING btree (invoice_id);


--
-- Name: payment_reversals_payment_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX payment_reversals_payment_id_idx ON public.payment_reversals USING btree (payment_id);


--
-- Name: payment_reversals_status_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX payment_reversals_status_idx ON public.payment_reversals USING btree (status);


--
-- Name: payment_reversals_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX payment_reversals_tenant_id_idx ON public.payment_reversals USING btree (tenant_id);


--
-- Name: payment_reversals_type_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX payment_reversals_type_idx ON public.payment_reversals USING btree (type);


--
-- Name: payment_voids_payment_id_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX payment_voids_payment_id_key ON public.payment_voids USING btree (payment_id);


--
-- Name: payments_tenant_id_receipt_number_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX payments_tenant_id_receipt_number_key ON public.payments USING btree (tenant_id, receipt_number);


--
-- Name: payslips_tenant_id_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX payslips_tenant_id_branch_id_idx ON public.payslips USING btree (tenant_id, branch_id);


--
-- Name: payslips_tenant_id_employee_id_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX payslips_tenant_id_employee_id_branch_id_idx ON public.payslips USING btree (tenant_id, employee_id, branch_id);


--
-- Name: permissions_tenant_id_name_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX permissions_tenant_id_name_key ON public.permissions USING btree (tenant_id, name);


--
-- Name: prescriptions_patient_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX prescriptions_patient_id_idx ON public.prescriptions USING btree (patient_id);


--
-- Name: prescriptions_tenant_id_encounter_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX prescriptions_tenant_id_encounter_id_idx ON public.prescriptions USING btree (tenant_id, encounter_id);


--
-- Name: purchase_orders_tenant_id_order_number_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX purchase_orders_tenant_id_order_number_key ON public.purchase_orders USING btree (tenant_id, order_number);


--
-- Name: referrals_patient_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX referrals_patient_id_idx ON public.referrals USING btree (patient_id);


--
-- Name: referrals_tenant_id_encounter_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX referrals_tenant_id_encounter_id_idx ON public.referrals USING btree (tenant_id, encounter_id);


--
-- Name: report_exports_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX report_exports_branch_id_idx ON public.report_exports USING btree (branch_id);


--
-- Name: report_exports_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX report_exports_tenant_id_idx ON public.report_exports USING btree (tenant_id);


--
-- Name: service_categories_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX service_categories_tenant_id_idx ON public.service_categories USING btree (tenant_id);


--
-- Name: service_items_category_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX service_items_category_id_idx ON public.service_items USING btree (category_id);


--
-- Name: service_items_tenant_id_code_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX service_items_tenant_id_code_key ON public.service_items USING btree (tenant_id, code);


--
-- Name: service_items_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX service_items_tenant_id_idx ON public.service_items USING btree (tenant_id);


--
-- Name: service_prices_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX service_prices_branch_id_idx ON public.service_prices USING btree (branch_id);


--
-- Name: service_prices_service_item_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX service_prices_service_item_id_idx ON public.service_prices USING btree (service_item_id);


--
-- Name: service_prices_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX service_prices_tenant_id_idx ON public.service_prices USING btree (tenant_id);


--
-- Name: sessions_refresh_token_hash_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX sessions_refresh_token_hash_key ON public.sessions USING btree (refresh_token_hash);


--
-- Name: sessions_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX sessions_tenant_id_idx ON public.sessions USING btree (tenant_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);


--
-- Name: sla_alerts_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX sla_alerts_tenant_id_idx ON public.sla_alerts USING btree (tenant_id);


--
-- Name: user_branches_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX user_branches_branch_id_idx ON public.user_branches USING btree (branch_id);


--
-- Name: user_branches_tenant_id_branch_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX user_branches_tenant_id_branch_id_idx ON public.user_branches USING btree (tenant_id, branch_id);


--
-- Name: user_branches_tenant_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX user_branches_tenant_id_idx ON public.user_branches USING btree (tenant_id);


--
-- Name: user_branches_tenant_id_user_id_branch_id_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX user_branches_tenant_id_user_id_branch_id_key ON public.user_branches USING btree (tenant_id, user_id, branch_id);


--
-- Name: user_branches_tenant_id_user_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX user_branches_tenant_id_user_id_idx ON public.user_branches USING btree (tenant_id, user_id);


--
-- Name: user_branches_user_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX user_branches_user_id_idx ON public.user_branches USING btree (user_id);


--
-- Name: user_mfa_recovery_codes_user_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX user_mfa_recovery_codes_user_id_idx ON public.user_mfa_recovery_codes USING btree (user_id);


--
-- Name: users_tenant_id_email_key; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE UNIQUE INDEX users_tenant_id_email_key ON public.users USING btree (tenant_id, email);


--
-- Name: vitals_tenant_id_encounter_id_idx; Type: INDEX; Schema: public; Owner: hms_prod_user
--

CREATE INDEX vitals_tenant_id_encounter_id_idx ON public.vitals USING btree (tenant_id, encounter_id);


--
-- Name: audit_logs audit_log_immutable; Type: TRIGGER; Schema: public; Owner: hms_prod_user
--

CREATE TRIGGER audit_log_immutable BEFORE DELETE OR UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();


--
-- Name: approval_requests approval_requests_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: approval_requests approval_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: approval_requests approval_requests_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendance_logs attendance_logs_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: branch_stocks branch_stocks_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.branch_stocks
    ADD CONSTRAINT branch_stocks_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: branch_stocks branch_stocks_inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.branch_stocks
    ADD CONSTRAINT branch_stocks_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: branch_stocks branch_stocks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.branch_stocks
    ADD CONSTRAINT branch_stocks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: branches branches_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cashier_ledger_entries cashier_ledger_entries_cashier_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.cashier_ledger_entries
    ADD CONSTRAINT cashier_ledger_entries_cashier_session_id_fkey FOREIGN KEY (cashier_session_id) REFERENCES public.cashier_sessions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cashier_sessions cashier_sessions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.cashier_sessions
    ADD CONSTRAINT cashier_sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: claims claims_hmo_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_hmo_partner_id_fkey FOREIGN KEY (hmo_partner_id) REFERENCES public.hmo_partners(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: claims claims_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: claims claims_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: clinical_notes clinical_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.clinical_notes
    ADD CONSTRAINT clinical_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: clinical_notes clinical_notes_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.clinical_notes
    ADD CONSTRAINT clinical_notes_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: clinical_notes clinical_notes_locked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.clinical_notes
    ADD CONSTRAINT clinical_notes_locked_by_fkey FOREIGN KEY (locked_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cpt_codes cpt_codes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.cpt_codes
    ADD CONSTRAINT cpt_codes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: departments departments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: diagnoses diagnoses_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT diagnoses_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employee_branches employee_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.employee_branches
    ADD CONSTRAINT employee_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_branches employee_branches_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.employee_branches
    ADD CONSTRAINT employee_branches_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employee_branches employee_branches_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.employee_branches
    ADD CONSTRAINT employee_branches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employees employees_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employees employees_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employees employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: encounter_diagnoses encounter_diagnoses_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.encounter_diagnoses
    ADD CONSTRAINT encounter_diagnoses_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: encounter_diagnoses encounter_diagnoses_icd10_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.encounter_diagnoses
    ADD CONSTRAINT encounter_diagnoses_icd10_code_id_fkey FOREIGN KEY (icd10_code_id) REFERENCES public.icd_10_codes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: encounters encounters_attending_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_attending_id_fkey FOREIGN KEY (attending_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: encounters encounters_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: encounters encounters_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: encounters encounters_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: encounters encounters_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: files files_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: hmo_partners hmo_partners_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.hmo_partners
    ADD CONSTRAINT hmo_partners_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: idempotency_records idempotency_records_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.idempotency_records
    ADD CONSTRAINT idempotency_records_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: insurance_claims insurance_claims_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: insurance_claims insurance_claims_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: insurance_claims insurance_claims_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: insurance_claims insurance_claims_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: inventory_items inventory_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_result_signatures lab_result_signatures_lab_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.lab_result_signatures
    ADD CONSTRAINT lab_result_signatures_lab_result_id_fkey FOREIGN KEY (lab_result_id) REFERENCES public.lab_results(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_result_versions lab_result_versions_lab_result_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.lab_result_versions
    ADD CONSTRAINT lab_result_versions_lab_result_id_fkey FOREIGN KEY (lab_result_id) REFERENCES public.lab_results(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_results lab_results_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lab_results lab_results_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.lab_results
    ADD CONSTRAINT lab_results_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: leave_requests leave_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ledger_entries ledger_entries_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ledger_entries ledger_entries_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: license_records license_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.license_records
    ADD CONSTRAINT license_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: numbering_sequences numbering_sequences_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.numbering_sequences
    ADD CONSTRAINT numbering_sequences_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patient_merge_requests patient_merge_requests_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.patient_merge_requests
    ADD CONSTRAINT patient_merge_requests_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_merge_requests patient_merge_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.patient_merge_requests
    ADD CONSTRAINT patient_merge_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patient_merge_requests patient_merge_requests_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.patient_merge_requests
    ADD CONSTRAINT patient_merge_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: patient_users patient_users_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.patient_users
    ADD CONSTRAINT patient_users_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patient_users patient_users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.patient_users
    ADD CONSTRAINT patient_users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: patients patients_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment_reversals payment_reversals_approval_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.payment_reversals
    ADD CONSTRAINT payment_reversals_approval_request_id_fkey FOREIGN KEY (approval_request_id) REFERENCES public.approval_requests(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment_reversals payment_reversals_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.payment_reversals
    ADD CONSTRAINT payment_reversals_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment_reversals payment_reversals_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.payment_reversals
    ADD CONSTRAINT payment_reversals_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment_voids payment_voids_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.payment_voids
    ADD CONSTRAINT payment_voids_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_cashier_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_cashier_session_id_fkey FOREIGN KEY (cashier_session_id) REFERENCES public.cashier_sessions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payslips payslips_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payslips payslips_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payslips payslips_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: permissions permissions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescriptions prescriptions_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_prescribed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_prescribed_by_id_fkey FOREIGN KEY (prescribed_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: prescriptions prescriptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_purchase_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_purchase_request_id_fkey FOREIGN KEY (purchase_request_id) REFERENCES public.purchase_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_orders purchase_orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_requests purchase_requests_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: queue_entries queue_entries_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.queue_entries
    ADD CONSTRAINT queue_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: receiving_records receiving_records_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.receiving_records
    ADD CONSTRAINT receiving_records_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: receiving_records receiving_records_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.receiving_records
    ADD CONSTRAINT receiving_records_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: referral_records referral_records_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.referral_records
    ADD CONSTRAINT referral_records_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.referrers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: referral_records referral_records_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.referral_records
    ADD CONSTRAINT referral_records_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: referrals referrals_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: referrals referrals_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: referrals referrals_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: referrals referrals_referred_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_by_id_fkey FOREIGN KEY (referred_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: referrals referrals_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: referrers referrers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.referrers
    ADD CONSTRAINT referrers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refunds refunds_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: refunds refunds_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: report_exports report_exports_decided_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.report_exports
    ADD CONSTRAINT report_exports_decided_by_id_fkey FOREIGN KEY (decided_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: report_exports report_exports_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.report_exports
    ADD CONSTRAINT report_exports_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: report_exports report_exports_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.report_exports
    ADD CONSTRAINT report_exports_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: roles roles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_categories service_categories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_items service_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT service_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_items service_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT service_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_prices service_prices_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.service_prices
    ADD CONSTRAINT service_prices_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_prices service_prices_service_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.service_prices
    ADD CONSTRAINT service_prices_service_item_id_fkey FOREIGN KEY (service_item_id) REFERENCES public.service_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: service_prices service_prices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.service_prices
    ADD CONSTRAINT service_prices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sla_alerts sla_alerts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.sla_alerts
    ADD CONSTRAINT sla_alerts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_logs stock_logs_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.stock_logs
    ADD CONSTRAINT stock_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_logs stock_logs_inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.stock_logs
    ADD CONSTRAINT stock_logs_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_logs stock_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.stock_logs
    ADD CONSTRAINT stock_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: suppliers suppliers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_branches user_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.user_branches
    ADD CONSTRAINT user_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_branches user_branches_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.user_branches
    ADD CONSTRAINT user_branches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_branches user_branches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.user_branches
    ADD CONSTRAINT user_branches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_mfa_recovery_codes user_mfa_recovery_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.user_mfa_recovery_codes
    ADD CONSTRAINT user_mfa_recovery_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: vitals vitals_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hms_prod_user
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict HCYIuBXfYe21ZI9bsQSoaoZ8zPB6ZmJJaU8mZfDxaPoCcR736ineAC1MwRvwGbB

