import 'dotenv/config'

export const API_URL = `http://localhost:${process.env.API_PORT || 8080}`
export const WS_URL = `ws://127.0.0.1:${process.env.WSS_CLI_PORT || 8081}`
export const TEST_TIMEOUT = 10000
