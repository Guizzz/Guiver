const Link_manager = require("../utils/link_manager");
const { interfaceLogger } = require('../utils/logger');
const express = require('express');
const cors = require('cors');

const swaggerUi = require('swagger-ui-express');
const SwaggerParser = require('@apidevtools/swagger-parser');
const path = require('path');

class API_Server {   
    constructor() {
        this.logger = interfaceLogger("HTTP_API");

        this.link_manager = new Link_manager(
            "API_SERVER",
            "api_queue",
            (msg) => this.logger.debug(msg)
        );

        this.link_manager.start();
        this.link_manager.on("msg", this.update_value.bind(this));
        this.link_manager.on("channel_new", this._start.bind(this));

        this.app = express();
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));

        this._initSwagger(this.app);

        // ROUTES
        this.app.get('/help', this.help.bind(this));
        this.app.get('/get_weather', this.handle_weather.bind(this));
        this.app.get('/get_led_status', this.handle_led_status.bind(this));
        this.app.post('/manual_led', this.handle_led_req.bind(this));
        this.app.post('/set_rainbow', this.handle_set_rainbow.bind(this));
        this.app.post('/set_relay', this.handle_set_relay.bind(this));
        this.app.get('/get_water_pump_status', this.get_water_pump_status.bind(this));
        this.app.get('/get_water_pump_ambient_temp', this.get_water_pump_ambient_temp.bind(this));

        const port = process.env.API_PORT || 8080;
        this.app.listen(port, () =>
            this.logger.info("API Server started on " + port)
        );

        this.redValue = 0;
        this.greenValue = 0;
        this.blueValue = 0;
        this.last = null;
    }

    /* ================= SWAGGER ================= */

    async _initSwagger(app) {
        try {
            const bundled = await SwaggerParser.bundle(
                path.resolve(__dirname, '../docs/swagger.yaml')
            );

            app.use('/docs', swaggerUi.serve, swaggerUi.setup(bundled));

            this.logger.info("✅ Swagger pronto su /docs");
        } catch (err) {
            this.logger.error("❌ Errore Swagger: " + err.message);
        }
    }

    /* ================= CORE ================= */

    _start() {
        const j_msg = {
            type: "managment",
            command: "response_config",
            module: "API_SERVER",
            module_queue: "api_queue",
        };
        this.link_manager.to_core("core_queue", JSON.stringify(j_msg));
    }

    update_value(data) {
        this.last = data;
        data = JSON.parse(data);

        if (data.payload) {
            this.redValue = data.payload.redValue ?? this.redValue;
            this.greenValue = data.payload.greenValue ?? this.greenValue;
            this.blueValue = data.payload.blueValue ?? this.blueValue;
        }
    }

    waitForResponse(res) {
        const interval = setInterval(() => {
            if (!this.last) return;

            res.json(JSON.parse(this.last));
            this.last = null;
            clearInterval(interval);
        }, 10);
    }

    sendCommand(command) {
        this.link_manager.to_core("core_queue", JSON.stringify(command));
    }

    /* ================= ROUTES ================= */

    /**
     * @swagger
     * /get_weather:
     *   get:
     *     summary: Ottiene meteo
     */
    handle_weather(req, res) {
        this.sendCommand({ type: "request", command: "get_weather" });
        this.waitForResponse(res);
    }

    /**
     * @swagger
     * /get_led_status:
     *   get:
     *     summary: Stato LED
     */
    handle_led_status(req, res) {
        this.sendCommand({ type: "request", command: "led_status" });
        this.waitForResponse(res);
    }

    /**
     * @swagger
     * /manual_led:
     *   post:
     *     summary: Imposta LED manualmente
     */
    handle_led_req(req, res) {
        const { redValue = 0, greenValue = 0, blueValue = 0 } = req.body;

        const isValid = [redValue, greenValue, blueValue].every(
            v => Number.isInteger(v) && v >= 0 && v < 256
        );

        if (!isValid) {
            return res.status(400).send("Valori LED non validi (0-255)");
        }

        this.sendCommand({
            type: "request",
            command: "led_manual",
            payload: { redValue, greenValue, blueValue },
        });

        this.waitForResponse(res);
    }

    /**
     * @swagger
     * /set_rainbow:
     *   post:
     *     summary: Attiva/disattiva rainbow
     */
    handle_set_rainbow(req, res) {
        const cmd = req.body.run_rainbow
            ? {
                type: "request",
                command: "rainbow_start",
                payload: { time: 40, brightnes: 254 },
            }
            : {
                type: "request",
                command: "rainbow_stop",
            };

        this.sendCommand(cmd);
        this.waitForResponse(res);
    }

    /**
     * @swagger
     * /set_relay:
     *   post:
     *     summary: Controlla relay
     */
    handle_set_relay(req, res) {
        const { set_relay, relay } = req.body;

        this.sendCommand({
            type: "request",
            command: "set_relay",
            payload: { set_relay, relay },
        });

        this.waitForResponse(res);
    }

    handle_water(req, res, command) {
        this.sendCommand({ type: "request", command });
        this.waitForResponse(res);
    }

    get_water_pump_status(req, res) {
        this.handle_water(req, res, "get_water_pump_status");
    }

    get_water_pump_ambient_temp(req, res) {
        this.handle_water(req, res, "get_water_pump_ambient_temp");
    }

    help(req, res) {
        const routes = [];

        this.app._router.stack.forEach((middleware) => {
            if (middleware.route) {
                routes.push(middleware.route.path);
            }
        });

        res.json(routes);
    }
}

module.exports = API_Server;