alter table public.institutional_profiles
  alter column cnpj drop not null,
  add constraint institutional_profiles_cnpj_required check (cnpj is not null or (kind = 'escolinha' and verification_status = 'pending'));
