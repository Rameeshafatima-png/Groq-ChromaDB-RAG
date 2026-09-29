// ======================================================
// RAGFLOW FRONTEND
// ======================================================

const API = {

    // Empty means same FastAPI server
    base:
        localStorage.getItem("rag_api_url") || "",

    ingest:
        "/ingest",

    query:
        "/rag/query",

    health:
        "/health"
};


// ======================================================
// HELPERS
// ======================================================

const $ = selector =>
    document.querySelector(selector);


const $$ = selector =>
    document.querySelectorAll(selector);


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function showToast(message) {

    const toast =
        $("#toast");

    toast.textContent =
        message;

    toast.classList.add("show");

    clearTimeout(
        window.toastTimer
    );

    window.toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3000);
}


function formatBytes(bytes) {

    if (!bytes)
        return "0 B";

    const units =
        ["B", "KB", "MB", "GB"];

    let index = 0;

    while (
        bytes >= 1024 &&
        index < units.length - 1
    ) {

        bytes /= 1024;

        index++;
    }

    return (
        bytes.toFixed(index ? 1 : 0)
        + " "
        + units[index]
    );
}


// ======================================================
// NAVIGATION
// ======================================================

$$(".nav-item").forEach(button => {

    button.addEventListener(
        "click",
        () => {

            showPage(
                button.dataset.page
            );

        }
    );

});


$$("[data-page-button]").forEach(button => {

    button.addEventListener(
        "click",
        () => {

            showPage(
                button.dataset.pageButton
            );

        }
    );

});


function showPage(page) {

    $$(".page").forEach(section => {

        section.classList.remove(
            "active-page"
        );

    });


    const target =
        $("#" + page);

    if (target) {

        target.classList.add(
            "active-page"
        );

    }


    $$(".nav-item").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === page
        );

    });


    if (page === "documents") {

        renderDocuments();

    }

}


// ======================================================
// DARK MODE
// ======================================================

$("#themeButton")
    .addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark"
            );

            localStorage.setItem(
                "rag_dark",
                document.body.classList.contains(
                    "dark"
                )
            );

        }
    );


if (
    localStorage.getItem(
        "rag_dark"
    ) === "true"
) {

    document.body.classList.add(
        "dark"
    );

}


// ======================================================
// FILE UPLOAD
// ======================================================

const fileInput =
    $("#fileInput");

const dropzone =
    $("#dropzone");


let selectedFiles = [];


$("#browseButton")
    .addEventListener(
        "click",
        event => {

            event.stopPropagation();

            fileInput.click();

        }
    );


$("#uploadHero")
    .addEventListener(
        "click",
        () => fileInput.click()
    );


$("#uploadDocuments")
    .addEventListener(
        "click",
        () => fileInput.click()
    );


dropzone
    .addEventListener(
        "click",
        () => fileInput.click()
    );


fileInput
    .addEventListener(
        "change",
        event => {

            addFiles(
                [...event.target.files]
            );

        }
    );


dropzone.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

        dropzone.style.borderColor =
            "#5b5ce2";

    }
);


dropzone.addEventListener(
    "dragleave",
    () => {

        dropzone.style.borderColor =
            "";

    }
);


dropzone.addEventListener(
    "drop",
    event => {

        event.preventDefault();

        dropzone.style.borderColor =
            "";

        addFiles(
            [...event.dataTransfer.files]
        );

    }
);


function addFiles(files) {

    selectedFiles = [
        ...selectedFiles,
        ...files
    ];


    // Remove duplicates

    selectedFiles =
        selectedFiles.filter(
            (file, index, array) =>

                array.findIndex(
                    item =>
                        item.name === file.name &&
                        item.size === file.size
                ) === index
        );


    renderFiles();

    updateStats();

}


function renderFiles() {

    const list =
        $("#fileList");


    list.innerHTML =
        selectedFiles.map(
            (file, index) => `

                <div class="file">

                    <span>
                        ▤
                        ${escapeHTML(file.name)}
                    </span>

                    <button
                        onclick="removeFile(${index})"
                    >
                        ×
                    </button>

                </div>

            `
        ).join("");

}


window.removeFile =
    function(index) {

        selectedFiles.splice(
            index,
            1
        );

        renderFiles();

        updateStats();

    };


// ======================================================
// STATS
// ======================================================

function updateStats() {

    $("#documentCount")
        .textContent =
        selectedFiles.length;

}


// ======================================================
// INGEST
// ======================================================

$("#ingestButton")
    .addEventListener(
        "click",
        ingestDocuments
    );


async function ingestDocuments() {

    if (
        selectedFiles.length === 0
    ) {

        showToast(
            "Please select a document first."
        );

        return;

    }


    $("#statusText")
        .textContent =
        "Indexing...";


    const formData =
        new FormData();


    selectedFiles.forEach(
        file => {

            formData.append(
                "files",
                file
            );

        }
    );


    try {

        const response =
            await fetch(
                API.base +
                API.ingest,
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Ingestion failed."
            );

        }


        $("#chunkCount")
            .textContent =
            data.chunks ?? "—";


        $("#databaseChunks")
            .textContent =
            `${data.chunks ?? 0} chunks`;


        $("#statusText")
            .textContent =
            "Indexed";


        showToast(
            "Documents indexed successfully."
        );


    }
    catch (error) {

        console.error(error);

        $("#statusText")
            .textContent =
            "Error";


        showToast(
            error.message ||
            "Could not connect to API."
        );

    }

}


// ======================================================
// ASK RAG
// ======================================================

$("#askButton")
    .addEventListener(
        "click",
        askMainQuestion
    );


$("#question")
    .addEventListener(
        "keydown",
        event => {

            if (
                event.ctrlKey &&
                event.key === "Enter"
            ) {

                askMainQuestion();

            }

        }
    );


async function askMainQuestion() {

    const question =
        $("#question")
            .value
            .trim();


    if (!question) {

        showToast(
            "Please enter a question."
        );

        return;

    }


    const answer =
        $("#answer");


    answer.innerHTML = `

        <div class="empty">

            <div>
                ◌
            </div>

            <strong>
                Searching your knowledge base...
            </strong>

            <span>
                Retrieving relevant ChromaDB chunks.
            </span>

        </div>

    `;


    try {

        const result =
            await sendQuestion(
                question
            );


        renderAnswer(
            answer,
            result
        );


    }
    catch (error) {

        answer.innerHTML = `

            <div class="message ai">

                <strong>
                    Error
                </strong>

                <br><br>

                ${escapeHTML(
                    error.message
                )}

            </div>

        `;

    }

}


// ======================================================
// API QUERY
// ======================================================

async function sendQuestion(
    question
) {

    const response =
        await fetch(
            API.base +
            API.query,
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    question:
                        question,

                    top_k:
                        5,

                    source:
                        null

                })

            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        let message =
            "RAG request failed.";


        if (
            typeof data.detail ===
            "string"
        ) {

            message =
                data.detail;

        }


        throw new Error(
            message
        );

    }


    return data;

}


// ======================================================
// ANSWER RENDER
// ======================================================

function renderAnswer(
    container,
    data
) {

    const answer =
        data.answer ??
        data.response ??
        data.result ??
        data.message ??
        JSON.stringify(data);


    let sources = "";


    if (data.sources) {

        sources = `

            <div
                style="
                    margin-top:12px;
                    color:var(--muted);
                    font-size:9px;
                "
            >

                Sources:
                ${escapeHTML(
                    JSON.stringify(
                        data.sources
                    )
                )}

            </div>

        `;

    }


    container.innerHTML = `

        <div
            class="message ai"
            style="max-width:100%"
        >

            ${escapeHTML(
                answer
            ).replaceAll(
                "\n",
                "<br>"
            )}

            ${sources}

        </div>

    `;

}


// ======================================================
// CHAT PAGE
// ======================================================

$("#chatSend")
    .addEventListener(
        "click",
        sendChatMessage
    );


async function sendChatMessage() {

    const input =
        $("#chatQuestion");


    const question =
        input.value.trim();


    if (!question) {

        showToast(
            "Please type a question."
        );

        return;

    }


    const messages =
        $("#chatMessages");


    const empty =
        messages.querySelector(
            ".chat-empty"
        );


    if (empty)
        empty.remove();


    messages.innerHTML += `

        <div class="message user">

            ${escapeHTML(question)}

        </div>

    `;


    input.value = "";


    const aiMessage =
        document.createElement(
            "div"
        );


    aiMessage.className =
        "message ai";


    aiMessage.innerHTML =
        "Searching ChromaDB...";


    messages.appendChild(
        aiMessage
    );


    messages.scrollTop =
        messages.scrollHeight;


    try {

        const data =
            await sendQuestion(
                question
            );


        const answer =
            data.answer ??
            data.response ??
            data.result ??
            data.message ??
            JSON.stringify(data);


        aiMessage.innerHTML =
            escapeHTML(
                answer
            ).replaceAll(
                "\n",
                "<br>"
            );


    }
    catch (error) {

        aiMessage.innerHTML =
            `<strong>Error:</strong><br>
             ${escapeHTML(
                 error.message
             )}`;

    }


    messages.scrollTop =
        messages.scrollHeight;

}


// ======================================================
// DOCUMENT TABLE
// ======================================================

function renderDocuments() {

    const table =
        $("#documentsTable");


    if (
        selectedFiles.length === 0
    ) {

        table.innerHTML = `

            <div
                style="
                    padding:50px;
                    text-align:center;
                    color:var(--muted);
                    font-size:11px;
                "
            >

                No documents selected.

                <br><br>

                Click
                <strong>
                    Add documents
                </strong>
                to upload files.

            </div>

        `;

        return;

    }


    table.innerHTML = `

        <div class="document-row document-header">

            <span>
                Name
            </span>

            <span>
                Type
            </span>

            <span>
                Size
            </span>

            <span>
                Status
            </span>

        </div>


        ${
            selectedFiles
                .map(
                    file => `

                    <div
                        class="document-row"
                    >

                        <span>
                            ▤
                            ${escapeHTML(
                                file.name
                            )}
                        </span>

                        <span>
                            ${escapeHTML(
                                file.type ||
                                "Document"
                            )}
                        </span>

                        <span>
                            ${formatBytes(
                                file.size
                            )}
                        </span>

                        <span>
                            Ready
                        </span>

                    </div>

                    `
                )
                .join("")
        }

    `;

}


// ======================================================
// SETTINGS
// ======================================================

$("#apiUrl").value =
    localStorage.getItem(
        "rag_api_url"
    ) || "";


$("#saveApi")
    .addEventListener(
        "click",
        () => {

            const value =
                $("#apiUrl")
                    .value
                    .trim()
                    .replace(
                        /\/$/,
                        ""
                    );


            localStorage.setItem(
                "rag_api_url",
                value
            );


            API.base =
                value;


            showToast(
                "API URL saved."
            );

        }
    );


$("#testApi")
    .addEventListener(
        "click",
        testAPI
    );


async function testAPI() {

    const status =
        $("#connectionStatus");


    status.textContent =
        "Testing...";


    try {

        const response =
            await fetch(
                API.base +
                API.health
            );


        const data =
            await response.json();


        if (!response.ok)
            throw new Error(
                "API error"
            );


        status.textContent =
            `Connected · ${data.indexed_chunks ?? 0} chunks`;


        $("#chunkCount")
            .textContent =
            data.indexed_chunks ?? 0;


        $("#databaseChunks")
            .textContent =
            `${data.indexed_chunks ?? 0} chunks`;


        showToast(
            "API connected successfully."
        );


    }
    catch (error) {

        status.textContent =
            "Connection failed";


        showToast(
            "Could not connect to FastAPI."
        );

    }

}


// ======================================================
// INITIALIZE
// ======================================================

renderFiles();

renderDocuments();

testAPI();