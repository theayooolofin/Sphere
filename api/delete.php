<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: https://sphere.ng');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed.']);
    exit;
}

// --- Rate limiting: max 5 submissions per IP per hour, file-based ---
function checkRateLimit(string $ip): bool {
    $dir  = sys_get_temp_dir() . '/sphere_del_rl';
    if (!is_dir($dir)) {
        mkdir($dir, 0700, true);
    }
    $file    = $dir . '/' . md5($ip) . '.json';
    $window  = 3600; // 1 hour
    $maxHits = 5;
    $now     = time();
    $hits    = [];

    if (is_file($file)) {
        $raw = file_get_contents($file);
        if ($raw !== false) {
            $hits = json_decode($raw, true) ?? [];
        }
    }

    // Drop timestamps outside the window
    $hits = array_values(array_filter($hits, fn($t) => ($now - $t) < $window));

    if (count($hits) >= $maxHits) {
        return false; // rate limit exceeded
    }

    $hits[] = $now;
    file_put_contents($file, json_encode($hits), LOCK_EX);
    return true;
}

$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (!checkRateLimit($ip)) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Too many requests. Please try again later.']);
    exit;
}

// --- Parse body ---
$raw  = file_get_contents('php://input');
$data = json_decode((string)$raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid request.']);
    exit;
}

// Strip newlines to prevent header injection, then trim
function cleanField(mixed $v): string {
    return trim(str_replace(["\r", "\n"], ' ', (string)$v));
}

$name        = cleanField($data['name']        ?? '');
$email       = cleanField($data['email']       ?? '');
$phone       = cleanField($data['phone']       ?? '');
$accountType = cleanField($data['accountType'] ?? '');
$reason      = cleanField($data['reason']      ?? '');

// Field length caps
$name   = mb_substr($name,   0, 120);
$email  = mb_substr($email,  0, 254);
$phone  = mb_substr($phone,  0, 30);
$reason = mb_substr($reason, 0, 1000);

// Validation
if ($name === '' || ($email === '' && $phone === '') || $accountType === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Please fill in all required fields.']);
    exit;
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Please enter a valid email address.']);
    exit;
}

$accountTypeLabel = match($accountType) {
    'customer' => 'Customer (User)',
    'driver'   => 'Driver',
    'both'     => 'Both (Customer & Driver)',
    default    => 'Unknown',
};

$reasonLabel = $reason !== '' ? $reason : 'Not provided';
$timestamp   = date('Y-m-d H:i:s T');

$subject = 'Account Deletion Request — ' . $name;

$body = <<<TEXT
A new account deletion request was submitted on sphere.ng/delete.

------------------------------
Name:         {$name}
Email:        {$email}
Phone:        {$phone}
Account type: {$accountTypeLabel}
Reason:       {$reasonLabel}
Submitted at: {$timestamp}
IP address:   {$ip}
------------------------------

Please locate this account and process the deletion within 30 days.
Reply to this email to confirm once complete.

-- Sphere automated system
TEXT;

$to      = 'support@sphere.ng';
$headers = implode("\r\n", [
    'From: Sphere Website <noreply@sphere.ng>',
    'Reply-To: ' . ($email !== '' ? $email : $to),
    'X-Mailer: Sphere-DeleteRequest/1.0',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
]);

$sent = mail($to, $subject, $body, $headers);

if (!$sent) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'We could not send your request right now. Please email support@sphere.ng directly.']);
    exit;
}

http_response_code(200);
echo json_encode(['ok' => true]);
