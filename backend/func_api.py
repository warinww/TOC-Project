import requests
from bs4 import BeautifulSoup
import re
import html
from home_crawl import scrape_series_detail


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

# def get_casting_by_URL(url: str) -> dict:
#     print(url)
#     res = requests.get(url, headers=headers)
#     if res.status_code != 200:
#         return {"error": f"Failed to fetch {url}", "status": res.status_code}
#     soup = BeautifulSoup(res.text, "html.parser")

#     # All images
#     image_matches = re.findall(
#         r'<meta\s+[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\'][^>]*>',
#         res.text,
#         re.IGNORECASE
#     )
#     all_images = [url.strip() for url in image_matches] if image_matches else []

#     # Title
#     title_match = re.search(
#         r'<meta\s+[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']+)["\'][^>]*>',
#         res.text,
#         re.IGNORECASE
#     )
#     title = title_match.group(1).strip() if title_match else ""

#     # Full name
#     full_name_match = re.search(r'ชื่อ-สกุล\s*:\s*(.+?)(?:<br>|</p>)', res.text)
#     full_name = full_name_match.group(1).strip() if full_name_match else ""

#     # Nickname
#     nick_match = re.search(r'ชื่อเล่น\s*:\s*(.+?)(?:<br>|</p>)', res.text)
#     nick_name = nick_match.group(1).strip() if nick_match else ""

#     # Birth
#     birth_match = re.search(r'เกิด(?:เมื่อ)?\s*:\s*(.+?)(?:<br>|</p>)', res.text)
#     birth = birth_match.group(1).strip() if birth_match else ""

#     # IG
#     ig_match = re.search(
#         r'<a[^>]*href="([^"]+)"[^>]*>\s*IG\s*:\s*([^<]+)</a>',
#         res.text,
#         re.IGNORECASE
#     )
#     ig_link = ig_match.group(1).strip() if ig_match else ""
#     ig_username = ig_match.group(2).strip() if ig_match else ""

#     # Description
#     description = ""
#     description_more_1 = ""
#     description_more_2 = ""
#     block = soup.find(attrs={"data-td-block-uid": "tdi_77"})
#     if block:
#         inner_div = block.find("div", class_="tdb-block-inner td-fix-index")
#         if inner_div:
#             p_tags = inner_div.find_all("p")
#             if len(p_tags) >= 1:
#                 first_paragraph = p_tags[0].get_text("\n", strip=True)
#                 cleaned = re.sub(r'(ชื่อ-สกุล|ชื่อเล่น|เกิด)\s*:.*(?:\n)?', '', first_paragraph)
#                 parts = cleaned.strip().splitlines()
#                 if parts:
#                     description = parts[0].strip()
#                     description_more_1 = "\n".join(parts[1:]).strip()
#             if len(p_tags) >= 2:
#                 second_p = p_tags[1].get_text("\n", strip=True)
#                 lines = second_p.splitlines()
#                 capture = False
#                 description_more_arr = []
#                 for line in lines:
#                     if line.startswith(("ชื่อ-สกุล :", "ชื่อเล่น :", "เกิด :")):
#                         capture = True
#                         continue
#                     if capture:
#                         description_more_arr.append(line)
#                 description_more_2 = "\n".join(description_more_arr).strip()

#     # Series links
#     series_links = list(set(re.findall(r'href="(https://yflix/.me/series/[%5E"]+)"', res.text)))
#     work = []
#     for link in series_links:
#         # scrape_series_detail(link)
#         if link in url_to_id:
#             sid = url_to_id[link]
#         else:
#             sid = _next_id
#             _next_id += 1
#             url_to_id[link] = sid
#         work.append({
#             "id" : series_dict[sid]["id"],
#             "title" : series_dict[sid]["title"],
#             "poster" : series_dict[sid]["poster"]
#         })

#     print(all_images, title)
#     # Return JSON-ready dict
#     return {
#         "all_images": all_images,
#         "title": title,
#         "full_name": full_name,
#         "nick_name": nick_name,
#         "birth": birth,
#         "ig_username": ig_username,
#         "ig_link": ig_link,
#         "description": description,
#         "description_more_1": description_more_1,
#         "description_more_2": description_more_2,
#         "series_links": series_links
#     }