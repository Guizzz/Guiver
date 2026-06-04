import { describe, it, expect } from 'vitest'
import { API_URL, TEST_TIMEOUT } from './helpers'

async function get(path: string) {
  return fetch(`${API_URL}${path}`)
}

async function post(path: string, body: any) {
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const endpoints = [
  { method: 'GET', path: '/get_weather' },
  { method: 'GET', path: '/get_led_status' },
  { method: 'GET', path: '/get_relay_status' },
  { method: 'GET', path: '/get_water_pump_status' },
  { method: 'POST', path: '/manual_led', body: { redValue: 0, greenValue: 0, blueValue: 0 } },
  { method: 'POST', path: '/set_relay', body: { set_relay: false, relay: 'light' } },
  { method: 'GET', path: '/get_room_temp' },
  { method: 'GET', path: '/get_crypto_data' },
]

describe('REST API', () => {
  it('server is reachable', async () => {
    const res = await fetch(API_URL)
    expect(res.status).toBe(404)
  }, TEST_TIMEOUT)

  for (const ep of endpoints) {
    it(`${ep.method} ${ep.path} returns 200`, async () => {
      const res = ep.method === 'GET'
        ? await get(ep.path)
        : await post(ep.path, ep.body!)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveProperty('id')
    }, TEST_TIMEOUT)
  }

  it('GET /docs serves swagger UI', async () => {
    const res = await get('/docs')
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('swagger')
  }, TEST_TIMEOUT)

  it('POST /manual_led rejects invalid RGB', async () => {
    const res = await post('/manual_led', { redValue: 999 })
    expect(res.status).toBe(400)
  }, TEST_TIMEOUT)

  it('POST /set_relay rejects missing relay', async () => {
    const res = await post('/set_relay', { set_relay: true })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  }, TEST_TIMEOUT)
})
