declare module 'mixin-deep' {
    export default function mixinDeep<T>(target: T, ...rest: object[]): T;
}
