export interface AdditionalCoordinatorEndpoint {
    name?: string;
    profileId: number;
    deviceId: number;
    deviceVersion: number;
    inputClusters: readonly number[];
    outputClusters: readonly number[];
}

export interface CoordinatorEndpoint extends AdditionalCoordinatorEndpoint {
    endpoint: number;
}

function validateNumber(value: number, name: string, max: number): void {
    if (!Number.isInteger(value) || value < 0 || value > max) {
        throw new Error(`Invalid coordinator endpoint ${name}: '${value}'`);
    }
}

function validateCoordinatorEndpointDescriptor(endpoint: AdditionalCoordinatorEndpoint, endpointName: string): void {
    validateNumber(endpoint.profileId, `${endpointName}.profileId`, 0xffff);
    validateNumber(endpoint.deviceId, `${endpointName}.deviceId`, 0xffff);
    validateNumber(endpoint.deviceVersion, `${endpointName}.deviceVersion`, 0xff);
    validateNumber(endpoint.inputClusters.length, `${endpointName}.inputClusters.length`, 0xff);
    validateNumber(endpoint.outputClusters.length, `${endpointName}.outputClusters.length`, 0xff);

    for (const cluster of [...endpoint.inputClusters, ...endpoint.outputClusters]) {
        validateNumber(cluster, `${endpointName}.cluster`, 0xffff);
    }
}

export function validateAdditionalCoordinatorEndpoints(endpoints: readonly AdditionalCoordinatorEndpoint[]): void {
    for (const endpoint of endpoints) {
        validateCoordinatorEndpointDescriptor(endpoint, endpoint.name ?? "endpoint");
    }
}

export function assignCoordinatorEndpointIds(
    additionalEndpoints: readonly AdditionalCoordinatorEndpoint[],
    usedEndpointIds: readonly number[],
): CoordinatorEndpoint[] {
    const endpointIds = new Set(usedEndpointIds);
    const endpoints = additionalEndpoints.map((additionalEndpoint) => {
        let endpoint = 1;

        do {
            endpoint++;
        } while (endpointIds.has(endpoint));

        endpointIds.add(endpoint);
        return {...additionalEndpoint, endpoint};
    });

    validateCoordinatorEndpoints(endpoints);

    return endpoints;
}

export function validateCoordinatorEndpoints(endpoints: readonly CoordinatorEndpoint[]): void {
    const endpointIds = new Set<number>();

    for (const endpoint of endpoints) {
        const endpointName = endpoint.name ?? `endpoint${endpoint.endpoint}`;
        validateNumber(endpoint.endpoint, `${endpointName}.endpoint`, 0xff);
        validateCoordinatorEndpointDescriptor(endpoint, endpointName);

        if (endpoint.endpoint === 0) {
            throw new Error(`Invalid coordinator endpoint ${endpointName}.endpoint: endpoint 0 is reserved for ZDO`);
        }

        if (endpointIds.has(endpoint.endpoint)) {
            throw new Error(`Duplicate coordinator endpoint '${endpoint.endpoint}'`);
        }

        endpointIds.add(endpoint.endpoint);
    }
}
