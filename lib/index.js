"use strict";function _interopDefault(e){return e&&"object"==typeof e&&"default"in e?e.default:e}Object.defineProperty(exports,"__esModule",{value:!0});var Stream=_interopDefault(require("stream")),http=_interopDefault(require("http")),Url=_interopDefault(require("url")),https=_interopDefault(require("https")),zlib=_interopDefault(require("zlib"));const BUFFER=Symbol("buffer"),TYPE=Symbol("type");class Blob{constructor(){this[TYPE]="";const e=arguments[0],t=arguments[1],r=[];if(e){const t=e,o=Number(t.length);for(let e=0;e<o;e++){const o=t[e];let n;n=o instanceof Buffer?o:ArrayBuffer.isView(o)?Buffer.from(o.buffer,o.byteOffset,o.byteLength):o instanceof ArrayBuffer?Buffer.from(o):o instanceof Blob?o[BUFFER]:Buffer.from("string"==typeof o?o:String(o)),r.push(n)}}this[BUFFER]=Buffer.concat(r);let o=t&&void 0!==t.type&&String(t.type).toLowerCase();o&&!/[^\u0020-\u007E]/.test(o)&&(this[TYPE]=o)}get size(){return this[BUFFER].length}get type(){return this[TYPE]}slice(){const e=this.size,t=arguments[0],r=arguments[1];let o,n;o=void 0===t?0:t<0?Math.max(e+t,0):Math.min(t,e),n=void 0===r?e:r<0?Math.max(e+r,0):Math.min(r,e);const s=Math.max(n-o,0),i=this[BUFFER].slice(o,o+s),a=new Blob([],{type:arguments[2]});return a[BUFFER]=i,a}}
/**
 * Create FetchError instance
 *
 * @param   String      message      Error message for human
 * @param   String      type         Error type for machine
 * @param   String      systemError  For Node.js system error
 * @return  FetchError
 */
function FetchError(e,t,r){Error.call(this,e),this.message=e,this.type=t,r&&(this.code=this.errno=r.code),Error.captureStackTrace(this,this.constructor)}let convert;Object.defineProperties(Blob.prototype,{size:{enumerable:!0},type:{enumerable:!0},slice:{enumerable:!0}}),Object.defineProperty(Blob.prototype,Symbol.toStringTag,{value:"Blob",writable:!1,enumerable:!1,configurable:!0}),FetchError.prototype=Object.create(Error.prototype),FetchError.prototype.constructor=FetchError,FetchError.prototype.name="FetchError";try{convert=require("encoding").convert}catch(e){}const INTERNALS=Symbol("Body internals"),PassThrough=Stream.PassThrough;
/**
 * Body mixin
 *
 * Ref: https://fetch.spec.whatwg.org/#body
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
function Body(e){var t=this,r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},o=r.size;let n=void 0===o?0:o;var s=r.timeout;let i=void 0===s?0:s;null==e?e=null:"string"==typeof e||isURLSearchParams(e)||e instanceof Blob||Buffer.isBuffer(e)||"[object ArrayBuffer]"===Object.prototype.toString.call(e)||ArrayBuffer.isView(e)||e instanceof Stream||(e=String(e)),this[INTERNALS]={body:e,disturbed:!1,error:null},this.size=n,this.timeout=i,e instanceof Stream&&e.on("error",function(e){const r="AbortError"===e.name?e:new FetchError(`Invalid response body while trying to fetch ${t.url}: ${e.message}`,"system",e);t[INTERNALS].error=r})}
/**
 * Consume and convert an entire Body to a Buffer.
 *
 * Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
 *
 * @return  Promise
 */
function consumeBody(){var e=this;if(this[INTERNALS].disturbed)return Body.Promise.reject(new TypeError(`body used already for: ${this.url}`));if(this[INTERNALS].disturbed=!0,this[INTERNALS].error)return Body.Promise.reject(this[INTERNALS].error);if(null===this.body)return Body.Promise.resolve(Buffer.alloc(0));if("string"==typeof this.body)return Body.Promise.resolve(Buffer.from(this.body));if(this.body instanceof Blob)return Body.Promise.resolve(this.body[BUFFER]);if(Buffer.isBuffer(this.body))return Body.Promise.resolve(this.body);if("[object ArrayBuffer]"===Object.prototype.toString.call(this.body))return Body.Promise.resolve(Buffer.from(this.body));if(ArrayBuffer.isView(this.body))return Body.Promise.resolve(Buffer.from(this.body.buffer,this.body.byteOffset,this.body.byteLength));if(!(this.body instanceof Stream))return Body.Promise.resolve(Buffer.alloc(0));let t=[],r=0,o=!1;return new Body.Promise(function(n,s){let i;e.timeout&&(i=setTimeout(function(){o=!0,s(new FetchError(`Response timeout while trying to fetch ${e.url} (over ${e.timeout}ms)`,"body-timeout"))},e.timeout)),e.body.on("error",function(t){"AbortError"===t.name?(o=!0,s(t)):s(new FetchError(`Invalid response body while trying to fetch ${e.url}: ${t.message}`,"system",t))}),e.body.on("data",function(n){if(!o&&null!==n){if(e.size&&r+n.length>e.size)return o=!0,void s(new FetchError(`content size at ${e.url} over limit: ${e.size}`,"max-size"));r+=n.length,t.push(n)}}),e.body.on("end",function(){if(!o){clearTimeout(i);try{n(Buffer.concat(t))}catch(t){s(new FetchError(`Could not create Buffer from response body for ${e.url}: ${t.message}`,"system",t))}}})})}
/**
 * Detect buffer encoding and convert to target encoding
 * ref: http://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#determining-the-character-encoding
 *
 * @param   Buffer  buffer    Incoming buffer
 * @param   String  encoding  Target encoding
 * @return  String
 */function convertBody(e,t){if("function"!=typeof convert)throw new Error("The package `encoding` must be installed to use the textConverted() function");const r=t.get("content-type");let o,n,s="utf-8";return r&&(o=/charset=([^;]*)/i.exec(r)),n=e.slice(0,1024).toString(),!o&&n&&(o=/<meta.+?charset=(['"])(.+?)\1/i.exec(n)),!o&&n&&(o=/<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(n))&&(o=/charset=(.*)/i.exec(o.pop())),!o&&n&&(o=/<\?xml.+?encoding=(['"])(.+?)\1/i.exec(n)),o&&("gb2312"!==(s=o.pop())&&"gbk"!==s||(s="gb18030")),convert(e,"UTF-8",s).toString()}
/**
 * Detect a URLSearchParams object
 * ref: https://github.com/bitinn/node-fetch/issues/296#issuecomment-307598143
 *
 * @param   Object  obj     Object to detect by type or brand
 * @return  String
 */function isURLSearchParams(e){return"object"==typeof e&&"function"==typeof e.append&&"function"==typeof e.delete&&"function"==typeof e.get&&"function"==typeof e.getAll&&"function"==typeof e.has&&"function"==typeof e.set&&("URLSearchParams"===e.constructor.name||"[object URLSearchParams]"===Object.prototype.toString.call(e)||"function"==typeof e.sort)}
/**
 * Clone body given Res/Req instance
 *
 * @param   Mixed  instance  Response or Request instance
 * @return  Mixed
 */function clone(e){let t,r,o=e.body;if(e.bodyUsed)throw new Error("cannot clone body after it is used");return o instanceof Stream&&"function"!=typeof o.getBoundary&&(t=new PassThrough,r=new PassThrough,o.pipe(t),o.pipe(r),e[INTERNALS].body=t,o=r),o}
/**
 * Performs the operation "extract a `Content-Type` value from |object|" as
 * specified in the specification:
 * https://fetch.spec.whatwg.org/#concept-bodyinit-extract
 *
 * This function assumes that instance.body is present.
 *
 * @param   Mixed  instance  Response or Request instance
 */function extractContentType(e){const t=e.body;return null===t?null:"string"==typeof t?"text/plain;charset=UTF-8":isURLSearchParams(t)?"application/x-www-form-urlencoded;charset=UTF-8":t instanceof Blob?t.type||null:Buffer.isBuffer(t)?null:"[object ArrayBuffer]"===Object.prototype.toString.call(t)?null:ArrayBuffer.isView(t)?null:"function"==typeof t.getBoundary?`multipart/form-data;boundary=${t.getBoundary()}`:null}
/**
 * The Fetch Standard treats this as if "total bytes" is a property on the body.
 * For us, we have to explicitly get it with a function.
 *
 * ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
 *
 * @param   Body    instance   Instance of Body
 * @return  Number?            Number of bytes, or null if not possible
 */function getTotalBytes(e){const t=e.body;return null===t?0:"string"==typeof t?Buffer.byteLength(t):isURLSearchParams(t)?Buffer.byteLength(String(t)):t instanceof Blob?t.size:Buffer.isBuffer(t)?t.length:"[object ArrayBuffer]"===Object.prototype.toString.call(t)?t.byteLength:ArrayBuffer.isView(t)?t.byteLength:t&&"function"==typeof t.getLengthSync&&(t._lengthRetrievers&&0==t._lengthRetrievers.length||t.hasKnownLength&&t.hasKnownLength())?t.getLengthSync():null}
/**
 * Write a Body to a Node.js WritableStream (e.g. http.Request) object.
 *
 * @param   Body    instance   Instance of Body
 * @return  Void
 */function writeToStream(e,t){const r=t.body;null===r?e.end():"string"==typeof r?(e.write(r),e.end()):isURLSearchParams(r)?(e.write(Buffer.from(String(r))),e.end()):r instanceof Blob?(e.write(r[BUFFER]),e.end()):Buffer.isBuffer(r)?(e.write(r),e.end()):"[object ArrayBuffer]"===Object.prototype.toString.call(r)?(e.write(Buffer.from(r)),e.end()):ArrayBuffer.isView(r)?(e.write(Buffer.from(r.buffer,r.byteOffset,r.byteLength)),e.end()):r.pipe(e)}Body.prototype={get body(){return this[INTERNALS].body},get bodyUsed(){return this[INTERNALS].disturbed},
/**
  * Decode response as ArrayBuffer
  *
  * @return  Promise
  */
arrayBuffer(){return consumeBody.call(this).then(function(e){return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)})},
/**
  * Return raw response as Blob
  *
  * @return Promise
  */
blob(){let e=this.headers&&this.headers.get("content-type")||"";return consumeBody.call(this).then(function(t){return Object.assign(new Blob([],{type:e.toLowerCase()}),{[BUFFER]:t})})},
/**
  * Decode response as json
  *
  * @return  Promise
  */
json(){var e=this;return consumeBody.call(this).then(function(t){try{return JSON.parse(t.toString())}catch(t){return Body.Promise.reject(new FetchError(`invalid json response body at ${e.url} reason: ${t.message}`,"invalid-json"))}})},
/**
  * Decode response as text
  *
  * @return  Promise
  */
text(){return consumeBody.call(this).then(function(e){return e.toString()})},
/**
  * Decode response as buffer (non-spec api)
  *
  * @return  Promise
  */
buffer(){return consumeBody.call(this)},
/**
  * Decode response as text, while automatically detecting the encoding and
  * trying to decode to UTF-8 (non-spec api)
  *
  * @return  Promise
  */
textConverted(){var e=this;return consumeBody.call(this).then(function(t){return convertBody(t,e.headers)})}},Object.defineProperties(Body.prototype,{body:{enumerable:!0},bodyUsed:{enumerable:!0},arrayBuffer:{enumerable:!0},blob:{enumerable:!0},json:{enumerable:!0},text:{enumerable:!0}}),Body.mixIn=function(e){for(const t of Object.getOwnPropertyNames(Body.prototype))if(!(t in e)){const r=Object.getOwnPropertyDescriptor(Body.prototype,t);Object.defineProperty(e,t,r)}},Body.Promise=global.Promise;const invalidTokenRegex=/[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/,invalidHeaderCharRegex=/[^\t\x20-\x7e\x80-\xff]/;function validateName(e){if(e=`${e}`,invalidTokenRegex.test(e))throw new TypeError(`${e} is not a legal HTTP header name`)}function validateValue(e){if(e=`${e}`,invalidHeaderCharRegex.test(e))throw new TypeError(`${e} is not a legal HTTP header value`)}
/**
 * Find the key in the map object given a header name.
 *
 * Returns undefined if not found.
 *
 * @param   String  name  Header name
 * @return  String|Undefined
 */function find(e,t){t=t.toLowerCase();for(const r in e)if(r.toLowerCase()===t)return r}const MAP=Symbol("map");class Headers{
/**
  * Headers class
  *
  * @param   Object  headers  Response headers
  * @return  Void
  */
constructor(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:void 0;if(this[MAP]=Object.create(null),e instanceof Headers){const t=e.raw(),r=Object.keys(t);for(const e of r)for(const r of t[e])this.append(e,r)}else if(null==e);else{if("object"!=typeof e)throw new TypeError("Provided initializer must be an object");{const t=e[Symbol.iterator];if(null!=t){if("function"!=typeof t)throw new TypeError("Header pairs must be iterable");const r=[];for(const t of e){if("object"!=typeof t||"function"!=typeof t[Symbol.iterator])throw new TypeError("Each header pair must be iterable");r.push(Array.from(t))}for(const e of r){if(2!==e.length)throw new TypeError("Each header pair must be a name/value tuple");this.append(e[0],e[1])}}else for(const t of Object.keys(e)){const r=e[t];this.append(t,r)}}}}
/**
  * Return combined header value given name
  *
  * @param   String  name  Header name
  * @return  Mixed
  */get(e){validateName(e=`${e}`);const t=find(this[MAP],e);return void 0===t?null:this[MAP][t].join(", ")}
/**
  * Iterate over all headers
  *
  * @param   Function  callback  Executed for each item with parameters (value, name, thisArg)
  * @param   Boolean   thisArg   `this` context for callback function
  * @return  Void
  */forEach(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:void 0,r=getHeaders(this),o=0;for(;o<r.length;){var n=r[o];const s=n[0],i=n[1];e.call(t,i,s,this),r=getHeaders(this),o++}}
/**
  * Overwrite header values given name
  *
  * @param   String  name   Header name
  * @param   String  value  Header value
  * @return  Void
  */set(e,t){t=`${t}`,validateName(e=`${e}`),validateValue(t);const r=find(this[MAP],e);this[MAP][void 0!==r?r:e]=[t]}
/**
  * Append a value onto existing header
  *
  * @param   String  name   Header name
  * @param   String  value  Header value
  * @return  Void
  */append(e,t){t=`${t}`,validateName(e=`${e}`),validateValue(t);const r=find(this[MAP],e);void 0!==r?this[MAP][r].push(t):this[MAP][e]=[t]}
/**
  * Check for header name existence
  *
  * @param   String   name  Header name
  * @return  Boolean
  */has(e){return validateName(e=`${e}`),void 0!==find(this[MAP],e)}
/**
  * Delete all header values given name
  *
  * @param   String  name  Header name
  * @return  Void
  */delete(e){validateName(e=`${e}`);const t=find(this[MAP],e);void 0!==t&&delete this[MAP][t]}
/**
  * Return raw headers (non-spec api)
  *
  * @return  Object
  */raw(){return this[MAP]}
/**
  * Get an iterator on keys.
  *
  * @return  Iterator
  */keys(){return createHeadersIterator(this,"key")}
/**
  * Get an iterator on values.
  *
  * @return  Iterator
  */values(){return createHeadersIterator(this,"value")}
/**
  * Get an iterator on entries.
  *
  * This is the default iterator of the Headers object.
  *
  * @return  Iterator
  */[Symbol.iterator](){return createHeadersIterator(this,"key+value")}}function getHeaders(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"key+value";return Object.keys(e[MAP]).sort().map("key"===t?function(e){return e.toLowerCase()}:"value"===t?function(t){return e[MAP][t].join(", ")}:function(t){return[t.toLowerCase(),e[MAP][t].join(", ")]})}Headers.prototype.entries=Headers.prototype[Symbol.iterator],Object.defineProperty(Headers.prototype,Symbol.toStringTag,{value:"Headers",writable:!1,enumerable:!1,configurable:!0}),Object.defineProperties(Headers.prototype,{get:{enumerable:!0},forEach:{enumerable:!0},set:{enumerable:!0},append:{enumerable:!0},has:{enumerable:!0},delete:{enumerable:!0},keys:{enumerable:!0},values:{enumerable:!0},entries:{enumerable:!0}});const INTERNAL=Symbol("internal");function createHeadersIterator(e,t){const r=Object.create(HeadersIteratorPrototype);return r[INTERNAL]={target:e,kind:t,index:0},r}const HeadersIteratorPrototype=Object.setPrototypeOf({next(){if(!this||Object.getPrototypeOf(this)!==HeadersIteratorPrototype)throw new TypeError("Value of `this` is not a HeadersIterator");var e=this[INTERNAL];const t=e.target,r=e.kind,o=e.index,n=getHeaders(t,r);return o>=n.length?{value:void 0,done:!0}:(this[INTERNAL].index=o+1,{value:n[o],done:!1})}},Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));
/**
 * Export the Headers object in a form that Node.js can consume.
 *
 * @param   Headers  headers
 * @return  Object
 */
function exportNodeCompatibleHeaders(e){const t=Object.assign({__proto__:null},e[MAP]),r=find(e[MAP],"Host");return void 0!==r&&(t[r]=t[r][0]),t}
/**
 * Create a Headers object from an object of headers, ignoring those that do
 * not conform to HTTP grammar productions.
 *
 * @param   Object  obj  Object of headers
 * @return  Headers
 */function createHeadersLenient(e){const t=new Headers;for(const r of Object.keys(e))if(!invalidTokenRegex.test(r))if(Array.isArray(e[r]))for(const o of e[r])invalidHeaderCharRegex.test(o)||(void 0===t[MAP][r]?t[MAP][r]=[o]:t[MAP][r].push(o));else invalidHeaderCharRegex.test(e[r])||(t[MAP][r]=[e[r]]);return t}Object.defineProperty(HeadersIteratorPrototype,Symbol.toStringTag,{value:"HeadersIterator",writable:!1,enumerable:!1,configurable:!0});const INTERNALS$1=Symbol("Response internals"),STATUS_CODES=http.STATUS_CODES;
/**
 * Response class
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
class Response{constructor(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};Body.call(this,e,t);const r=t.status||200;this[INTERNALS$1]={url:t.url,status:r,statusText:t.statusText||STATUS_CODES[r],headers:new Headers(t.headers)}}get url(){return this[INTERNALS$1].url}get status(){return this[INTERNALS$1].status}get ok(){return this[INTERNALS$1].status>=200&&this[INTERNALS$1].status<300}get statusText(){return this[INTERNALS$1].statusText}get headers(){return this[INTERNALS$1].headers}
/**
  * Clone this response
  *
  * @return  Response
  */clone(){return new Response(clone(this),{url:this.url,status:this.status,statusText:this.statusText,headers:this.headers,ok:this.ok})}}Body.mixIn(Response.prototype),Object.defineProperties(Response.prototype,{url:{enumerable:!0},status:{enumerable:!0},ok:{enumerable:!0},statusText:{enumerable:!0},headers:{enumerable:!0},clone:{enumerable:!0}}),Object.defineProperty(Response.prototype,Symbol.toStringTag,{value:"Response",writable:!1,enumerable:!1,configurable:!0});const INTERNALS$2=Symbol("Request internals"),parse_url=Url.parse,format_url=Url.format,streamDestructionSupported="destroy"in Stream.Readable.prototype;
/**
 * Check if a value is an instance of Request.
 *
 * @param   Mixed   input
 * @return  Boolean
 */
function isRequest(e){return"object"==typeof e&&"object"==typeof e[INTERNALS$2]}function isAbortSignal(e){const t=e&&"object"==typeof e&&Object.getPrototypeOf(e);return!(!t||"AbortSignal"!==t.constructor.name)}
/**
 * Request class
 *
 * @param   Mixed   input  Url or Request instance
 * @param   Object  init   Custom options
 * @return  Void
 */class Request{constructor(e){let t,r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};isRequest(e)?t=parse_url(e.url):(t=e&&e.href?parse_url(e.href):parse_url(`${e}`),e={});let o=r.method||e.method||"GET";if(o=o.toUpperCase(),(null!=r.body||isRequest(e)&&null!==e.body)&&("GET"===o||"HEAD"===o))throw new TypeError("Request with GET/HEAD method cannot have body");let n=null!=r.body?r.body:isRequest(e)&&null!==e.body?clone(e):null;Body.call(this,n,{timeout:r.timeout||e.timeout||0,size:r.size||e.size||0});const s=new Headers(r.headers||e.headers||{});if(null!=r.body){const e=extractContentType(this);null===e||s.has("Content-Type")||s.append("Content-Type",e)}let i=isRequest(e)?e.signal:null;if("signal"in r&&(i=r.signal),null!=i&&!isAbortSignal(i))throw new TypeError("Expected signal to be an instanceof AbortSignal");this[INTERNALS$2]={method:o,redirect:r.redirect||e.redirect||"follow",headers:s,parsedURL:t,signal:i},this.follow=void 0!==r.follow?r.follow:void 0!==e.follow?e.follow:20,this.compress=void 0!==r.compress?r.compress:void 0===e.compress||e.compress,this.counter=r.counter||e.counter||0,this.agent=r.agent||e.agent}get method(){return this[INTERNALS$2].method}get url(){return format_url(this[INTERNALS$2].parsedURL)}get headers(){return this[INTERNALS$2].headers}get redirect(){return this[INTERNALS$2].redirect}get signal(){return this[INTERNALS$2].signal}
/**
  * Clone this request
  *
  * @return  Request
  */clone(){return new Request(this)}}
/**
 * Convert a Request to Node.js http request options.
 *
 * @param   Request  A Request instance
 * @return  Object   The options object to be passed to http.request
 */
function getNodeRequestOptions(e){const t=e[INTERNALS$2].parsedURL,r=new Headers(e[INTERNALS$2].headers);if(r.has("Accept")||r.set("Accept","*/*"),!t.protocol||!t.hostname)throw new TypeError("Only absolute URLs are supported");if(!/^https?:$/.test(t.protocol))throw new TypeError("Only HTTP(S) protocols are supported");if(e.signal&&e.body instanceof Stream.Readable&&!streamDestructionSupported)throw new Error("Cancellation of streamed requests with AbortSignal is not supported in node < 8");let o=null;if(null==e.body&&/^(POST|PUT)$/i.test(e.method)&&(o="0"),null!=e.body){const t=getTotalBytes(e);"number"==typeof t&&(o=String(t))}return o&&r.set("Content-Length",o),r.has("User-Agent")||r.set("User-Agent","node-fetch/1.0 (+https://github.com/bitinn/node-fetch)"),e.compress&&!r.has("Accept-Encoding")&&r.set("Accept-Encoding","gzip,deflate"),r.has("Connection")||e.agent||r.set("Connection","close"),Object.assign({},t,{method:e.method,headers:exportNodeCompatibleHeaders(r),agent:e.agent})}
/**
 * Create AbortError instance
 *
 * @param   String      message      Error message for human
 * @return  AbortError
 */function AbortError(e){Error.call(this,e),this.type="aborted",this.message=e,Error.captureStackTrace(this,this.constructor)}Body.mixIn(Request.prototype),Object.defineProperty(Request.prototype,Symbol.toStringTag,{value:"Request",writable:!1,enumerable:!1,configurable:!0}),Object.defineProperties(Request.prototype,{method:{enumerable:!0},url:{enumerable:!0},headers:{enumerable:!0},redirect:{enumerable:!0},clone:{enumerable:!0},signal:{enumerable:!0}}),AbortError.prototype=Object.create(Error.prototype),AbortError.prototype.constructor=AbortError,AbortError.prototype.name="AbortError";const PassThrough$1=Stream.PassThrough,resolve_url=Url.resolve;
/**
 * Fetch function
 *
 * @param   Mixed    url   Absolute url or Request instance
 * @param   Object   opts  Fetch options
 * @return  Promise
 */
function fetch(e,t){if(!fetch.Promise)throw new Error("native promise missing, set fetch.Promise to your favorite alternative");return Body.Promise=fetch.Promise,new fetch.Promise(function(r,o){const n=new Request(e,t),s=getNodeRequestOptions(n),i=("https:"===s.protocol?https:http).request,a=n.signal;let u=null;const l=function(){let e=new AbortError("The user aborted a request.");o(e),n.body&&n.body instanceof Stream.Readable&&n.body.destroy(e),u&&u.body&&u.body.emit("error",e)};if(a&&a.aborted)return void l();const c=function(){l(),h()},f=i(s);let d;function h(){f.abort(),a&&a.removeEventListener("abort",c),clearTimeout(d)}a&&a.addEventListener("abort",c),n.timeout&&f.once("socket",function(e){d=setTimeout(function(){o(new FetchError(`network timeout at: ${n.url}`,"request-timeout")),h()},n.timeout)}),f.on("error",function(e){o(new FetchError(`request to ${n.url} failed, reason: ${e.message}`,"system",e)),h()}),f.on("response",function(e){clearTimeout(d);const t=createHeadersLenient(e.headers);if(fetch.isRedirect(e.statusCode)){const s=t.get("Location"),i=null===s?null:resolve_url(n.url,s);switch(n.redirect){case"error":return o(new FetchError(`redirect mode is set to error: ${n.url}`,"no-redirect")),void h();case"manual":if(null!==i)try{t.set("Location",i)}catch(e){o(e)}break;case"follow":if(null===i)break;if(n.counter>=n.follow)return o(new FetchError(`maximum redirect reached at: ${n.url}`,"max-redirect")),void h();const s={headers:new Headers(n.headers),follow:n.follow,counter:n.counter+1,agent:n.agent,compress:n.compress,method:n.method,body:n.body,signal:n.signal};return 303!==e.statusCode&&n.body&&null===getTotalBytes(n)?(o(new FetchError("Cannot follow redirect with body being a readable stream","unsupported-redirect")),void h()):(303!==e.statusCode&&(301!==e.statusCode&&302!==e.statusCode||"POST"!==n.method)||(s.method="GET",s.body=void 0,s.headers.delete("content-length")),r(fetch(new Request(i,s))),void h())}}e.once("end",function(){a&&a.removeEventListener("abort",c)});let s=e.pipe(new PassThrough$1);const i={url:n.url,status:e.statusCode,statusText:e.statusMessage,headers:t,size:n.size,timeout:n.timeout},l=t.get("Content-Encoding");if(!n.compress||"HEAD"===n.method||null===l||204===e.statusCode||304===e.statusCode)return u=new Response(s,i),void r(u);const f={flush:zlib.Z_SYNC_FLUSH,finishFlush:zlib.Z_SYNC_FLUSH};if("gzip"==l||"x-gzip"==l)return s=s.pipe(zlib.createGunzip(f)),u=new Response(s,i),void r(u);if("deflate"!=l&&"x-deflate"!=l)u=new Response(s,i),r(u);else{e.pipe(new PassThrough$1).once("data",function(e){s=8==(15&e[0])?s.pipe(zlib.createInflate()):s.pipe(zlib.createInflateRaw()),u=new Response(s,i),r(u)})}}),writeToStream(f,n)})}
/**
 * Redirect code matching
 *
 * @param   Number   code  Status code
 * @return  Boolean
 */fetch.isRedirect=function(e){return 301===e||302===e||303===e||307===e||308===e},fetch.Promise=global.Promise,module.exports=exports=fetch,Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=exports,exports.Headers=Headers,exports.Request=Request,exports.Response=Response,exports.FetchError=FetchError;