import express from 'express'
import cors from 'cors'

import { CoreService } from './services/core.service'
import { registerLedRoutes } from './routes/led.routes'
import { registerRelayRoutes } from './routes/relay.routes'
import { registerWeatherRoutes } from './routes/weather.routes'
import { registerPumpRoutes } from './routes/pump.routes'

export class API_Server {
    private app = express()
    private core = new CoreService()

    constructor() {
        this.app.use(cors())
        this.app.use(express.json())

        registerLedRoutes(this.app, this.core)
        registerRelayRoutes(this.app, this.core)
        registerWeatherRoutes(this.app, this.core)
        registerPumpRoutes(this.app, this.core)

        const port = process.env.API_PORT || 8080

        this.app.listen(port, () => {
            console.log(`Server running on ${port}`)
        })
    }
}