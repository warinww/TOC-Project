import { createNavbar } from "./navbar.js"; // สมมติ navbar เป็น ES module ที่ส่งออกฟังก์ชันนี้
import { createFooter } from "./footer.js";
createNavbar();

/** ====== Types สำหรับ JSON ====== */
type Work = { id: number; name: string; img?: string };
type PageData = {
  id: number;
  title: string;
  coverImage: string;
  description: string;
  gallery: string[];
  maxImages: number;
  works: Work[];
};

/** ====== ยูทิล ====== */
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** ====== กลับหน้าหลัก (รองรับคีย์บอร์ด/ARIA) ====== */
function renderNavigate() {
  const navigate = el("div", "navigate");
  navigate.setAttribute("role", "link");
  navigate.setAttribute("aria-label", "กลับไปหน้ารายละเอียด");
  navigate.tabIndex = 0;

  const icon = el("img", "navigate__icon") as HTMLImageElement;
  icon.src = "../assets/icons/back.svg";
  icon.alt = "";

  const text = el("span", undefined, "กลับไปหน้ารายละเอียด");

  navigate.append(icon, text);
  navigate.addEventListener("click", () => history.back());
  navigate.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      history.back();
    }
  });

  document.body.appendChild(navigate);
}

/** ====== สร้าง DOM หลักจากข้อมูล ====== */
function renderPage(data: PageData) {
  // คอนเทนเนอร์หลัก
  const page = el("div", "page");
  document.body.appendChild(page);

  // ชื่อเรื่อง
  const title = el("p", "title", `${data.title}`);
  page.appendChild(title);

  // ซ้าย-ขวา
  const content = el("div", "content");
  page.appendChild(content);

  // ซ้าย: รูปปก
  const imageWrap = el("div", "image-wrap");
  const cover = el("img") as HTMLImageElement;
  cover.src = data.coverImage;
  cover.alt = data.title;
  imageWrap.appendChild(cover);
  content.appendChild(imageWrap);

  // ขวา: ข้อมูล
  const info = el("div", "info");
  content.appendChild(info);

  const headDesc = el("p", "section-head", "ข้อมูล");
  info.appendChild(headDesc);

  const desc = el("p", "description", data.description);
  info.appendChild(desc);

  // แกลเลอรี (โหลดแบบตรวจสอบก่อนว่ารูปไหนเข้าได้)
  const gallery = el("div", "gallery");
  info.appendChild(gallery);

  const MAX_IMAGES = Math.max(0, data.maxImages ?? 0) || 3;
  let appended = 0;
  let finished = 0;

  const urls = data.gallery ?? [];
  function maybeShowOrRemove() {
    if (finished === urls.length) {
      if (appended === 0) gallery.remove();
      else (gallery as HTMLElement).style.display = "grid";
    }
  }
  function tryAdd(src: string, alt: string) {
    if (!src || !src.trim()) {
      finished++;
      maybeShowOrRemove();
      return;
    }
    const probe = new Image();
    probe.decoding = "async";
    probe.loading = "lazy";
    probe.src = src;

    probe.addEventListener("load", () => {
      if (appended >= MAX_IMAGES) {
        finished++;
        maybeShowOrRemove();
        return;
      }
      const img = el("img") as HTMLImageElement;
      img.src = src;
      img.alt = alt;
      img.loading = "lazy";
      gallery.appendChild(img);
      appended++;
      finished++;
      if (appended === 1) (gallery as HTMLElement).style.display = "grid";
      maybeShowOrRemove();
    });

    probe.addEventListener("error", () => {
      finished++;
      maybeShowOrRemove();
    });
  }
  urls.forEach((src, i) => tryAdd(src, `รูปเพิ่มเติม ${i + 1}`));

  // ผลงาน
  const divWork = el("div", "work");
  page.appendChild(divWork);

  const headWork = el("p", "work__head", "ผลงาน");
  divWork.appendChild(headWork);

  const list = el("div", "work__list");
  divWork.appendChild(list);

  function addWork(name: string, imgUrl?: string) {
    const card = el("div", "work-card");
    const img = el("img", "work-card__img") as HTMLImageElement;
    img.src =
      imgUrl && imgUrl.trim()
        ? imgUrl
        : "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
    img.alt = name;

    const p = el("p", "work-card__name");
    p.append(name, document.createElement("br"));

    card.append(img, p);
    list.appendChild(card);
  }

  (data.works ?? []).forEach(w => addWork(w.name, w.img));
}

/** ====== ดึง JSON แล้วเรนเดอร์ ====== */
async function bootstrap() {
  try {
    // ปรับพาธให้ตรงกับที่วางไฟล์จริง
    const res = await fetch("../data/cast.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch data.json failed: ${res.status}`);
    const data = (await res.json()) as PageData;

    renderNavigate();
    renderPage(data);
  } catch (err) {
    console.error(err);
    renderNavigate();
    const fallback = el("div", "page");
    fallback.innerHTML = `<p>ไม่สามารถโหลดข้อมูลได้</p>`;
    document.body.appendChild(fallback);
  }
}
bootstrap();

createFooter();
