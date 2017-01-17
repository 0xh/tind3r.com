var path = require('path');
var express = require('express');
var fs = require('fs');
var app = express();
var layouts = require('express-ejs-layouts');
var PORT = process.env.PORT || 3001
var packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')))

var env = {
  production: process.env.NODE_ENV === 'production'
}

app.set('layout');
app.set('view engine', 'ejs');
app.set('view options', { layout: 'layout' });
app.set('views', path.join(process.cwd(), '/server/views'));

app.use(layouts);

Object.assign(env, {
  env: process.env.NODE_ENV,
  version: packageJson.version,
})

if (env.production) {
  Object.assign(env, {
    assets: JSON.parse(fs.readFileSync(path.join(process.cwd(), 'assets.json'))),
  })
}

if(env.production === false) {
  var webpackDevMiddleware = require('webpack-dev-middleware');
  var webpackHotMiddleware = require('webpack-hot-middleware');
  var webpack = require('webpack');
  var config = require('./webpack.dev.config');
  var compiler = webpack(config);

  app.use(webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
    historyApiFallback: false,
    stats: {
      colors: true
    },
  }));

  app.use(webpackHotMiddleware(compiler));
}

app.use('/dist', express.static('dist'))

app.get('*', function(req, res) {
  res.render('index', {
    env: env
  });
});

app.listen(PORT, function(error) {
  if (error) {
    console.error(error);
  } else {
    console.info('==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.', PORT, PORT);
  }
});
