const API = "/api";

const postForm = document.getElementById("postForm");
const postText = document.getElementById("postText");
const postList = document.getElementById("postList");

let posts = [];
let profile = null;
let peopleSection;

let likedPosts = JSON.parse(
  localStorage.getItem("littleloopLikedPosts") || "[]"
);

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

// Creates the profile form and adds it to the page.
async function loadProfile() {
  profile = await request(`${API}/users/1`);

  let profileSection = document.getElementById("profileSection");

  if (!profileSection) {
    profileSection = document.createElement("section");
    profileSection.id = "profileSection";
    profileSection.className = "composer";
    document.querySelector("main").prepend(profileSection);
  }

  profileSection.innerHTML = `
    <h2>Your Profile</h2>
    <form id="profileForm">
      <input
        id="profileName"
        type="text"
        placeholder="Your name"
        required
      >
      <input
        id="profileUsername"
        type="text"
        placeholder="Your username"
        required
      >
      <button type="submit">Save Profile</button>
    </form>
  `;

  document.getElementById("profileName").value = profile.name;
  document.getElementById("profileUsername").value = profile.username;

  document
    .getElementById("profileForm")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      const name = document.getElementById("profileName").value.trim();
      const username = document
        .getElementById("profileUsername")
        .value.trim();

      try {
        profile = await request(`${API}/users/1`, {
          method: "PUT",
          body: JSON.stringify({ name, username })
        });

        alert("Profile saved!");
        await loadPosts();
      } catch (error) {
        alert(error.message);
      }
    });
}

function makeButton(label) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  return button;
}

// Displays posts and their database comments.
function displayPosts() {
  postList.innerHTML = "";

  posts.forEach(function (post) {
    const card = document.createElement("article");
    card.className = "post";

    const author = document.createElement("strong");
    author.textContent = post.name + "  @" + post.username;

    const message = document.createElement("p");
    message.textContent = post.message;

    const isLiked = likedPosts.includes(post.id);
    const likeButton = makeButton(
      (isLiked ? "♥ " : "♡ ") + post.likes + " Like"
    );

    likeButton.addEventListener("click", async function () {
      try {
        const result = await request(`${API}/posts/${post.id}/like`, {
          method: "POST"
        });

        if (result.liked && !likedPosts.includes(post.id)) {
          likedPosts.push(post.id);
        } else if (!result.liked) {
          likedPosts = likedPosts.filter(id => id !== post.id);
        }

        localStorage.setItem(
          "littleloopLikedPosts",
          JSON.stringify(likedPosts)
        );

        await loadPosts();
      } catch (error) {
        alert(error.message);
      }
    });

    const commentsArea = document.createElement("div");

    post.comments.forEach(function (comment) {
      const commentLine = document.createElement("p");
      commentLine.textContent =
        comment.name + " @" + comment.username + ": " + comment.message;
      commentsArea.append(commentLine);
    });

    const commentForm = document.createElement("form");
    const commentInput = document.createElement("input");
    commentInput.type = "text";
    commentInput.placeholder = "Write a comment";
    commentInput.required = true;

    const commentButton = document.createElement("button");
    commentButton.type = "submit";
    commentButton.textContent = "Comment";

    commentForm.append(commentInput, commentButton);

    commentForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      try {
        await request(`${API}/posts/${post.id}/comments`, {
          method: "POST",
          body: JSON.stringify({ message: commentInput.value.trim() })
        });

        await loadPosts();
      } catch (error) {
        alert(error.message);
      }
    });

    card.append(author, message, likeButton, commentsArea, commentForm);
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
        body: JSON.stringify({ message })
      });
    }

    posts = await request(`${API}/posts`);
  }

  displayPosts();
}

// Creates demo users and displays follow buttons.
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
      // If this username already exists, continue to the next user.
    }
  }

  const users = await request(`${API}/users`);
  const otherUsers = users.filter(user => user.id !== 1);

  peopleSection = document.createElement("section");
  peopleSection.className = "feed";
  peopleSection.innerHTML = "<h2>People to Follow</h2>";

  otherUsers.forEach(function (person) {
    const row = document.createElement("p");
    const name = document.createElement("span");
    name.textContent = person.name + "  @" + person.username + " ";

    const followButton = makeButton(
      person.following ? "Following" : "Follow"
    );

    followButton.addEventListener("click", async function () {
      try {
        const result = await request(
          `${API}/users/${person.id}/follow`,
          { method: "POST" }
        );

        followButton.textContent = result.following
          ? "Following"
          : "Follow";
      } catch (error) {
        alert(error.message);
      }
    });

    row.append(name, followButton);
    peopleSection.append(row);
  });

  document.querySelector("main").append(peopleSection);
}

// Saves a new post to the database.
postForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const message = postText.value.trim();
  if (!message) return;

  try {
    await request(`${API}/posts`, {
      method: "POST",
      body: JSON.stringify({ message })
    });

    postText.value = "";
    await loadPosts();
  } catch (error) {
    alert(error.message);
  }
});

async function startApp() {
  try {
    await loadProfile();
    await loadPosts();
    await loadPeople();
  } catch (error) {
    alert("Check whether the server is running. Error: " + error.message);
  }
}

startApp();