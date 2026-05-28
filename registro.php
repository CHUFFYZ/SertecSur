<?php
// Asegurar que si hay un error fatal, responda en texto/json y no rompa todo de golpe
header('Content-Type: application/json; charset=utf-8');

require_once 'config.php';
require_once 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Asegurarnos de que la sesión esté activa para evitar Warnings
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método no permitido.', 405);
}

$b = body();
$nombre   = trim($b['nombre']   ?? '');
$correo   = trim($b['correo']   ?? '');
$telefono = trim($b['telefono'] ?? '');
$password = trim($b['password'] ?? '');
$via      = in_array($b['via'] ?? 'email', ['email', 'whatsapp']) ? $b['via'] : 'email';

if (!$nombre || !$correo || !$password) {
    jsonError('Nombre, correo y contraseña son requeridos.');
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    jsonError('Correo electrónico inválido.');
}

if (strlen($password) < 8) {
    jsonError('La contraseña debe tener al menos 8 caracteres.');
}

if ($via === 'whatsapp' && !$telefono) {
    jsonError('El teléfono es requerido para verificación por WhatsApp.');
}

$pdo = getDB();

$identificador = $_SERVER['REMOTE_ADDR'] . '|registro';
if (!verificarRateLimit($pdo, $identificador, 'registro')) {
    jsonError('Demasiados intentos de registro. Espera 15 minutos.', 429);
}

$stmtCheck = $pdo->prepare('SELECT id_usuario, verificado FROM usuario WHERE correo = ?');
$stmtCheck->execute([$correo]);
$existente = $stmtCheck->fetch();

if ($existente && (int)$existente['verificado'] === 1) {
    jsonError('Este correo ya está registrado.');
}

$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
$otp  = generarOTP();
$expira = date('Y-m-d H:i:s', time() + (OTP_TTL_MINUTOS * 60));

if ($existente && (int)$existente['verificado'] === 0) {
    $usuarioId = (int)$existente['id_usuario'];
    $pdo->prepare(
        'UPDATE usuario SET nombre = ?, telefono = ?, contrasena = ?, via_verificacion = ? WHERE id_usuario = ?'
    )->execute([$nombre, $telefono, $hash, $via, $usuarioId]);
    limpiarTokensExpirados($pdo, $usuarioId, 'registro');
} else {
    $pdo->prepare(
        'INSERT INTO usuario (nombre, telefono, correo, contrasena, verificado, via_verificacion)
         VALUES (?, ?, ?, ?, 0, ?)'
    )->execute([$nombre, $telefono, $correo, $hash, $via]);
    $usuarioId = (int)$pdo->lastInsertId();

    $pdo->prepare('INSERT INTO cliente (usuario_id) VALUES (?)')->execute([$usuarioId]);
}

$pdo->prepare(
    'INSERT INTO verificaciones_temporales (usuario_id, token, tipo, via, expira_en)
     VALUES (?, ?, ?, ?, ?)'
)->execute([$usuarioId, $otp, 'registro', $via, $expira]);
$tokenId = (int)$pdo->lastInsertId();

if ($via === 'email') {
    $enviado = enviarCorreoOTP($correo, $nombre, $otp);
    if (!$enviado['ok']) {
        jsonError('No se pudo enviar el correo de verificación: ' . $enviado['error']);
    }
} else {
    $enviado = enviarWhatsAppOTP($telefono, $nombre, $otp);
    if (!$enviado['ok']) {
        jsonError('No se pudo enviar el mensaje de WhatsApp: ' . $enviado['error']);
    }
}

$_SESSION['otp_usuario_id'] = $usuarioId;
$_SESSION['otp_token_id']   = $tokenId;
$_SESSION['otp_via']        = $via;
$_SESSION['otp_correo']     = $correo;

jsonOk([
    'mensaje'    => 'Código enviado. Revisa tu ' . ($via === 'email' ? 'correo' : 'WhatsApp') . '.',
    'via'        => $via,
    'usuario_id' => $usuarioId,
]);

/* ── FUNCIONES AUXILIARES ────────────────────────────────────────────────── */

function enviarCorreoOTP(string $correo, string $nombre, string $otp): array {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom(SMTP_FROM, SMTP_NAME);
        $mail->addAddress($correo, $nombre);
        $mail->isHTML(true);
        $mail->Subject = 'Tu código de verificación — SERTECSUR';
        $mail->Body    = plantillaCorreo($nombre, $otp);
        $mail->AltBody = "Hola $nombre, tu código de verificación es: $otp. Válido por " . OTP_TTL_MINUTOS . " minutos.";

        $mail->send();
        return ['ok' => true];
    } catch (Exception $e) {
        return ['ok' => false, 'error' => $mail->ErrorInfo];
    }
}

function enviarWhatsAppOTP(string $telefono, string $nombre, string $otp): array {
    $telefono = preg_replace('/\D/', '', $telefono);
    if (strlen($telefono) === 10) {
        $telefono = '52' . $telefono;
    }

    $mensaje = urlencode(
        "Hola $nombre 👋\n\n" .
        "Tu código de verificación SERTECSUR es:\n\n" .
        "*$otp*\n\n" .
        "Válido por " . OTP_TTL_MINUTOS . " minutos.\n" .
        "Si no solicitaste esto, ignora este mensaje."
    );
    $url = "https://api.whatsapp.com/send?phone={$telefono}&text={$mensaje}";

    return ['ok' => true, 'url' => $url];
}

function plantillaCorreo(string $nombre, string $otp): string {
    $ttl     = OTP_TTL_MINUTOS;
    $digitos = implode('', array_map(
        fn($d) => "<span style='display:inline-block;width:48px;height:56px;line-height:56px;text-align:center;font-size:1.8rem;font-weight:700;background:#eef3f8;border:2px solid #1a3a5c;border-radius:8px;margin:0 4px;color:#1a3a5c;'>$d</span>",
        str_split($otp)
    ));
    return "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'><title>Verificación</title></head>
    <body style='margin:0;padding:0;background:#f0f4f8;font-family:Roboto,Arial,sans-serif;'>
      <table width='100%' cellpadding='0' cellspacing='0' style='background:#f0f4f8;padding:2rem 0;'>
        <tr><td align='center'>
          <table width='560' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.10);max-width:100%;'>
            <tr><td style='background:#1a3a5c;padding:1.5rem 2rem;text-align:center;'>
              <h1 style='color:#fff;margin:0;font-size:1.4rem;letter-spacing:.03em;'>SERTECSUR</h1>
              <p style='color:#8ab4d4;margin:.3rem 0 0;font-size:.82rem;'>Servicios Tecnológicos del Sureste</p>
            </td></tr>
            <tr><td style='padding:2rem 2.5rem;'>
              <p style='color:#1f2937;font-size:1rem;margin:0 0 .5rem;'>Hola, <strong>$nombre</strong></p>
              <p style='color:#6b7280;font-size:.9rem;line-height:1.65;margin:0 0 1.5rem;'>Usa el siguiente código para verificar tu cuenta. Expira en <strong>$ttl minutos</strong>.</p>
              <div style='text-align:center;margin:1.5rem 0;'>$digitos</div>
              <p style='color:#6b7280;font-size:.78rem;text-align:center;margin:1rem 0 0;'>Si no creaste una cuenta en SERTECSUR, ignora este correo.</p>
            </td></tr>
            <tr><td style='background:#f0f4f8;padding:1rem 2rem;text-align:center;border-top:1px solid #dde1e7;'>
              <p style='color:#9ca3af;font-size:.72rem;margin:0;'>© 2025 SERTECSUR · Cd. del Carmen, Campeche · ventas@sertecsur.net</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>";
}