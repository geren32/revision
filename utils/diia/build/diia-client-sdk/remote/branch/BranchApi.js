"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
class BranchApi {
    _http;
    constructor(httpMethodExecutor) {
        this._http = httpMethodExecutor;
    }
    /*
    curl -X POST "{diia_host}/api/v2/acquirers/branch"
    -H "accept: application/json"
    -H "Authorization: Bearer {session_token}"
    -H "Content-Type: application/json"
    -d "{\"customFullName\":\"Повна назва запитувача документа\", \"customFullAddress\":\"Повна адреса відділення\",
    \"name\":\"Назва відділення\", \"email\":\"test@email.com\", \"region\":\"Київська обл.\",
    \"district\":\"Києво-Святошинський р-н\", \"location\":\"м. Вишневе\", \"street\":\"вул. Київська\",
    \"house\":\"2г\", \"deliveryTypes\": [\"api\"], \"offerRequestType\": \"dynamic\",
    \"scopes\":{\"sharing\":[\"passport\",\"internal passport\",\"foreign-passport\"], \"identification\":[],
    \"documentIdentification\":[\"internal-passport\",\"foreign passport\"]}}"
    */
    async createBranch(newBranch) {
        (0, utils_1.log)(`Starting createBranch: ${(0, utils_1.prettyJson)(newBranch)}`);
        const { data } = await this._http.doPost('/api/v2/acquirers/branch', newBranch);
        (0, utils_1.log)(`Finishing createBranch: ${(0, utils_1.prettyJson)(data)}`);
        return data;
    }
    /*
        curl -X DELETE "{diia_host}/api/v2/acquirers/branch/{branch_id}"
        -H "Accept: */ /*"
    -H "Authorization: Bearer {session_token}"
    -H "Content-Type: application/json"
*/
    async deleteBranchById(branchId) {
        (0, utils_1.log)(`Starting deleteBranchById: ${branchId}`);
        const response = await this._http.doDelete(`/api/v2/acquirers/branch/${branchId}`);
        (0, utils_1.log)(`Finishing deleteBranchById with status ${response.status}`);
    }
    /*
        curl -X GET "{diia_host}/api/v2/acquirers/branches?skip=0&limit=2"
        -H "accept: application/json"
        -H "Authorization: Bearer {session_token}"
    */
    async getAllBranches(skip, limit) {
        (0, utils_1.log)(`Starting getAllBranches: skip=${skip} limit=${limit}`);
        const url = `/api/v2/acquirers/branches${(0, utils_1.genUrlParams)(skip, limit)}`;
        const { data } = await this._http.doGet(url);
        (0, utils_1.log)(`Finishing getAllBranches: ${(0, utils_1.prettyJson)(data)}`);
        return data;
    }
    /*
    curl -X GET "{diia_host}/api/v2/acquirers/branch/{branch_id}"
    -H "accept: application/json"
    -H "Authorization: Bearer {session_token}"
    */
    async getBranchById(branchId) {
        (0, utils_1.log)(`Starting getBranchById: branchId=${branchId}`);
        const { data } = await this._http.doGet(`/api/v2/acquirers/branch/${branchId}`);
        (0, utils_1.log)(`Finishing getBranchById: ${(0, utils_1.prettyJson)(data)}`);
        return data;
    }
    /*
        curl -X PUT "{diia_host}/api/v2/acquirers/branch/{branch_id}"
        -H "Accept: application/json"
        -H "Authorization: Bearer {session_token}"
        -H "Content-Type: application/json"
        -d "{\"customFullName\":\"Повна назва запитувача документа\", \"customFullAddress\":\"Повна адреса відділення\",
        \"name\":\"Назва відділення\", \"email\":\"test@email.com\", \"region\":\"Київська обл.\",
        \"district\":\"Києво-Святошинський р-н\", \"location\":\"м. Вишневе\", \"street\":\"вул. Київська\",
        \"house\":\"2г\", \"deliveryTypes\": [\"api\"], \"offerRequestType\": \"dynamic\",
        \"scopes\":{\"sharing\":[\"passport\",\"internal passport\",\"foreign-passport\"], \"identification\":[],
        \"documentIdentification\":[\"internal-passport\",\"foreign passport\"]}}"
    */
    async updateBranch(branch) {
        (0, utils_1.log)(`Starting updateBranch: ${branch}`);
        const { data } = await this._http.doPut(`/api/v2/acquirers/branch/${branch.id}`, branch);
        (0, utils_1.log)(`Finishing getBranchById: ${data}`);
        return data;
    }
}
exports.default = BranchApi;
