// show-detail.ts
import { createNavbar } from "./navbar.js";
import { createFooter } from "./footer.js";
createNavbar();

const DEFAULT_COLLECTION_URL = "http://0.0.0.0:8000/series/detail";
const FALLBACK_IMG = "https://www.serieslike.com/img/shop_01.png";

/* ---------------- Utils ---------------- */
function toNumId(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

/** join base + (id segment) โดย encode เฉพาะ id */
function joinUrl(base: string, id: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const i = id.startsWith("/") ? id.slice(1) : id;
  return `${b}/${encodeURIComponent(i)}`;
}

/** join base + path (ไม่ encode /) */
function joinBasePath(base: string, path: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
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

/** อ่านค่า api override จาก query ปัจจุบัน */
function getApiOverride(): string | undefined {
  try {
    const v = new URLSearchParams(location.search).get("api");
    return v ?? undefined;
  } catch {
    return undefined;
  }
}

/** แปลง URL ที่อาจเป็น relative ให้เป็น absolute อิงจาก document.baseURI */
function toAbsoluteURL(maybeUrl: string): string {
  try {
    return new URL(maybeUrl, document.baseURI).toString();
  } catch {
    return maybeUrl;
  }
}

/** แปลง URL ที่อาจเป็น relative ให้เป็น absolute อิงจาก base ที่ระบุ */
function toAbsoluteFrom(base: string, maybeUrl?: string): string {
  if (!maybeUrl) return "";
  try {
    return new URL(maybeUrl, base).toString();
  } catch {
    return maybeUrl;
  }
}

/** สร้างลิงก์ไปหน้า cast: ให้ url มาก่อน ถ้าไม่มีค่อยใช้ id; แนบ ?api= ถ้ามี */
function buildCastLink(href?: string, id?: number | null): string {
  const api = getApiOverride();
  const base = "cast.html";
  let qs = "";
  if (href) {
    qs = `url=${encodeURIComponent(href)}`;
  } else if (id != null && Number.isFinite(id)) {
    qs = `id=${encodeURIComponent(String(id))}`;
  } else {
    return "#";
  }
  if (api) qs += `&api=${encodeURIComponent(api)}`;
  return `${base}?${qs}`;
}

/**
 * ทำ URL สำหรับรูป/ลิงก์ที่เป็น asset ฝั่งเว็บ (เช่น casts/xxx.jpg) ให้ผูกกับ document.baseURI
 * - ถ้าเป็น absolute อยู่แล้ว คืนค่าเดิม
 * - ถ้าตรง pattern โฟลเดอร์ในเว็บ (casts/, /casts/) → ใช้ document.baseURI
 * - กรณีอื่น ๆ พยายามผูกกับ document ก่อน
 */
function toAbsPreferDoc(maybeUrl?: string): string {
  if (!maybeUrl) return "";
  try {
    const u = String(maybeUrl).trim();
    if (!u) return "";
    if (/^[a-z]+:\/\//i.test(u)) return u; // already absolute
    if (/^(?:\.\/)?casts\//i.test(u) || /^\/casts\//i.test(u)) {
      return new URL(u, document.baseURI).toString();
    }
    // default: prefer document
    return new URL(u, document.baseURI).toString();
  } catch {
    return maybeUrl!;
  }
}

/** ========== Proxy helpers ========== */
/** คืน origin ของ API (ใช้ ?api= ถ้ามี, ไม่งั้นอนุมานจาก DEFAULT_COLLECTION_URL) */
function getApiBase(): string {
  const apiOverride = getApiOverride();
  try {
    if (apiOverride) {
      const u = new URL(apiOverride, document.baseURI);
      return u.origin; // e.g. http://127.0.0.1:8000
    }
  } catch {}
  try {
    const d = new URL(DEFAULT_COLLECTION_URL, document.baseURI);
    return d.origin;
  } catch {
    return "";
  }
}

/** สร้าง URL proxy สำหรับรูปภาพ */
function viaImageProxy(absUrl: string): string {
  const base = getApiBase(); // เช่น http://127.0.0.1:8000
  if (!base) return absUrl;
  return joinBasePath(base, "image-proxy") + "?url=" + encodeURIComponent(absUrl);
}

/** ถ้ารูปไม่ได้เป็น local/blob/data → ห่อด้วย proxy */
function proxifyImageIfNeeded(maybeUrl?: string): string {
  if (!maybeUrl) return "";
  const u = String(maybeUrl).trim();
  if (!u) return "";
  if (/^(?:blob:|data:)/i.test(u)) return u; // keep blob/data
  if (/^(?:\.\/)?casts\//i.test(u) || /^\/casts\//i.test(u)) {
    // asset ในเว็บ
    return new URL(u, document.baseURI).toString();
  }
  try {
    const abs = new URL(u, document.baseURI).toString();
    if (/^[a-z]+:\/\//i.test(abs)) {
      return viaImageProxy(abs);
    }
    return abs;
  } catch {
    return u;
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
 * ลำดับการหา src ของโปสเตอร์ (อัปเดต):
 * 1) ./posters/{id}.webp/.jpg/.png/.jpeg (ลองตามลำดับ)
 * 2) blob ใน CacheStorage (/cached-posters/{id})
 * 3) ใช้ remoteUrl → คืน URL proxy โดยไม่ดาวน์โหลดเอง
 * 4) FALLBACK_IMG
 */
async function resolvePosterSrc(
  id: string,
  remoteUrl?: string
): Promise<{ src: string; revokeLater?: string }> {
  const exts = ["webp", "jpg", "png", "jpeg"];

  // 1) ลองหาไฟล์โลคอลตาม id หลายสกุล
  for (const ext of exts) {
    const localPath = new URL(`./${encodeURIComponent(id)}.${ext}`, postersBaseURL()).toString();
    if (await imageExists(localPath)) {
      return { src: localPath };
    }
  }

  // 2) ลอง cache blob โดยใช้ key ตาม id
  const cacheKey = `/cached-posters/${encodeURIComponent(id)}`;
  const cachedBlob = await cacheMatchBlob(cacheKey);
  if (cachedBlob) {
    const url = URL.createObjectURL(cachedBlob);
    return { src: url, revokeLater: url };
  }

  // 3) ถ้ามี remoteUrl → ส่งผ่าน proxy แทนการ fetch เป็น blob เอง
  if (remoteUrl) {
    try {
      const absUrl = toAbsoluteURL(remoteUrl);
      return { src: viaImageProxy(absUrl) };
    } catch {}
  }

  // 4) สุดท้ายใช้รูปสำรอง
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
   * - ถ้ามี ?url=... → เรียก {collectionUrl}?url=<encoded>
   * - ถ้าไม่มีก็ใช้ ?id=... หรือ attribute show-id → เรียก {collectionUrl}/{id}
   * - รองรับ ?api=... เป็น base (เช่น http://127.0.0.1:8000 → /series/detail)
   */
  private async loadData(): Promise<void> {
    const attrSrc = this.getAttribute("data-src")?.trim();
    const apiOverride = getApiOverride();

    // เลือก collectionUrl ตามลำดับ: attribute → ?api= → default
    let collectionUrl =
      attrSrc ||
      (apiOverride
        ? (/\/series\/detail(\/|$)/.test(apiOverride)
            ? apiOverride
            : joinBasePath(apiOverride, "series/detail"))
        : DEFAULT_COLLECTION_URL);

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

      // base ของ response (ใช้ทำ absolute สำหรับรูป/ลิงก์ที่เป็น relative ของ API)
      const responseBase = (res as Response).url || collectionUrl;

      // โปสเตอร์จาก API (รองรับหลายชื่อฟิลด์) → ทำ absolute (ฝั่ง API)
      const posterRemoteRaw = raw?.image ?? raw?.poster ?? raw?.poster_url ?? undefined;
      const posterRemote = posterRemoteRaw
        ? toAbsoluteFrom(responseBase, posterRemoteRaw)
        : undefined;

      // sid สำหรับหาภาพโลคอล/แคช — ให้ raw.id มาก่อน (เพิ่ม id มาแล้ว)
      const sidForPoster = (raw?.id ?? attrId ?? qId ?? "").toString();

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
        backHref: (this.getAttribute("back-href") as string) || "javascript:history.back()",
        cast: Array.isArray(raw?.cast)
          ? raw.cast.map((v: any) => ({
              id: toNumId(v?.id),
              first: String(v?.first ?? v?.firstname ?? "").trim(),
              last: String(v?.last ?? v?.lastname ?? "").trim(),
              img: proxifyImageIfNeeded(v?.img ?? v?.image ?? v?.photo ?? ""),
              href: toAbsPreferDoc(v?.href ?? v?.url ?? ""),
            }))
          : Array.isArray(raw?.castings)
          ? raw.castings.map((item: any, idx: number) => {
              // โครงสร้าง { name, url, image }
              const name = String(item?.name ?? "").trim();
              const parts = name.split(/\s+/);
              const first = parts[0] ?? "";
              const last = parts[1] ?? "";
              return {
                id: toNumId(item?.id) ?? idx + 1,
                first,
                last,
                img: proxifyImageIfNeeded(item?.image ?? ""),
                href: toAbsPreferDoc(item?.url ?? ""),
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
              img: proxifyImageIfNeeded(v?.img || ""),
              href: toAbsPreferDoc(v?.href || ""),
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

    const poster = this.getAttribute("image") || FALLBACK_IMG;
    const desc = this.getAttribute("description") || (this._dataLoaded ? "" : "ไม่มีเรื่องย่อ");
    const trailer = this.getAttribute("trailer") || "";
    const backHref = this.getAttribute("back-href") || "javascript:history.back()";
    const showId = this.getAttribute("show-id") || "";

    // ===== Cast cards (click -> cast.html?url=... หรือ ?id=...) =====
    const castHtml = (this._cast || [])
      .map(({ id, first = "", last = "", img = "", href = "" }: CastItem) => {
        const safeImg = proxifyImageIfNeeded(img) || FALLBACK_IMG;
        const alt = `${first} ${last}`.trim();
        const targetHref = buildCastLink(href || undefined, id ?? null);

        const cardInner = `
          <img src="${safeImg}" alt="${alt}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'"/>
          <p>${first}<br>${last}</p>
        `;

        return targetHref !== "#"
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
          <span aria-hidden="true">ย้อนกลับ</span>
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


