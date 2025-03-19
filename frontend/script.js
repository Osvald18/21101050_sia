const GRAPHQL_URL = "http://localhost:4002/graphql";
const WS_URL = "ws://localhost:4002/graphql";


document.addEventListener("DOMContentLoaded", () => {
    loadPosts();
    setupSubscription();

    document.getElementById("postForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const title = document.getElementById("title").value;
        const content = document.getElementById("content").value;
        const authorId = parseInt(document.getElementById("authorId").value);

        await fetch(GRAPHQL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: `mutation {
                    createPost(title: "${title}", content: "${content}", authorId: ${authorId}) {
                        id
                        title
                        content
                        authorId
                    }
                }`,
            }),
        });

        document.getElementById("postForm").reset();
    });
});

async function loadPosts() {
    const response = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query: `query { posts { id title content authorId } }`,
        }),
    });

    const { data } = await response.json();
    updateTable(data.posts);
}

function updateTable(posts) {
    const postsTable = document.getElementById("postsTable");
    postsTable.innerHTML = "";

    posts.forEach((post) => {
        const row = `<tr>
            <td>${post.id}</td>
            <td>${post.title}</td>
            <td>${post.content}</td>
            <td>${post.authorId}</td>
        </tr>`;
        postsTable.innerHTML += row;
    });
}


function setupSubscription() {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: "start",
            id: "1",
            payload: {
                query: `subscription { postAdded { id title content authorId } }`,
            },
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "data") {
            const newPost = data.payload.data.postAdded;
            const currentPosts = [...document.querySelectorAll("#postsTable tr")].map(row => ({
                id: row.children[0].textContent,
                title: row.children[1].textContent,
                content: row.children[2].textContent,
                authorId: row.children[3].textContent
            }));

            currentPosts.push(newPost);
            updateTable(currentPosts);
        }
    };
}
