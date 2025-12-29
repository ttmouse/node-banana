# Node Banana

[English](README.md) | [中文](README.zh-CN.md)

> **Important note:** This is in early development and hasn't been tested off my machines,it probably has some issues. Use Chrome. 

Node Banana is node-based workflow application for generating images with NBP. Build image generation pipelines by connecting nodes on a visual canvas. Built mainly with Opus 4.5.

## Features

- **Visual Node Editor** - Drag-and-drop nodes onto an infinite canvas with pan and zoom
- **Image Annotation** - Full-screen editor with drawing tools (rectangles, circles, arrows, freehand, text)
- **AI Image Generation** - Generate images using Google Gemini models
- **Text Generation** - Generate text using Google Gemini or OpenAI models
- **Workflow Chaining** - Connect multiple nodes to create complex pipelines
- **Save/Load Workflows** - Export and import workflows as JSON files

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Node Editor**: @xyflow/react (React Flow)
- **Canvas**: Konva.js / react-konva
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API, OpenAI API

## Module Boundaries

```
src/
├── app/           → Next.js routing & API endpoints
├── components/    → React UI (nodes, edges, modals)
├── store/         → Zustand state (workflow, annotation)
├── utils/         → Utilities (imageCache, gridSplitter)
├── types/         → TypeScript definitions
└── constants/     → Application constants
```

> **Sync Protocol**: This project uses [Fractal Docs Protocol](./PROTOCOL.md). See `.folder.md` files in each directory for local maps.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Environment Variables

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key  # Optional, for OpenAI LLM provider
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3003](http://localhost:3003) in your browser.

### Build

```bash
npm run build
npm run start
```

## Example Workflows

The `/examples` directory contains some example workflow files from my personal projects. To try them:

1. Start the dev server with `npm run dev`
2. Drag any `.json` file from the `/examples` folder into the browser window
3. Make sure you review each of the prompts before starting, these are fairly targetted to the examples. 

## Usage

1. **Add nodes** - Click the floating action bar to add nodes to the canvas
2. **Connect nodes** - Drag from output handles to input handles (matching types only)
3. **Configure nodes** - Adjust settings like model, aspect ratio, or drawing tools
4. **Run workflow** - Click the Run button to execute the pipeline
5. **Save/Load** - Use the header menu to save or load workflows
6. **Advanced interactions**
   - Right-click drag to pan the canvas; left-click drag draws a marquee selection box.
   - Resize any node directly via its corner handles—no need to pre-select first.
   - Focus a node (click its body) and press `Enter` to immediately “Run from selected node”.

## Connection Rules

- **Image** handles connect to **Image** handles only
- **Text** handles connect to **Text** handles only
- Image inputs on generation nodes accept multiple connections
- Text inputs accept single connections

## License

MIT
