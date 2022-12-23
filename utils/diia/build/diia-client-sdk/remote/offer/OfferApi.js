"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
class OfferApi {
    _http;
    constructor(httpMethodExecutor) {
        this._http = httpMethodExecutor;
    }
    /*
        curl -X POST "https://{diia_host}/api/v1/acquirers/branch/{branch_id}/offer"
        -H  "accept: application/json"
        -H  "Authorization: Bearer {session_token}"
        -H  "Content-Type: application/json"
        -d "{ \"name\": \"Назва послуги\", \"scopes\": { \"sharing\": [\"passport\"] } }"
     */
    async createOffer(branchId, offer) {
        (0, utils_1.log)(`Starting createOffer: branchId=${branchId} offer=${(0, utils_1.prettyJson)(offer)}`);
        const { data } = await this._http.doPost(`api/v1/acquirers/branch/${branchId}/offer`, offer);
        (0, utils_1.log)(`Finishing createOffer: ${(0, utils_1.prettyJson)(data)}`);
        return data;
    }
    /*
        curl -X DELETE "https://{diia_host}/api/v1/acquirers/branch/{branch_id}/offer/{offer_id}"
        -H "accept: */ /*"
    -H "Authorization: Bearer {session_token}"
    -H "Content-Type: application/json"
*/
    async deleteOffer(branchId, offerId) {
        (0, utils_1.log)(`Starting deleteOffer: branchId=${branchId} offerId=${offerId}`);
        const response = await this._http.doDelete(`api/v1/acquirers/branch/${branchId}/offer/${offerId}`);
        (0, utils_1.log)(`Finishing deleteOffer with status ${response.status}`);
    }
    /*
        curl -X GET "https://{diia_host}/api/v1/acquirers/branch/{branch_id}/offers?skip=0&limit=100"
        -H  "accept: application/json"
        -H  "Authorization: Bearer {session_token}"
    */
    async getOffers(branchId, skip, limit) {
        (0, utils_1.log)(`Starting getOffers: branchId=${branchId} skip=${skip} limit=${limit}`);
        const url = `/api/v1/acquirers/branch/${branchId}/offers${(0, utils_1.genUrlParams)(skip, limit)}`;
        const { data } = await this._http.doGet(url);
        (0, utils_1.log)(`Finishing getOffers: ${(0, utils_1.prettyJson)(data)}`);
        return data;
    }
}
exports.default = OfferApi;
