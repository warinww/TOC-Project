// import { createNavbar } from "./navbar.js";
// import { createFooter } from "./footer.js";
// createNavbar();

// const FALLBACK_IMG = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';

// function toNumId(v: unknown): number | undefined {
//   const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
//   return Number.isFinite(n) ? Math.trunc(n) : undefined;
// }

// export interface CastItem {
//   id?: number;
//   first: string;
//   last: string;
//   img?: string;
// }

// export interface ShowDetailData {
//   id?: number;
//   title?: string;
//   year?: string;
//   image?: string;
//   description?: string;
//   trailer?: string;
//   backHref?: string;
//   cast?: CastItem[];
// }

// export interface ShowDetailAttributes {
//   'show-title'?: string;
//   year?: string;
//   image?: string;
//   description?: string;
//   trailer?: string;
//   'back-href'?: string;
//   cast?: string;
//   'data-src'?: string;
//   'show-id'?: string;
// }

// export class ShowDetail extends HTMLElement {
//   static get observedAttributes(): Array<keyof ShowDetailAttributes> {
//     return ['show-title', 'year', 'image', 'description', 'trailer', 'back-href', 'cast', 'data-src', 'show-id'];
//   }

//   private _cast: CastItem[] = [];
//   private _dataLoaded = false;
//   private _contentRoot?: HTMLElement;

//   constructor() {
//     super();
//     this.attachShadow({ mode: 'open' });
//   }

//   set cast(arr: CastItem[]) {
//     if (Array.isArray(arr)) {
//       this._cast = arr.map(v => ({
//         id: toNumId((v as any).id),
//         first: String(v.first || ''),
//         last:  String(v.last  || ''),
//         img:   v.img || ''
//       }));
//       this.render();
//     }
//   }
//   get cast(): CastItem[] { return this._cast; }

//   connectedCallback(): void {
//     const legacyTitle = this.getAttribute('title');
//     if (legacyTitle && !this.getAttribute('show-title')) {
//       this.setAttribute('show-title', legacyTitle);
//     }
//     if (this.hasAttribute('title')) this.removeAttribute('title');

//     if (this.shadowRoot && !this._contentRoot) {
//       const link = document.createElement('link');
//       link.setAttribute('rel', 'stylesheet');
//       link.setAttribute('href', 'detail.css'); // ใช้ detail.css

//       const content = document.createElement('div');
//       content.setAttribute('id', 'root');

//       this.shadowRoot.append(link, content);
//       this._contentRoot = content;
//     }

//     this.loadData().finally(() => {
//       this._dataLoaded = true;
//       this.render();
//     });
//   }

//   attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
//     if (name === 'data-src' && oldValue !== newValue) {
//       this._dataLoaded = false;
//       this.loadData().finally(() => {
//         this._dataLoaded = true;
//         this.render();
//       });
//       return;
//     }
//     if (this._dataLoaded) this.render();
//   }

//   private async loadData(): Promise<void> {
//     const dataSrc = this.getAttribute('data-src');
//     if (dataSrc) {
//       try {
//         const res = await fetch(dataSrc);
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const json = (await res.json()) as ShowDetailData;
//         this.applyData(json);
//         return;
//       } catch (err) {
//         console.warn('[show-detail] Failed to fetch JSON:', err);
//         this.applyAttributesFallback();
//         return;
//       }
//     }
//     this.applyAttributesFallback();
//   }

//   private applyData(d: ShowDetailData): void {
//     if (d.title) {
//       this.setAttribute('show-title', d.title);
//       this.setAttribute('aria-label', d.title);
//     }
//     if (d.year) this.setAttribute('year', d.year);
//     if (d.image) this.setAttribute('image', d.image);
//     if (d.description) this.setAttribute('description', d.description);
//     if (d.trailer) this.setAttribute('trailer', d.trailer);
//     if (d.backHref) this.setAttribute('back-href', d.backHref);

//     {
//       const sid = toNumId(d.id);
//       if (sid !== undefined) this.setAttribute('show-id', String(sid));
//     }

//     if (Array.isArray(d.cast)) {
//       this._cast = d.cast.map(v => ({
//         id: toNumId((v as any).id),
//         first: v.first ?? '',
//         last:  v.last  ?? '',
//         img:   v.img   ?? ''
//       }));
//     } else {
//       this.tryParseCastAttribute();
//     }
//   }

//   private applyAttributesFallback(): void {
//     this.tryParseCastAttribute();
//   }

//   private tryParseCastAttribute(): void {
//     const castAttr = this.getAttribute('cast');
//     if (castAttr) {
//       try {
//         const parsed = JSON.parse(castAttr) as any[];
//         this._cast = Array.isArray(parsed) ? parsed.map(v => ({
//           id: toNumId(v?.id),
//           first: String(v?.first || ''),
//           last:  String(v?.last || ''),
//           img:   v?.img || ''
//         })) : [];
//       } catch {
//         /* ignore bad JSON */
//       }
//     }
//   }

//   private render(): void {
//     const root = this._contentRoot;
//     if (!root) return;

//     const showTitle = this.getAttribute('show-title') || 'ชื่อเรื่อง';
//     const rawYear   = (this.getAttribute('year') || '').trim();
//     const sanitizedYear = rawYear.replace(/[()]/g, '');
//     const year = sanitizedYear && /\d/.test(sanitizedYear) ? ` (${sanitizedYear})` : '';

//     const poster   = this.getAttribute('image') || 'https://www.serieslike.com/img/shop_01.png';
//     const desc     = this.getAttribute('description') || (this._dataLoaded ? '' : 'ไม่มีเรื่องย่อ');
//     const trailer  = this.getAttribute('trailer') || '';
//     const backHref = this.getAttribute('back-href') || 'index.html';
//     const showId   = this.getAttribute('show-id') || '';

//     const castHtml = (this._cast || []).map(({ id, first = '', last = '', img = '' }: CastItem) => {
//       const safeImg = img || FALLBACK_IMG;
//       const alt = `${first} ${last}`.trim();
//       const last_realname = last.split(" ")[0];
//       return `
//         <div class="card" part="card" data-cast-id="${id ?? ''}">
//           <img src="${safeImg}" alt="${alt}" loading="lazy" />
//           <p>${first}<br>${last_realname}</p>
//         </div>
//       `;
//     }).join('');

//     root.innerHTML = `
//       <a class="navigate" href="${backHref}" aria-label="กลับไปหน้าหลัก">
//         <img src="../assets/icons/back.svg" alt="">
//         <span aria-hidden="true">กลับไปหน้าหลัก</span>
//       </a>

//       <div class="container" data-show-id="${showId}">
//         <p class="title">${showTitle}${year}</p>

//         <div class="content">
//           <div class="left"><img src="${poster}" alt="${showTitle}"/></div>
//           <div class="right">
//             <p class="h2">เรื่องย่อ</p>
//             <p class="desc" role="region" aria-label="เรื่องย่อ" tabindex="0">${desc}</p>
//             ${trailer ? `
//               <p class="h2 trailer">ตัวอย่าง</p>
//               <iframe class="video" src="${trailer}" allowfullscreen
//                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe>
//             ` : ''}
//           </div>
//         </div>

//         <div class="cast-wrap">
//           <p class="cast-title">นักแสดง</p>
//           <div class="cast-list">${castHtml}</div>
//         </div>
//       </div>
//     `;
//   }
// }

// if (!customElements.get('show-detail')) {
//   customElements.define('show-detail', ShowDetail);
// }

// createFooter();

import { createNavbar } from "./navbar.js";
import { createFooter } from "./footer.js";
createNavbar();

const DEFAULT_COLLECTION_URL = "http://127.0.0.1:8000/series";
const FALLBACK_IMG =
  "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";

function toNumId(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

function getQueryId(): string | undefined {
  try {
    const id = new URLSearchParams(location.search).get("id");
    return id ?? undefined;
  } catch {
    return undefined;
  }
}

function joinUrl(base: string, id: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const i = id.startsWith("/") ? id.slice(1) : id;
  return `${b}/${encodeURIComponent(i)}`;
}

// ---------- Types ----------
export interface CastItem {
  id?: number;
  first: string;
  last: string;
  img?: string;
}

export interface ShowDetailData {
  id?: number;
  title?: string;
  year?: string;
  image?: string;
  description?: string;
  trailer?: string;
  backHref?: string;
  cast?: CastItem[];
}

export interface ShowDetailAttributes {
  "show-title"?: string;
  year?: string;
  image?: string;
  description?: string;
  trailer?: string;
  "back-href"?: string;
  cast?: string;
  "data-src"?: string; // collection URL เช่น http://127.0.0.1:8000/series
  "show-id"?: string;  // ถ้าไม่ใส่ จะอ่านจาก ?id=
}

// ---------- Image cache helpers (Cache Storage + ObjectURL) ----------
const POSTER_CACHE_NAME = "posters-v1";

/** คืน base URL ของโฟลเดอร์ ./posters/ ที่อยู่ข้างๆ หน้าเว็บปัจจุบัน */
function postersBaseURL(): string {
  return new URL("./posters/", document.baseURI).toString();
}

/** ใช้ GET (no-store) เพื่อตรวจสอบว่าเซิร์ฟเวอร์มีไฟล์จริง (บางเซิร์ฟเวอร์ไม่รองรับ HEAD) */
async function imageExists(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: "GET", cache: "no-store" });
    return r.ok;
  } catch {
    return false;
  }
}

async function cacheMatchBlob(key: string): Promise<Blob | undefined> {
  if (!("caches" in window)) return undefined;
  try {
    const cache = await caches.open(POSTER_CACHE_NAME);
    const res = await cache.match(key);
    if (res && res.ok) return await res.blob();
  } catch {}
  return undefined;
}

async function cachePutBlob(key: string, blob: Blob, contentType?: string) {
  if (!("caches" in window)) return;
  try {
    const cache = await caches.open(POSTER_CACHE_NAME);
    const headers = new Headers();
    headers.set("Content-Type", contentType || blob.type || "application/octet-stream");
    const resp = new Response(blob, { headers });
    await cache.put(key, resp);
  } catch {}
}

/**
 * คืนค่า src ของโปสเตอร์ โดยลำดับ:
 * 1) ถ้ามีไฟล์โลคอล ./posters/{id}.webp → ใช้ทันที
 * 2) มองหา blob ใน CacheStorage (/cached-posters/{id})
 * 3) ถ้ามี remoteUrl → ดาวน์โหลด, เก็บ cache, แล้วคืน ObjectURL
 * 4) ถ้าไม่ได้ → FALLBACK_IMG
 */
async function resolvePosterSrc(
  id: string,
  remoteUrl?: string
): Promise<{ src: string; revokeLater?: string }> {
  // สร้าง URL ไปยังไฟล์ ./posters/{id}.webp (relative ต่อหน้า)
  const localPath = new URL(`./${encodeURIComponent(id)}.webp`, postersBaseURL()).toString();

  if (await imageExists(localPath)) {
    return { src: localPath };
  }

  const cacheKey = `/cached-posters/${encodeURIComponent(id)}`;
  const cachedBlob = await cacheMatchBlob(cacheKey);
  if (cachedBlob) {
    const url = URL.createObjectURL(cachedBlob);
    return { src: url, revokeLater: url };
  }

  if (remoteUrl) {
    try {
      const r = await fetch(remoteUrl, { cache: "force-cache" });
      if (r.ok) {
        const blob = await r.blob();
        await cachePutBlob(cacheKey, blob, r.headers.get("Content-Type") || undefined);
        const url = URL.createObjectURL(blob);
        return { src: url, revokeLater: url };
      }
    } catch {}
  }

  return { src: FALLBACK_IMG };
}

// ---------- Web Component ----------
export class ShowDetail extends HTMLElement {
  static get observedAttributes(): Array<keyof ShowDetailAttributes> {
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

  private _cast: CastItem[] = [];
  private _dataLoaded = false;
  private _contentRoot?: HTMLElement;
  private _abortCtrl?: AbortController;
  private _objectUrls: string[] = []; // เก็บ ObjectURL ที่ต้อง revoke

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  disconnectedCallback(): void {
    // เคลียร์ ObjectURL กัน memory leak
    for (const u of this._objectUrls) URL.revokeObjectURL(u);
    this._objectUrls = [];
    if (this._abortCtrl) this._abortCtrl.abort();
  }

  set cast(arr: CastItem[]) {
    if (Array.isArray(arr)) {
      this._cast = arr.map((v) => ({
        id: toNumId((v as any).id),
        first: String(v.first || ""),
        last: String(v.last || ""),
        img: v.img || "",
      }));
      this.render();
    }
  }
  get cast(): CastItem[] {
    return this._cast;
  }

  connectedCallback(): void {
    const legacyTitle = this.getAttribute("title");
    if (legacyTitle && !this.getAttribute("show-title")) {
      this.setAttribute("show-title", legacyTitle);
    }
    if (this.hasAttribute("title")) this.removeAttribute("title");

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

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if ((name === "data-src" || name === "show-id") && oldValue !== newValue) {
      this._dataLoaded = false;
      this.loadData().finally(() => {
        this._dataLoaded = true;
        this.render();
      });
      return;
    }
    if (this._dataLoaded) this.render();
  }

  /** อ่าน id → รวม URL → fetch → map → แก้รูปให้ใช้ local/cache → applyData */
  private async loadData(): Promise<void> {
    const collectionUrl =
      this.getAttribute("data-src")?.trim() || DEFAULT_COLLECTION_URL;
    const sid = this.getAttribute("show-id")?.trim() || getQueryId();

    if (!sid) {
      this.applyAttributesFallback();
      return;
    }

    const url = joinUrl(collectionUrl, sid);

    if (this._abortCtrl) this._abortCtrl.abort();
    this._abortCtrl = new AbortController();

    try {
      const res = await fetch(url, {
        signal: this._abortCtrl.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = (await res.json()) as any;

      // remote poster จาก API (ถ้ามี)
      const posterRemote =
        raw?.image ?? raw?.poster ?? raw?.poster_url ?? undefined;

      // หาทางใช้รูปโลคอล/แคชก่อน
      const { src: posterSrc, revokeLater } = await resolvePosterSrc(
        String(sid),
        posterRemote
      );
      if (revokeLater) this._objectUrls.push(revokeLater);

      const data: ShowDetailData = {
        id: toNumId(raw?.id ?? sid),
        title: raw?.title ?? raw?.name ?? "",
        year: String(raw?.year ?? raw?.release_year ?? ""),
        image: posterSrc, // ใช้รูปจาก local หรือ cache/remote ตามที่ resolve มา
        description: raw?.description ?? raw?.synopsis ?? raw?.overview ?? "",
        trailer: raw?.trailer ?? raw?.trailer_url ?? "",
        backHref: this.getAttribute("back-href") || "index.html",
        cast: Array.isArray(raw?.cast)
          ? raw.cast.map((v: any) => ({
              id: toNumId(v?.id),
              first: String(
                v?.first ?? v?.firstname ?? v?.name?.split?.(" ")?.[0] ?? ""
              ),
              last: String(
                v?.last ??
                  v?.lastname ??
                  (v?.name ? v.name.split(" ").slice(1).join(" ") : "") ??
                  ""
              ),
              img: v?.img ?? v?.image ?? v?.photo ?? "",
            }))
          : Array.isArray(raw?.castings)
          ? raw.castings.map((name: any, idx: number) => ({
              id: idx + 1,
              first: String(name).split(" ")[0] || "",
              last: String(name).split(" ").slice(1).join(" ") || "",
              img: "",
            }))
          : [],
      };

      this.applyData(data);
    } catch (err) {
      console.warn("[show-detail] Failed to fetch JSON:", err);
      this.applyAttributesFallback();
    } finally {
      this._abortCtrl = undefined;
    }
  }

  private applyData(d: ShowDetailData): void {
    if (d.title) {
      this.setAttribute("show-title", d.title);
      this.setAttribute("aria-label", d.title);
    }
    if (d.year) this.setAttribute("year", d.year);
    if (d.image) this.setAttribute("image", d.image);
    if (d.description) this.setAttribute("description", d.description);
    if (d.trailer) this.setAttribute("trailer", d.trailer);
    if (d.backHref) this.setAttribute("back-href", d.backHref);

    const sid = toNumId(d.id);
    if (sid !== undefined) this.setAttribute("show-id", String(sid));

    if (Array.isArray(d.cast)) {
      this._cast = d.cast.map((v) => ({
        id: toNumId((v as any).id),
        first: v.first ?? "",
        last: v.last ?? "",
        img: v.img ?? "",
      }));
    } else {
      this.tryParseCastAttribute();
    }
  }

  private applyAttributesFallback(): void {
    this.tryParseCastAttribute();
  }

  private tryParseCastAttribute(): void {
    const castAttr = this.getAttribute("cast");
    if (castAttr) {
      try {
        const parsed = JSON.parse(castAttr) as any[];
        this._cast = Array.isArray(parsed)
          ? parsed.map((v) => ({
              id: toNumId(v?.id),
              first: String(v?.first || ""),
              last: String(v?.last || ""),
              img: v?.img || "",
            }))
          : [];
      } catch {
        /* ignore bad JSON */
      }
    }
  }

  private render(): void {
    const root = this._contentRoot;
    if (!root) return;

    const showTitle = this.getAttribute("show-title") || "ชื่อเรื่อง";
    const rawYear = (this.getAttribute("year") || "").trim();
    const sanitizedYear = rawYear.replace(/[()]/g, "");
    const year = sanitizedYear && /\d/.test(sanitizedYear) ? ` (${sanitizedYear})` : "";

    const poster =
      this.getAttribute("image") || "https://www.serieslike.com/img/shop_01.png";
    const desc = this.getAttribute("description") || (this._dataLoaded ? "" : "ไม่มีเรื่องย่อ");
    const trailer = this.getAttribute("trailer") || "";
    const backHref = this.getAttribute("back-href") || "index.html";
    const showId = this.getAttribute("show-id") || "";

    const castHtml = (this._cast || [])
      .map(({ id, first = "", last = "", img = "" }: CastItem) => {
        const safeImg = img || FALLBACK_IMG;
        const alt = `${first} ${last}`.trim();
        const last_realname = last.split(" ")[0];
        return `
        <div class="card" part="card" data-cast-id="${id ?? ""}">
          <img src="${safeImg}" alt="${alt}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'"/>
          <p>${first}<br>${last_realname}</p>
        </div>
      `;
      })
      .join("");

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
            ${
              trailer
                ? `
              <p class="h2 trailer">ตัวอย่าง</p>
              <iframe class="video" src="${trailer}" allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe>
            `
                : ""
            }
          </div>
        </div>

        <div class="cast-wrap">
          <p class="cast-title">นักแสดง</p>
          <div class="cast-list">${castHtml}</div>
        </div>
      </div>
    `;
  }
}

if (!customElements.get("show-detail")) {
  customElements.define("show-detail", ShowDetail);
}

createFooter();

