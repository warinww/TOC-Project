# main.py
import os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from crawl import series_dict
from func_api import scrape_series_detail
from fastapi.staticfiles import StaticFiles
from crawl import scrape_page, series_dict
from OnAir_use import scrape_OnAir

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # project/
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
POSTER_FOLDER = os.path.join(FRONTEND_DIR, "posters")

os.makedirs(POSTER_FOLDER, exist_ok=True)

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
def get_series(page: int = Query(1, ge=1, le=17)):
    # ถ้า page นั้นยังไม่ถูก crawl ให้ scrape
    if not any(series.get("page") == page for series in series_dict.values()):
        new_series = scrape_page(page)
        # เพิ่ม info page ลง series
        for k, v in new_series.items():
            v["page"] = page
        series_dict.update(new_series)
    # ดึง series ของ page ที่ request
    page_series = {k: v for k, v in series_dict.items() if v.get("page") == page}
    return page_series

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

@app.get("/api/series/OnAir")
def get_series_on_air():
    return scrape_OnAir()
