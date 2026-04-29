--
-- PostgreSQL database dump
--

\restrict vEacFUbFYgsSahnmoF9WhiBqiib48r3f2KR4yWOIPQQ0QKzPJHf558bll3uAb27

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: supabase_admin
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


ALTER FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) OWNER TO supabase_admin;

--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION public.rls_auto_enable() OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL AND ppt.tablename NOT LIKE '% %'),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  -- Count raw slot entries before apply_rls/subscription filter
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  -- Apply RLS and filter as before
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  -- Real rows with slot count attached
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  -- Sentinel row: always returned when no real rows exist so Elixir can
  -- always read slot_changes_count. Identified by wal IS NULL.
  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION storage.allow_any_operation(expected_operations text[]) OWNER TO supabase_storage_admin;

--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION storage.allow_only_operation(expected_operation text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text) OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


ALTER TABLE auth.webauthn_challenges OWNER TO supabase_auth_admin;

--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


ALTER TABLE auth.webauthn_credentials OWNER TO supabase_auth_admin;

--
-- Name: account_balance_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_balance_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    financial_account_id uuid NOT NULL,
    snapshot_date date NOT NULL,
    available_balance numeric(18,2),
    current_balance numeric(18,2),
    currency character(3) NOT NULL,
    balance_source_type text NOT NULL,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.account_balance_history OWNER TO postgres;

--
-- Name: ai_context_cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_context_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    snapshot_date date NOT NULL,
    context_type text NOT NULL,
    structured_metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    summary_text text,
    insights text,
    recommendations text,
    model_version text,
    confidence_score numeric(4,3),
    source text DEFAULT 'scheduled_job'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_context_type CHECK ((context_type = ANY (ARRAY['daily_summary'::text, 'monthly_summary'::text, 'risk_analysis'::text, 'tax_projection'::text, 'custom'::text])))
);


ALTER TABLE public.ai_context_cache OWNER TO postgres;

--
-- Name: ai_usage_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_usage_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_type text NOT NULL,
    daily_token_limit integer NOT NULL,
    monthly_token_limit integer NOT NULL,
    daily_request_limit integer,
    monthly_request_limit integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_plan_type CHECK ((plan_type = ANY (ARRAY['free'::text, 'pro'::text, 'enterprise'::text, 'custom'::text])))
);


ALTER TABLE public.ai_usage_limits OWNER TO postgres;

--
-- Name: ai_usage_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_usage_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    conversation_id uuid,
    message_id uuid,
    model_name text NOT NULL,
    request_type text NOT NULL,
    input_tokens integer DEFAULT 0 NOT NULL,
    output_tokens integer DEFAULT 0 NOT NULL,
    total_tokens integer DEFAULT 0 NOT NULL,
    estimated_cost numeric(10,6),
    usage_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_request_type CHECK ((request_type = ANY (ARRAY['chat'::text, 'analysis'::text, 'tool_call'::text, 'summary'::text, 'news_fetch'::text])))
);


ALTER TABLE public.ai_usage_logs OWNER TO postgres;

--
-- Name: alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    financial_account_id uuid,
    alert_type text NOT NULL,
    alert_source text NOT NULL,
    severity text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    structured_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    triggered_at timestamp with time zone DEFAULT now() NOT NULL,
    acknowledged_at timestamp with time zone,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_alert_source CHECK ((alert_source = ANY (ARRAY['rule_engine'::text, 'ai_engine'::text, 'system'::text]))),
    CONSTRAINT valid_alert_type CHECK ((alert_type = ANY (ARRAY['margin_risk'::text, 'budget_exceeded'::text, 'tax_underpayment'::text, 'cash_flow_warning'::text, 'leverage_warning'::text, 'spending_anomaly'::text, 'ai_insight'::text, 'other'::text]))),
    CONSTRAINT valid_severity CHECK ((severity = ANY (ARRAY['low'::text, 'moderate'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['active'::text, 'acknowledged'::text, 'resolved'::text, 'dismissed'::text])))
);


ALTER TABLE public.alerts OWNER TO postgres;

--
-- Name: assistant_conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assistant_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    conversation_type text NOT NULL,
    title text,
    context_scope text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_message_at timestamp with time zone,
    archived_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_context_scope CHECK ((context_scope = ANY (ARRAY['general_finance'::text, 'trading'::text, 'crypto'::text, 'tax'::text, 'budgeting'::text, 'risk'::text, 'app_guidance'::text]))),
    CONSTRAINT valid_conversation_type CHECK ((conversation_type = ANY (ARRAY['persistent'::text, 'session'::text])))
);


ALTER TABLE public.assistant_conversations OWNER TO postgres;

--
-- Name: assistant_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assistant_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    prompt_text text,
    response_text text,
    tool_calls jsonb,
    tool_results jsonb,
    referenced_snapshot_ids jsonb,
    model_version text,
    token_usage integer,
    confidence_score numeric(4,3),
    context_summary text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_role CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text, 'tool'::text])))
);


ALTER TABLE public.assistant_messages OWNER TO postgres;

--
-- Name: assistant_tool_registry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assistant_tool_registry (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tool_name text NOT NULL,
    tool_category text NOT NULL,
    description text NOT NULL,
    allowed_roles jsonb DEFAULT '["assistant"]'::jsonb NOT NULL,
    input_schema jsonb NOT NULL,
    output_schema jsonb,
    data_scope text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    version text DEFAULT '1.0'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_data_scope CHECK ((data_scope = ANY (ARRAY['snapshot_only'::text, 'read_only'::text, 'external_api'::text, 'system_internal'::text]))),
    CONSTRAINT valid_tool_category CHECK ((tool_category = ANY (ARRAY['financial_data'::text, 'tax'::text, 'trading'::text, 'crypto'::text, 'risk'::text, 'navigation'::text, 'system'::text])))
);


ALTER TABLE public.assistant_tool_registry OWNER TO postgres;

--
-- Name: budget_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budget_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    parent_category_id uuid,
    category_type text DEFAULT 'expense'::text NOT NULL,
    monthly_limit numeric(18,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_category_type CHECK ((category_type = ANY (ARRAY['expense'::text, 'income'::text, 'savings'::text])))
);


ALTER TABLE public.budget_categories OWNER TO postgres;

--
-- Name: budget_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budget_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    budget_amount numeric(18,2) NOT NULL,
    actual_spent numeric(18,2),
    variance numeric(18,2),
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    adjustment_amount numeric(18,2) DEFAULT 0 NOT NULL,
    CONSTRAINT valid_budget_status CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'exceeded'::text, 'archived'::text]))),
    CONSTRAINT valid_date_range CHECK ((end_date >= start_date))
);


ALTER TABLE public.budget_records OWNER TO postgres;

--
-- Name: envelope_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.envelope_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    envelope_id uuid NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(18,2) NOT NULL,
    transaction_type text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_type CHECK ((transaction_type = ANY (ARRAY['add'::text, 'spend'::text, 'reset'::text])))
);


ALTER TABLE public.envelope_transactions OWNER TO postgres;

--
-- Name: envelopes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.envelopes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    budgeted_amount numeric(18,2) DEFAULT 0 NOT NULL,
    spent_amount numeric(18,2) DEFAULT 0 NOT NULL,
    period_type text DEFAULT 'monthly'::text NOT NULL,
    color_index integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    total_stuffed_alltime numeric(18,2) DEFAULT 0 NOT NULL,
    total_spent_alltime numeric(18,2) DEFAULT 0 NOT NULL,
    last_reset_at timestamp with time zone,
    CONSTRAINT valid_period_type CHECK ((period_type = ANY (ARRAY['weekly'::text, 'monthly'::text, 'quarterly'::text, 'annual'::text, 'custom'::text])))
);


ALTER TABLE public.envelopes OWNER TO postgres;

--
-- Name: feature_flag_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feature_flag_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feature_flag_id uuid NOT NULL,
    plan_type text NOT NULL,
    is_enabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_plan_type CHECK ((plan_type = ANY (ARRAY['free'::text, 'pro'::text, 'enterprise'::text, 'custom'::text])))
);


ALTER TABLE public.feature_flag_plans OWNER TO postgres;

--
-- Name: feature_flag_user_overrides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feature_flag_user_overrides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    feature_flag_id uuid NOT NULL,
    is_enabled boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feature_flag_user_overrides OWNER TO postgres;

--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    flag_key text NOT NULL,
    description text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feature_flags OWNER TO postgres;

--
-- Name: financial_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    integration_connection_id uuid,
    provider text,
    provider_account_id text,
    account_name text NOT NULL,
    account_type text NOT NULL,
    account_subtype text,
    parent_account_id uuid,
    account_currency character(3) NOT NULL,
    is_crypto boolean DEFAULT false NOT NULL,
    available_balance numeric(18,2),
    current_balance numeric(18,2),
    credit_limit numeric(18,2),
    balance_source_type text DEFAULT 'provider_reported'::text NOT NULL,
    last_balance_sync_at timestamp with time zone,
    tax_treatment text DEFAULT 'taxable'::text NOT NULL,
    is_business_account boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    archived_at timestamp with time zone,
    deleted_at timestamp with time zone,
    last_transaction_sync_at timestamp with time zone,
    last_snapshot_update_at timestamp with time zone,
    institution_name text,
    institution_logo_url text,
    mask text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.financial_accounts OWNER TO postgres;

--
-- Name: integration_connections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.integration_connections (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    provider text NOT NULL,
    provider_name text,
    institution_name text,
    status text,
    connection_status text,
    sync_status text,
    external_id text,
    config jsonb,
    connection_metadata jsonb,
    last_synced timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    access_token_encrypted text
);


ALTER TABLE public.integration_connections OWNER TO postgres;

--
-- Name: jurisdictions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jurisdictions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text,
    jurisdiction_type text NOT NULL,
    country_code character(2) NOT NULL,
    parent_jurisdiction_id uuid,
    effective_start_date date NOT NULL,
    effective_end_date date,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_effective_dates CHECK (((effective_end_date IS NULL) OR (effective_end_date >= effective_start_date))),
    CONSTRAINT valid_jurisdiction_type CHECK ((jurisdiction_type = ANY (ARRAY['federal'::text, 'state'::text, 'local'::text, 'international'::text, 'special_district'::text])))
);


ALTER TABLE public.jurisdictions OWNER TO postgres;

--
-- Name: portfolio_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.portfolio_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    snapshot_date date NOT NULL,
    total_net_worth numeric(18,2) NOT NULL,
    total_assets numeric(18,2) NOT NULL,
    total_liabilities numeric(18,2) NOT NULL,
    total_cash numeric(18,2),
    total_investments numeric(18,2),
    unrealized_gain numeric(18,2),
    realized_gain numeric(18,2),
    daily_change numeric(18,2),
    daily_change_percent numeric(8,4),
    base_currency character(3) NOT NULL,
    calculated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text DEFAULT 'scheduled_job'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.portfolio_snapshots OWNER TO postgres;

--
-- Name: positions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.positions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    financial_account_id uuid NOT NULL,
    asset_symbol text NOT NULL,
    asset_name text,
    asset_type text NOT NULL,
    currency character(3) NOT NULL,
    derivative_type text,
    calculated_quantity numeric(30,12) DEFAULT 0 NOT NULL,
    override_quantity numeric(30,12),
    override_reason text,
    override_updated_at timestamp with time zone,
    average_cost_basis numeric(18,8),
    total_cost_basis numeric(18,2),
    last_price numeric(18,8),
    last_valuation numeric(18,2),
    last_price_updated_at timestamp with time zone,
    unrealized_gain numeric(18,2),
    strike_price numeric(18,8),
    expiration_date date,
    option_type text,
    contract_multiplier numeric(18,8),
    leverage_ratio numeric(10,4),
    initial_margin_requirement numeric(18,2),
    maintenance_margin_requirement numeric(18,2),
    margin_used numeric(18,2),
    is_short boolean DEFAULT false NOT NULL,
    last_calculated_at timestamp with time zone,
    last_synced_at timestamp with time zone,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_asset_type CHECK ((asset_type = ANY (ARRAY['equity'::text, 'crypto'::text, 'etf'::text, 'bond'::text, 'option'::text, 'future'::text, 'forex'::text, 'swap'::text, 'cash'::text, 'liability'::text]))),
    CONSTRAINT valid_derivative_type_pos CHECK (((derivative_type IS NULL) OR (derivative_type = ANY (ARRAY['option'::text, 'future'::text, 'forex'::text, 'swap'::text, 'margin_liability'::text])))),
    CONSTRAINT valid_option_type CHECK (((option_type IS NULL) OR (option_type = ANY (ARRAY['call'::text, 'put'::text]))))
);


ALTER TABLE public.positions OWNER TO postgres;

--
-- Name: refresh_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    trigger_mode text NOT NULL,
    status text DEFAULT 'queued'::text NOT NULL,
    current_stage text,
    progress integer DEFAULT 0 NOT NULL,
    error_message text,
    error_stage text,
    retry_count integer DEFAULT 0 NOT NULL,
    queued_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    execution_time_ms integer,
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['queued'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))),
    CONSTRAINT valid_trigger_mode CHECK ((trigger_mode = ANY (ARRAY['manual'::text, 'scheduled'::text])))
);


ALTER TABLE public.refresh_jobs OWNER TO postgres;

--
-- Name: risk_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.risk_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    financial_account_id uuid NOT NULL,
    snapshot_date date NOT NULL,
    total_margin_used numeric(18,2) NOT NULL,
    total_initial_margin_required numeric(18,2) NOT NULL,
    total_maintenance_margin_required numeric(18,2) NOT NULL,
    gross_exposure numeric(18,2) NOT NULL,
    net_exposure numeric(18,2) NOT NULL,
    leverage_ratio numeric(10,4),
    margin_buffer numeric(18,2),
    risk_level text NOT NULL,
    calculated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text DEFAULT 'scheduled_job'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_risk_level CHECK ((risk_level = ANY (ARRAY['low'::text, 'moderate'::text, 'high'::text, 'critical'::text])))
);


ALTER TABLE public.risk_snapshots OWNER TO postgres;

--
-- Name: savings_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.savings_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    financial_account_id uuid,
    name text NOT NULL,
    description text,
    target_amount numeric(18,2) NOT NULL,
    current_amount numeric(18,2) DEFAULT 0 NOT NULL,
    start_date date NOT NULL,
    target_date date,
    status text DEFAULT 'active'::text NOT NULL,
    required_monthly_contribution numeric(18,2),
    projected_completion_date date,
    savings_velocity numeric(18,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    goal_type text DEFAULT 'one_time'::text NOT NULL,
    monthly_target numeric(18,2),
    cumulative_amount numeric(18,2) DEFAULT 0 NOT NULL,
    last_reset_at timestamp with time zone,
    CONSTRAINT valid_goal_dates CHECK (((target_date IS NULL) OR (target_date >= start_date))),
    CONSTRAINT valid_goal_status CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'paused'::text, 'archived'::text]))),
    CONSTRAINT valid_goal_type CHECK ((goal_type = ANY (ARRAY['one_time'::text, 'sinking_fund'::text])))
);


ALTER TABLE public.savings_goals OWNER TO postgres;

--
-- Name: spending_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.spending_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category_id uuid,
    snapshot_date date NOT NULL,
    period_type text NOT NULL,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    total_spent numeric(18,2) NOT NULL,
    transaction_count integer DEFAULT 0 NOT NULL,
    average_transaction_value numeric(18,2),
    calculated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text DEFAULT 'scheduled_job'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_period_range CHECK ((period_end_date >= period_start_date)),
    CONSTRAINT valid_period_type CHECK ((period_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])))
);


ALTER TABLE public.spending_snapshots OWNER TO postgres;

--
-- Name: sync_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    integration_connection_id uuid,
    provider text NOT NULL,
    trigger_mode text NOT NULL,
    status text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    accounts_synced integer,
    transactions_synced integer,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sync_logs OWNER TO postgres;

--
-- Name: tax_estimates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_estimates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tax_profile_id uuid NOT NULL,
    jurisdiction_id uuid NOT NULL,
    tax_year integer NOT NULL,
    period_type text NOT NULL,
    quarter integer,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    taxable_income numeric(18,2) NOT NULL,
    income_tax numeric(18,2) DEFAULT 0,
    capital_gains_tax numeric(18,2) DEFAULT 0,
    qualified_dividend_tax numeric(18,2) DEFAULT 0,
    self_employment_tax numeric(18,2) DEFAULT 0,
    corporate_tax numeric(18,2) DEFAULT 0,
    section_1256_tax numeric(18,2) DEFAULT 0,
    total_tax_liability numeric(18,2) NOT NULL,
    total_payments_applied numeric(18,2) DEFAULT 0,
    balance_due numeric(18,2) NOT NULL,
    underpayment_flag boolean DEFAULT false NOT NULL,
    calculated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text DEFAULT 'scheduled_job'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_date_range CHECK ((period_end_date >= period_start_date)),
    CONSTRAINT valid_period_type CHECK ((period_type = ANY (ARRAY['quarterly'::text, 'annual'::text]))),
    CONSTRAINT valid_quarter CHECK ((((period_type = 'annual'::text) AND (quarter IS NULL)) OR ((period_type = 'quarterly'::text) AND (quarter = ANY (ARRAY[1, 2, 3, 4])))))
);


ALTER TABLE public.tax_estimates OWNER TO postgres;

--
-- Name: tax_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tax_profile_id uuid NOT NULL,
    jurisdiction_id uuid NOT NULL,
    tax_estimate_id uuid,
    tax_year integer NOT NULL,
    period_type text NOT NULL,
    quarter integer,
    payment_date date NOT NULL,
    amount numeric(18,2) NOT NULL,
    payment_method text,
    confirmation_number text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_payment_method CHECK (((payment_method IS NULL) OR (payment_method = ANY (ARRAY['ach'::text, 'wire'::text, 'check'::text, 'credit_card'::text, 'other'::text])))),
    CONSTRAINT valid_period_type CHECK ((period_type = ANY (ARRAY['quarterly'::text, 'annual'::text]))),
    CONSTRAINT valid_quarter CHECK ((((period_type = 'annual'::text) AND (quarter IS NULL)) OR ((period_type = 'quarterly'::text) AND (quarter = ANY (ARRAY[1, 2, 3, 4])))))
);


ALTER TABLE public.tax_payments OWNER TO postgres;

--
-- Name: tax_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    profile_name text NOT NULL,
    entity_type text NOT NULL,
    filing_status text,
    tax_year integer NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    jurisdiction_id uuid,
    state_jurisdiction_id uuid,
    state_jurisdiction_id_2 uuid,
    CONSTRAINT valid_entity_type CHECK ((entity_type = ANY (ARRAY['individual'::text, 'llc'::text, 's_corp'::text, 'c_corp'::text, 'partnership'::text, 'trust'::text, 'other'::text]))),
    CONSTRAINT valid_filing_status CHECK (((filing_status IS NULL) OR (filing_status = ANY (ARRAY['single'::text, 'married_joint'::text, 'married_separate'::text, 'head_of_household'::text, 'qualifying_widow'::text]))))
);


ALTER TABLE public.tax_profiles OWNER TO postgres;

--
-- Name: tax_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    jurisdiction_id uuid NOT NULL,
    tax_year integer NOT NULL,
    tax_type text NOT NULL,
    filing_status text,
    bracket_min numeric(18,2) NOT NULL,
    bracket_max numeric(18,2),
    rate numeric(6,5) NOT NULL,
    effective_start_date date NOT NULL,
    effective_end_date date,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_bracket_range CHECK (((bracket_max IS NULL) OR (bracket_max >= bracket_min))),
    CONSTRAINT valid_effective_dates CHECK (((effective_end_date IS NULL) OR (effective_end_date >= effective_start_date))),
    CONSTRAINT valid_filing_status CHECK (((filing_status IS NULL) OR (filing_status = ANY (ARRAY['single'::text, 'married_joint'::text, 'married_separate'::text, 'head_of_household'::text, 'qualifying_widow'::text])))),
    CONSTRAINT valid_tax_type CHECK ((tax_type = ANY (ARRAY['income'::text, 'capital_gains_short_term'::text, 'capital_gains_long_term'::text, 'qualified_dividends'::text, 'self_employment'::text, 'corporate'::text, 'section_1256_60'::text, 'section_1256_40'::text])))
);


ALTER TABLE public.tax_rates OWNER TO postgres;

--
-- Name: trade_journal; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trade_journal (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trade_id uuid NOT NULL,
    user_id uuid NOT NULL,
    entry_type text DEFAULT 'post_trade'::text NOT NULL,
    content text NOT NULL,
    mood text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT valid_entry_type CHECK ((entry_type = ANY (ARRAY['pre_trade'::text, 'during_trade'::text, 'post_trade'::text, 'review'::text]))),
    CONSTRAINT valid_mood CHECK ((mood = ANY (ARRAY['confident'::text, 'neutral'::text, 'anxious'::text, 'fearful'::text, 'greedy'::text])))
);


ALTER TABLE public.trade_journal OWNER TO postgres;

--
-- Name: trades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    symbol text NOT NULL,
    asset_type text NOT NULL,
    trade_type text NOT NULL,
    direction text NOT NULL,
    quantity numeric(18,4) NOT NULL,
    entry_price numeric(18,6) NOT NULL,
    exit_price numeric(18,6),
    entry_date timestamp with time zone NOT NULL,
    exit_date timestamp with time zone,
    stop_loss numeric(18,6),
    take_profit numeric(18,6),
    realized_pnl numeric(18,2),
    commission numeric(18,2) DEFAULT 0,
    status text DEFAULT 'open'::text NOT NULL,
    strategy text,
    timeframe text,
    setup_type text,
    risk_amount numeric(18,2),
    risk_reward_ratio numeric(8,2),
    tax_year integer,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    contract_type text,
    option_type text,
    strike_price numeric(18,6),
    expiration_date date,
    premium numeric(18,6),
    lot_size text,
    pip_value numeric(18,6),
    margin_required numeric(18,2),
    contract_multiplier numeric(18,2),
    deleted_at timestamp with time zone,
    CONSTRAINT valid_direction CHECK ((direction = ANY (ARRAY['long'::text, 'short'::text]))),
    CONSTRAINT valid_trade_asset_type CHECK ((asset_type = ANY (ARRAY['equity'::text, 'option'::text, 'future'::text, 'forex'::text, 'index'::text]))),
    CONSTRAINT valid_trade_status CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text, 'cancelled'::text]))),
    CONSTRAINT valid_trade_type CHECK ((trade_type = ANY (ARRAY['day_trade'::text, 'swing_trade'::text, 'scalp'::text])))
);


ALTER TABLE public.trades OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    financial_account_id uuid NOT NULL,
    provider text,
    external_transaction_id text,
    transaction_type text NOT NULL,
    direction text NOT NULL,
    status text DEFAULT 'posted'::text NOT NULL,
    income_subtype text,
    trade_type text,
    fee_type text,
    tax_type text,
    derivative_type text,
    amount numeric(18,2) NOT NULL,
    currency character(3) NOT NULL,
    fee_amount numeric(18,2),
    realized_gain numeric(18,2),
    asset_symbol text,
    quantity numeric(30,12),
    price_per_unit numeric(18,8),
    contract_multiplier numeric(18,8),
    strike_price numeric(18,8),
    expiration_date date,
    settlement_price numeric(18,8),
    mtm_adjustment numeric(18,2),
    margin_impact numeric(18,2),
    transfer_group_id uuid,
    lot_id uuid,
    transaction_date timestamp with time zone NOT NULL,
    settlement_date timestamp with time zone,
    category text,
    subcategory text,
    description text,
    merchant_name text,
    taxable_event boolean DEFAULT false NOT NULL,
    synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT valid_derivative_type CHECK (((derivative_type IS NULL) OR (derivative_type = ANY (ARRAY['option'::text, 'future'::text, 'forex'::text, 'swap'::text, 'margin_borrow'::text])))),
    CONSTRAINT valid_direction CHECK ((direction = ANY (ARRAY['debit'::text, 'credit'::text]))),
    CONSTRAINT valid_fee_type CHECK (((fee_type IS NULL) OR (fee_type = ANY (ARRAY['trading_fee'::text, 'management_fee'::text, 'atm_fee'::text, 'subscription_fee'::text, 'margin_interest'::text, 'other'::text])))),
    CONSTRAINT valid_income_subtype CHECK (((income_subtype IS NULL) OR (income_subtype = ANY (ARRAY['salary'::text, 'bonus'::text, 'dividend'::text, 'interest'::text, 'rental'::text, 'business'::text, 'other'::text])))),
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['pending'::text, 'posted'::text, 'reversed'::text, 'failed'::text]))),
    CONSTRAINT valid_tax_type CHECK (((tax_type IS NULL) OR (tax_type = ANY (ARRAY['federal'::text, 'state'::text, 'local'::text, 'capital_gains'::text, 'estimated'::text, 'other'::text])))),
    CONSTRAINT valid_trade_type CHECK (((trade_type IS NULL) OR (trade_type = ANY (ARRAY['buy'::text, 'sell'::text])))),
    CONSTRAINT valid_transaction_type CHECK ((transaction_type = ANY (ARRAY['bank'::text, 'trade'::text, 'crypto'::text, 'income'::text, 'fee'::text, 'transfer'::text, 'tax_payment'::text])))
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: trend_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trend_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    snapshot_date date NOT NULL,
    period_type text NOT NULL,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    total_income numeric(18,2) DEFAULT 0 NOT NULL,
    total_expenses numeric(18,2) DEFAULT 0 NOT NULL,
    net_cash_flow numeric(18,2) DEFAULT 0 NOT NULL,
    savings_rate numeric(8,4),
    investment_growth numeric(18,2),
    net_worth_change numeric(18,2),
    debt_to_income_ratio numeric(8,4),
    expense_volatility numeric(8,4),
    leverage_ratio numeric(10,4),
    margin_utilization numeric(8,4),
    financial_health_score integer,
    calculated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text DEFAULT 'scheduled_job'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT valid_period_range CHECK ((period_end_date >= period_start_date)),
    CONSTRAINT valid_period_type CHECK ((period_type = ANY (ARRAY['daily'::text, 'monthly'::text])))
);


ALTER TABLE public.trend_snapshots OWNER TO postgres;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    role text DEFAULT 'user'::text NOT NULL,
    subscription_plan text DEFAULT 'free'::text NOT NULL,
    refresh_window_minute integer,
    last_scheduled_refresh_at timestamp with time zone,
    mfa_enabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    notification_preferences jsonb DEFAULT '{"ai_insight": true, "margin_risk": true, "budget_exceeded": true, "spending_anomaly": true, "tax_underpayment": true, "cash_flow_warning": true, "auto_scan_frequency": "weekly"}'::jsonb NOT NULL,
    app_preferences jsonb DEFAULT '{"default_tax_year": 2026, "levelup_auto_open": true}'::jsonb NOT NULL,
    CONSTRAINT valid_role CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text]))),
    CONSTRAINT valid_subscription_plan CHECK ((subscription_plan = ANY (ARRAY['free'::text, 'pro'::text, 'enterprise'::text, 'custom'::text])))
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- Name: write_offs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.write_offs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    transaction_id uuid,
    category text NOT NULL,
    description text,
    amount numeric(18,2) NOT NULL,
    expense_date date NOT NULL,
    tax_year integer NOT NULL,
    deduction_type text NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.write_offs OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
0d1776f4-3e72-4099-b904-cd82167fa493	ae56752b-084c-442a-9055-423798da45b2	7bc9e5e0-cab9-4129-849f-0aa25b913cac	s256	7sdzyRPqnLQiIC5tLXnXCrSQWzcgyjorSNEu6myIdNA	email			2026-04-23 01:16:59.951348+00	2026-04-23 01:16:59.951348+00	email/signup	\N	\N	\N	\N	\N	f
3f4a6e45-4db3-4910-8ed5-e2ae6228b3c2	9d507dde-9787-44bd-ab72-329d7538483b	e386b6c9-634b-462e-ab32-3382523b0bd0	s256	sN9hjcg8cmtdjk1aEV8L0E_7gkwAaz1GbgUh2QVW5jQ	email			2026-04-23 01:18:08.333137+00	2026-04-23 01:18:26.653698+00	email/signup	2026-04-23 01:18:26.653643+00	\N	\N	\N	\N	f
38a95d19-7197-49ac-a194-13e6e7d81266	83e131d9-1b19-4360-bd8a-19d16add3da5	741e5a7b-7f2d-4a45-9fd9-42756cef2a65	s256	3GR_WzeUtcctxloVcHUQezsUJhMrXniDqOdrPlVgsww	email			2026-04-26 22:56:36.859093+00	2026-04-26 22:56:52.859866+00	email/signup	2026-04-26 22:56:52.859141+00	\N	\N	\N	\N	f
f857b4df-30f2-4875-9c69-3efffa52f93b	81555e75-82a5-45e7-9882-6d8996c9727d	208ff983-2fd8-4566-9090-65d876030453	s256	4qTjJp2wv6hXNr3yqMvWfMNrBDDncweha0thxUNlfM8	email			2026-04-26 23:09:58.017696+00	2026-04-26 23:10:19.115482+00	email/signup	2026-04-26 23:10:19.115408+00	\N	\N	\N	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
9d507dde-9787-44bd-ab72-329d7538483b	9d507dde-9787-44bd-ab72-329d7538483b	{"sub": "9d507dde-9787-44bd-ab72-329d7538483b", "email": "tajacobs75@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-04-23 01:18:08.330226+00	2026-04-23 01:18:08.330279+00	2026-04-23 01:18:08.330279+00	6eb9101a-5a9b-4d3b-9fbc-4220dc86f927
81555e75-82a5-45e7-9882-6d8996c9727d	81555e75-82a5-45e7-9882-6d8996c9727d	{"sub": "81555e75-82a5-45e7-9882-6d8996c9727d", "email": "taaj75@icloud.com", "email_verified": true, "phone_verified": false}	email	2026-04-26 23:09:58.012719+00	2026-04-26 23:09:58.012778+00	2026-04-26 23:09:58.012778+00	9e15c4e0-bc4e-4db7-a1b6-1e7dd2d4d1fd
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4	2026-04-28 21:49:24.447139+00	2026-04-28 21:49:24.447139+00	password	a0347a76-b86a-47a0-9ef0-b479f6615b29
b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4	2026-04-28 21:56:47.779625+00	2026-04-28 21:56:47.779625+00	totp	fb62347a-da31-4fa1-b8e5-4b34d27d160b
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
7d3cc747-83b2-42b7-b58d-efe3e9039d76	62b0b477-b48f-4a7f-b769-b0bcc8bd16a0	2026-04-27 21:06:37.774658+00	2026-04-27 21:06:37.936306+00	73.134.168.151		\N
946d08cc-ef3e-4bbb-9331-91c83c8dfa9e	62b0b477-b48f-4a7f-b769-b0bcc8bd16a0	2026-04-27 21:12:39.289552+00	2026-04-27 21:12:39.472519+00	104.28.39.156		\N
74156fe5-1529-4c98-ad2a-f36b11f35f5f	62b0b477-b48f-4a7f-b769-b0bcc8bd16a0	2026-04-27 21:42:36.113775+00	2026-04-27 21:42:36.250057+00	73.134.168.151		\N
6019b88c-4006-4bdb-a619-ec893011501d	62b0b477-b48f-4a7f-b769-b0bcc8bd16a0	2026-04-28 00:53:38.765386+00	2026-04-28 00:53:38.877586+00	73.134.168.151		\N
c3929173-5750-4624-99f8-fa75ba04d2c8	62b0b477-b48f-4a7f-b769-b0bcc8bd16a0	2026-04-28 03:50:06.554048+00	2026-04-28 03:50:06.646479+00	73.134.168.151		\N
61836168-afa9-4e3c-9c34-23063717c626	62b0b477-b48f-4a7f-b769-b0bcc8bd16a0	2026-04-28 19:00:20.55626+00	2026-04-28 19:00:20.745636+00	73.134.168.151		\N
4fabdcd6-fa65-4c93-894a-75bc34b5a045	62b0b477-b48f-4a7f-b769-b0bcc8bd16a0	2026-04-28 20:16:48.911813+00	2026-04-28 20:16:49.292718+00	73.134.168.151		\N
67051f80-22b3-47b2-bd7f-0c6d0bc1e0f6	62b0b477-b48f-4a7f-b769-b0bcc8bd16a0	2026-04-28 21:56:46.920397+00	2026-04-28 21:56:47.776729+00	73.134.168.151		\N
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
62b0b477-b48f-4a7f-b769-b0bcc8bd16a0	81555e75-82a5-45e7-9882-6d8996c9727d	FinOps Authenticator	totp	verified	2026-04-27 21:05:47.742046+00	2026-04-28 21:56:46.946786+00	N67GNMG4VM653ABUMCZHAGWRNZ3RE5MR	\N	2026-04-28 21:56:46.916311+00	\N	\N	\N
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	87	ueuyz6ss3pod	81555e75-82a5-45e7-9882-6d8996c9727d	t	2026-04-28 21:49:24.426523+00	2026-04-28 21:56:47.785748+00	\N	b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4
00000000-0000-0000-0000-000000000000	88	k5ukg7xnz762	81555e75-82a5-45e7-9882-6d8996c9727d	t	2026-04-28 21:56:47.788664+00	2026-04-28 22:59:13.289399+00	ueuyz6ss3pod	b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4
00000000-0000-0000-0000-000000000000	89	fflmy7e6zkr4	81555e75-82a5-45e7-9882-6d8996c9727d	t	2026-04-28 22:59:13.30399+00	2026-04-28 23:57:55.751527+00	k5ukg7xnz762	b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4
00000000-0000-0000-0000-000000000000	90	2uvccbe2uirm	81555e75-82a5-45e7-9882-6d8996c9727d	t	2026-04-28 23:57:55.767937+00	2026-04-29 00:58:20.626811+00	fflmy7e6zkr4	b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4
00000000-0000-0000-0000-000000000000	91	dybafcvxnrjq	81555e75-82a5-45e7-9882-6d8996c9727d	t	2026-04-29 00:58:20.644868+00	2026-04-29 02:00:40.513036+00	2uvccbe2uirm	b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4
00000000-0000-0000-0000-000000000000	92	nzyip4mtv7bc	81555e75-82a5-45e7-9882-6d8996c9727d	t	2026-04-29 02:00:40.532719+00	2026-04-29 02:59:39.467136+00	dybafcvxnrjq	b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4
00000000-0000-0000-0000-000000000000	93	vslav3y4mwnf	81555e75-82a5-45e7-9882-6d8996c9727d	t	2026-04-29 02:59:39.473741+00	2026-04-29 04:04:38.991842+00	nzyip4mtv7bc	b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4
00000000-0000-0000-0000-000000000000	94	ouqk67c3tehq	81555e75-82a5-45e7-9882-6d8996c9727d	t	2026-04-29 04:04:39.003271+00	2026-04-29 05:07:39.006473+00	vslav3y4mwnf	b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4
00000000-0000-0000-0000-000000000000	95	z225g5wopb65	81555e75-82a5-45e7-9882-6d8996c9727d	t	2026-04-29 05:07:39.023719+00	2026-04-29 06:10:38.724605+00	ouqk67c3tehq	b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4
00000000-0000-0000-0000-000000000000	96	zcvksv2baarj	81555e75-82a5-45e7-9882-6d8996c9727d	t	2026-04-29 06:10:38.743536+00	2026-04-29 07:13:38.615812+00	z225g5wopb65	b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4
00000000-0000-0000-0000-000000000000	97	szx2njn7qy5j	81555e75-82a5-45e7-9882-6d8996c9727d	t	2026-04-29 07:13:38.635658+00	2026-04-29 09:33:16.03978+00	zcvksv2baarj	b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4
00000000-0000-0000-0000-000000000000	98	x3yr5okte3rb	81555e75-82a5-45e7-9882-6d8996c9727d	f	2026-04-29 09:33:16.053745+00	2026-04-29 09:33:16.053745+00	szx2njn7qy5j	b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
b88b1c3f-91b0-45fb-90fc-7c689b4f3fd4	81555e75-82a5-45e7-9882-6d8996c9727d	2026-04-28 21:49:24.411789+00	2026-04-29 09:33:16.076032+00	62b0b477-b48f-4a7f-b769-b0bcc8bd16a0	aal2	\N	2026-04-29 09:33:16.075917	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Safari/605.1.15	73.134.168.151	\N	\N	\N	\N	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	9d507dde-9787-44bd-ab72-329d7538483b	authenticated	authenticated	tajacobs75@gmail.com	$2a$10$2kCOn1tOHHNiVaQUmLAxhO8zBGZBgFmhAvgQQxKUdbtIEfsMe8hz6	2026-04-23 01:18:26.634176+00	\N		2026-04-23 01:18:08.334047+00		\N			\N	2026-04-24 18:56:58.062042+00	{"provider": "email", "providers": ["email"]}	{"sub": "9d507dde-9787-44bd-ab72-329d7538483b", "email": "tajacobs75@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-04-23 01:18:08.326295+00	2026-04-26 22:37:28.823775+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	81555e75-82a5-45e7-9882-6d8996c9727d	authenticated	authenticated	taaj75@icloud.com	$2a$10$SWlhTGeFtQmhfGGSvRxB0eR0iYztA1aYigsYtNQPmeZbwTffK8fWi	2026-04-26 23:10:19.110369+00	\N		2026-04-26 23:09:58.024451+00		2026-04-27 01:49:58.350477+00			\N	2026-04-28 21:49:24.409968+00	{"provider": "email", "providers": ["email"]}	{"sub": "81555e75-82a5-45e7-9882-6d8996c9727d", "email": "taaj75@icloud.com", "email_verified": true, "phone_verified": false}	\N	2026-04-26 23:09:57.997356+00	2026-04-29 09:33:16.06217+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: account_balance_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account_balance_history (id, user_id, financial_account_id, snapshot_date, available_balance, current_balance, currency, balance_source_type, recorded_at, created_at) FROM stdin;
98c862d6-b58a-4346-8ac5-b2514f552846	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	2026-04-28	1243.21	1293.20	USD	plaid	2026-04-28 22:39:06.247+00	2026-04-28 01:41:54.699+00
74fd59a8-00d1-4ecb-8ff8-fff3009f0ca1	81555e75-82a5-45e7-9882-6d8996c9727d	dc275ca9-43e5-4940-9e9a-99323136e5f3	2026-04-28	109520.47	109520.47	USD	plaid	2026-04-28 22:39:06.247+00	2026-04-28 22:39:06.247+00
ea16fc21-7481-4407-8ad5-6472f1990c90	81555e75-82a5-45e7-9882-6d8996c9727d	fbb8259d-16d6-4a61-acf4-854ad4806623	2026-04-28	2892.13	2892.13	USD	plaid	2026-04-28 22:39:06.247+00	2026-04-28 22:39:06.247+00
d332ef46-6d24-4b33-aef7-0e6fbd2e1790	81555e75-82a5-45e7-9882-6d8996c9727d	96d72ece-e4ef-4562-8ae0-df4feb0b7301	2026-04-28	1934.10	1934.10	USD	plaid	2026-04-28 22:39:06.247+00	2026-04-28 22:39:06.247+00
31cfaa7b-97ff-4170-a7c3-a0a11a7af335	81555e75-82a5-45e7-9882-6d8996c9727d	8af80cf7-0af0-4d34-b619-222fb9ad48fc	2026-04-28	0.00	0.00	USD	plaid	2026-04-28 22:39:06.247+00	2026-04-28 22:39:06.247+00
c284fbe0-99cd-42b2-83a2-8b442d4ec1c2	81555e75-82a5-45e7-9882-6d8996c9727d	a735f4bd-6625-4251-b051-a179cde057fc	2026-04-28	1873.37	1873.37	USD	plaid	2026-04-28 22:39:06.247+00	2026-04-28 22:39:06.247+00
33ea94e7-1402-41cf-bb97-a606c5693a11	81555e75-82a5-45e7-9882-6d8996c9727d	c0e9542e-ce77-4967-b8fc-0c692aaa5bce	2026-04-28	5793.49	5793.49	USD	plaid	2026-04-28 22:39:06.247+00	2026-04-28 22:39:06.247+00
1dd83ed4-2e66-4019-9bae-0f05575d1eb5	81555e75-82a5-45e7-9882-6d8996c9727d	5749b5ec-12e7-4624-8af0-9678561c26d3	2026-04-28	1028.90	1028.90	USD	plaid	2026-04-28 22:39:06.247+00	2026-04-28 22:39:06.247+00
307ff5ab-d3dd-4961-987a-4c209cfeed6f	81555e75-82a5-45e7-9882-6d8996c9727d	73d65657-9e74-40e5-ad75-d96a2efa6502	2026-04-28	33.53	33.53	USD	plaid	2026-04-28 22:39:06.247+00	2026-04-28 01:41:54.699+00
7dc4ca45-b82a-42ff-be35-46277cc655fe	81555e75-82a5-45e7-9882-6d8996c9727d	415b3fa0-b187-4726-8d2c-8def88b4c586	2026-04-28	215.95	215.95	USD	plaid	2026-04-28 22:39:06.247+00	2026-04-28 01:41:54.699+00
16c67ebb-d14e-49bf-805c-3a01f4422064	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	2026-04-28	25483.00	216.25	USD	plaid	2026-04-28 22:39:06.247+00	2026-04-28 01:41:54.699+00
\.


--
-- Data for Name: ai_context_cache; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_context_cache (id, user_id, snapshot_date, context_type, structured_metrics, summary_text, insights, recommendations, model_version, confidence_score, source, created_at) FROM stdin;
\.


--
-- Data for Name: ai_usage_limits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_usage_limits (id, user_id, plan_type, daily_token_limit, monthly_token_limit, daily_request_limit, monthly_request_limit, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ai_usage_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_usage_logs (id, user_id, conversation_id, message_id, model_name, request_type, input_tokens, output_tokens, total_tokens, estimated_cost, usage_date, created_at) FROM stdin;
\.


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alerts (id, user_id, financial_account_id, alert_type, alert_source, severity, status, title, message, structured_data, triggered_at, acknowledged_at, resolved_at, created_at) FROM stdin;
3579a96f-958b-4d4f-89b5-3e4294472e13	81555e75-82a5-45e7-9882-6d8996c9727d	\N	ai_insight	ai_engine	low	active	💡 Tip: Review Your Write-Offs	Make sure you're capturing all eligible business deductions. Home office, vehicle mileage, equipment, and professional development are commonly missed. Each $1,000 in deductions saves ~$250 in taxes at a 25% rate.	{}	2026-04-28 19:05:08.835+00	\N	\N	2026-04-28 19:05:08.835+00
\.


--
-- Data for Name: assistant_conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assistant_conversations (id, user_id, conversation_type, title, context_scope, is_active, last_message_at, archived_at, created_at) FROM stdin;
\.


--
-- Data for Name: assistant_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assistant_messages (id, conversation_id, user_id, role, prompt_text, response_text, tool_calls, tool_results, referenced_snapshot_ids, model_version, token_usage, confidence_score, context_summary, created_at) FROM stdin;
\.


--
-- Data for Name: assistant_tool_registry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assistant_tool_registry (id, tool_name, tool_category, description, allowed_roles, input_schema, output_schema, data_scope, is_active, version, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: budget_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budget_categories (id, user_id, name, description, parent_category_id, category_type, monthly_limit, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: budget_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budget_records (id, user_id, category_id, start_date, end_date, budget_amount, actual_spent, variance, status, created_at, updated_at, adjustment_amount) FROM stdin;
\.


--
-- Data for Name: envelope_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.envelope_transactions (id, envelope_id, user_id, amount, transaction_type, note, created_at) FROM stdin;
\.


--
-- Data for Name: envelopes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.envelopes (id, user_id, name, description, budgeted_amount, spent_amount, period_type, color_index, is_active, created_at, updated_at, total_stuffed_alltime, total_spent_alltime, last_reset_at) FROM stdin;
\.


--
-- Data for Name: feature_flag_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feature_flag_plans (id, feature_flag_id, plan_type, is_enabled, created_at) FROM stdin;
\.


--
-- Data for Name: feature_flag_user_overrides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feature_flag_user_overrides (id, user_id, feature_flag_id, is_enabled, created_at) FROM stdin;
\.


--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feature_flags (id, flag_key, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: financial_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financial_accounts (id, user_id, integration_connection_id, provider, provider_account_id, account_name, account_type, account_subtype, parent_account_id, account_currency, is_crypto, available_balance, current_balance, credit_limit, balance_source_type, last_balance_sync_at, tax_treatment, is_business_account, is_active, is_archived, archived_at, deleted_at, last_transaction_sync_at, last_snapshot_update_at, institution_name, institution_logo_url, mask, metadata, created_at, updated_at) FROM stdin;
36b11dab-f2d8-4cad-887e-053b62a9a034	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	xYNY6eeNb7Uv5zYNpRewsPJomLkA6vtOYy4AK	Thurayyah Main	depository	checking	\N	USD	f	1243.21	1293.20	\N	plaid	2026-04-28 22:38:45.737+00	taxable	f	t	f	\N	\N	\N	\N	TD Bank	\N	1409	{}	2026-04-28 01:41:31.768+00	2026-04-28 22:38:45.737+00
dc275ca9-43e5-4940-9e9a-99323136e5f3	81555e75-82a5-45e7-9882-6d8996c9727d	bbfd14d7-ec5e-42b8-9915-2a644297a046	snaptrade	8f4d7f73-114c-40bd-8ae4-44c890383d2a	IQVIA 401(K) PLAN	investment	401K	\N	USD	f	109520.47	109520.47	\N	snaptrade	2026-04-28 22:12:33.029+00	taxable	f	t	f	\N	\N	\N	\N	Fidelity	\N	2927	{"raw_type": "401K", "institution_account_id": "1182862927"}	2026-04-28 22:12:33.029+00	2026-04-28 22:12:33.029+00
fbb8259d-16d6-4a61-acf4-854ad4806623	81555e75-82a5-45e7-9882-6d8996c9727d	bbfd14d7-ec5e-42b8-9915-2a644297a046	snaptrade	90ec8c80-a746-4986-b112-19258abee601	Thurayyah's Rollover IRA Fidelity Go	investment	IRRL	\N	USD	f	2892.13	2892.13	\N	snaptrade	2026-04-28 22:12:34.735+00	taxable	f	t	f	\N	\N	\N	\N	Fidelity	\N	6949	{"raw_type": "IRRL", "institution_account_id": "760805655"}	2026-04-28 22:12:34.735+00	2026-04-28 22:12:34.735+00
96d72ece-e4ef-4562-8ae0-df4feb0b7301	81555e75-82a5-45e7-9882-6d8996c9727d	bbfd14d7-ec5e-42b8-9915-2a644297a046	snaptrade	f22e7e8e-b346-41a4-a016-1dbe22a94a19	ROTH IRA	investment	ROTH	\N	USD	f	1934.10	1934.10	\N	snaptrade	2026-04-28 22:12:36.453+00	taxable	f	t	f	\N	\N	\N	\N	Fidelity	\N	0583	{"raw_type": "ROTH", "institution_account_id": "1812293279"}	2026-04-28 22:12:36.453+00	2026-04-28 22:12:36.453+00
8af80cf7-0af0-4d34-b619-222fb9ad48fc	81555e75-82a5-45e7-9882-6d8996c9727d	bbfd14d7-ec5e-42b8-9915-2a644297a046	snaptrade	4b313b81-b00e-4c4e-97f4-64b2466b14e7	IMS HEALTH INCORPORATED RETIREMENT PLAN	investment	DB	\N	USD	f	0.00	0.00	\N	snaptrade	2026-04-28 22:12:37.652+00	taxable	f	t	f	\N	\N	\N	\N	Fidelity	\N	8203	{"raw_type": "DB", "institution_account_id": "1714208203"}	2026-04-28 22:12:37.652+00	2026-04-28 22:12:37.652+00
a735f4bd-6625-4251-b051-a179cde057fc	81555e75-82a5-45e7-9882-6d8996c9727d	bbfd14d7-ec5e-42b8-9915-2a644297a046	snaptrade	a7bc63ad-d58c-407a-aff9-0211774d7efd	Emergency CASH MANAGEMENT	investment	TODI	\N	USD	f	1873.37	1873.37	\N	snaptrade	2026-04-28 22:12:38.393+00	taxable	f	t	f	\N	\N	\N	\N	Fidelity	\N	9895	{"raw_type": "TODI", "institution_account_id": "144819347"}	2026-04-28 22:12:38.393+00	2026-04-28 22:12:38.393+00
c0e9542e-ce77-4967-b8fc-0c692aaa5bce	81555e75-82a5-45e7-9882-6d8996c9727d	bbfd14d7-ec5e-42b8-9915-2a644297a046	snaptrade	66be7829-7301-4e4d-a51d-e0bd8696dce7	Individual - TOD	investment	TODI	\N	USD	f	5793.49	5793.49	\N	snaptrade	2026-04-28 22:12:39.643+00	taxable	f	t	f	\N	\N	\N	\N	Fidelity	\N	5350	{"raw_type": "TODI", "institution_account_id": "913040607"}	2026-04-28 22:12:39.643+00	2026-04-28 22:12:39.643+00
5749b5ec-12e7-4624-8af0-9678561c26d3	81555e75-82a5-45e7-9882-6d8996c9727d	bbfd14d7-ec5e-42b8-9915-2a644297a046	snaptrade	603689e3-9422-4d21-ad09-8c0e0a8f2f4f	Travel CASH MANAGEMENT	investment	TODI	\N	USD	f	1028.90	1028.90	\N	snaptrade	2026-04-28 22:12:41.073+00	taxable	f	t	f	\N	\N	\N	\N	Fidelity	\N	3400	{"raw_type": "TODI", "institution_account_id": "1081447509"}	2026-04-28 22:12:41.073+00	2026-04-28 22:12:41.073+00
73d65657-9e74-40e5-ad75-d96a2efa6502	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	Je5e8VV5pvu9reOdPM1nuK6Y5ZxjO9fm6q8AX	TD BUSINESS PREMIER CHECKING	depository	checking	\N	USD	f	33.53	33.53	\N	plaid	2026-04-28 22:38:45.665+00	taxable	f	t	f	\N	\N	\N	\N	TD Bank	\N	0505	{}	2026-04-28 01:41:31.656+00	2026-04-28 22:38:45.665+00
415b3fa0-b187-4726-8d2c-8def88b4c586	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	8969Dvv6eAcjvJB6OadgurJnb1vL4DUxpB3mm	Car and repair	depository	savings	\N	USD	f	215.95	215.95	\N	plaid	2026-04-28 22:38:45.837+00	taxable	f	t	f	\N	\N	\N	\N	TD Bank	\N	4403	{}	2026-04-28 01:41:31.855+00	2026-04-28 22:38:45.837+00
3ab26e91-bfbd-435f-a9d5-8a15f0396245	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	Zwdw1VVdOnfDdXbKp8AZsdn867PqeAUbXjDz9	CREDITCARD	credit	credit card	\N	USD	f	25483.00	216.25	25700.00	plaid	2026-04-28 22:38:45.899+00	taxable	f	t	f	\N	\N	\N	\N	TD Bank	\N	8301	{}	2026-04-28 01:41:31.956+00	2026-04-28 22:38:45.899+00
\.


--
-- Data for Name: integration_connections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.integration_connections (id, user_id, provider, provider_name, institution_name, status, connection_status, sync_status, external_id, config, connection_metadata, last_synced, created_at, updated_at, access_token_encrypted) FROM stdin;
bbfd14d7-ec5e-42b8-9915-2a644297a046	81555e75-82a5-45e7-9882-6d8996c9727d	snaptrade	SnapTrade	Fidelity	active	active	synced	9947f459-15d3-4a9d-a8ef-048a92265095	{"userSecret": "c84d2ca4-a823-43e1-bd04-25cd0be60e9a", "snapTradeUserId": "81555e75-82a5-45e7-9882-6d8996c9727d"}	\N	2026-04-28 22:12:32.913	2026-04-28 22:11:51.015	2026-04-28 22:12:32.913	\N
65afa26c-c463-4f13-b215-05d20e261755	81555e75-82a5-45e7-9882-6d8996c9727d	plaid	plaid	TD Bank	active	active	synced	5b7bwKK7XyuVQwa957NJHeQa3YVjEaUDVYA64	{}	{"institution_id": "ins_14"}	2026-04-28 22:39:05.896	2026-04-27 22:50:49.207	2026-04-28 22:39:05.896	access-production-a81ef168-2411-4c2d-ba69-dd610a8e6722
\.


--
-- Data for Name: jurisdictions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jurisdictions (id, name, code, jurisdiction_type, country_code, parent_jurisdiction_id, effective_start_date, effective_end_date, is_active, created_at, updated_at) FROM stdin;
487cfcbf-70e4-4cf1-ae6f-fdebafcf5c80	Nevada	US-NV	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
4f853306-e8db-4e37-b0d5-672deeacba64	Oregon	US-OR	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
19087d4e-3617-4d4c-83d4-d042bfdd29d9	Connecticut	US-CT	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
210e9b49-d44c-4297-8af6-e03c796b9861	Nebraska	US-NE	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
ff8d1513-e4df-4acc-b080-61ca05330a16	Maryland	US-MD	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
ffac33df-9cae-43c5-afe0-3194ca4b5b81	Vermont	US-VT	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
018540cb-e686-43df-acd6-447e8a4789e9	Missouri	US-MO	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
0e88f0fe-2734-495a-9e47-76a82e9f928c	South Dakota	US-SD	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
cb947993-0ce3-4ccd-ac83-05a407f1554a	Indiana	US-IN	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
021079d5-8418-4aa8-9d16-36c35adb727e	Kentucky	US-KY	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
2ec38a80-1883-41ed-b3a1-e1b11c06e2ee	Maine	US-ME	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
bc59be93-27e4-4731-98b0-d1d821eab698	Pennsylvania	US-PA	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
7888aae6-96ee-4d67-8622-d5c2384e8380	Alaska	US-AK	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
ce0dc071-fd57-4c0b-893e-d6dcfacbe24b	Iowa	US-IA	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
cff4ea9b-6a83-4ea2-8f2e-911d518bd036	Rhode Island	US-RI	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
393e3b1d-2943-4293-af92-87058591a55e	Texas	US-TX	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
ef6d221a-411e-42bc-8c07-4a75936c8c3a	North Dakota	US-ND	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
9b06b036-9d9d-4855-8814-ba958fa4a2af	New Mexico	US-NM	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
d71f37e9-ab1d-45da-acc7-3ebe384947a5	Michigan	US-MI	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
62401298-3f81-4267-bf0a-c3eecbd5b1f4	Georgia	US-GA	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
a5d6d811-780f-4372-ba31-ea9768d1354f	Ohio	US-OH	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
c1df69a7-c574-4dd3-ba0d-ddc7770d558a	Hawaii	US-HI	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
8a1d3279-c6e9-43f4-8bdb-771918e0f172	Tennessee	US-TN	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
08130f6a-d8f7-41d6-8df7-74d2394df060	Alabama	US-AL	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
03f72823-c45f-4789-9fe2-99dcf8600f54	District of Columbia	US-DC	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
a3754c6a-f561-4268-97e0-93ec5de928ba	New York	US-NY	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
d7ad26d9-05b5-4b2b-93ad-934e01999bf2	Arizona	US-AZ	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
05f636ec-17c5-4283-afb8-e7b51511f723	North Carolina	US-NC	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
9c0f6af5-9e26-4dcf-b8ac-51a273bdda19	Massachusetts	US-MA	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
9460083d-69e8-4474-b793-7d5dbb02f7dc	Florida	US-FL	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
3a9920c2-4756-470d-9a96-bfa2a59da103	Kansas	US-KS	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
320341f5-8efe-46a8-a7a7-140d3fe9097a	New Jersey	US-NJ	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
d1725a0a-b133-422c-a84a-98e99093eee4	Washington	US-WA	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
2c4dbc13-48e2-481f-9d49-1a8a15ae0ebc	Arkansas	US-AR	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
f7f6e970-a75e-448b-89c8-27c335739a67	California	US-CA	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
93461882-13b9-4183-93d3-48c6efe8f103	Montana	US-MT	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
c25a7ac1-9439-40e6-ba5d-4174f0d6fc84	West Virginia	US-WV	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
2d2976a3-1616-4e4a-bd56-eff51ad95a5e	Oklahoma	US-OK	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
971dec3d-9a1e-44ba-952a-7cbf93c36af9	Utah	US-UT	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
78478d15-2101-4982-8de5-f550bfe763ec	Virginia	US-VA	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
19ad96a9-fc19-43d9-8a8a-4a2960618b15	Louisiana	US-LA	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
c116df8f-26c1-4547-aecb-25aa14889650	Illinois	US-IL	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
bae252b4-de23-4a02-8d82-d6b82a748504	Minnesota	US-MN	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
bb7cc3dc-d88f-46cd-b436-fbbbe0748b3d	Colorado	US-CO	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
bf1669b3-45d6-4e12-833b-2e4bb25cf893	Idaho	US-ID	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
c69225c6-ad9f-49b0-bcbe-d8dfd72cae48	Mississippi	US-MS	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
ec268e16-5574-4110-a662-5bb7c088b32c	Wyoming	US-WY	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
4db1c4da-83a0-482f-8bd8-04be81920064	South Carolina	US-SC	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
833d8931-5a53-49b9-b722-fd07d915c7ee	Delaware	US-DE	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
e9467c24-09fd-47c4-b2ce-dc49c4afa9c8	Wisconsin	US-WI	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	Federal	US-FED	federal	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
37d89539-2a09-4042-979d-c4759b0bb68a	New Hampshire	US-NH	state	US	\N	2000-01-01	\N	t	2026-04-23 22:01:12.928587+00	2026-04-23 22:01:12.928587+00
\.


--
-- Data for Name: portfolio_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.portfolio_snapshots (id, user_id, snapshot_date, total_net_worth, total_assets, total_liabilities, total_cash, total_investments, unrealized_gain, realized_gain, daily_change, daily_change_percent, base_currency, calculated_at, source, created_at) FROM stdin;
e5dd2383-4ee3-4237-8461-2e84ebc92c48	81555e75-82a5-45e7-9882-6d8996c9727d	2026-04-28	1326.43	1542.68	216.25	1542.68	0.00	0.00	\N	\N	\N	USD	2026-04-28 22:39:06.247+00	refresh_job	2026-04-28 01:41:54.699+00
\.


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.positions (id, user_id, financial_account_id, asset_symbol, asset_name, asset_type, currency, derivative_type, calculated_quantity, override_quantity, override_reason, override_updated_at, average_cost_basis, total_cost_basis, last_price, last_valuation, last_price_updated_at, unrealized_gain, strike_price, expiration_date, option_type, contract_multiplier, leverage_ratio, initial_margin_requirement, maintenance_margin_requirement, margin_used, is_short, last_calculated_at, last_synced_at, deleted_at, created_at, updated_at) FROM stdin;
17140648-ae28-401d-ae32-0ef402572622	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	USD	US Dollar	cash	USD	\N	1293.200000000000	\N	\N	\N	1.00000000	1293.20	1.00000000	1293.20	\N	0.00	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-04-28 22:39:05.999+00	2026-04-28 22:39:05.999+00	\N	2026-04-28 22:39:05.999+00	2026-04-28 22:39:05.999+00
0ccc0cb1-294c-4967-8514-62629f23d9d4	81555e75-82a5-45e7-9882-6d8996c9727d	73d65657-9e74-40e5-ad75-d96a2efa6502	USD	US Dollar	cash	USD	\N	33.530000000000	\N	\N	\N	1.00000000	33.53	1.00000000	33.53	\N	0.00	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-04-28 22:39:06.073+00	2026-04-28 22:39:06.073+00	\N	2026-04-28 22:39:06.073+00	2026-04-28 22:39:06.073+00
133c8729-262a-4527-9f5f-6af070ec0d9a	81555e75-82a5-45e7-9882-6d8996c9727d	415b3fa0-b187-4726-8d2c-8def88b4c586	USD	US Dollar	cash	USD	\N	215.950000000000	\N	\N	\N	1.00000000	215.95	1.00000000	215.95	\N	0.00	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-04-28 22:39:06.136+00	2026-04-28 22:39:06.136+00	\N	2026-04-28 22:39:06.136+00	2026-04-28 22:39:06.136+00
\.


--
-- Data for Name: refresh_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_jobs (id, user_id, trigger_mode, status, current_stage, progress, error_message, error_stage, retry_count, queued_at, started_at, completed_at, execution_time_ms) FROM stdin;
24398e83-5174-4d68-8a98-3e4ef1e57d2b	9d507dde-9787-44bd-ab72-329d7538483b	manual	queued	\N	0	\N	\N	0	2026-04-27 23:39:26.378115+00	\N	\N	\N
547c77a7-a581-4d99-8c9c-f949c0715112	81555e75-82a5-45e7-9882-6d8996c9727d	manual	failed	sync_integrations	5	Plaid accounts fetch failed: {"display_message":null,"documentation_url":"https://plaid.com/docs/?ref=error#invalid-input-errors","error_code":"INVALID_API_KEYS","error_message":"invalid client_id or secret provided","error_type":"INVALID_INPUT","request_id":"1a9c5cde299311f","suggested_action":null}	\N	0	2026-04-28 00:45:28.194+00	2026-04-28 00:45:28.559+00	2026-04-28 00:45:28.858+00	391
0ae2951e-23d9-427e-ac02-3259136d3b9e	81555e75-82a5-45e7-9882-6d8996c9727d	manual	failed	sync_integrations	5	Plaid accounts fetch failed: {"display_message":null,"documentation_url":"https://plaid.com/docs/?ref=error#invalid-input-errors","error_code":"INVALID_API_KEYS","error_message":"invalid client_id or secret provided","error_type":"INVALID_INPUT","request_id":"3ec2f46aae5b038","suggested_action":null}	\N	0	2026-04-28 00:53:53.555+00	2026-04-28 00:53:53.909+00	2026-04-28 00:53:54.192+00	442
c82b6c2c-5052-4889-a7f5-b0167eaeef32	81555e75-82a5-45e7-9882-6d8996c9727d	manual	failed	\N	0	Reset - was stuck in queued state	\N	0	2026-04-28 01:03:17.865+00	\N	2026-04-28 01:27:29.900834+00	\N
3a1975be-8c01-4eba-ba5b-d80c7026daa8	81555e75-82a5-45e7-9882-6d8996c9727d	manual	failed	\N	0	Reset - stuck in queued state	\N	0	2026-04-28 01:28:01.098+00	\N	2026-04-28 01:38:23.01899+00	\N
c6dc4f78-dfbc-4746-9d0c-db0620c6fbc0	81555e75-82a5-45e7-9882-6d8996c9727d	manual	completed	completed	100	\N	\N	0	2026-04-28 20:17:02.333+00	2026-04-28 20:17:02.643+00	2026-04-28 20:17:32.71+00	30183
1826b354-7f2d-4980-b48e-fb9b390b0d70	81555e75-82a5-45e7-9882-6d8996c9727d	manual	completed	completed	100	\N	\N	0	2026-04-28 19:00:48.019+00	2026-04-28 19:00:48.62+00	2026-04-28 19:01:38.611+00	50099
25727a67-fd18-41b4-a51a-6d87e2e0de26	81555e75-82a5-45e7-9882-6d8996c9727d	manual	completed	completed	100	\N	\N	0	2026-04-28 01:38:43.337+00	2026-04-28 01:41:31.177+00	2026-04-28 01:41:56.555+00	25499
e99692b9-28fb-4f4c-a6c1-34f9fba8ae6d	81555e75-82a5-45e7-9882-6d8996c9727d	manual	completed	completed	100	\N	\N	0	2026-04-28 20:21:25.762+00	2026-04-28 20:21:26.07+00	2026-04-28 20:21:56.097+00	30151
24e56845-2d05-4578-96c7-f9f548970dac	81555e75-82a5-45e7-9882-6d8996c9727d	manual	completed	completed	100	\N	\N	0	2026-04-28 17:58:11.617+00	2026-04-28 17:58:11.903+00	2026-04-28 17:58:41.336+00	29521
df7a0e6b-ad8d-4015-b852-ab95b8e98a47	81555e75-82a5-45e7-9882-6d8996c9727d	manual	completed	completed	100	\N	\N	0	2026-04-28 19:51:02.149+00	2026-04-28 19:51:02.505+00	2026-04-28 19:51:32.045+00	29685
ab4a9e0c-d9d5-449b-b104-a9a2b2a07aca	81555e75-82a5-45e7-9882-6d8996c9727d	manual	completed	completed	100	\N	\N	0	2026-04-28 22:38:44.771+00	2026-04-28 22:38:45.187+00	2026-04-28 22:39:08.562+00	23613
d28915d7-da42-42ab-9a33-6fa077c97d23	81555e75-82a5-45e7-9882-6d8996c9727d	manual	completed	completed	100	\N	\N	0	2026-04-28 18:21:46.292+00	2026-04-28 18:21:46.611+00	2026-04-28 18:22:42.915+00	56400
c712140c-9569-4562-8d18-b4f2b9721148	81555e75-82a5-45e7-9882-6d8996c9727d	manual	completed	completed	100	\N	\N	0	2026-04-28 19:59:18.586+00	2026-04-28 19:59:18.924+00	2026-04-28 20:00:25.928+00	67114
a6473e8d-3658-45c3-a5aa-f84f6f396390	81555e75-82a5-45e7-9882-6d8996c9727d	manual	completed	completed	100	\N	\N	0	2026-04-28 20:15:00.003+00	2026-04-28 20:15:00.302+00	2026-04-28 20:15:29.914+00	29736
\.


--
-- Data for Name: risk_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.risk_snapshots (id, user_id, financial_account_id, snapshot_date, total_margin_used, total_initial_margin_required, total_maintenance_margin_required, gross_exposure, net_exposure, leverage_ratio, margin_buffer, risk_level, calculated_at, source, created_at) FROM stdin;
\.


--
-- Data for Name: savings_goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.savings_goals (id, user_id, financial_account_id, name, description, target_amount, current_amount, start_date, target_date, status, required_monthly_contribution, projected_completion_date, savings_velocity, created_at, updated_at, goal_type, monthly_target, cumulative_amount, last_reset_at) FROM stdin;
\.


--
-- Data for Name: spending_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spending_snapshots (id, user_id, category_id, snapshot_date, period_type, period_start_date, period_end_date, total_spent, transaction_count, average_transaction_value, calculated_at, source, created_at) FROM stdin;
\.


--
-- Data for Name: sync_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sync_logs (id, user_id, integration_connection_id, provider, trigger_mode, status, started_at, completed_at, accounts_synced, transactions_synced, error_message, created_at) FROM stdin;
3119cec6-e622-45d5-9fb4-9ef8ebe91c84	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	manual	failed	2026-04-28 00:45:28.678+00	2026-04-28 00:45:28.77+00	0	0	Plaid accounts fetch failed: {"display_message":null,"documentation_url":"https://plaid.com/docs/?ref=error#invalid-input-errors","error_code":"INVALID_API_KEYS","error_message":"invalid client_id or secret provided","error_type":"INVALID_INPUT","request_id":"1a9c5cde299311f","suggested_action":null}	2026-04-28 00:45:28.678+00
dcc1687a-2573-4048-94fd-190e5f664872	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	manual	failed	2026-04-28 00:53:54.006+00	2026-04-28 00:53:54.089+00	0	0	Plaid accounts fetch failed: {"display_message":null,"documentation_url":"https://plaid.com/docs/?ref=error#invalid-input-errors","error_code":"INVALID_API_KEYS","error_message":"invalid client_id or secret provided","error_type":"INVALID_INPUT","request_id":"3ec2f46aae5b038","suggested_action":null}	2026-04-28 00:53:54.006+00
5be30a67-3a46-409d-bebc-61b8beafe1c0	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	manual	success	2026-04-28 01:41:31.297+00	2026-04-28 01:41:54.262+00	4	283	\N	2026-04-28 01:41:31.297+00
24e475ac-d5cd-4477-8653-617b32ab1964	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	manual	success	2026-04-28 17:58:12.011+00	2026-04-28 17:58:38.707+00	4	285	\N	2026-04-28 17:58:12.011+00
171fe6ab-79cc-4e2a-9d2b-fcf8bd9ed6fe	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	manual	success	2026-04-28 18:21:46.735+00	2026-04-28 18:22:34.174+00	4	285	\N	2026-04-28 18:21:46.735+00
0f74a0de-4778-400a-9dcc-0c410911f2e2	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	manual	success	2026-04-28 19:00:48.812+00	2026-04-28 19:01:35.179+00	4	285	\N	2026-04-28 19:00:48.812+00
3cc17b24-82eb-4ac3-a67f-4ecab79fb73e	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	manual	success	2026-04-28 19:51:02.614+00	2026-04-28 19:51:29.778+00	4	285	\N	2026-04-28 19:51:02.614+00
1340825c-c86c-4fd8-947c-2fc72ddde416	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	manual	success	2026-04-28 19:59:19.116+00	2026-04-28 20:00:21.114+00	4	285	\N	2026-04-28 19:59:19.116+00
82e28188-fffd-4a95-b48d-52176f2c2cb2	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	manual	success	2026-04-28 20:15:00.414+00	2026-04-28 20:15:27.115+00	4	285	\N	2026-04-28 20:15:00.414+00
bc7fd216-51bf-4f70-a3b5-7f9f5326b277	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	manual	success	2026-04-28 20:17:02.749+00	2026-04-28 20:17:30.105+00	4	285	\N	2026-04-28 20:17:02.749+00
3f4fcb2e-76fe-4ca5-85b8-f63ea7b5880b	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	manual	success	2026-04-28 20:21:26.262+00	2026-04-28 20:21:53.161+00	4	285	\N	2026-04-28 20:21:26.262+00
91ead437-0806-41ed-8ccb-e6f73b5ead25	81555e75-82a5-45e7-9882-6d8996c9727d	65afa26c-c463-4f13-b215-05d20e261755	plaid	manual	success	2026-04-28 22:38:45.299+00	2026-04-28 22:39:05.855+00	4	285	\N	2026-04-28 22:38:45.299+00
\.


--
-- Data for Name: tax_estimates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tax_estimates (id, user_id, tax_profile_id, jurisdiction_id, tax_year, period_type, quarter, period_start_date, period_end_date, taxable_income, income_tax, capital_gains_tax, qualified_dividend_tax, self_employment_tax, corporate_tax, section_1256_tax, total_tax_liability, total_payments_applied, balance_due, underpayment_flag, calculated_at, source, created_at) FROM stdin;
\.


--
-- Data for Name: tax_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tax_payments (id, user_id, tax_profile_id, jurisdiction_id, tax_estimate_id, tax_year, period_type, quarter, payment_date, amount, payment_method, confirmation_number, notes, created_at) FROM stdin;
\.


--
-- Data for Name: tax_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tax_profiles (id, user_id, profile_name, entity_type, filing_status, tax_year, is_primary, is_active, created_at, updated_at, jurisdiction_id, state_jurisdiction_id, state_jurisdiction_id_2) FROM stdin;
\.


--
-- Data for Name: tax_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tax_rates (id, jurisdiction_id, tax_year, tax_type, filing_status, bracket_min, bracket_max, rate, effective_start_date, effective_end_date, is_active, created_at) FROM stdin;
0996bfff-b46f-4e3d-8ffe-90600ac9f9ac	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	single	0.00	11925.00	0.10000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
c97e71ff-effc-41ec-9c91-35e14e167708	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	single	11926.00	48475.00	0.12000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
d28e77b2-8e36-4917-a696-07188b4816d1	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	single	48476.00	103350.00	0.22000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
ae4d583c-5d02-42c9-a754-35bd88cfaf23	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	single	103351.00	197300.00	0.24000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
a948bd77-79ff-4297-b624-6bef83cfabdc	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	single	197301.00	250525.00	0.32000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
b2095253-d9be-4da0-abd3-ee6d4614d475	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	single	250526.00	626350.00	0.35000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
59662801-2307-4758-97ab-e48438f9dbe1	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	single	626351.00	\N	0.37000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
27d2b9dd-4481-412e-bf4b-a989543ac2cb	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	married_joint	0.00	23850.00	0.10000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
191bc58c-2017-44e0-a393-4495e05d2066	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	married_joint	23851.00	96950.00	0.12000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
25c3f090-0214-4737-8763-b00e8a981646	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	married_joint	96951.00	206700.00	0.22000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
d1c98c72-4695-4478-ae73-0787b9174423	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	married_joint	206701.00	394600.00	0.24000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
6456f031-9b48-4e4e-918d-9edeeeb28c31	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	married_joint	394601.00	501050.00	0.32000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
5da165be-cb2d-4a11-bab2-84ac320ed2bb	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	married_joint	501051.00	751600.00	0.35000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
646e2643-3394-4ea3-add0-ee7bb198f167	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	married_joint	751601.00	\N	0.37000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
8a4681d3-260a-4cab-bb71-bdedd0051b75	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	married_separate	0.00	11925.00	0.10000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
831a7915-5aa3-482d-9d1d-e0f48dbeda13	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	married_separate	11926.00	48475.00	0.12000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
82cdc139-ceca-46d0-b96e-9d670a91b9d4	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	married_separate	48476.00	103350.00	0.22000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
9f78610c-3d60-4764-b881-6f3733ccffa8	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	married_separate	103351.00	197300.00	0.24000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
8f274e1b-128e-407a-978e-9b8f52f0f89c	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	married_separate	197301.00	250525.00	0.32000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
8ef3cbc9-338e-4d96-b21f-d3127793461e	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	married_separate	250526.00	375800.00	0.35000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
9a66f446-dbe5-4763-9aad-23fa98e06418	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	married_separate	375801.00	\N	0.37000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
bce53bb3-32be-4797-b2bb-aee59d0ec49e	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	head_of_household	0.00	17000.00	0.10000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
2e701860-1631-4882-9e98-b1a0ec0fd023	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	head_of_household	17001.00	64850.00	0.12000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
423912f2-2f2a-4c95-8596-406e1c1d4677	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	head_of_household	64851.00	103350.00	0.22000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
030a6e96-4085-40b6-8fe5-84a1c0e1908b	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	head_of_household	103351.00	197300.00	0.24000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
81e022f1-f298-424a-8928-5d788acf2172	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	head_of_household	197301.00	250500.00	0.32000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
538ac76d-255b-43b5-9f48-60ee0cc03612	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	head_of_household	250501.00	626350.00	0.35000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
d65ac1a6-4313-4892-9ff7-b175c77386f1	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2025	income	head_of_household	626351.00	\N	0.37000	2025-01-01	2025-12-31	t	2026-04-23 22:08:40.925613+00
0be83f0e-231d-4947-b09f-0b1914d50dbc	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	single	0.00	12400.00	0.10000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
0e75039a-f4ff-4157-8aba-da91df321e36	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	single	12401.00	50400.00	0.12000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
18fb1c11-d0d7-4caa-b75c-f061bf0b9715	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	single	50401.00	105700.00	0.22000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
a302cd41-88d8-4c1a-80e1-7c202fabc2e6	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	single	105701.00	201775.00	0.24000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
f8381c6e-34c8-40ef-a544-3a58ef5754d3	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	single	201776.00	256225.00	0.32000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
ae3d3a94-14c0-4c82-aed2-aa2f02a01540	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	single	256226.00	640600.00	0.35000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
089d204c-5099-4591-a22c-2422bc63481d	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	single	640601.00	\N	0.37000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
0fff8b71-1659-4cec-9520-f1059e700b3f	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	married_joint	0.00	24800.00	0.10000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
e3fe516d-b208-4211-bd71-c05cb3f1ae7b	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	married_joint	24801.00	100800.00	0.12000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
9f357815-5bc7-457d-9911-464cb75ba606	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	married_joint	100801.00	211400.00	0.22000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
32470c47-fb80-4f24-ab84-8314549c4a98	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	married_joint	211401.00	403550.00	0.24000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
af27bd6a-b47e-4525-b83d-18d0958356a0	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	married_joint	403551.00	512450.00	0.32000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
1f9d381b-18a4-483b-a85f-b0aa71244480	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	married_joint	512451.00	768700.00	0.35000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
9b76e78a-4c10-4a49-a399-d3a34a8e9659	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	married_joint	768701.00	\N	0.37000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
309812e6-eeb7-4a4d-9b9a-e3eeec6ae3f0	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	married_separate	0.00	12400.00	0.10000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
612c255b-f90e-4c7b-8588-5bb5f3aeb956	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	married_separate	12401.00	50400.00	0.12000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
e2111d14-8b06-4e35-9263-2b00dae80bb8	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	married_separate	50401.00	105700.00	0.22000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
ef4a6af7-4ee0-4a20-a598-caffe71c14c1	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	married_separate	105701.00	201775.00	0.24000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
87e837dc-0922-4133-a290-2d7b871c3dea	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	married_separate	201776.00	256225.00	0.32000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
444e44a2-f5a5-4bd2-b2d5-9048785e361a	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	married_separate	256226.00	384350.00	0.35000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
a3de323b-5f36-4d3b-83ee-6247eb332ffa	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	married_separate	384351.00	\N	0.37000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
fc20d9f9-36dd-4924-a42b-0c39a0ec050a	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	head_of_household	0.00	17700.00	0.10000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
b06b3a49-2c8a-4dc5-bd84-e6e2e316ba0f	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	head_of_household	17701.00	67450.00	0.12000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
63db5a58-ea54-4f1d-877b-1ff28bd16b27	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	head_of_household	67451.00	105700.00	0.22000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
c6a91141-e085-4ded-aa91-169b69708c16	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	head_of_household	105701.00	201750.00	0.24000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
bad7d379-526c-49f3-a85f-afb3decaa263	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	head_of_household	201751.00	256200.00	0.32000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
221cabf9-b36d-4283-8a5f-d156f9f43558	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	head_of_household	256201.00	640600.00	0.35000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
e7ed6a08-fe8c-4cc1-b34d-257d4ff7266b	dd5b4b1b-38ea-44aa-a174-5dcc6b08b9c2	2026	income	head_of_household	640601.00	\N	0.37000	2026-01-01	\N	t	2026-04-23 22:09:54.195025+00
46369539-7a58-417f-9a9a-f5998a437ab4	cb947993-0ce3-4ccd-ac83-05a407f1554a	2026	income	\N	0.00	\N	0.02950	2026-01-01	\N	t	2026-04-23 22:29:47.726235+00
24eeccbd-b0b0-4774-9411-ad8e4f5aa2a0	cb947993-0ce3-4ccd-ac83-05a407f1554a	2025	income	\N	0.00	\N	0.03000	2025-01-01	2025-12-31	t	2026-04-23 22:29:47.726235+00
4165d491-b64b-48b4-8e0d-22c89a167f51	021079d5-8418-4aa8-9d16-36c35adb727e	2026	income	\N	0.00	\N	0.04000	2026-01-01	\N	t	2026-04-23 22:29:47.726235+00
dc70e351-8d1d-47af-a8fa-3bd71e364739	021079d5-8418-4aa8-9d16-36c35adb727e	2025	income	\N	0.00	\N	0.04000	2025-01-01	2025-12-31	t	2026-04-23 22:29:47.726235+00
68dc7fd5-f9ee-4437-8b86-bbc4e4342f1c	bc59be93-27e4-4731-98b0-d1d821eab698	2026	income	\N	0.00	\N	0.03070	2026-01-01	\N	t	2026-04-23 22:29:47.726235+00
22a29e50-8819-442a-8459-91802366a717	bc59be93-27e4-4731-98b0-d1d821eab698	2025	income	\N	0.00	\N	0.03070	2025-01-01	2025-12-31	t	2026-04-23 22:29:47.726235+00
49ea3096-6bca-49fa-b5b1-2f262e38e2f2	ce0dc071-fd57-4c0b-893e-d6dcfacbe24b	2026	income	\N	0.00	\N	0.03800	2026-01-01	\N	t	2026-04-23 22:29:47.726235+00
0f7ed286-8228-41c9-8632-0294e121be6d	ce0dc071-fd57-4c0b-893e-d6dcfacbe24b	2025	income	\N	0.00	\N	0.03800	2025-01-01	2025-12-31	t	2026-04-23 22:29:47.726235+00
1205721f-c68d-4808-aee7-4933c3097572	d71f37e9-ab1d-45da-acc7-3ebe384947a5	2026	income	\N	0.00	\N	0.04250	2026-01-01	\N	t	2026-04-23 22:29:47.726235+00
59015195-c009-423c-966e-1a89f666c7dc	d71f37e9-ab1d-45da-acc7-3ebe384947a5	2025	income	\N	0.00	\N	0.04250	2025-01-01	2025-12-31	t	2026-04-23 22:29:47.726235+00
9cac91ca-205c-4be2-8720-23efa85a125a	62401298-3f81-4267-bf0a-c3eecbd5b1f4	2026	income	\N	0.00	\N	0.04990	2026-01-01	\N	t	2026-04-23 22:29:47.726235+00
ef795da2-cc07-48af-b5e6-d43f13c0e151	62401298-3f81-4267-bf0a-c3eecbd5b1f4	2025	income	\N	0.00	\N	0.05190	2025-01-01	2025-12-31	t	2026-04-23 22:29:47.726235+00
7e839eab-518c-4924-bb2f-c30172414921	a5d6d811-780f-4372-ba31-ea9768d1354f	2026	income	\N	0.00	\N	0.02750	2026-01-01	\N	t	2026-04-23 22:29:47.726235+00
6af5d390-0e4b-47ac-bd72-698a247d7b0e	d7ad26d9-05b5-4b2b-93ad-934e01999bf2	2026	income	\N	0.00	\N	0.02500	2026-01-01	\N	t	2026-04-23 22:29:47.726235+00
b5acf793-78c9-4c00-98d0-df6a519dd0fa	d7ad26d9-05b5-4b2b-93ad-934e01999bf2	2025	income	\N	0.00	\N	0.02500	2025-01-01	2025-12-31	t	2026-04-23 22:29:47.726235+00
45fa911e-3ee0-4c51-a2dc-e1fecc0353d2	05f636ec-17c5-4283-afb8-e7b51511f723	2026	income	\N	0.00	\N	0.03990	2026-01-01	\N	t	2026-04-23 22:29:47.726235+00
46570d5d-36be-41fa-8c9f-40ddaadad96e	05f636ec-17c5-4283-afb8-e7b51511f723	2025	income	\N	0.00	\N	0.04250	2025-01-01	2025-12-31	t	2026-04-23 22:29:47.726235+00
c7808297-304d-41af-abb2-8250d5dc6703	971dec3d-9a1e-44ba-952a-7cbf93c36af9	2026	income	\N	0.00	\N	0.04450	2026-01-01	\N	t	2026-04-23 22:29:47.726235+00
550bde17-e726-4951-aa39-27fc902bb91c	971dec3d-9a1e-44ba-952a-7cbf93c36af9	2025	income	\N	0.00	\N	0.04500	2025-01-01	2025-12-31	t	2026-04-23 22:29:47.726235+00
6886bc35-e16f-4a1b-8321-54e67d35114e	19ad96a9-fc19-43d9-8a8a-4a2960618b15	2026	income	\N	0.00	\N	0.03000	2026-01-01	\N	t	2026-04-23 22:29:47.726235+00
79e04747-2eb9-48f5-8a34-9a6f76d54658	19ad96a9-fc19-43d9-8a8a-4a2960618b15	2025	income	\N	0.00	\N	0.03000	2025-01-01	2025-12-31	t	2026-04-23 22:29:47.726235+00
89117fd6-7ea8-4e1a-ad6e-b0dfa7b67196	c116df8f-26c1-4547-aecb-25aa14889650	2026	income	\N	0.00	\N	0.04950	2026-01-01	\N	t	2026-04-23 22:29:47.726235+00
ee5d7bc3-dd2e-4f68-ba78-4153387e1eff	c116df8f-26c1-4547-aecb-25aa14889650	2025	income	\N	0.00	\N	0.04950	2025-01-01	2025-12-31	t	2026-04-23 22:29:47.726235+00
507e5e35-bf24-4a3a-8081-014cf8b70255	bb7cc3dc-d88f-46cd-b436-fbbbe0748b3d	2025	income	\N	0.00	\N	0.04400	2025-01-01	2025-12-31	t	2026-04-23 22:29:47.726235+00
e17ab11c-6bc6-4b7b-acc1-2443cde13f7e	9c0f6af5-9e26-4dcf-b8ac-51a273bdda19	2026	income	\N	1000001.00	\N	0.09000	2026-01-01	\N	t	2026-04-23 22:30:21.147402+00
20633598-9be5-4b81-8a92-73c72222af28	9c0f6af5-9e26-4dcf-b8ac-51a273bdda19	2026	income	\N	0.00	1000000.00	0.05000	2026-01-01	\N	t	2026-04-23 22:30:21.147402+00
a5079e31-3e8b-421d-b4e2-8adef32c1b5e	9c0f6af5-9e26-4dcf-b8ac-51a273bdda19	2025	income	\N	1000001.00	\N	0.09000	2025-01-01	2025-12-31	t	2026-04-23 22:30:21.147402+00
f60db226-8822-4740-bec2-9501de3cf9a2	9c0f6af5-9e26-4dcf-b8ac-51a273bdda19	2025	income	\N	0.00	1000000.00	0.05000	2025-01-01	2025-12-31	t	2026-04-23 22:30:21.147402+00
d210ccf1-717b-436b-8056-f65d311b1879	c69225c6-ad9f-49b0-bcbe-d8dfd72cae48	2026	income	\N	10001.00	\N	0.04000	2026-01-01	\N	t	2026-04-23 22:30:21.147402+00
9e0a78b3-ee8b-49d4-b111-f67ba3a4d761	c69225c6-ad9f-49b0-bcbe-d8dfd72cae48	2026	income	\N	0.00	10000.00	0.00000	2026-01-01	\N	t	2026-04-23 22:30:21.147402+00
4c354940-cf44-49e3-af21-66b65b2fe91f	c69225c6-ad9f-49b0-bcbe-d8dfd72cae48	2025	income	\N	10001.00	\N	0.04400	2025-01-01	2025-12-31	t	2026-04-23 22:30:21.147402+00
49c9c83b-7443-4820-a5d0-95da6d3315d1	c69225c6-ad9f-49b0-bcbe-d8dfd72cae48	2025	income	\N	0.00	10000.00	0.00000	2025-01-01	2025-12-31	t	2026-04-23 22:30:21.147402+00
8bcd52a6-8547-4306-af42-2aaa35b15253	bb7cc3dc-d88f-46cd-b436-fbbbe0748b3d	2026	income	\N	0.00	\N	0.04000	2026-01-01	\N	t	2026-04-23 22:29:47.726235+00
00f4f190-7633-4592-b014-4296997f255e	bf1669b3-45d6-4e12-833b-2e4bb25cf893	2025	income	\N	0.00	\N	0.05695	2025-01-01	2025-12-31	t	2026-04-23 22:49:10.558458+00
d4871b5b-b476-4823-af43-36555c31fa07	bf1669b3-45d6-4e12-833b-2e4bb25cf893	2026	income	\N	0.00	\N	0.05695	2026-01-01	\N	t	2026-04-23 22:49:10.558458+00
5468de2b-e16f-4b48-bf10-ecaed9b2e58c	210e9b49-d44c-4297-8af6-e03c796b9861	2025	income	\N	0.00	3700.00	0.02460	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
af9f9654-83f6-4729-aeb3-f00985062100	4f853306-e8db-4e37-b0d5-672deeacba64	2025	income	\N	125001.00	\N	0.09900	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
c2378fa6-24c6-4ba6-b116-e83445d3ec0c	018540cb-e686-43df-acd6-447e8a4789e9	2026	income	\N	2415.00	3621.00	0.03000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
a38e8f39-27ae-418a-8a2b-7e7ce91c9137	03f72823-c45f-4789-9fe2-99dcf8600f54	2025	income	\N	500001.00	1000000.00	0.09750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
3e3f0f12-9b35-4a5c-8ab1-8da6a1f6a038	bae252b4-de23-4a02-8d82-d6b82a748504	2025	income	\N	183341.00	\N	0.09850	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
ab962ce3-ec69-4bbb-be35-a4878e73bd1d	4f853306-e8db-4e37-b0d5-672deeacba64	2025	income	\N	10001.00	25000.00	0.06750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
3b22ae14-3088-45f9-af93-3456b1e70cf5	c25a7ac1-9439-40e6-ba5d-4174f0d6fc84	2025	income	\N	60001.00	\N	0.04820	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
66ed8db1-70e1-4bd0-ae7e-d57a31a24619	833d8931-5a53-49b9-b722-fd07d915c7ee	2025	income	\N	2001.00	5000.00	0.02200	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
5329f855-50c5-4c02-8a27-6ad14da29723	2d2976a3-1616-4e4a-bd56-eff51ad95a5e	2026	income	\N	50001.00	\N	0.04500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
ce10fd2c-e8f9-4b63-8ffb-282174a4be4f	a3754c6a-f561-4268-97e0-93ec5de928ba	2026	income	\N	13901.00	21400.00	0.05850	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
5de2202b-98ff-4285-b4b3-0531bb9f8dbb	2ec38a80-1883-41ed-b3a1-e1b11c06e2ee	2026	income	\N	58051.00	\N	0.07150	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
ae662915-0266-41ba-94a5-5e35517dce3d	833d8931-5a53-49b9-b722-fd07d915c7ee	2025	income	\N	5001.00	10000.00	0.03900	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
52541728-815d-4e57-8477-215dbdcc43aa	f7f6e970-a75e-448b-89c8-27c335739a67	2026	income	\N	70607.00	360659.00	0.09300	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
3a3ff24d-a6d7-4bfb-a6c1-ef606dcbef78	320341f5-8efe-46a8-a7a7-140d3fe9097a	2026	income	\N	1000001.00	\N	0.10750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
31a2563f-c826-4e3f-a363-8c9287fc5206	19087d4e-3617-4d4c-83d4-d042bfdd29d9	2025	income	\N	200001.00	250000.00	0.06500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
662f2cab-7466-439c-af16-da60146d996a	4f853306-e8db-4e37-b0d5-672deeacba64	2026	income	\N	25001.00	125000.00	0.08750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
4653c4b3-c4b1-46e2-8d10-2cc84762ca10	ff8d1513-e4df-4acc-b080-61ca05330a16	2026	income	\N	2001.00	3000.00	0.04000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
4c524074-bde3-488a-a1e7-725928ec8e5e	19087d4e-3617-4d4c-83d4-d042bfdd29d9	2025	income	\N	10001.00	50000.00	0.05000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
c23e0993-3472-4d72-9fee-233cf530b8a8	e9467c24-09fd-47c4-b2ce-dc49c4afa9c8	2026	income	\N	14321.00	28640.00	0.04400	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
2a3a3aa2-d697-4079-9448-e9b13516ddc5	f7f6e970-a75e-448b-89c8-27c335739a67	2025	income	\N	360660.00	432787.00	0.10300	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
1f34c6db-f02b-4b1f-9166-46ac6e1c0830	a3754c6a-f561-4268-97e0-93ec5de928ba	2026	income	\N	215401.00	1077550.00	0.09650	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
d4708255-abc7-42b0-93e4-3189c03063cc	93461882-13b9-4183-93d3-48c6efe8f103	2025	income	\N	0.00	20500.00	0.04700	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
af2a950c-fed7-43b4-b28c-07ae25482bce	19087d4e-3617-4d4c-83d4-d042bfdd29d9	2026	income	\N	100001.00	200000.00	0.06000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
9200e998-bd09-4865-9330-4cfc8dead3a6	ff8d1513-e4df-4acc-b080-61ca05330a16	2025	income	\N	2001.00	3000.00	0.04000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
e506dac4-3ef1-42e7-b5d4-a453c6d3f426	19087d4e-3617-4d4c-83d4-d042bfdd29d9	2026	income	\N	10001.00	50000.00	0.05000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
cc74fe38-7f37-4265-b778-a0633bc76d58	e9467c24-09fd-47c4-b2ce-dc49c4afa9c8	2025	income	\N	14321.00	28640.00	0.04400	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
aba1ccbf-40ef-4cf0-a33c-c793aa559934	f7f6e970-a75e-448b-89c8-27c335739a67	2026	income	\N	360660.00	432787.00	0.10300	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
398fa9e6-def7-464c-b610-9fa897328a54	a3754c6a-f561-4268-97e0-93ec5de928ba	2025	income	\N	215401.00	1077550.00	0.09650	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
97d7bc24-edb8-4b3f-b22c-795fa3345039	93461882-13b9-4183-93d3-48c6efe8f103	2026	income	\N	0.00	35000.00	0.04700	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
7824bb6b-92c7-453f-bd63-dcc560eb117e	19087d4e-3617-4d4c-83d4-d042bfdd29d9	2025	income	\N	100001.00	200000.00	0.06000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
2434cb14-6870-458a-8b27-0d5e83502626	4f853306-e8db-4e37-b0d5-672deeacba64	2025	income	\N	25001.00	125000.00	0.08750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
21c10639-d975-465e-a7c5-01fc8719d793	320341f5-8efe-46a8-a7a7-140d3fe9097a	2025	income	\N	1000001.00	\N	0.10750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
132148fe-445d-4695-bc7a-3e75bccfaab2	19087d4e-3617-4d4c-83d4-d042bfdd29d9	2026	income	\N	200001.00	250000.00	0.06500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
911c7775-cb4e-4fc1-8cc9-53df7d3271a2	f7f6e970-a75e-448b-89c8-27c335739a67	2025	income	\N	70607.00	360659.00	0.09300	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
3ae3c2af-660f-441f-ab81-6c478f69c13b	4db1c4da-83a0-482f-8bd8-04be81920064	2025	income	\N	3461.00	17330.00	0.03000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
f5c59499-eeb2-4f53-8206-0296caa8b5c2	a3754c6a-f561-4268-97e0-93ec5de928ba	2025	income	\N	13901.00	21400.00	0.05850	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
dc92c4ef-2573-4b5e-81b7-0eea0ebcd1be	2ec38a80-1883-41ed-b3a1-e1b11c06e2ee	2025	income	\N	58051.00	\N	0.07150	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
f8ea0d04-08c6-4f40-8246-b63d656e035f	833d8931-5a53-49b9-b722-fd07d915c7ee	2026	income	\N	5001.00	10000.00	0.03900	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
e8ea6967-0dc2-41ae-929b-2d81f9db1294	4f853306-e8db-4e37-b0d5-672deeacba64	2026	income	\N	10001.00	25000.00	0.06750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
aae93ddb-4793-466a-bd13-19630f6cce2a	c25a7ac1-9439-40e6-ba5d-4174f0d6fc84	2026	income	\N	60001.00	\N	0.04820	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
6fbcbe01-663c-4fcb-805d-e2787754bd13	833d8931-5a53-49b9-b722-fd07d915c7ee	2026	income	\N	2001.00	5000.00	0.02200	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
37f4f965-cc4e-4d8a-959a-bac8c675da89	03f72823-c45f-4789-9fe2-99dcf8600f54	2026	income	\N	500001.00	1000000.00	0.09750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
2d2e3748-22bf-4a3c-b08e-de520e75570f	bae252b4-de23-4a02-8d82-d6b82a748504	2026	income	\N	183341.00	\N	0.09850	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
d28eb03e-a592-4103-907d-403293b13ce5	210e9b49-d44c-4297-8af6-e03c796b9861	2026	income	\N	0.00	3700.00	0.02460	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
da146f57-edba-4706-9cf3-bc7215a5b200	a5d6d811-780f-4372-ba31-ea9768d1354f	2025	income	\N	0.00	100000.00	0.02750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
6823a78c-cd21-4c33-84ec-1a6be93b1ed8	4f853306-e8db-4e37-b0d5-672deeacba64	2026	income	\N	125001.00	\N	0.09900	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
115d82f3-07eb-4101-9aac-86cbdd8753f3	018540cb-e686-43df-acd6-447e8a4789e9	2025	income	\N	2415.00	3621.00	0.03000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
6201bf91-ce23-412d-a513-7b4c3bccbdfe	ff8d1513-e4df-4acc-b080-61ca05330a16	2026	income	\N	1001.00	2000.00	0.03000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
ceb4e0ca-2ea3-499c-aad1-3c9d57fe73f8	a3754c6a-f561-4268-97e0-93ec5de928ba	2026	income	\N	21401.00	80650.00	0.06250	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
4803f86f-6317-408a-b5fb-852b123267de	bae252b4-de23-4a02-8d82-d6b82a748504	2026	income	\N	104091.00	183340.00	0.07850	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
ad4bd5e2-70dd-404a-97b7-69e3e552ece8	210e9b49-d44c-4297-8af6-e03c796b9861	2026	income	\N	22171.00	\N	0.04550	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
684670ab-0de6-4aa0-a5c1-f61185b57999	08130f6a-d8f7-41d6-8df7-74d2394df060	2026	income	\N	501.00	3000.00	0.04000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
3373bf68-54ae-43a5-ace3-7e55c08ba290	4db1c4da-83a0-482f-8bd8-04be81920064	2025	income	\N	17331.00	\N	0.06000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
ba4ac706-83b3-4f88-b70f-cbb558a34d7d	19087d4e-3617-4d4c-83d4-d042bfdd29d9	2025	income	\N	0.00	10000.00	0.03000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
9bbfdcfc-440e-4e7d-99c8-731eff2523e4	210e9b49-d44c-4297-8af6-e03c796b9861	2025	income	\N	35731.00	\N	0.05200	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
e32047e4-1395-4c0f-b58b-2f3f340170c2	9b06b036-9d9d-4855-8814-ba958fa4a2af	2026	income	\N	5501.00	16500.00	0.03200	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
7ee939a7-7ad5-4d94-a6c2-c07cb46214bc	a3754c6a-f561-4268-97e0-93ec5de928ba	2025	income	\N	5000001.00	\N	0.10900	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
26a4531f-ea36-4421-9fb7-472a455ace71	19087d4e-3617-4d4c-83d4-d042bfdd29d9	2026	income	\N	250001.00	500000.00	0.06900	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
1879ac23-b983-4314-a6a7-129579c7d0df	03f72823-c45f-4789-9fe2-99dcf8600f54	2026	income	\N	1000001.00	\N	0.10750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
7f13b3bf-98f3-433d-89da-f25c813c289d	78478d15-2101-4982-8de5-f550bfe763ec	2025	income	\N	17001.00	\N	0.05750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
c1f6ae92-9e24-42ff-8b33-02d9103ab486	018540cb-e686-43df-acd6-447e8a4789e9	2026	income	\N	4829.00	6034.00	0.04000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
05232cbc-fb3e-497e-8880-a44faf48b13a	2ec38a80-1883-41ed-b3a1-e1b11c06e2ee	2025	income	\N	0.00	24500.00	0.05800	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
2e56d538-99df-46a4-97d9-2437e736fb24	f7f6e970-a75e-448b-89c8-27c335739a67	2026	income	\N	25500.00	40245.00	0.04000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
0e694319-5eac-4907-80e0-87104b38175e	4f853306-e8db-4e37-b0d5-672deeacba64	2025	income	\N	0.00	10000.00	0.04750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
2ea0291a-4f17-4a45-b3b7-8923847a1b24	78478d15-2101-4982-8de5-f550bfe763ec	2026	income	\N	5001.00	17000.00	0.05000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
44bf4c06-df33-4173-8413-52ac195f6268	833d8931-5a53-49b9-b722-fd07d915c7ee	2026	income	\N	60001.00	\N	0.06600	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
154bb389-05ea-44ac-8448-d3f1b54146ca	ffac33df-9cae-43c5-afe0-3194ca4b5b81	2025	income	\N	229551.00	\N	0.08750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
f622516f-6d26-44b9-90d1-c0e66a33fe86	03f72823-c45f-4789-9fe2-99dcf8600f54	2025	income	\N	60001.00	250000.00	0.08500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
639dc220-a756-4679-b7cd-446bb5132238	2ec38a80-1883-41ed-b3a1-e1b11c06e2ee	2026	income	\N	24501.00	58050.00	0.06750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
622e8bea-00d2-40c1-b2c3-5640384ffbf4	ef6d221a-411e-42bc-8c07-4a75936c8c3a	2025	income	\N	44726.00	\N	0.02500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
5e7edccd-f6d8-42e1-a2c7-c080fde9c8d5	2d2976a3-1616-4e4a-bd56-eff51ad95a5e	2025	income	\N	1001.00	2500.00	0.01000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
602cba89-0632-4b77-8b10-ea6d2c08b7e8	ef6d221a-411e-42bc-8c07-4a75936c8c3a	2025	income	\N	0.00	44725.00	0.01100	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
e53f6a8b-bb28-4714-8123-afcdd9224794	a3754c6a-f561-4268-97e0-93ec5de928ba	2026	income	\N	8501.00	11700.00	0.04500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
de2e02b7-676a-44ab-8f8e-e159c595ec67	320341f5-8efe-46a8-a7a7-140d3fe9097a	2025	income	\N	500001.00	1000000.00	0.08970	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
7e00b15b-6d44-48b2-8bb4-0a7bf0b638c9	cff4ea9b-6a83-4ea2-8f2e-911d518bd036	2026	income	\N	0.00	77450.00	0.03750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
4f9efe13-726d-4727-a25b-3c3eda1f1b6a	4db1c4da-83a0-482f-8bd8-04be81920064	2026	income	\N	0.00	16040.00	0.01990	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
9e644630-a11d-4a9f-a9f7-df6b5b68f563	a5d6d811-780f-4372-ba31-ea9768d1354f	2025	income	\N	100001.00	\N	0.03125	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
39a7cd38-b304-4785-b319-5a6ca3a9cb94	f7f6e970-a75e-448b-89c8-27c335739a67	2026	income	\N	55867.00	70606.00	0.08000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
e1c8216c-4903-47c6-b622-039ef7d7839f	e9467c24-09fd-47c4-b2ce-dc49c4afa9c8	2025	income	\N	0.00	14320.00	0.03500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
f6dafc3a-4130-40e1-911a-0406de41517b	f7f6e970-a75e-448b-89c8-27c335739a67	2025	income	\N	0.00	10756.00	0.01000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
3b539d03-442e-475a-ab60-552fddcd16e2	cff4ea9b-6a83-4ea2-8f2e-911d518bd036	2025	income	\N	176051.00	\N	0.05990	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
624add82-df8d-40e7-892c-44becbaa7bbf	f7f6e970-a75e-448b-89c8-27c335739a67	2025	income	\N	55867.00	70606.00	0.08000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
25f9b5d5-c44a-4400-abd4-ec5f72a01625	e9467c24-09fd-47c4-b2ce-dc49c4afa9c8	2026	income	\N	0.00	14320.00	0.03500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
15229944-19a2-44e6-8986-41abd60d3dbe	f7f6e970-a75e-448b-89c8-27c335739a67	2026	income	\N	0.00	10756.00	0.01000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
b431f49d-89b6-4902-80ef-62a51688e867	cff4ea9b-6a83-4ea2-8f2e-911d518bd036	2026	income	\N	176051.00	\N	0.05990	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
95eb290a-b2db-4b2d-a7c9-f8e583fb0596	ef6d221a-411e-42bc-8c07-4a75936c8c3a	2026	income	\N	0.00	44725.00	0.01100	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
cdd385b0-5fac-4246-a7bf-42b1c3100732	a3754c6a-f561-4268-97e0-93ec5de928ba	2025	income	\N	8501.00	11700.00	0.04500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
08b2c855-23cb-4d24-8ef4-914cb4938850	320341f5-8efe-46a8-a7a7-140d3fe9097a	2026	income	\N	500001.00	1000000.00	0.08970	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
1fcb4dba-3ed8-4603-b344-47391d71d9b7	cff4ea9b-6a83-4ea2-8f2e-911d518bd036	2025	income	\N	0.00	77450.00	0.03750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
255f9b64-664f-4d3f-9df4-fac8aa7e19ec	4db1c4da-83a0-482f-8bd8-04be81920064	2025	income	\N	0.00	3460.00	0.00000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
fd4a5e8b-2aa5-4af8-b589-6dd1c764b1a2	ffac33df-9cae-43c5-afe0-3194ca4b5b81	2026	income	\N	229551.00	\N	0.08750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
e5a02b9f-47fa-4373-be2d-7e80151d5a65	03f72823-c45f-4789-9fe2-99dcf8600f54	2026	income	\N	60001.00	250000.00	0.08500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
2c90030b-9edd-4a99-bb6d-42a8cb1a3c77	2ec38a80-1883-41ed-b3a1-e1b11c06e2ee	2025	income	\N	24501.00	58050.00	0.06750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
0580faff-6696-415b-ba30-ea0f204a60d5	ef6d221a-411e-42bc-8c07-4a75936c8c3a	2026	income	\N	44726.00	\N	0.02500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
4bc0f364-8baa-4b20-a2d0-4cebfe9700c2	4f853306-e8db-4e37-b0d5-672deeacba64	2026	income	\N	0.00	10000.00	0.04750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
622c6a63-b41a-4083-8fd9-ee6ac7ca0b18	78478d15-2101-4982-8de5-f550bfe763ec	2025	income	\N	5001.00	17000.00	0.05000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
5c9e7c01-73f0-4c07-888e-c67bf8f6581c	833d8931-5a53-49b9-b722-fd07d915c7ee	2025	income	\N	60001.00	\N	0.06600	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
0a117fc6-defa-4c6e-a2c0-00e7ddf1dcc7	93461882-13b9-4183-93d3-48c6efe8f103	2026	income	\N	35001.00	\N	0.05650	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
700b49d9-6317-4b9d-bfd3-1d29d7f97f6d	2ec38a80-1883-41ed-b3a1-e1b11c06e2ee	2026	income	\N	0.00	24500.00	0.05800	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
f94619ff-b0f2-4985-8fd0-8ce6becebd10	f7f6e970-a75e-448b-89c8-27c335739a67	2025	income	\N	25500.00	40245.00	0.04000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
a15b408a-dcb7-4500-acc1-8ab806904fab	a3754c6a-f561-4268-97e0-93ec5de928ba	2026	income	\N	5000001.00	\N	0.10900	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
6052633b-a116-4a1b-b9b8-d884e82e67c6	19087d4e-3617-4d4c-83d4-d042bfdd29d9	2025	income	\N	250001.00	500000.00	0.06900	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
46653280-7b40-447b-a978-916fdde6b712	03f72823-c45f-4789-9fe2-99dcf8600f54	2025	income	\N	1000001.00	\N	0.10750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
8748d144-7790-4bd9-9b33-23e0c5440ce7	78478d15-2101-4982-8de5-f550bfe763ec	2026	income	\N	17001.00	\N	0.05750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
7c8af24d-9306-40fe-86fd-6360b7adc10d	018540cb-e686-43df-acd6-447e8a4789e9	2025	income	\N	4829.00	6034.00	0.04000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
7543babb-f7a9-476a-aa60-c20685ff0a08	08130f6a-d8f7-41d6-8df7-74d2394df060	2025	income	\N	501.00	3000.00	0.04000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
a569f35e-9675-403d-92bc-6bd2f3da1efa	19087d4e-3617-4d4c-83d4-d042bfdd29d9	2026	income	\N	0.00	10000.00	0.03000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
06c9168b-e605-4919-a107-47645d554d0e	9b06b036-9d9d-4855-8814-ba958fa4a2af	2025	income	\N	5501.00	16500.00	0.03200	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
a53f81a1-f15c-43b3-ad43-b03ee6cc03da	ff8d1513-e4df-4acc-b080-61ca05330a16	2025	income	\N	1001.00	2000.00	0.03000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
a6a767ef-8b75-4912-94c8-d90e569f3241	a3754c6a-f561-4268-97e0-93ec5de928ba	2025	income	\N	21401.00	80650.00	0.06250	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
f73b3c22-42be-4721-a68e-675ce8932509	4db1c4da-83a0-482f-8bd8-04be81920064	2026	income	\N	16041.00	\N	0.05210	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
bbb965d3-1429-42cf-bb7c-7ab5d1e391be	bae252b4-de23-4a02-8d82-d6b82a748504	2025	income	\N	104091.00	183340.00	0.07850	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
2938cec4-272a-49e2-b4eb-84e1c253fc72	210e9b49-d44c-4297-8af6-e03c796b9861	2025	income	\N	22171.00	35730.00	0.05010	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
0badabac-a225-41b3-8a09-61448afadabc	ff8d1513-e4df-4acc-b080-61ca05330a16	2025	income	\N	3001.00	100000.00	0.04750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
ed00ec31-47c0-4ccf-b049-582bc203313e	ff8d1513-e4df-4acc-b080-61ca05330a16	2025	income	\N	250001.00	\N	0.05750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
81ca33d3-6792-4b44-9216-8125c0f11e1c	320341f5-8efe-46a8-a7a7-140d3fe9097a	2026	income	\N	20001.00	35000.00	0.01750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
1ec822e0-fc18-476c-86e3-d121607a51de	cff4ea9b-6a83-4ea2-8f2e-911d518bd036	2026	income	\N	77451.00	176050.00	0.04750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
044bddc6-da60-4f96-9b4f-7711ae3e4b9f	03f72823-c45f-4789-9fe2-99dcf8600f54	2025	income	\N	40001.00	60000.00	0.06500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
aa51d3ad-9869-4916-ad6a-273ea42b6bf3	ffac33df-9cae-43c5-afe0-3194ca4b5b81	2026	income	\N	0.00	45400.00	0.03350	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
ddc8fd42-dd9a-483b-be3d-3f217f15d2ab	9b06b036-9d9d-4855-8814-ba958fa4a2af	2026	income	\N	16501.00	33500.00	0.04300	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
7ec5f42d-1ced-4861-97bd-bdb0badb22be	c25a7ac1-9439-40e6-ba5d-4174f0d6fc84	2025	income	\N	25001.00	40000.00	0.04500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
41a23459-f1a8-4e93-9dc1-5daad7f08e75	018540cb-e686-43df-acd6-447e8a4789e9	2026	income	\N	6035.00	7241.00	0.04500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
2bb95f58-5a5b-4826-ad76-343787f69cba	ff8d1513-e4df-4acc-b080-61ca05330a16	2026	income	\N	0.00	1000.00	0.02000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
373a048d-0909-4015-98ab-65188811e3a3	03f72823-c45f-4789-9fe2-99dcf8600f54	2025	income	\N	250001.00	500000.00	0.09250	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
d0c4b020-31e4-4254-9d3c-42b205cf4ed9	018540cb-e686-43df-acd6-447e8a4789e9	2025	income	\N	1208.00	2414.00	0.02500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
cd7278db-880f-4a6e-99e2-2d3b66e0f956	320341f5-8efe-46a8-a7a7-140d3fe9097a	2026	income	\N	35001.00	40000.00	0.03500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
aa210652-fd5c-4201-9bd7-73ce4607b9dd	2d2976a3-1616-4e4a-bd56-eff51ad95a5e	2025	income	\N	0.00	1000.00	0.00500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
1a64ddf7-9637-4337-8c65-737541d37899	c25a7ac1-9439-40e6-ba5d-4174f0d6fc84	2026	income	\N	10001.00	25000.00	0.04000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
537667cd-7414-40c2-a690-72a57a289c33	833d8931-5a53-49b9-b722-fd07d915c7ee	2025	income	\N	0.00	2000.00	0.00000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
7d57cde3-36b5-4dfa-8848-f8c5f05d0e0d	f7f6e970-a75e-448b-89c8-27c335739a67	2026	income	\N	432788.00	721314.00	0.11300	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
14e679c7-df2e-4175-8c28-e75d8fa4094e	03f72823-c45f-4789-9fe2-99dcf8600f54	2026	income	\N	0.00	10000.00	0.04000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
83d00fd0-2ce9-43b6-88a5-4c120797a534	9b06b036-9d9d-4855-8814-ba958fa4a2af	2026	income	\N	210001.00	\N	0.05900	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
5373165f-96e3-4350-9e6b-01ab18e8a88d	f7f6e970-a75e-448b-89c8-27c335739a67	2025	income	\N	10757.00	25499.00	0.02000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
884defda-6038-429f-b30c-95f841e805ec	f7f6e970-a75e-448b-89c8-27c335739a67	2025	income	\N	432788.00	721314.00	0.11300	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
b7344c8e-2c67-4ab9-a5b2-70a6a32b2c6e	03f72823-c45f-4789-9fe2-99dcf8600f54	2025	income	\N	0.00	10000.00	0.04000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
7f9e8df7-bcdf-4644-a91c-d9d3082c7ae5	9b06b036-9d9d-4855-8814-ba958fa4a2af	2025	income	\N	210001.00	\N	0.05900	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
9a43de42-f498-44a5-8f4d-342c51cbfef9	f7f6e970-a75e-448b-89c8-27c335739a67	2026	income	\N	10757.00	25499.00	0.02000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
e401269d-205e-464a-a97f-e5121852f06d	93461882-13b9-4183-93d3-48c6efe8f103	2025	income	\N	20501.00	\N	0.05900	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
a7a27790-8ce7-4592-9053-40a24b13fe77	c25a7ac1-9439-40e6-ba5d-4174f0d6fc84	2025	income	\N	10001.00	25000.00	0.04000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
aba7ee5d-bb59-4d67-889b-c65c8dcaffdd	833d8931-5a53-49b9-b722-fd07d915c7ee	2026	income	\N	0.00	2000.00	0.00000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
2bb2bfcf-e91a-47b9-8e09-0ccc84d1d0f9	2d2976a3-1616-4e4a-bd56-eff51ad95a5e	2025	income	\N	2501.00	3750.00	0.02000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
c6b51781-3cb5-43fe-9341-c48887e88877	2d2976a3-1616-4e4a-bd56-eff51ad95a5e	2026	income	\N	0.00	12500.00	0.02500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
b8bc57e5-82e4-40e2-9fb0-deb337769a5c	03f72823-c45f-4789-9fe2-99dcf8600f54	2026	income	\N	250001.00	500000.00	0.09250	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
b24bb20b-ad87-40c2-bd26-a82789b3c0e4	018540cb-e686-43df-acd6-447e8a4789e9	2026	income	\N	1208.00	2414.00	0.02500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
7ad02513-1784-4a95-9769-9d6d2193fe74	320341f5-8efe-46a8-a7a7-140d3fe9097a	2025	income	\N	35001.00	40000.00	0.03500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
f8a01a5c-268f-4a21-b64f-b1cd3b066b50	018540cb-e686-43df-acd6-447e8a4789e9	2025	income	\N	6035.00	7241.00	0.04500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
63b6a389-db28-421b-a0b6-dd7d0924fafc	ff8d1513-e4df-4acc-b080-61ca05330a16	2025	income	\N	0.00	1000.00	0.02000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
c4623efc-0dd4-4751-9633-0a5b4aa4feb4	c25a7ac1-9439-40e6-ba5d-4174f0d6fc84	2026	income	\N	25001.00	40000.00	0.04500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
ea0cd403-b23f-4f66-94ab-9944522a4c56	2d2976a3-1616-4e4a-bd56-eff51ad95a5e	2026	income	\N	12501.00	50000.00	0.03500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
11fb5cb1-66b7-49fa-84d6-7df60501fe1b	2d2976a3-1616-4e4a-bd56-eff51ad95a5e	2025	income	\N	4901.00	7200.00	0.04000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
c3c8a87c-c28f-4f53-99e6-09039aece31c	9b06b036-9d9d-4855-8814-ba958fa4a2af	2025	income	\N	16501.00	33500.00	0.04300	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
526c893b-cfbd-49f4-97f1-bbcaf782e168	ff8d1513-e4df-4acc-b080-61ca05330a16	2026	income	\N	3001.00	100000.00	0.04750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
7f4aefae-fab8-4052-a4e4-bfb7fb92b71f	ff8d1513-e4df-4acc-b080-61ca05330a16	2026	income	\N	250001.00	\N	0.05750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
999fbc52-3944-47c4-ac35-568a47bffe58	320341f5-8efe-46a8-a7a7-140d3fe9097a	2025	income	\N	20001.00	35000.00	0.01750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
dbf4be9a-8888-4f92-8957-5eea071f9c97	cff4ea9b-6a83-4ea2-8f2e-911d518bd036	2025	income	\N	77451.00	176050.00	0.04750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
ad9806c6-8497-48e5-bb89-77c13a1f28f4	03f72823-c45f-4789-9fe2-99dcf8600f54	2026	income	\N	40001.00	60000.00	0.06500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
a49297b1-312a-4446-bb90-d610a89ed5f9	ffac33df-9cae-43c5-afe0-3194ca4b5b81	2025	income	\N	0.00	45400.00	0.03350	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
d653bdc6-c21c-4be4-a2e0-00345779b39b	320341f5-8efe-46a8-a7a7-140d3fe9097a	2026	income	\N	0.00	20000.00	0.01400	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
15c0769f-cdff-419d-bda3-39539644c519	018540cb-e686-43df-acd6-447e8a4789e9	2026	income	\N	0.00	1207.00	0.02000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
d121ddc1-f107-4716-b42c-5ecd6fb88f7f	c25a7ac1-9439-40e6-ba5d-4174f0d6fc84	2026	income	\N	0.00	10000.00	0.03000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
92fef597-5acd-484b-9499-a244face22c9	833d8931-5a53-49b9-b722-fd07d915c7ee	2025	income	\N	10001.00	20000.00	0.04800	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
f5db9081-bfa8-4c2f-a457-cde70c482246	78478d15-2101-4982-8de5-f550bfe763ec	2026	income	\N	0.00	3000.00	0.02000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
2a3e342d-7356-4366-9ff9-c72c7be61b17	08130f6a-d8f7-41d6-8df7-74d2394df060	2026	income	\N	0.00	500.00	0.02000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
96750198-b25e-4da7-a539-e0c425369336	2c4dbc13-48e2-481f-9d49-1a8a15ae0ebc	2025	income	\N	0.00	4300.00	0.02000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
44423f43-68fe-4eae-88b6-5b46ffb2d717	03f72823-c45f-4789-9fe2-99dcf8600f54	2026	income	\N	10001.00	40000.00	0.06000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
cdda932a-4b90-488d-86e3-d234e08614d0	ffac33df-9cae-43c5-afe0-3194ca4b5b81	2025	income	\N	45401.00	110350.00	0.06600	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
b3f74e1c-92f0-4f52-9eb5-42113859e9ab	78478d15-2101-4982-8de5-f550bfe763ec	2025	income	\N	3001.00	5000.00	0.03000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
66ec396a-eaef-4e7e-a52d-4119f3adec6f	08130f6a-d8f7-41d6-8df7-74d2394df060	2025	income	\N	3001.00	\N	0.05000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
0ec99276-e49c-45a2-aaea-a8f51a85b12a	320341f5-8efe-46a8-a7a7-140d3fe9097a	2025	income	\N	75001.00	500000.00	0.06370	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
3361f9cd-b648-4298-9691-ffc664926c47	ff8d1513-e4df-4acc-b080-61ca05330a16	2026	income	\N	150001.00	250000.00	0.05500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
89fd1cc5-062d-4c08-8482-b26a3e3377c9	a3754c6a-f561-4268-97e0-93ec5de928ba	2026	income	\N	1077551.00	5000000.00	0.10300	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
c643e231-56f7-4f0d-92a6-46be615a6020	3a9920c2-4756-470d-9a96-bfa2a59da103	2026	income	\N	15001.00	\N	0.05700	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
60646b41-6da9-4f2f-83c6-f069f0e857d2	833d8931-5a53-49b9-b722-fd07d915c7ee	2026	income	\N	25001.00	60000.00	0.05550	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
7fc22112-6e9d-493a-a702-3f005466ed5c	ffac33df-9cae-43c5-afe0-3194ca4b5b81	2025	income	\N	110351.00	229550.00	0.07600	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
b600cb68-3a9e-4d76-8ada-50511ae2d597	2d2976a3-1616-4e4a-bd56-eff51ad95a5e	2025	income	\N	7201.00	\N	0.04750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
d8ae3e4d-3108-465e-ac88-9486ec4cb58e	9b06b036-9d9d-4855-8814-ba958fa4a2af	2026	income	\N	33501.00	210000.00	0.04700	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
21a16a28-4295-49db-a717-c30fc337fb6d	a3754c6a-f561-4268-97e0-93ec5de928ba	2026	income	\N	0.00	8500.00	0.04000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
34afb8dd-a34a-4a2f-aa0a-d68b882bca13	a3754c6a-f561-4268-97e0-93ec5de928ba	2025	income	\N	11701.00	13900.00	0.05250	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
2e13c41b-76d6-4010-93e2-7141a5e61d57	f7f6e970-a75e-448b-89c8-27c335739a67	2026	income	\N	40246.00	55866.00	0.06000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
1186e70a-2f7a-4d55-8d18-0222738321f3	bae252b4-de23-4a02-8d82-d6b82a748504	2025	income	\N	31691.00	104090.00	0.06800	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
17f723c0-538b-4128-8e37-35d1da16a6cf	ff8d1513-e4df-4acc-b080-61ca05330a16	2025	income	\N	100001.00	125000.00	0.05000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
cfccff5d-8c4b-49e3-976a-a8039640df3a	833d8931-5a53-49b9-b722-fd07d915c7ee	2025	income	\N	20001.00	25000.00	0.05200	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
d638b52d-d97b-48b7-a441-309594bc000b	f7f6e970-a75e-448b-89c8-27c335739a67	2026	income	\N	721315.00	999999.00	0.12300	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
9e6ef5c6-c05a-4bc9-9d4f-6c437b1a6f7f	018540cb-e686-43df-acd6-447e8a4789e9	2025	income	\N	3622.00	4828.00	0.03500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
db6a5efa-205c-4df7-8868-22501eed7cc0	2c4dbc13-48e2-481f-9d49-1a8a15ae0ebc	2025	income	\N	4301.00	\N	0.03900	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
9d87f190-166a-4449-ac6a-5fbd584d060c	9b06b036-9d9d-4855-8814-ba958fa4a2af	2026	income	\N	0.00	5500.00	0.01500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
89be7cc1-7067-4891-bb0f-9da5372247f8	018540cb-e686-43df-acd6-447e8a4789e9	2026	income	\N	7242.00	\N	0.04800	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
0ee85c53-3bb3-4612-bb70-6b4d7e52477b	e9467c24-09fd-47c4-b2ce-dc49c4afa9c8	2025	income	\N	28641.00	315000.00	0.05300	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
38e599dd-d877-48a0-b445-c3e812c90714	a3754c6a-f561-4268-97e0-93ec5de928ba	2026	income	\N	80651.00	215400.00	0.06850	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
10f68531-a2b7-43dc-bfaa-94c2860800e9	19087d4e-3617-4d4c-83d4-d042bfdd29d9	2026	income	\N	500001.00	\N	0.06990	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
bcb173bf-0a70-4f35-880a-b48c029eb1d5	210e9b49-d44c-4297-8af6-e03c796b9861	2026	income	\N	3701.00	22170.00	0.03510	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
d1b457e1-a020-4157-8d1a-399c651da862	bae252b4-de23-4a02-8d82-d6b82a748504	2026	income	\N	0.00	31690.00	0.05350	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
4416597c-7bb2-4112-9b09-79fc5cacf6d6	c25a7ac1-9439-40e6-ba5d-4174f0d6fc84	2025	income	\N	40001.00	60000.00	0.04750	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
b7142078-fbd7-4776-89e1-944426bf992b	f7f6e970-a75e-448b-89c8-27c335739a67	2025	income	\N	1000000.00	\N	0.13300	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
1a4ca892-eb57-48ab-b143-bf705d1815fb	e9467c24-09fd-47c4-b2ce-dc49c4afa9c8	2025	income	\N	315001.00	\N	0.07650	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
f0ebbeb9-bf25-4191-8fb1-93d2efff4454	ff8d1513-e4df-4acc-b080-61ca05330a16	2026	income	\N	125001.00	150000.00	0.05250	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
573cebe9-0c4c-4e7c-8199-8d7727e3325f	320341f5-8efe-46a8-a7a7-140d3fe9097a	2025	income	\N	40001.00	75000.00	0.05525	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
82242869-297b-4d86-beb7-63cf3362ad09	3a9920c2-4756-470d-9a96-bfa2a59da103	2025	income	\N	0.00	15000.00	0.03100	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
090b886f-d673-4a3e-9a6d-589a77927f98	19087d4e-3617-4d4c-83d4-d042bfdd29d9	2026	income	\N	50001.00	100000.00	0.05500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
506a5428-5134-4e9e-be79-d32041abccaa	a3754c6a-f561-4268-97e0-93ec5de928ba	2025	income	\N	80651.00	215400.00	0.06850	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
1f612f17-6840-402e-9895-59e2e0dcdeea	19087d4e-3617-4d4c-83d4-d042bfdd29d9	2025	income	\N	500001.00	\N	0.06990	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
4e8a198f-eb55-4ad9-8307-5a02ca969a63	210e9b49-d44c-4297-8af6-e03c796b9861	2025	income	\N	3701.00	22170.00	0.03510	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
f07814d7-438d-40d4-9ab3-5004672721f1	bae252b4-de23-4a02-8d82-d6b82a748504	2025	income	\N	0.00	31690.00	0.05350	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
d03f4ce4-d50f-458a-ac5b-b742489b0f5c	c25a7ac1-9439-40e6-ba5d-4174f0d6fc84	2026	income	\N	40001.00	60000.00	0.04750	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
428a1b08-85cb-4f3e-916e-50d25cf536e3	f7f6e970-a75e-448b-89c8-27c335739a67	2026	income	\N	1000000.00	\N	0.13300	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
b71c5095-a99e-49ef-b208-322cee299cf1	e9467c24-09fd-47c4-b2ce-dc49c4afa9c8	2026	income	\N	315001.00	\N	0.07650	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
4abd3edb-daa0-4d66-8673-882331979fe5	ff8d1513-e4df-4acc-b080-61ca05330a16	2025	income	\N	125001.00	150000.00	0.05250	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
3dfa3d12-a3d1-495e-b5b6-c8d030303e28	320341f5-8efe-46a8-a7a7-140d3fe9097a	2026	income	\N	40001.00	75000.00	0.05525	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
207233c6-59fa-4902-bbde-982cc463f80b	3a9920c2-4756-470d-9a96-bfa2a59da103	2026	income	\N	0.00	15000.00	0.03100	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
f0164d2f-b769-4ea3-a48c-814880dd0a34	19087d4e-3617-4d4c-83d4-d042bfdd29d9	2025	income	\N	50001.00	100000.00	0.05500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
38240365-4da8-412d-8da6-a075789dcbf2	833d8931-5a53-49b9-b722-fd07d915c7ee	2026	income	\N	20001.00	25000.00	0.05200	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
2c274ecb-b3b7-4628-9c48-63ed4f191016	f7f6e970-a75e-448b-89c8-27c335739a67	2025	income	\N	721315.00	999999.00	0.12300	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
8713e602-f9b4-4ed9-b45b-e454684050b1	018540cb-e686-43df-acd6-447e8a4789e9	2026	income	\N	3622.00	4828.00	0.03500	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
a2585836-342b-497d-966d-bc9cfa00aed7	2c4dbc13-48e2-481f-9d49-1a8a15ae0ebc	2026	income	\N	4301.00	\N	0.03900	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
f752a3cc-85f7-4bbc-84cb-99ae709e0b6c	9b06b036-9d9d-4855-8814-ba958fa4a2af	2025	income	\N	0.00	5500.00	0.01500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
aa013dc9-6fb5-4f40-b80c-4731f0c59093	018540cb-e686-43df-acd6-447e8a4789e9	2025	income	\N	7242.00	\N	0.04800	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
3d1eb998-d9b3-4469-97ab-de916181f805	e9467c24-09fd-47c4-b2ce-dc49c4afa9c8	2026	income	\N	28641.00	315000.00	0.05300	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
b556d505-79e5-4796-895c-a63ba623032f	9b06b036-9d9d-4855-8814-ba958fa4a2af	2025	income	\N	33501.00	210000.00	0.04700	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
fa168c74-014f-4b79-8215-82619c5aae09	a3754c6a-f561-4268-97e0-93ec5de928ba	2025	income	\N	0.00	8500.00	0.04000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
f685fdcc-68e9-46ca-b683-9829f787136b	a3754c6a-f561-4268-97e0-93ec5de928ba	2026	income	\N	11701.00	13900.00	0.05250	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
43ffcff4-3d78-4103-bc7d-4610f1372d98	f7f6e970-a75e-448b-89c8-27c335739a67	2025	income	\N	40246.00	55866.00	0.06000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
3d4c09d4-0226-4a40-aeb9-d2a53530cfd5	bae252b4-de23-4a02-8d82-d6b82a748504	2026	income	\N	31691.00	104090.00	0.06800	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
6f3ba67d-f80b-475d-b4d9-78e8a7d23708	ff8d1513-e4df-4acc-b080-61ca05330a16	2026	income	\N	100001.00	125000.00	0.05000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
785cc44a-b880-49fd-be52-b0643316202d	833d8931-5a53-49b9-b722-fd07d915c7ee	2025	income	\N	25001.00	60000.00	0.05550	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
6c34d958-b7ff-42ad-94d8-c3374a873949	ffac33df-9cae-43c5-afe0-3194ca4b5b81	2026	income	\N	110351.00	229550.00	0.07600	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
11f3b69a-2d9d-4c68-a68a-abdb3a7c28ab	320341f5-8efe-46a8-a7a7-140d3fe9097a	2026	income	\N	75001.00	500000.00	0.06370	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
cf714941-883d-44fa-8709-f16c82942d89	ff8d1513-e4df-4acc-b080-61ca05330a16	2025	income	\N	150001.00	250000.00	0.05500	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
616db49e-842f-4ad7-925b-2d2b345b0c54	a3754c6a-f561-4268-97e0-93ec5de928ba	2025	income	\N	1077551.00	5000000.00	0.10300	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
07fb0811-506b-4b5f-bee7-22c4f967d360	3a9920c2-4756-470d-9a96-bfa2a59da103	2025	income	\N	15001.00	\N	0.05700	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
2714ba0a-b5dd-4693-b92a-ace8510b3e3f	78478d15-2101-4982-8de5-f550bfe763ec	2026	income	\N	3001.00	5000.00	0.03000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
1325ac39-a3b4-4872-9883-bbb13bfa4158	08130f6a-d8f7-41d6-8df7-74d2394df060	2026	income	\N	3001.00	\N	0.05000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
93025145-c97a-4ba9-82d0-876b56a54057	78478d15-2101-4982-8de5-f550bfe763ec	2025	income	\N	0.00	3000.00	0.02000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
82a84a63-e562-4162-8e83-f42203d106bd	08130f6a-d8f7-41d6-8df7-74d2394df060	2025	income	\N	0.00	500.00	0.02000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
eccb62bb-3c02-4f5d-92ed-b056027b6706	2c4dbc13-48e2-481f-9d49-1a8a15ae0ebc	2026	income	\N	0.00	4300.00	0.02000	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
8b30f552-815d-4128-96aa-d5e81479bedb	03f72823-c45f-4789-9fe2-99dcf8600f54	2025	income	\N	10001.00	40000.00	0.06000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
024a71b5-bce3-4f56-9e10-b3e5af77d155	ffac33df-9cae-43c5-afe0-3194ca4b5b81	2026	income	\N	45401.00	110350.00	0.06600	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
ed10ef45-a0d6-40bc-87c8-772659f78cfb	320341f5-8efe-46a8-a7a7-140d3fe9097a	2025	income	\N	0.00	20000.00	0.01400	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
63686a3c-5a53-411c-9a59-927c506f8984	2d2976a3-1616-4e4a-bd56-eff51ad95a5e	2025	income	\N	3751.00	4900.00	0.03000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
c2f7b5b3-ceda-47a9-96b9-211527e9cd28	018540cb-e686-43df-acd6-447e8a4789e9	2025	income	\N	0.00	1207.00	0.02000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
10b3fe58-1da0-4a5e-ada5-3b4efc0980e6	c25a7ac1-9439-40e6-ba5d-4174f0d6fc84	2025	income	\N	0.00	10000.00	0.03000	2025-01-01	2025-12-31	t	2026-04-23 22:49:30.478991+00
64cfe21f-48f7-483d-977c-b807178010e6	833d8931-5a53-49b9-b722-fd07d915c7ee	2026	income	\N	10001.00	20000.00	0.04800	2026-01-01	\N	t	2026-04-23 22:49:30.478991+00
\.


--
-- Data for Name: trade_journal; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trade_journal (id, trade_id, user_id, entry_type, content, mood, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: trades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trades (id, user_id, symbol, asset_type, trade_type, direction, quantity, entry_price, exit_price, entry_date, exit_date, stop_loss, take_profit, realized_pnl, commission, status, strategy, timeframe, setup_type, risk_amount, risk_reward_ratio, tax_year, notes, created_at, updated_at, contract_type, option_type, strike_price, expiration_date, premium, lot_size, pip_value, margin_required, contract_multiplier, deleted_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, user_id, financial_account_id, provider, external_transaction_id, transaction_type, direction, status, income_subtype, trade_type, fee_type, tax_type, derivative_type, amount, currency, fee_amount, realized_gain, asset_symbol, quantity, price_per_unit, contract_multiplier, strike_price, expiration_date, settlement_price, mtm_adjustment, margin_impact, transfer_group_id, lot_id, transaction_date, settlement_date, category, subcategory, description, merchant_name, taxable_event, synced_at, created_at, updated_at, deleted_at) FROM stdin;
d08f3119-dc57-4688-95b7-8bdfbad3fa1e	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	wVNVwYYNb8iEz1Km05bRsxjwE86ZzDFrDPKLv	transfer	debit	pending	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-27 00:00:00+00	\N	Transfer	\N	FMOFCU SV WEBXFR	Fmofcu Sv Webxfr	f	2026-04-28 01:41:32.809+00	2026-04-28 01:41:32.809+00	2026-04-28 03:29:08.792+00	\N
c44a7004-ba1a-4a14-a38d-a08a41d74101	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	BeZev55ZXPunvgr4db1jHynoz89jpLINO639O	bank	debit	posted	\N	\N	\N	\N	\N	20.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-21 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 405524 WAWA 876 * DE	Wawa	f	2026-04-28 01:41:33.49+00	2026-04-28 01:41:33.49+00	2026-04-28 22:38:47.589+00	\N
b976e198-21bc-49a4-9e9b-a7168028b164	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	q5y57eeyb8IqRaVw3JbOiQkYrbEadzInAeDJk	bank	debit	posted	\N	\N	\N	\N	\N	3.68	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-21 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 405524 WAWA 876 CAMDEN * DE	Wawa	f	2026-04-28 01:41:33.562+00	2026-04-28 01:41:33.562+00	2026-04-28 22:38:47.648+00	\N
528960f0-1bd6-41a0-9486-ede4fbce7df6	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	KeEeZXXEY0ukAbOXnJmYcQoLw9PVy5INz0EQ7	bank	debit	posted	\N	\N	\N	\N	\N	11.14	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 00:00:00+00	\N	\N	\N	DDA PURCHASE AP 770446 REDNERS MKTS 58 CAMDEN * DE	Redner's Markets	f	2026-04-28 01:41:33.689+00	2026-04-28 01:41:33.689+00	2026-04-28 22:38:47.703+00	\N
dc11687e-fead-4e5d-88c9-32e576a2ef39	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	yYNYLeeNb8UOneYEr7bqhQ0YPrzLjKIaJ0pOY	bank	debit	posted	\N	\N	\N	\N	\N	16.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 00:00:00+00	\N	\N	\N	PAYPAL PURCHASE	\N	f	2026-04-28 01:41:33.759+00	2026-04-28 01:41:33.759+00	2026-04-28 22:38:47.759+00	\N
a2e0a273-bcbb-4dc7-9699-92a142918d5e	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	35Z5M33ZXBIKn5pdgv1xu6K84NAzvkfLOboKJ	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 00:00:00+00	\N	\N	\N	UMBNKC CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:33.827+00	2026-04-28 01:41:33.827+00	2026-04-28 22:38:47.821+00	\N
0d536830-4207-471a-b1aa-bfc802d813ce	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	k4B48eeBOAi5brn7LExwik1JoMKeDqiEKMoR6	bank	debit	posted	\N	\N	\N	\N	\N	24.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 00:00:00+00	\N	\N	\N	Planet Fitness	Planet Fitness	f	2026-04-28 01:41:33.897+00	2026-04-28 01:41:33.897+00	2026-04-28 22:38:47.878+00	\N
63d3bc50-e5ba-43cf-b583-7275400a5432	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Ae7eAZZ7X1uonwr0NbK1sRV68xQNApfjOdM6X	bank	debit	posted	\N	\N	\N	\N	\N	820.63	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 00:00:00+00	\N	\N	\N	ROCKET MORTGAGE LOAN	Rocket Mortgage	f	2026-04-28 01:41:33.966+00	2026-04-28 01:41:33.966+00	2026-04-28 22:38:47.932+00	\N
95b8e9a2-2143-4698-a1be-617b5e69caa4	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	jrqrJmmqOkcxoajY64y8SxobR0EgZ7F3b0ee8	bank	debit	posted	\N	\N	\N	\N	\N	1321.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 00:00:00+00	\N	\N	\N	BEST EGG PAYMENT	Best Egg	f	2026-04-28 01:41:34.042+00	2026-04-28 01:41:34.042+00	2026-04-28 22:38:47.986+00	\N
a1dc1cc0-54b3-4b49-8a6a-cdd9d37bd1b5	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	0JKJ9PPKX1cVz9dZJgQNH0XBa5Ye4ztJDgAAB	bank	debit	posted	\N	\N	\N	\N	\N	1347.16	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 00:00:00+00	\N	\N	\N	BEST EGG PAYMENT	Best Egg	f	2026-04-28 01:41:34.125+00	2026-04-28 01:41:34.125+00	2026-04-28 22:38:48.038+00	\N
04443c68-b002-4f72-960d-302e8609f118	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	ro0o9ee0b8cXVemxypb0hNpOZb9Jo7Cbn3VV3	bank	debit	posted	\N	\N	\N	\N	\N	337.16	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 00:00:00+00	\N	\N	\N	FARMERS INS EFT PYMT	Farmers Insurance	f	2026-04-28 01:41:34.201+00	2026-04-28 01:41:34.201+00	2026-04-28 22:38:48.098+00	\N
926e238c-ddd1-44a4-a68d-e18b10b5828a	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	xYNY6eeNb7Uv5zYNpRewsPJrqe6Ln5toVaOO1	bank	credit	posted	\N	\N	\N	\N	\N	35.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 00:00:00+00	\N	\N	\N	Online Xfer Transfer from CK x5430	\N	f	2026-04-28 01:41:34.272+00	2026-04-28 01:41:34.272+00	2026-04-28 22:38:48.152+00	\N
197c3d18-c6c9-4e0d-a581-fd52bea950fa	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	v9Y9deeYb8cYBnA5vXbyipwNo8aBz9FgvoVVN	bank	debit	posted	\N	\N	\N	\N	\N	65.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 00:00:00+00	\N	\N	\N	TD ZELLE SENT 610600N0FKH1 Zelle Cynthia Patterson	\N	f	2026-04-28 01:41:34.341+00	2026-04-28 01:41:34.341+00	2026-04-28 22:38:48.219+00	\N
6d016f86-5935-4f47-8126-97b53bf1fdd6	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	4o5odyy5X3ckydaNEP5wcyobEQYAJpIqZmRRP	bank	debit	posted	\N	\N	\N	\N	\N	48.60	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 00:00:00+00	\N	\N	\N	TRUSTAGE LIFE INSUR	TruStage Insurance	f	2026-04-28 01:41:34.422+00	2026-04-28 01:41:34.422+00	2026-04-28 22:38:48.308+00	\N
277ff190-ec61-4627-bf27-0ef24bf1d904	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	aBqBkppqOLTKvEP4981puQvjBz0Rn6I4zn77x	bank	debit	posted	\N	\N	\N	\N	\N	12.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 401134 SQSP DOMAIN 230637302 SQUARESPACE C *	Sqsp Domain	f	2026-04-28 01:41:34.49+00	2026-04-28 01:41:34.49+00	2026-04-28 22:38:48.411+00	\N
29e3bf35-51c0-4f0e-a2f6-3099c3bbb79f	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	o8g8beegNOu1QnJamp8ocAknQ8zP3gSOL9448	bank	debit	posted	\N	\N	\N	\N	\N	14.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 00:00:00+00	\N	\N	\N	CHASE CREDIT CRD EPAY	\N	f	2026-04-28 01:41:34.565+00	2026-04-28 01:41:34.565+00	2026-04-28 22:38:48.47+00	\N
932ae048-b503-4e57-9cde-2c63347d14af	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Zwdw1VVdOnfDdXbKp8AZsdnLa3e7zgHvrKbbA	bank	debit	posted	\N	\N	\N	\N	\N	114.47	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 00:00:00+00	\N	\N	\N	DEPT EDUCATION STUDENT LN	Education Student Ln	f	2026-04-28 01:41:34.648+00	2026-04-28 01:41:34.648+00	2026-04-28 22:38:48.527+00	\N
f1242c2a-5b89-4636-a218-bdc5c64010bd	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	8969Dvv6eAcjvJB6OadgurJ5Vy41RaCZAXxx6	bank	debit	posted	\N	\N	\N	\N	\N	148.42	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 00:00:00+00	\N	\N	\N	DEPT EDUCATION STUDENT LN	Education Student Ln	f	2026-04-28 01:41:34.727+00	2026-04-28 01:41:34.727+00	2026-04-28 22:38:48.586+00	\N
813845dc-8dba-46a1-9ea6-4ef0cb159f4e	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	b3B3AeeBpDfmwXKaYpbgipD56MKZj1F9OjJJ0	bank	credit	posted	\N	\N	\N	\N	\N	130.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 00:00:00+00	\N	\N	\N	Online Xfer Transfer from CK x5430	\N	f	2026-04-28 01:41:34.801+00	2026-04-28 01:41:34.801+00	2026-04-28 22:38:48.644+00	\N
2803fe34-5a38-45d3-aecc-d3bb583de855	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	gvDv4eeDO3uYNz95ZODMiBj5pKDr94tAmz88J	bank	credit	posted	\N	\N	\N	\N	\N	25.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 00:00:00+00	\N	\N	\N	Online Xfer Transfer from SV x6978	\N	f	2026-04-28 01:41:34.863+00	2026-04-28 01:41:34.863+00	2026-04-28 22:38:48.71+00	\N
aca4fd85-1d51-4eff-8f87-358ecd78a8c5	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Je5e8VV5pvu9reOdPM1nuK6on4OZRpukxMmm1	bank	debit	posted	\N	\N	\N	\N	\N	155.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CC x8301	\N	f	2026-04-28 01:41:34.924+00	2026-04-28 01:41:34.924+00	2026-04-28 22:38:48.778+00	\N
95989ed5-cb07-4947-86ef-8e641bdf3c2a	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	OeaegVVapnuj5OLdRe6pumpAwX67oOu496xpV	bank	credit	posted	\N	\N	\N	\N	\N	155.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:34.996+00	2026-04-28 01:41:34.996+00	2026-04-28 22:38:48.843+00	\N
b6f0e7e1-3d29-4eb1-a4a3-cf2faef05a4b	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	5b7bwKK7XyuVQwa957NJHe8ALR0DgahVQ0wwk	bank	debit	posted	\N	\N	\N	\N	\N	109.06	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 00:00:00+00	\N	\N	\N	Primerica	Primerica	f	2026-04-28 01:41:35.063+00	2026-04-28 01:41:35.063+00	2026-04-28 22:38:48.905+00	\N
7b6af002-719f-40c1-832d-ca0cbd201e95	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	EeZerggZpmuPNjrpwy37tAPYozN6yMSENyQd5	bank	credit	posted	\N	\N	\N	\N	\N	10.04	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-14 00:00:00+00	\N	\N	\N	OPENAI *CHATGPT SUBSCR	\N	f	2026-04-28 01:41:35.134+00	2026-04-28 01:41:35.134+00	2026-04-28 22:38:48.974+00	\N
df9d68f4-748c-40eb-9cd5-7efec3e94c73	81555e75-82a5-45e7-9882-6d8996c9727d	415b3fa0-b187-4726-8d2c-8def88b4c586	plaid	Je5e8VV5pvu9reOdPM1nuK6on4OZRpukxMm0r	bank	credit	posted	\N	\N	\N	\N	\N	25.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-14 00:00:00+00	\N	\N	\N	Online Xfer Transfer from CK x1409	\N	f	2026-04-28 01:41:35.203+00	2026-04-28 01:41:35.203+00	2026-04-28 22:38:49.029+00	\N
06072a15-fb85-4d7d-9111-b7edad0c6ce0	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	gvDv4eeDO3uYNz95ZODMiBj5pKDr94tAmz86q	fee	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 00:00:00+00	\N	Subscription	\N	BASE44 WWW.BASE44.CONY	\N	f	2026-04-28 01:41:32.904+00	2026-04-28 01:41:32.904+00	2026-04-28 22:38:46.999+00	\N
7c10c0b0-5d7e-4f8a-be2f-a700c557c8a7	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	77w7LAAwXkT0vzq3Rbans79KeEpw6dTYA1080	fee	debit	posted	\N	\N	\N	\N	\N	20.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 00:00:00+00	\N	Subscription	\N	CLAUDE.AI SUBSCRIPTION ANTHROPIC.COMCA	Claude.ai	f	2026-04-28 01:41:32.975+00	2026-04-28 01:41:32.975+00	2026-04-28 22:38:47.057+00	\N
08ca98c1-aca4-410c-9fc5-53c7ffd4c332	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	DeXejbbXpBu1xzB0dV5pc1oOxkNYyJHgOJwZq	bank	credit	posted	\N	\N	\N	\N	\N	65.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 00:00:00+00	\N	\N	\N	Online Xfer Transfer from SV x5019	\N	f	2026-04-28 01:41:33.046+00	2026-04-28 01:41:33.046+00	2026-04-28 22:38:47.113+00	\N
ac8b645d-b319-4bf3-8d1c-71487447a999	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Leke5VVkNjuAnZxgBMyNh4xEAnd6jKt8R9Z0d	bank	debit	posted	\N	\N	\N	\N	\N	65.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 00:00:00+00	\N	\N	\N	Venmo	\N	f	2026-04-28 01:41:33.121+00	2026-04-28 01:41:33.121+00	2026-04-28 22:38:47.176+00	\N
2a8cc40d-df1a-4a9f-b8f8-e54f00931437	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	9VLV100LXviVRB58zwxLH5mrA9aXPNhyo0g66	bank	debit	posted	\N	\N	\N	\N	\N	96.25	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-23 00:00:00+00	\N	\N	\N	E ZPASS DE CSC00100701 DE	E Zpass De Csc	f	2026-04-28 01:41:33.198+00	2026-04-28 01:41:33.198+00	2026-04-28 22:38:47.24+00	\N
aa14d50f-98b5-4973-907f-69db22c86dcb	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	1858Vqq5XPuVybpzr79AHMY3pLKbNZtA63nmA	bank	debit	posted	\N	\N	\N	\N	\N	8.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-22 00:00:00+00	\N	\N	\N	Dollar Tree	Dollar Tree	f	2026-04-28 01:41:33.268+00	2026-04-28 01:41:33.268+00	2026-04-28 22:38:47.3+00	\N
dc0735e5-d4da-48cc-afa1-b87abbe3ef7c	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	Ve1ewVV1pnumXOAqpz3ZixYdbyPvqMFkK94nj	bank	credit	posted	\N	\N	\N	\N	\N	499.38	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-22 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:33.339+00	2026-04-28 01:41:33.339+00	2026-04-28 22:38:47.456+00	\N
aa2b3f1c-b849-4634-a775-81b2cb781dac	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Pe5e7VV5pnurXoEwkJLOU0Rn8Nkx4qtJbXomD	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-21 00:00:00+00	\N	\N	\N	UMBNKC CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:33.421+00	2026-04-28 01:41:33.421+00	2026-04-28 22:38:47.528+00	\N
951e54ac-431c-4be4-9de6-f118579d42ee	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	pZNZgeeNb8S0EXDPBpbYs1y4RrXONAHamB3Am	bank	debit	posted	\N	\N	\N	\N	\N	49.62	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	STOLTZFUS MEATS INC	Stoltzfus Meats	f	2026-04-28 01:41:36.683+00	2026-04-28 01:41:36.683+00	2026-04-28 22:38:50.284+00	\N
438e31b5-0b53-4b0c-9ffb-91b45694b087	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	4o5odyy5X3ckydaNEP5wcyobEQYAJpIqZmRRB	bank	debit	posted	\N	\N	\N	\N	\N	5.47	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 405524 WAWA 876 CAMDEN * DE	Wawa	f	2026-04-28 01:41:36.831+00	2026-04-28 01:41:36.831+00	2026-04-28 22:38:50.412+00	\N
cc18725a-05b0-46ad-92ad-0269271ec790	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Je5e8VV5pvu9reOdPM1nuK6on4OZRpukxMmmr	bank	debit	posted	\N	\N	\N	\N	\N	13.42	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 00:00:00+00	\N	\N	\N	DDA PURCHASE AP 50390030 WM SUPERCENTER 5039 CAMDEN * DE	Walmart	f	2026-04-28 01:41:36.964+00	2026-04-28 01:41:36.964+00	2026-04-28 22:38:50.527+00	\N
047af80b-efb1-4755-8007-25c148229de1	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	Leke5VVkNjuAnZxgBMyNh4xEAnd6jKt8R9ZBb	bank	credit	posted	\N	\N	\N	\N	\N	658.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:37.103+00	2026-04-28 01:41:37.103+00	2026-04-28 22:38:50.691+00	\N
6fb7f908-f179-4203-8fbd-abbdf8aabf30	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	Pe5e7VV5pnurXoEwkJLOU0Rn8Nkx4qtJbXoAz	bank	debit	posted	\N	\N	\N	\N	\N	4.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-08 00:00:00+00	\N	\N	\N	DRIVEEZMD MPC	Driveezmd Mpc	f	2026-04-28 01:41:37.23+00	2026-04-28 01:41:37.23+00	2026-04-28 22:38:50.81+00	\N
416a173b-e742-4947-afb0-89c2a9db50b5	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	1858Vqq5XPuVybpzr79AHMY3pLKbNZtA63ngv	bank	credit	posted	\N	\N	\N	\N	\N	242.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-08 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:37.377+00	2026-04-28 01:41:37.377+00	2026-04-28 22:38:50.959+00	\N
64101849-24e1-4c17-a0bb-6637428511ca	81555e75-82a5-45e7-9882-6d8996c9727d	73d65657-9e74-40e5-ad75-d96a2efa6502	plaid	jrqrJmmqOkcxoajY64y8SxobR0EgZ7F3b0evn	bank	debit	posted	\N	\N	\N	\N	\N	10.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-08 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 494300 DELAWARE CORP TAX WEB * DE	Delaware Corp	f	2026-04-28 01:41:37.511+00	2026-04-28 01:41:37.511+00	2026-04-28 22:38:51.077+00	\N
51b5589c-23f1-484c-b888-d5f85f7b7b9f	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	gvDv4eeDO3uYNz95ZODMiBj5pKDr94tAmz88q	bank	debit	posted	\N	\N	\N	\N	\N	7.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	PAYPAL PURCHASE	\N	f	2026-04-28 01:41:37.854+00	2026-04-28 01:41:37.854+00	2026-04-28 22:38:51.444+00	\N
fa44c8a1-f54f-4617-9172-7794920a3ca4	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	q5y57eeyb8IqRaVw3JbOiQkYrbEadzInAeDEj	bank	debit	posted	\N	\N	\N	\N	\N	63.63	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	TST*FARMERS FISHERS BAKE	Founding Farmers Fishers & Bakers	f	2026-04-28 01:41:38.03+00	2026-04-28 01:41:38.03+00	2026-04-28 22:38:51.566+00	\N
19ffd1ae-3617-4ff8-b14f-84086b1e1f4f	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	ReweVEEwXnuaMRKLvg1XsJQ8rdP6oZH1gvee1	bank	debit	posted	\N	\N	\N	\N	\N	8.40	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 401134 SQSP WORKSP 229112758 SQUARESPACE C *	Worksp	f	2026-04-28 01:41:38.216+00	2026-04-28 01:41:38.216+00	2026-04-28 22:38:51.679+00	\N
41f8c1a8-6eaf-474a-8f1a-6d4c2611a841	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	EeZerggZpmuPNjrpwy37tAPYozN6yMSENyQQ5	bank	debit	posted	\N	\N	\N	\N	\N	4.05	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 407105 PMUSA 758054 ARLINGTON 770 8189036 *	\N	f	2026-04-28 01:41:38.359+00	2026-04-28 01:41:38.359+00	2026-04-28 22:38:51.787+00	\N
a18e4881-cbc2-44ec-8911-fb515314cc9a	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Qede9VVdpXu4Bzd6Agn8uxXRNd8Q7PFJPZOOM	bank	debit	posted	\N	\N	\N	\N	\N	4.23	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 407105 PMUSA 758054 ARLINGTON 770 8189036 *	\N	f	2026-04-28 01:41:38.531+00	2026-04-28 01:41:38.531+00	2026-04-28 22:38:51.897+00	\N
2d117926-aa24-4099-9fe6-50538f35cb80	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	77w7LAAwXkT0vzq3Rbans79KeEpw6dTYA1000	bank	debit	posted	\N	\N	\N	\N	\N	7.69	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 494166 ROYAL FARMS 163 QUEENSTOWN *	Royal Farms	f	2026-04-28 01:41:38.663+00	2026-04-28 01:41:38.663+00	2026-04-28 22:38:52.002+00	\N
54251e97-3d26-4764-bcf1-dbe99b1c9428	81555e75-82a5-45e7-9882-6d8996c9727d	73d65657-9e74-40e5-ad75-d96a2efa6502	plaid	ro0o9ee0b8cXVemxypb0hNpOZb9Jo7Cbn3Vrk	bank	debit	posted	\N	\N	\N	\N	\N	4.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	WRIGHT EXPRESS FLEET DEBI	Wright Express Fleet Debi	f	2026-04-28 01:41:38.838+00	2026-04-28 01:41:38.838+00	2026-04-28 22:38:52.111+00	\N
a3912268-d05f-4323-9834-bad865da5011	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	YdBdDVVBenczvnMyV8kQUb75EPNoyMH9ERJJN	bank	debit	posted	\N	\N	\N	\N	\N	100.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-03 00:00:00+00	\N	\N	\N	Comcast	Comcast	f	2026-04-28 01:41:39.033+00	2026-04-28 01:41:39.033+00	2026-04-28 22:38:52.22+00	\N
f3bb12e3-ef38-4d6c-9113-e818478d2a1c	81555e75-82a5-45e7-9882-6d8996c9727d	73d65657-9e74-40e5-ad75-d96a2efa6502	plaid	4o5odyy5X3ckydaNEP5wcyobEQYAJpIqZmRDB	bank	debit	posted	\N	\N	\N	\N	\N	30.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-03 00:00:00+00	\N	\N	\N	MAINTENANCE FEE	\N	f	2026-04-28 01:41:39.183+00	2026-04-28 01:41:39.183+00	2026-04-28 22:38:52.332+00	\N
c35f3bdf-efed-4d97-8055-21f2546ab9d6	81555e75-82a5-45e7-9882-6d8996c9727d	415b3fa0-b187-4726-8d2c-8def88b4c586	plaid	Zwdw1VVdOnfDdXbKp8AZsdnLa3e7zgHvrKb8M	bank	debit	posted	\N	\N	\N	\N	\N	10.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-03 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CK x3731	\N	f	2026-04-28 01:41:39.337+00	2026-04-28 01:41:39.337+00	2026-04-28 22:38:52.444+00	\N
8f19cb34-231d-477a-89d9-11b5d1d65efd	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	ek6kjee6OqinDmy89YvNH9m5w6YOpMtaNAnn1	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-03 00:00:00+00	\N	\N	\N	UMBNKC CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:39.526+00	2026-04-28 01:41:39.526+00	2026-04-28 22:38:52.577+00	\N
81dcedcd-c509-4644-ae34-59381e6e68bd	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	dKwK0eewOPfvab3JnNqZsqXL6xA1mvHD4MKoP	bank	debit	posted	\N	\N	\N	\N	\N	10.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 00:00:00+00	\N	\N	\N	Dollar Tree	Dollar Tree	f	2026-04-28 01:41:39.674+00	2026-04-28 01:41:39.674+00	2026-04-28 22:38:52.683+00	\N
a4499c5a-5365-4bcd-b64e-5cd86fa76606	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	zYNYDeeNbVUXBnYpgvQVheRw0VY4q1hK5VvvL	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 00:00:00+00	\N	\N	\N	UMBNKC CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:39.829+00	2026-04-28 01:41:39.829+00	2026-04-28 22:38:52.79+00	\N
96cf0756-937c-4e5f-bc6e-7a62534000eb	81555e75-82a5-45e7-9882-6d8996c9727d	73d65657-9e74-40e5-ad75-d96a2efa6502	plaid	aBqBkppqOLTKvEP4981puQvjBz0Rn6I4zn7KE	bank	credit	posted	\N	\N	\N	\N	\N	4.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 00:00:00+00	\N	\N	\N	Online Xfer Transfer from CK x1409	\N	f	2026-04-28 01:41:40.029+00	2026-04-28 01:41:40.029+00	2026-04-28 22:38:52.901+00	\N
677e222b-9cb9-41ba-9e05-0d9929d0857e	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	6gdg6kkdXKSv0ZxNL7m9sQpe3Aj0wKIYpMwAM	bank	debit	posted	\N	\N	\N	\N	\N	25.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 00:00:00+00	\N	\N	\N	Online Xfer Transfer to SV x4403	\N	f	2026-04-28 01:41:40.175+00	2026-04-28 01:41:40.175+00	2026-04-28 22:38:53.015+00	\N
9dc047f0-e39b-483c-93e2-65d1808fc347	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Leke5VVkNjuAnZxgBMyNh4xEAnd6jKt8R9ZJb	bank	debit	posted	\N	\N	\N	\N	\N	134.30	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 00:00:00+00	\N	\N	\N	Primerica	Primerica	f	2026-04-28 01:41:40.355+00	2026-04-28 01:41:40.355+00	2026-04-28 22:38:53.152+00	\N
fd686001-bbb0-4992-9aac-f9e3873aa948	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	1858Vqq5XPuVybpzr79AHMY3pLKbNZtA63nYv	bank	debit	posted	\N	\N	\N	\N	\N	37.24	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 00:00:00+00	\N	\N	\N	TIDEWATERUTILITY UTILITYPMT	Tidewater Utility Utilitypmt	f	2026-04-28 01:41:40.546+00	2026-04-28 01:41:40.546+00	2026-04-28 22:38:53.317+00	\N
3feeef25-301b-4a6a-abcd-4b36bd835028	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	MeQemYYQpnum5ZPq3gdpiqkoB7gwxKHPwjX0B	bank	credit	posted	\N	\N	\N	\N	\N	147.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-14 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:35.404+00	2026-04-28 01:41:35.404+00	2026-04-28 22:38:49.255+00	\N
6e917dcf-41b6-4c92-aa09-0957ef6dcb46	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	mxyx5eeyN0im0BwV1p49i5NLDwmQeVhNZzBvD	bank	debit	posted	\N	\N	\N	\N	\N	9.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	BIG Z PIZZA	Big Z Pizza	f	2026-04-28 01:41:35.549+00	2026-04-28 01:41:35.549+00	2026-04-28 22:38:49.392+00	\N
8f7e9216-9fcd-4efb-9e9e-606d4e4e0e45	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	0JKJ9PPKX1cVz9dZJgQNH0XBa5Ye4ztJDgAAq	bank	debit	posted	\N	\N	\N	\N	\N	351.76	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	DELMARVA UTILITY BILLPAY	Delmarva Utility	f	2026-04-28 01:41:35.702+00	2026-04-28 01:41:35.702+00	2026-04-28 22:38:49.506+00	\N
60aea280-a5d0-49a0-945b-a22d9d3860b3	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	dKwK0eewOPfvab3JnNqZsqXL6xA1mvHD4MKQP	bank	debit	posted	\N	\N	\N	\N	\N	37.08	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	FOOD LIABLITY INSURANC	Food Liablity Insuranc	f	2026-04-28 01:41:35.925+00	2026-04-28 01:41:35.925+00	2026-04-28 22:38:49.617+00	\N
fa3b4156-3dee-4bc4-bf63-a0d37406818e	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	zYNYDeeNbVUXBnYpgvQVheRw0VY4q1hK5VvML	bank	debit	posted	\N	\N	\N	\N	\N	9.50	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	LOS JARRITTOS	Los Jarritos	f	2026-04-28 01:41:36.079+00	2026-04-28 01:41:36.079+00	2026-04-28 22:38:49.741+00	\N
323f5d47-94a9-4d49-a4ce-432df82d646c	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	ek6kjee6OqinDmy89YvNH9m5w6YOpMtaNAn41	bank	debit	posted	\N	\N	\N	\N	\N	8.59	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	NEWARK NATURAL FOODS	Newark Natural Foods	f	2026-04-28 01:41:36.237+00	2026-04-28 01:41:36.237+00	2026-04-28 22:38:49.885+00	\N
b9c61629-9af2-4456-b628-3383d00f06a1	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	xYNY6eeNb7Uv5zYNpRewsPJrqe6Ln5toVaOO0	bank	credit	posted	\N	\N	\N	\N	\N	200.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	Online Xfer Transfer from SV x5019	\N	f	2026-04-28 01:41:36.369+00	2026-04-28 01:41:36.369+00	2026-04-28 22:38:50.043+00	\N
ee6ee7ab-76c7-4ebf-a52d-96eec8e91d6c	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	nJKJoeeKNjcab9AOPp71sKQmgDxJ38u7VdBja	bank	debit	posted	\N	\N	\N	\N	\N	32.05	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	SOPHIE'S FISH MARKET	Sophie's Fish Market	f	2026-04-28 01:41:36.534+00	2026-04-28 01:41:36.534+00	2026-04-28 22:38:50.161+00	\N
d6470a51-43bf-4472-bb59-9057289ad9c4	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	Qede9VVdpXu4Bzd6Agn8uxXRNd8Q7PFJPZO9M	bank	debit	posted	\N	\N	\N	\N	\N	19.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	UPWORK * -909170488	Upwork	f	2026-04-28 01:41:36.756+00	2026-04-28 01:41:36.756+00	2026-04-28 22:38:50.34+00	\N
ba801f85-5f6d-42e6-84a7-122db98c6c90	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	ro0o9ee0b8cXVemxypb0hNpOZb9Jo7Cbn3VVk	bank	debit	posted	\N	\N	\N	\N	\N	1.35	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 444500 CITY OF NEWARK DE PARKIN *	City Of Newark De Parkin	f	2026-04-28 01:41:36.895+00	2026-04-28 01:41:36.895+00	2026-04-28 22:38:50.47+00	\N
19e9f22c-c8b0-46d4-98cb-cfa10b1cfd1c	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	8969Dvv6eAcjvJB6OadgurJ5Vy41RaCZAXxxo	bank	debit	posted	\N	\N	\N	\N	\N	658.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-10 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CC x8301	\N	f	2026-04-28 01:41:37.031+00	2026-04-28 01:41:37.031+00	2026-04-28 22:38:50.582+00	\N
36e5913a-05cb-4e24-a21f-0f38e252eb08	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	DeXejbbXpBu1xzB0dV5pc1oOxkNYyJHgOJwR4	bank	debit	posted	\N	\N	\N	\N	\N	658.71	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-09 00:00:00+00	\N	\N	\N	Home Depot	The Home Depot	f	2026-04-28 01:41:37.17+00	2026-04-28 01:41:37.17+00	2026-04-28 22:38:50.749+00	\N
b5420340-65e6-45f1-ae9a-c6d6e3d4f430	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Zwdw1VVdOnfDdXbKp8AZsdnLa3e7zgHvrKbbM	bank	debit	posted	\N	\N	\N	\N	\N	242.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-08 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CC x8301	\N	f	2026-04-28 01:41:37.313+00	2026-04-28 01:41:37.313+00	2026-04-28 22:38:50.869+00	\N
3efc758c-7cca-4dd5-a162-a4196ab1dfdf	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	5b7bwKK7XyuVQwa957NJHe8ALR0DgahVQ0ww7	bank	debit	posted	\N	\N	\N	\N	\N	203.64	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-08 00:00:00+00	\N	\N	\N	UMBNKC CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:37.447+00	2026-04-28 01:41:37.447+00	2026-04-28 22:38:51.015+00	\N
1a7a6cd5-5b95-48f0-b87b-38774997aed8	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	b3B3AeeBpDfmwXKaYpbgipD56MKZj1F9OjJJ6	bank	credit	posted	\N	\N	\N	\N	\N	659.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-07 00:00:00+00	\N	\N	\N	FID BKG SVC LLC MONEYLINE	Fidelity	f	2026-04-28 01:41:37.575+00	2026-04-28 01:41:37.575+00	2026-04-28 22:38:51.138+00	\N
293a6cda-8f4a-4142-8a4d-0e11b966014a	81555e75-82a5-45e7-9882-6d8996c9727d	415b3fa0-b187-4726-8d2c-8def88b4c586	plaid	8969Dvv6eAcjvJB6OadgurJ5Vy41RaCZAXxYo	bank	debit	posted	\N	\N	\N	\N	\N	20.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CK x3731	\N	f	2026-04-28 01:41:37.752+00	2026-04-28 01:41:37.752+00	2026-04-28 22:38:51.389+00	\N
a4ea1321-7f72-4adc-b5ca-172f05a4f35a	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	BeZev55ZXPunvgr4db1jHynoz89jpLINO637o	bank	debit	posted	\N	\N	\N	\N	\N	173.84	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	SP GLOSSIER 121-22560781	Glossier	f	2026-04-28 01:41:37.937+00	2026-04-28 01:41:37.937+00	2026-04-28 22:38:51.501+00	\N
1bc7d48a-68fe-4c75-ac88-c5c84f0780be	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	pZNZgeeNb8S0EXDPBpbYs1y4RrXONAHamB33m	bank	debit	posted	\N	\N	\N	\N	\N	15.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 400945 FREETAXUSA COM 877 2699027 *	Freetaxusa Com	f	2026-04-28 01:41:38.144+00	2026-04-28 01:41:38.144+00	2026-04-28 22:38:51.624+00	\N
670ccc6f-e747-4da1-9e1f-75cdfe1253ce	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	nJKJoeeKNjcab9AOPp71sKQmgDxJ38u7VdBBa	bank	debit	posted	\N	\N	\N	\N	\N	1.69	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 407105 PMUSA 758054 ARLINGTON 770 8189036 *	\N	f	2026-04-28 01:41:38.28+00	2026-04-28 01:41:38.28+00	2026-04-28 22:38:51.734+00	\N
366769f1-6341-4a77-8a29-c51ccf897d4c	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	MeQemYYQpnum5ZPq3gdpiqkoB7gwxKHPwjXXB	bank	debit	posted	\N	\N	\N	\N	\N	4.05	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 407105 PMUSA 758054 ARLINGTON 770 8189036 *	\N	f	2026-04-28 01:41:38.456+00	2026-04-28 01:41:38.456+00	2026-04-28 22:38:51.843+00	\N
93cadfce-8139-4d16-b692-d7bf55ccf963	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Ve1ewVV1pnumXOAqpz3ZixYdbyPvqMFkK944j	bank	debit	posted	\N	\N	\N	\N	\N	22.61	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 413746 TST RASA NATIONAL LAN ARLINGTON *	Rasa National Lan	f	2026-04-28 01:41:38.597+00	2026-04-28 01:41:38.597+00	2026-04-28 22:38:51.95+00	\N
48fbc29e-2400-487f-a0fd-f271616115fb	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	9VLV100LXviVRB58zwxLH5mrA9aXPNhyo0gg6	bank	debit	posted	\N	\N	\N	\N	\N	20.07	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 494166 ROYAL FARMS 163 QUEENSTOWN *	Royal Farms	f	2026-04-28 01:41:38.754+00	2026-04-28 01:41:38.754+00	2026-04-28 22:38:52.059+00	\N
70b56796-2561-47d1-bbf1-17f937a26bdb	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	OeaegVVapnuj5OLdRe6pumpAwX67oOu496xxV	bank	debit	posted	\N	\N	\N	\N	\N	0.80	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-06 00:00:00+00	\N	\N	\N	Whole Foods	Whole Foods	f	2026-04-28 01:41:38.927+00	2026-04-28 01:41:38.927+00	2026-04-28 22:38:52.168+00	\N
140457fa-b35b-4c03-8c75-d3c1565e22d9	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	XeqeLOOqpnu68YD3QpKzfn8MRrYqKNf6Keddk	bank	debit	posted	\N	\N	\N	\N	\N	9.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-03 00:00:00+00	\N	\N	\N	MAINTENANCE FEE	\N	f	2026-04-28 01:41:39.119+00	2026-04-28 01:41:39.119+00	2026-04-28 22:38:52.279+00	\N
3c0eeb61-0d34-47e6-a45c-5af94d743da0	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	NY5YbVV5pnU0Qz1YymwpsakJMjPeB6f38qoon	bank	debit	posted	\N	\N	\N	\N	\N	77.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-03 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CC x8301	\N	f	2026-04-28 01:41:39.246+00	2026-04-28 01:41:39.246+00	2026-04-28 22:38:52.385+00	\N
ccb45650-8f40-4846-a495-a0942c030c23	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	35Z5M33ZXBIKn5pdgv1xu6K84NAzvkfLOboAp	bank	credit	posted	\N	\N	\N	\N	\N	77.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-03 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:39.451+00	2026-04-28 01:41:39.451+00	2026-04-28 22:38:52.508+00	\N
24f23c07-bad1-4fea-bdac-628ada8402c5	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	yYNYLeeNb8UOneYEr7bqhQ0YPrzLjKIaJ0pg4	bank	debit	posted	\N	\N	\N	\N	\N	77.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 00:00:00+00	\N	\N	\N	AAA MEMBERSHIP GAR 0724 https://www.aDE	AAA Membership	f	2026-04-28 01:41:39.589+00	2026-04-28 01:41:39.589+00	2026-04-28 22:38:52.63+00	\N
26b422a6-b7e4-4456-a35d-00a1d3df84b5	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	mxyx5eeyN0im0BwV1p49i5NLDwmQeVhNZzB8D	bank	debit	posted	\N	\N	\N	\N	\N	25.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-02 00:00:00+00	\N	\N	\N	NAFECU CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:39.756+00	2026-04-28 01:41:39.756+00	2026-04-28 22:38:52.736+00	\N
8e92afcb-0004-4b7e-936b-2fd49af2e330	81555e75-82a5-45e7-9882-6d8996c9727d	415b3fa0-b187-4726-8d2c-8def88b4c586	plaid	5b7bwKK7XyuVQwa957NJHe8ALR0DgahVQ0wN7	bank	credit	posted	\N	\N	\N	\N	\N	25.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 00:00:00+00	\N	\N	\N	Online Xfer Transfer from CK x1409	\N	f	2026-04-28 01:41:39.915+00	2026-04-28 01:41:39.915+00	2026-04-28 22:38:52.846+00	\N
390a12fd-a881-4987-ac92-1a43ff7f4f84	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	wVNVwYYNb8iEz1Km05bRsxjwE86ZzDFrDPKR9	bank	debit	posted	\N	\N	\N	\N	\N	4.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CK x0505	\N	f	2026-04-28 01:41:40.091+00	2026-04-28 01:41:40.091+00	2026-04-28 22:38:52.956+00	\N
e0b25aa1-4f2d-452f-85b6-84a002f390a8	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	DeXejbbXpBu1xzB0dV5pc1oOxkNYyJHgOJwX4	bank	debit	posted	\N	\N	\N	\N	\N	49.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 00:00:00+00	\N	\N	\N	Planet Fitness	Planet Fitness	f	2026-04-28 01:41:40.263+00	2026-04-28 01:41:40.263+00	2026-04-28 22:38:53.094+00	\N
de1bf8c1-8eda-4ecd-a4e5-51a4cd43b69a	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Pe5e7VV5pnurXoEwkJLOU0Rn8Nkx4qtJbXoOz	bank	credit	posted	\N	\N	\N	\N	\N	973.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-01 00:00:00+00	\N	\N	\N	Social Security Administration	Social Security Administration	f	2026-04-28 01:41:40.454+00	2026-04-28 01:41:40.454+00	2026-04-28 22:38:53.256+00	\N
d94c4e48-36f1-4c87-8699-6fd89477e46d	81555e75-82a5-45e7-9882-6d8996c9727d	415b3fa0-b187-4726-8d2c-8def88b4c586	plaid	b3B3AeeBpDfmwXKaYpbgipD56MKZj1F9OjJP6	bank	credit	posted	\N	\N	\N	\N	\N	0.01	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-31 00:00:00+00	\N	\N	\N	INTEREST CREDIT	\N	f	2026-04-28 01:41:40.625+00	2026-04-28 01:41:40.625+00	2026-04-28 22:38:53.371+00	\N
7ed67530-cf8e-4de1-a7af-d961c470f1f5	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	NY5YbVV5pnU0Qz1YymwpsakJMjPeB6f38qoyn	bank	debit	posted	\N	\N	\N	\N	\N	97.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	ASIAN TREASURES DE	Asian Treasures	f	2026-04-28 01:41:35.478+00	2026-04-28 01:41:35.478+00	2026-04-28 22:38:49.329+00	\N
defae648-4df7-40ef-97f5-677b9b209f44	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	wVNVwYYNb8iEz1Km05bRsxjwE86ZzDFrDPKv9	bank	debit	posted	\N	\N	\N	\N	\N	290.49	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	Costco	Costco	f	2026-04-28 01:41:35.626+00	2026-04-28 01:41:35.626+00	2026-04-28 22:38:49.447+00	\N
84f70f1b-40d4-4a86-9166-cfa2970a8e54	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	jrqrJmmqOkcxoajY64y8SxobR0EgZ7F3b0een	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	FMOFCU SV WEBXFR TRANSFER	\N	f	2026-04-28 01:41:35.809+00	2026-04-28 01:41:35.809+00	2026-04-28 22:38:49.562+00	\N
f1902a43-6bb3-4fdd-af26-4bef814e1761	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	aBqBkppqOLTKvEP4981puQvjBz0Rn6I4zn77E	bank	credit	posted	\N	\N	\N	\N	\N	2653.41	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	IQVIA INC PAYROLL	\N	f	2026-04-28 01:41:36.01+00	2026-04-28 01:41:36.01+00	2026-04-28 22:38:49.677+00	\N
e0e5c251-3e79-4409-9124-24c8100f5047	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	6gdg6kkdXKSv0ZxNL7m9sQpe3Aj0wKIYpMwNM	bank	debit	posted	\N	\N	\N	\N	\N	49.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	NAV TECH NAV.COM	Nav Tech	f	2026-04-28 01:41:36.161+00	2026-04-28 01:41:36.161+00	2026-04-28 22:38:49.81+00	\N
131f1250-4b24-4f87-a9cf-46857f2b2de6	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	ReweVEEwXnuaMRKLvg1XsJQ8rdP6oZH1gve91	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	OPENAI *CHATGPT SUBSCR OPENAI.COM	OpenAI	f	2026-04-28 01:41:36.305+00	2026-04-28 01:41:36.305+00	2026-04-28 22:38:49.978+00	\N
8ae0ae63-9f3d-41bb-b4fc-f0b334d6d16e	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	YdBdDVVBenczvnMyV8kQUb75EPNoyMH9ERJzN	bank	debit	posted	\N	\N	\N	\N	\N	130.44	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	RESTAURANT DEPOT	Restaurant Depot	f	2026-04-28 01:41:36.466+00	2026-04-28 01:41:36.466+00	2026-04-28 22:38:50.104+00	\N
327cb4db-e38d-4007-87d0-ed29ae3c27b1	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	XeqeLOOqpnu68YD3QpKzfn8MRrYqKNf6Kedzk	bank	debit	posted	\N	\N	\N	\N	\N	27.67	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-13 00:00:00+00	\N	\N	\N	STOLTZFUS MEATS INC	Stoltzfus Meats	f	2026-04-28 01:41:36.604+00	2026-04-28 01:41:36.604+00	2026-04-28 22:38:50.224+00	\N
08d05aa4-23ae-4d4c-88c3-aa81e73d86ba	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Qede9VVdpXu4Bzd6Agn8uxXBXdzQZYFO951Jy	bank	credit	posted	\N	\N	\N	\N	\N	121.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 00:00:00+00	\N	\N	\N	Online Xfer Transfer from SV x6978	\N	f	2026-04-28 01:41:42.393+00	2026-04-28 01:41:42.393+00	2026-04-28 22:38:54.757+00	\N
6a3f912a-9018-4c62-9d9f-dd5de9021f89	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	XeqeLOOqpnu68YD3QpKzfn818r0qAPCdzDg6z	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-20 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CK x5430	\N	f	2026-04-28 01:41:42.564+00	2026-04-28 01:41:42.564+00	2026-04-28 22:38:54.902+00	\N
ea9f68fb-5f40-49e1-b97a-6577880775c4	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	pZNZgeeNb8S0EXDPBpbYs1y7yrKOZ8t3AXoa3	bank	debit	posted	\N	\N	\N	\N	\N	100.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-20 00:00:00+00	\N	\N	\N	TD ZELLE SENT 607900F0HRK4 Zelle SAYSAW DONALDSON	\N	f	2026-04-28 01:41:42.715+00	2026-04-28 01:41:42.715+00	2026-04-28 22:38:55.026+00	\N
da1c56f2-66b3-4370-9da8-b599ecd7c801	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	ek6kjee6OqinDmy89YvNH9mAm6kOaBcn4POak	bank	debit	posted	\N	\N	\N	\N	\N	30.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-19 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CK x5430	\N	f	2026-04-28 01:41:42.855+00	2026-04-28 01:41:42.855+00	2026-04-28 22:38:55.142+00	\N
552c918c-5ba0-460d-84c7-a1c2b34f17e3	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	EeZerggZpmuPNjrpwy37tAPpPzK65QHQdeRvg	bank	credit	posted	\N	\N	\N	\N	\N	291.10	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-18 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:42.976+00	2026-04-28 01:41:42.976+00	2026-04-28 22:38:55.269+00	\N
8416ba24-b952-42c3-8e63-f2521a5c5a99	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	mxyx5eeyN0im0BwV1p49i5NqNw3QbvuB8AjNN	bank	debit	posted	\N	\N	\N	\N	\N	1347.16	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-17 00:00:00+00	\N	\N	\N	BEST EGG PAYMENT	Best Egg	f	2026-04-28 01:41:43.123+00	2026-04-28 01:41:43.123+00	2026-04-28 22:38:55.405+00	\N
e4d292e2-7d1d-4348-be1c-47bc4ed810b0	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	wVNVwYYNb8iEz1Km05bRsxj0j8LZe4FKRxNr3	bank	debit	posted	\N	\N	\N	\N	\N	24.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-17 00:00:00+00	\N	\N	\N	Planet Fitness	Planet Fitness	f	2026-04-28 01:41:43.307+00	2026-04-28 01:41:43.307+00	2026-04-28 22:38:55.526+00	\N
0c7d1c33-15ce-4b85-83f7-f86cd9a4f271	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	6gdg6kkdXKSv0ZxNL7m9sQpNpAD0B9twADRYp	bank	debit	posted	\N	\N	\N	\N	\N	58.25	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-17 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 420429 GOFUNDME HELP OUR FAMILY GOFUNDME COM *	Gofundme Help Our Family Gofundme	f	2026-04-28 01:41:43.507+00	2026-04-28 01:41:43.507+00	2026-04-28 22:38:55.662+00	\N
530bc214-5656-4907-aa50-87652e72dc60	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Pe5e7VV5pnurXoEwkJLOU0RYRN1x35HoOdPJg	bank	debit	posted	\N	\N	\N	\N	\N	10.25	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 00:00:00+00	\N	\N	\N	Dollar Tree	Dollar Tree	f	2026-04-28 01:41:43.683+00	2026-04-28 01:41:43.683+00	2026-04-28 22:38:55.794+00	\N
5375dcb7-1de7-49a0-bc98-c42c39c3c87a	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	Qede9VVdpXu4Bzd6Agn8uxXBXdzQZYFO951e8	bank	credit	posted	\N	\N	\N	\N	\N	44.12	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:43.835+00	2026-04-28 01:41:43.835+00	2026-04-28 22:38:55.921+00	\N
5419e213-04c8-4ac6-9b58-d5522256b175	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	DeXejbbXpBu1xzB0dV5pc1o0okbY6rtwXybgd	bank	debit	posted	\N	\N	\N	\N	\N	820.63	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 00:00:00+00	\N	\N	\N	ROCKET MORTGAGE LOAN	Rocket Mortgage	f	2026-04-28 01:41:44.008+00	2026-04-28 01:41:44.008+00	2026-04-28 22:38:56.051+00	\N
7527a441-d71b-4076-97d8-d6658be07fa3	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	35Z5M33ZXBIKn5pdgv1xu6KMKNrzEbCoPryQM	bank	debit	posted	\N	\N	\N	\N	\N	17.15	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 441606 STOLTZFUS MEATS INC NEW CASTLE * DE	Stoltzfus Meats	f	2026-04-28 01:41:44.142+00	2026-04-28 01:41:44.142+00	2026-04-28 22:38:56.204+00	\N
d03871a2-f1c2-477c-863e-437eab806810	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	q5y57eeyb8IqRaVw3JbOiQkVkbKaOptD1zpn8	bank	debit	posted	\N	\N	\N	\N	\N	18.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 469216 SQ DUTCH COUNTRY DONUTS NEW CASTLE * DE	Dutch Country Donuts	f	2026-04-28 01:41:44.287+00	2026-04-28 01:41:44.287+00	2026-04-28 22:38:56.325+00	\N
d2cb86ef-dd14-4e66-a616-592b8937cf5f	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	4o5odyy5X3ckydaNEP5wcyoNoQKAP5FRDK98b	bank	debit	posted	\N	\N	\N	\N	\N	14.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-13 00:00:00+00	\N	\N	\N	CHASE CREDIT CRD EPAY	\N	f	2026-04-28 01:41:44.475+00	2026-04-28 01:41:44.475+00	2026-04-28 22:38:56.452+00	\N
df5784e0-f3bf-484c-9342-218640d519bb	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	jrqrJmmqOkcxoajY64y8SxoXo0AgrJFevd6mz	bank	debit	posted	\N	\N	\N	\N	\N	98.42	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-13 00:00:00+00	\N	\N	\N	DEPT EDUCATION STUDENT LN	Education Student Ln	f	2026-04-28 01:41:44.629+00	2026-04-28 01:41:44.629+00	2026-04-28 22:38:56.609+00	\N
fb54e1a8-ce65-4b70-ad6e-4bab73e87099	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	v9Y9deeYb8cYBnA5vXbyipwbw8RBDJHVp94zL	bank	debit	posted	\N	\N	\N	\N	\N	25.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-13 00:00:00+00	\N	\N	\N	UMBNKC CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:44.775+00	2026-04-28 01:41:44.775+00	2026-04-28 22:38:56.731+00	\N
553dd3a1-f43f-4db7-92e6-9058aa0ca8c1	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	nJKJoeeKNjcab9AOPp71sKQVQD0J1ETBjYZJ9	bank	debit	posted	\N	\N	\N	\N	\N	9.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-13 00:00:00+00	\N	\N	\N	UPWORK * -900478432	Upwork	f	2026-04-28 01:41:44.911+00	2026-04-28 01:41:44.911+00	2026-04-28 22:38:56.839+00	\N
0c786b9c-39f8-469c-902b-cd81fed357d1	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	XeqeLOOqpnu68YD3QpKzfn818r0qAPCdzDgkL	bank	debit	posted	\N	\N	\N	\N	\N	34.13	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-12 00:00:00+00	\N	\N	\N	FOOD LIABLITY INSURANC	Food Liablity Insuranc	f	2026-04-28 01:41:45.055+00	2026-04-28 01:41:45.055+00	2026-04-28 22:38:56.952+00	\N
7a3aaede-6ad3-4332-9baa-56e3c199b557	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	pZNZgeeNb8S0EXDPBpbYs1y7yrKOZ8t3AXono	bank	credit	posted	\N	\N	\N	\N	\N	88.48	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-12 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:45.189+00	2026-04-28 01:41:45.189+00	2026-04-28 22:38:57.077+00	\N
81ba5c4c-e74a-48f1-9512-610a70929cc7	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	8969Dvv6eAcjvJB6OadgurJ6JyO10nUxYOgBn	bank	credit	posted	\N	\N	\N	\N	\N	2653.41	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-11 00:00:00+00	\N	\N	\N	IQVIA INC PAYROLL	\N	f	2026-04-28 01:41:45.326+00	2026-04-28 01:41:45.326+00	2026-04-28 22:38:57.218+00	\N
2dc3c3bb-f20b-4e2a-85ac-f072286f8f23	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	zYNYDeeNbVUXBnYpgvQVheRZRVn45BsvM1rqy	bank	debit	posted	\N	\N	\N	\N	\N	9.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 00:00:00+00	\N	\N	\N	AMAZON MKTPL*BD8VP54O2 Amzn.com/billWA	Amazon	f	2026-04-28 01:41:45.455+00	2026-04-28 01:41:45.455+00	2026-04-28 22:38:57.338+00	\N
c98c30fc-751e-4422-aa57-e7556f6408df	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Zwdw1VVdOnfDdXbKp8AZsdnBn3V7k8tb8qwjw	bank	debit	posted	\N	\N	\N	\N	\N	161.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CC x8301	\N	f	2026-04-28 01:41:45.605+00	2026-04-28 01:41:45.605+00	2026-04-28 22:38:57.463+00	\N
06cfaf17-087b-45dd-bcd5-d72b628eaf0a	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	ek6kjee6OqinDmy89YvNH9mAm6kOaBcn4PO5Z	bank	credit	posted	\N	\N	\N	\N	\N	76.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:45.743+00	2026-04-28 01:41:45.743+00	2026-04-28 22:38:57.581+00	\N
d45967b1-7d49-4e63-b8fb-8675e2df080b	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	dKwK0eewOPfvab3JnNqZsqXEXxy1rYIKowOVz	bank	debit	posted	\N	\N	\N	\N	\N	34.97	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 00:00:00+00	\N	\N	\N	Costco	Costco	f	2026-04-28 01:41:45.869+00	2026-04-28 01:41:45.869+00	2026-04-28 22:38:57.716+00	\N
ef662c33-9514-4394-8c25-16eb447ec7a2	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	Ae7eAZZ7X1uonwr0NbK1sRV68xQNApfjOdMny	bank	credit	posted	\N	\N	\N	\N	\N	45.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-31 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:40.907+00	2026-04-28 01:41:40.907+00	2026-04-28 22:38:53.595+00	\N
57fa0cf8-e5bc-4fef-af47-e8ea447b0e92	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	k4B48eeBOAi5brn7LExwik1JoMKeDqiEKMov5	bank	credit	posted	\N	\N	\N	\N	\N	20.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-31 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:41.055+00	2026-04-28 01:41:41.055+00	2026-04-28 22:38:53.712+00	\N
52f7748d-aec1-4ba7-8ca0-3406a6dd0c95	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	v9Y9deeYb8cYBnA5vXbyipwNo8aBz9FgvoV04	bank	debit	posted	\N	\N	\N	\N	\N	34.82	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 00:00:00+00	\N	\N	\N	FREETAXUSACOM	Free Tax USA	f	2026-04-28 01:41:41.22+00	2026-04-28 01:41:41.22+00	2026-04-28 22:38:53.835+00	\N
36b1fa3f-42f0-423c-bd67-f10f2668ee6e	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	0JKJ9PPKX1cVz9dZJgQNH0XBa5Ye4ztJDgAvq	bank	debit	posted	\N	\N	\N	\N	\N	20.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 00:00:00+00	\N	\N	\N	OPENAI *CHATGPT SUBSCR OPENAI.COM	OpenAI	f	2026-04-28 01:41:41.391+00	2026-04-28 01:41:41.391+00	2026-04-28 22:38:53.983+00	\N
b0fdfd1a-1cab-4919-8351-4b001bfc7d51	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	0JKJ9PPKX1cVz9dZJgQNH0XBa5Ye4ztJDgA9q	bank	credit	posted	\N	\N	\N	\N	\N	300.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 00:00:00+00	\N	\N	\N	Online Xfer Transfer from CK x5430	\N	f	2026-04-28 01:41:41.584+00	2026-04-28 01:41:41.584+00	2026-04-28 22:38:54.111+00	\N
7a3dd6e8-4b35-4db1-8f80-1059d6fe5dbe	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	yYNYLeeNb8UOneYEr7bqhQ0YPrzLjKIaJ0pR4	bank	debit	posted	\N	\N	\N	\N	\N	70.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CK x0505	\N	f	2026-04-28 01:41:41.716+00	2026-04-28 01:41:41.716+00	2026-04-28 22:38:54.229+00	\N
29d0b5f0-761d-49e2-a431-b6bf37fd4e99	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	MeQemYYQpnum5ZPq3gdpiqknk7MwJZIX07rPL	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-27 00:00:00+00	\N	\N	\N	FMOFCU SV WEBXFR TRANSFER	\N	f	2026-04-28 01:41:42.041+00	2026-04-28 01:41:42.041+00	2026-04-28 22:38:54.474+00	\N
cb229455-28d5-4ec0-9787-86161a99754e	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	EeZerggZpmuPNjrpwy37tAPpPzK65QHQdeREe	bank	debit	posted	\N	\N	\N	\N	\N	7.50	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-26 00:00:00+00	\N	\N	\N	Dollar Tree	Dollar Tree	f	2026-04-28 01:41:42.212+00	2026-04-28 01:41:42.212+00	2026-04-28 22:38:54.603+00	\N
53589613-6235-4b01-8d1c-6509e461dc0f	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	MeQemYYQpnum5ZPq3gdpiqknk7MwJZIX07rq3	bank	debit	posted	\N	\N	\N	\N	\N	45.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-24 00:00:00+00	\N	\N	\N	BASE44 WWW.BASE44.CONY	\N	f	2026-04-28 01:41:42.316+00	2026-04-28 01:41:42.316+00	2026-04-28 22:38:54.701+00	\N
a22c9b14-5f39-4823-88e8-5e8f45c1fd6d	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	ReweVEEwXnuaMRKLvg1XsJQEQd46zMHe9p718	bank	debit	posted	\N	\N	\N	\N	\N	300.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-23 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 405523 APPLE CASH SENT MONEY *	\N	f	2026-04-28 01:41:42.476+00	2026-04-28 01:41:42.476+00	2026-04-28 22:38:54.846+00	\N
bdc28fba-9c7e-4e04-bd40-32e0cabe94bf	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	NY5YbVV5pnU0Qz1YymwpsakOkjLeQnToygD3L	bank	debit	posted	\N	\N	\N	\N	\N	16.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-20 00:00:00+00	\N	\N	\N	PAYPAL INST XFER	\N	f	2026-04-28 01:41:42.65+00	2026-04-28 01:41:42.65+00	2026-04-28 22:38:54.963+00	\N
2d645c52-c645-4c78-a7a0-df9532557e35	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	nJKJoeeKNjcab9AOPp71sKQVQD0J1ETBjYZ7A	bank	debit	posted	\N	\N	\N	\N	\N	100.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-20 00:00:00+00	\N	\N	\N	TD ZELLE SENT 607900L0681O Zelle SAYSAW DONALDSON	\N	f	2026-04-28 01:41:42.786+00	2026-04-28 01:41:42.786+00	2026-04-28 22:38:55.082+00	\N
5e0b03d4-c9ef-43cc-ab81-3ea6decbb951	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	YdBdDVVBenczvnMyV8kQUb787Pwo4mHJz4O9n	bank	debit	posted	\N	\N	\N	\N	\N	291.10	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-18 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CC x8301	\N	f	2026-04-28 01:41:42.912+00	2026-04-28 01:41:42.912+00	2026-04-28 22:38:55.207+00	\N
70ac0ddf-e2f1-45de-8746-75f198f4bbbb	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	zYNYDeeNbVUXBnYpgvQVheRZRVn45BsvM1rKB	bank	debit	posted	\N	\N	\N	\N	\N	48.60	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-18 00:00:00+00	\N	\N	\N	TRUSTAGE LIFE INSUR	TruStage Insurance	f	2026-04-28 01:41:43.043+00	2026-04-28 01:41:43.043+00	2026-04-28 22:38:55.326+00	\N
0dd94277-4366-4ca1-aaf1-2717f78366fc	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	dKwK0eewOPfvab3JnNqZsqXEXxy1rYIKowODL	bank	debit	posted	\N	\N	\N	\N	\N	337.16	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-17 00:00:00+00	\N	\N	\N	FARMERS INS EFT PYMT	Farmers Insurance	f	2026-04-28 01:41:43.199+00	2026-04-28 01:41:43.199+00	2026-04-28 22:38:55.464+00	\N
60af7966-d140-40b7-8e57-30b3e59c12fa	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	ReweVEEwXnuaMRKLvg1XsJQEQd46zMHe9p75N	bank	debit	posted	\N	\N	\N	\N	\N	291.10	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-17 00:00:00+00	\N	\N	\N	VENETIAN/PALAZZO RM	The Venetian Palazzo Congress Center	f	2026-04-28 01:41:43.398+00	2026-04-28 01:41:43.398+00	2026-04-28 22:38:55.595+00	\N
c61e9e50-2c46-4ed8-8796-3ccf88136159	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Leke5VVkNjuAnZxgBMyNh4xZxne6rbHZJvg8D	bank	debit	posted	\N	\N	\N	\N	\N	9.72	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 00:00:00+00	\N	\N	\N	DEPT EDUCATION STUDENT LN	Education Student Ln	f	2026-04-28 01:41:43.594+00	2026-04-28 01:41:43.594+00	2026-04-28 22:38:55.725+00	\N
688595f0-2260-4d4e-952d-f14aefdcb097	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	k4B48eeBOAi5brn7LExwik1N1M3ex5fobrO0z	bank	credit	posted	\N	\N	\N	\N	\N	70.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 00:00:00+00	\N	\N	\N	Online Xfer Transfer from SV x5019	\N	f	2026-04-28 01:41:43.752+00	2026-04-28 01:41:43.752+00	2026-04-28 22:38:55.861+00	\N
fd0f159c-3c97-496c-9f57-7008d72cb91e	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	1858Vqq5XPuVybpzr79AHMYzYLObJBUnYONA8	bank	debit	posted	\N	\N	\N	\N	\N	109.06	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 00:00:00+00	\N	\N	\N	Primerica	Primerica	f	2026-04-28 01:41:43.936+00	2026-04-28 01:41:43.936+00	2026-04-28 22:38:55.985+00	\N
df77eea9-4a39-40e9-ab16-4abb89c84565	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	KeEeZXXEY0ukAbOXnJmYcQoxo9MVdatEyewA0	bank	debit	posted	\N	\N	\N	\N	\N	20.05	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 405524 WAWA 848 DOVER * DE	Wawa	f	2026-04-28 01:41:44.074+00	2026-04-28 01:41:44.074+00	2026-04-28 22:38:56.14+00	\N
7c34acb8-8b43-4794-9778-7e25868be58d	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	BeZev55ZXPunvgr4db1jHynan8DjgXF3vzEQq	bank	debit	posted	\N	\N	\N	\N	\N	34.44	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 441606 STOLTZFUS MEATS INC NEW CASTLE * DE	Stoltzfus Meats	f	2026-04-28 01:41:44.213+00	2026-04-28 01:41:44.213+00	2026-04-28 22:38:56.265+00	\N
c6657293-75a5-4fcf-9d99-b7e97ded4f7a	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	yYNYLeeNb8UOneYEr7bqhQ0A0rgLxXtpRKZ9k	bank	debit	posted	\N	\N	\N	\N	\N	200.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 475542 HCM PHYSICIAN WEIGHT CON MEDIA *	Hcm Physician Weight Con	f	2026-04-28 01:41:44.366+00	2026-04-28 01:41:44.366+00	2026-04-28 22:38:56.386+00	\N
3c7f8c69-3f28-4aee-931f-0c34722533dd	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	ro0o9ee0b8cXVemxypb0hNpPpbrJe3HVr6Rey	bank	debit	posted	\N	\N	\N	\N	\N	64.47	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-13 00:00:00+00	\N	\N	\N	DEPT EDUCATION STUDENT LN	Education Student Ln	f	2026-04-28 01:41:44.546+00	2026-04-28 01:41:44.546+00	2026-04-28 22:38:56.551+00	\N
7015ffb4-e8ca-4eb1-b077-10bc9149e3a9	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	0JKJ9PPKX1cVz9dZJgQNH0XZX5keV1HA9kwoY	bank	debit	posted	\N	\N	\N	\N	\N	3567.61	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-13 00:00:00+00	\N	\N	\N	DEPT EDUCATION STUDENT LN	Education Student Ln	f	2026-04-28 01:41:44.708+00	2026-04-28 01:41:44.708+00	2026-04-28 22:38:56.663+00	\N
f0ddc45e-943e-43b1-8389-dd8b88e65280	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Ae7eAZZ7X1uonwr0NbK1sRV0Vx4NXOCMwvDQ3	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-13 00:00:00+00	\N	\N	\N	UMBNKC CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:44.845+00	2026-04-28 01:41:44.845+00	2026-04-28 22:38:56.784+00	\N
4403cdb6-53ae-467f-85cf-3c6fd9ed0c30	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	xYNY6eeNb7Uv5zYNpRewsPJwJeKLXoFOm5XyZ	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-12 00:00:00+00	\N	\N	\N	FMOFCU SV WEBXFR TRANSFER	\N	f	2026-04-28 01:41:44.987+00	2026-04-28 01:41:44.987+00	2026-04-28 22:38:56.894+00	\N
f86466d2-d03a-4440-809d-17246eb6db7f	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	aBqBkppqOLTKvEP4981puQvKvz9Robt7KvBb8	bank	debit	posted	\N	\N	\N	\N	\N	88.48	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-12 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CC x8301	\N	f	2026-04-28 01:41:45.122+00	2026-04-28 01:41:45.122+00	2026-04-28 22:38:57.015+00	\N
a9c24cd3-3974-48f0-ae80-2c1dcf3ea661	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Je5e8VV5pvu9reOdPM1nuK6X648ZzYTm0adqy	bank	credit	posted	\N	\N	\N	\N	\N	4533.81	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-11 00:00:00+00	\N	\N	\N	IQVIA INC PAYROLL	\N	f	2026-04-28 01:41:45.259+00	2026-04-28 01:41:45.259+00	2026-04-28 22:38:57.146+00	\N
d7b027e3-001e-44ad-8607-44e39b86b89c	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	NY5YbVV5pnU0Qz1YymwpsakOkjLeQnToygD06	bank	debit	posted	\N	\N	\N	\N	\N	49.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-11 00:00:00+00	\N	\N	\N	NAV TECH NAV.COM	Nav Tech	f	2026-04-28 01:41:45.39+00	2026-04-28 01:41:45.39+00	2026-04-28 22:38:57.279+00	\N
00927870-54f9-43d7-ae1d-63d5f374ab47	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	mxyx5eeyN0im0BwV1p49i5NqNw3QbvuB8AjJw	bank	debit	posted	\N	\N	\N	\N	\N	109.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 00:00:00+00	\N	\N	\N	OPUS VIRTUAL OFFICES LLC	Opus Virtual Offices LLC	f	2026-04-28 01:41:45.533+00	2026-04-28 01:41:45.533+00	2026-04-28 22:38:57.402+00	\N
4c27c5e8-bd3b-455a-a3c8-fccea85fcf00	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	YdBdDVVBenczvnMyV8kQUb787Pwo4mHJz4Og5	bank	credit	posted	\N	\N	\N	\N	\N	161.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:45.674+00	2026-04-28 01:41:45.674+00	2026-04-28 22:38:57.52+00	\N
492e672a-b8f3-489e-bffa-0e877288c17d	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	9VLV100LXviVRB58zwxLH5m8m9LX1Bug6LE4j	bank	debit	posted	\N	\N	\N	\N	\N	14.25	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 00:00:00+00	\N	\N	\N	Dollar Tree	Dollar Tree	f	2026-04-28 01:41:45.93+00	2026-04-28 01:41:45.93+00	2026-04-28 22:38:57.785+00	\N
09a590f7-c8f5-42dc-9668-45a42a1a1869	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	KeEeZXXEY0ukAbOXnJmYcQoLw9PVy5INz0Emr	bank	credit	posted	\N	\N	\N	\N	\N	35.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-31 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:40.983+00	2026-04-28 01:41:40.983+00	2026-04-28 22:38:53.652+00	\N
ce25b095-456b-4464-bac0-69a916a934cf	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	BeZev55ZXPunvgr4db1jHynoz89jpLINO63vo	bank	debit	posted	\N	\N	\N	\N	\N	128.38	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-31 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 444500 T MOBILE WEB PAYMENT *	T-Mobile	f	2026-04-28 01:41:41.123+00	2026-04-28 01:41:41.123+00	2026-04-28 22:38:53.777+00	\N
6aecc87f-cb40-4984-92c3-90720560e822	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	v9Y9deeYb8cYBnA5vXbyipwNo8aBz9FgvoVp4	bank	credit	posted	\N	\N	\N	\N	\N	2653.42	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 00:00:00+00	\N	\N	\N	IQVIA INC PAYROLL	\N	f	2026-04-28 01:41:41.294+00	2026-04-28 01:41:41.294+00	2026-04-28 22:38:53.901+00	\N
db942b1c-e9c2-4432-995b-d53a470dd53a	81555e75-82a5-45e7-9882-6d8996c9727d	73d65657-9e74-40e5-ad75-d96a2efa6502	plaid	xYNY6eeNb7Uv5zYNpRewsPJrqe6Ln5toVaOm0	bank	credit	posted	\N	\N	\N	\N	\N	70.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 00:00:00+00	\N	\N	\N	Online Xfer Transfer from CK x1409	\N	f	2026-04-28 01:41:41.485+00	2026-04-28 01:41:41.485+00	2026-04-28 22:38:54.051+00	\N
8c1cd398-2dd5-4e15-9e2e-a4ef63ad9065	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	35Z5M33ZXBIKn5pdgv1xu6K84NAzvkfLOboPp	bank	debit	posted	\N	\N	\N	\N	\N	45.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CC x8301	\N	f	2026-04-28 01:41:41.647+00	2026-04-28 01:41:41.647+00	2026-04-28 22:38:54.166+00	\N
07f8215d-9b3a-4ac1-b622-0e7cfcd73577	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	KeEeZXXEY0ukAbOXnJmYcQoLw9PVy5INz0Eyr	bank	debit	posted	\N	\N	\N	\N	\N	300.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CK x5430	\N	f	2026-04-28 01:41:41.823+00	2026-04-28 01:41:41.823+00	2026-04-28 22:38:54.287+00	\N
d688f4c4-4ecc-479d-ad41-105db04f011c	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Ae7eAZZ7X1uonwr0NbK1sRV68xQNApfjOdMwy	bank	debit	posted	\N	\N	\N	\N	\N	9.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 469216 APPLE COM BILL *	Apple	f	2026-04-28 01:41:41.955+00	2026-04-28 01:41:41.955+00	2026-04-28 22:38:54.418+00	\N
110590db-ae36-4d60-b6dd-0e211af6be59	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	OeaegVVapnuj5OLdRe6pumpZpXV7DMIxpzE4Q	bank	debit	posted	\N	\N	\N	\N	\N	121.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-27 00:00:00+00	\N	\N	\N	XI AN YI ZHU WAN IAT PAYPAL	\N	f	2026-04-28 01:41:42.124+00	2026-04-28 01:41:42.124+00	2026-04-28 22:38:54.536+00	\N
63bdf684-b81a-4bc7-a897-4c29ba804678	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	gvDv4eeDO3uYNz95ZODMiBjzjK3rbmH86vPab	bank	debit	posted	\N	\N	\N	\N	\N	75.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-02 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CC x8301	\N	f	2026-04-28 01:41:47.341+00	2026-04-28 01:41:47.341+00	2026-04-28 22:38:59.256+00	\N
d1674dab-3217-45ad-8acc-81072cf0099a	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	o8g8beegNOu1QnJamp8ocAkxk8aPDXH4rnqyo	bank	debit	posted	\N	\N	\N	\N	\N	134.30	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-02 00:00:00+00	\N	\N	\N	Primerica	Primerica	f	2026-04-28 01:41:47.473+00	2026-04-28 01:41:47.473+00	2026-04-28 22:38:59.38+00	\N
261f7666-9a70-44b3-acf3-d3ef60a9dcde	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Zwdw1VVdOnfDdXbKp8AZsdnBn3V7k8tb8qwj8	bank	debit	posted	\N	\N	\N	\N	\N	1241.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-02 00:00:00+00	\N	\N	\N	UMBNKC CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:47.615+00	2026-04-28 01:41:47.615+00	2026-04-28 22:38:59.545+00	\N
9b4d8de7-bdc9-4cf0-a5d2-0088fe70ae3f	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	9VLV100LXviVRB58zwxLH5m8m9LX1Bug6LE44	bank	debit	posted	\N	\N	\N	\N	\N	40.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-02 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 443565 BAYHEALTH MEDICAL CENTER DOVER * DE	Bayhealth Medical Center	f	2026-04-28 01:41:47.798+00	2026-04-28 01:41:47.798+00	2026-04-28 22:38:59.682+00	\N
4c095af4-a107-4cb4-b16b-035cf3bf35f0	81555e75-82a5-45e7-9882-6d8996c9727d	73d65657-9e74-40e5-ad75-d96a2efa6502	plaid	dKwK0eewOPfvab3JnNqZsqXEXxy1rYIKowO4Z	bank	debit	posted	\N	\N	\N	\N	\N	4.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-02 00:00:00+00	\N	\N	\N	WRIGHT EXPRESS FLEET DEBI	Wright Express Fleet Debi	f	2026-04-28 01:41:47.963+00	2026-04-28 01:41:47.963+00	2026-04-28 22:38:59.807+00	\N
8c989857-5c43-46a5-9909-07eac4d23a16	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	NY5YbVV5pnU0Qz1YymwpsakOkjLeQnToygDdv	bank	credit	posted	\N	\N	\N	\N	\N	31.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-27 00:00:00+00	\N	\N	\N	COMM OF PA PA REFUND	Comm	f	2026-04-28 01:41:48.125+00	2026-04-28 01:41:48.125+00	2026-04-28 22:38:59.929+00	\N
6621795a-e3c9-44d5-b829-ee4d0962f591	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Qede9VVdpXu4Bzd6Agn8uxXBXdzQZYFO951Mg	bank	debit	posted	\N	\N	\N	\N	\N	34.84	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-27 00:00:00+00	\N	\N	\N	DEPT EDUCATION STUDENT LN	Education Student Ln	f	2026-04-28 01:41:48.271+00	2026-04-28 01:41:48.271+00	2026-04-28 22:39:00.051+00	\N
dd9c89c9-54ab-4128-864f-3c069fc08b3e	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	OeaegVVapnuj5OLdRe6pumpZpXV7DMIxpzEe9	bank	debit	posted	\N	\N	\N	\N	\N	6201.19	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-27 00:00:00+00	\N	\N	\N	DEPT EDUCATION STUDENT LN	Education Student Ln	f	2026-04-28 01:41:48.404+00	2026-04-28 01:41:48.404+00	2026-04-28 22:39:00.187+00	\N
b6917680-da8b-4007-b91f-334ca6001473	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	nJKJoeeKNjcab9AOPp71sKQVQD0J1ETBjYZN3	bank	debit	posted	\N	\N	\N	\N	\N	52.92	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-27 00:00:00+00	\N	\N	\N	TIDEWATERUTILITY UTILITYPMT	Tidewater Utility Utilitypmt	f	2026-04-28 01:41:48.535+00	2026-04-28 01:41:48.535+00	2026-04-28 22:39:00.318+00	\N
015ce19b-eb62-4e75-869c-c9ddce32505a	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	pZNZgeeNb8S0EXDPBpbYs1y7yrKOZ8t3AXo61	bank	debit	posted	\N	\N	\N	\N	\N	128.38	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-27 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 444500 T MOBILE WEB PAYMENT *	T-Mobile	f	2026-04-28 01:41:48.659+00	2026-04-28 01:41:48.659+00	2026-04-28 22:39:00.468+00	\N
59aecede-c28c-4034-880f-3cdfbc31caa5	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	wVNVwYYNb8iEz1Km05bRsxj0j8LZe4FKRxN3E	bank	credit	posted	\N	\N	\N	\N	\N	255.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 00:00:00+00	\N	\N	\N	FID BKG SVC LLC MONEYLINE	Fidelity	f	2026-04-28 01:41:48.823+00	2026-04-28 01:41:48.823+00	2026-04-28 22:39:00.595+00	\N
12f53031-5aa1-4e66-85dc-47afc4dec168	81555e75-82a5-45e7-9882-6d8996c9727d	415b3fa0-b187-4726-8d2c-8def88b4c586	plaid	yYNYLeeNb8UOneYEr7bqhQ0A0rgLxXtpRKZJy	bank	credit	posted	\N	\N	\N	\N	\N	25.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 00:00:00+00	\N	\N	\N	Online Xfer Transfer from CK x1409	\N	f	2026-04-28 01:41:48.951+00	2026-04-28 01:41:48.951+00	2026-04-28 22:39:00.715+00	\N
933c6c6b-ad91-4f50-8442-53b5cc0f4afb	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	mxyx5eeyN0im0BwV1p49i5NqNw3QbvuB8Aje5	bank	credit	posted	\N	\N	\N	\N	\N	350.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 00:00:00+00	\N	\N	\N	Online Xfer Transfer from SV x5019	\N	f	2026-04-28 01:41:49.106+00	2026-04-28 01:41:49.106+00	2026-04-28 22:39:00.864+00	\N
faa5aca8-0776-4f14-bf79-eb1953fbdd2f	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	zYNYDeeNbVUXBnYpgvQVheRZRVn45BsvM1rJj	bank	debit	posted	\N	\N	\N	\N	\N	70.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CK x0505	\N	f	2026-04-28 01:41:49.251+00	2026-04-28 01:41:49.251+00	2026-04-28 22:39:00.993+00	\N
f95f9a0f-ef6e-4364-8d84-01e9b8d99963	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	6gdg6kkdXKSv0ZxNL7m9sQpNpAD0B9twADRj5	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 00:00:00+00	\N	\N	\N	FMOFCU SV WEBXFR TRANSFER	\N	f	2026-04-28 01:41:49.389+00	2026-04-28 01:41:49.389+00	2026-04-28 22:39:01.139+00	\N
0314e6a5-aa35-4118-a035-31f52911bb71	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Leke5VVkNjuAnZxgBMyNh4xZxne6rbHZJvgxe	bank	credit	posted	\N	\N	\N	\N	\N	6791.75	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 00:00:00+00	\N	\N	\N	SBTPG PRODUCTS SBTPG LLC	\N	f	2026-04-28 01:41:49.515+00	2026-04-28 01:41:49.515+00	2026-04-28 22:39:01.267+00	\N
9e3fb386-c081-4412-af1b-8aee47f95d01	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	q5y57eeyb8IqRaVw3JbOiQkVkbKaOptD1zpoD	bank	credit	posted	\N	\N	\N	\N	\N	40.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:49.662+00	2026-04-28 01:41:49.662+00	2026-04-28 22:39:01.391+00	\N
b282aff9-f968-447b-bca5-2a9c31a049f7	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	35Z5M33ZXBIKn5pdgv1xu6KMKNrzEbCoPryJA	bank	debit	posted	\N	\N	\N	\N	\N	39.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 00:00:00+00	\N	\N	\N	AMAZON MKTPL*PG4JX2Q83 Amzn.com/billWA	Amazon	f	2026-04-28 01:41:49.789+00	2026-04-28 01:41:49.789+00	2026-04-28 22:39:01.536+00	\N
cf3e2467-4c6e-46c3-acc1-b87d12e5b726	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	BeZev55ZXPunvgr4db1jHynan8DjgXF3vzELE	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 00:00:00+00	\N	\N	\N	TD ZELLE SENT 605200F06K29 Zelle Maisha Moore	\N	f	2026-04-28 01:41:49.924+00	2026-04-28 01:41:49.924+00	2026-04-28 22:39:01.695+00	\N
18acc6e7-3f9d-433b-98a0-cac062979cf7	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	35Z5M33ZXBIKn5pdgv1xu6KMKNrzEbCoPryxg	bank	debit	posted	\N	\N	\N	\N	\N	16.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-20 00:00:00+00	\N	\N	\N	PAYPAL INST XFER	\N	f	2026-04-28 01:41:50.086+00	2026-04-28 01:41:50.086+00	2026-04-28 22:39:01.852+00	\N
af7727ea-d7bc-40d3-89c3-3b16c4b43770	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	yYNYLeeNb8UOneYEr7bqhQ0A0rgLxXtpRKZMy	bank	debit	posted	\N	\N	\N	\N	\N	1347.16	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-18 00:00:00+00	\N	\N	\N	BEST EGG PAYMENT	Best Egg	f	2026-04-28 01:41:50.238+00	2026-04-28 01:41:50.238+00	2026-04-28 22:39:02.342+00	\N
2d4ccb5a-dcae-4ebd-95e6-f4bc1a1f2381	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	ro0o9ee0b8cXVemxypb0hNpPpbrJe3HVr6Rgz	bank	credit	posted	\N	\N	\N	\N	\N	1319.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-17 00:00:00+00	\N	\N	\N	DIVISION OF REVE DE DOR	\N	f	2026-04-28 01:41:50.373+00	2026-04-28 01:41:50.373+00	2026-04-28 22:39:02.476+00	\N
fa96486e-a305-4adb-8f00-10e697625f03	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Ae7eAZZ7X1uonwr0NbK1sRV0Vx4NXOCMwvD9e	bank	debit	posted	\N	\N	\N	\N	\N	25.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-17 00:00:00+00	\N	\N	\N	NAFECU SV WEBXFR TRANSFER	\N	f	2026-04-28 01:41:50.522+00	2026-04-28 01:41:50.522+00	2026-04-28 22:39:02.607+00	\N
1c5f17c3-bbdb-4f52-974e-a95f17df00ee	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	v9Y9deeYb8cYBnA5vXbyipwbw8RBDJHVp9481	bank	debit	posted	\N	\N	\N	\N	\N	24.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-17 00:00:00+00	\N	\N	\N	Planet Fitness	Planet Fitness	f	2026-04-28 01:41:50.675+00	2026-04-28 01:41:50.675+00	2026-04-28 22:39:02.753+00	\N
b8ff6c47-d21c-4da9-84e7-b07450538948	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	k4B48eeBOAi5brn7LExwik1N1M3ex5fobrOdD	bank	debit	posted	\N	\N	\N	\N	\N	44.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-16 00:00:00+00	\N	\N	\N	AMAZON MKTPL*GU02U5B03 Amzn.com/billWA	Amazon	f	2026-04-28 01:41:50.813+00	2026-04-28 01:41:50.813+00	2026-04-28 22:39:02.909+00	\N
385a01de-b9fa-40c8-b241-656d44c48a77	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	gvDv4eeDO3uYNz95ZODMiBjzjK3rbmH86vPa5	bank	debit	posted	\N	\N	\N	\N	\N	20.02	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 405524 WAWA 876 * DE	Wawa	f	2026-04-28 01:41:46.119+00	2026-04-28 01:41:46.119+00	2026-04-28 22:38:58.029+00	\N
eff81f1e-32ab-44c8-b78c-b038055eda43	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	o8g8beegNOu1QnJamp8ocAkxk8aPDXH4rnqyE	bank	debit	posted	\N	\N	\N	\N	\N	7.79	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 405524 WAWA 876 CAMDEN * DE	Wawa	f	2026-04-28 01:41:46.25+00	2026-04-28 01:41:46.25+00	2026-04-28 22:38:58.2+00	\N
b2f8b170-d4d1-4afb-a748-82f648f96bd4	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	OeaegVVapnuj5OLdRe6pumpZpXV7DMIxpzEeQ	bank	debit	posted	\N	\N	\N	\N	\N	7.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-06 00:00:00+00	\N	\N	\N	PAYPAL INST XFER	\N	f	2026-04-28 01:41:46.37+00	2026-04-28 01:41:46.37+00	2026-04-28 22:38:58.329+00	\N
9856f1bb-f8d0-4995-ad8b-48c6f52afcea	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	4o5odyy5X3ckydaNEP5wcyoNoQKAP5FRDK98K	bank	debit	posted	\N	\N	\N	\N	\N	9.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-03 00:00:00+00	\N	\N	\N	MAINTENANCE FEE	\N	f	2026-04-28 01:41:46.661+00	2026-04-28 01:41:46.661+00	2026-04-28 22:38:58.598+00	\N
cc96883e-7261-4cdb-8ce4-c4d492b37bcd	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	xYNY6eeNb7Uv5zYNpRewsPJwJeKLXoFOm5XyR	bank	debit	posted	\N	\N	\N	\N	\N	25.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-03 00:00:00+00	\N	\N	\N	NAFECU CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:46.81+00	2026-04-28 01:41:46.81+00	2026-04-28 22:38:58.75+00	\N
0ef16d17-9bb8-4fde-924c-6633134dec29	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	Leke5VVkNjuAnZxgBMyNh4xZxne6rbHZJvgDv	bank	credit	posted	\N	\N	\N	\N	\N	20.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-03 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:46.935+00	2026-04-28 01:41:46.935+00	2026-04-28 22:38:58.872+00	\N
9cef21be-d313-4dee-9c15-bca3f41c81ee	81555e75-82a5-45e7-9882-6d8996c9727d	73d65657-9e74-40e5-ad75-d96a2efa6502	plaid	mxyx5eeyN0im0BwV1p49i5NqNw3QbvuB8AjZ5	bank	debit	posted	\N	\N	\N	\N	\N	40.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-03 00:00:00+00	\N	\N	\N	TD MERCHANT SVS FEE	\N	f	2026-04-28 01:41:47.079+00	2026-04-28 01:41:47.079+00	2026-04-28 22:38:58.999+00	\N
cc76dde0-2d67-404d-b2ae-9f5c25c6c09d	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	77w7LAAwXkT0vzq3Rbans79B9EawPLH08aXEY	bank	debit	posted	\N	\N	\N	\N	\N	5.25	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-02 00:00:00+00	\N	\N	\N	Dollar Tree	Dollar Tree	f	2026-04-28 01:41:47.213+00	2026-04-28 01:41:47.213+00	2026-04-28 22:38:59.129+00	\N
4bce169b-ad77-4762-8174-f741ea7e0a5e	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	1858Vqq5XPuVybpzr79AHMYzYLObJBUnYONQb	bank	debit	posted	\N	\N	\N	\N	\N	20.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-02 00:00:00+00	\N	\N	\N	OPENAI *CHATGPT SUBSCR OPENAI.COM	OpenAI	f	2026-04-28 01:41:47.275+00	2026-04-28 01:41:47.275+00	2026-04-28 22:38:59.192+00	\N
43e13f50-1df6-4765-8403-2388b4332779	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	DeXejbbXpBu1xzB0dV5pc1o0okbY6rtwXybpo	bank	credit	posted	\N	\N	\N	\N	\N	75.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-02 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:47.405+00	2026-04-28 01:41:47.405+00	2026-04-28 22:38:59.32+00	\N
5104fe51-6a49-4653-a6e4-bff402a5b5d8	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	5b7bwKK7XyuVQwa957NJHe898R7Db5swN7814	bank	debit	posted	\N	\N	\N	\N	\N	255.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-02 00:00:00+00	\N	\N	\N	UMBNKC CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:47.539+00	2026-04-28 01:41:47.539+00	2026-04-28 22:38:59.441+00	\N
500b09e4-2efc-4f27-ae4a-6c5fd7b6a408	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	b3B3AeeBpDfmwXKaYpbgipDkDMgZYLHJPV3ox	bank	debit	posted	\N	\N	\N	\N	\N	77.62	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-02 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 401134 THESBC ORG WWW THESBC OR *	Thesbc Org	f	2026-04-28 01:41:47.689+00	2026-04-28 01:41:47.689+00	2026-04-28 22:38:59.622+00	\N
edc0596c-fb1b-403a-9eb3-bf03912279a1	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Ve1ewVV1pnumXOAqpz3ZixYAYyXvzNF4ndgY5	bank	debit	posted	\N	\N	\N	\N	\N	9.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-02 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 469216 APPLE COM BILL *	Apple	f	2026-04-28 01:41:47.891+00	2026-04-28 01:41:47.891+00	2026-04-28 22:38:59.743+00	\N
8e799d7d-9753-44ab-b449-daa73ad6c8de	81555e75-82a5-45e7-9882-6d8996c9727d	415b3fa0-b187-4726-8d2c-8def88b4c586	plaid	35Z5M33ZXBIKn5pdgv1xu6KMKNrzEbCoPryOg	bank	debit	posted	\N	\N	\N	\N	\N	5.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-28 00:00:00+00	\N	\N	\N	MAINTENANCE FEE	\N	f	2026-04-28 01:41:48.04+00	2026-04-28 01:41:48.04+00	2026-04-28 22:38:59.87+00	\N
c7e7e342-7ee2-4768-a37d-4ade34571294	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	EeZerggZpmuPNjrpwy37tAPpPzK65QHQdeR87	bank	debit	posted	\N	\N	\N	\N	\N	499.28	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-27 00:00:00+00	\N	\N	\N	DELMARVA UTILITY BILLPAY	Delmarva Utility	f	2026-04-28 01:41:48.204+00	2026-04-28 01:41:48.204+00	2026-04-28 22:38:59.993+00	\N
d14d0bfa-9394-482a-aa19-99455d26be87	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	ReweVEEwXnuaMRKLvg1XsJQEQd46zMHe9p7oR	bank	debit	posted	\N	\N	\N	\N	\N	63.56	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-27 00:00:00+00	\N	\N	\N	DEPT EDUCATION STUDENT LN	Education Student Ln	f	2026-04-28 01:41:48.335+00	2026-04-28 01:41:48.335+00	2026-04-28 22:39:00.113+00	\N
019c40b2-9d86-4993-af57-4794b5cab12f	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	MeQemYYQpnum5ZPq3gdpiqknk7MwJZIX07rOq	bank	debit	posted	\N	\N	\N	\N	\N	1672.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-27 00:00:00+00	\N	\N	\N	UMBNKC CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:48.599+00	2026-04-28 01:41:48.599+00	2026-04-28 22:39:00.39+00	\N
df27c0c4-c02d-44f5-8f77-19d94b6faa22	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	dKwK0eewOPfvab3JnNqZsqXEXxy1rYIKowONZ	bank	credit	posted	\N	\N	\N	\N	\N	264.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 00:00:00+00	\N	\N	\N	FID BKG SVC LLC MONEYLINE	Fidelity	f	2026-04-28 01:41:48.724+00	2026-04-28 01:41:48.724+00	2026-04-28 22:39:00.529+00	\N
25e6ca60-72ca-4798-9b7e-a802060cc602	81555e75-82a5-45e7-9882-6d8996c9727d	73d65657-9e74-40e5-ad75-d96a2efa6502	plaid	6gdg6kkdXKSv0ZxNL7m9sQpNpAD0B9twADRp5	bank	credit	posted	\N	\N	\N	\N	\N	70.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 00:00:00+00	\N	\N	\N	Online Xfer Transfer from CK x1409	\N	f	2026-04-28 01:41:48.888+00	2026-04-28 01:41:48.888+00	2026-04-28 22:39:00.653+00	\N
58535d95-4616-4853-9e5b-199c68a0e06d	81555e75-82a5-45e7-9882-6d8996c9727d	73d65657-9e74-40e5-ad75-d96a2efa6502	plaid	wVNVwYYNb8iEz1Km05bRsxj0j8LZe4FKRxNDE	bank	credit	posted	\N	\N	\N	\N	\N	4.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 00:00:00+00	\N	\N	\N	Online Xfer Transfer from CK x1409	\N	f	2026-04-28 01:41:49.031+00	2026-04-28 01:41:49.031+00	2026-04-28 22:39:00.769+00	\N
04229dc8-e586-4444-96c9-488b60736e12	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	ek6kjee6OqinDmy89YvNH9mAm6kOaBcn4PO7A	bank	debit	posted	\N	\N	\N	\N	\N	4.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CK x0505	\N	f	2026-04-28 01:41:49.176+00	2026-04-28 01:41:49.176+00	2026-04-28 22:39:00.93+00	\N
5baad304-daf5-42a4-8819-aba833d7cfe3	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	YdBdDVVBenczvnMyV8kQUb787Pwo4mHJz4Odk	bank	debit	posted	\N	\N	\N	\N	\N	25.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 00:00:00+00	\N	\N	\N	Online Xfer Transfer to SV x4403	\N	f	2026-04-28 01:41:49.323+00	2026-04-28 01:41:49.323+00	2026-04-28 22:39:01.062+00	\N
82b64a4c-49c7-4378-b946-45081087da13	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	DeXejbbXpBu1xzB0dV5pc1o0okbY6rtwXyb68	bank	credit	posted	\N	\N	\N	\N	\N	2653.41	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 00:00:00+00	\N	\N	\N	IQVIA INC PAYROLL	\N	f	2026-04-28 01:41:49.453+00	2026-04-28 01:41:49.453+00	2026-04-28 22:39:01.198+00	\N
34e45ec2-59fe-4ede-97a0-7a3bad6b189b	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Pe5e7VV5pnurXoEwkJLOU0RYRN1x35HoOdPK9	bank	credit	posted	\N	\N	\N	\N	\N	20.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 00:00:00+00	\N	\N	\N	BURE LLC CLOSED	\N	f	2026-04-28 01:41:49.597+00	2026-04-28 01:41:49.597+00	2026-04-28 22:39:01.338+00	\N
b6747db4-c69f-4b64-9db4-f7db4fafdb28	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	1858Vqq5XPuVybpzr79AHMYzYLObJBUnYON4w	bank	debit	posted	\N	\N	\N	\N	\N	264.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 00:00:00+00	\N	\N	\N	UMBNKC CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:49.726+00	2026-04-28 01:41:49.726+00	2026-04-28 22:39:01.476+00	\N
721f4d6d-524a-4b43-9deb-540173d9e283	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	BeZev55ZXPunvgr4db1jHynan8DjgXF3vzEav	bank	debit	posted	\N	\N	\N	\N	\N	75.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 00:00:00+00	\N	\N	\N	DE BUSINESS TAX & LIC DE	De Business Tax & Lic	f	2026-04-28 01:41:49.854+00	2026-04-28 01:41:49.854+00	2026-04-28 22:39:01.61+00	\N
5910643f-ad69-401d-aa9f-37c9e5763032	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	q5y57eeyb8IqRaVw3JbOiQkVkbKaOptD1zpkM	bank	debit	posted	\N	\N	\N	\N	\N	254.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 00:00:00+00	\N	\N	\N	UMBNKC CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:50+00	2026-04-28 01:41:50+00	2026-04-28 22:39:01.769+00	\N
b778966c-f170-4ba2-b5f2-2c81006f7d2a	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	yYNYLeeNb8UOneYEr7bqhQ0A0rgLxXtpRKZ73	bank	credit	posted	\N	\N	\N	\N	\N	61.98	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-19 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:50.171+00	2026-04-28 01:41:50.171+00	2026-04-28 22:39:02.28+00	\N
02c9bf9d-7ae0-4e9f-9380-9e40df0bab7d	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	KeEeZXXEY0ukAbOXnJmYcQoxo9MVdatEyewXq	bank	debit	posted	\N	\N	\N	\N	\N	48.60	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-18 00:00:00+00	\N	\N	\N	TRUSTAGE LIFE INSUR	TruStage Insurance	f	2026-04-28 01:41:50.306+00	2026-04-28 01:41:50.306+00	2026-04-28 22:39:02.408+00	\N
33af4020-9a3f-45fb-9a11-475585747c4f	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	k4B48eeBOAi5brn7LExwik1N1M3ex5fobrOjA	bank	debit	posted	\N	\N	\N	\N	\N	337.20	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-17 00:00:00+00	\N	\N	\N	FARMERS INS EFT PYMT	Farmers Insurance	f	2026-04-28 01:41:50.449+00	2026-04-28 01:41:50.449+00	2026-04-28 22:39:02.541+00	\N
0db91f89-6564-4916-b90b-3d9a312b778c	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	0JKJ9PPKX1cVz9dZJgQNH0XZX5keV1HA9kwj0	bank	debit	posted	\N	\N	\N	\N	\N	820.63	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-17 00:00:00+00	\N	\N	\N	NSM DBAMR.COOPER NSM DBAMR	Mr. Cooper	f	2026-04-28 01:41:50.601+00	2026-04-28 01:41:50.601+00	2026-04-28 22:39:02.676+00	\N
06cf109f-2b34-4c12-bbef-c32f0e631fa6	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	jrqrJmmqOkcxoajY64y8SxoXo0AgrJFevd6wE	bank	debit	posted	\N	\N	\N	\N	\N	109.06	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-17 00:00:00+00	\N	\N	\N	Primerica	Primerica	f	2026-04-28 01:41:50.742+00	2026-04-28 01:41:50.742+00	2026-04-28 22:39:02.839+00	\N
c492fb4a-a106-40fc-a588-097327b22600	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	KeEeZXXEY0ukAbOXnJmYcQoxo9MVdatEyew5L	bank	debit	posted	\N	\N	\N	\N	\N	16.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-16 00:00:00+00	\N	\N	\N	AMAZON MKTPL*WS74S7QO3 Amzn.com/billWA	Amazon	f	2026-04-28 01:41:50.895+00	2026-04-28 01:41:50.895+00	2026-04-28 22:39:02.974+00	\N
8588ac52-3aba-4c67-9d64-24f5b7cca380	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	b3B3AeeBpDfmwXKaYpbgipDkDMgZYLHJPV3oZ	bank	debit	posted	\N	\N	\N	\N	\N	3.38	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 405524 WAWA 876 CAMDEN * DE	Wawa	f	2026-04-28 01:41:46.187+00	2026-04-28 01:41:46.187+00	2026-04-28 22:38:58.121+00	\N
7b092034-5370-4ce5-8d32-5687e5c7de9b	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	77w7LAAwXkT0vzq3Rbans79B9EawPLH08aXEN	bank	debit	posted	\N	\N	\N	\N	\N	16.95	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 438886 TRADINGVIEWV PRODUCT NEW YORK *	Tradingviewv Product	f	2026-04-28 01:41:46.305+00	2026-04-28 01:41:46.305+00	2026-04-28 22:38:58.265+00	\N
9c631852-8a64-4ac7-9c16-35dddab1500a	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Ve1ewVV1pnumXOAqpz3ZixYAYyXvzNF4ndgYZ	bank	debit	posted	\N	\N	\N	\N	\N	0.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-06 00:00:00+00	\N	\N	\N	Primerica	Primerica	f	2026-04-28 01:41:46.435+00	2026-04-28 01:41:46.435+00	2026-04-28 22:38:58.393+00	\N
a175d84b-8158-4346-bda1-e5b2964eed87	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Je5e8VV5pvu9reOdPM1nuK6X648ZzYTm0adqb	bank	debit	posted	\N	\N	\N	\N	\N	100.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-03 00:00:00+00	\N	\N	\N	Comcast	Comcast	f	2026-04-28 01:41:46.589+00	2026-04-28 01:41:46.589+00	2026-04-28 22:38:58.542+00	\N
8805d5b1-eaca-4ea6-929f-1c8bd0e5e0ff	81555e75-82a5-45e7-9882-6d8996c9727d	73d65657-9e74-40e5-ad75-d96a2efa6502	plaid	zYNYDeeNbVUXBnYpgvQVheRZRVn45BsvM1r5j	bank	debit	posted	\N	\N	\N	\N	\N	30.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-03 00:00:00+00	\N	\N	\N	MAINTENANCE FEE	\N	f	2026-04-28 01:41:46.726+00	2026-04-28 01:41:46.726+00	2026-04-28 22:38:58.693+00	\N
e71b32de-a5b6-42d6-9772-4fcb42fa5fb9	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	aBqBkppqOLTKvEP4981puQvKvz9Robt7KvBbP	bank	debit	posted	\N	\N	\N	\N	\N	20.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-03 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CC x8301	\N	f	2026-04-28 01:41:46.869+00	2026-04-28 01:41:46.869+00	2026-04-28 22:38:58.809+00	\N
655899b1-0538-4ad7-ad12-4a1223dff426	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	8969Dvv6eAcjvJB6OadgurJ6JyO10nUxYOgBx	bank	debit	posted	\N	\N	\N	\N	\N	20.63	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-03 00:00:00+00	\N	\N	\N	Primerica	Primerica	f	2026-04-28 01:41:46.998+00	2026-04-28 01:41:46.998+00	2026-04-28 22:38:58.94+00	\N
3bf3f7c9-0080-41e6-989c-3652b14b46ee	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	Pe5e7VV5pnurXoEwkJLOU0RYRN1x35HoOdPrm	bank	debit	posted	\N	\N	\N	\N	\N	38.68	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-02 00:00:00+00	\N	\N	\N	AMAZON MARK* B98H42L60 AMAZON.COM/MAWA	Amazon	f	2026-04-28 01:41:47.144+00	2026-04-28 01:41:47.144+00	2026-04-28 22:38:59.069+00	\N
7c716708-ad91-476a-aef1-195812b2fa29	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	EeZerggZpmuPNjrpwy37tAPpPzK65QHQdeRL7	bank	debit	posted	\N	\N	\N	\N	\N	4.05	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-09 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 407105 PMUSA 758054 ARLINGTON 770 8189036 *	\N	f	2026-04-28 01:41:52.719+00	2026-04-28 01:41:52.719+00	2026-04-28 22:39:04.468+00	\N
b04bc4bd-4d57-48f9-9eca-f52ba31ed744	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Zwdw1VVdOnfDdXbKp8AZsdnBn3V7k8tb8qwL8	bank	debit	posted	\N	\N	\N	\N	\N	14.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-13 00:00:00+00	\N	\N	\N	CHASE CREDIT CRD EPAY	\N	f	2026-04-28 01:41:50.963+00	2026-04-28 01:41:50.963+00	2026-04-28 22:39:03.033+00	\N
1af15c79-ff6e-4864-9414-c533183a803d	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Je5e8VV5pvu9reOdPM1nuK6X648ZzYTm0advb	bank	debit	posted	\N	\N	\N	\N	\N	98.42	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-13 00:00:00+00	\N	\N	\N	DEPT EDUCATION STUDENT LN	Education Student Ln	f	2026-04-28 01:41:51.172+00	2026-04-28 01:41:51.172+00	2026-04-28 22:39:03.166+00	\N
22dab575-9f90-4de1-9978-bee3cb770c1a	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	4o5odyy5X3ckydaNEP5wcyoNoQKAP5FRDK97K	bank	debit	posted	\N	\N	\N	\N	\N	34.17	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-13 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CC x8301	\N	f	2026-04-28 01:41:51.357+00	2026-04-28 01:41:51.357+00	2026-04-28 22:39:03.287+00	\N
bd2c7fe9-d455-4b1d-bb55-35cfacacaf8e	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	aBqBkppqOLTKvEP4981puQvKvz9Robt7KvB5P	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-13 00:00:00+00	\N	\N	\N	UMBNKC CK WEBXFR TRANSFER	\N	f	2026-04-28 01:41:51.519+00	2026-04-28 01:41:51.519+00	2026-04-28 22:39:03.412+00	\N
9b6a0c37-455c-4118-a1ed-9476ca040e4a	81555e75-82a5-45e7-9882-6d8996c9727d	415b3fa0-b187-4726-8d2c-8def88b4c586	plaid	KeEeZXXEY0ukAbOXnJmYcQoxo9MVdatEyewzq	bank	credit	posted	\N	\N	\N	\N	\N	25.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-12 00:00:00+00	\N	\N	\N	Online Xfer Transfer from CK x1409	\N	f	2026-04-28 01:41:51.677+00	2026-04-28 01:41:51.677+00	2026-04-28 22:39:03.53+00	\N
8331e3e8-8b54-491b-900f-b75a3c329c81	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	5b7bwKK7XyuVQwa957NJHe898R7Db5swN78A4	bank	debit	posted	\N	\N	\N	\N	\N	25.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-12 00:00:00+00	\N	\N	\N	Online Xfer Transfer to SV x4403	\N	f	2026-04-28 01:41:51.849+00	2026-04-28 01:41:51.849+00	2026-04-28 22:39:03.698+00	\N
4d6b6652-ea22-408a-9f8b-f1b4d83bd2d5	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	jrqrJmmqOkcxoajY64y8SxoXo0AgrJFevd6Bb	bank	debit	posted	\N	\N	\N	\N	\N	42.85	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-11 00:00:00+00	\N	\N	\N	AMAZON MKTPL*6M48S0U23 Amzn.com/billWA	Amazon	f	2026-04-28 01:41:52.022+00	2026-04-28 01:41:52.022+00	2026-04-28 22:39:03.825+00	\N
cbca918f-5d23-4024-a543-2618f1dec13c	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	gvDv4eeDO3uYNz95ZODMiBjzjK3rbmH86vP4b	bank	credit	posted	\N	\N	\N	\N	\N	2653.43	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-11 00:00:00+00	\N	\N	\N	IQVIA INC PAYROLL	\N	f	2026-04-28 01:41:52.155+00	2026-04-28 01:41:52.155+00	2026-04-28 22:39:03.96+00	\N
47b34837-2ea6-47a4-afa7-4365fada7702	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	4o5odyy5X3ckydaNEP5wcyoNoQKAP5FRDK9r6	bank	debit	posted	\N	\N	\N	\N	\N	4.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-10 00:00:00+00	\N	\N	\N	DRIVEEZMD MPC	Driveezmd Mpc	f	2026-04-28 01:41:52.302+00	2026-04-28 01:41:52.302+00	2026-04-28 22:39:04.09+00	\N
2a04fc0b-7279-484d-84b5-6f10bc9f2c5d	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	aBqBkppqOLTKvEP4981puQvKvz9Robt7KvBVe	bank	debit	posted	\N	\N	\N	\N	\N	109.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-10 00:00:00+00	\N	\N	\N	OPUS VIRTUAL OFFICES LLC	Opus Virtual Offices LLC	f	2026-04-28 01:41:52.437+00	2026-04-28 01:41:52.437+00	2026-04-28 22:39:04.214+00	\N
89f01c00-de41-425e-b36a-b59dc95d1bc0	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	ReweVEEwXnuaMRKLvg1XsJQEQd46zMHe9p7BR	bank	debit	posted	\N	\N	\N	\N	\N	16.95	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-09 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 438886 TRADINGVIEWV PRODUCT NEW YORK *	Tradingviewv Product	f	2026-04-28 01:41:52.86+00	2026-04-28 01:41:52.86+00	2026-04-28 22:39:04.595+00	\N
42aba2b9-fc50-45dc-8c1e-ba69de058074	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	nJKJoeeKNjcab9AOPp71sKQVQD0J1ETBjYZa3	bank	debit	posted	\N	\N	\N	\N	\N	8.40	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-05 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 401134 SQSP WORKSP 220845847 SQUARESPACE C *	Worksp	f	2026-04-28 01:41:53.015+00	2026-04-28 01:41:53.015+00	2026-04-28 22:39:04.735+00	\N
91b286f3-bf47-4786-b4bc-3e2fc2c07193	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	Zwdw1VVdOnfDdXbKp8AZsdnBn3V7k8tb8qw7P	bank	debit	posted	\N	\N	\N	\N	\N	8.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 00:00:00+00	\N	\N	\N	AMAZON MKTPL*U35I19GH3 Amzn.com/billWA	Amazon	f	2026-04-28 01:41:53.195+00	2026-04-28 01:41:53.195+00	2026-04-28 22:39:04.896+00	\N
9ee5a96e-7914-4655-a47b-1cf1f42a1937	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	8969Dvv6eAcjvJB6OadgurJ6JyO10nUxYOgrQ	bank	credit	posted	\N	\N	\N	\N	\N	178.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:53.349+00	2026-04-28 01:41:53.349+00	2026-04-28 22:39:05.151+00	\N
dc6fd851-4ed9-44ae-b3bb-dbeab1d98355	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	o8g8beegNOu1QnJamp8ocAkxk8aPDXH4rnq59	bank	debit	posted	\N	\N	\N	\N	\N	64.84	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 00:00:00+00	\N	\N	\N	Trader Joe's	Trader Joe's	f	2026-04-28 01:41:53.549+00	2026-04-28 01:41:53.549+00	2026-04-28 22:39:05.278+00	\N
ba95c415-2640-4817-ae30-a6ae6735ffd2	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	gvDv4eeDO3uYNz95ZODMiBjzjK3rbmH86vP9N	bank	debit	posted	\N	\N	\N	\N	\N	130.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 00:00:00+00	\N	\N	\N	Costco	Costco	f	2026-04-28 01:41:53.681+00	2026-04-28 01:41:53.681+00	2026-04-28 22:39:05.4+00	\N
1ed54938-b4c3-4ccc-a851-bc51ada5e63c	81555e75-82a5-45e7-9882-6d8996c9727d	415b3fa0-b187-4726-8d2c-8def88b4c586	plaid	k4B48eeBOAi5brn7LExwik1N1M3ex5fobrOKA	bank	debit	posted	\N	\N	\N	\N	\N	5.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-31 00:00:00+00	\N	\N	\N	MAINTENANCE FEE	\N	f	2026-04-28 01:41:53.86+00	2026-04-28 01:41:53.86+00	2026-04-28 22:39:05.508+00	\N
f07ca0d3-afb2-4674-b067-c74d10733a42	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	9VLV100LXviVRB58zwxLH5m8m9LX1Bug6LEzO	bank	credit	posted	\N	\N	\N	\N	\N	20.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-30 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:54.005+00	2026-04-28 01:41:54.005+00	2026-04-28 22:39:05.641+00	\N
72d4dd2e-445a-4605-a817-e1ccdc3de647	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	MeQemYYQpnum5ZPq3gdpiqknk7MwJZIX07ry3	bank	debit	posted	\N	\N	\N	\N	\N	20.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 00:00:00+00	\N	\N	\N	OPENAI *CHATGPT SUBSCR OPENAI.COM	OpenAI	f	2026-04-28 01:41:54.154+00	2026-04-28 01:41:54.154+00	2026-04-28 22:39:05.765+00	\N
e4eed347-b2ad-4984-a752-867c44178220	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	9VLV100LXviVRB58zwxLH5m8m9LX1Bug6LE84	bank	debit	posted	\N	\N	\N	\N	\N	51.85	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-09 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 401134 THESBC ORG WWW THESBC OR *	Thesbc Org	f	2026-04-28 01:41:52.574+00	2026-04-28 01:41:52.574+00	2026-04-28 22:39:04.336+00	\N
8db4db46-9b44-4355-aa74-05b164c11106	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	dKwK0eewOPfvab3JnNqZsqXL6xA1mvHD4MKbo	bank	debit	pending	\N	\N	\N	\N	\N	23.75	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-27 00:00:00+00	\N	Food & Drink	\N	DEBIT CARD AUTHORIZATION TST* SURF BAGEL MILF	Surf Bagel Milf	f	2026-04-28 01:41:32.739+00	2026-04-28 01:41:32.739+00	2026-04-28 03:28:22.625+00	\N
a777a7b8-075e-4e20-9af8-092257ef3424	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	5b7bwKK7XyuVQwa957NJHe898R7Db5swN781x	bank	debit	posted	\N	\N	\N	\N	\N	25.72	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-10 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 401134 SP LUME DEODORANT SHOP LUMEDEOD *	Lume Deodorant Shop	f	2026-04-28 01:41:45.807+00	2026-04-28 01:41:45.807+00	2026-04-28 22:38:57.647+00	\N
efbd5727-f459-45d7-a13b-6622916ea1c2	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	77w7LAAwXkT0vzq3Rbans79B9EawPLH08aXkY	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-10 00:00:00+00	\N	\N	\N	FMOFCU SV WEBXFR TRANSFER	\N	f	2026-04-28 01:41:52.37+00	2026-04-28 01:41:52.37+00	2026-04-28 22:39:04.152+00	\N
5a43118e-2c76-49af-b331-1376a66cd7cb	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Ve1ewVV1pnumXOAqpz3ZixYAYyXvzNF4ndg55	bank	debit	posted	\N	\N	\N	\N	\N	25.25	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-09 00:00:00+00	\N	\N	\N	ExxonMobil	ExxonMobil	f	2026-04-28 01:41:52.505+00	2026-04-28 01:41:52.505+00	2026-04-28 22:39:04.274+00	\N
b43d4339-f999-412a-811c-7443e592d63e	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	OeaegVVapnuj5OLdRe6pumpZpXV7DMIxpzE59	bank	debit	posted	\N	\N	\N	\N	\N	2.30	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-09 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 407105 PMUSA 758054 ARLINGTON 770 8189036 *	\N	f	2026-04-28 01:41:52.642+00	2026-04-28 01:41:52.642+00	2026-04-28 22:39:04.407+00	\N
62cb984f-c0e1-4d7b-9e90-6ac8cfa9077c	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	MeQemYYQpnum5ZPq3gdpiqknk7MwJZIX07rRq	bank	debit	posted	\N	\N	\N	\N	\N	4.05	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-09 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 407105 PMUSA 758054 ARLINGTON 770 8189036 *	\N	f	2026-04-28 01:41:52.796+00	2026-04-28 01:41:52.796+00	2026-04-28 22:39:04.529+00	\N
002242a6-12cd-4d9c-b202-5f74380ea5c8	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Qede9VVdpXu4Bzd6Agn8uxXBXdzQZYFO951dg	bank	debit	posted	\N	\N	\N	\N	\N	7.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-06 00:00:00+00	\N	\N	\N	PAYPAL INST XFER	\N	f	2026-04-28 01:41:52.921+00	2026-04-28 01:41:52.921+00	2026-04-28 22:39:04.663+00	\N
bf8d4c71-c987-4edc-85ce-ed1428243e1f	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	5b7bwKK7XyuVQwa957NJHe898R7Db5swN78zO	bank	debit	posted	\N	\N	\N	\N	\N	21.69	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 00:00:00+00	\N	\N	\N	AMAZON MKTPL*E00JW6L33 Amzn.com/billWA	Amazon	f	2026-04-28 01:41:53.104+00	2026-04-28 01:41:53.104+00	2026-04-28 22:39:04.827+00	\N
3cf7073a-37ab-4979-8d8d-67bffa1b2d7c	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	Je5e8VV5pvu9reOdPM1nuK6X648ZzYTm0ad5E	bank	credit	posted	\N	\N	\N	\N	\N	478.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:53.279+00	2026-04-28 01:41:53.279+00	2026-04-28 22:39:04.981+00	\N
f7fb0612-5708-4109-8cc9-11dfe8448b12	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	xYNY6eeNb7Uv5zYNpRewsPJwJeKLXoFOm5XgY	bank	credit	posted	\N	\N	\N	\N	\N	118.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:53.424+00	2026-04-28 01:41:53.424+00	2026-04-28 22:39:05.215+00	\N
90311093-8211-4863-98d5-e42cc976dd46	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	77w7LAAwXkT0vzq3Rbans79B9EawPLH08aXrK	bank	debit	posted	\N	\N	\N	\N	\N	17.98	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 00:00:00+00	\N	\N	\N	AMAZON MKTPL*8J6UL7Z93 Amzn.com/billWA	Amazon	f	2026-04-28 01:41:53.614+00	2026-04-28 01:41:53.614+00	2026-04-28 22:39:05.338+00	\N
c834828f-4e4f-4bdf-a845-dc27cf051105	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	b3B3AeeBpDfmwXKaYpbgipDkDMgZYLHJPV3vE	bank	debit	posted	\N	\N	\N	\N	\N	531.04	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 00:00:00+00	\N	\N	\N	Costco	Costco	f	2026-04-28 01:41:53.772+00	2026-04-28 01:41:53.772+00	2026-04-28 22:39:05.451+00	\N
4c86eb18-5c88-4fe3-9638-656ad66aabc0	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	Ve1ewVV1pnumXOAqpz3ZixYAYyXvzNF4ndgDp	bank	credit	posted	\N	\N	\N	\N	\N	58.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-30 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:53.931+00	2026-04-28 01:41:53.931+00	2026-04-28 22:39:05.564+00	\N
ba5bf3ce-9319-46ec-bc7c-259068d72567	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	OeaegVVapnuj5OLdRe6pumpZpXV7DMIxpzE1k	bank	debit	posted	\N	\N	\N	\N	\N	30.39	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 00:00:00+00	\N	\N	\N	AMAZON MKTPL*S84TA2JV3 Amzn.com/billWA	Amazon	f	2026-04-28 01:41:54.084+00	2026-04-28 01:41:54.084+00	2026-04-28 22:39:05.706+00	\N
ba7fb339-024e-4fe8-9e84-56b3447f9dd6	81555e75-82a5-45e7-9882-6d8996c9727d	415b3fa0-b187-4726-8d2c-8def88b4c586	plaid	Ae7eAZZ7X1uonwr0NbK1sRV0Vx4NXOCMwvDOe	bank	credit	posted	\N	\N	\N	\N	\N	25.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 00:00:00+00	\N	\N	\N	Online Xfer Transfer from SV x5019	\N	f	2026-04-28 01:41:54.225+00	2026-04-28 01:41:54.225+00	2026-04-28 22:39:05.825+00	\N
822396e8-4e6e-4b9a-8d62-a3b58a74911c	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	v9Y9deeYb8cYBnA5vXbmfP5DAgXowetVB8ny8	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-27 00:00:00+00	\N	\N	\N	ANTHROPIC ANTHROPIC.COMCA	Anthropic Anthropic.comca	f	2026-04-28 17:58:13.757+00	2026-04-28 17:58:13.757+00	2026-04-28 22:38:46.758+00	\N
66df9292-e756-4773-823f-2a9e87e34bc8	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	6gdg6kkdXKSv0ZxNL7m9sQpe3Aj0wKIYpMway	fee	debit	pending	\N	\N	\N	\N	\N	9.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-27 00:00:00+00	\N	\N	\N	ATM DEBIT APPLE.COM/BILL	Apple	f	2026-04-28 01:41:32.662+00	2026-04-28 01:41:32.662+00	2026-04-28 22:38:46.827+00	\N
41a5688e-cf22-4734-bab6-2128bc9ed30f	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	8969Dvv6eAcjvJB6OadyCXj039AVJmCx5Vj6k	bank	debit	posted	\N	\N	\N	\N	\N	50.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-27 00:00:00+00	\N	\N	\N	FMOFCU SV WEBXFR TRANSFER	\N	f	2026-04-28 17:58:13.923+00	2026-04-28 17:58:13.923+00	2026-04-28 22:38:46.884+00	\N
d34314da-58b7-4d1b-a61e-2e24f3316486	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	Zwdw1VVdOnfDdXbKp8ARHwykpZxanMibQLpZ3	bank	debit	posted	\N	\N	\N	\N	\N	23.75	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-27 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 413746 TST SURF BAGEL MILFORD MILFORD * DE	Surf Bagel	f	2026-04-28 17:58:13.997+00	2026-04-28 17:58:13.997+00	2026-04-28 22:38:46.945+00	\N
e1cf5a8e-ff55-4d90-a60b-1c0a667d8c00	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	77w7LAAwXkT0vzq3Rbans79KeEpw6dTYA100L	bank	debit	posted	\N	\N	\N	\N	\N	147.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-14 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CC x8301	\N	f	2026-04-28 01:41:35.268+00	2026-04-28 01:41:35.268+00	2026-04-28 22:38:49.125+00	\N
6da93b79-356e-452f-9689-64ad2992912f	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	v9Y9deeYb8cYBnA5vXbyipwNo8aBz9FgvoVV4	bank	debit	posted	\N	\N	\N	\N	\N	25.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-14 00:00:00+00	\N	\N	\N	Online Xfer Transfer to SV x4403	\N	f	2026-04-28 01:41:35.328+00	2026-04-28 01:41:35.328+00	2026-04-28 22:38:49.193+00	\N
fda28b31-f00d-4fe2-83e3-6423ab5a67f6	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	o8g8beegNOu1QnJamp8ocAknQ8zP3gSOL944a	bank	debit	posted	\N	\N	\N	\N	\N	16.95	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-07 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 438886 TRADINGVIEWV PRODUCT NEW YORK *	Tradingviewv Product	f	2026-04-28 01:41:37.659+00	2026-04-28 01:41:37.659+00	2026-04-28 22:38:51.331+00	\N
267027aa-f203-47ca-b40e-643296db4090	81555e75-82a5-45e7-9882-6d8996c9727d	415b3fa0-b187-4726-8d2c-8def88b4c586	plaid	o8g8beegNOu1QnJamp8ocAknQ8zP3gSOL94ra	bank	debit	posted	\N	\N	\N	\N	\N	5.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-31 00:00:00+00	\N	\N	\N	MAINTENANCE FEE	\N	f	2026-04-28 01:41:40.707+00	2026-04-28 01:41:40.707+00	2026-04-28 22:38:53.436+00	\N
9cf51f2d-226c-44ba-b544-49911f6bd4ff	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	q5y57eeyb8IqRaVw3JbOiQkYrbEadzInAeD1j	bank	debit	posted	\N	\N	\N	\N	\N	20.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-31 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CC x8301	\N	f	2026-04-28 01:41:40.78+00	2026-04-28 01:41:40.78+00	2026-04-28 22:38:53.535+00	\N
f8fe3d36-be66-4659-9b67-bc98d3f868db	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	8969Dvv6eAcjvJB6OadgurJ6JyO10nUxYOgVx	bank	debit	posted	\N	\N	\N	\N	\N	64.47	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-13 00:00:00+00	\N	\N	\N	DEPT EDUCATION STUDENT LN	Education Student Ln	f	2026-04-28 01:41:51.042+00	2026-04-28 01:41:51.042+00	2026-04-28 22:39:03.105+00	\N
5f3f9ef3-6469-4ce5-bdca-394bc6460132	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	xYNY6eeNb7Uv5zYNpRewsPJwJeKLXoFOm5XQR	bank	debit	posted	\N	\N	\N	\N	\N	1178.42	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-13 00:00:00+00	\N	\N	\N	DEPT EDUCATION STUDENT LN	Education Student Ln	f	2026-04-28 01:41:51.257+00	2026-04-28 01:41:51.257+00	2026-04-28 22:39:03.229+00	\N
264eba2b-c9f6-4a99-91ca-393211e95fd6	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	Ae7eAZZ7X1uonwr0NbK1sRV0Vx4NXOCMwvDJj	bank	credit	posted	\N	\N	\N	\N	\N	34.17	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-13 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:51.433+00	2026-04-28 01:41:51.433+00	2026-04-28 22:39:03.346+00	\N
9f609322-0d80-46c0-9c8f-2231f20a6b0c	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	0JKJ9PPKX1cVz9dZJgQNH0XZX5keV1HA9kwXj	bank	debit	posted	\N	\N	\N	\N	\N	34.17	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-12 00:00:00+00	\N	\N	\N	FOOD LIABLITY INSURANC	Food Liablity Insuranc	f	2026-04-28 01:41:51.591+00	2026-04-28 01:41:51.591+00	2026-04-28 22:39:03.469+00	\N
486f6081-9c25-4656-be17-105e17d21166	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	o8g8beegNOu1QnJamp8ocAkxk8aPDXH4rnqQo	bank	debit	posted	\N	\N	\N	\N	\N	206.54	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-12 00:00:00+00	\N	\N	\N	Online Xfer Transfer to CC x8301	\N	f	2026-04-28 01:41:51.769+00	2026-04-28 01:41:51.769+00	2026-04-28 22:39:03.636+00	\N
24297a54-9c72-4d8d-8765-2158471170b7	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	v9Y9deeYb8cYBnA5vXbyipwbw8RBDJHVp94Dz	bank	credit	posted	\N	\N	\N	\N	\N	206.54	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-12 00:00:00+00	\N	\N	\N	PAYMENT RECEIVED -- THANK YOU	\N	f	2026-04-28 01:41:51.928+00	2026-04-28 01:41:51.928+00	2026-04-28 22:39:03.765+00	\N
e6628c24-d493-4d57-bbdf-a6e2abd40c9c	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	b3B3AeeBpDfmwXKaYpbgipDkDMgZYLHJPV3rx	bank	debit	posted	\N	\N	\N	\N	\N	7.75	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-11 00:00:00+00	\N	\N	\N	Dollar Tree	Dollar Tree	f	2026-04-28 01:41:52.093+00	2026-04-28 01:41:52.093+00	2026-04-28 22:39:03.888+00	\N
268bf3dc-fd85-49d6-875f-5ddded49fb9c	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	ro0o9ee0b8cXVemxypb0hNpPpbrJe3HVr6R77	bank	debit	posted	\N	\N	\N	\N	\N	49.99	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-11 00:00:00+00	\N	\N	\N	NAV TECH NAV.COM	Nav Tech	f	2026-04-28 01:41:52.217+00	2026-04-28 01:41:52.217+00	2026-04-28 22:39:04.03+00	\N
ce75bf2a-67fa-4607-a7ff-062c09482c7b	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	xYNY6eeNb7Uv5zYNpRemHpNXEj7qJ0IOLQBEB	bank	debit	pending	\N	\N	\N	\N	\N	40.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-28 00:00:00+00	\N	\N	\N	DEBIT CARD AUTHORIZATION BAYHEALTH MEDICAL CE	Bayhealth Medical Ce	f	2026-04-28 17:58:13.62+00	2026-04-28 17:58:13.62+00	2026-04-28 22:38:46.692+00	\N
ec810f8a-8073-4e26-abe0-516a2c148b82	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	k4B48eeBOAi5brn7LExwik1JoMKeDqiEKMob5	bank	debit	posted	\N	\N	\N	\N	\N	40.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 443565 BAYHEALTH MEDICAL CENTER DOVER * DE	Bayhealth Medical Center	f	2026-04-28 01:41:41.89+00	2026-04-28 01:41:41.89+00	2026-04-28 22:38:54.351+00	\N
da4daabd-36aa-4933-913d-e39b8223b8f4	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	6gdg6kkdXKSv0ZxNL7m9sQpNpAD0B9twADRk4	bank	debit	posted	\N	\N	\N	\N	\N	31.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 00:00:00+00	\N	\N	\N	NJ EZPASS	NJ E-ZPass	f	2026-04-28 01:41:45.995+00	2026-04-28 01:41:45.995+00	2026-04-28 22:38:57.888+00	\N
7ab26bef-d3ee-4a78-b3d3-df683491b8c3	81555e75-82a5-45e7-9882-6d8996c9727d	3ab26e91-bfbd-435f-a9d5-8a15f0396245	plaid	wVNVwYYNb8iEz1Km05bRsxj0j8LZe4FKRxNq7	bank	debit	posted	\N	\N	\N	\N	\N	51.86	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-09 00:00:00+00	\N	\N	\N	OISHII SUSHI & HIBACHI	Oishii Sushi & Hibachi	f	2026-04-28 01:41:46.055+00	2026-04-28 01:41:46.055+00	2026-04-28 22:38:57.96+00	\N
c204cd07-7235-48c1-bf41-0f310863d23e	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	MeQemYYQpnum5ZPq3gdpiqknk7MwJZIX07rOL	bank	debit	posted	\N	\N	\N	\N	\N	8.40	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-05 00:00:00+00	\N	\N	\N	VISA DDA PUR AP 401134 SQSP WORKSP 224924752 SQUARESPACE C *	Worksp	f	2026-04-28 01:41:46.522+00	2026-04-28 01:41:46.522+00	2026-04-28 22:38:58.453+00	\N
3a90b27b-a3e2-4dc0-ab96-c7741a6f8fb7	81555e75-82a5-45e7-9882-6d8996c9727d	36b11dab-f2d8-4cad-887e-053b62a9a034	plaid	XeqeLOOqpnu68YD3QpKzfn818r0qAPCdzDgXj	bank	credit	posted	\N	\N	\N	\N	\N	973.00	USD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-27 00:00:00+00	\N	\N	\N	Social Security Administration	Social Security Administration	f	2026-04-28 01:41:48.469+00	2026-04-28 01:41:48.469+00	2026-04-28 22:39:00.254+00	\N
\.


--
-- Data for Name: trend_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trend_snapshots (id, user_id, snapshot_date, period_type, period_start_date, period_end_date, total_income, total_expenses, net_cash_flow, savings_rate, investment_growth, net_worth_change, debt_to_income_ratio, expense_volatility, leverage_ratio, margin_utilization, financial_health_score, calculated_at, source, created_at) FROM stdin;
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_profiles (id, email, full_name, role, subscription_plan, refresh_window_minute, last_scheduled_refresh_at, mfa_enabled, created_at, updated_at, notification_preferences, app_preferences) FROM stdin;
9d507dde-9787-44bd-ab72-329d7538483b	\N	T Jacobs	user	pro	\N	\N	f	2026-04-23 20:51:05.884313+00	2026-04-26 18:04:28.176+00	{"ai_insight": true, "margin_risk": true, "budget_exceeded": true, "spending_anomaly": true, "tax_underpayment": true, "cash_flow_warning": true, "auto_scan_frequency": "weekly"}	{"default_tax_year": 2026, "levelup_auto_open": true}
\.


--
-- Data for Name: write_offs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.write_offs (id, user_id, transaction_id, category, description, amount, expense_date, tax_year, deduction_type, is_verified, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-04-19 20:07:32
20211116045059	2026-04-19 20:07:32
20211116050929	2026-04-19 20:07:32
20211116051442	2026-04-19 20:07:32
20211116212300	2026-04-19 20:07:32
20211116213355	2026-04-19 20:07:32
20211116213934	2026-04-19 20:07:32
20211116214523	2026-04-19 20:07:32
20211122062447	2026-04-19 20:07:32
20211124070109	2026-04-19 20:07:32
20211202204204	2026-04-19 20:07:32
20211202204605	2026-04-19 20:07:32
20211210212804	2026-04-19 20:07:32
20211228014915	2026-04-19 20:07:32
20220107221237	2026-04-19 20:07:32
20220228202821	2026-04-19 20:07:32
20220312004840	2026-04-19 20:07:32
20220603231003	2026-04-19 20:07:32
20220603232444	2026-04-19 20:07:32
20220615214548	2026-04-19 20:07:32
20220712093339	2026-04-19 20:07:32
20220908172859	2026-04-19 20:07:32
20220916233421	2026-04-19 20:07:32
20230119133233	2026-04-19 20:07:33
20230128025114	2026-04-19 20:07:33
20230128025212	2026-04-19 20:07:33
20230227211149	2026-04-19 20:07:33
20230228184745	2026-04-19 20:07:33
20230308225145	2026-04-19 20:07:33
20230328144023	2026-04-19 20:07:33
20231018144023	2026-04-19 20:07:33
20231204144023	2026-04-19 20:07:33
20231204144024	2026-04-19 20:07:33
20231204144025	2026-04-19 20:07:33
20240108234812	2026-04-19 20:07:33
20240109165339	2026-04-19 20:07:33
20240227174441	2026-04-19 20:07:33
20240311171622	2026-04-19 20:07:33
20240321100241	2026-04-19 20:07:33
20240401105812	2026-04-19 20:07:33
20240418121054	2026-04-19 20:07:33
20240523004032	2026-04-19 20:07:33
20240618124746	2026-04-19 20:07:33
20240801235015	2026-04-19 20:07:33
20240805133720	2026-04-19 20:07:33
20240827160934	2026-04-19 20:07:33
20240919163303	2026-04-19 20:07:33
20240919163305	2026-04-19 20:07:33
20241019105805	2026-04-19 20:07:33
20241030150047	2026-04-19 20:07:33
20241108114728	2026-04-19 20:07:33
20241121104152	2026-04-19 20:07:33
20241130184212	2026-04-19 20:07:33
20241220035512	2026-04-19 20:07:33
20241220123912	2026-04-19 20:07:33
20241224161212	2026-04-19 20:07:33
20250107150512	2026-04-19 20:07:33
20250110162412	2026-04-19 20:07:33
20250123174212	2026-04-19 20:07:33
20250128220012	2026-04-19 20:07:33
20250506224012	2026-04-19 20:07:33
20250523164012	2026-04-19 20:07:33
20250714121412	2026-04-19 20:07:33
20250905041441	2026-04-19 20:07:33
20251103001201	2026-04-19 20:07:33
20251120212548	2026-04-19 20:07:33
20251120215549	2026-04-19 20:07:33
20260218120000	2026-04-19 20:07:33
20260326120000	2026-04-19 20:07:33
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-04-19 20:07:39.269064
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-04-19 20:07:39.274353
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-04-19 20:07:39.278498
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-04-19 20:07:39.289813
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-04-19 20:07:39.296206
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-04-19 20:07:39.298611
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-04-19 20:07:39.301543
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-04-19 20:07:39.304839
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-04-19 20:07:39.307164
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-04-19 20:07:39.310497
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-04-19 20:07:39.313069
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-04-19 20:07:39.315788
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-04-19 20:07:39.318647
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-04-19 20:07:39.321067
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-04-19 20:07:39.323806
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-04-19 20:07:39.343903
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-04-19 20:07:39.346909
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-04-19 20:07:39.349566
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-04-19 20:07:39.352096
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-04-19 20:07:39.356147
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-04-19 20:07:39.358647
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-04-19 20:07:39.362671
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-04-19 20:07:39.371939
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-04-19 20:07:39.380174
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-04-19 20:07:39.383079
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-04-19 20:07:39.385409
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-04-19 20:07:39.387539
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-04-19 20:07:39.389268
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-04-19 20:07:39.390987
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-04-19 20:07:39.392761
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-04-19 20:07:39.394479
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-04-19 20:07:39.396286
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-04-19 20:07:39.398147
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-04-19 20:07:39.400091
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-04-19 20:07:39.401882
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-04-19 20:07:39.403777
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-04-19 20:07:39.40573
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-04-19 20:07:39.407551
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-04-19 20:07:39.410811
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-04-19 20:07:39.419277
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-04-19 20:07:39.421199
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-04-19 20:07:39.423195
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-04-19 20:07:39.425132
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-04-19 20:07:39.427048
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-04-19 20:07:39.429091
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-04-19 20:07:39.431741
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-04-19 20:07:39.438843
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-04-19 20:07:39.441435
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-04-19 20:07:39.443539
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-04-19 20:07:39.457019
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-04-19 20:07:39.459527
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-04-19 20:07:39.470933
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-04-19 20:07:39.472209
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-04-19 20:07:39.479191
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-04-19 20:07:39.480811
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-04-19 20:07:39.48218
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-04-19 20:07:39.488634
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-04-19 20:07:39.491074
56	fix-optimized-search-function	b823ed1e418101032fa01374edc9a436e54e3ed4	2026-04-19 20:07:39.485079
59	drop-unused-functions	38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4	2026-04-28 20:19:50.560526
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
80957074-2ff3-4504-b246-27f7250e319b	PLAID_SECRET		727njB3W+qsumJ6xn7+ZDNXdw9+pERvn76q1LpVAav6zgThVmHwUvbq8v/JaC7uC9KsUSeIrzdFb\nfwRXMZo=	\N	\\xb696e33144c7ee54d875f79c48afee00	2026-04-27 22:19:31.316347+00	2026-04-27 22:19:31.316347+00
bd5849a3-4e6c-4abe-a320-eeed5ca783b5	PLAID_CLIENT_ID		LhXKLP+2Ver/zUS+atNk+V8SYdRjl9FunmsfEFxo01S71WEdkx1fhWb6jlc3Rj4XhW/CU372uDw=	\N	\\x76dd14e1f26f9e31a7c03e7cb6815637	2026-04-27 22:21:09.446421+00	2026-04-27 22:21:09.446421+00
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 98, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: account_balance_history account_balance_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_balance_history
    ADD CONSTRAINT account_balance_history_pkey PRIMARY KEY (id);


--
-- Name: ai_context_cache ai_context_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_context_cache
    ADD CONSTRAINT ai_context_cache_pkey PRIMARY KEY (id);


--
-- Name: ai_usage_limits ai_usage_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_limits
    ADD CONSTRAINT ai_usage_limits_pkey PRIMARY KEY (id);


--
-- Name: ai_usage_logs ai_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_pkey PRIMARY KEY (id);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: assistant_conversations assistant_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assistant_conversations
    ADD CONSTRAINT assistant_conversations_pkey PRIMARY KEY (id);


--
-- Name: assistant_messages assistant_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assistant_messages
    ADD CONSTRAINT assistant_messages_pkey PRIMARY KEY (id);


--
-- Name: assistant_tool_registry assistant_tool_registry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assistant_tool_registry
    ADD CONSTRAINT assistant_tool_registry_pkey PRIMARY KEY (id);


--
-- Name: assistant_tool_registry assistant_tool_registry_tool_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assistant_tool_registry
    ADD CONSTRAINT assistant_tool_registry_tool_name_key UNIQUE (tool_name);


--
-- Name: budget_categories budget_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT budget_categories_pkey PRIMARY KEY (id);


--
-- Name: budget_records budget_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_records
    ADD CONSTRAINT budget_records_pkey PRIMARY KEY (id);


--
-- Name: envelope_transactions envelope_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.envelope_transactions
    ADD CONSTRAINT envelope_transactions_pkey PRIMARY KEY (id);


--
-- Name: envelopes envelopes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.envelopes
    ADD CONSTRAINT envelopes_pkey PRIMARY KEY (id);


--
-- Name: feature_flag_plans feature_flag_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flag_plans
    ADD CONSTRAINT feature_flag_plans_pkey PRIMARY KEY (id);


--
-- Name: feature_flag_user_overrides feature_flag_user_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flag_user_overrides
    ADD CONSTRAINT feature_flag_user_overrides_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_flag_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_flag_key_key UNIQUE (flag_key);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: financial_accounts financial_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_accounts
    ADD CONSTRAINT financial_accounts_pkey PRIMARY KEY (id);


--
-- Name: integration_connections integration_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integration_connections
    ADD CONSTRAINT integration_connections_pkey PRIMARY KEY (id);


--
-- Name: integration_connections integration_connections_user_id_provider_external_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integration_connections
    ADD CONSTRAINT integration_connections_user_id_provider_external_id_key UNIQUE (user_id, provider, external_id);


--
-- Name: jurisdictions jurisdictions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jurisdictions
    ADD CONSTRAINT jurisdictions_pkey PRIMARY KEY (id);


--
-- Name: portfolio_snapshots portfolio_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio_snapshots
    ADD CONSTRAINT portfolio_snapshots_pkey PRIMARY KEY (id);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: refresh_jobs refresh_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_jobs
    ADD CONSTRAINT refresh_jobs_pkey PRIMARY KEY (id);


--
-- Name: risk_snapshots risk_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.risk_snapshots
    ADD CONSTRAINT risk_snapshots_pkey PRIMARY KEY (id);


--
-- Name: savings_goals savings_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_goals
    ADD CONSTRAINT savings_goals_pkey PRIMARY KEY (id);


--
-- Name: spending_snapshots spending_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spending_snapshots
    ADD CONSTRAINT spending_snapshots_pkey PRIMARY KEY (id);


--
-- Name: sync_logs sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_pkey PRIMARY KEY (id);


--
-- Name: tax_estimates tax_estimates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_estimates
    ADD CONSTRAINT tax_estimates_pkey PRIMARY KEY (id);


--
-- Name: tax_payments tax_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_payments
    ADD CONSTRAINT tax_payments_pkey PRIMARY KEY (id);


--
-- Name: tax_profiles tax_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_profiles
    ADD CONSTRAINT tax_profiles_pkey PRIMARY KEY (id);


--
-- Name: tax_rates tax_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rates
    ADD CONSTRAINT tax_rates_pkey PRIMARY KEY (id);


--
-- Name: trade_journal trade_journal_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trade_journal
    ADD CONSTRAINT trade_journal_pkey PRIMARY KEY (id);


--
-- Name: trades trades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: trend_snapshots trend_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trend_snapshots
    ADD CONSTRAINT trend_snapshots_pkey PRIMARY KEY (id);


--
-- Name: positions unique_account_asset; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT unique_account_asset UNIQUE (financial_account_id, asset_symbol);


--
-- Name: account_balance_history unique_account_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_balance_history
    ADD CONSTRAINT unique_account_date UNIQUE (financial_account_id, snapshot_date);


--
-- Name: risk_snapshots unique_account_risk_snapshot; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.risk_snapshots
    ADD CONSTRAINT unique_account_risk_snapshot UNIQUE (financial_account_id, snapshot_date);


--
-- Name: ai_context_cache unique_ai_snapshot; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_context_cache
    ADD CONSTRAINT unique_ai_snapshot UNIQUE (user_id, context_type, snapshot_date);


--
-- Name: tax_estimates unique_estimate; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_estimates
    ADD CONSTRAINT unique_estimate UNIQUE (tax_profile_id, jurisdiction_id, tax_year, period_type, quarter);


--
-- Name: feature_flag_plans unique_flag_plan; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flag_plans
    ADD CONSTRAINT unique_flag_plan UNIQUE (feature_flag_id, plan_type);


--
-- Name: financial_accounts unique_provider_account; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_accounts
    ADD CONSTRAINT unique_provider_account UNIQUE (provider, provider_account_id);


--
-- Name: transactions unique_provider_transaction; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT unique_provider_transaction UNIQUE (provider, external_transaction_id);


--
-- Name: spending_snapshots unique_snapshot; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spending_snapshots
    ADD CONSTRAINT unique_snapshot UNIQUE (user_id, category_id, period_type, snapshot_date);


--
-- Name: trend_snapshots unique_trend_snapshot; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trend_snapshots
    ADD CONSTRAINT unique_trend_snapshot UNIQUE (user_id, period_type, snapshot_date);


--
-- Name: budget_categories unique_user_category_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT unique_user_category_name UNIQUE (user_id, name);


--
-- Name: feature_flag_user_overrides unique_user_flag; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flag_user_overrides
    ADD CONSTRAINT unique_user_flag UNIQUE (user_id, feature_flag_id);


--
-- Name: savings_goals unique_user_goal_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_goals
    ADD CONSTRAINT unique_user_goal_name UNIQUE (user_id, name);


--
-- Name: tax_profiles unique_user_profile_year; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_profiles
    ADD CONSTRAINT unique_user_profile_year UNIQUE (user_id, profile_name, tax_year);


--
-- Name: portfolio_snapshots unique_user_snapshot_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio_snapshots
    ADD CONSTRAINT unique_user_snapshot_date UNIQUE (user_id, snapshot_date);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: write_offs write_offs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.write_offs
    ADD CONSTRAINT write_offs_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- Name: idx_users_last_sign_in_at_desc; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC);


--
-- Name: idx_users_name; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: idx_ai_context_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_context_date ON public.ai_context_cache USING btree (user_id, snapshot_date DESC);


--
-- Name: idx_ai_context_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_context_type ON public.ai_context_cache USING btree (user_id, context_type);


--
-- Name: idx_ai_context_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_context_user ON public.ai_context_cache USING btree (user_id);


--
-- Name: idx_ai_limits_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_limits_user ON public.ai_usage_limits USING btree (user_id);


--
-- Name: idx_ai_usage_conversation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_usage_conversation ON public.ai_usage_logs USING btree (conversation_id);


--
-- Name: idx_ai_usage_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_usage_date ON public.ai_usage_logs USING btree (user_id, usage_date);


--
-- Name: idx_ai_usage_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_usage_user ON public.ai_usage_logs USING btree (user_id);


--
-- Name: idx_alerts_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_account ON public.alerts USING btree (financial_account_id);


--
-- Name: idx_alerts_severity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_severity ON public.alerts USING btree (severity);


--
-- Name: idx_alerts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_status ON public.alerts USING btree (user_id, status);


--
-- Name: idx_alerts_triggered; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_triggered ON public.alerts USING btree (triggered_at DESC);


--
-- Name: idx_alerts_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_user ON public.alerts USING btree (user_id);


--
-- Name: idx_assistant_conversations_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assistant_conversations_type ON public.assistant_conversations USING btree (conversation_type);


--
-- Name: idx_assistant_conversations_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assistant_conversations_user ON public.assistant_conversations USING btree (user_id);


--
-- Name: idx_assistant_messages_conversation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assistant_messages_conversation ON public.assistant_messages USING btree (conversation_id);


--
-- Name: idx_assistant_messages_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assistant_messages_created ON public.assistant_messages USING btree (created_at DESC);


--
-- Name: idx_assistant_messages_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assistant_messages_user ON public.assistant_messages USING btree (user_id);


--
-- Name: idx_balance_history_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_balance_history_account ON public.account_balance_history USING btree (financial_account_id);


--
-- Name: idx_balance_history_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_balance_history_date ON public.account_balance_history USING btree (snapshot_date DESC);


--
-- Name: idx_balance_history_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_balance_history_user ON public.account_balance_history USING btree (user_id);


--
-- Name: idx_balance_history_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_balance_history_user_date ON public.account_balance_history USING btree (user_id, snapshot_date DESC);


--
-- Name: idx_budget_categories_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_categories_active ON public.budget_categories USING btree (user_id, is_active);


--
-- Name: idx_budget_categories_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_categories_parent ON public.budget_categories USING btree (parent_category_id);


--
-- Name: idx_budget_categories_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_categories_user ON public.budget_categories USING btree (user_id);


--
-- Name: idx_budget_records_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_records_category ON public.budget_records USING btree (category_id);


--
-- Name: idx_budget_records_date_range; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_records_date_range ON public.budget_records USING btree (user_id, start_date, end_date);


--
-- Name: idx_budget_records_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_budget_records_user ON public.budget_records USING btree (user_id);


--
-- Name: idx_feature_flag_plans_flag; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feature_flag_plans_flag ON public.feature_flag_plans USING btree (feature_flag_id);


--
-- Name: idx_feature_flag_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feature_flag_user ON public.feature_flag_user_overrides USING btree (user_id);


--
-- Name: idx_feature_flags_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feature_flags_active ON public.feature_flags USING btree (is_active);


--
-- Name: idx_fin_accounts_currency; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fin_accounts_currency ON public.financial_accounts USING btree (account_currency);


--
-- Name: idx_fin_accounts_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fin_accounts_deleted ON public.financial_accounts USING btree (deleted_at);


--
-- Name: idx_fin_accounts_integration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fin_accounts_integration ON public.financial_accounts USING btree (integration_connection_id);


--
-- Name: idx_fin_accounts_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fin_accounts_parent ON public.financial_accounts USING btree (parent_account_id);


--
-- Name: idx_fin_accounts_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fin_accounts_user ON public.financial_accounts USING btree (user_id);


--
-- Name: idx_fin_accounts_user_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fin_accounts_user_active ON public.financial_accounts USING btree (user_id, is_active);


--
-- Name: idx_jurisdictions_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jurisdictions_active ON public.jurisdictions USING btree (is_active);


--
-- Name: idx_jurisdictions_country; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jurisdictions_country ON public.jurisdictions USING btree (country_code);


--
-- Name: idx_jurisdictions_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jurisdictions_parent ON public.jurisdictions USING btree (parent_jurisdiction_id);


--
-- Name: idx_jurisdictions_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jurisdictions_type ON public.jurisdictions USING btree (jurisdiction_type);


--
-- Name: idx_portfolio_snapshots_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_portfolio_snapshots_date ON public.portfolio_snapshots USING btree (snapshot_date DESC);


--
-- Name: idx_portfolio_snapshots_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_portfolio_snapshots_user ON public.portfolio_snapshots USING btree (user_id);


--
-- Name: idx_portfolio_snapshots_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_portfolio_snapshots_user_date ON public.portfolio_snapshots USING btree (user_id, snapshot_date DESC);


--
-- Name: idx_positions_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_positions_account ON public.positions USING btree (financial_account_id);


--
-- Name: idx_positions_asset; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_positions_asset ON public.positions USING btree (asset_symbol);


--
-- Name: idx_positions_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_positions_deleted ON public.positions USING btree (deleted_at);


--
-- Name: idx_positions_derivative; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_positions_derivative ON public.positions USING btree (derivative_type);


--
-- Name: idx_positions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_positions_user ON public.positions USING btree (user_id);


--
-- Name: idx_refresh_jobs_queued; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_jobs_queued ON public.refresh_jobs USING btree (queued_at DESC);


--
-- Name: idx_refresh_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_jobs_status ON public.refresh_jobs USING btree (user_id, status);


--
-- Name: idx_refresh_jobs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_jobs_user ON public.refresh_jobs USING btree (user_id);


--
-- Name: idx_risk_snapshots_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_risk_snapshots_account ON public.risk_snapshots USING btree (financial_account_id);


--
-- Name: idx_risk_snapshots_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_risk_snapshots_date ON public.risk_snapshots USING btree (snapshot_date DESC);


--
-- Name: idx_risk_snapshots_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_risk_snapshots_user ON public.risk_snapshots USING btree (user_id);


--
-- Name: idx_risk_snapshots_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_risk_snapshots_user_date ON public.risk_snapshots USING btree (user_id, snapshot_date DESC);


--
-- Name: idx_savings_goals_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_savings_goals_account ON public.savings_goals USING btree (financial_account_id);


--
-- Name: idx_savings_goals_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_savings_goals_status ON public.savings_goals USING btree (user_id, status);


--
-- Name: idx_savings_goals_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_savings_goals_user ON public.savings_goals USING btree (user_id);


--
-- Name: idx_spending_snapshots_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_spending_snapshots_category ON public.spending_snapshots USING btree (category_id);


--
-- Name: idx_spending_snapshots_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_spending_snapshots_period ON public.spending_snapshots USING btree (user_id, period_type, snapshot_date DESC);


--
-- Name: idx_spending_snapshots_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_spending_snapshots_user ON public.spending_snapshots USING btree (user_id);


--
-- Name: idx_tax_estimates_jurisdiction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_estimates_jurisdiction ON public.tax_estimates USING btree (jurisdiction_id);


--
-- Name: idx_tax_estimates_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_estimates_profile ON public.tax_estimates USING btree (tax_profile_id);


--
-- Name: idx_tax_estimates_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_estimates_user ON public.tax_estimates USING btree (user_id);


--
-- Name: idx_tax_estimates_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_estimates_year ON public.tax_estimates USING btree (tax_year);


--
-- Name: idx_tax_payments_jurisdiction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_payments_jurisdiction ON public.tax_payments USING btree (jurisdiction_id);


--
-- Name: idx_tax_payments_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_payments_period ON public.tax_payments USING btree (tax_profile_id, tax_year, period_type, quarter);


--
-- Name: idx_tax_payments_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_payments_profile ON public.tax_payments USING btree (tax_profile_id);


--
-- Name: idx_tax_payments_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_payments_user ON public.tax_payments USING btree (user_id);


--
-- Name: idx_tax_payments_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_payments_year ON public.tax_payments USING btree (tax_year);


--
-- Name: idx_tax_profiles_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_profiles_active ON public.tax_profiles USING btree (user_id, is_active);


--
-- Name: idx_tax_profiles_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_profiles_user ON public.tax_profiles USING btree (user_id);


--
-- Name: idx_tax_profiles_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_profiles_year ON public.tax_profiles USING btree (tax_year);


--
-- Name: idx_tax_rates_jurisdiction; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_rates_jurisdiction ON public.tax_rates USING btree (jurisdiction_id);


--
-- Name: idx_tax_rates_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_rates_status ON public.tax_rates USING btree (is_active);


--
-- Name: idx_tax_rates_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_rates_type ON public.tax_rates USING btree (tax_type);


--
-- Name: idx_tax_rates_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tax_rates_year ON public.tax_rates USING btree (tax_year);


--
-- Name: idx_tool_registry_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tool_registry_active ON public.assistant_tool_registry USING btree (is_active);


--
-- Name: idx_tool_registry_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tool_registry_category ON public.assistant_tool_registry USING btree (tool_category);


--
-- Name: idx_transactions_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_account ON public.transactions USING btree (financial_account_id);


--
-- Name: idx_transactions_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_deleted ON public.transactions USING btree (deleted_at);


--
-- Name: idx_transactions_lot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_lot ON public.transactions USING btree (lot_id);


--
-- Name: idx_transactions_transfer_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_transfer_group ON public.transactions USING btree (transfer_group_id);


--
-- Name: idx_transactions_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_type ON public.transactions USING btree (transaction_type);


--
-- Name: idx_transactions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_user ON public.transactions USING btree (user_id);


--
-- Name: idx_transactions_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_user_date ON public.transactions USING btree (user_id, transaction_date DESC);


--
-- Name: idx_trend_snapshots_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trend_snapshots_period ON public.trend_snapshots USING btree (user_id, period_type, snapshot_date DESC);


--
-- Name: idx_trend_snapshots_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trend_snapshots_user ON public.trend_snapshots USING btree (user_id);


--
-- Name: idx_user_profiles_refresh_window; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_refresh_window ON public.user_profiles USING btree (refresh_window_minute);


--
-- Name: idx_user_profiles_subscription; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_subscription ON public.user_profiles USING btree (subscription_plan);


--
-- Name: trade_journal_trade_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trade_journal_trade_id_idx ON public.trade_journal USING btree (trade_id);


--
-- Name: trades_entry_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trades_entry_date_idx ON public.trades USING btree (entry_date DESC);


--
-- Name: trades_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trades_status_idx ON public.trades USING btree (status);


--
-- Name: trades_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trades_user_id_idx ON public.trades USING btree (user_id);


--
-- Name: unique_active_refresh_job; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_active_refresh_job ON public.refresh_jobs USING btree (user_id) WHERE (status = ANY (ARRAY['queued'::text, 'processing'::text]));


--
-- Name: write_offs_expense_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX write_offs_expense_date_idx ON public.write_offs USING btree (expense_date);


--
-- Name: write_offs_tax_year_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX write_offs_tax_year_idx ON public.write_offs USING btree (tax_year);


--
-- Name: write_offs_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX write_offs_user_id_idx ON public.write_offs USING btree (user_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: account_balance_history account_balance_history_financial_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_balance_history
    ADD CONSTRAINT account_balance_history_financial_account_id_fkey FOREIGN KEY (financial_account_id) REFERENCES public.financial_accounts(id) ON DELETE CASCADE;


--
-- Name: account_balance_history account_balance_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_balance_history
    ADD CONSTRAINT account_balance_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_context_cache ai_context_cache_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_context_cache
    ADD CONSTRAINT ai_context_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_usage_limits ai_usage_limits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_limits
    ADD CONSTRAINT ai_usage_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_usage_logs ai_usage_logs_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.assistant_conversations(id) ON DELETE SET NULL;


--
-- Name: ai_usage_logs ai_usage_logs_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.assistant_messages(id) ON DELETE SET NULL;


--
-- Name: ai_usage_logs ai_usage_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: alerts alerts_financial_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_financial_account_id_fkey FOREIGN KEY (financial_account_id) REFERENCES public.financial_accounts(id) ON DELETE CASCADE;


--
-- Name: alerts alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: assistant_conversations assistant_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assistant_conversations
    ADD CONSTRAINT assistant_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: assistant_messages assistant_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assistant_messages
    ADD CONSTRAINT assistant_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.assistant_conversations(id) ON DELETE CASCADE;


--
-- Name: assistant_messages assistant_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assistant_messages
    ADD CONSTRAINT assistant_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: budget_categories budget_categories_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT budget_categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.budget_categories(id) ON DELETE CASCADE;


--
-- Name: budget_categories budget_categories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT budget_categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: budget_records budget_records_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_records
    ADD CONSTRAINT budget_records_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.budget_categories(id) ON DELETE CASCADE;


--
-- Name: budget_records budget_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_records
    ADD CONSTRAINT budget_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: envelope_transactions envelope_transactions_envelope_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.envelope_transactions
    ADD CONSTRAINT envelope_transactions_envelope_id_fkey FOREIGN KEY (envelope_id) REFERENCES public.envelopes(id) ON DELETE CASCADE;


--
-- Name: envelope_transactions envelope_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.envelope_transactions
    ADD CONSTRAINT envelope_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: envelopes envelopes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.envelopes
    ADD CONSTRAINT envelopes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: feature_flag_plans feature_flag_plans_feature_flag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flag_plans
    ADD CONSTRAINT feature_flag_plans_feature_flag_id_fkey FOREIGN KEY (feature_flag_id) REFERENCES public.feature_flags(id) ON DELETE CASCADE;


--
-- Name: feature_flag_user_overrides feature_flag_user_overrides_feature_flag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flag_user_overrides
    ADD CONSTRAINT feature_flag_user_overrides_feature_flag_id_fkey FOREIGN KEY (feature_flag_id) REFERENCES public.feature_flags(id) ON DELETE CASCADE;


--
-- Name: feature_flag_user_overrides feature_flag_user_overrides_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_flag_user_overrides
    ADD CONSTRAINT feature_flag_user_overrides_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: financial_accounts financial_accounts_integration_connection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_accounts
    ADD CONSTRAINT financial_accounts_integration_connection_id_fkey FOREIGN KEY (integration_connection_id) REFERENCES public.integration_connections(id) ON DELETE SET NULL;


--
-- Name: financial_accounts financial_accounts_parent_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_accounts
    ADD CONSTRAINT financial_accounts_parent_account_id_fkey FOREIGN KEY (parent_account_id) REFERENCES public.financial_accounts(id) ON DELETE CASCADE;


--
-- Name: financial_accounts financial_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_accounts
    ADD CONSTRAINT financial_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: integration_connections integration_connections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integration_connections
    ADD CONSTRAINT integration_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: jurisdictions jurisdictions_parent_jurisdiction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jurisdictions
    ADD CONSTRAINT jurisdictions_parent_jurisdiction_id_fkey FOREIGN KEY (parent_jurisdiction_id) REFERENCES public.jurisdictions(id) ON DELETE CASCADE;


--
-- Name: portfolio_snapshots portfolio_snapshots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio_snapshots
    ADD CONSTRAINT portfolio_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: positions positions_financial_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_financial_account_id_fkey FOREIGN KEY (financial_account_id) REFERENCES public.financial_accounts(id) ON DELETE CASCADE;


--
-- Name: positions positions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_jobs refresh_jobs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_jobs
    ADD CONSTRAINT refresh_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: risk_snapshots risk_snapshots_financial_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.risk_snapshots
    ADD CONSTRAINT risk_snapshots_financial_account_id_fkey FOREIGN KEY (financial_account_id) REFERENCES public.financial_accounts(id) ON DELETE CASCADE;


--
-- Name: risk_snapshots risk_snapshots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.risk_snapshots
    ADD CONSTRAINT risk_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: savings_goals savings_goals_financial_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_goals
    ADD CONSTRAINT savings_goals_financial_account_id_fkey FOREIGN KEY (financial_account_id) REFERENCES public.financial_accounts(id) ON DELETE SET NULL;


--
-- Name: savings_goals savings_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_goals
    ADD CONSTRAINT savings_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: spending_snapshots spending_snapshots_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spending_snapshots
    ADD CONSTRAINT spending_snapshots_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.budget_categories(id) ON DELETE SET NULL;


--
-- Name: spending_snapshots spending_snapshots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spending_snapshots
    ADD CONSTRAINT spending_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sync_logs sync_logs_integration_connection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_integration_connection_id_fkey FOREIGN KEY (integration_connection_id) REFERENCES public.integration_connections(id);


--
-- Name: sync_logs sync_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: tax_estimates tax_estimates_jurisdiction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_estimates
    ADD CONSTRAINT tax_estimates_jurisdiction_id_fkey FOREIGN KEY (jurisdiction_id) REFERENCES public.jurisdictions(id) ON DELETE CASCADE;


--
-- Name: tax_estimates tax_estimates_tax_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_estimates
    ADD CONSTRAINT tax_estimates_tax_profile_id_fkey FOREIGN KEY (tax_profile_id) REFERENCES public.tax_profiles(id) ON DELETE CASCADE;


--
-- Name: tax_estimates tax_estimates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_estimates
    ADD CONSTRAINT tax_estimates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tax_payments tax_payments_jurisdiction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_payments
    ADD CONSTRAINT tax_payments_jurisdiction_id_fkey FOREIGN KEY (jurisdiction_id) REFERENCES public.jurisdictions(id) ON DELETE CASCADE;


--
-- Name: tax_payments tax_payments_tax_estimate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_payments
    ADD CONSTRAINT tax_payments_tax_estimate_id_fkey FOREIGN KEY (tax_estimate_id) REFERENCES public.tax_estimates(id) ON DELETE SET NULL;


--
-- Name: tax_payments tax_payments_tax_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_payments
    ADD CONSTRAINT tax_payments_tax_profile_id_fkey FOREIGN KEY (tax_profile_id) REFERENCES public.tax_profiles(id) ON DELETE CASCADE;


--
-- Name: tax_payments tax_payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_payments
    ADD CONSTRAINT tax_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tax_profiles tax_profiles_jurisdiction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_profiles
    ADD CONSTRAINT tax_profiles_jurisdiction_id_fkey FOREIGN KEY (jurisdiction_id) REFERENCES public.jurisdictions(id);


--
-- Name: tax_profiles tax_profiles_state_jurisdiction_id_2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_profiles
    ADD CONSTRAINT tax_profiles_state_jurisdiction_id_2_fkey FOREIGN KEY (state_jurisdiction_id_2) REFERENCES public.jurisdictions(id);


--
-- Name: tax_profiles tax_profiles_state_jurisdiction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_profiles
    ADD CONSTRAINT tax_profiles_state_jurisdiction_id_fkey FOREIGN KEY (state_jurisdiction_id) REFERENCES public.jurisdictions(id);


--
-- Name: tax_profiles tax_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_profiles
    ADD CONSTRAINT tax_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tax_rates tax_rates_jurisdiction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rates
    ADD CONSTRAINT tax_rates_jurisdiction_id_fkey FOREIGN KEY (jurisdiction_id) REFERENCES public.jurisdictions(id) ON DELETE CASCADE;


--
-- Name: trade_journal trade_journal_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trade_journal
    ADD CONSTRAINT trade_journal_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id) ON DELETE CASCADE;


--
-- Name: trade_journal trade_journal_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trade_journal
    ADD CONSTRAINT trade_journal_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: trades trades_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: transactions transactions_financial_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_financial_account_id_fkey FOREIGN KEY (financial_account_id) REFERENCES public.financial_accounts(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: trend_snapshots trend_snapshots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trend_snapshots
    ADD CONSTRAINT trend_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: write_offs write_offs_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.write_offs
    ADD CONSTRAINT write_offs_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);


--
-- Name: write_offs write_offs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.write_offs
    ADD CONSTRAINT write_offs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: sync_logs Users can view own sync_logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own sync_logs" ON public.sync_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: account_balance_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.account_balance_history ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_context_cache; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ai_context_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_usage_limits; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_usage_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: alerts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: assistant_conversations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: assistant_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: assistant_tool_registry; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.assistant_tool_registry ENABLE ROW LEVEL SECURITY;

--
-- Name: budget_categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: budget_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.budget_records ENABLE ROW LEVEL SECURITY;

--
-- Name: envelope_transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.envelope_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: envelopes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.envelopes ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_flag_plans; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.feature_flag_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_flag_user_overrides; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.feature_flag_user_overrides ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_flags; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_accounts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: integration_connections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

--
-- Name: jurisdictions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.jurisdictions ENABLE ROW LEVEL SECURITY;

--
-- Name: jurisdictions jurisdictions_public_read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY jurisdictions_public_read ON public.jurisdictions FOR SELECT USING (true);


--
-- Name: portfolio_snapshots; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: positions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

--
-- Name: feature_flag_plans public_read_feature_flag_plans; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_read_feature_flag_plans ON public.feature_flag_plans FOR SELECT USING (true);


--
-- Name: feature_flags public_read_feature_flags; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY public_read_feature_flags ON public.feature_flags FOR SELECT USING (true);


--
-- Name: refresh_jobs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.refresh_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: risk_snapshots; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.risk_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: savings_goals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_context_cache service_role_delete_ai_context; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_ai_context ON public.ai_context_cache FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: ai_usage_logs service_role_delete_ai_usage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_ai_usage ON public.ai_usage_logs FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: alerts service_role_delete_alerts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_alerts ON public.alerts FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: account_balance_history service_role_delete_balance_history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_balance_history ON public.account_balance_history FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: budget_categories service_role_delete_budget_categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_budget_categories ON public.budget_categories FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: budget_records service_role_delete_budget_records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_budget_records ON public.budget_records FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: assistant_conversations service_role_delete_conversations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_conversations ON public.assistant_conversations FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: assistant_messages service_role_delete_messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_messages ON public.assistant_messages FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: portfolio_snapshots service_role_delete_portfolio_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_portfolio_snapshots ON public.portfolio_snapshots FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: positions service_role_delete_positions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_positions ON public.positions FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: risk_snapshots service_role_delete_risk_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_risk_snapshots ON public.risk_snapshots FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: savings_goals service_role_delete_savings_goals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_savings_goals ON public.savings_goals FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: spending_snapshots service_role_delete_spending_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_spending_snapshots ON public.spending_snapshots FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: tax_estimates service_role_delete_tax_estimates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_tax_estimates ON public.tax_estimates FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: tax_payments service_role_delete_tax_payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_tax_payments ON public.tax_payments FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: tax_profiles service_role_delete_tax_profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_tax_profiles ON public.tax_profiles FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: transactions service_role_delete_transactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_transactions ON public.transactions FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: trend_snapshots service_role_delete_trend_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_delete_trend_snapshots ON public.trend_snapshots FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: financial_accounts service_role_hard_delete_only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_hard_delete_only ON public.financial_accounts FOR DELETE USING ((auth.role() = 'service_role'::text));


--
-- Name: ai_context_cache service_role_insert_ai_context; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_insert_ai_context ON public.ai_context_cache FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: ai_usage_logs service_role_insert_ai_usage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_insert_ai_usage ON public.ai_usage_logs FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: alerts service_role_insert_alerts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_insert_alerts ON public.alerts FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: account_balance_history service_role_insert_balance_history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_insert_balance_history ON public.account_balance_history FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: portfolio_snapshots service_role_insert_portfolio_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_insert_portfolio_snapshots ON public.portfolio_snapshots FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: risk_snapshots service_role_insert_risk_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_insert_risk_snapshots ON public.risk_snapshots FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: spending_snapshots service_role_insert_spending_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_insert_spending_snapshots ON public.spending_snapshots FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: tax_estimates service_role_insert_tax_estimates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_insert_tax_estimates ON public.tax_estimates FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: trend_snapshots service_role_insert_trend_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_insert_trend_snapshots ON public.trend_snapshots FOR INSERT WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: feature_flag_plans service_role_manage_feature_flag_plans; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_manage_feature_flag_plans ON public.feature_flag_plans USING ((auth.role() = 'service_role'::text));


--
-- Name: feature_flags service_role_manage_feature_flags; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_manage_feature_flags ON public.feature_flags USING ((auth.role() = 'service_role'::text));


--
-- Name: ai_usage_limits service_role_manage_limits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_manage_limits ON public.ai_usage_limits USING ((auth.role() = 'service_role'::text));


--
-- Name: user_profiles service_role_manage_profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_manage_profiles ON public.user_profiles USING ((auth.role() = 'service_role'::text));


--
-- Name: refresh_jobs service_role_manage_refresh_jobs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_manage_refresh_jobs ON public.refresh_jobs USING ((auth.role() = 'service_role'::text));


--
-- Name: assistant_tool_registry service_role_manage_tools; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_manage_tools ON public.assistant_tool_registry USING ((auth.role() = 'service_role'::text));


--
-- Name: feature_flag_user_overrides service_role_manage_user_feature_flags; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_manage_user_feature_flags ON public.feature_flag_user_overrides USING ((auth.role() = 'service_role'::text));


--
-- Name: ai_context_cache service_role_update_ai_context; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_update_ai_context ON public.ai_context_cache FOR UPDATE USING ((auth.role() = 'service_role'::text));


--
-- Name: account_balance_history service_role_update_balance_history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_update_balance_history ON public.account_balance_history FOR UPDATE USING ((auth.role() = 'service_role'::text));


--
-- Name: assistant_messages service_role_update_messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_update_messages ON public.assistant_messages FOR UPDATE USING ((auth.role() = 'service_role'::text));


--
-- Name: portfolio_snapshots service_role_update_portfolio_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_update_portfolio_snapshots ON public.portfolio_snapshots FOR UPDATE USING ((auth.role() = 'service_role'::text));


--
-- Name: risk_snapshots service_role_update_risk_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_update_risk_snapshots ON public.risk_snapshots FOR UPDATE USING ((auth.role() = 'service_role'::text));


--
-- Name: spending_snapshots service_role_update_spending_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_update_spending_snapshots ON public.spending_snapshots FOR UPDATE USING ((auth.role() = 'service_role'::text));


--
-- Name: tax_estimates service_role_update_tax_estimates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_update_tax_estimates ON public.tax_estimates FOR UPDATE USING ((auth.role() = 'service_role'::text));


--
-- Name: trend_snapshots service_role_update_trend_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY service_role_update_trend_snapshots ON public.trend_snapshots FOR UPDATE USING ((auth.role() = 'service_role'::text));


--
-- Name: spending_snapshots; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.spending_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: sync_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: tax_estimates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tax_estimates ENABLE ROW LEVEL SECURITY;

--
-- Name: tax_payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tax_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: tax_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: tax_rates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: trade_journal; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.trade_journal ENABLE ROW LEVEL SECURITY;

--
-- Name: trade_journal trade_journal_user_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY trade_journal_user_policy ON public.trade_journal USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: trades; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

--
-- Name: trades trades_user_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY trades_user_policy ON public.trades USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: trend_snapshots; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.trend_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: alerts users_delete_own_alerts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_delete_own_alerts ON public.alerts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: integration_connections users_delete_own_connections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_delete_own_connections ON public.integration_connections FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: financial_accounts users_insert_own_accounts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_own_accounts ON public.financial_accounts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: alerts users_insert_own_alerts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_own_alerts ON public.alerts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: budget_categories users_insert_own_budget_categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_own_budget_categories ON public.budget_categories FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: budget_records users_insert_own_budget_records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_own_budget_records ON public.budget_records FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: integration_connections users_insert_own_connections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_own_connections ON public.integration_connections FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: assistant_conversations users_insert_own_conversations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_own_conversations ON public.assistant_conversations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: assistant_messages users_insert_own_messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_own_messages ON public.assistant_messages FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: positions users_insert_own_positions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_own_positions ON public.positions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: savings_goals users_insert_own_savings_goals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_own_savings_goals ON public.savings_goals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: tax_payments users_insert_own_tax_payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_own_tax_payments ON public.tax_payments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: tax_profiles users_insert_own_tax_profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_own_tax_profiles ON public.tax_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: transactions users_insert_own_transactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_own_transactions ON public.transactions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: envelope_transactions users_own_envelope_transactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_own_envelope_transactions ON public.envelope_transactions USING ((auth.uid() = user_id));


--
-- Name: envelopes users_own_envelopes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_own_envelopes ON public.envelopes USING ((auth.uid() = user_id));


--
-- Name: assistant_tool_registry users_select_active_tools; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_active_tools ON public.assistant_tool_registry FOR SELECT USING ((is_active = true));


--
-- Name: financial_accounts users_select_own_accounts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_accounts ON public.financial_accounts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_context_cache users_select_own_ai_context; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_ai_context ON public.ai_context_cache FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_usage_logs users_select_own_ai_usage; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_ai_usage ON public.ai_usage_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: alerts users_select_own_alerts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_alerts ON public.alerts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: account_balance_history users_select_own_balance_history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_balance_history ON public.account_balance_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: budget_categories users_select_own_budget_categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_budget_categories ON public.budget_categories FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: budget_records users_select_own_budget_records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_budget_records ON public.budget_records FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: integration_connections users_select_own_connections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_connections ON public.integration_connections FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: assistant_conversations users_select_own_conversations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_conversations ON public.assistant_conversations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: feature_flag_user_overrides users_select_own_feature_flags; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_feature_flags ON public.feature_flag_user_overrides FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_usage_limits users_select_own_limits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_limits ON public.ai_usage_limits FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: assistant_messages users_select_own_messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_messages ON public.assistant_messages FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: portfolio_snapshots users_select_own_portfolio_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_portfolio_snapshots ON public.portfolio_snapshots FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: positions users_select_own_positions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_positions ON public.positions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_profiles users_select_own_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_profile ON public.user_profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: refresh_jobs users_select_own_refresh_jobs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_refresh_jobs ON public.refresh_jobs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: risk_snapshots users_select_own_risk_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_risk_snapshots ON public.risk_snapshots FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: savings_goals users_select_own_savings_goals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_savings_goals ON public.savings_goals FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: spending_snapshots users_select_own_spending_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_spending_snapshots ON public.spending_snapshots FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tax_estimates users_select_own_tax_estimates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_tax_estimates ON public.tax_estimates FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tax_payments users_select_own_tax_payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_tax_payments ON public.tax_payments FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tax_profiles users_select_own_tax_profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_tax_profiles ON public.tax_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: transactions users_select_own_transactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_transactions ON public.transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: trend_snapshots users_select_own_trend_snapshots; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own_trend_snapshots ON public.trend_snapshots FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: financial_accounts users_soft_delete_own_accounts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_soft_delete_own_accounts ON public.financial_accounts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: financial_accounts users_update_own_accounts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_update_own_accounts ON public.financial_accounts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: alerts users_update_own_alerts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_update_own_alerts ON public.alerts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: budget_categories users_update_own_budget_categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_update_own_budget_categories ON public.budget_categories FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: budget_records users_update_own_budget_records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_update_own_budget_records ON public.budget_records FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: integration_connections users_update_own_connections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_update_own_connections ON public.integration_connections FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: assistant_conversations users_update_own_conversations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_update_own_conversations ON public.assistant_conversations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: positions users_update_own_positions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_update_own_positions ON public.positions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_profiles users_update_own_profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_update_own_profile ON public.user_profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: savings_goals users_update_own_savings_goals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_update_own_savings_goals ON public.savings_goals FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: tax_payments users_update_own_tax_payments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_update_own_tax_payments ON public.tax_payments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: tax_profiles users_update_own_tax_profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_update_own_tax_profiles ON public.tax_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: transactions users_update_own_transactions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_update_own_transactions ON public.transactions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: write_offs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.write_offs ENABLE ROW LEVEL SECURITY;

--
-- Name: write_offs write_offs_user_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY write_offs_user_policy ON public.write_offs USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION rls_auto_enable(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE webauthn_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_challenges TO postgres;
GRANT ALL ON TABLE auth.webauthn_challenges TO dashboard_user;


--
-- Name: TABLE webauthn_credentials; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_credentials TO postgres;
GRANT ALL ON TABLE auth.webauthn_credentials TO dashboard_user;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE account_balance_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.account_balance_history TO anon;
GRANT ALL ON TABLE public.account_balance_history TO authenticated;
GRANT ALL ON TABLE public.account_balance_history TO service_role;


--
-- Name: TABLE ai_context_cache; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ai_context_cache TO anon;
GRANT ALL ON TABLE public.ai_context_cache TO authenticated;
GRANT ALL ON TABLE public.ai_context_cache TO service_role;


--
-- Name: TABLE ai_usage_limits; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ai_usage_limits TO anon;
GRANT ALL ON TABLE public.ai_usage_limits TO authenticated;
GRANT ALL ON TABLE public.ai_usage_limits TO service_role;


--
-- Name: TABLE ai_usage_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ai_usage_logs TO anon;
GRANT ALL ON TABLE public.ai_usage_logs TO authenticated;
GRANT ALL ON TABLE public.ai_usage_logs TO service_role;


--
-- Name: TABLE alerts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.alerts TO anon;
GRANT ALL ON TABLE public.alerts TO authenticated;
GRANT ALL ON TABLE public.alerts TO service_role;


--
-- Name: TABLE assistant_conversations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assistant_conversations TO anon;
GRANT ALL ON TABLE public.assistant_conversations TO authenticated;
GRANT ALL ON TABLE public.assistant_conversations TO service_role;


--
-- Name: TABLE assistant_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assistant_messages TO anon;
GRANT ALL ON TABLE public.assistant_messages TO authenticated;
GRANT ALL ON TABLE public.assistant_messages TO service_role;


--
-- Name: TABLE assistant_tool_registry; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.assistant_tool_registry TO anon;
GRANT ALL ON TABLE public.assistant_tool_registry TO authenticated;
GRANT ALL ON TABLE public.assistant_tool_registry TO service_role;


--
-- Name: TABLE budget_categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.budget_categories TO anon;
GRANT ALL ON TABLE public.budget_categories TO authenticated;
GRANT ALL ON TABLE public.budget_categories TO service_role;


--
-- Name: TABLE budget_records; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.budget_records TO anon;
GRANT ALL ON TABLE public.budget_records TO authenticated;
GRANT ALL ON TABLE public.budget_records TO service_role;


--
-- Name: TABLE envelope_transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.envelope_transactions TO anon;
GRANT ALL ON TABLE public.envelope_transactions TO authenticated;
GRANT ALL ON TABLE public.envelope_transactions TO service_role;


--
-- Name: TABLE envelopes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.envelopes TO anon;
GRANT ALL ON TABLE public.envelopes TO authenticated;
GRANT ALL ON TABLE public.envelopes TO service_role;


--
-- Name: TABLE feature_flag_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.feature_flag_plans TO anon;
GRANT ALL ON TABLE public.feature_flag_plans TO authenticated;
GRANT ALL ON TABLE public.feature_flag_plans TO service_role;


--
-- Name: TABLE feature_flag_user_overrides; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.feature_flag_user_overrides TO anon;
GRANT ALL ON TABLE public.feature_flag_user_overrides TO authenticated;
GRANT ALL ON TABLE public.feature_flag_user_overrides TO service_role;


--
-- Name: TABLE feature_flags; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.feature_flags TO anon;
GRANT ALL ON TABLE public.feature_flags TO authenticated;
GRANT ALL ON TABLE public.feature_flags TO service_role;


--
-- Name: TABLE financial_accounts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.financial_accounts TO anon;
GRANT ALL ON TABLE public.financial_accounts TO authenticated;
GRANT ALL ON TABLE public.financial_accounts TO service_role;


--
-- Name: TABLE integration_connections; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.integration_connections TO anon;
GRANT ALL ON TABLE public.integration_connections TO authenticated;
GRANT ALL ON TABLE public.integration_connections TO service_role;


--
-- Name: TABLE jurisdictions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.jurisdictions TO anon;
GRANT ALL ON TABLE public.jurisdictions TO authenticated;
GRANT ALL ON TABLE public.jurisdictions TO service_role;


--
-- Name: TABLE portfolio_snapshots; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.portfolio_snapshots TO anon;
GRANT ALL ON TABLE public.portfolio_snapshots TO authenticated;
GRANT ALL ON TABLE public.portfolio_snapshots TO service_role;


--
-- Name: TABLE positions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.positions TO anon;
GRANT ALL ON TABLE public.positions TO authenticated;
GRANT ALL ON TABLE public.positions TO service_role;


--
-- Name: TABLE refresh_jobs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.refresh_jobs TO anon;
GRANT ALL ON TABLE public.refresh_jobs TO authenticated;
GRANT ALL ON TABLE public.refresh_jobs TO service_role;


--
-- Name: TABLE risk_snapshots; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.risk_snapshots TO anon;
GRANT ALL ON TABLE public.risk_snapshots TO authenticated;
GRANT ALL ON TABLE public.risk_snapshots TO service_role;


--
-- Name: TABLE savings_goals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.savings_goals TO anon;
GRANT ALL ON TABLE public.savings_goals TO authenticated;
GRANT ALL ON TABLE public.savings_goals TO service_role;


--
-- Name: TABLE spending_snapshots; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.spending_snapshots TO anon;
GRANT ALL ON TABLE public.spending_snapshots TO authenticated;
GRANT ALL ON TABLE public.spending_snapshots TO service_role;


--
-- Name: TABLE sync_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sync_logs TO anon;
GRANT ALL ON TABLE public.sync_logs TO authenticated;
GRANT ALL ON TABLE public.sync_logs TO service_role;


--
-- Name: TABLE tax_estimates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tax_estimates TO anon;
GRANT ALL ON TABLE public.tax_estimates TO authenticated;
GRANT ALL ON TABLE public.tax_estimates TO service_role;


--
-- Name: TABLE tax_payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tax_payments TO anon;
GRANT ALL ON TABLE public.tax_payments TO authenticated;
GRANT ALL ON TABLE public.tax_payments TO service_role;


--
-- Name: TABLE tax_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tax_profiles TO anon;
GRANT ALL ON TABLE public.tax_profiles TO authenticated;
GRANT ALL ON TABLE public.tax_profiles TO service_role;


--
-- Name: TABLE tax_rates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tax_rates TO anon;
GRANT ALL ON TABLE public.tax_rates TO authenticated;
GRANT ALL ON TABLE public.tax_rates TO service_role;


--
-- Name: TABLE trade_journal; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.trade_journal TO anon;
GRANT ALL ON TABLE public.trade_journal TO authenticated;
GRANT ALL ON TABLE public.trade_journal TO service_role;


--
-- Name: TABLE trades; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.trades TO anon;
GRANT ALL ON TABLE public.trades TO authenticated;
GRANT ALL ON TABLE public.trades TO service_role;


--
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.transactions TO anon;
GRANT ALL ON TABLE public.transactions TO authenticated;
GRANT ALL ON TABLE public.transactions TO service_role;


--
-- Name: TABLE trend_snapshots; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.trend_snapshots TO anon;
GRANT ALL ON TABLE public.trend_snapshots TO authenticated;
GRANT ALL ON TABLE public.trend_snapshots TO service_role;


--
-- Name: TABLE user_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_profiles TO anon;
GRANT ALL ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_profiles TO service_role;


--
-- Name: TABLE write_offs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.write_offs TO anon;
GRANT ALL ON TABLE public.write_offs TO authenticated;
GRANT ALL ON TABLE public.write_offs TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: ensure_rls; Type: EVENT TRIGGER; Schema: -; Owner: postgres
--

CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
         WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
   EXECUTE FUNCTION public.rls_auto_enable();


ALTER EVENT TRIGGER ensure_rls OWNER TO postgres;

--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict vEacFUbFYgsSahnmoF9WhiBqiib48r3f2KR4yWOIPQQ0QKzPJHf558bll3uAb27

