require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const { response } = require('express');
const app = express();
let nextNumber = 0;
const sites = [];

//const middlewareDns = require('middleware');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


const middlewareDns = function (req, res, next) {
  const { url } = req.body;
  let response;

  const site = url.replace('https://', '').replace('http://','');

  dns.lookup(site, (err, addresses) => {

    if(addresses !== undefined ) {
      const siteExists = sites.find((site) => site.ip === addresses);
      
      let response;

      if(!siteExists) {
        nextNumber += 1;

        sites.push({
          ip: addresses,
          original_url: url,
          short_url: nextNumber          
        });
        
        response = {
          original_url: url,
          short_url: nextNumber
        }

      } else {
        response = {
          original_url: url,
          short_url: siteExists.short_url
        }
      }

      req.body.resShortUrl = response;

      next();
      
    } else {
      req.body.resShortUrl = { error: 'invalid url' };

      next();
    }
  });


  //next();
};

app.post('/api/shorturl', middlewareDns, function(req, res) {
  const { resShortUrl } = req.body;
  res.json(resShortUrl);
});

app.get('/api/shorturl/:short_url', function(req, res){  
  const { short_url } = req.params;
  
  const siteExists = sites.find((site) => String(site.short_url) === String(short_url));
  
  if(siteExists) {
    res.redirect(siteExists.original_url);
  } else {
    res.json({error: 'No short URL found for the given input'});
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
