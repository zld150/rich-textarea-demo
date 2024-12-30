import { setupRichTextarea } from "./setup-rich-textarea";

import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = /*html*/ `
  <div class="rich-textarea-wrapper"></div>
`;

setupRichTextarea(document.querySelector(".rich-textarea-wrapper"));
