# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Rule
**ALWAYS UPDATE CLAUDE.md**: Whenever you make meaningful changes to the codebase, build process, architecture, dependencies, or fix issues, you MUST update this CLAUDE.md file to reflect those changes. This ensures future Claude sessions have accurate context about the project state.

## Project Overview

This is the JavaScript SDK for RunPod, a serverless computing platform. The SDK provides a client interface for interacting with RunPod endpoints, allowing users to run inference tasks, check status, stream results, and manage requests.

## Build and Development Commands

- **Build**: `npm run build` - Compiles TypeScript to JavaScript in `dist/` directory
- **Testing**: No test scripts are defined in package.json. Check examples in `examples/` directory for testing patterns
- **Development**: Use `tsc` directly for TypeScript compilation during development

## Architecture

### Core Structure

- **Single File SDK**: The entire SDK is contained in `src/index.ts` - a monolithic approach with all functionality in one file
- **Functional + Class-based**: Mix of curried functional programming (using Ramda) and traditional class-based architecture
- **HTTP Client**: Uses `xior` (axios-like library) for HTTP requests

### Key Components

1. **RunpodSdk Class**: Main entry point that accepts API key and creates endpoint instances
2. **Endpoint Class**: Wraps all endpoint-specific operations (run, status, stream, cancel, health, purge)
3. **Functional Wrappers**: Each API operation has both a curried functional version and class method

### API Operations

- `run()` - Async execution (returns immediately with request ID)
- `runSync()` - Synchronous execution (waits for completion with polling)
- `status()` - Check single request status
- `statusSync()` - Long-polling status check with configurable wait time
- `stream()` - Async generator for streaming results
- `cancel()` - Cancel pending requests
- `health()` - Check endpoint worker health
- `purgeQueue()` - Clear pending requests

### Environment Configuration

- **Production**: `https://api.runpod.ai/v2` (default)
- **Development**: `https://dev-api.runpod.ai/v2`
- Configurable via `SdkOptions.baseUrl`

### TypeScript Configuration

- Target: ES2020 with DOM lib support for Node.js compatibility
- Strict mode enabled
- Outputs to `dist/` with declarations and source maps
- Uses ES modules (`"type": "module"` in package.json)
- Includes Node.js types for `createRequire` usage

## Key Dependencies

- `xior`: HTTP client (axios alternative)
- `ramda`: Functional programming utilities (curry, clamp, isNil)
- `@types/ramda`: TypeScript definitions
- `@types/node`: Node.js TypeScript definitions (dev dependency)

## Development Notes

- JSON imports use `createRequire` pattern to avoid Node.js 17.5+ ESM import assertion errors
- All timeout parameters use milliseconds
- Status polling uses exponential backoff with configurable wait times
- Error handling returns status objects rather than throwing exceptions
- User agent automatically includes SDK version and environment info
- Version 1.1.2 fixes Node.js 17.5+ compatibility issues with JSON imports