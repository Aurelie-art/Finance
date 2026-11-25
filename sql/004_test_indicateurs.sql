-- SQL version of the indicator tests (same fictitious data as the Python script).
-- Read-only: only SELECT statements, so it can run with any account.
-- Run with: mariadb -u aurelie -p finance < sql/004_test_indicateurs.sql

-- Fictitious data (same values as in the Python test)
SET @chiffre_affaires  = 200000;
SET @resultat_net      = 20000;
SET @actifs_courants   = 60000;
SET @passifs_courants  = 30000;
SET @dettes_totales    = 90000;
SET @capitaux_propres  = 60000;
SET @cours_debut       = 100;
SET @cours_fin         = 110;

-- Indicator calculation
-- NULLIF(x, 0) returns NULL when x = 0, like the Python functions return None
SELECT
    ROUND((@resultat_net / NULLIF(@chiffre_affaires, 0)) * 100, 2)               AS marge_nette_pct,
    ROUND(@actifs_courants / NULLIF(@passifs_courants, 0), 2)                    AS ratio_liquidite,
    ROUND(@dettes_totales / NULLIF(@capitaux_propres, 0), 2)                     AS ratio_endettement,
    ROUND(((@cours_fin - @cours_debut) / NULLIF(@cours_debut, 0)) * 100, 2)     AS ratio_rendement_pct;

-- Manual check of the expected results (10.0 / 2.0 / 1.5 / 10.0)
SELECT 'marge_nette' AS indicateur,
       ROUND((@resultat_net / NULLIF(@chiffre_affaires, 0)) * 100, 2) AS obtenu,
       10.00 AS attendu,
       IF(ROUND((@resultat_net / NULLIF(@chiffre_affaires, 0)) * 100, 2) = 10.00, 'OK', 'ECHEC') AS test
UNION ALL
SELECT 'ratio_liquidite',
       ROUND(@actifs_courants / NULLIF(@passifs_courants, 0), 2),
       2.00,
       IF(ROUND(@actifs_courants / NULLIF(@passifs_courants, 0), 2) = 2.00, 'OK', 'ECHEC')
UNION ALL
SELECT 'ratio_endettement',
       ROUND(@dettes_totales / NULLIF(@capitaux_propres, 0), 2),
       1.50,
       IF(ROUND(@dettes_totales / NULLIF(@capitaux_propres, 0), 2) = 1.50, 'OK', 'ECHEC')
UNION ALL
SELECT 'ratio_rendement',
       ROUND(((@cours_fin - @cours_debut) / NULLIF(@cours_debut, 0)) * 100, 2),
       10.00,
       IF(ROUND(((@cours_fin - @cours_debut) / NULLIF(@cours_debut, 0)) * 100, 2) = 10.00, 'OK', 'ECHEC');

-- Division by zero case: must return NULL (None in Python)
SELECT ROUND((@resultat_net / NULLIF(0, 0)) * 100, 2) AS marge_nette_ca_zero;