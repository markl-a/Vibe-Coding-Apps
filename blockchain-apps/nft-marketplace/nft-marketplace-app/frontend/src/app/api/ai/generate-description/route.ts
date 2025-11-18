import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { name, attributes } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const attributesText = attributes
      ?.map((attr: any) => `${attr.trait_type}: ${attr.value}`)
      .join(', ');

    const prompt = `Generate an engaging and creative description for an NFT with the following details:
Name: ${name}
${attributesText ? `Attributes: ${attributesText}` : ''}

The description should be:
- 2-3 sentences long
- Highlight unique features
- Appeal to collectors
- Be professional yet creative`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an NFT expert who writes compelling descriptions for digital collectibles.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const description = completion.choices[0].message.content?.trim();

    return NextResponse.json({ description });
  } catch (error) {
    console.error('Error generating description:', error);
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    );
  }
}
