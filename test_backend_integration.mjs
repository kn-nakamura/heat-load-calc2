#!/usr/bin/env node
// Integration test for backend calculation

const API_URL = 'http://localhost:8000/v1';

// Sample project data matching backend schema
const testProject = {
  id: 'test-project-001',
  name: 'テストビル',
  building_name: 'テストビル',
  building_location: '東京都',
  building_usage: 'オフィス',
  region: '6地域',
  orientation_deg: 0,
  orientation_basis: 'north',
  unit_system: 'SI',
  design_conditions: [
    {
      id: 'default',
      summer_drybulb_c: 32.0,
      summer_rh_pct: 60.0,
      summer_wetbulb_c: 26.0,
      summer_dewpoint_c: 23.0,
      summer_enthalpy_kj_per_kgda: 75.0,
      summer_abs_humidity_kg_per_kgda: 0.018,
      winter_drybulb_c: 2.0,
      winter_rh_pct: 50.0,
      winter_wetbulb_c: 0.0,
      winter_dewpoint_c: -5.0,
      winter_enthalpy_kj_per_kgda: 10.0,
      winter_abs_humidity_kg_per_kgda: 0.003,
    },
  ],
  rooms: [
    {
      id: 'room-001',
      name: 'オフィス1',
      floor: '1F',
      area_m2: 100.0,
      ceiling_height_m: 2.7,
      volume_m3: 270.0,
      design_condition_id: 'default',
      system_id: 'system-001',
    },
    {
      id: 'room-002',
      name: '会議室',
      floor: '1F',
      area_m2: 50.0,
      ceiling_height_m: 2.7,
      volume_m3: 135.0,
      design_condition_id: 'default',
      system_id: 'system-001',
    },
  ],
  surfaces: [
    {
      id: 'surface-001',
      room_id: 'room-001',
      kind: 'wall',
      orientation: 'S',
      width_m: 10.0,
      height_m: 2.7,
      area_m2: 27.0,
      adjacent_type: 'outdoor',
      construction_id: null,
    },
    {
      id: 'surface-002',
      room_id: 'room-002',
      kind: 'wall',
      orientation: 'N',
      width_m: 7.0,
      height_m: 2.7,
      area_m2: 18.9,
      adjacent_type: 'outdoor',
      construction_id: null,
    },
  ],
  openings: [],
  constructions: [],
  glasses: [],
  internal_loads: [
    {
      id: 'internal-001',
      room_id: 'room-001',
      kind: 'lighting',
      sensible_w: 1000.0,
      latent_w: 0.0,
    },
    {
      id: 'internal-002',
      room_id: 'room-001',
      kind: 'occupancy',
      sensible_w: 600.0,
      latent_w: 500.0,
    },
  ],
  mechanical_loads: [],
  ventilation_infiltration: [],
  systems: [
    {
      id: 'system-001',
      name: '1階系統',
      parent_id: null,
    },
  ],
};

async function testBackend() {
  console.log('🧪 バックエンド統合テスト開始\n');

  // Test 1: Health check
  console.log('1️⃣  ヘルスチェック...');
  try {
    const healthResponse = await fetch('http://localhost:8000/health');
    const health = await healthResponse.json();
    console.log('✓ バックエンド稼働中:', health);
  } catch (error) {
    console.error('✗ バックエンド接続失敗:', error.message);
    process.exit(1);
  }

  // Test 2: Reference data
  console.log('\n2️⃣  参照データ取得...');
  try {
    const refResponse = await fetch(`${API_URL}/reference/design_outdoor_conditions`);
    const refData = await refResponse.json();
    const recordCount = refData.data.records.length;
    console.log(`✓ 設計外気条件データ取得成功: ${recordCount}地点`);
    console.log(`  サンプル: ${refData.data.records[0].city} - 夏期: ${refData.data.records[0].cooling_drybulb_daily_max_c}°C`);
  } catch (error) {
    console.error('✗ 参照データ取得失敗:', error.message);
  }

  // Test 3: Calculate heat load
  console.log('\n3️⃣  負荷計算実行...');
  try {
    const calcResponse = await fetch(`${API_URL}/calc/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ project: testProject }),
    });

    if (!calcResponse.ok) {
      const errorText = await calcResponse.text();
      throw new Error(`HTTP ${calcResponse.status}: ${errorText}`);
    }

    const result = await calcResponse.json();
    console.log('✓ 計算完了');
    console.log(`\n📊 計算結果サマリー:`);
    console.log(`  - 室数: ${result.room_results.length}`);
    console.log(`  - 系統数: ${result.system_results.length}`);

    // Show room results
    console.log(`\n  室別負荷:`);
    result.room_results.forEach((room) => {
      const summerTotal = room.final_totals.cool_9 + room.final_totals.cool_latent || 0;
      const winterTotal = room.final_totals.heat_sensible + room.final_totals.heat_latent || 0;
      console.log(`    - ${room.room_name}:`);
      console.log(`      夏期: ${summerTotal.toFixed(0)} W`);
      console.log(`      冬期: ${winterTotal.toFixed(0)} W`);
    });

    // Show system results
    console.log(`\n  系統別負荷:`);
    result.system_results.forEach((system) => {
      const summerTotal = (system.totals.cool_9 || 0) + (system.totals.cool_latent || 0);
      const winterTotal = (system.totals.heat_sensible || 0) + (system.totals.heat_latent || 0);
      console.log(`    - ${system.system_name}:`);
      console.log(`      夏期合計: ${summerTotal.toFixed(0)} W (${(summerTotal / 1000).toFixed(1)} kW)`);
      console.log(`      冬期合計: ${winterTotal.toFixed(0)} W (${(winterTotal / 1000).toFixed(1)} kW)`);
      console.log(`      室数: ${system.room_ids.length}`);
    });

    console.log('\n✅ 全テスト成功！');
    console.log('\n💡 バックエンドとフロントエンドの統合が正常に動作しています。');
    console.log('   フロントエンドから負荷計算を実行すると、このバックエンドAPIが使用されます。');

    return result;
  } catch (error) {
    console.error('✗ 計算実行失敗:', error.message);
    process.exit(1);
  }
}

// Run the test
testBackend().catch((error) => {
  console.error('テスト失敗:', error);
  process.exit(1);
});
