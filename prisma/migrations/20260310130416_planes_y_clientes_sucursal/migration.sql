-- CreateTable
CREATE TABLE `sucursales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `direccion` VARCHAR(200) NULL,
    `telefono` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `simbolo` VARCHAR(5) NOT NULL DEFAULT '$',
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `plan` ENUM('BASICO', 'PRO') NOT NULL DEFAULT 'BASICO',
    `delivery` BOOLEAN NOT NULL DEFAULT false,
    `menuQR` BOOLEAN NOT NULL DEFAULT false,
    `correoActivo` BOOLEAN NOT NULL DEFAULT false,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `usuario` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `email` VARCHAR(100) NULL,
    `rol` ENUM('ADMIN_GENERAL', 'ADMIN_SUCURSAL', 'SECRETARY', 'CASHIER', 'WAITER', 'CHEF', 'BAR', 'PASTRY', 'DELIVERY') NOT NULL DEFAULT 'WAITER',
    `status` ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    `sucursalId` INTEGER NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_usuario_key`(`usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(80) NOT NULL,
    `sucursalId` INTEGER NOT NULL,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mesas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `capacidad` INTEGER NOT NULL DEFAULT 4,
    `estado` ENUM('LIBRE', 'OCUPADA', 'RESERVADA') NOT NULL DEFAULT 'LIBRE',
    `salaId` INTEGER NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(80) NOT NULL,
    `icono` VARCHAR(50) NULL,
    `activa` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `categorias_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `descripcion` TEXT NULL,
    `precio` DECIMAL(10, 2) NOT NULL,
    `costo` DECIMAL(10, 2) NULL,
    `stock` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `stockMinimo` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `imagen` VARCHAR(255) NULL,
    `ivaActivo` BOOLEAN NOT NULL DEFAULT false,
    `ivaPorc` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `enMenu` BOOLEAN NOT NULL DEFAULT true,
    `categoriaId` INTEGER NULL,
    `sucursalId` INTEGER NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `productos_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ingredientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `stock` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `stockMinimo` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `unidad` VARCHAR(20) NOT NULL DEFAULT 'und',
    `costo` DECIMAL(10, 2) NULL,
    `sucursalId` INTEGER NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ingredientes_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `combos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `precio` DECIMAL(10, 2) NOT NULL,
    `imagen` VARCHAR(255) NULL,
    `categoriaId` INTEGER NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `enMenu` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `combos_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rut` VARCHAR(20) NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `email` VARCHAR(100) NULL,
    `telefono` VARCHAR(20) NULL,
    `direccion` VARCHAR(200) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `sucursalId` INTEGER NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `clientes_rut_key`(`rut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proveedores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rut` VARCHAR(20) NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `email` VARCHAR(100) NULL,
    `telefono` VARCHAR(20) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `proveedores_rut_key`(`rut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cajas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(80) NOT NULL,
    `estado` ENUM('ABIERTA', 'CERRADA') NOT NULL DEFAULT 'CERRADA',
    `saldoInicio` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `sucursalId` INTEGER NOT NULL,
    `usuarioId` INTEGER NULL,
    `abiertaEn` DATETIME(3) NULL,
    `cerradaEn` DATETIME(3) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `arqueos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cajaId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `saldoInicio` DECIMAL(10, 2) NOT NULL,
    `saldoFinal` DECIMAL(10, 2) NULL,
    `totalVentas` DECIMAL(10, 2) NULL,
    `diferencia` DECIMAL(10, 2) NULL,
    `observacion` TEXT NULL,
    `abiertaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cerradaEn` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` INTEGER NOT NULL DEFAULT 0,
    `mesaId` INTEGER NULL,
    `cajaId` INTEGER NULL,
    `usuarioId` INTEGER NOT NULL,
    `repartidorId` INTEGER NULL,
    `tipo` ENUM('COCINA', 'BAR', 'REPOSTERIA', 'DELIVERY', 'MOSTRADOR') NOT NULL DEFAULT 'COCINA',
    `estado` ENUM('PENDIENTE', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    `observacion` TEXT NULL,
    `meseroLlamado` BOOLEAN NOT NULL DEFAULT false,
    `direccionEntrega` VARCHAR(300) NULL,
    `telefonoCliente` VARCHAR(30) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalles_pedidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pedidoId` INTEGER NOT NULL,
    `productoId` INTEGER NULL,
    `comboId` INTEGER NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `observacion` VARCHAR(200) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ventas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` VARCHAR(20) NOT NULL,
    `cajaId` INTEGER NULL,
    `clienteId` INTEGER NULL,
    `usuarioId` INTEGER NOT NULL,
    `pedidoId` INTEGER NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `descuento` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `impuesto` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `metodoPago` ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO', 'MIXTO') NOT NULL DEFAULT 'EFECTIVO',
    `estado` ENUM('PENDIENTE', 'PAGADA', 'ANULADA') NOT NULL DEFAULT 'PAGADA',
    `observacion` TEXT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ventas_numero_key`(`numero`),
    UNIQUE INDEX `ventas_pedidoId_key`(`pedidoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalles_ventas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ventaId` INTEGER NOT NULL,
    `productoId` INTEGER NULL,
    `comboId` INTEGER NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `precio` DECIMAL(10, 2) NOT NULL,
    `descuento` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kardex` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productoId` INTEGER NOT NULL,
    `tipo` ENUM('ENTRADA', 'SALIDA', 'AJUSTE') NOT NULL,
    `cantidad` DECIMAL(10, 2) NOT NULL,
    `motivo` VARCHAR(100) NOT NULL,
    `ventaId` INTEGER NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos_ventas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ventaId` INTEGER NOT NULL,
    `metodoPago` ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO', 'MIXTO') NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `referencia` VARCHAR(100) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NULL,
    `accion` VARCHAR(200) NOT NULL,
    `ip` VARCHAR(50) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracion` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `nombreEmpresa` VARCHAR(100) NOT NULL DEFAULT 'PandaPoss',
    `rut` VARCHAR(20) NULL,
    `direccion` VARCHAR(200) NULL,
    `telefono` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `logoUrl` VARCHAR(255) NULL,
    `moneda` VARCHAR(10) NOT NULL DEFAULT 'CLP',
    `simbolo` VARCHAR(5) NOT NULL DEFAULT '$',
    `ivaPorc` DECIMAL(5, 2) NOT NULL DEFAULT 19,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salas` ADD CONSTRAINT `salas_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mesas` ADD CONSTRAINT `mesas_salaId_fkey` FOREIGN KEY (`salaId`) REFERENCES `salas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categorias`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ingredientes` ADD CONSTRAINT `ingredientes_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `combos` ADD CONSTRAINT `combos_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categorias`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cajas` ADD CONSTRAINT `cajas_sucursalId_fkey` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cajas` ADD CONSTRAINT `cajas_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arqueos` ADD CONSTRAINT `arqueos_cajaId_fkey` FOREIGN KEY (`cajaId`) REFERENCES `cajas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arqueos` ADD CONSTRAINT `arqueos_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_mesaId_fkey` FOREIGN KEY (`mesaId`) REFERENCES `mesas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_cajaId_fkey` FOREIGN KEY (`cajaId`) REFERENCES `cajas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_repartidorId_fkey` FOREIGN KEY (`repartidorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_pedidos` ADD CONSTRAINT `detalles_pedidos_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_pedidos` ADD CONSTRAINT `detalles_pedidos_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_pedidos` ADD CONSTRAINT `detalles_pedidos_comboId_fkey` FOREIGN KEY (`comboId`) REFERENCES `combos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas` ADD CONSTRAINT `ventas_cajaId_fkey` FOREIGN KEY (`cajaId`) REFERENCES `cajas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas` ADD CONSTRAINT `ventas_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas` ADD CONSTRAINT `ventas_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas` ADD CONSTRAINT `ventas_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `pedidos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_ventas` ADD CONSTRAINT `detalles_ventas_ventaId_fkey` FOREIGN KEY (`ventaId`) REFERENCES `ventas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_ventas` ADD CONSTRAINT `detalles_ventas_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_ventas` ADD CONSTRAINT `detalles_ventas_comboId_fkey` FOREIGN KEY (`comboId`) REFERENCES `combos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kardex` ADD CONSTRAINT `kardex_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kardex` ADD CONSTRAINT `kardex_ventaId_fkey` FOREIGN KEY (`ventaId`) REFERENCES `ventas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos_ventas` ADD CONSTRAINT `pagos_ventas_ventaId_fkey` FOREIGN KEY (`ventaId`) REFERENCES `ventas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
