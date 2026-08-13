create index if not exists atlas_bookmarks_content_idx on public.atlas_bookmarks(content_id);
create index if not exists atlas_progress_content_idx on public.atlas_progress(content_id);
create index if not exists atlas_acknowledgements_content_idx on public.atlas_acknowledgements(content_id);
create index if not exists atlas_slack_deliveries_content_idx on public.atlas_slack_deliveries(content_id);
create index if not exists atlas_slack_deliveries_requester_idx on public.atlas_slack_deliveries(requested_by);
