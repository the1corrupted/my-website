document.addEventListener("DOMContentLoaded", function() {
    // Fetch the list of posts
    const posts = [
        { title: "Post 1", file: "posts/post1.md" },
        { title: "Post 2", file: "posts/post2.md" },
        { title: "Post 3", file: "posts/post3.md" }
    ];

    const postsList = document.getElementById('posts-list');
    const content = document.getElementById('content');

    // Generate the list of posts
    posts.forEach(post => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = "#";
        a.textContent = post.title;
        a.addEventListener('click', function(event) {
            event.preventDefault();
            loadContent(post.file);
        });
        li.appendChild(a);
        postsList.appendChild(li);
    });

    // Function to load content from a file
    function loadContent(file) {
        fetch(file)
            .then(response => response.text())
            .then(data => {
                content.innerHTML = marked(data);
            })
            .catch(error => console.error('Error loading content:', error));
    }
});
