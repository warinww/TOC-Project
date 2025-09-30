import { createNavbar } from "./navbar.js";
createNavbar();
const onairing = document.createElement("p");
onairing.textContent = "กำลังออนแอร์";
onairing.className = "banner-text";
document.body.appendChild(onairing);
const banner = document.createElement("div");
banner.className = "banner-ad";
// ❌ เอา listener เดิมออก: เราจะตั้ง click ต่อสไลด์ใน buildBanner()
// banner.addEventListener("click", () => { window.location.href = "detail.html"; });
document.body.appendChild(banner);
const posterContainer = document.createElement("div");
posterContainer.className = "poster-container";
const posterText = document.createElement("p");
posterText.textContent = "ซีรี่ย์วายทั้งหมด";
posterText.className = "poster-text";
const yearSelecter = document.createElement("select");
yearSelecter.className = "year-selecter";
for (let year = 2025; year >= 2017; year--) {
    const option = document.createElement("option");
    option.value = year.toString();
    option.textContent = year.toString();
    yearSelecter.appendChild(option);
}
const selectWrapper = document.createElement("div");
selectWrapper.className = "select-wrapper";
selectWrapper.appendChild(yearSelecter);
posterContainer.appendChild(posterText);
posterContainer.appendChild(selectWrapper);
document.body.appendChild(posterContainer);
const gridContainer = document.createElement("div");
gridContainer.className = "series-grid";
document.body.appendChild(gridContainer);
const paginationContainer = document.createElement("div");
paginationContainer.className = "pagination";
paginationContainer.id = "pagination";
document.body.appendChild(paginationContainer);
let seriesData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 15;
// ===== Banner state =====
let bannerIndex = 0;
let bannerItems = [];
let bannerAutoTimer = null;
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
    items.forEach((it) => {
        const slide = document.createElement("div");
        slide.className = "banner-slide";
        slide.style.backgroundImage = `url("${it.poster_url}")`;
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
    // dots
    const dotsWrap = document.createElement("div");
    dotsWrap.className = "banner-dots";
    const dots = items.map((_, i) => {
        const d = document.createElement("button");
        d.className = "dot";
        d.onclick = (ev) => {
            ev.stopPropagation();
            showBanner(i);
        };
        dotsWrap.appendChild(d);
        return d;
    });
    banner.appendChild(dotsWrap);
    // nav buttons (mask วิธี B)
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
            window.location.href = `detail.html?id=${items[bannerIndex].id}`;
        };
    }
    function goBanner(step) {
        showBanner(bannerIndex + step);
    }
    // expose
    window.showBanner = showBanner;
    window.goBanner = goBanner;
    showBanner(0);
    startBannerAutoplay();
}
// helpers (เพื่อ type safety ตอนเรียกจากนอก scope)
function showBanner(i) { var _a, _b; (_b = (_a = window).showBanner) === null || _b === void 0 ? void 0 : _b.call(_a, i); }
function goBanner(step) { var _a, _b; (_b = (_a = window).goBanner) === null || _b === void 0 ? void 0 : _b.call(_a, step); }
// ===== Fetch & init =====
fetch("./data/thai_y_series.json")
    .then((res) => res.json())
    .then((data) => {
    // เติม onair ถ้ายังไม่มี (ถือว่า year === 2025 = onair)
    seriesData = data.map(it => (Object.assign(Object.assign({}, it), { onair: typeof it.onair === "boolean" ? it.onair : (it.year === 2025) })));
    // แบนเนอร์: เฉพาะ onair
    bannerItems = seriesData.filter(s => s.onair === true);
    buildBanner(bannerItems);
    // กริด + เพจ
    filteredData = seriesData;
    currentPage = 1;
    renderSeries(filteredData, currentPage);
    yearSelecter.addEventListener("change", (e) => {
        const selectedYear = parseInt(e.target.value);
        filteredData = seriesData.filter((s) => s.year === selectedYear);
        currentPage = 1;
        renderSeries(filteredData, currentPage);
        // ถ้าอยากให้แบนเนอร์เปลี่ยนตามปีที่เลือกด้วย ให้เปิดสองบรรทัดนี้
        // bannerItems = filteredData.filter(s => s.onair === true);
        // buildBanner(bannerItems);
    });
});
function renderSeries(data, page = 1) {
    gridContainer.innerHTML = "";
    const totalItems = data.length;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = data.slice(start, end);
    if (pageData.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "ไม่พบรายการ";
        gridContainer.appendChild(empty);
    }
    else {
        pageData.forEach((series) => {
            const card = document.createElement("div");
            card.className = "series-card";
            const img = document.createElement("img");
            img.src = series.poster_url;
            img.alt = series.title;
            img.loading = "lazy";
            const title = document.createElement("p");
            title.textContent = series.title;
            card.appendChild(img);
            card.appendChild(title);
            gridContainer.appendChild(card);
        });
    }
    renderPagination(totalItems, page);
}
function renderPagination(totalItems, page) {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    currentPage = Math.min(Math.max(1, page), totalPages);
    paginationContainer.innerHTML = "";
    // ปุ่มก่อนหน้า -> เรียก renderSeries (ไม่ใช่ renderPagination)
    const prevBtn = document.createElement("button");
    prevBtn.className = "nav prev";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => renderSeries(filteredData, currentPage - 1);
    paginationContainer.appendChild(prevBtn);
    const maxVisible = 4;
    const addPageBtn = (p) => {
        const btn = document.createElement("button");
        btn.textContent = String(p);
        if (p === currentPage)
            btn.classList.add("active");
        btn.onclick = () => renderSeries(filteredData, p);
        paginationContainer.appendChild(btn);
    };
    const makeDots = () => {
        const dots = document.createElement("span");
        dots.textContent = "...";
        dots.className = "dots";
        paginationContainer.appendChild(dots);
    };
    if (totalPages <= maxVisible + 2) {
        for (let i = 1; i <= totalPages; i++)
            addPageBtn(i);
    }
    else {
        for (let i = 1; i <= maxVisible; i++)
            addPageBtn(i);
        makeDots();
        addPageBtn(totalPages);
    }
    // ปุ่มถัดไป -> เรียก renderSeries
    const nextBtn = document.createElement("button");
    nextBtn.className = "nav next";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => renderSeries(filteredData, currentPage + 1);
    paginationContainer.appendChild(nextBtn);
}
//# sourceMappingURL=home.js.map