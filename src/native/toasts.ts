export const toastStyles = `
  #__stoat-toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  }
  .stoat-toast {
    background: #1e1e2e;
    border: 1px solid #3a3a55;
    border-left: 4px solid #7c6af7;
    border-radius: 8px;
    padding: 12px 16px;
    min-width: 280px;
    max-width: 340px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    pointer-events: all;
    opacity: 0;
    transform: translateX(20px);
    transition: opacity 0.2s ease, transform 0.2s ease;
    cursor: pointer;
  }
  .stoat-toast.visible {
    opacity: 1;
    transform: translateX(0);
  }
  .stoat-toast.hiding {
    opacity: 0;
    transform: translateX(20px);
  }
  .stoat-toast-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .stoat-toast-icon { font-size: 14px; }
  .stoat-toast-sender {
    font-size: 13px;
    font-weight: 600;
    color: #c9c9e0;
    font-family: sans-serif;
  }
  .stoat-toast-role {
    font-size: 11px;
    background: #7c6af720;
    color: #a89cf7;
    border: 1px solid #7c6af740;
    border-radius: 4px;
    padding: 1px 6px;
    font-family: sans-serif;
    margin-left: auto;
  }
  .stoat-toast-content {
    font-size: 12px;
    color: #8888aa;
    font-family: sans-serif;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
  }
  .stoat-toast-progress {
    height: 2px;
    background: #7c6af7;
    border-radius: 2px;
    margin-top: 10px;
    animation: stoat-progress 5s linear forwards;
  }
  @keyframes stoat-progress {
    from { width: 100%; }
    to { width: 0%; }
  }
`;

export const toastScript = `
  function __initToasts() {
    if (!document.getElementById('__stoat-toast-styles')) {
      const style = document.createElement('style');
      style.id = '__stoat-toast-styles';
      style.textContent = ${JSON.stringify(toastStyles)};
      document.head.appendChild(style);
    }
  }

  function __getToastContainer() {
    let container = document.getElementById('__stoat-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = '__stoat-toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function __dismissToast(toast) {
    toast.classList.remove('visible');
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 250);
  }

  function __showMentionToast(senderName, roleName, content) {
    __initToasts();
    const container = __getToastContainer();
    const toast = document.createElement('div');
    toast.className = 'stoat-toast';
    toast.innerHTML =
      '<div class="stoat-toast-header">' +
        '<span class="stoat-toast-icon">🔔</span>' +
        '<span class="stoat-toast-sender">' + senderName + '</span>' +
        '<span class="stoat-toast-role">@' + roleName + '</span>' +
      '</div>' +
      '<div class="stoat-toast-content">' + content + '</div>' +
      '<div class="stoat-toast-progress"></div>';
    toast.addEventListener('click', () => __dismissToast(toast));
    container.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('visible'));
    });
    setTimeout(() => __dismissToast(toast), 5000);
  }
`;