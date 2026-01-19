import {JSONSchemaType} from "ajv";

export interface HistoryArchiveScanErrorV1 {
    readonly url: string;
    readonly message: string;
    readonly count: number;
    readonly category: string;
}

export interface HistoryArchiveScanV1 {
    readonly url: string;
    readonly startDate: string;
    readonly endDate: string;
    readonly latestVerifiedLedger: number;
    readonly hasError: boolean;
    readonly errors: HistoryArchiveScanErrorV1[];
    readonly isSlow: boolean;
}

export const HistoryArchiveScanV1Schema: JSONSchemaType<HistoryArchiveScanV1> = {
    "$id": "history-scan-v1.json",
    "$schema": "http://json-schema.org/draft-07/schema#",
    "properties": {
        "startDate": {
            "format": "date-time",
            "type": "string"
        },
        "endDate": {
            "format": "date-time",
            "type": "string"
        },
        "url": {
            "type": "string"
        },
        "latestVerifiedLedger": {
            "type": "number"
        },
        "hasError": {
            "type": "boolean"
        },
        "errors": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "url": { "type": "string" },
                    "message": { "type": "string" },
                    "count": { "type": "number" },
                    "category": { "type": "string" }
                },
                "required": ["url", "message", "count", "category"]
            }
        },
        "isSlow": {
            "type": "boolean"
        }
    },
    "type": "object",
    "required": [
        "url",
        "startDate",
        "endDate",
        "hasError",
        "latestVerifiedLedger",
        "isSlow",
        "errors"
    ]
}