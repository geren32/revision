const express = require("express");
const router = express.Router();

const blogController = require("../controllers/blog.controller");
const shopController = require("../controllers/shop-controller");
const bookingController = require("../controllers/booking.controller");
const searchController = require("../controllers/search.controller");
const clientController = require("../controllers/client.controller");
const formPageController = require("../controllers/form-page.controller");
const checkClientMiddleware = require("../middlewares/check-client-role.middleware");
const passportMiddleware = require("../middlewares/passport.middlewares");
const promotionController = require("../controllers/promotion.controller");
const uploadAWS = require('../middlewares/file.aws.upload.middleware');
const faqController = require('../controllers/faq.controller');

let userService = require("../services/user.service")

const  validateToken  = require('../middlewares/user.validate.token.middleware');
const {uploadAWSNoValidUser} = require("../middlewares/file.aws.upload.middleware");
router
    .get('/lalala', clientController.clienttest1)
    .get('/clienttest', clientController.clienttest)
    .get('/getAutocompleteServices', clientController.getAutocompleteServices)
    .get('/', blogController.getPage)

    .post('/getTempUserID',clientController.getTempUserID)

    .get('/generate_rewiew_pdf',clientController.generateRewiewPDF)

    .post('/getNovaPoshta',  clientController.getNovaPoshta)

    .post('/searchItems', searchController.searchItems)
    .get('/search', searchController.searchItemsFull)
    .post('/search', searchController.searchItemsAjax)


    .get('/blog/:id(*)', blogController.getAllPosts)
    .post('/blog/:slug(*)', blogController.getAllPostsAjax)
    .get('/getPost/:id(*)', blogController.getPost)

    .get('/getFaq/:id(*)',faqController.getFaq)

    .get('/faq/:id(*)', faqController.getAllFaqs)
    .post('/faq/:slug(*)', faqController.getAllFaqsAjax)

    .get('/getPoints',blogController.getPoints)

    .get('/getPage/:slug(*)', blogController.getPage)


    .post('/cabinet/addfavorites', passportMiddleware, checkClientMiddleware, clientController.addfavorites)
    .post('/cabinet/deletefavorites', passportMiddleware, checkClientMiddleware, clientController.deleteFavorites)




/* ***************************** */
    .post('/check_promocode', clientController.checkPromocode)

    .post('/addNewComment',uploadAWSNoValidUser.array('files'), formPageController.createNewComment)


    .get('/networksWithStores', clientController.networksWithStores)


/* ------------------------------------- */
    .get('/promotions/:id(*)', promotionController.getAllPromotions)
    .post('/promotions/:id(*)', promotionController.getAllPromotionsAjax)
    .get('/getPromotion/:slug(*)', promotionController.getPromotion)




    .get('/getUserContract/:id', clientController.getUserContract)

    .get('/cabinet', passportMiddleware, checkClientMiddleware, clientController.getClientPersonalData)
    .post('/cabinet', passportMiddleware, checkClientMiddleware, clientController.updateClientData)

    .get('/changePassword', passportMiddleware, checkClientMiddleware, clientController.getChangePassword)
    .post('/changePassword', passportMiddleware, checkClientMiddleware, clientController.changePassword)

    .get('/history-orders', passportMiddleware, checkClientMiddleware, clientController.getClientHistory)
    .post('/history-orders', passportMiddleware, checkClientMiddleware, clientController.getClientHistoryAjax)
    .get('/history-order-detail/:order_id(*)', passportMiddleware, checkClientMiddleware, clientController.getClientHistoryDetail)

    .get('/notifications', passportMiddleware, checkClientMiddleware, clientController.getClientNotifications)

    .get('/downloadOrderFiles/:order_id', clientController.downloadOrderFiles)

    .get('/cabinet/favorites', passportMiddleware, checkClientMiddleware, clientController.favorites)

    .get('/prices', passportMiddleware, checkClientMiddleware, clientController.documents)

    .get('/document/:category_id',passportMiddleware, checkClientMiddleware, clientController.exportCatProductsXLS)


    .get('/favorites', clientController.clientfavorites)

    .post('/addfavorites', passportMiddleware, checkClientMiddleware, clientController.addfavorites)
    .post('/deletefavorites', passportMiddleware, checkClientMiddleware, clientController.deleteFavorites)


    .post('/buyOnClick', clientController.buyOnClick)
    .post('/savaProductReview', clientController.savaProductReview)
    .post('/showMoreProductReview', clientController.showMoreProductReview)


    .get('/checkout', bookingController.getCurrentCheckout)

    .post('/order',  bookingController.getCurrentOrder)
    .post('/checkout', bookingController.createOrder)

    .get('/cart',  bookingController.getCurrentCart)
    .post('/addCart', bookingController.addCart)
    .post('/deleteCart', bookingController.deleteCart)

    .get('/configurator/:id', shopController.configurator)
    .post('/configurator/:id', shopController.configuratorAjax)
    .post('/compositeImg', shopController.compositeImg)
    .post('/configuratorPopup', shopController.configuratorPopup)

    // .post('/cabinet/sign_dia',passportMiddleware, checkClientMiddleware, clientController.signDia)
    .get('/cabinet/sign_dia', clientController.signDia)
    .get('/cabinet/payOrder/:order_id', clientController.payOrder)

    .get('/cabinet/signOrderHelloSign/:order_id', passportMiddleware, checkClientMiddleware, clientController.signOrderHelloSign)
    .post('/cabinet/getSignHashDeepLink/:order_id', passportMiddleware, checkClientMiddleware, uploadAWS.uploadPrivateImageAWS.array('files',100), clientController.getSignHashDeepLink)
    .get('/cabinet/sendToCourt/:order_id', clientController.sendToCourt)
    .get('/cabinet/uploadPrivateImage/:id', passportMiddleware, checkClientMiddleware, clientController.downloadPrivateImage)

    .get('/callbackHelloSign/:user_id', clientController.checkHelloSign)
    .get('/callbackHelloSignOrder/:order_id', clientController.checkHelloSignOrder)

    .get('/cabinet/checkHelloSignFile', passportMiddleware, checkClientMiddleware, clientController.checkHelloSignFile)

    .get('/cabinet/checkHelloSignOrderFile/:order_id', passportMiddleware, checkClientMiddleware, clientController.checkHelloSignOrderFile)

    .post('/cabinet/getAdditionalService',passportMiddleware,checkClientMiddleware,clientController.getAdditionalService)

    .get('/cabinet/createAdditionalOrder/:additional_id/:order_id',passportMiddleware,checkClientMiddleware,clientController.getClientOrderAdditional)



module.exports = router;
