-- Restricts the application account 'aurelie' to data operations only
-- (principle of least privilege).
-- Run with an admin account: sudo mariadb < sql/003_compte_applicatif.sql

-- Before: GRANT ALL PRIVILEGES ON finance.* (too broad: DROP, ALTER, CREATE...)
REVOKE ALL PRIVILEGES ON finance.* FROM 'aurelie'@'localhost';

-- After: read and write access to the data only
GRANT SELECT, INSERT, UPDATE, DELETE ON finance.* TO 'aurelie'@'localhost';

FLUSH PRIVILEGES;

-- Check
SHOW GRANTS FOR 'aurelie'@'localhost';