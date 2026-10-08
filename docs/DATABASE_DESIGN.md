# Farmigo Database Schema Design

Comprehensive ER relational database specification for MySQL 8.x (`farmigo_db`).

---

## Entity Relationship Overview

```text
+---------------+         +---------------+         +---------------+
|     users     | 1 --- 1 |    farmers    | 1 --- * |   products    |
+---------------+         +---------------+         +---------------+
  |       |                                                 |
  | 1     | 1                                               | 1
  |       |                                                 |
  *       *                                                 *
+---------------+                                   +---------------+
|   customers   |                                   |  order_items  |
+---------------+                                   +---------------+
  |                                                         |
  | 1                                                       | *
  |                                                         |
  *                                                         |
+---------------+ 1 ----------------------------------------+
|    orders     |
+---------------+
```

---

## Table Specifications

1. **`users`**: Master user identity table storing BCrypt hashed passwords, roles (`FARMER`, `CUSTOMER`, `ADMIN`), contact details, and location attributes.
2. **`farmers`**: Normalized farmer profile linked 1-to-1 with `users.id`.
3. **`customers`**: Normalized customer profile linked 1-to-1 with `users.id`.
4. **`products`**: Agriculture product listings storing inventory quantity, unit, price, ratings, and Cloudinary image URLs.
5. **`orders`**: Customer purchase transactions with delivery status lifecycle (`pending` -> `processing` -> `delivered`).
6. **`order_items`**: Junction table mapping orders to products with unit purchase price.
7. **`wishlist_items`**: Customer saved products.
8. **`cart_items`**: Active customer cart items with quantities.
9. **`reviews`**: Customer ratings and written produce reviews.
10. **`notifications`**: Real-time system notifications for users.
