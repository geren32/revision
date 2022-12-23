module.exports = {
    // 400
    BAD_REQUEST_ID_NOT_FOUND: {
        message: 'Помилка! Об’єкта з вказаним id не знайдено',
        code: 400
    },
    BAD_REQUEST_EMAIL_OR_PHONE_ARE_USED: {
        message: 'Помилка! Емейл або пароль вже зайнятий іншим користувачем',
        code: 400
    },
    BAD_REQUEST_EMAIL_NOT_CONFIRMED: {
        message: 'Помилка ! Ваш емейл не підтверджено',
        code: 400
    },
    BAD_REQUEST_REGION_ALLREADY_EXIST: {
        message: 'Помилка! Область вже створена',
        code: 400
    },
    BAD_REQUEST_PROMOCODE_ALREADY_EXIST: {
        message: 'Помилка! Такий промокод вже існує',
        code: 400
    },
    BAD_REQUEST_PROMOCODE_CAN_BE_OR_FOR_ALL_OR_FOR_SPECIFIC_USER: {
        message: 'Помилка! Промокод може бути або для всіх або для конкретного користувача',
        code: 400
    },
    BAD_REQUEST_PROMOCODE_USAGE_CANT_BE_GRATER_THAN_TOTAL_USAGE: {
        message: 'Помилка! Кількість використань не може бути більшою за загальну кількість можливих використань',
        code: 400
    },
    BAD_REQUEST_PROMOCODE_DISCOUNT_PROCENT_CANT_BE_MORE_THAN_90: {
        message: 'Помилка! Відсоткова знижка промокоду не може буде більше за 90 %',
        code: 400
    },
    BAD_REQUEST_PROMOCODE_TYPE_IS_INVALID: {
        message: 'Помилка! Значення типу промокоду не відповідає вимогам',
        code: 400
    },
    BAD_REQUEST_USER_EMAIL_EXIST: {
        message: 'Помилка! Користувач з такою електронною адресою вже створений',
        code: 400
    },
    BAD_REQUEST_USER_EMAIL_NOT_VALID: {
        message: 'Помилка! Будь ласка введіть електронну адресу в форматі: email@mail.com',
        code: 400
    },
    BAD_REQUEST_USER_PHONE_EXIST: {
        message: 'Помилка! Користувач з таким номером телефону вже створений',
        code: 400
    },
    BAD_REQUEST_CLIENT_CRM_NUMBER_EXIST: {
        message: 'Помилка! Користувач з таким CRM номером вже створений',
        code: 400
    },
    BAD_REQUEST_USER_PHONE_NOT_VALID: {
        message: 'Помилка! Будь ласка вкажіть номер телефону у форматі +38 (099) 000 00 00',
        code: 400
    },
    BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH: {
        message: 'Помилка! Пароль не збігається, будь ласка підтвердіть пароль',
        code: 400
    },
    BAD_REQUEST_USER_PASSWORD_NOT_VALID: {
        message: 'Помилка! Пароль не відповідає вимогам (щонайменше 8 символів і не більше 16 символів, як мінімум одна велика і одна мала літери, один доступний символ:!@#$%^&*()_\-+= і лише латинські літери і як мінімум одна цифра)',
        code: 400
    },
    BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI: {
        message: 'Помилка! Будь ласка заповніть всі обовязкові поля',
        code: 400
    },
    BAD_REQUEST_REQUIRED_SERVICE_FIELDS_ADDRESS_NOT_VALID: {
        message: 'Помилка! На одному із кроків повинні бути два обовязкові поля для адреси клієнта із увімкнутою галочкою "Адреса клієнта": місто,вулиця',
        code: 400
    },
    BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_NOT_VALID: {
        message: 'Помилка! На одному із кроків повинні бути два обовязкові поля для автоматичної реєстрації клієнта із увімкнутою галочкою "Для реєстрації": номер телефону,електронний адрес',
        code: 400
    },
    BAD_REQUEST_REQUIRED_SERVICE_FIELDS_IS_COURT: {
        message: 'Помилка! На одному із кроків повинні бути два обовязкові поля для для пошуку суду з галочкою "пошук суду":Вулиці',
        code: 400
    },
    BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_PIP_NOT_VALID: {
        message: 'Помилка! На одному із кроків повинні бути три обовязкові поля для автоматичної реєстрації клієнта із увімкнутою галочкою "Для реєстрації Імя або для реєстрації Прізвище або для реєстрації По батькові": текстове поле',
        code: 400
    },
    BAD_REQUEST_REQUIRED_SERVICE_FIELDS_REGISTER_NO_INN: {
        message: 'Помилка! На одному із кроків повинні бути два обовязкові поля для автоматичної реєстрації клієнта із увімкнутою галочкою "ІНН клієнта та серія і номер поспорту": текстове поле та числове поле',
        code: 400
    },
    BAD_REQUEST_INVALID_PRODUCT_TYPE: {
        message: 'Помилка! Неправильний тип продукту',
        code: 400
    },
    BAD_REQUEST_INVALID_PRODUCT_SHOWER_TYPE: {
        message: 'Помилка! Неправильний тип  душової',
        code: 400
    },
    BAD_REQUEST_MARKER_FIELD_EMPTI: {
        message: 'Помилка! Будь ласка заповніть поле маркер',
        code: 400
    },
    BAD_REQUEST_CATEGORY_FIELD_EMPTI: {
        message: 'Помилка! Будь ласка виберіть категорію',
        code: 400
    },
    BAD_REQUEST_NOT_VALID_USER: {
        message: "Об'єкт користувача недійсний ",
        code: 4002
    },

    //404
    NOT_FOUND_USER: {
        message: 'Помилка! Користувача не знайдено',
        code: 4041
    },
    //------------------------------------
    BAD_REQUEST_INCORRECT_LOGIN_DATA: {
        message: 'Телефон та/або пароль введено невірно',
        code: 400
    },
    BAD_REQUEST_INCORRECT_ADMIN_LOGIN_DATA: {
        message: 'Емейл та/або пароль введено невірно',
        code: 400
    },
    BAD_REQUEST_WRONG_USER_ROLE: {
        message: "Помилка ! Неправильна роль користувача",
        code: 400
    },
    BAD_REQUEST_FORBIDDEN: {
        message: 'Доступ тільки для користувачів ',
        code: 403
    },
    BAD_REQUEST_USER_BLOKED: {
        message: "Ваш акаунт заблоковано. Будь ласка зв'яжіться з адміністратором",
        code: 400
    },
    BAD_REQUEST_USER_WAITING: {
        message: "Очікуйте підтвердження реєстрації адміністратором",
        code: 400
    },
    BAD_REQUEST_USER_DELETED: {
        message: "Ваш акаунт видалено. Будь ласка зв'яжіться з адміністратором",
        code: 400
    },
    BAD_REQUEST_PHONE_NOT_EXIST: {
        message: "Номер телефону не знайдено",
        code: 400
    },
    BAD_REQUEST_CLIENT_NOT_EXIST: {
        message: 'Помилка! Користувача з таким  номером телефону не знайдено',
        code: 400
    },
    BAD_REQUEST_INVALID_VARIFICATION_CODE: {
        message: 'Помилка! Неправильний код підтвердження',
        code: 400
    },
    BAD_REQUEST_OLD_VARIFICATION_CODE: {
        message: 'Помилка! Недійсний  код підтвердження',
        code: 400
    },
    BAD_REQUEST_INVALID_OLD_PASSWORD: {
        message: 'Помилка! Старий пароль введено невірно',
        code: 400
    },
    BAD_REQUEST_USER_PASSWORD_SAME_AS_OLD: {
        message: 'Помилка! Введіть новий пароль, відмінний від старого',
        code: 400
    },
    BAD_PERCENT_VALUE: {
        message: 'Помилка! Кількість відцотків не може перевищувати 90 %',
        code: 400
    },
    BAD_BONUS_QUANTITY_OR_PRICE: {
        message: "Мінімальна ціна для застосування менша дозволеної або кількість бонусів яку ви хочете застосувати більша ніж у вас є",
        code: 400
    },

    BAD_REQUEST_LINK_ALREADY_EXIST: {
        message: 'Об’єкт із цим посиланням уже існує',
        code: 400
    },
    BAD_REQUEST_BRAND_WITH_SLAG_ALREADY_EXIST: {
        message: 'Бренд з цим слагом уже існує',
        code: 400
    },
    BAD_REQUEST_CATEGORY_WITH_ID_ALREADY_EXIST: {
        message: 'Не вдалося знайти категорію. Категорії з цим ідентифікатором не існує.',
        code: 400
    },
    BAD_REQUEST_PAGE_WITH_SLAG_ALREADY_EXIST: {
        message: 'Сторінка з цим слагом уже існує',
        code: 400
    },
    BAD_REQUEST_VALUE_OF_INDEXING: {
        message: "Значення параметрів індексації не збігаються",
        code: 400
    },
    BAD_REQUEST_ATTRIBUTE_ID_OR_TITLE_NOT_PROVIDED: {
        message: "Ідентифікатор або заголовок атрибута не задано",
        code: 403
    },
    BAD_REQUEST_ATTRIBUTE_ID_NOT_PROVIDED: {
        message: "Ідентифікатор атрибута не задано",
        code: 403
    },
    BAD_REQUEST_TYPE_IS_NOT_PRESENT: {
        message: "Type is not present",
        code: 400
    },
    BAD_REQUEST_CRON_NOT_VALID: {
        message: "Bad key",
        code: 400
    },


    BAD_REQUEST_PAGE_WITH_LINK_NOT_EXISTS: {
        message: 'Сторінки з цим посиланням не існує',
        code: 400
    },
    BAD_REQUEST_NOT_PROVIDED: {
        message: 'Об’єкт з ідентифікатором не задано',
        code: 403
    },
    BAD_REQUEST_INCORECT_FILE_TYPE: {
        message: 'Хибний тип файлу',
        code: 400
    },
    BAD_REQUEST_ACCESS_TOKEN_INVALID: {
        message: 'Цей токен доступу недійсний',
        code: 4014
    },
    BAD_REQUEST_REFRESH_TOKEN_EXPIRED: {
        message: "Термін дії оновлення токена  закінчився",
        code: 4015
    },
    BAD_REQUEST_TO_REFRESH_TOKEN: {
        message: 'Помилка при оновлені токена',
        code: 4016
    },
    BAD_REQUEST_RULES_OF_USE: {
        message: 'Помилка! Ви не погодились з правилами користування',
        code: 400
    },
    BAD_REQUEST_PASSWORD_NOT_EXISTS: {
        message: 'Відсутній пароль',
        code: 400
    },
    BAD_REQUEST_TOKEN_IS_EXPIRES: {
        message: 'Термін дії токена закінчився',
        code: 400
    },
    BAD_REQUEST_INVALID_TOKEN: {
        message: 'Токен не правильний',
        code: 400
    },

    BAD_REQUEST_INVALID_ID_OR_POSITION: {
        message: 'Помилка! Не вказано id або position',
        code: 400
    },

    // Product count price util
    BAD_PRODUCT_INVALID_VALUE_BASE_OR_MAT: {
        message: 'Помилка! В продукту відсутні значення "Базова ціна" або "Ціна матеріалу"',
        code: 400
    },
    BAD_PRODUCT_INVALID_VALUE_S_OR_H: {
        message: 'Помилка! В продукту відсутні значення "Висота" або "Ширина" за замовчуванням',
        code: 400
    },

    BAD_PRODUCT_INVALID_VARIATION_LENGTH: {
        message: 'Помилка! В продукту відсутні варіації',
        code: 400
    },

    //Category
    BAD_REQUEST_INVALID_CHANGE_POSITION: {
        message: 'Помилка! Сортування дозволено в межах батьківського елемента',
        code: 400
    },

    BAD_REQUEST_INVALID_ATTRIBUTE_GROUP: {
        message: 'Помилка! Не знайдено вказаної опції',
        code: 400
    },

    BAD_REQUEST_INVALID_ATTRIBUTE_BASE_MAT_PRICE: {
        message: {
            base: "Помилка! Не вказана 'Базова ціна'",
            mat: "Помилка! Не вказана 'Ціна матеріалу'",
            price: "Помилка! Не вказана 'Ціна опції'",
            mirror_thickness: "Помилка! Не вказана 'Товщина полотна'",
        },
        code: 400
    },

    BAD_REQUEST_INVALID_BODY_REQUEST: {
        message: 'Помилка! Неправильні дані',
        code: 400
    },
    BAD_REQUEST_INVALID_SHOWER_GLASS_VALUE: {
        message: 'Помилка! Душові мають мати опцію "Скло гартоване" за замовчуванням',
        code: 400
    },
    //Default id
    BAD_REQUEST_DEFAULT_IDS: {
        message: 'Помилка! Oбєкт з вказаним id заборонений для видалення',
        code: 400
    },
    BAD_REQUEST_DEFAULT_IDS_CHANGE_STATUS: {
        message: 'Помилка! Oбєкт з вказаним id заборонений для зміни статусу',
        code: 400
    },
    BAD_REQUEST_STATUS_IS_USED: {
        message: 'Помилка! Статус з вказаним id використовується',
        code: 400
    },


















    /**********************ERROR WITH LANG**************************** */
    CLIENT_BAD_REQUEST_USER_EMAIL_NOT_VALID: {
        message: {
                "uk": 'Помилка! Будь ласка введіть електронну адресу в форматі: email@mail.com',
                "ru": 'Ошибка! Пожалуйста введите свой електронный адрес в формате: email@mail.com',
                "en": 'Error! Insert valid email in format: email@mail.com',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_INCORRECT_ADMIN_LOGIN_DATA: {
        message: {
                "uk": 'Телефон та/або пароль введено невірно',
                "ru": 'Телефон и/или пароль введенно не верно',
                "en": 'Телефон and/or password is invalid',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_FORBIDDEN: {
        message: {
                "uk": 'Доступ тільки для користувачів/дилерів/дезайнерів',
                "ru": 'Доступ только для пользователей/дилеров/дезайнеров',
                "en": 'Access only for users/dealers/designers',
        },
        code: 403
    },
    CLIENT_BAD_REQUEST_USER_BLOKED: {
        message: {
                "uk": 'Ваш акаунт заблоковано',
                "ru": 'Ваш аккаунт заблакирован',
                "en": 'Your accaunt blocked',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_USER_WAITING: {
        message: {
                "uk": 'Очікуйте підтвердження регістрації',
                "ru": 'Ожидайте подтверждения регистрации',
                "en": 'Wait for accaut registration',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_USER_DELETED: {
        message: {
                "uk": 'Ваш акаунт видалено',
                "ru": 'Ваш аккаунт удален',
                "en": 'You account deleted',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_REQUIRED_USER_FIELDS_EMPTI: {
        message:{
            "uk": 'Помилка! Будь ласка заповніть всі обовязкові поля',
            "ru": 'Ошибка! Пожалуйста заполните все обязательные поля',
            "en": 'Error! Please fill all required fields',
        } ,
        code: 400
    },
    CLIENT_BAD_REQUEST_USER_HARD_PASSWORD_NOT_VALID: {
        message:{
            "uk": 'Помилка! Пароль не відповідає вимогам (щонайменше 8 символів і не більше 16 символів і як мінімум одна велика і одна мала літери і один доступний символ:!@#$%^&*()_\-+= і лише латинські літери і як мінімум одна цифра)',
            "ru": 'Ошибка! Пароль не отвечает требованиям (не менее 8 символов и не более 16 символов и как минимум одна большая и одна строчная буквы и один доступный символ:!@#$%^&*()_\-+= и только латинские буквы и как минимум одна цифра )',
            "en": 'Error! The password does not meet the requirements (at least 8 characters and no more than 16 characters and at least one uppercase and one lowercase letter and one available character:!@#$%^&*()_\-+= and only Latin letters and at least one number )',
        } ,
        code: 400
    },
    CLIENT_BAD_REQUEST_USER_PASSWORD_NOT_VALID: {
        message:{
            "uk": 'Помилка! Пароль не відповідає вимогам (щонайменше 6 символів і не більше 16 символів і як мінімум одна велика і одна мала літери)',
            "ru": 'Ошибка! Пароль не отвечает требованиям (не менее 6 символов и не более 16 символов и как минимум одна большая и одна строчная буквы)',
            "en": 'Error! The password does not meet the requirements (at least 6 characters and no more than 16 characters and at least one uppercase and one lowercase letter)',
        } ,
        code: 400
    },
    CLIENT_BAD_REQUEST_USER_CONFIRM_PASSWORD_NOT_MATCH: {
        message:{
            "uk": 'Помилка! Пароль не збігається, будь ласка підтвердіть пароль',
            "ru": 'Ошибка! Пароль не совпадает. пожалуйста подтвердите пароль',
            "en": 'Error! Password does not match, please confirm password',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_USER_PHONE_NOT_VALID: {
        message:{
            "uk": 'Помилка! Будь ласка вкажіть номер телефону у форматі +38 (099) 000 00 00',
            "ru": 'Ошибка! Укажите телефон в формате +38 (099) 000 00 00',
            "en": 'Error! Set phone number in current format +38 (099) 000 00 00',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_USER_EMAIL_EXIST: {
        message:{
            "uk": 'Помилка! Користувач з такою електронною адресою вже створений',
            "ru": 'Ошибка! Пользователь с такой електронным адресом уже создан',
            "en": 'Error! User with such email already exist',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_USER_PHONE_EXIST: {
        message:{
            "uk": 'Помилка! Користувач з таким номером телефону вже створений',
            "ru": 'Ошибка! Пользователь с такмим номером телефона уже создан',
            "en": 'Error! User with such phone number already exist',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_CLIENT_NOT_EXIST: {
        message:{
            "uk": 'Помилка! Користувача з таким  номером телефону не знайдено',
            "ru": 'Ошибка! Пользователь с таким номером телефона не найден',
            "en": 'Error! User with such phone number not found',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_RECOVER_LIMIT: {
        message:{
            "uk": 'Помилка! Перевищено ліміт запитів, спробуйте повторити дію через 30хв',
            "ru": 'Ошибка! Превышен лимит запросов, попробуйте повторить действие через 30 мин',
            "en": 'Error! Request limit exceeded, please try again in 30 minutes',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_INVALID_VARIFICATION_CODE: {
        message:{
            "uk": 'Помилка! Неправильний код підтвердження',
            "ru": 'Ошибка! Не верный код подтверждения',
            "en": 'Error! Incorrect varification code',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_OLD_VARIFICATION_CODE: {
        message:{
            "uk": 'Помилка! Недійсний  код підтвердження',
            "ru": 'Ошибка! Не действительный код подтверждения',
            "en": 'Error! Dead varification code',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_EMAIL_OR_PHONE_ARE_USED: {
        message:{
            "uk": 'Помилка! Емейл або пароль вже зайнятий іншим користувачем',
            "ru": 'Ошибка! Емейл или пароль уже занят другим пользователем',
            "en": 'Error! Email or password already used by some user',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_USER_PASSWORD_SAME_AS_OLD: {
        message:{
            "uk": 'Помилка! Введіть новий пароль, відмінний від старого',
            "ru": 'Ошибка! Введите новый пароль который отличается от старого',
            "en": 'Error! Enter new password witch is different from old password',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_INVALID_OLD_PASSWORD: {
        message:{
            "uk": 'Помилка! Старий пароль введено невірно',
            "ru": 'Ошибка! Старый пароль введен не верно',
            "en": 'Error! Old password is invalid',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST: {
        message:{
            "uk": 'Помилка! Спробуйте ще раз',
            "ru": 'Ошибка! Попробуйте еще раз',
            "en": 'Error! Try again',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_PROMOCODE_NOT_FOUND: {
        message:{
            "uk": 'Помилка! Промокод не знайдено',
            "ru": 'Ошибка! Промокод не найден',
            "en": 'Error! Promocode not found',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_PROMOCODE_NOT_ACTIVE: {
        message:{
            "uk": 'Помилка! Промокод не активний',
            "ru": 'Ошибка! Промокод не активен',
            "en": 'Error! Promocode not active',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_PROMOCODE_CANT_BE_USED: {
        message:{
            "uk": 'Помилка! Ви не можете використати даний промокод',
            "ru": 'Ошибка! Вы не можете использовать этот промокод',
            "en": 'Error! You cant use this promocode',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_PROMOCODE_DISCOUNT_BIGGER_THAN_PRICE: {
        message:{
            "uk": 'Помилка! Сума знижки більша за загальну вартісь',
            "ru": 'Ошибка! Сумма скидки больше за общую стоимость',
            "en": 'Error! Discount value is bigger than total price',
        },
        code: 400
    },
    CLIENT_BAD_REQUEST_PRIVATBANK_PART_PAY_CANT_BE_MORE_THAN_100000: {
        message:{
            "uk": 'Помилка! Оплата частинами Приват Банк не може перевищувати 100 000 грн',
            "ru": 'Ошибка! Оплата частями Приват Банк не может быть больше 100 000 грн',
            "en": 'Error! Privat Bank part pay cant be more 100 000 UAH',
        },
        code: 400
    },
}
