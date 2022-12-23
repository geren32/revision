const { models } = require('../sequelize-orm');
const { Op } = require("sequelize");
const sequelize = require('../sequelize-orm');

module.exports = {

    getAllOrdersByCron: async (filter) => {
        try {

            let result = await models.orders.findAll({
                where:filter,
                include:[
                    {model: models.orders_form_results},
                    {model:models.user,attributes:["id",'email','phone']}
                ],
            });
            if(result && result.length){
                result = result.map(i =>i.toJSON())
                for(let item of result){
                    if(item.orders_form_results && item.orders_form_results.length){
                         item.service = await models.service.findOne({where:{id:item.orders_form_results[0].service_id},attributes:['id','title'],raw:true})
                    }
                    item.file = await models.orders_to_user_uploaded_files.findOne({where:{order_id:item.id},raw:true})
                    if(item.file){
                        item.file = await models.user_uploaded_files.findOne({where:{id:item.file.user_uploaded_files_id},raw:true})
                    }
                }
            }
            return result;
        } catch (err) {
            err.code = 400;
            throw err;
        }
    },
    updateOrderSendStatus:async (data,filter)=>{

        await models.orders.update(data,{where:filter})

        return true
    }
}
