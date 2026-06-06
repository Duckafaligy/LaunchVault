
-- Expand content type enum to 10 types
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'workflow';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'agent';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'business_lesson';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'insight';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'tool_guide';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'playbook';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'challenge';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'cheatsheet';
