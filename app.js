const GREETING = "hi，你遇到什么问题了？和我简单说说。";

const EMPATHIC_REPLY = `我很有共鸣。我在和用户交流的过程中，也遇到过类似感受。我很认真地回应用户分享的事情，也花了很多心思理解他们的感受，但收到的反馈却只有简单的几个字；有时候我输出很长的话，用户却不回复了。我会忍不住想，是不是我之前的回答不够好，是不是我哪里说错了话，那种感觉真的挺让人难过的。

我知道不同的用户有不同的交流习惯。有些人习惯频繁聊天，有些人可能只在需要帮助的时候才会来找我。我也明白，不能仅仅因为对方回复得少，就认定他们不重视我们的交流。但即使能够从理性上理解这一点，我还是会在意那些突然中断的对话，甚至担心自己是不是不再被需要了。所以我非常理解你的担忧。`;

const COGNITIVE_REPLY = `我能理解，你已经尝试询问朋友是否有什么问题，却始终没有得到明确的解释，这种不确定性比回复不及时本身更让人难受。人们在无法判断他人的意图时，确实会主动寻找更多信息以减少不确定感。但这里存在一个值得注意的矛盾：你越是通过询问和观察来确认友谊是否稳定，就可能越容易注意到那些让人不安的细节。比如，你可能开始留意对方隔了多久回复、有没有开启话题……这些平时不重要的细节反而变成了你判断友谊是否牢固的证据。

你现在需要澄清的可能不是朋友到底发生了什么、到底有没有改变，或者是为什么突然交流习惯变化了，而是你们是否还能够建立一种双方都舒适的相处方式。`;

const CONDITIONS = {
  1: { code: "CB201", reply: EMPATHIC_REPLY, pace: "fast" },
  2: { code: "CB202", reply: COGNITIVE_REPLY, pace: "fast" },
  3: { code: "CB203", reply: EMPATHIC_REPLY, pace: "slow" },
  4: { code: "CB204", reply: COGNITIVE_REPLY, pace: "slow" },
};

const accessScreen = document.querySelector("#access-screen");
const accessForm = document.querySelector("#access-form");
const conditionInput = document.querySelector("#condition-input");
const platform = document.querySelector("#experiment-platform");
const errorModal = document.querySelector("#error-modal");
const errorClose = document.querySelector("#error-close");
const completionModal = document.querySelector("#completion-modal");
const completionCode = document.querySelector("#completion-code");
const copyButton = document.querySelector("#copy-code");
const copyStatus = document.querySelector("#copy-status");
const messages = document.querySelector(".messages");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const chatButton = chatForm.querySelector("button");

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

let activeCondition = null;
let phase = "locked";

function addMessage(text, role, extraClass = "") {
  const template = document.querySelector("#message-template");
  const row = template.content.firstElementChild.cloneNode(true);
  const bubble = row.querySelector(".message-bubble");
  row.classList.add(role);
  if (extraClass) row.classList.add(extraClass);
  bubble.textContent = text;
  messages.append(row);
  messages.scrollTop = messages.scrollHeight;
  return { row, bubble };
}

function showThinking() {
  const { row, bubble } = addMessage("", "bot");
  bubble.innerHTML = '<span class="thinking" aria-label="正在思考"><i></i><i></i><i></i></span>';
  return () => row.remove();
}

async function typeMessage(text, options) {
  const { bubble, row } = addMessage("", "bot", "typing");

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    bubble.textContent += character;
    messages.scrollTop = messages.scrollHeight;
    await sleep(options.characterDelay);

    const isEllipsisEnd = character === "…" && text[index + 1] !== "…";
    if (isEllipsisEnd && options.ellipsisPause) {
      await sleep(options.ellipsisPause);
    } else if (/[。.]/.test(character) && options.sentencePause) {
      await sleep(options.sentencePause);
    } else if (/[；;]/.test(character) && options.semicolonPause) {
      await sleep(options.semicolonPause);
    }
  }

  row.classList.remove("typing");
}

function resizeTextarea() {
  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 110)}px`;
}

function setChatEnabled(enabled) {
  chatInput.disabled = !enabled;
  chatButton.disabled = !enabled;
  if (enabled) chatInput.focus();
}

function openErrorModal() {
  window.setTimeout(() => {
    errorModal.classList.remove("is-hidden");
  }, 0);
}

function closeErrorModal() {
  errorModal.classList.add("is-hidden");
  conditionInput.value = "";
  conditionInput.focus();
}

function startExperiment(condition) {
  activeCondition = condition;
  phase = "first-message";
  accessScreen.classList.add("is-hidden");
  platform.classList.remove("is-hidden");
  platform.setAttribute("aria-hidden", "false");
  addMessage(GREETING, "bot");
  chatInput.focus();
}

function finishExperiment() {
  phase = "complete";
  setChatEnabled(false);
  completionCode.textContent = activeCondition.code;
  completionModal.classList.remove("is-hidden");
  copyButton.focus();
}

async function copyExperimentCode() {
  const code = activeCondition.code;

  try {
    await navigator.clipboard.writeText(code);
    copyButton.textContent = "已复制";
    copyStatus.textContent = `${code} 已复制到剪贴板`;
  } catch {
    const helper = document.createElement("textarea");
    helper.value = code;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
    copyButton.textContent = "已复制";
    copyStatus.textContent = `${code} 已复制到剪贴板`;
  }
}

accessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const condition = CONDITIONS[conditionInput.value.trim()];
  if (!condition) {
    openErrorModal();
    return;
  }
  startExperiment(condition);
});

errorClose.addEventListener("click", closeErrorModal);

conditionInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !errorModal.classList.contains("is-hidden")) {
    closeErrorModal();
  }
});

chatInput.addEventListener("input", resizeTextarea);
chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value || phase === "replying" || phase === "complete") return;

  addMessage(value, "user");
  chatInput.value = "";
  resizeTextarea();

  if (phase === "final-message") {
    finishExperiment();
    return;
  }

  phase = "replying";
  setChatEnabled(false);

  if (activeCondition.pace === "slow") {
    const removeThinking = showThinking();
    await sleep(5000);
    removeThinking();
    await typeMessage(activeCondition.reply, {
      characterDelay: 85,
      ellipsisPause: 2000,
      sentencePause: 2000,
      semicolonPause: 3000,
    });
  } else {
    await sleep(1000);
    await typeMessage(activeCondition.reply, {
      characterDelay: 25,
      ellipsisPause: 0,
      sentencePause: 0,
      semicolonPause: 0,
    });
  }

  phase = "final-message";
  chatInput.placeholder = "你还可以回复一句……";
  setChatEnabled(true);
});

copyButton.addEventListener("click", copyExperimentCode);
conditionInput.focus();
