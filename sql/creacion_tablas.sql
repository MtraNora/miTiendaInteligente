-- ======================================
-- TABLA: CLIENTE
-- ======================================
CREATE TABLE cliente (
    id_cliente SERIAL PRIMARY KEY, -- Identificador único del cliente
    nombre VARCHAR(100) NOT NULL   -- Nombre del cliente
);

-- ======================================
-- TABLA: CLIENTE_TEL
-- ======================================
CREATE TABLE cliente_tel (
    id_telefono SERIAL PRIMARY KEY, -- Identificador único del teléfono
    telefono VARCHAR(15) NOT NULL,  -- Número de teléfono
    id_cliente INT NOT NULL,        -- Relación con cliente
    
    -- Llave foránea
    CONSTRAINT fk_cliente_tel
    FOREIGN KEY (id_cliente)
    REFERENCES cliente(id_cliente)
    ON DELETE CASCADE
);

-- ======================================
-- TABLA: PRODUCTO
-- ======================================
CREATE TABLE producto (
    id_prod SERIAL PRIMARY KEY,      -- Identificador del producto
    nombre_prod VARCHAR(100) NOT NULL, -- Nombre del producto
    precio NUMERIC(10,2) NOT NULL    -- Precio del producto
);

-- ======================================
-- TABLA: VENTA
-- ======================================
CREATE TABLE venta (
    id_venta SERIAL PRIMARY KEY, -- Identificador de la venta
    fecha DATE NOT NULL,         -- Fecha de la venta
    id_cliente INT NOT NULL,     -- Cliente que compra
    
    -- Llave foránea
    CONSTRAINT fk_venta_cliente
    FOREIGN KEY (id_cliente)
    REFERENCES cliente(id_cliente)
);

-- ======================================
-- TABLA: VENTA_DETALLE
-- ======================================
CREATE TABLE venta_detalle (
    id_detalle SERIAL PRIMARY KEY, -- Identificador del detalle
    id_venta INT NOT NULL,         -- Relación con venta
    id_prod INT NOT NULL,          -- Producto vendido
    
    -- Llaves foráneas
    CONSTRAINT fk_detalle_venta
    FOREIGN KEY (id_venta)
    REFERENCES venta(id_venta)
    ON DELETE CASCADE,
    
    CONSTRAINT fk_detalle_producto
    FOREIGN KEY (id_prod)
    REFERENCES producto(id_prod)
);
