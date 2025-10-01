import requests
from bs4 import BeautifulSoup
import csv
import time
import re
import html
from urllib.parse import unquote, urlparse
from pythainlp.transliterate import romanize


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

with open(casting_csv_file, mode="w", newline="", encoding="utf-8-sig") as file:
    writer = csv.writer(file)
    writer.writerow(["all_images" ,"href"])

    for page in range(4, 5):
        print(f"Scraping list page {page}...")

        url = casting_url.format(page)
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"Failed page {page}: {response.status_code}")
            continue

        soup = BeautifulSoup(response.text, "html.parser")
        casting_links = [a.get("href") for a in soup.select(".tdi_45 .td-module-title a")]

        for link in casting_links:
            # def get_casting_by_URL(url: str) -> dict:
                # global _next_id, _next_cast_id
            headerss = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                            "AppleWebKit/537.36 (KHTML, like Gecko) "
                            "Chrome/120.0.0.0 Safari/537.36",
            }
            res = requests.get(link, headers=headerss)
            if res.status_code != 200:
                print({"error": f"Failed to fetch {link}", "status": res.status_code})
                
            soup = BeautifulSoup(res.text, "html.parser")

            # All images
            image_matches = re.findall(
                r'<meta\s+[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\'][^>]*>',
                res.text,
                re.IGNORECASE
            )
            all_images = [url.strip() for url in image_matches] if image_matches else []

            # Title
            url_match = re.search(
                r'<meta\s+[^>]*property=["\']og:url["\'][^>]*content=["\']([^"\']+)["\'][^>]*>',
                res.text,
                re.IGNORECASE
            )
            href = url_match.group(1).strip() if url_match else ""


            print(all_images, href)

            # Write to CSV
            writer.writerow([all_images, href])

            # Be polite, avoid hammering server
            time.sleep(1)

print(f"Done! All details saved to {casting_csv_file}")

# def thai_url_to_slug(url: str) -> str:
#     # แปลง percent-encoding -> ไทย
#     decoded_url = unquote(url)
    
#     # ตัด path ออกมา
#     path = urlparse(decoded_url).path.strip("/")
#     segments = path.split("/")
    
#     # เอา segment สุดท้ายมาแปลง
#     last_segment = segments[-1]
    
#     # ถอดเสียงไทย -> อังกฤษ
#     slug_parts = [
#         romanize(word, engine="thai2rom") or word
#         for word in last_segment.split("-")
#     ]
#     slug = "-".join(slug_parts).lower()
    
#     # สร้าง path ใหม่
#     new_segments = segments[:-1] + [slug]
#     new_path = "/" + "/".join(new_segments) + "/"
    
#     # ต่อกลับกับ base URL
#     return decoded_url.split(path)[0] + new_path

# # ทดลองใช้
# url = "https://yflix.me/casting/%e0%b8%a7%e0%b8%ad%e0%b8%a3%e0%b9%8c-%e0%b8%a7%e0%b8%99%e0%b8%a3%e0%b8%b1%e0%b8%99%e0%b8%95%e0%b9%8c-%e0%b8%a3%e0%b8%b1%e0%b8%a8%e0%b8%a1%e0%b8%b5%e0%b8%a3%e0%b8%b1%e0%b8%95%e0%b8%99%e0%b9%8c/"
# print(thai_url_to_slug(url))
