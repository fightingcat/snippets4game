namespace array {
    /**
     * Pick one element in array randomly.
     * @param options
     */
    export function randPick<T>(options: T[]): T {
        return options[Math.floor(Math.random() * options.length)];
    }

    /**
     * Durstenfeld shuffle
     * @param array 
     */
    export function shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = ~~(Math.random() * (i + 1));
            const t = array[i];
            array[i] = array[j];
            array[j] = t;
        }
        return array;
    }

    /**
     * Dedupe array base on return value of an accessor function.
     * @param array
     * @param accessor
     */
    export function dedupe<T>(array: T[], accessor: (element: T) => any): T[] {
        let set = new Set();

        return array.filter(element => {
            let value = accessor(element);

            return set.has(value) ? false : set.add(value), true;
        });
    }

    export function map<T, K>(array: T[], accessor: (element: T) => K): Map<K, T> {
        let map = new Map<K, T>();

        for (let element of array) {
            map.set(accessor(element), element);
        }
        return map;
    }

    export function group<T, K>(array: T[], accessor: (element: T) => K): Map<K, T[]> {
        let map = new Map<K, T[]>();

        for (let element of array) {
            let key = accessor(element);

            if (map.has(key)) map.get(key).push(element);
            else map.set(key, [element]);
        }
        return map;
    }
}

namespace number {
    /**
     * Get random number within a range.
     * @param start 
     * @param end 
     */
    export function rand(start: number, end: number): number {
        return start + Math.random() * (end - start);
    }

    /**
     * Get random integer within a range.
     * @param start 
     * @param end 
     */
    export function randInt(start: number, end: number): number {
        return Math.floor(rand(start, Math.floor(end) + 1));
    }

    export function clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(min, value), max);
    }
}

namespace string {
    export const alphabets = 'abcdefghijklmnopqrstuvwxyz';
    export const ALPHABETS = alphabets.toUpperCase();
    const randElements = (alphabets + ALPHABETS).split('');

    /**
     * Get a random string with fixed length.
     * @param length
     */
    export function rand(length: number): string {
        let result = '';

        for (let i = 0; i < length; i++) {
            result += array.randPick(randElements);
        }
        return result;
    }
}

namespace rand {
    export import pick = array.randPick;
    export import str = string.rand;
    export import num = number.rand;
    export import int = number.randInt;
}
