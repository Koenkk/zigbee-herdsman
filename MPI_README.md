
#Local testing of deCONZ adapter

https://dev.to/one-beyond/different-approaches-to-testing-your-own-packages-locally-npm-link-4hoj

## Checkout zigbee-herdsman

Note `pnpm setup` might be needed if failure occurs.

```
git clone git@github.com:manup/zigbee-herdsman.git
cd zigbee-herdsman
pnpm install
```

Create a symlink to this local package in `npm prefix -g`.

```
pnpm link
```

------


## Use linked local package in zigbee2mqtt

```
git clone https://github.com/Koenkk/zigbee2mqtt.git
cd zigbee2mqtt
pnpm install
pnpm link zigbee-herdsman

```

Optionally verify link was done:

```
ls -ld node_modules/zigbee-herdsman
lrwxrwxrwx 1 dev dev 21 May 18 22:33 node_modules/zigbee-herdsman -> ../../../.local/share/pnpm/global/5/node_modules/zigbee-herdsman
```

## Build zigbee-herdsman

```
# in zigbee-herdsman
pnpm build
```