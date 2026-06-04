import { Express } from 'express'
import { CoreService } from '../services/core.service'
import { RoomTempController } from '../controllers/room_temp.controller'

export function registerRoomTempRoutes(app: Express, core: CoreService): void {
    const controller = new RoomTempController(core)

    app.get('/get_room_temp', controller.getRoomTemp.bind(controller))
}
