-- Migration 010: FanzDash Tax Administration Schema
-- Supports role-based access control, approval workflows, and audit logging

-- User roles and permissions for tax admin access
create table if not exists tax_admin_roles (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    description text,
    permissions jsonb not null default '[]',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- User role assignments
create table if not exists tax_admin_user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null, -- References to main user table
    role_id uuid not null references tax_admin_roles(id),
    assigned_by uuid not null,
    assigned_at timestamptz not null default now(),
    expires_at timestamptz,
    active boolean not null default true
);

-- Tax admin activity audit log
create table if not exists tax_admin_activity_log (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid not null,
    actor_name text not null,
    action_type text not null,
    resource_type text,
    resource_id text,
    description text not null,
    metadata jsonb,
    ip_address inet,
    user_agent text,
    timestamp timestamptz not null default now()
);

-- Alert management system
create table if not exists tax_admin_alerts (
    id uuid primary key default gen_random_uuid(),
    type text not null check (type in ('error', 'warning', 'info')),
    severity text not null check (severity in ('high', 'medium', 'low')),
    title text not null,
    message text not null,
    source_type text not null, -- 'nexus_monitoring', 'provider_sync', 'filing_deadline', etc.
    source_id text,
    metadata jsonb,
    due_date timestamptz,
    acknowledged boolean not null default false,
    acknowledged_by uuid,
    acknowledged_at timestamptz,
    resolved boolean not null default false,
    resolved_by uuid,
    resolved_at timestamptz,
    created_at timestamptz not null default now()
);

-- Filing approval workflow
create table if not exists tax_filing_approvals (
    id uuid primary key default gen_random_uuid(),
    filing_id uuid not null, -- References tax_return or filing table
    filing_type text not null, -- 'sales_tax', 'income_tax', etc.
    jurisdiction text not null,
    period text not null,
    amount numeric(18,2) not null,
    status text not null check (status in ('draft', 'pending_approval', 'approved', 'rejected', 'filed')),
    requested_by uuid not null,
    requested_at timestamptz not null default now(),
    approved_by uuid,
    approved_at timestamptz,
    rejection_reason text,
    filing_data jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Report generation tracking
create table if not exists tax_admin_reports (
    id uuid primary key default gen_random_uuid(),
    report_type text not null,
    format text not null check (format in ('excel', 'pdf', 'csv')),
    parameters jsonb not null,
    status text not null check (status in ('generating', 'completed', 'failed')),
    file_path text,
    file_size integer,
    generated_by uuid not null,
    generated_at timestamptz not null default now(),
    expires_at timestamptz,
    download_count integer not null default 0,
    last_downloaded_at timestamptz
);

-- Dashboard widgets configuration
create table if not exists tax_admin_dashboard_config (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    widget_type text not null,
    widget_config jsonb not null,
    position_x integer not null default 0,
    position_y integer not null default 0,
    width integer not null default 1,
    height integer not null default 1,
    visible boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Exemption certificate review workflow
alter table tax_exemption_certificate add column if not exists review_notes text;
alter table tax_exemption_certificate add column if not exists review_history jsonb;

-- Provider sync status and health monitoring
create table if not exists tax_provider_health_checks (
    id uuid primary key default gen_random_uuid(),
    provider_name text not null,
    check_type text not null, -- 'health', 'latency', 'sync_success'
    status text not null check (status in ('healthy', 'degraded', 'unhealthy')),
    response_time_ms integer,
    error_message text,
    checked_at timestamptz not null default now()
);

-- Nexus threshold alerts
create table if not exists tax_nexus_alerts (
    id uuid primary key default gen_random_uuid(),
    state_code text not null,
    alert_type text not null check (alert_type in ('approaching', 'exceeded', 'registration_required')),
    current_revenue numeric(18,2),
    current_transactions integer,
    threshold_percentage numeric(5,2),
    triggered_at timestamptz not null default now(),
    acknowledged boolean not null default false,
    acknowledged_by uuid,
    acknowledged_at timestamptz
);

-- Indexes for performance
create index if not exists idx_tax_admin_user_roles_user_id on tax_admin_user_roles(user_id);
create index if not exists idx_tax_admin_user_roles_active on tax_admin_user_roles(active, expires_at);

create index if not exists idx_tax_admin_activity_log_actor on tax_admin_activity_log(actor_id);
create index if not exists idx_tax_admin_activity_log_timestamp on tax_admin_activity_log(timestamp desc);
create index if not exists idx_tax_admin_activity_log_action_type on tax_admin_activity_log(action_type);

create index if not exists idx_tax_admin_alerts_acknowledged on tax_admin_alerts(acknowledged, severity);
create index if not exists idx_tax_admin_alerts_due_date on tax_admin_alerts(due_date);
create index if not exists idx_tax_admin_alerts_created on tax_admin_alerts(created_at desc);

create index if not exists idx_tax_filing_approvals_status on tax_filing_approvals(status);
create index if not exists idx_tax_filing_approvals_requested_by on tax_filing_approvals(requested_by);
create index if not exists idx_tax_filing_approvals_period on tax_filing_approvals(jurisdiction, period);

create index if not exists idx_tax_admin_reports_generated_by on tax_admin_reports(generated_by);
create index if not exists idx_tax_admin_reports_generated_at on tax_admin_reports(generated_at desc);
create index if not exists idx_tax_admin_reports_expires on tax_admin_reports(expires_at);

create index if not exists idx_tax_provider_health_checks_provider on tax_provider_health_checks(provider_name);
create index if not exists idx_tax_provider_health_checks_checked on tax_provider_health_checks(checked_at desc);

create index if not exists idx_tax_nexus_alerts_state on tax_nexus_alerts(state_code);
create index if not exists idx_tax_nexus_alerts_acknowledged on tax_nexus_alerts(acknowledged, triggered_at);

-- Views for common queries
create or replace view v_tax_admin_user_permissions as
select 
    u.user_id,
    u.active,
    r.name as role_name,
    r.description as role_description,
    r.permissions
from tax_admin_user_roles u
join tax_admin_roles r on u.role_id = r.id
where u.active = true
and (u.expires_at is null or u.expires_at > now());

create or replace view v_tax_admin_pending_actions as
select 
    'filing_approval' as action_type,
    f.id as action_id,
    f.jurisdiction || ' ' || f.period as title,
    'Filing pending approval: $' || f.amount::text as description,
    f.requested_at as created_at,
    'high' as priority
from tax_filing_approvals f
where f.status = 'pending_approval'

union all

select 
    'exemption_review' as action_type,
    e.id as action_id,
    'Exemption Certificate Review' as title,
    e.state_code || ' certificate for review' as description,
    e.created_at,
    'medium' as priority
from tax_exemption_certificate e
where e.status = 'pending'

union all

select 
    'alert_response' as action_type,
    a.id as action_id,
    a.title,
    a.message as description,
    a.created_at,
    case a.severity 
        when 'high' then 'high'
        when 'medium' then 'medium'
        else 'low'
    end as priority
from tax_admin_alerts a
where a.acknowledged = false
order by created_at desc;

create or replace view v_tax_admin_dashboard_metrics as
select 
    (select count(*) from tax_liability_summary where status = 'unpaid') as pending_liabilities,
    (select count(*) from tax_registration where status = 'active') as active_registrations,
    (select count(*) from tax_nexus_metrics where threshold_reached = true) as nexus_states_exceeded,
    (select count(*) from creator_tax_profile where needs_1099_nec = true) as creators_needing_1099,
    (select count(*) from tax_admin_alerts where acknowledged = false) as unacknowledged_alerts,
    (select count(*) from tax_filing_approvals where status = 'pending_approval') as pending_approvals,
    (select sum(amount) from tax_liability_summary where status = 'unpaid') as total_unpaid_liabilities;

create or replace view v_tax_provider_health_summary as
select 
    provider_name,
    max(checked_at) as last_check,
    count(*) filter (where status = 'healthy' and checked_at > now() - interval '1 hour') as healthy_checks,
    count(*) filter (where status = 'unhealthy' and checked_at > now() - interval '1 hour') as unhealthy_checks,
    avg(response_time_ms) filter (where response_time_ms is not null and checked_at > now() - interval '1 hour') as avg_response_time,
    case 
        when max(checked_at) < now() - interval '2 hours' then 'stale'
        when count(*) filter (where status = 'unhealthy' and checked_at > now() - interval '1 hour') > 0 then 'unhealthy'
        when count(*) filter (where status = 'degraded' and checked_at > now() - interval '1 hour') > 0 then 'degraded'
        else 'healthy'
    end as overall_status
from tax_provider_health_checks
group by provider_name;

-- Seed default roles and permissions
insert into tax_admin_roles (name, description, permissions) values
('admin', 'Full administrative access to tax system', 
 '["view_dashboard", "manage_registrations", "review_exemptions", "generate_reports", "view_creator_tax_info", "approve_filings", "manage_providers", "manage_users", "system_config"]'::jsonb),
('manager', 'Tax manager with approval authority', 
 '["view_dashboard", "review_exemptions", "generate_reports", "view_creator_tax_info", "approve_filings"]'::jsonb),
('viewer', 'Read-only access to tax data', 
 '["view_dashboard", "generate_reports"]'::jsonb)
on conflict (name) do nothing;

-- Functions for role management
create or replace function assign_tax_admin_role(
    p_user_id uuid,
    p_role_name text,
    p_assigned_by uuid,
    p_expires_at timestamptz default null
) returns uuid as $$
declare
    role_id uuid;
    assignment_id uuid;
begin
    -- Get role ID
    select id into role_id from tax_admin_roles where name = p_role_name;
    if role_id is null then
        raise exception 'Role % not found', p_role_name;
    end if;
    
    -- Deactivate existing assignments
    update tax_admin_user_roles 
    set active = false, updated_at = now()
    where user_id = p_user_id and active = true;
    
    -- Create new assignment
    insert into tax_admin_user_roles (user_id, role_id, assigned_by, expires_at)
    values (p_user_id, role_id, p_assigned_by, p_expires_at)
    returning id into assignment_id;
    
    return assignment_id;
end;
$$ language plpgsql;

create or replace function check_tax_admin_permission(
    p_user_id uuid,
    p_permission text
) returns boolean as $$
declare
    has_permission boolean default false;
begin
    select exists(
        select 1 from v_tax_admin_user_permissions 
        where user_id = p_user_id 
        and permissions ? p_permission
    ) into has_permission;
    
    return has_permission;
end;
$$ language plpgsql;

-- Function to log admin activity
create or replace function log_tax_admin_activity(
    p_actor_id uuid,
    p_actor_name text,
    p_action_type text,
    p_description text,
    p_resource_type text default null,
    p_resource_id text default null,
    p_metadata jsonb default null,
    p_ip_address inet default null,
    p_user_agent text default null
) returns uuid as $$
declare
    log_id uuid;
begin
    insert into tax_admin_activity_log (
        actor_id, actor_name, action_type, resource_type, resource_id,
        description, metadata, ip_address, user_agent
    ) values (
        p_actor_id, p_actor_name, p_action_type, p_resource_type, p_resource_id,
        p_description, p_metadata, p_ip_address, p_user_agent
    ) returning id into log_id;
    
    return log_id;
end;
$$ language plpgsql;

-- Function to create alerts
create or replace function create_tax_admin_alert(
    p_type text,
    p_severity text,
    p_title text,
    p_message text,
    p_source_type text,
    p_source_id text default null,
    p_metadata jsonb default null,
    p_due_date timestamptz default null
) returns uuid as $$
declare
    alert_id uuid;
begin
    insert into tax_admin_alerts (
        type, severity, title, message, source_type, source_id, metadata, due_date
    ) values (
        p_type, p_severity, p_title, p_message, p_source_type, p_source_id, p_metadata, p_due_date
    ) returning id into alert_id;
    
    return alert_id;
end;
$$ language plpgsql;

-- Function to update provider health
create or replace function record_provider_health_check(
    p_provider_name text,
    p_check_type text,
    p_status text,
    p_response_time_ms integer default null,
    p_error_message text default null
) returns uuid as $$
declare
    check_id uuid;
begin
    insert into tax_provider_health_checks (
        provider_name, check_type, status, response_time_ms, error_message
    ) values (
        p_provider_name, p_check_type, p_status, p_response_time_ms, p_error_message
    ) returning id into check_id;
    
    -- Clean up old health checks (keep last 24 hours)
    delete from tax_provider_health_checks 
    where provider_name = p_provider_name 
    and checked_at < now() - interval '24 hours';
    
    return check_id;
end;
$$ language plpgsql;

-- Triggers for automatic timestamp updates
create or replace function update_updated_at_tax_admin()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger tr_tax_admin_roles_updated_at
    before update on tax_admin_roles
    for each row execute function update_updated_at_tax_admin();

create trigger tr_tax_filing_approvals_updated_at
    before update on tax_filing_approvals
    for each row execute function update_updated_at_tax_admin();

create trigger tr_tax_admin_dashboard_config_updated_at
    before update on tax_admin_dashboard_config
    for each row execute function update_updated_at_tax_admin();

-- Data retention policies
create or replace function cleanup_tax_admin_data() returns void as $$
begin
    -- Clean up old activity logs (keep 2 years)
    delete from tax_admin_activity_log 
    where timestamp < now() - interval '2 years';
    
    -- Clean up resolved alerts (keep 6 months)
    delete from tax_admin_alerts 
    where resolved = true 
    and resolved_at < now() - interval '6 months';
    
    -- Clean up expired reports (keep 30 days after expiry)
    delete from tax_admin_reports 
    where expires_at < now() - interval '30 days';
    
    -- Clean up old health checks (keep 7 days)
    delete from tax_provider_health_checks 
    where checked_at < now() - interval '7 days';
    
    raise notice 'Completed cleanup of old tax admin data';
end;
$$ language plpgsql;

-- Comments for documentation
comment on table tax_admin_roles is 'Role definitions for tax admin system access control';
comment on table tax_admin_user_roles is 'User role assignments with expiration support';
comment on table tax_admin_activity_log is 'Comprehensive audit log of all admin actions';
comment on table tax_admin_alerts is 'System alerts requiring admin attention';
comment on table tax_filing_approvals is 'Approval workflow for tax filings and remittances';
comment on table tax_admin_reports is 'Generated report tracking with download metrics';
comment on table tax_admin_dashboard_config is 'User-customizable dashboard widget configuration';
comment on table tax_provider_health_checks is 'Provider health monitoring and status checks';
comment on table tax_nexus_alerts is 'Economic nexus threshold alerts by state';

comment on view v_tax_admin_user_permissions is 'Active user permissions aggregated from role assignments';
comment on view v_tax_admin_pending_actions is 'All pending actions requiring admin attention';
comment on view v_tax_admin_dashboard_metrics is 'Key metrics for admin dashboard display';
comment on view v_tax_provider_health_summary is 'Provider health status summary for monitoring';