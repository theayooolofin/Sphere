<?php
declare(strict_types=1);

/*
 * Server-side config for Sphere blog admin.
 * Set these in hosting env where possible:
 * - SPHERE_GH_OWNER
 * - SPHERE_GH_REPO
 * - SPHERE_GH_BRANCH
 * - SPHERE_GH_TOKEN
 * - SPHERE_AUTH_PEPPER
 */

const BLOG_GH_OWNER = 'theayooolofin';
const BLOG_GH_REPO = 'Sphere';
const BLOG_GH_BRANCH = 'main';
const BLOG_GH_TOKEN = '';
const BLOG_AUTH_PEPPER = '';

/**
 * Password hashes are sha256(salt|password|BLOG_AUTH_PEPPER)
 * Default users:
 * - ayo_admin
 * - mariam_admin
 * - tola_admin
 *
 * Change these before production use.
 */
const BLOG_ADMIN_USERS = [
  [
    'username' => 'ayo_admin',
    'author' => 'Ayo Olofin',
    'authorRole' => 'Founder, Sphere',
    'salt' => '9f8e8b6b41799fe9b0bb40ec791de10a',
    'hash' => '0832373539f0f0aba8e34f19ae84022e4b4144a602b18c0c3c36cea201806f63',
  ],
  [
    'username' => 'mariam_admin',
    'author' => 'Mariam',
    'authorRole' => 'Content & Operations',
    'salt' => 'a85361442e6be0800691da8655ba5b12',
    'hash' => '7d86ecaab5356812d1762255de75187c4795b2386dcfb48e1014aedd8810028b',
  ],
  [
    'username' => 'tola_admin',
    'author' => 'Tola',
    'authorRole' => 'Driver Growth & Field Operations',
    'salt' => 'd320acf888e1bf6cefde281657845ba7',
    'hash' => '2f101067f106c4b115c8e33fbb66511683be36cde82a103f0355cdb7f1b88f89',
  ],
];

function cfg(string $key, string $fallback = ''): string
{
  $value = getenv($key);
  if ($value === false || $value === null || $value === '') {
    return $fallback;
  }
  return trim((string)$value);
}

function blogGithubOwner(): string
{
  return cfg('SPHERE_GH_OWNER', BLOG_GH_OWNER);
}

function blogGithubRepo(): string
{
  return cfg('SPHERE_GH_REPO', BLOG_GH_REPO);
}

function blogGithubBranch(): string
{
  return cfg('SPHERE_GH_BRANCH', BLOG_GH_BRANCH ?: 'main');
}

function blogGithubToken(): string
{
  return cfg('SPHERE_GH_TOKEN', BLOG_GH_TOKEN);
}

function blogAuthPepper(): string
{
  return cfg('SPHERE_AUTH_PEPPER', BLOG_AUTH_PEPPER);
}

$localConfig = __DIR__ . '/config.local.php';
if (is_file($localConfig)) {
  require_once $localConfig;
}
