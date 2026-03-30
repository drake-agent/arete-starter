#!/usr/bin/env node
/**
 * orrery_bridge.mjs — @orrery/core wrapper
 * 
 * Python 코칭 레이어와 연결하기 위한 Node.js 브릿지.
 * stdin으로 JSON 입력 받아서 stdout으로 JSON 출력.
 * 
 * Usage:
 *   echo '{"year":1994,"month":10,"day":28,"hour":14,"minute":0,"gender":"M"}' | node orrery_bridge.mjs
 *   node orrery_bridge.mjs --year 1994 --month 10 --day 28 --hour 14 --gender M
 */

import { calculateSaju } from '@orrery/core/saju';

async function getInput() {
  const args = process.argv.slice(2);
  
  if (args.length >= 6) {
    // CLI args mode
    const input = {};
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i].replace('--', '');
      input[key] = key === 'gender' ? args[i+1] : parseInt(args[i+1]);
    }
    input.minute = input.minute || 0;
    return input;
  }
  
  // stdin mode
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}

async function main() {
  const input = await getInput();
  const saju = calculateSaju(input);
  
  // 일간 추출
  const dayPillar = saju.pillars[1]; // index 1 = 일주
  const ilgan = dayPillar.pillar.stem;
  
  // 구조화된 출력
  const output = {
    input,
    ilgan,
    pillars: saju.pillars.map((p, i) => ({
      position: ['hour', 'day', 'month', 'year'][i],
      ganzi: p.pillar.ganzi,
      stem: p.pillar.stem,
      branch: p.pillar.branch,
      stemSipsin: p.stemSipsin,
      branchSipsin: p.branchSipsin,
      unseong: p.unseong,
      sinsal: p.sinsal,
      jigang: p.jigang,
    })),
    daewoon: saju.daewoon?.map(d => ({
      age: d.age,
      ganzi: d.ganzi,
      stemSipsin: d.stemSipsin,
      branchSipsin: d.branchSipsin,
      unseong: d.unseong,
      startDate: d.startDate,
    })),
    relations: saju.relations,
    gongmang: saju.gongmang,
  };
  
  console.log(JSON.stringify(output, null, 2));
}

main().catch(e => {
  console.error(JSON.stringify({ error: e.message }));
  process.exit(1);
});
