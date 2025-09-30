

# from bs4 import BeautifulSoup
# import requests

# base_url = "https://yflix.me/"
# headers = {
#     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
#                   "AppleWebKit/537.36 (KHTML, like Gecko) "
#                   "Chrome/120.0.0.0 Safari/537.36",
# }

# response = requests.get(base_url, headers=headers)
# html_text = response.text
# soup = BeautifulSoup(html_text, "html.parser")

# # Map tdi IDs to weekdays
# tdi_to_day = {
#     "tdi_39": "monday",
#     "tdi_40": "tuesday",
#     "tdi_41": "wednesday",
#     "tdi_42": "thursday",
#     "tdi_43": "friday",
#     "tdi_44": "saturday",
#     "tdi_45": "sunday",
# }

# week_dict = {}  # Outer dict: day -> {title: [href, img_url]}

# for tdi_id, day in tdi_to_day.items():
#     block = soup.find("div", id=tdi_id)
#     if not block:
#         continue
#     day_dict = {}
#     for module in block.select(".td-module-thumb"):
#         a_tag = module.find("a")
#         if not a_tag:
#             continue
#         title = a_tag['title']
#         href = a_tag['href']
#         img_span = module.find("span", {"data-img-url": True})
#         img_url = img_span['data-img-url'] if img_span else None
#         day_dict[title] = [href, img_url]
#     week_dict[day] = day_dict

# for day, titles in week_dict.items():
#     print(f"=== {day.upper()} ===")
#     for title, info in titles.items():
#         print(title, info)
from bs4 import BeautifulSoup
import requests
import csv
import time
import re
import html

url = "https://yflix.me/casting/keng-harit/"
# url="https://yflix.me/casting/lingling-kwong/"
url = "https://yflix.me/casting/hearth-chindanai-2/"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
}

html = requests.get(url, headers=headers).text
soup = BeautifulSoup(html, "html.parser")
block = soup.find(attrs={"data-td-block-uid": "tdi_77"})

if block:
    inner_div = block.find("div", class_="tdb-block-inner td-fix-index")
    if inner_div:
        p_tags = inner_div.find_all("p")

        # --- จัดการ <p> ตัวแรก ---
        description = ""
        description_more_1 = ""
        if len(p_tags) >= 1:
            first_paragraph = p_tags[0].get_text("\n", strip=True)

            # ตัดบรรทัดที่ไม่ต้องการออก
            cleaned = re.sub(r'(ชื่อ-สกุล|ชื่อเล่น|เกิด)\s*:.*(?:\n)?', '', first_paragraph)
            print(cleaned)
            print("--------------------")

            parts = cleaned.strip().splitlines()
            for part in parts:
                print(part)
            print("--------------------")

            if parts:
                description = parts[0].strip()
                description_more_1 = "\n".join(parts[1:]).strip()

        # --- จัดการ <p> ตัวที่สอง ---
        description_more_2 = ""
        if len(p_tags) >= 2:
            second_p = p_tags[1].get_text("\n", strip=True)
            lines = second_p.splitlines()

            capture = False
            description_more_arr = []
            for line in lines:
                if line.startswith(("ชื่อ-สกุล :", "ชื่อเล่น :", "เกิด :")):
                    capture = True
                    continue
                if capture:
                    description_more_arr.append(line)

            description_more_2 = "\n".join(description_more_arr).strip()

        # --- Debug print ---
        if not description:
            print("No valid description found")
        else:
            print("Description:", description)
            print("Description more 1:", description_more_1)
            print("Description more 2:", description_more_2)