"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AxiosConfiguration {
    static bindDiiaException(http) {
        http.interceptors.response.use(response => response, (error) => {
            const { response } = error;
            if (response) {
                throw error.response.data;
            }
            throw error;
        });
        return this;
    }
}
exports.default = AxiosConfiguration;
