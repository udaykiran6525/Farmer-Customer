-- ============================================================
-- Farmigo - Populate MySQL Database with Premium Products
-- ============================================================
-- This script creates:
--   10 Farmer accounts (password: Farmer@123 - BCrypt hashed)
--   38 Premium Agriculture Products with real HD images
-- ============================================================

-- BCrypt hash of "Farmer@123"
SET @farmer_pass = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- ============================================================
-- Step 1: Insert Farmer Users
-- ============================================================
INSERT INTO users (name, email, password, phone, role, state, district, village, city, address, pincode, farm_name, farm_size, profile_image, language, created_at)
VALUES
('Ramesh Kumar', 'ramesh.farmer@farmigo.com', @farmer_pass, '9876543210', 'farmer', 'Andhra Pradesh', 'Guntur', 'Tenali', 'Guntur', 'Near Tenali Bus Stand', '522201', 'Ramesh Agro Farm', '15 Acres', '', 'te', NOW()),
('Srinivas', 'srinivas.farmer@farmigo.com', @farmer_pass, '9876543211', 'farmer', 'Andhra Pradesh', 'Anantapur', 'Dharmavaram', 'Anantapur', 'Main Road Dharmavaram', '515671', 'Srinivas Farms', '10 Acres', '', 'te', NOW()),
('Mahesh', 'mahesh.farmer@farmigo.com', @farmer_pass, '9876543212', 'farmer', 'Andhra Pradesh', 'Kurnool', 'Nandyal', 'Kurnool', 'Near Nandyal Market', '518501', 'Mahesh Organic Farm', '20 Acres', '', 'te', NOW()),
('Prasad', 'prasad.farmer@farmigo.com', @farmer_pass, '9876543213', 'farmer', 'Andhra Pradesh', 'Nellore', 'Kavali', 'Nellore', 'SP Nagar Nellore', '524001', 'Prasad Rice Mill', '25 Acres', '', 'te', NOW()),
('Ravi', 'ravi.farmer@farmigo.com', @farmer_pass, '9876543214', 'farmer', 'Andhra Pradesh', 'Kadapa', 'Rajampet', 'Kadapa', 'Railway Station Road', '516115', 'Ravi Natural Farms', '12 Acres', '', 'te', NOW()),
('Naveen', 'naveen.farmer@farmigo.com', @farmer_pass, '9876543215', 'farmer', 'Andhra Pradesh', 'Chittoor', 'Tirupati', 'Chittoor', 'Near Tirupati Temple', '517501', 'Naveen Green Farms', '18 Acres', '', 'te', NOW()),
('Suresh', 'suresh.farmer@farmigo.com', @farmer_pass, '9876543216', 'farmer', 'Andhra Pradesh', 'East Godavari', 'Rajahmundry', 'Rajahmundry', 'Godavari Lane', '533101', 'Suresh Delta Farms', '30 Acres', '', 'te', NOW()),
('Kiran', 'kiran.farmer@farmigo.com', @farmer_pass, '9876543217', 'farmer', 'Andhra Pradesh', 'West Godavari', 'Eluru', 'Eluru', 'Eluru Main Road', '534001', 'Kiran Agro Industries', '22 Acres', '', 'te', NOW()),
('Lakshmi Agro Farms', 'lakshmi.farmer@farmigo.com', @farmer_pass, '9876543218', 'farmer', 'Karnataka', 'Bengaluru', 'Electronic City', 'Bengaluru', 'HSR Layout', '560100', 'Lakshmi Agro Farms', '50 Acres', '', 'en', NOW()),
('Organic Harvest Farms', 'organic.farmer@farmigo.com', @farmer_pass, '9876543219', 'farmer', 'Telangana', 'Hyderabad', 'Kompally', 'Hyderabad', 'Kompally Crossroads', '500100', 'Organic Harvest Farms', '35 Acres', '', 'en', NOW());

-- ============================================================
-- Step 2: Insert Products
-- ============================================================

-- Get farmer IDs
SET @ramesh = (SELECT id FROM users WHERE email='ramesh.farmer@farmigo.com');
SET @srinivas = (SELECT id FROM users WHERE email='srinivas.farmer@farmigo.com');
SET @mahesh = (SELECT id FROM users WHERE email='mahesh.farmer@farmigo.com');
SET @prasad = (SELECT id FROM users WHERE email='prasad.farmer@farmigo.com');
SET @ravi = (SELECT id FROM users WHERE email='ravi.farmer@farmigo.com');
SET @naveen = (SELECT id FROM users WHERE email='naveen.farmer@farmigo.com');
SET @suresh = (SELECT id FROM users WHERE email='suresh.farmer@farmigo.com');
SET @kiran = (SELECT id FROM users WHERE email='kiran.farmer@farmigo.com');
SET @lakshmi = (SELECT id FROM users WHERE email='lakshmi.farmer@farmigo.com');
SET @organic = (SELECT id FROM users WHERE email='organic.farmer@farmigo.com');

-- ============================================================
-- -- RICE CATEGORY
-- ============================================================
INSERT INTO products (name, category, price, unit, quantity, description, image, is_organic, ratings, review_count, is_available, farmer_id, created_at, updated_at) VALUES
('Sona Masoori Rice', 'Grains & Rice', 65, 'kg', 500,
 'Premium Sona Masoori rice from the fertile lands of Guntur, Andhra Pradesh. Lightweight, aromatic, and ideal for daily cooking. Known for its low glycemic index and fluffy texture when cooked. Sourced directly from our farm to your table.',
 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80', 0, 4.8, 1850, 1, @ramesh, NOW(), NOW()),

('Basmati Rice', 'Grains & Rice', 120, 'kg', 350,
 'Long-grain premium Basmati rice with exceptional aroma and taste. Each grain elongates to nearly double its size when cooked. Perfect for biryanis, pulao, and special occasions. Aged for 12 months for superior quality.',
 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800&q=80', 0, 4.9, 2100, 1, @prasad, NOW(), NOW()),

('Brown Rice', 'Grains & Rice', 95, 'kg', 200,
 'Nutrient-rich unpolished brown rice packed with fiber, vitamins, and minerals. A healthier alternative to white rice. Organically grown without pesticides or chemicals. Retains the bran layer for maximum nutrition.',
 'https://images.unsplash.com/photo-1594057786831-e09f3a0d1e0d?w=800&q=80', 1, 4.7, 980, 1, @organic, NOW(), NOW()),

('Raw Rice (Ponni)', 'Grains & Rice', 55, 'kg', 600,
 'Traditional raw ponni rice, a staple in South Indian households. Known for its soft texture and easy digestibility. Ideal for making idli, dosa batter, and everyday meals. Mill-fresh and naturally processed.',
 'https://images.unsplash.com/photo-1550828520-4cb496926fc9?w=800&q=80', 0, 4.6, 1420, 1, @suresh, NOW(), NOW());

-- ============================================================
-- PULSES CATEGORY
-- ============================================================
INSERT INTO products (name, category, price, unit, quantity, description, image, is_organic, ratings, review_count, is_available, farmer_id, created_at, updated_at) VALUES
('Red Gram - Toor Dal', 'Pulses & Dals', 130, 'kg', 300,
 'Premium quality Toor Dal (Red Gram) from Anantapur. Rich in protein and dietary fiber. Perfect for making sambar, dal fry, and traditional South Indian dishes. Cleaned, polished, and ready to cook.',
 'https://images.unsplash.com/photo-1613743983303-b3e89f8a2b80?w=800&q=80', 0, 4.7, 1250, 1, @srinivas, NOW(), NOW()),

('Bengal Gram - Chana Dal', 'Pulses & Dals', 110, 'kg', 250,
 'High-protein Bengal Gram (Chana Dal) sourced from the best farms in Kurnool. Nutty flavor and firm texture. Ideal for dal, chana masala, besan, and sweets. Stone-free and hygienically packed.',
 'https://images.unsplash.com/photo-1585996895823-f5be281a93d4?w=800&q=80', 0, 4.6, 890, 1, @mahesh, NOW(), NOW()),

('Green Gram - Moong Dal', 'Pulses & Dals', 140, 'kg', 200,
 'Split Green Gram (Moong Dal) - light, nutritious, and easy to digest. Rich in iron, potassium, and B vitamins. Perfect for making khichdi, dal, sprouts, and healthy soups. Organically grown.',
 'https://images.unsplash.com/photo-1623227866882-c005c26dfe89?w=800&q=80', 1, 4.8, 1100, 1, @organic, NOW(), NOW()),

('Black Gram - Urad Dal', 'Pulses & Dals', 125, 'kg', 280,
 'Whole Black Gram (Urad Dal) essential for making crispy vadas, dosas, and dal makhani. High in protein and calcium. Sourced from Nellore region farms. Premium quality with consistent grain size.',
 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=800&q=80', 0, 4.5, 750, 1, @prasad, NOW(), NOW()),

('Horse Gram (Kulthi Dal)', 'Pulses & Dals', 100, 'kg', 150,
 'Nutrient-dense Horse Gram, one of the most protein-rich lentils. Known for its medicinal properties in Ayurveda. Helps in weight management and boosts immunity. Farm-fresh from Kadapa hills.',
 'https://images.unsplash.com/photo-1515543904413-63b12dfe6570?w=800&q=80', 1, 4.6, 420, 1, @ravi, NOW(), NOW()),

('Cowpea (Lobia)', 'Pulses & Dals', 115, 'kg', 180,
 'Fresh Cowpea (Lobia/Bobbarlu) with high protein and fiber content. Versatile pulse used in curries, salads, and South Indian dishes. Rich in folate, manganese, and iron. Naturally grown without chemicals.',
 'https://images.unsplash.com/photo-1551462147-37885acc36f1?w=800&q=80', 0, 4.5, 560, 1, @naveen, NOW(), NOW());

-- ============================================================
-- MILLETS CATEGORY
-- ============================================================
INSERT INTO products (name, category, price, unit, quantity, description, image, is_organic, ratings, review_count, is_available, farmer_id, created_at, updated_at) VALUES
('Foxtail Millet (Korralu)', 'Grains & Rice', 90, 'kg', 180,
 'Organic Foxtail Millet (Korralu/Kangni) - rich in dietary fiber and iron. Gluten-free superfood perfect for rice replacement. Helps control blood sugar and cholesterol. Traditionally grown in Anantapur.',
 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80', 1, 4.8, 680, 1, @srinivas, NOW(), NOW()),

('Finger Millet - Ragi', 'Grains & Rice', 75, 'kg', 250,
 'Premium Finger Millet (Ragi) - the calcium powerhouse. Contains 3x more calcium than milk. Perfect for ragi mudde, ragi malt, porridge, and rotis. Ideal for growing children and elderly.',
 'https://images.unsplash.com/photo-1586201375761-83865001e8b7?w=800&q=80', 1, 4.9, 1580, 1, @lakshmi, NOW(), NOW()),

('Pearl Millet (Bajra)', 'Grains & Rice', 70, 'kg', 300,
 'High-energy Pearl Millet (Bajra/Sajjalu) rich in iron and zinc. Traditional grain perfect for rotis, khichdi, and porridge. Helps maintain body heat during winters. Organically cultivated.',
 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80', 1, 4.7, 920, 1, @mahesh, NOW(), NOW()),

('Little Millet (Samalu)', 'Grains & Rice', 95, 'kg', 120,
 'Nutritious Little Millet (Samalu/Samai) with high antioxidant content. Excellent substitute for rice in upma, pulao, and biryani. Low glycemic index makes it diabetic-friendly. Sourced from Rayalaseema.',
 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44571?w=800&q=80', 1, 4.6, 450, 1, @ravi, NOW(), NOW()),

('Barnyard Millet (Udalu)', 'Grains & Rice', 100, 'kg', 100,
 'Fiber-rich Barnyard Millet (Udalu/Sanwa) - perfect for fasting and everyday meals. Contains good amounts of iron and calcium. Ideal for making upma, payasam, and kheer. Pesticide-free cultivation.',
 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=800&q=80', 1, 4.5, 340, 1, @naveen, NOW(), NOW()),

('Kodo Millet (Arikelu)', 'Grains & Rice', 85, 'kg', 140,
 'Premium Kodo Millet (Arikelu/Varagu) - an ancient grain with modern benefits. Rich in vitamins B6 and niacin. Easy to cook and incredibly versatile. Great for rice dishes, khichdi, and dosas.',
 'https://images.unsplash.com/photo-1596591868264-6d2e4e240aa2?w=800&q=80', 1, 4.7, 390, 1, @suresh, NOW(), NOW());

-- ============================================================
-- OIL SEEDS CATEGORY
-- ============================================================
INSERT INTO products (name, category, price, unit, quantity, description, image, is_organic, ratings, review_count, is_available, farmer_id, created_at, updated_at) VALUES
('Premium Groundnuts', 'Pulses & Dals', 110, 'kg', 400,
 'Hand-picked premium groundnuts from Anantapur - the groundnut capital of India. Bold variety with high oil content. Perfect for making peanut butter, chikki, and cooking. Rich in protein and healthy fats.',
 'https://images.unsplash.com/photo-1567892320421-1c657571ea4e?w=800&q=80', 0, 4.8, 1650, 1, @srinivas, NOW(), NOW()),

('Sesame Seeds (Nuvvulu)', 'Spices', 180, 'kg', 150,
 'Natural white sesame seeds (Nuvvulu/Til) with rich nutty flavor. Cold-pressed to retain nutrients. Excellent source of calcium, copper, and magnesium. Perfect for laddu, chutney, and garnishing.',
 'https://images.unsplash.com/photo-1612187209234-a5f5c80f01aa?w=800&q=80', 1, 4.7, 720, 1, @mahesh, NOW(), NOW()),

('Sunflower Seeds', 'Dry Fruits', 160, 'kg', 200,
 'Roasted sunflower seeds - a healthy superfood snack. Rich in vitamin E, selenium, and antioxidants. Supports heart health and reduces inflammation. Lightly salted for perfect taste.',
 'https://images.unsplash.com/photo-1574856344991-aaa31b6f4ce3?w=800&q=80', 0, 4.6, 580, 1, @kiran, NOW(), NOW()),

('Mustard Seeds (Avalu)', 'Spices', 90, 'kg', 300,
 'Premium yellow mustard seeds (Avalu) essential for South Indian tempering. Aromatic and full of flavor. Rich in omega-3 fatty acids and selenium. Farm-fresh quality from East Godavari.',
 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80', 0, 4.5, 890, 1, @suresh, NOW(), NOW());

-- ============================================================
-- COCONUT PRODUCTS CATEGORY
-- ============================================================
INSERT INTO products (name, category, price, unit, quantity, description, image, is_organic, ratings, review_count, is_available, farmer_id, created_at, updated_at) VALUES
('Fresh Coconut', 'Fruits', 35, 'piece', 500,
 'Farm-fresh mature coconuts with thick white kernel and sweet water. Handpicked from coastal plantations of Nellore. Perfect for cooking, making chutney, and religious ceremonies. Each coconut weighs 400-500g.',
 'https://images.unsplash.com/photo-1580984969071-a8da8c33357f?w=800&q=80', 0, 4.7, 2200, 1, @prasad, NOW(), NOW()),

('Dry Coconut (Copra)', 'Dry Fruits', 150, 'kg', 200,
 'Sun-dried coconut (Copra) with rich flavor and long shelf life. Premium quality from Chittoor coconut gardens. Ideal for oil extraction, traditional sweets, and dry chutneys. High oil content ensures best quality.',
 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=800&q=80', 0, 4.6, 680, 1, @naveen, NOW(), NOW()),

('Coconut Powder (Desiccated)', 'Dry Fruits', 200, 'kg', 120,
 'Fine-grade desiccated coconut powder, freshly grated and dried. Perfect for making laddu, barfi, cakes, and garnishing. No added preservatives or sugar. Hygienically processed and packed.',
 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=800&q=80', 0, 4.5, 450, 1, @lakshmi, NOW(), NOW());

-- ============================================================
-- DRY FRUITS CATEGORY
-- ============================================================
INSERT INTO products (name, category, price, unit, quantity, description, image, is_organic, ratings, review_count, is_available, farmer_id, created_at, updated_at) VALUES
('Premium Cashew Nuts (W320)', 'Dry Fruits', 750, 'kg', 100,
 'Grade W320 whole cashew nuts - creamy white, perfectly shaped. Sourced from Goa and Kerala plantations. Lightly roasted for enhanced flavor. Rich in healthy monounsaturated fats. Ideal for snacking and cooking.',
 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800&q=80', 0, 4.9, 1890, 1, @lakshmi, NOW(), NOW()),

('Premium Cashew Nuts (W240)', 'Dry Fruits', 950, 'kg', 80,
 'Premium W240 jumbo cashew nuts - the largest and most premium grade. King-size whole cashews with buttery taste. Perfect for gifting, celebrations, and gourmet cooking. Each nut is hand-selected.',
 'https://images.unsplash.com/photo-1563292007-6ebe6a5b2e3f?w=800&q=80', 0, 4.9, 1420, 1, @organic, NOW(), NOW()),

('California Almonds', 'Dry Fruits', 650, 'kg', 120,
 'Imported California almonds - large, crunchy, and naturally sweet. Rich in Vitamin E, protein, and fiber. Great for brain health and weight management. Sourced from the finest Californian orchards.',
 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800&q=80', 0, 4.8, 2300, 1, @lakshmi, NOW(), NOW()),

('Organic Almonds (Mamra)', 'Dry Fruits', 850, 'kg', 60,
 'Organic Mamra Almonds from Afghanistan - known for highest oil content (over 50 percent). Traditional variety with superior taste. Ideal for soaked almonds and Ayurvedic preparations. 100 percent chemical-free.',
 'https://images.unsplash.com/photo-1574570068755-b12e50cb4b72?w=800&q=80', 1, 4.9, 780, 1, @organic, NOW(), NOW()),

('Premium Pistachios', 'Dry Fruits', 1100, 'kg', 70,
 'Roasted and salted premium pistachios - naturally split shells for easy snacking. Vibrant green kernels with sweet nutty flavor. Rich in antioxidants, vitamin B6, and potassium. Imported from Iran.',
 'https://images.unsplash.com/photo-1525706040024-2a272e23aca0?w=800&q=80', 0, 4.8, 1560, 1, @lakshmi, NOW(), NOW()),

('Premium Walnuts', 'Dry Fruits', 800, 'kg', 90,
 'Chilean premium walnuts - brain-shaped superfood for brain health. Light halves with delicate flavor. Highest source of plant-based omega-3 fatty acids. Perfect for salads, baking, and snacking.',
 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&q=80', 0, 4.7, 1120, 1, @organic, NOW(), NOW()),

('Golden Raisins (Kishmish)', 'Dry Fruits', 280, 'kg', 200,
 'Premium golden raisins (Kishmish) - sweet, plump, and seedless. Sun-dried Thompson grapes with natural golden color. Rich in iron, potassium, and natural energy. Perfect for cooking, desserts, and snacking.',
 'https://images.unsplash.com/photo-1596273312752-3b1c48dd5af1?w=800&q=80', 0, 4.6, 980, 1, @kiran, NOW(), NOW()),

('Black Raisins (Kali Kishmish)', 'Dry Fruits', 250, 'kg', 180,
 'Seedless black raisins with intense sweetness and chewy texture. Naturally dried without sulphur. Excellent for boosting hemoglobin and energy. Soak overnight for maximum health benefits.',
 'https://images.unsplash.com/photo-1597371424128-8ffb8e850ee4?w=800&q=80', 0, 4.6, 720, 1, @ramesh, NOW(), NOW()),

('Premium Dates (Khajur)', 'Dry Fruits', 350, 'kg', 150,
 'Soft and succulent premium Saudi dates (Khajur). Naturally sweet with caramel-like flavor. Rich in fiber, potassium, and natural sugars for instant energy. Perfect for Ramadan, festivals, and daily nutrition.',
 'https://images.unsplash.com/photo-1597706744228-f4026ab5eb3e?w=800&q=80', 0, 4.8, 1650, 1, @srinivas, NOW(), NOW()),

('Medjool Dates', 'Dry Fruits', 900, 'kg', 50,
 'King of dates - premium Medjool variety known as Natures Candy. Exceptionally large, soft, and sweet with rich caramel flavor. Sourced from Jordan. Perfect for smoothies, desserts, and healthy snacking.',
 'https://images.unsplash.com/photo-1580662367709-baf6a0eb09bf?w=800&q=80', 1, 4.9, 890, 1, @organic, NOW(), NOW()),

('Premium Dried Figs (Anjeer)', 'Dry Fruits', 600, 'kg', 80,
 'Premium Afghan dried figs (Anjeer) - naturally sweet and incredibly nutritious. Rich in calcium, fiber, and antioxidants. Soak in milk overnight for a powerful health drink. Great for digestive health.',
 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&q=80', 0, 4.7, 650, 1, @mahesh, NOW(), NOW()),

('Mixed Dry Fruits Pack', 'Dry Fruits', 550, 'pack', 100,
 'Premium assorted dry fruits pack - a healthy mix of cashews, almonds, pistachios, walnuts, and raisins. Perfect daily nutrition combo (500g pack). Ideal for gifting on festivals and special occasions.',
 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800&q=80', 0, 4.8, 2500, 1, @lakshmi, NOW(), NOW());

-- ============================================================
-- Done! 38 Premium Products Inserted Successfully
-- ============================================================
SELECT CONCAT('Total Farmers: ', COUNT(*)) AS result FROM users WHERE role='farmer';
SELECT CONCAT('Total Products: ', COUNT(*)) AS result FROM products;
