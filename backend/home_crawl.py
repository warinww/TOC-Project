# backend/crawl.py
from pathlib import Path
import re
import urllib.parse
import requests
from bs4 import BeautifulSoup
from typing import Dict, Any

# โครงสร้าง path: <repo-root>/frontend/posters
BASE_DIR = Path(__file__).resolve().parents[1]
POSTER_DIR = BASE_DIR / "frontend" / "posters"
POSTER_DIR.mkdir(parents=True, exist_ok=True)

PUBLIC_PREFIX = "/posters"

HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                   "AppleWebKit/537.36 (KHTML, like Gecko) "
                   "Chrome/120.0.0.0 Safari/537.36"),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://yflix.me/",
    "Connection": "keep-alive",
}

BASE_URL = "https://yflix.me/category/series/page/{}/"

# เก็บข้อมูลรวม (id -> series_info)
series_dict: Dict[int, Dict[str, Any]] = {}
# map จากลิงก์ซีรีส์ -> id (กันสร้าง id ใหม่ซ้ำ)
url_to_id: Dict[str, int] = {}
# running id ครั้งแรกเท่านั้น
_next_id = 1


def normalize_img_url(url: str) -> str:
    """ตัด suffix -WxH ออกจากรูปย่อย เพื่อพยายามขอไฟล์ full-size"""
    return re.sub(r"-\d+x\d+(\.\w+)$", r"\1", url)


def get_ext_from_url(url: str) -> str:
    """คืน extension จาก path; default เป็น .jpg"""
    ext = Path(urllib.parse.urlparse(url).path).suffix.lower()
    if ext in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        return ".jpg" if ext == ".jpeg" else ext
    return ".jpg"


def _poster_public_path(stem: str, ext: str) -> str:
    """คืน path สำหรับ frontend เช่น /posters/123.jpg"""
    return f"{PUBLIC_PREFIX}/{stem}{ext}"


def _poster_abs_path(stem: str, ext: str) -> Path:
    """คืน path จริงบนเครื่องสำหรับเก็บไฟล์โปสเตอร์"""
    return POSTER_DIR / f"{stem}{ext}"


def save_original_if_needed(img_url: str, id_stem: str) -> str:
    """
    ดาวน์โหลดไฟล์ต้นฉบับ (ไม่แปลง) เฉพาะถ้ายังไม่มีไฟล์
    คืน path สาธารณะสำหรับ frontend เช่น /posters/123.jpg
    """
    ext = get_ext_from_url(img_url)
    abs_path = _poster_abs_path(id_stem, ext)
    public = _poster_public_path(id_stem, ext)

    if abs_path.exists():
        # มีไฟล์แล้ว ไม่โหลดซ้ำ
        return public

    with requests.get(img_url, stream=True, headers=HEADERS, timeout=30) as r:
        r.raise_for_status()
        with open(abs_path, "wb") as f:
            for chunk in r.iter_content(8192):
                if chunk:
                    f.write(chunk)
    return public


def _upsert_series(sid: int, *, title: str, href: str, poster_url: str) -> Dict[str, Any]:
    """อัปเดต/สร้างข้อมูลซีรีส์ 1 เรื่อง (ไม่เก็บ page, และไม่สร้าง id ใหม่ถ้าเคยมีอยู่)"""
    # ขอไฟล์ full-size ถ้าเป็นไปได้
    img_url_full = normalize_img_url(poster_url)

    # เซฟโปสเตอร์ (ถ้ายังไม่มี)
    try:
        poster_public = save_original_if_needed(img_url_full, str(sid))
    except Exception as e:
        # fallback ไป url เดิม
        try:
            poster_public = save_original_if_needed(poster_url, str(sid))
        except Exception as e2:
            print(f"  x poster failed id={sid} full={e} fallback={e2}")
            poster_public = ""

    # series_info ที่เก็บจริง (ไม่ใส่ page)
    info = {
        "id": sid,
        "title": title,
        "url": href,
        "poster": poster_public,
    }
    series_dict[sid] = info
    return info


def scrape_page(page: int) -> Dict[int, Dict[str, Any]]:
    """
    Crawl เฉพาะหน้า page (1..17)
    - ไม่เก็บ field 'page'
    - ถ้า href เคยเจอแล้ว -> ใช้ id เดิม, อัปเดตข้อมูล/โปสเตอร์ให้ตรง
    - ถ้า href ยังไม่เคย -> ออก id ใหม่ (ครั้งแรกเท่านั้น)
    """
    global _next_id

    print(f"[CRAWL] page {page}")
    html = requests.get(BASE_URL.format(page), headers=HEADERS, timeout=30).text
    soup = BeautifulSoup(html, "html.parser")

    block = soup.find("div", id="tdi_45")
    if not block:
        print(f"  ! ไม่พบ block id='tdi_45' ในหน้า {page}")
        return {}

    page_data: Dict[int, Dict[str, Any]] = {}

    for thumb in block.find_all("div", class_="td-module-thumb"):
        a_tag = thumb.find("a")
        img_span = thumb.find("span", class_="entry-thumb")
        if not (a_tag and img_span):
            continue

        title = (a_tag.get("title") or "").strip()
        href  = a_tag.get("href") or ""
        poster_url = img_span.get("data-img-url") or ""
        if not poster_url or not href:
            continue

        # ใช้ id เดิมถ้ามี; ถ้าไม่มีก็จอง id ใหม่
        if href in url_to_id:
            sid = url_to_id[href]
        else:
            sid = _next_id
            _next_id += 1
            url_to_id[href] = sid

        info = _upsert_series(sid, title=title, href=href, poster_url=poster_url)
        page_data[sid] = info

    print(f"  ✓ page {page} -> {len(page_data)} รายการ")
    return page_data


def scrape_all(total_pages: int = 17) -> Dict[int, Dict[str, Any]]:
    """
    Crawl ทุกหน้า 1..total_pages
    - ไม่เก็บ field 'page'
    - ไม่สร้าง id ใหม่ซ้ำ (href ชี้ id เดิมเสมอ)
    """
    all_data: Dict[int, Dict[str, Any]] = {}
    for p in range(1, total_pages + 1):
        all_data.update(scrape_page(p))
    return all_data
