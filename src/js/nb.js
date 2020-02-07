/**
 * NB Communication JS
 *
 * @version 3.2.2
 * @author Chris Thomson
 * @copyright 2019 NB Communication Ltd
 *
 */

if(typeof UIkit === "undefined") {
	throw new Error("NB requires UIkit. UIkit must be included before this script.");
}

(function (global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() :
	typeof define === "function" && define.amd ? define("nb", factory) :
	(global = global || self, global.NB = factory());
}(this, function () { "use strict";

	/**
	 * UIkit utilities
	 *
	 * https://github.com/uikit/uikit-site/blob/feature/js-utils/docs/pages/javascript-utilities.md
	 *
	 */
	var $uk = UIkit.util;
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
	 * Select a single or multiple HTML elements from name and context
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
				response = response.errors;
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
			"uk-img": true,
			src: "url"
		}, options);

		var isImg = options.tag === "img";
		var focus = {left: 50, top: 50};
		var srcset = false;
		var sizes = false;

		if($uk.isPlainObject(image)) {
			if(image.focus && $uk.isPlainObject(image.focus)) focus = $uk.assign(focus, image.focus);
			if(image.srcset) srcset = image.srcset;
			if(image.sizes) sizes = image.sizes;
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

		// Set remaining attributes
		if(options["uk-img"]) {
			var a = { // Use uk-img lazy loading
				src: (isImg ? "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" : false),
				"data-src": image,
				"data-srcset": srcset,
				"data-uk-img": options["uk-img"]
			};
			if(sizes) a[(isImg ? "" : "data-") + "sizes"] = sizes;
			attrs = $uk.assign(a, attrs);
		} else if(isImg) {
			attrs.src = image;
			attrs.srcset = srcset;
			attrs.sizes = sizes;
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
		attrs["data-uk-alert"] = close || Object.keys(options).length ?
			$uk.assign({}, NB.options.ukAlert, options) : true;

		return wrap(
			(close ? attr({
				class: "uk-alert-close",
				"data-uk-close": true
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

		var a = "data-uk-icon";
		var attrs = {};
		var tag = "span";

		// Get and set any other arguments provided
		for(var i = 1; i < arguments.length; i++) {
			var arg = arguments[i];
			if($uk.isNumeric(arg)) {
				options.ratio = $uk.toNumber(arg);
			} else if($uk.isString(arg)) {
				if($uk.startsWith(arg, "data-uk")) {
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
		var args = [{}, "data-uk-spinner"];
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
	 *     "data-uk-nb-obfuscate": base64_encode("Text to obfuscate")
	 * }, "div", true);
	 * ```
	 *
	 * Email address link (mailto:)
	 * ```
	 * $nb.attr({
	 *     "aria-label": "Send an email",
	 *     "data-uk-nb-obfuscate": $nb.base64_encode({
	 *         href: "mailto:info@nbcommunication.com",
	 *         text: "Email Us"
	 *     })
	 * }, "a", true);
	 * ```
	 *
	 * Telephone number link (tel:)
	 * ```
	 * $nb.attr({
	 *     "aria-label": "Make a call",
	 *     "data-uk-nb-obfuscate": {
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
	 *     "data-uk-nb-form": "This form requires confirmation to submit!"
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

			// Update the form's CSRF post token
			var inputCSRF = $uk.$("input[type=hidden]._post_token", this.$el);
			if(inputCSRF) {
				ajax("?CSRF=1").then(function(result) {
					if(result.status == 200) {
						$uk.attr(inputCSRF, "name", result.response.name);
						$uk.attr(inputCSRF, "value", result.response.value);
					}
				});
			}

			// Add the scroller div
			this.scroller = $uk.$(attr({hidden: true}, "div", true));
			$uk.append(this.$el, this.scroller);
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

					var inputWrap = input.closest(".nb-form-content");

					$uk.attr(input, "aria-invalid", false);
					$uk.remove($("nb-form-error", inputWrap));

					if(!input.validity.valid) {

						$uk.attr(input, "aria-invalid", true);

						var error = $uk.attr(input, "title"); if(!error) error = input.validationMessage;
						var id = input.id;
						var label = id ? $uk.$("label[for=" + id + "]", form) : null;

						error = punctuateString(error);
						errors.push(wrap((label ? label.innerHTML + ": " : "") + error, {
							href: "#" + (id ? id : form.id),
							class: "uk-link-reset",
							"data-uk-scroll": {
								duration: NB.options.speed,
								offset: NB.options.offset
							}
						}, "a"));

						var e = wrap(ukIcon("warning", 0.75) + " " + error, "uk-text-danger nb-form-error");
						var alert = $uk.$("[role=alert]", inputWrap);

						if(alert) {
							$uk.html(alert, e);
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
			$uk.html(this.button, this.buttonText);
			if(this.captcha) grecaptcha.reset();
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
			if(message.redirect) {
				if($uk.isString(message.redirect)) {
					window.location.href = message.redirect;
				} else {
					window.location.reload();
				}
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
	 *     "clsMore": "uk-text-center uk-margin-large-top",
	 *     "clsMoreButton": "uk-button-default",
	 *     "form": "#query-form",
	 *     "limit": 8,
	 *     "more": "Find out more...",
	 *     "query": {"key": "value"},
	 *     "render": "customRenderFunction",
	 *     "start": 4,
	 *     "url": "/"
	 * }'></div>
	 * ```
	 *
	 * Render existing base64 encoded response (e.g. generated by PHP)
	 * `<div id='render' data-uk-nb-json='{response}'></div>`
	 *
	 * ### Rendering
	 * To render the items returned, use the following in your theme's JS:
	 * `function renderItems(items, config) {}`
	 * You can also specify a custom function by passing its name as the `render` parameter.
	 *
	 */
	var Json = {

		args: "renderData",

		props: {
			clsMore: String, // Classes to use for the "Load More" element
			clsMoreButton: String, // Classes to use for the "Load More" button
			form: String, // A selector for the query form.
			limit: Number, // Limit results by this number.
			more: String, // The text to use for the "Load More" button.
			query: Object, // The query data (key: value).
			render: String, // The name of the function used to render the data.
			renderData: String, // Data to render instead of performing a request.
			start: Number, // Start results from this number (default=0).
			url: String // The url to request data from.
		},

		data: {
			errors: [],
			render: "renderItems",
			response: {},
			start: 0,
			status: 0,
			url: ""
		},

		beforeConnect: function() {

			var this$1 = this;
			if(this.form && $uk.isUndefined(this._connected)) {

				$uk.on(this.form, "submit reset", function(e) {

					var query = {};
					if(e.type == "submit") {

						e.preventDefault();
						e.stopPropagation();

						var formData = formDataEntries(this);
						for(var i = 0; i < formData.length; i++) {
							if(formData[i][1]) {
								query[formData[i][0]] = formData[i][1];
							}
						}
					}

					jsonQuery.call(this$1, query);
				});
			}

			if(!this.clsMore) this.clsMore = "uk-text-center uk-margin-large-top";
			if(!$uk.includes(this.clsMore, "nb-json-more")) {
				this.clsMore = "nb-json-more " + this.clsMore;
			}

			if(!this.clsMoreButton) this.clsMoreButton = "uk-button-primary";
			if($uk.includes(this.clsMoreButton, "uk-button-") && !$uk.includes(this.clsMoreButton, "uk-button ")) {
				this.clsMoreButton = "uk-button " + this.clsMoreButton;
			}

			this.init = this.start;
		},

		connected: function() {

			var el = this.$el;

			if(this.renderData) {

				var out = jsonRender.call(this, base64_decode(this.renderData));
				if(out) {
					$uk.html(el, out);
					$uk.trigger(el, "render", this);
					$uk.trigger(el, "complete", this);
				} else {
					$uk.html(el, ukAlert(ukIcon("warning"), "danger"));
					$uk.trigger(el, "error", this);
				}

				// Remove attribute and destroy
				$uk.removeAttr(el, "data-" + this.$name);
				this.$destroy();

			} else {
				jsonRequest.call(this);
			}

			var this$1 = this;
			$uk.on(el, "error", function() {
				$uk.html(el, ukAlert(this$1.errors, this$1.status));
			});
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
	 * Request JSON data
	 *
	 */
	function jsonRequest() {

		var el = this.$el;
		var more = $("nb-json-more", el);

		// Remove previous errors
		$uk.remove(".uk-alert", el);

		// Create more button
		if(!more) {
			more = $uk.$(wrap(
				wrap(this.more, {
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
		$uk.html(moreButton, $uk.html(moreButton).replace(this.more, ukSpinner(0.467)));

		// Prepare data
		var query = {};
		query.start = this.start;
		if($uk.isNumber(this.limit)) query.limit = this.limit;
		for(var key in this.query) query[key] = this.query[key];

		// Request
		var this$1 = this;
		ajax(this.url + "?" + Object.keys(query).map(function(key) {
			return key + "=" + query[key];
		}).join("&")).then(
			function(result) {

				this$1.status = result.status;
				this$1.response = result.response;

				var response = this$1.response;
				if(response) {

					// Set button back to active
					$uk.removeAttr(moreButton, "disabled");
					var spinner = $("uk-spinner", moreButton);
					if(spinner) {
						$uk.before(spinner, this$1.more)
						$uk.remove(spinner);
					}

					// "Found" message
					if(response.message) {

						var message = $("nb-json-message", el);
						if(!message) {
							message = $uk.$(wrap("", "nb-json-message uk-margin-top uk-margin-bottom"));
							$uk.prepend(el, message);
						}

						$uk.html(
							message,
							ukAlert(
								response.message
									.replace("{count}", (response.count + response.start - this$1.init))
									.replace("{total}", (response.total - this$1.init)),
								"primary"
							)
						);
					}

					// Render
					var out = jsonRender.call(this$1, response);
					if(out) {
						$uk.before(more, out);
						$uk.trigger(el, "render", this$1);
					} else {
						$uk.trigger(el, "error", this$1);
					}

					// Process
					if(!response.count || response.remaining === 0 || !this$1.more) {
						// If no/all results have been found, hide button
						more.style.display = "none";
					} else {
						// Set limit value
						if($uk.isUndefined(this$1.limit)) this$1.limit = parseInt(response.limit);
						// Set the new start value
						this$1.start = this$1.start + this$1.limit;
					}

					$uk.trigger(el, "complete", this$1);

				} else {

					this$1.errors = ["Error"];
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
	 * Render JSON data
	 *
	 * @param {Object} response
	 * @return {string}
	 *
	 */
	function jsonRender(response) {
		var render = window[this.render];
		if(!$uk.isFunction(render) || !$uk.isArray(response.items)) {
			this.errors = ["Sorry, the items could not be rendered."];
			this.status = 500;
			return;
		}
		if($uk.isUndefined(response.config) || !$uk.isPlainObject(response.config)) {
			response.config = {};
		}
		return render.call(this, response.items, response.config);
	}

	/**
	 * Perform a new request with specified data
	 *
	 * @param {Object} query
	 *
	 */
	function jsonQuery(query) {

		var this$1 = this;
		if(arguments.length > 1) this$1 = UIkit.nbJson(arguments[1]);
		var a = "data-" + this$1.$name;
		var el = this$1.$el;
		var request = data(el, a);

		request.query = query;
		$uk.html(el, "");
		this$1.start = this$1.init;
		$uk.attr(el, a, JSON.stringify(request));
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
		getRequestResponse: getRequestResponse,
		img: img,
		imgBg: imgBg,
		isTag: isTag,
		jsonQuery: jsonQuery,
		makeTag: makeTag,
		punctuateString: punctuateString,
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
