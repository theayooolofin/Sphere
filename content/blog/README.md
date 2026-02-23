# Sphere Blog Publishing Guide

This blog is generated from real markdown files in:

`content/blog/posts/`

## 1. Create a post file

Create a new markdown file like:

`content/blog/posts/how-to-choose-truck-size.md`

Use this frontmatter format:

```md
---
title: How to Choose the Right Truck Size for Moving in Lagos
slug: how-to-choose-the-right-truck-size-for-moving-in-lagos
description: A practical guide to selecting truck sizes based on load type, distance, and budget.
author: Ayodeji Olofindeyi
category: Customer Guides
publishedAt: 2026-02-21
updatedAt: 2026-02-21
heroImage: https://www.sphere.ng/assets/hero-trucks.png
heroImageAlt: Sphere trucks lineup
tags: moving, truck size, lagos logistics
---

## Intro
Write real, helpful content only.

- Use clear steps
- Add local context
- Include a useful CTA
```

## 2. Build blog pages + SEO files

Run:

```bash
npm run build:blog
```

This generates/updates:

- `blog.html`
- `blog/<slug>/index.html`
- `sitemap.xml`
- `rss.xml`
- `robots.txt`

## 3. SEO policy

- Do not publish dummy articles.
- Every post must solve a real user problem.
- Keep title + description specific and search-intent focused.
