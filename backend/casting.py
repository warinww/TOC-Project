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

caseing_url = "https://yflix.me/category/casting/page/{}/"

casting_csv_file = "yflix_casting_details.csv"

with open(casting_csv_file, mode="w", newline="", encoding="utf-8-sig") as file:
    writer = csv.writer(file)
    writer.writerow(["all_images" ,"title", "description", "full_name", "nick_name", "birth", "ig_username","ig_link", "work"])

    for page in range(1, 2):
        print(f"Scraping list page {page}...")
        url = caseing_url.format(page)
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"Failed page {page}: {response.status_code}")
            continue

        soup = BeautifulSoup(response.text, "html.parser")
        casting_links = [a.get("href") for a in soup.select(".tdi_45 .td-module-title a")]

        for link in casting_links:
            print(f"Scraping details: {link}")
            res = requests.get(link, headers=headers)
            if res.status_code != 200:
                print(f"Failed to fetch {link}")
                continue

            drtail_soup = BeautifulSoup(res.text, "html.parser")

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
            birth_match = re.search(r'เกิด\s*:\s*(.+?)(?:<br>|</p>)', res.text)
            if birth_match:
                birth = birth_match.group(1).strip()
            else:
                birth = ""
            print("Birth:", birth)

            #ig and link
            ig_match = re.search(r'<a href="([^"]+)">IG\s*:\s*([^<]+)</a>', res.text)
            if ig_match:
                ig_link = ig_match.group(1).strip()
                ig_username = ig_match.group(2).strip()
            else:
                ig_link = ""
                ig_username = ""
            print("IG Username:", ig_username)
            print("IG Link:", ig_link)

            # Description
            desc_match = re.search(
                r'<meta\s+property=["\']og:description["\']\s+content=["\']([^"\']+)["\']',
                res.text,
                re.IGNORECASE
            )
            description = desc_match.group(1).strip() if desc_match else ""

            # กรอง description ให้ตัดข้อความที่เป็นเพียงชื่อ/ชื่อเล่น/วันเกิด/IG
            if any(tag in description for tag in ["ชื่อ-สกุล", "ชื่อเล่น", "เกิด", "IG"]):
                description = ""  # ถ้ามีคำพวกนี้ ละทิ้ง description

            # หรือถ้าต้องการลบชื่อ, ชื่อเล่น, วันเกิดจริง ๆ จาก description
            for text_to_remove in [full_name, nick_name, birth]:
                if text_to_remove:
                    description = description.replace(text_to_remove, "").strip()

            # ตรวจสอบอีกครั้งว่ามีข้อความจริงหรือไม่
            if not description:
                print("No valid description found")
            else:
                print("Description:", description)



            all_images = ", ".join([url.strip() for url in image_matches])
            # Write to CSV
            writer.writerow([all_images, title, description, full_name, nick_name, ig_username, ig_link, birth])

            # Be polite, avoid hammering server
            time.sleep(1)

print(f"Done! All details saved to {casting_csv_file}")
