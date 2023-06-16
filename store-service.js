const fs = require("fs");

let items = [];
let categories = [];

function initialize() {
  return new Promise((resolve, reject) => {
    fs.readFile("./data/items.json", "utf8", (err, data) => {
      if (err) {
        reject("Unable to read items file.");
        return;
      }

      try {
        items = JSON.parse(data);
        fs.readFile("./data/categories.json", "utf8", (err, data) => {
          if (err) {
            reject("Unable to read categories file.");
            return;
          }

          try {
            categories = JSON.parse(data);
            resolve();
          } catch (error) {
            reject("Unable to parse categories data.");
          }
        });
      } catch (error) {
        reject("Unable to parse items data.");
      }
    });
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      reject("No items found.");
    } else {
      resolve(items);
    }
  });
}

function getPublishedItems() {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter((item) => item.published);
    if (publishedItems.length === 0) {
      reject("No published items found.");
    } else {
      resolve(publishedItems);
    }
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    if (categories.length === 0) {
      reject("No categories found.");
    } else {
      resolve(categories);
    }
  });
}

function addItem(itemData) {
  return new Promise((resolve) => {
    if (itemData.published === undefined) {
      itemData.published = false;
    } else {
      itemData.published = true;
    }

    itemData.id = items.length + 1;

    items.push(itemData);

    resolve(itemData);
  });
}

module.exports = {
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories,
  addItem,
};
