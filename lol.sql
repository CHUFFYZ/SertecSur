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


-- Volcando estructura de base de datos para sis_comisiones
CREATE DATABASE IF NOT EXISTS `sis_comisiones` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sis_comisiones`;

-- Volcando estructura para tabla sis_comisiones.comisiones
CREATE TABLE IF NOT EXISTS `comisiones` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `folio` varchar(40) NOT NULL COMMENT 'FCI-COM-YYYY-SEM-NNN',
  `tipo_id` int unsigned NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text,
  `profesor_id` int unsigned NOT NULL,
  `creado_por` int unsigned NOT NULL COMMENT 'Secretaria que la creó',
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date DEFAULT NULL,
  `duracion_horas` decimal(6,1) DEFAULT NULL,
  `estado` enum('no_iniciado','proceso','terminado') NOT NULL DEFAULT 'no_iniciado',
  `oficio_num` varchar(60) DEFAULT NULL,
  `lugar` varchar(200) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `folio` (`folio`),
  KEY `fk_com_tipo` (`tipo_id`),
  KEY `fk_com_creador` (`creado_por`),
  KEY `idx_com_profesor` (`profesor_id`),
  KEY `idx_com_estado` (`estado`),
  KEY `idx_com_folio` (`folio`),
  CONSTRAINT `fk_com_creador` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_com_profesor` FOREIGN KEY (`profesor_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_com_tipo` FOREIGN KEY (`tipo_id`) REFERENCES `tipos_comision` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sis_comisiones.comisiones: ~10 rows (aproximadamente)
INSERT IGNORE INTO `comisiones` (`id`, `folio`, `tipo_id`, `nombre`, `descripcion`, `profesor_id`, `creado_por`, `fecha_inicio`, `fecha_fin`, `duracion_horas`, `estado`, `oficio_num`, `lugar`, `created_at`, `updated_at`) VALUES
	(1, 'FCI-COM-2025-AGO-001', 1, 'Sinodal Secretario – Examen de titulación de Edson José Antonio Corsi', 'El profesor fungirá como Sinodal Secretario en el examen de titulación. Deberá estar presente en la defensa, evaluar el trabajo y firmar los documentos del acta.', 4, 1, '2025-04-05', '2026-06-20', 8.0, 'proceso', 'FCI-COMISION-2025-AGO-001', 'Sala de usos múltiples FCI', '2026-05-05 23:39:39', '2026-05-05 23:39:39'),
	(2, 'FCI-COM-2025-AGO-002', 2, 'Representante de área en Semana Académica 2025', 'Participar como representante del área de Sistemas Computacionales en la Semana Académica.', 5, 1, '2025-05-10', '2025-05-10', 16.0, 'terminado', 'FCI-COMISION-2025-AGO-002', 'Auditorio FCI', '2026-05-05 23:39:39', '2026-05-05 23:39:39'),
	(3, 'FCI-COM-2025-AGO-003', 1, 'Jurado en concurso de programación ICPC regional', 'Asistir como jurado evaluador en la etapa regional del concurso de programación ICPC.', 6, 1, '2025-09-15', '2025-09-15', 12.0, 'no_iniciado', 'FCI-COMISION-2025-AGO-003', 'Laboratorio de Cómputo 3', '2026-05-05 23:39:39', '2026-05-05 23:39:39'),
	(4, 'FCI-COM-2025-AGO-004', 3, 'Asesor de estadía de Luis Alberto Pérez Torres', 'El profesor actuará como asesor institucional de la estadía profesional, con seguimiento mensual y evaluación del informe final.', 4, 1, '2025-08-01', '2025-11-30', 40.0, 'proceso', 'FCI-COMISION-2025-AGO-004', 'FCI – Cubículo docente', '2026-05-05 23:39:39', '2026-05-05 23:39:39'),
	(5, 'FCI-COM-2025-AGO-005', 4, 'Coordinador de actualización curricular – Plan 2026', 'Encabezar la comisión de revisión y actualización del plan de estudios de ISC.', 7, 1, '2025-07-01', '2026-01-31', 60.0, 'proceso', 'FCI-COMISION-2025-AGO-005', 'Sala de Academias FCI', '2026-05-05 23:39:39', '2026-05-05 23:39:39'),
	(6, 'FCI-COM-2025-AGO-006', 6, 'Evaluador externo – CIEES visita de pares', 'Participar en la visita de evaluación por pares académicos del CIEES para acreditación.', 8, 1, '2025-10-20', '2025-10-20', 24.0, 'no_iniciado', 'FCI-COMISION-2025-AGO-006', 'FCI – Dirección', '2026-05-05 23:39:39', '2026-05-05 23:39:39'),
	(7, 'FCI-COM-2025-AGO-007', 4, 'Presidente de academia – Área de Redes', 'Presidir la academia de Redes y Telecomunicaciones, convocando y moderando reuniones.', 9, 1, '2025-08-01', '2026-07-31', 30.0, 'proceso', 'FCI-COMISION-2025-AGO-007', 'FCI – Sala de Academias', '2026-05-05 23:39:39', '2026-05-05 23:39:39'),
	(8, 'FCI-COM-2025-AGO-008', 8, 'Organizador – Conferencia Internacional IA y Educación', 'Coordinar la organización del evento: ponentes, logística, recepción de trabajos y memorias.', 5, 1, '2025-11-05', '2025-11-07', 48.0, 'no_iniciado', 'FCI-COMISION-2025-AGO-008', 'Auditorio Universidad', '2026-05-05 23:39:39', '2026-05-05 23:39:39'),
	(9, 'FCI-COM-2025-AGO-009', 7, 'Tutor grupal – 3er semestre ISC grupo A', 'Brindar atención tutorial al grupo 3A de ISC, seguimiento académico y atención de problemáticas.', 6, 1, '2025-08-11', '2025-12-15', 20.0, 'terminado', 'FCI-COMISION-2025-AGO-009', 'FCI – Cubículo tutoría', '2026-05-05 23:39:39', '2026-05-05 23:39:39'),
	(10, 'FCI-COM-2025-AGO-010', 5, 'Enlace institucional – Visita de empresa CEMEX', 'Recibir y acompañar a los representantes de CEMEX, facilitar vínculo para convenios de estadía.', 9, 1, '2025-09-25', '2025-09-25', 8.0, 'terminado', 'FCI-COMISION-2025-AGO-010', 'Dirección FCI', '2026-05-05 23:39:39', '2026-05-05 23:39:39');

-- Volcando estructura para tabla sis_comisiones.historial_estados
CREATE TABLE IF NOT EXISTS `historial_estados` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `comision_id` int unsigned NOT NULL,
  `estado_anterior` enum('no_iniciado','proceso','terminado') DEFAULT NULL,
  `estado_nuevo` enum('no_iniciado','proceso','terminado') NOT NULL,
  `cambiado_por` int unsigned NOT NULL,
  `observacion` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_hist_comision` (`comision_id`),
  KEY `fk_hist_usuario` (`cambiado_por`),
  CONSTRAINT `fk_hist_comision` FOREIGN KEY (`comision_id`) REFERENCES `comisiones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hist_usuario` FOREIGN KEY (`cambiado_por`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sis_comisiones.historial_estados: ~10 rows (aproximadamente)
INSERT IGNORE INTO `historial_estados` (`id`, `comision_id`, `estado_anterior`, `estado_nuevo`, `cambiado_por`, `observacion`, `created_at`) VALUES
	(1, 3, NULL, 'no_iniciado', 1, 'Estado inicial al crear comisión', '2026-05-05 23:39:39'),
	(2, 6, NULL, 'no_iniciado', 1, 'Estado inicial al crear comisión', '2026-05-05 23:39:39'),
	(3, 8, NULL, 'no_iniciado', 1, 'Estado inicial al crear comisión', '2026-05-05 23:39:39'),
	(4, 1, NULL, 'proceso', 1, 'Estado inicial al crear comisión', '2026-05-05 23:39:39'),
	(5, 4, NULL, 'proceso', 1, 'Estado inicial al crear comisión', '2026-05-05 23:39:39'),
	(6, 5, NULL, 'proceso', 1, 'Estado inicial al crear comisión', '2026-05-05 23:39:39'),
	(7, 7, NULL, 'proceso', 1, 'Estado inicial al crear comisión', '2026-05-05 23:39:39'),
	(8, 2, NULL, 'terminado', 1, 'Estado inicial al crear comisión', '2026-05-05 23:39:39'),
	(9, 9, NULL, 'terminado', 1, 'Estado inicial al crear comisión', '2026-05-05 23:39:39'),
	(10, 10, NULL, 'terminado', 1, 'Estado inicial al crear comisión', '2026-05-05 23:39:39');

-- Volcando estructura para tabla sis_comisiones.permisos_secretaria
CREATE TABLE IF NOT EXISTS `permisos_secretaria` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `id_admin` int unsigned NOT NULL COMMENT 'FK a usuarios (rol=secretaria)',
  `permiso_base` smallint unsigned NOT NULL DEFAULT '601' COMMENT '601=Lucía | 602=Estrellita | 603=Saide (super)',
  `permiso_asignado` smallint unsigned NOT NULL DEFAULT '601' COMMENT 'Permiso activo ahora (puede ser elevado temporalmente)',
  `cad_permiso_asignado` datetime DEFAULT NULL COMMENT 'NULL=sin caducidad | fecha=expira ese día',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_admin` (`id_admin`),
  CONSTRAINT `fk_perm_admin` FOREIGN KEY (`id_admin`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Permisos granulares por secretaria. 601 < 602 < 603.';

-- Volcando datos para la tabla sis_comisiones.permisos_secretaria: ~3 rows (aproximadamente)
INSERT IGNORE INTO `permisos_secretaria` (`id`, `id_admin`, `permiso_base`, `permiso_asignado`, `cad_permiso_asignado`, `created_at`, `updated_at`) VALUES
	(1, 1, 603, 603, NULL, '2026-05-05 23:39:39', '2026-05-05 23:39:39'),
	(2, 2, 602, 602, NULL, '2026-05-05 23:39:39', '2026-05-05 23:39:39'),
	(3, 3, 601, 601, NULL, '2026-05-05 23:39:39', '2026-05-05 23:39:39');

-- Volcando estructura para tabla sis_comisiones.sesiones
CREATE TABLE IF NOT EXISTS `sesiones` (
  `id` varchar(64) NOT NULL,
  `usuario_id` int unsigned NOT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ses_usuario` (`usuario_id`),
  CONSTRAINT `fk_ses_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sis_comisiones.sesiones: ~0 rows (aproximadamente)

-- Volcando estructura para tabla sis_comisiones.tipos_comision
CREATE TABLE IF NOT EXISTS `tipos_comision` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `icono` varchar(60) DEFAULT 'fa-file-contract',
  `tipo` smallint unsigned NOT NULL DEFAULT '602' COMMENT '601=solo Lucía | 602=Estrellita+Saide | 603=solo Saide (futuro)',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sis_comisiones.tipos_comision: ~9 rows (aproximadamente)
INSERT IGNORE INTO `tipos_comision` (`id`, `nombre`, `icono`, `tipo`, `activo`) VALUES
	(1, 'Sinodal / Titulación', 'fa-graduation-cap', 602, 1),
	(2, 'Representante académico', 'fa-person-chalkboard', 602, 1),
	(3, 'Asesor de estadía', 'fa-briefcase', 602, 1),
	(4, 'Coordinador de academia', 'fa-users-gear', 602, 1),
	(5, 'Enlace institucional', 'fa-building', 602, 1),
	(6, 'Evaluador externo', 'fa-star', 601, 1),
	(7, 'Tutor grupal', 'fa-people-group', 601, 1),
	(8, 'Organizador de evento', 'fa-calendar-star', 601, 1),
	(9, 'Otro', 'fa-ellipsis', 601, 1);

-- Volcando estructura para tabla sis_comisiones.usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `matricula` varchar(20) NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `grado` varchar(30) DEFAULT NULL COMMENT 'Dr., M.C., Mtro., Lic., etc.',
  `grupo_academico` enum('cuerpo_academico','academia') DEFAULT NULL COMMENT 'Solo profesores. NULL en secretaría.',
  `email` varchar(120) NOT NULL,
  `password` varchar(255) NOT NULL COMMENT 'bcrypt hash',
  `rol` enum('secretaria','profesor') NOT NULL DEFAULT 'profesor',
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=activo  0=suspendido',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `matricula` (`matricula`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_usu_rol` (`rol`),
  KEY `idx_usu_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Volcando datos para la tabla sis_comisiones.usuarios: ~11 rows (aproximadamente)
INSERT IGNORE INTO `usuarios` (`id`, `matricula`, `nombre`, `grado`, `grupo_academico`, `email`, `password`, `rol`, `activo`, `created_at`, `updated_at`) VALUES
	(1, 'SEC001', 'Saide', NULL, NULL, 'saide@fci.unacar.mx', '$2y$10$1lLLiGMHiHqFh17FXQ8GU.F5wU8Xhyda8BxiUPJWHk13NgsWx/NE6', 'secretaria', 1, '2026-05-05 23:39:39', '2026-05-05 23:42:20'),
	(2, 'SEC002', 'Estrellita', NULL, NULL, 'estrellita@fci.unacar.mx', '$2y$10$VQ9RrkT8Tlh4LKwM0pY7CuqzLEKNPHgbkmjljtZZi1t9Z8oYna0gK', 'secretaria', 1, '2026-05-05 23:39:39', '2026-05-05 23:54:34'),
	(3, 'SEC003', 'Lucía', NULL, NULL, 'lucia@fci.unacar.mx', '$2y$10$/ZICGP4a5.9qryJgf18YjexMGVa3CbdiIoASwOF0xvNQSCW5RDNV.', 'secretaria', 1, '2026-05-05 23:39:39', '2026-05-05 23:55:04'),
	(4, 'PTC001', 'José Ángel Pérez Rejón', 'Mtro.', 'cuerpo_academico', 'japerez@fci.unacar.mx', '$2y$10$FL.jr5yogf5JoOHGZNYcDu2.G9PvX1AKYlUe6qulpMEf34goKEgbG', 'profesor', 1, '2026-05-05 23:39:39', '2026-05-06 00:28:11'),
	(5, 'PTC002', 'María Fernanda Castillo López', 'Dra.', 'cuerpo_academico', 'mfcastillo@fci.unacar.mx', '$2y$10$FL.jr5yogf5JoOHGZNYcDu2.G9PvX1AKYlUe6qulpMEf34goKEgbG', 'profesor', 1, '2026-05-05 23:39:39', '2026-05-06 00:28:12'),
	(6, 'PTC003', 'Roberto Sánchez Mendoza', 'M.C.', 'academia', 'rsanchez@fci.unacar.mx', '$2y$10$FL.jr5yogf5JoOHGZNYcDu2.G9PvX1AKYlUe6qulpMEf34goKEgbG', 'profesor', 1, '2026-05-05 23:39:39', '2026-05-06 00:28:13'),
	(7, 'PTC004', 'Ana Patricia Ruíz Domínguez', 'Dra.', 'cuerpo_academico', 'apruiz@fci.unacar.mx', '$2y$10$FL.jr5yogf5JoOHGZNYcDu2.G9PvX1AKYlUe6qulpMEf34goKEgbG', 'profesor', 1, '2026-05-05 23:39:39', '2026-05-06 00:28:14'),
	(8, 'PTC005', 'Juan Pablo Herrera Díaz', 'M.C.', 'academia', 'jpherrera@fci.unacar.mx', '$2y$10$FL.jr5yogf5JoOHGZNYcDu2.G9PvX1AKYlUe6qulpMEf34goKEgbG', 'profesor', 1, '2026-05-05 23:39:39', '2026-05-06 00:28:15'),
	(9, 'PTC006', 'Carlos Alberto Méndez Fuentes', 'Dr.', 'cuerpo_academico', 'camendez@fci.unacar.mx', '$2y$10$FL.jr5yogf5JoOHGZNYcDu2.G9PvX1AKYlUe6qulpMEf34goKEgbG', 'profesor', 1, '2026-05-05 23:39:39', '2026-05-06 00:28:16'),
	(10, 'PTC007', 'Fernanda López Ramírez', 'Dra.', 'academia', 'flopez@fci.unacar.mx', '$2y$10$FL.jr5yogf5JoOHGZNYcDu2.G9PvX1AKYlUe6qulpMEf34goKEgbG', 'profesor', 1, '2026-05-05 23:39:39', '2026-05-06 00:28:18'),
	(11, 'PTC008', 'Jose Pepin Vazquez Mota', 'Prof.', 'academia', 'cg7030295@gmail.com', '$2y$12$d1KRFvLJaZ/oXVAPsz.B0.BDWh/BZopEDJth7wOP0Z1tUssZPpZNK', 'profesor', 0, '2026-05-05 23:46:11', '2026-05-05 23:46:26');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
