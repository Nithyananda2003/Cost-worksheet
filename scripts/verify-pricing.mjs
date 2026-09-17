import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog = JSON.parse(
  fs.readFileSync(
    new URL('../data/pricing-data.json', import.meta.url),
    'utf8',
  ),
);

assert.equal(
  catalog.locations.length,
  3315,
  'Expected all usable source locations',
);
assert.equal(
  new Set(catalog.locations.map((location) => location.id)).size,
  3315,
  'Location IDs must be unique',
);

let pricePoints = 0;
for (const location of catalog.locations) {
  for (const tier of catalog.tiers) {
    for (const orderType of catalog.orderTypes) {
      const value = location.prices[tier][orderType];
      assert.ok(
        value === null || (Number.isFinite(value) && value >= 0),
        `Invalid price at ${location.id}`,
      );
      if (value !== null) pricePoints += 1;
    }
  }
}
assert.equal(pricePoints, 57739, 'Available price-point total changed');
assert.equal(catalog.sourceFile, 'Updated cost sheet 9-17-2026.xlsx');
assert.equal(catalog.updatedDate, '2026-09-17');

const findLocation = (stateCode, county) =>
  catalog.locations.find(
    (location) =>
      location.stateCode === stateCode && location.county === county,
  );

const baldwin = findLocation('AL', 'Baldwin');
assert.ok(baldwin, 'Baldwin, AL should exist');
assert.equal(baldwin.prices.T1['Full Search'], 19);
assert.equal(baldwin.prices.T2['Full Search'], 42);
assert.equal(baldwin.prices.Ground['Full Search'], 142);

const wright = findLocation('MN', 'Wright');
assert.ok(wright, 'The multiline Wright, MN source record should parse');
assert.equal(wright.prices.T2['Full Search'], 56);
assert.equal(wright.prices.Ground['Full Search'], 127);

const etowah = findLocation('AL', 'Etowah');
assert.ok(etowah, 'The corrupted Etowah state should be repaired to AL');

assert.equal(findLocation('OH', 'Hocking')?.prices.T1['Full Search'], 19);
assert.equal(findLocation('OH', 'Monroe')?.prices.T1['Full Search'], 19);
assert.equal(findLocation('LA', 'East Baton Rouge')?.fips, '22033');
assert.equal(findLocation('IA', 'East Baton Rouge'), undefined);
assert.equal(findLocation('PA', 'Carbon')?.prices.Ground['Current Owner'], 50);

const nance = findLocation('NE', 'Nance');
assert.ok(nance, 'Nance, NE should exist');
assert.equal(
  nance.prices.T1['Legal & Vesting'],
  null,
  'Invalid source text must not become a price',
);

const chester = findLocation('TN', 'Chester');
assert.ok(chester, 'Chester, TN should exist');
assert.equal(
  chester.prices.T1['Legal & Vesting'],
  null,
  'Invalid source text must not become a price',
);

console.log(
  `Verified ${catalog.locations.length.toLocaleString()} locations and ${pricePoints.toLocaleString()} exact price points.`,
);
