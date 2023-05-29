const store_service = require("./store-service.js");

var port = process.env.PORT || 8080;
var express = require("express");
var app = express();

store_service.initialize()
  .then(() => {
    app.listen(port, () => {
      console.log('Express http server listening on port ' + port);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize store service:', error);
  });

app.use(express.static('public'));

// setup a 'route' to listen on the default URL path
app.get('/', (req, res) => {
  res.redirect('/about');
});

// Return the about.html file from the 'views' folder
app.get('/about', (req, res) => {
  res.sendFile('C:/Users/preet/OneDrive/Desktop/My web322 work/WEB322-App/views/about.html');
});

app.get('/shop', (req, res) => {
  store_service.getPublishedItems()
    .then((items) => {
      res.send(items);
    })
    .catch((error) => {
      res.send({ message: error });
    });
});

app.get('/items', (req, res) => {
  store_service.getAllItems()
    .then((items) => {
      res.send(items);
    })
    .catch((error) => {
      res.send({ message: error });
    });
});

app.get('/categories', (req, res) => {
  store_service.getCategories()
    .then((categories) => {
      res.send(categories);
    })
    .catch((error) => {
      res.send({ message: error });
    });
});

app.use((req, res) => {
  res.status(404).send('ERROR 404: Page not Found');
});
