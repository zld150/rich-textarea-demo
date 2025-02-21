import { insertContentIntoEditor } from "./cursor";

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
  console.log("update value, current value is:", richTextarea?.innerText);
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

// 在beforeInput中对非重点关注事件类型直接阻止
const beforeInputHandler = (e: InputEvent) => {
  //   const target = e.target as HTMLElement;
  const eventType = e.inputType;
  console.log("eventType>>>", e.type, e);

  // 非重点关注的事件类型直接阻止
  if (!ALLOW_INPUT_TYPE.includes(eventType)) {
    e.preventDefault();
    return;
  }

  if (eventType === "insertFromPaste") {
    e.preventDefault();
    const result = insertContentIntoEditor(e.data ?? "");
    if (result) updateValue();
    return;
  }
};

// 监听input事件
const inputHandler = (e: InputEvent) => {
  const eventType = e.type;
  console.log("eventType >", eventType, e);
};

// 获取rich-textareaDOM
const richTextarea: HTMLElement | null = document.querySelector(".rich-textarea");

// 监听paste事件
richTextarea?.addEventListener("paste", pasteHandler);
// 监听beforeInput事件
richTextarea?.addEventListener("beforeinput", beforeInputHandler);
// 监听input事件
richTextarea?.addEventListener("input", inputHandler as EventListener);
