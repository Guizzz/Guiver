export interface RGBPayload {
    redValue?: number
    greenValue?: number
    blueValue?: number
}

export interface CoreResponse {
    id: string
    type?: string
    command?: string
    module?: string
    payload?: RGBPayload & Record<string, any>
}