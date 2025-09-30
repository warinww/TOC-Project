import { createFooter } from "./footer.js";
import { createNavbar } from "./navbar.js";

createNavbar();
createFooter();

// frontend/search_result.ts
interface Series {
  id: number;
  title: string;
  poster: string;    // backend ใส่ key "poster" เป็น /posters/{id}.webp
}

function getQueryParam(title: string) {
  return new URLSearchParams(window.location.search).get(title);
}

const grid = document.querySelector(".series-grid") as HTMLDivElement;
const heading = document.querySelector(".poster-text") as HTMLParagraphElement;

async function runSearch() {
  const inp = getQueryParam("inp") || "";
  heading.textContent = `ผลการค้นหา: "${inp}"`;

  const res = await fetch(`http://127.0.0.1:8000/search?title=${encodeURIComponent(inp)}&scan_all=true`);
  const dataDict: Record<string, Series> = await res.json();

  const items: Series[] = Object.values(dataDict);
  grid.innerHTML = "";

  if (!items.length) {
    const p = document.createElement("p");
    p.textContent = "ไม่พบรายการ";
    grid.appendChild(p);
    return;
  }

  items.forEach(s => {
    const card = document.createElement("div");
    card.className = "series-card";
    card.style.cursor = "pointer";
    card.onclick = () => (window.location.href = `detail.html?id=${s.id}`);

    const img = document.createElement("img");
    img.src = s.poster; // เช่น /posters/123.webp
    img.alt = s.title;
    img.loading = "lazy";

    const titleEl = document.createElement("p");
    titleEl.textContent = s.title;

    card.appendChild(img);
    card.appendChild(titleEl);
    grid.appendChild(card);
  });
}

runSearch();