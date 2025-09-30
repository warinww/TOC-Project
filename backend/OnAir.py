

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
