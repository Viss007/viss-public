(function () {
  const branchEl = document.getElementById("demo-nurture-branch");
  const nameEl = document.getElementById("demo-nurture-name");
  const defaultBranch = "attended";
  const defaultFirstName = "Jordan";
  const btnRun = document.getElementById("demo-nurture-run");
  const btnReset = document.getElementById("demo-nurture-reset");
  const listEl = document.getElementById("demo-nurture-timeline");
  const summaryEl = document.getElementById("demo-nurture-summary");

  let running = false;
  let cancelToken = 0;

  function buildSteps(branch, firstName) {
    const n = firstName.trim() || "there";
    if (branch === "noshow") {
      return [
        { when: "Day 0", channel: "Email", text: `Hi ${n} — missed you at the live session. Here's the replay link + one-page summary.` },
        { when: "Day 3", channel: "Email", text: `Quick case study (${n}): how a similar team cut onboarding time in half.` },
        { when: "Day 7", channel: "Email", text: `${n}, still interested? Book a 15-min fit call — calendar link inside.` },
      ];
    }
    return [
      { when: "Day 0", channel: "Email", text: `Thanks for attending, ${n} — slides and recording are attached.` },
      { when: "Day 2", channel: "Email", text: `${n}, here's the checklist we mentioned on the call.` },
      { when: "Day 5", channel: "Email", text: `Book a strategy call — we held a few slots for webinar attendees.` },
      { when: "Day 10", channel: "SMS", text: `Hi ${n}, last nudge from me — reply YES if you want the calendar link again.` },
    ];
  }

  function renderIdle() {
    if (!listEl || !summaryEl) return;
    listEl.innerHTML = "";
    summaryEl.textContent = 'Press "Simulate sequence" to preview the touch timeline.';
    summaryEl.classList.remove("is-live");
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  async function run() {
    if (!listEl || !summaryEl || running) return;
    const token = ++cancelToken;
    running = true;
    btnRun.disabled = true;
    btnReset.disabled = true;
    summaryEl.textContent = "Running…";
    summaryEl.classList.remove("is-live");

    const steps = buildSteps(
      branchEl ? branchEl.value : defaultBranch,
      nameEl ? nameEl.value : defaultFirstName
    );
    listEl.innerHTML = steps
      .map(function (_, i) {
        return (
          '<li class="is-pending" data-step="' +
          i +
          '"><span class="demo-nurture__status" aria-hidden="true"></span><span class="demo-nurture__when"></span><span class="demo-nurture__ch"></span><span class="demo-nurture__copy"></span></li>'
        );
      })
      .join("");

    for (let i = 0; i < steps.length; i++) {
      if (token !== cancelToken) return;
      const li = listEl.querySelector('[data-step="' + i + '"]');
      const st = steps[i];
      if (li) {
        li.classList.remove("is-pending");
        li.classList.add("is-active");
        li.querySelector(".demo-nurture__when").textContent = st.when;
        li.querySelector(".demo-nurture__ch").textContent = st.channel;
        li.querySelector(".demo-nurture__copy").textContent = st.text;
      }
      await delay(420);
      if (token !== cancelToken) return;
      if (li) {
        li.classList.remove("is-active");
        li.classList.add("is-done");
      }
    }

    if (token !== cancelToken) return;
    summaryEl.innerHTML =
      '<strong>Sequence complete.</strong> In a real system: CRM marks touches, pauses on reply or booking, and notifies sales with full thread context — all client-side rules here are illustrative.';
    summaryEl.classList.add("is-live");
    running = false;
    btnRun.disabled = false;
    btnReset.disabled = false;
  }

  function reset() {
    cancelToken++;
    running = false;
    if (btnRun) btnRun.disabled = false;
    if (btnReset) btnReset.disabled = false;
    renderIdle();
  }

  btnRun?.addEventListener("click", run);
  btnReset?.addEventListener("click", reset);
  renderIdle();
})();
