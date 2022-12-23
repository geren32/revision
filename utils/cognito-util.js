global.crypto = require('crypto');
const log = require('../utils/logger');
const request = require('request-promise');
const AmazonCognitoIndentity = require('amazon-cognito-identity-js');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const config = require('../configs/config')
const { models } = require("../sequelize-orm");
const errors = require('../configs/errors');
//global.fetch = require('node-fetch');
const poolData = {
    UserPoolId: config.COGNITO_POOL_ID,
    ClientId: config.COGNITO_APP_CLIENT_ID
};
const userPool = new AmazonCognitoIndentity.CognitoUserPool(poolData);

AWS.config.update({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    region: config.AWS_REGION_NAME
});
const client = new AWS.CognitoIdentityServiceProvider();
/**
 * Refresh expired cognito token

 * @param username
 * @param refresh_token
 * @param context
 * @return {Object} - token or error
 */

/**
 * Decode cognito token
 * @param token
 * @param context

 * @return {Promise.<{req: *}>}
 */

const parseToken =  async (token) => {

    // log.info(`Start parse token on cognito. Data: ${token}`);
    let result = new Promise((resolve, reject) => {
        request({
            url: `https://cognito-idp.${config.AWS_REGION_NAME}.amazonaws.com/${config.COGNITO_POOL_ID}/.well-known/jwks.json`,
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                let pems = {};
                let keys = body['keys'];
                for (let i = 0; i < keys.length; i++) {
                    //Convert each key to PEM
                    let key_id = keys[i].kid;
                    let modulus = keys[i].n;
                    let exponent = keys[i].e;
                    let key_type = keys[i].kty;
                    let jwk = { kty: key_type, n: modulus, e: exponent };
                    let pem = jwkToPem(jwk);
                    pems[key_id] = pem;
                }
                //validate the token
                let decodedJwt = jwt.decode(token, { complete: true });

                if (!decodedJwt) {
                    // Not a valid JWT token
                    log.error(`Token not verified. Token ${token}`);
                    let err = new Error(`Token not verified`);
                    err.code = 401;
                    reject(err);
                }

                let kid = decodedJwt.header.kid;
                let pem = pems[kid];
                if (!pem) {
                    log.error(`Token not verified. Token ${token}`);
                    let err = new Error(`Token not verified`);
                    err.code = 401;
                    reject(err);
                }
                let tokenPayload = jwt.verify(token, pem, function (err, payload) {
                    if (err) {
                        log.error(`Token not verified. Token ${token}`);
                        let err = new Error(`Token not verified`);
                        err.errorCode = 3;
                        err.code = 401;
                        reject(err);
                    } else {
                        // Token verfied successfully
                        resolve(payload);
                    }
                });
                return tokenPayload;
            } else {
                //Error! Unable to download JWKs
                log.error(`Unable to download JWKs`);
                let err = new Error(`Unable to download JWKs`);
                reject(err);
            }
        });
    });

    // log.info(`Result parse token on cognito. Data: true`);
    return result;
}
/**
 * Logout a user from all their sessions
 *
 *@param username
 * @return {Promise.<{token: *}>}
 */
const refreshUserToken =  async (username, refresh_token) => {


    log.info(`Start refresh token user on Cognito. Data: ${JSON.stringify(username)}`);
    const refreshToken = new AmazonCognitoIndentity.CognitoRefreshToken({ RefreshToken: refresh_token });
    const userData = {
        Username: username,
        Pool: userPool
    };
    const cognitoUser = new AmazonCognitoIndentity.CognitoUser(userData);
    let token = new Promise((resolve, reject) => {
        cognitoUser.refreshSession(refreshToken, (err, session) => {
            if (err) {
                reject(err)
            } else {
                const data = {
                    refresh_token: session.getRefreshToken().getToken(),
                    access_token: session.getAccessToken().getJwtToken(),
                };
                resolve(data);
            }
        })
    });
    log.info(`Result refresh token user on Cognito. Data: true`);
    return token;
}

const refreshToken =  async (username, refresh_token) => {

    log.info(`Start refresh token. Data: username: ${username} Token: ${refresh_token}`);
    const token = await refreshUserToken(username, refresh_token).catch((err) => {
        if (err) {
            log.error(`Refresh Token has expired`);
            let err = new Error(`Refresh Token has expired. Token ${refresh_token}`);
            err.errorCode = 4;
            err.code = 401;
            return err;
        }
    });

    await models.user.update(token,{where:{  email: username }});




    log.info(`Result refresh token. Data: ${JSON.stringify(token)}`);
    return token;
}


module.exports = {


    //internal function for token refresh
    refreshToken:refreshToken,

    parseToken:parseToken,

    refreshUserToken:refreshUserToken,
    /**
     * verify cognito token
     *
     * @return {Promise.<{req: *}>}
     */




    confirmUser :  async (username ) => {
        const params = {
            UserPoolId: config.COGNITO_POOL_ID,
            Username: username,
        };
        let result = new Promise((resolve, reject) => {
            client.adminConfirmSignUp(params, function (err, data) {
                if (err) reject(err);
                resolve(data);
            });
        });

        return await result.catch(err =>{
            err.code = 400;
            throw err;
        });
    },
    /**
     * Create Cognito user
     *

     * @param {String} accessToken - access token for application
     * @param {Object} userToBeCreated - user params object
     * @return {Object} - created user or error
     */
     createUserCognito : async (userData) => {
     //   log.info(`Start creating user on Cognito. Data: ${JSON.stringify(userData)}`);
        const attributeList = [];
        const emailData = {
            // Name: 'email',
            // Value: "dimbarx@gmail.com",
        };

       // const emailAttribute = new AmazonCognitoIndentity.CognitoUserAttribute(emailData);

        let result = new Promise((resolve, reject) => {
            userPool.signUp(userData.username, userData.password, null, null, (err, result) => {
                if (err) reject(err);
                resolve(result)
            });
        });
    //    log.info(`Result creating user on Cognito. Data: ${JSON.stringify(result)}`);
        return result;
    },

    /**
         * Creates a new user in the specified user pool.
         *

         * @param email(String) - the email for which you want to create.
         * @return result - user or error
         */
         createUserByAdmin :async (email) => {


            log.info(`Start create user by admin on Cognito. Data: ${JSON.stringify(email)}`);
            const params = {
                UserPoolId: config.COGNITO_POOL_ID, /* required */
                Username: email, /* required */
                MessageAction: "SUPPRESS",
                UserAttributes: [
                    {
                        Name: "email",
                        Value: email
                    }
                ]
            };
            let result = new Promise((resolve, reject) => {
                client.adminCreateUser(params, function (err, data) {
                    if (err) reject(err);    // an error occurred
                    resolve(data);           // successful response
                });
            });
            log.info(`Result create user by admin on Cognito. Data: true`);
            return result;
        },

    /**
         * Confirms user registration as an admin without using a confirmation code. Works on any user.
         *

         * @param email(String) - the email for which you want to confirm user registration.
         * @return result - null or error
         */
     confirmSignUpByAdmin : async (email) => {


        log.info(`Start confirm user registration on Cognito. Data: ${JSON.stringify(email)}`);
        const params = {
            UserPoolId: config.COGNITO_POOL_ID, /* required */
            Username: email, /* required */
        };
        let result = new Promise((resolve, reject) => {
            client.adminConfirmSignUp(params, function (err, data) {
                if (err) reject(err);    // an error occurred
                resolve(data);           // successful response
            });
        });
        log.info(`Result confirm user registration on Cognito. Data: true`);
        return result;
    },

    /**
         * Updates the specified user's attributes, including developer attributes, as an administrator. Works on any user.
         *

         * @param email(String) - the email user for whom you want to update user attributes.
         * @param attributes(Object) - name-value pairs representing user attributes.
         * @return result - null or error
         */
     updateUserAttributesByAdmin : async (email, attributes) => {


        log.info(`Start update user attributes on Cognito. Data: ${JSON.stringify(email)}`);
        const params = {
            UserAttributes: [ /* required */
                // {
                //   Name: 'STRING_VALUE', /* required */
                //   Value: 'STRING_VALUE'
                // },
                attributes
            ],
            UserPoolId: config.COGNITO_POOL_ID, /* required */
            Username: email, /* required */
        };
        let result = new Promise((resolve, reject) => {
            client.adminUpdateUserAttributes(params, function (err, data) {
                if (err) reject(err);    // an error occurred
                resolve(data);           // successful response
            });
        });
        log.info(`Result update user attributes on Cognito. Data: true`);
        return result;
    },

    /**
     * Sets the specified user's password in a user pool as an administrator. Works on any user.
     *

     * @param email(String) - the email user for whom you want to update user attributes.
     * @param email(String) - the email user for whom you want to update user attributes.
     * @return result - null or error
     */
     setUserPasswordByAdmin : async (email, password) => {


        log.info(`Start confirm user registration on Cognito. Data: ${JSON.stringify(email)}`);
        const params = {
            Password: password, /* required */
            UserPoolId: config.COGNITO_POOL_ID, /* required */
            Username: email, /* required */
            Permanent: true // True if the password is permanent, False if it is temporary.
        };
        let result = new Promise((resolve, reject) => {
            client.adminSetUserPassword(params, function (err, data) {
                if (err) reject(err);    // an error occurred
                resolve(data);           // successful response
            });
        });
        log.info(`Result confirm user registration on Cognito. Data: true`);
        return result;
    },

    setUserPasswordByAdminByPhone : async (phone, password) => {


        log.info(`Start setUserPasswordByAdminByPhone on Cognito. Data: ${JSON.stringify(phone)}`);
        const params = {
            Password: password, /* required */
            UserPoolId: config.COGNITO_POOL_ID, /* required */
            Username: phone, /* required */
            Permanent: true // True if the password is permanent, False if it is temporary.
        };
        let result = new Promise((resolve, reject) => {
            client.adminSetUserPassword(params, function (err, data) {
                if (err) reject(err);    // an error occurred
                resolve(data);           // successful response
            });
        });
        log.info(`Result setUserPasswordByAdminByPhone on Cognito. Data: true`);
        return result;
    },

    /**
     * Changes the password for a specified user in a user pool.
     */
    changePassword : async ( accessToken ,   previousPassword, proposedPassword) => {
        log.info(`Start Changes the password for a specified user in a user pool Cognito. Data: ${JSON.stringify(accessToken)}`);
        const params = {
            AccessToken: accessToken, /* required */
         //   UserPoolId: config.COGNITO_POOL_ID, /* required */
            PreviousPassword:previousPassword, /* required */
            ProposedPassword: proposedPassword // True if the password is permanent, False if it is temporary.
        };
        let result = new Promise((resolve, reject) => {
            client.changePassword(params, function (err, data) {
                if (err) reject(err);    // an error occurred
                resolve(data);           // successful response
            });
        });
        log.info(`Result Changes the password for a specified user in a user pool Cognito. Data: true`);
        return result;
    },


    /**
     * Get token (sign in) for cognito user
     *

     *@param loginDetails
     * @return {Promise.<{token: *}>}
     */
     signInUserCognito : async (loginDetails,res, lang) => {

        log.info(`Start sign in user on Cognito. Data: ${JSON.stringify(loginDetails.email)}`);
        lang = lang ? lang: config.LANGUAGES[0];
        const authenticationDetails = new AmazonCognitoIndentity.AuthenticationDetails({
            Username: loginDetails.email  ? loginDetails.email : loginDetails.phone,
            Password: loginDetails.password
        });
        const userData = {
            Username: loginDetails.email  ? loginDetails.email : loginDetails.phone,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIndentity.CognitoUser(userData);
        let token = new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: res => {
                    const data = {
                        refresh_token: res.getRefreshToken().getToken(),
                        access_token: res.getAccessToken().getJwtToken(),
                        id_token: res.getIdToken().getJwtToken()
                    };
                    resolve(data);
                },
                onFailure: err => {
                    reject(err);
                    res.status(errors.CLIENT_BAD_REQUEST_INCORRECT_ADMIN_LOGIN_DATA.code).json({
                        message: errors.CLIENT_BAD_REQUEST_INCORRECT_ADMIN_LOGIN_DATA.message[lang],
                        errCode: errors.CLIENT_BAD_REQUEST_INCORRECT_ADMIN_LOGIN_DATA.code,
                    })
                    // res.json({ status: 0 });
                    return err;
                }
            })
        });

        log.info(`Result sign in user on Cognito. Data: true`);
        return token;
    },

    /**
     * Send a reset code to user email for reseting password
     *
     *@param email
     * @return {Object} - CodeDeliveryDetails or error
     */
     forgotUserPassword : async (email) => {


        log.info(`Start send reset code for password user on Cognito. Data: ${JSON.stringify(email)}`);
        const userData = {
            Username: email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIndentity.CognitoUser(userData);

        let result = new Promise((resolve, reject) => {
            cognitoUser.forgotPassword({
                inputVerificationCode: res => {
                    resolve(res);
                },
                onFailure: err => {
                    reject(err);
                }
            })
        });
        log.info(`End reset code for password user on Cognito. Data: true`);
        return result;
    },
    /**
     * Reset user password in Cognito
     *
     *@param email
     *@param resetCode
     *@param newPassword
     * @return {Object} - CodeDeliveryDetails or error
     */
     resetPassword : async (email, resetCode, newPassword) => {


        log.info(`Start reset user password on Cognito. Data: ${JSON.stringify(email)}`);
        const userData = {
            Username: email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIndentity.CognitoUser(userData);

        let result = new Promise((resolve, reject) => {
            cognitoUser.confirmPassword(resetCode, newPassword, {
                onSuccess: res => {
                    resolve(res);
                },
                onFailure: err => {
                    reject(err);
                }
            })
        });
        log.info(`End reset user password on Cognito. Data: true`);
        return result;
    },
    /**
     * Resend confirm email
     *
     *@param email
     * @return {Object} - result or error
     */
     signupResend : async (email) => {


        log.info(`Start signup resend. Data: ${JSON.stringify(email)}`);
        const userData = {
            Username: email,
            Pool: userPool
        };
        const cognitoUser = new AmazonCognitoIndentity.CognitoUser(userData);

        let result = new Promise((resolve, reject) => {
            cognitoUser.resendConfirmationCode((err, date) => {
                if (err) reject(err);
                resolve(date);
            })
        });
        log.info(`End signup resend. Data: true`);
        return result;
    },

    //  deleteUser  : async (username) => {
    //     log.info(`Start sign out user on Cognito. User: ${username}`);
    //     const userData = {
    //         Username: username,
    //         Pool: userPool
    //     };
    //     const cognitoUser = new AmazonCognitoIndentity.CognitoUser(userData);
    //     const result = new Promise((resolve, reject) => {
    //         cognitoUser.deleteUser( (err) => {
    //             if(err) reject(err);
    //             resolve(true);
    //         })
    //     });
    //
    //     return await result.catch(err =>{
    //         err.code = 400;
    //         throw err;
    //     });
    // }


    deleteUser: async (username) => {
        log.info(`Start sign out user on Cognito. User: ${username}`);
        const userData = {
            Username: username,
            UserPoolId: config.COGNITO_POOL_ID
        }
        const result = new Promise((resolve, reject) => {
            client.adminDeleteUser(userData, (err) => {
                if(err) reject(err);
                resolve(true);
            })
        });

        return await result.catch(err =>{
            err.code = 400;
            throw err;
        });
    }

}


