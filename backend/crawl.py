import os
import requests
from bs4 import BeautifulSoup
import re
import time
from io import BytesIO
from PIL import Image

series_dict = {}
series_id_counter = 1

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Referer": "https://yflix.me/",
}

BASE_URL = "https://yflix.me/category/series/page/{}/"
POSTER_FOLDER = r"C:\Users\User\Documents\kmitl_3D ToC\TOC-Project\frontend\posters"
os.makedirs(POSTER_FOLDER, exist_ok=True)

def scrape_page(page: int):
    """
    Scrape page เดียว (page 1-16) แล้วเพิ่ม series ลงใน series_dict
    """
    global series_id_counter, series_dict

    if page < 1 or page > 17:
        raise ValueError("Page must be 1-17")

    print(f"Scraping page {page}...")
    url = BASE_URL.format(page)
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Failed page {page}: {response.status_code}")
        return {}

    soup = BeautifulSoup(response.text, "html.parser")
    series_links = [a.get("href") for a in soup.select(".tdi_45 .td-module-title a")]
    page_series = {}

    for link in series_links:
        res = requests.get(link, headers=headers)
        if res.status_code != 200:
            continue

        detail_soup = BeautifulSoup(res.text, "html.parser")

        # --- scrape title, year, castings, trailer, synopsis --- #
        match = re.search(r'<h1 class="tdb-title-text">(.*?)</h1>', res.text)
        title = match.group(1).strip() if match else ""

        modified_date = re.search(
            r'<meta\s+property="article:modified_time"\s+content="(\d{4})-',
            res.text
        )
        date = modified_date.group(1) if modified_date else ""

        castings_matches = re.findall(
            r'<h3 class="entry-title td-module-title">\s*<a href="(https://yflix.me/casting/.*?)/".*?>(.*?)</a>\s*</h3>',
            res.text,
        )
        castings = ", ".join([name.strip() for url, name in castings_matches]) if castings_matches else ""

        trailer_match = re.search(r'<iframe[^>]*src="(https://www\.youtube\.com/[^"]+)"', res.text)
        trailer = trailer_match.group(1) if trailer_match else ""

        synopsis_tags = detail_soup.select(
            ".tdb_single_content .tdb-block-inner > *:not(.wp-block-quote):not(.alignwide):not(.alignfull.wp-block-cover.has-parallax):not(.td-a-ad)"
        )
        synopsis = "\n".join([s.get_text(strip=True) for s in synopsis_tags]) if synopsis_tags else ""

        poster_match = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']', res.text)
        poster_url = poster_match.group(1).strip() if poster_match else ""

        local_poster_path = ""
        if poster_url:
            try:
                r = requests.get(poster_url, headers=headers)
                if r.status_code == 200:
                    filename = f"{series_id_counter}.webp"
                    full_path = os.path.join(POSTER_FOLDER, filename)

                    # แปลงเป็น webp
                    img = Image.open(BytesIO(r.content))
                    img.save(full_path, "WEBP")

                    # path สำหรับ frontend
                    local_poster_path = f"/posters/{filename}"

            except Exception as e:
                print(f"Failed to download poster: {e}")

        # save series
        series_info = {
            "title": title,
            "year": date,
            "castings": castings,
            "url": link,
            "trailer": trailer,
            "synopsis": synopsis,
            "poster": local_poster_path
        }
        # series_dict[series_id_counter] = series_info
        page_series[series_id_counter] = series_info
        series_id_counter += 1
        time.sleep(1)

    return page_series
