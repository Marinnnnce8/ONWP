/**
 * NB Communication JS
 *
 * @version 3.3.3
 * @author Chris Thomson
 * @copyright 2020 NB Communication Ltd
 *
 */

if(typeof UIkit === "undefined") {
	throw new Error("NB requires UIkit. UIkit must be included before this script.");
}

(function (global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() :
	typeof define === "function" && define.amd ? define("nb", factory) :
	(global = global || self, global.NB = factory());
}(this, function() { "use strict";

	/**
	 * UIkit utilities
	 *
	 * https://github.com/uikit/uikit-site/blob/feature/js-utils/docs/pages/javascript-utilities.md
	 *
	 */
	var $uk = UIkit.util;

	/**
	 * Javascript Promise
	 *
	 */
	var Promise = "Promise" in window ? window.Promise : $uk.Promise;

	/**
	 * Select a single HTML element from name and context
	 *
	 * This extends `UIkit.util.$` by inferring the selector's prefix,
	 * defaulting to the period for a class selector.
	 *
	 * This can be useful if selector names are defined as a variable
	 * without a prefix.
	 *
	 * ```
	 * var n = "name";
	 *
	 * // Get by class name (.name)
	 * var element = $nb.$(n);
	 * var element =  $uk.$("." + n);
	 *
	 * // Get by ID (#name)
	 * var element = $nb.$(n, "#");
	 * var element = $uk.$("#" + n);
	 *
	 * // Get by data attribute ([data-name]);
	 * var element = $nb.$(n, "[data]");
	 * var element = $uk.$("[data-" + n + "]");
	 * ```
	 *
	 * @return {Object}
	 *
	 */
	function $() {
		return _query(arguments);
	}

	/**
	 * Select multiple HTML elements from name and context
	 *
	 * This extends `UIkit.util.$$` by inferring the selector's prefix,
	 * defaulting to the period for a class selector.
	 *
	 * @return {Object}
	 *
	 */
	function $$() {
		return _query(arguments, true);
	}

	/**
	 * Select single/multiple HTML elements from name and context
	 *
	 * @param {Array} args
	 * @param {Boolean} [multiple]
	 * @return {Object}
	 *
	 */
	function _query(args, multiple) {

		var name, context = document, prefix = ".";
		var prefixes = [".", "#", "[data]"];

		for(var i = 0; i < args.length; i++) {
			var arg = args[i];
			if($uk.isString(arg)) {
				if(prefixes.indexOf(arg) !== -1) {
					prefix = arg;
				} else {
					name = arg;
					for(var n = 0; n < prefixes.length; n++) {
						var pre = prefixes[n];
						if($uk.startsWith(name, pre)) {
							name = name.replace(pre, "");
							prefix = pre;
						}
					}
				}
			} else if($uk.isNode(arg)) {
				context = arg;
			}
		}

		var selector;
		switch(prefix) {
			case "[data]":
				selector = "[data-" + name + "]";
				break;
			default:
				selector = prefix + name;
				break;
		}

		return $uk[(multiple ? "$$" : "$")](selector, context);
	}

	/**
	 * Perform an asynchronous request
	 *
	 * @param {string} [url]
	 * @param {Object} [options]
	 * @return {Promise}
	 *
	 */
	function ajax(url, options) {

		if(!url) url = [location.protocol, "//", location.host, location.pathname].join("");
		if(options === void 0 || !$uk.isPlainObject(options)) options = {};

		if($uk.includes(url, "#")) {
			// Make sure # comes after ?
			var x = url.split("#"), y = x[1].split("?");
			url = x[0] + (y.length > 1 ? "?" + y[1] : "") + "#" + y[0];
		}

		options = $uk.assign({
			method: "GET",
			headers: {"X-Requested-With": "XMLHttpRequest"},
			responseType: "json"
		}, options);

		return new Promise(function(resolve, reject) {
			$uk.ajax(url, options).then(function(xhr) {
				var response = getRequestResponse(xhr);
				if(!response.status) {
					reject(response);
				} else {
					resolve(response);
				}
			}, function(e) {
				reject(getRequestResponse(e.xhr, e.status, e));
			});
		});
	}

	/**
	 * Return html attributes as a rendered string
	 *
	 * @return {string}
	 *
	 */
	function attr() {

		var attrs = {};
		var tag = "";
		var close = false;

		// Get and set arguments provided
		for(var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if($uk.isBoolean(arg)) {
				close = arg;
			} else if($uk.isString(arg) && arg) {
				tag = arg;
			} else if($uk.isArray(arg) && arg.length) {
				if(!("class" in attrs)) attrs.class = [];
				if(!$uk.isArray(attrs.class)) attrs.class = [attrs.class];
				for(var n = 0; n < arg.length; n++) attrs.class.push(arg[n]);
				tag = "div";
			} else if($uk.isPlainObject(arg)) {
				attrs = $uk.assign(attrs, arg);
			}
		}

		var attributes = [];
		for(var key in attrs) {
			if($uk.hasOwn(attrs, key)) {
				var value = attrs[key];
				switch(key) {
					case "element":
					case "nodeName":
					case "tag":
						// If `tag` is passed in attrs
						// and a tag has not been passed
						// make it the tag
						if(!tag) tag = value;
						break;
					case "close":
						// If `close` is passed in attrs
						// set this as the close value
						close = $uk.toBoolean(value);
						break;
					default:
						if(value !== false) {
							if(key) key = $uk.hyphenate(key);
							if(value == "" || $uk.isBoolean(value)) {
								attributes.push(key);
							} else {
								value = attrValue(value);
								attributes.push(key ? key + "='" + value + "'" : value);
							}
						}
						break;
				}
			}
		}

		attributes = attributes.join(" ");
		attributes = attributes ? " " + attributes : "";
		if(tag) tag = tag.replace(/<|>|\//gi, "");

		return tag ? "<" + tag + attributes + ">" + (close ? "</" + tag + ">" : "") : attributes;
	}

	/**
	 * Convert value to an html attribute
	 *
	 * @param {*} value The value to process.
	 * @return {string}
	 *
	 */
	function attrValue(value) {
		if($uk.isArray(value)) {
			value = value.join(" ");
		} else if($uk.isPlainObject(value)) {
			value = JSON.stringify(value);
		}
		return value;
	}

	/**
	 * Base64 decode a value
	 *
	 * @param {*} value The value to decode.
	 * @param {string} [delimiter] If specified, the string will be split into an array.
	 * @return {(string | Object | Array)}
	 *
	 */
	function base64_decode(value, delimiter) {
		return data(atob(value), delimiter);
	}

	/**
	 * Base64 encode a value
	 *
	 * @param {*} value The value to encode.
	 * @param {string} [delimiter] If specified, an array value will be joined (default).
	 * @return {string}
	 *
	 */
	function base64_encode(value, delimiter) {
		if(delimiter === void 0) delimiter = "";
		if($uk.isArray(value)) value = value.join(delimiter);
		if($uk.isPlainObject(value)) value = JSON.stringify(value);
		return btoa(value);
	}

	/**
	 * Data
	 *
	 * Retrieve the value of a data-* prefixed attribute
	 * and/or parse a data string to an object.
	 *
	 * @param {(Object | string)} value
	 * @param {string} str
	 * @return {(string | Object | Array)}
	 *
	 */
	function data(value, key) {

		if($uk.isPlainObject(value)) return value;
		if($uk.isNode(value)) value = $uk.data(value, key);

		try {
			value = JSON.parse(value);
		} catch(e) {
			if(key && $uk.includes(value, key)) {
				value = value.split(key);
			}
		}

		return value;
	}

	/**
	 * Debounce
	 *
	 * Wrap taxing tasks with this. Based on https://davidwalsh.name/javascript-debounce-function
	 *
	 * ### Example
	 * Debounce a window resize function and log a timestamp every 256ms when the window is resized
	 * ```
	 * $uk.on(window, "resize", NB.util.debounce(function() {
	 *     console.log(Date.now());
	 * }, 256));
	 * ```
	 *
	 * @param {Function} func The function to limit.
	 * @param {number} [wait] The time to wait between fires.
	 * @param {boolean} [immediate] trigger the function on the leading edge, instead of the trailing.
	 * @return {Function}
	 *
	 */
	function debounce(func, wait, immediate) {

		var timeout;
		if(wait === void 0) wait = NB.options.duration;
		return function() {

			var context = this;
			var args = arguments;
			var later = function() {
				timeout = null;
				if(!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;

			clearTimeout(timeout);
			timeout = setTimeout(later, wait);

			if(callNow) func.apply(context, args);
		};
	}

	/**
	 * Process an XHR response and return data
	 *
	 * @param {Object} xhr
	 * @param {number} [status]
	 * @param {*} [fallback]
	 * @return {Object}
	 *
	 */
	function getRequestResponse(xhr, status, fallback) {

		if(status === void 0 || !$uk.isNumber(status)) {
			if($uk.isString(status)) fallback = status;
			status = 500;
		}
		if(xhr.status) status = xhr.status;
		if(fallback === void 0) fallback = null;

		var response = xhr.response;
		if(!$uk.isPlainObject(response)) {
			try {
				response = JSON.parse(response);
			} catch(e) {
				if(!fallback) fallback = response;
			}
		}

		if($uk.isPlainObject(response)) {
			if("errors" in response) {
				response = getResponseErrors(response.errors);
				if(status < 400) status = 0;
			} else if("data" in response) {
				response = response.data;
			}
		} else {
			response = fallback;
			status = 500;
		}

		return {status: parseInt(status), response: response};
	}

	/**
	 * Parse response errors
	 *
	 * @param {Object} e
	 * @return {Array}
	 *
	 */
	function getResponseErrors(e) {
		var errors = [];
		for(var i = 0; i < e.length; i++) {
			errors.push(e[i].message);
		}
		return errors;
	}

	/**
	 * Perform an asynchronous request to a GraphQL API
	 *
	 * @param {string} query
	 * @param {Object} [variables]
	 * @return {Promise}
	 *
	 */
	function graphql(query, variables) {
		var data = {query: query};
		if($uk.isPlainObject(variables)) data.variables = variables;
		return ajax(NB.options.graphql, {
			method: "POST",
			data: JSON.stringify(data)
		});
	}

	/**
	 * Render an image
	 *
	 * @param {(string | Object)} image The image to render.
	 * @param {(Object | string)} [attrs] Attributes for the tag. If a string is passed the alt attribute is set.
	 * @param {Object} [options] Options to modify behaviour.
	 * @return {string}
	 *
	 */
	function img(image, attrs, options) {

		// Shortcuts
		if($uk.isString(attrs)) attrs = {alt: attrs};
		if(attrs === void 0) attrs = {};
		if(options === void 0) options = {};

		// Set default options
		options = $uk.assign({
			focus: false,
			tag: "img",
			ukImg: true,
			src: "url"
		}, options);

		var isImg = options.tag === "img";
		var focus = {left: 50, top: 50};
		var srcset = false;
		var sizes = false;

		if($uk.isPlainObject(image)) {
			if(image.focus && $uk.isPlainObject(image.focus)) focus = $uk.assign(focus, image.focus);
			if(image.srcset) srcset = image.srcset;
			if(image.sizes && image.srcset) sizes = image.sizes;
			image = image[options.src];
		}

		// Set default img attributes
		attrs = $uk.assign({
			alt: "",
			width: 0,
			height: 0
		}, attrs);

		// If no image has been passed or nothing found
		if(!image) return "";

		// Set width/height from image url
		var matches = image.match(/(\.\d*x\d*\.)/g);
		if(isImg && matches) {
			var size = matches[0].split("x");
			if(!attrs.width) attrs.width = $uk.toNumber(size[0].replace(".", ""));
			if(!attrs.height) attrs.height = $uk.toNumber(size[1].replace(".", ""));
		}

		// If a background image, set the background position style
		if(!isImg && options.focus) {
			var styles = attrs.style ? attrs.style.split(";") : [];
			styles.push("background-position:" + focus.left + "% " + focus.top + "%");
			attrs.style = styles.join(";");
		}

		// Remove unnecessary attributes
		if(attrs.width == 0 || !isImg) attrs.width = false;
		if(attrs.height == 0 || !isImg) attrs.height = false;
		if(!isImg) attrs.alt = false;
		if(!srcset && "sizes" in attrs) delete(attrs.sizes);

		// Set remaining attributes
		if(options.ukImg) {
			var a = { // Use uk-img lazy loading
				src: (isImg ? "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" : false),
				dataSrc: image,
				dataSrcset: srcset,
				dataUkImg: options.ukImg
			};
			if(sizes && srcset) a.dataSizes = sizes;
			attrs = $uk.assign(a, attrs);
		} else if(isImg) {
			attrs.src = image;
			attrs.srcset = srcset;
			if(srcset) attrs.sizes = sizes;
		} else {
			// Set background-image style
			attrs.style = "background-image:url(" + image + ");" + (attrs.style ? attrs.style : "");
		}

		return attr(attrs, options.tag);
	}

	/**
	 * Render a background image
	 *
	 * @param {(string | Object)} image The image to render.
	 * @param {Object} [attrs] Attributes for the tag.
	 * @param {Object} [options] Options to modify behaviour.
	 * @return {string}
	 *
	 */
	function imgBg(image, attrs, options) {

		if(!$uk.isPlainObject(attrs)) attrs = {};
		if(!$uk.isPlainObject(options)) options = {};

		// Set default attributes
		attrs = $uk.assign({
			alt: false,
			class: "uk-background-cover"
		}, attrs);

		// Set default options
		options = $uk.assign({
			tag: "div",
			focus: true
		}, options);

		return img(image, attrs, options);
	}

	/**
	 * Check if a string is a tag
	 *
	 * @param {string} str The string to be checked.
	 * @return {boolean}
	 *
	 */
	function isTag(str) {
		return /<[a-z][\s\S]*>/i.test(str);
	}

	/**
	 * Load assets
	 *
	 * @param {Array} assets The src url of the script to be loaded.
	 * @param {Promise}
	 *
	 */
	function loadAssets(assets) {
		var promises = [];
		for(var i = 0; i < assets.length; i++) {
			var asset = assets[i];
			promises.push(asset.substr(-2) == "js" ? loadScript(asset) : loadStyle(asset));
		}
		return Promise.all(promises);
	}

	/**
	 * Load a script and append it to the body
	 *
	 * @param {string} src The src url of the script to be loaded.
	 * @return {Promise}
	 *
	 */
	function loadScript(src) {
		return new Promise(function(resolve) {
			var tag = document.createElement("script");
			tag.src = src;
			tag.async = true;
			tag.onload = function() {
				resolve();
			};
			$uk.append("body", tag);
		});
	}
	
	/**
	 * Load a style and append it to the head
	 *
	 * @param {string} src The src url of the style to be loaded.
	 * @return {Promise}
	 *
	 */
	function loadStyle(src) {
		return new Promise(function(resolve) {
			var tag = document.createElement("link");
			tag.rel = "stylesheet";
			tag.href = src;
			tag.onload = function() {
				resolve();
			};
			$uk.append("head", tag);
		});
	}

	/**
	 * Make a string a tag if it is not already
	 *
	 * @param {string} str The string to be processed.
	 * @return {string}
	 *
	 */
	function makeTag(str) {
		return isTag(str) ? str :
			(str.substr(0, 1) == "<" ? "" : "<") +
				str + (str.substr(str.length - 1, 1) == ">" ? "" : ">");
	}

	/**
	 * Punctuate a string if it is not already
	 *
	 * @param {string} str The string to be punctuated.
	 * @param {string} [punctuation] The punctuation mark to use.
	 * @return {string}
	 *
	 */
	function punctuateString(str, punctuation) {
		if(punctuation === void 0) punctuation = ".";
		if(!/.*[.,\/!?\^&\*;:{}=]$/.test(str)) str = str + punctuation;
		return str;
	}

	/**
	 * Create a query string from data
	 *
	 * @param {Object} query
	 * @return {string}
	 *
	 */
	function queryString(query) {
		return "?" + Object.keys(query).map(function(key) {
			return key + "=" + query[key];
		}).join("&");
	}

	/**
	 * Set an option value
	 *
	 * ### Examples
	 * Set default duration to 300ms
	 * `NB.util.setOption("duration", 300);`
	 * Set default duration for ukAlert to 300ms
	 * `NB.util.setOption("ukAlert", {duration: 300});`
	 *
	 * @param {string} key
	 * @param {*} value
	 *
	 */
	function setOption(key, value) {
		if(key === void 0 || value === void 0) return;
		if(!(key in NB.options)) return;
		if($uk.isPlainObject(NB.options[key]) && $uk.isPlainObject(value)) {
			NB.options[key] = $uk.assign({}, NB.options[key], value);
		} else {
			NB.options[key] = value;
		}
	}

	/**
	 * Return a UIkit alert
	 *
	 * @param {string} message The alert message.
	 * @return {string}
	 *
	 */
	function ukAlert(message) {

		if(message === void 0) return;
		if($uk.isArray(message)) message = message.join("<br>");

		var style = "primary";
		var options = {};
		var close = false;
		var attrs = {class: ["uk-alert"]};

		// Get and set any other arguments provided
		for(var i = 1; i < arguments.length; i++) {
			var arg = arguments[i];
			if($uk.isBoolean(arg)) {
				close = arg;
			} else if($uk.isNumeric(arg)) {
				arg = $uk.toNumber(arg);
				if(i == 1) {
					style = arg < 100 || arg >= 400 ? "danger" : "success";
				} else {
					options.duration = arg;
				}
			} else if($uk.isString(arg)) {
				style = arg;
			} else if($uk.isArray(arg)) {
				for(var n = 0; n < arg.length; n++) attrs.class.push(arg[n]);
			} else if($uk.isPlainObject(arg)) {
				if("animation" in arg) {
					options = $uk.assign(options, arg);
				} else {
					if("class" in arg) {
						if(!$uk.isArray(arg.class)) arg.class = arg.class.split(" ");
						for(var n = 0; n < arg.class.length; n++) attrs.class.push(arg.class[n]);
						delete arg.class;
					}
					attrs = $uk.assign(attrs, arg);
				}
			}
		}

		// Add role=alert to "danger" style
		if(style == "danger") attrs.role = "alert";

		// Set style class
		attrs.class.push("uk-alert-" + style);

		// Set options
		attrs["dataUkAlert"] = close || Object.keys(options).length ?
			$uk.assign({}, NB.options.ukAlert, options) : true;

		return wrap(
			(close ? attr({
				class: "uk-alert-close",
				dataUkClose: true
			}, "a", true) : "") +
			wrap(message, (isTag(message) ? "" : "p")),
			attrs,
			"div"
		);
	}

	/**
	 * Return a UIkit icon
	 *
	 * @param {string} icon The UIkit icon to return.
	 * @return {string}
	 *
	 */
	function ukIcon(icon) {

		if(icon === void 0) return;
		var options = $uk.isString(icon) ? {icon: icon.replace("uk-", "")} : icon;
		if(!$uk.isPlainObject(options)) return;

		var a = "dataUkIcon";
		var attrs = {};
		var tag = "span";

		// Get and set any other arguments provided
		for(var i = 1; i < arguments.length; i++) {
			var arg = arguments[i];
			if($uk.isNumeric(arg)) {
				options.ratio = $uk.toNumber(arg);
			} else if($uk.isString(arg)) {
				if($uk.startsWith($uk.hyphenate(arg), "data-uk")) {
					a = arg;
				} else {
					tag = arg;
				}
			} else if($uk.isArray(arg)) {
				attrs.class = arg;
			} else if($uk.isPlainObject(arg)) {
				attrs = $uk.assign(attrs, arg);
			}
		}

		attrs[a] = options;

		return attr(attrs, tag, true);
	}

	/**
	 * Generate a UIkit notification
	 *
	 * @param {(Object | string)} options The UIkit Notification options.
	 *
	 */
	function ukNotification(options) {

		if(options === void 0) return;
		if($uk.isString(options)) options = {message: options};
		if(!$uk.isPlainObject(options)) return;

		// Get and set any other arguments provided
		for(var i = 1; i < arguments.length; i++) {
			var arg = arguments[i];
			if($uk.isNumeric(arg)) {
				options.timeout = $uk.toNumber(arg);
			} else if($uk.isString(arg)) {
				if(arg.includes("-")) {
					options.pos = arg;
				} else {
					options.status = arg;
				}
			} else if($uk.isPlainObject(arg)) {
				options = $uk.assign(arg, options);
			}
		}

		if(!$uk.isUndefined(options.message)) {
			UIkit.notification($uk.assign({}, NB.options.ukNotification, options));
		}
	}

	/**
	 * Return a UIkit spinner
	 *
	 * @return {string}
	 *
	 */
	function ukSpinner() {
		var args = [{}, "dataUkSpinner"];
		for(var i = 0; i < arguments.length; i++) args.push(arguments[i]);
		return ukIcon.apply(null, args);
	}

	/**
	 * Get the UIkit container widths
	 *
	 * If an array of uk- width classes are passed,
	 * an array of values for the `sizes` attribute is returned.
	 *
	 * @param {Array} [classes]
	 * @param {string} [search]
	 * @return {Array}
	 *
	 */
	function ukWidths(classes, search) {

		var widths = {};
		var sizes = ["s", "m", "l", "xl"];
		for(var i = 0; i < sizes.length; i++) {
			widths[sizes[i]] = $uk.toNumber($uk.getCssVar("breakpoint-" + sizes[i]).replace("px", ""));
		}

		if(classes === void 0) return widths;
		if(search === void 0) search = "uk-child-width-1-";

		var sizes = [];
		for(var i = 0; i < classes.length; i++) {
			var cls = classes[i];
			if(cls.indexOf(search) !== -1) {
				var size = cls.indexOf("@") !== -1 ? cls.split("@")[1] : 0;
				var width = 100 / parseInt(cls.replace(search, ""));
				sizes.push(
					(size && (size in widths) ? "(min-width: " + widths[size] + "px) " : "") +
					(width.toFixed(2) + "vw")
				);
			}
		}

		return sizes;
	}

	/**
	 * Wrap a string, or strings, in an HTML tag
	 *
	 * @param {(string | Array)} str The string(s) to be wrapped.
	 * @param {(string | Array | Object)} wrapper The html tag(s) or tag attributes.
	 * @param {string} [tag] An optional tag, used if wrapper is an array/object.
	 * @return {string}
	 *
	 */
	function wrap(str, wrapper, tag) {

		// If no wrapper is specified, return the string
		if((wrapper === void 0 || !wrapper) && tag === void 0) return str;

		// If the wrap is an array, either:
		// Render as attributes if associative and a tag is specified;
		// Render as a <div> with class attribute if sequential
		if($uk.isArray(wrapper) || $uk.isPlainObject(wrapper)) wrapper = attr(wrapper, tag);

		// If the wrap begins with a UIkit "uk-" or NB "nb-" class,
		// the wrap becomes a <div> with class attribute
		if($uk.isString(wrapper) && ($uk.startsWith(wrapper, "uk-") || $uk.startsWith(wrapper, "nb-"))) {
			wrapper = "<div class='" + wrapper + "'>";
		}

		// Make sure the wrap is an html tag
		wrapper = makeTag(wrapper);

		// If the string is an array, implode by the wrapper tag
		if($uk.isArray(str)) {
			// Implode by joined wrap
			var e = wrapper.split(">")[0].replace("<", "");
			str = str.join("</" + e.split(" ")[0] + "><" + e + ">");
		}

		// Split the wrap for wrapping the string
		var parts;
		if($uk.includes(wrapper, "></") && !/=['|\"][^']+(><\/)[^']+['|\"]/.test(wrapper)) {
			parts = wrapper.split("></");
			return parts[0] + ">" + str + "</" + parts.splice(1).join("></");
		} else {
			parts = wrapper.split(">", 2);
			return parts.length == 2 ?
				wrapper + str + "</" + (parts[0].split(" ")[0]).replace(/</gi, "") + ">" :
				str;
		}
	}

	/**
	 * Polyfill for Element.closest();
	 *
	 */
	if(!Element.prototype.matches) {
		Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
	}

	if(!Element.prototype.closest) {
		Element.prototype.closest = function(s) {
			var el = this;
			do {
				if (el.matches(s)) return el;
				el = el.parentElement || el.parentNode;
			} while (el !== null && el.nodeType === 1);
			return null;
		};
	}

	/**
	 * Polyfill for FormData.entries();
	 *
	 */
	var formDataEntries = function(form) {

		if(typeof FormData === "function" && "entries" in FormData.prototype) {

			return Array.from(new FormData(form).entries());

		} else {

			var entries = [];
			var elements = form.elements;

			for(var i = 0; i < elements.length; i++) {

				var el = elements[i];
				var tagName = el.tagName.toUpperCase();

				if(tagName === "SELECT" || tagName === "TEXTAREA" || tagName === "INPUT") {

					var type = el.type;
					var name = el.name;

					if(
						name &&
						!el.disabled &&
						type !== "submit" &&
						type !== "reset" &&
						type !== "button" &&
						((type !== "radio" && type !== "checkbox") || el.checked)
					) {
						if(tagName === "SELECT") {
							var options = el.getElementsByTagName("option")
							for(var j = 0; j < options.length; j++) {
								var option = options[j];
								if(option.selected) entries.push([name, option.value])
							}
						} else if(type === "file") {
							entries.push([name, '']);
						} else {
							entries.push([name, el.value]);
						}
					}
				}
			}

			return entries;
		}
	};

	/**
	 * Debug Timer
	 *
	 */
	function debugTimer() {
		var end = false;
		var label = [];
		for(var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if($uk.isBoolean(arg)) {
				end = arg;
			} else if($uk.isObject(arg)) {
				label.push(JSON.stringify(arg));
			} else if($uk.isArray(arg)) {
				label.push(arg);
			} else {
				label.push(arg);
			}
		}
		console["time" + (end ? "End" : "")](label.join(" - "));
	}

	/**
	 * Obfuscate
	 *
	 * Process and output obfuscated text.
	 * Useful for protecting mailto: and tel: links.
	 *
	 * The attribute value must be a base64 encoded string.
	 * If the decoded string evaluates as a JSON encoded string,
	 * this will be parsed and handled as an object. The object
	 * must contain a `text` parameter (unless `href` is passed),
	 * and any other parameters will be rendered as attributes.
	 *
	 * Plain Text
	 * ```
	 * $nb.attr({
	 *     dataUkNbObfuscate: base64_encode("Text to obfuscate")
	 * }, "div", true);
	 * ```
	 *
	 * Email address link (mailto:)
	 * ```
	 * $nb.attr({
	 *     ariaLabel: "Send an email",
	 *     dataUkNbObfuscate: $nb.base64_encode({
	 *         href: "mailto:info@nbcommunication.com",
	 *         text: "Email Us"
	 *     })
	 * }, "a", true);
	 * ```
	 *
	 * Telephone number link (tel:)
	 * ```
	 * $nb.attr({
	 *     ariaLabel: "Make a call",
	 *     dataUkNbObfuscate: {
	 *         href: "tel:01595696155",
	 *         text: "+44 (0) 1595 696155",
	 *         class: "nb-tel"
	 *     }
	 * }, "a", true);
	 * ```
	 *
	 */
	var Obfuscate = {

		args: "text",

		props: ["text"], // The text to display.

		beforeConnect: function() {

			var value = base64_decode(this.text);
			var text = value;

			if($uk.isPlainObject(value)) {
				text = value.text;
				for(var key in value) {
					if(key !== "text") {
						if(key == "href" && !text) text = value[key];
						$uk.attr(this.$el, key, attrValue(value[key]));
					}
				}
			}

			this.$el.innerHTML = text;
			$uk.removeAttr(this.$el, "data-" + this.$name);
		}
	};

	/**
	 * Form
	 *
	 * Handle form validation and submission.
	 *
	 * ### Example
	 * ```
	 * $nb.wrap(formFields, {
	 *     dataUkNbForm: "This form requires confirmation to submit!"
	 * }, "form");
	 * ```
	 *
	 */
	var Form = {

		args: "msgConfirm",

		props: ["msgConfirm"], // A message to be used if the user should be prompted to confirm prior to submission.

		data: {
			button: null,
			buttonText: null,
			captcha: null,
			response: "",
			scroller: null,
			status: 0
		},

		beforeConnect: function() {

			var form = this.$el;

			// Update the form's CSRF post token
			var inputCSRF = $uk.$("input[type=hidden]._post_token", form);
			if(inputCSRF) {
				graphql("{CSRF {tokenName tokenValue}}").then(function(result) {
					if(result.status == 200) {
						var CSRF = result.response.CSRF;
						$uk.attr(inputCSRF, "name", CSRF.tokenName);
						$uk.attr(inputCSRF, "value", CSRF.tokenValue);
					}
				}, $uk.noop);
			}

			// Handle Inputfield conditionals
			formConditionals.call(form, "show");
			formConditionals.call(form, "required");

			// Add the scroller div
			this.scroller = $uk.$(attr({hidden: true}, "div", true));
			$uk.append(form, this.scroller);
		},

		connected: function() {
			var form = this.$el;
			setTimeout(function() {
				$uk.trigger(form, "onload", this);
			}, duration);
		},

		events: {

			submit: function(e) {

				e.preventDefault();
				e.stopPropagation();

				var form = this.$el;
				var errors = [];

				// Validate

				var previous = $$("nb-form-errors", form);
				if(previous) $uk.remove(previous);

				$uk.$$("input[required], select[required], textarea[required]", form).forEach(function(input) {
					$uk.attr(input, "aria-invalid", false);
					$uk.remove($("nb-form-error", input.closest(".nb-form-content")));
				});

				$uk.$$("input[required], select[required], textarea[required]", form).forEach(function(input) {

					if(!input.validity.valid) {

						$uk.attr(input, "aria-invalid", true);

						var error = $uk.attr(input, "title"); if(!error) error = input.validationMessage;
						var id = input.id;
						var label = id ? $uk.$("label[for=" + id + "]", form) : null;

						error = punctuateString(error);
						errors.push(wrap((label ? label.innerHTML + ": " : "") + error, {
							href: "#" + (id ? id : form.id),
							class: "uk-link-reset",
							dataUkScroll: {
								duration: NB.options.speed,
								offset: NB.options.offset
							}
						}, "a"));

						var e = wrap(ukIcon("warning", 0.75) + " " + error, "uk-text-danger nb-form-error");
						var alert = $uk.$("[role=alert]", input.closest(".nb-form-content"));

						if(alert) {
							$uk.append(alert, e);
						} else {
							$uk.before(input, e);
						}
					}
				});

				if(errors.length) {

					$uk.trigger(form, "invalid", this);

					// Display errors
					$uk.before(
						$("uk-grid", form),
						ukAlert(wrap(wrap(errors, "li"), "ul"), "danger", ["nb-form-errors"])
					);

					// Scroll to top of form
					UIkit.scroll(this.scroller, {
						duration: NB.options.speed,
						offset: NB.options.offset
					}).scrollTo(form);

					$uk.on(".nb-form-errors a[href^='#']", "click", function(e) {
						$uk.$($uk.attr(this, "href")).focus();
					});

					return false;

				} else {

					// Set variables for later use
					this.button = $uk.$("button[type=submit]", form);

					// If a confirmation is required
					if(this.msgConfirm) {

						var this$1 = this;
						UIkit.modal.confirm(this.msgConfirm).then(function() {
							// Confirmed, send the data
							formSend.call(this$1);
						}, function() {
							// Not confirmed return
							return false;
						});

					} else {

						// No confirmation required, send the data
						formSend.call(this);
					}
				}
			}
		}
	};

	/**
	 * Send form data
	 *
	 */
	function formSend() {

		var form = this.$el;
		var method = $uk.attr(form, "method");

		// Set the button to loading
		this.buttonText = $uk.html(this.button);
		$uk.html(this.button, ukSpinner(0.467));

		// Captcha
		this.captcha = $("g-recaptcha", form);

		$uk.trigger(form, "beforeSend", this);

		// Send the data
		var this$1 = this;
		ajax(form.action, {
			data: new FormData(form),
			method: (method ? method : "POST")
		}).then(
			function(result) {
				this$1.status = result.status;
				this$1.response = result.response;
				if(result.response) {
					formComplete.call(this$1);
				} else {
					formError.call(this$1, result.status, "Error");
				}
			},
			function(result) {
				formError.call(this$1, result.status, result.response);
			}
		);
	}

	/**
	 * Handle form error
	 *
	 * @param {number} status
	 * @param {(string | Array)} errors
	 *
	 */
	function formError(status, errors) {

		this.status = status;
		this.response = errors;

		$uk.trigger(this.$el, "error", this);

		if($uk.includes([401, 412, 500], status)) {
			// Unauthorised || Precondition failed || Server Error
			formReset.call(this);
			UIkit.modal.alert(ukAlert(errors, "danger"));
		} else {
			formComplete.call(this);
		}
	}

	/**
	 * Handle form completion
	 *
	 *
	 */
	function formComplete() {

		var form = this.$el;
		var message = this.response;

		$uk.trigger(form, "complete", this);

		if($uk.isPlainObject(message)) {
			if(message.notification) ukNotification(message.notification);
			if("redirect" in message) {
				if(message.redirect) {
					if($uk.isString(message.redirect)) {
						window.location.href = message.redirect;
					} else {
						window.location.reload();
					}
				}
				formReset.call(this);
				return;
			}
			message = message.message;
		}

		// Remove button / captcha
		$uk.remove(this.button);
		if(this.captcha) $uk.remove(this.captcha);

		// Disable inputs
		$uk.$$("input, select, textarea", form).forEach(function(input) {
			$uk.attr(input, "disabled", true);
		});

		if(message) {

			var fieldsWrap = $("uk-grid", form);

			// Output message
			$uk.before((fieldsWrap ? fieldsWrap : form), ukAlert(message, this.status));

			// Scroll to top of form
			UIkit.scroll(this.scroller, {
				duration: NB.options.speed,
				offset: NB.options.offset
			}).scrollTo(form);
		}
	}

	/**
	 * Reset the form
	 *
	 *
	 */
	function formReset() {
		$uk.html(this.button, this.buttonText);
		if(this.captcha) grecaptcha.reset();
	}

	/**
	 * Evaluate Inputfield conditional
	 *
	 * @param {*} value1
	 * @param {string} operator
	 * @param {*} value2
	 * @return {boolean}
	 *
	 */
	function formConditional(value1, operator, value2) {
		var match = false;
		switch(operator) {
			case "=":
				match = value1 == value2;
				break;
			case '!=':
				match = value1 != value2;
				break;
			case '>':
				match = value1 > value2;
				break;
			case '<':
				match = value1 < value2;
				break;
			case '>=':
				match = value1 >= value2;
				break;
			case '<=':
				match = value1 <= value2;
				break;
			case '*=':
			case '%=':
				match = $uk.includes(value1, value2);
				break;
		}
		return match;
	}

	/**
	 * Handle Inputfield conditionals
	 *
	 * @param {string} type
	 *
	 */
	function formConditionals(type) {

		var form = this;
		var inputfields = $uk.$$("[data-" + type + "-if]", form); // Inputfields with if conditions
		if(!inputfields.length) return;

		var conditionals = [];
		var inputs = []; // All inputs to attach the onchange event to
		inputfields.forEach(function(inputfield) {

			var conditional = {
				inputfield: inputfield, // The inputfield with conditions
				inputs: [], // The field names of the inputs used in the conditions
				conditions: [] // The conditions
			};

			// Split conditions and cycle
			var parts = $uk.data(inputfield, type + "-if").match(/(^|,)([^,]+)/g);
			for(var n = 0; n < parts.length; n++) {

				// Match condition
				var match = parts[n].match(/^[,\s]*([_.|a-zA-Z0-9]+)(=|!=|<=|>=|<|>|%=)([^,]+),?$/);
				if(!match) continue;

				// Condition
				var field = match[1];
				var operator = match[2];
				var value = match[3];

				// Fields and values can be multiple
				var fields = $uk.includes(field, "|") ? field.split("|") : [field];
				var values = $uk.includes(value, "|") ? value.split("|") : [value];

				// Remove quotes from values
				for(var fv = 0; fv < values.length; fv++) {
					values[fv] = values[fv].replace(/^('|")|('|")$/g, "");
				}

				// Add to conditional data
				conditional.inputs = conditional.inputs.concat(fields);
				inputs = inputs.concat(fields);
				conditional.conditions.push({
					fields: fields,
					operator: operator,
					values: values,
				});
			}

			conditionals.push(conditional);
		});

		$uk.on(document, "UIkit_initialized", function() {

			// Cycle through all the inputs used in conditions and attach the event handler
			for(var i = 0; i < inputs.length; i++) {

				var name = inputs[i];
				var input = $uk.$$("[name=" + name + "]", form);
				if(!input.length) input = $uk.$$("[name='" + name + "[]']", form);

				if(input.length) {

					// Attach onchange event
					$uk.on(input, "change", function() {

						for(var n = 0; n < conditionals.length; n++) {

							var conditional = conditionals[n];
							// If this input is not used in this inputfields conditions
							if(!$uk.includes(conditional.inputs, this.name.replace("[]", ""))) continue;

							var matches = 0;
							var required = conditional.conditions.length; // The number of conditions to be met
							for(var c = 0; c < required; c++) {

								var condition = conditional.conditions[c];
								var fields = condition.fields;
								var operator = condition.operator;
								var values = condition.values;

								for(var fn = 0; fn < fields.length; fn++) {

									var name = fields[fn];
									var inputs = $uk.$$("[name=" + name + "]", form);

									if(inputs.length == 1) {
										// Single input
										var input = inputs[0];
										for(var fv = 0; fv < values.length; fv++) {
											var value = values[fv];
											if(input.type == "checkbox") {
												if(formConditional((input.checked ? input.value : 0), operator, value)) matches++;
											} else if(formConditional(input.value, operator, value)) {
												matches++;
											}
										}
									} else if(inputs.length > 1) {
										// Radio
										var checked = false;
										inputs.forEach(function(input) {
											if(input.checked) {
												checked = true;
												for(var fv = 0; fv < values.length; fv++) {
													if(formConditional(input.value, operator, values[fv])) matches++;
												}
											}
										});
										if(!checked && formConditional("", operator, values[fv])) matches++;
									} else {

										// Select Multiple / Checkboxes
										var inputs = $uk.$$("[name='" + name + "[]']");
										if(inputs.length) {
											var inputValues = [];
											inputs.forEach(function(input) {
												if(input.type == "checkbox") {
													if(input.checked) inputValues.push(input.value);
												} else {
													var options = input.options;
													for(var o = 0; o < options.length; o++) {
														var option = options[o];
														if(option.selected) inputValues.push(option.value);
													}
												}
											});
											if(!inputValues.length) inputValues.push("");
											var matchesMultiple = 0;
											for(var iv = 0; iv < inputValues.length; iv++) {
												for(var fv = 0; fv < values.length; fv++) {
													if(formConditional(inputValues[iv], operator, values[fv])) {
														matchesMultiple++;
													}
												}
											}
											if(matchesMultiple) matches++;
										}
									}
								}
							}

							var inputfield = conditional.inputfield;
							var matched = matches >= required;
							switch(type) {
								case "show":
									inputfield.style.display = matched ? "" : "none";
									break;
								case "required":
									$uk[(matched ? "add" : "remove") + "Class"](inputfield, "nb-form-required");
									$uk.$$("input, select, textarea", inputfield).forEach(function(input) {
										if(input.offsetWidth > 0 || input.offsetHeight > 0) {
											input.required = matches;
										}
									});
									break;
							}
						}
					});

					// Trigger change event when UIkit is initialised
					$uk.trigger(input, "change");
				}
			}
		});
	}

	/**
	 * JSON
	 *
	 * Initialise the JSON interface.
	 *
	 * ### Examples
	 * No options:
	 * `<div id='no-options' data-uk-nb-json></div>`
	 *
	 * All options:
	 * ```
	 * <div id='all-options' data-uk-nb-json='{
	 *     "config": {"readMore": "Find Out More", "showTemplate": true},
	 *     "clsMore": "uk-text-center uk-margin-large-top",
	 *     "clsMoreButton": "uk-button-default",
	 *     "error": "Sorry, the items cannot be rendered.",
	 *     "form": "#query-form",
	 *     "loadMore": "Find out more...",
	 *     "message": "Found {count} of {total}",
	 *     "noResults": "No items found",
	 *     "query": "query($selectors: String, $start: Int) { post(selectors: $selectors, start: $start) { title } }",
	 *     "render": "customRenderFunction",
	 *     "variables": {"selectors": "title%=Lorem", "start": 0}
	 * }'></div>
	 * ```
	 *
	 * Render existing base64 encoded response (e.g. generated by PHP)
	 * `<div id='render' data-uk-nb-json='{response}'></div>`
	 *
	 * ### Rendering
	 * To render the items returned, use the following in your theme's JS:
	 * `function renderItems(items) {}`
	 * You can also specify a custom function by passing its name as the `render` parameter.
	 *
	 */
	var Json = {

		args: "renderData",

		props: {
			config: Object, // Configuration options.
			clsMore: String, // Classes to use for the "Load More" element.
			clsMoreButton: String, // Classes to use for the "Load More" button.
			error: String, // The default error message.
			form: String, // A selector for the query form.
			loadMore: String, // The text to use for the "Load More" button.
			message: String, // A message to be displayed after a successful request.
			noResults: String, // A message to be displayed if no results are found.
			query: String, // The GraphQL request query string.
			render: String, // The name of the function used to render the data.
			renderData: String, // Data to render instead of performing a request (default="renderItems").
			variables: Object // The GraphQL request variables.
		},

		data: {
			count: 0,
			config: {},
			clsMore: "uk-text-center uk-margin-large-top",
			clsMoreButton: "uk-button-primary",
			error: "Error",
			errors: [],
			init: 0,
			initQuery: false,
			items: [],
			remaining: 0,
			render: "renderItems",
			response: {},
			selectors: "",
			start: 0,
			status: 0,
			total: 0,
			variables: {}
		},

		beforeConnect: function() {

			// Set init values
			var init = ["start", "selectors"];
			for(var i = 0; i < init.length; i++) {
				var key = init[i];
				if(this.variables[key]) this[key] = this.variables[key];
			}
			this.init = this.start;

			// Default error
			this.errors = [this.error];

			// Make sure classes are present
			if(!$uk.includes(this.clsMore, "nb-json-more")) {
				this.clsMore += " nb-json-more";
			}
			if($uk.includes(this.clsMoreButton, "uk-button-") && !$uk.includes(this.clsMoreButton, "uk-button ")) {
				this.clsMoreButton += " uk-button";
			}

			var this$1 = this;
			if(this.form && $uk.isUndefined(this._connected)) {

				// Form filters
				$uk.on(this.form, "submit reset", function(e) {

					var selectors = [];
					if(e.type == "submit") {

						e.preventDefault();
						e.stopPropagation();

						var formData = formDataEntries(this);
						for(var i = 0; i < formData.length; i++) {
							var value = formData[i][1];
							if(value) {
								var name = formData[i][0];
								var operator = "=";
								var selectorData = data($uk.$("[name=" + name + "]", this), "json-selectors");
								if($uk.isPlainObject(selectorData)) {
									var selectorValues = selectorData.values[value];
									for(var selectorKey in selectorData.selectors) {
										selectors.push(selectorKey + selectorValues[selectorData.selectors[selectorKey]]);
									}
								} else {
									if($uk.includes(name, operator)) operator = "";
									selectors.push(name + operator + value);
								}
							}
						}
					}

					jsonQuery.call(this$1, selectors.join(","));
				});
			}

			// Button Filters
			var filters = $$("json-filter", "[data]");
			if(filters.length)  {
				$uk.on(filters, "click", function(e) {
					e.preventDefault();
					var selectors = $uk.data(this, "json-filter");
					$uk.removeClass(filters, "uk-active");
					if(selectors) $uk.addClass(this, "uk-active");
					jsonQuery.call(this$1, selectors);
				});
			}
		},

		connected: function() {

			var el = this.$el;
			var this$1 = this;

			$uk.on(el, "error", function() {
				$uk.html(el, ukAlert(this$1.errors, this$1.status));
			});

			if(this.renderData) {

				this.response = base64_decode(this.renderData);
				jsonParseResponse.call(this);

				if(this.count) {
					$uk.html(el, jsonRender.call(this));
					$uk.trigger(el, "render", this);
					$uk.trigger(el, "complete", this);
				}

				// Remove attribute and destroy
				$uk.removeAttr(el, "data-" + this.$name);
				this.$destroy();

			} else {

				var values = 0;
				if(this.form) {
					// Trigger submit if values present
					var inputs = $uk.$$("input, select, textarea", $uk.$(this.form));
					for(var i = 0; i < inputs.length; i++) {
						if(inputs[i].value) {
							values++;
						}
					}
				}

				if(values) {
					$uk.trigger(this$1.form, "submit");
				} else {
					jsonRequest.call(this);
				}
			}
		},

		events: [
			{
				name: "click",

				delegate: function() {
					return ".nb-json-more button";
				},

				handler: function(e) {
					jsonRequest.call(this);
				}
			}
		]
	};

	/**
	 * Parse a successful GraphQL JSON response
	 *
	 */
	function jsonParseResponse() {
		for(var key in this.response) {
			var data = this.response[key];
			if($uk.isArray(data)) {
				this.config.query = key;
				this.items = data;
				this.count = data.length;
			} else if(key == "getTotal") {
				this.total = data;
			}
			// This can only handle a single query + getTotal;
			if(this.count && this.total) break;
		}
	}

	/**
	 * Perform a new request with selectors
	 *
	 * @param {string} selectors
	 *
	 */
	function jsonQuery(selectors) {
		var selectors = [selectors];
		if(this.selectors) selectors.push(this.selectors);
		this.initQuery = false;
		this.start = this.init;
		this.total = 0;
		this.variables.selectors = selectors.join(",");
		this.variables.start = this.start;
		$uk.html(this.$el, "");
		jsonRequest.call(this);
	}

	/**
	 * Request JSON data
	 *
	 */
	function jsonRequest() {

		var el = this.$el;
		var more = $("nb-json-more", el);

		// Reset counts
		this.count = 0;
		this.remaining = 0;

		// Remove previous errors
		$uk.remove(".uk-alert", el);

		// Create more element/button
		if(!more) {
			more = $uk.$(wrap(
				wrap(this.loadMore, {
					type: "button",
					class: this.clsMoreButton
				}, "button"),
				this.clsMore
			));
			$uk.append(el, more);
		}

		more.style.display = "";

		// Set button to loading
		var moreButton = $uk.$("button", more);
		$uk.attr(moreButton, "disabled", true);
		$uk.html(moreButton, $uk.html(moreButton).replace(this.loadMore, ukSpinner(0.467)));

		// Set start
		this.variables.start = this.start;

		if(!this.initQuery) {
			this.initQuery = true;
			$uk.trigger(el, "initQuery", this);
		}

		// Request
		var this$1 = this;
		graphql(this.query, this.variables).then(
			function(result) {

				this$1.status = result.status;
				this$1.response = result.response;

				var response = this$1.response;
				if(response) {

					// Set button back to active
					$uk.removeAttr(moreButton, "disabled");
					var spinner = $("uk-spinner", moreButton);
					if(spinner) {
						$uk.before(spinner, this$1.loadMore)
						$uk.remove(spinner);
					}

					// Parse the data
					jsonParseResponse.call(this$1);

					// Get the number of results remaining
					this$1.remaining = this$1.total ? (this$1.total - this$1.start - this$1.count) : -1;

					// Display a message
					if(this$1.message) {

						var message = $("nb-json-message", el);
						if(!message) {
							message = $uk.$(wrap("", "nb-json-message uk-margin-top uk-margin-bottom"));
							$uk.prepend(el, message);
						}

						var msg = this$1.message
							.replace("{count}", (this$1.count + this$1.start - this$1.init))
							.replace("{total}", (this$1.total - this$1.init));

						$uk.html(
							message,
							("jsonMessage" in window ? 
								jsonMessage(msg) : ukAlert(msg, "primary"))
						);
					}

					// Output
					if(this$1.count) {
						$uk.before(more, jsonRender.call(this$1));
						$uk.trigger(el, "render", this$1);
					} else {
						this$1.errors = [this$1.noResults];
						this$1.status = 404;
						$uk.trigger(el, "error", this$1);
					}

					// Process
					if(this$1.remaining <= 0 || !this$1.count || !this$1.loadMore) {
						// If no/all results have been found, hide button
						more.style.display = "none";
					} else {
						// Set the new start value
						this$1.start = this$1.start + this$1.count;
					}

					$uk.trigger(el, "complete", this$1);

				} else {
					$uk.trigger(el, "error", this$1);
				}
			},
			function(result) {
				this$1.status = result.status;
				this$1.errors = result.response;
				$uk.trigger(el, "error", this$1);
			}
		);
	}

	/**
	 * Render JSON items
	 *
	 * @param {Array} [items]
	 * @return {string}
	 *
	 */
	function jsonRender(items) {
		if(items === void 0) items = this.items;
		var render = window[this.render];
		if(!$uk.isFunction(render) || !$uk.isArray(items)) {
			this.status = 500;
			return "";
		}
		return render.call(this, items);
	}

	UIkit.component("nbObfuscate", Obfuscate);
	UIkit.component("nbForm", Form);
	UIkit.component("nbJson", Json);

	/**
	 * API
	 *
	 */
	var NB = function() {};
	var duration = 256;

	// Options
	NB.options = {
		graphql: "/graphql",
		offset: 128,
		duration: duration,
		ukAlert: {
			animation: true,
			duration: duration
		},
		ukNotification: {
			status: "primary",
			pos: "top-right",
			timeout: (duration * 16)
		}
	};

	// Utilities
	NB.util = Object.freeze({
		$: $,
		$$: $$,
		ajax: ajax,
		attr: attr,
		base64_decode: base64_decode,
		base64_encode: base64_encode,
		data: data,
		debounce: debounce,
		debugTimer: debugTimer,
		getRequestResponse: getRequestResponse,
		graphql: graphql,
		img: img,
		imgBg: imgBg,
		isTag: isTag,
		jsonQuery: jsonQuery,
		loadAssets: loadAssets,
		loadStyle: loadStyle,
		loadScript: loadScript,
		makeTag: makeTag,
		punctuateString: punctuateString,
		queryString: queryString,
		setOption: setOption,
		ukAlert: ukAlert,
		ukIcon: ukIcon,
		ukNotification: ukNotification,
		ukSpinner: ukSpinner,
		ukWidths: ukWidths,
		wrap: wrap
	});

	/**
	 * Initialise
	 *
	 */
	function init(NB) {

		$uk.ready(function() {

			// Trigger an event when UIkit is initialised
			var initialized = setInterval(function() {
				if(UIkit._initialized) {
					$uk.trigger(document, "UIkit_initialized");
					clearInterval(initialized);
				}
			}, duration);

			// Set offset option based on header height
			var header = $uk.$("header");
			if(header) setOption("offset", header.offsetHeight + 32);

			// Make sure external links have the appropriate rel attributes
			var links = $uk.$$("a[target=_blank]");
			if(links) {
				var protect = ["noopener", "noreferrer"];
				links.forEach(function(link) {
					var rel = $uk.attr(link, "rel");
					rel = $uk.isString(rel) ? rel.split(" ") : [];
					for(var i = 0; i < protect.length; i++) if(rel.indexOf(protect[i]) < 0) rel.push(protect[i]);
					$uk.attr(link, "rel", rel.join(" "));
				});
			}
		});
	}

	{
		init(NB);
	}

	return NB;

}));
