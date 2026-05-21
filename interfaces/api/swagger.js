const swaggerUi = require('swagger-ui-express');
const SwaggerParser = require('@apidevtools/swagger-parser');


/* ================= SWAGGER ================= */

function initSwagger(app) 
{
    try 
    {
        const bundled = await SwaggerParser.bundle(path.resolve(__dirname, '../../docs/swagger.yaml'));
        app.use('/docs', swaggerUi.serve, swaggerUi.setup(bundled));
        this.logger.info("✅ Swagger pronto su /docs");
    } 
    catch (err) 
    {
        this.logger.error("❌ Errore Swagger: " + err.message);
    }
}