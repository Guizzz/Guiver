import { Express } from 'express'
import { CoreService } from '../services/core.service'
import { RelayController } from '../controllers/relay.controller'


export function registerRelayRoutes( app: Express, core: CoreService ): void {
    const controller = new RelayController(core)

    app.post('/set_relay', controller.setRelay.bind(controller))
    app.get('/get_relay_status', controller.getRelayStatus.bind(controller))
}