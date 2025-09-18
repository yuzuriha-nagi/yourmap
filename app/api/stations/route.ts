import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_ODPT_API_KEY || process.env.ODPT_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ODPT API key is not configured' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: 'Invalid API response format' },
        { status: 502 }
      );
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

    return NextResponse.json(stations);

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'API request timeout' },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: `API request failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Unknown API error' },
      { status: 500 }
    );
  }
}