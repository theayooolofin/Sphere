<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

const POSTS_DIR = 'content/blog/posts';

function cleanOneLine(string $value): string
{
  $out = preg_replace('/\s+/', ' ', trim($value));
  return trim((string)$out);
}

function sanitizeSlug(string $value): string
{
  $slug = strtolower(trim($value));
  $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
  $slug = preg_replace('/\s+/', '-', (string)$slug);
  $slug = preg_replace('/-+/', '-', (string)$slug);
  return trim((string)$slug, '-');
}

function toIsoOffsetString(string $value): string
{
  $raw = trim($value);
  if ($raw === '') {
    return '';
  }

  try {
    $date = new DateTimeImmutable($raw);
  } catch (Throwable $t) {
    return '';
  }

  return $date->format('Y-m-d\TH:i:sP');
}

function markdownFromPayload(array $payload, array $editor): array
{
  $title = cleanOneLine((string)($payload['title'] ?? ''));
  $description = cleanOneLine((string)($payload['description'] ?? ''));
  $category = cleanOneLine((string)($payload['category'] ?? ''));
  $heroImage = cleanOneLine((string)($payload['heroImage'] ?? ''));
  $heroAlt = cleanOneLine((string)($payload['heroAlt'] ?? ''));
  $tags = cleanOneLine((string)($payload['tags'] ?? ''));
  $body = trim((string)($payload['body'] ?? ''));
  $publishedAt = toIsoOffsetString((string)($payload['publishedAt'] ?? ''));
  $incomingSlug = cleanOneLine((string)($payload['slug'] ?? ''));

  $slug = sanitizeSlug($incomingSlug !== '' ? $incomingSlug : $title);

  if (
    $title === '' ||
    $slug === '' ||
    $description === '' ||
    $category === '' ||
    $heroImage === '' ||
    $body === '' ||
    $publishedAt === ''
  ) {
    sendJson(400, [
      'ok' => false,
      'error' => 'Missing required fields.',
    ]);
  }

  $heroAltFinal = $heroAlt !== '' ? $heroAlt : $title;

  $markdown = implode("\n", [
    '---',
    'title: ' . $title,
    'slug: ' . $slug,
    'description: ' . $description,
    'author: ' . $editor['author'],
    'authorRole: ' . $editor['authorRole'],
    'category: ' . $category,
    'publishedAt: ' . $publishedAt,
    'updatedAt: ' . $publishedAt,
    'heroImage: ' . $heroImage,
    'heroImageAlt: ' . $heroAltFinal,
    'tags: ' . $tags,
    '---',
    '',
    $body,
    '',
  ]);

  return [
    'slug' => $slug,
    'markdown' => $markdown,
  ];
}

function handleRecent(): void
{
  requireEditorSession();
  $cfg = ghConfig();

  $listPath = sprintf(
    '/repos/%s/%s/contents/%s?ref=%s',
    rawurlencode($cfg['owner']),
    rawurlencode($cfg['repo']),
    implode('/', array_map('rawurlencode', explode('/', POSTS_DIR))),
    rawurlencode($cfg['branch'])
  );
  $listRes = ghRequest($listPath, 'GET', $cfg['token']);

  if ($listRes['status'] >= 400) {
    sendJson(502, [
      'ok' => false,
      'error' => (string)($listRes['body']['message'] ?? 'Failed to load recent posts.'),
    ]);
  }

  $files = is_array($listRes['body']) ? $listRes['body'] : [];
  $mdFiles = array_values(array_filter($files, static function ($entry): bool {
    return is_array($entry) &&
      (($entry['type'] ?? '') === 'file') &&
      substr((string)($entry['name'] ?? ''), -3) === '.md';
  }));

  usort($mdFiles, static function (array $a, array $b): int {
    return strcmp((string)($b['name'] ?? ''), (string)($a['name'] ?? ''));
  });

  $recent = [];
  foreach (array_slice($mdFiles, 0, 10) as $entry) {
    $name = (string)($entry['name'] ?? '');
    $filePath = POSTS_DIR . '/' . $name;
    $path = sprintf(
      '/repos/%s/%s/contents/%s?ref=%s',
      rawurlencode($cfg['owner']),
      rawurlencode($cfg['repo']),
      implode('/', array_map('rawurlencode', explode('/', $filePath))),
      rawurlencode($cfg['branch'])
    );
    $res = ghRequest($path, 'GET', $cfg['token']);
    $meta = [];
    if ($res['status'] < 400 && is_array($res['body'])) {
      $rawContent = (string)($res['body']['content'] ?? '');
      $decoded = base64_decode(str_replace("\n", '', $rawContent), true);
      if ($decoded !== false) {
        $meta = parseFrontmatter($decoded);
      }
    }

    $recent[] = [
      'slug' => preg_replace('/\.md$/', '', $name),
      'title' => (string)($meta['title'] ?? '-'),
      'author' => (string)($meta['author'] ?? '-'),
      'publishedAt' => (string)($meta['publishedAt'] ?? '-'),
    ];
  }

  sendJson(200, [
    'ok' => true,
    'count' => count($mdFiles),
    'recent' => $recent,
  ]);
}

function handlePublish(): void
{
  $editor = requireEditorSession();
  verifyCsrfHeader();
  $cfg = ghConfig();
  $payload = readJsonBody();

  $overwrite = (bool)($payload['overwrite'] ?? false);
  $post = markdownFromPayload($payload, $editor);
  $filePath = POSTS_DIR . '/' . $post['slug'] . '.md';
  $encodedPath = implode('/', array_map('rawurlencode', explode('/', $filePath)));

  $contentPath = sprintf(
    '/repos/%s/%s/contents/%s?ref=%s',
    rawurlencode($cfg['owner']),
    rawurlencode($cfg['repo']),
    $encodedPath,
    rawurlencode($cfg['branch'])
  );
  $existing = ghRequest($contentPath, 'GET', $cfg['token']);
  $sha = '';

  if ($existing['status'] < 400) {
    $sha = (string)($existing['body']['sha'] ?? '');
    if (!$overwrite) {
      sendJson(409, [
        'ok' => false,
        'error' => 'This slug already exists. Confirm overwrite.',
        'requiresOverwrite' => true,
      ]);
    }
  } elseif ((int)$existing['status'] !== 404) {
    sendJson(502, [
      'ok' => false,
      'error' => (string)($existing['body']['message'] ?? 'Failed to verify slug.'),
    ]);
  }

  $commitPayload = [
    'message' => sprintf('blog: publish %s by %s', $post['slug'], $editor['username']),
    'content' => base64_encode($post['markdown']),
    'branch' => $cfg['branch'],
  ];
  if ($sha !== '') {
    $commitPayload['sha'] = $sha;
  }

  $commitPath = sprintf(
    '/repos/%s/%s/contents/%s',
    rawurlencode($cfg['owner']),
    rawurlencode($cfg['repo']),
    $encodedPath
  );
  $commit = ghRequest($commitPath, 'PUT', $cfg['token'], $commitPayload);

  if ($commit['status'] >= 400) {
    sendJson(502, [
      'ok' => false,
      'error' => (string)($commit['body']['message'] ?? 'Publish failed.'),
    ]);
  }

  sendJson(200, [
    'ok' => true,
    'slug' => $post['slug'],
    'url' => 'https://www.sphere.ng/blog/' . $post['slug'] . '/',
    'message' => 'Published. GitHub Action deployment has started.',
  ]);
}

$action = strtolower(trim((string)($_GET['action'] ?? 'recent')));
$method = reqMethod();

if ($action === 'recent' && $method === 'GET') {
  handleRecent();
}

if ($action === 'publish' && $method === 'POST') {
  handlePublish();
}

sendJson(405, [
  'ok' => false,
  'error' => 'Unsupported action or method.',
]);
