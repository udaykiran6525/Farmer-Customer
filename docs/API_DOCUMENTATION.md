# Farmigo REST API Documentation

Production REST API Reference for Farmigo E-Commerce Agriculture Platform.

---

## Base URL
```text
http://localhost:5000/api
```

---

## 1. Authentication Endpoints

### Register User
- **POST** `/api/auth/register`
- **Content-Type**: `multipart/form-data`
- **Parameters**: `name`, `email`, `password`, `phone`, `role`, `profileImage` (file)
- **Response**: `200 OK` (User details + JWT Token)

### Login User
- **POST** `/api/auth/login`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "identifier": "farmer@example.com",
    "password": "password123"
  }
  ```
- **Response**: `200 OK` (User details + JWT Token)

---

## 2. Product Endpoints

### Get All Products
- **GET** `/api/products`
- **Query Params**: `category`, `search`, `page`, `size`
- **Response**: `200 OK` (List of Product Objects with Cloudinary Image URLs)

### Get Product By ID
- **GET** `/api/products/{id}`
- **Response**: `200 OK` (Product Object)

### Upload Product (Farmer)
- **POST** `/api/products`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Parameters**: `name`, `category`, `price`, `quantity`, `unit`, `description`, `image` (MultipartFile)
- **Response**: `200 OK` (Uploaded Product with Cloudinary `secure_url`)

### Edit Product (Farmer)
- **PUT** `/api/products/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### Delete Product (Farmer)
- **DELETE** `/api/products/{id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` (Deletes DB record and Cloudinary asset)

---

## 3. Cart & Wishlist Endpoints

### Get Cart Items
- **GET** `/api/cart`
- **Headers**: `Authorization: Bearer <token>`

### Add to Cart
- **POST** `/api/cart`
- **Body**: `{ "productId": 1, "quantity": 2 }`

### Get Wishlist
- **GET** `/api/wishlist`

### Toggle Wishlist
- **POST** `/api/wishlist/{productId}`

---

## 4. Order Endpoints

### Place Order
- **POST** `/api/orders`
- **Body**: `{ "shippingAddress": "123 Green St", "paymentMethod": "cod" }`

### Get Customer Orders
- **GET** `/api/orders/my-orders`

### Get Farmer Sales / Orders
- **GET** `/api/orders/farmer`
