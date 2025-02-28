const weakMap = new WeakMap();

/**
 * 防抖
 * @param {Array} args 参数数组
 */
export const debounce = (...args: any[]) => {
  // 从参数对象中解构出执行函数, 延迟时间以及函数参数
  let [fn, delay = 600, ...ars] = args;
  let timer = weakMap.get(fn);
  timer && clearTimeout(timer);
  timer = setTimeout(() => {
    // 执行函数并传参
    fn(...(ars || []));
    // 函数执行后从map中删除这个事件
    weakMap.delete(fn);
  }, delay);
  weakMap.set(fn, timer);
};
