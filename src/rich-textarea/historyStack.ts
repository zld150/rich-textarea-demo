import { debounce } from "../utils/debounceThrottle";

// 栈元素，包含输入框内容，以及光标位置，恢复栈中数据时，也需要恢复光标位置
export interface EditorStackItem {
  content: string;
  pos: number;
}

// 历史栈
export class EditorStack {
  // stackSize: 表示当前栈最多能恢复多少次
  private stackSize: number;
  // 栈历史数据
  private histories: EditorStackItem[] = [];
  // 当前数据索引指针，调用 undo redo 恢复数据时，只需要移动指针，不需要创建两个数组分别保存内容
  private index: number = -1;

  constructor(stackSize: number = 20) {
    // 默认栈大小为 20
    this.stackSize = stackSize;
  }

  // 当前栈的大小
  get size() {
    return this.histories.length;
  }

  // 向栈中增加数据
  private pushStack(item: EditorStackItem) {
    // 情况1: 当栈已满时
    if (this.index + 1 === this.stackSize) {
      // 删除最老的那条记录(索引0)，保留从索引1到当前索引的记录
      this.histories = this.histories.slice(1, this.index + 1);
    } else {
      // 情况2: 当在历史记录中间位置进行了新的操作
      // 删除当前索引之后的所有记录，因为新操作会产生新的历史分支
      this.histories = this.histories.slice(0, this.index + 1);
    }
    // 入栈
    this.histories.push(item);
    // 更新指针位置
    this.index = this.histories.length - 1;
    console.log("pushStack, current histories>>>", this.histories, this.index);
  }

  // 初始入栈
  initPush(item: EditorStackItem) {
    this.pushStack(item);
  }

  // 防抖入栈
  debouncePush(item: EditorStackItem) {
    debounce(this.pushStack, 300, this, item);
  }

  // 执行 undo(撤销)，将索引向前移动，获取到前一条历史数据后返回
  undo() {
    // 如果已经恢复到了第一条数据，就不能再向前恢复
    if (this.index <= 0) return null;
    // 索引向前移动1次
    this.index--;
    // 获取到前一条历史数据
    const item = this.histories[this.index];
    // 返回前一条历史数据
    return item;
  }

  // 执行 redo(恢复)，将索引向后移动，获取后一条历史数据后返回，如果在最后一条了，就返回 null，没办法 redo 了
  redo() {
    // 如果已经恢复到了最后一条数据，就不能再向后恢复
    if (this.index + 1 < this.histories.length) {
      // 索引向后移动1次
      this.index++;
      // 返回后一条历史数据
      return this.histories[this.index];
    }
    // 返回 null，表示没有可恢复的数据
    return null;
  }
}
