"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const HttpMethodExecutor_1 = __importDefault(require("./remote/HttpMethodExecutor"));
const AxiosConfiguration_1 = __importDefault(require("./remote/AxiosConfiguration"));
const DocumentService_1 = __importDefault(require("./service/document/DocumentService"));
const SharingService_1 = __importDefault(require("./service/sharing/SharingService"));
const BranchService_1 = __importDefault(require("./service/branch/BranchService"));
const OfferService_1 = __importDefault(require("./service/offer/OfferService"));
const ValidationService_1 = __importDefault(require("./service/validation/ValidationService"));
const SessionTokenService_1 = __importDefault(require("./service/session-token/SessionTokenService"));
const BranchApi_1 = __importDefault(require("./remote/branch/BranchApi"));
const OfferApi_1 = __importDefault(require("./remote/offer/OfferApi"));
const SharingApi_1 = __importDefault(require("./remote/sharing/SharingApi"));
const ValidationApi_1 = __importDefault(require("./remote/validation/ValidationApi"));
const CryptoService_1 = __importDefault(require("../diia-client-crypto/CryptoService"));
const CryptoUaPkiService_1 = __importDefault(require("../diia-client-crypto/CryptoUaPkiService"));
const DiiaSignService_1 = __importDefault(require("./service/diia-sign/DiiaSignService"));
const DeeplinkService_1 = __importDefault(require("./service/deeplink/DeeplinkService"));
const DeeplinkApi_1 = __importDefault(require("./remote/deeplink/DeeplinkApi"));
class Diia {
    documentService;
    sharingService;
    branchService;
    offerService;
    validationService;
    diiaSignService;
    /**
     * Constructor
     *
     * @param acquirerToken A token used to identify the Partner
     * @param baseDiiaUrl   base URL to Diia REST API
     * @param httpRequestConfig axios configuration
     * @param cryptoLibraryConfig preconfigured implementation of CryptoService interface
     */
    constructor(acquirerToken, baseDiiaUrl, httpRequestConfig = {}, cryptoLibraryConfig) {
        const axiosInstance = axios_1.default.create({
            ...httpRequestConfig,
            baseURL: baseDiiaUrl
        });
        AxiosConfiguration_1.default.bindDiiaException(axiosInstance);
        const sessionTokenService = new SessionTokenService_1.default(acquirerToken, baseDiiaUrl, axiosInstance);
        const httpMethodExecutor = new HttpMethodExecutor_1.default(sessionTokenService, axiosInstance);
        const cryptoService = new CryptoService_1.default(new CryptoUaPkiService_1.default(cryptoLibraryConfig));
        const deepLinkService = new DeeplinkService_1.default(new DeeplinkApi_1.default(httpMethodExecutor));
        this.branchService = new BranchService_1.default(new BranchApi_1.default(httpMethodExecutor));
        this.offerService = new OfferService_1.default(new OfferApi_1.default(httpMethodExecutor));
        this.sharingService = new SharingService_1.default(new SharingApi_1.default(httpMethodExecutor), deepLinkService);
        this.validationService = new ValidationService_1.default(new ValidationApi_1.default(httpMethodExecutor));
        this.diiaSignService = new DiiaSignService_1.default(deepLinkService, cryptoService);
        this.documentService = new DocumentService_1.default(cryptoService);
    }
    /**
     * Get branches list
     *
     * @param skip  (optional) number of branches to be skipped
     * @param limit (optional) max number of branches in response
     * @return list of branches
     */
    async getBranches(skip, limit) {
        try {
            return await this.branchService.getBranches(skip, limit);
        }
        catch (e) {
            console.error('Get branches request error');
            throw e;
        }
    }
    /**
     * Get branch by id
     *
     * @param branchId branch id
     * @return branch
     */
    async getBranch(branchId) {
        try {
            return await this.branchService.getBranch(branchId);
        }
        catch (e) {
            console.error('Get branch request error');
            throw e;
        }
    }
    /**
     * Delete branch
     *
     * @param branchId branch id
     */
    async deleteBranch(branchId) {
        try {
            return await this.branchService.deleteBranch(branchId);
        }
        catch (e) {
            console.error('Delete branch request error');
            throw e;
        }
    }
    /**
     * Create new branch
     *
     * @param branch new branch model
     * @return branch id
     */
    async createBranch(branch) {
        try {
            return await this.branchService.createBranch(branch);
        }
        catch (e) {
            console.error('Create branch request error');
            throw e;
        }
    }
    /**
     * Update existing branch
     *
     * @param branch updated branch instance
     * @return updated branch id
     */
    async updateBranch(branch) {
        try {
            return await this.branchService.updateBranch(branch);
        }
        catch (e) {
            console.error('Update branch request error');
            throw e;
        }
    }
    /**
     * Get offers list on the branch
     * There may be a lots of offers on one branch. So it's recommended to limiting requested offers count.
     *
     * @param branchId branch id
     * @param skip     (optional) number of offers to be skipped
     * @param limit    (optional) max number of offers in response
     * @return list of offers
     */
    async getOffers(branchId, skip, limit) {
        try {
            return await this.offerService.getOffers(branchId, skip, limit);
        }
        catch (e) {
            console.error('Offer request error');
            throw e;
        }
    }
    /**
     * Create new offer on the branch
     * @param branchId branch id
     * @param offer new offer model
     * @return offer id
     */
    async createOffer(branchId, offer) {
        try {
            return await this.offerService.createOffer(branchId, offer);
        }
        catch (e) {
            console.error('Offer creation error');
            throw e;
        }
    }
    /**
     * Delete offer
     *
     * @param branchId branch id where the offer was created
     * @param offerId  offer id
     */
    async deleteOffer(branchId, offerId) {
        try {
            await this.offerService.deleteOffer(branchId, offerId);
        }
        catch (e) {
            console.error('Offer deletion error');
            throw e;
        }
    }
    /**
     * Initiate document sharing procedure using document barcode
     *
     * @param branchId  branch id
     * @param barCode   barcode
     * @param requestId unique request id to identify document sharing action;
     *                  it will be sent in http-header with document pack
     * @return sign of successful request
     */
    async requestDocumentByBarCode(branchId, barCode, requestId) {
        try {
            return await this.sharingService.requestDocumentByBarCode(branchId, barCode, requestId);
        }
        catch (e) {
            console.error('Document request error');
            throw e;
        }
    }
    /**
     * Get deep link to start document sharing procedure using online scheme
     *
     * @param branchId  branch id
     * @param offerId   offer id
     * @param requestId unique request id to identify document sharing action;
     *                  it will be sent in http-header with document pack
     * @return URL, the deep link that should be opened on mobile device where Diia application is installed
     */
    async getDeepLink(branchId, offerId, requestId) {
        try {
            return await this.sharingService.getDeepLink({
                branchId,
                offerId,
                requestId
            });
        }
        catch (e) {
            console.error('DeepLink request error');
            throw e;
        }
    }
    /**
     * Validate document by barcode (on the back-side of document)
     *
     * @param branchId branch id
     * @param barcode  barcode
     * @return sign of document validity
     */
    async validateDocumentByBarcode(branchId, barcode) {
        try {
            return await this.validationService.validateDocumentByBarcode(branchId, barcode);
        }
        catch (e) {
            console.error('Validation request error');
            throw e;
        }
    }
    /**
     * Unpacking the documents pack received from Diia, check signatures and decipher documents
     *
     * @param headers       all http-headers from the request from Diia application
     * @param multipartBody list of EncodedFile based on multipart-body from Diia application request
     * @param cryptoMeta encodeData (encoded json metadata)
     */
    decodeDocumentPackage(headers, multipartBody, cryptoMeta) {
        try {
            return this.documentService.processDocumentPackage(headers, multipartBody, cryptoMeta);
        }
        catch (e) {
            console.error('decodeDocumentPackage error');
            throw e;
        }
    }
    async getSignHashDeepLink(baseDeepLinkConfig, b64Documents) {
        try {
            return await this.diiaSignService.getSignHashDeepLink(baseDeepLinkConfig, b64Documents);
        }
        catch (e) {
            console.error('getSignHashDeepLink error');
            throw e;
        }
    }
    async getAuthDeepLink(baseDeepLinkConfig) {
        try {
            return await this.diiaSignService.getAuthDeepLink(baseDeepLinkConfig);
        }
        catch (e) {
            console.error('getSignHashDeepLink error');
            console.log(e, 'e');
            throw e;
        }
    }
}
exports.default = Diia;
