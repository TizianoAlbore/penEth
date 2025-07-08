const productModel = require("../models/products");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const customizeController = require("./customize");
const _ = require('lodash');

function detectSeparator(filePath) {
  const firstLine = fs.readFileSync(filePath, "utf8").split(/\r?\n/)[0];
  if (firstLine.includes(";")) return ";";
  if (firstLine.includes("\t")) return "\t";
  return ",";
}
const redis = require('redis');
const { client } = require('../config/redis');


class Product {



  // REDIS VULNERABLE FUNCTIONS: receive email when product is available
  async addToNotificationList(req, res) {
    const { productId } = req.params;
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email obbligatoria' });

    const redisKey = `notify:${productId}`;
    await client.rPush(redisKey, email);

    res.json({ message: 'Verrai notificato quando il prodotto torna disponibile.' });
  };

  async notifyUsers(req, res) {
    const { productId } = req.params;
    const redisKey = `notify:${productId}`;

    const emails = await client.lRange(redisKey, 0, -1);
    if (emails.length === 0) {
      return res.json({ message: 'Nessun utente da notificare.' });
    }

    // Simulazione: stampa a log (oppure potresti usare nodemailer)
    emails.forEach(email => {
      console.log(`📬 Notifica inviata a: ${email} per il prodotto ${productId}`);
    });

    await client.del(redisKey); // Svuota la list
    res.json({ message: 'Notifiche inviate', total: emails.length });
  };




  static deleteImages(images, mode) {
    const basePath = path.resolve(__dirname, "..", "public", "uploads", "products") + path.sep;
    console.log(basePath);
    for (var i = 0; i < images.length; i++) {
      let filePath = "";
      if (mode == "file") {
        filePath = basePath + `${images[i].filename}`;
      } else {
        filePath = basePath + `${images[i]}`;
      }
      console.log(filePath);
      if (fs.existsSync(filePath)) {
        console.log("Exists image");
      }
      fs.unlink(filePath, (err) => {
        if (err) {
          return err;
        }
      });
    }
  }

  async getAllProduct(req, res) {
    try {
      let Products = await productModel
        .find({})
        .populate("pCategory", "_id cName")
        .sort({ _id: -1 });
      if (Products) {
        return res.json({ Products });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async postAddProduct(req, res) {
    let { pName, pDescription, pPrice, pQuantity, pCategory, pOffer, pStatus } =
      req.body;
    let images = req.files;
    // Validation
    if (
      !pName |
      !pDescription |
      !pPrice |
      !pQuantity |
      !pCategory |
      !pOffer |
      !pStatus
    ) {
      Product.deleteImages(images, "file");
      return res.json({ error: "All filled must be required" });
    }
    // Validate Name and description
    else if (pName.length > 255 || pDescription.length > 3000) {
      Product.deleteImages(images, "file");
      return res.json({
        error: "Name 255 & Description must not be 3000 charecter long",
      });
    }
    // Validate Images
    else if (images.length !== 2) {
      Product.deleteImages(images, "file");
      return res.json({ error: "Must need to provide 2 images" });
    } else {
      try {
        let allImages = [];
        for (const img of images) {
          allImages.push(img.filename);
        }
        let newProduct = new productModel({
          pImages: allImages,
          pName,
          pDescription,
          pPrice,
          pQuantity,
          pCategory,
          pOffer,
          pStatus,
        });
        let save = await newProduct.save();
        if (save) {
          return res.json({ success: "Product created successfully" });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }





  async postEditProduct_CORRECT(req, res) {
    console.log(req.body);
    // VERSIONE VULNERABILE:
    const dataReceived = _.merge({}, req.body);
    console.log('Polluted? logging \'{}.hostname --> ', {}.hostname);

    // campi principali provenienti dal form
    const {
      pId,
      pName,
      pDescription,
      pPrice,
      pQuantity,
      pCategory,
      pOffer,
      pStatus,
      pImages     // elenco immagini precedenti (es. "img1.jpg,img2.jpg")
    } = req.body;

    const editImages = req.files;

    /* ─────────────── Validazioni basilari ─────────────── */
    if (
      !pId ||
      !pName ||
      !pDescription ||
      !pPrice ||
      !pQuantity ||
      !pCategory ||
      !pOffer ||
      !pStatus
    ) {
      return res.json({ error: 'All fields must be provided' });
    }

    if (pName.length > 255 || pDescription.length > 3000) {
      return res.json({
        error: 'Name 255 & Description must not be 3000 characters long'
      });
    }

    if (editImages && editImages.length === 1) {
      // 1 sola immagine non è ammessa
      Product.deleteImages(editImages, 'file');
      return res.json({ error: 'Must provide exactly 2 images' });
    }

    /* ─────────────── Raccolta dati da aggiornare ─────────────── */
    let editData = {
      pName,
      pDescription,
      pPrice,
      pQuantity,
      pCategory,
      pOffer,
      pStatus
    };

    // gestione sostituzione immagini
    if (editImages && editImages.length === 2) {
      const allEditImages = editImages.map(img => img.filename);
      editData = { ...editData, pImages: allEditImages };
      if (pImages) {
        Product.deleteImages(pImages.split(','), 'string');
      }
    }

    /* ─────────────── Salvataggio su MongoDB ─────────────── */
    try {
      await productModel.findByIdAndUpdate(pId, editData);
      return res.json({ success: 'Product edited successfully' });
    } catch (err) {
      console.error(err);
      return res.json({ error: 'Something went wrong' });
    }
  }

  async postEditProduct(req, res) {
    console.log('req.body: \n', req.body);
    /* ─────────────── Validazioni basilari ─────────────── */
    if (
      !req.body.pId ||
      !req.body.pName ||
      !req.body.pDescription ||
      !req.body.pPrice ||
      !req.body.pQuantity ||
      !req.body.pCategory ||
      !req.body.pOffer ||
      !req.body.pStatus
    ) {
      return res.json({ error: 'All fields must be provided' });
    }
    /* ─────────────── Merge vulnerabile ─────────────── */
    let uploadedImages = (req.files || []).map(file => file.filename);
    let editData = _.merge({}, req.body, { pImages: uploadedImages });
    
    // debug only
    console.log('Polluted? logging \'{}.hostname --> ', {}.hostname);

    /* ─────────────── Upload MongoDB ─────────────── */
    try {
      let editProduct = productModel.findByIdAndUpdate(req.body.pId, editData);
      editProduct.exec((err) => {
        if (err) {
          console.log(err);
          return res.json({ error: "Something went wrong" });
        }
        return res.json({ success: "Product edited successfully" });
      });
    } catch (err) {
      console.log(err);
      return res.json({ error: "Internal server error" });
    }
  }





  async getDeleteProduct(req, res) {
    let { pId } = req.body;
    if (!pId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let deleteProductObj = await productModel.findById(pId);
        let deleteProduct = await productModel.findByIdAndDelete(pId);
        if (deleteProduct) {
          // Delete Image from uploads -> products folder
          Product.deleteImages(deleteProductObj.pImages, "string");
          return res.json({ success: "Product deleted successfully" });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getSingleProduct(req, res) {
    let { pId } = req.body;
    if (!pId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let singleProduct = await productModel
          .findById(pId)
          .populate("pCategory", "cName")
          .populate("pRatingsReviews.user", "name email userImage");
        if (singleProduct) {
          return res.json({ Product: singleProduct });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getProductByCategory(req, res) {
    let { catId } = req.body;
    if (!catId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let products = await productModel
          .find({ pCategory: catId })
          .populate("pCategory", "cName");
        if (products) {
          return res.json({ Products: products });
        }
      } catch (err) {
        return res.json({ error: "Search product wrong" });
      }
    }
  }

  async getProductByPrice(req, res) {
    let { price } = req.body;
    if (!price) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let products = await productModel
          .find({ pPrice: { $lt: price } })
          .populate("pCategory", "cName")
          .sort({ pPrice: -1 });
        if (products) {
          return res.json({ Products: products });
        }
      } catch (err) {
        return res.json({ error: "Filter product wrong" });
      }
    }
  }

  async getWishProduct(req, res) {
    let { productArray } = req.body;
    if (!productArray) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let wishProducts = await productModel.find({
          _id: { $in: productArray },
        });
        if (wishProducts) {
          return res.json({ Products: wishProducts });
        }
      } catch (err) {
        return res.json({ error: "Filter product wrong" });
      }
    }
  }

  async getCartProduct(req, res) {
    let { productArray } = req.body;
    if (!productArray) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let cartProducts = await productModel.find({
          _id: { $in: productArray },
        });
        if (cartProducts) {
          return res.json({ Products: cartProducts });
        }
      } catch (err) {
        return res.json({ error: "Cart product wrong" });
      }
    }
  }

  async postAddReview(req, res) {
    let { pId, uId, rating, review } = req.body;
    if (!pId || !rating || !review || !uId) {
      return res.json({ error: "All filled must be required" });
    } else {
      let checkReviewRatingExists = await productModel.findOne({ _id: pId });
      if (checkReviewRatingExists.pRatingsReviews.length > 0) {
        checkReviewRatingExists.pRatingsReviews.map((item) => {
          if (item.user === uId) {
            return res.json({ error: "Your already reviewd the product" });
          } else {
            try {
              let newRatingReview = productModel.findByIdAndUpdate(pId, {
                $push: {
                  pRatingsReviews: {
                    review: review,
                    user: uId,
                    rating: rating,
                  },
                },
              });
              newRatingReview.exec((err, result) => {
                if (err) {
                  console.log(err);
                }
                return res.json({ success: "Thanks for your review" });
              });
            } catch (err) {
              return res.json({ error: "Cart product wrong" });
            }
          }
        });
      } else {
        try {
          let newRatingReview = productModel.findByIdAndUpdate(pId, {
            $push: {
              pRatingsReviews: { review: review, user: uId, rating: rating },
            },
          });
          newRatingReview.exec((err, result) => {
            if (err) {
              console.log(err);
            }
            return res.json({ success: "Thanks for your review" });
          });
        } catch (err) {
          return res.json({ error: "Cart product wrong" });
        }
      }
    }
  }

  async deleteReview(req, res) {
    let { rId, pId } = req.body;
    if (!rId) {
      return res.json({ message: "All filled must be required" });
    } else {
      try {
        let reviewDelete = productModel.findByIdAndUpdate(pId, {
          $pull: { pRatingsReviews: { _id: rId } },
        });
        reviewDelete.exec((err, result) => {
          if (err) {
            console.log(err);
          }
          return res.json({ success: "Your review is deleted" });
        });
      } catch (err) {
        console.log(err);
      }
    }
  }

}

const productController = new Product();
module.exports = productController;
