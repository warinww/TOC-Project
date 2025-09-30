var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createNavbar } from "./navbar.js"; // สมมติ navbar เป็น ES module ที่ส่งออกฟังก์ชันนี้
createNavbar();
/** ====== ยูทิล ====== */
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className)
        node.className = className;
    if (text)
        node.textContent = text;
    return node;
}
/** ====== กลับหน้าหลัก (รองรับคีย์บอร์ด/ARIA) ====== */
function renderNavigate() {
    const navigate = el("div", "navigate");
    navigate.setAttribute("role", "link");
    navigate.setAttribute("aria-label", "กลับไปหน้าหลัก");
    navigate.tabIndex = 0;
    const icon = el("img", "navigate__icon");
    icon.src = "../assets/icons/back.svg";
    icon.alt = "";
    const text = el("span", undefined, "กลับไปหน้าหลัก");
    navigate.append(icon, text);
    navigate.addEventListener("click", () => (window.location.href = "index.html"));
    navigate.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            window.location.href = "index.html";
        }
    });
    document.body.appendChild(navigate);
}
/** ====== สร้าง DOM หลักจากข้อมูล ====== */
function renderPage(data) {
    var _a, _b, _c;
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
    const cover = el("img");
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
    const MAX_IMAGES = Math.max(0, (_a = data.maxImages) !== null && _a !== void 0 ? _a : 0) || 3;
    let appended = 0;
    let finished = 0;
    const urls = (_b = data.gallery) !== null && _b !== void 0 ? _b : [];
    function maybeShowOrRemove() {
        if (finished === urls.length) {
            if (appended === 0)
                gallery.remove();
            else
                gallery.style.display = "grid";
        }
    }
    function tryAdd(src, alt) {
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
            const img = el("img");
            img.src = src;
            img.alt = alt;
            img.loading = "lazy";
            gallery.appendChild(img);
            appended++;
            finished++;
            if (appended === 1)
                gallery.style.display = "grid";
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
    function addWork(name, imgUrl) {
        const card = el("div", "work-card");
        const img = el("img", "work-card__img");
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
    ((_c = data.works) !== null && _c !== void 0 ? _c : []).forEach(w => addWork(w.name, w.img));
}
/** ====== ดึง JSON แล้วเรนเดอร์ ====== */
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // ปรับพาธให้ตรงกับที่วางไฟล์จริง
            const res = yield fetch("../data/cast.json", { cache: "no-store" });
            if (!res.ok)
                throw new Error(`Fetch data.json failed: ${res.status}`);
            const data = (yield res.json());
            renderNavigate();
            renderPage(data);
        }
        catch (err) {
            console.error(err);
            renderNavigate();
            const fallback = el("div", "page");
            fallback.innerHTML = `<p>ไม่สามารถโหลดข้อมูลได้</p>`;
            document.body.appendChild(fallback);
        }
    });
}
bootstrap();
//# sourceMappingURL=cast.js.map