-- Respaldo si los triggers en public.products no están aplicados: registra cambios de producto desde la app.

create or replace function public.record_product_change_activity(
  p_product_id uuid,
  p_before jsonb,
  p_after jsonb
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_business_id uuid;
  v_email text;
  v_parts text[] := array[]::text[];
  v_summary text;
  old_price numeric;
  new_price numeric;
  old_cost numeric;
  new_cost numeric;
  old_stock int;
  new_stock int;
  old_sd numeric;
  new_sd numeric;
  old_name text;
  new_name text;
  old_active boolean;
  new_active boolean;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select business_id into v_business_id from public.products where id = p_product_id;
  if not found then
    raise exception 'not_found';
  end if;
  if not public.is_business_member(v_business_id) then
    raise exception 'not_authorized';
  end if;

  -- Evitar duplicado si el trigger ya insertó hace instantes
  if exists (
    select 1 from public.business_activity_events e
    where e.entity_id = p_product_id
      and e.kind = 'product_update'
      and e.created_at > now() - interval '2 seconds'
  ) then
    return;
  end if;

  old_price := coalesce((p_before->>'price')::numeric, 0);
  new_price := coalesce((p_after->>'price')::numeric, 0);
  old_cost := coalesce((p_before->>'cost')::numeric, 0);
  new_cost := coalesce((p_after->>'cost')::numeric, 0);
  old_stock := coalesce((p_before->>'stock')::int, 0);
  new_stock := coalesce((p_after->>'stock')::int, 0);
  old_sd := coalesce((p_before->>'stock_decimal')::numeric, 0);
  new_sd := coalesce((p_after->>'stock_decimal')::numeric, 0);
  old_name := coalesce(p_before->>'name', '');
  new_name := coalesce(p_after->>'name', '');
  old_active := case when p_before->'active' is null then true else (p_before->>'active')::boolean end;
  new_active := case when p_after->'active' is null then true else (p_after->>'active')::boolean end;

  if old_price is distinct from new_price then
    v_parts := array_append(v_parts,
      'Precio ' || to_char(old_price, 'FM999999990.99') || ' → ' || to_char(new_price, 'FM999999990.99'));
  end if;
  if old_cost is distinct from new_cost then
    v_parts := array_append(v_parts, 'Costo actualizado');
  end if;
  if old_stock is distinct from new_stock or old_sd is distinct from new_sd then
    v_parts := array_append(v_parts,
      'Stock ' || coalesce(old_stock::text, '0') || '/' || coalesce(to_char(old_sd, 'FM999999990.999'), '0')
      || ' → ' || coalesce(new_stock::text, '0') || '/' || coalesce(to_char(new_sd, 'FM999999990.999'), '0'));
  end if;
  if old_name is distinct from new_name then
    v_parts := array_append(v_parts, 'Nombre');
  end if;
  if old_active is distinct from new_active then
    v_parts := array_append(v_parts, case when new_active then 'Activó' else 'Desactivó' end);
  end if;

  if array_length(v_parts, 1) is null or array_length(v_parts, 1) = 0 then
    return;
  end if;

  v_email := public._activity_actor_email(auth.uid());
  v_summary := 'Producto · ' || left(new_name, 60) || ' · ' || array_to_string(v_parts, ' · ');

  insert into public.business_activity_events (
    business_id, user_id, kind, summary, metadata, entity_type, entity_id
  )
  values (
    v_business_id,
    auth.uid(),
    'product_update',
    left(v_summary, 500),
    jsonb_build_object(
      'product_name', new_name,
      'changes', to_jsonb(v_parts),
      'old_price', old_price,
      'new_price', new_price,
      'old_stock', old_stock,
      'new_stock', new_stock,
      'old_stock_decimal', old_sd,
      'new_stock_decimal', new_sd,
      'actor_email', nullif(v_email, ''),
      'source', 'record_product_change_activity'
    ),
    'product',
    p_product_id
  );
end;
$$;

revoke all on function public.record_product_change_activity(uuid, jsonb, jsonb) from public;
grant execute on function public.record_product_change_activity(uuid, jsonb, jsonb) to authenticated;
