const weakMap = new WeakMap();

export const debounce = (fn: Function, delay = 600, scope?: Record<string, any>, ...args: any[]) => {
  let timer = weakMap.get(fn);
  timer && clearTimeout(timer);
  timer = setTimeout(() => {
    // 执行函数并传参
    scope ? fn.call(scope, ...(args || [])) : fn(...(args || []));
    // 函数执行后从map中删除这个事件
    weakMap.delete(fn);
  }, delay);
  weakMap.set(fn, timer);
};
