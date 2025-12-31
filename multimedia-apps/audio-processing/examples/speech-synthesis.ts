/**
 * Speech Synthesis Examples
 * Demonstrates text-to-speech (TTS) using various engines and APIs
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';

const execPromise = promisify(exec);

interface TTSOptions {
  voice?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  language?: string;
}

interface VoiceInfo {
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  locale: string;
}

/**
 * Example 1: Basic Text-to-Speech (espeak)
 * Convert text to speech using espeak
 */
export async function textToSpeechEspeak(
  text: string,
  outputPath: string,
  options: TTSOptions = {}
): Promise<void> {
  const {
    speed = 150,
    pitch = 50,
    language = 'en',
  } = options;

  const command = `espeak "${text}" -w "${outputPath}" -s ${speed} -p ${pitch} -v ${language}`;

  try {
    await execPromise(command);
    console.log('Speech generated with espeak');
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

/**
 * Example 2: Text-to-Speech with Google TTS API
 * Using Google Cloud Text-to-Speech (requires API key)
 */
export async function textToSpeechGoogle(
  text: string,
  outputPath: string,
  options: TTSOptions = {}
): Promise<void> {
  // This is a placeholder for Google Cloud TTS integration
  // You would need to install @google-cloud/text-to-speech

  const {
    voice = 'en-US-Standard-A',
    speed = 1.0,
    pitch = 0,
  } = options;

  // Example implementation structure
  console.log(`Would generate speech with Google TTS:`);
  console.log(`Text: ${text}`);
  console.log(`Voice: ${voice}`);
  console.log(`Speed: ${speed}`);
  console.log(`Pitch: ${pitch}`);
  console.log(`Output: ${outputPath}`);

  // Actual implementation would use Google Cloud SDK
  /*
  const textToSpeech = require('@google-cloud/text-to-speech');
  const client = new textToSpeech.TextToSpeechClient();

  const request = {
    input: { text },
    voice: {
      languageCode: voice.substring(0, 5),
      name: voice,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: speed,
      pitch: pitch,
    },
  };

  const [response] = await client.synthesizeSpeech(request);
  await fs.writeFile(outputPath, response.audioContent, 'binary');
  */
}

/**
 * Example 3: Text-to-Speech with Amazon Polly
 * Using AWS Polly (requires AWS credentials)
 */
export async function textToSpeechPolly(
  text: string,
  outputPath: string,
  options: TTSOptions = {}
): Promise<void> {
  const {
    voice = 'Joanna',
    language = 'en-US',
  } = options;

  console.log(`Would generate speech with Amazon Polly:`);
  console.log(`Text: ${text}`);
  console.log(`Voice: ${voice}`);
  console.log(`Language: ${language}`);
  console.log(`Output: ${outputPath}`);

  // Actual implementation would use AWS SDK
  /*
  const AWS = require('aws-sdk');
  const Polly = new AWS.Polly();

  const params = {
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: voice,
  };

  const data = await Polly.synthesizeSpeech(params).promise();
  await fs.writeFile(outputPath, data.AudioStream);
  */
}

/**
 * Example 4: Text-to-Speech with Microsoft Azure
 * Using Azure Cognitive Services Speech
 */
export async function textToSpeechAzure(
  text: string,
  outputPath: string,
  options: TTSOptions = {}
): Promise<void> {
  const {
    voice = 'en-US-AriaNeural',
    language = 'en-US',
  } = options;

  console.log(`Would generate speech with Azure TTS:`);
  console.log(`Text: ${text}`);
  console.log(`Voice: ${voice}`);
  console.log(`Language: ${language}`);
  console.log(`Output: ${outputPath}`);

  // Actual implementation would use Azure SDK
  /*
  const sdk = require('microsoft-cognitiveservices-speech-sdk');
  const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechSynthesisVoiceName = voice;

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
  synthesizer.speakTextAsync(text, result => {
    fs.writeFileSync(outputPath, result.audioData);
  });
  */
}

/**
 * Example 5: Text-to-Speech with festival
 * Using Festival speech synthesis system
 */
export async function textToSpeechFestival(
  text: string,
  outputPath: string
): Promise<void> {
  const tempTextFile = `/tmp/tts-${Date.now()}.txt`;
  await fs.writeFile(tempTextFile, text);

  const command = `text2wave ${tempTextFile} -o ${outputPath}`;

  try {
    await execPromise(command);
    await fs.unlink(tempTextFile);
    console.log('Speech generated with Festival');
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

/**
 * Example 6: Text-to-Speech with say (macOS)
 * Using macOS built-in TTS
 */
export async function textToSpeechMacOS(
  text: string,
  outputPath: string,
  voice: string = 'Alex'
): Promise<void> {
  const command = `say -v ${voice} "${text}" -o ${outputPath} --data-format=LEF32@22050`;

  try {
    await execPromise(command);
    console.log('Speech generated with macOS say');
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
}

/**
 * Example 7: SSML Text-to-Speech
 * Generate speech from SSML markup
 */
export async function textToSpeechSSML(
  ssmlText: string,
  outputPath: string,
  options: TTSOptions = {}
): Promise<void> {
  // SSML example:
  // <speak>
  //   <prosody rate="slow" pitch="+2st">Hello World</prosody>
  //   <break time="500ms"/>
  //   <emphasis level="strong">Important message</emphasis>
  // </speak>

  console.log('Processing SSML for speech synthesis');
  console.log(`SSML: ${ssmlText}`);
  console.log(`Output: ${outputPath}`);

  // Would integrate with TTS service that supports SSML
}

/**
 * Example 8: Multi-voice Speech
 * Generate speech with multiple voices
 */
export async function multiVoiceSpeech(
  segments: Array<{ text: string; voice: string }>,
  outputPath: string
): Promise<void> {
  const tempDir = path.join(path.dirname(outputPath), 'temp_segments');
  await fs.mkdir(tempDir, { recursive: true });

  const segmentPaths: string[] = [];

  // Generate each segment
  for (let i = 0; i < segments.length; i++) {
    const segmentPath = path.join(tempDir, `segment-${i}.wav`);
    await textToSpeechEspeak(segments[i].text, segmentPath, {
      voice: segments[i].voice,
    });
    segmentPaths.push(segmentPath);
  }

  // Concatenate segments
  await concatenateAudioFiles(segmentPaths, outputPath);

  // Clean up
  await fs.rm(tempDir, { recursive: true });

  console.log('Multi-voice speech generated');
}

/**
 * Example 9: Long Text to Speech
 * Split long text and generate speech
 */
export async function longTextToSpeech(
  text: string,
  outputPath: string,
  maxChunkLength: number = 500
): Promise<void> {
  const chunks = splitTextIntoChunks(text, maxChunkLength);
  const tempDir = path.join(path.dirname(outputPath), 'temp_chunks');
  await fs.mkdir(tempDir, { recursive: true });

  const chunkPaths: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkPath = path.join(tempDir, `chunk-${i}.wav`);
    await textToSpeechEspeak(chunks[i], chunkPath);
    chunkPaths.push(chunkPath);
  }

  await concatenateAudioFiles(chunkPaths, outputPath);
  await fs.rm(tempDir, { recursive: true });

  console.log(`Long text converted to speech (${chunks.length} chunks)`);
}

/**
 * Example 10: Text-to-Speech with Background Music
 * Generate speech and mix with background music
 */
export async function textToSpeechWithMusic(
  text: string,
  outputPath: string,
  musicPath: string,
  musicVolume: number = 0.2
): Promise<void> {
  const tempSpeechPath = path.join(
    path.dirname(outputPath),
    'temp-speech.wav'
  );

  // Generate speech
  await textToSpeechEspeak(text, tempSpeechPath);

  // Mix with background music
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(tempSpeechPath)
      .input(musicPath)
      .complexFilter([
        `[1:a]volume=${musicVolume}[music]`,
        '[0:a][music]amix=inputs=2:duration=first',
      ])
      .output(outputPath)
      .on('end', async () => {
        await fs.unlink(tempSpeechPath);
        console.log('Speech with background music generated');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 11: Podcast Intro Generator
 * Generate podcast intro from template
 */
export async function generatePodcastIntro(
  podcastName: string,
  episode: number,
  host: string,
  outputPath: string
): Promise<void> {
  const introText = `Welcome to ${podcastName}, episode ${episode}. I'm your host, ${host}.`;

  await textToSpeechEspeak(introText, outputPath, {
    speed: 150,
    pitch: 50,
  });

  console.log('Podcast intro generated');
}

/**
 * Example 12: Narration Generator
 * Generate narration for video
 */
export async function generateNarration(
  script: Array<{ timestamp: number; text: string }>,
  outputPath: string
): Promise<void> {
  const tempDir = path.join(path.dirname(outputPath), 'temp_narration');
  await fs.mkdir(tempDir, { recursive: true });

  const segments: string[] = [];

  for (let i = 0; i < script.length; i++) {
    const segmentPath = path.join(tempDir, `narration-${i}.wav`);
    await textToSpeechEspeak(script[i].text, segmentPath);
    segments.push(segmentPath);

    // Add silence between segments if needed
    if (i < script.length - 1) {
      const nextTimestamp = script[i + 1].timestamp;
      const currentDuration = await getAudioDuration(segmentPath);
      const silenceDuration = nextTimestamp - script[i].timestamp - currentDuration;

      if (silenceDuration > 0) {
        const silencePath = path.join(tempDir, `silence-${i}.wav`);
        await generateSilence(silencePath, silenceDuration);
        segments.push(silencePath);
      }
    }
  }

  await concatenateAudioFiles(segments, outputPath);
  await fs.rm(tempDir, { recursive: true });

  console.log('Narration generated');
}

/**
 * Example 13: Multilingual Text-to-Speech
 * Generate speech in multiple languages
 */
export async function multilingualSpeech(
  texts: Array<{ text: string; language: string }>,
  outputPath: string
): Promise<void> {
  const tempDir = path.join(path.dirname(outputPath), 'temp_multilingual');
  await fs.mkdir(tempDir, { recursive: true });

  const segmentPaths: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const segmentPath = path.join(tempDir, `segment-${i}.wav`);
    await textToSpeechEspeak(texts[i].text, segmentPath, {
      language: texts[i].language,
    });
    segmentPaths.push(segmentPath);
  }

  await concatenateAudioFiles(segmentPaths, outputPath);
  await fs.rm(tempDir, { recursive: true });

  console.log('Multilingual speech generated');
}

/**
 * Example 14: Audiobook Generator
 * Generate audiobook from text
 */
export async function generateAudiobook(
  chapters: Array<{ title: string; content: string }>,
  outputDir: string
): Promise<string[]> {
  await fs.mkdir(outputDir, { recursive: true });
  const outputs: string[] = [];

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const outputPath = path.join(
      outputDir,
      `chapter-${i + 1}-${sanitizeFilename(chapter.title)}.mp3`
    );

    // Add chapter title
    const fullText = `Chapter ${i + 1}. ${chapter.title}. ${chapter.content}`;

    await longTextToSpeech(fullText, outputPath, 500);
    outputs.push(outputPath);

    console.log(`Chapter ${i + 1} generated`);
  }

  console.log('Audiobook generated');
  return outputs;
}

/**
 * Example 15: Batch Text-to-Speech
 * Process multiple text files
 */
export async function batchTextToSpeech(
  inputDir: string,
  outputDir: string,
  options: TTSOptions = {}
): Promise<void> {
  const files = await fs.readdir(inputDir);
  const textFiles = files.filter((file) => /\.txt$/i.test(file));

  await fs.mkdir(outputDir, { recursive: true });

  for (const file of textFiles) {
    const inputPath = path.join(inputDir, file);
    const basename = path.basename(file, '.txt');
    const outputPath = path.join(outputDir, `${basename}.mp3`);

    const text = await fs.readFile(inputPath, 'utf-8');
    await textToSpeechEspeak(text, outputPath, options);

    console.log(`Processed: ${file}`);
  }

  console.log(`Batch processing completed: ${textFiles.length} files`);
}

// Helper Functions

function splitTextIntoChunks(text: string, maxLength: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

async function concatenateAudioFiles(
  inputPaths: string[],
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    let cmd = ffmpeg();

    inputPaths.forEach((input) => cmd = cmd.input(input));

    const filterComplex = inputPaths
      .map((_, i) => `[${i}:a]`)
      .join('') + `concat=n=${inputPaths.length}:v=0:a=1[outa]`;

    cmd
      .complexFilter(filterComplex)
      .outputOptions(['-map', '[outa]'])
      .output(outputPath)
      .on('end', () => {
        console.log('Audio files concatenated');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

async function getAudioDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration || 0);
    });
  });
}

async function generateSilence(
  outputPath: string,
  duration: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('anullsrc=r=44100:cl=stereo')
      .inputFormat('lavfi')
      .duration(duration)
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Example 16: List Available Voices (espeak)
 */
export async function listAvailableVoices(): Promise<VoiceInfo[]> {
  try {
    const { stdout } = await execPromise('espeak --voices');
    const lines = stdout.trim().split('\n').slice(1); // Skip header

    const voices: VoiceInfo[] = lines.map((line) => {
      const parts = line.trim().split(/\s+/);
      return {
        name: parts[3] || parts[0],
        language: parts[1] || 'unknown',
        gender: 'neutral',
        locale: parts[4] || parts[1] || 'unknown',
      };
    });

    return voices;
  } catch (error) {
    console.error('Error listing voices:', error);
    return [];
  }
}

/**
 * Example 17: Generate with Emotion
 * Apply effects to simulate emotion
 */
export async function textToSpeechWithEmotion(
  text: string,
  outputPath: string,
  emotion: 'happy' | 'sad' | 'angry' | 'calm'
): Promise<void> {
  const tempPath = outputPath + '.temp.wav';

  // Generate base speech
  await textToSpeechEspeak(text, tempPath);

  // Apply emotion-based effects
  const emotionEffects: { [key: string]: string[] } = {
    happy: ['atempo=1.1', 'asetrate=44100*1.05', 'aresample=44100'],
    sad: ['atempo=0.9', 'asetrate=44100*0.95', 'aresample=44100'],
    angry: ['atempo=1.2', 'volume=1.5', 'bass=g=5'],
    calm: ['atempo=0.95', 'volume=0.8', 'lowpass=f=3000'],
  };

  return new Promise((resolve, reject) => {
    ffmpeg(tempPath)
      .audioFilters(emotionEffects[emotion])
      .output(outputPath)
      .on('end', async () => {
        await fs.unlink(tempPath);
        console.log(`Speech with ${emotion} emotion generated`);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

// Usage Examples
async function main() {
  const outputDir = './output/speech';
  await fs.mkdir(outputDir, { recursive: true });

  // Example 1: Basic TTS
  await textToSpeechEspeak(
    'Hello, this is a text to speech example.',
    `${outputDir}/basic.wav`
  );

  // Example 2: Different speeds and pitches
  await textToSpeechEspeak(
    'This is spoken faster with higher pitch.',
    `${outputDir}/fast-high.wav`,
    { speed: 200, pitch: 70 }
  );

  await textToSpeechEspeak(
    'This is spoken slower with lower pitch.',
    `${outputDir}/slow-low.wav`,
    { speed: 100, pitch: 30 }
  );

  // Example 3: Multi-voice
  await multiVoiceSpeech(
    [
      { text: 'Hello from voice one.', voice: 'en' },
      { text: 'Bonjour from voice two.', voice: 'fr' },
      { text: 'Hola from voice three.', voice: 'es' },
    ],
    `${outputDir}/multi-voice.wav`
  );

  // Example 4: Long text
  const longText = `This is a longer text that will be split into chunks.
    It demonstrates how to handle longer content that might exceed TTS limits.
    The system will automatically split the text and concatenate the audio.`;

  await longTextToSpeech(longText, `${outputDir}/long-text.wav`, 100);

  // Example 5: Podcast intro
  await generatePodcastIntro(
    'Tech Talk',
    42,
    'John Doe',
    `${outputDir}/podcast-intro.wav`
  );

  // Example 6: Multilingual
  await multilingualSpeech(
    [
      { text: 'Hello world', language: 'en' },
      { text: 'Bonjour le monde', language: 'fr' },
      { text: 'Hola mundo', language: 'es' },
    ],
    `${outputDir}/multilingual.wav`
  );

  // Example 7: With emotion
  await textToSpeechWithEmotion(
    'I am so happy today!',
    `${outputDir}/happy.wav`,
    'happy'
  );

  await textToSpeechWithEmotion(
    'This is very sad news.',
    `${outputDir}/sad.wav`,
    'sad'
  );

  // Example 8: List voices
  const voices = await listAvailableVoices();
  console.log('Available voices:', voices.length);

  console.log('All speech synthesis examples completed!');
}

// Uncomment to run
// main().catch(console.error);

export default {
  textToSpeechEspeak,
  textToSpeechGoogle,
  textToSpeechPolly,
  textToSpeechAzure,
  textToSpeechFestival,
  textToSpeechMacOS,
  textToSpeechSSML,
  multiVoiceSpeech,
  longTextToSpeech,
  textToSpeechWithMusic,
  generatePodcastIntro,
  generateNarration,
  multilingualSpeech,
  generateAudiobook,
  batchTextToSpeech,
  listAvailableVoices,
  textToSpeechWithEmotion,
};
