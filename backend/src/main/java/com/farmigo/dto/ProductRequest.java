package com.farmigo.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ProductRequest {
    private String name;
    private String productName;
    private String category;
    private Double price;
    private String unit;
    private Integer quantity;
    private Integer stock;
    private String description;
    private String weight;
    private String shelfLife;
    private String harvestDate;
    private MultipartFile image;
    private MultipartFile imageFile;
    private String imageUrl;
    private Boolean isOrganic;
    private Boolean isAvailable;

    public String getName() {
        return name != null ? name : productName;
    }

    public void setName(String name) {
        this.name = name;
        if (this.productName == null) this.productName = name;
    }

    public String getProductName() {
        return productName != null ? productName : name;
    }

    public void setProductName(String productName) {
        this.productName = productName;
        if (this.name == null) this.name = productName;
    }

    public Integer getQuantity() {
        return quantity != null ? quantity : stock;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
        if (this.stock == null) this.stock = quantity;
    }

    public Integer getStock() {
        return stock != null ? stock : quantity;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
        if (this.quantity == null) this.quantity = stock;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getWeight() { return weight; }
    public void setWeight(String weight) { this.weight = weight; }
    public String getShelfLife() { return shelfLife; }
    public void setShelfLife(String shelfLife) { this.shelfLife = shelfLife; }
    public String getHarvestDate() { return harvestDate; }
    public void setHarvestDate(String harvestDate) { this.harvestDate = harvestDate; }
    public MultipartFile getImage() { return image; }
    public void setImage(MultipartFile image) { this.image = image; }
    public MultipartFile getImageFile() { return imageFile; }
    public void setImageFile(MultipartFile imageFile) { this.imageFile = imageFile; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Boolean getIsOrganic() { return isOrganic; }
    public void setIsOrganic(Boolean isOrganic) { this.isOrganic = isOrganic; }
    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
}
