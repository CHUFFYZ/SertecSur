<?php
// api-chat.phporiginal
header('Content-Type: application/json');
require_once 'db-chat.php'; // Conexión independiente

$input = json_decode(file_get_contents('php://input'), true);
$messages = $input['messages'] ?? [];

if (empty($messages)) {
    echo json_encode(['reply' => 'No he recibido mensajes.']);
    exit;
}

try {
    $pdo = getChatDB();
    
    // Consultamos los productos de forma independiente
    $stmt = $pdo->query("SELECT nombre, tipo, precio, descripcion FROM Producto WHERE stock > 0");
    $productos = $stmt->fetchAll();
    
    $contexto = "Catálogo SERTECSUR:\n";
    foreach ($productos as $p) {
        $contexto .= "- {$p['nombre']} ({$p['tipo']}): {$p['descripcion']}. Precio: {$p['precio']}.\n";
    }

    // --- Configuración OpenAI ---
    $apiKey = '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'; 
    
    $payload = [
        "model" => "gpt-4o-mini",
        "messages" => array_merge([
            ["role" => "system", "content" => "Eres el asistente técnico de SERTECSUR. Usa estos productos: " . $contexto]
        ], $messages),
        "temperature" => 0.7
    ];

    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ]);

    $result = curl_exec($ch);
    $data = json_decode($result, true);
    curl_close($ch);

    if (isset($data['choices'][0]['message']['content'])) {
        echo json_encode(['reply' => $data['choices'][0]['message']['content']]);
    } else {
        echo json_encode(['reply' => 'La IA no pudo procesar la respuesta.', 'debug' => $data]);
    }

} catch (Exception $e) {
    echo json_encode(['reply' => 'Error en el motor del chat.']);
}