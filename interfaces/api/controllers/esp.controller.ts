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
        const response = await this.core.sendCommand(cmd);
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
        const response = await this.core.sendCommand(cmd);
        res.json(response);
    }

    async getById(req: Request, res: Response): Promise<void> {
        const id = crypto.randomUUID();
        const cmd: CoreCommand = {
            id,
            type: 'request',
            command: 'esp_get',
            payload: { id: req.params.id },
        };
        const response = await this.core.sendCommand(cmd);
        if (response.payload?.error) {
            res.status(404).json(response);
            return;
        }
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
        const response = await this.core.sendCommand(coreCmd);
        res.json(response);
    }
}
