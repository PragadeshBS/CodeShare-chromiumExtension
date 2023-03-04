const serverUrl = "https://extension-iota.vercel.app";
// const serverUrl = "http://localhost:4000";
var timer = document.getElementById("timer");
var totalSeconds = 1200;

function setTime() {
  --totalSeconds;
  timer.textContent =
    pad(parseInt(totalSeconds / 60)) + ":" + pad(totalSeconds % 60);
}

function pad(val) {
  var valString = val + "";
  if (valString.length < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
}

// paste text from clipboard to textarea on click
const content = document.getElementById("content");
content.addEventListener("click", function () {
  // if content is already present, do not paste from clipboard
  if (content.value === "") {
    var t = document.createElement("input");
    document.body.appendChild(t);
    t.focus();
    document.execCommand("paste");
    content.value = t.value;
    document.body.removeChild(t);
  }
});

const sendBtn = document.getElementById("send-btn");
const receiveBtn = document.getElementById("receive-btn");
const copyBtn = document.getElementById("copy-btn");

// sha-256 hashing function
async function sha256(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

// action to be performed on clicking the send button
sendBtn.addEventListener("click", async () => {
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  // Generate a random 3-letter string
  let cid = "";
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * letters.length);
    cid += letters[randomIndex];
  }

  // trim the textarea content to remove any extra spaces
  const cnote = document.getElementById("content").value.trim();

  // check if password was entered
  let hash = "";
  const password = document.getElementById("send-password").value.trim();
  if (password !== "") {
    hash = await sha256(cid + password);
  }
  const data = { id: cid, note: cnote, hash };
  fetch(serverUrl + "/setnote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((response) => {
      const codeBlk = document.getElementById("code-blk");
      content.classList.add("d-none");
      codeBlk.classList.remove("d-none");
      document.getElementById("code").textContent = cid.toString();
      const intervalId = setInterval(setTime, 1000);
      setTimeout(() => {
        clearInterval(intervalId);
        content.classList.remove("d-none");
        codeBlk.classList.add("d-none");
      }, 1200000);
      response.json();
    })
    .catch((error) => console.error(error));
});

// action to be performed on clicking the receive button
receiveBtn.addEventListener("click", async () => {
  // trim the input to remove any extra spaces
  const reqnum = document.getElementById("reqnum").value.trim();
  const receivePassword = document.getElementById("rec-password").value.trim();
  const invalidCodeDiv = document.getElementById("invalid-code");
  let hash = "";
  if (receivePassword !== "") {
    hash = await sha256(reqnum + receivePassword);
  }
  fetch(serverUrl + `/getnote/${reqnum}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error == "No note found") {
        invalidCodeDiv.classList.remove("d-none");
        return;
      }
      copyBtn.classList.remove("d-none");
      invalidCodeDiv.classList.add("d-none");
      content.value = data.note.note;
    })
    .catch((error) => console.log(error));
});

//copy button action
copyBtn.addEventListener("click", () => {
  navigator.clipboard
    .writeText(document.getElementById("content").value)
    .then(() => {
      copyBtn.style.background = "url('./assets/check-solid.svg') no-repeat";
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
});
