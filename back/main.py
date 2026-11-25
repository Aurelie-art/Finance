
from fastapi import FastAPI

# Create the application
app = FastAPI(
    title="Finance API",
    description="API for managing companies and financial data.",
    version="1.0.0",
)

# Declare the roads
@app.get("/")
def home():
    return {"message": "Finance API is running"}
