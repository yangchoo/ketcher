var ajax = require('./util/ajax.js');

// stealed from https://github.com/iambumblehead/form-urlencoded/
function formEncodeString(str) {
	return str.replace(/[^ !'()~\*]*/g, encodeURIComponent)
		.replace(/ /g, '+')
		.replace(/[!'()~\*]/g, function (ch) {
			return '%' + ('0' + ch.charCodeAt(0).toString(16))
				.slice(-2).toUpperCase();
		});
}

function formEncode(obj) {
	var str = [];
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop)) { // don't handle nested objects
			str.push(encodeURIComponent(prop) + '=' +
			formEncodeString(obj[prop]));
		}
	}
	return str.join('&');
}

function unwrap(xhr) {
	var data = xhr.responseText;
	if (xhr.status >= 300)
		throw data;
	if (data.startsWith('Ok.'))
		return data.substring(data.indexOf('\n') + 1);
	throw Error('Unknown server error: ' + data);
}

function api(base, defaultOptions) {
	var baseUrl = !base || /\/$/.test(base) ? base : base + '/';

	function request(method, url) {
		function options(opts, params, sync) {
			var data = Object.assign({}, defaultOptions, opts);
			return {
				method: method,
				url: res.url,
				sync: sync,
				params: params,
				data: data && formEncode(data),
				headers: data && { 'Content-Type': 'application/x-www-form-urlencoded' }
			};
		}
		function res(data, params) {
			return ajax(options(data, params)).then(unwrap, unwrap);
		}
		res.sync = function (data, params) {
			// TODO: handle errors
			return unwrap(ajax(options(data, params, true)));
		};
		res.url = baseUrl + url;
		return res;
	}

	return {
		inchi: request('POST', 'getinchi'),
		smiles: request('POST', 'smiles'),
		molfile: request('POST', 'getmolfile'),
		cml: request('POST', 'getcml'),
		layout: request('POST', 'layout'),
		clean: request('POST', 'clean'),
		aromatize: request('POST', 'aromatize'),
		dearomatize: request('POST', 'dearomatize'),
		calculateCip: request('POST', 'calculate_cip'),
		automap: request('POST', 'automap'),
		selectiveLayout: request('POST', 'selective_layout'),
		save: request('POST', 'save'),
		knocknock: function () {
			return ajax(baseUrl + 'knocknock').then(function (xhr) {
				if (xhr.responseText !== 'You are welcome!')
					throw Error('Server is not compatible');
			});
		}
	};
}

module.exports = api;
