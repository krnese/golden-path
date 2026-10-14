const button = document.getElementById("copy-command");
const status = document.getElementById("copy-status");
if (navigator.clipboard?.writeText && window.isSecureContext) {
  button.hidden = false;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById("install-command").textContent);
      status.textContent = "Copied. Replace the placeholders before running.";
    } catch (error) {
      console.error("Could not copy installation commands:", error);
      status.textContent = "Copy failed. Select the commands above and copy them manually.";
    }
  });
}
