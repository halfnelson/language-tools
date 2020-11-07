/// <reference types="svast" />
declare module 'svelte-parse' {
import { Root } from 'svast';

    interface ParseOptions {
        /**
         * The input value to be parsed
         */
        value: string;
        /**
         * Generate positional data
         */
        generatePositions: boolean;
    }

    export function parse(opts: ParseOptions): Root;
}
