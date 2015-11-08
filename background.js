//

var redirects = [
	// {
	// 	type: "replace",
	// 	pattern: new RegExp("http(s?)://github.com/([^/]+)/([^/]+)/blob/([^(ts=)])", "i"),
	// 	replace: "http$1://github.com/$2/$3/blob/$4?ts=4"
	// },
	{
		type: "query",
		pattern: new RegExp("https?://.*github.com/[^/]+/[^/]+/blob/.+", "i"),
		query: {"ts": 4}
	}
];

function dictIter(dict, func)
{
	for (var key in dict)
	{
		if (dict.hasOwnProperty(key))
			func(key, dict[key]);
	}
}

var actions = {
	query: function(request, data)
	{
		var query = splitQuery(request.url);
		var redirect = false;
		dictIter(data.query, function(param, value)
		{
			if (!query[1].hasOwnProperty(param))
			{
				redirect = true;
				query[1][param] = value;
			}
		})
		if (redirect)
		{
			var url = queryToUrl(query);
			console.log("redirect " + url);
			return ({redirectUrl: url});
		}
		return (null);
	},
	replace: function(request, data)
	{
		return ({
			redirectUrl: request.url.replace(data.pattern, data.replace)
		});
	}
};

var urlSplitRegex = /([^\?]+)(?:\??(.+))?/;
var queryRegex = /([^=]+)=([^&]+)/g;

// ["url", {"param": "value"}]
function splitQuery(url)
{
	var split = [];
	var match = url.match(urlSplitRegex);

	split[0] = match[1];
	split[1] = {};
	if (match[2])
	{
		match[2].replace(queryRegex, function(match, param, value)
		{
			split[1][param] = value;
			return (match);
		});
	}
	console.log(split);
	return (split);
}

function queryToUrl(query)
{
	var url = query[0];
	var first = true;

	dictIter(query[1], function(param, value)
	{
		url += first ? '?' : '&';
		first = true;
		url += param + '=' + value;
	});
	return (url);
}

chrome.webRequest.onBeforeRequest.addListener(function(request)
	{
		for (var i = 0; i < redirects.length; i++)
		{
			var r = redirects[i];
			if (!r.pattern.test(request.url))
				continue ;
			var ret = actions[r.type](request, r);
			if (ret)
				return (ret);
		}
		return ({});
	},
	{urls: ["<all_urls>"]}, ["blocking"]);
