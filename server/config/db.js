const mongoose = require("mongoose");


try {
  const uri = process.env.DATABASE || 'mongodb://mongo:27017/ecommerce';
  mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true 
  }); 
  console.log("Database Connected Successfully");
} catch (err) {
  console.log("Database Not Connected");
}
