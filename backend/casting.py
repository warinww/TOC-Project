import requests
from bs4 import BeautifulSoup
import csv
import time
import re
import html

# Headers to mimic a browser
headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Referer": "https://yflix.me/",
        }

casting_url = "https://yflix.me/category/casting/page/{}/"

casting_csv_file = "yflix_casting_details.csv"

# with open(casting_csv_file, mode="w", newline="", encoding="utf-8-sig") as file:
#     writer = csv.writer(file)
#     writer.writerow(["all_images" ,"title", "description", "description_more_1", "description_more_2", "full_name", "nick_name", "birth", "ig_username","ig_link", "work"])

#     for page in range(1, 2):
#         print(f"Scraping list page {page}...")

#         url = casting_url.format(page)
#         response = requests.get(url, headers=headers)
#         if response.status_code != 200:
#             print(f"Failed page {page}: {response.status_code}")
#             continue

#         soup = BeautifulSoup(response.text, "html.parser")
#         casting_links = [a.get("href") for a in soup.select(".tdi_45 .td-module-title a")]

casting_links = ["https://yflix.me/casting/%e0%b8%a0%e0%b8%b9%e0%b8%a7%e0%b8%b4%e0%b8%99%e0%b8%97%e0%b8%a3%e0%b9%8c-%e0%b8%95%e0%b8%b1%e0%b9%89%e0%b8%87%e0%b8%a8%e0%b8%b1%e0%b8%81%e0%b8%94%e0%b8%b4%e0%b9%8c%e0%b8%a2%e0%b8%b7%e0%b8%99/","https://yflix.me/casting/keng-harit/","https://yflix.me/casting/lingling-kwong/"]
for link in casting_links:
    print(f"Scraping details: {link}")
    res = requests.get(link, headers=headers)
    if res.status_code != 200:
        print(f"Failed to fetch {link}")
        continue

    detail_soup = BeautifulSoup(res.text, "html.parser")

    #all_image
    image_matches = re.findall(
        r'<meta\s+[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\'][^>]*>',
        res.text,
        re.IGNORECASE
    )

    if image_matches:
        all_images = ", ".join([url.strip() for url in image_matches])
        print("All Images:", all_images)
    else:
        all_images = ""
        print("No images found")

    #title
    title_match = re.search(
        r'<meta\s+[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']+)["\'][^>]*>',
        res.text,
        re.IGNORECASE
    )

    if title_match:
        title = title_match.group(1).strip()
        print("Title:", title)
    else:
        title = ""
        print("No title found")


    #full_name
    full_name_match = re.search(r'ชื่อ-สกุล\s*:\s*(.+?)(?:<br>|</p>)', res.text)
    if full_name_match:
        full_name = full_name_match.group(1).strip()
    else:
        full_name = ""
    print("Full Name:", full_name)
    
    #nick name
    nick_match = re.search(r'ชื่อเล่น\s*:\s*(.+?)(?:<br>|</p>)', res.text)
    if nick_match:
        nick_name = nick_match.group(1).strip()
    else:
        nick_name = ""
    print("Nickname:", nick_name)

    #birth
    birth_match = re.search(r'เกิด(?:เมื่อ)?\s*:\s*(.+?)(?:<br>|</p>)', res.text)
    if birth_match:
        birth = birth_match.group(1).strip()
    else:
        birth = ""
    print("Birth:", birth)
    
    # หา IG + ลิงก์
    ig_match = re.search(
        r'<a[^>]*href="([^"]+)"[^>]*>\s*IG\s*:\s*([^<]+)</a>',
        res.text,
        re.IGNORECASE
    )

    if ig_match:
        ig_link = ig_match.group(1).strip()       # https://www.instagram.com/williamjkp
        ig_username = ig_match.group(2).strip()   # williamjkp
    else:
        ig_link = ""
        ig_username = ""

    print("IG Username:", ig_username)
    print("IG Link:", ig_link)
    
    # description
    description = ""
    block = detail_soup.find(attrs={"data-td-block-uid": "tdi_77"})

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

    if not description:
        print("No valid description found")
    else:
        print("Description:", description)


    series_links = re.findall(r'href="(https://yflix\.me/series/[^"]+)"', res.text)
    series_links = list(set(series_links))

    for link in series_links:
        print("series_match:", link)
    print()



    all_images = ", ".join([url.strip() for url in image_matches])
    # Write to CSV
    # writer.writerow([all_images, title, description, description_more_1, description_more_2, full_name, nick_name, birth, ig_username, ig_link, series_links])

    # Be polite, avoid hammering server
    time.sleep(1)

print(f"Done! All details saved to {casting_csv_file}")