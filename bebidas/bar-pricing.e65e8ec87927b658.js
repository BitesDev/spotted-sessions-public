// Both clients and the server use cents. Checkout lines must add up exactly.
export function priceItems(items, promotion) {
    const subtotalCents = items.reduce((sum, item) => sum + item.quantity * item.priceCents, 0);
    const eligible = (item) => !!promotion && promotion.productIds.includes(item.id) && item.priceCents === promotion.unitPriceCents;
    const count = items.filter(eligible).reduce((sum, item) => sum + item.quantity, 0);
    const bundles = promotion ? Math.floor(count / promotion.quantity) : 0;
    const discountCents = promotion ? bundles * (promotion.quantity * promotion.unitPriceCents - promotion.totalCents) : 0;
    // Orders permit at most five drinks: four average $62.50, five average $70.
    const unitCents = promotion && bundles ? (count * promotion.unitPriceCents - discountCents) / count : 0;
    if (discountCents && !Number.isSafeInteger(unitCents))
        throw new Error("Unsupported bundle quantity");
    const priced = items.map(item => discountCents && eligible(item) ? { ...item, listPriceCents: item.priceCents, priceCents: unitCents } : item);
    return { items: priced, subtotalCents, discountCents, totalCents: subtotalCents - discountCents };
}
