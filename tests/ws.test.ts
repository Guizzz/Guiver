import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'
import { WS_URL, TEST_TIMEOUT } from './helpers'

let ws: WebSocket

const commands: { command: string; payload?: any }[] = [
  { command: 'led_status' },
  { command: 'relay_status' },
  { command: 'get_weather' },
  { command: 'get_crypto_data' },
]

function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.OPEN) resolve()
    ws.on('open', () => resolve())
    ws.on('error', (err) => reject(err))
  })
}

function send(command: string, payload: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID()
    const client_id = 'test-client'
    const msg = { client_id, id, type: 'request', command, payload }

    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for response to ${command}`))
    }, TEST_TIMEOUT)

    ws.once('message', (raw: Buffer) => {
      clearTimeout(timeout)
      try {
        resolve(JSON.parse(raw.toString()))
      } catch {
        reject(new Error(`Invalid JSON: ${raw.toString()}`))
      }
    })

    ws.send(JSON.stringify(msg))
  })
}

describe('WebSocket', () => {
  beforeAll(async () => {
    ws = new WebSocket(WS_URL)
    await waitForOpen(ws)
  }, TEST_TIMEOUT)

  afterAll(() => {
    ws?.close()
  })

  it('connects successfully', () => {
    expect(ws.readyState).toBe(WebSocket.OPEN)
  })

  for (const cmd of commands) {
    it(`response to "${cmd.command}" has correct structure`, async () => {
      const response = await send(cmd.command, cmd.payload)
      expect(response).toHaveProperty('id')
      expect(response).toHaveProperty('type')
      expect(response.type).toBe('response')
    }, TEST_TIMEOUT)
  }
})
