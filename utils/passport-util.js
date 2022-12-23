const { models } = require('../sequelize-orm');
const config = require('../configs/config');
const { getDataFromUserToReq } = require('../utils/extra-util');

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const opts = {};
let tokenFromReq;

opts.secretOrKey = config.JWT_SECRET_ADMIN;
//opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.jwtFromRequest = function(req) {
    let token = null;
    if (req && req.cookies)
    {
        tokenFromReq = req.cookies['jwt'];
        token = req.cookies['jwt'];
    }
    return token;
};



module.exports =  function(passport){

    // passport config
    passport.use(new JwtStrategy(opts, async function(jwt_payload, done) {
        try {
            let session = await  models.session.findOne({where:{user_id:jwt_payload.userid, access_token: tokenFromReq}})
            const user = await models.user.findOne({where:{id:session.user_id}})
            let userDataReq = getDataFromUserToReq(user);

            if (userDataReq) {
                return done(null, userDataReq);
            } else {
                return done(null, false);
            }
        } catch (err) {
            done(err, false);
        }
    }));
};


/*const config = require('../configs/config');
const { models } = require('../sequelize-orm');
const bcryptUtil = require('../utils/bcrypt-util');


module.exports =  function(passport, LocalStrategy, flash){

    // passport config
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            // passReqToCallback: true,
        },

        async (email, password, authCheckDone) => {
            const user = await models.user.findOne({
                where: { email }
            });
            if (!user) {
                return authCheckDone(null, false, {message: 'Неправильний пароль або емайл'});
            }
            if (!user.email_verified) {
                return authCheckDone(null, false, {message: 'Емейл не підтверджено. Потрібно підтвердити адресу електронної пошти'});
            }
            if (user.status != config.GLOBAL_STATUSES.ACTIVE) {
                if (user.status == config.GLOBAL_STATUSES.BLOCKED) {
                    return authCheckDone(null, false, {message: "Ваш кабінет заблоковано. Будь ласка зв'яжіться з адміністратором"});
                }else if (user.status == config.GLOBAL_STATUSES.WAITING){
                    return authCheckDone(null, false, {message: 'Очікуйте підтвердження реєстрації адміністратором'});
                }else if (user.status == config.GLOBAL_STATUSES.DELETED){
                    return authCheckDone(null, false, {message: "Ваш кабінет видалено. Будь ласка зв'яжіться з адміністратором"});
                }
            }
            if (!user) {
                return authCheckDone(null, false, {message: 'Неправильний пароль або емайл'});
            }
            const isComparePassword = await bcryptUtil.comparePassword(password, user.password)
            if (!isComparePassword){
                return authCheckDone(null, false, {message: 'Неправильний пароль або емайл'});
            }
            return authCheckDone(null, user);
        }
    ));

    passport.serializeUser((user, done)=>{
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done)=>{
        done(null, { id });
    });
};*/
