from back.db import get_connection
from back.models import Societe, Bilan, Cours


def get_societe_by_id(id_societe):
    connexion = get_connection()
    try:
        with connexion.cursor() as curseur:
            curseur.execute(
                "SELECT id_societe, nom, symbole_boursier, secteur, pays "
                "FROM societe WHERE id_societe = %s",
                (id_societe,),
            )
            ligne = curseur.fetchone()
            if ligne is None:
                return None
            return Societe(**ligne)
    finally:
        connexion.close()

def get_toutes_les_societes():
    connexion = get_connection()
    try:
        with connexion.cursor() as curseur:
            curseur.execute(
                "SELECT id_societe, nom, symbole_boursier, secteur, pays "
                "FROM societe"
            )
            return [Societe(**ligne) for ligne in curseur.fetchall()]
    finally:
        connexion.close()

def get_societes_by_pays(pays):
    connexion = get_connection()
    try:
        with connexion.cursor() as curseur:
            curseur.execute(
                "SELECT id_societe, nom, symbole_boursier, secteur, pays "
                "FROM societe WHERE pays = %s",
                (pays,),
            )
            return [Societe(**ligne) for ligne in curseur.fetchall()]
    finally:
        connexion.close()

def add_societe(nom, symbole_boursier, secteur, pays):
    connexion = get_connection()
    try:
        with connexion.cursor() as curseur:
            curseur.execute(
                "INSERT INTO societe (nom, symbole_boursier, secteur, pays) "
                "VALUES (%s, %s, %s, %s)",
                (nom, symbole_boursier, secteur, pays),
            )
            nouvel_id = curseur.lastrowid
        connexion.commit()
        return nouvel_id
    finally:
        connexion.close()


def get_latest_bilan(id_societe):
    connexion = get_connection()
    try:
        with connexion.cursor() as curseur:
            curseur.execute(
                "SELECT id_societe, annee, chiffre_affaires, resultat_net, "
                "actifs_courants, passifs_courants, dettes_totales, "
                "capitaux_propres, total_actifs "
                "FROM bilan WHERE id_societe = %s "
                "ORDER BY annee DESC LIMIT 1",
                (id_societe,),
            )
            ligne = curseur.fetchone()
            if ligne is None:
                return None
            return Bilan(**ligne)
    finally:
        connexion.close()

def get_cours_by_societe(id_societe):
    connexion = get_connection()
    try:
        with connexion.cursor() as curseur:
            curseur.execute(
                "SELECT id_societe, date_cours, cours_cloture, volume "
                "FROM cours WHERE id_societe = %s "
                "ORDER BY date_cours ASC",
                (id_societe,),
            )
            return [Cours(**ligne) for ligne in curseur.fetchall()]
    finally:
        connexion.close()

def get_societe_by_symbole(symbole_boursier):
    connexion = get_connection()
    try:
        with connexion.cursor() as curseur:
            curseur.execute(
                "SELECT id_societe, nom, symbole_boursier, secteur, pays "
                "FROM societe WHERE symbole_boursier = %s",
                (symbole_boursier,),
            )
            ligne = curseur.fetchone()
            if ligne is None:
                return None
            return Societe(**ligne)
    finally:
        connexion.close()

def update_societe(id_societe, nom, symbole_boursier, secteur, pays):
    connexion = get_connection()
    try:
        with connexion.cursor() as curseur:
            # Verify that the company exists
            curseur.execute(
                "SELECT id_societe FROM societe WHERE id_societe = %s",
                (id_societe,),
            )

            if curseur.fetchone() is None:
                return False

            # Replace the company data
            curseur.execute(
                "UPDATE societe "
                "SET nom = %s, symbole_boursier = %s, secteur = %s, pays = %s "
                "WHERE id_societe = %s",
                (nom, symbole_boursier, secteur, pays, id_societe),
            )

        connexion.commit()
        return True

    finally:
        connexion.close()

def delete_societe(id_societe):
    connexion = get_connection()
    try:
        with connexion.cursor() as curseur:
            # Vérifier que la société existe
            curseur.execute(
                "SELECT id_societe FROM societe WHERE id_societe = %s",
                (id_societe,),
            )

            if curseur.fetchone() is None:
                return False

            # Supprimer la société
            curseur.execute(
                "DELETE FROM societe WHERE id_societe = %s",
                (id_societe,),
            )

        connexion.commit()
        return True

    finally:
        connexion.close()