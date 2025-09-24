import { createNavbar } from "./navbar.js";
createNavbar();

const FALLBACK_IMG = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';

function toNumId(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

export interface CastItem {
  id?: number;
  first: string;
  last: string;
  img?: string;
}

export interface ShowDetailData {
  id?: number;
  title?: string;         // map ไปที่ show-title (ไม่ใช้ title เพื่อกัน tooltip)
  year?: string;
  image?: string;
  description?: string;
  trailer?: string;
  backHref?: string;      // map ไปที่ back-href
  cast?: CastItem[];
}

export interface ShowDetailAttributes {
  'show-title'?: string;  // แทน title เพื่อกัน tooltip
  year?: string;
  image?: string;
  description?: string;
  trailer?: string;
  'back-href'?: string;
  cast?: string;          // JSON string ถ้าส่งมาทาง attribute
  'data-src'?: string;    // URL ไฟล์ JSON
  'show-id'?: string;     // id ของเรื่อง (เก็บเป็น string บน attribute)
}

export class ShowDetail extends HTMLElement {
  static get observedAttributes(): Array<keyof ShowDetailAttributes> {
    return ['show-title', 'year', 'image', 'description', 'trailer', 'back-href', 'cast', 'data-src', 'show-id'];
  }

  private _cast: CastItem[] = [];
  private _dataLoaded = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // ========== Public API ==========
  set cast(arr: CastItem[]) {
    if (Array.isArray(arr)) {
      this._cast = arr.map(v => ({
        id: toNumId((v as any).id),
        first: String(v.first || ''),
        last:  String(v.last  || ''),
        img:   v.img || ''
      }));
      this.render();
    }
  }
  get cast(): CastItem[] { return this._cast; }

  // ========== Lifecycle ==========
  connectedCallback(): void {
    // migrate legacy `title` -> `show-title` เพื่อกัน tooltip
    const legacyTitle = this.getAttribute('title');
    if (legacyTitle && !this.getAttribute('show-title')) {
      this.setAttribute('show-title', legacyTitle);
    }
    if (this.hasAttribute('title')) this.removeAttribute('title');

    this.loadData().finally(() => {
      this._dataLoaded = true;
      this.render();
    });
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'data-src' && oldValue !== newValue) {
      // เปลี่ยน source → โหลดใหม่
      this._dataLoaded = false;
      this.loadData().finally(() => {
        this._dataLoaded = true;
        this.render();
      });
      return;
    }
    if (this._dataLoaded) this.render();
  }

  // ========== Data loading ==========
  private async loadData(): Promise<void> {
    const dataSrc = this.getAttribute('data-src');
    if (dataSrc) {
      try {
        const res = await fetch(dataSrc);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ShowDetailData;
        this.applyData(json);
        return;
      } catch (err) {
        console.warn('[show-detail] Failed to fetch JSON:', err);
        this.applyAttributesFallback();
        return;
      }
    }
    this.applyAttributesFallback();
  }

  private applyData(d: ShowDetailData): void {
    // map JSON -> attributes (เก็บบน DOM เพื่อให้ render ใช้ค่ากลาง)
    if (d.title) {
      this.setAttribute('show-title', d.title);
      this.setAttribute('aria-label', d.title);
    }
    if (d.year) this.setAttribute('year', d.year);
    if (d.image) this.setAttribute('image', d.image);
    if (d.description) this.setAttribute('description', d.description);
    if (d.trailer) this.setAttribute('trailer', d.trailer);
    if (d.backHref) this.setAttribute('back-href', d.backHref);

    {
      const sid = toNumId(d.id);
      if (sid !== undefined) this.setAttribute('show-id', String(sid));
    }

    if (Array.isArray(d.cast)) {
      this._cast = d.cast.map(v => ({
        id: toNumId((v as any).id),
        first: v.first ?? '',
        last:  v.last  ?? '',
        img:   v.img   ?? ''
      }));
    } else {
      this.tryParseCastAttribute();
    }
  }

  private applyAttributesFallback(): void {
    this.tryParseCastAttribute();
  }

  private tryParseCastAttribute(): void {
    const castAttr = this.getAttribute('cast');
    if (castAttr) {
      try {
        const parsed = JSON.parse(castAttr) as any[];
        this._cast = Array.isArray(parsed) ? parsed.map(v => ({
          id: toNumId(v?.id),
          first: String(v?.first || ''),
          last:  String(v?.last || ''),
          img:   v?.img || ''
        })) : [];
      } catch {
        /* ignore bad JSON */
      }
    }
  }

  // ========== Render ==========
  private render(): void {
    const root = this.shadowRoot;
    if (!root) return;

    const showTitle = this.getAttribute('show-title') || 'ชื่อเรื่อง';
    const rawYear   = (this.getAttribute('year') || '').trim();
    const sanitizedYear = rawYear.replace(/[()]/g, '');
    const year = sanitizedYear && /\d/.test(sanitizedYear) ? ` (${sanitizedYear})` : '';

    const poster   = this.getAttribute('image') || 'https://www.serieslike.com/img/shop_01.png';
    const desc     = this.getAttribute('description') || (this._dataLoaded ? '' : 'ไม่มีเรื่องย่อ');
    const trailer  = this.getAttribute('trailer') || '';
    const backHref = this.getAttribute('back-href') || 'index.html';
    const showId   = this.getAttribute('show-id') || '';

    const castHtml = (this._cast || []).map(({ id, first = '', last = '', img = '' }: CastItem) => {
      const safeImg = img || FALLBACK_IMG;
      const alt = `${first} ${last}`.trim();
      const last_realname = last.split(" ")[0];
      return `
        <div class="card" part="card" data-cast-id="${id ?? ''}">
          <img src="${safeImg}" alt="${alt}" loading="lazy" />
          <p>${first}<br>${last_realname}</p>
        </div>
      `;
    }).join('');

    root.innerHTML = `
      <style>
:host { display: block; box-sizing: border-box; --max-w: 1300px; --pad-x: 10vw; --gap: 5vw; }

.container { max-width: var(--max-w); margin: 0 auto; padding: 0 var(--pad-x); }

/* Back link (ใช้ <a>, ไม่ใช้ title → ไม่มี tooltip) */
.navigate, .navigate:link, .navigate:visited { color: inherit; text-decoration: none; }
.navigate { font-size: 18px; margin: 0; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; padding: 12px 16px; border-radius: 12px; -webkit-tap-highlight-color: transparent; user-select: none; }
.navigate img { width: 40px; height: 40px; }

.title { font-size: 24px; text-align: left; margin: 10px 0 0 0; font-weight: 700; }

/* layout ซ้าย-ขวา */
.content { display: flex; flex-direction: row; align-items: flex-start; gap: var(--gap); margin: 20px 0; flex-wrap: wrap; }
.left { flex: 1 1 320px; max-width: 450px; }
.left img { width: 100%; height: 660px; object-fit: cover; display: block; border-radius: 15px; box-shadow: 0 4px 16px rgba(0,0,0,.06); }
.right { flex: 1 1 400px; min-width: 320px; display: flex; flex-direction: column; width: 100%; box-sizing: border-box; }

.h2 { font-size: 20px; margin: 0; font-weight: 700; }

/* description: เลื่อนอ่านได้ + ซ่อนสกอลบาร์ + โฟกัสคีย์บอร์ดได้ */
.desc { 
  height: 178px; width: 100%; overflow: auto; margin-right: 0;
}

.h2.trailer { margin: 20px 0 22px 0; }
.video { height: 355px; width: 100%; aspect-ratio: 16 / 9; display: block; border: none; border-radius: 15px; }

/* Cast */
.cast-wrap { margin-top: 10px; }
.cast-title { font-size: 20px; margin: 50px 0 20px 0; font-weight: 700; }
.cast-list { display: flex; flex-direction: row; flex-wrap: wrap; gap: 30px 35px; justify-content: flex-start; }
.card { width: 130px; display: flex; flex-direction: column; align-items: center; }
.card img { width: 120px; height: 120px; object-fit: cover; border-radius: 50%; background: #e5e7eb; }
.card p { text-align: center; margin: 10px 0 0 0; line-height: 1.25; }

@media (max-width: 640px) { :host { --pad-x: 5vw; --gap: 24px; } }
      </style>
      <a class="navigate" href="${backHref}" aria-label="กลับไปหน้าหลัก">
          <img src="../assets/icons/back.svg" alt="">
          <span aria-hidden="true">กลับไปหน้าหลัก</span>
        </a>
      <div class="container" data-show-id="${showId}">

        <p class="title">${showTitle}${year}</p>

        <div class="content">
          <div class="left"><img src="${poster}" alt="${showTitle}"/></div>
          <div class="right">
            <p class="h2">เรื่องย่อ</p>
            <p class="desc" role="region" aria-label="เรื่องย่อ" tabindex="0">${desc}</p>
            ${trailer ? `
              <p class="h2 trailer">ตัวอย่าง</p>
              <iframe class="video" src="${trailer}" allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe>
            ` : ''}
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

// Define once guard
if (!customElements.get('show-detail')) {
  customElements.define('show-detail', ShowDetail);
}