import ISessionTokenService from "./ISessionTokenService";
import { AxiosInstance } from "axios";
import {log} from "../../utils";

export default class SessionTokenService implements ISessionTokenService {
    private static SESSION_TOKEN_TIME_TO_LIVE: number = 2 * 3600 * 1000;
    private sessionToken: string;
    private sessionTokenObtainTime: number = 0;
    private diiaHost: string;
    private acquirerToken: string;
    private http: AxiosInstance;

    public constructor(acquirerToken: string, diiaHost: string, axiosInstance: AxiosInstance) {
        this.acquirerToken = acquirerToken;
        this.diiaHost = diiaHost;
        this.http = axiosInstance;
    }


    public async getSessionToken(): Promise<string> {
        log('Starting SessionTokenService.getSessionToken...');
        const now: number = Date.now();

        if (!this.sessionToken || SessionTokenService.SESSION_TOKEN_TIME_TO_LIVE >= now - this.sessionTokenObtainTime) {
            this.sessionToken = await this.obtainSessionToken();
            this.sessionTokenObtainTime = now;
        }
        log(`Finish SessionTokenService.getSessionToken sessionToken = ${this.sessionToken}`);
        return this.sessionToken;
    }

    private async obtainSessionToken(): Promise<string> {
        log('Starting SessionTokenService.obtainSessionToken...');
        try {
            let sessionToken: string = '';
            const { data } = await this.http.get(`/api/v1/auth/acquirer/${this.acquirerToken}`);

            if (data && data.token) {
                sessionToken = data.token
            }
            log(`Finish SessionTokenService.obtainSessionToken sessionToken = ${sessionToken}`);
            return sessionToken;
        } catch (e) {
            throw e as Error;
        }
    }
}
