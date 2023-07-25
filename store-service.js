const { Post } = require("./models");

const Sequelize = require('sequelize');
var sequelize = new Sequelize('hpbfkvea', 'hpbfkvea', 'Wq2wXYY_PAy3PkF6xgGNjC8zihiZ-EZt', {
  host: 'stampy.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});

// Define the Item model
const Item = sequelize.define('item', {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE
});

// Define the Category model
const Category = sequelize.define('category', {
  category: Sequelize.STRING
});

// Define the relationship
Item.belongsTo(Category, { foreignKey: 'category' });

// Function to initialize the database
function initialize() {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject("Unable to sync the database");
      });
  });
}

function getAllItems() {
  return Item.findAll().then((items) => {
    if (items.length > 0) {
      return Promise.resolve(items);
    } else {
      return Promise.reject("No results returned");
    }
  });
}

function getItemsByCategory(category) {
  return Item.findAll({
    where: { category }
  }).then((items) => {
    if (items.length > 0) {
      return Promise.resolve(items);
    } else {
      return Promise.reject("No results returned");
    }
  });
}

function getItemsByMinDate(minDateStr) {
  const { gte } = Sequelize.Op;
  return Item.findAll({
    where: {
      postDate: {
        [gte]: new Date(minDateStr)
      }
    }
  }).then((items) => {
    if (items.length > 0) {
      return Promise.resolve(items);
    } else {
      return Promise.reject("No results returned");
    }
  });
}

function getItemById(id) {
  return Item.findByPk(id).then((item) => {
    if (item) {
      return Promise.resolve(item);
    } else {
      return Promise.reject("No results returned");
    }
  });
}

function addItem(itemData) {
  itemData.published = itemData.published ? true : false;

  for (const key in itemData) {
    if (itemData[key] === "") {
      itemData[key] = null;
    }
  }

  itemData.postDate = new Date();

  return Item.create(itemData)
    .then(() => {
      return Promise.resolve();
    })
    .catch((err) => {
      return Promise.reject("Unable to create post");
    });
}

function getPublishedItems() {
  return Item.findAll({
    where: { published: true }
  }).then((items) => {
    if (items.length > 0) {
      return Promise.resolve(items);
    } else {
      return Promise.reject("No results returned");
    }
  });
}

function getPublishedItemsByCategory(category) {
  return Item.findAll({
    where: {
      category,
      published: true
    }
  }).then((items) => {
    if (items.length > 0) {
      return Promise.resolve(items);
    } else {
      return Promise.reject("No results returned");
    }
  });
}

function getCategories() {
  return Category.findAll().then((categories) => {
    if (categories.length > 0) {
      return Promise.resolve(categories);
    } else {
      return Promise.reject("No results returned");
    }
  });
}

function addCategory(categoryData) {
  categoryData.category = categoryData.category.trim() || null;

  return Category.create(categoryData)
    .then(() => {
      return Promise.resolve();
    })
    .catch((err) => {
      return Promise.reject("Unable to create category");
    });
}

function deleteCategoryById(id) {
  return Category.destroy({ where: { id } });
}

function deletePostById(id) {
  return Post.destroy({ where: { id } });
}


module.exports = {
  formatDate,
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories,
  addItem,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  getPublishedItemsByCategory,
  addCategory,
  deleteCategoryById,
  deletePostById,
  Item,
  Category
};
