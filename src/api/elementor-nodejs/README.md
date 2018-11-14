## Install

```sh
$ npm install --save elementor-nodejs
```

## Usage

```js
const elementorContent = require('elementor-nodejs');

app.use(elementorContent({ 
    // Option
    target: [elementor-parser-server],
    redirects: [/\/about\/?/, "/contact"], // ex.
}));

```

## Option
```js
defaultOptions = {
    target: null,
    prefix: /^\/elementor\/?(.*)$/,
    prefixRedirect: "/elementor",
    redirects: [],
    addPath:  "/create_elementor_post",
    editPath: "/edit_elementor_post/:postname",
    viewPath: "/elementor_post/:postname",
};

```

## Setup "Elementor-parser"
```sh
$ docker install elementor-parser
$ docker run -p [port]:80 \
             -e PROXY_FROM=[proxy_from_location] \
             --name elementor \
             -d \
             elementor-parser
```