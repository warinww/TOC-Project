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
  poster_url: string; // ใน backend ส่งมาชื่อ "poster" แต่เราจะ map เป็น poster_url ตอน parse
  year: number;
  gender: string;
  onair?: boolean;
}

// ===== State =====
let seriesData: Series[] = [];     // ข้อมูลทั้งหมด (โหลดครั้งเดียว)
let filteredData: Series[] = [];   // หลังกรอง (เช่นตามปี)
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

// ===== Fetch (โหลดครั้งเดียว) =====
fetch("http://127.0.0.1:8000/") // API root ที่คืน series_dict ทั้งหมด
  .then(res => res.json())
  .then((dataDict: Record<string, any>) => {
    // map dict -> array
    const data: Series[] = Object.entries(dataDict).map(([id, item]) => ({
      id: parseInt(id, 10),
      title: item.title,
      poster_url: item.poster,        // backend ส่งมาเป็น .poster
      year: parseInt(item.year || "0", 10) || 0,
      gender: item.gender ?? "",
      onair: item.onair ?? (Number(item.year) === 2025),
      ...item
    }));

    seriesData = data;
    filteredData = seriesData;

    // Banner = เฉพาะ onair
    bannerItems = seriesData.filter(s => !!s.onair);
    buildBanner(bannerItems);

    // เรนเดอร์หน้าที่ 1
    currentPage = 1;
    renderSeries(filteredData, currentPage);
  })
  .catch(err => {
    console.error("Failed to fetch series", err);
    banner.textContent = "ไม่สามารถโหลดรายการได้";
  });

// ===== Year filter =====
yearSelecter.addEventListener("change", () => {
  const selectedYear = parseInt((yearSelecter as HTMLSelectElement).value, 10);
  filteredData = seriesData.filter(s => s.year === selectedYear);
  currentPage = 1;
  renderSeries(filteredData, currentPage);
});

// ===== Grid + Pagination (หน้า 20 เรื่อง) =====
function renderSeries(data: Series[], page = 1) {
  gridContainer.innerHTML = "";

  // คำนวณ slice ตามหน้า
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
  } else {
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
  }

  renderPagination(totalItems, currentPage);
}

function renderPagination(totalItems: number, page: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  currentPage = Math.min(Math.max(1, page), totalPages);
  paginationContainer.innerHTML = "";

  // Prev
  const prevBtn = document.createElement("button");
  prevBtn.className = "nav prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => renderSeries(filteredData, currentPage - 1);
  paginationContainer.appendChild(prevBtn);

  // ปุ่มเลขหน้าแบบใส่ขอบรอบ current (… อัตโนมัติ)
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

  // Next
  const nextBtn = document.createElement("button");
  nextBtn.className = "nav next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => renderSeries(filteredData, currentPage + 1);
  paginationContainer.appendChild(nextBtn);
}
