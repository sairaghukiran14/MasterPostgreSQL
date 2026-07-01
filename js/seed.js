// Seed schema + data used by every challenge.
// A small but rich company + e-commerce dataset so we can practice
// SELECT, JOINs, aggregates, window functions, JSON, DML and more.

export const SEED_SQL = `
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

CREATE TABLE departments (
  id          INT PRIMARY KEY,
  name        TEXT NOT NULL,
  location    TEXT,
  budget      NUMERIC(12,2)
);

CREATE TABLE employees (
  id            INT PRIMARY KEY,
  name          TEXT NOT NULL,
  department_id INT REFERENCES departments(id),
  salary        NUMERIC(10,2),
  hire_date     DATE,
  manager_id    INT,
  email         TEXT
);

CREATE TABLE customers (
  id           INT PRIMARY KEY,
  name         TEXT NOT NULL,
  country      TEXT,
  city         TEXT,
  signup_date  DATE,
  info         JSONB
);

CREATE TABLE categories (
  id    INT PRIMARY KEY,
  name  TEXT NOT NULL
);

CREATE TABLE products (
  id           INT PRIMARY KEY,
  name         TEXT NOT NULL,
  category_id  INT REFERENCES categories(id),
  price        NUMERIC(10,2),
  stock        INT
);

CREATE TABLE orders (
  id           INT PRIMARY KEY,
  customer_id  INT REFERENCES customers(id),
  order_date   DATE,
  status       TEXT,
  total        NUMERIC(10,2)
);

CREATE TABLE order_items (
  id          INT PRIMARY KEY,
  order_id    INT REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INT REFERENCES products(id),
  quantity    INT,
  unit_price  NUMERIC(10,2)
);

INSERT INTO departments (id, name, location, budget) VALUES
  (1, 'Engineering', 'Berlin',  1200000.00),
  (2, 'Sales',       'London',   800000.00),
  (3, 'Marketing',   'London',   450000.00),
  (4, 'Support',     'Berlin',   300000.00),
  (5, 'Research',    'Zurich',   950000.00);

INSERT INTO employees (id, name, department_id, salary, hire_date, manager_id, email) VALUES
  (1,  'Alice Johnson',   1, 95000, '2018-03-12', NULL, 'alice@corp.com'),
  (2,  'Bob Smith',       1, 72000, '2019-07-01', 1,    'bob@corp.com'),
  (3,  'Carol Diaz',      1, 68000, '2020-01-15', 1,    'carol@corp.com'),
  (4,  'David Lee',       2, 61000, '2019-11-20', 8,    'david@corp.com'),
  (5,  'Eva Green',       2, 58000, '2021-05-03', 8,    NULL),
  (6,  'Frank Moore',     3, 52000, '2020-09-09', 9,    'frank@corp.com'),
  (7,  'Grace Kim',       3, 54000, '2022-02-28', 9,    'grace@corp.com'),
  (8,  'Henry Ford',      2, 88000, '2017-06-18', NULL, 'henry@corp.com'),
  (9,  'Irene Wells',     3, 79000, '2018-08-25', NULL, 'irene@corp.com'),
  (10, 'Jack Brown',      4, 45000, '2021-10-11', 1,    'jack@corp.com'),
  (11, 'Karen White',     4, 47000, '2022-07-07', 1,    NULL),
  (12, 'Leo Martin',      5, 91000, '2019-04-30', NULL, 'leo@corp.com'),
  (13, 'Mia Clark',       5, 76000, '2020-12-01', 12,   'mia@corp.com'),
  (14, 'Nina Patel',      1, 64000, '2023-01-09', 1,    'nina@corp.com'),
  (15, 'Omar Farah',      2, 56000, '2023-03-15', 8,    'omar@corp.com');

INSERT INTO categories (id, name) VALUES
  (1, 'Electronics'),
  (2, 'Books'),
  (3, 'Home'),
  (4, 'Toys');

INSERT INTO products (id, name, category_id, price, stock) VALUES
  (1,  'Wireless Mouse',      1, 25.00,  340),
  (2,  'Mechanical Keyboard', 1, 89.00,  120),
  (3,  '4K Monitor',          1, 320.00, 45),
  (4,  'USB-C Cable',         1, 9.50,   900),
  (5,  'SQL Cookbook',        2, 42.00,  80),
  (6,  'PostgreSQL Guide',    2, 55.00,  60),
  (7,  'Novel: The Deep',     2, 15.00,  200),
  (8,  'Desk Lamp',           3, 34.00,  150),
  (9,  'Coffee Maker',        3, 79.00,  70),
  (10, 'Throw Pillow',        3, 19.00,  240),
  (11, 'Building Blocks',     4, 29.00,  180),
  (12, 'Puzzle 1000pc',       4, 17.00,  130),
  (13, 'RC Car',              4, 65.00,  50),
  (14, 'Noise Headphones',    1, 199.00, 33),
  (15, 'Standing Desk',       3, 410.00, 20);

INSERT INTO customers (id, name, country, city, signup_date, info) VALUES
  (1, 'Nomad Ltd',      'Germany', 'Berlin',   '2021-01-10', '{"tier":"gold","newsletter":true,"tags":["b2b","priority"]}'),
  (2, 'Riverside Co',   'UK',      'London',   '2021-06-22', '{"tier":"silver","newsletter":false,"tags":["b2b"]}'),
  (3, 'Sunny Homes',    'UK',      'Bristol',  '2022-03-14', '{"tier":"bronze","newsletter":true,"tags":[]}'),
  (4, 'Peak Traders',   'Switzerland','Zurich','2020-11-05', '{"tier":"gold","newsletter":true,"tags":["b2b","priority","vip"]}'),
  (5, 'Delta Retail',   'Germany', 'Munich',   '2023-02-19', '{"tier":"silver","newsletter":true,"tags":["retail"]}'),
  (6, 'Orbit Systems',  'France',  'Paris',    '2022-08-30', '{"tier":"bronze","newsletter":false,"tags":["retail"]}'),
  (7, 'Anchor Group',   'UK',      'London',   '2023-05-01', '{"tier":"gold","newsletter":true,"tags":["b2b"]}'),
  (8, 'Willow & Sons',  'Germany', 'Hamburg',  '2021-09-17', '{"tier":"silver","newsletter":false,"tags":["retail","priority"]}');

INSERT INTO orders (id, customer_id, order_date, status, total) VALUES
  (1,  1, '2023-01-05', 'delivered', 178.00),
  (2,  1, '2023-02-11', 'delivered', 89.00),
  (3,  2, '2023-02-15', 'shipped',   320.00),
  (4,  3, '2023-03-02', 'cancelled', 42.00),
  (5,  4, '2023-03-19', 'delivered', 673.00),
  (6,  4, '2023-04-01', 'delivered', 199.00),
  (7,  5, '2023-04-22', 'shipped',   58.00),
  (8,  6, '2023-05-08', 'delivered', 130.00),
  (9,  2, '2023-05-20', 'delivered', 110.00),
  (10, 7, '2023-06-01', 'pending',   410.00),
  (11, 1, '2023-06-14', 'delivered', 65.00),
  (12, 4, '2023-07-03', 'shipped',   34.00),
  (13, 8, '2023-07-19', 'delivered', 249.00),
  (14, 5, '2023-08-05', 'cancelled', 79.00),
  (15, 3, '2023-08-21', 'delivered', 92.00);

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
  (1,  1, 3,  1, 320.00),
  (2,  1, 1,  2, 25.00),
  (3,  2, 2,  1, 89.00),
  (4,  3, 3,  1, 320.00),
  (5,  4, 5,  1, 42.00),
  (6,  5, 15, 1, 410.00),
  (7,  5, 14, 1, 199.00),
  (8,  5, 6,  1, 55.00),
  (9,  6, 14, 1, 199.00),
  (10, 7, 5,  1, 42.00),
  (11, 7, 7,  1, 15.00),
  (12, 8, 9,  1, 79.00),
  (13, 8, 8,  1, 34.00),
  (14, 8, 7,  1, 15.00),
  (15, 9, 6,  2, 55.00),
  (16, 10, 15,1, 410.00),
  (17, 11, 13,1, 65.00),
  (18, 12, 8, 1, 34.00),
  (19, 13, 14,1, 199.00),
  (20, 13, 5, 1, 42.00),
  (21, 15, 2, 1, 89.00),
  (22, 15, 7, 1, 15.00);
`;

// A quick description of the schema shown in the "Schema" panel.
export const SCHEMA_INFO = [
  { table: 'departments', columns: ['id', 'name', 'location', 'budget'] },
  { table: 'employees',   columns: ['id', 'name', 'department_id', 'salary', 'hire_date', 'manager_id', 'email'] },
  { table: 'customers',   columns: ['id', 'name', 'country', 'city', 'signup_date', 'info (jsonb)'] },
  { table: 'categories',  columns: ['id', 'name'] },
  { table: 'products',    columns: ['id', 'name', 'category_id', 'price', 'stock'] },
  { table: 'orders',      columns: ['id', 'customer_id', 'order_date', 'status', 'total'] },
  { table: 'order_items', columns: ['id', 'order_id', 'product_id', 'quantity', 'unit_price'] },
];
