const { models } = require('../sequelize-orm');

class slugController {

    async getAllMenu(slug){
        try {
            if (!slug) res.json('No id') 

            let data = await models.menu.findOne({
                where: {
                    slug: slug
                }
            });
   
            if(data) 
            return data.toJSON();

        }catch (e) {
            return res.status(400).json({
                message: e.message,
                errCode: '400'
            });
        }
    }

}

module.exports = slugController;