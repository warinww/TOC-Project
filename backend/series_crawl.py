# backend/crawl.py
from pathlib import Path
import re
import urllib.parse
import requests
import html
import csv


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

def extract_balanced_div_block(html, start_id):
    pattern = rf'<div[^>]+id="{start_id}"[^>]*>'
    match = re.search(pattern, html)
    if not match:
        return None

    start_pos = match.start()
    remaining_html = html[start_pos:]

    open_divs = 0
    end_pos = 0
    for match in re.finditer(r'</?div\b', remaining_html):
        if match.group() == '<div':
            open_divs += 1
        else:
            open_divs -= 1
        if open_divs == 0:
            end_pos = match.end()
            break

    return remaining_html[:end_pos] if end_pos > 0 else None


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
    res = requests.get(BASE_URL.format(page), headers=HEADERS, timeout=30)
    if res.status_code != 200:
        print(f"❌ Failed to fetch page {page}: status {res.status_code}")
        return {}

    section_html = extract_balanced_div_block(res.text, "tdi_45")
    if not section_html:
        print(f"❌ No section found for id='tdi_45' on page {page}")
        return {}

    # หา series entries
    series_entries = re.findall(
        r'<div class="td-module-thumb">\s*<a href="(?P<url>https://yflix\.me/series/[^"]+)"[^>]*title="(?P<title>[^"]+)".*?data-img-url="(?P<poster>[^"]+)"',
        section_html,
        re.DOTALL
    )
    print(f"🥩 Found {len(series_entries)} series entries")
    page_data: Dict[int, Dict[str, Any]] = {}

    for url, title, poster_url in series_entries:
        title = html.unescape(title.strip())
        poster_url = poster_url.strip()

        # ตรวจสอบว่าซีรีส์นี้เคยมีอยู่หรือยัง
        if url in url_to_id:
            sid = url_to_id[url]
        else:
            sid = _next_id
            url_to_id[url] = sid
            _next_id += 1

        print(f"🟢 Title: {title}")
        print(f"🔗 URL: {url}")
        print(f"🖼️ Poster: {poster_url}")
        print(f"#️⃣ Index: {sid}")

        poster_url_full = normalize_img_url(poster_url)
        try:
            local_poster_path = save_original_if_needed(poster_url_full, str(sid))
        except Exception as e:
            print(f"❌ Failed to download poster for {title}: {e}")
            local_poster_path = ""

        print(f"💾 Saved to: {local_poster_path}")

        # สร้าง/อัปเดตข้อมูลใน dict
        info = {
            "id": sid,
            "title": title,
            "url": url,
            "poster": local_poster_path,
        }
        series_dict[sid] = info
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
    return 

