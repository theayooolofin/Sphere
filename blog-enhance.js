/**
 * Sphere Blog Enhancement Script
 * Injects: social share bar, breadcrumb, author avatar, expandable FAQ
 */
(() => {
  'use strict';

  const article    = document.querySelector('.blogx-article');
  const articleHead = document.querySelector('.blogx-article-head');

  // ── Social Share Bar ────────────────────────────────────────────────────
  if (article) {
    const rawUrl = window.location.href;
    const url    = encodeURIComponent(rawUrl);
    const title  = encodeURIComponent(document.title);

    const bar = document.createElement('div');
    bar.className = 'blogx-share-bar';
    bar.innerHTML = `
      <span class="blogx-share-label">Share</span>
      <div class="blogx-share-btns">
        <a class="blogx-share-btn blogx-share-btn-x"
           href="https://x.com/intent/tweet?url=${url}&text=${title}"
           target="_blank" rel="noopener noreferrer" aria-label="Share on X">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X (Twitter)
        </a>
        <a class="blogx-share-btn blogx-share-btn-linkedin"
           href="https://www.linkedin.com/sharing/share-offsite/?url=${url}"
           target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn
        </a>
        <a class="blogx-share-btn blogx-share-btn-whatsapp"
           href="https://wa.me/?text=${title}%20${url}"
           target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
          WhatsApp
        </a>
        <button class="blogx-share-btn blogx-share-btn-copy" type="button" aria-label="Copy link">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy link
        </button>
      </div>`;

    const authorBox = article.querySelector('.blogx-author-box');
    if (authorBox) {
      authorBox.before(bar);
    } else {
      article.appendChild(bar);
    }

    // Copy link handler
    const copyBtn = bar.querySelector('.blogx-share-btn-copy');
    if (copyBtn && navigator.clipboard) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(rawUrl).then(() => {
          copyBtn.classList.add('is-copied');
          copyBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg> Copied!`;
          setTimeout(() => {
            copyBtn.classList.remove('is-copied');
            copyBtn.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg> Copy link`;
          }, 2200);
        });
      });
    }
  }

  // ── Breadcrumb ──────────────────────────────────────────────────────────
  if (articleHead) {
    const h1 = articleHead.querySelector('h1');
    if (h1) {
      const crumb = document.createElement('nav');
      crumb.className = 'blogx-breadcrumb';
      crumb.setAttribute('aria-label', 'Breadcrumb');
      crumb.innerHTML = `
        <a href="/">Home</a>
        <span class="blogx-breadcrumb-sep" aria-hidden="true">›</span>
        <a href="/blog">Blog</a>
        <span class="blogx-breadcrumb-sep" aria-hidden="true">›</span>
        <span class="blogx-breadcrumb-current" aria-current="page">${h1.textContent.trim()}</span>`;
      articleHead.insertBefore(crumb, h1);
    }
  }

  // ── Author Avatar ───────────────────────────────────────────────────────
  const authorBox = document.querySelector('.blogx-author-box');
  if (authorBox) {
    const strongEl = authorBox.querySelector('p strong');
    if (strongEl) {
      const name     = strongEl.textContent.trim();
      const initials = name.split(' ').slice(0, 2).map(n => n[0] || '').join('').toUpperCase() || 'S';

      const inner   = document.createElement('div');
      inner.className = 'blogx-author-inner';

      const avatar  = document.createElement('div');
      avatar.className = 'blogx-author-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = initials;

      const content = document.createElement('div');
      content.className = 'blogx-author-content';

      while (authorBox.firstChild) {
        content.appendChild(authorBox.firstChild);
      }

      inner.appendChild(avatar);
      inner.appendChild(content);
      authorBox.appendChild(inner);
    }
  }

  // ── FAQ Expandable ──────────────────────────────────────────────────────
  document.querySelectorAll('.blogx-faq-item').forEach(item => {
    const h4 = item.querySelector('h4');
    const p  = item.querySelector('p');
    if (!h4 || !p) return;

    // Toggle icon
    const toggle = document.createElement('span');
    toggle.className = 'blogx-faq-toggle';
    toggle.setAttribute('aria-hidden', 'true');
    toggle.textContent = '+';
    h4.appendChild(toggle);

    // Animated wrapper
    const body  = document.createElement('div');
    body.className = 'blogx-faq-body';
    const inner = document.createElement('div');
    inner.className = 'blogx-faq-body-inner';
    inner.appendChild(p.cloneNode(true));
    body.appendChild(inner);
    p.replaceWith(body);

    // Accessibility + interaction
    h4.setAttribute('role', 'button');
    h4.setAttribute('tabindex', '0');
    h4.setAttribute('aria-expanded', 'false');

    const toggle_ = () => {
      item.classList.toggle('is-open');
      h4.setAttribute('aria-expanded', String(item.classList.contains('is-open')));
    };

    h4.addEventListener('click', toggle_);
    h4.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle_(); }
    });
  });

})();
