
from fastapi import FastAPI, HTTPException, status, Request
from back.schemas import SocieteCreate, SocieteSchema
from fastapi.responses import JSONResponse
from pymysql.err import IntegrityError, MySQLError
from back.dao import (
    add_societe,
    delete_societe,
    get_toutes_les_societes,
    get_societe_by_id,
    get_latest_bilan,
    get_cours_by_societe,
    update_societe,
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

#############
# PUT
#############

@app.put("/societes/{id_societe}", response_model=SocieteSchema)
def modifier_societe(id_societe: int, societe: SocieteCreate):
    modification = update_societe(
        id_societe,
        societe.nom,
        societe.symbole_boursier,
        societe.secteur,
        societe.pays
    )

    if not modification:
        raise HTTPException(
            status_code=404,
            detail="Société introuvable"
        )

    return get_societe_by_id(id_societe)

#############
# DELETE
#############

@app.delete("/societes/{id_societe}", status_code=204)
def supprimer_societe(id_societe: int):
    suppression = delete_societe(id_societe)

    if not suppression:
        raise HTTPException(
            status_code=404,
            detail="Société introuvable"
        )

#############
# ERROR
#############

@app.exception_handler(IntegrityError)
async def handle_integrity_error(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=409,
        content={"detail": "Conflit avec les données existantes"}
    )


@app.exception_handler(MySQLError)
async def handle_database_error(request: Request, exc: MySQLError):
    return JSONResponse(
        status_code=500,
        content={"detail": "Erreur interne de la base de données"}
    )