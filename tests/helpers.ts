import 'dotenv/config'

const HOST = process.env.PI_HOST || 'localhost'
const API_PORT = HOST !== 'localhost'
  ? (process.env.PI_API_PORT || '8080')
  : (process.env.API_PORT || '8080')
const WS_PORT = HOST !== 'localhost'
  ? (process.env.PI_WS_PORT || '7777')
  : (process.env.WSS_CLI_PORT || '8081')
export const API_URL = `http://${HOST}:${API_PORT}`
export const WS_URL = `ws://${HOST}:${WS_PORT}`
export const TEST_TIMEOUT = 10000
