import requests
from bs4 import BeautifulSoup
import csv
import time
import re
import html

# Base URL of series list
series_url = "https://yflix.me/category/series/page/{}/"

# CSV file
series_csv_file = "yflix_series_details.csv"

# Headers to mimic a browser
headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Referer": "https://yflix.me/",
        }

# Open CSV file for writing
with open(series_csv_file, mode="w", newline="", encoding="utf-8-sig") as file:
    writer = csv.writer(file)
    writer.writerow(["title", "date", "castings", "url_castings", "trailer", "synopsis",  "poster", "coming_soon"])


    # Loop through pages 1-17
    for page in range(2, 3):
        print(f"Scraping list page {page}...")
        url = series_url.format(page)
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"Failed page {page}: {response.status_code}")
            continue

        soup = BeautifulSoup(response.text, "html.parser")
        series_links = [a.get("href") for a in soup.select(".tdi_45 .td-module-title a")]

        for link in series_links:
            print(f"Scraping details: {link}")
            res = requests.get(link, headers=headers)
            if res.status_code != 200:
                print(f"Failed to fetch {link}")
                continue

            detail_soup = BeautifulSoup(res.text, "html.parser")

            #title
            match = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']',
                    res.text, re.DOTALL | re.IGNORECASE)
            if match:
                title = html.unescape(match.group(1).strip())
                print("Title:", title)
            else:
                title = ""
                print("No title found")

            #modified
            modified_date = re.search(
                r'<meta\s+property="article:modified_time"\s+content="(\d{4})-',
                res.text
            )
            if modified_date:
                date = modified_date.group(1)
                print("Modify:", date)
            else:
                date = ""
                print("No Modify found")
                        

            # Castings (multiple)
            castings_matches = re.findall(
                r'<h3 class="entry-title td-module-title">\s*<a href="(https://yflix\.me/casting/[^"]+)"[^>]*>(.*?)</a>\s*</h3>',
                res.text,
                re.DOTALL
            )

            if castings_matches:
                castings = ", ".join([name.strip() for url, name in castings_matches])
                url_castings = ", ".join([url.strip() for url, name in castings_matches])
                print("Castings:", castings)
                print("URLs:", url_castings)
            else:
                castings = ""
                url_castings = ""
                print("No castings found")

            # Trailer (YouTube link)
            trailer_match = re.search(r'<iframe[^>]*src="(https://www\.youtube\.com/[^"]+)"', res.text)
            trailer = trailer_match.group(1) if trailer_match else ""

            # Synopsis
            content_div = detail_soup.find("div", class_="tdb_single_content")
            if content_div:
                paragraphs = [p.get_text(" ", strip=True) for p in content_div.find_all("p")]
                synopsis = " ".join(paragraphs)
                synopsis = html.unescape(synopsis)
                coming_soon = bool(re.search(r"เร็ว\s*ๆ\s*นี้", synopsis))
            else:
                synopsis = ""
                coming_soon = False

            # Poster
            poster_match = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']', res.text)

            if poster_match:
                poster = poster_match.group(1).strip()
            else:
                poster = ""

            # Write to CSV
            writer.writerow([title, date, castings, url_castings, trailer, synopsis, poster, coming_soon])

            # Be polite, avoid hammering server
            time.sleep(1)

print(f"Done! All details saved to {series_csv_file}")