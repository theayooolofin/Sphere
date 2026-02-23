# Sphere

Static marketing site for Sphere (`sphere.ng`) with generated blog pages.

## Local commands

- `npm run build:blog`: Regenerates blog index, post pages, topic pages, sitemap, rss, and robots.
- `npm run build:static`: Builds deploy-ready static output into `dist-static/`.

## Auto deploy to DomainKing (GitHub Actions)

This repo now includes `.github/workflows/deploy-domainking.yml`.

On every push to `main`, it will:

1. Install dependencies
2. Run `npm run build:blog`
3. Run `npm run build:static`
4. FTP deploy `dist-static/` to `/public_html/`

### Required GitHub Secrets

Add these in GitHub: `Settings -> Secrets and variables -> Actions -> New repository secret`

- `DOMAINKING_FTP_HOST` (example: `ftp.sphere.ng` or your cPanel host)
- `DOMAINKING_FTP_USER`
- `DOMAINKING_FTP_PASS`

The workflow currently deploys on FTP port `21`.
