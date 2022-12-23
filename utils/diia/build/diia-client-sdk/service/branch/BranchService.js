"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BranchService {
    branchApi;
    constructor(branchApi) {
        this.branchApi = branchApi;
    }
    async getBranches(skip, limit) {
        return await this.branchApi.getAllBranches(skip, limit);
    }
    async getBranch(branchId) {
        return await this.branchApi.getBranchById(branchId);
    }
    async deleteBranch(branchId) {
        await this.branchApi.deleteBranchById(branchId);
    }
    async createBranch(newBranch) {
        return await this.branchApi.createBranch(newBranch);
    }
    async updateBranch(branch) {
        return await this.branchApi.updateBranch(branch);
    }
}
exports.default = BranchService;
