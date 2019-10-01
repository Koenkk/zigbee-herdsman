# zigbee-herdsman
An open source ZigBee gateway solution with node.js, forked from zigbee-shepherd.

The goal is to refactor zigbee-shepherd to improve maintainability.

# 0.8.0 breaking changes
- Removed device.getEndpoints() -> use device.endpoints now
- Removed device/endpoint.set() -> directly set properties now (e.g. device.modelID = 'newmodelid')
- Removed device/endpoint.get() -> directly get properties now (e.g. device.modelID)
- Removed group.getMembers() -> use group.members now
- Removed endpoint.deviceIeeeAddress -> use endpoint.getDevice().ieeeAddr