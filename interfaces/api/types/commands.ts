export type CoreCommandType =
    | 'request'
    | 'managment'

export type CoreRequestCommand =
    | 'get_weather'
    | 'led_status'
    | 'led_manual'
    | 'rainbow_start'
    | 'rainbow_stop'
    | 'set_relay'
    | 'relay_status'
    | 'get_crypto_data'
    | 'esp_list'
    | 'esp_command'

export interface CoreCommand<T = any> {
    id: string
    type: CoreCommandType
    command: CoreRequestCommand | string
    module?: string
    module_queue?: string
    payload?: T
}