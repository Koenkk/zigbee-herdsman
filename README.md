# zigbee-herdsman
An open source ZigBee gateway solution with node.js, forked from zigbee-shepherd.

The goal is to refactor zigbee-shepherd to improve maintainability.

### Todo
- [x] Setup Typescript environment
- [x] Refactor unpi
- [x] dissolve-chunks/concentrate -> types (+ refactor)
- [x] cc-znp -> znp (+ refactor)
- [x] Refactor zstack-constants
- [x] zcl-id + zcl-packet -> zcl (+ refactor)
- [x] Cleanup zcl-packet (remove dissolve-chunks, concentrator depedency, deprecated/zcl-packet)
- [x] What to do with ziee (-> removed)
- [x] What to do with zive (-> removed)
- [x] What to do with areq (-> removed)
- [x] Refactor lib (original source of zigbee-shepherd)

2019-08-23: Refactoring is done, next up is:
- [ ] Integrate into zigbee2mqtt/zigbee-shepherd-controllers
- [ ] Write brief examples here and cleanup this README.md

### Start
```
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JSON                            14              0              0           9546
JavaScript                      50           1546            430           7675
YAML                             2              0              0             10
-------------------------------------------------------------------------------
SUM:                            66           1546            430          17231
-------------------------------------------------------------------------------
```

### Current
```
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
TypeScript                      69            751            153          11273
-------------------------------------------------------------------------------
SUM:                            69            751            153          11273
-------------------------------------------------------------------------------
```
