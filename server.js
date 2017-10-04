const express = require('express'),
      path    = require('path'),
      expressLayouts = require('express-ejs-layouts'),
      bodyParser = require('body-parser'),
      app     = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.use(expressLayouts);

app.use(require('./app/routes'));


app.listen(8080, () => {
   console.log('app is running');
});