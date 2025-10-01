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
import { createFooter } from "./footer.js";
createNavbar();
createFooter();
// ===== Elements =====
const onairing = document.createElement("p");
onairing.textContent = "กำลังออนแอร์";
onairing.className = "banner-text";
document.body.appendChild(onairing);
const banner = document.createElement("div");
banner.className = "banner-ad";
document.body.appendChild(banner);
const posterText = document.createElement("p");
posterText.textContent = "ซีรี่ย์วายทั้งหมด";
posterText.className = "poster-text";
document.body.appendChild(posterText);
const gridContainer = document.createElement("div");
gridContainer.className = "series-grid";
document.body.appendChild(gridContainer);
const paginationContainer = document.createElement("div");
paginationContainer.className = "pagination";
paginationContainer.id = "pagination";
document.body.appendChild(paginationContainer);
// ===== State =====
let seriesData = []; // ข้อมูลทั้งหมด
let filteredData = []; // หลังกรอง
let currentPage = 1;
const itemsPerPage = 20;
// Banner state
let bannerIndex = 0;
let bannerItems = [];
let bannerAutoTimer = null;
// ===== Banner functions =====
function startBannerAutoplay() {
    stopBannerAutoplay();
    bannerAutoTimer = window.setInterval(() => goBanner(+1), 4000);
}
function stopBannerAutoplay() {
    if (bannerAutoTimer !== null) {
        clearInterval(bannerAutoTimer);
        bannerAutoTimer = null;
    }
}
function buildBanner(items) {
    banner.innerHTML = "";
    if (!items.length) {
        banner.textContent = "ไม่มีรายการกำลังออนแอร์";
        banner.style.cursor = "default";
        return;
    }
    const slides = [];
    items.forEach(it => {
        const slide = document.createElement("div");
        slide.className = "banner-slide";
        // ใช้ img แทน background-image
        const img = document.createElement("img");
        img.src = "http://127.0.0.1:8000/image-proxy?url=" + encodeURIComponent(it.poster_url);
        img.alt = it.title;
        img.className = "banner-img"; // ถ้าต้องใช้ style
        slide.appendChild(img);
        const overlay = document.createElement("div");
        overlay.className = "banner-overlay";
        const cap = document.createElement("div");
        cap.className = "banner-caption";
        cap.textContent = it.title;
        overlay.appendChild(cap);
        slide.appendChild(overlay);
        banner.appendChild(slide);
        slides.push(slide);
    });
    // Dots และ navigation code เหมือนเดิม
    const dotsWrap = document.createElement("div");
    dotsWrap.className = "banner-dots";
    const dots = items.map((_, i) => {
        const d = document.createElement("button");
        d.className = "dot";
        d.onclick = (ev) => { ev.stopPropagation(); showBanner(i); };
        dotsWrap.appendChild(d);
        return d;
    });
    banner.appendChild(dotsWrap);
    const prev = document.createElement("button");
    prev.className = "banner-btn prev";
    prev.setAttribute("aria-label", "Previous");
    prev.onclick = (ev) => { ev.stopPropagation(); goBanner(-1); };
    const next = document.createElement("button");
    next.className = "banner-btn next";
    next.setAttribute("aria-label", "Next");
    next.onclick = (ev) => { ev.stopPropagation(); goBanner(+1); };
    banner.appendChild(prev);
    banner.appendChild(next);
    banner.addEventListener("mouseenter", stopBannerAutoplay);
    banner.addEventListener("mouseleave", startBannerAutoplay);
    function showBanner(i) {
        bannerIndex = (i + items.length) % items.length;
        slides.forEach((s, k) => s.classList.toggle("active", k === bannerIndex));
        dots.forEach((d, k) => d.classList.toggle("active", k === bannerIndex));
        banner.style.cursor = "pointer";
        banner.onclick = () => {
            window.location.href = `detail.html?url=${encodeURIComponent(items[bannerIndex].url)}`;
        };
    }
    function goBanner(step) { showBanner(bannerIndex + step); }
    window.showBanner = showBanner;
    window.goBanner = goBanner;
    showBanner(0);
    startBannerAutoplay();
}
function showBanner(i) { var _a, _b; (_b = (_a = window).showBanner) === null || _b === void 0 ? void 0 : _b.call(_a, i); }
function goBanner(step) { var _a, _b; (_b = (_a = window).goBanner) === null || _b === void 0 ? void 0 : _b.call(_a, step); }
// ===== Fetch series & onair =====
function loadSeries() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 1. Fetch all series
            const resAll = yield fetch("http://127.0.0.1:8000/");
            const exportbt = document.getElementById("exportcsv");
            exportbt === null || exportbt === void 0 ? void 0 : exportbt.removeAttribute("disabled");
            const dataDict = yield resAll.json();
            seriesData = Object.entries(dataDict).map(([id, item]) => {
                var _a, _b;
                return ({
                    id: parseInt(id, 10),
                    url: item.url,
                    title: item.title,
                    poster_url: item.poster,
                    year: parseInt(item.year || "0", 10) || 0,
                    gender: (_a = item.gender) !== null && _a !== void 0 ? _a : "",
                    onair: (_b = item.onair) !== null && _b !== void 0 ? _b : false
                });
            });
            filteredData = seriesData;
            // 2. Fetch onair series
            const resOnAir = yield fetch("http://127.0.0.1:8000/api/series/OnAir");
            const onairDict = yield resOnAir.json();
            bannerItems = Object.values(onairDict).map(item => {
                var _a;
                return ({
                    id: item.id,
                    url: item.url,
                    title: item.title,
                    poster_url: item.poster,
                    year: parseInt(item.year || "0", 10) || 0,
                    gender: (_a = item.gender) !== null && _a !== void 0 ? _a : "",
                    onair: true
                });
            });
            buildBanner(bannerItems);
            // Render page 1
            currentPage = 1;
            renderSeries(filteredData, currentPage);
        }
        catch (err) {
            console.error("Failed to fetch series", err);
            banner.textContent = "ไม่สามารถโหลดรายการได้";
        }
    });
}
loadSeries();
// ===== Grid + Pagination =====
function renderSeries(data, page = 1) {
    gridContainer.innerHTML = "";
    const totalItems = data.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = data.slice(start, end);
    if (!pageData.length) {
        const empty = document.createElement("p");
        empty.textContent = "ไม่พบรายการ";
        gridContainer.appendChild(empty);
    }
    else {
        pageData.forEach(series => {
            const card = document.createElement("div");
            card.className = "series-card";
            card.style.cursor = "pointer";
            card.onclick = () => {
                window.location.href = `detail.html?url=${encodeURIComponent(series.url)}`;
            };
            const img = document.createElement("img");
            img.src = "http://127.0.0.1:8000/image-proxy?url=" +
                encodeURIComponent(series.poster_url);
            img.alt = series.title;
            img.loading = "lazy";
            const title = document.createElement("p");
            title.textContent = series.title;
            card.appendChild(img);
            card.appendChild(title);
            gridContainer.appendChild(card);
        });
    }
    renderPagination(totalItems, currentPage);
}
function renderPagination(totalItems, page) {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    currentPage = Math.min(Math.max(1, page), totalPages);
    paginationContainer.innerHTML = "";
    // Prev
    const prevBtn = document.createElement("button");
    prevBtn.className = "nav prev";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => renderSeries(filteredData, currentPage - 1);
    paginationContainer.appendChild(prevBtn);
    // Page buttons
    const pageButtons = [];
    pageButtons.push(1);
    for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        if (i > 1 && i < totalPages)
            pageButtons.push(i);
    }
    if (totalPages > 1)
        pageButtons.push(totalPages);
    let last = 0;
    for (const p of pageButtons) {
        if (p - last > 1) {
            const dots = document.createElement("span");
            dots.className = "dots";
            dots.textContent = "...";
            paginationContainer.appendChild(dots);
        }
        const btn = document.createElement("button");
        btn.textContent = String(p);
        if (p === currentPage)
            btn.classList.add("active");
        btn.onclick = () => renderSeries(filteredData, p);
        paginationContainer.appendChild(btn);
        last = p;
    }
    // Next
    const nextBtn = document.createElement("button");
    nextBtn.className = "nav next";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => renderSeries(filteredData, currentPage + 1);
    paginationContainer.appendChild(nextBtn);
}
//# sourceMappingURL=home.js.map