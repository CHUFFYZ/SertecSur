<?php
/* DB.PHP v4 — SERTECSUR
   Cambios:
   - Cotizaciones admin (sin usuario cliente)
   - Limpiar carrito
   - Corrección datos cliente en mis-cotizaciones
   - Soporte img_url en Producto
*/
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
session_start();

define('DB_HOST','localhost');
define('DB_USER','root');
define('DB_PASS','');
define('DB_NAME','sistema');

function getDB(){
  static $p=null;
  if($p===null){
    try{
      $p=new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',DB_USER,DB_PASS,[
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC
      ]);
    }catch(PDOException $e){ jsonError('DB:'.$e->getMessage(),500); }
  }
  return $p;
}

function jsonOk($d=[])        { echo json_encode(['ok'=>true,'data'=>$d]); exit; }
function jsonError($m,$c=400) { http_response_code($c); echo json_encode(['ok'=>false,'error'=>$m]); exit; }
function requireAuth()  { if(empty($_SESSION['user'])) jsonError('No autenticado',401); }
function requireAdmin() { requireAuth(); if($_SESSION['user']['rol']!=='admin') jsonError('Sin permisos',403); }
function body()         { return json_decode(file_get_contents('php://input'),true)??[]; }

function fetchCaracts($pdo,$pid){
  $s=$pdo->prepare('SELECT nombre,valor FROM Caracteristicas WHERE producto_id=?');
  $s->execute([$pid]);
  return $s->fetchAll();
}

/* ── Asegura columna img_url en Producto ── */
function ensureColumns($pdo){
  static $done=false;
  if($done) return;
  $done=true;
  try {
    $pdo->exec("ALTER TABLE Producto ADD COLUMN IF NOT EXISTS img_url VARCHAR(500) DEFAULT NULL");
    $pdo->exec("ALTER TABLE Producto ADD COLUMN IF NOT EXISTS simulable TINYINT(1) DEFAULT 0");
    /* Tabla cotizaciones admin */
    $pdo->exec("ALTER TABLE Cotizacion ADD COLUMN IF NOT EXISTS notas TEXT DEFAULT NULL");
    $pdo->exec("ALTER TABLE Cotizacion ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'cliente'");
    $pdo->exec("ALTER TABLE Cotizacion ADD COLUMN IF NOT EXISTS admin_nombre VARCHAR(150) DEFAULT NULL");
    $pdo->exec("ALTER TABLE Cotizacion ADD COLUMN IF NOT EXISTS admin_correo VARCHAR(150) DEFAULT NULL");
    $pdo->exec("ALTER TABLE Cotizacion ADD COLUMN IF NOT EXISTS admin_telefono VARCHAR(50) DEFAULT NULL");
    $pdo->exec("ALTER TABLE Cotizacion ADD COLUMN IF NOT EXISTS destinatario VARCHAR(200) DEFAULT NULL");
    /* Tabla contacto */
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS Contacto_mensaje (
        id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        correo VARCHAR(100) NOT NULL,
        telefono VARCHAR(30),
        asunto VARCHAR(200),
        mensaje TEXT NOT NULL,
        leido TINYINT(1) DEFAULT 0,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    ");
  } catch(Exception $e){ /* ignora si ya existen */ }
}

$action=$_GET['action']??'';
$method=$_SERVER['REQUEST_METHOD'];
$pdo=getDB();
ensureColumns($pdo);

switch("$method:$action"){

/* ══════════════════════════════════
   AUTH
══════════════════════════════════ */
case 'POST:login':
  $b=body();
  $correo=trim($b['correo']??'');
  $pass=trim($b['contrasena']??'');
  if(!$correo||!$pass) jsonError('Correo y contraseña requeridos');
  $stmt=$pdo->prepare('SELECT u.*,e.id_empleado FROM Usuario u LEFT JOIN Empleado e ON e.usuario_id=u.id_usuario WHERE u.correo=?');
  $stmt->execute([$correo]);
  $user=$stmt->fetch();
  /*if(!$user||$user['contrasena']!==$pass) jsonError('Credenciales incorrectas');*/
  $esValido = password_verify($pass, $user['contrasena'])
            || $user['contrasena'] === $pass;
  if(!(int)($user['verificado'] ?? 1)) jsonError('Verifica tu cuenta primero.');
  /*------------------*/
  if(!$user || !$esValido) jsonError('Credenciales incorrectas');
  $rol=$user['id_empleado']?'admin':'cliente';
  $cid=null;
  if($rol==='cliente'){
    $cs=$pdo->prepare('SELECT id_cliente FROM Cliente WHERE usuario_id=?');
    $cs->execute([$user['id_usuario']]);
    $c=$cs->fetch();
    $cid=$c?$c['id_cliente']:null;
  }
  $_SESSION['user']=[
    'id'=>$user['id_usuario'],
    'nombre'=>$user['nombre'],
    'correo'=>$user['correo'],
    'telefono'=>$user['telefono']??'',
    'rol'=>$rol,
    'clienteId'=>$cid
  ];
  jsonOk(['rol'=>$rol,'nombre'=>$user['nombre']]);

case 'POST:logout':
  session_destroy();
  jsonOk();

case 'GET:me':
  if(empty($_SESSION['user'])) jsonOk(null);
  jsonOk($_SESSION['user']);

/* ══════════════════════════════════
   PRODUCTOS
══════════════════════════════════ */
case 'GET:productos':
  $rows=$pdo->query('SELECT * FROM Producto ORDER BY id_producto DESC')->fetchAll();
  foreach($rows as &$p){
    $p['caracteristicas']=fetchCaracts($pdo,$p['id_producto']);
    if(!empty($p['ficha_tecnica'])) $p['ficha_tecnica']=json_decode($p['ficha_tecnica'],true);
  }
  jsonOk($rows);

case 'POST:productos':
  requireAdmin(); $b=body();
  $pdo->prepare('INSERT INTO Producto (nombre,tipo,precio,stock,certificacion,descripcion,img_url,ficha_tecnica,simulable) VALUES (?,?,?,?,?,?,?,?,?)')->execute([
    $b['nombre']??'', $b['tipo']??'', $b['precio']??0, $b['stock']??0,
    $b['certificacion']??null, $b['descripcion']??'', $b['img_url']??'',
    isset($b['ficha_tecnica'])?json_encode($b['ficha_tecnica']):null,
    !empty($b['simulable'])?1:0
  ]);
  $pid=$pdo->lastInsertId();
  if(!empty($b['caracteristicas'])&&is_array($b['caracteristicas'])){
    $sc=$pdo->prepare('INSERT INTO Caracteristicas (producto_id,nombre,valor) VALUES (?,?,?)');
    foreach($b['caracteristicas'] as $c){ if(!empty($c['nombre'])) $sc->execute([$pid,$c['nombre'],$c['valor']??'']); }
  }
  jsonOk(['id'=>$pid]);

case 'PUT:productos':
  requireAdmin(); $b=body(); $id=(int)($b['id_producto']??0); if(!$id) jsonError('ID requerido');
  $pdo->prepare('UPDATE Producto SET nombre=?,tipo=?,precio=?,stock=?,certificacion=?,descripcion=?,img_url=?,ficha_tecnica=?,simulable=? WHERE id_producto=?')->execute([
    $b['nombre'],$b['tipo'],$b['precio'],$b['stock'],$b['certificacion']??null,
    $b['descripcion'],$b['img_url']??'',
    isset($b['ficha_tecnica'])?json_encode($b['ficha_tecnica']):null,
    !empty($b['simulable'])?1:0,$id
  ]);
  $pdo->prepare('DELETE FROM Caracteristicas WHERE producto_id=?')->execute([$id]);
  if(!empty($b['caracteristicas'])&&is_array($b['caracteristicas'])){
    $sc=$pdo->prepare('INSERT INTO Caracteristicas (producto_id,nombre,valor) VALUES (?,?,?)');
    foreach($b['caracteristicas'] as $c){ if(!empty($c['nombre'])) $sc->execute([$id,$c['nombre'],$c['valor']??'']); }
  }
  jsonOk();

case 'DELETE:productos':
  requireAdmin(); $id=(int)($_GET['id']??0); if(!$id) jsonError('ID requerido');
  $pdo->prepare('DELETE FROM Producto WHERE id_producto=?')->execute([$id]);
  jsonOk();

/* ══════════════════════════════════
   COTIZACIONES (admin)
══════════════════════════════════ */
case 'GET:cotizaciones':
  requireAdmin();
  $tipo=$_GET['tipo']??'';
  // Obtiene TODAS las cotizaciones (cliente + admin)
  $sql="SELECT cot.*,
    COALESCE(u.nombre, cot.admin_nombre, 'SERTECSUR') AS cliente_nombre,
    COALESCE(u.correo, cot.admin_correo, 'ventas@sertecsur.net') AS cliente_correo,
    COALESCE(u.telefono, cot.admin_telefono, '938 153 2506') AS cliente_telefono,
    COALESCE(cot.tipo,'cliente') AS tipo_cot
  FROM Cotizacion cot
  LEFT JOIN Cliente cli ON cli.id_cliente=cot.cliente_id
  LEFT JOIN Usuario u ON u.id_usuario=cli.usuario_id
  ORDER BY cot.fecha DESC";
  $rows=$pdo->query($sql)->fetchAll();
  // Filtro tipo
  if($tipo==='admin')   $rows=array_values(array_filter($rows,fn($r)=>($r['tipo_cot']??'cliente')==='admin'));
  if($tipo==='cliente') $rows=array_values(array_filter($rows,fn($r)=>($r['tipo_cot']??'cliente')==='cliente'));
  foreach($rows as &$r){
    $ds=$pdo->prepare('SELECT dc.*,p.nombre AS producto_nombre,p.img_url FROM Detalle_cotizacion dc JOIN Producto p ON p.id_producto=dc.producto_id WHERE dc.cotizacion_id=?');
    $ds->execute([$r['id_cotizacion']]);
    $r['detalle']=$ds->fetchAll();
  }
  jsonOk($rows);

case 'PUT:cotizaciones':
  requireAdmin(); $b=body(); $id=(int)($b['id_cotizacion']??0); if(!$id) jsonError('ID requerido');
  $pdo->prepare('UPDATE Cotizacion SET estado=? WHERE id_cotizacion=?')->execute([$b['estado'],$id]);
  jsonOk();

/* Cotización generada por el admin (sin cliente) */
case 'POST:cotizaciones-admin':
  requireAdmin(); $b=body();
  $items=$b['items']??[];
  if(empty($items)) jsonError('Sin productos');
  $subtotal=0;
  foreach($items as $it){
    $pr=$pdo->prepare('SELECT precio FROM Producto WHERE id_producto=?');
    $pr->execute([$it['producto_id']]);
    $prod=$pr->fetch();
    if($prod) $subtotal+=$prod['precio']*($it['cantidad']??1);
  }
  $pdo->prepare('INSERT INTO Cotizacion (cliente_id,estado,subtotal,total,notas,tipo,admin_nombre,admin_correo,admin_telefono,destinatario) VALUES (NULL,?,?,?,?,?,?,?,?,?)')->execute([
    'pendiente',$subtotal,$subtotal,
    $b['notas']??'Cotización generada por administrador',
    'admin',
    'SERTECSUR',
    'ventas@sertecsur.net',
    '938 153 2506',
    $b['destinatario']??''
  ]);
  $cotId=$pdo->lastInsertId();
  $si=$pdo->prepare('INSERT INTO Detalle_cotizacion (cotizacion_id,producto_id,cantidad,precio_unitario) VALUES (?,?,?,?)');
  foreach($items as $it){
    $pr=$pdo->prepare('SELECT precio FROM Producto WHERE id_producto=?');
    $pr->execute([$it['producto_id']]);
    $prod=$pr->fetch();
    if($prod) $si->execute([$cotId,$it['producto_id'],$it['cantidad']??1,$prod['precio']]);
  }
  // Devolver cotización completa
  $cot=$pdo->prepare("SELECT cot.*,'SERTECSUR' AS cliente_nombre,'ventas@sertecsur.net' AS cliente_correo,'938 153 2506' AS cliente_telefono FROM Cotizacion cot WHERE cot.id_cotizacion=?");
  $cot->execute([$cotId]);
  $cotData=$cot->fetch();
  $ds=$pdo->prepare('SELECT dc.*,p.nombre AS producto_nombre,p.img_url FROM Detalle_cotizacion dc JOIN Producto p ON p.id_producto=dc.producto_id WHERE dc.cotizacion_id=?');
  $ds->execute([$cotId]);
  $cotData['detalle']=$ds->fetchAll();
  jsonOk($cotData);

/* ══════════════════════════════════
   MIS COTIZACIONES (cliente)
══════════════════════════════════ */
case 'GET:mis-cotizaciones':
  requireAuth();
  $cid=$_SESSION['user']['clienteId']??null;
  if(!$cid) jsonError('Sin cliente',400);
  $rows=$pdo->prepare('SELECT cot.* FROM Cotizacion cot WHERE cot.cliente_id=? ORDER BY fecha DESC');
  $rows->execute([$cid]);
  $cots=$rows->fetchAll();
  // Datos del cliente
  $uData=$pdo->prepare('SELECT u.nombre,u.correo,u.telefono FROM Usuario u JOIN Cliente c ON c.usuario_id=u.id_usuario WHERE c.id_cliente=?');
  $uData->execute([$cid]);
  $uInfo=$uData->fetch();
  foreach($cots as &$c){
    $c['cliente_nombre']=$uInfo['nombre']??'';
    $c['cliente_correo']=$uInfo['correo']??'';
    $c['cliente_telefono']=$uInfo['telefono']??'';
    $ds=$pdo->prepare('SELECT dc.*,p.nombre AS producto_nombre,p.img_url FROM Detalle_cotizacion dc JOIN Producto p ON p.id_producto=dc.producto_id WHERE dc.cotizacion_id=?');
    $ds->execute([$c['id_cotizacion']]);
    $c['detalle']=$ds->fetchAll();
  }
  jsonOk($cots);

/* ══════════════════════════════════
   COTIZAR AHORA (cliente)
══════════════════════════════════ */
case 'POST:cotizar':
  requireAuth();
  if($_SESSION['user']['rol']!=='cliente') jsonError('Solo clientes');
  $b=body();
  $cid=$_SESSION['user']['clienteId'];
  if(!$cid) jsonError('Sin cliente');
  $items=$b['items']??[];
  if(empty($items)) jsonError('Sin productos');
  $subtotal=0;
  foreach($items as $it){
    $pr=$pdo->prepare('SELECT precio FROM Producto WHERE id_producto=?');
    $pr->execute([$it['producto_id']]);
    $prod=$pr->fetch();
    if($prod) $subtotal+=$prod['precio']*($it['cantidad']??1);
  }
  $pdo->prepare('INSERT INTO Cotizacion (cliente_id,estado,subtotal,total,notas,tipo) VALUES (?,?,?,?,?,?)')->execute([
    $cid,'pendiente',$subtotal,$subtotal,$b['notas']??null,'cliente'
  ]);
  $cotId=$pdo->lastInsertId();
  $si=$pdo->prepare('INSERT INTO Detalle_cotizacion (cotizacion_id,producto_id,cantidad,precio_unitario) VALUES (?,?,?,?)');
  foreach($items as $it){
    $pr=$pdo->prepare('SELECT precio FROM Producto WHERE id_producto=?');
    $pr->execute([$it['producto_id']]);
    $prod=$pr->fetch();
    if($prod) $si->execute([$cotId,$it['producto_id'],$it['cantidad']??1,$prod['precio']]);
  }
  // Datos completos del cliente
  $uData=$pdo->prepare('SELECT u.nombre,u.correo,u.telefono FROM Usuario u JOIN Cliente c ON c.usuario_id=u.id_usuario WHERE c.id_cliente=?');
  $uData->execute([$cid]);
  $uInfo=$uData->fetch();
  $cotData=[
    'id_cotizacion'=>$cotId,
    'fecha'=>date('Y-m-d H:i:s'),
    'estado'=>'pendiente',
    'subtotal'=>$subtotal,
    'total'=>$subtotal,
    'cliente_nombre'=>$uInfo['nombre']??'',
    'cliente_correo'=>$uInfo['correo']??'',
    'cliente_telefono'=>$uInfo['telefono']??'',
  ];
  $ds=$pdo->prepare('SELECT dc.*,p.nombre AS producto_nombre,p.img_url FROM Detalle_cotizacion dc JOIN Producto p ON p.id_producto=dc.producto_id WHERE dc.cotizacion_id=?');
  $ds->execute([$cotId]);
  $cotData['detalle']=$ds->fetchAll();
  jsonOk($cotData);

/* ══════════════════════════════════
   USUARIOS
══════════════════════════════════ */
case 'GET:usuarios':
  requireAdmin();
  $rows=$pdo->query('SELECT u.id_usuario,u.nombre,u.correo,u.telefono,u.direccion,u.fecha_registro,IF(e.id_empleado IS NOT NULL,"admin","cliente") AS rol FROM Usuario u LEFT JOIN Empleado e ON e.usuario_id=u.id_usuario ORDER BY u.id_usuario DESC')->fetchAll();
  jsonOk($rows);

case 'POST:usuarios':
  requireAdmin(); $b=body();
  $ck=$pdo->prepare('SELECT id_usuario FROM Usuario WHERE correo=?');
  $ck->execute([$b['correo']]);
  if($ck->fetch()) jsonError('El correo ya existe');
  $pdo->prepare('INSERT INTO Usuario (nombre,direccion,telefono,correo,contrasena) VALUES (?,?,?,?,?)')->execute([
    $b['nombre'],$b['direccion']??'',$b['telefono']??'',$b['correo'],$b['contrasena']
  ]);
  $uid=$pdo->lastInsertId();
  if(($b['rol']??'cliente')==='admin'){
    $pdo->prepare('INSERT INTO Empleado (usuario_id,permisos) VALUES (?,?)')->execute([$uid,json_encode(['rol'=>'admin','nivel'=>1])]);
  } else {
    $pdo->prepare('INSERT INTO Cliente (usuario_id) VALUES (?)')->execute([$uid]);
  }
  jsonOk(['id'=>$uid]);

case 'PUT:usuarios':
  requireAdmin(); $b=body(); $id=(int)($b['id_usuario']??0); if(!$id) jsonError('ID requerido');
  $fields=[];$vals=[];
  if(!empty($b['nombre']))    { $fields[]='nombre=?';    $vals[]=$b['nombre']; }
  if(!empty($b['correo']))    { $fields[]='correo=?';    $vals[]=$b['correo']; }
  if(isset($b['telefono']))   { $fields[]='telefono=?';  $vals[]=$b['telefono']; }
  if(isset($b['direccion']))  { $fields[]='direccion=?'; $vals[]=$b['direccion']; }
  if(!empty($b['contrasena'])){ $fields[]='contrasena=?';$vals[]=$b['contrasena']; }
  if($fields){ $vals[]=$id; $pdo->prepare('UPDATE Usuario SET '.implode(',',$fields).' WHERE id_usuario=?')->execute($vals); }
  jsonOk();

case 'DELETE:usuarios':
  requireAdmin(); $id=(int)($_GET['id']??0); if(!$id) jsonError('ID requerido');
  $pdo->prepare('DELETE FROM Usuario WHERE id_usuario=?')->execute([$id]);
  jsonOk();

/* ══════════════════════════════════
   CARRITO
══════════════════════════════════ */
case 'GET:carrito':
  requireAuth();
  if($_SESSION['user']['rol']!=='cliente') jsonOk([]);
  $cid=$_SESSION['user']['clienteId'];
  $c=$pdo->prepare('SELECT id_carrito FROM Carrito WHERE cliente_id=?');
  $c->execute([$cid]);
  $cart=$c->fetch();
  if(!$cart){ $pdo->prepare('INSERT INTO Carrito (cliente_id) VALUES (?)')->execute([$cid]); $cartId=$pdo->lastInsertId(); }
  else $cartId=$cart['id_carrito'];
  $items=$pdo->prepare('SELECT ci.*,p.nombre,p.precio,p.descripcion,p.img_url FROM Carrito_item ci JOIN Producto p ON p.id_producto=ci.producto_id WHERE ci.carrito_id=?');
  $items->execute([$cartId]);
  jsonOk(['cartId'=>$cartId,'items'=>$items->fetchAll()]);

case 'POST:carrito':
  requireAuth();
  $b=body();
  $cid=$_SESSION['user']['clienteId'];
  $pid=(int)($b['producto_id']??0);
  $cant=(int)($b['cantidad']??1);
  if(!$cid||!$pid) jsonError('Datos incompletos');
  $c=$pdo->prepare('SELECT id_carrito FROM Carrito WHERE cliente_id=?');
  $c->execute([$cid]);
  $cart=$c->fetch();
  if(!$cart){ $pdo->prepare('INSERT INTO Carrito (cliente_id) VALUES (?)')->execute([$cid]); $cartId=$pdo->lastInsertId(); }
  else $cartId=$cart['id_carrito'];
  $ex=$pdo->prepare('SELECT id_item FROM Carrito_item WHERE carrito_id=? AND producto_id=?');
  $ex->execute([$cartId,$pid]);
  if($ex->fetch()) $pdo->prepare('UPDATE Carrito_item SET cantidad=cantidad+? WHERE carrito_id=? AND producto_id=?')->execute([$cant,$cartId,$pid]);
  else $pdo->prepare('INSERT INTO Carrito_item (carrito_id,producto_id,cantidad) VALUES (?,?,?)')->execute([$cartId,$pid,$cant]);
  jsonOk();

case 'DELETE:carrito':
  requireAuth();
  $id=(int)($_GET['id']??0);
  // Limpiar TODO el carrito
  if($_GET['all']??'' === '1'){
    $cid=$_SESSION['user']['clienteId'];
    $c=$pdo->prepare('SELECT id_carrito FROM Carrito WHERE cliente_id=?');
    $c->execute([$cid]);
    $cart=$c->fetch();
    if($cart) $pdo->prepare('DELETE FROM Carrito_item WHERE carrito_id=?')->execute([$cart['id_carrito']]);
    jsonOk();
  }
  if(!$id) jsonError('ID requerido');
  $pdo->prepare('DELETE FROM Carrito_item WHERE id_item=?')->execute([$id]);
  jsonOk();

/* ══════════════════════════════════
   RESEÑAS
══════════════════════════════════ */
case 'GET:resenas':
  $pid=(int)($_GET['producto_id']??0);
  $s=$pdo->prepare('SELECT r.*,u.nombre FROM Resena r JOIN Cliente c ON c.id_cliente=r.cliente_id JOIN Usuario u ON u.id_usuario=c.usuario_id WHERE r.producto_id=? ORDER BY r.fecha DESC');
  $s->execute([$pid]);
  jsonOk($s->fetchAll());

case 'POST:resenas':
  requireAuth();
  if($_SESSION['user']['rol']!=='cliente') jsonError('Solo clientes');
  $b=body();
  $cid=$_SESSION['user']['clienteId'];
  $ck=$pdo->prepare('SELECT COUNT(*) FROM Cotizacion cot JOIN Detalle_cotizacion dc ON dc.cotizacion_id=cot.id_cotizacion WHERE cot.cliente_id=? AND dc.producto_id=? AND cot.estado="aprobada"');
  $ck->execute([$cid,$b['producto_id']]);
  if(!$ck->fetchColumn()) jsonError('Solo puedes reseñar productos de cotizaciones aprobadas');
  $pdo->prepare('INSERT INTO Resena (cliente_id,producto_id,comentario,calificacion) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE comentario=VALUES(comentario),calificacion=VALUES(calificacion)')->execute([
    $cid,$b['producto_id'],$b['comentario'],$b['calificacion']
  ]);
  jsonOk();

/* ══════════════════════════════════
   BUZÓN DE CONTACTO
══════════════════════════════════ */
case 'GET:buzon':
  requireAdmin();
  $rows=$pdo->query('SELECT * FROM Contacto_mensaje ORDER BY leido ASC, fecha DESC')->fetchAll();
  $nl=(int)$pdo->query('SELECT COUNT(*) FROM Contacto_mensaje WHERE leido=0')->fetchColumn();
  jsonOk(['mensajes'=>$rows,'no_leidos'=>$nl]);

case 'POST:buzon':
  $b=body();
  $nombre=trim($b['nombre']??'');
  $correo=trim($b['correo']??'');
  $mensaje=trim($b['mensaje']??'');
  if(!$nombre||!$correo||!$mensaje) jsonError('Nombre, correo y mensaje son requeridos');
  $pdo->prepare('INSERT INTO Contacto_mensaje (nombre,correo,telefono,asunto,mensaje) VALUES (?,?,?,?,?)')->execute([
    $nombre,$correo,$b['telefono']??null,$b['asunto']??null,$mensaje
  ]);
  jsonOk(['id'=>$pdo->lastInsertId()]);

case 'PUT:buzon':
  requireAdmin(); $b=body(); $id=(int)($b['id_mensaje']??0); if(!$id) jsonError('ID requerido');
  $pdo->prepare('UPDATE Contacto_mensaje SET leido=1 WHERE id_mensaje=?')->execute([$id]);
  jsonOk();

case 'DELETE:buzon':
  requireAdmin(); $id=(int)($_GET['id']??0); if(!$id) jsonError('ID requerido');
  $pdo->prepare('DELETE FROM Contacto_mensaje WHERE id_mensaje=?')->execute([$id]);
  jsonOk();

/* ══════════════════════════════════
   ESTADÍSTICAS
══════════════════════════════════ */
case 'GET:stats':
  requireAdmin();
  $nl=0;
  try{ $nl=(int)$pdo->query('SELECT COUNT(*) FROM Contacto_mensaje WHERE leido=0')->fetchColumn(); }catch(Exception $e){}
  jsonOk([
    'total_productos'   =>$pdo->query('SELECT COUNT(*) FROM Producto')->fetchColumn(),
    'total_clientes'    =>$pdo->query('SELECT COUNT(*) FROM Cliente')->fetchColumn(),
    'total_cotizaciones'=>$pdo->query('SELECT COUNT(*) FROM Cotizacion')->fetchColumn(),
    'pendientes'        =>$pdo->query("SELECT COUNT(*) FROM Cotizacion WHERE estado='pendiente'")->fetchColumn(),
    'aprobadas'         =>$pdo->query("SELECT COUNT(*) FROM Cotizacion WHERE estado='aprobada'")->fetchColumn(),
    'total_usuarios'    =>$pdo->query('SELECT COUNT(*) FROM Usuario')->fetchColumn(),
    'buzon_no_leidos'   =>$nl,
  ]);

default:
  jsonError("Acción no reconocida: $action",404);
}
