from db import get_connection
from dao import get_societes_by_pays, add_societe

# Test 1: injection in a SELECT filter (prepared statement)
piege = "France' OR '1'='1"
print("Test 1 - SELECT with trapped input:")
print(get_societes_by_pays(piege))   # expected: [] (no country has this name)

# Test 2: injection in an INSERT
piege_nom = "Robert'); DROP TABLE societe; --"
print("Test 2 - INSERT with trapped input:")
id_cree = add_societe(piege_nom, "TRAP", "Test", "France")
print("Inserted id:", id_cree)

# Check that the table still exists and the text was stored as is
connexion = get_connection()
with connexion.cursor() as curseur:
    curseur.execute("SELECT id_societe, nom FROM societe WHERE id_societe = %s", (id_cree,))
    print(curseur.fetchone())
    curseur.execute("SELECT COUNT(*) AS total FROM societe")
    print(curseur.fetchone())
connexion.close()

# Test 3 (for comparison only): the WRONG way, building SQL with an f-string
connexion = get_connection()
with connexion.cursor() as curseur:
    curseur.execute(f"SELECT nom FROM societe WHERE pays = '{piege}'")
    print("Test 3 - vulnerable version returns:", curseur.fetchall())
connexion.close()