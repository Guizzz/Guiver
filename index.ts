import 'dotenv/config'
import fs from 'fs'
import process from 'process'
import { API_Server } from './interfaces/api/api_server'

interface ModuleConfig {
    path: string
    config?: any
    value?: any
}

interface InterfaceConfig {
    path: string
    value?: any
}

const modules: Record<string, ModuleConfig> = JSON.parse(fs.readFileSync('conf/modules_config.json', 'utf8'))
const interfaces: Record<string, InterfaceConfig> = JSON.parse(fs.readFileSync('conf/interfaces_config.json', 'utf8'))

if (!modules.hasOwnProperty('core')) 
{
    console.log('ERROR: Missing core config!')
    console.log('Shutting down...')
    process.exit(1)
}

const blackList: string[] = ['homekit_server']

for (const mod in modules) 
{
    if (blackList.includes(mod)) 
    {
        console.log('Ignoring: ' + mod)
        continue
    }

    const NewModule = require(modules[mod].path)

    if (modules[mod].hasOwnProperty('config')) 
    {
        modules[mod].value = new NewModule(modules[mod].config)
    } 
    else 
    {
        modules[mod].value = new NewModule()
    }
}


const NewInt = new API_Server()

for (const intf in interfaces) 
{
    if (blackList.includes(intf)) {
        console.log('Ignoring: ' + intf)
        continue
    }

    const NewInt = require(interfaces[intf].path)

    interfaces[intf].value = new NewInt()
}