-- Migration 011: Cross-Platform Tax Integration
-- Supports normalized transaction processing, platform adapters, and monitoring

-- Platform configuration and status tracking
create table if not exists tax_platform_configs (
    id uuid primary key default gen_random_uuid(),
    platform_name text unique not null,
    display_name text not null,
    api_base_url text,
    webhook_endpoint text not null,
    enabled boolean not null default true,
    rate_limit_per_minute integer not null default 100,
    burst_limit integer not null default 10,
    product_mappings jsonb not null default '[]',
    custom_fields jsonb not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Normalized transaction storage from all platforms
create table if not exists tax_normalized_transactions (
    id text primary key, -- Platform-prefixed ID like 'fanz_12345'
    platform text not null,
    external_id text not null,
    user_id text not null,
    creator_id text,
    
    -- Transaction details
    transaction_type text not null,
    transaction_status text not null,
    currency text not null default 'USD',
    
    -- Amounts
    gross_amount numeric(18,2) not null,
    platform_fee_amount numeric(18,2) not null default 0,
    creator_earnings numeric(18,2) not null default 0,
    net_amount numeric(18,2) not null,
    
    -- Tax fields
    tax_category text not null,
    taxable_amount numeric(18,2) not null,
    tax_amount numeric(18,2) not null default 0,
    tax_exempt boolean not null default false,
    exemption_reason text,
    
    -- Addresses
    billing_address jsonb,
    shipping_address jsonb,
    ip_geolocation jsonb,
    
    -- Timestamps
    created_at timestamptz not null,
    captured_at timestamptz,
    settled_at timestamptz,
    
    -- Metadata
    metadata jsonb not null default '{}',
    
    -- Audit
    imported_at timestamptz not null default now(),
    last_updated_at timestamptz not null default now()
);

-- Transaction line items
create table if not exists tax_normalized_transaction_items (
    id uuid primary key default gen_random_uuid(),
    transaction_id text not null references tax_normalized_transactions(id),
    line_item_id text not null,
    sku text not null,
    product_name text not null,
    product_type text not null,
    tax_category text not null,
    quantity numeric(18,6) not null default 1,
    unit_price numeric(18,6) not null,
    total_amount numeric(18,2) not null,
    taxable_amount numeric(18,2) not null,
    tax_amount numeric(18,2) not null default 0,
    metadata jsonb not null default '{}'
);

-- Tax event processing queue
create table if not exists tax_event_queue (
    id uuid primary key default gen_random_uuid(),
    event_id text unique not null,
    event_type text not null,
    platform text not null,
    transaction_id text not null,
    event_timestamp timestamptz not null,
    
    -- Processing status
    status text not null default 'pending' check (status in ('pending', 'processing', 'processed', 'failed', 'retrying')),
    attempts integer not null default 0,
    last_attempt_at timestamptz,
    error_message text,
    
    -- Event data
    event_data jsonb not null,
    previous_state jsonb,
    
    created_at timestamptz not null default now(),
    processed_at timestamptz
);

-- Platform sync status tracking
create table if not exists tax_platform_sync_status (
    id uuid primary key default gen_random_uuid(),
    platform_name text not null,
    sync_type text not null check (sync_type in ('full', 'incremental', 'backfill', 'webhook')),
    started_at timestamptz not null,
    completed_at timestamptz,
    status text not null check (status in ('running', 'completed', 'failed', 'cancelled')),
    
    -- Sync metrics
    transactions_processed integer not null default 0,
    transactions_skipped integer not null default 0,
    events_generated integer not null default 0,
    errors_encountered integer not null default 0,
    
    -- Date range
    sync_from_date timestamptz,
    sync_to_date timestamptz,
    
    -- Error details
    error_summary text,
    error_details jsonb,
    
    created_at timestamptz not null default now()
);

-- Product mapping overrides (for platforms not in config)
create table if not exists tax_platform_product_mappings (
    id uuid primary key default gen_random_uuid(),
    platform_name text not null,
    platform_sku text not null,
    product_name text not null,
    product_type text not null,
    tax_category text not null,
    default_price numeric(18,2),
    active boolean not null default true,
    metadata jsonb not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    unique(platform_name, platform_sku)
);

-- Cross-platform tax coverage tracking
create table if not exists tax_platform_coverage_stats (
    id uuid primary key default gen_random_uuid(),
    platform_name text not null,
    stat_date date not null,
    
    -- Transaction counts
    total_transactions integer not null default 0,
    tax_calculated_transactions integer not null default 0,
    tax_exempt_transactions integer not null default 0,
    failed_tax_calculations integer not null default 0,
    
    -- Revenue metrics
    total_revenue numeric(18,2) not null default 0,
    taxable_revenue numeric(18,2) not null default 0,
    tax_collected numeric(18,2) not null default 0,
    
    -- Coverage percentages
    tax_coverage_percentage numeric(5,2) not null default 0,
    address_validation_percentage numeric(5,2) not null default 0,
    
    created_at timestamptz not null default now(),
    
    unique(platform_name, stat_date)
);

-- Indexes for performance
create index if not exists idx_tax_normalized_transactions_platform 
    on tax_normalized_transactions(platform);
create index if not exists idx_tax_normalized_transactions_created_at 
    on tax_normalized_transactions(created_at desc);
create index if not exists idx_tax_normalized_transactions_captured_at 
    on tax_normalized_transactions(captured_at desc) where captured_at is not null;
create index if not exists idx_tax_normalized_transactions_user_id 
    on tax_normalized_transactions(user_id);
create index if not exists idx_tax_normalized_transactions_creator_id 
    on tax_normalized_transactions(creator_id) where creator_id is not null;
create index if not exists idx_tax_normalized_transactions_external_platform 
    on tax_normalized_transactions(platform, external_id);

create index if not exists idx_tax_normalized_transaction_items_transaction 
    on tax_normalized_transaction_items(transaction_id);
create index if not exists idx_tax_normalized_transaction_items_sku 
    on tax_normalized_transaction_items(sku);
create index if not exists idx_tax_normalized_transaction_items_tax_category 
    on tax_normalized_transaction_items(tax_category);

create index if not exists idx_tax_event_queue_status 
    on tax_event_queue(status, created_at);
create index if not exists idx_tax_event_queue_platform 
    on tax_event_queue(platform, event_type);
create index if not exists idx_tax_event_queue_processing 
    on tax_event_queue(status, last_attempt_at) where status in ('pending', 'retrying');

create index if not exists idx_tax_platform_sync_status_platform 
    on tax_platform_sync_status(platform_name, started_at desc);
create index if not exists idx_tax_platform_sync_status_running 
    on tax_platform_sync_status(status, started_at) where status = 'running';

create index if not exists idx_tax_platform_product_mappings_platform_sku 
    on tax_platform_product_mappings(platform_name, platform_sku);
create index if not exists idx_tax_platform_product_mappings_active 
    on tax_platform_product_mappings(active, platform_name);

create index if not exists idx_tax_platform_coverage_stats_platform_date 
    on tax_platform_coverage_stats(platform_name, stat_date desc);

-- Views for monitoring and reporting
create or replace view v_cross_platform_transaction_summary as
select 
    platform,
    count(*) as total_transactions,
    count(*) filter (where transaction_status = 'captured') as captured_transactions,
    count(*) filter (where tax_exempt = false) as taxable_transactions,
    sum(gross_amount) as total_gross_revenue,
    sum(taxable_amount) as total_taxable_revenue,
    sum(tax_amount) as total_tax_collected,
    avg(tax_amount / nullif(taxable_amount, 0) * 100) as avg_tax_rate_percent,
    max(created_at) as latest_transaction,
    date_trunc('day', max(created_at)) as latest_transaction_date
from tax_normalized_transactions
where created_at >= current_date - interval '30 days'
group by platform
order by total_gross_revenue desc;

create or replace view v_tax_event_processing_status as
select 
    platform,
    event_type,
    count(*) as total_events,
    count(*) filter (where status = 'processed') as processed_events,
    count(*) filter (where status = 'failed') as failed_events,
    count(*) filter (where status = 'pending') as pending_events,
    round(count(*) filter (where status = 'processed') * 100.0 / count(*), 2) as success_rate_percent,
    avg(extract(epoch from (processed_at - created_at))) filter (where processed_at is not null) as avg_processing_time_seconds,
    max(created_at) as latest_event_time
from tax_event_queue
where created_at >= current_date - interval '7 days'
group by platform, event_type
order by platform, total_events desc;

create or replace view v_platform_sync_health as
select 
    pc.platform_name,
    pc.display_name,
    pc.enabled,
    pc.rate_limit_per_minute,
    ss.last_successful_sync,
    ss.last_sync_transactions,
    ss.total_syncs_today,
    ss.failed_syncs_today,
    case 
        when pc.enabled = false then 'disabled'
        when ss.last_successful_sync is null then 'never_synced'
        when ss.last_successful_sync < current_timestamp - interval '4 hours' then 'stale'
        when ss.failed_syncs_today > 3 then 'unhealthy'
        else 'healthy'
    end as health_status
from tax_platform_configs pc
left join (
    select 
        platform_name,
        max(completed_at) filter (where status = 'completed') as last_successful_sync,
        sum(transactions_processed) filter (
            where status = 'completed' 
            and completed_at > current_date
        ) as last_sync_transactions,
        count(*) filter (
            where started_at > current_date
        ) as total_syncs_today,
        count(*) filter (
            where status = 'failed' 
            and started_at > current_date
        ) as failed_syncs_today
    from tax_platform_sync_status
    group by platform_name
) ss on pc.platform_name = ss.platform_name
order by pc.platform_name;

create or replace view v_tax_coverage_by_platform as
select 
    platform,
    count(*) as total_transactions,
    count(*) filter (where tax_amount > 0 or tax_exempt = true) as tax_processed_transactions,
    count(*) filter (where billing_address is not null) as transactions_with_billing_address,
    count(*) filter (where shipping_address is not null) as transactions_with_shipping_address,
    round(
        count(*) filter (where tax_amount > 0 or tax_exempt = true) * 100.0 / count(*), 
        2
    ) as tax_processing_coverage_percent,
    round(
        count(*) filter (where billing_address is not null) * 100.0 / count(*), 
        2
    ) as billing_address_coverage_percent
from tax_normalized_transactions
where created_at >= current_date - interval '7 days'
group by platform
order by tax_processing_coverage_percent desc;

-- Seed default platform configurations
insert into tax_platform_configs (platform_name, display_name, webhook_endpoint, product_mappings) values
('fanz', 'FANZ Core', '/webhooks/tax/fanz', 
 '[
   {"platformSku": "SUB_MONTHLY", "productName": "Monthly Subscription", "productType": "subscription", "taxCategory": "DIGITAL_SUBSCRIPTION"},
   {"platformSku": "TIP", "productName": "Creator Tip", "productType": "tip", "taxCategory": "VOLUNTARY_TIP"}
 ]'::jsonb),
('fanztube', 'FanzTube', '/webhooks/tax/fanztube',
 '[
   {"platformSku": "LIVE_STREAM", "productName": "Live Stream Access", "productType": "streaming", "taxCategory": "DIGITAL_STREAM"},
   {"platformSku": "VIDEO_PPV", "productName": "Pay-Per-View Video", "productType": "video", "taxCategory": "DIGITAL_STREAM"}
 ]'::jsonb),
('fanzcommerce', 'FanzCommerce', '/webhooks/tax/fanzcommerce',
 '[
   {"platformSku": "PHYSICAL_MERCH", "productName": "Physical Merchandise", "productType": "physical", "taxCategory": "PHYSICAL_GOODS"},
   {"platformSku": "DIGITAL_DOWNLOAD", "productName": "Digital Download", "productType": "digital", "taxCategory": "DIGITAL_DOWNLOAD"}
 ]'::jsonb),
('fanzspicyai', 'FanzSpicyAI', '/webhooks/tax/fanzspicyai',
 '[
   {"platformSku": "AI_CREDITS", "productName": "AI Chat Credits", "productType": "credits", "taxCategory": "DIGITAL_SUBSCRIPTION"},
   {"platformSku": "AI_PREMIUM", "productName": "AI Premium Features", "productType": "subscription", "taxCategory": "DIGITAL_SUBSCRIPTION"}
 ]'::jsonb),
('starzcards', 'StarzCards', '/webhooks/tax/starzcards',
 '[
   {"platformSku": "DIGITAL_CARD", "productName": "Digital Trading Card", "productType": "digital", "taxCategory": "DIGITAL_DOWNLOAD"},
   {"platformSku": "PHYSICAL_CARD", "productName": "Physical Trading Card", "productType": "physical", "taxCategory": "PHYSICAL_GOODS"}
 ]'::jsonb),
('clubcentral', 'ClubCentral', '/webhooks/tax/clubcentral',
 '[
   {"platformSku": "CLUB_MEMBERSHIP", "productName": "Club Membership", "productType": "membership", "taxCategory": "MEMBERSHIP_FEE"},
   {"platformSku": "CLUB_EVENT", "productName": "Club Event Access", "productType": "event", "taxCategory": "DIGITAL_SUBSCRIPTION"}
 ]'::jsonb)
on conflict (platform_name) do nothing;

-- Functions for cross-platform integration management
create or replace function upsert_normalized_transaction(
    p_id text,
    p_platform text,
    p_external_id text,
    p_user_id text,
    p_creator_id text,
    p_transaction_type text,
    p_transaction_status text,
    p_currency text,
    p_gross_amount numeric,
    p_platform_fee_amount numeric,
    p_creator_earnings numeric,
    p_net_amount numeric,
    p_tax_category text,
    p_taxable_amount numeric,
    p_tax_amount numeric,
    p_tax_exempt boolean,
    p_exemption_reason text,
    p_billing_address jsonb,
    p_shipping_address jsonb,
    p_ip_geolocation jsonb,
    p_created_at timestamptz,
    p_captured_at timestamptz,
    p_settled_at timestamptz,
    p_metadata jsonb
) returns void as $$
begin
    insert into tax_normalized_transactions (
        id, platform, external_id, user_id, creator_id,
        transaction_type, transaction_status, currency,
        gross_amount, platform_fee_amount, creator_earnings, net_amount,
        tax_category, taxable_amount, tax_amount, tax_exempt, exemption_reason,
        billing_address, shipping_address, ip_geolocation,
        created_at, captured_at, settled_at, metadata
    ) values (
        p_id, p_platform, p_external_id, p_user_id, p_creator_id,
        p_transaction_type, p_transaction_status, p_currency,
        p_gross_amount, p_platform_fee_amount, p_creator_earnings, p_net_amount,
        p_tax_category, p_taxable_amount, p_tax_amount, p_tax_exempt, p_exemption_reason,
        p_billing_address, p_shipping_address, p_ip_geolocation,
        p_created_at, p_captured_at, p_settled_at, p_metadata
    )
    on conflict (id) do update set
        transaction_status = excluded.transaction_status,
        tax_amount = excluded.tax_amount,
        captured_at = excluded.captured_at,
        settled_at = excluded.settled_at,
        metadata = excluded.metadata,
        last_updated_at = now();
end;
$$ language plpgsql;

create or replace function queue_tax_event(
    p_event_id text,
    p_event_type text,
    p_platform text,
    p_transaction_id text,
    p_event_timestamp timestamptz,
    p_event_data jsonb,
    p_previous_state jsonb default null
) returns uuid as $$
declare
    queue_id uuid;
begin
    insert into tax_event_queue (
        event_id, event_type, platform, transaction_id, event_timestamp,
        event_data, previous_state
    ) values (
        p_event_id, p_event_type, p_platform, p_transaction_id, p_event_timestamp,
        p_event_data, p_previous_state
    )
    on conflict (event_id) do nothing
    returning id into queue_id;
    
    return queue_id;
end;
$$ language plpgsql;

create or replace function update_event_processing_status(
    p_event_id text,
    p_status text,
    p_error_message text default null
) returns void as $$
begin
    update tax_event_queue
    set 
        status = p_status,
        attempts = attempts + 1,
        last_attempt_at = now(),
        error_message = coalesce(p_error_message, error_message),
        processed_at = case when p_status = 'processed' then now() else processed_at end
    where event_id = p_event_id;
end;
$$ language plpgsql;

create or replace function start_platform_sync(
    p_platform_name text,
    p_sync_type text,
    p_sync_from_date timestamptz default null,
    p_sync_to_date timestamptz default null
) returns uuid as $$
declare
    sync_id uuid;
begin
    insert into tax_platform_sync_status (
        platform_name, sync_type, started_at, status,
        sync_from_date, sync_to_date
    ) values (
        p_platform_name, p_sync_type, now(), 'running',
        p_sync_from_date, p_sync_to_date
    )
    returning id into sync_id;
    
    return sync_id;
end;
$$ language plpgsql;

create or replace function complete_platform_sync(
    p_sync_id uuid,
    p_status text,
    p_transactions_processed integer default 0,
    p_transactions_skipped integer default 0,
    p_events_generated integer default 0,
    p_errors_encountered integer default 0,
    p_error_summary text default null,
    p_error_details jsonb default null
) returns void as $$
begin
    update tax_platform_sync_status
    set 
        completed_at = now(),
        status = p_status,
        transactions_processed = p_transactions_processed,
        transactions_skipped = p_transactions_skipped,
        events_generated = p_events_generated,
        errors_encountered = p_errors_encountered,
        error_summary = p_error_summary,
        error_details = p_error_details
    where id = p_sync_id;
end;
$$ language plpgsql;

-- Function to update daily coverage stats
create or replace function update_platform_coverage_stats(p_stat_date date default current_date) returns void as $$
declare
    platform_rec record;
begin
    for platform_rec in 
        select distinct platform from tax_normalized_transactions 
        where created_at >= p_stat_date and created_at < p_stat_date + interval '1 day'
    loop
        insert into tax_platform_coverage_stats (
            platform_name, stat_date,
            total_transactions, tax_calculated_transactions, tax_exempt_transactions,
            failed_tax_calculations, total_revenue, taxable_revenue, tax_collected,
            tax_coverage_percentage, address_validation_percentage
        )
        select 
            platform_rec.platform,
            p_stat_date,
            count(*),
            count(*) filter (where tax_amount > 0),
            count(*) filter (where tax_exempt = true),
            count(*) filter (where tax_amount = 0 and tax_exempt = false),
            sum(gross_amount),
            sum(taxable_amount),
            sum(tax_amount),
            round(count(*) filter (where tax_amount > 0 or tax_exempt = true) * 100.0 / count(*), 2),
            round(count(*) filter (where billing_address is not null) * 100.0 / count(*), 2)
        from tax_normalized_transactions
        where platform = platform_rec.platform
        and created_at >= p_stat_date 
        and created_at < p_stat_date + interval '1 day'
        on conflict (platform_name, stat_date) do update set
            total_transactions = excluded.total_transactions,
            tax_calculated_transactions = excluded.tax_calculated_transactions,
            tax_exempt_transactions = excluded.tax_exempt_transactions,
            failed_tax_calculations = excluded.failed_tax_calculations,
            total_revenue = excluded.total_revenue,
            taxable_revenue = excluded.taxable_revenue,
            tax_collected = excluded.tax_collected,
            tax_coverage_percentage = excluded.tax_coverage_percentage,
            address_validation_percentage = excluded.address_validation_percentage;
    end loop;
end;
$$ language plpgsql;

-- Triggers for automatic timestamp updates
create or replace function update_cross_platform_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger tr_tax_platform_configs_updated_at
    before update on tax_platform_configs
    for each row execute function update_cross_platform_updated_at();

create trigger tr_tax_platform_product_mappings_updated_at
    before update on tax_platform_product_mappings
    for each row execute function update_cross_platform_updated_at();

-- Data retention and cleanup
create or replace function cleanup_cross_platform_data() returns void as $$
begin
    -- Clean up old processed events (keep 30 days)
    delete from tax_event_queue 
    where status = 'processed' 
    and processed_at < now() - interval '30 days';
    
    -- Clean up old failed events (keep 7 days)
    delete from tax_event_queue 
    where status = 'failed' 
    and created_at < now() - interval '7 days'
    and attempts >= 5;
    
    -- Clean up old sync status records (keep 90 days)
    delete from tax_platform_sync_status 
    where created_at < now() - interval '90 days';
    
    -- Archive old coverage stats (keep 1 year)
    delete from tax_platform_coverage_stats 
    where stat_date < current_date - interval '1 year';
    
    raise notice 'Completed cleanup of cross-platform data';
end;
$$ language plpgsql;

-- Comments for documentation
comment on table tax_platform_configs is 'Configuration for each FANZ platform integration';
comment on table tax_normalized_transactions is 'Normalized transaction data from all platforms';
comment on table tax_normalized_transaction_items is 'Line items for normalized transactions';
comment on table tax_event_queue is 'Queue for processing tax events from all platforms';
comment on table tax_platform_sync_status is 'Status tracking for platform data synchronization';
comment on table tax_platform_product_mappings is 'Product SKU to tax category mappings per platform';
comment on table tax_platform_coverage_stats is 'Daily statistics on tax processing coverage by platform';

comment on view v_cross_platform_transaction_summary is 'Summary of transactions and tax collection across all platforms';
comment on view v_tax_event_processing_status is 'Status and success rates for tax event processing';
comment on view v_platform_sync_health is 'Health status of each platform integration';
comment on view v_tax_coverage_by_platform is 'Tax processing coverage percentages by platform';