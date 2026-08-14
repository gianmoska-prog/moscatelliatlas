begin;

alter table public.profiles
  add column if not exists grammatical_gender text not null default 'neutral'
  check (grammatical_gender in ('masculine', 'feminine', 'neutral'));

comment on column public.profiles.grammatical_gender is
  'Presentation preference for gendered salutations; never used for authorization.';

update public.profiles
set grammatical_gender = 'masculine'
where lower(trim(display_name)) = 'gianluca';

update public.profiles
set grammatical_gender = 'feminine'
where lower(trim(display_name)) in ('gabriela', 'marcella');

commit;
