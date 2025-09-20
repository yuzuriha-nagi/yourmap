import { NextResponse } from 'next/server';

// JR九州の路線データ
const lines = [
  {
    id: 'kagoshima_main_line',
    name: 'JR鹿児島本線',
    operator: 'JR-Kyushu',
    area: '福岡',
    type: 'train',
    color: '#FF6600',
    description: '博多から熊本方面への主要路線',
    stations: ['博多', '竹下', '春日', '大野城', '水城', '都府楼前', '二日市'],
    bounds: {
      center: [33.55, 130.45],
      zoom: 12
    }
  },
  {
    id: 'fukuhoku_yutaka_line',
    name: 'JR福北ゆたか線',
    operator: 'JR-Kyushu',
    area: '福岡',
    type: 'train',
    color: '#0072BC',
    description: '博多から折尾方面を結ぶ路線',
    stations: ['博多', '吉塚', '香椎', '香椎神宮', '須恵', '宇美'],
    bounds: {
      center: [33.65, 130.45],
      zoom: 12
    }
  },
  {
    id: 'chikuhi_line',
    name: 'JR筑肥線',
    operator: 'JR-Kyushu',
    area: '福岡',
    type: 'train',
    color: '#00A651',
    description: '博多から唐津方面への路線',
    stations: ['博多', '姪浜', '九大学研都市', '今宿'],
    bounds: {
      center: [33.58, 130.25],
      zoom: 11
    }
  },
  {
    id: 'nishitetsu_tenjin_omuta_line',
    name: '西鉄天神大牟田線',
    operator: 'Nishitetsu',
    area: '福岡',
    type: 'train',
    color: '#E60012',
    description: '天神から大牟田まで福岡県を南北に縦断',
    stations: [
      '西鉄福岡（天神）', '薬院', '西鉄平尾', '高宮', '大橋', '井尻', '春日原', '白水', '大橋', '下大利', '都府楼前', '二日市', '朝倉街道', '桜台', '筑紫野', '鬼沢', '小郡', '大保', '津古', '三国が丘', '三沢', '大善寺', '花畑', '試験場前', '津福', '安武', '久留米', '櫛原', '西牟田', '宮の陣', '学校前', '善導寺', '筑後草野', '大城', '金島', '三潴', '犬塚', '大溝', '八丁牟田', '蒲池', '矢加部', '徳益', '沖端', '塩塚', '西鉄柳川', '東津留', '西鉄中島', '江の浦', '開', '銀水', '新栄町', '西鉄大牟田'
    ],
    bounds: {
      center: [33.31, 130.42],
      zoom: 10
    }
  }
];

export async function GET() {
  try {
    return NextResponse.json(lines);
  } catch (error) {
    console.error('Error fetching lines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lines' },
      { status: 500 }
    );
  }
}