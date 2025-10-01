// show-detail.ts
import { createNavbar } from "./navbar.js";
import { createFooter } from "./footer.js";
createNavbar();

const DEFAULT_COLLECTION_URL = "http://127.0.0.1:8000/series/detail";
const FALLBACK_IMG =
  "https://www.serieslike.com/img/shop_01.png";

function toNumId(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

function joinUrl(base: string, id: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const i = id.startsWith("/") ? id.slice(1) : id;
  return `${b}/${encodeURIComponent(i)}`;
}

function getQueryParams(): { id?: string; url?: string } {
  try {
    const sp = new URLSearchParams(location.search);
    const id = sp.get("id") ?? undefined;
    const url = sp.get("url") ?? undefined;
    return { id, url };
  } catch {
    return {};
  }
}

/* ---------------- Types ---------------- */
export interface CastItem {
  id?: number;
  first: string;   // คำแรก (ชื่อเล่น)
  last: string;    // คำที่สอง (ชื่อจริง)
  img?: string;
  href?: string;   // ลิงก์ไปหน้าต้นทาง
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
  "data-src"?: string; // base ของ API detail (เช่น http://127.0.0.1:8000/series/detail)
  "show-id"?: string;  // ถ้าไม่ใส่ จะอ่านจาก ?id=
}

/* -------- Image cache helpers (Cache Storage + ObjectURL) -------- */
const POSTER_CACHE_NAME = "posters-v1";

/** คืน base URL ของโฟลเดอร์ ./posters/ */
function postersBaseURL(): string {
  return new URL("./posters/", document.baseURI).toString();
}

/** เช็คว่ามีไฟล์รูปโลคอลจริงไหม */
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
 * ลำดับการหา src ของโปสเตอร์:
 * 1) ./posters/{id}.webp
 * 2) blob ใน CacheStorage (/cached-posters/{id})
 * 3) ใช้ remoteUrl → ดาวน์โหลด + แคช → ObjectURL
 * 4) FALLBACK_IMG
 */
async function resolvePosterSrc(
  id: string,
  remoteUrl?: string
): Promise<{ src: string; revokeLater?: string }> {
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

/* ---------------- Web Component ---------------- */
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
  private _objectUrls: string[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  disconnectedCallback(): void {
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
        href: v.href || "",
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

  /** โหมดโหลดข้อมูล:
   * - ถ้ามี ?url=... → เรียก {data-src}?url=<encoded>
   * - ถ้าไม่มีก็ใช้ ?id=... หรือ attribute show-id → เรียก {data-src}/{id}
   */
  private async loadData(): Promise<void> {
    const collectionUrl = this.getAttribute("data-src")?.trim() || DEFAULT_COLLECTION_URL;
    const attrId = this.getAttribute("show-id")?.trim();
    const { id: qId, url: qUrl } = getQueryParams();

    let fetchUrl: string | undefined;
    if (qUrl) {
      const u = new URL(collectionUrl);
      u.searchParams.set("url", qUrl);
      fetchUrl = u.toString();
    } else {
      const sid = attrId || qId;
      if (!sid) {
        this.applyAttributesFallback();
        return;
      }
      fetchUrl = joinUrl(collectionUrl, sid);
    }

    if (this._abortCtrl) this._abortCtrl.abort();
    this._abortCtrl = new AbortController();

    try {
      const res = await fetch(fetchUrl, {
        signal: this._abortCtrl.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = (await res.json()) as any;

      // โปสเตอร์จาก API (รองรับหลายชื่อฟิลด์)
      const posterRemote = raw?.image ?? raw?.poster ?? raw?.poster_url ?? undefined;

      // sid สำหรับหาภาพโลคอล/แคช
      const sidForPoster = (attrId || qId || raw?.id || "").toString();
      const { src: posterSrc, revokeLater } = await resolvePosterSrc(sidForPoster, posterRemote);
      if (revokeLater) this._objectUrls.push(revokeLater);

      // map fields ให้สอดคล้องข้อมูลตัวอย่าง
      const data: ShowDetailData = {
        id: toNumId(raw?.id ?? qId),
        title: raw?.title ?? raw?.name ?? "",
        year: String(raw?.year ?? raw?.release_year ?? raw?.date ?? ""),
        image: posterSrc,
        description: raw?.description ?? raw?.synopsis ?? raw?.overview ?? "",
        trailer: raw?.trailer ?? raw?.trailer_url ?? "",
        backHref: this.getAttribute("back-href") || "index.html",
        cast: Array.isArray(raw?.cast)
          ? raw.cast.map((v: any) => ({
              id: toNumId(v?.id),
              first: String(v?.first ?? v?.firstname ?? "").trim(),
              last: String(v?.last ?? v?.lastname ?? "").trim(),
              img: v?.img ?? v?.image ?? v?.photo ?? "",
              href: v?.href ?? v?.url ?? "",
            }))
          : Array.isArray(raw?.castings)
          ? raw.castings.map((item: any, idx: number) => {
              // โครงสร้าง { name, url, image }
              const name = String(item?.name ?? "").trim();
              const parts = name.split(/\s+/);
              const first = parts[0] ?? "";
              const last  = parts[1] ?? "";
              return {
                id: toNumId(item?.id) ?? idx + 1,
                first,
                last,
                img: item?.image ?? "",
                href: item?.url ?? "",
              } as CastItem;
            })
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
        href: v.href ?? "",
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
              href: v?.href || "",
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

    const poster = this.getAttribute("image") || "https://www.serieslike.com/img/shop_01.png";
    const desc = this.getAttribute("description") || (this._dataLoaded ? "" : "ไม่มีเรื่องย่อ");
    const trailer = this.getAttribute("trailer") || "";
    const backHref = this.getAttribute("back-href") || "index.html";
    const showId = this.getAttribute("show-id") || "";

    // ===== Cast cards (click -> cast.html?url=...) =====
    const castHtml = (this._cast || [])
      .map(({ id, first = "", last = "", img = "", href = "" }: CastItem) => {
        const safeImg = img || FALLBACK_IMG;
        const alt = `${first} ${last}`.trim();
        const targetHref = href ? `cast.html?url=${encodeURIComponent(href)}` : "#";

        const cardInner = `
          <img src="${safeImg}" alt="${alt}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'"/>
          <p>${first}<br>${last}</p>
        `;

        return href
          ? `
          <a class="card" part="card" data-cast-id="${id ?? ""}"
             href="${targetHref}" aria-label="${alt}">
            ${cardInner}
          </a>
        `
          : `
          <div class="card" part="card" data-cast-id="${id ?? ""}" aria-label="${alt}">
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

        ${castSection}
      </div>
    `;
  }
}

if (!customElements.get("show-detail")) {
  customElements.define("show-detail", ShowDetail);
}

createFooter();
