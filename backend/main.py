# main.py
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from crawl import series_dict, scrape_series
import os

POSTER_FOLDER = r"C:\toc-project\frontend\posters"

app = FastAPI(title="YFlix Series API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Serve static posters
app.mount("/posters", StaticFiles(directory=POSTER_FOLDER), name="posters")

@app.get("/")
def root():
    return series_dict


@app.get("/scrape")
def scrape_endpoint(pages: int = 1):
    scrape_series(pages)
    return {"message": f"Scraped {pages} pages", "total_series": len(series_dict)}

@app.get("/series")
def get_all_series():
    """Return all series as JSON"""
    return series_dict

@app.get("/series/detail")
def get_detail_by_url(url: str):
    print("URL received:", url)
    return scrape_series_detail(url)

@app.get("/series/{series_id}")
def get_series_by_id(series_id: int):
    return series_dict.get(series_id, {"error": "Series not found"})
