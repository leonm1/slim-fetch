slim-fetch
==========

[![npm version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![coverage status][codecov-image]][codecov-url]
[![install size][install-size-image]][install-size-url]

A slimmed-down but feature complete version of node-fetch that brings `window.fetch` to Node.js

For the upstream project, visit [bitinn/node-fetch][upstream]

**Note**: I did not create this project, I only removed unnecessary files from the original to save on package size.

Seeing as this library is designed to be as small as possible from a package size, some documentation has been stripped from this file. For the full documentation, please visit [bitinn/node-fetch][upstream]. Links in the table of contents have been updated to point upstream.

<!-- TOC -->

- [Motivation](#motivation)
- [Features](#features)
- [Difference from client-side fetch](#difference-from-client-side-fetch)
- [Installation](#installation)
- [Loading and configuring the module](#loading-and-configuring-the-module)
- [Common Usage](https://github.com/bitinn/node-fetch#common-usage)
    - [Plain text or HTML](https://github.com/bitinn/node-fetch#plain-text-or-html)
    - [JSON](https://github.com/bitinn/node-fetch#json)
    - [Simple Post](https://github.com/bitinn/node-fetch#simple-post)
    - [Post with JSON](https://github.com/bitinn/node-fetch#post-with-json)
    - [Post with form parameters](https://github.com/bitinn/node-fetch#post-with-form-parameters)
    - [Handling exceptions](https://github.com/bitinn/node-fetch#handling-exceptions)
    - [Handling client and server errors](https://github.com/bitinn/node-fetch#handling-client-and-server-errors)
- [Advanced Usage](https://github.com/bitinn/node-fetch#advanced-usage)
    - [Streams](https://github.com/bitinn/node-fetch#streams)
    - [Buffer](https://github.com/bitinn/node-fetch#buffer)
    - [Accessing Headers and other Meta data](https://github.com/bitinn/node-fetch#accessing-headers-and-other-meta-data)
    - [Post data using a file stream](https://github.com/bitinn/node-fetch#post-data-using-a-file-stream)
    - [Post with form-data (detect multipart)](https://github.com/bitinn/node-fetch#post-with-form-data-detect-multipart)
    - [Request cancellation with AbortSignal](https://github.com/bitinn/node-fetch#request-cancellation-with-abortsignal)
- [API](https://github.com/bitinn/node-fetch#api)
    - [fetch(url[, options])](https://github.com/bitinn/node-fetch#fetchurl-options)
    - [Options](https://github.com/bitinn/node-fetch#options)
    - [Class: Request](https://github.com/bitinn/node-fetch#class-request)
    - [Class: Response](https://github.com/bitinn/node-fetch#class-response)
    - [Class: Headers](https://github.com/bitinn/node-fetch#class-headers)
    - [Interface: Body](https://github.com/bitinn/node-fetch#interface-body)
    - [Class: FetchError](https://github.com/bitinn/node-fetch#class-fetcherror)
- [License](#license)
- [Acknowledgement](#acknowledgement)

<!-- /TOC -->

## Motivation

Instead of implementing `XMLHttpRequest` in Node.js to run browser-specific [Fetch polyfill](https://github.com/github/fetch), why not go from native `http` to `fetch` API directly? Hence `node-fetch`, minimal code for a `window.fetch` compatible API on Node.js runtime.

See Matt Andrews' [isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch) or Leonardo Quixada's [cross-fetch](https://github.com/lquixada/cross-fetch) for isomorphic usage (exports `node-fetch` for server-side, `whatwg-fetch` for client-side).

## Features

- Stay consistent with `window.fetch` API.
- Make conscious trade-off when following [WHATWG fetch spec][whatwg-fetch] and [stream spec](https://streams.spec.whatwg.org/) implementation details, document known differences.
- Use native promise, but allow substituting it with [insert your favorite promise library].
- Use native Node streams for body, on both request and response.
- Decode content encoding (gzip/deflate) properly, and convert string output (such as `res.text()` and `res.json()`) to UTF-8 automatically.
- Useful extensions such as timeout, redirect limit, response size limit, [explicit errors](https://github.com/bitinn/node-fetch/blob/master/ERROR-HANDLING.md) for troubleshooting.

## Difference from client-side fetch

- See [Known Differences](https://github.com/bitinn/node-fetch/blob/master/LIMITS.md) for details.
- If you happen to use a missing feature that `window.fetch` offers, feel free to open an issue.
- Pull requests are welcomed too!

## Installation

Current stable release (`2.x`)

```sh
$ npm install slim-fetch --save
```

## Loading and configuring the module
We suggest you load the module via `require`, pending the stabalizing of es modules in node:
```js
const fetch = require('slim-fetch');
```

If you are using a Promise library other than native, set it through fetch.Promise:
```js
const Bluebird = require('bluebird');

fetch.Promise = Bluebird;
```

## Common Usage

NOTE: The documentation below is up-to-date with `2.x` releases, [see `1.x` readme](https://github.com/bitinn/node-fetch/blob/1.x/README.md), [changelog](https://github.com/bitinn/node-fetch/blob/1.x/CHANGELOG.md) and [2.x upgrade guide](https://github.com/bitinn/node-fetch/blob/master/UPGRADE-GUIDE.md) for the differences.

#### Plain text or HTML
```js
fetch('https://github.com/')
    .then(res => res.text())
    .then(body => console.log(body));
```

#### JSON

```js

fetch('https://api.github.com/users/github')
    .then(res => res.json())
    .then(json => console.log(json));
```

#### Simple Post
```js
fetch('https://httpbin.org/post', { method: 'POST', body: 'a=1' })
    .then(res => res.json()) // expecting a json response
    .then(json => console.log(json));
```

#### Post with JSON

```js
const body = { a: 1 };

fetch('https://httpbin.org/post', {
        method: 'post',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })
    .then(res => res.json())
    .then(json => console.log(json));
```

#### Post with form parameters
`URLSearchParams` is available in Node.js as of v7.5.0. See [official documentation](https://nodejs.org/api/url.html#url_class_urlsearchparams) for more usage methods.

NOTE: The `Content-Type` header is only set automatically to `x-www-form-urlencoded` when an instance of `URLSearchParams` is given as such:

```js
const { URLSearchParams } = require('url');

const params = new URLSearchParams();
params.append('a', 1);

fetch('https://httpbin.org/post', { method: 'POST', body: params })
    .then(res => res.json())
    .then(json => console.log(json));
```

#### Handling exceptions
NOTE: 3xx-5xx responses are *NOT* exceptions, and should be handled in `then()`, see the next section.

Adding a catch to the fetch promise chain will catch *all* exceptions, such as errors originating from node core libraries, like network errors, and operational errors which are instances of FetchError. See the [error handling document](ERROR-HANDLING.md)  for more details.

```js
fetch('https://domain.invalid/')
    .catch(err => console.error(err));
```

#### Handling client and server errors
It is common to create a helper function to check that the response contains no client (4xx) or server (5xx) error responses:

```js
function checkStatus(res) {
    if (res.ok) { // res.status >= 200 && res.status < 300
        return res;
    } else {
        throw MyCustomError(res.statusText);
    }
}

fetch('https://httpbin.org/status/400')
    .then(checkStatus)
    .then(res => console.log('will not get here...'))
```

## Advanced Usage

Full documentation for advanced documentation can be found at [bitinn/node-fetch#advanced-usage](https://github.com/bitinn/node-fetch#advanced-usage)

## API

Full API documentation can be found at [bitinn/node-fetch#API](https://github.com/bitinn/node-fetch#API)

## Acknowledgement

Thanks to [github/fetch](https://github.com/github/fetch) for providing a solid implementation reference.

`slim-fetch` is a minified version of node-fetch maintained by [@leonm1]. `node-fetch` v1 was maintained by [@bitinn](https://github.com/bitinn), v2 is currently maintained by [@TimothyGu](https://github.com/timothygu), v2 readme is written by [@jkantr](https://github.com/jkantr).

## License

MIT

[npm-image]: https://img.shields.io/npm/v/slim-fetch.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/slim-fetch
[travis-image]: https://img.shields.io/travis/bitinn/node-fetch.svg?style=flat-square
[travis-url]: https://travis-ci.org/bitinn/node-fetch
[codecov-image]: https://img.shields.io/codecov/c/github/bitinn/node-fetch.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/bitinn/node-fetch
[install-size-image]: https://packagephobia.now.sh/badge?p=slim-fetch
[install-size-url]: https://packagephobia.now.sh/result?p=slim-fetch
[whatwg-fetch]: https://fetch.spec.whatwg.org/
[response-init]: https://fetch.spec.whatwg.org/#responseinit
[node-readable]: https://nodejs.org/api/stream.html#stream_readable_streams
[mdn-headers]: https://developer.mozilla.org/en-US/docs/Web/API/Headers
[LIMITS.md]: https://github.com/bitinn/node-fetch/blob/master/LIMITS.md
[ERROR-HANDLING.md]: https://github.com/bitinn/node-fetch/blob/master/ERROR-HANDLING.md
[UPGRADE-GUIDE.md]: https://github.com/bitinn/node-fetch/blob/master/UPGRADE-GUIDE.md
[upstream]: https://github.com/bitinn/node-fetch
