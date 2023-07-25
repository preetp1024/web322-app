/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part of this
*  assignment has been copied manually or electronically from any other source (including web sites) or 
*  distributed to other students.
* 
*  Name: Preet Patel Student ID: 175058213 Date: 24th July 2023
*
*  Cyclic Web App URL: https://defiant-gold-hedgehog.cyclic.app/shop
*
*  GitHub Repository URL: https://github.com/preetp1024/web322-app.git
*
********************************************************************************/ 


const store_service = require("./store-service.js");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: "dnx50uyrz",
  api_key: "919163888773763",
  api_secret: "eaPrzdbhZVFLaMMzerGliAswdCg",
  secure: true,
});

const upload = multer();

var port = process.env.PORT || 8080;
var express = require("express");
var app = express();
const exphbs = require('express-handlebars');

const hbs = exphbs.create({
  extname: '.hbs' 
});

app.engine('.hbs', hbs.engine);

app.set('view engine', '.hbs');

app.use(express.urlencoded({extended: true}));

store_service
  .initialize()
  .then(() => {
    app.listen(port, () => {
      console.log("Express http server listening on port " + port);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize store service:", error);
  });

app.use(express.static("public"));

app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

hbs.handlebars.registerHelper('navLink', function (url, options) {
  return (
    '<li class="nav-item"><a ' + 
    (url ==  app.locals.activeRoute ? ' class="nav-link active" ' : 'class="nav-link" ') + 
    'href="' +
    url +
    '">' +
    options.fn(this) +
    "</a></li>"
  );
});

hbs.handlebars.registerHelper('equal', function (lvalue, rvalue, options) {
  if (arguments.length < 3) {
    throw new Error("Handlebars Helper equal needs 2 parameters");
  }

  if (lvalue != rvalue) {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }
});

app.get("/", (req, res) => {
  res.redirect("/shop");
});

app.get("/about", (req, res) => {
  res.render('about');
});

app.get("/items/add", (req, res) => {
  store_service.getCategories()
    .then((categories) => {
      res.render('addPost', { categories: categories });
    })
    .catch((error) => {
      console.error("Failed to fetch categories:", error);
      res.render('addPost', { categories: [] });
    });
});

app.get("/categories/add", (req, res) => {
  res.render('addCategory');
});

app.get("/shop", async (req, res) => {
  let viewData = {};

  try {
    let items = [];

    if (req.query.category) {
      items = await store_service.getPublishedItemsByCategory(req.query.category);
    } else {
      items = await store_service.getPublishedItems();
    }

    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    viewData.items = items;

    if (viewData.items.length === 0) {
      viewData.message = "no results";
    }
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    let categories = await store_service.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  res.render("shop", { data: viewData });
});

app.get("/items", (req, res) => {
  const { category, minDate } = req.query;

  if (category) {
    store_service
      .getItemsByCategory(category)
      .then((items) => {
        res.render("items", { items: items });
      })
      .catch((error) => {
        res.render("items", { message: "no results" });
      });
  } else if (minDate) {
    store_service
      .getItemsByMinDate(minDate)
      .then((items) => {
        res.render("items", { items: items });
      })
      .catch((error) => {
        res.render("items", { message: "no results" });
      });
  } else {
    store_service
      .getAllItems()
      .then((items) => {
        res.render("items", { items: items });
      })
      .catch((error) => {
        res.render("items", { message: "no results" });
      });
  }
});

app.get("/item/:id", (req, res) => {
  const itemId = req.params.id;

  store_service
    .getItemById(itemId)
    .then((item) => {
      res.send(item);
    })
    .catch((error) => {
      res.send({ message: error });
    });
});

app.get("/categories", (req, res) => {
  store_service
    .getCategories()
    .then((categories) => {
      if (categories.length === 0) {
        res.render("categories", { message: "no results" });
      } else {
        res.render("categories", { categories: categories });
      }
    })
    .catch((error) => {
      res.render("categories", { message: "no results" });
    });
});

app.post('/items/add', upload.single('featureImage'), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function uploadToCloudinary(req) {
      try {
        let uploaded = await streamUpload(req);
        processItem(uploaded.url);
      } catch (error) {
        console.error(error);
      }
    }

    uploadToCloudinary(req);
  } else {
    processItem('');
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;

    store_service.addItem(req.body)
      .then((newItem) => {
        console.log("New item added:", newItem);
        res.redirect('/items');
      })
      .catch((error) => {
        console.error("Failed to add item:", error);
        res.redirect('/items');
      });
  }
});

app.post('/categories/add', (req, res) => {
  store_service.addCategory(req.body)
    .then(() => {
      res.redirect('/categories');
    })
    .catch((error) => {
      console.error("Failed to add category:", error);
      res.redirect('/categories');
    });
});

app.get('/categories/delete/:id', (req, res) => {
  const categoryId = req.params.id;

  store_service.deleteCategoryById(categoryId)
    .then(() => {
      res.redirect('/categories');
    })
    .catch((error) => {
      res.status(500).send("Unable to Remove Category / Category not found");
    });
});

app.get("/items/delete/:id", (req, res) => {
  const itemId = req.params.id;

  store_service
    .deletePostById(itemId)
    .then(() => {
      res.redirect("/items");
    })
    .catch((error) => {
      res.status(500).send("Unable to Remove Post / Post not found");
    });
});
app.get('/shop/:id', async (req, res) => {
  let viewData = {};

  try {
    let items = [];

    if (req.query.category) {
      items = await store_service.getPublishedItemsByCategory(req.query.category);
    } else {
      items = await store_service.getPublishedItems();
    }

    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    viewData.items = items;

    if (viewData.items.length === 0) {
      viewData.message = "no results";
    }
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    viewData.item = await store_service.getItemById(req.params.id);
  } catch (err) {
    viewData.message = "no results"; 
  }

  try {
    let categories = await store_service.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  res.render("shop", { data: viewData });
});

app.use((req, res, next) => {
  res.status(404).render("404");
});

app.use((req, res) => {
  res.status(404).send("ERROR 404: Page not Found");
});
