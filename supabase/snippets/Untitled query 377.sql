select
  t.name as team_name,
  u.email,
  r.key as role_key,
  tm.created_at as membership_created_at
from public.team_member_roles tmr
join public.team_memberships tm on tm.id = tmr.team_membership_id
join public.teams t on t.id = tm.team_id
join public.roles r on r.id = tmr.role_id
join auth.users u on u.id = tm.user_id
order by tm.created_at desc
limit 20;