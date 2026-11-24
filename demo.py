from dao import get_societe_by_id

print("--- Société existante ---")
societe = get_societe_by_id(1)
print(societe)
print(societe.nom, societe.pays)

print("--- Société inexistante ---")
print(get_societe_by_id(999))