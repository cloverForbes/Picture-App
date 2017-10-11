const  fs = require('fs'),
       path = require('path'),
       request = require('request'),
       archiver = require('archiver'),
       toolbox  = require('bc-api-toolbox');
       rimraf  = require('rimraf');

module.exports = {

  submitTwo: (req,res) => {
      const hash = req.body.url;
      const url = `https://api.bigcommerce.com/stores/${hash}/v3`;
      const id = req.body.name;
      const token = req.body.token;
      let total = 0;
      let current = 0;
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
      request.get(options, (err,response,body) => {
          const products = (JSON.parse(body).data);
          console.log(products.length);
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

          setTimeout(()=> {
              let tempOptions = options;
              productIds.forEach((i, j) => {
                  tempOptions.url = `https://api.bigcommerce.com/stores/${hash}/v3/catalog/products/${i}/images`;
                  request.get(tempOptions, (err, responseTwo, images) => {
                      const data = JSON.parse(images).data;
                      total += data.length;
                  })
              })
          }, 3000);




          setTimeout(() => {
              console.log(total);
              let tempOptions = options;
              productIds.forEach((i, j) => {
                  tempOptions.url = `https://api.bigcommerce.com/stores/${hash}/v3/catalog/products/${i}/images`;
                  request.get(tempOptions, (err, responseTwo, images) => {
                      const data = JSON.parse(images).data;
                      data.forEach((i,index) => {
                          let url = (i.url_zoom);
                          download(url, `images${id}/${names[j]}${index === 0 ? '' : '-' + pad(index, 4)}`, () => {
                              current++;
                              /*drawStatus(current,total);*/
                              console.log(current);
                              console.log(total);
                              setTimeout(() => {
                                  if (current === total)  {
                                      console.log('beggining zip');
                                      let output = fs.createWriteStream(__dirname + `/pictures${id.slice(4, 8)}.zip`);

                                      let archive = archiver('zip', {
                                          zlib: {level: 1}
                                      });


                                      archive.on('progress', () => {
                                         console.log(archive)
                                      });


                                      output.on('close', () => {
                                          res.download(__dirname + `/pictures${id.slice(4, 8)}.zip`, () => {
                                              deleteImages(id);
                                              fs.unlink(__dirname + `/pictures${id.slice(4, 8)}.zip`, () => {
                                                  console.log('Deleted Zip File')
                                              });
                                          });

                                      });


                                      archive.pipe(output);
                                      archive.directory(path.join(__dirname, '../', `/images${id}/`), false);
                                      archive.finalize();
                                  }
                              })
                          })
                      })
                  })
              })
          }, 5000);
      })
  },

  submitThree : (req,res) => {
      const hash = req.body.url;
      const id = req.body.name;
      const token = req.body.token;
      const myStore = new toolbox(token,id,hash);
      let   urlArray = [];
      const urlFull = new Promise((resolve,reject) => {
          myStore.getProductIds(ids =>{
              ids.forEach((id,index) => {
                  console.log(index);
                  myStore.getProductImageUrls(id, urls => {
                      console.log(id);
                      urlArray.push(urls);
                      if(urlArray.length === ids.length){
                          resolve(urlArray);
                      }

                  })
              })
          })
      });


      urlFull.then(urls => {
          let processed = 0;
          const imageUrls = flat(urls);
          fs.mkdir(path.join(__dirname,'../',`images${myStore.hash}/`), () => {
              console.log('Created '+id)
          });
          imageUrls.forEach((url, num) => {
              download(url, `images${myStore.hash}/${num}`, () => {
                  processed++;
                  if(processed === imageUrls.length){
                      console.log('beggining zip');
                       let output = fs.createWriteStream(__dirname + `/pictures${myStore.hash}.zip`);

                       let archive = archiver('zip', {
                           zlib: {level: 8}
                       });


                       archive.on('progress', () => {
                           console.log('archived');
                       });


                       output.on('close', () => {
                           res.download(__dirname + `/pictures${myStore.hash}.zip`, () => {
                               deleteImages(id);
                               fs.unlink(__dirname + `/pictures${myStore.hash}.zip`, () => {
                                   console.log('Deleted Zip File')
                               });
                           });

                       });


                       archive.pipe(output);
                       archive.directory(path.join(__dirname, '../', `/images${myStore.hash}/`), false);
                       archive.finalize();
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

const drawStatus = (current, total) =>{
    let status = '';
    for(let x = 0; x < current; x++){
        status = status.concat('#');
    }
    for(let x = 0; x < total - current; x++){
        status = status.concat(' ');
    }
    console.log(`[${status}]`)
};

const flat = array => {
  let final = [];
  array.forEach(arr => {
      final = final.concat(arr);
  });

  return final;
};

console.reset = function () {
    return process.stdout.write('\033c');
};

/*console.log('beggining zip');
                      let output = fs.createWriteStream(__dirname + `/pictures${myStore.hash}.zip`);

                      let archive = archiver('zip', {
                          zlib: {level: 8}
                      });


                      archive.on('progress', () => {
                          console.log('archived');
                      });


                      output.on('close', () => {
                          res.download(__dirname + `/pictures${myStore.hash}.zip`, () => {
                              deleteImages(id);
                              fs.unlink(__dirname + `/pictures${myStore.hash}.zip`, () => {
                                  console.log('Deleted Zip File')
                              });
                          });

                      });


                      archive.pipe(output);
                      archive.directory(path.join(__dirname, '../', `/images${myStore.hash}/`), false);
                      archive.finalize();*/