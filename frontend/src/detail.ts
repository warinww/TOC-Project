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
  title?: string;
  year?: string;
  image?: string;
  description?: string;
  trailer?: string;
  backHref?: string;
  cast?: CastItem[];
}

export interface ShowDetailAttributes {
  'show-title'?: string;
  year?: string;
  image?: string;
  description?: string;
  trailer?: string;
  'back-href'?: string;
  cast?: string;
  'data-src'?: string;
  'show-id'?: string;
}

export class ShowDetail extends HTMLElement {
  static get observedAttributes(): Array<keyof ShowDetailAttributes> {
    return ['show-title', 'year', 'image', 'description', 'trailer', 'back-href', 'cast', 'data-src', 'show-id'];
  }

  private _cast: CastItem[] = [];
  private _dataLoaded = false;
  private _contentRoot?: HTMLElement;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

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

  connectedCallback(): void {
    const legacyTitle = this.getAttribute('title');
    if (legacyTitle && !this.getAttribute('show-title')) {
      this.setAttribute('show-title', legacyTitle);
    }
    if (this.hasAttribute('title')) this.removeAttribute('title');

    if (this.shadowRoot && !this._contentRoot) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('href', 'detail.css'); // ใช้ detail.css

      const content = document.createElement('div');
      content.setAttribute('id', 'root');

      this.shadowRoot.append(link, content);
      this._contentRoot = content;
    }

    this.loadData().finally(() => {
      this._dataLoaded = true;
      this.render();
    });
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'data-src' && oldValue !== newValue) {
      this._dataLoaded = false;
      this.loadData().finally(() => {
        this._dataLoaded = true;
        this.render();
      });
      return;
    }
    if (this._dataLoaded) this.render();
  }

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

  private render(): void {
    const root = this._contentRoot;
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

if (!customElements.get('show-detail')) {
  customElements.define('show-detail', ShowDetail);
}
