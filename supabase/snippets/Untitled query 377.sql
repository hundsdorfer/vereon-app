select
  id,
  email,
  full_name,
  first_name,
  last_name,
  phone,
  date_of_birth,
  onboarding_role,
  terms_accepted_at,
  privacy_accepted_at,
  created_at
from public.profiles
order by created_at desc
limit 10;