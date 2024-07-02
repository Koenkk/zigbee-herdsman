export const FLAG = 0x7e; // Marks end of frame
export const ESCAPE = 0x7d; // Indicates that the following byte is escaped
export const CANCEL = 0x1a; // Terminates a frame in progress
export const XON = 0x11; // Resume transmission
export const XOFF = 0x13; // Stop transmission
export const SUBSTITUTE = 0x18; // Replaces a byte received with a low-level communication error
export const STUFF = 0x20;
export const RANDOMIZE_START = 0x42;
export const RANDOMIZE_SEQ = 0xb8;

export const RESERVED = [FLAG, ESCAPE, XON, XOFF, SUBSTITUTE, CANCEL];
