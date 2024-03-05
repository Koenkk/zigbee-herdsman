# Changelog

## [0.36.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.35.3...v0.36.0) (2024-03-05)


### Features

* EZSP: Network restore from backup ([#950](https://github.com/Koenkk/zigbee-herdsman/issues/950)) ([1260ff1](https://github.com/Koenkk/zigbee-herdsman/commit/1260ff16e1c4f805480dd444f04afc4959d71a4e))


### Bug Fixes

* Ember: comments/logging cleanups. ([#952](https://github.com/Koenkk/zigbee-herdsman/issues/952)) ([52a0ff2](https://github.com/Koenkk/zigbee-herdsman/commit/52a0ff2a5e98699535c812a3cfd68ac7b0ea3b40))

## [0.35.3](https://github.com/Koenkk/zigbee-herdsman/compare/v0.35.2...v0.35.3) (2024-03-04)


### Bug Fixes

* Cleanup SerialPort async wrappers ([#949](https://github.com/Koenkk/zigbee-herdsman/issues/949)) ([cbd68df](https://github.com/Koenkk/zigbee-herdsman/commit/cbd68dfc3c195ae2158a06277497714e7252924e))
* Ember: Drastically lower default requests & callbacks processing delay & use existing setting for customization. ([#951](https://github.com/Koenkk/zigbee-herdsman/issues/951)) ([810266a](https://github.com/Koenkk/zigbee-herdsman/commit/810266a34c00c4c44d27ee51c4dfc10dd7f38649))
* **ignore:** update dependencies ([#947](https://github.com/Koenkk/zigbee-herdsman/issues/947)) ([795c944](https://github.com/Koenkk/zigbee-herdsman/commit/795c9446783e7ecd06a1d03e912e09a9e5b01228))

## [0.35.2](https://github.com/Koenkk/zigbee-herdsman/compare/v0.35.1...v0.35.2) (2024-03-02)


### Bug Fixes

* Ember: skip port re-init on reset retry ([#945](https://github.com/Koenkk/zigbee-herdsman/issues/945)) ([2a3a98b](https://github.com/Koenkk/zigbee-herdsman/commit/2a3a98beea9b3314dbb5fd976e3a6234b2bb264e))

## [0.35.1](https://github.com/Koenkk/zigbee-herdsman/compare/v0.35.0...v0.35.1) (2024-03-01)


### Bug Fixes

* Refactor names to follow convention in SchneiderSwitch cluster ([#942](https://github.com/Koenkk/zigbee-herdsman/issues/942)) ([91190b2](https://github.com/Koenkk/zigbee-herdsman/commit/91190b2c42f6738e326221f5e10348561df84864))

## [0.35.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.34.9...v0.35.0) (2024-02-29)


### Features

* Add manuSpecificSchneiderFanSwitchConfiguration ([#937](https://github.com/Koenkk/zigbee-herdsman/issues/937)) ([adcfd61](https://github.com/Koenkk/zigbee-herdsman/commit/adcfd61699833ac1aba9ffde62e441a11ac5e60c))

## [0.34.9](https://github.com/Koenkk/zigbee-herdsman/compare/v0.34.8...v0.34.9) (2024-02-27)


### Bug Fixes

* EZSP: fix pairing via routers not possible ([#938](https://github.com/Koenkk/zigbee-herdsman/issues/938)) ([b004cf8](https://github.com/Koenkk/zigbee-herdsman/commit/b004cf827da04eb78e7658776bd2726289797b16))

## [0.34.8](https://github.com/Koenkk/zigbee-herdsman/compare/v0.34.7...v0.34.8) (2024-02-26)


### Bug Fixes

* Ember: port init/close logic cleanup. ([#935](https://github.com/Koenkk/zigbee-herdsman/issues/935)) ([c11d356](https://github.com/Koenkk/zigbee-herdsman/commit/c11d356f618a65aa4ba1a8df35ab5d238ba20029))

## [0.34.7](https://github.com/Koenkk/zigbee-herdsman/compare/v0.34.6...v0.34.7) (2024-02-25)


### Bug Fixes

* Ember: reworked errors in ASH protocol ([#932](https://github.com/Koenkk/zigbee-herdsman/issues/932)) ([bf070cd](https://github.com/Koenkk/zigbee-herdsman/commit/bf070cd7614cbe16900d387901848e16aa62136b))

## [0.34.6](https://github.com/Koenkk/zigbee-herdsman/compare/v0.34.5...v0.34.6) (2024-02-25)


### Bug Fixes

* **ignore:** Add `DISABLE_TUYA_DEFAULT_RESPONSE` option ([c6ff266](https://github.com/Koenkk/zigbee-herdsman/commit/c6ff266f66c47d6b46745040eaaa973cd7a84407))
* **ignore:** Remove DISABLE_ASSOC_GET ([4ed739b](https://github.com/Koenkk/zigbee-herdsman/commit/4ed739bc1a45d58207607feeb06fb1f3d530a1e5))

## [0.34.5](https://github.com/Koenkk/zigbee-herdsman/compare/v0.34.4...v0.34.5) (2024-02-25)


### Bug Fixes

* Ember: fixed OTA response matching ([#928](https://github.com/Koenkk/zigbee-herdsman/issues/928)) ([01dbe18](https://github.com/Koenkk/zigbee-herdsman/commit/01dbe1868537e3637c16682d587f8d37871ab739))
* **ignore:** update dependencies ([#929](https://github.com/Koenkk/zigbee-herdsman/issues/929)) ([7e99154](https://github.com/Koenkk/zigbee-herdsman/commit/7e99154e0c592d4dcbe9d17bc6b87eb0952088f3))

## [0.34.4](https://github.com/Koenkk/zigbee-herdsman/compare/v0.34.3...v0.34.4) (2024-02-23)


### Bug Fixes

* Ember: Fix install code CRC validation. ([#926](https://github.com/Koenkk/zigbee-herdsman/issues/926)) ([79478eb](https://github.com/Koenkk/zigbee-herdsman/commit/79478ebbeee8190c4b7ff1541a9ab29a0965227a))

## [0.34.3](https://github.com/Koenkk/zigbee-herdsman/compare/v0.34.2...v0.34.3) (2024-02-22)


### Bug Fixes

* Ember: improve errors & checks + GreenPower support ([#924](https://github.com/Koenkk/zigbee-herdsman/issues/924)) ([9aa1aa6](https://github.com/Koenkk/zigbee-herdsman/commit/9aa1aa6bf10ebbbeae3016edcc5bfeb8699c87cb))

## [0.34.2](https://github.com/Koenkk/zigbee-herdsman/compare/v0.34.1...v0.34.2) (2024-02-19)


### Bug Fixes

* EZSP adapter fixes ([#921](https://github.com/Koenkk/zigbee-herdsman/issues/921)) ([6bb05c7](https://github.com/Koenkk/zigbee-herdsman/commit/6bb05c7a098812600df1b74c93142852962639f4))

## [0.34.1](https://github.com/Koenkk/zigbee-herdsman/compare/v0.34.0...v0.34.1) (2024-02-18)


### Bug Fixes

* **ignore:** temp fix for broken test ([4e6ee7a](https://github.com/Koenkk/zigbee-herdsman/commit/4e6ee7af191e32f48e3a4be501ab683c9b685b4c))

## [0.34.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.33.9...v0.34.0) (2024-02-18)


### Features

* Add new `ember` adapter implementation, targeting EZSP 13 and above ([#918](https://github.com/Koenkk/zigbee-herdsman/issues/918)) ([c36d051](https://github.com/Koenkk/zigbee-herdsman/commit/c36d051e0a0e20654ff716b17cde783e5b3a4989))


### Bug Fixes

* EZSP: Some refactoring of UART level and packet processing. ([#916](https://github.com/Koenkk/zigbee-herdsman/issues/916)) ([e397e38](https://github.com/Koenkk/zigbee-herdsman/commit/e397e38849ff937acbf0aef9da69fa51ac3f0f7b))
* **ignore:** update dependencies ([#917](https://github.com/Koenkk/zigbee-herdsman/issues/917)) ([e164b9c](https://github.com/Koenkk/zigbee-herdsman/commit/e164b9ce0b28fb95d67a1d9f2df06c057568cfc2))

## [0.33.9](https://github.com/Koenkk/zigbee-herdsman/compare/v0.33.8...v0.33.9) (2024-02-13)


### Bug Fixes

* Add 2 new attributes to manuSpecificSinope ([#912](https://github.com/Koenkk/zigbee-herdsman/issues/912)) ([3325997](https://github.com/Koenkk/zigbee-herdsman/commit/3325997da3afa94c2dd500b808c1261ba0a8abf8))
* Add more attributes to clipsalWiserSwitchConfigurationClusterServer ([#915](https://github.com/Koenkk/zigbee-herdsman/issues/915)) ([472bce9](https://github.com/Koenkk/zigbee-herdsman/commit/472bce952e7db1d4b29ffbec0ab536bbc2462198))
* **ignore:** update dependencies ([#914](https://github.com/Koenkk/zigbee-herdsman/issues/914)) ([fc19b3d](https://github.com/Koenkk/zigbee-herdsman/commit/fc19b3dc8250184645528cd312fd8de5d390d237))
* Revert Deconz changes of https://github.com/Koenkk/zigbee-herdsman/pull/859 in an attempt to fix https://github.com/Koenkk/zigbee2mqtt/issues/21162 ([818f2cc](https://github.com/Koenkk/zigbee-herdsman/commit/818f2cc4c28af2a57a615b0ec9ac84bfb98e7d1c))

## [0.33.8](https://github.com/Koenkk/zigbee-herdsman/compare/v0.33.7...v0.33.8) (2024-02-04)


### Bug Fixes

* **ignore:** update dependencies ([#908](https://github.com/Koenkk/zigbee-herdsman/issues/908)) ([43f6ab7](https://github.com/Koenkk/zigbee-herdsman/commit/43f6ab7338ceceaee1dc8c6a4f6a1919e3bcbfd2))
* Remove manufaturer code from StelproOutdoorTemp https://github.com/Koenkk/zigbee2mqtt/issues/21152 ([18af8be](https://github.com/Koenkk/zigbee-herdsman/commit/18af8beeff91911784a3c0aca12c0efa225a6adb))

## [0.33.7](https://github.com/Koenkk/zigbee-herdsman/compare/v0.33.6...v0.33.7) (2024-02-02)


### Bug Fixes

* **ignore:** fix 5c242c87f31878ea6297441655beb839834bcfc7 ([b733c80](https://github.com/Koenkk/zigbee-herdsman/commit/b733c80de0b2a8d5702ab56480d2d2d0fe1033b8))

## [0.33.6](https://github.com/Koenkk/zigbee-herdsman/compare/v0.33.5...v0.33.6) (2024-02-02)


### Bug Fixes

* **ignore:** Add `boschOutdoorSiren` command ([#900](https://github.com/Koenkk/zigbee-herdsman/issues/900)) ([5bb789a](https://github.com/Koenkk/zigbee-herdsman/commit/5bb789a635b973d08a063066364addcb11dc6aee))
* **ignore:** Allow to disable assoc get ([5c242c8](https://github.com/Koenkk/zigbee-herdsman/commit/5c242c87f31878ea6297441655beb839834bcfc7))

## [0.33.5](https://github.com/Koenkk/zigbee-herdsman/compare/v0.33.4...v0.33.5) (2024-01-30)


### Bug Fixes

* EZSP: Enable software flow control only if RTS/CTS not enabled. ([#897](https://github.com/Koenkk/zigbee-herdsman/issues/897)) ([a0f2ce9](https://github.com/Koenkk/zigbee-herdsman/commit/a0f2ce97ddf1d71b7d404741e0881fb0ba5dac68))
* **ignore:** Replace aqaraOpple cluster name with manuSpecificLumi ([#892](https://github.com/Koenkk/zigbee-herdsman/issues/892)) ([c887b15](https://github.com/Koenkk/zigbee-herdsman/commit/c887b15ba23a46aee765b383ebc946b8e8401365))

## [0.33.4](https://github.com/Koenkk/zigbee-herdsman/compare/v0.33.3...v0.33.4) (2024-01-29)


### Bug Fixes

* EZSP: cleaned up awaits ([#894](https://github.com/Koenkk/zigbee-herdsman/issues/894)) ([d2d27d7](https://github.com/Koenkk/zigbee-herdsman/commit/d2d27d73b01babc8bc3d9db7edbae9ee9604c6c6))

## [0.33.3](https://github.com/Koenkk/zigbee-herdsman/compare/v0.33.2...v0.33.3) (2024-01-28)


### Bug Fixes

* Remove IKEA specific pm25 measuredValue attribute ([#890](https://github.com/Koenkk/zigbee-herdsman/issues/890)) ([e8387ff](https://github.com/Koenkk/zigbee-herdsman/commit/e8387fff9a3e3297511656318a1737e296ca2f03))
* Some more backup support for EZSP 13+ ([#888](https://github.com/Koenkk/zigbee-herdsman/issues/888)) ([9b6c04b](https://github.com/Koenkk/zigbee-herdsman/commit/9b6c04b2a3cb77ab309e6e87a96ea155894b36c0))

## [0.33.2](https://github.com/Koenkk/zigbee-herdsman/compare/v0.33.1...v0.33.2) (2024-01-24)


### Bug Fixes

* EZSP: Fix socket error handling & serial/socket reset/close logic ([#886](https://github.com/Koenkk/zigbee-herdsman/issues/886)) ([43b02ee](https://github.com/Koenkk/zigbee-herdsman/commit/43b02eeca3fbfb6cc55f17cf6f27a2483c3c3d86))

## [0.33.1](https://github.com/Koenkk/zigbee-herdsman/compare/v0.33.0...v0.33.1) (2024-01-23)


### Bug Fixes

* EZSP: Added base for `incomingNetworkStatusHandler` ([#883](https://github.com/Koenkk/zigbee-herdsman/issues/883)) ([0b16f1b](https://github.com/Koenkk/zigbee-herdsman/commit/0b16f1ba1ed441c65c65ec6165158de054107ffc))
* EZSP: Cleanup asserts & fix unsupported configs. ([#885](https://github.com/Koenkk/zigbee-herdsman/issues/885)) ([2a2b3d0](https://github.com/Koenkk/zigbee-herdsman/commit/2a2b3d06a52e1abef66791764e42fdd424d75886))

## [0.33.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.32.7...v0.33.0) (2024-01-21)


### Features

* **ignore:** Update Inovelli cluster definition with new parameters for updated VZM35 firmware ([#881](https://github.com/Koenkk/zigbee-herdsman/issues/881)) ([3c69f6b](https://github.com/Koenkk/zigbee-herdsman/commit/3c69f6bdbf61077d357063ee6e4a1b9f840cb562))


### Bug Fixes

* **ignore:** update dependencies ([#882](https://github.com/Koenkk/zigbee-herdsman/issues/882)) ([78aa3e8](https://github.com/Koenkk/zigbee-herdsman/commit/78aa3e8c0086e82d0df360b10f0031a0b0b0f99a))
* Remove deprecated `options.sendWhen` ([#879](https://github.com/Koenkk/zigbee-herdsman/issues/879)) ([2d3a5d1](https://github.com/Koenkk/zigbee-herdsman/commit/2d3a5d1d25f45360e253946d26f4e8b95ea75e26))

## [0.32.7](https://github.com/Koenkk/zigbee-herdsman/compare/v0.32.6...v0.32.7) (2024-01-19)


### Bug Fixes

* Fix invalid GP frame crashing EZSP adapter https://github.com/Koenkk/zigbee2mqtt/issues/20838 ([f7ef707](https://github.com/Koenkk/zigbee-herdsman/commit/f7ef70768264f495ce7f45782130c9f9103c659a))

## [0.32.6](https://github.com/Koenkk/zigbee-herdsman/compare/v0.32.5...v0.32.6) (2024-01-16)


### Bug Fixes

* Fix debug logging ([#876](https://github.com/Koenkk/zigbee-herdsman/issues/876)) ([99bc922](https://github.com/Koenkk/zigbee-herdsman/commit/99bc922b88524009521a7c8f3a8af88b37e3c702))

## [0.32.5](https://github.com/Koenkk/zigbee-herdsman/compare/v0.32.4...v0.32.5) (2024-01-15)


### Bug Fixes

* Fixes & general cleanup in EZSP codebase ([#874](https://github.com/Koenkk/zigbee-herdsman/issues/874)) ([39bc90a](https://github.com/Koenkk/zigbee-herdsman/commit/39bc90a580aec8f5715fde5806827bb17409167a))

## [0.32.4](https://github.com/Koenkk/zigbee-herdsman/compare/v0.32.3...v0.32.4) (2024-01-13)


### Bug Fixes

* EZSP: Implemented several attempts to send a request in case of problems ([#871](https://github.com/Koenkk/zigbee-herdsman/issues/871)) ([41a4543](https://github.com/Koenkk/zigbee-herdsman/commit/41a45432b0c261487c548ccdfac03fcaecfa51e1))
* **ignore:** update dependencies ([#873](https://github.com/Koenkk/zigbee-herdsman/issues/873)) ([f794563](https://github.com/Koenkk/zigbee-herdsman/commit/f79456385ce3ab6c63c96d093ac170afe0948a19))
* Improve EZSP connect logic ([#869](https://github.com/Koenkk/zigbee-herdsman/issues/869)) ([a02a8e1](https://github.com/Koenkk/zigbee-herdsman/commit/a02a8e1efb4395b116be5bf14e79393eeca6627e))

## [0.32.3](https://github.com/Koenkk/zigbee-herdsman/compare/v0.32.2...v0.32.3) (2024-01-11)


### Bug Fixes

* Add setter for checkinInterval ([#867](https://github.com/Koenkk/zigbee-herdsman/issues/867)) ([87c0c50](https://github.com/Koenkk/zigbee-herdsman/commit/87c0c5020ea1db00d476e9a59b0475ea51f479d5))

## [0.32.2](https://github.com/Koenkk/zigbee-herdsman/compare/v0.32.1...v0.32.2) (2024-01-10)


### Bug Fixes

* Add bosch smoke alarm II ssiasZone command ([#861](https://github.com/Koenkk/zigbee-herdsman/issues/861)) ([48680fa](https://github.com/Koenkk/zigbee-herdsman/commit/48680fa0b24be74eb03fc314093a016d6deac1e6))
* Add OWON PC321 Power factor attributes ([#864](https://github.com/Koenkk/zigbee-herdsman/issues/864)) ([0d60b75](https://github.com/Koenkk/zigbee-herdsman/commit/0d60b75a482fc8d8d7b1c9cce188adb14640787b))

## [0.32.1](https://github.com/Koenkk/zigbee-herdsman/compare/v0.32.0...v0.32.1) (2024-01-09)


### Bug Fixes

* Improve request queue behavior [#6](https://github.com/Koenkk/zigbee-herdsman/issues/6) ([#860](https://github.com/Koenkk/zigbee-herdsman/issues/860)) ([746fafb](https://github.com/Koenkk/zigbee-herdsman/commit/746fafbea9f28829feba300a9de9f1261c2c1e36))
* Improve serialport code consistency across adapters ([#859](https://github.com/Koenkk/zigbee-herdsman/issues/859)) ([0d636fc](https://github.com/Koenkk/zigbee-herdsman/commit/0d636fc299444777ece86a337707570cc5e48cc7))

## [0.32.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.31.0...v0.32.0) (2024-01-08)


### Features

* Support EZSP 13 (gecko 4.4.0, ncp 7.4.0.0) ([#858](https://github.com/Koenkk/zigbee-herdsman/issues/858)) ([460910c](https://github.com/Koenkk/zigbee-herdsman/commit/460910c2a6528d37b181ef51c74bd6dfa964a591))

## [0.31.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.30.0...v0.31.0) (2024-01-07)


### Features

* Use cluster definition manufacturerCode when available ([#848](https://github.com/Koenkk/zigbee-herdsman/issues/848)) ([3b51b0b](https://github.com/Koenkk/zigbee-herdsman/commit/3b51b0b3ffe4471e4de505ddebd665014acf2cd9))


### Bug Fixes

* Catch more unhandled promise rejections for EZSP adapter ([#853](https://github.com/Koenkk/zigbee-herdsman/issues/853)) ([33fa223](https://github.com/Koenkk/zigbee-herdsman/commit/33fa223e19dfbd4094c3179dd70bd3499359bd29))
* **ignore:** update dependencies ([#855](https://github.com/Koenkk/zigbee-herdsman/issues/855)) ([618d522](https://github.com/Koenkk/zigbee-herdsman/commit/618d5223a575ddea4415a63ebb3deff92eef4070))

## [0.30.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.29.1...v0.30.0) (2024-01-01)


### Features

* Add manuSpecificBosch10 Cluster for BMCT-SLZ ([#849](https://github.com/Koenkk/zigbee-herdsman/issues/849)) ([7dcead9](https://github.com/Koenkk/zigbee-herdsman/commit/7dcead952d455c39f3274451fd74d361858c485d))


### Bug Fixes

* **ignore:** update dependencies ([#850](https://github.com/Koenkk/zigbee-herdsman/issues/850)) ([9048750](https://github.com/Koenkk/zigbee-herdsman/commit/9048750f7ba861396994d22f6e569fe8189fe0c6))

## [0.29.1](https://github.com/Koenkk/zigbee-herdsman/compare/v0.29.0...v0.29.1) (2023-12-27)


### Bug Fixes

* **ignore:** Revert module to commonjs ([7d14fff](https://github.com/Koenkk/zigbee-herdsman/commit/7d14fff1e45f7ccd99369fe606c57563b641e06c))

## [0.29.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.28.0...v0.29.0) (2023-12-27)


### Features

* **ignore:** Add Amazon Work With All Hubs cluster ([#839](https://github.com/Koenkk/zigbee-herdsman/issues/839)) ([854fd12](https://github.com/Koenkk/zigbee-herdsman/commit/854fd12c08ea9dea97e4a05d2de22ef5419a7dfe))


### Bug Fixes

* Add breezemode to Inovelli Cluster ([#842](https://github.com/Koenkk/zigbee-herdsman/issues/842)) ([64273b7](https://github.com/Koenkk/zigbee-herdsman/commit/64273b755122ea76120a446717a579cab0118aa2))
* Fix EZSP initialisation check ([#841](https://github.com/Koenkk/zigbee-herdsman/issues/841)) ([93cc97f](https://github.com/Koenkk/zigbee-herdsman/commit/93cc97f3f0591ac0bbbbbad6b76ae10e6cefb9a8))
* Fix wrong manufacturer code when configuring reporting for manufacturer specific attribute ([#844](https://github.com/Koenkk/zigbee-herdsman/issues/844)) ([9951d44](https://github.com/Koenkk/zigbee-herdsman/commit/9951d44af24023ea339e159e6f86c942543b8546))
* **ignore:** update dependencies ([#845](https://github.com/Koenkk/zigbee-herdsman/issues/845)) ([9d122f3](https://github.com/Koenkk/zigbee-herdsman/commit/9d122f3a531f6487f4e7f3b737ebf70549ded5c0))
* **ignore:** Update tsconfig and fix 599b3e96afe9ace3cb0231ff069fc3ff70e43b2e ([c4f9bf4](https://github.com/Koenkk/zigbee-herdsman/commit/c4f9bf4ae5385ede9718ed09066e2450222d5aef))

## [0.28.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.27.1...v0.28.0) (2023-12-23)


### Features

* **ignore:** Add valve calibration command for Bosch BTH-RA ([#836](https://github.com/Koenkk/zigbee-herdsman/issues/836)) ([7a9b0fb](https://github.com/Koenkk/zigbee-herdsman/commit/7a9b0fb9eb481be8a0598c8b26bd561007c8480b))
* **ignore:** zcl: update ubisys hvacThermostat custom attributes ([#835](https://github.com/Koenkk/zigbee-herdsman/issues/835)) ([ef198ee](https://github.com/Koenkk/zigbee-herdsman/commit/ef198ee48ec953180075eabadd8c5d7bc79ce69f))


### Bug Fixes

* **ignore:** update dependencies ([#838](https://github.com/Koenkk/zigbee-herdsman/issues/838)) ([d1a72b9](https://github.com/Koenkk/zigbee-herdsman/commit/d1a72b932ecf4208112c8c35d73c6ff0e7b8c48b))

## [0.27.1](https://github.com/Koenkk/zigbee-herdsman/compare/v0.27.0...v0.27.1) (2023-12-17)


### Bug Fixes

* **ignore:** Remove zigate %h formatter ([28b0821](https://github.com/Koenkk/zigbee-herdsman/commit/28b0821299ec40363f738412f72b45b598c61c35))

## [0.27.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.26.1...v0.27.0) (2023-12-17)


### Features

* **ignore:** add displayUnit and airQuality attributes to aqaraOpple cluster ([#829](https://github.com/Koenkk/zigbee-herdsman/issues/829)) ([65ef3db](https://github.com/Koenkk/zigbee-herdsman/commit/65ef3dbb763d79f61d10e80b18b99c3a0e423f2a))


### Bug Fixes

* Fix devices disappearing with zStack adapter when rejoining the network ([#830](https://github.com/Koenkk/zigbee-herdsman/issues/830)) ([fe8ebb7](https://github.com/Koenkk/zigbee-herdsman/commit/fe8ebb78f47f03d1506fdedba34821e1c8c7e5d8))

## [0.26.1](https://github.com/Koenkk/zigbee-herdsman/compare/v0.26.0...v0.26.1) (2023-12-10)


### Bug Fixes

* Extend `manuSpecificInovelli` cluster ([#824](https://github.com/Koenkk/zigbee-herdsman/issues/824)) ([435ed7a](https://github.com/Koenkk/zigbee-herdsman/commit/435ed7a5a0f1e45fbc4ecbc3882772e5d10ed2a9))
* **ignore:** Cleanup request queue ([#826](https://github.com/Koenkk/zigbee-herdsman/issues/826)) ([db1545b](https://github.com/Koenkk/zigbee-herdsman/commit/db1545b1170bf74c3fa9624807e233e863b844b1))

## [0.26.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.25.3...v0.26.0) (2023-12-07)


### Features

* Add `manuSpecificBosch9` cluster ([#820](https://github.com/Koenkk/zigbee-herdsman/issues/820)) ([4915931](https://github.com/Koenkk/zigbee-herdsman/commit/4915931097fc482b44af37c7fd55e854ae68f938))

## [0.25.3](https://github.com/Koenkk/zigbee-herdsman/compare/v0.25.2...v0.25.3) (2023-12-04)


### Bug Fixes

* Add `action6` to `tradfriButton` cluster https://github.com/Koenkk/zigbee2mqtt/discussions/20003 ([54adbb3](https://github.com/Koenkk/zigbee-herdsman/commit/54adbb3a7b89112b5ce22f2f6ac8fda04e728eec))
* Improve request queue behaviour ([#817](https://github.com/Koenkk/zigbee-herdsman/issues/817)) ([1051d9d](https://github.com/Koenkk/zigbee-herdsman/commit/1051d9dd31364d9cccc2d011f9eac5a1642728db))

## [0.25.2](https://github.com/Koenkk/zigbee-herdsman/compare/v0.25.1...v0.25.2) (2023-12-03)


### Bug Fixes

* Fix duplicate configured reportings https://github.com/Koenkk/zigbee2mqtt/issues/19317 ([59c1bbe](https://github.com/Koenkk/zigbee-herdsman/commit/59c1bbe2d090403c0443f97d4fba3e644b1121f3))
* **ignore:** update dependencies ([#815](https://github.com/Koenkk/zigbee-herdsman/issues/815)) ([e346986](https://github.com/Koenkk/zigbee-herdsman/commit/e3469860de19cd9b3e34be0c7374db3bba88146d))

## [0.25.1](https://github.com/Koenkk/zigbee-herdsman/compare/v0.25.0...v0.25.1) (2023-12-02)


### Bug Fixes

* Rename manuSpecificNodOnFilPilote to manuSpecificNodOnPilotWire ([#812](https://github.com/Koenkk/zigbee-herdsman/issues/812)) ([9f5aabc](https://github.com/Koenkk/zigbee-herdsman/commit/9f5aabc909770ea29102338eb29c51354ce0001a))

## [0.25.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.24.0...v0.25.0) (2023-11-30)


### Features

* Add `tradfriButton` cluster https://github.com/Koenkk/zigbee-herdsman-converters/pull/6574 ([6e454d8](https://github.com/Koenkk/zigbee-herdsman/commit/6e454d86823d5c0c47c454a71a96f1062e4f077c))

## [0.24.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.23.0...v0.24.0) (2023-11-30)


### Features

* Add tunnel cluter ([#806](https://github.com/Koenkk/zigbee-herdsman/issues/806)) ([e4d8cbe](https://github.com/Koenkk/zigbee-herdsman/commit/e4d8cbec7500e060af8d93b2361fcff3431e0237))


### Bug Fixes

* Fix some types ([#810](https://github.com/Koenkk/zigbee-herdsman/issues/810)) ([694a1fc](https://github.com/Koenkk/zigbee-herdsman/commit/694a1fc6bb164408535fa10a2e6a3894d3dd2ef6))
* **ignore:** update dependencies ([#805](https://github.com/Koenkk/zigbee-herdsman/issues/805)) ([6449923](https://github.com/Koenkk/zigbee-herdsman/commit/6449923babdcdd3190ab3d1c6455c3df32266a76))
* **ignore:** update dependencies ([#809](https://github.com/Koenkk/zigbee-herdsman/issues/809)) ([71f3eca](https://github.com/Koenkk/zigbee-herdsman/commit/71f3eca6cf332386103abb1241da6e8fd6e6aaac))

## [0.23.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.22.1...v0.23.0) (2023-11-13)


### Features

* Add `manuSpecificProfalux1` cluster ([#800](https://github.com/Koenkk/zigbee-herdsman/issues/800)) ([7347212](https://github.com/Koenkk/zigbee-herdsman/commit/7347212660904b41c6038f74776c3499599c6f22))


### Bug Fixes

* Fix some manufacturer specific attribute names being wrong ([#797](https://github.com/Koenkk/zigbee-herdsman/issues/797)) ([285e9ac](https://github.com/Koenkk/zigbee-herdsman/commit/285e9ac36d761747a95cc328d41ad4145518a89b))
* **ignore:** update dependencies ([#798](https://github.com/Koenkk/zigbee-herdsman/issues/798)) ([5c0666a](https://github.com/Koenkk/zigbee-herdsman/commit/5c0666a22a9b84165c57bfff93d4025903294c1a))

## [0.22.1](https://github.com/Koenkk/zigbee-herdsman/compare/v0.22.0...v0.22.1) (2023-11-06)


### Bug Fixes

* Fix typo, change to `commission` ([#793](https://github.com/Koenkk/zigbee-herdsman/issues/793)) ([e423928](https://github.com/Koenkk/zigbee-herdsman/commit/e423928c8131f935695d4eafe0b3ffa0ffc0003b))
* **ignore:** update dependencies ([#792](https://github.com/Koenkk/zigbee-herdsman/issues/792)) ([cb252c1](https://github.com/Koenkk/zigbee-herdsman/commit/cb252c1f739c2ddc1e75a6248fb8fa910d2fb0cf))

## [0.22.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.21.0...v0.22.0) (2023-11-03)


### Features

* **ignore:** Add NodOn Manuf Code and Manufacturer Cluster ([#790](https://github.com/Koenkk/zigbee-herdsman/issues/790)) ([fd5bf6c](https://github.com/Koenkk/zigbee-herdsman/commit/fd5bf6c4ebb91181f3c75b5cb2d699a2dc349453))


### Bug Fixes

* Fix wrong attribute names when device manufacturer ID is missing from message ([#787](https://github.com/Koenkk/zigbee-herdsman/issues/787)) ([d8e4b5b](https://github.com/Koenkk/zigbee-herdsman/commit/d8e4b5bac01478b54f43190e775cb14f72c17b43))

## [0.21.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.20.0...v0.21.0) (2023-10-25)


### Features

* **add:** New Legrand NLLV specific attributes ([#784](https://github.com/Koenkk/zigbee-herdsman/issues/784)) ([e9acbab](https://github.com/Koenkk/zigbee-herdsman/commit/e9acbab047e528e6a128d6557edebbc463f7e3c9))


### Bug Fixes

* **ignore:** update dependencies ([#782](https://github.com/Koenkk/zigbee-herdsman/issues/782)) ([10e5e00](https://github.com/Koenkk/zigbee-herdsman/commit/10e5e00da2e215318f8ccf5fcd6f0bcb76ce2d2f))
* Remove manufacturer code for Elko attributes ([#786](https://github.com/Koenkk/zigbee-herdsman/issues/786)) ([1b46aac](https://github.com/Koenkk/zigbee-herdsman/commit/1b46aac19f6c9bf91a28e7d19cd9db1b8285ad9c))

## [0.20.0](https://github.com/Koenkk/zigbee-herdsman/compare/v0.19.2...v0.20.0) (2023-10-16)


### Features

* add Inovelli VZM35 cluster parameters ([#780](https://github.com/Koenkk/zigbee-herdsman/issues/780)) ([5b854d1](https://github.com/Koenkk/zigbee-herdsman/commit/5b854d1f404fcc42c2249b961ddde7fa652074bb))
* **ignore:** Enable incremental TSC builds ([#774](https://github.com/Koenkk/zigbee-herdsman/issues/774)) ([764ab21](https://github.com/Koenkk/zigbee-herdsman/commit/764ab215bc561988cdca838954d6656396d6a223))


### Bug Fixes

* **ignore:** update dependencies ([#779](https://github.com/Koenkk/zigbee-herdsman/issues/779)) ([1abb4aa](https://github.com/Koenkk/zigbee-herdsman/commit/1abb4aa62ad81982ca3ea58f809a38d576a5277e))

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
