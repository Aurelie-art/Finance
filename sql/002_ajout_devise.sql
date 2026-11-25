USE finance;
ALTER TABLE societe
ADD COLUMN devise VARCHAR(3) NOT NULL DEFAULT 'EUR';

-- Check
SELECT nom, devise FROM societe;