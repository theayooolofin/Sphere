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

$raw  = file_get_contents('php://input');
$data = json_decode((string)$raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid request.']);
    exit;
}

$name        = trim((string)($data['name']        ?? ''));
$email       = trim((string)($data['email']       ?? ''));
$phone       = trim((string)($data['phone']       ?? ''));
$accountType = trim((string)($data['accountType'] ?? ''));
$reason      = trim((string)($data['reason']      ?? ''));

// Basic validation
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

// Sanitise for email body
function esc(string $s): string {
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$accountTypeLabel = match($accountType) {
    'customer' => 'Customer (User)',
    'driver'   => 'Driver',
    'both'     => 'Both (Customer & Driver)',
    default    => esc($accountType),
};

$reasonLabel = $reason !== '' ? esc($reason) : 'Not provided';

$timestamp = date('Y-m-d H:i:s T');
$ip        = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

$subject = "Account Deletion Request — {$name}";

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
