export function array_to_map<E, V> (
    array: E[],
    keyFn: (element: E) => string,
    valueFn: (element: E) => V
) {
    let map: {[key:string]: V} = {}
    for (let e of array) {
        map[keyFn(e)] = valueFn(e)
    }
    return map;
}