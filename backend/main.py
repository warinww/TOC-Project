# backend/poryor_test.py
from typing import Dict, Any, Optional, Tuple
from fastapi import FastAPI, Query 
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from threading import Lock
import time
from home_crawl import get_casting_by_URL
from fastapi.responses import FileResponse, Response
import requests

from home_crawl import (  # หรือ crawl.py ของคุณ
    CSV_FILE_PATH,
    filecsvname,
    series_dict,
    scrape_page,
    scrape_all,
    scrape_series_detail as crawl_series_detail,
    info_onair_series
)

app = FastAPI(title="Poryor Test API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



# ------- in-process cache -------
_cache_lock = Lock()
all_loaded: bool = False
all_loaded_at: Optional[float] = None
page_cache: Dict[int, Dict[int, Dict[str, Any]]] = {}
search_cache: Dict[Tuple[str, Optional[int], bool], Dict[int, Dict[str, Any]]] = {}

def _set_all_loaded():
    global all_loaded, all_loaded_at
    all_loaded = True
    all_loaded_at = time.time()

def _ensure_all_loaded():
    with _cache_lock:
        global all_loaded
        if not all_loaded:
            scrape_all()      # crawl ทุกหน้า (ฟังก์ชัน crawl ฝั่งคุณ handle no-dup ให้แล้ว)
            _set_all_loaded()

def _ensure_page_loaded(page: int) -> Dict[int, Dict[str, Any]]:
    with _cache_lock:
        if page in page_cache:
            return page_cache[page]
    data = scrape_page(page)
    with _cache_lock:
        page_cache[page] = data
    return data

# ----------- routes (ไม่มี /series/{id} แล้ว) -----------

@app.get("/")
def list_all() -> Dict[int, Dict[str, Any]]:
    _ensure_all_loaded()
    return series_dict

@app.get("/download-csv")
def download_csv():
    return FileResponse(CSV_FILE_PATH, filename=filecsvname, media_type="text/csv")
@app.get("/image-proxy")
def image_proxy(url: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://yflix.me/"
    }

    r = requests.get(url, headers=headers, stream=True)

    if r.status_code != 200:
        return Response(content=r.text, status_code=r.status_code)

    return Response(content=r.content, media_type=r.headers.get("Content-Type", "image/jpeg"))

@app.get("/api/series/OnAir")
def get_series_on_air():
    _ensure_all_loaded()
    return info_onair_series()

@app.get("/page")
def list_by_page(page: int = Query(1, ge=1, le=17)) -> Dict[int, Dict[str, Any]]:
    return _ensure_page_loaded(page)

@app.get("/series/detail")
def series_detail(url: str = Query(..., min_length=10)) -> Dict[str, Any]:
    # ดึงละเอียดด้วย URL จริงของเรื่อง
    return crawl_series_detail(url)

@app.get("/search")
def search_series(
    title: str = Query(..., min_length=1),
    page: Optional[int] = Query(None, ge=1, le=17),
    scan_all: bool = Query(True),
) -> Dict[int, Dict[str, Any]]:
    key = (title.strip().lower(), page, bool(scan_all))
    with _cache_lock:
        if key in search_cache:
            return search_cache[key]

    q = title.strip().lower()
    if page is not None:
        pool = _ensure_page_loaded(page).values()
    else:
        if scan_all:
            _ensure_all_loaded()
        pool = series_dict.values()

    result = {s["id"]: s for s in pool if q in (s.get("title") or "").lower()}
    with _cache_lock:
        search_cache[key] = result
    return result

# optional: debug cache
@app.get("/cache/status")
def cache_status():
    with _cache_lock:
        return {
            "all_loaded": all_loaded,
            "all_loaded_at": all_loaded_at,
            "page_cache_pages": sorted(page_cache.keys()),
            "search_cache_size": len(search_cache),
            "series_count": len(series_dict),
        }

@app.post("/cache/clear")
def cache_clear():
    with _cache_lock:
        global all_loaded, all_loaded_at
        all_loaded = False
        all_loaded_at = None
        page_cache.clear()
        search_cache.clear()
    return {"ok": True, "message": "cache cleared"}

@app.get("/casting")
def get_cating_detail_by_url(url: str):
    print("URL received:", url)
    return get_casting_by_URL(url)
