import { $, api, parseDraft, ApiError, copy, element, connection, notice, money, menuPicker, initMap, selectedZone, stateCard, zoneName } from "./bar-common.a25b670c89ea6f80.js";
const base = location.hostname === "127.0.0.1" ? "/v1/bar" : "https://spotted-registration-api.pages.dev/v1/bar";
const storageKey = "spotted-drinks-v1";
let menu = null, quantities = {}, active = null, current = null, lastSuccess = 0, busy = false, polling = false, draft = null;
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
} }
function freshness() { const fresh = Date.now() - lastSuccess < 12000 && navigator.onLine; connection(fresh); const total = menu?.products.reduce((n, p) => n + (quantities[p.id] ?? 0) * p.priceCents, 0) ?? 0; $("total").textContent = money(total); $("pay").disabled = busy || !fresh || !menu?.accepting || !total; document.querySelectorAll("[data-requires-connection]").forEach(b => b.disabled = !fresh || busy); }
function renderMenu() { if (!menu)
    return; menuPicker(menu, quantities, renderMenu); $("availability").textContent = menu.mode === "test" ? "Modo de prueba · sin cargos reales" : menu.accepting ? "Precios en MXN" : "Los pedidos están en pausa"; freshness(); }
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
                if (data.checkoutUrl?.startsWith("https://checkout.stripe.com/"))
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
    if (busy || !menu)
        return;
    const name = $("name").value.trim(), zone = selectedZone();
    if (!name || !zone) {
        notice("Escribe tu nombre y elige dónde estás.");
        return;
    }
    draft ??= { requestId: crypto.randomUUID(), name, zone, items: menu.products.filter(p => quantities[p.id]).map(p => ({ id: p.id, quantity: quantities[p.id] })) };
    try {
        localStorage.setItem("spotted-drinks-draft", JSON.stringify(draft));
    }
    catch { }
    busy = true;
    freshness();
    notice("");
    try {
        const data = await api(base + "/orders", "POST", draft);
        active = { id: data.order.id, token: data.token };
        save(active);
        draft = null;
        try {
            localStorage.removeItem("spotted-drinks-draft");
        }
        catch { }
        window.history.replaceState(null, "", "#pedido=" + active.id + "." + active.token);
        if (data.checkoutUrl?.startsWith("https://checkout.stripe.com/"))
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
        notice(e.message + " Reintentar conserva el mismo pedido.");
    }
    finally {
        busy = false;
        freshness();
    }
});
$("new-order").addEventListener("click", () => { window.history.replaceState(null, "", location.pathname); active = null; current = null; quantities = {}; $("receipt").hidden = true; $("shop").hidden = false; renderMenu(); notice(""); window.scrollTo({ top: 0 }); });
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
        void api(base + "/menu").then(value => { menu = value; lastSuccess = Date.now(); renderMenu(); }).catch(() => { lastSuccess = 0; connection(false); });
} }, 2000);
setInterval(freshness, 1000);
