const request = require('request');
const UrlPattern = require('url-pattern');

function ElementorContent(options) {

    const defaultOptions = {
        target: null,
        prefix: /^\/elementor\/?(.*)$/,
        prefixRedirect: "/elementor",
        redirects: [],
        addPath: "/create_elementor_post",
        editPath: "/edit_elementor_post/:postname",
        viewPath: "/elementor_post/:postname",
    };

    options = Object.assign({}, defaultOptions, options);

    if (!options.target) {
        return console.log("ElementorContent: Fails. \n  The options 'target' is empty!");
    }

    //     console.log("ElementorContent: Succeeded");
    console.log(`ElementorContent: Succeeded ${Object.keys(options).map(key=>`\n  ${key}: '${options[key]}'`).join('')}`);

    return function(req, res, next) {

        let params;

        function filter(url) {
            return new UrlPattern(url).match(req.originalUrl);
        }

        function proxy(uri, followRedirect=false) {
            const proxyServer = request({
                baseUrl: options.target,
                uri,
                followRedirect,
            }, function(error, response, body) {
                // console.log('error:', error);
                // console.log('statusCode:', response && response.statusCode);
                console.log(`ElementorContent: ${body}`);
            });
            req.pipe(proxyServer);
            proxyServer.pipe(res)
        }

        // Add content
        if (filter(options.addPath)) {
            return res.redirect(`${options.prefixRedirect}/wp-admin/edit.php?action=create_elementor_post`);
        }// Edit content
        else if (params = filter(options.editPath)) {
            return res.redirect(`${options.prefixRedirect}/wp-admin/post.php?postname=${params.postname}&action=edit_elementor_post`);
        }// View content
        else if (params = filter(options.viewPath)) {
            return proxy(params.postname, true);
        }// General proxy
        else if (params = filter(options.prefix)) {
            return proxy(params.join(''));
        }// Redirects
        else if (params = options.redirects.find(filter)) {
            return proxy(req.originalUrl, true);
        }

        next();
    }
}

module.exports = ElementorContent;
