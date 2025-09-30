from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from crawl import series_dict, scrape_series  # import จาก crawl.py

app = FastAPI(title="YFlix Series API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.get("/series/{series_id}")
def get_series_by_id(series_id: int):
    return series_dict.get(series_id, {"error": "Series not found"})

@app.get("/scrape")
def scrape_endpoint(pages: int = 1):
    scrape_series(pages)
    return {"message": f"Scraped {pages} pages", "total_series": len(series_dict)}

@app.get("/series")
def get_all_series():
    """Return all series as JSON"""
    return series_dict
