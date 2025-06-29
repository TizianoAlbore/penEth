const express = require("express");
const router = express.Router();
const productController = require("../controller/products");
const multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/products");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const fetch = require("node-fetch");
const Product = require("../models/products");
const detectSeparator = (filePath) => {
  const firstLine = fs.readFileSync(filePath, "utf8").split("\n")[0];
  return firstLine.includes(";") ? ";" : ",";
};


router.post("/bulk-upload", upload.single("file"), async (req, res) => {
  const results = [];
  const separator = detectSeparator(req.file.path);

  fs.createReadStream(req.file.path)
    .pipe(csv({ separator }))
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        for (const row of results) {
          const urls = [row.imageUrl1, row.imageUrl2].filter(Boolean);
          const downloaded = [];
          for (const url of urls) {
            try {
              const response = await fetch(url);
              const buffer = await response.buffer();
              const ext = path.extname(new URL(url).pathname) || ".jpg";
              const filename = `${Date.now()}_${Math.random()
                .toString(36)
                .substring(2)}${ext}`;
              fs.writeFileSync(
                path.join("public", "uploads", "products", filename),
                buffer
              );
              downloaded.push(filename);
            } catch (err) {
              console.error("Error fetching image", err);
            }
          }
          if (downloaded.length) row.pImages = downloaded;
          delete row.imageUrl1;
          delete row.imageUrl2;
        }
        await Product.insertMany(results);
        fs.unlinkSync(req.file.path); // cleanup
        res.status(200).json({ message: "Prodotti caricati con successo!" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Errore nel caricamento." });
      }
    });
});


router.get("/all-product", productController.getAllProduct);
router.post("/product-by-category", productController.getProductByCategory);
router.post("/product-by-price", productController.getProductByPrice);
router.post("/wish-product", productController.getWishProduct);
router.post("/cart-product", productController.getCartProduct);

router.post("/add-product", upload.any(), productController.postAddProduct);
router.post("/edit-product", upload.any(), productController.postEditProduct);
router.post("/delete-product", productController.getDeleteProduct);
router.post("/single-product", productController.getSingleProduct);

router.post("/add-review", productController.postAddReview);
router.post("/delete-review", productController.deleteReview);

module.exports = router;
