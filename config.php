<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'sistema');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'soporte-sertecsur@gmail.com');
define('SMTP_PASS', 'ahoj dvec yhor oufzs');
define('SMTP_FROM', 'soporte-sertecsur@gmail.com');
define('SMTP_NAME', 'SERTECSUR');

define('OTP_TTL_MINUTOS', 15);
define('OTP_MAX_INTENTOS', 5);
define('RATE_LIMIT_MAX', 3);
define('RATE_LIMIT_VENTANA', 900);

define('WA_API_URL', 'https://api.whatsapp.com/send');
define('WA_NUMERO', '529381329935');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $opciones = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $opciones);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Error de conexión a la base de datos.']);
            exit;
        }
    }
    return $pdo;
}

function jsonOk(array $data = []): void {
    header('Content-Type: application/json');
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

function jsonError(string $msg, int $code = 400): void {
    header('Content-Type: application/json');
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

function body(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function generarOTP(): string {
    return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

function verificarRateLimit(PDO $pdo, string $identificador, string $accion): bool {
    $ventana = date('Y-m-d H:i:s', time() - RATE_LIMIT_VENTANA);

    $stmt = $pdo->prepare(
        'SELECT id, contador, ventana_inicio FROM rate_limit_otp
         WHERE identificador = ? AND accion = ?'
    );
    $stmt->execute([$identificador, $accion]);
    $registro = $stmt->fetch();

    if (!$registro) {
        $pdo->prepare(
            'INSERT INTO rate_limit_otp (identificador, accion, contador, ventana_inicio)
             VALUES (?, ?, 1, NOW())'
        )->execute([$identificador, $accion]);
        return true;
    }

    if ($registro['ventana_inicio'] < $ventana) {
        $pdo->prepare(
            'UPDATE rate_limit_otp SET contador = 1, ventana_inicio = NOW()
             WHERE identificador = ? AND accion = ?'
        )->execute([$identificador, $accion]);
        return true;
    }

    if ((int)$registro['contador'] >= RATE_LIMIT_MAX) {
        return false;
    }

    $pdo->prepare(
        'UPDATE rate_limit_otp SET contador = contador + 1
         WHERE identificador = ? AND accion = ?'
    )->execute([$identificador, $accion]);

    return true;
}

function limpiarTokensExpirados(PDO $pdo, int $usuarioId, string $tipo): void {
    $pdo->prepare(
        'DELETE FROM verificaciones_temporales
         WHERE usuario_id = ? AND tipo = ? AND (expira_en < NOW() OR usado = 1)'
    )->execute([$usuarioId, $tipo]);
}

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }