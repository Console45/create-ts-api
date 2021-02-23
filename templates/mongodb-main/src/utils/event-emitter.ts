import { EventEmitter } from "events";

/**
 * Events enum
 * @enum
 */
export enum Events {}

export const eventEmitter = new EventEmitter();
