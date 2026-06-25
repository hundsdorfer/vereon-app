select scope, count(*)
from public.roles
group by scope
order by scope;
