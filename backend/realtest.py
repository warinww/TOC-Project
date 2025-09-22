import requests
from bs4 import BeautifulSoup
import csv

# Base URL
base_url = "https://yflix.me/category/series/page/{}/"

# CSV file
csv_file = "yflix_series.csv"

# Headers for HTTP request
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
}

# csv_file = r"C:\Users\YOUR_USERNAME\Desktop\yflix_series.csv"
# Open CSV file for writing
with open(csv_file, mode="w", newline="", encoding="utf-8") as file:
    writer = csv.writer(file)
    writer.writerow(["Name", "Link"])  # CSV header

    # Loop through pages 1 to 17
    for page in range(1, 18):
        print(f"Scraping page {page}...")
        url = base_url.format(page)
        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            print(f"Failed to fetch page {page}: {response.status_code}")
            continue

        soup = BeautifulSoup(response.text, "html.parser")
        items = soup.select(".tdi_45 .td-module-title a")

        if not items:
            print(f"No items found on page {page}")
            continue

        # Extract name and link
        for item in items:
            name = item.get_text(strip=True)
            link = item.get("href")
            writer.writerow([name, link])

print(f"Scraping finished! Data saved to {csv_file}")
