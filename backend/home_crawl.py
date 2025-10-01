# backend/crawl.py
from pathlib import Path
import re
import urllib.parse
import requests
import html
from bs4 import BeautifulSoup
from typing import Dict, Any
import csv

# ===================== Directories =====================
BASE_DIR = Path(__file__).resolve().parents[1]

filecsvname = "series_titles.csv"

BASE_DIR = Path(__file__).resolve().parents[1]
CSV_FILE_PATH = BASE_DIR / "backend" / filecsvname

# ===================== Headers =====================
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

# ===================== Global Storage =====================
series_dict: Dict[int, Dict[str, Any]] = {}      # id -> series info
url_to_id: Dict[str, int] = {}                  # series URL -> id
_next_id = 1

cast_dict: Dict[int, Dict[str, Any]] = {}       # id -> cast info
cast_url_to_id: Dict[str, int] = {}             # cast URL -> id
_next_cast_id = 1

series_det_dict: Dict[int, Dict[str, Any]] = {}      # id -> series info

# ===================== Helpers =====================
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

def save_series_to_csv_immediately(title: str):
    """บันทึกชื่อเรื่องลงในไฟล์ CSV ทันทีหลังจาก scrape ข้อมูล"""
    # ตรวจสอบว่าไฟล์ CSV มีอยู่แล้วหรือไม่
    file_exists = CSV_FILE_PATH.exists()

    with open(CSV_FILE_PATH, mode='a', newline='', encoding='utf-8-sig') as file:
        fieldnames = ['title']
        writer = csv.DictWriter(file, fieldnames=fieldnames)

        # ถ้าเป็นการเขียนครั้งแรก จะเขียน header
        if not file_exists:
            writer.writeheader()

        # เขียนชื่อเรื่องลงในไฟล์
        writer.writerow({'title': title})

    print(f"Title '{title}' saved to CSV.")

# ===================== Scrape Functions =====================
def _upsert_series(sid: int, *, title: str, href: str, poster_url: str) -> Dict[str, Any]:
    info = {"id": sid, "title": title, "url": href, "poster": poster_url}
    series_dict[sid] = info
    return info

def scrape_page(page: int) -> Dict[int, Dict[str, Any]]:
    """Crawl หน้า series list"""
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

        info = _upsert_series(sid, title=title, href=url, poster_url=poster_url)
        page_data[sid] = info

        save_series_to_csv_immediately(title)

    print(f"  ✓ page {page} -> {len(page_data)} รายการ")
    return page_data

def scrape_all(total_pages: int = 17) -> Dict[int, Dict[str, Any]]:
    all_data: Dict[int, Dict[str, Any]] = {}
    for p in range(1, total_pages + 1):
        all_data.update(scrape_page(p))
    return all_data

def scrape_series_detail(url: str) -> dict:
    """Scrape ข้อมูลของ series จาก URL เดียว"""
    global _next_id, _next_cast_id

    res = requests.get(url, headers=HEADERS, timeout=30)
    if res.status_code != 200:
        return {"error": f"Failed to fetch {url}", "status": res.status_code}

    detail_soup = BeautifulSoup(res.text, "html.parser")

    # title
    match = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']',
                      res.text, re.DOTALL | re.IGNORECASE)
    title = html.unescape(match.group(1).strip()) if match else ""

    # modified date
    modified_date = re.search(r'<meta\s+property="article:modified_time"\s+content="(\d{4})-', res.text)
    date = modified_date.group(1) if modified_date else ""

    # id ของ series
    if url in url_to_id:
        sid = url_to_id[url]
    else:
        sid = _next_id
        _next_id += 1
        url_to_id[url] = sid

    # poster
    poster_match = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']', res.text)
    poster_url = poster_match.group(1).strip() if poster_match else ""
    # poster_public = save_poster_by_id(normalize_img_url(poster_url), sid)

    # castings
    castings_divs = detail_soup.select("#tdi_67 .td_module_flex")
    castings = []
    for div in castings_divs:
        a_tag = div.select_one(".td-module-thumb a")
        if not a_tag:
            continue
        cast_url = a_tag.get("href")
        name_tag = div.select_one(".td-module-title a")
        cast_name = name_tag.get_text(strip=True) if name_tag else ""

        img_span = div.select_one(".entry-thumb")
        if img_span and img_span.get("data-img-url"):
            cast_img_url = img_span["data-img-url"]
        else:
            style = img_span.get("style", "") if img_span else ""
            m = re.search(r'url\(&quot;(.*?)&quot;\)', style)
            cast_img_url = m.group(1) if m else ""

        # check ถ้ามี cast_id แล้วใช้ id เดิม
        if cast_url in cast_url_to_id:
            cast_id = cast_url_to_id[cast_url]
        else:
            cast_id = _next_cast_id
            _next_cast_id += 1
            cast_url_to_id[cast_url] = cast_id

        cast_dict[cast_id] = {"id": cast_id, "name": cast_name, "url": cast_url, "image": cast_img_url}

        castings.append({"id": cast_id, "name": cast_name, "url": cast_url, "image": cast_img_url})

    # trailer
    trailer_match = re.search(r'<iframe[^>]*src="(https://www\.youtube\.com/[^"]+)"', res.text)
    trailer = trailer_match.group(1) if trailer_match else ""

    # synopsis
    content_div = detail_soup.find("div", class_="tdb_single_content")
    if content_div:
        paragraphs = [p.get_text(" ", strip=True) for p in content_div.find_all("p")]
        synopsis = html.unescape(" ".join(paragraphs))
        coming_soon = bool(re.search(r"เร็ว\s*ๆ\s*นี้", synopsis))
    else:
        synopsis = ""
        coming_soon = False

    info = {
        "id": sid,
        "title": title,
        "date": date,
        "castings": castings,
        "trailer": trailer,
        "synopsis": synopsis,
        "poster": poster_url,
        "coming_soon": coming_soon,
        "source_url": url
    }
    series_dict[sid] = info
    return info

def scrape_OnAir():
    url = f"https://yflix.me/category/series/page/2/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36",
    }

    html = requests.get(url, headers=headers).text
    soup = BeautifulSoup(html, "html.parser")

    block = soup.find("div", id="tdi_40")
    if not block:
        return {"error": f"Block with id='tdi_40' not found on page 2."}

    results = []
    pattern = re.compile(
        r'<div\s+class=["\']td-module-thumb["\'][^>]*>.*?<a\s+href=["\']([^"\']+)["\']',
        re.DOTALL
    )

    matches = pattern.findall(str(block))

    results = []
    for href in matches:
        results.append(href)
    return results

def info_onair_series():
    onair_list = scrape_OnAir()
    print(onair_list)
    onair_dict = {}
    for onair_series in onair_list:
        for series_id, series_info in series_dict.items():
            url = series_info.get("url", "")
            if url and onair_series == url:
                info = {
                    "id": series_info.get("id", series_id),
                    "title": series_info.get("title", ""),
                    "url": url,
                    "poster": series_info.get("poster", "")
                }
                onair_dict[series_id] = info
    return onair_dict

def get_casting_by_URL(url: str) -> dict:
    global _next_id, _next_cast_id
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36",
    }
    res = requests.get(url, headers=headers)
    if res.status_code != 200:
        return {"error": f"Failed to fetch {url}", "status": res.status_code}
    soup = BeautifulSoup(res.text, "html.parser")

    # All images
    image_matches = re.findall(
        r'<meta\s+[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\'][^>]*>',
        res.text,
        re.IGNORECASE
    )
    all_images = list({url.strip() for url in image_matches}) if image_matches else []


    # Title
    title_match = re.search(
        r'<meta\s+[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']+)["\'][^>]*>',
        res.text,
        re.IGNORECASE
    )
    title = title_match.group(1).strip() if title_match else ""

    # Full name
    full_name_match = re.search(r'ชื่อ-สกุล\s*:\s*(.+?)(?:<br>|</p>)', res.text)
    full_name = full_name_match.group(1).strip() if full_name_match else ""

    # Nickname
    nick_match = re.search(r'ชื่อเล่น\s*:\s*(.+?)(?:<br>|</p>)', res.text)
    nick_name = nick_match.group(1).strip() if nick_match else ""

    # Birth
    birth_match = re.search(r'เกิด(?:เมื่อ)?\s*:\s*(.+?)(?:<br>|</p>)', res.text)
    birth = birth_match.group(1).strip() if birth_match else ""

    # IG
    ig_match = re.search(
        r'<a[^>]*href="([^"]+)"[^>]*>\s*IG\s*:\s*([^<]+)</a>',
        res.text,
        re.IGNORECASE
    )
    ig_link = ig_match.group(1).strip() if ig_match else ""
    ig_username = ig_match.group(2).strip() if ig_match else ""

    # Description
    description = ""
    block = soup.find(attrs={"data-td-block-uid": "tdi_77"})

    p_tags = re.findall(r'<p[^>]*>(.*?)</p>', str(block), re.DOTALL)

    paragraph = ""
    for i in range(len(p_tags)):
        new_paragraph = re.sub(r'<br\s*/?>', '\n', p_tags[i], flags=re.IGNORECASE)
        paragraph = paragraph + "\n" + new_paragraph
    cleaned = re.sub(r'(ชื่อ-สกุล|ชื่อเล่น|เกิด(?:เมื่อ)?)\s*:.*(?:\n)?', '', paragraph)
    lines = [line.strip() for line in cleaned.splitlines() if line.strip()]

    with_colon = [line for line in lines if ":" in line]
    no_colon = [line for line in lines if ":" not in line]
    sorted_lines = with_colon + no_colon
    description = "\n".join(sorted_lines)

    # Series links
    pattern = re.compile(
        r'<div\s+class="td_module_flex[^"]*">.*?'
        r'<a\s+href="(?P<href>https://yflix\.me/series/[^"]+)"[^>]*'
        r'title="(?P<title>[^"]+)"[^>]*>.*?'
        r'<span[^>]*data-img-url="(?P<img>[^"]+)"',
        re.DOTALL | re.IGNORECASE
    )

    series_items = []

    for m in pattern.finditer(res.text):
        stitle = html.unescape(m.group("title"))
        series_items.append({
            "title": stitle,
            "img": m.group("img"),
            "url": m.group("href")
        })


    # print(all_images, title)
    # Return JSON-ready dict
    return {
        "all_images": all_images,
        "title": title,
        "full_name": full_name,
        "nick_name": nick_name,
        "birth": birth,
        "ig_username": ig_username,
        "ig_link": ig_link,
        "description": description,
        "series_links": series_items
    }

# print(get_casting_by_URL("https://yflix.me/casting/%e0%b8%a7%e0%b8%ad%e0%b8%a3%e0%b9%8c-%e0%b8%a7%e0%b8%99%e0%b8%a3%e0%b8%b1%e0%b8%99%e0%b8%95%e0%b9%8c-%e0%b8%a3%e0%b8%b1%e0%b8%a8%e0%b8%a1%e0%b8%b5%e0%b8%a3%e0%b8%b1%e0%b8%95%e0%b8%99%e0%b9%8c/"))
        
# def find_cast_id_by_url(url):
#     for series in series_dict:
#         if series["title"] == name:
#             return series
