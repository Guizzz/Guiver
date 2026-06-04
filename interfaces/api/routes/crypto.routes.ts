import { Express } from 'express'
import { CoreService } from '../services/core.service'
import { CryptoController } from '../controllers/crypto.controller'

export function registerCryptoRoutes(app: Express, core: CoreService): void {
    const controller = new CryptoController(core)

    app.get('/get_crypto_data', controller.getCryptoData.bind(controller))
}
