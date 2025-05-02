// blog-loader.js
const posts = [
  'blog/posts/2024-12-10-setting-up-intune-policies.md',
  'blog/posts/2024-12-05-linux-kerberos-auth.md',
  'blog/posts/2024-11-15-sssd-vs-winbind.md'
];

let currentPost = 0;
const container = document.getElementById('blog-container');

function loadNextPost() {
  if (currentPost >= posts.length) return;

  const postUrl = posts[currentPost++];
  fetch(postUrl)
    .then(res => res.ok ? res.text() : Promise.reject('Failed to load'))
    .then(md => {
      const postDiv = document.createElement('div');
      postDiv.className = 'Box mb-4 p-4 color-bg-subtle';
      postDiv.innerHTML = marked.parse(md);
      container.appendChild(postDiv);
    })
    .catch(() => {
      const error = document.createElement('p');
      error.className = 'text-gray';
      error.textContent = 'Oops, something went wrong loading this post.';
      container.appendChild(error);
    });
}

function handleScroll() {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    loadNextPost();
  }
}

window.addEventListener('scroll', handleScroll);
window.addEventListener('DOMContentLoaded', () => {
  for (let i = 0; i < 2; i++) loadNextPost();
});