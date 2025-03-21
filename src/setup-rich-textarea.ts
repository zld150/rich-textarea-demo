import "./rich-textarea/index";

export function setupRichTextarea(el: HTMLElement | null) {
  if (!el) return;
  el.innerHTML = /*html*/ `
    <h3 style="text-align: center;">实现contenteditable替换textarea</h3>
    <div>
      <rich-textarea value=""></rich-textarea>
    </div>      
  `;
}
