import { Express } from 'express'
import { CoreService } from '../services/core.service'
import { EspController } from '../controllers/esp.controller'


export function registerEspRoutes(app: Express, core: CoreService): void {
    const controller = new EspController(core)

    app.get('/esp', controller.list.bind(controller))
    app.get('/esp/:type', controller.listByType.bind(controller))
    app.post('/esp/:id/command', controller.command.bind(controller))
}
