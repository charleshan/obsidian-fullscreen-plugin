import { Notice, Plugin, View } from "obsidian";

interface FullscreenSession {
  el: HTMLElement;
  doc: Document;
  observer: MutationObserver;
  // Body children (menus, modals, popovers) relocated into the fullscreen view.
  moved: Set<Node>;
  onChange: () => void;
}

export default class FullScreenPlugin extends Plugin {
  private session: FullscreenSession | null = null;

  onload() {
    this.addCommand({
      id: "fullscreen-focus",
      name: "Fullscreen focus mode",
      callback: () => this.toggle(),
    });
  }

  onunload() {
    const session = this.session;
    if (!session) return;
    this.endSession();
    if (session.doc.fullscreenElement) void session.doc.exitFullscreen();
  }

  private toggle() {
    if (this.session) {
      void this.session.doc.exitFullscreen();
      return;
    }

    const view = this.app.workspace.getActiveViewOfType(View);
    if (!view) return;
    const el = view.containerEl;
    const doc = el.ownerDocument;

    // Only elements inside the fullscreen element are rendered, so anything Obsidian
    // appends to <body> (command palette, menus, modals) is moved into the view.
    const moved = new Set<Node>();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node.parentNode !== doc.body) return;
          const focused = doc.activeElement;
          el.appendChild(node);
          moved.add(node);
          // Moving a node blurs whatever was focused inside it (e.g. the prompt input).
          if (focused instanceof HTMLElement && node.contains(focused)) focused.focus();
        });
      }
    });

    const onChange = () => {
      if (doc.fullscreenElement === el) doc.body.classList.add("fullscreen");
      else this.endSession();
    };

    this.session = { el, doc, observer, moved, onChange };
    doc.addEventListener("fullscreenchange", onChange);
    observer.observe(doc.body, { childList: true });

    el.requestFullscreen().catch((error: Error) => {
      this.endSession();
      new Notice(`Fullscreen failed: ${error.message}`);
    });
  }

  private endSession() {
    const session = this.session;
    if (!session) return;
    this.session = null;

    const { el, doc, observer, moved, onChange } = session;
    observer.disconnect();
    doc.removeEventListener("fullscreenchange", onChange);
    doc.body.classList.remove("fullscreen");

    // Return anything still open (notices, an open modal) to where Obsidian expects it.
    moved.forEach((node) => {
      if (node.parentNode === el) doc.body.appendChild(node);
    });
  }
}
