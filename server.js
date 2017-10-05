const express = require('express'),
      path    = require('path'),
      expressLayouts = require('express-ejs-layouts'),
      bodyParser = require('body-parser'),
      port = process.env.PORT || 8080,
      app     = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.use(expressLayouts);

app.use(require('./app/routes'));


app.listen(port, () => {
   console.log('app is running');
});