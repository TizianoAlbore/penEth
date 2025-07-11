const fs = require("fs");
const categoryModel = require("../models/categories");
const productModel = require("../models/products");
const orderModel = require("../models/orders");
const userModel = require("../models/users");
const customizeModel = require("../models/customize");
const path = require('path');
const Curl = require('node-libcurl').Curl;

class Customize {

  checkIsImage(userHeaders) {
    const defaultHeaders = { 'content-type': '' };
    const headers = merge({}, defaultHeaders, userHeaders);
    return typeof headers['content-type'] === 'string' &&
      headers['content-type'].startsWith('image/');
  }

  // viene chiamata da getImageFromUrl
  // 👆 const Curl = require('node-libcurl').Curl;

  /*async fetchImageFromUrl(url) {
    console.log('chiamata: fetchImageFromUrl');

    return new Promise((resolve, reject) => {
      const curl = new Curl();
      const data = [];

      curl.setOpt('URL', url);
      curl.setOpt('FOLLOWLOCATION', true);
      curl.setOpt('TIMEOUT', 10);
      curl.setOpt('USERAGENT', 'Mozilla/5.0');

      curl.on('data', chunk => {
        // chunk è un Buffer
        data.push(chunk);
      });

      curl.on('end', (statusCode, body, headers) => {
        const buffer = Buffer.concat(data); // Unisci tutti i chunk binari
        const lastHeader = Array.isArray(headers) ? headers.at(-1) : headers;
        const contentType = lastHeader?.['content-type'] || 'image/jpeg';

        console.log('✅ fetchImageFromUrl success: buffer.length =', buffer.length);
        resolve({ buffer, contentType });
        curl.close();
      });

      curl.on('error', err => {
        console.error('❌ Curl error:', err);
        curl.close();
        reject(err);
      });

      curl.perform();
    });
  }

  async getImageFromUrl(req, res) {
    console.log('chiamata: getImageFromUrl (backend)')
    const { url } = req.body;
    console.log('req.body: ', req.body)
    console.log('Polluted? logging req.body.hostname -->', req.body.hostname)
    try {
      const { buffer, contentType } = await this.fetchImageFromUrl(url);

      // if (!checkIsImage({ 'content-type': contentType })) {
      // throw new Error('Non è un\'immagine valida');
      // }

      res.set('Content-Type', contentType); // diciamo al browser che sta ricevendo un’immagine
      res.send(buffer);
    } catch (err) {
      const size = 4;
      const buffer = Buffer.alloc(size * size * 4, 255);
      res.status(500).set('Content-Type', 'image/png').send(buffer);
    }
  }
  */


  // gopher://redis:6379/_%0D%0ASET%20evilkey4%20evilvalue%0D%0A
  // https://picsum.photos/200
  async getImageFromUrl(req, res) {
    console.log('📥 Richiesta ricevuta: getImageFromUrl (image fetch)');
    const { url } = req.body;
    console.log('🔗 URL ricevuto:', url);

    const curl = new Curl();
    const chunks = [];

    try {
      curl.setOpt(Curl.option.URL, url);
      curl.setOpt(Curl.option.TIMEOUT, 10);
      curl.setOpt(Curl.option.FOLLOWLOCATION, true);
      curl.setOpt(Curl.option.USERAGENT, 'Mozilla/5.0');

      curl.on('data', chunk => chunks.push(chunk));

      curl.on('end', (statusCode, body, headers) => {
        const buffer = Buffer.concat(chunks);
        const contentType = Array.isArray(headers)
          ? headers.at(-1)?.['content-type'] || 'image/jpeg'
          : 'image/jpeg';

        console.log('✅ Risposta ricevuta, lunghezza:', buffer.length);

        res.set('Content-Type', contentType);
        res.send(buffer);

        curl.close();
      });

      curl.on('error', (err) => {
        console.error('❌ Errore nel recupero:', err.message);

        if (!res.headersSent) {
          res.status(500).json({ success: false, error: err.message });
        }

        curl.close();
      });

      curl.perform();

    } catch (err) {
      console.error('❌ Eccezione:', err.message);

      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err.message });
      }

      curl.close();
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
