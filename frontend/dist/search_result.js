var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createFooter } from "./footer.js";
import { createNavbar } from "./navbar.js";
createNavbar();
createFooter();
function getQueryParam(title) {
    return new URLSearchParams(window.location.search).get(title);
}
const grid = document.querySelector(".series-grid");
const heading = document.querySelector(".poster-text");
function runSearch() {
    return __awaiter(this, void 0, void 0, function* () {
        const inp = getQueryParam("inp") || "";
        heading.textContent = `ผลการค้นหา: "${inp}"`;
        const res = yield fetch(`http://127.0.0.1:8000/search?title=${encodeURIComponent(inp)}&scan_all=true`);
        const dataDict = yield res.json();
        const items = Object.values(dataDict);
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
    });
}
runSearch();
//# sourceMappingURL=search_result.js.map