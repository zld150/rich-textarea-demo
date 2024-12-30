import { html, c, Component, Props } from "atomico";
import { RichTextareaProps } from "./types";

// 样式定义
const style = /*css*/ `
  .rich-textarea {
    border: 1px solid #646cffaa;
    border-radius: 4px;
    outline: none;
    padding: 6px 4px;
    line-height: 1.2;
    margin: 12px 0;
    white-space: pre-inline;
    caret-color: #646cffaa;
  }
`;
// 组件定义
const RichTextarea: Component<Props<RichTextareaProps>> = (props) => {
  return html`
    <host>
      <style>
        ${style}
      </style>
      <p class="rich-textarea" contenteditable>${props.value}</p>
    </host>
  `;
};

// atomico 组件的 props 需要像 vue 一样，显示定义，上面定义了 RichTextareaProps 类型仅用于类型提示
RichTextarea.props = {
  value: {
    type: String,
    reflect: true,
    value: "",
  },
};

customElements.define("rich-textarea", c(RichTextarea));
