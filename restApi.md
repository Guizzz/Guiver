# REST API Documentation

This document describes the REST APIs exposed by the Guiver.

## Available Endpoints

### 1. `GET /help`

* **Description:** Returns a list of all available API routes on the server.
* **HTTP Method:** `GET`
* **Input Parameters:** None.
* **Output:**
    * **Type:** Array of objects (likely JSON).
    * **Description:** An array containing information about the routes, including the path and supported HTTP methods for each route.
* **Example:**
    ```bash
    curl http://your_server_address:your_api_port/help
    ```

### 2. `GET /get_weather`

* **Description:** Requests current weather data. The server sends an internal command and waits for an asynchronous response.
* **HTTP Method:** `GET`
* **Input Parameters:** None.
* **Output:**
    * **Type:** JSON.
    * **Description:** The most recent response received internally by the system (`this.last`). The exact structure depends on the received message but is expected to be JSON.
* **Example:**
    ```bash
    curl http://your_server_address:your_api_port/get_weather
    ```

### 3. `GET /get_led_status`

* **Description:** Requests the current status of the LEDs. The server sends an internal command and waits for an asynchronous response.
* **HTTP Method:** `GET`
* **Input Parameters:** None.
* **Output:**
    * **Type:** JSON.
    * **Description:** The most recent response received internally by the system (`this.last`). The exact structure depends on the received message but is expected to be JSON. The `update_value` method suggests the output might contain `redValue`, `greenValue`, and `blueValue` properties within a payload.
* **Example:**
    ```bash
    curl http://your_server_address:your_api_port/get_led_status
    ```

### 4. `POST /manual_led`

* **Description:** Manually sets the color of the LEDs. The server sends an internal command with the specified values and waits for an asynchronous response.
* **HTTP Method:** `POST`
* **Input Parameters:**
    * **Type:** Query Parameters.
    * **Parameters:**
        * `redValue`: (Optional) Value for the red channel (0-255). Type: Integer.
        * `greenValue`: (Optional) Value for the green channel (0-255). Type: Integer.
        * `blueValue`: (Optional) Value for the blue channel (0-255). Type: Integer.
* **Output:**
    * **Type:** JSON or Error String.
    * **Description:** If parameters are valid, returns the most recent response received internally by the system (`this.last`), expected as JSON. If parameters are invalid (non-numeric or outside the 0-255 range), returns a descriptive error string.
* **Examples:**
    ```bash
    # Set LEDs to red
    curl -X POST "http://your_server_address:your_api_port/manual_led?redValue=255&greenValue=0&blueValue=0"
    ```
    ```bash
    # Set LEDs to a custom color
    curl -X POST "http://your_server_address:your_api_port/manual_led?redValue=50&greenValue=150&blueValue=200"
    ```
    ```bash
    # Example with invalid input (will return error)
    curl -X POST "http://your_server_address:your_api_port/manual_led?redValue=abc"
    ```

### 5. `POST /rainbow_start`

* **Description:** Starts a "rainbow" effect on the LEDs. The server sends an internal command with predefined parameters (time: 40, brightnes: 254) and waits for an asynchronous response.
* **HTTP Method:** `POST`
* **Input Parameters:** None (parameters for the internal command are fixed in the code).
* **Output:**
    * **Type:** JSON.
    * **Description:** The most recent response received internally by the system (`this.last`), expected as JSON.
* **Example:**
    ```bash
    curl -X POST http://your_server_address:your_api_port/rainbow_start
    ```

### 6. `POST /rainbow_stop`

* **Description:** Stops the "rainbow" effect on the LEDs. The server sends an internal command and waits for an asynchronous response.
* **HTTP Method:** `POST`
* **Input Parameters:** None.
* **Output:**
    * **Type:** JSON.
    * **Description:** The most recent response received internally by the system (`this.last`), expected as JSON.
* **Example:**
    ```bash
    curl -X POST http://your_server_address:your_api_port/rainbow_stop
    ```

### 7. `GET /get_water_pump_status`

* **Description:** Requests the current status of the water pump. The server sends an internal command and waits for an asynchronous response.
* **HTTP Method:** `GET`
* **Input Parameters:** None.
* **Output:**
    * **Type:** JSON.
    * **Description:** The most recent response received internally by the system (`this.last`), expected as JSON.
* **Example:**
    ```bash
    curl http://your_server_address:your_api_port/get_water_pump_status
    ```

### 8. `GET /get_water_pump_ambient_temp`

* **Description:** Requests the ambient temperature related to the water pump. The server sends an internal command and waits for an asynchronous response.
* **HTTP Method:** `GET`
* **Input Parameters:** None.
* **Output:**
    * **Type:** JSON.
    * **Description:** The most recent response received internally by the system (`this.last`), expected as JSON.
* **Example:**
    ```bash
    curl http://your_server_address:your_api_port/get_water_pump_ambient_temp
    ```

## General Notes

* Responses for endpoints requesting data (excluding `/help` and errors in `/manual_led`) depend on asynchronous messages received internally. The server briefly waits (`setInterval` with 10ms delay) for the first available message after sending the internal command and returns it.
* The exact structure of the response payload for endpoints other than `/manual_led` and `/get_led_status` is not fully defined by the provided code, but is expected to be JSON.
* Replace `your_server_address:your_api_port` with the actual address and port where your API server is running.
