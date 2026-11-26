
from fastapi import FastAPI, HTTPException, status
from back.schemas import SocieteCreate, SocieteSchema
from back.dao import (
    add_societe,
    get_toutes_les_societes,
    get_societe_by_id,
    get_latest_bilan,
    get_cours_by_societe,
)

from back.schemas import SocieteSchema, BilanSchema, CoursSchema

# Create the application
app = FastAPI(
    title="Finance API",
    description="API for managing companies and financial data.",
    version="1.0.0",
)

#############
# GET
#############

# Declare the roads
@app.get("/")
def home():
    return {"message": "Finance API is running"}

# Retrieve all companies from the database
@app.get("/societes", response_model=list[SocieteSchema])
def get_societes():
    return get_toutes_les_societes()


# Retrieve a company by its ID from the database
@app.get("/societes/{id_societe}", response_model=SocieteSchema)
def get_societe(id_societe: int):
    societe = get_societe_by_id(id_societe)

    if societe is None:
        raise HTTPException(
            status_code=404,
            detail="Societe not found"
        )

    return societe

@app.get("/societes/{id_societe}/bilans", response_model=BilanSchema)
def get_bilan_societe(id_societe: int):
    societe = get_societe_by_id(id_societe)

    if societe is None:
        raise HTTPException(
            status_code=404,
            detail="Societe not found"
        )

    bilan = get_latest_bilan(id_societe)

    if bilan is None:
        raise HTTPException(
            status_code=404,
            detail="Bilan not found"
        )

    return bilan


@app.get("/societes/{id_societe}/cours", response_model=list[CoursSchema])
def get_cours_societe(id_societe: int):
    societe = get_societe_by_id(id_societe)

    if societe is None:
        raise HTTPException(
            status_code=404,
            detail="Cours not found"
        )

    return get_cours_by_societe(id_societe)

#############
# POST
#############

@app.post(
    "/societes",
    response_model=SocieteSchema,
    status_code=status.HTTP_201_CREATED
)
def create_societe(societe: SocieteCreate):
    id_societe = add_societe(
        societe.nom,
        societe.symbole_boursier,
        societe.secteur,
        societe.pays
    )

    nouvelle_societe = get_societe_by_id(id_societe)

    return nouvelle_societe

