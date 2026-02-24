import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SITE_URL = (process.env.SITE_URL || "https://www.sphere.ng").replace(/\/+$/, "");
const STYLES_VERSION = "20260224l";
const NAV_VERSION = "20260224l";
const POSTS_DIR = path.join(ROOT, "content", "blog", "posts");
const BLOG_OUT_DIR = path.join(ROOT, "blog");
const TOPIC_OUT_DIR = path.join(BLOG_OUT_DIR, "topic");
const BLOG_ASSETS_DIR = path.join(ROOT, "assets", "blog");
const BLOG_ASSET_IMAGES = fs.existsSync(BLOG_ASSETS_DIR)
  ? fs
      .readdirSync(BLOG_ASSETS_DIR)
      .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
  : [];
const AUTHOR_ROTATION = [
  { name: "Ayo Olofin", role: "Founder, Sphere" },
  { name: "Mariam", role: "Content & Operations" },
  { name: "Tola", role: "Driver Growth & Field Operations" }
];
const AUTHOR_ROLE_MAP = Object.fromEntries(AUTHOR_ROTATION.map((item) => [item.name, item.role]));

const STATIC_ROUTES = [
  { file: "index.html", loc: "/" },
  { file: "download/index.html", loc: "/download/" },
  { file: "download-driver/index.html", loc: "/download-driver/" },
  { file: "about.html", loc: "/about" },
  { file: "drive-earn.html", loc: "/drive-earn" },
  { file: "contact.html", loc: "/contact" },
  { file: "blog.html", loc: "/blog" },
  { file: "drivers-privacy-policy.html", loc: "/drivers-privacy-policy" },
  { file: "users-privacy-policy.html", loc: "/users-privacy-policy" },
  { file: "speak-with-someone.html", loc: "/speak-with-someone" }
];

function hashString(input) {
  let hash = 0;
  const value = String(input || "");
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function extractMarkdownImages(markdown) {
  const matches = String(markdown || "").matchAll(/!\[[^\]]*\]\(([^)]+)\)/g);
  return Array.from(matches, (match) => String(match[1] || "").trim()).filter(Boolean);
}

function filenameFromPath(value) {
  return path.basename(String(value || "").replace(/^https?:\/\//i, ""));
}

function pickSupplementalImage(post, globallyUsed = new Set()) {
  if (!BLOG_ASSET_IMAGES.length) {
    return "";
  }

  const used = new Set(
    [post.heroImage, ...extractMarkdownImages(post.body)]
      .filter(Boolean)
      .map((item) => filenameFromPath(item))
  );

  const category = String(post.category || "").toLowerCase();
  const slug = String(post.slug || "").toLowerCase();
  const cityHint = slug.includes("lagos")
    ? "lagos"
    : slug.includes("abuja")
      ? "abuja"
      : slug.includes("ibadan")
        ? "ibadan"
        : "";

  const preferredHints = [
    category.includes("city") && "city-",
    category.includes("intercity") && "truck",
    category.includes("driver") && "driver",
    category.includes("business") && "bulk",
    category.includes("operations") && "city-",
    category.includes("customer") && "bulk",
    slug.includes("lagos") && "lagos",
    slug.includes("abuja") && "abuja",
    slug.includes("ibadan") && "ibadan",
    "truck"
  ].filter(Boolean);

  const isAvailable = (file) => !used.has(file) && !globallyUsed.has(file);

  if (cityHint) {
    let cityPool = BLOG_ASSET_IMAGES.filter(
      (file) => file.toLowerCase().includes(cityHint) && isAvailable(file)
    );
    if (!cityPool.length) {
      cityPool = BLOG_ASSET_IMAGES.filter(
        (file) => file.toLowerCase().includes(cityHint) && !used.has(file)
      );
    }
    if (cityPool.length) {
      const selectedCity = cityPool[hashString(post.slug) % cityPool.length];
      return `assets/blog/${selectedCity}`;
    }
  }

  let pool = BLOG_ASSET_IMAGES.filter(
    (file) => isAvailable(file) && preferredHints.some((hint) => file.toLowerCase().includes(hint))
  );

  if (!pool.length) {
    pool = BLOG_ASSET_IMAGES.filter((file) => isAvailable(file));
  }

  if (!pool.length && globallyUsed.size) {
    pool = BLOG_ASSET_IMAGES.filter((file) => !used.has(file));
  }

  if (!pool.length) {
    return "";
  }

  const selected = pool[hashString(post.slug) % pool.length];
  return `assets/blog/${selected}`;
}

function toImageCaption(filePath) {
  const file = filenameFromPath(filePath)
    .replace(/\.(png|jpe?g|webp)$/i, "")
    .replace(/-\d{5,}$/g, "")
    .replace(/[-_]+/g, " ")
    .trim();

  if (!file) {
    return "Illustrative logistics scene";
  }

  return file.charAt(0).toUpperCase() + file.slice(1);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function parseDateValue(dateValue, endOfDay = false) {
  const raw = String(dateValue).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T${endOfDay ? "23:59:59.000" : "12:00:00.000"}Z`);
  }
  return new Date(raw);
}

function hasTimePart(dateValue) {
  const raw = String(dateValue).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return false;
  }
  return /T\d{2}:\d{2}/.test(raw) || /\d{1,2}:\d{2}/.test(raw);
}

function formatDate(dateValue) {
  const raw = String(dateValue).trim();
  const date = parseDateValue(dateValue);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  const options = hasTimePart(raw)
    ? {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    : {
        year: "numeric",
        month: "long",
        day: "numeric"
      };

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

function isoDate(dateValue) {
  const raw = String(dateValue).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T00:00:00.000Z`;
  }
  return parseDateValue(dateValue).toISOString();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toAbsoluteUrl(url) {
  const clean = String(url || "").trim();
  if (!clean) {
    return `${SITE_URL}/assets/hero-trucks.png`;
  }
  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }
  if (clean.startsWith("/")) {
    return `${SITE_URL}${clean}`;
  }
  return `${SITE_URL}/${clean.replace(/^\.\//, "")}`;
}

function localizeSiteAssetUrl(url) {
  const clean = String(url || "").trim();
  if (!clean) return clean;
  const sitePrefix = `${SITE_URL}/`;
  if (!clean.startsWith(sitePrefix)) {
    return clean;
  }

  const relative = clean.slice(sitePrefix.length);
  if (relative.startsWith("assets/")) {
    const localPath = path.join(ROOT, relative);
    if (fs.existsSync(localPath)) {
      return relative;
    }
  }

  return clean;
}

function toSlug(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseCsv(value) {
  return String(value || "")
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBrandText(value) {
  return String(value || "")
    .replace(/What to Do Before You Book/g, "What to Do Before You Request a Driver")
    .replace(/Before You Book/g, "Before You Request a Driver")
    .replace(/\bwhat to do before you book\b/g, "what to do before you request a driver")
    .replace(/\bbefore you book\b/g, "before you request a driver")
    .replace(/\bbefore booking\b/gi, "before requesting a driver")
    .replace(/\bstart booking\b/gi, "start requesting a driver")
    .replace(/\bbook your move\b/gi, "request a driver for your move")
    .replace(/\bbook a move\b/gi, "request a driver for your move")
    .replace(/\bbook on sphere\b/gi, "request a driver on Sphere")
    .replace(/\bbook now\b/gi, "request a driver now")
    .replace(/\bbook with sphere\b/gi, "request a driver on Sphere")
    .replace(/\bbooking\b/gi, "requesting a driver")
    .replace(/\brebook\b/gi, "request again")
    .replace(/\bbook\b/gi, "request a driver")
    .replace(/\bsame[- ]day deliveries\b/gi, "same-day bulk moves")
    .replace(/\bsame[- ]day delivery\b/gi, "same-day bulk move")
    .replace(/\bdeliveries\b/gi, "moves")
    .replace(/\bdelivery\b/gi, "move")
    .replace(/\bparcel(?:s)?\b/gi, "bulk goods")
    .replace(/\bbefore dispatching\b/gi, "before your move")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizeBrandTextPreserveMarkdownLinks(value) {
  const segments = String(value || "").split(/(!?\[[^\]]*\]\([^)]+\))/g);

  return segments
    .map((segment) => {
      if (!/^!?\[[^\]]*\]\([^)]+\)$/.test(segment)) {
        return normalizeBrandText(segment);
      }

      const match = segment.match(/^(!?\[)([^\]]*)(\]\([^)]+\))$/);
      if (!match) {
        return segment;
      }

      const open = match[1];
      const label = normalizeBrandText(match[2]);
      const close = match[3];
      return `${open}${label}${close}`;
    })
    .join("");
}

function normalizeAuthorValue(value) {
  const clean = normalizeBrandText(value);
  if (!clean) return "";
  const lowered = clean.toLowerCase();
  if (lowered === "sphere editorial team" || lowered === "editorial team") {
    return "";
  }
  return clean;
}

function normalizeBodyParagraphs(markdown) {
  const blocks = String(markdown || "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .split(/\n\n/);

  return blocks
    .map((block) => {
      const trimmed = block.trim();

      if (/^(- |\* |\d+\.\s)/m.test(trimmed) && !/^(#{1,6}\s|>\s|\|.*\||!\[)/.test(trimmed)) {
        return trimmed
          .split(/\n/)
          .map((line) => {
            const bulletMatch = line.match(/^(\s*(?:- |\* |\d+\.\s))(.*)$/);
            if (!bulletMatch) {
              return normalizeBrandTextPreserveMarkdownLinks(line.trim());
            }
            return `${bulletMatch[1]}${normalizeBrandTextPreserveMarkdownLinks(
              bulletMatch[2]
            )}`.trimEnd();
          })
          .join("\n")
          .trim();
      }

      const headingMatch = trimmed.match(/^(#{1,6}\s+)(.*)$/);
      if (headingMatch) {
        return `${headingMatch[1]}${normalizeBrandTextPreserveMarkdownLinks(headingMatch[2])}`.trim();
      }

      const quoteMatch = trimmed.match(/^(>\s+)(.*)$/);
      if (quoteMatch) {
        return `${quoteMatch[1]}${normalizeBrandTextPreserveMarkdownLinks(quoteMatch[2])}`.trim();
      }

      if (
        !trimmed ||
        /^([-*]\s|\d+\.\s|\|.*\||!\[)/.test(trimmed) ||
        /^\[[^\]]+\]\([^)]+\)$/.test(trimmed)
      ) {
        return trimmed;
      }
      return normalizeBrandTextPreserveMarkdownLinks(trimmed);
    })
    .filter(Boolean)
    .join("\n\n");
}

function audienceLineForCategory(post) {
  const category = String(post.category || "").toLowerCase();
  const isLagos = post.slug.includes("lagos");
  const isAbuja = post.slug.includes("abuja");
  const isIbadan = post.slug.includes("ibadan");

  const cityLine = isLagos
    ? "across Lagos neighborhoods and traffic corridors"
    : isAbuja
      ? "across Abuja districts and estate routes"
      : isIbadan
        ? "across Ibadan commercial and residential zones"
        : "across Lagos, Abuja, and Ibadan";

  if (category.includes("driver")) {
    return `This guide is for truck and van drivers who want more consistent weekly earnings ${cityLine}.`;
  }

  if (category.includes("business")) {
    return `This guide is for business owners and operations teams planning reliable bulk moves ${cityLine}.`;
  }

  if (category.includes("operations")) {
    return `This guide is for customers and drivers who need cleaner execution and safer movement decisions ${cityLine}.`;
  }

  if (category.includes("intercity")) {
    return "This guide is for households and businesses coordinating intercity bulk moves with tight timelines.";
  }

  return `This guide is for individuals and teams planning a smooth bulk move ${cityLine}.`;
}

function moveChecklistForPost(post) {
  const category = String(post.category || "").toLowerCase();

  if (category.includes("driver")) {
    return [
      "- Go online with clear profile and active contact details",
      "- Prioritize requests with complete pickup and drop-off notes",
      "- Send proactive status updates to protect ratings",
      "- Track earnings, idle time, and completed jobs weekly"
    ].join("\n");
  }

  if (category.includes("business")) {
    return [
      "- Group inventory or equipment by priority and fragility",
      "- Confirm the right vehicle type for total load volume",
      "- Share destination access notes and receiver contact",
      "- Keep a move log for timing, cost, and completion quality"
    ].join("\n");
  }

  if (category.includes("operations")) {
    return [
      "- Confirm route conditions and move window before request",
      "- Label fragile or high-risk items clearly",
      "- Keep both pickup and drop-off contacts available",
      "- Document move completion with quick handover checks"
    ].join("\n");
  }

  return [
    "- Create a complete item list before requesting a driver",
    "- Match your load to compact car, van, or medium truck",
    "- Add pickup and drop-off access instructions clearly",
    "- Track arrival, loading, and handover in one move flow"
  ].join("\n");
}

function injectStructureIfNeeded(post, bodyRaw) {
  let body = normalizeBodyParagraphs(bodyRaw);
  const hasAudienceSection = /^##\s+Who this guide is for/m.test(body);
  const hasChecklistSection = /^##\s+(Move checklist|Action checklist|Final checklist|Execution checklist)/im.test(
    body
  );

  if (!hasAudienceSection) {
    const firstBreak = body.indexOf("\n\n");
    if (firstBreak > -1) {
      const intro = body.slice(0, firstBreak).trim();
      const rest = body.slice(firstBreak + 2).trim();
      body = `${intro}\n\n## Who this guide is for\n\n${audienceLineForCategory(post)}\n\n${rest}`;
    }
  }

  if (!hasChecklistSection) {
    body = `${body}\n\n## Move checklist\n\n${moveChecklistForPost(post)}`;
  }

  return body.replace(/\n{3,}/g, "\n\n").trim();
}

function parseFrontmatter(fileContent) {
  const normalized = String(fileContent).replace(/^\uFEFF/, "");
  const hasFrontmatter = normalized.startsWith("---\n") || normalized.startsWith("---\r\n");
  if (!hasFrontmatter) {
    throw new Error("Missing frontmatter block.");
  }

  const endIndex = normalized.indexOf("\n---", 4);
  if (endIndex === -1) {
    throw new Error("Frontmatter block not closed.");
  }

  const rawMeta = normalized.slice(4, endIndex).trim();
  const body = normalized.slice(endIndex + 4).trim();
  const meta = {};

  rawMeta.split(/\r?\n/).forEach((line) => {
    const separator = line.indexOf(":");
    if (separator === -1) {
      return;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    meta[key] = value;
  });

  meta.tags = parseCsv(meta.tags);

  return { meta, body };
}

function stripMarkdown(text) {
  return String(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[\*_`]/g, "")
    .trim();
}

function estimateReadTime(markdown) {
  const words = stripMarkdown(markdown).split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.round(words / 220));
}

function resolveMediaPath(url, prefix) {
  const clean = String(url || "").trim();
  if (!clean) {
    return "";
  }
  if (/^https?:\/\//i.test(clean) || clean.startsWith("/")) {
    return clean;
  }
  return `${prefix}${clean.replace(/^\.\//, "")}`;
}

function makeMarkdownLinkHtml(labelRaw, hrefRaw, externalLinks) {
  const label = escapeHtml(labelRaw);
  const href = String(hrefRaw || "").trim();
  const isExternal = /^https?:\/\//i.test(href) && !href.includes("sphere.ng");

  if (isExternal) {
    externalLinks.push(href);
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  }

  return `<a href="${escapeHtml(href)}">${label}</a>`;
}

function markdownInline(rawText, externalLinks) {
  const text = String(rawText || "");
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let cursor = 0;
  let out = "";
  let match = linkRegex.exec(text);

  while (match) {
    out += escapeHtml(text.slice(cursor, match.index));
    out += makeMarkdownLinkHtml(match[1], match[2], externalLinks);
    cursor = match.index + match[0].length;
    match = linkRegex.exec(text);
  }

  out += escapeHtml(text.slice(cursor));

  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");

  return out;
}

function markdownToHtml(markdown, options = {}) {
  const prefix = options.prefix || "";
  const inlineCtaHtml = options.inlineCtaHtml || "";
  const supplementalImage = options.supplementalImage || "";
  const supplementalImageAlt = options.supplementalImageAlt || "Illustrative logistics scene";
  const lines = String(markdown || "").split(/\r?\n/);
  const chunks = [];
  const toc = [];
  const externalLinks = [];

  let paragraph = [];
  let listItems = [];
  let listType = null;
  let tableRows = [];
  let h2Count = 0;
  let ctaInserted = false;
  let supplementalInserted = false;

  function flushParagraph() {
    if (!paragraph.length) return;
    chunks.push(`<p>${markdownInline(paragraph.join(" "), externalLinks)}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!listItems.length) return;
    const items = listItems.map((item) => `<li>${markdownInline(item, externalLinks)}</li>`).join("");
    chunks.push(`<${listType}>${items}</${listType}>`);
    listItems = [];
    listType = null;
  }

  function flushTable() {
    if (!tableRows.length) return;

    const normalizeCells = (row) =>
      row
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell, index, all) => !(index === 0 && cell === "") && !(index === all.length - 1 && cell === ""));

    const headerCells = normalizeCells(tableRows[0] || "");
    const separatorCells = normalizeCells(tableRows[1] || "");
    const hasSeparator =
      separatorCells.length &&
      separatorCells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, "")));

    if (headerCells.length >= 2 && hasSeparator) {
      const bodyRows = tableRows.slice(2).map((row) => normalizeCells(row));
      chunks.push(
        `<div class="blogx-table-wrap"><table class="blogx-table"><thead><tr>${headerCells
          .map((cell) => `<th>${markdownInline(cell, externalLinks)}</th>`)
          .join("")}</tr></thead><tbody>${bodyRows
          .map(
            (cells) =>
              `<tr>${cells.map((cell) => `<td>${markdownInline(cell, externalLinks)}</td>`).join("")}</tr>`
          )
          .join("")}</tbody></table></div>`
      );
    } else {
      tableRows.forEach((row) => {
        chunks.push(`<p>${markdownInline(row, externalLinks)}</p>`);
      });
    }

    tableRows = [];
  }

  function heading(level, content) {
    const text = stripMarkdown(content);
    const id = toSlug(text);
    if (id) {
      toc.push({ level, id, text });
    }
    chunks.push(`<h${level} id="${escapeHtml(id)}">${markdownInline(content, externalLinks)}</h${level}>`);

    if (level === 2) {
      h2Count += 1;

      if (!ctaInserted && inlineCtaHtml && h2Count === 2) {
        chunks.push(inlineCtaHtml);
        ctaInserted = true;
      }

      if (!supplementalInserted && supplementalImage && h2Count === 3) {
        chunks.push(
          `<figure class="blogx-inline-media blogx-inline-media-spotlight"><img src="${escapeHtml(
            resolveMediaPath(supplementalImage, prefix)
          )}" alt="${escapeHtml(supplementalImageAlt)}" loading="lazy" /><figcaption>${escapeHtml(
            supplementalImageAlt
          )}</figcaption></figure>`
        );
        supplementalInserted = true;
      }
    }
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      flushTable();
      return;
    }

    const isTableRow = /^\|(.+\|)+\s*$/.test(line);
    if (isTableRow) {
      flushParagraph();
      flushList();
      tableRows.push(line);
      return;
    }

    flushTable();

    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushParagraph();
      flushList();
      const alt = imageMatch[1] || "";
      const src = resolveMediaPath(imageMatch[2], prefix);
      chunks.push(
        `<figure class="blogx-inline-media"><img src="${escapeHtml(src)}" alt="${escapeHtml(
          alt
        )}" loading="lazy" />${alt ? `<figcaption>${escapeHtml(alt)}</figcaption>` : ""}</figure>`
      );
      return;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      heading(3, line.slice(4));
      return;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      heading(2, line.slice(3));
      return;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      chunks.push(`<blockquote>${markdownInline(line.slice(2), externalLinks)}</blockquote>`);
      return;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      if (!listType) listType = "ul";
      if (listType !== "ul") flushList();
      listType = "ul";
      listItems.push(line.slice(2));
      return;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      if (!listType) listType = "ol";
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push(line.replace(/^\d+\.\s+/, ""));
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();
  flushTable();

  if (!supplementalInserted && supplementalImage) {
    chunks.push(
      `<figure class="blogx-inline-media blogx-inline-media-spotlight"><img src="${escapeHtml(
        resolveMediaPath(supplementalImage, prefix)
      )}" alt="${escapeHtml(supplementalImageAlt)}" loading="lazy" /><figcaption>${escapeHtml(
        supplementalImageAlt
      )}</figcaption></figure>`
    );
  }

  return {
    html: chunks.join("\n"),
    toc,
    externalLinks: [...new Set(externalLinks)]
  };
}

function readPosts() {
  ensureDir(POSTS_DIR);
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((name) => name.toLowerCase().endsWith(".md"));

  const posts = files.map((fileName) => {
    const filePath = path.join(POSTS_DIR, fileName);
    const content = fs.readFileSync(filePath, "utf8");
    const { meta, body } = parseFrontmatter(content);

    const requiredKeys = ["title", "description", "publishedAt", "category"];
    requiredKeys.forEach((key) => {
      if (!meta[key]) {
        throw new Error(`${fileName}: missing "${key}" in frontmatter.`);
      }
    });

    const slug = meta.slug ? toSlug(meta.slug) : toSlug(path.basename(fileName, ".md"));
    if (!slug) {
      throw new Error(`${fileName}: invalid slug.`);
    }

    const draftPost = {
      slug,
      category: meta.category
    };
    const normalizedBody = injectStructureIfNeeded(draftPost, body);
    const readTimeMinutes = estimateReadTime(normalizedBody);
    const topicSlug = toSlug(meta.category);
    const heroImage = localizeSiteAssetUrl(meta.heroImage || "assets/hero-trucks.png");
    const cardImage = localizeSiteAssetUrl(meta.cardImage || meta.heroImage || heroImage);

    return {
      slug,
      title: normalizeBrandText(meta.title),
      description: normalizeBrandText(meta.description),
      author: meta.author ? normalizeAuthorValue(meta.author) : "",
      authorRole: meta.authorRole ? normalizeBrandText(meta.authorRole) : "",
      category: meta.category,
      tags: (meta.tags || []).map((tag) => normalizeBrandText(tag)),
      topicSlug,
      publishedAt: meta.publishedAt,
      updatedAt: meta.updatedAt || meta.publishedAt,
      heroImage,
      heroImageAlt: meta.heroImageAlt || meta.title,
      cardImage,
      readTimeMinutes,
      body: normalizedBody
    };
  });

  posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return posts.map((post, index) => {
    if (post.author) {
      return {
        ...post,
        authorRole: post.authorRole || AUTHOR_ROLE_MAP[post.author] || "Editorial Team"
      };
    }

    const author = AUTHOR_ROTATION[index % AUTHOR_ROTATION.length];
    return {
      ...post,
      author: author.name,
      authorRole: author.role
    };
  });
}

function navHtml(activePage, prefix = "") {
  const isActive = (id) => (id === activePage ? ' class="is-active"' : "");
  return `
        <nav class="nav" aria-label="Primary">
          <a href="/" class="logo" aria-label="Sphere home">
            <img class="logo-img logo-img-hero" src="${prefix}assets/sphere-blue-logo.png" alt="Sphere" />
          </a>

          <button class="nav-toggle" type="button" aria-expanded="false" aria-label="Open menu">
            <span></span><span></span><span></span>
          </button>

          <ul class="nav-links">
            <li><a${isActive("home")} href="/">Home</a></li>
            <li><a${isActive("drive")} href="/drive-earn">Drive &amp; Earn</a></li>
            <li><a${isActive("about")} href="/about">About</a></li>
            <li><a${isActive("blog")} href="/blog">Blog</a></li>
            <li><a${isActive("contact")} href="/contact">Contact</a></li>
          </ul>

          <a class="btn btn-light nav-cta" href="/download/">Download the app</a>
        </nav>`;
}

function footerHtml(prefix = "") {
  return `
    <footer class="footer section-soft" id="footer">
      <div class="container footer-grid">
        <div>
          <a href="/" class="logo footer-logo" aria-label="Sphere home">
            <img class="logo-img logo-img-footer" src="${prefix}assets/sphere-blue-logo.png" alt="Sphere" />
          </a>
          <p>Making bulk logistics seamless and reliable.</p>
          <p>Proudly built for Africa.</p>
        </div>

        <div class="footer-links">
          <a href="/">Home</a>
          <a href="/drive-earn">Earn &amp; Drive</a>
          <a href="/about">About</a>
          <a href="/blog">Blog</a>
          <a href="/contact">Contact</a>
        </div>

        <div class="footer-links">
          <a href="/drivers-privacy-policy">Drivers' Privacy Policy</a>
          <a href="/users-privacy-policy">Users' Privacy Policy</a>
          <a href="/speak-with-someone">Speak with Someone</a>
        </div>
      </div>

      <div class="container footer-bottom">
        <div class="socials" aria-label="social links">
          <a href="https://x.com/SphereNG" target="_blank" rel="noopener noreferrer" aria-label="x">x</a>
          <a href="https://www.linkedin.com/company/sphere-ltd/" target="_blank" rel="noopener noreferrer" aria-label="linkedin">in</a>
          <a href="https://www.instagram.com/spheredotng?igsh=dTVtcnZrMTNsZ2xs" target="_blank" rel="noopener noreferrer" aria-label="instagram">ig</a>
        </div>
        <p>&copy; 2024 Sphere. All rights reserved.</p>
      </div>
    </footer>`;
}

function pageHead({
  title,
  description,
  canonical,
  robots,
  ogImage,
  jsonLd,
  prefix = "",
  ogType = "website"
}) {
  const robotsMeta = robots ? `\n    <meta name="robots" content="${robots}" />` : "";
  const ldJson = jsonLd
    ? `\n    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
    : "";
  const canonicalTag = canonical ? `\n    <link rel="canonical" href="${canonical}" />` : "";
  const image = toAbsoluteUrl(ogImage || "assets/hero-trucks.png");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />${robotsMeta}${canonicalTag}
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical || `${SITE_URL}/blog`)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <link rel="alternate" type="application/rss+xml" title="Sphere Blog RSS" href="${SITE_URL}/rss.xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="${prefix}styles.css?v=${STYLES_VERSION}" />
    <script src="${prefix}nav.js?v=${NAV_VERSION}" defer></script>${ldJson}
  </head>`;
}

function readingLabel(minutes) {
  return `${minutes} min read`;
}

function postCardHtml(post, prefix = "", withData = false) {
  const dataAttrs = withData
    ? ` data-post="1" data-topic="${escapeHtml(post.topicSlug)}" data-title="${escapeHtml(
        post.title
      )}" data-description="${escapeHtml(post.description)}" data-tags="${escapeHtml(
        post.tags.join(" ")
      )}"`
    : "";
  return `<article class="blogx-card"${dataAttrs}>
    <a class="blogx-card-media" href="${prefix}blog/${post.slug}/">
      <img src="${escapeHtml(resolveMediaPath(post.cardImage, prefix))}" alt="${escapeHtml(post.heroImageAlt)}" loading="lazy" />
    </a>
    <div class="blogx-card-body">
      <p class="blogx-chipline">
        <a class="blogx-topic-link" href="${prefix}blog/topic/${post.topicSlug}/">${escapeHtml(post.category)}</a>
        <span>&middot;</span>
        <span>${escapeHtml(readingLabel(post.readTimeMinutes))}</span>
      </p>
      <h3><a href="${prefix}blog/${post.slug}/">${escapeHtml(post.title)}</a></h3>
      <p>${escapeHtml(post.description)}</p>
      <div class="blogx-card-foot">
        <span>${escapeHtml(formatDate(post.publishedAt))}</span>
        <a class="blogx-link" href="${prefix}blog/${post.slug}/">Read now</a>
      </div>
    </div>
  </article>`;
}

function relatedPostCardHtml(post, prefix = "../../") {
  return `<article class="blogx-related-card">
    <a class="blogx-related-media" href="${prefix}blog/${post.slug}/">
      <img src="${escapeHtml(resolveMediaPath(post.cardImage, prefix))}" alt="${escapeHtml(post.heroImageAlt)}" loading="lazy" />
    </a>
    <div class="blogx-related-body">
      <p class="blogx-chipline"><a class="blogx-topic-link" href="${prefix}blog/topic/${post.topicSlug}/">${escapeHtml(post.category)}</a><span>&middot;</span><span>${escapeHtml(readingLabel(post.readTimeMinutes))}</span></p>
      <h3><a href="${prefix}blog/${post.slug}/">${escapeHtml(post.title)}</a></h3>
    </div>
  </article>`;
}

function getTopics(posts) {
  const map = new Map();
  posts.forEach((post) => {
    const key = post.topicSlug || toSlug(post.category);
    if (!map.has(key)) {
      map.set(key, {
        slug: key,
        name: post.category,
        posts: []
      });
    }
    map.get(key).posts.push(post);
  });

  return Array.from(map.values()).sort((a, b) => {
    if (b.posts.length !== a.posts.length) {
      return b.posts.length - a.posts.length;
    }
    return a.name.localeCompare(b.name);
  });
}

function renderBlogIndex(posts) {
  const hasPosts = posts.length > 0;
  const robots = hasPosts ? "index,follow" : "noindex,follow";
  const canonical = `${SITE_URL}/blog`;
  const featured = posts[0];
  const latest = posts.slice(1);
  const topics = getTopics(posts);

  const itemList = posts.map((post, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${SITE_URL}/blog/${post.slug}/`,
    name: post.title
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Sphere Blog",
    url: canonical,
    description:
      "Practical logistics insights, bulk move tips, and driver growth resources from Sphere.",
    mainEntity: hasPosts
      ? {
          "@type": "ItemList",
          itemListElement: itemList
        }
      : undefined
  };

  const featuredHtml = hasPosts
    ? `<article class="blogx-featured">
        <a class="blogx-featured-media" href="blog/${featured.slug}/">
          <img src="${escapeHtml(resolveMediaPath(featured.heroImage, ""))}" alt="${escapeHtml(featured.heroImageAlt)}" loading="lazy" />
        </a>
        <div class="blogx-featured-body">
          <p class="blogx-kicker">Featured</p>
          <h2><a href="blog/${featured.slug}/">${escapeHtml(featured.title)}</a></h2>
          <p>${escapeHtml(featured.description)}</p>
          <div class="blogx-meta-row">
            <a class="blogx-topic-link" href="blog/topic/${featured.topicSlug}/">${escapeHtml(featured.category)}</a>
            <span>&middot;</span>
            <span>${escapeHtml(formatDate(featured.publishedAt))}</span>
            <span>&middot;</span>
            <span>${escapeHtml(readingLabel(featured.readTimeMinutes))}</span>
          </div>
          <a class="blogx-btn" href="blog/${featured.slug}/">Read the full guide</a>
        </div>
      </article>`
    : `<article class="blogx-empty">
        <h2>No blog post published yet</h2>
        <p>We only publish real articles with operational insights. Add your first post in <code>content/blog/posts</code> and run <code>npm run build:blog</code>.</p>
      </article>`;

  const latestHtml = latest.length
    ? latest.map((post) => postCardHtml(post, "", true)).join("\n")
    : "";

  const topicPills = topics
    .map(
      (topic) =>
        `<button type="button" data-topic-filter="${escapeHtml(topic.slug)}">${escapeHtml(
          topic.name
        )} (${topic.posts.length})</button>`
    )
    .join("");

  return `${pageHead({
    title: "Blog | Sphere Logistics",
    description:
      "Sphere blog hub for logistics strategy, customer moving guides, and driver growth content.",
    canonical,
    robots,
    ogImage: featured ? featured.heroImage : "assets/hero-trucks.png",
    jsonLd
  })}
  <body>
    <header class="page-hero blogx-hero">
      <div class="container page-hero-shell">
${navHtml("blog")}
        <section class="blogx-hero-copy">
          <p class="blogx-kicker">Sphere Move Journal</p>
          <h1>Bulk move insights for Lagos, Abuja, and Ibadan teams.</h1>
          <p>Clear, practical guides for customers, businesses, and truck or van drivers moving goods and belongings across Nigeria.</p>
          <div class="blogx-chipbar">${topics
            .slice(0, 6)
            .map((topic) => `<a href="/blog/topic/${topic.slug}/">${escapeHtml(topic.name)}</a>`)
            .join("")}</div>
        </section>
      </div>
    </header>

    <main class="inner-main blogx-main">
      <section class="section section-soft">
        <div class="container blogx-shell">
          ${featuredHtml}
        </div>
      </section>

      <section class="section section-soft">
        <div class="container blogx-shell">
          <div class="blogx-section-head">
            <h2>Latest Articles</h2>
            <a href="/contact" class="blogx-link">Need a custom logistics answer? Talk to us</a>
          </div>
          <div class="blogx-discovery">
            <div class="blogx-searchbox">
              <label for="blogSearch">Search articles</label>
              <div class="blogx-searchrow">
                <input id="blogSearch" type="search" placeholder="Search topic, keyword, or phrase" />
                <button id="blogSearchClear" type="button">Clear</button>
              </div>
            </div>
            <div class="blogx-filterbar" id="blogTopicFilters">
              <button type="button" data-topic-filter="all" class="is-active">All topics (${latest.length})</button>
              ${topicPills}
            </div>
            <p class="blogx-results" id="blogResultsCount">${latest.length} articles shown</p>
          </div>
          <div class="blogx-grid">
            ${latestHtml}
          </div>
          <p class="blogx-no-results" id="blogNoResults" hidden>No articles match this filter. Try a broader keyword.</p>
        </div>
      </section>

      <section class="section section-soft">
        <div class="container blogx-shell">
          <div class="blogx-cta-band">
            <div>
              <p class="blogx-kicker">Internal Resource Links</p>
              <h3>Continue your journey inside Sphere</h3>
              <p>Use our core pages to move from reading to action.</p>
            </div>
            <div class="blogx-cta-links">
              <a href="/">Request a Driver</a>
              <a href="/drive-earn">Become a driver</a>
              <a href="/about">About Sphere</a>
              <a href="/contact">Speak with support</a>
            </div>
          </div>
        </div>
      </section>
    </main>
${footerHtml()}
    <script>
      (function () {
        function onReady(fn) {
          if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
            return;
          }
          fn();
        }

        onReady(function () {
          var input = document.getElementById("blogSearch");
          var clearBtn = document.getElementById("blogSearchClear");
          var filterBar = document.getElementById("blogTopicFilters");
          var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-topic-filter]"));
          var cards = Array.prototype.slice.call(document.querySelectorAll(".blogx-card[data-post]"));
          var resultCount = document.getElementById("blogResultsCount");
          var noResults = document.getElementById("blogNoResults");
          var activeTopic = "all";

          function normalize(value) {
            return String(value || "")
              .toLowerCase()
              .replace(/\s+/g, " ")
              .trim();
          }

          function syncActiveButton(topic) {
            var i;
            for (i = 0; i < filterButtons.length; i += 1) {
              var button = filterButtons[i];
              var buttonTopic = normalize(button.getAttribute("data-topic-filter"));
              var isActive = buttonTopic === topic;
              button.classList.toggle("is-active", isActive);
              button.setAttribute("aria-pressed", isActive ? "true" : "false");
            }
          }

          function applyFilters() {
            var query = normalize(input ? input.value : "");
            var visibleCount = 0;
            var i;

            for (i = 0; i < cards.length; i += 1) {
              var card = cards[i];
              var topic = normalize(card.getAttribute("data-topic"));
              var textBlob = normalize(
                [
                  card.getAttribute("data-title"),
                  card.getAttribute("data-description"),
                  card.getAttribute("data-tags")
                ].join(" ")
              );
              var topicMatch = activeTopic === "all" || topic === activeTopic;
              var queryMatch = !query || textBlob.indexOf(query) !== -1;
              var show = topicMatch && queryMatch;

              card.hidden = !show;
              card.style.display = show ? "" : "none";
              if (show) {
                visibleCount += 1;
              }
            }

            if (resultCount) {
              resultCount.textContent =
                visibleCount === 1 ? "1 article shown" : String(visibleCount) + " articles shown";
            }
            if (noResults) {
              noResults.hidden = visibleCount > 0;
            }
          }

          function findFilterButton(target) {
            var node = target;
            while (node && node !== filterBar) {
              if (node.nodeType === 1 && node.hasAttribute("data-topic-filter")) {
                return node;
              }
              node = node.parentNode;
            }
            return null;
          }

          if (filterBar) {
            filterBar.addEventListener("click", function (event) {
              var button = findFilterButton(event.target);
              if (!button) {
                return;
              }
              activeTopic = normalize(button.getAttribute("data-topic-filter") || "all");
              syncActiveButton(activeTopic);
              applyFilters();
            });
          }

          if (input) {
            input.addEventListener("input", applyFilters);
            input.addEventListener("search", applyFilters);
          }

          if (clearBtn) {
            clearBtn.addEventListener("click", function () {
              if (input) {
                input.value = "";
              }
              activeTopic = "all";
              syncActiveButton(activeTopic);
              applyFilters();
            });
          }

          syncActiveButton(activeTopic);
          applyFilters();
        });
      })();
    </script>
  </body>
</html>`;
}

function renderTopicPage(topic, topics) {
  const canonical = `${SITE_URL}/blog/topic/${topic.slug}/`;
  const posts = topic.posts;
  const featured = posts[0];
  const latest = posts.slice(1);
  const latestHtml = latest.length
    ? latest.map((post) => postCardHtml(post, "../../../", false)).join("\n")
    : '<p class="blogx-related-empty">No additional posts in this topic yet.</p>';

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${topic.name} Articles | Sphere Blog`,
    url: canonical,
    description: `Expert ${topic.name.toLowerCase()} content from Sphere.`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/blog/${post.slug}/`,
        name: post.title
      }))
    }
  };

  const moreTopics = topics.filter((item) => item.slug !== topic.slug).slice(0, 6);

  return `${pageHead({
    title: `${topic.name} Articles | Sphere Blog`,
    description: `Browse high-intent ${topic.name.toLowerCase()} content from Sphere's editorial team.`,
    canonical,
    robots: "index,follow",
    ogImage: featured ? featured.heroImage : "assets/hero-trucks.png",
    jsonLd,
    prefix: "../../../"
  })}
  <body>
    <header class="page-hero blogx-hero">
      <div class="container page-hero-shell">
${navHtml("blog", "../../../")}
        <section class="blogx-hero-copy">
          <p class="blogx-kicker">Topic Archive</p>
          <h1>${escapeHtml(topic.name)}</h1>
          <p>${posts.length} article${posts.length === 1 ? "" : "s"} in this topic. Structured for practical outcomes, not filler.</p>
          <div class="blogx-chipbar">
            <a href="/blog">All topics</a>
            ${moreTopics
              .map((item) => `<a href="/blog/topic/${item.slug}/">${escapeHtml(item.name)}</a>`)
              .join("")}
          </div>
        </section>
      </div>
    </header>

    <main class="inner-main blogx-main">
      <section class="section section-soft">
        <div class="container blogx-shell">
          ${
            featured
              ? `<article class="blogx-featured">
                  <a class="blogx-featured-media" href="../../${featured.slug}/">
                    <img src="${escapeHtml(resolveMediaPath(featured.heroImage, "../../../"))}" alt="${escapeHtml(
                      featured.heroImageAlt
                    )}" loading="lazy" />
                  </a>
                  <div class="blogx-featured-body">
                    <p class="blogx-kicker">Top in ${escapeHtml(topic.name)}</p>
                    <h2><a href="../../${featured.slug}/">${escapeHtml(featured.title)}</a></h2>
                    <p>${escapeHtml(featured.description)}</p>
                    <div class="blogx-meta-row">
                      <span>${escapeHtml(formatDate(featured.publishedAt))}</span>
                      <span>&middot;</span>
                      <span>${escapeHtml(readingLabel(featured.readTimeMinutes))}</span>
                    </div>
                    <a class="blogx-btn" href="../../${featured.slug}/">Read article</a>
                  </div>
                </article>`
              : ""
          }
        </div>
      </section>

      <section class="section section-soft">
        <div class="container blogx-shell">
          <div class="blogx-section-head">
            <h2>More in ${escapeHtml(topic.name)}</h2>
            <a href="/blog" class="blogx-link">Back to blog hub</a>
          </div>
          <div class="blogx-grid">
            ${latestHtml}
          </div>
        </div>
      </section>
    </main>
${footerHtml("../../../")}
  </body>
</html>`;
}

function renderExternalReferenceList(urls) {
  if (!urls.length) {
    return "";
  }

  const items = urls
    .slice(0, 8)
    .map((url) => {
      let label = url;
      try {
        label = new URL(url).hostname.replace(/^www\./, "");
      } catch (_error) {
        label = url;
      }
      return `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></li>`;
    })
    .join("");

  return `<section class="blogx-module">
    <h3>Referenced resources</h3>
    <p>We cite useful external references to improve trust and accuracy.</p>
    <ul class="blogx-ref-list">${items}</ul>
  </section>`;
}

function renderInternalPathways(prefix = "../../") {
  return `<section class="blogx-module">
    <h3>Explore more from Sphere</h3>
    <ul class="blogx-inline-links">
      <li><a href="/">Request a Driver on Sphere</a></li>
      <li><a href="/drive-earn">Driver earnings and onboarding</a></li>
      <li><a href="/about">About our logistics model</a></li>
      <li><a href="/contact">Contact operations support</a></li>
    </ul>
  </section>`;
}

function renderLeadCapture(prefix = "../../") {
  return `<section class="blogx-lead-box">
    <div>
      <p class="blogx-kicker">Get New Guides</p>
      <h3>Join Sphere's logistics insights list</h3>
      <p>Receive practical bulk-move and driver-growth playbooks directly in your inbox.</p>
    </div>
    <form class="blogx-lead-form" action="/contact" method="get">
      <label>
        Name
        <input type="text" name="name" placeholder="Your name" />
      </label>
      <label>
        Email
        <input type="email" name="email" placeholder="you@example.com" required />
      </label>
      <button type="submit">Join the list</button>
    </form>
  </section>`;
}

function extractFaqEntries(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const entries = [];
  let inFaq = false;
  let currentQuestion = "";
  let currentAnswer = [];

  const flush = () => {
    if (!currentQuestion || !currentAnswer.length) {
      currentQuestion = "";
      currentAnswer = [];
      return;
    }
    entries.push({
      question: stripMarkdown(currentQuestion),
      answer: stripMarkdown(currentAnswer.join(" ")).trim()
    });
    currentQuestion = "";
    currentAnswer = [];
  };

  lines.forEach((raw) => {
    const line = raw.trim();

    if (/^##\s+/.test(line)) {
      flush();
      inFaq = /faq|frequently asked questions/i.test(line);
      return;
    }

    if (!inFaq) {
      return;
    }

    if (/^###\s+/.test(line)) {
      flush();
      currentQuestion = line.replace(/^###\s+/, "");
      return;
    }

    if (!line) {
      return;
    }

    currentAnswer.push(line);
  });

  flush();
  return entries.filter((item) => item.question && item.answer).slice(0, 8);
}

function renderInlineArticleCta(post, prefix = "../../") {
  const cityHints = [];
  if (post.slug.includes("lagos")) cityHints.push("Lagos");
  if (post.slug.includes("abuja")) cityHints.push("Abuja");
  if (post.slug.includes("ibadan")) cityHints.push("Ibadan");
  const coverage = cityHints.length ? cityHints.join(", ") : "Lagos, Abuja, and Ibadan";

  return `<section class="blogx-inline-cta">
    <p class="blogx-kicker">Ready to apply this?</p>
    <h3>Turn this guide into a real move plan</h3>
    <p>Sphere operations can help you execute this flow in ${escapeHtml(
      coverage
    )} with the right vehicle and route timing.</p>
    <div class="blogx-inline-cta-actions">
      <a class="blogx-btn" href="/download/">Request a driver</a>
      <a class="blogx-link" href="/contact">Talk to operations</a>
    </div>
  </section>`;
}

function renderArticleSnapshot(post, toc) {
  const topSections = toc
    .filter((item) => item.level === 2)
    .slice(0, 4)
    .map((item) => `<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.text)}</a></li>`)
    .join("");

  const tags = post.tags.slice(0, 4).map((tag) => `<li>${escapeHtml(tag)}</li>`).join("");

  return `<section class="blogx-snapshot">
    <h2>At a glance</h2>
    <div class="blogx-snapshot-grid">
      <article class="blogx-snapshot-card">
        <h3>What you will learn</h3>
        <ul>${topSections || "<li>Practical operations guidance for bulk logistics.</li>"}</ul>
      </article>
      <article class="blogx-snapshot-card">
        <h3>Article profile</h3>
        <ul>
          <li><strong>Category:</strong> ${escapeHtml(post.category)}</li>
          <li><strong>Read time:</strong> ${escapeHtml(readingLabel(post.readTimeMinutes))}</li>
          <li><strong>Updated:</strong> ${escapeHtml(formatDate(post.updatedAt))}</li>
        </ul>
      </article>
      <article class="blogx-snapshot-card">
        <h3>Focus areas</h3>
        <ul>${tags || "<li>Logistics planning</li><li>Execution control</li>"}</ul>
      </article>
    </div>
  </section>`;
}

function buildAutoFaqEntries(post) {
  const slug = String(post.slug || "").toLowerCase();
  const city = slug.includes("lagos")
    ? "Lagos"
    : slug.includes("abuja")
      ? "Abuja"
      : slug.includes("ibadan")
        ? "Ibadan"
        : "Nigeria";

  return [
    {
      question: `Which Sphere vehicle option is best for this kind of move in ${city}?`,
      answer:
        "Use compact car for light, low-volume transfers, van for bulky mixed household or business items, and medium truck for full-load movement or high-volume stock."
    },
    {
      question: `How early should I request a driver for a bulk move in ${city}?`,
      answer:
        "For better driver matching and smoother execution, request a driver at least 24 to 48 hours ahead, especially when your move has tight access windows or multiple heavy items."
    },
    {
      question: "Can Sphere support recurring business movements?",
      answer:
        "Yes. Businesses can run repeat movement patterns with standardized load notes, route timing preferences, and clear receiving contacts to improve consistency over time."
    }
  ];
}

function renderFaqModule(entries) {
  if (!entries.length) {
    return "";
  }

  return `<section class="blogx-module blogx-faq-module">
    <h3>Frequently asked questions</h3>
    <div class="blogx-faq-list">${entries
      .map(
        (entry) =>
          `<article class="blogx-faq-item"><h4>${escapeHtml(entry.question)}</h4><p>${escapeHtml(
            entry.answer
          )}</p></article>`
      )
      .join("")}</div>
  </section>`;
}

function renderPostPage(post, allPosts) {
  const canonical = `${SITE_URL}/blog/${post.slug}/`;
  const supplementalImage = post.supplementalImage || pickSupplementalImage(post);
  const parseResult = markdownToHtml(post.body, {
    prefix: "../../",
    inlineCtaHtml: renderInlineArticleCta(post, "../../"),
    supplementalImage,
    supplementalImageAlt: toImageCaption(supplementalImage)
  });
  const htmlBody = parseResult.html;
  const toc = parseResult.toc;
  const externalLinks = parseResult.externalLinks;
  const faqEntries = extractFaqEntries(post.body);
  const effectiveFaqEntries = faqEntries.length ? faqEntries : buildAutoFaqEntries(post);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_URL}/blog`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: canonical
      }
    ]
  };

  const blogPosting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: [toAbsoluteUrl(post.heroImage)],
    author: {
      "@type": "Person",
      name: post.author
    },
    publisher: {
      "@type": "Organization",
      name: "Sphere Logistics",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/assets/sphere-blue-logo.png`
      }
    },
    datePublished: isoDate(post.publishedAt),
    dateModified: isoDate(post.updatedAt),
    mainEntityOfPage: canonical,
    articleSection: post.category,
    keywords: post.tags.join(", "),
    wordCount: stripMarkdown(post.body).split(/\s+/).filter(Boolean).length,
    timeRequired: `PT${post.readTimeMinutes}M`
  };

  const faqSchema =
    effectiveFaqEntries.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: effectiveFaqEntries.map((entry) => ({
            "@type": "Question",
            name: entry.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: entry.answer
            }
          }))
        }
      : null;

  const tocHtml = toc.length
    ? `<ol>${toc
        .map(
          (item) =>
            `<li class="lvl-${item.level}"><a href="#${escapeHtml(item.id)}">${escapeHtml(item.text)}</a></li>`
        )
        .join("")}</ol>`
    : "<p class=\"blogx-toc-empty\">No sections detected.</p>";

  const related = allPosts
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((a, b) => {
      const categoryScore = (x) => (x.category === post.category ? 1 : 0);
      return categoryScore(b) - categoryScore(a);
    })
    .slice(0, 3);

  const relatedHtml = related.length
    ? related.map((item) => relatedPostCardHtml(item, "../../")).join("\n")
    : "<p class=\"blogx-related-empty\">More articles will appear here as new posts are published.</p>";

  const quickTakeaways = toc
    .filter((item) => item.level === 2)
    .slice(0, 3)
    .map((item) => `<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.text)}</a></li>`)
    .join("");

  return `${pageHead({
    title: `${post.title} | Sphere Blog`,
    description: post.description,
    canonical,
    robots: "index,follow",
    ogImage: post.heroImage,
    jsonLd: faqSchema ? [breadcrumb, blogPosting, faqSchema] : [breadcrumb, blogPosting],
    prefix: "../../",
    ogType: "article"
  })}
  <body>
    <div class="blogx-reading-progress" aria-hidden="true"><span id="blogProgressBar"></span></div>
    <header class="page-hero blogx-article-hero">
      <div class="container page-hero-shell">
${navHtml("blog", "../../")}
        <div class="blogx-article-head-wrap">
          <div class="blogx-article-head">
            <p class="blogx-kicker">${escapeHtml(post.category)}</p>
            <h1>${escapeHtml(post.title)}</h1>
            <p>${escapeHtml(post.description)}</p>
            <div class="blogx-meta-row">
              <span>By ${escapeHtml(post.author)}</span>
              <span>&middot;</span>
              <span>${escapeHtml(formatDate(post.publishedAt))}</span>
              <span>&middot;</span>
              <span>${escapeHtml(readingLabel(post.readTimeMinutes))}</span>
            </div>
            <div class="blogx-tags">${post.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
          </div>
          <figure class="blogx-article-head-media">
            <img src="${escapeHtml(resolveMediaPath(post.heroImage, "../../"))}" alt="${escapeHtml(
    post.heroImageAlt
  )}" loading="eager" />
          </figure>
        </div>
      </div>
    </header>

    <main class="inner-main blogx-main">
      <section class="section section-soft">
        <div class="container blogx-article-shell">
          <aside class="blogx-rail">
            <section class="blogx-rail-card">
              <h3>In this article</h3>
              ${tocHtml}
            </section>
            <section class="blogx-rail-card">
              <h3>Need help now?</h3>
              <p>Speak with the Sphere operations team for route and vehicle support.</p>
              <a class="blogx-btn" href="/contact">Contact Sphere</a>
            </section>
          </aside>

          <article class="blogx-article">
            ${
              quickTakeaways
                ? `<section class="blogx-takeaways">
                    <h2>Quick takeaways</h2>
                    <ul>${quickTakeaways}</ul>
                  </section>`
                : ""
            }

            ${renderArticleSnapshot(post, toc)}

            <div class="blogx-prose">
${htmlBody}
            </div>

            ${renderFaqModule(effectiveFaqEntries)}
            ${renderInternalPathways("../../")}
            ${renderExternalReferenceList(externalLinks)}
            ${renderLeadCapture("../../")}

            <section class="blogx-author-box">
              <h3>About the author</h3>
              <p><strong>${escapeHtml(post.author)}</strong> &middot; ${escapeHtml(post.authorRole)}</p>
              <p>Sphere Editorial publishes operations-backed guides for movers, merchants, and truck and van drivers across Nigeria.</p>
            </section>
          </article>
        </div>
      </section>

      <section class="section section-soft">
        <div class="container blogx-shell">
          <div class="blogx-section-head">
            <h2>Related reading</h2>
            <a href="/blog" class="blogx-link">View all posts</a>
          </div>
          <div class="blogx-related-grid">${relatedHtml}</div>
        </div>
      </section>
    </main>
${footerHtml("../../")}
    <script>
      (() => {
        const bar = document.getElementById("blogProgressBar");
        if (!bar) return;
        const article = document.querySelector(".blogx-prose");
        if (!article) return;

        const update = () => {
          const rect = article.getBoundingClientRect();
          const viewport = window.innerHeight || 1;
          const total = rect.height + viewport;
          const progressed = Math.min(Math.max(viewport - rect.top, 0), total);
          const ratio = total > 0 ? progressed / total : 0;
          bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
        };

        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        update();
      })();
    </script>
  </body>
</html>`;
}

function writeBlogPostPages(posts) {
  ensureDir(BLOG_OUT_DIR);

  const existing = fs.readdirSync(BLOG_OUT_DIR, { withFileTypes: true });
  existing.forEach((entry) => {
    if (entry.isDirectory()) {
      fs.rmSync(path.join(BLOG_OUT_DIR, entry.name), { recursive: true, force: true });
    }
  });

  posts.forEach((post) => {
    const outDir = path.join(BLOG_OUT_DIR, post.slug);
    ensureDir(outDir);
    fs.writeFileSync(path.join(outDir, "index.html"), renderPostPage(post, posts), "utf8");
  });
}

function writeTopicPages(posts) {
  const topics = getTopics(posts);
  if (fs.existsSync(TOPIC_OUT_DIR)) {
    fs.rmSync(TOPIC_OUT_DIR, { recursive: true, force: true });
  }
  ensureDir(TOPIC_OUT_DIR);

  topics.forEach((topic) => {
    const outDir = path.join(TOPIC_OUT_DIR, topic.slug);
    ensureDir(outDir);
    fs.writeFileSync(path.join(outDir, "index.html"), renderTopicPage(topic, topics), "utf8");
  });

  return topics;
}

function buildSitemap(posts, topics) {
  const urls = [];

  STATIC_ROUTES.forEach((route) => {
    const filePath = path.join(ROOT, route.file);
    if (!fs.existsSync(filePath)) {
      return;
    }
    const mtime = fs.statSync(filePath).mtime.toISOString();
    urls.push({ loc: `${SITE_URL}${route.loc}`, lastmod: mtime });
  });

  posts.forEach((post) => {
    urls.push({
      loc: `${SITE_URL}/blog/${post.slug}/`,
      lastmod: isoDate(post.updatedAt)
    });
  });

  topics.forEach((topic) => {
    const latestUpdate = topic.posts.reduce((max, post) => {
      const current = new Date(isoDate(post.updatedAt)).getTime();
      return Math.max(max, current);
    }, 0);
    urls.push({
      loc: `${SITE_URL}/blog/topic/${topic.slug}/`,
      lastmod: new Date(latestUpdate).toISOString()
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeHtml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`;

  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf8");
}

function buildRss(posts) {
  const items = posts
    .slice(0, 25)
    .map(
      (post) => `  <item>
    <title><![CDATA[${post.title}]]></title>
    <link>${SITE_URL}/blog/${post.slug}/</link>
    <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}/</guid>
    <pubDate>${parseDateValue(post.publishedAt).toUTCString()}</pubDate>
    <description><![CDATA[${post.description}]]></description>
  </item>`
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Sphere Blog</title>
  <link>${SITE_URL}/blog</link>
  <description>Logistics strategy and bulk move operations insights from Sphere.</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel>
</rss>`;

  fs.writeFileSync(path.join(ROOT, "rss.xml"), rss, "utf8");
}

function buildRobots() {
  const content = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(ROOT, "robots.txt"), content, "utf8");
}

function run() {
  ensureDir(POSTS_DIR);
  const posts = readPosts();
  const globallyUsedSupplementals = new Set();
  posts.forEach((post) => {
    const supplementalImage = pickSupplementalImage(post, globallyUsedSupplementals);
    if (supplementalImage) {
      post.supplementalImage = supplementalImage;
      globallyUsedSupplementals.add(filenameFromPath(supplementalImage));
    }
  });
  const blogIndex = renderBlogIndex(posts);
  fs.writeFileSync(path.join(ROOT, "blog.html"), blogIndex, "utf8");
  writeBlogPostPages(posts);
  const topics = writeTopicPages(posts);
  buildSitemap(posts, topics);
  buildRss(posts);
  buildRobots();

  console.log(`Blog build complete. Posts published: ${posts.length}`);
}

run();

