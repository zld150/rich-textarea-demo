import { EditorStack } from "./historyStack";

/**
 * 插入内容到编辑器
 * @param content 插入的内容
 * @param isFirstCreateNewLine 是否是第一次创建新空白行
 * @returns
 */
export const insertContentIntoEditor = (content: string, isFirstCreateNewLine: boolean = false) => {
  // 获取当前文档的选区对象
  const selection = window.getSelection();
  // 如果选区对象不存在或者选区对象的 range 数量为 0，则返回 false
  if (!selection || !selection.rangeCount) return false;

  // 如果选区对象不是折叠的，则将已选中内容删除，删除后，selection 的属性会自动更新，后续不必重新获取 selection
  if (!selection.isCollapsed) selection.deleteFromDocument();

  // 根据已有第一个 range，clone 创建一个新的 range
  const range = selection.getRangeAt(0).cloneRange();

  // 移除当前所有选区
  selection.removeAllRanges();

  // 创建待插入的文本节点
  const textNode = document.createTextNode(content);

  // 插入新的文本节点
  range.insertNode(textNode);
  // 如果插入的是空格
  if (isFirstCreateNewLine) {
    // 如果我们插入的是两个 \n, 需要将光标向前移一位；
    // 因为实际通过键盘移动光标的时候，是不会将光标移动到最后一个 \n 之后的
    range.setStart(textNode, 1);
    range.setEnd(textNode, 1);
  } else {
    // 光标聚焦到尾部
    range.collapse();
  }
  // 将新的 range 添加到选区
  selection.addRange(range);

  // 返回 true 表示插入成功
  return true;
};

// 是否是文本节点
export const isTextNode = (node: unknown): node is Text => {
  return !!node && node instanceof Text;
};

// 是否是 br 节点
export const isBrNode = (node: unknown): node is HTMLBRElement => {
  return !!node && node instanceof HTMLBRElement;
};

// 是否处于输入框内
export const isRichTextarea = (node: unknown): node is HTMLElement => {
  return !!(node instanceof HTMLElement && node.dataset.richTextarea);
};

// 根据 anchorNode 向父级查找输入框节点
export const findRichTextarea = (node: Node | null): HTMLElement | null => {
  // 如果 node 不存在，则返回 null
  if (!node) return null;

  // 如果 node 是输入框节点，则返回 node
  if (isRichTextarea(node)) {
    return node;
  }

  // 如果 node 不是输入框节点，则继续向父级查找
  return findRichTextarea(node.parentNode);
};

/**
 * 获取光标位置
 * @returns
 */
export const getCursorPosition = () => {
  // 获取当前文档的选区对象
  const selection = window.getSelection();
  // 如果选区对象不存在或者选区对象的 range 数量为 0，则返回 0
  // 1. 返回默认值 0 的情况:
  // - 选区对象不存在
  // - 当前不存在被选择的内容
  // - 当前选区有被选中文本，而非光标状态
  if (!selection || !selection.rangeCount || !selection.isCollapsed) return 0;

  // 获取选区锚点节点
  const anchorNode = selection.anchorNode;
  // 根据锚点节点查找输入框节点
  const textareaNode = findRichTextarea(anchorNode);

  /**
   * 2. 光标不在输入框内，返回默认值
   */
  if (!textareaNode) return 0;

  /**
   * 3. 获取光标位置
   * 分析：
   * - 当前 textarea 内只会存在文本节点与 br 标签，如果 range 选中的是 br 节点，
   * 则 anchorNode 为 br 的父节点，即 textarea 节点，range 选中内容为节点时，
   * offset 计算单位是同级节点数量；
   * - 如果选中内容是文本内容，anchorNode 则是 TextNode
   * - 需要计算当前位置之前，所有文本长度与br数量之和
   */
  // 如果锚点节点是输入框节点
  if (isRichTextarea(anchorNode)) {
    // 初始化位置
    let pos = 0;
    // 获取输入框节点的子节点
    const childNodes = textareaNode.childNodes;
    // 获取选中的偏移量
    const anchorOffset = selection.anchorOffset;
    // 遍历子节点
    for (let i = 0; i < anchorOffset; i++) {
      // 获取子节点
      const child = childNodes[i];
      // 如果子节点是文本节点
      if (isTextNode(child)) {
        // 累加文本长度
        pos += child.length;
        continue;
      }
      // 如果子节点是 br 节点
      if (isBrNode(child)) {
        // 累加 br 数量
        pos += 1;
      }
    }
    // 返回光标位置
    return pos;
  }

  // 如果锚点节点是文本节点
  if (isTextNode(anchorNode)) {
    // 初始化位置
    let pos = 0;
    // 获取输入框节点的子节点
    const childNodes = textareaNode.childNodes;
    // 获取选中的偏移量
    const anchorOffset = selection.anchorOffset;
    // 遍历子节点
    for (let i = 0; i < childNodes.length; i++) {
      // 获取子节点
      const child = childNodes[i];
      // 当前光标刚好在文本节点上
      if (child === anchorNode) {
        // 累加偏移量
        pos += anchorOffset;
        // 返回光标位置
        return pos;
      }
      // 累加文本长度或 br 数量
      pos += isTextNode(child) ? child.length : 1;
    }
  }

  // 这里的返回基本不会执行，但是为了 ts 的类型安全，返回一个数字
  return 0;
};

/**
 * 移动光标到指定位置
 * @param textareaNode 输入框节点
 * @param pos 光标位置
 */
export function moveCursorTo(textareaNode: Node, pos: number) {
  // 获取当前文档的选区对象
  const selection = window.getSelection();
  // 如果选区对象不存在，则中断执行
  if (!selection) return;
  // 获取输入框节点的子节点
  const childNodes = textareaNode.childNodes;
  // 创建一个新的 range
  const range = document.createRange();
  // acc 用来记录遍历过了多少个字符
  let acc = 0;
  // TODO:遍历输入框的 childNodes 节点，要明白，当前输入框的内容已经被我们控制到只有文本节点与 br 节点了
  for (let i = 0; i < childNodes.length; i++) {
    // 当前遍历的子节点
    const child = childNodes[i];
    // 处理文本节点
    if (isTextNode(child)) {
      // 如果累加的文本长度大于等于光标位置，则设置光标位置
      if (acc + child.length >= pos) {
        // 计算偏移量
        const offset = pos - acc;
        // 设置光标位置
        range.setStart(child, offset);
        range.setEnd(child, offset);
        // 跳出循环
        break;
      }
      // 累加文本长度
      acc += child.length;
    }
    // 处理 br 节点
    if (isBrNode(child)) {
      // 如果累加的 br 数量等于光标位置，则设置光标位置
      if (acc + 1 === pos) {
        /**
         * 将光标放在 br 节点后面
         * setStartBefore(): 设置起始点在节点之前
         * setEndBefore(): 设置结束点在节点之前
         * setStart(): 设置起始点在文本节点的指定位置
         * setEnd(): 设置结束点在文本节点的指定位置
         */
        // 设置 Range 的起始点在指定节点(child)的后面
        range.setStartAfter(child);
        // 设置 Range 的结束点在指定节点(child)的后面
        range.setEndAfter(child);
        // 跳出循环
        break;
      }
      // 累加 br 数量
      acc += 1;
    }
  }
  // 删除已有的 range
  if (selection.rangeCount) selection.removeAllRanges();
  // 更新 range
  selection.addRange(range);
}

// 执行 undo 操作
export const undoHistory = (stack: EditorStack, textareaNode: HTMLElement) => {
  // 获取历史栈中当前指针位置的前一条数据
  const item = stack.undo();
  if (!item) return false;
  // 通过 innerText 更新数据
  textareaNode.innerText = item.content;
  // 恢复光标位置
  moveCursorTo(textareaNode, item.pos);
  return true;
};

// 执行 redo 操作
export const redoHistory = (stack: EditorStack, textareaNode: HTMLElement) => {
  // 获取历史栈中当前指针位置的后一条数据
  const item = stack.redo();
  if (!item) return false;
  // 通过 innerText 更新数据
  textareaNode.innerText = item.content;
  // 恢复光标位置
  moveCursorTo(textareaNode, item.pos);
  return true;
};
