let supabase;
let session;
let profile;
let colaboradores = [];
let attendance = {};
let currentPage = "dashboard";

document.addEventListener("DOMContentLoaded", iniciar);

async function iniciar() {

    supabase = window.supabaseClient;

    if (!supabase) {
        alert("Supabase nÃ£o inicializado.");
        return;
    }

    const result = await supabase.auth.getSession();

    session = result.data.session;

    if (!session) {
        window.location.href = "index.html";
        return;
    }

    const profileResult = await supabase
        .from("profiles")
        .select("id,nome,perfil,ativo")
        .eq("id", session.user.id)
        .single();

    if (profileResult.error || !profileResult.data) {

        await supabase.auth.signOut();

        alert(
            "Seu usuÃ¡rio nÃ£o possui um perfil no sistema."
        );

        window.location.href = "index.html";
        return;
    }

    profile = profileResult.data;

    if (!profile.ativo) {

        await supabase.auth.signOut();

        alert("Seu usuÃ¡rio estÃ¡ inativo.");

        window.location.href = "index.html";
        return;
    }

    document.getElementById("sideName").textContent =
        profile.nome;

    document.getElementById("welcomeName").textContent =
        profile.nome;

    document.getElementById("sideProfile").textContent =
        profile.perfil === "admin"
            ? "Administrador"
            : "VisualizaÃ§Ã£o";

    if (profile.perfil !== "admin") {
        document
            .querySelectorAll(".admin-only")
            .forEach(el => {
                el.classList.add("disabled-admin");
            });
    }

    document.getElementById("todayText").textContent =
        formatDate(localISO());

    configurarNavegacao();
    configurarEventos();

    await carregarColaboradores();
    await carregarDashboard();

    configurarDatas();

    mostrarPagina("dashboard");
}


function isAdmin() {
    return profile?.perfil === "admin";
}


function localISO(date = new Date()) {

    const y = date.getFullYear();

    const m = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const d = String(
        date.getDate()
    ).padStart(2, "0");

    return `${y}-${m}-${d}`;
}


function formatDate(value) {

    if (!value) return "";

    const [y, m, d] = value.split("-");

    return `${d}/${m}/${y}`;
}


function configurarNavegacao() {

    document
        .querySelectorAll("[data-page]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const page = button.dataset.page;

                if (
                    page === "usuarios" &&
                    !isAdmin()
                ) {
                    return;
                }

                mostrarPagina(page);

            });

        });

}


function mostrarPagina(page) {

    currentPage = page;

    document
        .querySelectorAll(".page")
        .forEach(el => {
            el.classList.add("hidden");
        });

    const target =
        document.getElementById(`page-${page}`);

    if (target) {
        target.classList.remove("hidden");
    }

    document
        .querySelectorAll(".nav")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.page === page
            );
        });

    const titles = {
        dashboard: "Dashboard",
        chamada: "Caderno de Chamada",
        colaboradores: "Colaboradores",
        almoco: "Lista de AlmoÃ§o",
        relatorios: "RelatÃ³rios",
        usuarios: "UsuÃ¡rios"
    };

    document.getElementById("pageTitle").textContent =
        titles[page] || "Controle de PresenÃ§a";

    if (page === "dashboard") {
        carregarDashboard();
    }

    if (page === "chamada") {
        carregarChamada();
    }

    if (page === "colaboradores") {
        renderColaboradores();
    }

    if (page === "almoco") {
        carregarAlmoco();
    }

    if (page === "relatorios") {
        carregarFiltrosRelatorio();
    }

    if (page === "usuarios") {
        carregarUsuarios();
    }

}


function configurarEventos() {

    document
        .getElementById("logoutButton")
        .addEventListener("click", async () => {

            await supabase.auth.signOut();

            window.location.href = "index.html";

        });


    document
        .getElementById("newColaborador")
        .addEventListener("click", () => {

            if (!isAdmin()) return;

            abrirModal();

        });


    document
        .getElementById("closeModal")
        .addEventListener(
            "click",
            fecharModal
        );


    document
        .getElementById("colaboradorForm")
        .addEventListener(
            "submit",
            salvarColaborador
        );


    document
        .getElementById("searchColaborador")
        .addEventListener(
            "input",
            renderColaboradores
        );


    document
        .getElementById("chamadaDate")
        .addEventListener(
            "change",
            carregarChamada
        );


    document
        .getElementById("saveChamada")
        .addEventListener(
            "click",
            salvarChamada
        );


    document
        .getElementById("marcarManha")
        .addEventListener(
            "click",
            () => marcarPeriodo("manha")
        );


    document
        .getElementById("marcarTarde")
        .addEventListener(
            "click",
            () => marcarPeriodo("tarde")
        );


    document
        .getElementById("marcarHoraExtra")
        .addEventListener(
            "click",
            () => marcarPeriodo("hora_extra")
        );


    document
        .getElementById("almocoDate")
        .addEventListener(
            "change",
            carregarAlmoco
        );


    document
        .getElementById("saveAlmoco")
        .addEventListener(
            "click",
            salvarAlmoco
        );


    document
        .getElementById("generateReport")
        .addEventListener(
            "click",
            gerarRelatorio
        );


    document
        .getElementById("printReport")
        .addEventListener(
            "click",
            imprimirRelatorio
        );


    document
        .getElementById("mobileMenu")
        .addEventListener(
            "click",
            () => {
                document
                    .querySelector(".sidebar")
                    .classList.toggle("mobile-open");
            }
        );

}


function configurarDatas() {

    const hoje = localISO();

    document.getElementById("chamadaDate").value =
        hoje;

    document.getElementById("almocoDate").value =
        hoje;

    document.getElementById("reportStart").value =
        hoje;

    document.getElementById("reportEnd").value =
        hoje;

}


async function carregarColaboradores() {

    const result = await supabase
        .from("colaboradores")
        .select(
            "id,nome,matricula,setor,ativo"
        )
        .order("nome");

    if (result.error) {

        console.error(result.error);

        alert(
            "Erro ao carregar colaboradores."
        );

        return;
    }

    colaboradores = result.data || [];

}


function renderColaboradores() {

    const body =
        document.getElementById(
            "colaboradoresBody"
        );

    const search =
        document
            .getElementById(
                "searchColaborador"
            )
            .value
            .trim()
            .toLowerCase();

    const filtered =
        colaboradores.filter(c => {

            return (
                c.nome.toLowerCase().includes(search) ||
                c.matricula.toLowerCase().includes(search) ||
                (c.setor || "")
                    .toLowerCase()
                    .includes(search)
            );

        });


    body.innerHTML = filtered.map(c => `

        <tr>

            <td>
                <strong>${escapeHtml(c.nome)}</strong>
            </td>

            <td>
                ${escapeHtml(c.matricula)}
            </td>

            <td>
                ${escapeHtml(c.setor || "-")}
            </td>

            <td>
                <span class="badge ${
                    c.ativo
                        ? "success"
                        : "danger"
                }">
                    ${
                        c.ativo
                            ? "Ativo"
                            : "Inativo"
                    }
                </span>
            </td>

            <td class="admin-only">

                ${
                    isAdmin()
                        ? `
                        <button
                            class="small-button"
                            onclick="editarColaborador(${c.id})"
                        >
                            Editar
                        </button>
                        `
                        : ""
                }

            </td>

        </tr>

    `).join("");

}


function abrirModal(colaborador = null) {

    const modal =
        document.getElementById("modal");

    document.getElementById("modalTitle").textContent =
        colaborador
            ? "Editar colaborador"
            : "Novo colaborador";

    document.getElementById("colaboradorId").value =
        colaborador?.id || "";

    document.getElementById("colaboradorNome").value =
        colaborador?.nome || "";

    document.getElementById("colaboradorMatricula").value =
        colaborador?.matricula || "";

    document.getElementById("colaboradorSetor").value =
        colaborador?.setor || "";

    document.getElementById("colaboradorAtivo").checked =
        colaborador
            ? colaborador.ativo
            : true;

    document.getElementById("modalMessage").className =
        "message";

    modal.classList.remove("hidden");

}


function fecharModal() {

    document
        .getElementById("modal")
        .classList.add("hidden");

}


window.editarColaborador = function(id) {

    if (!isAdmin()) return;

    const colaborador =
        colaboradores.find(
            c => c.id === id
        );

    if (colaborador) {
        abrirModal(colaborador);
    }

};


async function salvarColaborador(event) {

    event.preventDefault();

    if (!isAdmin()) return;

    const id =
        document.getElementById(
            "colaboradorId"
        ).value;

    const nome =
        document.getElementById(
            "colaboradorNome"
        ).value.trim();

    const matricula =
        document.getElementById(
            "colaboradorMatricula"
        ).value.trim();

    const setor =
        document.getElementById(
            "colaboradorSetor"
        ).value.trim();

    const ativo =
        document.getElementById(
            "colaboradorAtivo"
        ).checked;


    if (!nome || !matricula) {

        mostrarModalMensagem(
            "Nome e matrÃ­cula sÃ£o obrigatÃ³rios."
        );

        return;
    }


    const payload = {
        nome,
        matricula,
        setor: setor || null,
        ativo
    };


    let result;

    if (id) {

        result = await supabase
            .from("colaboradores")
            .update(payload)
            .eq("id", id);

    } else {

        result = await supabase
            .from("colaboradores")
            .insert(payload);

    }


    if (result.error) {

        console.error(result.error);

        mostrarModalMensagem(
            result.error.message.includes("unique")
                ? "Esta matrÃ­cula jÃ¡ estÃ¡ cadastrada."
                : result.error.message
        );

        return;
    }


    fecharModal();

    await carregarColaboradores();

    renderColaboradores();

    await carregarDashboard();

}


function mostrarModalMensagem(texto) {

    const element =
        document.getElementById(
            "modalMessage"
        );

    element.textContent = texto;
    element.className =
        "message show error";

}


async function carregarChamada() {

    const date =
        document.getElementById(
            "chamadaDate"
        ).value;

    if (!date) return;

    const ativos =
        colaboradores.filter(
            c => c.ativo
        );


    const result =
        await supabase
            .from("presencas")
            .select(
                "id,colaborador_id,data,periodo,presente"
            )
            .eq(
                "data",
                date
            );


    if (result.error) {

        console.error(result.error);

        mostrarChamadaMensagem(
            "Erro ao carregar a chamada."
        );

        return;
    }


    attendance = {};


    ativos.forEach(c => {

        attendance[c.id] = {
            manha: false,
            tarde: false,
            hora_extra: false
        };

    });


    (result.data || []).forEach(row => {

        if (!attendance[row.colaborador_id]) {
            attendance[row.colaborador_id] = {
                manha: false,
                tarde: false,
                hora_extra: false
            };
        }

        attendance[row.colaborador_id][
            row.periodo
        ] = row.presente;

    });


    const body =
        document.getElementById(
            "chamadaBody"
        );


    body.innerHTML =
        ativos.map(c => `

        <tr>

            <td>
                <strong>${escapeHtml(c.nome)}</strong>
                <small>${escapeHtml(c.matricula)}</small>
            </td>

            <td class="check-cell">
                <input
                    type="checkbox"
                    data-colaborador="${c.id}"
                    data-periodo="manha"
                    ${attendance[c.id].manha ? "checked" : ""}
                    ${!isAdmin() ? "disabled" : ""}
                >
            </td>

            <td class="check-cell">
                <input
                    type="checkbox"
                    data-colaborador="${c.id}"
                    data-periodo="tarde"
                    ${attendance[c.id].tarde ? "checked" : ""}
                    ${!isAdmin() ? "disabled" : ""}
                >
            </td>

            <td class="check-cell">
                <input
                    type="checkbox"
                    data-colaborador="${c.id}"
                    data-periodo="hora_extra"
                    ${attendance[c.id].hora_extra ? "checked" : ""}
                    ${!isAdmin() ? "disabled" : ""}
                >
            </td>

        </tr>

    `).join("");


    body
        .querySelectorAll("input[type=checkbox]")
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    const id =
                        Number(
                            input.dataset.colaborador
                        );

                    const periodo =
                        input.dataset.periodo;

                    attendance[id][periodo] =
                        input.checked;

                }
            );

        });

}


async function salvarChamada() {

    if (!isAdmin()) return;

    const date =
        document.getElementById(
            "chamadaDate"
        ).value;

    if (!date) return;


    const registros = [];


    Object.entries(attendance)
        .forEach(([id, periods]) => {

            registros.push(
                {
                    colaborador_id: Number(id),
                    data: date,
                    periodo: "manha",
                    presente: periods.manha,
                    registrado_por: session.user.id
                },
                {
                    colaborador_id: Number(id),
                    data: date,
                    periodo: "tarde",
                    presente: periods.tarde,
                    registrado_por: session.user.id
                },
                {
                    colaborador_id: Number(id),
                    data: date,
                    periodo: "hora_extra",
                    presente: periods.hora_extra,
                    registrado_por: session.user.id
                }
            );

        });


    if (!registros.length) {

        mostrarChamadaMensagem(
            "NÃ£o existem colaboradores ativos."
        );

        return;
    }


    const result =
        await supabase
            .from("presencas")
            .upsert(
                registros,
                {
                    onConflict:
                        "colaborador_id,data,periodo"
                }
            );


    if (result.error) {

        console.error(result.error);

        mostrarChamadaMensagem(
            result.error.message
        );

        return;
    }


    mostrarChamadaMensagem(
        "Chamada salva com sucesso.",
        "success"
    );

    await carregarDashboard();

}


function marcarPeriodo(periodo) {

    if (!isAdmin()) return;

    Object.keys(attendance)
        .forEach(id => {

            attendance[id][periodo] =
                true;

        });


    document
        .querySelectorAll(
            `input[data-periodo="${periodo}"]`
        )
        .forEach(input => {
            input.checked = true;
        });

}


function mostrarChamadaMensagem(
    texto,
    type = "error"
) {

    const element =
        document.getElementById(
            "chamadaMessage"
        );

    element.textContent = texto;

    element.className =
        `message show ${type}`;

}


async function carregarAlmoco() {

    const date =
        document.getElementById(
            "almocoDate"
        ).value;

    if (!date) return;


    const presentes =
        await buscarPresentesManha(date);


    const extrasResult =
        await supabase
            .from("almocos")
            .select(
                "id,colaborador_id,quantidade_extra,observacao"
            )
            .eq(
                "data",
                date
            );


    if (extrasResult.error) {

        console.error(extrasResult.error);

        return;
    }


    const extras = {};

    (extrasResult.data || [])
        .forEach(row => {

            extras[row.colaborador_id] =
                row;

        });


    const body =
        document.getElementById(
            "almocoBody"
        );


    body.innerHTML =
        presentes.map(c => {

            const row =
                extras[c.id] || {};

            return `

                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(c.nome)}
                        </strong>
                    </td>

                    <td>
                        <span class="badge success">
                            1
                        </span>
                    </td>

                    <td>

                        <input
                            class="extra-input"
                            type="number"
                            min="0"
                            value="${row.quantidade_extra || 0}"
                            data-colaborador="${c.id}"
                            ${!isAdmin() ? "disabled" : ""}
                        >

                    </td>

                    <td>

                        <input
                            class="obs-input"
                            value="${escapeAttribute(
                                row.observacao || ""
                            )}"
                            data-colaborador="${c.id}"
                            ${!isAdmin() ? "disabled" : ""}
                        >

                    </td>

                </tr>

            `;

        }).join("");


    atualizarTotaisAlmoco();


    body
        .querySelectorAll(
            ".extra-input"
        )
        .forEach(input => {

            input.addEventListener(
                "input",
                atualizarTotaisAlmoco
            );

        });

}


async function buscarPresentesManha(date) {

    const result =
        await supabase
            .from("presencas")
            .select("colaborador_id")
            .eq("data", date)
            .eq("periodo", "manha")
            .eq("presente", true);


    if (result.error) {

        console.error(result.error);

        return [];
    }


    const ids =
        new Set(
            (result.data || [])
                .map(
                    row => row.colaborador_id
                )
        );


    return colaboradores.filter(
        c =>
            c.ativo &&
            ids.has(c.id)
    );

}


function atualizarTotaisAlmoco() {

    const extras =
        [...document.querySelectorAll(
            ".extra-input"
        )]
        .reduce(
            (
                total,
                input
            ) =>
                total +
                Math.max(
                    0,
                    Number(input.value) || 0
                ),
            0
        );


    const normais =
        document.querySelectorAll(
            "#almocoBody tr"
        ).length;


    document.getElementById(
        "almocoNormais"
    ).textContent = normais;

    document.getElementById(
        "almocoExtras"
    ).textContent = extras;

    document.getElementById(
        "almocoTotal"
    ).textContent =
        normais + extras;

}


async function salvarAlmoco() {

    if (!isAdmin()) return;

    const date =
        document.getElementById(
            "almocoDate"
        ).value;


    const presentes =
        await buscarPresentesManha(date);


    const rows = [];


    presentes.forEach(c => {

        const extra =
            document.querySelector(
                `.extra-input[data-colaborador="${c.id}"]`
            );

        const obs =
            document.querySelector(
                `.obs-input[data-colaborador="${c.id}"]`
            );


        rows.push({
            colaborador_id: c.id,
            data: date,
            quantidade_extra:
                Math.max(
                    0,
                    Number(extra?.value) || 0
                ),
            observacao:
                obs?.value.trim() || null,
            registrado_por:
                session.user.id
        });

    });


    if (!rows.length) {

        alert(
            "NÃ£o hÃ¡ colaboradores presentes pela manhÃ£."
        );

        return;
    }


    const result =
        await supabase
            .from("almocos")
            .upsert(
                rows,
                {
                    onConflict:
                        "colaborador_id,data"
                }
            );


    if (result.error) {

        console.error(result.error);

        alert(
            result.error.message
        );

        return;
    }


    alert(
        "Lista de almoÃ§o salva com sucesso."
    );

    await carregarAlmoco();

    await carregarDashboard();

}


async function carregarDashboard() {

    const hoje =
        localISO();


    const colaboradoresResult =
        await supabase
            .from("colaboradores")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "ativo",
                true
            );


    document.getElementById(
        "statColaboradores"
    ).textContent =
        colaboradoresResult.count || 0;


    const presenceResult =
        await supabase
            .from("presencas")
            .select(
                "presente"
            )
            .eq(
                "data",
                hoje
            )
            .eq(
                "periodo",
                "manha"
            );


    const rows =
        presenceResult.data || [];


    const presentes =
        rows.filter(
            r => r.presente
        ).length;


    const faltas =
        rows.filter(
            r => !r.presente
        ).length;


    document.getElementById(
        "statPresentes"
    ).textContent =
        presentes;


    document.getElementById(
        "statFaltas"
    ).textContent =
        faltas;


    const almocoResult =
        await supabase
            .from("almocos")
            .select(
                "quantidade_extra"
            )
            .eq(
                "data",
                hoje
            );


    const almocos =
        almocoResult.data || [];


    const totalAlmoco =
        almocos.length +
        almocos.reduce(
            (
                total,
                row
            ) =>
                total +
                Number(
                    row.quantidade_extra || 0
                ),
            0
        );


    document.getElementById(
        "statAlmocos"
    ).textContent =
        totalAlmoco;

}


async function carregarFiltrosRelatorio() {

    const select =
        document.getElementById(
            "reportCollaborator"
        );


    const current =
        select.value;


    select.innerHTML =
        '<option value="">Todos</option>' +
        colaboradores.map(c => `
            <option value="${c.id}">
                ${escapeHtml(c.nome)}
            </option>
        `).join("");


    select.value = current;

}


async function gerarRelatorio() {

    const inicio =
        document.getElementById(
            "reportStart"
        ).value;

    const fim =
        document.getElementById(
            "reportEnd"
        ).value;

    const colaboradorId =
        document.getElementById(
            "reportCollaborator"
        ).value;


    if (!inicio || !fim) {

        alert(
            "Informe o perÃ­odo."
        );

        return;
    }


    if (inicio > fim) {

        alert(
            "A data inicial nÃ£o pode ser maior que a final."
        );

        return;
    }


    let query =
        supabase
            .from("presencas")
            .select(
                "colaborador_id,data,periodo,presente"
            )
            .gte(
                "data",
                inicio
            )
            .lte(
                "data",
                fim
            );


    if (colaboradorId) {

        query =
            query.eq(
                "colaborador_id",
                Number(colaboradorId)
            );

    }


    const result =
        await query;


    if (result.error) {

        console.error(result.error);

        alert(
            result.error.message
        );

        return;
    }


    const rows =
        result.data || [];


    const byPerson = {};


    rows.forEach(row => {

        if (!byPerson[row.colaborador_id]) {

            byPerson[row.colaborador_id] = {
                manha: {
                    presente: 0,
                    falta: 0
                },
                tarde: {
                    presente: 0,
                    falta: 0
                },
                hora_extra: {
                    presente: 0,
                    falta: 0
                }
            };

        }


        const target =
            byPerson[
                row.colaborador_id
            ][row.periodo];


        if (row.presente) {
            target.presente++;
        } else {
            target.falta++;
        }

    });


    const selectedPeople =
        colaboradores.filter(c => {

            if (!colaboradorId) {
                return true;
            }

            return c.id ===
                Number(colaboradorId);

        });


    const html = `

        <div class="report-print">

            <h1>
                FÃBRICA
            </h1>

            <h2>
                RELATÃ“RIO DE PRESENÃ‡A
            </h2>

            <p>
                PerÃ­odo:
                <strong>
                    ${formatDate(inicio)}
                    atÃ©
                    ${formatDate(fim)}
                </strong>
            </p>

            <table>

                <thead>

                    <tr>
                        <th>Colaborador</th>
                        <th>ManhÃ£<br>Pres.</th>
                        <th>ManhÃ£<br>Faltas</th>
                        <th>Tarde<br>Pres.</th>
                        <th>Tarde<br>Faltas</th>
                        <th>HE<br>Pres.</th>
                        <th>HE<br>Faltas</th>
                    </tr>

                </thead>

                <tbody>

                    ${
                        selectedPeople.map(c => {

                            const data =
                                byPerson[c.id] || {
                                    manha: {
                                        presente: 0,
                                        falta: 0
                                    },
                                    tarde: {
                                        presente: 0,
                                        falta: 0
                                    },
                                    hora_extra: {
                                        presente: 0,
                                        falta: 0
                                    }
                                };


                            return `

                                <tr>

                                    <td>
                                        ${escapeHtml(c.nome)}
                                    </td>

                                    <td>
                                        ${data.manha.presente}
                                    </td>

                                    <td>
                                        ${data.manha.falta}
                                    </td>

                                    <td>
                                        ${data.tarde.presente}
                                    </td>

                                    <td>
                                        ${data.tarde.falta}
                                    </td>

                                    <td>
                                        ${data.hora_extra.presente}
                                    </td>

                                    <td>
                                        ${data.hora_extra.falta}
                                    </td>

                                </tr>

                            `;

                        }).join("")

                    }

                </tbody>

            </table>

            <p class="report-footer">
                RelatÃ³rio gerado em
                ${new Date().toLocaleString("pt-BR")}
            </p>

        </div>

    `;


    document.getElementById(
        "reportContent"
    ).innerHTML = html;


    document.getElementById(
        "reportResult"
    ).classList.remove(
        "hidden"
    );

}


function imprimirRelatorio() {

    window.print();

}


async function carregarUsuarios() {

    if (!isAdmin()) return;


    const result =
        await supabase
            .from("profiles")
            .select(
                "nome,perfil,ativo,created_at"
            )
            .order("nome");


    if (result.error) {

        console.error(result.error);

        return;
    }


    const body =
        document.getElementById(
            "usuariosBody"
        );


    body.innerHTML =
        (result.data || [])
            .map(user => `

                <tr>

                    <td>
                        ${escapeHtml(user.nome)}
                    </td>

                    <td>
                        ${
                            user.perfil === "admin"
                                ? "Administrador"
                                : "VisualizaÃ§Ã£o"
                        }
                    </td>

                    <td>

                        <span class="badge ${
                            user.ativo
                                ? "success"
                                : "danger"
                        }">

                            ${
                                user.ativo
                                    ? "Ativo"
                                    : "Inativo"
                            }

                        </span>

                    </td>

                    <td>
                        ${new Date(
                            user.created_at
                        ).toLocaleString("pt-BR")}
                    </td>

                </tr>

            `)
            .join("");

}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

    return escapeHtml(value);

}
