-- Insertar tipos de producto para cada subcategoría

-- COCINA - Organización
INSERT INTO product_types (subcategory_id, slug, name, order_index) VALUES
('378ead97-7edc-47c5-a9d4-6a430984b3f3', 'organizadores-gavetas', 'Organizadores de Gavetas', 1),
('378ead97-7edc-47c5-a9d4-6a430984b3f3', 'contenedores-almacenamiento', 'Contenedores de Almacenamiento', 2),
('378ead97-7edc-47c5-a9d4-6a430984b3f3', 'especieros', 'Especieros', 3),
('378ead97-7edc-47c5-a9d4-6a430984b3f3', 'porta-utensilios', 'Porta Utensilios', 4);

-- COCINA - Preparación
INSERT INTO product_types (subcategory_id, slug, name, order_index) VALUES
('9033b94e-0ef3-43f9-bfba-f7a0e5965c23', 'bowls-mezcladores', 'Bowls y Mezcladores', 1),
('9033b94e-0ef3-43f9-bfba-f7a0e5965c23', 'coladores-escurridores', 'Coladores y Escurridores', 2),
('9033b94e-0ef3-43f9-bfba-f7a0e5965c23', 'ralladores', 'Ralladores', 3),
('9033b94e-0ef3-43f9-bfba-f7a0e5965c23', 'medidores', 'Medidores', 4),
('9033b94e-0ef3-43f9-bfba-f7a0e5965c23', 'batidores-espatulas', 'Batidores y Espátulas', 5);

-- COCINA - Corte y Picado
INSERT INTO product_types (subcategory_id, slug, name, order_index) VALUES
('9b6184f4-d9d7-473b-98e6-8ce36086e9f7', 'tablas-cortar', 'Tablas de Cortar', 1),
('9b6184f4-d9d7-473b-98e6-8ce36086e9f7', 'cuchillos-chef', 'Cuchillos Chef', 2),
('9b6184f4-d9d7-473b-98e6-8ce36086e9f7', 'sets-cuchillos', 'Sets de Cuchillos', 3),
('9b6184f4-d9d7-473b-98e6-8ce36086e9f7', 'tijeras-cocina', 'Tijeras de Cocina', 4),
('9b6184f4-d9d7-473b-98e6-8ce36086e9f7', 'peladores', 'Peladores', 5);

-- COCINA - Para cocinar
INSERT INTO product_types (subcategory_id, slug, name, order_index) VALUES
('e76981e5-8c2a-4c7c-bca9-bdf0537cd8b0', 'ollas', 'Ollas', 1),
('e76981e5-8c2a-4c7c-bca9-bdf0537cd8b0', 'sartenes', 'Sartenes', 2),
('e76981e5-8c2a-4c7c-bca9-bdf0537cd8b0', 'woks', 'Woks', 3),
('e76981e5-8c2a-4c7c-bca9-bdf0537cd8b0', 'cacerolas', 'Cacerolas', 4),
('e76981e5-8c2a-4c7c-bca9-bdf0537cd8b0', 'ollas-presion', 'Ollas a Presión', 5),
('e76981e5-8c2a-4c7c-bca9-bdf0537cd8b0', 'sets-coccion', 'Sets de Cocción', 6);

-- COCINA - Repostería
INSERT INTO product_types (subcategory_id, slug, name, order_index) VALUES
('ba0d8072-0e10-48a4-880e-020898b93387', 'moldes-hornear', 'Moldes para Hornear', 1),
('ba0d8072-0e10-48a4-880e-020898b93387', 'moldes-tortas', 'Moldes para Tortas', 2),
('ba0d8072-0e10-48a4-880e-020898b93387', 'mangas-boquillas', 'Mangas y Boquillas', 3),
('ba0d8072-0e10-48a4-880e-020898b93387', 'rodillos', 'Rodillos', 4),
('ba0d8072-0e10-48a4-880e-020898b93387', 'cortadores-galletas', 'Cortadores de Galletas', 5);

-- MESA - Servir
INSERT INTO product_types (subcategory_id, slug, name, order_index) VALUES
('e7dc6a1d-5eeb-4109-af72-f986b011ebfe', 'bandejas', 'Bandejas', 1),
('e7dc6a1d-5eeb-4109-af72-f986b011ebfe', 'fuentes', 'Fuentes', 2),
('e7dc6a1d-5eeb-4109-af72-f986b011ebfe', 'ensaladeras', 'Ensaladeras', 3),
('e7dc6a1d-5eeb-4109-af72-f986b011ebfe', 'soperas', 'Soperas', 4),
('e7dc6a1d-5eeb-4109-af72-f986b011ebfe', 'salseras', 'Salseras', 5);

-- MESA - Vajilla
INSERT INTO product_types (subcategory_id, slug, name, order_index) VALUES
('ac78a77f-80bc-44a5-a72d-ce631b769038', 'platos-llanos', 'Platos Llanos', 1),
('ac78a77f-80bc-44a5-a72d-ce631b769038', 'platos-hondos', 'Platos Hondos', 2),
('ac78a77f-80bc-44a5-a72d-ce631b769038', 'platos-postre', 'Platos de Postre', 3),
('ac78a77f-80bc-44a5-a72d-ce631b769038', 'tazas-platos', 'Tazas y Platos', 4),
('ac78a77f-80bc-44a5-a72d-ce631b769038', 'sets-vajilla', 'Sets de Vajilla', 5);

-- MESA - Vajilla temporada
INSERT INTO product_types (subcategory_id, slug, name, order_index) VALUES
('c430fe4a-60d0-4daa-98c5-5ffae4411b3c', 'navidad', 'Navidad', 1),
('c430fe4a-60d0-4daa-98c5-5ffae4411b3c', 'halloween', 'Halloween', 2),
('c430fe4a-60d0-4daa-98c5-5ffae4411b3c', 'pascua', 'Pascua', 3),
('c430fe4a-60d0-4daa-98c5-5ffae4411b3c', 'san-valentin', 'San Valentín', 4);

-- MESA - Vasos
INSERT INTO product_types (subcategory_id, slug, name, order_index) VALUES
('d790a424-5981-41fd-a825-8f136b0e7e92', 'vasos-agua', 'Vasos de Agua', 1),
('d790a424-5981-41fd-a825-8f136b0e7e92', 'vasos-jugo', 'Vasos de Jugo', 2),
('d790a424-5981-41fd-a825-8f136b0e7e92', 'vasos-highball', 'Vasos Highball', 3),
('d790a424-5981-41fd-a825-8f136b0e7e92', 'sets-vasos', 'Sets de Vasos', 4);

-- MESA - Decoración y Accesorios
INSERT INTO product_types (subcategory_id, slug, name, order_index) VALUES
('82d6db54-acc6-45cd-ac78-5f65677c6048', 'centros-mesa', 'Centros de Mesa', 1),
('82d6db54-acc6-45cd-ac78-5f65677c6048', 'candelabros', 'Candelabros', 2),
('82d6db54-acc6-45cd-ac78-5f65677c6048', 'servilleteros', 'Servilleteros', 3),
('82d6db54-acc6-45cd-ac78-5f65677c6048', 'portavasos', 'Portavasos', 4);

-- MESA - Cubiertos
INSERT INTO product_types (subcategory_id, slug, name, order_index) VALUES
('2ca6a338-51af-4d9b-803d-c369fded0cee', 'cucharas', 'Cucharas', 1),
('2ca6a338-51af-4d9b-803d-c369fded0cee', 'tenedores', 'Tenedores', 2),
('2ca6a338-51af-4d9b-803d-c369fded0cee', 'cuchillos-mesa', 'Cuchillos de Mesa', 3),
('2ca6a338-51af-4d9b-803d-c369fded0cee', 'sets-cubiertos', 'Sets de Cubiertos', 4),
('2ca6a338-51af-4d9b-803d-c369fded0cee', 'cubiertos-servir', 'Cubiertos para Servir', 5);

-- MESA - Ropa de mesa
INSERT INTO product_types (subcategory_id, slug, name, order_index) VALUES
('23036e5a-df04-489c-8fc2-ec27af1b68b3', 'manteles', 'Manteles', 1),
('23036e5a-df04-489c-8fc2-ec27af1b68b3', 'caminos-mesa', 'Caminos de Mesa', 2),
('23036e5a-df04-489c-8fc2-ec27af1b68b3', 'servilletas', 'Servilletas', 3),
('23036e5a-df04-489c-8fc2-ec27af1b68b3', 'individuales', 'Individuales', 4);;
