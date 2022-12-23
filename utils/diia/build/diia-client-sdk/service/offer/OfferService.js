"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class OfferService {
    offerApi;
    constructor(offerApi) {
        this.offerApi = offerApi;
    }
    async createOffer(branchId, offer) {
        const response = await this.offerApi.createOffer(branchId, offer);
        return response._id;
    }
    async getOffers(branchId, skip, limit) {
        return await this.offerApi.getOffers(branchId, skip, limit);
    }
    async deleteOffer(branchId, offerId) {
        await this.offerApi.deleteOffer(branchId, offerId);
    }
}
exports.default = OfferService;
