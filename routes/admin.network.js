const express = require('express');
const router = express.Router();
const adminNetworksController = require('../controllers/admin-network.controller');
const validateTokenMiddleware = require('../middlewares/validate-token.middleware');
const checkSuperAdminMiddleware = require('../middlewares/check-super-admin-role.middleware');


router.use(validateTokenMiddleware, checkSuperAdminMiddleware);

router

    .post('/saveStore', adminNetworksController.saveStore)

.post('/getAllStores', adminNetworksController.getAllStores)

.get('/getStore/:id', adminNetworksController.getStoreById)

.post('/deleteStores', adminNetworksController.deleteStoresByIds)

.post('/saveCity', adminNetworksController.saveCity)

.post('/getAllCities', adminNetworksController.getAllCities)

.get('/getCity/:id', adminNetworksController.getCityById)

.post('/deleteCities', adminNetworksController.deleteCitiesByIds)


module.exports = router;