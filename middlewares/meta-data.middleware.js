
const postService = require('../services/post.service');
const config = require("../configs/config");
const log = require('../utils/logger');

module.exports = async (req, res, next) => {
    let metaString = '';
    let url = req.url;

    try {
        if (url && (url.indexOf("uploads") > -1 || url.indexOf("img") > -1 || url.indexOf("favicon.ico") > -1)) {
            return next();
        } else {
            const metaData = await postService.getMetaDataBySlugOrUrl(url, null);
            if (metaData && metaData.meta_title) {
                metaString = metaString + `<title>Advokat Market | ${metaData.meta_title}</title>\n`
            } else metaString = metaString + `<title>Advokat Market</title>\n`
            if (metaData && metaData.meta_desc) {
                metaString = metaString + `<meta name="description" content="${metaData.meta_desc}">\n`
            }
            if (metaData && metaData.meta_keys) {
                metaString = metaString + `<meta name="keywords" content="${metaData.meta_keys}">\n`
            }
            if(metaData && metaData.meta_canonical) {
                metaString = metaString + `<link rel="canonical" href="${metaData.meta_canonical}"/>\n`
            }
            metaString = metaString + `<base href="${config.FRONT_URL}">\n`

            req.body.metaData = metaString;

            return next();
        }

    } catch (error) {
        log.error(`Error meta-data.middleware. ${error}`);
        next()
    }
}
