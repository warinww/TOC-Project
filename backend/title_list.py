import requests
from bs4 import BeautifulSoup

def scrape_yflix_series(pages=17):
    base_url = "https://yflix.me/category/series/page/{}/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36",
    }
    
    results = []

    for page in range(1, pages + 1):
        url = base_url.format(page)
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
                    results.append({
                        "title": title,
                        "href": href,
                        "img_url": img_url
                    })
        else:
            print(f"Block with id='tdi_45' not found on page {page}!")
    
    return results

# Example usage
series_data = scrape_yflix_series()
for item in series_data:
    print(item)
