-- Add RLS policy to v_tool_movement view
ALTER TABLE v_tool_movement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tool movements" 
ON v_tool_movement 
FOR SELECT 
USING (user_id = auth.uid());