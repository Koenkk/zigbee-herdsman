# zigbee-herdsman

![npm](https://img.shields.io/npm/v/zigbee-herdsman)

An open source ZigBee gateway solution with node.js, forked from zigbee-shepherd.

The goal is to refactor zigbee-shepherd to improve maintainability.


# API Documentation

* [Class Controller](docs/api/classes/_controller_controller_.controller.md)
* [Events emitted by Controller](docs/api/modules/_controller_events_.md)
* [Class Device](docs/api/classes/_controller_model_device_.device.md)
* [Class Endpoint](docs/api/classes/_controller_model_endpoint_.endpoint.md)
* [Class Group](docs/api/classes/_controller_model_group_.group.md)


# Changelog

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