-- RLS状態を確認する関数
CREATE OR REPLACE FUNCTION check_rls_status(table_name text)
RETURNS TABLE (rls_enabled boolean) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT relrowsecurity
  FROM pg_class
  WHERE relname = table_name
  AND relnamespace = (
    SELECT oid 
    FROM pg_namespace 
    WHERE nspname = 'public'
  );
END;
$$;

-- 関数の権限を設定
GRANT EXECUTE ON FUNCTION check_rls_status(text) TO anon, authenticated;