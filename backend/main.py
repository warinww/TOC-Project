# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from crawl import series_dict, scrape_series
import os

POSTER_FOLDER = r"D:\CE\D3\ToC\TOC-Project\frontend\posters"

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

# @app.post("/series/{series_title}")
# def create_searchresult_by_title(series_title: str):
#     return 1 if series_title else 0

@app.get("/series/{series_title}")
def get_series_by_title(series_title: str):
    for series_id, series in series_dict.items():
        if series["title"].lower() == series_title.lower():
            return {"id": series_id, **series}
    return {"error": "Series not found"}