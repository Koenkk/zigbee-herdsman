# zigbee-herdsman

![npm](https://img.shields.io/npm/v/zigbee-herdsman)

zigbee-herdsman is an open source Zigbee gateway solution with Node.js JavaScript runtime back-end.

It was originally forked from zigbee-shepherd with the goal to refactor it to improve maintainability.

# API Documentation

For automatically generated API reference documentation, see: https://koenkk.github.io/zigbee-herdsman.

# Changelog

For complete release notes, including breaking changes, see: [CHANGELOG.md](./CHANGELOG.md)

# Related projects

## Zigbee2MQTT

[Zigbee2MQTT](https://github.com/Koenkk/zigbee2mqtt) is a Zigbee to MQTT gateway. It bridges events and allows you to control your Zigbee devices via MQTT. Allows you to use your Zigbee devices without the vendors or propritary and closed sources bridges or gateways. Zigbee2MQTT also keeps track of the state of the system and the capabilities of connected devices. It uses zigbee-herdsman and [zigbee-herdsman-converters](https://github.com/Koenkk/zigbee-herdsman-converters) as modules to handle low-level core Zigbee communication.

## ioBroker

[ioBroker](https://github.com/ioBroker) is an home automation integration platform that is focused on Building Automation, Smart Metering, Ambient Assisted Living, Process Automation, Visualization and Data Logging. It uses zigbee-herdsman for its Zigbee integration.
