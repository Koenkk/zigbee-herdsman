# zigbee-herdsman

![npm](https://img.shields.io/npm/v/zigbee-herdsman)

zigbee-herdsman is an open source Zigbee gateway solution with Node.js JavaScript runtime back-end.

It was originally forked from zigbee-shepherd with the goal to refactor it to improve maintainability.

# API Documentation

For automatically generated API reference documentation, see: https://koenkk.github.io/zigbee-herdsman.

# Changelog

## 0.14.0 breaking changes

- `sendWhenActive` has been replaced with `sendWhen: 'active'`

## 0.13.0 breaking changes

- `controller.touchlinkFactoryReset` has been renamed to `controller.touchlinkFactoryResetFirst()`

## 0.12.0 breaking changes

- options.network.extenedPanID -> options.network.extendedPanID (typo fix)

## 0.11.0 breaking changes

- endpoint.bind[].cluster will now return cluster object instead of cluster number

## 0.10.0 breaking changes

- controller.start() renamed `resetted` start result to `reset`

## 0.9.0 breaking changes

- Removed controller.softReset() -> use controller.reset('soft') now
- Removed group.get('groupID') -> use group.groupID now

## 0.8.0 breaking changes

- Removed device.getEndpoints() -> use device.endpoints now
- Removed device/endpoint.set() -> directly set properties now (e.g. device.modelID = 'newmodelid')
- Removed device/endpoint.get() -> directly get properties now (e.g. device.modelID)
- Removed group.getMembers() -> use group.members now
- Removed endpoint.deviceIeeeAddress -> use endpoint.getDevice().ieeeAddr

# Related projects

## Zigbee2MQTT

[Zigbee2MQTT](https://github.com/Koenkk/zigbee2mqtt) is a Zigbee to MQTT gateway. It bridges events and allows you to control your Zigbee devices via MQTT. Allows you to use your Zigbee devices without the vendors or propritary and closed sources bridges or gateways. Zigbee2MQTT also keeps track of the state of the system and the capabilities of connected devices. It uses zigbee-herdsman and [zigbee-herdsman-converters](https://github.com/Koenkk/zigbee-herdsman-converters) as modules to handle low-level core Zigbee communication.

## ioBroker

[ioBroker](https://github.com/ioBroker) is an home automation integration platform that is focused on Building Automation, Smart Metering, Ambient Assisted Living, Process Automation, Visualization and Data Logging. It uses zigbee-herdsman for its Zigbee integration.
