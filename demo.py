from dao import get_societe_by_id, get_toutes_les_societes, get_societes_by_pays, add_societe

print("--- Société existante ---")
societe = get_societe_by_id(1)
print(societe)
print(societe.nom, societe.pays)

print("--- Société inexistante ---")
print(get_societe_by_id(999))

for societe in get_toutes_les_societes():
    print(societe)

print(get_societes_by_pays("France"))
print(get_societes_by_pays("Japon"))

new_id = add_societe("Test SA", "TEST", "Test", "France")
print(get_societe_by_id(new_id))