<?php
declare(strict_types=1);

require_once __DIR__ . '/common.php';

$action = strtolower(trim((string)($_GET['action'] ?? 'session')));
$method = reqMethod();

if ($action === 'session' && $method === 'GET') {
  $editor = getEditorSession();
  if (!$editor) {
    sendJson(200, [
      'ok' => true,
      'authenticated' => false,
    ]);
  }

  sendJson(200, [
    'ok' => true,
    'authenticated' => true,
    'editor' => $editor,
    'csrf' => (string)($_SESSION['csrf'] ?? ''),
  ]);
}

if ($action === 'login' && $method === 'POST') {
  $payload = readJsonBody();
  $username = trim((string)($payload['username'] ?? ''));
  $password = (string)($payload['password'] ?? '');

  if ($username === '' || $password === '') {
    sendJson(400, [
      'ok' => false,
      'error' => 'Username and password are required.',
    ]);
  }

  $user = findEditorByUsername($username);
  if (!$user || !verifyEditorPassword($user, $password)) {
    sendJson(401, [
      'ok' => false,
      'error' => 'Invalid username or password.',
    ]);
  }

  session_regenerate_id(true);
  $_SESSION['editor'] = [
    'username' => (string)$user['username'],
    'author' => (string)$user['author'],
    'authorRole' => (string)$user['authorRole'],
  ];
  $_SESSION['csrf'] = bin2hex(random_bytes(32));

  sendJson(200, [
    'ok' => true,
    'authenticated' => true,
    'editor' => $_SESSION['editor'],
    'csrf' => $_SESSION['csrf'],
  ]);
}

if ($action === 'logout' && $method === 'POST') {
  $_SESSION = [];
  if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool)$params['secure'], (bool)$params['httponly']);
  }
  session_destroy();

  sendJson(200, [
    'ok' => true,
    'authenticated' => false,
  ]);
}

sendJson(405, [
  'ok' => false,
  'error' => 'Unsupported action or method.',
]);

