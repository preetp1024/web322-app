/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Preet Patel Student ID: 175058213 Date: 30th June 2023
*
*  Cyclic Web App URL: https://defiant-gold-hedgehog.cyclic.app/
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



// setup a 'route' to listen on the default URL path
app.get("/", (req, res) => {
  res.redirect("/shop");
});

app.get("/about", (req, res) => {
  res.render('about');
});

app.get("/items/add", (req, res) => {
  res.render('addItem');
});


app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let items = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      items = await itemData.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await itemData.getPublishedItems();
    }

    // sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let post = items[0];

    // store the "items" and "post" data in the viewData object (to be passed to the view)
    viewData.items = items;
    viewData.item = item;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await itemData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
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
      res.render("categories", { categories: categories });
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


app.get('/shop/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "item" objects
      let items = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          items = await itemData.getPublishedItemsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          items = await itemData.getPublishedItems();
      }

      // sort the published items by postDate
      items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // store the "items" and "item" data in the viewData object (to be passed to the view)
      viewData.items = items;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the item by "id"
      viewData.item = await itemData.getItemById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      // Obtain the full list of "categories"
      let categories = await itemData.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", {data: viewData})
});

// Middleware for handling 404 errors
app.use((req, res, next) => {
  res.status(404).render("404");
});


app.use((req, res) => {
  res.status(404).send("ERROR 404: Page not Found");
});
