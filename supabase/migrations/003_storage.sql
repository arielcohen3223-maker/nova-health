-- Supabase Storage for blood test PDFs

insert into storage.buckets (id, name, public)
values ('blood-tests', 'blood-tests', false)
on conflict (id) do nothing;

create policy "Users upload own blood tests"
  on storage.objects for insert
  with check (
    bucket_id = 'blood-tests'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users read own blood tests"
  on storage.objects for select
  using (
    bucket_id = 'blood-tests'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own blood tests"
  on storage.objects for delete
  using (
    bucket_id = 'blood-tests'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
