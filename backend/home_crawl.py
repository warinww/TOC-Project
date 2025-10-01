# backend/crawl.py
from pathlib import Path
import re
import urllib.parse
import requests
import html
from bs4 import BeautifulSoup
from typing import Dict, Any

# ===================== Directories =====================
BASE_DIR = Path(__file__).resolve().parents[1]

POSTER_DIR = BASE_DIR / "frontend" / "posters"
POSTER_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_PREFIX = "/posters"

CAST_DIR = BASE_DIR / "frontend" / "casts"
CAST_DIR.mkdir(parents=True, exist_ok=True)
CAST_PUBLIC_PREFIX = "/casts"

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

# ===================== Helpers =====================
def normalize_img_url(url: str) -> str:
    """ตัด suffix -WxH เพื่อขอไฟล์ full-size"""
    return re.sub(r"-\d+x\d+(\.\w+)$", r"\1", url)

def save_poster_by_id(img_url: str, sid: int) -> str:
    """ดาวน์โหลด poster ซีรีส์ ลง frontend/posters/<id>.jpg"""
    if not img_url:
        return ""
    ext = Path(urllib.parse.urlparse(img_url).path).suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        ext = ".jpg"
    filename = f"{sid}{ext}"
    abs_path = POSTER_DIR / filename
    public = f"{PUBLIC_PREFIX}/{filename}"
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    if abs_path.exists():
        return public
    try:
        with requests.get(img_url, stream=True, headers=HEADERS, timeout=30) as r:
            r.raise_for_status()
            with open(abs_path, "wb") as f:
                for chunk in r.iter_content(8192):
                    if chunk:
                        f.write(chunk)
    except Exception as e:
        print(f"  x Failed to download poster {img_url}: {e}")
        return ""
    return public

def save_cast_by_id(img_url: str, cast_id: int) -> str:
    """ดาวน์โหลด cast image ลง frontend/casts/<id>.jpg"""
    if not img_url:
        return ""
    ext = Path(urllib.parse.urlparse(img_url).path).suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        ext = ".jpg"
    filename = f"{cast_id}{ext}"
    abs_path = CAST_DIR / filename
    public = f"{CAST_PUBLIC_PREFIX}/{filename}"
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    if abs_path.exists():
        return public
    try:
        with requests.get(img_url, stream=True, headers=HEADERS, timeout=30) as r:
            r.raise_for_status()
            with open(abs_path, "wb") as f:
                for chunk in r.iter_content(8192):
                    if chunk:
                        f.write(chunk)
    except Exception as e:
        print(f"  x Failed to download cast image {img_url}: {e}")
        return ""
    return public

# ===================== Scrape Functions =====================
def _upsert_series(sid: int, *, title: str, href: str, poster_url: str) -> Dict[str, Any]:
    poster_public = save_poster_by_id(normalize_img_url(poster_url), sid)
    info = {"id": sid, "title": title, "url": href, "poster": poster_public}
    series_dict[sid] = info
    return info

def scrape_page(page: int) -> Dict[int, Dict[str, Any]]:
    """Crawl หน้า series list"""
    global _next_id
    print(f"[CRAWL] page {page}")
    html_content = requests.get(BASE_URL.format(page), headers=HEADERS, timeout=30).text
    soup = BeautifulSoup(html_content, "html.parser")
    block = soup.find("div", id="tdi_45")
    if not block:
        print(f"  ! ไม่พบ block id='tdi_45' หน้า {page}")
        return {}
    page_data: Dict[int, Dict[str, Any]] = {}
    for thumb in block.find_all("div", class_="td-module-thumb"):
        a_tag = thumb.find("a")
        img_span = thumb.find("span", class_="entry-thumb")
        if not (a_tag and img_span):
            continue
        title = (a_tag.get("title") or "").strip()
        href = a_tag.get("href") or ""
        poster_url = img_span.get("data-img-url") or ""
        if not poster_url or not href:
            continue
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
    poster_public = save_poster_by_id(normalize_img_url(poster_url), sid)

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

        cast_img_public = save_cast_by_id(cast_img_url, cast_id)
        cast_dict[cast_id] = {"id": cast_id, "name": cast_name, "url": cast_url, "image": cast_img_public}

        castings.append({"id": cast_id, "name": cast_name, "url": cast_url, "image": cast_img_public})

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
        "poster": poster_public,
        "coming_soon": coming_soon,
        "source_url": url
    }
    series_dict[sid] = info
    return info

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
    all_images = [url.strip() for url in image_matches] if image_matches else []

    # for url in all_images:
    #     image_pattern = re.compile(
    #         rf'<[^>]+src=["\']{re.escape(url)}["\'][^>]*fetchpriority=["\']high["\'][^>]*>',
    #         re.IGNORECASE
    #     )
    #     if image_pattern.search(res.text):
    #         image_0 = url
    #         break

    # if image_0:
    #     all_images.remove(image_0)
    #     all_images.insert(0, image_0)

    # # check ถ้ามี cast_id แล้วใช้ id เดิม
    # if url in cast_url_to_id:
    #     cast_id = cast_url_to_id[url]
    # else:
    #     cast_id = _next_cast_id
    #     _next_cast_id += 1
    #     cast_url_to_id[url] = cast_id

    # path_casting_image = []
    # for idx, img_url in enumerate(all_images):
    #     if idx == 0:
    #         path_casting_image.append(save_cast_by_id(img_url, cast_id))       # first image, no index
    #     else:
    #         path_casting_image.append(save_cast_by_id(img_url, cast_id, idx))  # other images with index

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
            # "img": find_poster_by_name(title),
            "url": m.group("href")
        })


    print(all_images, title)
    # Return JSON-ready dict
    return {
        # "all_images": path_casting_image,
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