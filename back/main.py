
from fastapi import FastAPI, HTTPException, status, Request
from back.schemas import SocieteCreate, SocieteSchema
from fastapi.responses import JSONResponse
from pymysql.err import IntegrityError, MySQLError
from fastapi.middleware.cors import CORSMiddleware
from back.dao import (
    add_societe,
    delete_societe,
    get_toutes_les_societes,
    get_societe_by_id,
    get_latest_bilan,
    get_cours_by_societe,
    update_societe,
    get_bilans,
)

from back.schemas import SocieteSchema, BilanSchema, CoursSchema

# Create the application
app = FastAPI(
    title="Finance API",
    description="""
    API for retrieving and managing financial data about companies.

    Features:
    - Retrieve companies
    - Retrieve financial statements
    - Retrieve stock prices
    - Create, update and delete companies
    """,
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#############
# GET
#############

# Declare the roads
@app.get("/")
def home():
    return {"message": "Finance API is running"}

# Retrieve all companies from the database
@app.get(
    "/societes",
    response_model=list[SocieteSchema],
    summary="List all companies",
    description="Returns the list of all companies stored in the database.",
    tags=["Companies"]
)
def get_societes():
    return get_toutes_les_societes()


# Retrieve a company by its ID from the database
@app.get(
    "/societes/{id_societe}",
    response_model=SocieteSchema,
    summary="Retrieve a company by its ID",
    description="Returns the company with the specified ID if it exists.",
    tags=["Companies"]
)
def get_societe(id_societe: int):
    societe = get_societe_by_id(id_societe)

    if societe is None:
        raise HTTPException(
            status_code=404,
            detail="Societe not found"
        )

    return societe

@app.get(
    "/societes/{id_societe}/bilans",
    response_model=list[BilanSchema],
    summary="Retrieve a company's financial statements",
    description="Returns all financial statements available for the requested company, ordered chronologically.",
    tags=["Financial Data"]
)
def get_bilan_societe(id_societe: int):
    societe = get_societe_by_id(id_societe)

    if societe is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    bilans = get_bilans(id_societe)

    if not bilans:
        raise HTTPException(
            status_code=404,
            detail="Financial statements not found"
        )

    return bilans


@app.get(
    "/societes/{id_societe}/cours", 
    response_model=list[CoursSchema],
    summary="Retrieve stock prices",
    description="Returns the historical closing prices and trading volumes for the requested company.",
    tags=["Financial Data"]
)
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
    status_code=status.HTTP_201_CREATED,
    summary="Create a company",
    description="Creates a new company in the database. All fields are required.",
    tags=["Company Management"]
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

@app.put(
    "/societes/{id_societe}", 
    response_model=SocieteSchema,
    summary="Update a company",
    description="Replaces the information of an existing company. All fields are required.",
    tags=["Company Management"]
)
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

@app.delete(
    "/societes/{id_societe}", 
    status_code=204,
    summary="Delete a company",
    description="Deletes a company from the database. Deletion may be rejected if financial records are linked to the company.",
    tags=["Company Management"]
)
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