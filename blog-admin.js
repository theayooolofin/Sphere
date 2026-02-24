(() => {
  const DRAFT = "sphere_blog_admin_draft_v1";
  const API_AUTH = "/api/auth.php";
  const API_BLOG = "/api/blog.php";

  const state = { editor: null, csrf: "", postCount: 0 };

  const el = (id) => document.getElementById(id);
  const identityUser = el("identityUser");
  const identityPass = el("identityPass");
  const identityLogin = el("identityLogin");
  const identityLogout = el("identityLogout");
  const identityStatus = el("identityStatus");
  const connect = el("connect");
  const logout = el("logout");
  const authStatus = el("authStatus");
  const title = el("title");
  const slug = el("slug");
  const author = el("author");
  const description = el("description");
  const descLen = el("descLen");
  const category = el("category");
  const tags = el("tags");
  const publishedAt = el("publishedAt");
  const heroImage = el("heroImage");
  const heroAlt = el("heroAlt");
  const bodyText = el("bodyText");
  const template = el("template");
  const saveDraft = el("saveDraft");
  const loadDraft = el("loadDraft");
  const publish = el("publish");
  const publishStatus = el("publishStatus");
  const seoChecks = el("seoChecks");
  const preview = el("preview");
  const recentBody = el("recentBody");

  const editorLockedControls = [
    connect,
    logout,
    title,
    slug,
    description,
    category,
    tags,
    publishedAt,
    heroImage,
    heroAlt,
    bodyText,
    template,
    saveDraft,
    loadDraft,
    publish,
  ];

  const nowLocal = () => {
    const d = new Date();
    const p = (v) => String(v).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
      d.getHours()
    )}:${p(d.getMinutes())}`;
  };

  const slugify = (v) =>
    String(v || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const clean = (v) =>
    String(v || "")
      .replace(/\r?\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

  const setStatus = (node, msg, isError) => {
    if (!node) return;
    node.textContent = msg;
    node.classList.toggle("error", !!isError);
  };

  const setEditorMode = (enabled) => {
    editorLockedControls.forEach((control) => {
      if (control) control.disabled = !enabled;
    });
    if (author) author.disabled = true;
    if (!enabled && recentBody) {
      recentBody.innerHTML =
        '<tr><td colspan="4" style="color:var(--muted)">Sign in as editor to load posts.</td></tr>';
    }
  };

  async function api(url, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (!headers["Content-Type"] && opts.method && opts.method !== "GET") {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(url, {
      credentials: "same-origin",
      ...opts,
      headers,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.payload = data;
      throw err;
    }
    return data;
  }

  function updateSeo() {
    const t = title.value.trim();
    const d = description.value.trim();
    const b = bodyText.value.trim();
    const tg = tags.value.trim();
    const words = b.split(/\s+/).filter(Boolean).length;
    const h2 = (b.match(/^##\s+/gm) || []).length;
    const links = (b.match(/\[[^\]]+\]\((\/|https?:\/\/(www\.)?sphere\.ng)/gi) || [])
      .length;
    const imgs = (b.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
    descLen.textContent = String(d.length);

    const checks = [
      ["Title 50-65 chars", t.length >= 50 && t.length <= 65, t.length >= 40 && t.length <= 75],
      [
        "Meta description 140-170 chars",
        d.length >= 140 && d.length <= 170,
        d.length >= 120 && d.length <= 200,
      ],
      ["Body >= 650 words", words >= 650, words >= 450],
      ["At least 3 H2 headings", h2 >= 3, h2 >= 2],
      ["At least 2 internal links", links >= 2, links >= 1],
      ["At least 2 inline images", imgs >= 2, imgs >= 1],
      [
        "At least 3 tags",
        tg
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean).length >= 3,
        tg.length > 0,
      ],
    ];

    seoChecks.innerHTML = checks
      .map(
        ([label, pass, warn]) =>
          `<li class="${pass ? "ok" : warn ? "warn" : "bad"}">${label}</li>`
      )
      .join("");

    preview.innerHTML = b
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      .replace(/^# (.*)$/gm, "<h1>$1</h1>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\n\n+/g, "</p><p>");
    preview.innerHTML = `<p>${preview.innerHTML}</p>`;
  }

  function postPayload() {
    if (!state.editor) throw new Error("Sign in as editor first.");

    const t = clean(title.value);
    const s = slugify(slug.value || t);
    const d = clean(description.value);
    const c = clean(category.value);
    const p = publishedAt.value;
    const hi = clean(heroImage.value);
    const ha = clean(heroAlt.value || t);
    const tg = clean(tags.value);
    const b = String(bodyText.value || "").trim();

    if (!t || !s || !d || !c || !p || !hi || !b) {
      throw new Error("Complete all required fields.");
    }

    return {
      slug: s,
      title: t,
      description: d,
      category: c,
      publishedAt: p,
      heroImage: hi,
      heroAlt: ha,
      tags: tg,
      body: b,
    };
  }

  async function loadRecent() {
    recentBody.innerHTML =
      '<tr><td colspan="4" style="color:var(--muted)">Loading...</td></tr>';
    const data = await api(`${API_BLOG}?action=recent`, { method: "GET" });
    state.postCount = Number(data.count || 0);
    const rows = Array.isArray(data.recent) ? data.recent : [];
    recentBody.innerHTML = rows.length
      ? rows
          .map(
            (row) =>
              `<tr><td>${row.slug || "-"}</td><td>${row.title || "-"}</td><td>${
                row.author || "-"
              }</td><td>${row.publishedAt || "-"}</td></tr>`
          )
          .join("")
      : '<tr><td colspan="4" style="color:var(--muted)">No files found.</td></tr>';
    setStatus(authStatus, `Connected. ${state.postCount} post files found.`, false);
  }

  async function checkSessionAndSync() {
    try {
      const data = await api(`${API_AUTH}?action=session`, { method: "GET" });
      if (!data.authenticated) {
        state.editor = null;
        state.csrf = "";
        setStatus(identityStatus, "Not signed in as editor.", false);
        setStatus(authStatus, "Not connected.", false);
        setEditorMode(false);
        return;
      }

      state.editor = data.editor || null;
      state.csrf = data.csrf || "";
      if (state.editor) {
        identityUser.value = state.editor.username || "";
        author.value = state.editor.author || "";
        setStatus(
          identityStatus,
          `Signed in as ${state.editor.author} (${state.editor.username}).`,
          false
        );
        setEditorMode(true);
      }
    } catch (error) {
      setStatus(identityStatus, `Session check failed: ${error.message}`, true);
      setEditorMode(false);
    }
  }

  async function onEditorLogin() {
    const username = identityUser.value.trim();
    const password = identityPass.value;
    if (!username || !password) {
      setStatus(identityStatus, "Enter username and password.", true);
      return;
    }

    identityLogin.disabled = true;
    setStatus(identityStatus, "Signing in...", false);
    try {
      const data = await api(`${API_AUTH}?action=login`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      state.editor = data.editor || null;
      state.csrf = data.csrf || "";
      identityPass.value = "";
      author.value = state.editor?.author || "";
      setStatus(
        identityStatus,
        `Signed in as ${state.editor?.author || username} (${state.editor?.username || username}).`,
        false
      );
      setEditorMode(true);
      await loadRecent();
    } catch (error) {
      setStatus(identityStatus, error.message || "Login failed.", true);
    } finally {
      identityLogin.disabled = false;
    }
  }

  async function onEditorLogout() {
    try {
      await api(`${API_AUTH}?action=logout`, { method: "POST", body: "{}" });
    } catch (_) {
      // Ignore network failure and force local reset.
    }

    state.editor = null;
    state.csrf = "";
    identityPass.value = "";
    setStatus(identityStatus, "Signed out.", false);
    setStatus(authStatus, "Not connected.", false);
    setEditorMode(false);
  }

  async function onConnect() {
    if (!state.editor) {
      setStatus(authStatus, "Sign in as editor first.", true);
      return;
    }
    connect.disabled = true;
    setStatus(authStatus, "Refreshing posts...", false);
    try {
      await loadRecent();
    } catch (error) {
      setStatus(authStatus, error.message || "Failed to load posts.", true);
    } finally {
      connect.disabled = false;
    }
  }

  async function onPublish() {
    if (!state.editor) {
      setStatus(publishStatus, "Sign in as editor first.", true);
      return;
    }
    if (!state.csrf) {
      setStatus(publishStatus, "Session expired. Sign in again.", true);
      return;
    }

    let payload;
    try {
      payload = postPayload();
    } catch (error) {
      setStatus(publishStatus, error.message, true);
      return;
    }

    publish.disabled = true;
    setStatus(publishStatus, "Publishing...", false);
    try {
      const publishOnce = async (overwrite) =>
        api(`${API_BLOG}?action=publish`, {
          method: "POST",
          headers: { "X-CSRF-Token": state.csrf },
          body: JSON.stringify({ ...payload, overwrite }),
        });

      let data;
      try {
        data = await publishOnce(false);
      } catch (error) {
        if (!error.payload || !error.payload.requiresOverwrite) {
          throw error;
        }
        if (!window.confirm("Slug exists. Overwrite existing post?")) {
          setStatus(publishStatus, "Publish cancelled.", false);
          publish.disabled = false;
          return;
        }
        data = await publishOnce(true);
      }

      setStatus(
        publishStatus,
        `Published by ${state.editor.author}. Deploy started. Live URL after build: ${
          data.url || `https://www.sphere.ng/blog/${payload.slug}/`
        }`,
        false
      );
      await loadRecent();
    } catch (error) {
      setStatus(publishStatus, `Publish failed: ${error.message}`, true);
    } finally {
      publish.disabled = false;
    }
  }

  function onSaveDraft() {
    localStorage.setItem(
      DRAFT,
      JSON.stringify({
        title: title.value,
        slug: slug.value,
        description: description.value,
        category: category.value,
        tags: tags.value,
        publishedAt: publishedAt.value,
        heroImage: heroImage.value,
        heroAlt: heroAlt.value,
        bodyText: bodyText.value,
      })
    );
    setStatus(publishStatus, "Draft saved.", false);
  }

  function onLoadDraft() {
    const raw = localStorage.getItem(DRAFT);
    if (!raw) {
      setStatus(publishStatus, "No draft found.", true);
      return;
    }
    try {
      const d = JSON.parse(raw);
      title.value = d.title || "";
      slug.value = d.slug || "";
      description.value = d.description || "";
      category.value = d.category || category.value;
      tags.value = d.tags || "";
      publishedAt.value = d.publishedAt || publishedAt.value;
      heroImage.value = d.heroImage || heroImage.value;
      heroAlt.value = d.heroAlt || "";
      bodyText.value = d.bodyText || "";
      updateSeo();
      setStatus(publishStatus, "Draft loaded.", false);
    } catch (_) {
      setStatus(publishStatus, "Draft is corrupted.", true);
    }
  }

  function onTemplate() {
    const tpl = [
      "Write a practical intro tied to Lagos, Abuja, and Ibadan move realities.",
      "",
      "## Who this guide is for",
      "- Individuals moving household goods",
      "- Businesses moving stock and equipment",
      "- Teams coordinating regular bulk moves",
      "",
      "## Step 1: Define load, route, and access constraints",
      "Explain item classes, pickup limits, and destination access.",
      "",
      "![Load planning and route prep](assets/blog/city-lagos-traffic-aerial-16206733.jpg)",
      "",
      "## Step 2: Match load to the right vehicle class",
      "Give practical mapping for van and medium truck based on move profile.",
      "",
      "## Step 3: Reduce risk with clear handling controls",
      "Describe packing, handover checks, and communication rules.",
      "",
      "![Driver and customer handover check](assets/blog/bulk-driver-van-7363148.jpg)",
      "",
      "## Final checklist",
      "- Confirm item inventory",
      "- Confirm route window",
      "- Confirm access notes",
      "- Confirm contact availability",
      "",
      "## Request a driver",
      "- Start now: [Sphere Home](https://www.sphere.ng/)",
      "- Support: [Speak with Someone](https://www.sphere.ng/speak-with-someone)",
    ].join("\n");
    if (bodyText.value.trim() && !window.confirm("Replace current content with template?")) {
      return;
    }
    bodyText.value = tpl;
    updateSeo();
  }

  async function init() {
    publishedAt.value = nowLocal();
    heroAlt.value = "Black logistics teams coordinating a bulk move in Nigeria";
    updateSeo();

    [title, slug, description, tags, bodyText, heroImage, heroAlt].forEach((node) =>
      node.addEventListener("input", updateSeo)
    );
    title.addEventListener("input", () => {
      if (!slug.value || slug.dataset.auto === "1") {
        slug.value = slugify(title.value);
        slug.dataset.auto = "1";
      }
    });
    slug.addEventListener("input", () => {
      slug.dataset.auto = "0";
    });

    identityLogin.addEventListener("click", onEditorLogin);
    identityLogout.addEventListener("click", onEditorLogout);
    connect.addEventListener("click", onConnect);
    logout.addEventListener("click", checkSessionAndSync);
    publish.addEventListener("click", onPublish);
    saveDraft.addEventListener("click", onSaveDraft);
    loadDraft.addEventListener("click", onLoadDraft);
    template.addEventListener("click", onTemplate);

    setEditorMode(false);
    await checkSessionAndSync();
    if (state.editor) {
      await onConnect();
    }
  }

  init();
})();

