var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createNavbar } from "./navbar.js";
createNavbar();
const FALLBACK_IMG = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';
function toNumId(v) {
    const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : NaN);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
}
export class ShowDetail extends HTMLElement {
    static get observedAttributes() {
        return ['show-title', 'year', 'image', 'description', 'trailer', 'back-href', 'cast', 'data-src', 'show-id'];
    }
    constructor() {
        super();
        this._cast = [];
        this._dataLoaded = false;
        this.attachShadow({ mode: 'open' });
    }
    set cast(arr) {
        if (Array.isArray(arr)) {
            this._cast = arr.map(v => ({
                id: toNumId(v.id),
                first: String(v.first || ''),
                last: String(v.last || ''),
                img: v.img || ''
            }));
            this.render();
        }
    }
    get cast() { return this._cast; }
    connectedCallback() {
        const legacyTitle = this.getAttribute('title');
        if (legacyTitle && !this.getAttribute('show-title')) {
            this.setAttribute('show-title', legacyTitle);
        }
        if (this.hasAttribute('title'))
            this.removeAttribute('title');
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
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data-src' && oldValue !== newValue) {
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
    loadData() {
        return __awaiter(this, void 0, void 0, function* () {
            const dataSrc = this.getAttribute('data-src');
            if (dataSrc) {
                try {
                    const res = yield fetch(dataSrc);
                    if (!res.ok)
                        throw new Error(`HTTP ${res.status}`);
                    const json = (yield res.json());
                    this.applyData(json);
                    return;
                }
                catch (err) {
                    console.warn('[show-detail] Failed to fetch JSON:', err);
                    this.applyAttributesFallback();
                    return;
                }
            }
            this.applyAttributesFallback();
        });
    }
    applyData(d) {
        if (d.title) {
            this.setAttribute('show-title', d.title);
            this.setAttribute('aria-label', d.title);
        }
        if (d.year)
            this.setAttribute('year', d.year);
        if (d.image)
            this.setAttribute('image', d.image);
        if (d.description)
            this.setAttribute('description', d.description);
        if (d.trailer)
            this.setAttribute('trailer', d.trailer);
        if (d.backHref)
            this.setAttribute('back-href', d.backHref);
        {
            const sid = toNumId(d.id);
            if (sid !== undefined)
                this.setAttribute('show-id', String(sid));
        }
        if (Array.isArray(d.cast)) {
            this._cast = d.cast.map(v => {
                var _a, _b, _c;
                return ({
                    id: toNumId(v.id),
                    first: (_a = v.first) !== null && _a !== void 0 ? _a : '',
                    last: (_b = v.last) !== null && _b !== void 0 ? _b : '',
                    img: (_c = v.img) !== null && _c !== void 0 ? _c : ''
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
        const castAttr = this.getAttribute('cast');
        if (castAttr) {
            try {
                const parsed = JSON.parse(castAttr);
                this._cast = Array.isArray(parsed) ? parsed.map(v => ({
                    id: toNumId(v === null || v === void 0 ? void 0 : v.id),
                    first: String((v === null || v === void 0 ? void 0 : v.first) || ''),
                    last: String((v === null || v === void 0 ? void 0 : v.last) || ''),
                    img: (v === null || v === void 0 ? void 0 : v.img) || ''
                })) : [];
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
        const showTitle = this.getAttribute('show-title') || 'ชื่อเรื่อง';
        const rawYear = (this.getAttribute('year') || '').trim();
        const sanitizedYear = rawYear.replace(/[()]/g, '');
        const year = sanitizedYear && /\d/.test(sanitizedYear) ? ` (${sanitizedYear})` : '';
        const poster = this.getAttribute('image') || 'https://www.serieslike.com/img/shop_01.png';
        const desc = this.getAttribute('description') || (this._dataLoaded ? '' : 'ไม่มีเรื่องย่อ');
        const trailer = this.getAttribute('trailer') || '';
        const backHref = this.getAttribute('back-href') || 'index.html';
        const showId = this.getAttribute('show-id') || '';
        const castHtml = (this._cast || []).map(({ id, first = '', last = '', img = '' }) => {
            const safeImg = img || FALLBACK_IMG;
            const alt = `${first} ${last}`.trim();
            const last_realname = last.split(" ")[0];
            return `
        <div class="card" part="card" data-cast-id="${id !== null && id !== void 0 ? id : ''}">
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
//# sourceMappingURL=detail.js.map