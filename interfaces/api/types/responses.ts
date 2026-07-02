export interface CoreResponse {
    id: string
    type?: string
    command?: string
    module?: string
    payload?: Record<string, any>
}