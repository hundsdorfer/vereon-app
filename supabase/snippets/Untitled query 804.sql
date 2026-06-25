select r.key
from public.club_memberships cm
join public.club_member_roles cmr on cmr.club_membership_id = cm.id
join public.roles r on r.id = cmr.role_id
where cm.club_id = (
  select id from public.clubs where slug = 'fc-testverein'
);