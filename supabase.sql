-- ============================================================
--  Equipo de Cargue — configuración de la base de datos
--  Pégalo completo en Supabase → SQL Editor → Run
-- ============================================================

-- 1. Tabla de perfiles -------------------------------------------------
-- Supabase ya guarda correo y contraseña (cifrada con bcrypt) en
-- auth.users. Esta tabla solo agrega el nombre y el rol.

create table if not exists public.perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text not null default '',
  rol        text not null default 'Invitado'
             check (rol in ('Administrador', 'Editor', 'Invitado')),
  creado_en  timestamptz not null default now()
);

-- 2. Seguridad a nivel de fila ----------------------------------------
-- Sin esto, cualquiera con la clave pública podría leer toda la tabla.

alter table public.perfiles enable row level security;

drop policy if exists "cada quien lee su perfil" on public.perfiles;
create policy "cada quien lee su perfil"
  on public.perfiles for select
  using (auth.uid() = id);

drop policy if exists "cada quien edita su nombre" on public.perfiles;
create policy "cada quien edita su nombre"
  on public.perfiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Los administradores ven todos los perfiles.
-- Se usa una función security definer: consultar `perfiles` dentro de su propia
-- política provocaría "infinite recursion detected in policy".
create or replace function public.es_administrador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'Administrador'
  );
$$;

drop policy if exists "el administrador ve todo" on public.perfiles;
create policy "el administrador ve todo"
  on public.perfiles for select
  using (public.es_administrador());

-- Nota: el rol NO se puede cambiar desde la aplicación a propósito.
-- Se asigna desde este panel de SQL (ver paso 5).

-- 3. Crear el perfil automáticamente al registrarse --------------------

create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- 4. Perfiles para usuarios que ya existían ----------------------------

insert into public.perfiles (id, nombre)
select u.id, coalesce(u.raw_user_meta_data ->> 'nombre', '')
from auth.users u
on conflict (id) do nothing;

-- 5. Hazte administrador ----------------------------------------------
-- Cambia el correo por el tuyo y ejecuta esta línea.

-- update public.perfiles
-- set rol = 'Administrador'
-- where id = (select id from auth.users where email = 'tucorreo@americana.edu.co');

-- 6. (Opcional) Restringir el registro al dominio institucional --------
-- Si quieres que solo los correos @americana.edu.co puedan registrarse:

-- create or replace function public.validar_dominio()
-- returns trigger
-- language plpgsql
-- security definer
-- as $$
-- begin
--   if new.email not like '%@americana.edu.co' then
--     raise exception 'Solo se permiten correos institucionales';
--   end if;
--   return new;
-- end;
-- $$;
--
-- drop trigger if exists validar_dominio_usuario on auth.users;
-- create trigger validar_dominio_usuario
--   before insert on auth.users
--   for each row execute function public.validar_dominio();
