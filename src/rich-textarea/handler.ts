import platform from "platform";
import { insertContentIntoEditor, redoHistory, undoHistory, getCursorPosition } from "./cursor";
import { EditorStack } from "./historyStack";

/**
 * 重点关注的输入类型
 */
const ALLOW_INPUT_TYPE = [
  // 输入类型
  "insertParagraph", // 输入新行 (直接按下 回车)
  "insertLineBreak", // 输入换行符 (按下 shift + 回车)
  "insertText", // 输入文本
  "insertCompositionText", // 中文合成输入
  "insertFromPaste", // 粘贴输入
  "insertFromDrop", // 从别的地方拖拽输入，在 firefox 中尝试
  // 删除类型
  "deleteContentBackward", // 向前删除，即直接按下删除键
  "deleteContentForward", // 向后删除，win 按下 delete 键，mac 按下 fn + delete
  "deleteByCut", // 剪切，通过 ctrl + x 或 cmd + x 剪切
  "deleteByDrag", // 从当前输入框中拖拽到其他地方
  // 历史
  "historyUndo", // ctrl + z 或 cmd + z
  "historyRedo", // ctrl + shift + z 或 cmd + shift + z
];

// 定义后续更新值的函数，目前先不实现，仅仅打印当前结果
const updateValue = () => {
  console.log("update value, current value is>>>", richTextarea?.innerText);
};

// 在beforeInput中对非重点关注事件类型直接阻止
const beforeInputHandler = (e: InputEvent) => {
  // 获取输入类型
  const eventType = e.inputType;
  // 非重点关注的事件类型直接阻止
  if (!ALLOW_INPUT_TYPE.includes(eventType)) {
    e.preventDefault();
    return;
  }
  // 拦截历史操作，执行上述方法进行历史数据恢复
  if (["historyUndo", "historyRedo"].includes(eventType)) {
    e.preventDefault();
    // undo（撤销）
    if (eventType === "historyUndo") {
      undoHistory(editorHistory, richTextarea!);
    } else {
      // redo（恢复）
      redoHistory(editorHistory, richTextarea!);
    }
    // 手动触发 input 事件
    dispatchInnerInputEvent(e, eventType);
    return;
  }
  // 粘贴输入事件
  if (eventType === "insertFromPaste") {
    e.preventDefault();
    const result = insertContentIntoEditor(e.data ?? "");
    // 如果插入成功，则手动触发 input 事件入栈
    !result || dispatchInnerInputEvent(e, eventType);
    return;
  }
  // 拖拽输入事件
  if (eventType === "insertFromDrop") {
    e.preventDefault();
    // 从 dataTransfer 中获取到当前拖进来的文本
    const dropData = e.dataTransfer?.getData("text") || "";
    // 文本内容存在，则将其插入
    if (dropData) {
      const result = insertContentIntoEditor(dropData);
      // 如果插入成功，则手动触发 input 事件入栈
      !result || dispatchInnerInputEvent(e, eventType);
    }
    return;
  }
  // 换行输入事件
  if (["insertParagraph", "insertLineBreak"].includes(eventType)) {
    e.preventDefault();
    // 判断光标是否在段落尾部
    // const isCursorAtEnd = isCursorAtParagraphEnd();
    // 插入两个换行符
    const result = insertContentIntoEditor("", true);
    // 如果插入成功，则手动触发 input 事件入栈
    !result || dispatchInnerInputEvent(e, eventType);
    return;
  }
};

// 监听input事件
const inputHandler = (e: InputEvent) => {
  // 除了操作 history 的事件，其余值更新，都直接进栈
  if (!["historyUndo", "historyRedo"].includes(e.inputType)) {
    editorHistory.debouncePush({
      content: (e.target as HTMLElement).innerText,
      pos: getCursorPosition(),
    });
  }
  updateValue();
};

// 手动触发 input 事件
const dispatchInnerInputEvent = (e: InputEvent, inputType: string, data: string | null = null) => {
  // 使用 requestAnimationFrame 也是等 dom 内容更新后我们再触发，使之与浏览器默认的触发顺序一致
  requestAnimationFrame(() => {
    e.target?.dispatchEvent(
      new InputEvent("input", {
        inputType, // 输入类型
        bubbles: e.bubbles, // 是否冒泡
        cancelable: e.cancelable, // 是否可取消
        data, // 输入内容
      })
    );
  });
};

// 判断是否为苹果系产品
const isApplePlatform = () => ["iOS", "OS X"].includes(platform.os?.family || "");

/**
 * 监听键盘按下事件
 * 拦截 ctrl + z (撤销 undo) 与 ctrl + shift +z (恢复 redo)
 * @param e 键盘事件
 */
const keydownHandler = (e: KeyboardEvent) => {
  // 苹果系产品，拦截 cmd + z / cmd + shift + z
  // 其他产品，拦截 ctrl + z / ctrl + shift + z

  // 获取 ctrl 键是否按下
  const ctrlKey = isApplePlatform() ? e.metaKey : e.ctrlKey;
  // 撤销 undo
  if (ctrlKey && e.code === "KeyZ" && !e.shiftKey) {
    e.preventDefault();
    // 获取当前的 textarea 节点
    const textareaNode = e.target as HTMLElement;
    // 触发 undo 类型的 beforeinput
    textareaNode.dispatchEvent(new InputEvent("beforeinput", { data: null, inputType: "historyUndo" }));
    return;
  }
  // 恢复 redo
  if (ctrlKey && e.code === "KeyZ" && e.shiftKey) {
    e.preventDefault();
    // 获取当前的 textarea 节点
    const textareaNode = e.target as HTMLElement;
    // 触发 redo 类型的 beforeinput
    textareaNode.dispatchEvent(new InputEvent("beforeinput", { data: null, inputType: "historyRedo" }));
    return;
  }
};

// 监听paste事件
const pasteHandler = (e: ClipboardEvent) => {
  // 阻止默认事件，否则系统会派发一个data为null的beforeinput与input事件
  e.preventDefault();
  // 获取输入的纯文本内容
  const pasteText = e.clipboardData?.getData("text") || "";
  // 手动触发一个 beforeinput 事件，虽然这里 inputType 可以随意填写，为了语义化以及后续排错等，还是按规定触发 insertFromPaste 类型的事件。
  if (pasteText) {
    e.target?.dispatchEvent(
      new InputEvent("beforeinput", {
        inputType: "insertFromPaste", // 输入类型为粘贴
        data: pasteText, // 输入内容
        bubbles: true, // 冒泡
        cancelable: true, // 可取消
      })
    );
  }
};

// 第一次 foucs 时，需要向栈中添加初始数据，否则无法恢复到第一条数据
const focusHandler = (e: FocusEvent) => {
  // 使用 requestAnimationFrame 是因为刚 focus 时，获取到的 pos 是不准确的
  requestAnimationFrame(() => {
    // 如果历史栈为空，则向栈中添加初始数据
    if (!editorHistory.size) {
      editorHistory.initPush({
        content: (e.target as HTMLElement).innerText,
        pos: getCursorPosition(),
      });
    }
  });
};

// 初始化历史栈
const editorHistory = new EditorStack();
// 获取rich-textareaDOM
const richTextarea: HTMLElement | null = document.querySelector(".rich-textarea");

// 监听beforeInput事件
richTextarea?.addEventListener("beforeinput", beforeInputHandler);
// 监听input事件
richTextarea?.addEventListener("input", inputHandler as EventListener);
// 监听paste事件
richTextarea?.addEventListener("paste", pasteHandler);
// 监听focus事件
richTextarea?.addEventListener("focus", focusHandler);
// 监听keydown事件
richTextarea?.addEventListener("keydown", keydownHandler);

// TODO:需要初始化清空输入框内容，因为一开始在输入框内会有三个空的文本节点，不清除它们有可能会造成意料之外的bug
if (richTextarea) richTextarea.innerText = "";
