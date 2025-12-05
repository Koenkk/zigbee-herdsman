export const START = 0x42;
export const END = 0x4c; // Marks end of frame
export const ESCAPE = 0x07; // Indicates that the following byte is escaped
export const STUFF = 0x10;
export const DEBUG = 0x80;
export const RETX = 0x01;
export const RESERVED = [START, END, ESCAPE];
