import type { Request, Response } from 'express'
import { CoreService } from '../services/core.service'
import { CoreCommand } from '../types/commands';

export class EspController {
    constructor(private core: CoreService) {}

    async list(req: Request, res: Response): Promise<void> {
        const id = crypto.randomUUID();
        const cmd: CoreCommand = {
            id,
            type: 'request',
            command: 'esp_list',
        };
        this.core.sendCommand(cmd);
        const response = await this.core.waitForResponse(id);
        res.json(response);
    }

    async listByType(req: Request, res: Response): Promise<void> {
        const id = crypto.randomUUID();
        const cmd: CoreCommand = {
            id,
            type: 'request',
            command: 'esp_list',
            payload: { type: req.params.type },
        };
        this.core.sendCommand(cmd);
        const response = await this.core.waitForResponse(id);
        res.json(response);
    }

    async command(req: Request, res: Response): Promise<void> {
        const { id: deviceId, cmd, ...payload } = req.body;

        if (!deviceId || !cmd) {
            res.status(400).json({ error: 'Missing id or cmd in body' });
            return;
        }

        const id = crypto.randomUUID();
        const coreCmd: CoreCommand = {
            id,
            type: 'request',
            command: 'esp_command',
            payload: { id: deviceId, cmd, ...payload },
        };
        this.core.sendCommand(coreCmd);
        const response = await this.core.waitForResponse(id);
        res.json(response);
    }
}
