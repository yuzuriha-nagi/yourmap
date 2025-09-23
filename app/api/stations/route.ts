import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_ODPT_API_KEY || process.env.ODPT_API_KEY;
  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

  // JR九州福岡エリアの駅データ
  const kyushuStations = [
    // 博多駅（JR鹿児島本線・山陽本線）- 出典: Mapion 33.589783, 130.420591
    { id: 'jrkyushu_hakata', name: '博多', nameEn: 'Hakata', location: { latitude: 33.589783, longitude: 130.420591 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB01' },

    // 鹿児島本線（門司港～博多～熊本～鹿児島）- 正確な座標データ（出典: 地図マピオン）
    // 主要駅のみ正確な座標で追加
    { id: 'jrkyushu_mojiko', name: '門司港', nameEn: 'Mojiko', location: { latitude: 33.94496885, longitude: 130.96141047 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA01' },
    { id: 'jrkyushu_kokura', name: '小倉', nameEn: 'Kokura', location: { latitude: 33.88712398, longitude: 130.8828608 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA04' },

    // 鹿児島本線 門司港～博多間 全32駅
    { id: 'jrkyushu_komorie', name: '小森江', nameEn: 'Komorie', location: { latitude: 33.9164, longitude: 130.9387 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA02' },
    { id: 'jrkyushu_moji', name: '門司', nameEn: 'Moji', location: { latitude: 33.9043, longitude: 130.9334 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA03' },
    { id: 'jrkyushu_nishikokura', name: '西小倉', nameEn: 'Nishi-Kokura', location: { latitude: 33.88854025, longitude: 130.87386717 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA05' },
    { id: 'jrkyushu_kyushukodaimae', name: '九州工大前', nameEn: 'Kyushu-Kodai-mae', location: { latitude: 33.90040493, longitude: 130.84006711 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA06' },
    { id: 'jrkyushu_tobata', name: '戸畑', nameEn: 'Tobata', location: { latitude: 33.89707993, longitude: 130.82029119 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA07' },
    { id: 'jrkyushu_edamitsu', name: '枝光', nameEn: 'Edamitsu', location: { latitude: 33.87942073, longitude: 130.81317573 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA08' },
    { id: 'jrkyushu_spaceworld', name: 'スペースワールド', nameEn: 'Space World', location: { latitude: 33.87154091, longitude: 130.80674313 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA09' },
    { id: 'jrkyushu_yahata', name: '八幡', nameEn: 'Yahata', location: { latitude: 33.86896878, longitude: 130.79529424 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA10' },
    { id: 'jrkyushu_kurosaki', name: '黒崎', nameEn: 'Kurosaki', location: { latitude: 33.86703236, longitude: 130.76666918 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA11' },
    { id: 'jrkyushu_jinnoharu', name: '陣原', nameEn: 'Jinno-haru', location: { latitude: 33.86816507, longitude: 130.7429907 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA12' },
    { id: 'jrkyushu_orio', name: '折尾', nameEn: 'Orio', location: { latitude: 33.86400666, longitude: 130.71241579 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA13' },
    { id: 'jrkyushu_mizumaki', name: '水巻', nameEn: 'Mizumaki', location: { latitude: 33.85260487, longitude: 130.69623987 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA14' },
    { id: 'jrkyushu_ongagawa', name: '遠賀川', nameEn: 'Ongagawa', location: { latitude: 33.84695788, longitude: 130.6733087 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA15' },
    { id: 'jrkyushu_ebitsu', name: '海老津', nameEn: 'Ebitsu', location: { latitude: 33.84014661, longitude: 130.62376059 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA16' },
    { id: 'jrkyushu_kyoikudaimae', name: '教育大前', nameEn: 'Kyoikudai-mae', location: { latitude: 33.80845245, longitude: 130.59175326 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA17' },
    { id: 'jrkyushu_akama', name: '赤間', nameEn: 'Akama', location: { latitude: 33.80826865, longitude: 130.56960527 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA18' },
    { id: 'jrkyushu_togo', name: '東郷', nameEn: 'Togo', location: { latitude: 33.79434448, longitude: 130.52865387 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA19' },
    { id: 'jrkyushu_higashifukuma', name: '東福間', nameEn: 'Higashi-Fukuma', location: { latitude: 33.7738021, longitude: 130.51060887 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA20' },
    { id: 'jrkyushu_fukuma', name: '福間', nameEn: 'Fukuma', location: { latitude: 33.76373611, longitude: 130.48717237 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA21' },
    { id: 'jrkyushu_chidori', name: '千鳥', nameEn: 'Chidori', location: { latitude: 33.74859874, longitude: 130.47605989 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA22' },
    { id: 'jrkyushu_koga', name: '古賀', nameEn: 'Koga', location: { latitude: 33.73235043, longitude: 130.46662229 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA23' },
    { id: 'jrkyushu_shishibu', name: 'ししぶ', nameEn: 'Shishibu', location: { latitude: 33.7217099, longitude: 130.45830383 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA24' },
    { id: 'jrkyushu_shinguchuo', name: '新宮中央', nameEn: 'Shingu-Chuo', location: { latitude: 33.711572, longitude: 130.44931332 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA25' },
    { id: 'jrkyushu_fukkodaimae', name: '福工大前', nameEn: 'Fukko-dai-mae', location: { latitude: 33.69837334, longitude: 130.44013951 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA26' },
    { id: 'jrkyushu_kyusandaimae', name: '九産大前', nameEn: 'Kyusan-dai-mae', location: { latitude: 33.67372339, longitude: 130.44120668 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA27' },

    // 鹿児島本線として追加が必要な駅（福北ゆたか線と共通）
    { id: 'jrkyushu_kashii_kagoshima', name: '香椎', nameEn: 'Kashii', location: { latitude: 33.65913072, longitude: 130.44372354 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA28' },
    { id: 'jrkyushu_chihaya_kagoshima', name: '千早', nameEn: 'Chihaya', location: { latitude: 33.64928729, longitude: 130.4404741 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA29' },
    { id: 'jrkyushu_hakozaki_kagoshima', name: '箱崎', nameEn: 'Hakozaki', location: { latitude: 33.61816281, longitude: 130.42692067 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA30' },
    { id: 'jrkyushu_yoshizuka_kagoshima', name: '吉塚', nameEn: 'Yoshizuka', location: { latitude: 33.60703633, longitude: 130.42377675 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JA31' },

    // 博多南方面の駅
    { id: 'jrkyushu_takeshita', name: '竹下', nameEn: 'Takeshita', location: { latitude: 33.5685, longitude: 130.4317 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB02' },
    { id: 'jrkyushu_sasahara', name: '笹原', nameEn: 'Sasahara', location: { latitude: 33.5536, longitude: 130.4486 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB03' },
    { id: 'jrkyushu_minamifukuoka', name: '南福岡', nameEn: 'Minami-Fukuoka', location: { latitude: 33.5424, longitude: 130.4593 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB04' },

    // 春日から荒尾までの鹿児島本線の駅
    { id: 'jrkyushu_kasuga', name: '春日', nameEn: 'Kasuga', location: { latitude: 33.5353481, longitude: 130.46855792 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB05' },
    { id: 'jrkyushu_onojo', name: '大野城', nameEn: 'Onojo', location: { latitude: 33.52548284, longitude: 130.47959609 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB06' },
    { id: 'jrkyushu_mizuki', name: '水城', nameEn: 'Mizuki', location: { latitude: 33.51782282, longitude: 130.49017874 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB07' },
    { id: 'jrkyushu_tofurominami', name: '都府楼南', nameEn: 'Tofuro-minami', location: { latitude: 33.503147222222225, longitude: 130.50674444444445 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB08' },
    { id: 'jrkyushu_futsukaichi', name: '二日市', nameEn: 'Futsukaichi', location: { latitude: 33.4950778, longitude: 130.5185972 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB09' },
    { id: 'jrkyushu_tenpaizan', name: '天拝山', nameEn: 'Tenpaizan', location: { latitude: 33.48186944444445, longitude: 130.53033333333335 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB10' },
    { id: 'jrkyushu_harada', name: '原田', nameEn: 'Harada', location: { latitude: 33.45111, longitude: 130.5394 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB11' },
    { id: 'jrkyushu_keyakidai', name: 'けやき台', nameEn: 'Keyakidai', location: { latitude: 33.4343944, longitude: 130.5333639 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB12' },
    { id: 'jrkyushu_kiyama', name: '基山', nameEn: 'Kiyama', location: { latitude: 33.42093611111111, longitude: 130.5322027777778 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB13' },
    { id: 'jrkyushu_yayoigaoka', name: '弥生が丘', nameEn: 'Yayoigaoka', location: { latitude: 33.4021778, longitude: 130.5283306 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB14' },
    { id: 'jrkyushu_tashiro', name: '田代', nameEn: 'Tashiro', location: { latitude: 33.384008333333334, longitude: 130.52449722222224 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB15' },
    { id: 'jrkyushu_tosu', name: '鳥栖', nameEn: 'Tosu', location: { latitude: 33.37383147, longitude: 130.51934385 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB16' },
    { id: 'jrkyushu_hizenasahi', name: '肥前旭', nameEn: 'Hizen-Asahi', location: { latitude: 33.350236111111, longitude: 130.49598055555555 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB17' },
    { id: 'jrkyushu_kurume', name: '久留米', nameEn: 'Kurume', location: { latitude: 33.32042615, longitude: 130.50158298 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB18' },
    { id: 'jrkyushu_araki', name: '荒木', nameEn: 'Araki', location: { latitude: 33.2761028, longitude: 130.5024944 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB19' },
    { id: 'jrkyushu_nishimuta', name: '西牟田', nameEn: 'Nishimuta', location: { latitude: 33.2465694, longitude: 130.5009667 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB20' },
    { id: 'jrkyushu_hainuzuka', name: '羽犬塚', nameEn: 'Hainuzuka', location: { latitude: 33.21035555555556, longitude: 130.4980861111111 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB21' },
    { id: 'jrkyushu_chikugofunagoya', name: '筑後船小屋', nameEn: 'Chikugo-Funagoya', location: { latitude: 33.177917, longitude: 130.492389 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB22' },
    { id: 'jrkyushu_setaka', name: '瀬高', nameEn: 'Setaka', location: { latitude: 33.1569611, longitude: 130.485139 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB23' },
    { id: 'jrkyushu_minamisetaka', name: '南瀬高', nameEn: 'Minami-Setaka', location: { latitude: 33.133694, longitude: 130.471178 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB24' },
    { id: 'jrkyushu_wataze', name: '渡瀬', nameEn: 'Wataze', location: { latitude: 33.099889, longitude: 130.459778 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB25' },
    { id: 'jrkyushu_yoshino', name: '吉野', nameEn: 'Yoshino', location: { latitude: 33.0758167, longitude: 130.4664361 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB26' },
    { id: 'jrkyushu_ginsui', name: '銀水', nameEn: 'Ginsui', location: { latitude: 33.054861, longitude: 130.461028 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB27' },
    { id: 'jrkyushu_omuta', name: '大牟田', nameEn: 'Omuta', location: { latitude: 33.02959438, longitude: 130.44364307 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB28' },
    { id: 'jrkyushu_arao', name: '荒尾', nameEn: 'Arao', location: { latitude: 32.99430383, longitude: 130.43421704 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB29' },

    // 熊本方面の主要駅（正確な座標）
    { id: 'jrkyushu_kumamoto', name: '熊本', nameEn: 'Kumamoto', location: { latitude: 32.79010398, longitude: 130.6888273 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JB35' },

    // 鹿児島方面の主要駅（正確な座標）
    { id: 'jrkyushu_kagoshima_chuo', name: '鹿児島中央', nameEn: 'Kagoshima-Chuo', location: { latitude: 31.58367891, longitude: 130.54180976 }, operator: 'odpt.Operator:JR-Kyushu', railway: 'odpt.Railway:JR-Kyushu.Kagoshima', stationCode: 'JC12' },

    // 北九州モノレール（小倉～企救丘）
    { id: 'kitakyushu_monorail_kokura', name: '小倉駅', nameEn: 'Kokura Station', location: { latitude: 33.88655600, longitude: 130.88208300 }, operator: 'odpt.Operator:KitakyushuMonorail', railway: 'odpt.Railway:KitakyushuMonorail', stationCode: 'M01' },
    { id: 'kitakyushu_monorail_heiwadori', name: '平和通', nameEn: 'Heiwa-dori', location: { latitude: 33.88311100, longitude: 130.88122200 }, operator: 'odpt.Operator:KitakyushuMonorail', railway: 'odpt.Railway:KitakyushuMonorail', stationCode: 'M02' },
    { id: 'kitakyushu_monorail_tanga', name: '旦過', nameEn: 'Tanga', location: { latitude: 33.88063900, longitude: 130.88019400 }, operator: 'odpt.Operator:KitakyushuMonorail', railway: 'odpt.Railway:KitakyushuMonorail', stationCode: 'M03' },
    { id: 'kitakyushu_monorail_kawaraguchi_mihagino', name: '香春口三萩野', nameEn: 'Kawaraguchi-mihagino', location: { latitude: 33.87319444, longitude: 130.88061111 }, operator: 'odpt.Operator:KitakyushuMonorail', railway: 'odpt.Railway:KitakyushuMonorail', stationCode: 'M04' },
    { id: 'kitakyushu_monorail_katano', name: '片野', nameEn: 'Katano', location: { latitude: 33.86547222, longitude: 130.88005556 }, operator: 'odpt.Operator:KitakyushuMonorail', railway: 'odpt.Railway:KitakyushuMonorail', stationCode: 'M05' },
    { id: 'kitakyushu_monorail_jono', name: '城野', nameEn: 'Jono', location: { latitude: 33.85830600, longitude: 130.87961100 }, operator: 'odpt.Operator:KitakyushuMonorail', railway: 'odpt.Railway:KitakyushuMonorail', stationCode: 'M06' },
    { id: 'kitakyushu_monorail_kitagata', name: '北方', nameEn: 'Kitagata', location: { latitude: 33.84911111, longitude: 130.87805556 }, operator: 'odpt.Operator:KitakyushuMonorail', railway: 'odpt.Railway:KitakyushuMonorail', stationCode: 'M07' },
    { id: 'kitakyushu_monorail_keibajomae', name: '競馬場前', nameEn: 'Keibajo-mae', location: { latitude: 33.84294444, longitude: 130.87658333 }, operator: 'odpt.Operator:KitakyushuMonorail', railway: 'odpt.Railway:KitakyushuMonorail', stationCode: 'M08' },
    { id: 'kitakyushu_monorail_moritsune', name: '守恒', nameEn: 'Moritsune', location: { latitude: 33.83658300, longitude: 130.87283300 }, operator: 'odpt.Operator:KitakyushuMonorail', railway: 'odpt.Railway:KitakyushuMonorail', stationCode: 'M09' },
    { id: 'kitakyushu_monorail_tokuryoku_kodanmae', name: '徳力公団前', nameEn: 'Tokuryoku-kodan-mae', location: { latitude: 33.83041700, longitude: 130.86752800 }, operator: 'odpt.Operator:KitakyushuMonorail', railway: 'odpt.Railway:KitakyushuMonorail', stationCode: 'M10' },
    { id: 'kitakyushu_monorail_tokuryoku_arashiyamaguchi', name: '徳力嵐山口', nameEn: 'Tokuryoku-arashiyama-guchi', location: { latitude: 33.82477800, longitude: 130.86375000 }, operator: 'odpt.Operator:KitakyushuMonorail', railway: 'odpt.Railway:KitakyushuMonorail', stationCode: 'M11' },
    { id: 'kitakyushu_monorail_shii', name: '志井', nameEn: 'Shii', location: { latitude: 33.82258333, longitude: 130.87130556 }, operator: 'odpt.Operator:KitakyushuMonorail', railway: 'odpt.Railway:KitakyushuMonorail', stationCode: 'M12' },
    { id: 'kitakyushu_monorail_kikugaoka', name: '企救丘', nameEn: 'Kikugaoka', location: { latitude: 33.81963889, longitude: 130.87766667 }, operator: 'odpt.Operator:KitakyushuMonorail', railway: 'odpt.Railway:KitakyushuMonorail', stationCode: 'M13' },

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