const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  body: String,
  title: String,
  postDate: Date,
  featureImage: String,
  published: Boolean,
  price: Number,
  category: String // Assuming you have a category field in the item schema
});

const CategorySchema = new mongoose.Schema({
  category: String
});

const Item = mongoose.model('Item', ItemSchema);
const Category = mongoose.model('Category', CategorySchema);

function initialize() {
  return mongoose.connect('mongodb+srv://preetp1024:February_1523@cluster0.hc7wyrh.mongodb.net/web322?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}

function getAllItems() {
  return Item.find();
}

function getItemById(id) {
  return Item.findById(id);
}

function addItem(itemData) {
  return Item.create(itemData);
}

function getCategories() {
  return Category.find();
}

function addCategory(categoryData) {
  return Category.create(categoryData);
}

module.exports = {
  initialize,
  getAllItems,
  getItemById,
  addItem,
  getCategories,
  addCategory
};
