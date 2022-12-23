const bcrypt = require('bcrypt');


module.exports = {

    hashPassword: async (password) => {
        return await bcrypt.hash(password, 10);
    },

    comparePassword: async (password, hashedPassword) => {
        const isPasswordsEquals = await bcrypt.compare(password, hashedPassword);
        return isPasswordsEquals;
    }


}
