var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createNavbar } from "./navbar.js";
createNavbar();
const p = document.createElement("p");
p.className = "poster-text";
const div = document.createElement("div");
div.className = "series-grid";
document.body.appendChild(p);
document.body.appendChild(div);
function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}
const grid = document.querySelector(".series-grid");
const heading = document.querySelector(".poster-text");
function runSearch() {
    return __awaiter(this, void 0, void 0, function* () {
        const title = getQueryParam("title") || "";
        const res = yield fetch(`http://127.0.0.1:8000/search?title=${encodeURIComponent(title)}&scan_all=true`);
        const dataDict = yield res.json();
        const items = Object.values(dataDict);
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
            img.src = "http://127.0.0.1:8000/image-proxy?url=" +
                encodeURIComponent(s.poster);
            img.alt = s.title;
            img.loading = "lazy";
            const titleEl = document.createElement("p");
            titleEl.textContent = s.title;
            card.appendChild(img);
            card.appendChild(titleEl);
            grid.appendChild(card);
        });
    });
}
document.addEventListener("DOMContentLoaded", () => {
    runSearch();
});
//# sourceMappingURL=search_result.js.map