import { Express } from 'express'
import { CoreService } from '../services/core.service'
import { WaterController } from '../controllers/pump.controller'


export function registerPumpRoutes( app: Express, core: CoreService): void 
{
    const controller = new WaterController(core)

    app.get('/get_water_pump_status', controller.getPumpStatus.bind(controller))
    app.get('/get_water_pump_ambient_temp', controller.getPumpAmbientTemp.bind(controller))
}