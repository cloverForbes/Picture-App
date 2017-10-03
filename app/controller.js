const  fs = require('fs'),
       path = require('path'),
       request = require('request'),
       archiver = require('archiver');


module.exports = {
  showHome : (req,res) => {

      /*const url = 'https://api.bigcommerce.com/stores/et6hidb37e/v2/products';
      const id = 'ris8bseq50w7i9b0h4cynycftc4zbj8';
      const token = 'svop48vqxuyalh0ayhj8vro7vqivju7';

      const options = {
          url: url,
          headers: {
              'Accept': 'application/json',
              'X-Auth-Client': id,
              'X-Auth-Token' : token
          }
      };

      request.get(options, (err, response, body) => {
          const data = JSON.parse(body);
          let arr = [];
      })*/

      download('https://www.google.com/images/srpr/logo3w.png', 'images/google.png', () => {
         let output = fs.createWriteStream(__dirname + '/example.zip');

         let archive = archiver('zip', {
            zlib: {level: 9}
         });

          output.on('close', () => {
              console.log(archive.pointer() + 'total bytes');
              console.log('archive has been finalized and the output file has been closed');
              res.sendFile(__dirname + '/example.zip');

          });


          archive.pipe(output);
          archive.directory(path.join(__dirname, '../', '/images/'), false);
          archive.finalize();

      });


  }
};

const download = function(uri, filename, callback){
    request.get(uri, function(err, res, body){

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);

    });
};
