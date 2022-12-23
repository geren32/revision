const appUtils = require('../utils/app-util');
const options = appUtils.getArgs();
const fs = require('fs')


module.exports = {

    CLIENT_ROLE: 1,
    DEALER_ROLE: 2,
    SUPER_ADMIN_ROLE: 3,
    DESIGNER_ROLE: 4,

    TOKEN_LIFETIME: 2592000000,

    TEXTS: {
        'uk': JSON.parse(fs.readFileSync('localisation/text_uk.json', 'utf8')),
        'ru': JSON.parse(fs.readFileSync('localisation/text_ru.json', 'utf8')),
        'en': JSON.parse(fs.readFileSync('localisation/text_en.json', 'utf8'))
    },
    FAQ_TYPES:{
        1:{type: {"uk": 'Про компанію',"en":'About the company'}, value:1},
        2:{type: {"uk": 'Деталі оформлення',"en": 'Details create order'}, value:2},
        3:{type: {"uk": 'Загальні',"en": 'General'},value:3},
        4:{type: {"uk": 'Оплата',"en": 'Payment'}, value:4},
    },

    JWT_SECRET_ADMIN: options['access-token-secret'] || 'uf7e^WaiUGFSA7fd8&^dadhADMIN',
    ACCESS_TOKEN_LIFETIME: options['access-token-lifetime'] || '600m',

    JWT_REFRESH_SECRET_ADMIN: options['refresh-token-secret'] || '3fhfsdjfkf$$uIEFSHFKdfADMIN',
    REFRESH_TOKEN_LIFETIME: options['refresh-token-lifetime'] || '600m',

    MAIL_HOST: options['mail-host'] || "smtp.gmail.com",
    MAIL_PORT: options['mail-port'] || "587",
    MAIL_USERNAME: options['mail-username'] || "rs.node.dev@gmail.com",
    MAIL_PASSWORD: options['mail-password'] || "ruirygdfheylqvwh",
    MAIL_FROM: options['mail-from'] || "rs.node.dev@gmail.com",
    MAIL_SECURE: options['mail-secure'] || false,
    MAIL_TLS: options['mail-tls'] || true,
    MAIL_ANON: options['mail-anon'] || false,

    FRONT_URL: options['front-url'] || 'https://advokatmarket.moonart.net.ua',

    IMG_URL: options['front-url-img'],
    MAIL_GOOGLE_API: options['mail-google-api'] || false ,
    LIQPAY_PUBLIC_KEY: options['liqpay_public_key'] || "sandbox_i79666523069",
    LIQPAY_PRIVATE_KEY: options['liqpay_private_key'] || "sandbox_yznjtzcssqCg68r57ORweBXQy4NZePdc27kBUWVO",

    AWS_ACCESS_KEY_ID : options['aws-access-key-id'] || "AKIARBXPPWUT22WFUKOI",
    AWS_SECRET_ACCESS_KEY: options['aws-secret-access-key'] ||"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",

    COGNITO_POOL_ID: options['cognito-pool-id'] || "eu-central-1_BVnR60GPw",
    COGNITO_APP_CLIENT_ID: options['cognito-app-client-id'] ||"24ke0lr52flf11f3k8935p73aq",

    // HELLO_SIGN_API_KEY: options['hello-sign-api-key'] ||"058dac8f27eec31b1ed8c69380d49bc4d410f1583c9d36226efd0863180c6d34",

    HELLO_SIGN_API_KEY: options['hello-sign-api-key'] ||"f3857eb73596baf24da1b082c77e62f8005a6f2e36a23dfc8e8631e533f8e25c",

    OPEN_DATA_BOT_API_KEY: options['open-data-not-api-key'] || 'joxCAxYxdC',

    NP_PRIVATE_KEY: options['np_private_key'] || "29e9a5cf318a07d33c457b53ef973444",

    // DIA_OFFER_ID: options['dia-offer-id'] ||"c09e71d47bbc4e9ead637940c9210a917c2106fe7efcf4c785b91372e4c12b8d6d9587b1fb2108d670a79720863dc5f25b45dd6673599b57063183a892b56721",

    // DIA_OFFER_ID: options['dia-offer-id'] ||"da674501545d72e75c743ed66b46b772cd2bd0632d66379842e633e7dc769770231877072e3ef599f3aae38b8ba2cd88cb25840eebb58f96483bc60b79024d3b",

    DIA_OFFER_ID: options['dia-offer-id'] ||"fd73d545673dc00ceba78499c9f80291a71ab726338cfa86b7ea809e2f4297f9d0710f6caa5aceb29fc9d8802ceece9dea267c855445d98cf7c9d6b24562cc2e",


    DIA_BRANCH_ID: options['dia-branch-id'] ||"0adafbdeeb364c4b2a58952cf93c19674cdc641364cf2c8fe6137bd17865bf2844b8903d7a07f83353af80ebaeb283f928c67f8cbebf1800dbedea970019460b",
    DIA_ACQUIRER_TOKEN: options['dia-acquirer-token'] || "37VM3RF66FuJyfgVLdPHWUTQjr2S22XUKJxpsP5869uuem2BrF9crEDAUv4M8Shu",
    DIA_HOST: options['dia-host'] || "api2.diia.gov.ua",


    AWS_REGION_NAME : options['aws-region-name'] || "eu-central-1",
    AWS_BUCKET_NAME: options['aws-bucket-name'] || "advokatbucket",
    //REGEX_EMAIL: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    REGEX_EMAIL: /^[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
    REGEX_PASSWORD: /^(?=^[^\s]{6,16}$)(?=.*[a-z].*)(?=.*[A-Z].*).*$/,
    // REGEX_PASSWORD: /^(?=^[^\s]{8,16}$)(?=.*\d.*)(?=.*[a-z].*)(?=.*[A-Z].*)(?=.*[!@#$%^&*()_\-+=]).*$/,
    // REGEX_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*\[\]"\';:_\-<>\., =\+\/\\]).{8,}$/,
    // REGEX_PASSWORD: /^[0-9a-zA-Z!@#$%^&*]{6,}$/,
    REGEX_PHONE: /^[0-9\ \+\(\)\/]+$/,

    CRON_API_KEY:'hkktskImdsa@TfwsdAglKmvbn',

    UPLOAD_IMAGE_TYPES: ['pages', 'banner', 'editor', 'products', 'blog', 'categories', 'network', 'configurator'],

    SMS_ACCOUNT_ID: options['sms_account_id'] || "",
    SMS_AUTH_TOKEN: options['sms_auth_token'] || "",
    SMS_SENDER_PHONE: options['sms_sender_phone'] || "",

    DELIVERY_TYPES: {
        1: {
            'text': {
                "uk": 'Самовивіз',
                "ru": 'Самовивоз',
                "en": 'Self pickup',
            }
        },
        2: {
            'text': {
                "uk": 'Доставка у відділення Нова Пошта',
                "ru": 'Доставка в отделение Новой Почты',
                "en": 'Delivery to Nova Poshta point',
            }
        },
        3: {
            'text': {
                "uk": 'Адресна доставка по місту Львів',
                "ru": 'Адресная доставка по городу Львов',
                "en": 'Adress delivery in Lviv',
            }
        },
        4: {
            'text': {
                "uk": 'Адресна доставка',
                "ru": 'Адресная доставка',
                "en": 'Adress delivery',
            }
        }
    },
    CURRENCY_TYPES: {
        1: 'грн',
        2: '€',
        3: '$'
    },
    CURRENCY_CODE: {
        1: "uah",
        2: "eur",
        3: "usd"
    },
    SERVICE_PAY_TYPE:{
        ONLINE:1,
        ONLINE_PRIVAT24:2,
        NOT_PAID:3,
    },        1:{type: {"uk": 'Про компанію',"ru": 'О компание'}, value:1},

    SERVICE_PAY_TYPE_TEXT:{
        1:{type:{
              "uk": "Онлайн оплата",
              "en": "Online payment",
          }
          },
        2:{type:{
                "uk": "Оплата через приват 24",
                "en": "Payment through private 24",
            }
        },
        3:{type:{
                "uk": "Консультація",
                "en": "Consultation",
            }
        }
    },
    DEFAULT_ORDER_STATUSES_IDS: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 21, 22, 29, 30 ],
    SERVICE_DELIVERY_TYPE:{
      NO_DELIVERY:1,//Тільки електронні документи
      DELIVERY:2//Відправка на НП
    },
    NOTIFICATION_TYPES:{
        ORDER: 1,
        CHANGE_PASSWORD: 2,
        REGISTER: 3,
        PASSWORD_RECOVERY: 4,
        HELLO_SIGN_WAITING: 5,
        HELLO_SIGN_SUCCESS: 6,
        HELLO_SIGN_ORDER_WAITING: 7,
        HELLO_SIGN_ORDER_SUCCESS: 8,
    },
    NOTIFICATION_TEXTS: {
        CHANGE_PASSWORD: {
            "uk":"Пароль успішно змінений",
            "en":"Password successfully changed"
        },
        REGISTER: {
            "uk":"Ви успішно зареєструвались на сайті",
            "en":"You have successfully registered on the site"
        },
        PASSWORD_RECOVERY: {
            "uk":"Пароль успішно відновлено",
            "en":"Password reset successfully"
        },
        HELLO_SIGN_WAITING : {
            "uk":"Договір про співпрацю очікує підпису",
            "en":"The cooperation agreement is awaiting signature"
        },
        HELLO_SIGN_SUCCESS : {
            "uk":"Договір про співпрацю успішно підписано",
            "en":"The cooperation agreement was successfully signed"
        },
        HELLO_SIGN_ORDER_WAITING : {
            "uk":"Договір успішно підписано. Очікуйте підпису від адвоката",
            "en":"The contract was successfully signed. Wait for the signature from the lawyer"
        },
        HELLO_SIGN_ORDER_SUCCESS : {
            "uk":"Договір успішно підписано",
            "en":"The contract was successfully signed"
        }
    },
    SERVICE_DELIVERY_TYPE_TEXT:{
        1:{type:{
                "uk": "Тільки електронні документи",
                "en": "Only electronic documents",
            }
        },
        2:{type:{
                "uk": "Відправка на Нову пошту",
                "en": "Sending to Nova poshta",
            }
        }
    },
    PAY_TYPES: {
        1: {
            'text': {
                "uk": 'Готівкою',
                "ru": 'Наличными',
                "en": 'Cash',
            }
        },
        2: {
            'text': {
                "uk": 'Термінал кур’єром',
                "ru": 'Терминал курером',
                "en": 'Deliverer terminal',
            }
        },
        3: {
            'text': {
                "uk": 'Онлайн Оплата',
                "ru": 'Онлайн Оплата',
                "en": 'Online pay',
            }
        },
        4: {
            'text': {
                "uk": 'Оплата частинами ПриватБанк',
                "ru": 'Оплата частями ПриватБанк',
                "en": 'Part Payment PrivatBank',
            }
        },
        5: {
            'text': {
                "uk": 'Оплата частинами МоноБанк',
                "ru": 'Оплата частями МоноБанк',
                "en": 'Part Payment MonoBank',
            }
        }
    },


    PROMOCODE_STATUSES: {
        1: { text: "Видалений", color: 'red', value: 1 },
        2: { text: "Активний", color: 'green', value: 2 },
        3: { text: "Не активний", color: 'orange', value: 3 },
        4: { text: "Використаний", color: 'grey', value: 4 }
    },

    // BOOKING_STATUSES: {
    //     1: {  text: { "uk": 'Кошик', "ru": 'Корзина', "en": 'Basket' }, value: 1 },
    //     2: {  text: { "uk": 'Очікує підтвердження', "ru": 'Ожидает подтверждения', "en": 'Waiting for approve' }, value: 2 },
    //     3: {  text: { "uk": 'Обробляється', "ru": 'Обробатываются', "en": 'In Process' }, value: 3 },
    //     4: {  text: { "uk": 'Виконано', "ru": 'Выполнено', "en": 'Done' }, value: 4 },
    //     5: {  text: { "uk": 'Скасовано', "ru": 'Отклонено', "en": 'Canceled' }, value: 5 },
    //     6: {  text: { "uk": 'На утримані', "ru": 'На удержании', "en": 'Hold' }, value: 6 },
    //     7: {  text: { "uk": 'В роботі', "ru": 'В работе', "en": 'In work' }, value: 7 },
    //     8: {  text: { "uk": 'Очікується оплата', "ru": 'Ожидается оплата', "en": 'Waiting for payment' }, value: 8 },
    //     9: {  text: { "uk": 'Оплата успішна', "ru": 'Успешная оплата', "en": 'Success payment' }, value: 9 },
    //     10: {  text: { "uk": 'Оплата невдала', "ru": 'Неудачная оплата', "en": 'Failed payment' }, value: 10 },
    //
    //     11: {  text: { "uk": 'B2B Очікує підтвердження', "ru": 'B2B Ожидает подтверждения', "en": 'B2B Waiting for approve' }, value: 11 },
    //     12: {  text: { "uk": 'B2B Обробляється', "ru": 'B2B Обробатываются', "en": 'B2B In Process' }, value: 12 },
    //     13: {  text: { "uk": 'B2B На утримані', "ru": 'B2B На удержании', "en": 'B2B Hold' }, value: 13 },
    //     14: {  text: { "uk": 'B2B В роботі', "ru": 'B2B В работе', "en": 'B2B In work' }, value: 14 },
    //     15: {  text: { "uk": 'B2B Виконано', "ru": 'B2B Выполнено', "en": 'B2B Done' }, value: 15 },
    //     16: {  text: { "uk": 'B2B Скасовано', "ru": 'B2B Отклонено', "en": 'B2B Canceled' }, value: 16 },
    // },
    BOOKING_STATUSES: {
        1: {  text: { "uk": 'Кошик', "ru": 'Корзина', "en": 'Basket' }, value: 1 },
        2: {  text: { "uk": 'Перевіряється адвокатом', "ru": 'Проверяется адвокатом', "en": 'It is checked by a lawyer' }, value: 2 },
        3: {  text: { "uk": 'Доставляється', "ru": 'Доставляется', "en": 'Delivered' }, value: 3 },
        4: {  text: { "uk": 'Виконано', "ru": 'Выполнено', "en": 'Done' }, value: 4 },
        5: {  text: { "uk": 'Скасовано', "ru": 'Отклонено', "en": 'Canceled' }, value: 5 },
        6: {  text: { "uk": 'Очікується оплата', "ru": 'Ожидается оплата', "en": 'Waiting for payment' }, value: 8 },
        7: {  text: { "uk": 'Оплата невдала', "ru": 'Неудачная оплата', "en": 'Failed payment' }, value: 10 },
    },
    BOOKING_PAY_STATUSES:{
        NOT_PAID:1,
        PAID:2
    },
    SERVICE_TYPE:{
        IN_PRICE:1,
        NOT_PRICE:2,
        ADVICE:3,
    },
    GLOBAL_STATUSES: {
        DELETED: 1,
        ACTIVE: 2,
        BLOCKED: 3,
        WAITING: 4,
        DUPLICATE_POST: 5
    },

    PRODUCT_TYPES: {
        GLASS: 1,
        SHOWER: 2,
        SIMPLE: 3,
        SIMPLE_VARIATIONS: 4
    },

    FORMS_STATUSES: {
        DISABLED: 1,
        ENABLED: 2
    },

    FORMS_TYPES: {
        1: "Форма зворотного звязку",
        2: "Форма замовлення в 1 клік",
        3: "Форма для запитань"
    },

    FORM_FIELDS_TYPES:{
        TEXT:1,
        PHONE:2,
        CODE:3,
        EMAIL:4,
        SELECT:5,
        INFO_BLOCK:6,
        DELIVERED:7,
        PAY:8,
        TEXT_STREET:9,
        TEXT_REGION:10,
        NUMBER:11,
        DATAPICKER:12,
        CHILD:13,
        CHECKBOX:14,
        RADIOBUTTON:15,
    },
    CHANGE_DATA_REQUEST_STATUSES: {
        1: { value: 'Не розглянуто', color: 'orange' },
        2: { value: 'Підтверджено', color: 'green' },
        3: { value: 'Скасовано', color: 'red' }
    },

    LANGUAGES: ["uk", "en"],
    LANGUAGES_MENU: [
        { lang: "uk", title: "Укр" },
        { lang: "en", title: "Eng" },
    ],

    MARK_TYPE: {
        PRODUCT: 'product',
        PROMOTION: 'promotion'
    },

    ATTRIBUTES_TYPE: {
        FROM_TO: 'from-to',
    },

    PROMOCODES_TYPES: {
        PERCENT: 1,
        VALUE: 2
    },

    DISCOUNT_TYPES: {
        PERCENT: 1,
        VALUE: 2
    },
    PRICE_TYPES: {
        PERCENT: 1,
        VALUE: 2
    },

    BONUSES_TYPE: {
        VALUE: 1,
        PERCENT: 2,
    },

    VIEWED_PRODUCTS_HISTORY: {
        VIEWED_PRODUCTS_NUMDER: 15,
        COOKIE_MAX_AGE: 2592000000, // 30 days
    },

    LVL_PERMISSIONS_IMAGE : {
        private: 'private',
        public: 'public'
    },

    ADMIN_CROP_SETTINGS: { width: 286, height: 286, fit: 'cover' },
    CROP_SETTINGS: {
        'products': [
            { width: 930, height: 930, fit: 'cover' },
            { width: 725, height: 725, fit: 'cover' },
            { width: 450, height: 540, fit: 'cover' },
            { width: 300, height: 360, fit: 'cover' },
            { width: 100, height: 120, fit: 'cover' },
            { width: 58, height: 70, fit: 'cover' },
        ],
        'network': [
            { width: 350, height: 167, fit: 'cover' },
            { width: 685, height: 308, fit: 'cover' },
        ]

    },

    TIME_CONST: 5184000000,

    REDSTONE_MAIL: "office@redstone.agency",
    MAIL_TO_REDSTONE_SUBJECT: "Допомога Advokat Market",

    EMAIL_FORM_SUBJECTS: {
        "1": {
            admin: "Заповніть будь ласка форму",
            client: {
                "uk": "",
                "ru": "",
                "en": "",
            }
        },
        "4": {
            admin: "Замовити консультацію",
            client: {
                "uk": "",
                "ru": "",
                "en": "",
            }

        },
        "7": {
            admin: "З'явились запитання?",
            client: {
                "uk": "",
                "ru": "",
                "en": "",
            }
        }
    },



    // Attribute groups types
    ATR_GROUP_TYPES: {

        //mat*S*H/1000000 Товщина полотна
        '1': {
            validation: {
                mat: true,
            },
            val: 1
        },

        //mat*(2*S+2*H)/1 000 Обробка кромки дзеркала
        '2': {
            validation: {
                mat: true,
                // mirror_thickness: true,
            },
            val: 2
        },

        //base+mat*(2*S+2*H)/1000 Основна підсвітка
        '3': {
            validation: {
                base: true,
                mat: true,
            },
            val: 3
        },

        //base+mat*(2*S+2*H)/1000 Фонова підсвітка
        '4': {
            validation: {
                base: true,
                mat: true,
            },
            val: 4
        },

        //mat*S*H/1000000 Підігрів
        '5': {
            validation: {
                mat: true,
            },
            val: 5
        },

        //price Косметична лінза
        '6': {
            validation: {
                price: true,
            },
            val: 6
        },


        //price Годинник
        '7': {
            validation: {
                price: true,
            },
            val: 7
        },

        //price Аудіосистема
        '8': {
            validation: {
                price: true,
            },
            val: 8
        },

        //base+mat*S/1 000   Поличка скляна
        '9': {
            validation: {
                base: true,
                mat: true,
            },
            val: 9
        },


        //price Вимикач
        '10': {
            validation: {
                price: true,
            },
            val: 10
        },

        //Душові з вкладеністю(Скло гартоване)
        '12': {
            validation: {
                price: true,
            },
            val: 12
        },

        //Аксесуари
        '13': {
            validation: {
                price: true,
            },
            val: 13
        },

        //Душові без вкладеністю (Комплект фурнітури)
        '14': {
            validation: {
                price: true,
            },
            val: 14
        },

        //Душові к-сть поличок
        '15': {
            validation: {
                price: true,
            },
            val: 15
        },
        //Душові рушникотримач
        '16': {
            validation: {
                price: true,
            },
            val: 16
        },

        //Душові без вкладеності (Система монтажу)
        '17': {
            validation: {
                price: true,
            },
            val: 17
        },
        //Душові без вкладеності (Вхідна частина )
        '18': {
            validation: {
                price: true,
            },
            val: 18
        },
        //Душові без вкладеності (Розміщення дверних петель)
        '19': {
            validation: {
                price: true,
            },
            val: 19
        },
        //Душові без вкладеності (Розміщення ручки на дверях)
        '20': {
            validation: {
                price: true,
            },
            val: 20
        },
        //Душові без вкладеності (Спосіб відкривання дверей)
        '21': {
            validation: {
                price: true,
            },
            val: 21
        },
        //Душові з вкладеності (Тип ручки)
        '22': {
            validation: {
                price: true,
            },
            val: 22
        },
        //Душові без вкладеності (Спецмонтаж)
        '23': {
            validation: {
                price: true,
            },
            val: 23
        },
        //Душові без вкладеності (Розміщення перегородки)
        '24': {
            validation: {
                price: true,
            },
            val: 24
        },
        //Душові без вкладеності (Вид верхнього кута)
        '25': {
            validation: {
                price: true,
            },
            val: 25
        },
        //Душові без вкладеності (Тип ущільнювача)
        '26': {
            validation: {
                price: true,
            },
            val: 26
        },
        //Душові без вкладеності (Вид тримача скла)
        '27': {
            validation: {
                price: true,
            },
            val: 27
        },
        //Душові з вкладеності (Тип полички)
        '28': {
            validation: {
                price: true,
            },
            val: 28
        },

    },

    ATR_GROUP_TYPES_TO_FORMULS: {

        //base+mat*(2*S+2*H)/1000
        'formula1': [3, 4],

        //mat*S*H/1000000
        'formula2': [1, 5],

        //mat*(2*S+2*H)/1 000
        'formula3': [2],

        //base+mat*S/1 000
        'formula4': [9],

        //price
        'price': [6, 7, 8, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],

    },



    //Attributes groups wich have values
    ATR_GROUPS_IDS_WITH_VALUES: [8, 9, 10, 26, 27, 28, 29, 30, 31, 17, 18, 19, 47, 48, 49, 62, 63, 64, 83, 84, 85,95,96,97,98,99,100,101,102,103],

    //Step types
    STEP_TYPES: {
        GLASS: 1,
        SHOWER: 2
    },

    //
    SHOWER_TYPES: {
        BLINDS: 1,
        WALK: 2,
        DOORS: 3,
        BOX: 4,
    },

    HARDCODE_CATEGORIES_IDS: [126, 127, 128, 137, 138, 139],


    SHOWER_GLASS_GROUP_IDS:[47,48,49],

    SHOWER_GLASS_STEP_IDS:[37,38,39],

    DEFAUL_GLASS_GROUP_TYPE_CANT_DELETE:[1,2],
    DEFAUL_SHOWER_GROUP_TYPE_CANT_DELETE:[12],

    DEFAULT_CHECKBOXES_GROUP_TYPE: [5,10,13,8],



    HARDCODE_STEPS: [28,29,30,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93],



    HARDCODE_SHOWER_ATR_GROUPS_DEPEND_ON_SHOWER_TYPE:{
        "1": {
            d: 104,
            s: 107,
            h: 110
            },
        "2": {
            l: 113,
            s: 116,
            m: 119,
            h: 122,
            l1: 125,
            l2: 128
            },
        "3": {
            d: 131,
            s: 134,
            h: 137,
            l1: 140,
            l2: 143
            },
        "4": {
            l: 146,
            d: 149,
            s: 152,
            h: 155,
            l1: 158,
            l2: 161
        }
    },
    HARDCODE_LANS_ATR_WITH_NO_SWITCHER : 162,


    SHELF_TYPE_GR_ATTR_ID: 83,

    SHELF_COUNT_GR_ATTR_ID: 89,

    MIRROR_COLOR_ATR_GR_ORIGIN_ID: 164,
    MIRROR_COLOR_STEP_ORIGIN_ID: 94
}
