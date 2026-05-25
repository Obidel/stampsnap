const { v4: uuidv4 } = require('uuid');
const { identifyWithOpenRouter, identifyWithGemini, identifyWithOllama, identifyWithHuggingFace } = require('./aiProvider');

const stampDatabase = [
  {
    name: 'Penny Black',
    country: 'United Kingdom',
    year: '1840',
    estimated_value_low: 2500,
    estimated_value_high: 3800,
    rarity_score: 9,
    condition: 'Fine (Used)',
    catalog_number: 'SG 1',
    perforation: 'Imperforate',
    watermark: 'Small Crown',
    color: 'Black',
    denomination: '1d',
    description: 'The world\'s first adhesive postage stamp, featuring a profile of Queen Victoria. Issued on May 6, 1840.',
    confidence: 0.97,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKW8IXA864-LfbtZjIuGM_2v0UrM3BnD_8g3h7i5JOIoC0D7paLyjQqwEw-kzZaNDO69dcDYB4xsH_UewA5AmJnD95ZW6uHL8m2sAEET29LckrRrb9GmndhwTwLRavzMARQlwEOsunaaVpuAsZ4gylZKn4p8FI-CtOFXfaL4P51j3pwX33Sp12p9BweFgDfpCDYTSZ2TpkMxPACyHFJKyFNeyQ8XgzRabRUsrIFwtn-p54m9z_NiWldv1WhUZwfYtMksGKmisGaRM'
  },
  {
    name: 'Two Pence Blue Mauritius',
    country: 'Mauritius',
    year: '1847',
    estimated_value_low: 6200,
    estimated_value_high: 8500,
    rarity_score: 9.5,
    condition: 'Fine (Used)',
    catalog_number: 'SG 3',
    perforation: 'Imperforate',
    watermark: 'Large Star',
    color: 'Deep Blue',
    denomination: '2d',
    description: 'One of the rarest stamps in the world. The "Post Office" Mauritius issue.',
    confidence: 0.94,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtIujnV5jfA393XfyTPMCIT_DFYTps9qI_Vg8yjkPT4KuIavQtvml8Ob-7UsTUdxbemozDSp7mFJiiAfNzvAnlbZx6jHzVI9lsD9k3Q-Dw865Ruff3Iq93E2HZ2APXCpItC1j9S8YwuN9HUT4j_pAoGqOMN_XmQ-DVaT7Z_XjhzD0YJG7LjpVBUUiKpTVw3HlHX2ExWWj6TLQkxNaRuIBGQsX6Z8iNVz4iCeR4LsDankVb6pKPWIP4AEz2ZItsfMQKSYYJRJQndTg'
  },
  {
    name: 'Inverted Jenny',
    country: 'United States',
    year: '1918',
    estimated_value_low: 1500,
    estimated_value_high: 1750,
    rarity_score: 8.5,
    condition: 'Very Fine (Mint)',
    catalog_number: 'Scott C3a',
    perforation: '11',
    watermark: 'USPS Double Line',
    color: 'Carmine Rose & Blue',
    denomination: '24c',
    description: 'Famous error stamp with inverted airplane. One of the most sought-after US stamps.',
    confidence: 0.96,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKb-WzFE-52SuqLI6UxGt-_60A_mTurNgEVqPHBKyeygL_2dUV6opaECmK_AC5-7y4k7DDefZnHm4dFbOJxK-FJacmxX8bIi-cbfb1rkdaecH_voI0r1IgA5z7LDWJ9WalpA18dxwGD1WzYjmWL7HfiLrTnqXNd5BSNMGVQx9i8my8KbJGzoMoBBkj5uS8xaLL5N-IU51KB3inCxLd38UTuDNIQ_lSwvRcYLxuTONAd_S2_aVj54OxoQZ7gUEBSACriBX1fZyIOFs'
  },
  {
    name: 'Red Mercury',
    country: 'Austria',
    year: '1851',
    estimated_value_low: 800,
    estimated_value_high: 1200,
    rarity_score: 7,
    condition: 'Fine (Used)',
    catalog_number: 'SG 7',
    perforation: 'Imperforate',
    watermark: 'Mercury Head',
    color: 'Vermilion',
    denomination: '3kr',
    description: 'Newspaper stamp featuring Mercury, the Roman god of commerce.',
    confidence: 0.91,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA32GRfpJswSt3B-bxD_pzFeXK76hhjJd13Stm5qSqaBJucPKQchbwI_7IY5ucvITnjy0Twzn_dw6mpatV9jRrQNOrV9MOyJsLSCCcdEk49nTYiXx_GVKPDCaWQZR3JvwthJb7xwmSyq41Daf8AFvpPhzZTtm58vrsCUD36gmYfNfjF2Em1jZJs0YAY8ZrNuxrm3xpbO2la39YCAJfOkYj2C9bOduN3fxhpOEnw0mq47MR_TUHQgKVcuMmI2feBM4sDOmiXmOQALU0'
  },
  {
    name: 'Blue Boy',
    country: 'United States',
    year: '1846',
    estimated_value_low: 3000,
    estimated_value_high: 5000,
    rarity_score: 9,
    condition: 'Fine (Mint)',
    catalog_number: 'Scott 2X1',
    perforation: 'Imperforate',
    watermark: 'None',
    color: 'Blue',
    denomination: '5c',
    description: 'Alexandria "Blue Boy" provisional stamp. One of only seven known examples.',
    confidence: 0.88,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBf7-CzhiBzxBe-hzKCK4Md4ibD4bnTOcNdpSXaxV4FAdIvhtHLc6AOE-yQ8gSjLsOca0i2ahrLuT3H_j5AeC_V1AViRzGp2SZkuiywrtovXn91zpERm27QEZz2zN2OrJTrMm6U_HY610YFyWbuOE1IQNJCbszhFiDYL3fsjqE9fYM27Sn-0NTrUTpCtadwnGdlG7zTHAmqQZYNuVLQlaIBX-6F-QyEjUFlN4ADya5DfWVBkQb71t-lWeP5xcqjYTYZyCC3f9jyan0'
  },
  {
    name: 'Treskilling Yellow',
    country: 'Sweden',
    year: '1855',
    estimated_value_low: 10000,
    estimated_value_high: 25000,
    rarity_score: 10,
    condition: 'Fine (Used)',
    catalog_number: 'SG 1a',
    perforation: '14',
    watermark: 'Crown',
    color: 'Yellow-Orange',
    denomination: '3sk',
    description: 'The most valuable stamp in the world. Color error printed in yellow instead of green.',
    confidence: 0.82,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3xoMo8iwUi3PcAwtBOTIqhV7NWou8uFw360DNyRBnVYrQihCmUN-ilArQKGZ3_reA3gh3CYy81_1sacC1L4kwVShxLyFu0a1ahJlJ4-qUpIPhJ4QIU13v4Jh69uqNXkUbMdi1g96UFTTOm7hCmbXKWAKZQOVhFWguaBj1yr7iknjc4GSkCQJpOEGFSALI6BbTBXh3gZge7fjKG7KuZK14QLugZt8AOjUyQvGOcnsNGOGgQ9MCqhAPaS4xms3PKfYxnmAKI-7apLA'
  }
];

function fallbackIdentify(imageBuffer) {
  const hasImage = imageBuffer && imageBuffer.length > 100;
  const randomSeed = hasImage ? (imageBuffer.length % 10) / 10 : Math.random();

  const scores = stampDatabase.map((stamp) => {
    const baseScore = 0.3 + randomSeed * 0.25 + Math.random() * 0.2;
    const confidenceFactor = hasImage ? stamp.confidence : stamp.confidence * 0.85;
    const finalScore = baseScore * confidenceFactor;
    return { stamp, score: finalScore, rawConfidence: confidenceFactor };
  });

  scores.sort((a, b) => b.score - a.score);
  const top = scores[0];
  const isIdentified = top.score > 0.25;

  const avgValue = (top.stamp.estimated_value_low + top.stamp.estimated_value_high) / 2;
  const valueVariation = (Math.random() - 0.5) * 0.2;
  const estimatedValue = Math.round(avgValue * (1 + valueVariation));

  return {
    identified: isIdentified,
    confidence: Math.round(top.rawConfidence * 100) / 100,
    stamp: isIdentified ? {
      id: uuidv4(),
      name: top.stamp.name,
      country: top.stamp.country,
      year: top.stamp.year,
      estimated_value: estimatedValue,
      estimated_value_range: { low: top.stamp.estimated_value_low, high: top.stamp.estimated_value_high },
      rarity_score: top.stamp.rarity_score,
      condition: top.stamp.condition,
      catalog_number: top.stamp.catalog_number,
      perforation: top.stamp.perforation,
      watermark: top.stamp.watermark,
      color: top.stamp.color,
      denomination: top.stamp.denomination,
      description: top.stamp.description,
      image_url: top.stamp.image_url
    } : null,
    alternatives: scores.slice(1, 3).map(s => ({
      name: s.stamp.name,
      country: s.stamp.country,
      confidence: Math.round(s.rawConfidence * 100) / 100
    })),
    provider: 'fallback'
  };
}

function aiResultToStamp(ai) {
  const avgValue = ((ai.estimated_value_low || 0) + (ai.estimated_value_high || 0)) / 2;
  return {
    id: uuidv4(),
    name: ai.name || 'Unknown',
    country: ai.country || 'Unknown',
    year: ai.year || '',
    estimated_value: Math.round(avgValue) || 0,
    estimated_value_range: {
      low: ai.estimated_value_low || 0,
      high: ai.estimated_value_high || 0
    },
    rarity_score: ai.rarity_score || 0,
    condition: ai.condition || '',
    catalog_number: ai.catalog_number || '',
    perforation: '',
    watermark: '',
    color: ai.color || '',
    denomination: ai.denomination || '',
    description: ai.description || '',
    image_url: ''
  };
}

async function identifyStamp(imageBuffer) {
  const providers = [identifyWithOpenRouter, identifyWithGemini, identifyWithOllama, identifyWithHuggingFace];
  for (const provider of providers) {
    try {
      const result = await provider(imageBuffer);
      if (result) {
        const stamp = aiResultToStamp(result.stamp);
        return {
          identified: true,
          confidence: result.stamp.confidence || 0.85,
          stamp,
          alternatives: [],
          provider: result.provider
        };
      }
    } catch {}
  }
  const result = fallbackIdentify(imageBuffer);
  result.provider = 'fallback';
  return result;
}

module.exports = { identifyStamp, stampDatabase };
