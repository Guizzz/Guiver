import express from 'express'
import path from 'path';

const swaggerUi = require('swagger-ui-express');
const SwaggerParser = require('@apidevtools/swagger-parser');


export async function initSwagger(app: express.Express) 
{
    try 
    {
        const bundled = await SwaggerParser.bundle(path.resolve(__dirname, '../../docs/swagger.yaml'));
        app.use('/docs', swaggerUi.serve, swaggerUi.setup(bundled));
        console.log("✅ Swagger pronto su /docs");
    } 
    catch (err)
    {
        if (err instanceof Error)
        {
            console.log('❌ Errore Swagger: ' + err.message);
        }
        else
        {
            console.log('❌ Errore Swagger sconosciuto');
        }
    }
}