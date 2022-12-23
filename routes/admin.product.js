const express = require('express');
const router = express.Router();


const adminProductController = require('../controllers/admin-product.controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');

router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router

    .post('/saveProduct', adminProductController.saveProduct)
    .post('/changeProductPosition', adminProductController.changeProductPosition)
    .post('/calculateProduct', adminProductController.calculateProduct)
    .post('/getAllProducts', adminProductController.getAllProducts)
    .get('/getProduct/:id', adminProductController.getProduct)
    .post('/deleteProducts', adminProductController.deleteProducts)

    .post('/saveMark', adminProductController.saveMark)
    .post('/changeMarkPosition', adminProductController.changeMarkPosition)
    .post('/getAllMarks', adminProductController.getAllMarks)
    .get('/getMarkById/:id', adminProductController.getMarkById)
    .post('/deleteMark', adminProductController.deleteMark)

    .post('/saveAttribute', adminProductController.saveAttribute)
    .post('/changeAttributePosition', adminProductController.changeAttributePosition)
    .post('/getAllAttributes', adminProductController.getAllAttributes)
    .get('/getAttributeById/:id', adminProductController.getAttributeById)
    .post('/deleteProductAttribute', adminProductController.deleteProductAttribute)
    
    .post('/saveAttributeGroup', adminProductController.saveAttributeGroup)
    // .post('/changeAttributeGroupPosition', adminProductController.changeAttributeGroupPosition)
    .post('/getAllAttributeGroups', adminProductController.getAllAttributeGroups)
    .get('/getAttributeGroupById/:id', adminProductController.getAttributeGroupById)
    .post('/deleteProductAttributeGroups', adminProductController.deleteProductAttributeGroups)

    .post('/saveCategory', adminProductController.saveCategory)
    .post('/changeCategoryPosition', adminProductController.changeCategoryPosition)
    .post('/getAllCategory', adminProductController.getAllCategory)
    .get('/getCategory/:id', adminProductController.getCategory)
    .post('/deleteCategory', adminProductController.deleteCategory)

    .post('/saveTestimonial', adminProductController.saveProductTestimonial)
    .post('/getAllTestimonial', adminProductController.getProductAllCategory)
    .post('/deleteTestimonial', adminProductController.deleteTestimonial)
    




module.exports = router;
