# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from crawl import series_dict, scrape_series
from series_crawl import scrape_all
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

scrape_series()

@app.get("/")
def root():
    return series_dict


@app.get("/series/{series_id}")
def get_series_by_id(series_id: int):
    return series_dict.get(series_id, {"error": "Series not found"})

@app.get("/series")
def all_series(total_pages: int):
    return scrape_all(total_pages)