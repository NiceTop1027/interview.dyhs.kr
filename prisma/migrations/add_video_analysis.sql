-- Add aiVideoAnalysis column to exam_sessions table
ALTER TABLE exam_sessions 
ADD COLUMN IF NOT EXISTS aiVideoAnalysis JSONB;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_exam_sessions_ai_video_analysis 
ON exam_sessions USING GIN (aiVideoAnalysis);

-- Add comment for documentation
COMMENT ON COLUMN exam_sessions.aiVideoAnalysis IS 'Detailed AI video analysis results including facial expressions, speech analysis, and behavioral patterns';
