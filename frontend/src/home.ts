// frontend/main.ts
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

// ===== Types =====
interface Series {
  id: number;
  title: string;
  poster_url: string;
  year: number;
  gender: string;
  onair?: boolean;
}

// ===== State =====
let seriesData: Series[] = [];
let filteredData: Series[] = [];
let currentPage = 1;
const itemsPerPage = 20;

// Banner state
let bannerIndex = 0;
let bannerItems: Series[] = [];
let bannerAutoTimer: number | null = null;

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

function buildBanner(items: Series[]) {
  banner.innerHTML = "";
  if (!items.length) {
    banner.textContent = "ไม่มีรายการกำลังออนแอร์";
    banner.style.cursor = "default";
    return;
  }

  const slides: HTMLDivElement[] = [];
  items.forEach(it => {
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

  // Dots
  const dotsWrap = document.createElement("div");
  dotsWrap.className = "banner-dots";
  const dots: HTMLButtonElement[] = items.map((_, i) => {
    const d = document.createElement("button");
    d.className = "dot";
    d.onclick = (ev) => { ev.stopPropagation(); showBanner(i); };
    dotsWrap.appendChild(d);
    return d;
  });
  banner.appendChild(dotsWrap);

  // Nav
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

  function showBanner(i: number) {
    bannerIndex = (i + items.length) % items.length;
    slides.forEach((s, k) => s.classList.toggle("active", k === bannerIndex));
    dots.forEach((d, k) => d.classList.toggle("active", k === bannerIndex));
    banner.style.cursor = "pointer";
    banner.onclick = () => {
      window.location.href = `detail.html?id=${items[bannerIndex].id}`;
    };
  }
  function goBanner(step: number) { showBanner(bannerIndex + step); }

  (window as any).showBanner = showBanner;
  (window as any).goBanner = goBanner;

  showBanner(0);
  startBannerAutoplay();
}

function showBanner(i: number) { (window as any).showBanner?.(i); }
function goBanner(step: number) { (window as any).goBanner?.(step); }

// ===== Fetch & init =====
function fetchPage(page: number) {
  return fetch(`http://127.0.0.1:8000/?page=${page}`)
    .then(res => res.json())
    .then((dataDict: Record<string, any>) => {
      const data: Series[] = Object.entries(dataDict).map(([id, item]) => ({
        id: parseInt(id),
        title: item.title,
        poster_url: item.poster,
        year: parseInt(item.year),
        gender: item.gender ?? "",
        onair: item.onair ?? (item.year === 2025),
        ...item
      }));
      return data;
    });
}

// Load initial page
fetchPage(1).then(data => {
  seriesData = data;
  bannerItems = seriesData.filter(s => s.onair);
  buildBanner(bannerItems);
  filteredData = seriesData;
  currentPage = 1;
  renderSeries(filteredData, currentPage);
});

// Year filter
yearSelecter.addEventListener("change", async (e) => {
  const selectedYear = parseInt((e.target as HTMLSelectElement).value);
  // Refetch page 1 for the selected year
  const data = await fetchPage(1);
  filteredData = data.filter(s => s.year === selectedYear);
  currentPage = 1;
  renderSeries(filteredData, currentPage);
});

// ===== Grid + Pagination =====
async function renderSeries(data: Series[], page = 1) {
  gridContainer.innerHTML = "";
  const pageData = await fetchPage(page);
  filteredData = pageData;
  if (!pageData.length) {
    const empty = document.createElement("p");
    empty.textContent = "ไม่พบรายการ";
    gridContainer.appendChild(empty);
    return;
  }

  pageData.forEach(series => {
    const card = document.createElement("div");
    card.className = "series-card";
    card.style.cursor = "pointer";
    card.onclick = () => window.location.href = `detail.html?id=${series.id}`;

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

  renderPagination(pageData.length, page);
}

function renderPagination(totalItems: number, page: number) {
  const totalPages = 17; // fixed
  currentPage = Math.min(Math.max(1, page), totalPages);
  paginationContainer.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.className = "nav prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => renderSeries(filteredData, currentPage - 1);
  paginationContainer.appendChild(prevBtn);

  const maxVisible = 5; // ปุ่มรอบ current
  const pageButtons: number[] = [];
  pageButtons.push(1);
  for (let i = currentPage - 2; i <= currentPage + 2; i++) {
    if (i > 1 && i < totalPages) pageButtons.push(i);
  }
  if (totalPages > 1) pageButtons.push(totalPages);

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
    if (p === currentPage) btn.classList.add("active");
    btn.onclick = () => renderSeries(filteredData, p);
    paginationContainer.appendChild(btn);
    last = p;
  }

  const nextBtn = document.createElement("button");
  nextBtn.className = "nav next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => renderSeries(filteredData, currentPage + 1);
  paginationContainer.appendChild(nextBtn);
}
