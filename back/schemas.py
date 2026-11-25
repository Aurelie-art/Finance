from pydantic import BaseModel, ConfigDict
from datetime import date

class SocieteSchema(BaseModel):
    id_societe: int
    nom: str
    symbole_boursier: str
    secteur: str
    pays: str

    model_config = ConfigDict(from_attributes=True)

class SocieteSchema(BaseModel):
    id_societe: int
    nom: str
    symbole_boursier: str
    secteur: str
    pays: str

    model_config = ConfigDict(from_attributes=True)


class BilanSchema(BaseModel):
    id_societe: int
    annee: int
    chiffre_affaires: float
    resultat_net: float
    actifs_courants: float
    passifs_courants: float
    dettes_totales: float
    capitaux_propres: float
    total_actifs: float

    model_config = ConfigDict(from_attributes=True)


class CoursSchema(BaseModel):
    id_societe: int
    date_cours: date
    cours_cloture: float
    volume: int

    model_config = ConfigDict(from_attributes=True)