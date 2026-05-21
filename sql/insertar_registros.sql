
-- ======================================
-- DATOS: CLIENTE
-- ======================================
INSERT INTO cliente (id_cliente, nombre) VALUES
(1, 'Juan Pérez'),
(2, 'Ana López'),
(3, 'Carlos Ramírez'),
(4, 'María Torres'),
(5, 'Luis Gómez');

-- ======================================
-- DATOS: CLIENTE_TEL
-- (Un cliente puede tener varios teléfonos)
-- ======================================
INSERT INTO cliente_tel (id_telefono, telefono, id_cliente) VALUES
(1, '5512345678', 1),
(2, '5587654321', 1), -- Cliente con 2 teléfonos
(3, '5511122233', 2),
(4, '5522233344', 3),
(5, '5533344455', 4),
(6, '5544455566', 5);

-- ======================================
-- DATOS: PRODUCTO
-- ======================================
INSERT INTO producto (id_prod, nombre_prod, precio) VALUES
(1, 'Cuaderno', 25.00),
(2, 'Lápiz', 5.00),
(3, 'Pluma', 10.00),
(4, 'Mochila', 350.00),
(5, 'Regla', 15.00),
(6, 'Borrador', 6.00);

-- ======================================
-- DATOS: VENTA
-- ======================================
INSERT INTO venta (id_venta, fecha, id_cliente) VALUES
(1, '2026-05-01', 1),
(2, '2026-05-02', 2),
(3, '2026-05-03', 3),
(4, '2026-05-04', 1),
(5, '2026-05-05', 4);

-- ======================================
-- DATOS: VENTA_DETALLE
-- (Relación entre ventas y productos)
-- ======================================
INSERT INTO venta_detalle (id_detalle, id_venta, id_prod) VALUES
(1, 1, 1), -- Venta 1: Cuaderno
(2, 1, 2), -- Venta 1: Lápiz
(3, 2, 3), -- Venta 2: Pluma
(4, 3, 4), -- Venta 3: Mochila
(5, 3, 2), -- Venta 3: Lápiz
(6, 4, 5), -- Venta 4: Regla
(7, 5, 1), -- Venta 5: Cuaderno
(8, 5, 6); -- Venta 5: Borrador
