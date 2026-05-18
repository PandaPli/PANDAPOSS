-- AlterTable: agregar columna cerradoPorId en arqueos para registrar quién cerró cada turno
ALTER TABLE `arqueos` ADD COLUMN `cerradoPorId` INTEGER NULL;

-- Crear índice para la FK
CREATE INDEX `arqueos_cerradoPorId_fkey` ON `arqueos`(`cerradoPorId`);

-- Agregar FK hacia usuarios
ALTER TABLE `arqueos` ADD CONSTRAINT `arqueos_cerradoPorId_fkey`
  FOREIGN KEY (`cerradoPorId`) REFERENCES `usuarios`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
