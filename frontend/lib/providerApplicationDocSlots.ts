/**
 * Порядок и подписи слотов документов при подаче заявки провайдера.
 * Индекс в `document_urls` совпадает с порядком загрузки в форме.
 */
export const PROVIDER_DOC_SLOT_LABELS = [
  "Government-issued ID",
  "Qualifications",
  "CV or experience summary",
  "Additional document",
] as const;

export function providerDocSlotLabel(index: number): string {
  if (index >= 0 && index < PROVIDER_DOC_SLOT_LABELS.length) {
    return PROVIDER_DOC_SLOT_LABELS[index];
  }
  return `Attachment ${index + 1}`;
}
