-- ============================================
-- SISTEMA DE MONITOREO Y LOGGING - SUPABASE
-- Ejecutar en SQL Editor
-- ============================================

-- 1. Tabla de logs de rendimiento
-- Diseño optimizado para writes rápidos y queries eficientes
CREATE TABLE IF NOT EXISTS public.performance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Identificación del request
  endpoint text NOT NULL,
  method text NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  
  -- Métricas de rendimiento
  duration_ms integer NOT NULL CHECK (duration_ms >= 0),
  status_code integer,
  
  -- Contexto multi-tenant
  user_id uuid REFERENCES auth.users(id),
  business_id uuid REFERENCES public.businesses(id),
  
  -- Metadata adicional
  user_agent text,
  ip_address text,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 2. Índices optimizados para queries comunes

-- Queries por rango de tiempo (dashboard principal)
CREATE INDEX IF NOT EXISTS performance_logs_time_idx 
ON public.performance_logs(created_at DESC);

-- Queries por endpoint (análisis de rendimiento)
CREATE INDEX IF NOT EXISTS performance_logs_endpoint_idx 
ON public.performance_logs(endpoint, created_at DESC);

-- Queries por negocio (filtros de tenant)
CREATE INDEX IF NOT EXISTS performance_logs_business_idx 
ON public.performance_logs(business_id, created_at DESC);

-- Queries por usuario (debug de problemas)
CREATE INDEX IF NOT EXISTS performance_logs_user_idx 
ON public.performance_logs(user_id, created_at DESC);

-- Queries de errores (detección rápida)
CREATE INDEX IF NOT EXISTS performance_logs_error_idx 
ON public.performance_logs(created_at DESC) 
WHERE status_code >= 400 OR error_message IS NOT NULL;

-- Queries de endpoints lentos (>1s)
CREATE INDEX IF NOT EXISTS performance_logs_slow_idx 
ON public.performance_logs(created_at DESC) 
WHERE duration_ms > 1000;

-- 3. Función para inserción rápida (fire-and-forget)
CREATE OR REPLACE FUNCTION public.log_performance(
  p_endpoint text,
  p_method text,
  p_duration_ms integer,
  p_status_code integer DEFAULT 200,
  p_user_id uuid DEFAULT null,
  p_business_id uuid DEFAULT null,
  p_user_agent text DEFAULT null,
  p_ip_address text DEFAULT null,
  p_error_message text DEFAULT null,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  INSERT INTO public.performance_logs (
    endpoint, method, duration_ms, status_code,
    user_id, business_id, user_agent, ip_address,
    error_message, metadata
  ) VALUES (
    p_endpoint, p_method, p_duration_ms, p_status_code,
    p_user_id, p_business_id, p_user_agent, p_ip_address,
    p_error_message, p_metadata
  );
END;
$$;

-- Revocar acceso público, permitir escritura desde el servidor
REVOKE ALL ON public.performance_logs FROM public;
GRANT INSERT ON public.performance_logs TO authenticated;
GRANT SELECT ON public.performance_logs TO authenticated;

REVOKE ALL ON FUNCTION public.log_performance FROM public;
GRANT EXECUTE ON FUNCTION public.log_performance TO authenticated;

-- 4. Función para métricas agregadas (p95, p99, avg, count, errors)
CREATE OR REPLACE FUNCTION public.get_performance_metrics(
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_endpoint text DEFAULT null,
  p_business_id uuid DEFAULT null
)
RETURNS TABLE (
  endpoint text,
  method text,
  total_requests bigint,
  avg_duration_ms numeric,
  p50_duration_ms numeric,
  p95_duration_ms numeric,
  p99_duration_ms numeric,
  min_duration_ms numeric,
  max_duration_ms numeric,
  error_count bigint,
  error_rate numeric
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.endpoint,
    pl.method,
    COUNT(*)::bigint AS total_requests,
    AVG(pl.duration_ms)::numeric AS avg_duration_ms,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY pl.duration_ms)::numeric AS p50_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pl.duration_ms)::numeric AS p95_duration_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY pl.duration_ms)::numeric AS p99_duration_ms,
    MIN(pl.duration_ms)::numeric AS min_duration_ms,
    MAX(pl.duration_ms)::numeric AS max_duration_ms,
    COUNT(*) FILTER (WHERE pl.status_code >= 400 OR pl.error_message IS NOT NULL)::bigint AS error_count,
    (COUNT(*) FILTER (WHERE pl.status_code >= 400 OR pl.error_message IS NOT NULL)::numeric / NULLIF(COUNT(*), 0) * 100)::numeric AS error_rate
  FROM public.performance_logs pl
  WHERE pl.created_at >= p_start_time
    AND pl.created_at < p_end_time
    AND (p_endpoint IS NULL OR pl.endpoint = p_endpoint)
    AND (p_business_id IS NULL OR pl.business_id = p_business_id)
  GROUP BY pl.endpoint, pl.method
  ORDER BY total_requests DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_performance_metrics TO authenticated;

-- 5. Función para trending (requests por minuto)
CREATE OR REPLACE FUNCTION public.get_performance_trend(
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_interval_minutes int DEFAULT 5
)
RETURNS TABLE (
  time_bucket timestamptz,
  total_requests bigint,
  avg_duration_ms numeric,
  error_count bigint
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('minute', pl.created_at) - (EXTRACT(minute FROM pl.created_at)::int % p_interval_minutes) * interval '1 minute' AS time_bucket,
    COUNT(*)::bigint AS total_requests,
    AVG(pl.duration_ms)::numeric AS avg_duration_ms,
    COUNT(*) FILTER (WHERE pl.status_code >= 400 OR pl.error_message IS NOT NULL)::bigint AS error_count
  FROM public.performance_logs pl
  WHERE pl.created_at >= p_start_time AND pl.created_at < p_end_time
  GROUP BY time_bucket
  ORDER BY time_bucket;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_performance_trend TO authenticated;

-- 6. Función para endpoints más lentos
CREATE OR REPLACE FUNCTION public.get_slow_endpoints(
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_threshold_ms int DEFAULT 1000,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  endpoint text,
  method text,
  call_count bigint,
  avg_duration_ms numeric,
  p95_duration_ms numeric,
  slow_calls bigint,
  error_count bigint
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.endpoint,
    pl.method,
    COUNT(*)::bigint AS call_count,
    AVG(pl.duration_ms)::numeric AS avg_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pl.duration_ms)::numeric AS p95_duration_ms,
    COUNT(*) FILTER (WHERE pl.duration_ms > p_threshold_ms)::bigint AS slow_calls,
    COUNT(*) FILTER (WHERE pl.status_code >= 400 OR pl.error_message IS NOT NULL)::bigint AS error_count
  FROM public.performance_logs pl
  WHERE pl.created_at >= p_start_time AND pl.created_at < p_end_time
  GROUP BY pl.endpoint, pl.method
  HAVING AVG(pl.duration_ms) > p_threshold_ms OR COUNT(*) FILTER (WHERE pl.duration_ms > p_threshold_ms) > 0
  ORDER BY avg_duration_ms DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_slow_endpoints TO authenticated;

-- 7. Función para errores recientes
CREATE OR REPLACE FUNCTION public.get_recent_errors(
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  endpoint text,
  method text,
  duration_ms integer,
  status_code integer,
  user_id uuid,
  business_id uuid,
  error_message text,
  metadata jsonb
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.id,
    pl.created_at,
    pl.endpoint,
    pl.method,
    pl.duration_ms,
    pl.status_code,
    pl.user_id,
    pl.business_id,
    pl.error_message,
    pl.metadata
  FROM public.performance_logs pl
  WHERE pl.created_at >= p_start_time 
    AND pl.created_at < p_end_time
    AND (pl.status_code >= 400 OR pl.error_message IS NOT NULL)
  ORDER BY pl.created_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_recent_errors TO authenticated;

-- 8. Limpieza automática (retention de 30 días)
-- Crear función de cleanup
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  DELETE FROM public.performance_logs
  WHERE created_at < now() - interval '30 days';
END;
$$;

-- Agregar a Supabase cron (configuración manual en dashboard de Supabase)
-- SELECT cron.schedule('cleanup-logs', '0 3 * * *', SELECT public.cleanup_old_logs());