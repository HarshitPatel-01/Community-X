document.addEventListener("DOMContentLoaded", () => {

  /* ================= VOTING ================= */
  async function vote(postId, type, postActions, btnClicked) {
    if (btnClicked.dataset.loading === "true") return; // prevent double request
    btnClicked.dataset.loading = "true";
    btnClicked.disabled = true;

    try {
      const res = await fetch(`/api/post/${postId}/${type}`, { method: "POST" });

      const data = await res.json();

      if (!res.ok) {
        showFlash(data.error || "Vote failed", "error");
        return;
      }

      postActions.querySelector(".up-count").textContent = data.upvotes;
      postActions.querySelector(".down-count").textContent = data.downvotes;

      if (type === "upvote") {
        btnClicked.classList.toggle("active");
        postActions.querySelector(".downvote-btn").classList.remove("active");
      } else {
        btnClicked.classList.toggle("active");
        postActions.querySelector(".upvote-btn").classList.remove("active");
      }

    } catch (err) {
      console.error("Voting error:", err);
      showFlash("Network error", "error");
    } finally {
      btnClicked.disabled = false;
      btnClicked.dataset.loading = "false";
    }
  }

  document.querySelectorAll(".upvote-btn").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      vote(this.dataset.id, "upvote", this.closest(".post-actions"), this);
    });
  });

  document.querySelectorAll(".downvote-btn").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      vote(this.dataset.id, "downvote", this.closest(".post-actions"), this);
    });
  });

  /* ================= AUTO REMOVE SERVER FLASHES ================= */
  setTimeout(() => {
    document.querySelectorAll(".custom-flash").forEach(removeFlash);
  }, 3000);

});


/* ================= SHARE BUTTON ================= */
function copyLink(id, el) {
  const url = window.location.origin + "/post/" + id;
  navigator.clipboard.writeText(url);

  const btn = el.closest(".share-btn");
  btn.textContent = "Copied!";
  setTimeout(() => btn.textContent = "🔗 Share", 1500);
}


/* ================= FLASH FUNCTIONS ================= */
function removeFlash(flash) {
  flash.style.animation = "slideOut 0.4s ease forwards";
  setTimeout(() => flash.remove(), 400);
}

function showFlash(message, type = "error") {
  const wrapper = document.querySelector(".flash-wrapper");
  if (!wrapper) return;

  const flash = document.createElement("div");
  flash.className = `custom-flash ${type}`;
  flash.innerHTML = `
    <i class="bi ${type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}"></i>
    <span>${message}</span>
    <div class="progress-bar"></div>
  `;

  wrapper.appendChild(flash);
  setTimeout(() => removeFlash(flash), 3000);
}
