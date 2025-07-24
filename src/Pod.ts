/**
 * Options for creating a new Pod.
 */
interface PodOptions {
    /**
     * If the created Pod is a GPU Pod, a list of acceptable CUDA versions on the Pod.
     * If not set, any CUDA version is acceptable.
     */
    allowedCudaVersions?: Array<'12.8' | '12.7' | '12.6' | '12.5' | '12.4' | '12.3' | '12.2' | '12.1' | '12.0' | '11.8'>;

    /**
     * Set to SECURE to create the Pod in Secure Cloud. Set to COMMUNITY to create the Pod in Community Cloud.
     * @default SECURE
     */
    cloudType?: 'SECURE' | 'COMMUNITY';

    /**
     * Set to GPU to create a GPU Pod. Set to CPU to create a CPU Pod.
     * If set to CPU, the Pod will not have a GPU attached and properties related to GPUs such as gpuTypeIds will be ignored.
     * If set to GPU, the Pod will have a GPU attached and properties related to CPUs such as cpuFlavorIds will be ignored.
     * @default GPU
     */
    computeType?: 'GPU' | 'CPU';

    /**
     * The amount of disk space, in gigabytes (GB), to allocate on the container disk for the created Pod.
     * The data on the container disk is wiped when the Pod restarts.
     * To persist data across Pod restarts, set volumeInGb to configure the Pod network volume.
     * @default 50
     */
    containerDiskInGb?: number | null;

    /**
     * Registry credentials ID.
     */
    containerRegistryAuthId?: string;

    /**
     * A list of country codes where the created Pod can be located.
     * If not set, the Pod can be located in any country.
     */
    countryCodes?: string[];

    /**
     * If the created Pod is a CPU Pod, a list of Runpod CPU flavors which can be attached to the Pod.
     * The order of the list determines the order to rent CPU flavors.
     * See cpuFlavorPriority for how the order of the list affects Pod creation.
     */
    cpuFlavorIds?: Array<'cpu3c' | 'cpu3g' | 'cpu3m' | 'cpu5c' | 'cpu5g' | 'cpu5m'>;

    /**
     * If the created Pod is a CPU Pod, set to availability to respond to current CPU flavor availability.
     * Set to custom to always try to rent CPU flavors in the order specified in cpuFlavorIds.
     * @default availability
     */
    cpuFlavorPriority?: 'availability' | 'custom';

    /**
     * A list of Runpod data center IDs where the created Pod can be located.
     * See dataCenterPriority for information on how the order of the list affects Pod creation.
     */
    dataCenterIds?: Array<'EU-RO-1' | 'CA-MTL-1' | 'EU-SE-1' | 'US-IL-1' | 'EUR-IS-1' | 'EU-CZ-1' | 'US-TX-3' | 'EUR-IS-2' | 'US-KS-2' | 'US-GA-2' | 'US-WA-1' | 'US-TX-1' | 'CA-MTL-3' | 'EU-NL-1' | 'US-TX-4' | 'US-CA-2' | 'US-NC-1' | 'OC-AU-1' | 'US-DE-1' | 'EUR-IS-3' | 'CA-MTL-2' | 'AP-JP-1' | 'EUR-NO-1' | 'EU-FR-1' | 'US-KS-3' | 'US-GA-1'>;

    /**
     * Set to availability to respond to current machine availability.
     * Set to custom to always try to rent machines from data centers in the order specified in dataCenterIds.
     * @default availability
     */
    dataCenterPriority?: 'availability' | 'custom';

    /**
     * If specified, overrides the ENTRYPOINT for the Docker image run on the created Pod.
     * If [], uses the ENTRYPOINT defined in the image.
     * @default []
     */
    dockerEntrypoint?: string[];

    /**
     * If specified, overrides the start CMD for the Docker image run on the created Pod.
     * If [], uses the start CMD defined in the image.
     * @default []
     */
    dockerStartCmd?: string[];

    /**
     * Environment variables for the Pod.
     * @default {}
     */
    env?: Record<string, string>;

    /**
     * Set to true to enable global networking for the created Pod.
     * Currently only available for On-Demand GPU Pods on some Secure Cloud data centers.
     * @default false
     */
    globalNetworking?: boolean;

    /**
     * If the created Pod is a GPU Pod, the number of GPUs attached to the created Pod.
     * @default 1
     * @minimum 1
     */
    gpuCount?: number;

    /**
     * If the created Pod is a GPU Pod, a list of Runpod GPU types which can be attached to the created Pod.
     * The order of the list determines the order to rent GPU types.
     * See gpuTypePriority for information on how the order of the list affects Pod creation.
     */
    gpuTypeIds?: Array<string>;

    /**
     * If the created Pod is a GPU Pod, set to availability to respond to current GPU type availability.
     * Set to custom to always try to rent GPU types in the order specified in gpuTypeIds.
     * @default availability
     */
    gpuTypePriority?: 'availability' | 'custom';

    /**
     * The image tag for the container run on the created Pod.
     */
    imageName?: string;

    /**
     * Set to true to create an interruptible or spot Pod.
     * An interruptible Pod can be rented at a lower cost but can be stopped at any time to free up resources for another Pod.
     * A reserved Pod is rented at a higher cost but runs until it exits or is manually stopped.
     * @default false
     */
    interruptible?: boolean;

    /**
     * Set to true to lock a Pod. Locking a Pod disables stopping or resetting the Pod.
     * @default false
     */
    locked?: boolean;

    /**
     * The minimum disk bandwidth, in megabytes per second (MBps), for the created Pod.
     */
    minDiskBandwidthMBps?: number;

    /**
     * The minimum download speed, in megabits per second (Mbps), for the created Pod.
     */
    minDownloadMbps?: number;

    /**
     * If the created Pod is a GPU Pod, the minimum amount of RAM, in gigabytes (GB),
     * allocated to the created Pod for each GPU attached to the Pod.
     * @default 8
     */
    minRAMPerGPU?: number;

    /**
     * The minimum upload speed, in megabits per second (Mbps), for the created Pod.
     */
    minUploadMbps?: number;

    /**
     * If the created Pod is a GPU Pod, the minimum number of virtual CPUs allocated
     * to the created Pod for each GPU attached to the Pod.
     * @default 2
     */
    minVCPUPerGPU?: number;

    /**
     * A user-defined name for the created Pod. The name does not need to be unique.
     * @default my pod
     * @maxLength 191
     */
    name?: string;

    /**
     * The unique string identifying the network volume to attach to the created Pod.
     * If attached, a network volume replaces the Pod network volume.
     */
    networkVolumeId?: string;

    /**
     * A list of ports exposed on the created Pod.
     * Each port is formatted as [port number]/[protocol]. Protocol can be either http or tcp.
     * @default 8888/http,22/tcp
     */
    ports?: string[];

    /**
     * If the created Pod is on Community Cloud, set to true if you need the Pod to expose a public IP address.
     * If null, the Pod might not have a public IP address.
     * On Secure Cloud, the Pod will always have a public IP address.
     */
    supportPublicIp?: boolean;

    /**
     * If the Pod is created with a template, the unique string identifying that template.
     */
    templateId?: string | null;

    /**
     * If the created Pod is a CPU Pod, the number of vCPUs allocated to the Pod.
     * @default 2
     */
    vcpuCount?: number;

    /**
     * The amount of disk space, in gigabytes (GB), to allocate on the Pod volume for the created Pod.
     * The data on the Pod volume is persisted across Pod restarts.
     * To persist data so that future Pods can access it, create a network volume
     * and set networkVolumeId to attach it to the Pod.
     * @default 20
     */
    volumeInGb?: number | null;

    /**
     * If either a Pod volume or a network volume is attached to a Pod,
     * the absolute path where the network volume will be mounted in the filesystem.
     * @default /workspace
     */
    volumeMountPath?: string;
}

type PodState = "UNINITIALIZED" | "CREATING" | "RUNNING" | "STOPPING" | "STOPPED" | "DELETING" | "DELETED" | "ERROR";

class Pod {
    options: PodOptions
    podState: PodState
    apiKey: string
    baseUrl: string
    private podCreationResponse: any;
    constructor(options: PodOptions, apiKey: string, baseUrl: string = "https://rest.runpod.io/v1") {
        this.options = options
        this.podState = "UNINITIALIZED"
        this.apiKey = apiKey
        this.baseUrl = baseUrl
    }

    /**
     * Create the Pod
     */
    async create() {
        this.podState = "CREATING"

        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(this.options),
        }
        const resp = await fetch(`${this.baseUrl}/pods`, fetchOptions)
        if (!resp.ok) {
            throw new Error(`Failed to create pod: ${resp.statusText}`)
        }

        this.podCreationResponse = await resp.json()
        this.podState = "RUNNING"
    }

    get id() {
        if (!["RUNNING", "STOPPED"].includes(this.podState)) {
            return null
        }
        return this.podCreationResponse.id
    }

    /**
     * Stop the Pod
     */
    async stop() {
        this.podState = "STOPPING"
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(this.options),
        }
        await fetch(`${this.baseUrl}/pods/${this.id}/stop`, fetchOptions)
        this.podState = "STOPPED"
    }

    /**
     * Delete the Pod
     */
    async delete() {
        this.podState = "DELETING"
        const fetchOptions = {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            }
        }
        await fetch(`${this.baseUrl}/pods/${this.id}`, fetchOptions)
        this.podState = "DELETED"
    }
}
export { Pod, PodOptions }
