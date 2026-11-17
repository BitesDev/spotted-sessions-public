export function parseDraft(raw) {
    try {
        const v = JSON.parse(raw ?? "null");
        if (!v || typeof v !== "object")
            return null;
        const d = v;
        if (typeof d.requestId !== "string" || !/^[a-f0-9-]{36}$/.test(d.requestId) || typeof d.name !== "string" || d.name.length > 60 || !d.zone || !["ventana", "pista", "dj"].includes(d.zone) || !Array.isArray(d.items) || d.items.length < 1 || d.items.length > 3)
            return null;
        if (!d.items.every(i => i && ["drink-1", "drink-2", "drink-3"].includes(i.id) && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 5))
            return null;
        return d;
    }
    catch {
        return null;
    }
}
export const $ = (id) => document.getElementById(id);
export const money = (cents) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(cents / 100);
export function element(tag, text, className) { const e = document.createElement(tag); if (text)
    e.textContent = text; if (className)
    e.className = className; return e; }
export class ApiError extends Error {
    status;
    code;
    constructor(message, status, code = "error") {
        super(message);
        this.status = status;
        this.code = code;
    }
}
export async function api(url, method = "GET", body, extra = {}) {
    const r = await fetch(url, { method, credentials: "same-origin", redirect: "manual", headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...extra }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000), cache: "no-store" });
    if (r.type === "opaqueredirect" || r.status === 0 || (r.status >= 300 && r.status < 400))
        throw new ApiError("Tu sesión terminó. Inicia sesión de nuevo.", 401);
    let result;
    try {
        result = await r.json();
    }
    catch {
        throw new ApiError("Actualiza la página e inicia sesión de nuevo.", 401);
    }
    if (!r.ok)
        throw new ApiError(result.error?.message ?? "No se pudo confirmar. Revisa tu conexión.", r.status, result.error?.code);
    return result.data;
}
export function notice(text) { $("notice").textContent = text; }
export function connection(fresh) { $("connection").textContent = fresh ? "Conectado" : "Sin conexión"; $("connection").classList.toggle("offline", !fresh); }
export async function copy(text) { try {
    await navigator.clipboard.writeText(text);
    notice("Enlace copiado.");
}
catch {
    const input = element("input");
    input.value = text;
    input.readOnly = true;
    input.setAttribute("aria-label", "Enlace para copiar");
    $("notice").replaceChildren(input);
    input.select();
} }
export const zoneName = (id) => ({ ventana: "Ventana", pista: "Pista", dj: "Cuarto DJ" }[id] ?? id);
export const stateName = (id) => ({ awaiting_payment: "Pendiente de pago", paid: "Pago confirmado", preparing: "En preparación", ready: "Listo para entrega", delivered: "Entregado", expired: "Pago vencido", review: "Necesita revisión", refunded: "Reembolsado" }[id] ?? id);
export function stateCard(order) {
    const card = element("article", undefined, "order-card");
    card.dataset.order = order.id;
    const heading = element("div", undefined, "card-heading");
    heading.append(element("strong", order.items.map(i => i.quantity + " × " + i.name).join(" · ")), element("span", order.reference, "folio"));
    card.append(heading);
    const tag = element("div", undefined, "name-badge");
    tag.append(element("span", "HOLA, SOY"), element("h2", order.name));
    card.append(tag);
    const location = element("p", zoneName(order.zone), "order-location");
    card.append(location);
    const statuses = element("div", undefined, "statuses");
    for (const [name, yes] of [["Pagado", order.payment === "paid"], ["Entregado", order.state === "delivered"]]) {
        const status = element("div", name, yes ? "status yes" : "status no");
        status.append(element("strong", yes ? "Sí ✓" : "No"));
        statuses.append(status);
    }
    card.append(statuses, element("p", stateName(order.state) + (order.test ? " · Prueba" : ""), "subtle"));
    return card;
}
export function menuPicker(menu, quantities, changed) {
    const focused = document.activeElement?.getAttribute("aria-label");
    const container = $("products");
    container.replaceChildren();
    for (const [index, p] of menu.products.entries()) {
        const card = element("article", undefined, "product");
        card.dataset.product = p.id;
        const detail = element("div", undefined, "product-detail");
        detail.append(element("span", "0" + (index + 1), "product-number"), element("h2", p.name), element("p", money(p.priceCents), "price"));
        const qty = element("div", undefined, "quantity");
        const minus = element("button", "−"), count = element("output", String(quantities[p.id] ?? 0)), plus = element("button", "+");
        minus.type = plus.type = "button";
        minus.setAttribute("aria-label", "Quitar " + p.name);
        plus.setAttribute("aria-label", "Añadir " + p.name);
        const refresh = () => { count.textContent = String(quantities[p.id] ?? 0); minus.disabled = !quantities[p.id]; plus.disabled = !p.available || Object.values(quantities).reduce((a, b) => a + b, 0) >= 5; };
        minus.addEventListener("click", () => { quantities[p.id] = Math.max(0, (quantities[p.id] ?? 0) - 1); changed(); });
        plus.addEventListener("click", () => { if (Object.values(quantities).reduce((a, b) => a + b, 0) < 5)
            quantities[p.id] = (quantities[p.id] ?? 0) + 1; changed(); });
        refresh();
        qty.append(minus, count, plus);
        card.append(detail, qty);
        if (!p.available)
            card.append(element("span", "Agotado", "soldout"));
        container.append(card);
    }
    if (focused)
        Array.from(container.querySelectorAll("button")).find(b => b.getAttribute("aria-label") === focused)?.focus({ preventScroll: true });
}
export function selectedZone() { return document.querySelector('input[name="zone"]:checked')?.value ?? ""; }
export function initMap() { document.querySelectorAll('input[name="zone"]').forEach(input => input.addEventListener("change", () => { $("zone-label").textContent = zoneName(input.value); })); }
