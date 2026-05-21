import { Express } from 'express'
import { CoreService } from '../services/core.service'
import { LedController } from '../controllers/led.controller'

export function registerLedRoutes( app: Express, core: CoreService): void 
{
    const controller = new LedController(core)

    app.get('/get_led_status', controller.getStatus.bind(controller))
    app.post('/manual_led',    controller.manual.bind(controller))
    app.post('/set_rainbow',   controller.setRainbow.bind(controller))
}