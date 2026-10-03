const copyButton = document.querySelector('[data-copy-discord]');
const copyLabel = document.querySelector('[data-copy-label]');
const copyStatus = document.querySelector('.copy-status');
let feedbackTimeout;

copyButton?.addEventListener('click', async () => {
  clearTimeout(feedbackTimeout);
  try {
    await navigator.clipboard.writeText('sudo.sleep_');
    copyLabel.textContent = 'Copied!';
    copyStatus.textContent = 'Discord username copied.';
    feedbackTimeout = setTimeout(() => {
      copyLabel.textContent = 'Copy';
      copyStatus.textContent = '';
    }, 2500);
  } catch {
    copyLabel.textContent = 'Copy';
    copyStatus.textContent = 'Couldn’t copy automatically. My Discord username is sudo.sleep_.';
  }
});
