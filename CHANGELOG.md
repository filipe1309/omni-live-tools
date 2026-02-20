# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.0] - 2026-02-19

### Added

- Neon glow effects and shake animation for PollQuestion component

## [1.7.0] - 2026-02-19

### Added

- Glitch animation for countdown "GO" text in CountdownOverlay component

### Changed

- Adjusted margin for winner text and animation styles in SpotlightTrophyCelebration component
- Updated sizeConfig properties for PollOptionCard component
- Enhanced Makefile structure and command clarity

## [1.6.0] - 2026-02-19

### Added

- Version update commands and script for automatic versioning based on commit history

### Fixed

- Adjusted line height for winner text in SpotlightTrophyCelebration component

### Changed

- Streamlined bump-version commands for consistency
- Renamed version update commands for clarity and consistency

## [1.5.0] - 2026-02-16

### Added

- `hideStatusBarToggle` prop to PollSetup for conditional rendering in PollResultsPage
- Size prop to PollResults and set default size in PollPage for improved layout control
- PollControlButtons integration into PollPage for improved control handling
- `showStatusBar` functionality to PollSetup and related components
- Enhanced form layout for TikTok and Twitch connections with responsive design
- Scroll-based visibility toggle for header component
- PollStatusBar component for improved status display in PollResults
- Keyboard shortcuts with SHIFT modifier for starting, stopping, and resetting polls
- Poll timer with timestamp-based calculations for accurate timing during window minimization
- Unit tests for poll components, hooks, and utility functions
- ErrorBoundary component and centralized error handling utilities
- Poll-related types and constants for improved state management and configuration
- `usePollSync` and `usePollTimer` hooks for improved poll state management and synchronization
- DisconnectedModal component and keyboard shortcuts for poll control
- SpotlightTrophyCelebration component integration into PollResultsPage
- Keyboard shortcuts for poll control and enhanced PollResults component
- Updated title and meta tags for application branding
- Countdown overlay styling for improved visibility
- Enhanced polling mechanism with intermediate updates and improved sync interval
- @twurple/auth and @twurple/chat dependencies for Twitch integration

### Fixed

- Corrected key label formatting for keyboard shortcuts in shortcutToLabel function

### Changed

- Enhanced timer bar styling and improved background layout in PollQuestion component
- Updated size configuration in PollOptionCard for improved styling consistency
- Improved connection handling in useMultiPlatformConnection for better cleanup and error management
- Updated poll control button labels and removed variant prop for consistency
- Updated keyboard shortcuts for stopping poll
- Application name from TikTok LIVE Chat Reader to Omni LIVE Tools
- Updated package.json version and description

### Documentation

- Updated README to reflect project name change and enhance testing section

## [1.0.0] - 2026-02-10

### Added

- Countdown feature for polls with visual feedback
- Countdown overlay within results section with adjusted styling
- Spotlight trophy animation on poll completion (replaced confetti celebration)
- SplashScreen component for improved loading experience
- Updated application icons with new designs for better branding
- Logo images and updated Header component to use the new logo
- Internationalization support for English and Portuguese translations
- Fallback avatar support to ProfilePicture, ChatMessage and VoteLog components
- Multi-platform connection support for TikTok and Twitch
- Initial project setup and configuration

### Fixed

- Corrected product name formatting in electron-builder configuration
- Updated source link in HomePage to reflect new project name

### Changed

- Renamed project to Omni LIVE Tools and updated related configurations
- Renamed project to Omni LIVE Chat Reader and updated related configurations

### Documentation

- Updated README to include Electron badge and reorganize table of contents
- Enhanced features section and added real-time chat reading details
- Enhanced README with detailed language support and updated poll feature instructions
- Enhanced README with language support details and updated features section
- Added footer with author credit to README
- Added link to tikTok-chat-reader-jb in Credits section

[1.8.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.0.0...v1.5.0
[1.0.0]: https://github.com/filipe1309/omni-live-tools/releases/tag/v1.0.0
