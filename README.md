Farmigo – Direct Farmer-to-Customer Marketplace

Farmigo is a full-stack agricultural e-commerce platform that connects farmers directly with customers. It helps farmers sell their products without middlemen and allows customers to buy fresh agricultural products directly from farmers.

🎯 Objective

The main objective of Farmigo is to create a simple digital marketplace where farmers can sell their agricultural products directly to customers at fair prices.

✨ Features

👨‍🌾 Farmer Features

- Farmer registration and login
- Farmer dashboard
- Add, update and delete products
- Upload product images
- Manage product price and stock
- View customer orders
- Manage inventory
- View sales information

🛒 Customer Features

- Customer registration and login
- Browse agricultural products
- Search and filter products
- View product details
- Add products to cart
- Update cart quantity
- Add products to wishlist
- Place orders
- View order history
- Track order status

🛡️ Admin Features

- Admin login
- Manage users
- Manage farmers and customers
- Monitor products
- Monitor orders
- View platform information

🔐 Security

- JWT-based authentication
- BCrypt password hashing
- Role-based access control
- Secure REST APIs

☁️ Image Storage

- Cloudinary is used for storing product images.

🛍️ Product Categories

- 🥕 Vegetables
- 🍎 Fruits
- 🌾 Grains & Rice
- 🫘 Pulses & Dals
- 🌶️ Spices
- 🌱 Organic Products

🏗️ System Architecture

Customer / Farmer
       ↓
Frontend
       ↓
REST API
       ↓
Spring Boot Backend
       ↓
MySQL Database
       ↓
Cloudinary

🛠️ Technologies Used

Frontend

- HTML5
- CSS3
- JavaScript
- Vite
- Lucide Icons

Backend

- Java 17
- Spring Boot 3.2.4
- Spring Web
- Spring Data JPA
- Spring Security
- JWT
- BCrypt
- Maven

Database & Storage

- MySQL 8
- Cloudinary

Tools

- VS Code
- MySQL Workbench
- Git
- GitHub

📂 Project Structure

Farmigo/
│
├── frontend/
│   ├── index.html
│   ├── products.html
│   ├── farmer-dashboard.html
│   ├── admin-dashboard.html
│   ├── admin-login.html
│   ├── style.css
│   ├── admin-style.css
│   ├── vite.config.js
│   └── package.json
│
├── Backend/
│   ├── database/
│   │   ├── schema.sql
│   │   ├── populate_products.sql
│   │   ├── seed.sql
│   │   └── update_categories.sql
│   │
│   ├── src/
│   │   └── main/
│   │       ├── java/com/farmigo/
│   │       │   ├── controller/
│   │       │   ├── model/
│   │       │   ├── repository/
│   │       │   ├── service/
│   │       │   └── security/
│   │       └── resources/
│   │           └── application.properties
│   │
│   ├── pom.xml
│   ├── mvnw
│   └── mvnw.cmd
│
└── README.md

🗄️ Database

Farmigo uses MySQL to store application data.

Main entities include:

- Users
- Farmers
- Customers
- Products
- Orders
- Order Items
- Cart Items
- Wishlist Items

Database name:

farmigo_db

⚙️ Prerequisites

Before running the project, install:

- Java 17 or higher
- Node.js 18 or higher
- npm
- MySQL 8 or higher
- Git

🚀 Installation & Setup

1. Clone the Repository

git clone <your-github-repository-url>
cd Farmigo

2. Setup Database

Create the database in MySQL:

CREATE DATABASE farmigo_db;
USE farmigo_db;

Run the SQL files available inside:

Backend/database/

3. Setup Backend

Go to the Backend folder:

cd Backend

Configure your MySQL details in:

src/main/resources/application.properties

Example:

spring.datasource.url=jdbc:mysql://localhost:3306/farmigo_db
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD

Run the backend on Windows:

.\mvnw.cmd spring-boot:run

For Linux/Mac:

./mvnw spring-boot:run

Backend URL:

http://localhost:5000

4. Setup Frontend

Open another terminal:

cd frontend

Install dependencies:

npm install

Start the frontend:

npm run dev

Frontend URL:

http://localhost:5173

🔄 Order Flow

Customer Login
      ↓
Browse Products
      ↓
Add Product to Cart
      ↓
Place Order
      ↓
Order Reaches Farmer
      ↓
Farmer Processes Order
      ↓
Order Delivered

🌐 API

Backend API base URL:

http://localhost:5000/api

Main API modules:

- Authentication
- Products
- Cart
- Wishlist
- Orders
- Users
- Farmers
- Customers

🎓 Project Purpose

Farmigo is developed as a B.Tech full-stack project to demonstrate the practical implementation of:

- Frontend development
- Backend development
- REST APIs
- Database management
- Authentication and security
- Cloud image storage
- E-commerce functionality

👨‍💻 Project Details

Project Name: Farmigo
Project Type: Full-Stack Web Application
Domain: Agriculture & E-Commerce

📄 License

This project is developed for educational and academic purposes.
