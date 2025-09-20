import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_ODPT_API_KEY || process.env.ODPT_API_KEY;
  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

  // JR九州福岡エリアの駅データ
  const kyushuStations = [
    // 博多駅（JR鹿児島本線・山陽本線）- 出典: Mapion 33.589783, 130.420591
    { id: 'jrkyushu_hakata', name: '博多', nameEn: 'Hakata', location: { latitude: 33.589783, longitude: 130.420591 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB01' },

    // 鹿児島本線（博多～熊本方面）- 出典: 地図マピオン
    { id: 'jrkyushu_takesinai', name: '竹下', nameEn: 'Takeshita', location: { latitude: 33.5685436, longitude: 130.4317327 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB02' },
    { id: 'jrkyushu_sasahara', name: '笹原', nameEn: 'Sasahara', location: { latitude: 33.5625, longitude: 130.4514 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB03' },
    { id: 'jrkyushu_minamifukuoka', name: '南福岡', nameEn: 'Minami-Fukuoka', location: { latitude: 33.5569, longitude: 130.4592 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB04' },
    { id: 'jrkyushu_kasuga', name: '春日', nameEn: 'Kasuga', location: { latitude: 33.5346788, longitude: 130.4693079 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB05' },
    { id: 'jrkyushu_onojo', name: '大野城', nameEn: 'Onojo', location: { latitude: 33.5254828, longitude: 130.4795961 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB06' },
    { id: 'jrkyushu_mizujo', name: '水城', nameEn: 'Mizuki', location: { latitude: 33.5178228, longitude: 130.4901787 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB07' },
    { id: 'jrkyushu_tofurominami', name: '都府楼南', nameEn: 'Tofuro-minami', location: { latitude: 33.503197, longitude: 130.5065304 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB08' },
    { id: 'jrkyushu_futsukaichi', name: '二日市', nameEn: 'Futsukaichi', location: { latitude: 33.4950482, longitude: 130.5186518 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB09' },

    // 福北ゆたか線（博多～折尾）
    { id: 'jrkyushu_yoshitsuka', name: '吉塚', nameEn: 'Yoshizuka', location: { latitude: 33.6114, longitude: 130.4292 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Fukuhoku-Yutaka', stationCode: 'JD01' },
    { id: 'jrkyushu_hakozaki', name: '箱崎', nameEn: 'Hakozaki', location: { latitude: 33.6236, longitude: 130.4214 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Fukuhoku-Yutaka', stationCode: 'JD02' },
    { id: 'jrkyushu_chihaya', name: '千早', nameEn: 'Chihaya', location: { latitude: 33.6397, longitude: 130.4347 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Fukuhoku-Yutaka', stationCode: 'JD03' },
    { id: 'jrkyushu_kashiihama', name: '香椎', nameEn: 'Kashii', location: { latitude: 33.6542, longitude: 130.4428 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Fukuhoku-Yutaka', stationCode: 'JD04' },
    { id: 'jrkyushu_kashiijingu', name: '香椎神宮', nameEn: 'Kashii-Jingu', location: { latitude: 33.6675, longitude: 130.4558 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Fukuhoku-Yutaka', stationCode: 'JD05' },
    { id: 'jrkyushu_sue', name: '須恵', nameEn: 'Sue', location: { latitude: 33.6897, longitude: 130.5336 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Fukuhoku-Yutaka', stationCode: 'JD06' },
    { id: 'jrkyushu_uchigazono', name: '宇美', nameEn: 'Umi', location: { latitude: 33.7114, longitude: 130.5614 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Fukuhoku-Yutaka', stationCode: 'JD07' },

    // 筑肥線（博多～唐津）
    { id: 'jrkyushu_meinohama', name: '姪浜', nameEn: 'Meinohama', location: { latitude: 33.5839, longitude: 130.3172 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Chikuhi', stationCode: 'JC01' },
    { id: 'jrkyushu_kyudaigakuken', name: '九大学研都市', nameEn: 'Kyudai-Gakken-Toshi', location: { latitude: 33.5975, longitude: 130.2172 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Chikuhi', stationCode: 'JC02' },
    { id: 'jrkyushu_imajuku', name: '今宿', nameEn: 'Imajuku', location: { latitude: 33.5892, longitude: 130.1836 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Chikuhi', stationCode: 'JC03' },

    // 西鉄天神大牟田線（全50駅 - 正確な座標で順次追加）
    { id: 'nishitetsu_fukuoka_tenjin', name: '西鉄福岡（天神）', nameEn: 'Nishitetsu-Fukuoka (Tenjin)', location: { latitude: 33.587777, longitude: 130.400698 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T01' },
    { id: 'nishitetsu_yakuin', name: '薬院', nameEn: 'Yakuin', location: { latitude: 33.5817, longitude: 130.4017 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T02' },
    { id: 'nishitetsu_hirao', name: '西鉄平尾', nameEn: 'Nishitetsu-Hirao', location: { latitude: 33.5735399, longitude: 130.4063487 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T03' },
    { id: 'nishitetsu_takamiya', name: '高宮', nameEn: 'Takamiya', location: { latitude: 33.5671823, longitude: 130.4145732 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T04' },
    { id: 'nishitetsu_ohashi', name: '大橋', nameEn: 'Ohashi', location: { latitude: 33.5591409, longitude: 130.4270747 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T05' },
    { id: 'nishitetsu_ijiri', name: '井尻', nameEn: 'Ijiri', location: { latitude: 33.5521930, longitude: 130.4429710 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T06' },
    { id: 'nishitetsu_zasshonokuma', name: '雑餉隈', nameEn: 'Zasshonokuma', location: { latitude: 33.5474216, longitude: 130.4619749 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T07' },
    { id: 'nishitetsu_sakuranamiki', name: '桜並木', nameEn: 'Sakura-namiki', location: { latitude: 33.5444526, longitude: 130.4666524 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T08' },
    { id: 'nishitetsu_kasugabaru', name: '春日原', nameEn: 'Kasugabaru', location: { latitude: 33.5380535, longitude: 130.4729325 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T09' },
    { id: 'nishitetsu_shirakibara', name: '白木原', nameEn: 'Shirakibara', location: { latitude: 33.5285715, longitude: 130.4827180 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T10' },
    { id: 'nishitetsu_shimooori', name: '下大利', nameEn: 'Shimo-Oori', location: { latitude: 33.5220445, longitude: 130.4896898 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T11' },
    { id: 'nishitetsu_tofuromae', name: '都府楼前', nameEn: 'Tofuro-mae', location: { latitude: 33.51203211, longitude: 130.50750782 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T12' },
    { id: 'nishitetsu_futsukaichi', name: '西鉄二日市', nameEn: 'Nishitetsu-Futsukaichi', location: { latitude: 33.5021862, longitude: 130.5178461 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T13' },

    // 正確な座標で順次追加中（出典: 地図マピオン）
    { id: 'nishitetsu_murasaki', name: '紫', nameEn: 'Murasaki', location: { latitude: 33.4964981, longitude: 130.5220153 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T14' },
    { id: 'nishitetsu_asakuragaido', name: '朝倉街道', nameEn: 'Asakura-kaido', location: { latitude: 33.48443015, longitude: 130.5324841 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T15' },
    { id: 'nishitetsu_sakuradai', name: '桜台', nameEn: 'Sakuradai', location: { latitude: 33.47170959, longitude: 130.54215297 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T16' },
    { id: 'nishitetsu_chikushi', name: '筑紫', nameEn: 'Chikushi', location: { latitude: 33.4629441, longitude: 130.5528856 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T17' },
    { id: 'nishitetsu_tsuko', name: '津古', nameEn: 'Tsuko', location: { latitude: 33.44642402, longitude: 130.56556273 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T18' },
    { id: 'nishitetsu_mikunigaoka', name: '三国が丘', nameEn: 'Mikuni-ga-oka', location: { latitude: 33.4365946, longitude: 130.56313542 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T19' },
    { id: 'nishitetsu_misawa', name: '三沢', nameEn: 'Misawa', location: { latitude: 33.42344606, longitude: 130.56046651 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T20' },
    { id: 'nishitetsu_oho', name: '大保', nameEn: 'Oho', location: { latitude: 33.41141959, longitude: 130.55811435 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T21' },
    { id: 'nishitetsu_ogori', name: '西鉄小郡', nameEn: 'Nishitetsu-Ogori', location: { latitude: 33.39644902, longitude: 130.55358735 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T22' },
    { id: 'nishitetsu_hashima', name: '端間', nameEn: 'Hashima', location: { latitude: 33.37887318, longitude: 130.55085197 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T23' },
    { id: 'nishitetsu_ajisaka', name: '味坂', nameEn: 'Ajisaka', location: { latitude: 33.35317593, longitude: 130.54082576 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T24' },
    { id: 'nishitetsu_miyanojin', name: '宮の陣', nameEn: 'Miya-no-jin', location: { latitude: 33.32930898, longitude: 130.53073011 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T25' },
    { id: 'nishitetsu_kushihara', name: '櫛原', nameEn: 'Kushihara', location: { latitude: 33.31969056, longitude: 130.52435314 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T26' },
    { id: 'nishitetsu_kurume', name: '西鉄久留米', nameEn: 'Nishitetsu-Kurume', location: { latitude: 33.31226635, longitude: 130.52114253 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T27' },

    // 残りの駅を暫定座標で追加（後で正確な座標に更新予定）
    { id: 'nishitetsu_hanabatake', name: '花畑', nameEn: 'Hanabatake', location: { latitude: 33.30585586, longitude: 130.51504605 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T28' },
    { id: 'nishitetsu_seimariabyoinmae', name: '聖マリア病院前', nameEn: 'St. Maria Hospital-mae', location: { latitude: 33.30197841, longitude: 130.50995771 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T29' },
    { id: 'nishitetsu_tsufuku', name: '津福', nameEn: 'Tsufuku', location: { latitude: 33.29723984, longitude: 130.49835609 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T30' },
    { id: 'nishitetsu_yasutake', name: '安武', nameEn: 'Yasutake', location: { latitude: 33.28606043, longitude: 130.48864896 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T31' },
    { id: 'nishitetsu_daizenji', name: '大善寺', nameEn: 'Daizenji', location: { latitude: 33.27102298, longitude: 130.47419506 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T32' },
    { id: 'nishitetsu_mizuma', name: '三潴', nameEn: 'Mizuma', location: { latitude: 33.25602741, longitude: 130.46942649 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T33' },
    { id: 'nishitetsu_inudzuka', name: '犬塚', nameEn: 'Inudzuka', location: { latitude: 33.24730328, longitude: 130.46286341 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T34' },
    { id: 'nishitetsu_omizo', name: '大溝', nameEn: 'Omizo', location: { latitude: 33.22698036, longitude: 130.44982903 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T35' },
    { id: 'nishitetsu_hachomuta', name: '八丁牟田', nameEn: 'Hacho-muta', location: { latitude: 33.2089238, longitude: 130.4376194 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T36' },
    { id: 'nishitetsu_kamaike', name: '蒲池', nameEn: 'Kamaike', location: { latitude: 33.18994239, longitude: 130.42289623 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T37' },
    { id: 'nishitetsu_yakabe', name: '矢加部', nameEn: 'Yakabe', location: { latitude: 33.1738663, longitude: 130.41570291 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T38' },
    { id: 'nishitetsu_yanagawa', name: '西鉄柳川', nameEn: 'Nishitetsu-Yanagawa', location: { latitude: 33.16517845, longitude: 130.41921952 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T39' },
    { id: 'nishitetsu_tokueki', name: '徳益', nameEn: 'Tokueki', location: { latitude: 33.1554881, longitude: 130.4266857 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T40' },
    { id: 'nishitetsu_shiozuka', name: '塩塚', nameEn: 'Shiozuka', location: { latitude: 33.14337837, longitude: 130.4312856 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T41' },
    { id: 'nishitetsu_nakashima', name: '西鉄中島', nameEn: 'Nishitetsu-Nakashima', location: { latitude: 33.12251981, longitude: 130.43999926 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T42' },
    { id: 'nishitetsu_enoura', name: '江の浦', nameEn: 'E-no-ura', location: { latitude: 33.10971309, longitude: 130.44644622 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T43' },
    { id: 'nishitetsu_kai', name: '開', nameEn: 'Kai', location: { latitude: 33.09771738, longitude: 130.45272657 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T44' },
    { id: 'nishitetsu_watase', name: '西鉄渡瀬', nameEn: 'Nishitetsu-Watase', location: { latitude: 33.08724648, longitude: 130.45867351 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T45' },
    { id: 'nishitetsu_kuranaga', name: '倉永', nameEn: 'Kuranaga', location: { latitude: 33.07247876, longitude: 130.46384013 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T46' },
    { id: 'nishitetsu_higashiamagi', name: '東甘木', nameEn: 'Higashi-amagi', location: { latitude: 33.06220774, longitude: 130.46421816 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T47' },
    { id: 'nishitetsu_ginsui', name: '西鉄銀水', nameEn: 'Nishitetsu-Ginsui', location: { latitude: 33.05124778, longitude: 130.45835228 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T48' },
    { id: 'nishitetsu_shineimachi', name: '新栄町', nameEn: 'Shinei-machi', location: { latitude: 33.03842688, longitude: 130.4496006 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T49' },
    { id: 'nishitetsu_omuta', name: '大牟田', nameEn: 'Omuta', location: { latitude: 33.02959438, longitude: 130.44364307 }, operator: 'odpt.Operator:Nishitetsu', railway: 'odpt.Railway:Nishitetsu.TenjinOmuta', stationCode: 'T50' }
  ];

  // モックデータを使用する場合は九州データを直接返す
  if (useMockData) {
    return NextResponse.json(kyushuStations);
  }

  if (!apiKey) {
    // APIキーがない場合は九州データをフォールバックとして返す
    return NextResponse.json(kyushuStations);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // 駅情報を取得（JR九州、西鉄、福岡市地下鉄）
    const response = await fetch(
      `https://api.odpt.org/api/v4/odpt:Station?acl:consumerKey=${apiKey}&odpt:operator=odpt.Operator:JR-Kyushu,odpt.Operator:Nishitetsu,odpt.Operator:FukuokaSubway`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'API key is invalid or expired' },
          { status: 401 }
        );
      } else if (response.status === 429) {
        return NextResponse.json(
          { error: 'API rate limit exceeded' },
          { status: 429 }
        );
      } else if (response.status >= 500) {
        return NextResponse.json(
          { error: 'API server error' },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: `API request failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.warn('ODPT API returned invalid format, using fallback data');
      return NextResponse.json(kyushuStations);
    }

    // データが空の場合は西日本データをフォールバックとして使用
    if (data.length === 0) {
      console.warn('ODPT API returned empty data, using West Japan fallback');
      return NextResponse.json(kyushuStations);
    }

    // 駅データを整形
    const stations = data.map((station: Record<string, unknown>) => {
      const stationTitle = station['odpt:stationTitle'] as Record<string, string> | string;
      return {
        id: station['@id'] || station['owl:sameAs'],
        name: typeof stationTitle === 'object' ? stationTitle.ja : stationTitle,
        nameEn: typeof stationTitle === 'object' ? stationTitle.en : undefined,
        operator: station['odpt:operator'],
        railway: station['odpt:railway'],
        location: {
          latitude: station['geo:lat'],
          longitude: station['geo:long']
        },
        stationCode: station['odpt:stationCode']
      };
    }).filter((station: {location: {latitude: unknown; longitude: unknown}}) =>
      // 位置情報があるもののみフィルタ
      station.location.latitude && station.location.longitude
    );

    // フィルタ後にデータが空の場合も西日本データを返す
    if (stations.length === 0) {
      console.warn('No valid station data after filtering, using West Japan fallback');
      return NextResponse.json(kyushuStations);
    }

    return NextResponse.json(stations);

  } catch (error) {
    console.warn('ODPT API request failed, using West Japan fallback:', error);
    // APIリクエストが失敗した場合は西日本データをフォールバックとして返す
    return NextResponse.json(kyushuStations);
  }
}