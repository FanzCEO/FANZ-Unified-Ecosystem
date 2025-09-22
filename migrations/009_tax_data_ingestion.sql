-- Migration 009: Tax Data Ingestion Connectors
-- Supports multi-provider tax rate and rule sourcing with audit trails

-- Provider configurations table
create table if not exists tax_data_providers (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    type text not null check (type in ('commercial_a', 'commercial_b', 'internal')),
    enabled boolean not null default true,
    priority integer not null default 50,
    api_base_url text,
    config_json jsonb not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Sync execution results
create table if not exists tax_data_sync_results (
    id uuid primary key default gen_random_uuid(),
    provider_id uuid not null references tax_data_providers(id),
    provider_name text not null,
    sync_type text not null check (sync_type in ('nightly', 'on_demand', 'reconciliation')),
    started_at timestamptz not null,
    completed_at timestamptz not null,
    success boolean not null,
    error_message text,
    stats jsonb not null default '{}',
    created_at timestamptz not null default now()
);

-- Rate change tracking from providers
create table if not exists tax_rate_changes (
    id uuid primary key default gen_random_uuid(),
    provider_name text not null,
    jurisdiction_id uuid references tax_jurisdiction(id),
    product_category_id uuid references tax_product_category(id),
    old_rate numeric(7,6),
    new_rate numeric(7,6) not null,
    effective_date date not null,
    change_reason text,
    detected_at timestamptz not null default now(),
    processed boolean not null default false
);

-- Provider reconciliation discrepancies
create table if not exists tax_provider_discrepancies (
    id uuid primary key default gen_random_uuid(),
    jurisdiction_id uuid references tax_jurisdiction(id),
    product_category_id uuid references tax_product_category(id),
    provider1_name text not null,
    provider1_rate numeric(7,6),
    provider2_name text not null,
    provider2_rate numeric(7,6),
    rate_difference numeric(7,6) not null,
    detected_at timestamptz not null default now(),
    resolved boolean not null default false,
    resolution_notes text
);

-- Data source attribution for rates and rules
alter table tax_rate add column if not exists provider_source text;
alter table tax_rate add column if not exists provider_sync_id uuid references tax_data_sync_results(id);
alter table tax_rate add column if not exists last_provider_update timestamptz;

alter table tax_rule add column if not exists provider_source text;
alter table tax_rule add column if not exists provider_sync_id uuid references tax_data_sync_results(id);
alter table tax_rule add column if not exists last_provider_update timestamptz;

-- Indexes for performance
create index if not exists idx_tax_data_sync_results_provider_type 
    on tax_data_sync_results(provider_name, sync_type);
create index if not exists idx_tax_data_sync_results_started_at 
    on tax_data_sync_results(started_at);
create index if not exists idx_tax_data_sync_results_success 
    on tax_data_sync_results(success, started_at);

create index if not exists idx_tax_rate_changes_effective_date 
    on tax_rate_changes(effective_date);
create index if not exists idx_tax_rate_changes_processed 
    on tax_rate_changes(processed, detected_at);

create index if not exists idx_tax_provider_discrepancies_resolved 
    on tax_provider_discrepancies(resolved, detected_at);

create index if not exists idx_tax_rate_provider_source 
    on tax_rate(provider_source);
create index if not exists idx_tax_rule_provider_source 
    on tax_rule(provider_source);

-- Views for monitoring and reporting
create or replace view v_provider_sync_summary as
select 
    provider_name,
    count(*) as total_syncs,
    count(*) filter (where success = true) as successful_syncs,
    count(*) filter (where success = false) as failed_syncs,
    round(count(*) filter (where success = true) * 100.0 / count(*), 2) as success_rate_pct,
    max(completed_at) as last_sync_at,
    avg(extract(epoch from (completed_at - started_at))) as avg_duration_seconds
from tax_data_sync_results
group by provider_name
order by last_sync_at desc;

create or replace view v_provider_health_status as
select 
    p.name,
    p.type,
    p.enabled,
    p.priority,
    s.last_sync_at,
    s.success_rate_pct,
    case 
        when p.enabled = false then 'disabled'
        when s.last_sync_at is null then 'never_synced'
        when s.last_sync_at < now() - interval '2 days' then 'stale'
        when s.success_rate_pct < 90 then 'unhealthy'
        else 'healthy'
    end as health_status
from tax_data_providers p
left join v_provider_sync_summary s on p.name = s.provider_name
order by p.priority desc, p.name;

create or replace view v_unresolved_rate_discrepancies as
select 
    d.id,
    j.name as jurisdiction_name,
    j.state_code,
    pc.name as product_category,
    d.provider1_name,
    d.provider1_rate,
    d.provider2_name,
    d.provider2_rate,
    d.rate_difference,
    d.detected_at,
    extract(days from now() - d.detected_at) as days_since_detected
from tax_provider_discrepancies d
left join tax_jurisdiction j on d.jurisdiction_id = j.id
left join tax_product_category pc on d.product_category_id = pc.id
where d.resolved = false
order by d.rate_difference desc, d.detected_at;

create or replace view v_pending_rate_changes as
select 
    rc.id,
    rc.provider_name,
    j.name as jurisdiction_name,
    j.state_code,
    pc.name as product_category,
    rc.old_rate,
    rc.new_rate,
    rc.effective_date,
    rc.change_reason,
    rc.detected_at,
    case 
        when rc.effective_date > current_date then 'future'
        when rc.effective_date = current_date then 'today'
        else 'overdue'
    end as change_status
from tax_rate_changes rc
left join tax_jurisdiction j on rc.jurisdiction_id = j.id
left join tax_product_category pc on rc.product_category_id = pc.id
where rc.processed = false
order by rc.effective_date, rc.detected_at;

-- Seed data for providers
insert into tax_data_providers (name, type, enabled, priority, api_base_url, config_json) 
values 
    ('primary_commercial', 'commercial_a', true, 100, 
     'https://api.taxprovider-a.com', 
     '{"rate_limit": {"requests_per_minute": 1000, "burst_limit": 100}, "timeout_ms": 30000, "circuit_breaker": {"failure_threshold": 5, "recovery_timeout_ms": 60000}}'::jsonb),
    ('backup_commercial', 'commercial_b', false, 80, 
     'https://api.taxprovider-b.com', 
     '{"rate_limit": {"requests_per_minute": 500, "burst_limit": 50}, "timeout_ms": 45000, "circuit_breaker": {"failure_threshold": 3, "recovery_timeout_ms": 120000}}'::jsonb),
    ('internal_curated', 'internal', true, 60, 
     null, 
     '{"rate_limit": {"requests_per_minute": 10000, "burst_limit": 1000}, "timeout_ms": 5000, "circuit_breaker": {"failure_threshold": 10, "recovery_timeout_ms": 30000}}'::jsonb)
on conflict (name) do nothing;

-- Functions for sync management
create or replace function log_sync_result(
    p_provider_name text,
    p_sync_type text,
    p_started_at timestamptz,
    p_completed_at timestamptz,
    p_success boolean,
    p_error_message text default null,
    p_stats jsonb default '{}'::jsonb
) returns uuid as $$
declare
    provider_id uuid;
    sync_id uuid;
begin
    -- Get provider ID
    select id into provider_id 
    from tax_data_providers 
    where name = p_provider_name;
    
    if provider_id is null then
        raise exception 'Provider % not found', p_provider_name;
    end if;
    
    -- Insert sync result
    insert into tax_data_sync_results (
        provider_id, provider_name, sync_type, started_at, completed_at,
        success, error_message, stats
    ) values (
        provider_id, p_provider_name, p_sync_type, p_started_at, p_completed_at,
        p_success, p_error_message, p_stats
    ) returning id into sync_id;
    
    return sync_id;
end;
$$ language plpgsql;

create or replace function log_rate_change(
    p_provider_name text,
    p_jurisdiction_id uuid,
    p_product_category_id uuid,
    p_old_rate numeric,
    p_new_rate numeric,
    p_effective_date date,
    p_change_reason text default null
) returns uuid as $$
declare
    change_id uuid;
begin
    insert into tax_rate_changes (
        provider_name, jurisdiction_id, product_category_id,
        old_rate, new_rate, effective_date, change_reason
    ) values (
        p_provider_name, p_jurisdiction_id, p_product_category_id,
        p_old_rate, p_new_rate, p_effective_date, p_change_reason
    ) returning id into change_id;
    
    return change_id;
end;
$$ language plpgsql;

create or replace function log_provider_discrepancy(
    p_jurisdiction_id uuid,
    p_product_category_id uuid,
    p_provider1_name text,
    p_provider1_rate numeric,
    p_provider2_name text,
    p_provider2_rate numeric
) returns uuid as $$
declare
    discrepancy_id uuid;
    rate_diff numeric;
begin
    rate_diff := abs(p_provider1_rate - p_provider2_rate);
    
    insert into tax_provider_discrepancies (
        jurisdiction_id, product_category_id,
        provider1_name, provider1_rate,
        provider2_name, provider2_rate,
        rate_difference
    ) values (
        p_jurisdiction_id, p_product_category_id,
        p_provider1_name, p_provider1_rate,
        p_provider2_name, p_provider2_rate,
        rate_diff
    ) returning id into discrepancy_id;
    
    return discrepancy_id;
end;
$$ language plpgsql;

-- Triggers for automatic timestamp updates
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger tr_tax_data_providers_updated_at
    before update on tax_data_providers
    for each row execute function update_updated_at_column();

-- Data retention policy function
create or replace function cleanup_old_sync_data() returns void as $$
begin
    -- Keep sync results for 1 year
    delete from tax_data_sync_results 
    where created_at < now() - interval '1 year';
    
    -- Keep processed rate changes for 2 years, unprocessed indefinitely
    delete from tax_rate_changes 
    where processed = true 
    and detected_at < now() - interval '2 years';
    
    -- Keep resolved discrepancies for 6 months, unresolved indefinitely  
    delete from tax_provider_discrepancies 
    where resolved = true 
    and detected_at < now() - interval '6 months';
    
    raise notice 'Completed cleanup of old tax data sync records';
end;
$$ language plpgsql;

-- Comments for documentation
comment on table tax_data_providers is 'Configuration for external tax data providers (commercial APIs and internal sources)';
comment on table tax_data_sync_results is 'Audit log of provider sync executions with performance stats';
comment on table tax_rate_changes is 'Rate changes detected from providers, pending processing into tax_rate table';
comment on table tax_provider_discrepancies is 'Rate discrepancies found between providers during reconciliation';

comment on view v_provider_sync_summary is 'Provider sync performance summary for monitoring dashboards';
comment on view v_provider_health_status is 'Overall health assessment of each tax data provider';
comment on view v_unresolved_rate_discrepancies is 'Rate conflicts between providers requiring manual review';
comment on view v_pending_rate_changes is 'Rate changes awaiting processing, organized by urgency';