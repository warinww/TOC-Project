# backend/poryor_test.py
from typing import Dict, Any, Optional, Tuple
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from threading import Lock
import time

# จาก crawl.py (หรือ home_crawl.py ของคุณ)
from home_crawl import POSTER_DIR, series_dict, scrape_page, scrape_all

app = FastAPI(title="Poryor Test API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# เสิร์ฟไฟล์ภาพ
app.mount("/posters", StaticFiles(directory=str(POSTER_DIR)), name="posters")

# -----------------------
# In-process caches
# -----------------------
_cache_lock = Lock()

# เคยโหลด “ทั้งหมด” แล้วหรือยัง
all_loaded: bool = False
all_loaded_at: Optional[float] = None

# แคชรายหน้า: page -> {id: series_info}
page_cache: Dict[int, Dict[int, Dict[str, Any]]] = {}

# แคช search: (query, page, scan_all) -> {id: series_info}
search_cache: Dict[Tuple[str, Optional[int], bool], Dict[int, Dict[str, Any]]] = {}


def _cache_set_loaded_all() -> None:
    global all_loaded, all_loaded_at
    all_loaded = True
    all_loaded_at = time.time()


def _ensure_all_loaded() -> None:
    """เรียก crawl ทั้งหมด แค่ครั้งแรก (ระหว่างอายุโปรเซส)"""
    with _cache_lock:
        global all_loaded
        if not all_loaded:
            scrape_all()
            _cache_set_loaded_all()


def _ensure_page_loaded(page: int) -> Dict[int, Dict[str, Any]]:
    """โหลดหน้า page ถ้ายังไม่อยู่ใน cache → ใส่ page_cache และคืนข้อมูลหน้านั้น"""
    with _cache_lock:
        if page in page_cache:
            return page_cache[page]
    # โหลดนอก critical section ได้ (แต่ปลอดภัยจะล็อกอีกครั้งตอนเขียน cache)
    data = scrape_page(page)
    with _cache_lock:
        page_cache[page] = data
    return data


@app.get("/")
def list_all() -> Dict[int, Dict[str, Any]]:
    """
    ครั้งแรกของโปรเซสรัน จะ crawl ทั้งหมด (ไม่ซ้ำหน้าเดิมใน crawl layer ของคุณอยู่แล้ว)
    ครั้งต่อ ๆ ไปดึงจาก series_dict (ในหน่วยความจำ)
    """
    _ensure_all_loaded()
    return series_dict


@app.get("/page")
def list_by_page(page: int = Query(1, ge=1, le=17)) -> Dict[int, Dict[str, Any]]:
    """
    แคชผลตามหน้า: กดซ้ำหน้าเดิมจะไม่ crawl ซ้ำ
    """
    return _ensure_page_loaded(page)


@app.get("/series/{series_id}")
def get_series(series_id: int):
    """
    ดึงเรื่องเดียวจาก series_dict (หลังจากอย่างน้อยเคยโหลดหน้า/โหลดทั้งหมดแล้ว)
    """
    # ให้ UX ดีขึ้น: ถ้ายังไม่เคยโหลดอะไรเลย ให้โหลดทั้งหมดครั้งแรก
    if not all_loaded and not page_cache:
        _ensure_all_loaded()
    return series_dict.get(series_id, {"error": "Series not found"})


@app.get("/search")
def search_series(
    title: str = Query(..., min_length=1),
    page: Optional[int] = Query(None, ge=1, le=17),
    scan_all: bool = Query(True),
) -> Dict[int, Dict[str, Any]]:
    """
    - ถ้ามี page -> ค้นเฉพาะข้อมูลของหน้า (แคชรายหน้า)
    - ถ้าไม่มี page:
        - ถ้า scan_all=True -> ensure_all_loaded แล้วค้นทั้งก้อน
        - ถ้า scan_all=False -> จะค้นเท่าที่โหลดลงมาแล้วใน series_dict ณ ตอนนั้น
    - มีแคช search ตามคีย์ (query, page, scan_all)
    """
    qkey = (title.strip().lower(), page, bool(scan_all))

    with _cache_lock:
        if qkey in search_cache:
            return search_cache[qkey]

    query = title.strip().lower()
    if page is not None:
        pool = _ensure_page_loaded(page).values()
    else:
        if scan_all:
            _ensure_all_loaded()
        pool = series_dict.values()

    result = {s["id"]: s for s in pool if query in (s.get("title") or "").lower()}

    with _cache_lock:
        search_cache[qkey] = result
    return result


# ---------- Cache utilities ----------
@app.get("/cache/status")
def cache_status():
    with _cache_lock:
        return {
            "all_loaded": all_loaded,
            "all_loaded_at": all_loaded_at,
            "page_cache_pages": sorted(list(page_cache.keys())),
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
        # หมายเหตุ: series_dict ยังอยู่ (ข้อมูลที่ crawl มาแล้ว)
        # ถ้าอยากล้างทั้งหมดจริง ๆ ให้ล้าง series_dict และ state ใน crawl.py ด้วย
    return {"ok": True, "message": "cache cleared (in-process)"}
