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

var urlSplitRegex = /([^\?]+)(?:\??(.+))?/;
var queryRegex = /([^=]+)=([^&]+)/g;

// ("url", {"param": "value"})
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
	return (split);
}

function queryToUrl(query)
{
	var url = query[0];
	var first = true;

	dictIter(query[1], function(param, value)
	{
		url += first ? '?' : '&';
		url += param + '=' + value;
	});
	return (url);
}

function onBeforeRequest(details)
{
	for (var i = 0; i < redirects.length; i++)
	{
		var r = redirects[i];
		if (!r.pattern.test(details.url))
			continue ;
		if (r.type == "replace")
		{
			return ({
				redirectUrl: details.url.replace(r.pattern, r.replace)
			});
		}
		else if (r.type == "query")
		{
			var query = splitQuery(details.url);
			var redirect = false;
			dictIter(r.query, function(param, value)
			{
				if (!query[1].hasOwnProperty(param))
				{
					redirect = true;
					query[1][param] = value;
				}
			})
			if (redirect)
			{
				console.log("redirect");
				return ({redirectUrl: queryToUrl(query)});
			}
			else
				console.log("all queries are here, no redirects");
		}
	}
	return ({});
}

chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest,
	{urls: ["<all_urls>"]}, ["blocking"]);
