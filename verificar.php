<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método no permitido.', 405);
}

$action = $_GET['action'] ?? '';

match($action) {
    'verificar-otp'  => accionVerificarOTP(),
    'reenviar-otp'   => accionReenviarOTP(),
    'reset-solicitar'=> accionResetSolicitar(),
    'reset-verificar'=> accionResetVerificar(),
    default          => jsonError('Acción no reconocida.', 404)
};

function accionVerificarOTP(): void {
    $pdo = getDB();
    $b   = body();

    $usuarioId = (int)($_SESSION['otp_usuario_id'] ?? $b['usuario_id'] ?? 0);
    $tokenId   = (int)($_SESSION['otp_token_id']   ?? $b['token_id']   ?? 0);
    $codigo    = trim($b['codigo'] ?? '');
    $tipo      = 'registro';

    if (!$usuarioId || !$codigo) {
        jsonError('Datos incompletos.');
    }

    if (!preg_match('/^\d{6}$/', $codigo)) {
        jsonError('El código debe ser de 6 dígitos numéricos.');
    }

    $ip = $_SERVER['REMOTE_ADDR'];
    if (!verificarRateLimit($pdo, $ip . '|verificar', 'verificar')) {
        jsonError('Demasiados intentos fallidos. Espera 15 minutos.', 429);
    }

    $stmt = $pdo->prepare(
        'SELECT id, token, expira_en, intentos, usado
         FROM verificaciones_temporales
         WHERE usuario_id = ? AND tipo = ? AND usado = 0
         ORDER BY creado_en DESC LIMIT 1'
    );
    $stmt->execute([$usuarioId, $tipo]);
    $registro = $stmt->fetch();

    if (!$registro) {
        jsonError('No hay un código activo para este usuario.');
    }

    if ((int)$registro['intentos'] >= OTP_MAX_INTENTOS) {
        invalidarToken($pdo, $registro['id']);
        limpiarSesionOTP();
        jsonError('Superaste el máximo de intentos. Solicita un nuevo código.', 429);
    }

    $pdo->prepare(
        'UPDATE verificaciones_temporales SET intentos = intentos + 1 WHERE id = ?'
    )->execute([$registro['id']]);

    if (new DateTime() > new DateTime($registro['expira_en'])) {
        invalidarToken($pdo, $registro['id']);
        limpiarSesionOTP();
        jsonError('El código ha expirado. Solicita uno nuevo.', 410);
    }

    if (!hash_equals($registro['token'], $codigo)) {
        $restantes = OTP_MAX_INTENTOS - ((int)$registro['intentos'] + 1);
        jsonError("Código incorrecto. Te quedan $restantes intentos.");
    }

    invalidarToken($pdo, $registro['id']);

    $pdo->prepare(
        'UPDATE usuario SET verificado = 1 WHERE id_usuario = ?'
    )->execute([$usuarioId]);

    limpiarTokensExpirados($pdo, $usuarioId, $tipo);
    limpiarSesionOTP();

    $stmtUser = $pdo->prepare(
        'SELECT u.id_usuario, u.nombre, u.correo, u.telefono,
                c.id_cliente,
                IF(e.id_empleado IS NOT NULL, "admin", "cliente") AS rol
         FROM usuario u
         LEFT JOIN cliente c ON c.usuario_id = u.id_usuario
         LEFT JOIN empleado e ON e.usuario_id = u.id_usuario
         WHERE u.id_usuario = ?'
    );
    $stmtUser->execute([$usuarioId]);
    $user = $stmtUser->fetch();

    $_SESSION['user'] = [
        'id'        => $user['id_usuario'],
        'nombre'    => $user['nombre'],
        'correo'    => $user['correo'],
        'telefono'  => $user['telefono'] ?? '',
        'rol'       => $user['rol'],
        'clienteId' => $user['id_cliente'] ?? null,
    ];

    jsonOk([
        'mensaje' => '¡Cuenta verificada correctamente! Bienvenido a SERTECSUR.',
        'rol'     => $user['rol'],
        'nombre'  => $user['nombre'],
    ]);
}

function accionReenviarOTP(): void {
    require_once 'vendor/autoload.php';
    require_once 'registro.php';

    $pdo = getDB();
    $b   = body();

    $usuarioId = (int)($_SESSION['otp_usuario_id'] ?? $b['usuario_id'] ?? 0);

    if (!$usuarioId) {
        jsonError('Sesión expirada. Regístrate de nuevo.');
    }

    $ip = $_SERVER['REMOTE_ADDR'];
    if (!verificarRateLimit($pdo, $ip . '|reenviar', 'reenviar')) {
        jsonError('Demasiadas solicitudes de reenvío. Espera 15 minutos.', 429);
    }

    $stmtUser = $pdo->prepare(
        'SELECT nombre, correo, telefono, via_verificacion FROM usuario WHERE id_usuario = ?'
    );
    $stmtUser->execute([$usuarioId]);
    $user = $stmtUser->fetch();

    if (!$user) {
        jsonError('Usuario no encontrado.');
    }

    $pdo->prepare(
        'UPDATE verificaciones_temporales SET usado = 1
         WHERE usuario_id = ? AND tipo = ? AND usado = 0'
    )->execute([$usuarioId, 'registro']);

    $otp    = generarOTP();
    $expira = date('Y-m-d H:i:s', time() + (OTP_TTL_MINUTOS * 60));
    $via    = $user['via_verificacion'] ?? 'email';

    $stmtIns = $pdo->prepare(
        'INSERT INTO verificaciones_temporales (usuario_id, token, tipo, via, expira_en)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmtIns->execute([$usuarioId, $otp, 'registro', $via, $expira]);

    $_SESSION['otp_token_id'] = (int)$pdo->lastInsertId();

    if ($via === 'email') {
        $resultado = enviarCorreoOTP($user['correo'], $user['nombre'], $otp);
        if (!$resultado['ok']) {
            jsonError('No se pudo reenviar el correo: ' . $resultado['error']);
        }
    } else {
        $resultado = enviarWhatsAppOTP($user['telefono'], $user['nombre'], $otp);
    }

    jsonOk(['mensaje' => 'Código reenviado correctamente.', 'via' => $via]);
}

function accionResetSolicitar(): void {
    require_once 'vendor/autoload.php';
    require_once 'registro.php';

    $pdo = getDB();
    $b   = body();

    $correo = trim($b['correo'] ?? '');

    if (!$correo || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        jsonError('Correo electrónico inválido.');
    }

    $ip = $_SERVER['REMOTE_ADDR'];
    if (!verificarRateLimit($pdo, $ip . '|reset', 'reset')) {
        jsonError('Demasiadas solicitudes. Espera 15 minutos.', 429);
    }

    $stmt = $pdo->prepare(
        'SELECT id_usuario, nombre, telefono, via_verificacion, verificado
         FROM usuario WHERE correo = ?'
    );
    $stmt->execute([$correo]);
    $user = $stmt->fetch();

    if (!$user || !(int)$user['verificado']) {
        jsonOk(['mensaje' => 'Si el correo existe, recibirás un código en breve.']);
    }

    $usuarioId = (int)$user['id_usuario'];
    $via       = $user['via_verificacion'] ?? 'email';

    $pdo->prepare(
        'UPDATE verificaciones_temporales SET usado = 1
         WHERE usuario_id = ? AND tipo = ? AND usado = 0'
    )->execute([$usuarioId, 'reset']);

    limpiarTokensExpirados($pdo, $usuarioId, 'reset');

    $otp    = generarOTP();
    $expira = date('Y-m-d H:i:s', time() + (OTP_TTL_MINUTOS * 60));

    $pdo->prepare(
        'INSERT INTO verificaciones_temporales (usuario_id, token, tipo, via, expira_en)
         VALUES (?, ?, ?, ?, ?)'
    )->execute([$usuarioId, $otp, 'reset', $via, $expira]);

    $tokenId = (int)$pdo->lastInsertId();

    $_SESSION['reset_usuario_id'] = $usuarioId;
    $_SESSION['reset_token_id']   = $tokenId;
    $_SESSION['reset_correo']     = $correo;

    if ($via === 'email') {
        $resultado = enviarCorreoOTP($correo, $user['nombre'], $otp);
        if (!$resultado['ok']) {
            jsonError('No se pudo enviar el correo: ' . $resultado['error']);
        }
    } else {
        enviarWhatsAppOTP($user['telefono'], $user['nombre'], $otp);
    }

    jsonOk(['mensaje' => 'Si el correo existe, recibirás un código en breve.', 'via' => $via]);
}

function accionResetVerificar(): void {
    $pdo = getDB();
    $b   = body();

    $usuarioId   = (int)($_SESSION['reset_usuario_id'] ?? $b['usuario_id'] ?? 0);
    $codigo      = trim($b['codigo']      ?? '');
    $nuevaPass   = trim($b['nueva_pass']  ?? '');
    $tipo        = 'reset';

    if (!$usuarioId || !$codigo || !$nuevaPass) {
        jsonError('Datos incompletos.');
    }

    if (!preg_match('/^\d{6}$/', $codigo)) {
        jsonError('El código debe ser de 6 dígitos numéricos.');
    }

    if (strlen($nuevaPass) < 8) {
        jsonError('La contraseña debe tener al menos 8 caracteres.');
    }

    $ip = $_SERVER['REMOTE_ADDR'];
    if (!verificarRateLimit($pdo, $ip . '|reset-verify', 'reset-verify')) {
        jsonError('Demasiados intentos. Espera 15 minutos.', 429);
    }

    $stmt = $pdo->prepare(
        'SELECT id, token, expira_en, intentos, usado
         FROM verificaciones_temporales
         WHERE usuario_id = ? AND tipo = ? AND usado = 0
         ORDER BY creado_en DESC LIMIT 1'
    );
    $stmt->execute([$usuarioId, $tipo]);
    $registro = $stmt->fetch();

    if (!$registro) {
        jsonError('No hay un código activo. Solicita uno nuevo.');
    }

    if ((int)$registro['intentos'] >= OTP_MAX_INTENTOS) {
        invalidarToken($pdo, $registro['id']);
        limpiarSesionReset();
        jsonError('Superaste el máximo de intentos. Solicita un nuevo código.', 429);
    }

    $pdo->prepare(
        'UPDATE verificaciones_temporales SET intentos = intentos + 1 WHERE id = ?'
    )->execute([$registro['id']]);

    if (new DateTime() > new DateTime($registro['expira_en'])) {
        invalidarToken($pdo, $registro['id']);
        limpiarSesionReset();
        jsonError('El código ha expirado. Solicita uno nuevo.', 410);
    }

    if (!hash_equals($registro['token'], $codigo)) {
        $restantes = OTP_MAX_INTENTOS - ((int)$registro['intentos'] + 1);
        jsonError("Código incorrecto. Te quedan $restantes intentos.");
    }

    invalidarToken($pdo, $registro['id']);

    $hash = password_hash($nuevaPass, PASSWORD_BCRYPT, ['cost' => 12]);
    $pdo->prepare(
        'UPDATE usuario SET contrasena = ? WHERE id_usuario = ?'
    )->execute([$hash, $usuarioId]);

    limpiarTokensExpirados($pdo, $usuarioId, $tipo);
    limpiarSesionReset();

    jsonOk(['mensaje' => 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.']);
}

function invalidarToken(PDO $pdo, int $tokenId): void {
    $pdo->prepare(
        'UPDATE verificaciones_temporales SET usado = 1 WHERE id = ?'
    )->execute([$tokenId]);
}

function limpiarSesionOTP(): void {
    unset(
        $_SESSION['otp_usuario_id'],
        $_SESSION['otp_token_id'],
        $_SESSION['otp_via'],
        $_SESSION['otp_correo']
    );
}

function limpiarSesionReset(): void {
    unset(
        $_SESSION['reset_usuario_id'],
        $_SESSION['reset_token_id'],
        $_SESSION['reset_correo']
    );
}