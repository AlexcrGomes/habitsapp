// ===== Constantes =====

const OLD_STORAGE_KEY = "NLWSetup@habits"
const STORAGE_KEY = "habits@v2"
const MAX_ACTIVE = 10
const MAX_NAME = 30

// Hábitos da versão anterior, usados só na migração dos dados antigos
const DEFAULT_HABITS = [
    { id: "run", name: "Corrida", emoji: "🏃" },
    { id: "water", name: "Água", emoji: "💧" },
    { id: "food", name: "Alimentação", emoji: "🍎" },
    { id: "journal", name: "Leitura", emoji: "📚" },
    { id: "takePills", name: "Remédios", emoji: "💊" },
]

// ===== Estado e persistência =====

function emptyState() {
    return { version: 2, habits: [], days: [], checks: {} }
}

// undefined = chave inexistente; null = conteúdo inválido
function readJSON(key) {
    const raw = localStorage.getItem(key)
    if (raw === null) return undefined

    try {
        return JSON.parse(raw)
    } catch (error) {
        console.error(`Dados inválidos em "${key}"`, error)
        return null
    }
}

function migrate(oldData) {
    const checks = {}
    const days = new Set()

    for (const habit of DEFAULT_HABITS) {
        const dates = Array.isArray(oldData[habit.id]) ? oldData[habit.id] : []
        checks[habit.id] = [...dates]
        dates.forEach(date => days.add(date))
    }

    return {
        version: 2,
        habits: DEFAULT_HABITS.map(habit => ({ ...habit, archived: false })),
        days: [...days].sort(),
        checks,
    }
}

function loadState() {
    const current = readJSON(STORAGE_KEY)
    if (current && current.version === 2) return current

    const old = readJSON(OLD_STORAGE_KEY)
    if (old && typeof old === "object") {
        const migrated = migrate(old)
        // Nunca altera a chave antiga; só grava a nova se ela não existir com conteúdo inválido
        if (current === undefined) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
        return migrated
    }

    return emptyState()
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

let state = loadState()

// ===== Regras =====

function activeHabits() {
    return state.habits.filter(habit => !habit.archived)
}

function archivedHabits() {
    return state.habits.filter(habit => habit.archived)
}

function findHabit(id) {
    return state.habits.find(habit => habit.id === id)
}

function normalizeName(name) {
    return name.trim().toLocaleLowerCase("pt-BR")
}

function findByName(name, ignoreId) {
    const normalized = normalizeName(name)
    return state.habits.find(habit => habit.id !== ignoreId && normalizeName(habit.name) === normalized)
}

// Retorna { error } quando inválido; { error, archived } quando o nome é de um arquivado
function validateHabit(name, ignoreId = null) {
    const trimmed = name.trim()
    if (!trimmed) return { error: "Informe o nome do hábito." }
    if (trimmed.length > MAX_NAME) return { error: `O nome pode ter no máximo ${MAX_NAME} caracteres.` }

    const existing = findByName(trimmed, ignoreId)
    if (existing && !existing.archived) return { error: "Já existe um hábito com esse nome." }
    if (existing) return { error: "Há um hábito arquivado com esse nome.", archived: existing }

    return {}
}

// Primeiro símbolo visível do texto, preservando emojis compostos (ex.: 👩‍💻)
function firstGrapheme(text) {
    const trimmed = text.trim()
    if (!trimmed) return ""

    if (window.Intl && Intl.Segmenter) {
        const [first] = new Intl.Segmenter("pt-BR", { granularity: "grapheme" }).segment(trimmed)
        return first.segment
    }

    return Array.from(trimmed)[0]
}

function habitSymbol(habit) {
    return habit.emoji || firstGrapheme(habit.name).toLocaleUpperCase("pt-BR")
}

function newId() {
    return "h-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// Mantém o array sempre como [ativos na ordem de exibição, ...arquivados]
function setHabitOrder(active) {
    state.habits = [...active, ...archivedHabits()]
}

function createHabit(name, emoji) {
    if (activeHabits().length >= MAX_ACTIVE) return null

    const habit = { id: newId(), name: name.trim(), emoji: firstGrapheme(emoji), archived: false }
    setHabitOrder([...activeHabits(), habit])
    state.checks[habit.id] = []
    return habit
}

function updateHabit(id, name, emoji) {
    const habit = findHabit(id)
    habit.name = name.trim()
    habit.emoji = firstGrapheme(emoji)
}

function archiveHabit(id) {
    findHabit(id).archived = true
}

function restoreHabit(id) {
    const habit = findHabit(id)
    if (!habit || !habit.archived || activeHabits().length >= MAX_ACTIVE) return false

    habit.archived = false
    setHabitOrder([...activeHabits().filter(item => item !== habit), habit])
    return true
}

function deleteHabit(id) {
    state.habits = state.habits.filter(habit => habit.id !== id)
    delete state.checks[id]
}

// toIndex é a posição entre os hábitos ativos
function moveHabit(id, toIndex) {
    const active = activeHabits()
    const fromIndex = active.findIndex(habit => habit.id === id)
    if (fromIndex === -1 || toIndex < 0 || toIndex >= active.length || toIndex === fromIndex) return false

    const [habit] = active.splice(fromIndex, 1)
    active.splice(toIndex, 0, habit)
    setHabitOrder(active)
    return true
}

function todayKey() {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${month}-${day}`
}

// "MM-DD" → "DD/MM"
function formatDay(key) {
    const [month, day] = key.split("-")
    return `${day}/${month}`
}

function addDay(day) {
    if (state.days.includes(day)) return false

    state.days.push(day)
    state.days.sort()
    return true
}

function toggleCheck(habitId, day, checked) {
    const dates = new Set(state.checks[habitId] || [])
    checked ? dates.add(day) : dates.delete(day)
    state.checks[habitId] = [...dates].sort()
}

// ===== Renderização =====

const form = document.querySelector("#form-habits")
const habitsList = document.querySelector(".habits")
const habitsActions = document.querySelector(".habits-actions")
const daysContainer = document.querySelector(".days")

// Cria um elemento; atributos false/null são omitidos e true vira atributo vazio
function el(tag, attributes = {}, ...children) {
    const node = document.createElement(tag)

    for (const [name, value] of Object.entries(attributes)) {
        if (value === false || value == null) continue
        node.setAttribute(name, value === true ? "" : value)
    }

    node.append(...children)
    return node
}

function renderHabits() {
    const active = activeHabits()

    habitsList.replaceChildren(...active.map((habit, index) =>
        el("li", { class: "habit", "data-id": habit.id },
            el("span", { class: "habit-handle", title: "Arrastar para reordenar", "aria-hidden": "true" }, "⠿"),
            el("span", { class: "habit-symbol", "aria-hidden": "true" }, habitSymbol(habit)),
            el("span", { class: "habit-name", title: habit.name }, habit.name),
            el("span", { class: "habit-move" },
                el("button", {
                    type: "button",
                    "data-action": "up",
                    "aria-label": `Mover ${habit.name} para cima`,
                    disabled: index === 0,
                }, "↑"),
                el("button", {
                    type: "button",
                    "data-action": "down",
                    "aria-label": `Mover ${habit.name} para baixo`,
                    disabled: index === active.length - 1,
                }, "↓"),
            ),
            el("button", { type: "button", class: "habit-edit", "data-action": "edit", "aria-label": `Editar ${habit.name}` }, "✎"),
        )
    ))
}

function renderActions() {
    const activeCount = activeHabits().length
    const archivedCount = archivedHabits().length
    const limitReached = activeCount >= MAX_ACTIVE
    const children = []

    if (activeCount === 0) children.push(el("p", { class: "habits-empty" }, "Crie seu primeiro hábito"))

    children.push(el("button", { type: "button", "data-action": "new", disabled: limitReached },
        limitReached ? `Limite de ${MAX_ACTIVE} hábitos ativos` : "+ Novo hábito"))

    if (archivedCount > 0) {
        children.push(el("button", { type: "button", "data-action": "archived" }, `Arquivados (${archivedCount})`))
    }

    habitsActions.replaceChildren(...children)
}

function renderDays() {
    const habits = activeHabits()

    daysContainer.replaceChildren(...state.days.map(day =>
        el("div", { class: "day" },
            el("div", {}, formatDay(day)),
            ...habits.map(habit => el("input", {
                type: "checkbox",
                name: habit.id,
                value: day,
                "aria-label": `${habit.name} em ${formatDay(day)}`,
                checked: (state.checks[habit.id] || []).includes(day),
            })),
        )
    ))
}

function render() {
    renderHabits()
    renderActions()
    renderDays()
}

// Foca o primeiro seletor que existir e estiver habilitado (a renderização recria os botões)
function focusFirst(...selectors) {
    for (const selector of selectors) {
        const target = selector && document.querySelector(selector)
        if (target && !target.disabled) {
            target.focus()
            return
        }
    }
}

function habitSelector(id, action) {
    return `.habit[data-id="${CSS.escape(id)}"] [data-action="${action}"]`
}

// ===== Eventos =====

document.querySelector("#register-day").addEventListener("click", () => {
    if (!addDay(todayKey())) {
        alert("Dia já incluso ❌")
        return
    }

    alert("Adicionado com sucesso ✔")
    saveState()
    render()
})

form.addEventListener("change", event => {
    const input = event.target
    if (input.type !== "checkbox") return

    toggleCheck(input.name, input.value, input.checked)
    saveState()
})

form.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]")
    if (!button || button.disabled) return

    const id = button.closest(".habit")?.dataset.id
    const action = button.dataset.action

    if (action === "new") openHabitDialog()
    if (action === "edit") openHabitDialog(id)
    if (action === "archived") openArchivedDialog()
    if (action === "up" || action === "down") moveByButton(id, action)
})

function moveByButton(id, direction) {
    const index = activeHabits().findIndex(habit => habit.id === id)
    if (!moveHabit(id, direction === "up" ? index - 1 : index + 1)) return

    saveState()
    render()
    // Ao chegar na ponta o botão fica desabilitado; o foco passa para o outro
    focusFirst(habitSelector(id, direction), habitSelector(id, direction === "up" ? "down" : "up"))
}

// --- Diálogo de hábito (criar / editar) ---

const habitDialog = document.querySelector("#habit-dialog")
const habitForm = document.querySelector("#habit-form")
const habitDialogTitle = document.querySelector("#habit-dialog-title")
const nameInput = document.querySelector("#habit-name")
const nameCount = document.querySelector("#habit-name-count")
const emojiInput = document.querySelector("#habit-emoji")
const habitError = document.querySelector("#habit-error")
const restoreConflictButton = document.querySelector("#habit-restore")
const archiveButton = document.querySelector("#habit-archive")

let editingId = null
let conflictId = null

function openHabitDialog(id = null) {
    const habit = id ? findHabit(id) : null
    editingId = id

    habitDialogTitle.textContent = habit ? "Editar hábito" : "Novo hábito"
    nameInput.value = habit ? habit.name : ""
    emojiInput.value = habit ? habit.emoji : ""
    archiveButton.hidden = !habit
    showHabitError("")
    updateNameCount()

    habitDialog.showModal()
    nameInput.focus()
}

function showHabitError(message, archivedHabit = null) {
    habitError.textContent = message
    conflictId = archivedHabit ? archivedHabit.id : null
    // Restaurar o arquivado só é oferecido ao criar (cenário 1.6)
    restoreConflictButton.hidden = !archivedHabit || editingId !== null
}

function updateNameCount() {
    nameCount.textContent = `${nameInput.value.length}/${MAX_NAME}`
}

nameInput.addEventListener("input", updateNameCount)

habitForm.addEventListener("submit", event => {
    event.preventDefault()

    const { error, archived } = validateHabit(nameInput.value, editingId)
    if (error) {
        showHabitError(error, archived)
        nameInput.focus()
        return
    }

    if (editingId) updateHabit(editingId, nameInput.value, emojiInput.value)
    else createHabit(nameInput.value, emojiInput.value)

    saveState()
    render()
    closeHabitDialog()
})

restoreConflictButton.addEventListener("click", () => {
    if (!restoreHabit(conflictId)) return

    saveState()
    render()
    closeHabitDialog()
})

archiveButton.addEventListener("click", () => {
    const habit = findHabit(editingId)
    if (!confirm(`Arquivar "${habit.name}"? O hábito sairá da tela, mas o histórico será guardado.`)) return

    archiveHabit(editingId)
    editingId = null
    saveState()
    render()
    closeHabitDialog()
})

document.querySelector("#habit-cancel").addEventListener("click", closeHabitDialog)

// Esc passa pelo mesmo fechamento dos botões, para o foco voltar à tela principal
function closeOnEscape(dialog, close) {
    dialog.addEventListener("keydown", event => {
        if (event.key !== "Escape") return
        event.preventDefault()
        close()
    })
}

closeOnEscape(habitDialog, closeHabitDialog)

// O botão que abriu o diálogo pode ter sido recriado pela renderização, então o foco é devolvido aqui
function closeHabitDialog() {
    habitDialog.close()
    focusFirst(editingId && habitSelector(editingId, "edit"), '[data-action="new"]', '[data-action="archived"]', "#register-day")
}

// --- Diálogo de arquivados ---

const archivedDialog = document.querySelector("#archived-dialog")
const archivedList = document.querySelector("#archived-list")
const archivedLimit = document.querySelector("#archived-limit")

function openArchivedDialog() {
    renderArchived()
    archivedDialog.showModal()
    focusFirst("#archived-list button:not(:disabled)", "#archived-close")
}

function renderArchived() {
    const archived = archivedHabits()
    const limitReached = activeHabits().length >= MAX_ACTIVE
    archivedLimit.hidden = !limitReached

    if (archived.length === 0) {
        archivedList.replaceChildren(el("li", { class: "archived-empty" }, "Nenhum hábito arquivado"))
        return
    }

    archivedList.replaceChildren(...archived.map(habit =>
        el("li", { class: "archived-item", "data-id": habit.id },
            el("span", { class: "habit-symbol", "aria-hidden": "true" }, habitSymbol(habit)),
            el("span", { class: "habit-name", title: habit.name }, habit.name),
            el("button", {
                type: "button",
                "data-action": "restore",
                "aria-label": `Restaurar ${habit.name}`,
                "aria-describedby": limitReached ? "archived-limit" : null,
                disabled: limitReached,
            }, "Restaurar"),
            el("button", {
                type: "button",
                class: "danger",
                "data-action": "delete",
                "aria-label": `Excluir definitivamente ${habit.name}`,
            }, "Excluir definitivamente"),
        )
    ))
}

archivedList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]")
    if (!button || button.disabled) return

    const habit = findHabit(button.closest("[data-id]").dataset.id)

    if (button.dataset.action === "restore") {
        if (!restoreHabit(habit.id)) return
    } else {
        const message = `Excluir definitivamente "${habit.name}"? Todo o histórico dele será apagado. Esta ação não pode ser desfeita.`
        if (!confirm(message)) return
        deleteHabit(habit.id)
    }

    saveState()
    render()
    renderArchived()
    focusFirst("#archived-list button:not(:disabled)", "#archived-close")
})

function closeArchivedDialog() {
    archivedDialog.close()
    focusFirst('[data-action="archived"]', '[data-action="new"]', "#register-day")
}

document.querySelector("#archived-close").addEventListener("click", closeArchivedDialog)
closeOnEscape(archivedDialog, closeArchivedDialog)

// --- Arrastar para reordenar (mouse e toque) ---

let drag = null

habitsList.addEventListener("pointerdown", event => {
    const handle = event.target.closest(".habit-handle")
    if (!handle || event.button !== 0) return

    event.preventDefault()
    handle.setPointerCapture(event.pointerId)

    const item = handle.closest(".habit")
    item.classList.add("dragging")
    drag = { id: item.dataset.id, item, pointerId: event.pointerId, startY: event.clientY, toIndex: null }
})

habitsList.addEventListener("pointermove", event => {
    if (!drag || event.pointerId !== drag.pointerId) return

    drag.item.style.transform = `translateY(${event.clientY - drag.startY}px)`

    // Destino = quantos outros itens têm o meio acima do ponteiro
    const others = [...habitsList.children].filter(item => item !== drag.item)
    drag.toIndex = others.filter(item => {
        const rect = item.getBoundingClientRect()
        return rect.top + rect.height / 2 < event.clientY
    }).length

    others.forEach(item => item.classList.remove("drop-before", "drop-after"))
    if (drag.toIndex < others.length) others[drag.toIndex].classList.add("drop-before")
    else others.at(-1)?.classList.add("drop-after")
})

function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return

    const { id, toIndex } = drag
    drag = null

    if (event.type === "pointerup" && toIndex !== null && moveHabit(id, toIndex)) saveState()
    render()
}

habitsList.addEventListener("pointerup", endDrag)
habitsList.addEventListener("pointercancel", endDrag)

render()
