const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const expbs = require('express-handlebars');
const passport = require('passport');
const cors = require('cors');
const device = require('express-device');
const passportUtil = require('./utils/passport-util');
let clientRouter = require('./routes/client');
let shopRouter = require('./routes/shop');


let adminBookingRouter = require('./routes/admin.booking');
let authRouter = require('./routes/auth');
let adminAuthRouter = require('./routes/admin.auth');
let adminProductRouter = require('./routes/admin.product');
let adminUserRouter = require('./routes/admin.user');
let adminBlogRouter = require('./routes/admin.blog');
let adminUploadRouter = require('./routes/admin.upload');
let userUploadRouter = require('./routes/user.upload');
let bookingRouter = require('./routes/booking');
let productRouter = require('./routes/product');


let adminPromotionsRouter = require('./routes/admin.promotions');
const slug = require('./routes/slug');
const adminPageRouter = require('./routes/admin.page');
const adminFormsRouter = require('./routes/admin.form');
const adminMenuRouter = require('./routes/admin.menu');
const adminConfigsRouter = require('./routes/admin.configs');
const adminLocalisation = require('./routes/admin.localisation');
const adminAnalyticsRouter = require('./routes/admin.analytics');
const adminPromocodeRouter = require('./routes/admin.promocode');
const adminNetworkRouter = require('./routes/admin.network');
const adminFAQRouter = require('./routes/admin.faq');
const adminOrderStatusesRouter = require('./routes/admin.statuses');
const npRouter = require('./routes/np')
const cronRouter = require('./routes/cron')

const page404Router = require('./routes/404');



const adminServiceRouter = require('./routes/admin.service');


const getClientInfoMiddleware = require('./middlewares/get-client-info.middlewares');
const metaDataMiddleware = require('./middlewares/meta-data.middleware');
const shopProductsMiddleware = require('./middlewares/shop-products.middleware');
const cartProductsMiddleware = require('./middlewares/cart-products.middleware');
const csrfMiddleware = require('./middlewares/csrf.middleware');

const log = require('./utils/logger');
//const notification_cron = require('./utils/notification_cron')

const app = express();


// enabling cors for session storage working on angular frontend, and cookie serving
//exposing headers needed for token sending and receiving
app.use(cors({
    //origin: ["http://localhost:4200", "http://localhost", "http://185.233.36.150"],
    origin: '*',
    /*credentials: true,*/
    //exposedHeaders: ['Authorization']
}));
// off cors
// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//       "Access-Control-Allow-Headers",
//       "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });
const sequelize = require('./sequelize-orm');
// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true,limit: '50mb'}));
app.use(cookieParser());
app.use(device.capture());
device.enableDeviceHelpers(app);
app.use(passport.initialize());

app.use(express.static(path.join(__dirname, 'public')));
const hbs = expbs.create({
    extname: '.hbs',
    defaultLayout: false,
    layoutsDir: path.join(__dirname, 'views'), // change layout folder name
    partialsDir: path.join(__dirname, 'views/partials'), // change partials folder name
    helpers: require('./utils/handebar-helpers'),
});
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');


app.use('/api/auth/admin', adminAuthRouter);

app.use('/api/admin/product', adminProductRouter);
app.use('/api/admin/user', adminUserRouter);
app.use('/api/admin/blog', adminBlogRouter);
app.use('/api/admin/upload', adminUploadRouter);
app.use('/api/admin/form', adminFormsRouter);
app.use('/api/admin/menu', adminMenuRouter);
app.use('/api/admin/configs', adminConfigsRouter);
app.use('/api/admin/page', adminPageRouter);
app.use('/api/admin/localisation', adminLocalisation);
app.use('/api/admin/analytics', adminAnalyticsRouter);
app.use('/api/admin/promocode', adminPromocodeRouter);
app.use('/api/admin/network', adminNetworkRouter);
app.use('/api/admin/status', adminOrderStatusesRouter);

//-----------------------------------------------
app.use('/api/admin/orders', adminBookingRouter);
app.use('/api/admin/promotion', adminPromotionsRouter);

app.use('/api/admin/service',adminServiceRouter);
app.use('/api/admin/faq',adminFAQRouter);


app.use('/', slug);
app.use(metaDataMiddleware);
// app.use(shopProductsMiddleware);




const paymentRouter = require('./routes/payment');
const diiaRouter = require('./routes/diia');

app.use('/payment',getClientInfoMiddleware,paymentRouter)

app.use('/diia',diiaRouter)

// CSRF protection middleware.
//app.use(csrfMiddleware);
// app.use(cartProductsMiddleware)
// app.use(getClientInfoMiddleware)

app.use('/upload',userUploadRouter)
app.use('/auth',getClientInfoMiddleware, authRouter);
app.use('/client', getClientInfoMiddleware, clientRouter);
app.use('/shop', getClientInfoMiddleware, shopRouter);
app.use('/booking',getClientInfoMiddleware, bookingRouter);
app.use('/product',getClientInfoMiddleware, productRouter);
app.use('/np',npRouter);
app.use('/cron',cronRouter);
app.use('/', getClientInfoMiddleware, clientRouter);


passportUtil(passport);

app.use(function(err, req, res, next) {
    res
        .status(err.statusCode || err.code || 500)
        .json({
            message: err.message || 'Unexpected',
            errorCode: err.errorCode ? err.errorCode : 0
        })
});

// Page 404.
app.use(page404Router);

async function assertDatabaseConnectionOk() {
    log.info(`Checking database connection...`);
    try {
        await sequelize.authenticate();
        log.info('Database connection OK!');
    } catch (error) {
        log.error('Unable to connect to the database:');
        log.error(error.message);
        process.exit(1);
    }
}


async function init() {
    await assertDatabaseConnectionOk();
}
init();

module.exports = app;
