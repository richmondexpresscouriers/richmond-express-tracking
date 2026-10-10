-- Adds recoverable deletion without removing or changing existing jobs.
begin;
alter table public."Deliveries" add column if not exists deleted_at timestamptz;
-- Intersects with existing public read access; administrator access is unchanged.
create policy "Hide deleted deliveries from public tracking"
on public."Deliveries" as restrictive for select to anon
using (deleted_at is null);
commit;
