
// ================= CONFIGURATION API =================
const API_BASE = "http://127.0.0.1:8000";
// ===================================================

const $ = (selector) => document.querySelector(selector);

const fmt = (n) =>
  n == null || n === ""
    ? "—"
    : Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 });

const fmtMoney = (n) =>
  n == null || n === ""
    ? "—"
    : Number(n).toLocaleString("fr-FR", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }) + " €";

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

let current = null;
let tab = "cours";
let chart = null;
let societiesCache = [];

// API

async function api(path, opts = {}) {
  const r = await fetch(API_BASE + path, {
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail || `Erreur API (${r.status})`);
  }

  return r.status === 204 ? null : r.json();
}

// SOCIÉTÉS

async function loadSocietes() {
  const list = await api("/societes");
  societiesCache = list;

  $("#societe-count").textContent = list.length;

  $("#societes").innerHTML = list.map((s) => {
    const active = current?.id_societe === s.id_societe;
    const symbol = escapeHTML(s.symbole_boursier || "?");

    return `
      <li data-id="${s.id_societe}" class="${active ? "active" : ""}">
        <div class="company-symbol">${symbol.slice(0, 3)}</div>
        <div class="company-list-info">
          <strong>${escapeHTML(s.nom)}</strong>
          <small>${symbol}</small>
        </div>
      </li>
    `;
  }).join("");

  document.querySelectorAll("#societes li").forEach((li) => {
    li.onclick = () => {
      const s = list.find((item) => item.id_societe == li.dataset.id);
      if (s) select(s);
    };
  });

  return list;
}

async function select(s) {
  current = s;
  await loadSocietes();
  await renderDetail();
}

// AFFICHAGE FICHE

async function renderDetail() {
  if (!current) return;

  const s = current;
  const detail = $("#detail");

  detail.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⏳</div>
      <h3>Chargement des données</h3>
      <p>Récupération des cours et bilans...</p>
    </div>
  `;

  try {
    const [bilans, cours] = await Promise.all([
      api(`/societes/${s.id_societe}/bilans`),
      api(`/societes/${s.id_societe}/cours`)
    ]);

    // Tri chronologique des cours
    cours.sort((a, b) =>
      new Date(a.date_cours) - new Date(b.date_cours)
    );

    // Tri chronologique des bilans
    bilans.sort((a, b) => a.annee - b.annee);

    const last = cours.at(-1);
    const prev = cours.at(-2);
    const lastBilan = bilans.at(-1);

    const delta = last && prev && Number(prev.cours_cloture) !== 0
      ? (Number(last.cours_cloture) / Number(prev.cours_cloture) - 1) * 100
      : null;

    const deltaClass = delta == null
      ? "neutral"
      : delta >= 0 ? "positive" : "negative";

    const deltaText = delta == null
      ? "Pas assez de données"
      : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)} % vs précédent`;

    const ticker = escapeHTML(s.symbole_boursier || "");
    const companyName = escapeHTML(s.nom || "");
    const initials = ticker.slice(0, 3) || companyName.slice(0, 2).toUpperCase();

    detail.innerHTML = `
      <div class="company-head">
        <div class="company-identity">
          <div class="company-logo">${initials}</div>
          <div>
            <h2>${companyName}</h2>
            <div class="company-meta">
              <span class="ticker">${ticker}</span>
              ${escapeHTML([s.secteur, s.pays].filter(Boolean).join(" · "))}
            </div>
          </div>
        </div>

        <div class="company-actions">
          <button class="edit-company-btn" id="edit">
            ✎ Modifier
          </button>
        <button class="ghost-btn" id="del">
          Supprimer la société
        </button>
      </div>
    </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Dernier cours</div>
          <div class="kpi-value">${last ? fmtMoney(last.cours_cloture) : "—"}</div>
          <div class="kpi-foot ${deltaClass}">${deltaText}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Chiffre d'affaires</div>
          <div class="kpi-value">${lastBilan ? fmtMoney(lastBilan.chiffre_affaires) : "—"}</div>
          <div class="kpi-foot">${lastBilan ? "Exercice " + lastBilan.annee : "Aucun bilan"}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Résultat net</div>
          <div class="kpi-value ${lastBilan?.resultat_net >= 0 ? "positive" : "negative"}">
            ${lastBilan ? fmtMoney(lastBilan.resultat_net) : "—"}
          </div>
          <div class="kpi-foot">Dernier exercice enregistré</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Données enregistrées</div>
          <div class="kpi-value">${cours.length + bilans.length}</div>
          <div class="kpi-foot">${cours.length} cours · ${bilans.length} bilans</div>
        </div>
      </div>

      <div class="tabs">
        <button data-t="cours" class="${tab === "cours" ? "on" : ""}">📈 Cours boursiers</button>
        <button data-t="bilans" class="${tab === "bilans" ? "on" : ""}">📑 Bilans financiers</button>
      </div>

      <div id="pane-cours" class="${tab === "cours" ? "" : "hidden"}">
        <div class="chart-card">
          <div class="panel-heading">
            <div>
              <h3>Évolution du cours</h3>
              <p>Historique des prix de clôture</p>
            </div>
          </div>
          <div class="chart-box">
            <canvas id="chart-cours"></canvas>
          </div>
        </div>

        <div class="form-section">
          <h3>Ajouter un cours</h3>
          <p>Enregistrez un cours de clôture et son volume pour une date donnée.</p>
          <form class="inline" id="form-cours">
            <label>Date du cours
              <input type="date" name="date_cours" required>
            </label>
            <label>Cours de clôture (€)
              <input type="number" step="any" name="cours_cloture" placeholder="0.00" required>
            </label>
            <label>Volume
              <input type="number" name="volume" placeholder="Volume échangé">
            </label>
            <button>Enregistrer le cours</button>
          </form>
          <div class="err" id="err-cours"></div>
        </div>
      </div>

      <div id="pane-bilans" class="${tab === "bilans" ? "" : "hidden"}">
        ${bilans.length ? `
          <div class="chart-card">
            <div class="panel-heading">
              <div>
                <h3>Performance financière</h3>
                <p>Chiffre d'affaires et résultat net par exercice</p>
              </div>
            </div>
            <div class="chart-box">
              <canvas id="chart-bilans"></canvas>
            </div>
          </div>

          <div class="scroll" style="margin-top:18px">
            <table>
              <thead>
                <tr>
                  <th>Année</th>
                  <th>CA</th>
                  <th>Résultat net</th>
                  <th>Actifs courants</th>
                  <th>Passifs courants</th>
                  <th>Dettes totales</th>
                  <th>Capitaux propres</th>
                  <th>Total actifs</th>
                </tr>
              </thead>
              <tbody>
                ${bilans.map(b => `
                  <tr>
                    <td><span class="year-badge">${b.annee}</span></td>
                    <td>${fmtMoney(b.chiffre_affaires)}</td>
                    <td class="${b.resultat_net >= 0 ? "positive" : "negative"}">${fmtMoney(b.resultat_net)}</td>
                    <td>${fmtMoney(b.actifs_courants)}</td>
                    <td>${fmtMoney(b.passifs_courants)}</td>
                    <td>${fmtMoney(b.dettes_totales)}</td>
                    <td>${fmtMoney(b.capitaux_propres)}</td>
                    <td>${fmtMoney(b.total_actifs)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-icon">📑</div>
            <h3>Aucun bilan disponible</h3>
            <p>Ajoutez un bilan pour commencer votre analyse financière.</p>
          </div>
        `}

        <div class="form-section">
          <h3>Ajouter un bilan financier</h3>
          <p>Renseignez les principaux indicateurs financiers d'un exercice.</p>

          <form class="inline" id="form-bilan">
            <label>Année
              <input type="number" name="annee" min="1900" max="2100" placeholder="2025" required>
            </label>
            <label>Chiffre d'affaires
              <input type="number" step="any" name="chiffre_affaires" placeholder="CA">
            </label>
            <label>Résultat net
              <input type="number" step="any" name="resultat_net" placeholder="Résultat">
            </label>
            <label>Actifs courants
              <input type="number" step="any" name="actifs_courants">
            </label>
            <label>Passifs courants
              <input type="number" step="any" name="passifs_courants">
            </label>
            <label>Dettes totales
              <input type="number" step="any" name="dettes_totales">
            </label>
            <label>Capitaux propres
              <input type="number" step="any" name="capitaux_propres">
            </label>
            <label>Total actifs
              <input type="number" step="any" name="total_actifs">
            </label>
            <button>Enregistrer le bilan</button>
          </form>
          <div class="err" id="err-bilan"></div>
        </div>
      </div>
    `;

    // Tabs
    document.querySelectorAll(".tabs button").forEach((b) => {
      b.onclick = () => {
        tab = b.dataset.t;
        renderDetail();
      };
    });

    // Suppression
    $("#edit").onclick = () => openModal("edit", s);
    // $("#del").onclick = async () => {
    //   // Préremplir le formulaire avec les informations de la société
    //   const form = $("#form-societe");

    //   form.nom.value = s.nom;
    //   form.symbole_boursier.value = s.symbole_boursier;
    //   form.secteur.value = s.secteur || "";
    //   form.pays.value = s.pays || "";

    //   // Indiquer au formulaire qu'il est en mode modification
    //   form.dataset.mode = "edit";
    //   form.dataset.id = s.id_societe;

    //   // Modifier le titre et le texte du bouton
    //   $("#modal-title").textContent = "Modifier une société";
    //   $("#submit-company").textContent = "Enregistrer les modifications";

    //   // Afficher le modal
    //   $("#company-modal").classList.remove("hidden");
    // };

    bindForm(
      "#form-cours",
      "#err-cours",
      `/societes/${s.id_societe}/cours`
    );

    bindForm(
      "#form-bilan",
      "#err-bilan",
      `/societes/${s.id_societe}/bilans`
    );

    drawCharts(cours, bilans);

  } catch (err) {
    detail.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Impossible de charger les données</h3>
        <p>${escapeHTML(err.message)}</p>
        <button class="primary-btn" id="retry">Réessayer</button>
      </div>
    `;

    $("#retry").onclick = renderDetail;
  }
}

// GRAPHIQUES

function drawCharts(cours, bilans) {
  if (chart) {
    chart.destroy();
    chart = null;
  }

  const accent = "#5577f7";
  const green = "#16a673";
  const muted = "#8a94a6";

  if (tab === "cours") {
    const canvas = $("#chart-cours");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, "rgba(85,119,247,.20)");
    gradient.addColorStop(1, "rgba(85,119,247,0)");

    chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: cours.map(c => c.date_cours),
        datasets: [{
          label: "Cours de clôture",
          data: cours.map(c => c.cours_cloture),
          borderColor: accent,
          backgroundColor: gradient,
          fill: true,
          borderWidth: 2.5,
          pointRadius: cours.length > 30 ? 0 : 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "#fff",
          pointBorderColor: accent,
          pointBorderWidth: 2,
          tension: .35,
        }]
      },
      options: {
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#182338",
            padding: 12,
            cornerRadius: 9,
            displayColors: false,
            callbacks: {
              label: (context) =>
                `Cours : ${fmtMoney(context.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 7,
              color: muted,
              font: { size: 10 },
            },
            border: { display: false }
          },
          y: {
            grid: { color: "#f0f2f7" },
            ticks: {
              color: muted,
              font: { size: 10 },
              callback: (value) => fmt(value)
            },
            border: { display: false }
          }
        }
      }
    });
  }

  if (tab === "bilans" && bilans.length) {
    const canvas = $("#chart-bilans");
    if (!canvas) return;

    chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: bilans.map(b => b.annee),
        datasets: [
          {
            label: "Chiffre d'affaires",
            data: bilans.map(b => b.chiffre_affaires),
            backgroundColor: "rgba(85,119,247,.82)",
            borderRadius: 5,
            maxBarThickness: 28,
          },
          {
            label: "Résultat net",
            data: bilans.map(b => b.resultat_net),
            backgroundColor: "rgba(22,166,115,.82)",
            borderRadius: 5,
            maxBarThickness: 28,
          }
        ]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            align: "start",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 8,
              color: muted,
              font: { size: 11 }
            }
          },
          tooltip: {
            backgroundColor: "#182338",
            padding: 12,
            cornerRadius: 9,
            callbacks: {
              label: (context) =>
                `${context.dataset.label} : ${fmtMoney(context.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: muted },
            border: { display: false }
          },
          y: {
            grid: { color: "#f0f2f7" },
            ticks: {
              color: muted,
              callback: (value) => fmt(value)
            },
            border: { display: false }
          }
        }
      }
    });
  }
}

// FORMULAIRES COURS & BILANS

function bindForm(formSel, errSel, path) {
  const f = $(formSel);
  if (!f) return;

  f.onsubmit = async (e) => {
    e.preventDefault();

    const body = {};

    new FormData(f).forEach((v, k) => {
      if (v !== "") {
        body[k] = f.elements[k].type === "number"
          ? Number(v)
          : v;
      }
    });

    const submitButton = f.querySelector('button[type="submit"], button:not([type])');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enregistrement...";
    }

    try {
      await api(path, { method: "POST", body });
      await renderDetail();
    } catch (err) {
      const errorEl = $(errSel);
      if (errorEl) errorEl.textContent = err.message;
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  };
}

// MODAL AJOUT SOCIÉTÉ

const modal = $("#company-modal");

// function openModal() {
//   modal.classList.remove("hidden");
//   $("#form-societe").elements.nom.focus();
// }
function openModal(mode = "add", s = null) {
  const form = $("#form-societe");
  form.reset();
  $("#err-societe").textContent = "";

  if (mode === "edit" && s) {
    form.nom.value = s.nom;
    form.symbole_boursier.value = s.symbole_boursier;
    form.secteur.value = s.secteur || "";
    form.pays.value = s.pays || "";
    form.dataset.mode = "edit";
    form.dataset.id = s.id_societe;
    $("#modal-title").textContent = "Modifier une société";
    $("#submit-company").textContent = "Enregistrer les modifications";
  } else {
    form.dataset.mode = "add";
    delete form.dataset.id;
    $("#modal-title").textContent = "Ajouter une société";
    $("#submit-company").textContent = "Ajouter la société";
  }

  modal.classList.remove("hidden");
  form.elements.nom.focus();
}

function closeModal() {
  modal.classList.add("hidden");
}

// $("#btn-add-company").onclick = openModal;
// $("#open-add-company").onclick = openModal;
$("#close-modal").onclick = closeModal;
$("#cancel-modal").onclick = closeModal;

modal.onclick = (e) => {
  if (e.target === modal) closeModal();
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// FORMULAIRE SOCIÉTÉ

$("#form-societe").onsubmit = async (e) => {
  e.preventDefault();

  const form = e.target;
  const body = Object.fromEntries(new FormData(form));

  const mode = form.dataset.mode || "add";
  const id = form.dataset.id;

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent =
    mode === "edit" ? "Modification..." : "Ajout...";

  try {
    const s = await api(
      mode === "edit" ? `/societes/${id}` : "/societes",
      {
        method: mode === "edit" ? "PUT" : "POST",
        body
      }
    );

    form.reset();
    form.dataset.mode = "add";
    delete form.dataset.id;

    $("#err-societe").textContent = "";
    closeModal();

    tab = "cours";
    await select(s);

    const list = await loadSocietes();
  } catch (err) {
    $("#err-societe").textContent = err.message;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = form.dataset.mode === "edit"
      ? "Enregistrer les modifications"
      : "Ajouter la société";
  }
};

// INITIALISATION

async function init() {
  try {
    const list = await loadSocietes();

    if (list.length) {
      await select(list[0]);
    }
  } catch (err) {
    $("#detail").innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Connexion à l'API impossible</h3>
        <p>${escapeHTML(err.message)}</p>
        <p>Vérifiez que FastAPI est démarré et que API_BASE est correct.</p>
      </div>
    `;
  }
}

init();
