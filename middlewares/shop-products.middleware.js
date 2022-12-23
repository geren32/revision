
const config = require('../configs/config')
//Middlewares which get from cookies viewed prodycts and write to req.viewedProducts
module.exports = (req, res, next) => {

    req.viewedProducts = req && req.cookies && req.cookies['viewed_products'] ? JSON.parse(req.cookies['viewed_products']) : [];
    //req.comparisonProducts = req && req.cookies && req.cookies['comparison_products'] ? JSON.parse(req.cookies['comparison_products']) : [];
    req.tempUser = req && req.cookies && req.cookies['tempUser'] ? req.cookies['tempUser'] : "";
    req.favProducts = req && req.cookies && req.cookies['fav'] ? req.cookies['fav'].split(",").map(obj => Number(obj)) : [];


    return next();
}
