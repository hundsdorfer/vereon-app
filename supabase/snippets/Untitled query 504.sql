select key, scope
from public.roles
where key in (
  'super_admin',
  'club_admin',
  'youth_director',
  'team_owner',
  'head_coach',
  'assistant_coach',
  'goalkeeper_coach',
  'team_manager',
  'player',
  'guardian'
)
order by scope, key;