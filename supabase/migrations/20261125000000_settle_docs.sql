-- 서류 보관함에 「정산 파일 서류」 보관함 추가 + 보관함 안의 하위 폴더(날짜별)
alter table public.work_docs drop constraint if exists work_docs_box_check;
alter table public.work_docs add constraint work_docs_box_check check (box in ('mgmt','sales','design','logistics','tech','settle'));
alter table public.work_docs add column if not exists folder text;  -- 하위 폴더 이름. 정산 보관함은 날짜(YYYY-MM-DD)
create index if not exists work_docs_folder_idx on public.work_docs (box, folder, created_at desc) where deleted_at is null;
