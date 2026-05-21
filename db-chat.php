<?php
// db-chat.php
function getChatDB() {
    $host = 'localhost';
    $db   = 'sistema';
    $user = 'root';
    $pass = '';
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        return new PDO($dsn, $user, $pass, $options);
    } catch (\PDOException $e) {
        header('Content-Type: application/json');
        echo json_encode(['reply' => 'Error de conexión a la base de datos local.']);
        exit;
    }
}