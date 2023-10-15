# Changelog

## [0.19.2](https://github.com/Koenkk/zigbee-herdsman/compare/v0.19.1...v0.19.2) (2023-10-12)


### Bug Fixes

* Add queue for EZSP adapter ([#771](https://github.com/Koenkk/zigbee-herdsman/issues/771)) ([04b5ebd](https://github.com/Koenkk/zigbee-herdsman/commit/04b5ebd800d3284295cdaa755279d36088b23ce4))

## [0.19.1](https://github.com/Koenkk/zigbee-herdsman/compare/v0.19.0...v0.19.1) (2023-10-07)


### Bug Fixes

* **ignore:** Export ZclHeader type https://github.com/Koenkk/zigbee2mqtt/issues/19129 ([69fb9f1](https://github.com/Koenkk/zigbee-herdsman/commit/69fb9f10fce4ab58a2add71dc43da4250cfe3479))
* **ignore:** update dependencies ([#767](https://github.com/Koenkk/zigbee-herdsman/issues/767)) ([5507880](https://github.com/Koenkk/zigbee-herdsman/commit/5507880d332af8a36ffa1548ad44efc15b6f70a6))
* **ignore:** update dependencies ([#769](https://github.com/Koenkk/zigbee-herdsman/issues/769)) ([cb5dd54](https://github.com/Koenkk/zigbee-herdsman/commit/cb5dd54382359c3fbf73339fef5b72f2319a898c))

## [0.19.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.18.7...v0.19.0) (2023-09-17)


### Features

* Support mdns discovery for all adapter instead of just zstack ([#763](https://github.com/Koenkk/zigbee-herdsman/issues/763)) ([1a3edaf](https://github.com/Koenkk/zigbee-herdsman/commit/1a3edaf6b23618b2d1bc34ff9f74595162e430ea))


### Bug Fixes

* **ignore:** update dependencies ([#761](https://github.com/Koenkk/zigbee-herdsman/issues/761)) ([ec114df](https://github.com/Koenkk/zigbee-herdsman/commit/ec114df1f8f41a12e1913b58e0fb90ac9db3d547))

## [0.18.7](https://github.com/Koenkk/zigbee-herdsman/compare/v0.18.6...v0.18.7) (2023-09-04)


### Bug Fixes

* Expose `commandMcuVersionResponse` https://github.com/Koenkk/zigbee2mqtt/issues/17008 ([a75c8ef](https://github.com/Koenkk/zigbee-herdsman/commit/a75c8ef162078ba5b28417c01b29319c95c58aad))
* **ignore:** update dependencies ([#758](https://github.com/Koenkk/zigbee-herdsman/issues/758)) ([cafc26e](https://github.com/Koenkk/zigbee-herdsman/commit/cafc26e5410e9d38490ae11111c78ad6b153db1f))

## [0.18.6](https://github.com/Koenkk/zigbee-herdsman/compare/v0.18.5...v0.18.6) (2023-09-02)


### Bug Fixes

* Fix incorrect configured reporting cluster returned when cluster is manufacturer specific ([#756](https://github.com/Koenkk/zigbee-herdsman/issues/756)) ([09515bb](https://github.com/Koenkk/zigbee-herdsman/commit/09515bbe45fda9ad5d97792fbd31cc0f8f99c50e))

## [0.18.5](https://github.com/Koenkk/zigbee-herdsman/compare/v0.18.4...v0.18.5) (2023-09-01)


### Bug Fixes

* **ignore:** revert bff9d4d0d269dee199781777678a391b8e467569 ([#755](https://github.com/Koenkk/zigbee-herdsman/issues/755)) ([baaf235](https://github.com/Koenkk/zigbee-herdsman/commit/baaf235d97d0eca137674781fb60c2a88d7c6811))
* **ignore:** update dependencies ([#753](https://github.com/Koenkk/zigbee-herdsman/issues/753)) ([bd4e1c3](https://github.com/Koenkk/zigbee-herdsman/commit/bd4e1c3aacfe1d6fb5712fb16d7cccf11a78f747))

## [0.18.4](https://github.com/Koenkk/zigbee-herdsman/compare/v0.18.3...v0.18.4) (2023-08-25)


### Bug Fixes

* Fix adding backup missing devices to backup https://github.com/Koenkk/zigbee2mqtt/issues/18718 ([63cca97](https://github.com/Koenkk/zigbee-herdsman/commit/63cca97c6e33c4b786cccbfb7c71509952c8d0df))

## [0.18.3](https://github.com/Koenkk/zigbee-herdsman/compare/v0.18.2...v0.18.3) (2023-08-24)


### Bug Fixes

* Emit disconnect event when Zigate unplugged ([#749](https://github.com/Koenkk/zigbee-herdsman/issues/749)) ([79f3e38](https://github.com/Koenkk/zigbee-herdsman/commit/79f3e385ed5968d733d19695074432688784ee5f))
* Fix backup devices missing logging https://github.com/Koenkk/zigbee2mqtt/discussions/18706 ([9856d83](https://github.com/Koenkk/zigbee-herdsman/commit/9856d831ee39e4a942417132bea04fa9f2c1d4f9))
* Fix incorrect configured reporting cluster returned when cluster is manufacturer specific ([#748](https://github.com/Koenkk/zigbee-herdsman/issues/748)) ([bff9d4d](https://github.com/Koenkk/zigbee-herdsman/commit/bff9d4d0d269dee199781777678a391b8e467569))

## [0.18.2](https://github.com/Koenkk/zigbee-herdsman/compare/v0.18.1...v0.18.2) (2023-08-17)


### Bug Fixes

* Don't remove devices with linkkey from backup if they are still present in the database ([#746](https://github.com/Koenkk/zigbee-herdsman/issues/746)) ([3226a87](https://github.com/Koenkk/zigbee-herdsman/commit/3226a879a8ff9bdc0a9deb16bd55327e096c0849))

## [0.18.1](https://github.com/Koenkk/zigbee-herdsman/compare/v0.18.0...v0.18.1) (2023-08-15)


### Bug Fixes

* Fix some commands failing due to policy. https://github.com/Koenkk/zigbee2mqtt/issues/18382 ([#744](https://github.com/Koenkk/zigbee-herdsman/issues/744)) ([0e4b1cc](https://github.com/Koenkk/zigbee-herdsman/commit/0e4b1ccc35db7a3d8102dd99e5f24a5838086b3d))

## [0.18.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.17.3...v0.18.0) (2023-08-13)


### Features

* Support coordinator check ([#742](https://github.com/Koenkk/zigbee-herdsman/issues/742)) ([cb679f3](https://github.com/Koenkk/zigbee-herdsman/commit/cb679f3c64c7f411b4d22364bb363d69471db20a))

## [0.17.3](https://github.com/Koenkk/zigbee-herdsman/compare/v0.17.2...v0.17.3) (2023-08-08)


### Bug Fixes

* **ignore:** update dependencies ([#737](https://github.com/Koenkk/zigbee-herdsman/issues/737)) ([f5ccf1d](https://github.com/Koenkk/zigbee-herdsman/commit/f5ccf1d03a413e634b2deff94f0d907b9657cce1))

## [0.17.2](https://github.com/Koenkk/zigbee-herdsman/compare/v0.17.1...v0.17.2) (2023-07-11)


### Bug Fixes

* Fix incorrect bind cluster shown when cluster is manufacturer specific https://github.com/Koenkk/zigbee2mqtt/issues/10740 ([14cc282](https://github.com/Koenkk/zigbee-herdsman/commit/14cc28268a519c4147d805897ea16c9e6bdd874f))

## [0.17.1](https://github.com/Koenkk/zigbee-herdsman/compare/v0.17.0...v0.17.1) (2023-07-06)


### Bug Fixes

* Fix ping for devices which have genBasic on non first endpoint. https://github.com/Koenkk/zigbee2mqtt/issues/18121 ([9fbff6c](https://github.com/Koenkk/zigbee-herdsman/commit/9fbff6c7bbc63f0b43dac9f138d81bf4370aa31d))

## [0.17.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.16.0...v0.17.0) (2023-07-06)


### Features

* Support 16 bytes install codes for EZSP adapter ([#730](https://github.com/Koenkk/zigbee-herdsman/issues/730)) ([5ac2b71](https://github.com/Koenkk/zigbee-herdsman/commit/5ac2b713385724eaccabb765f0d6ddea650a7a9a))

## [0.16.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.15.3...v0.16.0) (2023-06-26)


### Features

* Remove EZSP queue to improve message throughput  ([#727](https://github.com/Koenkk/zigbee-herdsman/issues/727)) ([95c8795](https://github.com/Koenkk/zigbee-herdsman/commit/95c879586659c4dec891bbca852d4b53b8f1a1c2))

## [0.15.3](https://github.com/Koenkk/zigbee-herdsman/compare/v0.15.2...v0.15.3) (2023-06-25)


### Bug Fixes

* **ignore:** Fix Events.MessagePayload type. https://github.com/Koenkk/zigbee2mqtt/issues/18096 ([f662c7e](https://github.com/Koenkk/zigbee-herdsman/commit/f662c7eb75e2bd1a3b8ed180fe85574574ec9b0b))
* **ignore:** update dependencies ([#724](https://github.com/Koenkk/zigbee-herdsman/issues/724)) ([ffabf63](https://github.com/Koenkk/zigbee-herdsman/commit/ffabf63a1bb48f8b57788aa5a61cfb7749cd7d37))
* Set correct direction for default response. https://github.com/Koenkk/zigbee2mqtt/issues/18096 ([#726](https://github.com/Koenkk/zigbee-herdsman/issues/726)) ([abbdda4](https://github.com/Koenkk/zigbee-herdsman/commit/abbdda4508d35c675500675cf7aad8f56e66f697))

## [0.15.2](https://github.com/Koenkk/zigbee-herdsman/compare/v0.15.1...v0.15.2) (2023-06-22)


### Bug Fixes

* **ignore:** Fix EZSP group binding ([#722](https://github.com/Koenkk/zigbee-herdsman/issues/722)) ([7993e57](https://github.com/Koenkk/zigbee-herdsman/commit/7993e573f8f512db3c18f8e9def796feddc1b1d1))

## [0.15.1](https://github.com/Koenkk/zigbee-herdsman/compare/v0.15.0...v0.15.1) (2023-06-21)


### Bug Fixes

* Fix EZSP group binding ([#721](https://github.com/Koenkk/zigbee-herdsman/issues/721)) ([2977e42](https://github.com/Koenkk/zigbee-herdsman/commit/2977e4275b0e3cfab63c0976a492fe6a9161aeed))
* **ignore:** update dependencies ([#719](https://github.com/Koenkk/zigbee-herdsman/issues/719)) ([b8a1d71](https://github.com/Koenkk/zigbee-herdsman/commit/b8a1d713c7edd57e361a28e7f7d75dfe2a1bdd80))

## [0.15.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.14.117...v0.15.0) (2023-06-08)


### Features

* Improve request queue behavior ([#718](https://github.com/Koenkk/zigbee-herdsman/issues/718)) ([68cfe55](https://github.com/Koenkk/zigbee-herdsman/commit/68cfe554b7ca1d7d422f3392e915eeb916865f56))


### Bug Fixes

* **ignore:** update dependencies ([#715](https://github.com/Koenkk/zigbee-herdsman/issues/715)) ([d243577](https://github.com/Koenkk/zigbee-herdsman/commit/d243577c6a53d3adbb48672911883c56e782c6c2))

## [0.14.117](https://github.com/Koenkk/zigbee-herdsman/compare/v0.14.116...v0.14.117) (2023-05-23)


### Bug Fixes

* ci.yml ([f964ba1](https://github.com/Koenkk/zigbee-herdsman/commit/f964ba1743dbc184c84d923594a2894c54b0a059))

## [0.14.116](https://github.com/Koenkk/zigbee-herdsman/compare/v0.14.115...v0.14.116) (2023-05-23)


### Bug Fixes

* typo ([f9e4bf7](https://github.com/Koenkk/zigbee-herdsman/commit/f9e4bf704a254256a040f2ea09f16b9d2ebe3f09))
