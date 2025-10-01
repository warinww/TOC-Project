var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// cast.ts
import { createNavbar } from "./navbar.js";
createNavbar();
/** ====== Config ====== */
const CASTING_API_BASE = "http://127.0.0.1:8000/casting";
const FALLBACK_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png";
/** ====== Utils ====== */
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className)
        node.className = className;
    if (text)
        node.textContent = text;
    return node;
}
function dedupe(arr) { return Array.from(new Set(arr)); }
function qs(key) {
    var _a;
    try {
        return (_a = new URLSearchParams(location.search).get(key)) !== null && _a !== void 0 ? _a : undefined;
    }
    catch (_b) {
        return undefined;
    }
}
function toAbsoluteFrom(base, maybeUrl) {
    if (!maybeUrl)
        return "";
    try {
        return new URL(maybeUrl, base).toString();
    }
    catch (_a) {
        return maybeUrl;
    }
}
function getApiOverride() {
    var _a;
    try {
        return (_a = new URLSearchParams(location.search).get("api")) !== null && _a !== void 0 ? _a : undefined;
    }
    catch (_b) {
        return undefined;
    }
}
function getDetailPage() {
    const v = (document.body.getAttribute("data-detail-page") || "").trim();
    return v || "detail.html";
}
function buildShowHref(absoluteSeriesUrl) {
    const page = getDetailPage();
    const api = getApiOverride();
    const parts = [`url=${encodeURIComponent(absoluteSeriesUrl)}`];
    if (api)
        parts.push(`api=${encodeURIComponent(api)}`);
    return `${page}?${parts.join("&")}`;
}
function buildMergedDescription(raw) {
    var _a, _b, _c;
    const lines = [];
    if (raw.full_name)
        lines.push(`ชื่อจริง: ${raw.full_name}`);
    if (raw.nick_name)
        lines.push(`ชื่อเล่น: ${raw.nick_name}`);
    if (raw.birth)
        lines.push(`วันเกิด: ${raw.birth}`);
    if ((_a = raw.description) === null || _a === void 0 ? void 0 : _a.trim())
        lines.push(raw.description.trim());
    if ((_b = raw.description_more_1) === null || _b === void 0 ? void 0 : _b.trim())
        lines.push(raw.description_more_1.trim());
    if ((_c = raw.description_more_2) === null || _c === void 0 ? void 0 : _c.trim())
        lines.push(raw.description_more_2.trim());
    return lines.join("\n");
}
/** ====== Proxy helpers ====== */
/** join base + path (ไม่ encode /) */
function joinBasePath(base, path) {
    const b = base.endsWith("/") ? base.slice(0, -1) : base;
    const p = path.startsWith("/") ? path.slice(1) : path;
    return `${b}/${p}`;
}
/** origin ของ API สำหรับ proxy (ใช้ ?api= ถ้ามี มิฉะนั้นใช้ CASTING_API_BASE) */
function getApiOrigin() {
    const api = getApiOverride() || CASTING_API_BASE;
    try {
        return new URL(api, document.baseURI).origin;
    }
    catch (_a) {
        return "";
    }
}
/** สร้าง URL proxy สำหรับรูปภาพ */
function viaImageProxy(absUrl) {
    const origin = getApiOrigin();
    if (!origin)
        return absUrl;
    // ถ้าเป็น proxy อยู่แล้ว ไม่ต้องซ้อนทับ
    try {
        const u = new URL(absUrl, document.baseURI);
        if (u.pathname.endsWith("/image-proxy"))
            return absUrl;
    }
    catch (_a) { }
    return joinBasePath(origin, "image-proxy") + "?url=" + encodeURIComponent(absUrl);
}
/** แปลงเป็น absolute แล้วห่อ proxy (ยกเว้น blob:/data:) */
function proxifyImageFrom(base, maybeUrl) {
    if (!maybeUrl)
        return "";
    const raw = String(maybeUrl).trim();
    if (!raw)
        return "";
    if (/^(blob:|data:)/i.test(raw))
        return raw;
    try {
        const abs = new URL(raw, base).toString();
        if (/^[a-z]+:\/\//i.test(abs))
            return viaImageProxy(abs);
        return abs;
    }
    catch (_a) {
        return raw;
    }
}
/** ====== Transform ====== */
function transformToPageData(raw, linkBase) {
    // แปลง all_images -> absolute + proxy แล้วตัดซ้ำ (คงลำดับ)
    const galleryRaw = Array.isArray(raw.all_images) ? raw.all_images.filter(Boolean) : [];
    const imagesAbs = dedupe(galleryRaw.map(u => proxifyImageFrom(linkBase, u)));
    // ชื่อเรื่อง
    const title = (raw.title && raw.title.trim()) ||
        [raw.nick_name, raw.full_name].filter(Boolean).join(" ") ||
        "โปรไฟล์นักแสดง";
    // เอาภาพที่ 1 เป็น cover; gallery ใช้ภาพที่ 2–4
    const coverImage = imagesAbs[0] || FALLBACK_IMG;
    const gallery = imagesAbs.slice(1, 4); // ภาพที่ 2,3,4 (ถ้ามี)
    const description = buildMergedDescription(raw);
    // ผลงาน
    const works = [];
    if (Array.isArray(raw.series_links)) {
        const seen = new Set();
        raw.series_links.forEach((item, idx) => {
            var _a, _b;
            if (!item)
                return;
            const name = String((_b = (_a = item.title) !== null && _a !== void 0 ? _a : item.name) !== null && _b !== void 0 ? _b : "").trim();
            const seriesUrlAbs = item.url ? toAbsoluteFrom(linkBase, item.url) : "";
            // เลือกรูปผลงาน แล้วทำ absolute+proxy
            const chosenImg = (typeof item.img === "string" && item.img.trim())
                ? item.img.trim()
                : (typeof item.image === "string" && item.image.trim())
                    ? item.image.trim()
                    : "";
            const imgAbs = chosenImg ? proxifyImageFrom(linkBase, chosenImg) : "";
            if (!name && !imgAbs && !seriesUrlAbs)
                return;
            const key = `${name}|${imgAbs}|${seriesUrlAbs}`;
            if (seen.has(key))
                return;
            seen.add(key);
            const href = seriesUrlAbs ? buildShowHref(seriesUrlAbs) : undefined;
            works.push({
                id: idx + 1,
                name: name || "ผลงาน",
                img: imgAbs || undefined,
                href,
            });
        });
    }
    return {
        id: 1,
        title,
        coverImage, // ไปแสดงใน image-wrap
        description,
        gallery, // แสดงรูปที่ 2–4
        maxImages: Math.min(3, gallery.length), // safety
        works,
    };
}
/** ====== ปุ่มย้อนกลับ ====== */
function renderNavigate() {
    const nav = el("div", "navigate");
    nav.setAttribute("role", "link");
    nav.setAttribute("aria-label", "ย้อนกลับ");
    nav.tabIndex = 0;
    const icon = el("img", "navigate__icon");
    icon.src = "../assets/icons/back.svg";
    icon.alt = "";
    const text = el("span", undefined, "ย้อนกลับ");
    nav.append(icon, text);
    nav.addEventListener("click", () => history.back());
    document.body.appendChild(nav);
}
/** ====== เรนเดอร์เพจ ====== */
function renderPage(data) {
    var _a, _b, _c;
    const page = el("div", "page");
    document.body.appendChild(page);
    const title = el("p", "title", data.title);
    page.appendChild(title);
    const content = el("div", "content");
    page.appendChild(content);
    // Cover
    const imageWrap = el("div", "image-wrap");
    const cover = el("img");
    cover.src = data.coverImage; // proxified in transformToPageData
    cover.alt = data.title;
    cover.loading = "eager";
    cover.decoding = "async";
    cover.addEventListener("error", () => { cover.src = FALLBACK_IMG; });
    imageWrap.appendChild(cover);
    content.appendChild(imageWrap);
    // Info
    const info = el("div", "info");
    content.appendChild(info);
    info.appendChild(el("p", "section-head", "ข้อมูล"));
    const desc = el("pre", "description");
    desc.textContent = data.description;
    info.appendChild(desc);
    // Gallery (แสดงทันที ไม่ต้องรอโหลดสำเร็จ)
    const gallery = el("div", "gallery");
    info.appendChild(gallery);
    const urls = ((_a = data.gallery) !== null && _a !== void 0 ? _a : []).filter(u => typeof u === "string" && u.trim());
    const MAX_IMAGES = Math.min(urls.length, (_b = data.maxImages) !== null && _b !== void 0 ? _b : 3, 3);
    if (MAX_IMAGES > 0) {
        gallery.style.display = "grid";
    }
    else {
        gallery.remove();
    }
    urls.slice(0, MAX_IMAGES).forEach((src, i) => {
        const img = el("img");
        img.src = src;
        img.alt = `รูปเพิ่มเติม ${i + 1}`;
        img.loading = "lazy";
        img.decoding = "async";
        img.addEventListener("error", () => { img.src = FALLBACK_IMG; });
        gallery.appendChild(img);
    });
    // ====== ผลงาน: แสดงเฉพาะเมื่อมี ======
    const works = ((_c = data.works) !== null && _c !== void 0 ? _c : []).filter((w) => { var _a, _b, _c; return w && (((_a = w.name) === null || _a === void 0 ? void 0 : _a.trim()) || ((_b = w.img) === null || _b === void 0 ? void 0 : _b.trim()) || ((_c = w.href) === null || _c === void 0 ? void 0 : _c.trim())); });
    if (works.length > 0) {
        const divWork = el("div", "work");
        page.appendChild(divWork);
        divWork.appendChild(el("p", "work__head", "ผลงาน"));
        const list = el("div", "work__list");
        divWork.appendChild(list);
        function addWork(name, imgUrl, href) {
            const a = el("a", "work-card");
            a.href = (href && href.trim()) ? href : "#";
            a.setAttribute("aria-label", name);
            const img = el("img", "work-card__img");
            img.src = imgUrl && imgUrl.trim() ? imgUrl : FALLBACK_IMG; // already proxified
            img.alt = name;
            const p = el("p", "work-card__name");
            p.append(name, document.createElement("br"));
            a.append(img, p);
            list.appendChild(a);
        }
        works.forEach((w) => addWork(w.name, w.img, w.href));
    }
}
/** ====== ดึง JSON แล้วเรนเดอร์ ====== */
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const qUrl = qs("url");
            const qId = qs("id");
            let target = CASTING_API_BASE;
            if (qUrl) {
                const u = new URL(CASTING_API_BASE);
                u.searchParams.set("url", qUrl);
                target = u.toString();
            }
            else if (qId) {
                const u = new URL(CASTING_API_BASE);
                u.searchParams.set("id", qId);
                target = u.toString();
            }
            const res = yield fetch(target, { cache: "no-store" });
            if (!res.ok)
                throw new Error(`Fetch casting failed: ${res.status}`);
            const raw = (yield res.json());
            const linkBase = (qUrl ? toAbsoluteFrom(location.href, qUrl) : res.url) || CASTING_API_BASE;
            const data = transformToPageData(raw, linkBase);
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