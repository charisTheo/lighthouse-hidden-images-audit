# 🌄 lighthouse-hidden-images-audit 👀

This project uses [Puppeteer](https://pptr.dev/) to render mobile pages and then it analyses them to find any **hidden images** inside the DOM.

The project consists of two parts:

1. The **renderer**

2. The **analyser**

The **renderer** is an API that runs on a node environment. It is responsible for rendering the given URL sent over the API routes.
After rendering the page, the renderer runs a browser script (analyser) to search for any hidden images.

The **analyser** is a Webpack project that runs and build a script file that can be used as a DOM analyser for finding hidden images in a page. 
It is a browser script that runs *only* in the browser context. This script is requested by the **renderer** after rendering a page and during the page analysis.

When building Webpack in the **analyser** project, there are two script files being created:

1. `analyser/lib/index.cjs` - **CommonJS bundle** (consumed by the **renderer**)

2. `analyser/lib/index.mjs` - **ES6 module** (can run in supported browsers)

## Run

Start both projects (Analyser and Renderer) by running the following commmand at the root of the project:

```bash
npm run init && npm start
```

> `npm run init`: installs the npm packages for both projects - no need to run this more than once

### Start Renderer API (puppeteer)

```bash
cd renderer && npm i && npm start
```

The above starts a [`nodemon`](https://nodemon.io/) process that watches and reloads the server on each file change.

The server will run on http://localhost:3000 by default.

> The port number can be changed by exporting a `PORT` variable before starting the server:
>
> `export PORT=7000 && npm start`

### Start Analyser (broswer script)

```bash
cd analyser && npm i && npm start
```

The above start a Webpack server that watches all files under `/analyser/src/` and injects any changes to the browser.

The server will run on http://localhost:8080 by default and will open the default browser at http://localhost:8080/docs/

> The port number can be changed with the `DEV_SERVER_PORT` variable inside `webpack.config.js`.

### Run custom Lighthouse Performance audit

Run a custom audit with an added check for hidden images and possible optimisations.

#### Initialise

From the root of the project run:

```bash
cd lighthouse && npm i
```

#### Test a website

To audit a website run the npm command as in the following example:

```bash
npm run lh -- https://www.harrytheo.com/
```

> **IMPORTANT**: Mind the '` -- `' with space before and after the double dash. The URL should go after this.

## API

### **`POST`** `/expose`

#### Request

Accepts a JSON object in the body of the request.

* Body: **JSON**

  * `url`: **String** (*required*) - Website's URL to analyse

    > ⚠️️ WARNING ⚠️: For security reasons all URLs will be appended with the `https://` protocol. Examples:
    >
    > www.google.com => https://www.google.com
    >
    > http://www.google.com => https://www.google.com



  * `options`: **Object** (optional)

    * `options.device`: **String** - device on which to render the URL ([List of devices](https://github.com/puppeteer/puppeteer/blob/main/src/common/DeviceDescriptors.ts))

Example:

```json
{
  "url": "https://www.example.com/",
  "options": {
    "device": "Nexus 5X"
  }
}
```

#### Response

Responds with a JSON object in the body of the reponse.

* Body: **JSON**

  * `images`: **Array\<[Image](#image)\>** - an array of [`Image`](#image)'s

  * `usesLazySizes`: **Boolean** - whether the site is using [LazySizes.js](https://github.com/aFarkas/lazysizes/)


Example:

```json
{
  "images": [
    {
      "parentElement": {
        "nodeName": "DIV",
        "classList": [
          "hidden"
        ]
      },
      "src": "<IMAGE URL>",
      "currentSrc": "<IMAGE URL>",
      "clientHeight": 0,
      "classList": [],
      "alt": "<IMAGE ALT>",
      "width": 1,
      "height": 1,
      "loading": "auto"
    }
  ],
  "usesLazySizes": false
}
```

----

## False positives

> 1x1 pixel images are reported. Those images are usually GIFs that are used only for reporting/monitoring.

----

## Install and use analyser locally

For using the analyser module locally in another project follow this guide:

1. Link the package from within the root of your project, e.g.

    ```bash
    npm link ~/path/to/lighthouse-hidden-images-audit/analyser/
    ```

2. Import module in project

    * Using a code bundler i.e. Webpack

    ```js
    import analyser from "analyser"
    analyser.analyse()
    // OR
    import { analyse } from "analyser"
    analyse()
    ```

    * Directly in the browser

    ```html
    <script type="module">
        import * as analyser from "./node_modules/analyser/lib/index.mjs"
        (async () => {
            const results = await analyser.analyse()
        })()
    </script>
    ```
----

## Types

### `Image`

* Type: **Object**

* Properties:

  * `parentElement`: **Object**  - `<img>`'s parent element
  * `parentElement.nodeName`: **String** - `<img>`'s parent element node name i.e. "DIV" or "SPAN"
  * `parentElement.classList`: **Array** - `<img>`'s parent element classes
  * `src`: **String**  - the `src` attribute of `<img>` element
  * `currentSrc`: **String**  - the image url used and requested by the browser
  * `clientHeight`: **Number**  - actual image height captured on the screen
  * `classList`: **Array**  - `<img>`'s classes
  * `alt`: **String**  - `<img>`'s `alt` attribute
  * `width`: **Number**  - `<img>`'s specified width from HTML attribute or computed CSS
  * `height`: **Number**  - `<img>`'s specified height from HTML attribute or computed CSS
  * `loading`: **String**  - `<img>`'s `loading` attribute = "auto"|"lazy"|"eager"