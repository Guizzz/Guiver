export type CoreCommandType =
    | 'request'
    | 'managment'

export type CoreRequestCommand =
    | 'get_weather'
    | 'get_crypto_data'
    | 'esp_list'
    | 'esp_get'
    | 'esp_command'
    | 'esp_purge'

export interface CoreCommand<T = any> {
    id: string
    type: CoreCommandType
    command: CoreRequestCommand | string
    module?: string
    module_queue?: string
    payload?: T
}