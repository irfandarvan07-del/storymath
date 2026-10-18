-- ============================================================
-- StoryMath: teacher_accounts table
-- Run this in Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- 1. Create teacher_accounts table
CREATE TABLE IF NOT EXISTS teacher_accounts (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seed the single authorized teacher account.
--    password_hash = SHA256("storymath_salt_1234567891011")
--    (computed by backend hash_password("1234567891011"))
INSERT INTO teacher_accounts (username, password_hash)
VALUES (
    'TEACHER',
    '50592e9da4a615980399ebc2448430b383a8741421482b1792571a10c26c62e6'
)
ON CONFLICT (username) DO NOTHING;

-- 3. Verify
SELECT id, username, LEFT(password_hash, 20) || '...' AS hash_preview, created_at
FROM teacher_accounts;
