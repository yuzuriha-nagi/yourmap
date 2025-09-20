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
    stations: ['博多', '竹下', '笹原', '南福岡', '春日', '大野城', '水城', '都府楼南', '二日市'],
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
    stations: ['博多', '吉塚', '箱崎', '千早', '香椎', '香椎神宮', '須恵', '宇美'],
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
    stations: ['西鉄福岡（天神）', '薬院', '西鉄平尾', '高宮', '大橋', '井尻', '雑餉隈', '桜並木', '春日原', '白木原', '下大利', '都府楼前', '西鉄二日市', '紫', '朝倉街道', '桜台', '筑紫', '津古', '三国が丘', '三沢', '大保', '西鉄小郡', '端間', '味坂', '宮の陣', '櫛原', '西鉄久留米', '花畑', '聖マリア病院前', '津福', '安武', '大善寺', '三潴', '犬塚', '大溝', '八丁牟田', '蒲池', '矢加部', '西鉄柳川', '徳益', '塩塚', '西鉄中島', '江の浦', '開', '西鉄渡瀬', '倉永', '東甘木', '西鉄銀水', '新栄町', '大牟田'],
    bounds: {
      center: [33.31, 130.42],
      zoom: 10
    }
  }
];

export async function GET(
  request: Request,
  { params }: { params: { lineId: string } }
) {
  try {
    const lineId = params.lineId;
    const line = lines.find(l => l.id === lineId);

    if (!line) {
      return NextResponse.json(
        { error: 'Line not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(line);
  } catch (error) {
    console.error('Error fetching line:', error);
    return NextResponse.json(
      { error: 'Failed to fetch line' },
      { status: 500 }
    );
  }
}