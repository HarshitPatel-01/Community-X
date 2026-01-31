document.addEventListener("DOMContentLoaded", () => {

  async function vote(postId, type, postActions) {
    const res = await fetch(`/api/post/${postId}/${type}`, { method: "POST" });
    const data = await res.json();

    postActions.querySelector(".up-count").textContent = data.upvotes;
    postActions.querySelector(".down-count").textContent = data.downvotes;
  }

  document.querySelectorAll(".upvote-btn").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();

      const postId = this.dataset.id;
      const postActions = this.closest(".post-actions");

      vote(postId, "upvote", postActions);

      this.classList.add("active");
      postActions.querySelector(".downvote-btn").classList.remove("active");
    });
  });

  document.querySelectorAll(".downvote-btn").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();

      const postId = this.dataset.id;
      const postActions = this.closest(".post-actions");

      vote(postId, "downvote", postActions);

      this.classList.add("active");
      postActions.querySelector(".upvote-btn").classList.remove("active");
    });
  });

});

function copyLink(id) {
  const url = window.location.origin + "/post/" + id;
  navigator.clipboard.writeText(url);

  const btn = event.target.closest(".share-btn");
  if (btn) {
    btn.textContent = "✅ Copied!";
    setTimeout(() => btn.textContent = "🔗 Share", 1500);
  }
}
