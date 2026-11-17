import { isCheckoutUrl, $, api, parseDraft, ApiError, copy, element, connection, notice, money, mixerDescription, menuPriceLabel, initMap, selectedZone, stateCard, zoneName } from "./bar-common.9a8fc63e8a015aeb.js";
const base = location.hostname === "127.0.0.1" ? "/v1/bar" : "https://spotted-registration-api.pages.dev/v1/bar";
const storageKey = "spotted-drinks-v1";
let menu = null, quantities = {}, active = null, current = null, lastSuccess = 0, busy = false, polling = false, draft = null;
let step = 0, chosenBase = "";
function saved() { try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(value) ? value.filter(v => v && typeof v.id === "string" && typeof v.token === "string").slice(0, 10) : [];
}
catch {
    return [];
} }
function save(ref) { try {
    localStorage.setItem(storageKey, JSON.stringify([ref, ...saved().filter(r => r.id !== ref.id)].slice(0, 10)));
}
catch { /* The receipt link remains available if storage is unavailable. */ } }
function restoreDraft() { try {
    draft = parseDraft(localStorage.getItem("spotted-drinks-draft"));
}
catch {
    draft = null;
} if (draft) {
    $("name").setAttribute("value", draft.name);
    quantities = Object.fromEntries(draft.items.map(i => [i.id, i.quantity]));
    const input = document.querySelector('input[name="zone"][value="' + draft.zone + '"]');
    if (input)
        input.checked = true;
    step = 2;
    notice("Tienes un intento pendiente. Continúa para recuperar el mismo pedido.");
} }
function freshness() {
    const fresh = Date.now() - lastSuccess < 12000 && navigator.onLine;
    connection(fresh);
    const total = menu?.products.reduce((n, p) => n + (quantities[p.id] ?? 0) * p.priceCents, 0) ?? 0;
    const available = Object.entries(quantities).filter(([, q]) => q > 0).every(([id]) => menu?.products.some(p => p.id === id && p.available));
    $("total").textContent = draft ? "En confirmación" : money(total);
    $("pay").disabled = busy || !fresh || (!draft && (!menu?.accepting || !total || !available));
    $("pay").textContent = busy ? "Confirmando…" : draft ? "Continuar ↗" : "Pagar ↗";
    $("step-back").disabled = busy || !!draft;
    $("name").readOnly = busy || !!draft;
    document.querySelectorAll('input[name="zone"]').forEach(input => input.disabled = busy || !!draft);
    document.querySelectorAll("[data-requires-connection]").forEach(b => b.disabled = !fresh || busy);
}
function showStep(next) { step = next; notice(""); renderMenu(); $("order-title").focus({ preventScroll: true }); window.scrollTo({ top: 0 }); }
function renderMenu() {
    if (!menu)
        return;
    $("availability").textContent = menu.mode === "test" ? "Modo de prueba · sin cargos reales" : menu.accepting ? menuPriceLabel(menu) : "Los pedidos están en pausa";
    $("payment-note").textContent = menu.provider === "mercadopago" ? "Pago seguro con Mercado Pago · seguimiento al volver" : "Pago seguro · seguimiento al volver";
    $("order-title").textContent = step === 0 ? "¿Qué quieres tomar?" : step === 1 ? chosenBase + " ¿con qué?" : "Te lo llevamos.";
    $("step-count").textContent = "0" + (step + 1) + " / 03";
    document.querySelectorAll(".step-tracks i").forEach((track, index) => track.classList.toggle("complete", index <= step));
    $("step-back").hidden = step === 0;
    $("choose").hidden = step === 2;
    $("delivery").hidden = step !== 2;
    const container = $("products"), focused = document.activeElement?.getAttribute("data-choice");
    container.replaceChildren();
    if (step < 2) {
        const combinations = menu.products.filter(p => p.base && p.mixer);
        const values = step === 0 ? [...new Set(combinations.map(p => p.base))] : combinations.filter(p => p.base === chosenBase).map(p => p.mixer);
        for (const [index, value] of values.entries()) {
            const product = step === 1 ? combinations.find(p => p.base === chosenBase && p.mixer === value) : undefined;
            const button = element("button", undefined, "quick-option glass");
            button.type = "button";
            button.dataset.choice = value;
            button.disabled = busy || !!draft || !menu.accepting || !(step === 0 ? combinations.some(p => p.base === value && p.available) : product?.available);
            const number = element("span", String(index + 1).padStart(2, "0"), "choice-number"), text = element("span", undefined, "choice-copy"), arrow = element("span", "↗", "choice-arrow");
            number.setAttribute("aria-hidden", "true");
            arrow.setAttribute("aria-hidden", "true");
            text.append(element("strong", value));
            if (step === 1 && value !== "Coca-Cola")
                text.append(element("small", mixerDescription(value)));
            if (product && !product.available)
                text.append(element("small", "Agotado"));
            button.append(number, text, arrow);
            button.addEventListener("click", () => { if (busy || draft)
                return; if (step === 0) {
                chosenBase = value;
                showStep(1);
            }
            else if (product?.available) {
                quantities = { [product.id]: 1 };
                showStep(2);
            } });
            container.append(button);
        }
        if (!values.length)
            container.append(element("p", "La carta se está actualizando. Intenta de nuevo en un momento.", "subtle"));
        if (focused)
            Array.from(container.querySelectorAll("button")).find(b => b.dataset.choice === focused)?.focus({ preventScroll: true });
    }
    const quantityFocus = document.activeElement?.getAttribute("data-quantity"), summary = $("drink-summary");
    summary.replaceChildren();
    for (const [id, quantity] of Object.entries(quantities).filter(([, q]) => q > 0)) {
        const product = menu.products.find(p => p.id === id), line = element("div", undefined, "summary-line"), detail = element("div");
        detail.append(element("strong", product?.name ?? "Bebida de tu pedido anterior"));
        if (product && !product.available && !draft)
            detail.append(element("p", "Agotado · vuelve y elige otra mezcla", "review"));
        const qty = element("div", undefined, "quantity"), minus = element("button", "−"), plus = element("button", "+"), count = element("output", String(quantity));
        minus.type = plus.type = "button";
        minus.dataset.quantity = id + "-minus";
        plus.dataset.quantity = id + "-plus";
        minus.setAttribute("aria-label", "Una bebida menos");
        plus.setAttribute("aria-label", "Una bebida más");
        count.setAttribute("aria-label", "Cantidad");
        minus.disabled = quantity <= 1 || busy || !!draft;
        plus.disabled = Object.values(quantities).reduce((a, b) => a + b, 0) >= 5 || busy || !!draft || !product?.available;
        minus.onclick = () => { quantities[id]--; renderMenu(); };
        plus.onclick = () => { quantities[id]++; renderMenu(); };
        qty.append(minus, count, plus);
        line.append(detail, qty);
        summary.append(line);
    }
    if (quantityFocus)
        Array.from(summary.querySelectorAll("button")).find(b => b.dataset.quantity === quantityFocus)?.focus({ preventScroll: true });
    freshness();
}
function receiptLink(ref) { return location.origin + "/bebidas/#pedido=" + ref.id + "." + ref.token; }
function renderHistory() { const list = $("history-list"); list.replaceChildren(); for (const [i, ref] of saved().entries()) {
    const a = element("a", i === 0 ? "Último pedido" : "Pedido anterior " + i, "glass");
    a.href = "#pedido=" + ref.id + "." + ref.token;
    list.append(a);
} }
function renderReceipt(order, checkoutUrl = null) {
    current = order;
    $("receipt").hidden = false;
    $("shop").hidden = true;
    $("order-title").textContent = "Listo. Sigue tu drink.";
    const container = $("receipt-card"), card = stateCard(order);
    card.append(element("strong", money(order.totalCents), "receipt-total"));
    if (order.payment === "pending" && order.state === "awaiting_payment") {
        const pay = element("button", "Continuar al pago", "primary");
        pay.dataset.requiresConnection = "";
        pay.addEventListener("click", async () => {
            if (!active || busy)
                return;
            busy = true;
            freshness();
            try {
                const data = await api(base + "/orders/" + active.id + "/checkout", "POST", {}, { Authorization: "Bearer " + active.token });
                if (isCheckoutUrl(data.checkoutUrl))
                    location.assign(data.checkoutUrl);
                else
                    notice("El pago todavía no está disponible.");
            }
            catch (e) {
                notice(e.message);
            }
            finally {
                busy = false;
                freshness();
            }
        });
        card.append(pay);
        if (!checkoutUrl)
            card.append(element("p", "Tu pedido se conserva mientras conectamos el pago.", "subtle"));
    }
    if (!["delivered", "expired", "refunded", "review"].includes(order.state)) {
        const move = element("details", undefined, "move");
        move.append(element("summary", "Me moví"));
        const zones = element("div", undefined, "zone-options");
        for (const zone of menu?.zones ?? []) {
            const b = element("button", zone.name, "glass");
            b.setAttribute("aria-pressed", String(order.zone === zone.id));
            b.dataset.requiresConnection = "";
            b.addEventListener("click", async () => { if (!active || busy)
                return; busy = true; freshness(); try {
                const data = await api(base + "/orders/" + active.id + "/location", "POST", { zone: zone.id, version: order.version }, { Authorization: "Bearer " + active.token });
                renderReceipt(data.order);
                notice("Te encontramos en " + zoneName(zone.id) + ".");
            }
            catch (e) {
                notice(e.message);
                await refresh();
            }
            finally {
                busy = false;
                freshness();
            } });
            zones.append(b);
        }
        move.append(zones);
        card.append(move);
    }
    container.replaceChildren(card);
    const copyButton = element("button", "Guardar enlace del pedido", "glass");
    copyButton.addEventListener("click", () => active && copy(receiptLink(active)));
    container.append(copyButton, element("p", "Muestra tu nombre y folio al recibir. Conserva este enlace hasta la entrega.", "subtle"));
    freshness();
}
async function refresh() {
    if (!active || polling)
        return;
    polling = true;
    try {
        const data = await api(base + "/orders/" + active.id, "GET", undefined, { Authorization: "Bearer " + active.token });
        lastSuccess = Date.now();
        if (!current || JSON.stringify(current) !== JSON.stringify(data.order))
            renderReceipt(data.order, data.checkoutUrl);
        freshness();
    }
    catch (e) {
        if (e instanceof ApiError && e.status === 404) {
            notice("Este enlace ya no está disponible. Revisa tu pedido en la barra.");
            current = null;
            $("receipt-card").replaceChildren();
        }
        lastSuccess = 0;
        connection(false);
    }
    finally {
        polling = false;
    }
}
async function openReceipt() {
    const match = /^#pedido=([a-f0-9-]{36})\.([a-f0-9]{64})$/.exec(location.hash);
    if (!match) {
        active = null;
        current = null;
        $("receipt").hidden = true;
        $("shop").hidden = false;
        renderMenu();
        return;
    }
    active = { id: match[1], token: match[2] };
    save(active);
    renderHistory();
    $("shop").hidden = true;
    $("receipt").hidden = false;
    await refresh();
    try {
        const data = await api(base + "/orders/" + active.id + "/sync", "POST", {}, { Authorization: "Bearer " + active.token });
        lastSuccess = Date.now();
        renderReceipt(data.order);
    }
    catch { /* Polling continues with the durable state. */ }
}
$("order-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || !menu || step !== 2 || $("pay").disabled)
        return;
    const name = $("name").value.trim(), zone = selectedZone();
    if (!draft && (name.length < 2 || !zone)) {
        notice(name.length < 2 ? "Escribe el nombre de tu etiqueta." : "Elige dónde te llevamos tu bebida.");
        if (name.length < 2)
            $("name").focus();
        else
            document.querySelector('input[name="zone"]')?.focus();
        return;
    }
    draft ??= { requestId: crypto.randomUUID(), name, zone, items: menu.products.filter(p => quantities[p.id]).map(p => ({ id: p.id, quantity: quantities[p.id] })) };
    try {
        localStorage.setItem("spotted-drinks-draft", JSON.stringify(draft));
    }
    catch { }
    busy = true;
    renderMenu();
    notice("");
    try {
        const data = await api(base + "/orders", "POST", draft);
        active = { id: data.order.id, token: data.token };
        save(active);
        renderHistory();
        draft = null;
        try {
            localStorage.removeItem("spotted-drinks-draft");
        }
        catch { }
        window.history.replaceState(null, "", "#pedido=" + active.id + "." + active.token);
        if (isCheckoutUrl(data.checkoutUrl))
            location.assign(data.checkoutUrl);
        else {
            renderReceipt(data.order);
            notice(data.message ?? "Tu pedido está guardado.");
        }
    }
    catch (e) {
        if (e instanceof ApiError && (e.status === 400 || e.code === "catalog_changed")) {
            draft = null;
            try {
                localStorage.removeItem("spotted-drinks-draft");
            }
            catch { }
        }
        notice(e.message + (draft ? " Reintentar conserva el mismo pedido." : " Revisa tu selección."));
    }
    finally {
        busy = false;
        if (!active)
            renderMenu();
        else
            freshness();
    }
});
$("step-back").addEventListener("click", () => { if (!busy && !draft)
    showStep(step === 2 ? 1 : 0); });
$("new-order").addEventListener("click", () => { window.history.replaceState(null, "", location.pathname); active = null; current = null; quantities = {}; chosenBase = ""; $("receipt").hidden = true; $("shop").hidden = false; showStep(0); });
window.addEventListener("hashchange", () => void openReceipt());
window.addEventListener("online", () => void refresh());
window.addEventListener("offline", () => connection(false));
document.addEventListener("visibilitychange", () => { if (!document.hidden)
    void refresh(); });
initMap();
restoreDraft();
renderHistory();
async function load() { try {
    menu = await api(base + "/menu");
    lastSuccess = Date.now();
    renderMenu();
    await openReceipt();
}
catch (e) {
    notice(e.message);
    lastSuccess = 0;
    connection(false);
} }
void load();
setInterval(() => { if (!document.hidden) {
    if (active)
        void refresh();
    else
        void api(base + "/menu").then(value => { const changed = JSON.stringify(menu) !== JSON.stringify(value); menu = value; lastSuccess = Date.now(); if (changed)
            renderMenu();
        else
            freshness(); }).catch(() => { lastSuccess = 0; connection(false); });
} }, 2000);
setInterval(freshness, 1000);
