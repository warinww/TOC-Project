import requests
from bs4 import BeautifulSoup
import re
import time

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

def scrape_series(pages=1):
    global series_id_counter, series_dict
    for page in range(1, pages + 1):
        print(f"Scraping list page {page}...")
        url = BASE_URL.format(page)
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"Failed page {page}: {response.status_code}")
            continue

        soup = BeautifulSoup(response.text, "html.parser")
        series_links = [a.get("href") for a in soup.select(".tdi_45 .td-module-title a")]

        for link in series_links:
            res = requests.get(link, headers=headers)
            if res.status_code != 200:
                continue

            detail_soup = BeautifulSoup(res.text, "html.parser")

            # Title
            match = re.search(r'<h1 class="tdb-title-text">(.*?)</h1>', res.text)
            title = match.group(1).strip() if match else ""

            # Year
            modified_date = re.search(
                r'<meta\s+property="article:modified_time"\s+content="(\d{4})-',
                res.text
            )
            date = modified_date.group(1) if modified_date else ""

            # Castings
            castings_matches = re.findall(
                r'<h3 class="entry-title td-module-title">\s*<a href="(https://yflix.me/casting/.*?)/".*?>(.*?)</a>\s*</h3>',
                res.text,
            )
            castings = ", ".join([name.strip() for url, name in castings_matches]) if castings_matches else ""

            # Trailer
            trailer_match = re.search(r'<iframe[^>]*src="(https://www\.youtube\.com/[^"]+)"', res.text)
            trailer = trailer_match.group(1) if trailer_match else ""

            # Synopsis
            synopsis_tags = detail_soup.select(
                ".tdb_single_content .tdb-block-inner > *:not(.wp-block-quote):not(.alignwide):not(.alignfull.wp-block-cover.has-parallax):not(.td-a-ad)"
            )
            synopsis = "\n".join([s.get_text(strip=True) for s in synopsis_tags]) if synopsis_tags else ""

            # Poster
            poster_match = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']', res.text)
            poster = poster_match.group(1).strip() if poster_match else ""
            
            # Save series
            series_info = {
                "title": title,
                "year": date,
                "castings": castings,
                "url": link,
                "trailer": trailer,
                "synopsis": synopsis,
                "poster": poster
            }
            series_dict[series_id_counter] = series_info
            series_id_counter += 1
            time.sleep(1)
    return series_dict
