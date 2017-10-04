const  fs = require('fs'),
       path = require('path'),
       request = require('request'),
       archiver = require('archiver'),
       rimraf  = require('rimraf');

module.exports = {

  submit : (req,res) => {
      
      const url = `${req.body.url}products`;
      const id = req.body.name;
      const token = req.body.token;
      let options = {
          url: url,
          headers: {
              'Accept': 'application/json',
              'X-Auth-Client': id,
              'X-Auth-Token' : token
          }
      };
      /*getName(options);*/
      fs.mkdir(path.join(__dirname,'../',`images${id}/`), () => {
          console.log('Created '+id)
      });

      request.get(options, (err, response, body) => {
          const foo = JSON.parse(body);
          foo.forEach((i, j) => {
              let name = i.name.replace(/\s/g,'');
              let url = i.images.url;
              options.url = url;
              request.get(options, (err, response, body) => {
                  let data = JSON.parse(body);
                  for(let x = 0; x < data.length; x++){
                      let i = data[x];
                      let url = i.zoom_url;
                      download(url, `images${id}/${name}${x === 0 ? '': '-'+ pad(x, 4)}`,() => {
                          setTimeout(() => {
                              if(j === foo.length - 1 && x === data.length -1 ){
                                  let output = fs.createWriteStream(__dirname + `/pictures${id.slice(4,8)}.zip`);

                                  let archive = archiver('zip', {
                                      zlib: {level: 9}
                                  });

                                  output.on('close', () => {
                                      res.download(__dirname + `/pictures${id.slice(4,8)}.zip`,() => {
                                         deleteImages(id);
                                         fs.unlink(__dirname + `/pictures${id.slice(4,8)}.zip` , () => {
                                             console.log('Deleted Zip File')
                                         })
                                      });

                                  });


                                  archive.pipe(output);
                                  archive.directory(path.join(__dirname, '../', `/images${id}/`), false);
                                  archive.finalize();
                              }
                          },80)
                      })
                  }
              })
          })

      })
  },

  showHome: (req,res) => {
      res.render('pages/index');
  }
};


const download = function(uri, filename, callback){
    request.get(uri, function(err, res, body){

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);

    });
};

const deleteImages = id => {
    let imagesPath = path.join(__dirname,'../',`images${id}/`);
    rimraf(imagesPath, () => {
        console.log('removed Images');
    })

};

const pad = (n, width, z) => {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

const getName = options => {
    let temp = options;
    temp.url = temp.url.replace('products', 'store');
    console.log(temp);
    request.get(temp, (err, res, body)=> {
        console.log(err);
        console.log(res);
        console.log(body);
    })
};