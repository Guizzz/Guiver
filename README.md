# Guiver 🚀

**Guiver** is a Node.js backend application designed for managing leds, lightbulb and air conditioner using Raspberry Pi, with hardware interaction via GPIO pins using the `pigpio` library.

## Features ✨

- 🔧 **Create** and manage project environments.
- 🚦 **Control LEDs** connected to GPIO pins:
  - Red LED: GPIO 4
  - Green LED: GPIO 17
  - Blue LED: GPIO 18
- 📂 **Organize** projects and dependencies.
- 🔄 **Switch** between Node.js versions.

## Installation on Raspberry Pi 🛠️

1. Clone this repository to your Raspberry Pi.
2. Install the `pigpio` library by following [these instructions](https://abyz.me.uk/rpi/pigpio/download.html).
3. Run `npm install` to install Node.js dependencies.
4. Create a `.env` file in the project root with the following variables:

    ```plaintext
    WSS_CLI_PORT=
    WSS_MDL_PORT=
    API_PORT=
    WEATHER_KEY=
    RABBITMQ_IP=
    RABBITMQ_USR=
    RABBITMQ_PSW=
    ```
5. Start the application using `npm start`.

## Pinout Information 🖥️

For detailed information on Raspberry Pi GPIO pin mappings, visit [pinout.xyz](https://pinout.xyz/).

## Contributing 🤝

Contributions are welcome! Feel free to open issues or submit pull requests.

## License 📜

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
