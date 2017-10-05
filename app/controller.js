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
              'X-Auth-Client': id,
              'X-Auth-Token' : token,
              'Accept'       : 'application/json',
              'Content-Type' : 'application/json'
          }
      };
      console.log(options);
      fs.mkdir(path.join(__dirname,'../',`images${id}/`), () => {
          console.log('Created '+id)
      });

      request.get(options, (err, response, body) => {
          const foo = JSON.parse(body);
          if(err){console.log(err);}
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

  submitTwo: (req,res) => {
      const hash = req.body.url;
      const url = `https://api.bigcommerce.com/stores/${hash}/v3`;
      const id = req.body.name;
      const token = req.body.token;
      let options = {
          url: url+'/catalog/products',
          headers: {
              'X-Auth-Client': id,
              'X-Auth-Token' : token,
              'Accept'       : 'application/json',
              'Content-Type' : 'application/json',
          }
      };
      fs.mkdir(path.join(__dirname,'../',`images${id}/`), () => {
          console.log('Created '+id)
      });
      console.log(options);
      request.get(options, (err,response,body) => {
          const products = (JSON.parse(body).data);
          let productIds = [];
          let names = [];
          products.forEach((i)=>{
              productIds.push(i.id);
              names.push(i.name.replace(/\s/g,''));
          });

          productIds.forEach((i,j) => {
              let tempOptions = options;
              tempOptions.url = `https://api.bigcommerce.com/stores/${hash}/v3/catalog/products/${i}/images`;
              request.get(tempOptions, (err,res,body) => {
                  const data = JSON.parse(body).data[0];
                  if(!data){

                     productIds.splice(j,1);
                     names.splice(j,1);
                  }
              })
          });




          setTimeout(() => {
              console.log(productIds);
              productIds.forEach((i, j) => {
                  let tempOptions = options;
                  tempOptions.url = `https://api.bigcommerce.com/stores/${hash}/v3/catalog/products/${i}/images`;
                  console.log(tempOptions);
                  request.get(tempOptions, (err, responseTwo, images) => {
                      const data = JSON.parse(images).data[0];
                      let url = (data.url_zoom);
                      download(url, `images${id}/${names[j]}${j === 0 ? '' : '-' + pad(j, 4)}`, () => {
                          setTimeout(() => {
                              if (j === productIds.length - 1) {
                                  let output = fs.createWriteStream(__dirname + `/pictures${id.slice(4, 8)}.zip`);

                                  let archive = archiver('zip', {
                                      zlib: {level: 9}
                                  });

                                  output.on('close', () => {
                                      res.download(__dirname + `/pictures${id.slice(4, 8)}.zip`, () => {
                                          deleteImages(id);
                                          fs.unlink(__dirname + `/pictures${id.slice(4, 8)}.zip`, () => {
                                              console.log('Deleted Zip File')
                                          })
                                      });

                                  });


                                  archive.pipe(output);
                                  archive.directory(path.join(__dirname, '../', `/images${id}/`), false);
                                  archive.finalize();
                              }
                          }, 80)
                      })
                  })
              })
          }, 2000);
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