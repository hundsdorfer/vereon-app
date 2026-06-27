select
  tm.id as membership_id,
  tm.team_id,
  t.name as team_name,
  tm.user_id,
  u.email,
  tm.created_at
from public.team_memberships tm
join public.teams t on t.id = tm.team_id
join auth.users u on u.id = tm.user_id
order by tm.created_at desc
limit 10;