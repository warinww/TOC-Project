
import requests
import re
from bs4 import BeautifulSoup

def scrape_OnAir():
    url = f"https://yflix.me/category/series/page/2/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36",
    }

    html = requests.get(url, headers=headers).text
    soup = BeautifulSoup(html, "html.parser")

    block = soup.find("div", id="tdi_40")
    if not block:
        return {"error": f"Block with id='tdi_40' not found on page 2."}

    results = []
    pattern = re.compile(
        r'<div\s+class=["\']td-module-thumb["\'][^>]*>.*?<a\s+href=["\']([^"\']+)["\']',
        re.DOTALL
    )

    matches = pattern.findall(str(block))

    results = []
    for href in matches:
        results.append(href)
    return results


# data = scrape_OnAir()
# for i in data:
#     print(i)