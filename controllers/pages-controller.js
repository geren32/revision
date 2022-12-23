

const pageService= require('../services/pages.service'); 
class PagesController {

    async getPages(id){
        try {
            if (!id) res.json('No id') 

            let data = pageService.getPage({id:id});
       
           
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

module.exports = PagesController;