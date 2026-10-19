const API = "/api";
const postForm = document.getElementById("postForm");
const postText = document.getElementById("postText");
const postList = document.getElementById("postList");

let posts = [];
let comments = JSON.parse(localStorage.getItem("littleloopComments") || "{}");
let following = JSON.parse(localStorage.getItem("littleloopFollowing") || "[]");

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

function makeButton(label) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.style.marginRight = "8px";
  return button;
}

function displayPosts() {
  postList.innerHTML = "";

  posts.forEach(function (post) {
    const card = document.createElement("article");
    card.className = "post";

    const author = document.createElement("strong");
    author.textContent = post.name;

    const message = document.createElement("p");
    message.textContent = post.message;

    const likeButton = makeButton(
      (post.liked ? "♥ " : "♡ ") + (post.likes || 0) + " Like"
    );

    likeButton.addEventListener("click", async function () {
      try {
        const result = await request(`${API}/posts/${post.id}/like`, {
          method: "POST"
        });

        post.likes = result.likes;
        post.liked = result.liked;
        displayPosts();
      } catch (error) {
        alert(error.message);
      }
    });

    const commentList = document.createElement("div");
    const savedComments = comments[post.id] || [];

    savedComments.forEach(function (comment) {
      const commentText = document.createElement("p");
      commentText.textContent = comment;
      commentList.append(commentText);
    });

    const commentForm = document.createElement("form");
    const commentInput = document.createElement("input");
    commentInput.placeholder = "Write a comment";
    commentInput.required = true;

    const commentButton = document.createElement("button");
    commentButton.textContent = "Comment";

    commentForm.append(commentInput, commentButton);

    commentForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const text = commentInput.value.trim();
      if (!text) return;

      try {
        await request(`${API}/posts/${post.id}/comments`, {
          method: "POST",
          body: JSON.stringify({ message: text })
        });

        comments[post.id] = comments[post.id] || [];
        comments[post.id].push("You: " + text);
        localStorage.setItem("littleloopComments", JSON.stringify(comments));
        displayPosts();
      } catch (error) {
        alert(error.message);
      }
    });

    card.append(author, message, likeButton, commentList, commentForm);
    postList.append(card);
  });
}

async function loadPosts() {
  posts = await request(`${API}/posts`);

  if (posts.length === 0) {
    const sampleMessages = [
      "A little reminder: take things one step at a time. 🌱",
      "Found a lovely new coffee spot this morning ☕"
    ];

    for (const message of sampleMessages) {
      await request(`${API}/posts`, {
        method: "POST",
        body: JSON.stringify({ message: message })
      });
    }

    posts = await request(`${API}/posts`);
  }

  displayPosts();
}

postForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const message = postText.value.trim();
  if (!message) return;

  try {
    await request(`${API}/posts`, {
      method: "POST",
      body: JSON.stringify({ message: message })
    });

    postText.value = "";
    await loadPosts();
  } catch (error) {
    alert(error.message);
  }
});

async function loadPeople() {
  const samplePeople = [
    { name: "Maya Patel", username: "mayapatel" },
    { name: "Jordan Lee", username: "jordanlee" },
    { name: "Sofia Reyes", username: "sofiarey" }
  ];

  for (const person of samplePeople) {
    try {
      await request(`${API}/users`, {
        method: "POST",
        body: JSON.stringify(person)
      });
    } catch (error) {
      // Username already exists, so continue.
    }
  }

  const users = await request(`${API}/users`);
  const people = users.filter(function (user) {
    return user.id !== 1;
  });

  const section = document.createElement("section");
  section.className = "card";
  section.innerHTML = "<h2>People to follow</h2>";

  people.forEach(function (person) {
    const row = document.createElement("p");
    const label = document.createElement("span");
    label.textContent = person.name + " ";

    const button = makeButton(
      following.includes(person.id) ? "Following" : "Follow"
    );

    button.addEventListener("click", async function () {
      try {
        const result = await request(
          `${API}/users/${person.id}/follow`,
          { method: "POST" }
        );

        if (result.following) {
          following.push(person.id);
          button.textContent = "Following";
        } else {
          following = following.filter(function (id) {
            return id !== person.id;
          });
          button.textContent = "Follow";
        }

        localStorage.setItem(
          "littleloopFollowing",
          JSON.stringify(following)
        );
      } catch (error) {
        alert(error.message);
      }
    });

    row.append(label, button);
    section.append(row);
  });

  document.querySelector("main").append(section);
}

async function startApp() {
  try {
    await loadPosts();
    await loadPeople();
  } catch (error) {
    alert("Backend start aagilla. Terminal alli npm start maadi.");
  }
}

startApp();