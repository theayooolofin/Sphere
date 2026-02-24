# Sphere

Static marketing site for Sphere (`sphere.ng`) with generated blog pages.

## Local commands

- `npm run build:blog`: Regenerates blog index, post pages, topic pages, sitemap, rss, and robots.
- `npm run build:static`: Builds deploy-ready static output into `dist-static/`.

## Blog admin (server-side auth + publish)

`/blog-admin` now uses PHP API endpoints in `/api/`:

- `api/auth.php` (login/session/logout)
- `api/blog.php` (recent posts + publish markdown to GitHub)

### Server env required

- `SPHERE_GH_TOKEN` (GitHub token with `repo` write scope)

Optional overrides:

- `SPHERE_GH_OWNER` (default: `theayooolofin`)
- `SPHERE_GH_REPO` (default: `Sphere`)
- `SPHERE_GH_BRANCH` (default: `main`)
- `SPHERE_AUTH_PEPPER` (extra hash hardening)

If your host does not expose env vars, copy `api/config.local.example.php` to
`api/config.local.php` on the server and set values there.

### Default editor usernames

- `ayo_admin`
- `mariam_admin`
- `tola_admin`

User records live in `api/config.php`. Change salts/hashes before production.

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
