import { describe, it, expect } from 'vitest'
import { API_URL, TEST_TIMEOUT } from './helpers'

async function get(path: string) {
  return fetch(`${API_URL}${path}`)
}

const endpoints = ['/get_weather', '/get_crypto_data']

describe('REST API', () => {
  it('server is reachable', async () => {
    const res = await fetch(API_URL)
    expect(res.status).toBe(404)
  }, TEST_TIMEOUT)

  for (const path of endpoints) {
    it(`GET ${path} returns 200`, async () => {
      const res = await get(path)
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

})
