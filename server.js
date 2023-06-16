/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Preet Patel
Student ID: 175058213
Date: 29th May 2023
Cyclic Web App URL: https://tiny-sundress-lamb.cyclic.app/about
GitHub Repository URL: https://github.com/preetp1024/web322-app.git

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

// setup a 'route' to listen on the default URL path
app.get("/", (req, res) => {
  res.redirect("/about");
});

// Return the about.html file from the 'views' folder
app.get("/about", (req, res) => {
  res.sendFile(__dirname + "/views/about.html");
});

app.get("/items/add", (req, res) => {
  res.sendFile(__dirname + "/views/addItem.html");
});

app.get("/shop", (req, res) => {
  store_service
    .getPublishedItems()
    .then((items) => {
      res.send(items);
    })
    .catch((error) => {
      res.send({ message: error });
    });
});

app.get("/items", (req, res) => {
  const { category, minDate } = req.query;

  if (category) {
    store_service
      .getItemsByCategory(category)
      .then((items) => {
        res.send(items);
      })
      .catch((error) => {
        res.send({ message: error });
      });
  } else if (minDate) {
    store_service
      .getItemsByMinDate(minDate)
      .then((items) => {
        res.send(items);
      })
      .catch((error) => {
        res.send({ message: error });
      });
  } else {
    store_service
      .getAllItems()
      .then((items) => {
        res.send(items);
      })
      .catch((error) => {
        res.send({ message: error });
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
      res.send(categories);
    })
    .catch((error) => {
      res.send({ message: error });
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


app.use((req, res) => {
  res.status(404).send("ERROR 404: Page not Found");
});
