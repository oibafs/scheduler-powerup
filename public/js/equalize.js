import { getCustomFields } from './common.js';

window.equalize = function equalize(card, customFieldModel) {
  let work = {};
  work.start = card.start;
  work.customFields = card.customFieldItems ? getCustomFields(card.customFieldItems, customFieldModel) : {};
  console.log(work);
}