const fs = require("fs");
const path = require("path");
const categoryModel = require("../models/categories");
const productModel = require("../models/products");
const orderModel = require("../models/orders");
const userModel = require("../models/users");
const customizeModel = require("../models/customize");
const fetch = require("node-fetch");
const merge = require("lodash.merge");

class Customize {


  checkIsImage(userHeaders) {
    const defaultHeaders = { 'content-type': '' };
    const headers = merge({}, defaultHeaders, userHeaders);
    return typeof headers['content-type'] === 'string' &&
      headers['content-type'].startsWith('image/');
  }

  async fetchImageFromUrl(url) {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    const buffer = await response.buffer();
    return { buffer, contentType };
  }

  async getImageFromUrl(req, res) {
    const { url } = req.body;

    try {
      const { buffer, contentType } = await this.fetchImageFromUrl(url);
      //if (!checkIsImage({ 'content-type': contentType })) {
      //  return res.status(400).send('Non è un\'immagine valida');
      //}

      res.set('Content-Type', contentType); // diciamo al browser che sta ricevendo un’immagine
      res.send(buffer);
    } catch (err) {
      const size = 64; // 64x64 pixels
      const buffer = Buffer.alloc(size * size * 4, 255); // RGBA, all bits set to 1
      res.set('Content-Type', 'image/png');
      res.status(500).send(buffer);
    }
  }

  async getImages(req, res) {
    try {
      let Images = await customizeModel.find({});
      if (Images) {
        return res.json({ Images });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async uploadSlideImage(req, res) {
    let image = req.file.filename;
    if (!image) {
      return res.json({ error: "All field required" });
    }
    try {
      let newCustomzie = new customizeModel({
        slideImage: image,
      });
      let save = await newCustomzie.save();
      if (save) {
        return res.json({ success: "Image upload successfully" });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async deleteSlideImage(req, res) {
    let { id } = req.body;
    if (!id) {
      return res.json({ error: "All field required" });
    } else {
      try {
        let deletedSlideImage = await customizeModel.findById(id);
        const filePath = path.resolve(__dirname, "..", "public", "uploads", "customize", deletedSlideImage.slideImage);

        let deleteImage = await customizeModel.findByIdAndDelete(id);
        if (deleteImage) {
          // Delete Image from uploads -> customizes folder
          fs.unlink(filePath, (err) => {
            if (err) {
              console.log(err);
            }
            return res.json({ success: "Image deleted successfully" });
          });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getAllData(req, res) {
    try {
      const Categories = await categoryModel.countDocuments();
      const Products = await productModel.countDocuments();
      const Orders = await orderModel.countDocuments();
      const Users = await userModel.countDocuments();

      return res.json({ Categories, Products, Orders, Users });

    } catch (err) {
      console.log(err);
    }
  }
}

const customizeController = new Customize();
module.exports = customizeController;
