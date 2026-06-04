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
    | 'get_water_pump_status'
    | 'get_room_temp'
    | 'get_crypto_data'

export interface CoreCommand<T = any> {
    id: string
    type: CoreCommandType
    command: CoreRequestCommand | string
    module?: string
    module_queue?: string
    payload?: T
}