
import requests
from bs4 import BeautifulSoup

url = "https://yflix.me/category/series/page/2/"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
}

html = requests.get(url, headers=headers).text
soup = BeautifulSoup(html, "html.parser")

block = soup.find("div", id="tdi_45")
if block:
    thumbs = block.find_all("div", class_="td-module-thumb")
    
    for thumb in thumbs:
        a_tag = thumb.find("a")
        img_tag = thumb.find("span", class_="entry-thumb")
        
        if a_tag and img_tag:
            title = a_tag.get("title")
            href = a_tag.get("href")
            img_url = img_tag.get("data-img-url")
            print(title, href, img_url)
else:
    print("Block with id='tdi_40' not found!")
