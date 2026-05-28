<?php
// api-chat.php
// api-chat.php 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
header('Content-Type: application/json');
require_once 'db-chat.php'; 

$input = json_decode(file_get_contents('php://input'), true);
$messages = $input['messages'] ?? [];

if (empty($messages)) {
    echo json_encode(['reply' => 'No he recibido mensajes.']);
    exit;
}

try {
    $pdo = getChatDB();
    
    $stmt = $pdo->query("SELECT nombre, tipo, precio, descripcion FROM Producto WHERE stock > 0");
    $productos = $stmt->fetchAll();
    
    $contexto = "Catálogo SERTECSUR:\n";
    foreach ($productos as $p) {
        $contexto .= "- {$p['nombre']} ({$p['tipo']}): {$p['descripcion']}. Precio: {$p['precio']}.\n";
    }

    // --- NUEVA CONFIGURACIÓN PARA OPENROUTER GRATIS ---
    // 1. Ve a openrouter.ai, regístrate y crea una Key en la sección "Keys"
    $apiKey = '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'; 
    
    $payload = [
        // Usamos el router gratuito para no gastar nada
        "model" => "openrouter/free", 
        "messages" => array_merge([
            ["role" => "system", "content" => "Eres el asistente técnico de SERTECSUR. Usa estos productos: " . $contexto]
        ], $messages),
        "temperature" => 0.7
    ];

    // 2. Cambiamos la URL de OpenAI por la de OpenRouter
    $ch = curl_init('https://openrouter.ai/api/v1/chat/completions'); 
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
        // OpenRouter agradece estos headers para saber qué app hace la consulta
        'HTTP-Referer: http://localhost', 
        'X-Title: Sertecsur Chat'
    ]);

    $result = curl_exec($ch);
    $data = json_decode($result, true);
    curl_close($ch);

    if (isset($data['choices'][0]['message']['content'])) {
        echo json_encode(['reply' => $data['choices'][0]['message']['content']]);
    } else {
        // Tip de debug: esto te dirá exactamente qué está respondiendo el servidor
        echo json_encode(['reply' => 'La IA no pudo procesar la respuesta.', 'debug' => $data]);
    }

} catch (Exception $e) {
    echo json_encode(['reply' => 'Error en el motor del chat.']);
}