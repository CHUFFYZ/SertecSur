-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         8.0.30 - MySQL Community Server - GPL
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para sistema
CREATE DATABASE IF NOT EXISTS `sistema` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sistema`;

-- Volcando estructura para tabla sistema.caracteristicas
CREATE TABLE IF NOT EXISTS `caracteristicas` (
  `id_caracteristica` int NOT NULL AUTO_INCREMENT,
  `producto_id` int DEFAULT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_caracteristica`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `caracteristicas_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id_producto`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.caracteristicas: ~19 rows (aproximadamente)
INSERT INTO `caracteristicas` (`id_caracteristica`, `producto_id`, `nombre`, `valor`) VALUES
	(1, 1, 'Resolución', '800 TVL'),
	(2, 1, 'Visión nocturna', '40 m'),
	(3, 1, 'Lente', '6 mm fijo'),
	(4, 2, 'Resolución', '720p HD'),
	(5, 2, 'IR', 'Smart IR 15 m'),
	(6, 2, 'Lente', '3.6 mm'),
	(7, 3, 'LEDs IR', '36'),
	(8, 3, 'Alcance IR', '30 m'),
	(9, 3, 'Lente', 'Varifocal 2.8–12 mm'),
	(10, 4, 'Canales', '16'),
	(11, 4, 'Compresión', 'H.265+'),
	(12, 4, 'HDD', 'Hasta 2 discos'),
	(13, 6, 'Alcance', '12 m'),
	(14, 6, 'Ángulo', '120°'),
	(15, 6, 'Frecuencia', '433 MHz'),
	(16, 7, 'Frecuencia', '433 MHz'),
	(17, 7, 'Alimentación', 'Batería + Solar'),
	(18, 8, 'Acceso', 'App / Huella / Teclado'),
	(19, 8, 'Conectividad', 'Wi-Fi 2.4 GHz');

-- Volcando estructura para tabla sistema.carrito
CREATE TABLE IF NOT EXISTS `carrito` (
  `id_carrito` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int DEFAULT NULL,
  PRIMARY KEY (`id_carrito`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `carrito_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id_cliente`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.carrito: ~2 rows (aproximadamente)
INSERT INTO `carrito` (`id_carrito`, `cliente_id`) VALUES
	(1, 1),
	(2, 2);

-- Volcando estructura para tabla sistema.carrito_item
CREATE TABLE IF NOT EXISTS `carrito_item` (
  `id_item` int NOT NULL AUTO_INCREMENT,
  `carrito_id` int DEFAULT NULL,
  `producto_id` int DEFAULT NULL,
  `cantidad` int DEFAULT '1',
  PRIMARY KEY (`id_item`),
  KEY `carrito_id` (`carrito_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `carrito_item_ibfk_1` FOREIGN KEY (`carrito_id`) REFERENCES `carrito` (`id_carrito`) ON DELETE CASCADE,
  CONSTRAINT `carrito_item_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.carrito_item: ~6 rows (aproximadamente)
INSERT INTO `carrito_item` (`id_item`, `carrito_id`, `producto_id`, `cantidad`) VALUES
	(1, 1, 1, 2),
	(2, 1, 6, 1),
	(3, 2, 3, 1),
	(4, 2, 5, 1),
	(5, 1, 4, 1),
	(6, 1, 7, 1);

-- Volcando estructura para tabla sistema.chatbot_accion
CREATE TABLE IF NOT EXISTS `chatbot_accion` (
  `id_accion` int NOT NULL AUTO_INCREMENT,
  `sesion_id` int DEFAULT NULL,
  `tipo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referencia_id` int DEFAULT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_accion`),
  KEY `sesion_id` (`sesion_id`),
  CONSTRAINT `chatbot_accion_ibfk_1` FOREIGN KEY (`sesion_id`) REFERENCES `chatbot_sesion` (`id_sesion`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.chatbot_accion: ~3 rows (aproximadamente)
INSERT INTO `chatbot_accion` (`id_accion`, `sesion_id`, `tipo`, `referencia_id`, `fecha`) VALUES
	(1, 1, 'recomendacion', 1, '2026-05-18 20:08:09'),
	(2, 1, 'cotizacion', 1, '2026-05-18 20:08:09'),
	(3, 2, 'recomendacion', 7, '2026-05-18 20:08:09');

-- Volcando estructura para tabla sistema.chatbot_mensaje
CREATE TABLE IF NOT EXISTS `chatbot_mensaje` (
  `id_mensaje` int NOT NULL AUTO_INCREMENT,
  `sesion_id` int DEFAULT NULL,
  `emisor` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mensaje` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_mensaje`),
  KEY `sesion_id` (`sesion_id`),
  CONSTRAINT `chatbot_mensaje_ibfk_1` FOREIGN KEY (`sesion_id`) REFERENCES `chatbot_sesion` (`id_sesion`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.chatbot_mensaje: ~5 rows (aproximadamente)
INSERT INTO `chatbot_mensaje` (`id_mensaje`, `sesion_id`, `emisor`, `mensaje`, `fecha`) VALUES
	(1, 1, 'usuario', 'Hola, quiero una cámara de seguridad para exteriores', '2026-05-18 20:08:09'),
	(2, 1, 'bot', 'Te recomiendo la Cámara Bullet 800 TVL con certificación IP66', '2026-05-18 20:08:09'),
	(3, 1, 'usuario', 'Hazme una cotización', '2026-05-18 20:08:09'),
	(4, 2, 'usuario', 'Busco una alarma sonora para mi negocio', '2026-05-18 20:08:09'),
	(5, 2, 'bot', 'Te recomiendo la Sirena Inalámbrica Exterior', '2026-05-18 20:08:09');

-- Volcando estructura para tabla sistema.chatbot_sesion
CREATE TABLE IF NOT EXISTS `chatbot_sesion` (
  `id_sesion` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int DEFAULT NULL,
  `contexto` json DEFAULT NULL,
  `fecha_inicio` datetime DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_sesion`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `chatbot_sesion_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id_cliente`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.chatbot_sesion: ~2 rows (aproximadamente)
INSERT INTO `chatbot_sesion` (`id_sesion`, `cliente_id`, `contexto`, `fecha_inicio`, `estado`) VALUES
	(1, 1, NULL, '2026-05-18 20:08:09', 'activa'),
	(2, 2, NULL, '2026-05-18 20:08:09', 'activa');

-- Volcando estructura para tabla sistema.cliente
CREATE TABLE IF NOT EXISTS `cliente` (
  `id_cliente` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `cliente_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.cliente: ~4 rows (aproximadamente)
INSERT INTO `cliente` (`id_cliente`, `usuario_id`) VALUES
	(1, 1),
	(2, 2),
	(3, 3),
	(4, 4);

-- Volcando estructura para tabla sistema.contacto_mensaje
CREATE TABLE IF NOT EXISTS `contacto_mensaje` (
  `id_mensaje` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asunto` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mensaje` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `leido` tinyint(1) DEFAULT '0',
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_mensaje`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.contacto_mensaje: ~2 rows (aproximadamente)
INSERT INTO `contacto_mensaje` (`id_mensaje`, `nombre`, `correo`, `telefono`, `asunto`, `mensaje`, `leido`, `fecha`) VALUES
	(1, 'Pedro Sánchez', 'pedro@empresa.com', '9385555555', 'Cotización de producto', 'Buenos días, quisiera recibir una cotización para instalar cámaras en nuestra bodega de 500 m². Favor de contactarme.', 1, '2026-05-18 20:08:09'),
	(2, 'Laura Gómez', 'laura@correo.com', NULL, 'Soporte técnico', 'Tengo un DVR que no graba correctamente desde hace dos días, necesito asistencia técnica urgente.', 1, '2026-05-18 20:08:09');

-- Volcando estructura para tabla sistema.cotizacion
CREATE TABLE IF NOT EXISTS `cotizacion` (
  `id_cotizacion` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int DEFAULT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `subtotal` decimal(10,2) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tipo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'cliente',
  `admin_nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_correo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_telefono` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `destinatario` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_cotizacion`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `cotizacion_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id_cliente`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.cotizacion: ~6 rows (aproximadamente)
INSERT INTO `cotizacion` (`id_cotizacion`, `cliente_id`, `fecha`, `estado`, `subtotal`, `total`, `notas`, `tipo`, `admin_nombre`, `admin_correo`, `admin_telefono`, `destinatario`) VALUES
	(1, 1, '2026-05-18 20:08:09', 'pendiente', 3800.00, 3800.00, NULL, 'cliente', NULL, NULL, NULL, NULL),
	(2, 2, '2026-05-18 20:08:09', 'aprobada', 4700.00, 4700.00, NULL, 'cliente', NULL, NULL, NULL, NULL),
	(3, NULL, '2026-05-18 20:08:09', 'pendiente', 5300.00, 5300.00, 'Cotización generada desde el panel de administración', 'admin', 'SERTECSUR', 'ventas@sertecsur.net', '938 153 2506', 'Empresa Ejemplo S.A. de C.V.'),
	(4, NULL, '2026-05-18 20:10:53', 'pendiente', 12450.00, 12450.00, 'Ir a peru', 'admin', 'SERTECSUR', 'ventas@sertecsur.net', '938 153 2506', 'GEKO'),
	(5, 1, '2026-05-20 23:02:40', 'pendiente', 3800.00, 3800.00, 'Cotización desde sitio web', 'cliente', NULL, NULL, NULL, NULL),
	(6, 1, '2026-05-20 23:03:38', 'pendiente', 950.00, 950.00, 'Cotización desde sitio web', 'cliente', NULL, NULL, NULL, NULL),
	(7, 1, '2026-05-25 23:48:31', 'pendiente', 8250.00, 8250.00, 'Cotización desde sitio web', 'cliente', NULL, NULL, NULL, NULL);

-- Volcando estructura para tabla sistema.detalle_cotizacion
CREATE TABLE IF NOT EXISTS `detalle_cotizacion` (
  `id_detalle` int NOT NULL AUTO_INCREMENT,
  `cotizacion_id` int DEFAULT NULL,
  `producto_id` int DEFAULT NULL,
  `cantidad` int DEFAULT NULL,
  `precio_unitario` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `cotizacion_id` (`cotizacion_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `detalle_cotizacion_ibfk_1` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizacion` (`id_cotizacion`) ON DELETE CASCADE,
  CONSTRAINT `detalle_cotizacion_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.detalle_cotizacion: ~17 rows (aproximadamente)
INSERT INTO `detalle_cotizacion` (`id_detalle`, `cotizacion_id`, `producto_id`, `cantidad`, `precio_unitario`) VALUES
	(1, 1, 1, 2, 1500.00),
	(2, 1, 6, 1, 800.00),
	(3, 2, 3, 1, 2200.00),
	(4, 2, 5, 1, 6500.00),
	(5, 3, 1, 1, 1500.00),
	(6, 3, 3, 1, 2200.00),
	(7, 3, 7, 1, 950.00),
	(8, 3, 6, 2, 800.00),
	(9, 4, 1, 3, 1500.00),
	(10, 4, 4, 2, 3500.00),
	(11, 4, 7, 1, 950.00),
	(12, 5, 1, 2, 1500.00),
	(13, 5, 6, 1, 800.00),
	(14, 6, 7, 1, 950.00),
	(15, 7, 1, 2, 1500.00),
	(16, 7, 6, 1, 800.00),
	(17, 7, 4, 1, 3500.00),
	(18, 7, 7, 1, 950.00);

-- Volcando estructura para tabla sistema.empleado
CREATE TABLE IF NOT EXISTS `empleado` (
  `id_empleado` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `permisos` json DEFAULT NULL,
  PRIMARY KEY (`id_empleado`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `empleado_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.empleado: ~0 rows (aproximadamente)
INSERT INTO `empleado` (`id_empleado`, `usuario_id`, `permisos`) VALUES
	(1, 5, '{"rol": "admin", "nivel": 1}');

-- Volcando estructura para tabla sistema.producto
CREATE TABLE IF NOT EXISTS `producto` (
  `id_producto` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int DEFAULT '0',
  `certificacion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `img_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ficha_tecnica` json DEFAULT NULL,
  `simulable` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.producto: ~8 rows (aproximadamente)
INSERT INTO `producto` (`id_producto`, `nombre`, `tipo`, `precio`, `stock`, `certificacion`, `descripcion`, `img_url`, `ficha_tecnica`, `simulable`) VALUES
	(1, 'Cámara Bullet 800 TVL', 'Cámaras Bullet', 1500.00, 10, 'IP66', 'Cámara de vigilancia bullet 800TVL con visión nocturna 40m.', 'https://sertecsur.net/tienda/img/p/8/3/83-home_default.jpg', NULL, 1),
	(2, 'Cámara Bullet 720p DAHUA', 'Cámaras Bullet', 1800.00, 8, 'IP66', 'Cámara bullet 720p con Smart IR 15m, lente 3.6mm.', 'https://sertecsur.net/tienda/img/p/5/8/58-home_default.jpg', NULL, 1),
	(3, 'Cámara Domo Antivandalismo', 'Cámaras Domo', 2200.00, 6, 'IK10/IP66', 'Cámara domo con 36 LEDs IR, alcance 30m, varifocal 2.8–12mm.', 'https://sertecsur.net/tienda/img/p/1/1/1/111-home_default.jpg', NULL, 1),
	(4, 'DVR 16 Canales TurboHD', 'DVR / NVR', 3500.00, 4, NULL, 'DVR 16 canales TurboHD con P2P EZVIZ y soporte para 2 HDD.', 'https://sertecsur.net/tienda/img/p/1/5/7/157-home_default.jpg', NULL, 0),
	(5, 'Kit Seguridad CCTV 4 cámaras', 'CCTV Kits', 6500.00, 5, NULL, 'Kit completo: 4 cámaras bullet + DVR 4ch + fuente + cable.', '', NULL, 0),
	(6, 'Sensor de Movimiento PIR', 'Detectores / Sensores', 800.00, 20, NULL, 'Detector PIR inalámbrico, alcance 12m, ángulo 120°.', '', NULL, 1),
	(7, 'Sirena Inalámbrica Exterior', 'Sirenas y Estrobos', 950.00, 15, NULL, 'Sirena con estrobo para exteriores, 433 MHz.', 'https://sertecsur.net/tienda/img/p/5/9/3/593-home_default.jpg', NULL, 1),
	(8, 'Cerradura Inteligente Wi-Fi', 'Control de Acceso', 2500.00, 7, NULL, 'Control de acceso por app, huella y teclado.', '', NULL, 0);

-- Volcando estructura para tabla sistema.resena
CREATE TABLE IF NOT EXISTS `resena` (
  `id_resena` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int DEFAULT NULL,
  `producto_id` int DEFAULT NULL,
  `comentario` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `calificacion` decimal(2,1) DEFAULT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_resena`),
  UNIQUE KEY `cliente_id` (`cliente_id`,`producto_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `resena_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id_cliente`) ON DELETE CASCADE,
  CONSTRAINT `resena_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id_producto`) ON DELETE CASCADE,
  CONSTRAINT `resena_chk_1` CHECK (((`calificacion` >= 0) and (`calificacion` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.resena: ~2 rows (aproximadamente)
INSERT INTO `resena` (`id_resena`, `cliente_id`, `producto_id`, `comentario`, `calificacion`, `fecha`) VALUES
	(1, 2, 3, 'Excelente cámara, imagen muy nítida de noche.', 5.0, '2026-05-18 20:08:09'),
	(2, 2, 5, 'Kit completo, instalación fácil y soporte muy bueno.', 4.5, '2026-05-18 20:08:09');

-- Volcando estructura para tabla sistema.simulador_item
CREATE TABLE IF NOT EXISTS `simulador_item` (
  `id_item` int NOT NULL AUTO_INCREMENT,
  `sesion_id` int DEFAULT NULL,
  `producto_id` int DEFAULT NULL,
  `pos_x` decimal(10,2) DEFAULT NULL,
  `pos_y` decimal(10,2) DEFAULT NULL,
  `rotacion` int DEFAULT NULL,
  `escala` int DEFAULT NULL,
  `activo` tinyint(1) DEFAULT NULL,
  `alcance` decimal(10,2) DEFAULT NULL,
  `distancia_objeto` decimal(10,2) DEFAULT NULL,
  `angulo_vision` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id_item`),
  KEY `sesion_id` (`sesion_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `simulador_item_ibfk_1` FOREIGN KEY (`sesion_id`) REFERENCES `simulador_sesion` (`id_sesion`) ON DELETE CASCADE,
  CONSTRAINT `simulador_item_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.simulador_item: ~3 rows (aproximadamente)
INSERT INTO `simulador_item` (`id_item`, `sesion_id`, `producto_id`, `pos_x`, `pos_y`, `rotacion`, `escala`, `activo`, `alcance`, `distancia_objeto`, `angulo_vision`) VALUES
	(1, 1, 1, 15.00, 20.00, 0, 100, 1, 70.00, 0.00, 90.00),
	(2, 1, 6, 40.00, 50.00, 90, 100, 1, 50.00, 0.00, 120.00),
	(3, 2, 3, 25.00, 30.00, 45, 100, 1, 80.00, 0.00, 110.00);

-- Volcando estructura para tabla sistema.simulador_sesion
CREATE TABLE IF NOT EXISTS `simulador_sesion` (
  `id_sesion` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int DEFAULT NULL,
  `config_entorno` json DEFAULT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_sesion`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `simulador_sesion_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id_cliente`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.simulador_sesion: ~2 rows (aproximadamente)
INSERT INTO `simulador_sesion` (`id_sesion`, `cliente_id`, `config_entorno`, `fecha`, `estado`) VALUES
	(1, 1, NULL, '2026-05-18 20:08:09', 'activo'),
	(2, 2, NULL, '2026-05-18 20:08:09', 'activo');

-- Volcando estructura para tabla sistema.usuario
CREATE TABLE IF NOT EXISTS `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contrasena` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla sistema.usuario: ~5 rows (aproximadamente)
INSERT INTO `usuario` (`id_usuario`, `nombre`, `direccion`, `telefono`, `correo`, `contrasena`, `fecha_registro`) VALUES
	(1, 'Juan Perez', 'Calle 1 #10, Col. Centro', '9381111111', 'juan@mail.com', '1234', '2026-05-18 20:08:09'),
	(2, 'Maria Lopez', 'Calle 2 #20, Col. Centro', '9382222222', 'maria@mail.com', '1234', '2026-05-18 20:08:09'),
	(3, 'Carlos Ruiz', 'Calle 3 #30, Col. Obrera', '9383333333', 'carlos@mail.com', '1234', '2026-05-18 20:08:09'),
	(4, 'Ana Torres', 'Calle 4 #40, Col. Obrera', '9384444444', 'ana@mail.com', '1234', '2026-05-18 20:08:09'),
	(5, 'Admin SERTECSUR', 'Calle 55 #50, Col. Electricistas', '9381532506', 'admin@mail.com', 'admin', '2026-05-18 20:08:09');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
