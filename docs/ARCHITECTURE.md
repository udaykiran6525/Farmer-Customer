# Farmigo System Architecture

Production System Architecture Blueprint for Farmigo E-Commerce Agriculture Platform.

---

## High-Level Architecture Diagram

```text
[ Browser / Client ]
        |
        v
[ HTML / JavaScript Frontend ] (Port 5000 / Static)
        |
        v REST API (JSON / FormData)
[ Spring Boot 3.2.4 Backend ]
   |                  |
   v JDBC             v HTTPS SDK
[ MySQL 8.x DB ]  [ Cloudinary Image Cloud ]
(farmigo_db)      (farmigo/products)
```

---

## Architectural Layers

1. **Presentation Layer (`frontend/public/`)**:
   - Dynamic HTML5, CSS3, Vanilla JS & React client views.
   - Dashboards: `farmer-dashboard.html`, `admin-dashboard.html`, `products.html`, `index.html`.
2. **Security Layer (`backend/.../security`)**:
   - Spring Security with Stateless JWT Filter (`JwtAuthenticationFilter`).
   - Password Hashing using `BCryptPasswordEncoder`.
3. **Service Layer (`backend/.../service`)**:
   - Transactional business logic annotated with Spring `@Service` and `@Transactional`.
4. **Data Access Layer (`backend/.../repository`)**:
   - Spring Data JPA Repositories mapping MySQL entities (`User`, `Product`, `Order`, etc.).
5. **Third-Party Cloud Storage**:
   - Cloudinary Java SDK uploading produce images directly to `farmigo/products` and persisting secure HTTPS URLs in MySQL.
