export type Base64 = string;

type CMProvider = { lib: string };

export type CryptoLibraryConfiguration = {
    "global": {
        "crypto.dstu.env_data_for_diia.storage.b64": string,
        "crypto.dstu.env_data_for_diia.storage.password.enc": string,
        "crypto.dstu.env_data_for_diia.subjKeyId": string,
        "crypto.dstu.env_data_for_diia.cert.b64": string
    },
    "uapki": {
        "cmProviders": {
            "allowedProviders": CMProvider[]
        },
        "certCache": {
            "trustedCerts": []
        },
        "offline": boolean,
        "reportTime": boolean
    }
};

export enum UaPkiResult {
    Success
}