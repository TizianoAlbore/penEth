const fs = require("fs");
const categoryModel = require("../models/categories");
const productModel = require("../models/products");
const orderModel = require("../models/orders");
const userModel = require("../models/users");
const customizeModel = require("../models/customize");
const fetch = require('node-fetch');
const merge = require('lodash.merge');
const dns = require('dns').promises;
const net = require('net');

function isPrivateIP(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    return parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254);
  }
  if (net.isIPv6(ip)) {
    return ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd00:');
  }
  return false;
}

async function isBlockedURL(urlString) {
  try {
    const parsed = new URL(urlString);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return true;
    }
    const hostname = parsed.hostname;
    if (['localhost', '0.0.0.0'].includes(hostname)) {
      return true;
    }
    if (net.isIP(hostname)) {
      return isPrivateIP(hostname);
    }
    const addresses = await dns.lookup(hostname, { all: true });
    return addresses.some(addr => isPrivateIP(addr.address));
  } catch (err) {
    return true;
  }
}

class Customize {


  // FUNZIONE INQUINABILE DA PROTOTYPE POLLUTION
  checkIsImage(userHeaders) {
    const defaultHeaders = { 'content-type': '' };
    const headers = merge({}, defaultHeaders, userHeaders);
    return typeof headers['content-type'] === 'string' &&
      headers['content-type'].startsWith('image/');
  }

  // FUNZIONE CHE PRENDE LE IMMAGINI DA URL PER SSRF
  async getImageFromUrl(req, res) {
    const { url } = req.body;

    try {
      if (await isBlockedURL(url)) {
        return res.status(400).send('Invalid image URL');
      }
      const response = await fetch(url);
      const contentType = response.headers.get('content-type');

      //if (!checkIsImage({ 'content-type': contentType })) {
      //  return res.status(400).send('Non è un\'immagine valida');
      //}

      const buffer = await response.buffer(); // buffer è una rappresentazione binaria dell'immagine
      res.set('Content-Type', contentType); // diciamo al browser che sta ricevendo un’immagine
      res.send(buffer);
    } catch (err) {
      res.status(500).send('Errore nel download');
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
