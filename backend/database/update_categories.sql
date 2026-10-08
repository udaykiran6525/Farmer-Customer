USE farmigo_db;
UPDATE products SET category = 'dry fruits' WHERE category = 'organic' OR category = 'Organic';
UPDATE products SET category = 'dry fruits' WHERE name IN ('Premium W320 Cashew Nuts', 'Premium W240 Cashew Nuts', 'California Almonds', 'Organic Almonds', 'Premium Pistachios', 'Premium Walnuts', 'Golden Raisins', 'Black Raisins', 'Premium Dates', 'Medjool Dates', 'Premium Dried Figs', 'Mixed Dry Fruit Pack', 'Healthy Mix Pack', 'Family Pack');
