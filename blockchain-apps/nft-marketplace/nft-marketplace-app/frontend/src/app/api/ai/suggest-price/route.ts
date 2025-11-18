import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { metadata } = await request.json();

    if (!metadata) {
      return NextResponse.json(
        { error: 'Metadata is required' },
        { status: 400 }
      );
    }

    const prompt = `Based on the following NFT metadata, suggest a reasonable starting price in ETH:

Name: ${metadata.name}
Description: ${metadata.description}
${
  metadata.attributes
    ? `Attributes: ${metadata.attributes
        .map((attr: any) => `${attr.trait_type}: ${attr.value}`)
        .join(', ')}`
    : ''
}

Consider:
- Current NFT market trends
- Rarity of attributes
- Similar NFT prices
- General collectible value

Provide only a number in ETH (e.g., 0.05, 0.1, 0.5, etc.)`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an NFT pricing expert. Provide realistic price suggestions in ETH based on market analysis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 50,
      temperature: 0.5,
    });

    const priceText = completion.choices[0].message.content?.trim();
    const suggestedPrice = parseFloat(priceText || '0.05');

    return NextResponse.json({
      suggestedPrice: isNaN(suggestedPrice) ? 0.05 : suggestedPrice,
      reasoning: `Based on similar NFTs with comparable attributes and the current market conditions.`,
    });
  } catch (error) {
    console.error('Error suggesting price:', error);
    return NextResponse.json(
      { error: 'Failed to suggest price' },
      { status: 500 }
    );
  }
}
