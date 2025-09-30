import requests
from bs4 import BeautifulSoup
import csv
import time
import re
import html

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


# Base URL of series list
series_url = "https://yflix.me/category/series/page/{}/"
# series_url = "https://yflix.me/category/casting/page/{}/"

# CSV file
series_csv_file = "yflix_series_details.csv"

# Headers to mimic a browser
series_headers = {
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
        response = requests.get(url, headers=series_headers)
        if response.status_code != 200:
            print(f"Failed page {page}: {response.status_code}")
            continue

        section_html = extract_balanced_div_block(response.text, "tdi_45")

        if section_html:
            series_links = re.findall(
            r'<h3 class="entry-title td-module-title">\s*<a href="(https://yflix\.me/series/[^"]+)"',
                section_html
            )
            # print(f"✅ Found {len(series_links)} series links")
        else:
            # print("❌ Failed to extract section")
            series_links = []


        for link in series_links:
            print(f"Scraping details: {link}")
            res = requests.get(link, headers=series_headers)
            if res.status_code != 200:
                print(f"Failed to fetch {link}")
                continue


            match = re.search(r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']',
                    res.text, re.DOTALL | re.IGNORECASE)
            if match:
                title = html.unescape(match.group(1).strip())
                print("Title:", title)
            else:
                title = ""
                print("No title found")


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
            content_div = extract_balanced_div_block(res.text, "tdi_71")

            if content_div:
                
                paragraphs =  re.findall(r'<p[^>]*>(.*?)</p>', content_div, re.DOTALL)
                synopsis = " ".join(paragraphs)
                synopsis = html.unescape(synopsis)
                # แทน <br>, <p>, </p> ด้วย \n
                synopsis = re.sub(r'</?p\s*/?>|<br\s*/?>', '\n', synopsis, flags=re.IGNORECASE)

                synopsis = re.sub(r'<[^>]+>', ' ', synopsis, flags=re.IGNORECASE)

                # ล้างช่องว่าง/บรรทัดว่างเกิน
                synopsis = re.sub(r'\n\s*\n+', '\n', synopsis)
                synopsis = re.sub(r'[ \t]+', ' ', synopsis)
                synopsis = synopsis.strip()

                
                
                coming_soon = bool(re.search(r"เร็ว\s*ๆ\s*นี้", synopsis))
            else:
                synopsis = ""
                coming_soon = False
                print("No synopsis found")

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