import { test, expect } from 'vitest';
import { matchIngredients } from './engine';

test('matches exact and synonyms', () => {
  const ingredients = 'Water, sugar, whey powder, salt';
  const matches = matchIngredients(ingredients, ['milk']);
  expect(matches).toContain('whey');
});

test('fuzzy matches OCR errors', () => {
  const ingredients = 'peanuts, sugar, salt';
  const matches = matchIngredients(ingredients, ['peanut']);
  expect(matches).toContain('peanut');
});
