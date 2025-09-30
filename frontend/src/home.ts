import { createNavbar } from "./navbar.js";
import { createFooter } from "./footer.js";

createNavbar();
createFooter();

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

interface Series {
  id: number;
  title: string;
  poster_url: string;
  year: number;
  gender: string;
  onair?: boolean;
}

let seriesData: Series[] = [];
let filteredData: Series[] = [];
let currentPage = 1;
const itemsPerPage = 15;

// ===== Banner state =====
let bannerIndex = 0;
let bannerItems: Series[] = [];
let bannerAutoTimer: number | null = null;

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
  const dots: HTMLButtonElement[] = items.map((_, i) => {
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

 function showBanner(i: number) {
    bannerIndex = (i + items.length) % items.length;
    slides.forEach((s, k) => s.classList.toggle("active", k === bannerIndex));
    dots.forEach((d, k) => d.classList.toggle("active", k === bannerIndex));
    banner.style.cursor = "pointer";

    // คลิก banner -> ไป detail.html?id=<series_id>
    banner.onclick = () => {
        window.location.href = `detail.html?id=${items[bannerIndex].id}`;
    };
}

  function goBanner(step: number) {
    showBanner(bannerIndex + step);
  }

  // expose
  (window as any).showBanner = showBanner;
  (window as any).goBanner = goBanner;

  showBanner(0);
  startBannerAutoplay();
}

// helpers (เพื่อ type safety ตอนเรียกจากนอก scope)
function showBanner(i: number) { (window as any).showBanner?.(i); }
function goBanner(step: number) { (window as any).goBanner?.(step); }

// ===== Fetch & init =====
fetch("http://127.0.0.1:8000/") // เรียก FastAPI endpoint
  .then(res => res.json())
  .then((dataDict: Record<string, any>) => {
    // แปลง dict เป็น array ของ Series
    const data: Series[] = Object.entries(dataDict).map(([id, item]) => ({
      id: parseInt(id),
      title: item.title,
      poster_url: item.poster,
      year: parseInt(item.year),
      gender: "",      // ถ้าไม่มีใน dict กำหนดเป็น empty
      onair: item.onair, // ถือว่า 2025 = onair
      ...item
    }));

    // เติม onair ถ้ายังไม่มี
    seriesData = data.map(it => ({
      ...it,
      onair: typeof it.onair === "boolean" ? it.onair : (it.year === 2025)
    }));

    // แบนเนอร์: เฉพาะ onair
    bannerItems = seriesData.filter(s => s.onair === true);
    buildBanner(bannerItems);

    // กริด + เพจ
    filteredData = seriesData;
    currentPage = 1;
    renderSeries(filteredData, currentPage);

    yearSelecter.addEventListener("change", (e) => {
      const selectedYear = parseInt((e.target as HTMLSelectElement).value);
      filteredData = seriesData.filter((s) => s.year === selectedYear);
      currentPage = 1;
      renderSeries(filteredData, currentPage);

      // ถ้าอยากให้แบนเนอร์เปลี่ยนตามปีที่เลือกด้วย
      // bannerItems = filteredData.filter(s => s.onair === true);
      // buildBanner(bannerItems);
    });
  })
  .catch(err => {
    console.error("Failed to fetch series from API", err);
    banner.textContent = "ไม่สามารถโหลดรายการได้";
  });

  

function renderSeries(data: Series[], page = 1) {
  gridContainer.innerHTML = "";

  const totalItems = data.length;
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = data.slice(start, end);

  if (pageData.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "ไม่พบรายการ";
    gridContainer.appendChild(empty);
  } else {
    pageData.forEach((series: Series) => {
      const card = document.createElement("div");
      card.className = "series-card";

      const img = document.createElement("img");
      img.src = `/posters/${series.id}.webp`;

      img.alt = series.title;
      img.loading = "lazy";

      const title = document.createElement("p");
      title.textContent = series.title;

      card.style.cursor = "pointer";
    card.onclick = () => {
        window.location.href = `detail.html?id=${series.id}`;
    };

      card.appendChild(img);
      card.appendChild(title);
      gridContainer.appendChild(card);
    });
  }

  renderPagination(totalItems, page);
}

function renderPagination(totalItems: number, page: number) {
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

  const addPageBtn = (p: number) => {
    const btn = document.createElement("button");
    btn.textContent = String(p);
    if (p === currentPage) btn.classList.add("active");
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
    for (let i = 1; i <= totalPages; i++) addPageBtn(i);
  } else {
    for (let i = 1; i <= maxVisible; i++) addPageBtn(i);
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
