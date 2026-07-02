import express from 'express'
import cors from 'cors'

import { CoreService } from './services/core.service'
import { registerWeatherRoutes } from './routes/weather.routes'
import { registerCryptoRoutes } from './routes/crypto.routes'
import { registerEspRoutes } from './routes/esp.routes'
import { initSwagger } from './swagger'

export default class API_Server {
    private app = express()
    private core = new CoreService()

    constructor() {
        this.app.use(cors())
        this.app.use(express.json())

        initSwagger(this.app);

        registerWeatherRoutes(this.app, this.core)
        registerCryptoRoutes(this.app, this.core)
        registerEspRoutes(this.app, this.core)

        const port = process.env.API_PORT || 8080

        this.app.listen(port, () => {
            console.log(`Server running on ${port}`)
        })
    }
}