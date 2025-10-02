import { createFooter } from "./footer.js";
import { createNavbar } from "./navbar.js";

createNavbar();


const p = document.createElement("p");
p.className = "poster-text";

const div = document.createElement("div");
div.className = "series-grid";

document.body.appendChild(p);
document.body.appendChild(div);

// frontend/search_result.ts
interface Series {
  id: number;
  title: string;
  poster: string;    // backend ใส่ key "poster" เป็น /posters/{id}.webp
  url: string;
}

function getQueryParam(name: string) {
  return new URLSearchParams(window.location.search).get(name);
}

const grid = document.querySelector(".series-grid") as HTMLDivElement;
const heading = document.querySelector(".poster-text") as HTMLParagraphElement;

async function runSearch() {
  const title = getQueryParam("title") || "";

  const res = await fetch(`http://0.0.0.0:8000/search?title=${encodeURIComponent(title)}&scan_all=true`);
  const dataDict: Record<string, Series> = await res.json();

  const items: Series[] = Object.values(dataDict);
  grid.innerHTML = "";

  if (!items.length) {
    const p = document.createElement("p");
    p.textContent = "ไม่พบรายการ";
    grid.appendChild(p);
    return;
  }

  heading.textContent = `ผลการค้นหา: "${title}" ทั้งหมด ${items.length} รายการ`;

  items.forEach(s => {
    const card = document.createElement("div");
    card.className = "series-card";
    card.style.cursor = "pointer";
    card.onclick = () => (window.location.href = `detail.html?url=${encodeURIComponent(s.url)}`);

    const img = document.createElement("img");
    img.src =  "http://0.0.0.0:8000/image-proxy?url=" +
      encodeURIComponent(s.poster);
    img.alt = s.title;
    img.loading = "lazy";

    const titleEl = document.createElement("p");
    titleEl.textContent = s.title;

    card.appendChild(img);
    card.appendChild(titleEl);
    grid.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
    runSearch();
});