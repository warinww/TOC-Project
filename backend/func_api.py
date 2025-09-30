import requests
from bs4 import BeautifulSoup
import re
import html

# Headers เพื่อให้เหมือน browser
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://yflix.me/",
}

def scrape_series_detail(url: str) -> dict:
    """Scrape ข้อมูลของ series จาก URL เดียว"""
    res = requests.get(url, headers=headers)
    if res.status_code != 200:
        return {"error": f"Failed to fetch {url}", "status": res.status_code}

    detail_soup = BeautifulSoup(res.text, "html.parser")

    # title
    match = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']',
                      res.text, re.DOTALL | re.IGNORECASE)
    title = html.unescape(match.group(1).strip()) if match else ""

    # modified year
    modified_date = re.search(
        r'<meta\s+property="article:modified_time"\s+content="(\d{4})-',
        res.text
    )
    date = modified_date.group(1) if modified_date else ""

    # castings (list ของ dict: name, url, image)
    castings_divs = detail_soup.select("#tdi_67 .td_module_flex")
    castings = []
    for div in castings_divs:
        a_tag = div.select_one(".td-module-thumb a")
        if not a_tag:
            continue
        cast_url = a_tag.get("href")
        name_tag = div.select_one(".td-module-title a")
        cast_name = name_tag.get_text(strip=True) if name_tag else ""
        # ดึงรูปจาก data-img-url หรือ style
        img_span = div.select_one(".entry-thumb")
        if img_span and img_span.get("data-img-url"):
            cast_img = img_span["data-img-url"]
        else:
            # fallback ดึงจาก style
            style = img_span.get("style", "") if img_span else ""
            m = re.search(r'url\(&quot;(.*?)&quot;\)', style)
            cast_img = m.group(1) if m else ""
        castings.append({
            "name": cast_name,
            "url": cast_url,
            "image": cast_img
        })

    # trailer
    trailer_match = re.search(r'<iframe[^>]*src="(https://www\.youtube\.com/[^"]+)"', res.text)
    trailer = trailer_match.group(1) if trailer_match else ""

    # synopsis
    content_div = detail_soup.find("div", class_="tdb_single_content")
    if content_div:
        paragraphs = [p.get_text(" ", strip=True) for p in content_div.find_all("p")]
        synopsis = " ".join(paragraphs)
        synopsis = html.unescape(synopsis)
        coming_soon = bool(re.search(r"เร็ว\s*ๆ\s*นี้", synopsis))
    else:
        synopsis = ""
        coming_soon = False

    # poster
    poster_match = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']', res.text)
    poster = poster_match.group(1).strip() if poster_match else ""

    return {
        "title": title,
        "date": date,
        "castings": castings,  # list ของ dict {name, url, image}
        "trailer": trailer,
        "synopsis": synopsis,
        "poster": poster,
        "coming_soon": coming_soon,
        "source_url": url
    }
