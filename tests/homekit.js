const hap = require("hap-nodejs");

hap.init();

const uuid = hap.uuid.generate("test.light");
const accessory = new hap.Accessory("Test Light", uuid);

accessory.addService(hap.Service.Lightbulb)
  .getCharacteristic(hap.Characteristic.On)
  .on("set", (value, callback) => {
    console.log("Light:", value);
    callback();
  });

accessory.publish({
  username: "11:22:33:44:55:66",
  pincode: "031-45-154",
  port: 51826,
  category: hap.Categories.LIGHTBULB
});