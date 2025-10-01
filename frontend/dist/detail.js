var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// show-detail.ts
import { createNavbar } from "./navbar.js";
import { createFooter } from "./footer.js";
createNavbar();
const DEFAULT_COLLECTION_URL = "http://127.0.0.1:8000/series/detail";
const FALLBACK_IMG = "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
function toNumId(v) {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
}
function joinUrl(base, id) {
    const b = base.endsWith("/") ? base.slice(0, -1) : base;
    const i = id.startsWith("/") ? id.slice(1) : id;
    return `${b}/${encodeURIComponent(i)}`;
}
function getQueryParams() {
    var _a, _b;
    try {
        const sp = new URLSearchParams(location.search);
        const id = (_a = sp.get("id")) !== null && _a !== void 0 ? _a : undefined;
        const url = (_b = sp.get("url")) !== null && _b !== void 0 ? _b : undefined;
        return { id, url };
    }
    catch (_c) {
        return {};
    }
}
/* -------- Image cache helpers (Cache Storage + ObjectURL) -------- */
const POSTER_CACHE_NAME = "posters-v1";
/** คืน base URL ของโฟลเดอร์ ./posters/ */
function postersBaseURL() {
    return new URL("./posters/", document.baseURI).toString();
}
/** เช็คว่ามีไฟล์รูปโลคอลจริงไหม */
function imageExists(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const r = yield fetch(url, { method: "GET", cache: "no-store" });
            return r.ok;
        }
        catch (_a) {
            return false;
        }
    });
}
function cacheMatchBlob(key) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!("caches" in window))
            return undefined;
        try {
            const cache = yield caches.open(POSTER_CACHE_NAME);
            const res = yield cache.match(key);
            if (res && res.ok)
                return yield res.blob();
        }
        catch (_a) { }
        return undefined;
    });
}
function cachePutBlob(key, blob, contentType) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!("caches" in window))
            return;
        try {
            const cache = yield caches.open(POSTER_CACHE_NAME);
            const headers = new Headers();
            headers.set("Content-Type", contentType || blob.type || "application/octet-stream");
            const resp = new Response(blob, { headers });
            yield cache.put(key, resp);
        }
        catch (_a) { }
    });
}
/**
 * ลำดับการหา src ของโปสเตอร์:
 * 1) ./posters/{id}.webp
 * 2) blob ใน CacheStorage (/cached-posters/{id})
 * 3) ใช้ remoteUrl → ดาวน์โหลด + แคช → ObjectURL
 * 4) FALLBACK_IMG
 */
function resolvePosterSrc(id, remoteUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const localPath = new URL(`./${encodeURIComponent(id)}.webp`, postersBaseURL()).toString();
        if (yield imageExists(localPath)) {
            return { src: localPath };
        }
        const cacheKey = `/cached-posters/${encodeURIComponent(id)}`;
        const cachedBlob = yield cacheMatchBlob(cacheKey);
        if (cachedBlob) {
            const url = URL.createObjectURL(cachedBlob);
            return { src: url, revokeLater: url };
        }
        if (remoteUrl) {
            try {
                const r = yield fetch(remoteUrl, { cache: "force-cache" });
                if (r.ok) {
                    const blob = yield r.blob();
                    yield cachePutBlob(cacheKey, blob, r.headers.get("Content-Type") || undefined);
                    const url = URL.createObjectURL(blob);
                    return { src: url, revokeLater: url };
                }
            }
            catch (_a) { }
        }
        return { src: FALLBACK_IMG };
    });
}
/* ---------------- Web Component ---------------- */
export class ShowDetail extends HTMLElement {
    static get observedAttributes() {
        return [
            "show-title",
            "year",
            "image",
            "description",
            "trailer",
            "back-href",
            "cast",
            "data-src",
            "show-id",
        ];
    }
    constructor() {
        super();
        this._cast = [];
        this._dataLoaded = false;
        this._objectUrls = [];
        this.attachShadow({ mode: "open" });
    }
    disconnectedCallback() {
        for (const u of this._objectUrls)
            URL.revokeObjectURL(u);
        this._objectUrls = [];
        if (this._abortCtrl)
            this._abortCtrl.abort();
    }
    set cast(arr) {
        if (Array.isArray(arr)) {
            this._cast = arr.map((v) => ({
                id: toNumId(v.id),
                first: String(v.first || ""),
                last: String(v.last || ""),
                img: v.img || "",
                href: v.href || "",
            }));
            this.render();
        }
    }
    get cast() {
        return this._cast;
    }
    connectedCallback() {
        const legacyTitle = this.getAttribute("title");
        if (legacyTitle && !this.getAttribute("show-title")) {
            this.setAttribute("show-title", legacyTitle);
        }
        if (this.hasAttribute("title"))
            this.removeAttribute("title");
        if (this.shadowRoot && !this._contentRoot) {
            const link = document.createElement("link");
            link.setAttribute("rel", "stylesheet");
            link.setAttribute("href", "detail.css");
            const content = document.createElement("div");
            content.setAttribute("id", "root");
            this.shadowRoot.append(link, content);
            this._contentRoot = content;
        }
        this.loadData().finally(() => {
            this._dataLoaded = true;
            this.render();
        });
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if ((name === "data-src" || name === "show-id") && oldValue !== newValue) {
            this._dataLoaded = false;
            this.loadData().finally(() => {
                this._dataLoaded = true;
                this.render();
            });
            return;
        }
        if (this._dataLoaded)
            this.render();
    }
    /** โหมดโหลดข้อมูล:
     * - ถ้ามี ?url=... → เรียก {data-src}?url=<encoded>
     * - ถ้าไม่มีก็ใช้ ?id=... หรือ attribute show-id → เรียก {data-src}/{id}
     */
    loadData() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            const collectionUrl = ((_a = this.getAttribute("data-src")) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_COLLECTION_URL;
            const attrId = (_b = this.getAttribute("show-id")) === null || _b === void 0 ? void 0 : _b.trim();
            const { id: qId, url: qUrl } = getQueryParams();
            let fetchUrl;
            if (qUrl) {
                const u = new URL(collectionUrl);
                u.searchParams.set("url", qUrl);
                fetchUrl = u.toString();
            }
            else {
                const sid = attrId || qId;
                if (!sid) {
                    this.applyAttributesFallback();
                    return;
                }
                fetchUrl = joinUrl(collectionUrl, sid);
            }
            if (this._abortCtrl)
                this._abortCtrl.abort();
            this._abortCtrl = new AbortController();
            try {
                const res = yield fetch(fetchUrl, {
                    signal: this._abortCtrl.signal,
                    cache: "no-store",
                });
                if (!res.ok)
                    throw new Error(`HTTP ${res.status}`);
                const raw = (yield res.json());
                // โปสเตอร์จาก API (รองรับหลายชื่อฟิลด์)
                const posterRemote = (_e = (_d = (_c = raw === null || raw === void 0 ? void 0 : raw.image) !== null && _c !== void 0 ? _c : raw === null || raw === void 0 ? void 0 : raw.poster) !== null && _d !== void 0 ? _d : raw === null || raw === void 0 ? void 0 : raw.poster_url) !== null && _e !== void 0 ? _e : undefined;
                // sid สำหรับหาภาพโลคอล/แคช
                const sidForPoster = (attrId || qId || (raw === null || raw === void 0 ? void 0 : raw.id) || "").toString();
                const { src: posterSrc, revokeLater } = yield resolvePosterSrc(sidForPoster, posterRemote);
                if (revokeLater)
                    this._objectUrls.push(revokeLater);
                // map fields ให้สอดคล้องข้อมูลตัวอย่าง
                const data = {
                    id: toNumId((_f = raw === null || raw === void 0 ? void 0 : raw.id) !== null && _f !== void 0 ? _f : qId),
                    title: (_h = (_g = raw === null || raw === void 0 ? void 0 : raw.title) !== null && _g !== void 0 ? _g : raw === null || raw === void 0 ? void 0 : raw.name) !== null && _h !== void 0 ? _h : "",
                    year: String((_l = (_k = (_j = raw === null || raw === void 0 ? void 0 : raw.year) !== null && _j !== void 0 ? _j : raw === null || raw === void 0 ? void 0 : raw.release_year) !== null && _k !== void 0 ? _k : raw === null || raw === void 0 ? void 0 : raw.date) !== null && _l !== void 0 ? _l : ""),
                    image: posterSrc,
                    description: (_p = (_o = (_m = raw === null || raw === void 0 ? void 0 : raw.description) !== null && _m !== void 0 ? _m : raw === null || raw === void 0 ? void 0 : raw.synopsis) !== null && _o !== void 0 ? _o : raw === null || raw === void 0 ? void 0 : raw.overview) !== null && _p !== void 0 ? _p : "",
                    trailer: (_r = (_q = raw === null || raw === void 0 ? void 0 : raw.trailer) !== null && _q !== void 0 ? _q : raw === null || raw === void 0 ? void 0 : raw.trailer_url) !== null && _r !== void 0 ? _r : "",
                    backHref: this.getAttribute("back-href") || "index.html",
                    cast: Array.isArray(raw === null || raw === void 0 ? void 0 : raw.cast)
                        ? raw.cast.map((v) => {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                            return ({
                                id: toNumId(v === null || v === void 0 ? void 0 : v.id),
                                first: String((_b = (_a = v === null || v === void 0 ? void 0 : v.first) !== null && _a !== void 0 ? _a : v === null || v === void 0 ? void 0 : v.firstname) !== null && _b !== void 0 ? _b : "").trim(),
                                last: String((_d = (_c = v === null || v === void 0 ? void 0 : v.last) !== null && _c !== void 0 ? _c : v === null || v === void 0 ? void 0 : v.lastname) !== null && _d !== void 0 ? _d : "").trim(),
                                img: (_g = (_f = (_e = v === null || v === void 0 ? void 0 : v.img) !== null && _e !== void 0 ? _e : v === null || v === void 0 ? void 0 : v.image) !== null && _f !== void 0 ? _f : v === null || v === void 0 ? void 0 : v.photo) !== null && _g !== void 0 ? _g : "",
                                href: (_j = (_h = v === null || v === void 0 ? void 0 : v.href) !== null && _h !== void 0 ? _h : v === null || v === void 0 ? void 0 : v.url) !== null && _j !== void 0 ? _j : "",
                            });
                        })
                        : Array.isArray(raw === null || raw === void 0 ? void 0 : raw.castings)
                            ? raw.castings.map((item, idx) => {
                                var _a, _b, _c, _d, _e, _f;
                                // โครงสร้าง { name, url, image }
                                const name = String((_a = item === null || item === void 0 ? void 0 : item.name) !== null && _a !== void 0 ? _a : "").trim();
                                const parts = name.split(/\s+/);
                                const first = (_b = parts[0]) !== null && _b !== void 0 ? _b : "";
                                const last = (_c = parts[1]) !== null && _c !== void 0 ? _c : "";
                                return {
                                    id: (_d = toNumId(item === null || item === void 0 ? void 0 : item.id)) !== null && _d !== void 0 ? _d : idx + 1,
                                    first,
                                    last,
                                    img: (_e = item === null || item === void 0 ? void 0 : item.image) !== null && _e !== void 0 ? _e : "",
                                    href: (_f = item === null || item === void 0 ? void 0 : item.url) !== null && _f !== void 0 ? _f : "",
                                };
                            })
                            : [],
                };
                this.applyData(data);
            }
            catch (err) {
                console.warn("[show-detail] Failed to fetch JSON:", err);
                this.applyAttributesFallback();
            }
            finally {
                this._abortCtrl = undefined;
            }
        });
    }
    applyData(d) {
        if (d.title) {
            this.setAttribute("show-title", d.title);
            this.setAttribute("aria-label", d.title);
        }
        if (d.year)
            this.setAttribute("year", d.year);
        if (d.image)
            this.setAttribute("image", d.image);
        if (d.description)
            this.setAttribute("description", d.description);
        if (d.trailer)
            this.setAttribute("trailer", d.trailer);
        if (d.backHref)
            this.setAttribute("back-href", d.backHref);
        const sid = toNumId(d.id);
        if (sid !== undefined)
            this.setAttribute("show-id", String(sid));
        if (Array.isArray(d.cast)) {
            this._cast = d.cast.map((v) => {
                var _a, _b, _c, _d;
                return ({
                    id: toNumId(v.id),
                    first: (_a = v.first) !== null && _a !== void 0 ? _a : "",
                    last: (_b = v.last) !== null && _b !== void 0 ? _b : "",
                    img: (_c = v.img) !== null && _c !== void 0 ? _c : "",
                    href: (_d = v.href) !== null && _d !== void 0 ? _d : "",
                });
            });
        }
        else {
            this.tryParseCastAttribute();
        }
    }
    applyAttributesFallback() {
        this.tryParseCastAttribute();
    }
    tryParseCastAttribute() {
        const castAttr = this.getAttribute("cast");
        if (castAttr) {
            try {
                const parsed = JSON.parse(castAttr);
                this._cast = Array.isArray(parsed)
                    ? parsed.map((v) => ({
                        id: toNumId(v === null || v === void 0 ? void 0 : v.id),
                        first: String((v === null || v === void 0 ? void 0 : v.first) || ""),
                        last: String((v === null || v === void 0 ? void 0 : v.last) || ""),
                        img: (v === null || v === void 0 ? void 0 : v.img) || "",
                        href: (v === null || v === void 0 ? void 0 : v.href) || "",
                    }))
                    : [];
            }
            catch (_a) {
                /* ignore bad JSON */
            }
        }
    }
    render() {
        const root = this._contentRoot;
        if (!root)
            return;
        const showTitle = this.getAttribute("show-title") || "ชื่อเรื่อง";
        const rawYear = (this.getAttribute("year") || "").trim();
        const sanitizedYear = rawYear.replace(/[()]/g, "");
        const year = sanitizedYear && /\d/.test(sanitizedYear) ? ` (${sanitizedYear})` : "";
        const poster = this.getAttribute("image") || "https://www.serieslike.com/img/shop_01.png";
        const desc = this.getAttribute("description") || (this._dataLoaded ? "" : "ไม่มีเรื่องย่อ");
        const trailer = this.getAttribute("trailer") || "";
        const backHref = this.getAttribute("back-href") || "index.html";
        const showId = this.getAttribute("show-id") || "";
        // ===== Cast cards (click -> cast.html?url=...) =====
        const castHtml = (this._cast || [])
            .map(({ id, first = "", last = "", img = "", href = "" }) => {
            const safeImg = img || FALLBACK_IMG;
            const alt = `${first} ${last}`.trim();
            const targetHref = href ? `cast.html?url=${encodeURIComponent(href)}` : "#";
            const cardInner = `
          <img src="${safeImg}" alt="${alt}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'"/>
          <p>${first}<br>${last}</p>
        `;
            return href
                ? `
          <a class="card" part="card" data-cast-id="${id !== null && id !== void 0 ? id : ""}"
             href="${targetHref}" aria-label="${alt}">
            ${cardInner}
          </a>
        `
                : `
          <div class="card" part="card" data-cast-id="${id !== null && id !== void 0 ? id : ""}" aria-label="${alt}">
            ${cardInner}
          </div>
        `;
        })
            .join("");
        // ===== แสดงบล็อกนักแสดงเฉพาะเมื่อมีข้อมูลจริง =====
        const hasCast = Array.isArray(this._cast) && this._cast.length > 0;
        const castSection = hasCast
            ? `
        <div class="cast-wrap">
          <p class="cast-title">นักแสดง</p>
          <div class="cast-list">${castHtml}</div>
        </div>
      `
            : ""; // ถ้าไม่มี cast → ไม่เรนเดอร์ส่วนนี้เลย
        root.innerHTML = `
      <div class="nav-row">
        <a class="navigate" href="${backHref}" aria-label="กลับไปหน้าหลัก">
          <img src="../assets/icons/back.svg" alt="">
          <span aria-hidden="true">กลับไปหน้าหลัก</span>
        </a>
      </div>

      <div class="container" data-show-id="${showId}">
        <p class="title">${showTitle}${year}</p>

        <div class="content">
          <div class="left">
            <img src="${poster}" alt="${showTitle}" onerror="this.src='${FALLBACK_IMG}'"/>
          </div>
          <div class="right">
            <p class="h2">เรื่องย่อ</p>
            <p class="desc" role="region" aria-label="เรื่องย่อ" tabindex="0">${desc}</p>
            ${trailer
            ? `
              <p class="h2 trailer">ตัวอย่าง</p>
              <iframe class="video" src="${trailer}" allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe>
            `
            : ""}
          </div>
        </div>

        ${castSection}
      </div>
    `;
    }
}
if (!customElements.get("show-detail")) {
    customElements.define("show-detail", ShowDetail);
}
createFooter();
//# sourceMappingURL=detail.js.map