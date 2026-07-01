import { PGlite } from '@electric-sql/pglite';
import { SEED_SQL } from '../js/seed.js';
import { TOPICS, ALL_CHALLENGES } from '../js/challenges.js';

const db = new PGlite();
async function reset() { await db.exec(SEED_SQL); }
async function runLast(sql) {
  const r = await db.exec(sql, { rowMode: 'array' });
  return r[r.length - 1];
}

let pass = 0, fail = 0;
const failures = [];

for (const ch of ALL_CHALLENGES) {
  try {
    if (ch.type === 'mutation') {
      await reset();
      await db.exec(ch.solution);
      const res = await runLast(ch.check);
      if (!res) throw new Error('check returned nothing');
      pass++;
    } else {
      await reset();
      const res = await runLast(ch.solution);
      if (!res || !res.rows) throw new Error('no rows object');
      // sanity: non-empty for most (allow empty only if intended)
      pass++;
      // eslint-disable-next-line no-unused-vars
      const _rowCount = res.rows.length;
      if (res.rows.length === 0) {
        console.log(`  ⚠ ${ch.id} (${ch.title}) returned 0 rows`);
      }
    }
  } catch (e) {
    fail++;
    failures.push({ id: ch.id, topic: ch.topicName, title: ch.title, err: e.message, sql: ch.solution });
  }
}

console.log(`\n${'='.repeat(50)}`);
console.log(`Topics: ${TOPICS.length}  |  Challenges: ${ALL_CHALLENGES.length}`);
console.log(`PASS: ${pass}   FAIL: ${fail}`);
if (failures.length) {
  console.log('\nFAILURES:');
  for (const f of failures) {
    console.log(`\n✗ [${f.id}] ${f.topic} → ${f.title}`);
    console.log(`  error: ${f.err}`);
    console.log(`  sql:   ${f.sql}`);
  }
  process.exit(1);
} else {
  console.log('\n✅ All solutions execute cleanly.');
}
