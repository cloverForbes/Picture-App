const express = require('express'),
      router  = express.Router(),
      controller = require('./controller');

module.exports = router;

router.get('/', controller.showHome);
router.post('/submit', controller.submitTwo);

