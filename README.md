# zigbee-herdsman
An open source ZigBee gateway solution with node.js, forked from zigbee-shepherd.

The goal is to refactor zigbee-shepherd to improve maintainability.

### Todo
- [x] Setup Typescript environment
- [x] Refactor unpi
- [x] dissolve-chunks/concentrate -> types (+ refactor)
- [ ] cc-znp -> znp (+ refactor)
- [ ] Remove areq
- [ ] Refactor zcl-id
- [ ] Refactor zcl-packet
- [ ] Refactor lib (original source of zigbee-shepherd)
- [ ] Refactor zstack-constants
- [ ] What to do with ziee (remove?)
- [ ] What to do with zive (remove?)


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
TypeScript                      60           1484            364          10424
JSON                            12              0              0           4084
YAML                             2              0              0             10
-------------------------------------------------------------------------------
SUM:                            74           1484            364          14518
-------------------------------------------------------------------------------
```