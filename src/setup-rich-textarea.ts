import "./rich-textarea/index";

export function setupRichTextarea(el: HTMLElement | null) {
  if (!el) return;
  el.innerHTML = /*html*/ `
    <h3>实现contenteditable替换textarea</h3>
    <div>
      <rich-textarea value="hello world"></rich-textarea>
    </div>      
  `;
}
