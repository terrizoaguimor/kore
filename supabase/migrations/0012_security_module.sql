-- ============================================
-- KORE Security Module Schema
-- ============================================

-- Security Visits (Traffic Monitoring)
CREATE TABLE IF NOT EXISTS security_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  path TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  status_code INTEGER,
  country TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_bot BOOLEAN DEFAULT FALSE,
  is_suspicious BOOLEAN DEFAULT FALSE,
  threat_level TEXT DEFAULT 'none' CHECK (threat_level IN ('none', 'low', 'medium', 'high', 'critical')),
  response_time_ms INTEGER,
  detection JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for security_visits
CREATE INDEX IF NOT EXISTS idx_security_visits_ip ON security_visits(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_visits_created ON security_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_visits_suspicious ON security_visits(is_suspicious) WHERE is_suspicious = TRUE;
CREATE INDEX IF NOT EXISTS idx_security_visits_threat ON security_visits(threat_level) WHERE threat_level != 'none';
CREATE INDEX IF NOT EXISTS idx_security_visits_geo ON security_visits(latitude, longitude) WHERE latitude IS NOT NULL;

-- Blocked IPs
CREATE TABLE IF NOT EXISTS security_blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_permanent BOOLEAN DEFAULT FALSE,
  blocked_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for blocked IPs
CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON security_blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires ON security_blocked_ips(expires_at) WHERE expires_at IS NOT NULL;

-- Security Alerts
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'high', 'critical')),
  ip_address TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for security_alerts
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created ON security_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_unresolved ON security_alerts(is_resolved) WHERE is_resolved = FALSE;

-- Rate Limits
CREATE TABLE IF NOT EXISTS security_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ip_address, endpoint, window_start)
);

-- Create indexes for rate_limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON security_rate_limits(ip_address, endpoint, window_start);

-- API Security Log (detailed request logging)
CREATE TABLE IF NOT EXISTS security_api_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  request_headers JSONB,
  request_body JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  is_attack_attempt BOOLEAN DEFAULT FALSE,
  attack_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for API log
CREATE INDEX IF NOT EXISTS idx_api_log_ip ON security_api_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_api_log_endpoint ON security_api_log(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_log_created ON security_api_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_log_attacks ON security_api_log(is_attack_attempt) WHERE is_attack_attempt = TRUE;

-- ============================================
-- RLS Policies for Security Tables
-- ============================================

-- Enable RLS
ALTER TABLE security_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_api_log ENABLE ROW LEVEL SECURITY;

-- Security visits - Admin/Owner can view all
CREATE POLICY "Admins can view security visits"
ON security_visits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Security visits - System can insert (service role)
CREATE POLICY "System can insert security visits"
ON security_visits FOR INSERT
WITH CHECK (true);

-- Blocked IPs - Admin/Owner can view
CREATE POLICY "Admins can view blocked IPs"
ON security_blocked_ips FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Blocked IPs - Admin/Owner can manage
CREATE POLICY "Admins can manage blocked IPs"
ON security_blocked_ips FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Security alerts - Admin/Owner can view
CREATE POLICY "Admins can view security alerts"
ON security_alerts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Security alerts - System can insert
CREATE POLICY "System can insert security alerts"
ON security_alerts FOR INSERT
WITH CHECK (true);

-- Security alerts - Admin can update (resolve)
CREATE POLICY "Admins can update security alerts"
ON security_alerts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- Rate limits - Full access for system
CREATE POLICY "System access to rate limits"
ON security_rate_limits FOR ALL
USING (true)
WITH CHECK (true);

-- API log - Admin can view
CREATE POLICY "Admins can view API log"
ON security_api_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  )
);

-- API log - System can insert
CREATE POLICY "System can insert API log"
ON security_api_log FOR INSERT
WITH CHECK (true);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to clean up old security data
CREATE OR REPLACE FUNCTION cleanup_old_security_data(days_to_keep INTEGER DEFAULT 30)
RETURNS void AS $$
DECLARE
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := NOW() - (days_to_keep || ' days')::INTERVAL;

  DELETE FROM security_visits WHERE created_at < cutoff_date;
  DELETE FROM security_api_log WHERE created_at < cutoff_date;
  DELETE FROM security_rate_limits WHERE window_start < cutoff_date;
  DELETE FROM security_blocked_ips WHERE expires_at < NOW() AND is_permanent = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get security stats
CREATE OR REPLACE FUNCTION get_security_stats(hours_back INTEGER DEFAULT 24)
RETURNS JSON AS $$
DECLARE
  since_time TIMESTAMPTZ;
  result JSON;
BEGIN
  since_time := NOW() - (hours_back || ' hours')::INTERVAL;

  SELECT json_build_object(
    'total_visits', (SELECT COUNT(*) FROM security_visits WHERE created_at > since_time),
    'unique_ips', (SELECT COUNT(DISTINCT ip_address) FROM security_visits WHERE created_at > since_time),
    'suspicious_requests', (SELECT COUNT(*) FROM security_visits WHERE created_at > since_time AND is_suspicious = TRUE),
    'blocked_ips', (SELECT COUNT(*) FROM security_blocked_ips WHERE expires_at IS NULL OR expires_at > NOW()),
    'bot_visits', (SELECT COUNT(*) FROM security_visits WHERE created_at > since_time AND is_bot = TRUE),
    'recent_alerts', (SELECT COUNT(*) FROM security_alerts WHERE created_at > since_time)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(check_ip TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM security_blocked_ips
    WHERE ip_address = check_ip
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to block an IP
CREATE OR REPLACE FUNCTION block_ip(
  p_ip_address TEXT,
  p_reason TEXT,
  p_expires_in_hours INTEGER DEFAULT NULL,
  p_blocked_by TEXT DEFAULT 'system'
)
RETURNS void AS $$
DECLARE
  expires_time TIMESTAMPTZ;
BEGIN
  IF p_expires_in_hours IS NOT NULL THEN
    expires_time := NOW() + (p_expires_in_hours || ' hours')::INTERVAL;
  END IF;

  INSERT INTO security_blocked_ips (ip_address, reason, expires_at, is_permanent, blocked_by)
  VALUES (p_ip_address, p_reason, expires_time, p_expires_in_hours IS NULL, p_blocked_by)
  ON CONFLICT (ip_address) DO UPDATE SET
    reason = EXCLUDED.reason,
    expires_at = EXCLUDED.expires_at,
    is_permanent = EXCLUDED.is_permanent,
    blocked_at = NOW();

  -- Create alert
  INSERT INTO security_alerts (alert_type, severity, ip_address, description, metadata)
  VALUES ('ip_blocked', 'warning', p_ip_address, 'IP blocked: ' || p_reason,
    json_build_object('expires_at', expires_time, 'blocked_by', p_blocked_by));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unblock an IP
CREATE OR REPLACE FUNCTION unblock_ip(p_ip_address TEXT, p_unblocked_by TEXT DEFAULT 'admin')
RETURNS BOOLEAN AS $$
DECLARE
  rows_deleted INTEGER;
BEGIN
  DELETE FROM security_blocked_ips WHERE ip_address = p_ip_address;
  GET DIAGNOSTICS rows_deleted = ROW_COUNT;

  IF rows_deleted > 0 THEN
    INSERT INTO security_alerts (alert_type, severity, ip_address, description)
    VALUES ('ip_unblocked', 'info', p_ip_address, 'IP unblocked by ' || p_unblocked_by);
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log a visit
CREATE OR REPLACE FUNCTION log_security_visit(
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_path TEXT,
  p_method TEXT DEFAULT 'GET',
  p_status_code INTEGER DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL,
  p_is_bot BOOLEAN DEFAULT FALSE,
  p_is_suspicious BOOLEAN DEFAULT FALSE,
  p_threat_level TEXT DEFAULT 'none',
  p_response_time_ms INTEGER DEFAULT NULL,
  p_detection JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  visit_id UUID;
BEGIN
  INSERT INTO security_visits (
    ip_address, user_agent, path, method, status_code,
    country, city, latitude, longitude,
    is_bot, is_suspicious, threat_level, response_time_ms, detection
  ) VALUES (
    p_ip_address, p_user_agent, p_path, p_method, p_status_code,
    p_country, p_city, p_latitude, p_longitude,
    p_is_bot, p_is_suspicious, p_threat_level, p_response_time_ms, p_detection
  )
  RETURNING id INTO visit_id;

  RETURN visit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_old_security_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_security_stats TO authenticated;
GRANT EXECUTE ON FUNCTION is_ip_blocked TO anon, authenticated;
GRANT EXECUTE ON FUNCTION block_ip TO authenticated;
GRANT EXECUTE ON FUNCTION unblock_ip TO authenticated;
GRANT EXECUTE ON FUNCTION log_security_visit TO anon, authenticated, service_role;
