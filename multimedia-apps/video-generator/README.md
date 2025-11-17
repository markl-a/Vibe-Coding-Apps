# Video Generator

A professional video generation application built with Electron, featuring multiple video creation modes, transition effects, and real-time preview capabilities.

## Features

### Video Generation Modes
- **Slideshow Video**: Create videos from image sequences with transitions
- **Text Animation Video**: Generate animated text videos with various effects
- **Template Video**: Use pre-designed templates for quick video creation
- **Visualization Video**: Create data visualization and motion graphics videos

### Key Capabilities
- **Real-time Preview**: See your video in action before exporting
- **Transition Effects**: Multiple professional transitions (fade, slide, zoom, wipe, etc.)
- **Background Music**: Add and sync audio tracks to your videos
- **Custom Duration**: Control frame duration and video length
- **Multiple Export Formats**: Export to MP4, WebM, or GIF
- **Template Library**: Pre-built templates for common use cases
- **Text Animation**: Advanced text effects with customizable fonts and colors
- **Image Manipulation**: Scale, crop, and position images
- **Effect Overlay**: Apply filters and effects to enhance videos

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- FFmpeg (for video encoding)

### Install FFmpeg

#### Windows
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

#### macOS
```bash
brew install ffmpeg
```

#### Linux
```bash
sudo apt-get install ffmpeg
```

### Install Application
```bash
# Clone or navigate to the project directory
cd video-generator

# Install dependencies
npm install

# Start the application
npm start
```

## Usage

### 1. Slideshow Video

1. Select "Slideshow Video" mode
2. Click "Add Images" to import your images
3. Set frame duration (default: 3 seconds)
4. Choose a transition effect
5. Optionally add background music
6. Click "Preview" to see the result
7. Click "Generate Video" to export

### 2. Text Animation Video

1. Select "Text Animation Video" mode
2. Enter your text content
3. Choose animation style (fade-in, slide, typewriter, etc.)
4. Customize font, size, and colors
5. Set animation duration
6. Preview and generate

### 3. Template Video

1. Select "Template Video" mode
2. Choose from available templates:
   - Intro/Outro templates
   - Social media templates
   - Product showcase templates
   - Event announcement templates
3. Customize template parameters
4. Generate your video

### 4. Visualization Video

1. Select "Visualization Video" mode
2. Choose visualization type (bar chart, line graph, particles, etc.)
3. Input your data or use random data
4. Customize colors and animation
5. Generate visualization video

## Transition Effects

- **Fade**: Smooth opacity transition
- **Slide Left/Right/Up/Down**: Directional slide transitions
- **Zoom In/Out**: Scale-based transitions
- **Wipe**: Directional wipe effects
- **Dissolve**: Pixel-based dissolve effect
- **Circle Expand**: Circular expansion transition
- **Blur**: Blur transition effect

## Export Options

### Video Formats
- **MP4**: Best for sharing and compatibility (H.264 codec)
- **WebM**: Web-optimized format (VP9 codec)

### Quality Settings
- Resolution: 720p, 1080p, or custom
- Frame rate: 24fps, 30fps, 60fps
- Bitrate: Adjustable for file size vs quality

### Audio Options
- Add background music (MP3, WAV, OGG)
- Adjust volume levels
- Trim audio to match video length

## Templates

### Included Templates

1. **Simple Intro**
   - Clean text animation with fade-in
   - Customizable background color
   - 5-second duration

2. **Product Showcase**
   - Multiple image slots with zoom effects
   - Text overlays for descriptions
   - Professional transitions

3. **Social Media Post**
   - Square format (1:1 ratio)
   - Bold text animations
   - Trendy effects

4. **Event Announcement**
   - Date and time display
   - Countdown animation
   - Eye-catching transitions

5. **Quote Video**
   - Centered text with decorative elements
   - Fade animations
   - Background image support

## Keyboard Shortcuts

- `Ctrl/Cmd + O`: Open images
- `Ctrl/Cmd + S`: Save project
- `Ctrl/Cmd + E`: Export video
- `Space`: Play/Pause preview
- `Ctrl/Cmd + Left/Right`: Navigate frames
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo

## Technical Details

### Technologies Used
- **Electron**: Desktop application framework
- **Canvas API**: Video rendering and composition
- **FFmpeg**: Video encoding and processing
- **Web Audio API**: Audio processing and synchronization

### Performance
- Hardware acceleration for rendering
- Multi-threaded processing for faster exports
- Progressive preview rendering
- Optimized memory management for large projects

## Project Structure

```
video-generator/
├── src/
│   ├── main.js           # Electron main process
│   ├── index.html        # Main UI
│   ├── renderer.js       # UI logic and controls
│   ├── videoEngine.js    # Video generation engine
│   └── styles.css        # Application styles
├── package.json          # Dependencies and scripts
└── README.md            # Documentation
```

## Troubleshooting

### Video export fails
- Ensure FFmpeg is installed and in your PATH
- Check available disk space
- Verify input file formats are supported

### Preview is laggy
- Reduce preview resolution in settings
- Close other applications to free up resources
- Update graphics drivers

### Audio sync issues
- Ensure audio file is valid
- Check frame rate settings match
- Try re-importing the audio file

## Advanced Features

### Custom Templates
Create your own templates by defining JSON configuration:

```json
{
  "name": "My Custom Template",
  "duration": 10,
  "resolution": { "width": 1920, "height": 1080 },
  "layers": [
    {
      "type": "background",
      "color": "#000000"
    },
    {
      "type": "text",
      "content": "Hello World",
      "animation": "fade-in",
      "position": { "x": 960, "y": 540 }
    }
  ]
}
```

### Scripting Support
Use JavaScript to create complex animations:

```javascript
function customAnimation(ctx, frame, totalFrames) {
  const progress = frame / totalFrames;
  const x = canvas.width * progress;
  const y = canvas.height / 2;

  ctx.fillStyle = '#ff0000';
  ctx.fillRect(x - 50, y - 50, 100, 100);
}
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For questions, issues, or feature requests, please open an issue on the project repository.

## Roadmap

- [ ] Add more transition effects
- [ ] Support for video input (not just images)
- [ ] Advanced text effects and typography
- [ ] Green screen / chroma key support
- [ ] Audio waveform visualization
- [ ] Collaborative editing features
- [ ] Cloud rendering support
- [ ] Mobile companion app

## Credits

Built with love using Electron, Canvas API, and FFmpeg.
