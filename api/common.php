<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function startAdminSession(): void
{
  if (session_status() === PHP_SESSION_ACTIVE) {
    return;
  }

  $isHttps = (
    (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
    (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443)
  );

  session_name('sphere_blog_admin');
  session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
  session_start();
}

function sendJson(int $statusCode, array $payload): void
{
  http_response_code($statusCode);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
  echo json_encode($payload, JSON_UNESCAPED_SLASHES);
  exit;
}

function readJsonBody(): array
{
  $raw = file_get_contents('php://input');
  if ($raw === false || trim($raw) === '') {
    return [];
  }

  $data = json_decode($raw, true);
  if (!is_array($data)) {
    sendJson(400, [
      'ok' => false,
      'error' => 'Invalid JSON payload.',
    ]);
  }

  return $data;
}

function reqMethod(): string
{
  return strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
}

function getEditorSession(): ?array
{
  if (!isset($_SESSION['editor']) || !is_array($_SESSION['editor'])) {
    return null;
  }

  $editor = $_SESSION['editor'];
  if (empty($editor['username']) || empty($editor['author']) || empty($editor['authorRole'])) {
    return null;
  }

  return [
    'username' => (string)$editor['username'],
    'author' => (string)$editor['author'],
    'authorRole' => (string)$editor['authorRole'],
  ];
}

function requireEditorSession(): array
{
  $editor = getEditorSession();
  if (!$editor) {
    sendJson(401, [
      'ok' => false,
      'error' => 'You are not signed in.',
    ]);
  }
  return $editor;
}

function verifyCsrfHeader(): void
{
  $sessionCsrf = (string)($_SESSION['csrf'] ?? '');
  $headerCsrf = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');

  if ($sessionCsrf === '' || $headerCsrf === '' || !hash_equals($sessionCsrf, $headerCsrf)) {
    sendJson(403, [
      'ok' => false,
      'error' => 'Invalid security token.',
    ]);
  }
}

function findEditorByUsername(string $username): ?array
{
  $needle = strtolower(trim($username));
  foreach (BLOG_ADMIN_USERS as $user) {
    $candidate = strtolower((string)($user['username'] ?? ''));
    if ($candidate === $needle) {
      return $user;
    }
  }
  return null;
}

function verifyEditorPassword(array $user, string $password): bool
{
  $salt = (string)($user['salt'] ?? '');
  $stored = (string)($user['hash'] ?? '');
  if ($salt === '' || $stored === '') {
    return false;
  }

  $pepper = blogAuthPepper();
  $incoming = hash('sha256', $salt . '|' . $password . '|' . $pepper);
  return hash_equals($stored, $incoming);
}

function ghConfig(): array
{
  $owner = blogGithubOwner();
  $repo = blogGithubRepo();
  $branch = blogGithubBranch();
  $token = blogGithubToken();

  if ($owner === '' || $repo === '' || $branch === '' || $token === '') {
    sendJson(500, [
      'ok' => false,
      'error' => 'GitHub backend config is missing. Set SPHERE_GH_OWNER, SPHERE_GH_REPO, SPHERE_GH_BRANCH, and SPHERE_GH_TOKEN on the server.',
    ]);
  }

  return [
    'owner' => $owner,
    'repo' => $repo,
    'branch' => $branch,
    'token' => $token,
  ];
}

function ghRequest(string $path, string $method, string $token, ?array $jsonBody = null): array
{
  if (!function_exists('curl_init')) {
    sendJson(500, [
      'ok' => false,
      'error' => 'cURL extension is required on the server for GitHub publishing.',
    ]);
  }

  $url = 'https://api.github.com' . $path;
  $ch = curl_init($url);
  if ($ch === false) {
    sendJson(500, ['ok' => false, 'error' => 'Failed to initialize network client.']);
  }

  $headers = [
    'Accept: application/vnd.github+json',
    'Authorization: Bearer ' . $token,
    'User-Agent: sphere-blog-admin',
    'X-GitHub-Api-Version: 2022-11-28',
  ];

  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
  curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
  curl_setopt($ch, CURLOPT_TIMEOUT, 30);

  if ($jsonBody !== null) {
    $payload = json_encode($jsonBody, JSON_UNESCAPED_SLASHES);
    if ($payload === false) {
      sendJson(500, ['ok' => false, 'error' => 'Failed to encode API payload.']);
    }
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($headers, ['Content-Type: application/json']));
  }

  $raw = curl_exec($ch);
  if ($raw === false) {
    $message = curl_error($ch) ?: 'GitHub request failed.';
    curl_close($ch);
    sendJson(502, ['ok' => false, 'error' => $message]);
  }

  $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  curl_close($ch);

  $data = json_decode((string)$raw, true);
  if (!is_array($data)) {
    $data = ['message' => trim((string)$raw)];
  }

  return [
    'status' => $code,
    'body' => $data,
  ];
}

function stringStartsWith(string $haystack, string $needle): bool
{
  if ($needle === '') {
    return true;
  }
  return substr($haystack, 0, strlen($needle)) === $needle;
}

function parseFrontmatter(string $markdown): array
{
  if (!stringStartsWith($markdown, "---\n")) {
    return [];
  }

  $end = strpos($markdown, "\n---\n", 4);
  if ($end === false) {
    return [];
  }

  $front = substr($markdown, 4, $end - 4);
  $meta = [];
  foreach (preg_split('/\r?\n/', (string)$front) as $line) {
    $line = trim((string)$line);
    if ($line === '' || strpos($line, ':') === false) {
      continue;
    }
    [$k, $v] = explode(':', $line, 2);
    $meta[trim($k)] = trim((string)$v);
  }
  return $meta;
}

startAdminSession();
